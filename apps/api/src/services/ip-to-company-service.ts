import fetch from 'node-fetch';
import { cacheService } from './cache-service';
import { db } from './database';
import { eventManager } from './event-manager';

// =============================================================================
// IP-TO-COMPANY MAPPING SERVICE - UNIVERSAL ARCHITECTURE
// Multi-provider service with 90%+ accuracy targeting
// =============================================================================

export interface IpCompanyData {
  ip: string;
  company: {
    name: string;
    domain: string;
    type: 'hosting' | 'isp' | 'education' | 'government' | 'banking' | 'business';
    industry?: string;
    size?: string;
    employeeCount?: number;
    description?: string;
    location?: string;
    confidence: number; // 0-1 scale
  };
  location: {
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
  };
  network: {
    asn?: string;
    asnName?: string;
    isp?: string;
    range?: string;
  };
  provider: string;
  cached: boolean;
}

export interface IpApiResponse {
  company?: {
    name: string;
    domain: string;
    type: string;
  };
  location?: {
    country: string;
    region: string;
    city: string;
    timezone: string;
  };
  connection?: {
    asn: string;
    org: string;
    isp: string;
  };
}

export interface IpInfoResponse {
  org?: string;
  company?: {
    name: string;
    domain: string;
    type: string;
  };
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
}

export interface SnitcherResponse {
  company?: {
    name: string;
    domain: string;
    industry?: string;
    employee_count?: number;
  };
  location?: {
    country: string;
    region: string;
    city: string;
  };
}

export class IpToCompanyService {
  private static instance: IpToCompanyService;
  private readonly providers = {
    ipapi: {
      baseUrl: 'https://api.ipapi.is',
      rateLimit: 1000, // requests per month for free tier
      rateLimitWindow: 30 * 24 * 60 * 60 * 1000, // 30 days
      currentRequests: 0,
      windowStart: Date.now()
    },
    ipinfo: {
      baseUrl: 'https://ipinfo.io',
      rateLimit: 50000, // requests per month for free tier
      rateLimitWindow: 30 * 24 * 60 * 60 * 1000, // 30 days
      currentRequests: 0,
      windowStart: Date.now()
    },
    snitcher: {
      baseUrl: 'https://api.snitcher.com',
      rateLimit: 1000, // example limit
      rateLimitWindow: 30 * 24 * 60 * 60 * 1000,
      currentRequests: 0,
      windowStart: Date.now()
    }
  };

  private constructor() {}

  public static getInstance(): IpToCompanyService {
    if (!IpToCompanyService.instance) {
      IpToCompanyService.instance = new IpToCompanyService();
    }
    return IpToCompanyService.instance;
  }

  /**
   * Main method to identify company from IP address
   * Uses caching and fallback strategies for 90%+ accuracy
   */
  public async identifyCompany(ipAddress: string): Promise<IpCompanyData | null> {
    try {
      // Validate IP address
      if (!this.isValidIp(ipAddress)) {
        throw new Error(`Invalid IP address: ${ipAddress}`);
      }

      // Check cache first
      const cached = await this.getCachedResult(ipAddress);
      if (cached) {
        await this.updateCacheHit(ipAddress);
        return cached;
      }

      // Try providers in order of accuracy
      const providers = ['ipapi', 'ipinfo', 'snitcher'] as const;

      for (const provider of providers) {
        try {
          if (!this.canMakeRequest(provider)) {
            console.warn(`Rate limit exceeded for ${provider}, trying next provider`);
            continue;
          }

          const result = await this.queryProvider(provider, ipAddress);
          if (result && result.company.confidence > 0.5) {
            // Cache successful result
            await this.cacheResult(ipAddress, result);

            // Store in database if company confidence is high
            if (result.company.confidence > 0.8) {
              await this.storeCompanyData(result);
            }

            // Track success using correct event manager method
            await eventManager.emitSystemEvent('data_updated', {
              component: 'ip-to-company'
            });

            return result;
          }
        } catch (error) {
          console.warn(`Provider ${provider} failed for IP ${ipAddress}:`, error);
          await eventManager.emitSystemEvent('integration_error', {
            component: 'ip-to-company',
            errorCode: 'provider_failure'
          });
        }
      }

      // No provider succeeded
      await eventManager.emitSystemEvent('integration_error', {
        component: 'ip-to-company',
        errorCode: 'all_providers_failed'
      });
      return null;

    } catch (error) {
      console.error('Error in identifyCompany:', error);
      throw error;
    }
  }

  /**
   * Query specific provider for IP information
   */
  private async queryProvider(provider: keyof typeof this.providers, ip: string): Promise<IpCompanyData | null> {
    this.incrementRequestCount(provider);

    switch (provider) {
      case 'ipapi':
        return this.queryIpApi(ip);
      case 'ipinfo':
        return this.queryIpInfo(ip);
      case 'snitcher':
        return this.querySnitcher(ip);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Query ipapi.is (97% accuracy)
   */
  private async queryIpApi(ip: string): Promise<IpCompanyData | null> {
    const apiKey = process.env.IPAPI_API_KEY;
    const url = apiKey
      ? `${this.providers.ipapi.baseUrl}/?ip=${ip}&api-key=${apiKey}`
      : `${this.providers.ipapi.baseUrl}/?ip=${ip}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Optimizely-B2B-Tracker/1.0',
        'Accept': 'application/json'
      },
      timeout: 5000
    });

    if (!response.ok) {
      throw new Error(`ipapi.is API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as IpApiResponse;

    if (!data.company?.name) {
      return null;
    }

    return {
      ip,
      company: {
        name: data.company.name,
        domain: data.company.domain,
        type: this.normalizeCompanyType(data.company.type),
        confidence: 0.97 // ipapi.is documented accuracy
      },
      location: {
        country: data.location?.country,
        region: data.location?.region,
        city: data.location?.city,
        timezone: data.location?.timezone
      },
      network: {
        asn: data.connection?.asn,
        asnName: data.connection?.org,
        isp: data.connection?.isp
      },
      provider: 'ipapi',
      cached: false
    };
  }

  /**
   * Query ipinfo.io (95.33% accuracy)
   */
  private async queryIpInfo(ip: string): Promise<IpCompanyData | null> {
    const apiKey = process.env.IPINFO_API_KEY;
    const url = apiKey
      ? `${this.providers.ipinfo.baseUrl}/${ip}?token=${apiKey}`
      : `${this.providers.ipinfo.baseUrl}/${ip}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Optimizely-B2B-Tracker/1.0',
        'Accept': 'application/json'
      },
      timeout: 5000
    });

    if (!response.ok) {
      throw new Error(`ipinfo.io API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as IpInfoResponse;

    // Extract company from org field if company object not available
    let companyName = data.company?.name;
    let companyDomain = data.company?.domain;

    if (!companyName && data.org) {
      // Parse company name from org field (format: "AS12345 Company Name")
      const orgMatch = data.org.match(/^AS\d+\s+(.+)$/);
      companyName = orgMatch ? orgMatch[1] : data.org;
    }

    if (!companyName) {
      return null;
    }

    return {
      ip,
      company: {
        name: companyName,
        domain: companyDomain || '',
        type: this.normalizeCompanyType(data.company?.type || 'business'),
        confidence: 0.95 // ipinfo.io documented accuracy
      },
      location: {
        country: data.country,
        region: data.region,
        city: data.city,
        timezone: data.timezone
      },
      network: {
        asn: data.org?.match(/^AS(\d+)/)?.[1],
        asnName: data.org,
        isp: data.org
      },
      provider: 'ipinfo',
      cached: false
    };
  }

  /**
   * Query Snitcher (real-time B2B identification)
   */
  private async querySnitcher(ip: string): Promise<IpCompanyData | null> {
    const apiKey = process.env.SNITCHER_API_KEY;
    if (!apiKey) {
      throw new Error('Snitcher API key not configured');
    }

    const response = await fetch(`${this.providers.snitcher.baseUrl}/v1/identify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Optimizely-B2B-Tracker/1.0'
      },
      body: JSON.stringify({ ip }),
      timeout: 5000
    });

    if (!response.ok) {
      throw new Error(`Snitcher API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as SnitcherResponse;

    if (!data.company?.name) {
      return null;
    }

    return {
      ip,
      company: {
        name: data.company.name,
        domain: data.company.domain,
        type: 'business', // Snitcher focuses on B2B
        employeeCount: data.company.employee_count,
        confidence: 0.92 // Estimated based on B2B focus
      },
      location: {
        country: data.location?.country,
        region: data.location?.region,
        city: data.location?.city
      },
      network: {},
      provider: 'snitcher',
      cached: false
    };
  }

  /**
   * Check if result is cached and still valid
   */
  private async getCachedResult(ip: string): Promise<IpCompanyData | null> {
    try {
      // Try warm cache first (medium TTL for IP data)
      const cached = await cacheService.getWarmCache<IpCompanyData>(`ip-company:${ip}`);
      if (cached) {
        cached.cached = true;
        return cached;
      }

      // Check database cache
      if (db.prisma) {
        const dbCached = await db.prisma.ipCache.findFirst({
          where: {
            ipAddress: ip,
            isValid: true,
            expiresAt: {
              gt: new Date()
            }
          }
        });

        if (dbCached) {
          const result = JSON.parse(dbCached.responseData) as IpCompanyData;
          result.cached = true;

          // Update warm cache for faster subsequent lookups
          await cacheService.setWarmCache(`ip-company:${ip}`, result, 15 * 60); // 15 minutes

          return result;
        }
      }

      return null;
    } catch (error) {
      console.warn('Cache lookup failed:', error);
      return null;
    }
  }

  /**
   * Cache successful result
   */
  private async cacheResult(ip: string, result: IpCompanyData): Promise<void> {
    try {
      const ttl = 15 * 60; // 15 minutes for warm cache
      const dbTtl = 24 * 60 * 60 * 1000; // 24 hours for database

      // Cache in Redis warm cache
      await cacheService.setWarmCache(`ip-company:${ip}`, result, ttl);

      // Cache in database for persistence
      if (db.prisma) {
        const expiresAt = new Date(Date.now() + dbTtl);

        await db.prisma.ipCache.upsert({
          where: { ipAddress: ip },
          update: {
            responseData: JSON.stringify(result),
            provider: result.provider,
            confidence: result.company.confidence,
            lastHit: new Date(),
            hitCount: { increment: 1 },
            expiresAt,
            isValid: true
          },
          create: {
            ipAddress: ip,
            responseData: JSON.stringify(result),
            provider: result.provider,
            confidence: result.company.confidence,
            expiresAt
          }
        });
      }
    } catch (error) {
      console.warn('Failed to cache result:', error);
    }
  }

  /**
   * Update cache hit statistics
   */
  private async updateCacheHit(ip: string): Promise<void> {
    try {
      if (db.prisma) {
        await db.prisma.ipCache.updateMany({
          where: { ipAddress: ip },
          data: {
            lastHit: new Date(),
            hitCount: { increment: 1 }
          }
        });
      }
    } catch (error) {
      console.warn('Failed to update cache hit:', error);
    }
  }

  /**
   * Store company data in database for future reference
   */
  private async storeCompanyData(result: IpCompanyData): Promise<void> {
    try {
      if (!db.prisma) return;

      // Store or update company
      const company = await db.prisma.company.upsert({
        where: { domain: result.company.domain },
        update: {
          name: result.company.name,
          companyType: result.company.type,
          industry: result.company.industry,
          employeeCount: result.company.employeeCount,
          description: result.company.description,
          location: `${result.location.city}, ${result.location.region}, ${result.location.country}`,
          dataSource: result.provider,
          dataQuality: result.company.confidence,
          lastEnriched: new Date()
        },
        create: {
          domain: result.company.domain,
          name: result.company.name,
          companyType: result.company.type,
          industry: result.company.industry,
          employeeCount: result.company.employeeCount,
          description: result.company.description,
          location: `${result.location.city}, ${result.location.region}, ${result.location.country}`,
          dataSource: result.provider,
          dataQuality: result.company.confidence,
          lastEnriched: new Date()
        }
      });

      // Store IP range mapping if network info available
      if (result.network.range) {
        try {
          await db.prisma.ipRange.create({
            data: {
              companyId: company.id,
              startIp: result.ip,
              endIp: result.ip,
              provider: result.provider,
              confidence: result.company.confidence,
              asn: result.network.asn,
              asnName: result.network.asnName,
              isp: result.network.isp,
              network: result.network.range
            }
          });
        } catch (error) {
          // Ignore duplicate errors, just log
          console.log('IP range already exists, skipping:', result.ip);
        }
      }
    } catch (error) {
      console.warn('Failed to store company data:', error);
    }
  }

  /**
   * Check if provider can make request (rate limiting)
   */
  private canMakeRequest(provider: keyof typeof this.providers): boolean {
    const providerConfig = this.providers[provider];
    const now = Date.now();

    // Reset window if expired
    if (now - providerConfig.windowStart > providerConfig.rateLimitWindow) {
      providerConfig.currentRequests = 0;
      providerConfig.windowStart = now;
    }

    return providerConfig.currentRequests < providerConfig.rateLimit;
  }

  /**
   * Increment request count for rate limiting
   */
  private incrementRequestCount(provider: keyof typeof this.providers): void {
    this.providers[provider].currentRequests++;
  }

  /**
   * Validate IP address format
   */
  private isValidIp(ip: string): boolean {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

    if (ipv4Regex.test(ip)) {
      const parts = ip.split('.');
      return parts.every(part => parseInt(part) <= 255);
    }

    return ipv6Regex.test(ip);
  }

  /**
   * Normalize company type across providers
   */
  private normalizeCompanyType(type: string): 'hosting' | 'isp' | 'education' | 'government' | 'banking' | 'business' {
    const normalizedType = type.toLowerCase();

    if (['hosting', 'cloud', 'datacenter'].includes(normalizedType)) return 'hosting';
    if (['isp', 'telecom', 'telecommunications'].includes(normalizedType)) return 'isp';
    if (['education', 'edu', 'university', 'college'].includes(normalizedType)) return 'education';
    if (['government', 'gov', 'military'].includes(normalizedType)) return 'government';
    if (['banking', 'finance', 'financial'].includes(normalizedType)) return 'banking';

    return 'business';
  }

  /**
   * Health check for the service
   */
  public async healthCheck(): Promise<{ status: string; providers: Record<string, any> }> {
    const providerStatus: Record<string, any> = {};

    for (const [name, config] of Object.entries(this.providers)) {
      providerStatus[name] = {
        available: this.canMakeRequest(name as keyof typeof this.providers),
        requests: config.currentRequests,
        limit: config.rateLimit,
        windowStart: new Date(config.windowStart).toISOString()
      };
    }

    return {
      status: 'healthy',
      providers: providerStatus
    };
  }
}

// Export singleton instance
export const ipToCompanyService = IpToCompanyService.getInstance();
