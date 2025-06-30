import { NextApiRequest, NextApiResponse } from 'next';

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    database: 'up' | 'down';
    analytics: 'up' | 'down';
    webhooks: 'up' | 'down';
    cache: 'up' | 'down';
  };
  performance: {
    responseTimeMs: number;
    uptime: number;
    memoryUsage: {
      used: number;
      free: number;
      percentage: number;
    };
  };
  dependencies: {
    name: string;
    status: 'up' | 'down';
    responseTime?: number;
  }[];
}

const startTime = Date.now();

export default async function handler(req: NextApiRequest, res: NextApiResponse<HealthCheckResponse>) {
  const requestStartTime = Date.now();

  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        services: {
          database: 'down',
          analytics: 'down',
          webhooks: 'down',
          cache: 'down'
        },
        performance: {
          responseTimeMs: 0,
          uptime: 0,
          memoryUsage: { used: 0, free: 0, percentage: 0 }
        },
        dependencies: []
      } as HealthCheckResponse);
    }

    // Check service health
    const serviceChecks = await Promise.allSettled([
      checkDatabaseHealth(),
      checkAnalyticsHealth(),
      checkWebhooksHealth(),
      checkCacheHealth()
    ]);

    const services = {
      database: serviceChecks[0].status === 'fulfilled' && serviceChecks[0].value ? 'up' : 'down',
      analytics: serviceChecks[1].status === 'fulfilled' && serviceChecks[1].value ? 'up' : 'down',
      webhooks: serviceChecks[2].status === 'fulfilled' && serviceChecks[2].value ? 'up' : 'down',
      cache: serviceChecks[3].status === 'fulfilled' && serviceChecks[3].value ? 'up' : 'down'
    } as const;

    // Check external dependencies
    const dependencies = await checkExternalDependencies();

    // Get memory usage
    const memoryUsage = getMemoryUsage();

    // Calculate overall status
    const unhealthyServices = Object.values(services).filter(status => status === 'down').length;
    const unhealthyDependencies = dependencies.filter(dep => dep.status === 'down').length;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyServices === 0 && unhealthyDependencies === 0) {
      overallStatus = 'healthy';
    } else if (unhealthyServices <= 1 && unhealthyDependencies <= 1) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'unhealthy';
    }

    const responseTimeMs = Date.now() - requestStartTime;
    const uptime = Math.floor((Date.now() - startTime) / 1000);

    const healthResponse: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services,
      performance: {
        responseTimeMs,
        uptime,
        memoryUsage
      },
      dependencies
    };

    // Set appropriate HTTP status based on health
    const statusCode = overallStatus === 'healthy' ? 200 :
                      overallStatus === 'degraded' ? 200 : 503;

    // Add headers for monitoring
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('X-Health-Status', overallStatus);
    res.setHeader('X-Response-Time', responseTimeMs.toString());

    return res.status(statusCode).json(healthResponse);
  } catch (error) {
    console.error('Health check error:', error);

    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: 'down',
        analytics: 'down',
        webhooks: 'down',
        cache: 'down'
      },
      performance: {
        responseTimeMs: Date.now() - requestStartTime,
        uptime: Math.floor((Date.now() - startTime) / 1000),
        memoryUsage: { used: 0, free: 0, percentage: 0 }
      },
      dependencies: []
    });
  }
}

async function checkDatabaseHealth(): Promise<boolean> {
  try {
    // In a real implementation, this would check database connectivity
    // For now, we'll simulate a database check
    await new Promise(resolve => setTimeout(resolve, 10));
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

async function checkAnalyticsHealth(): Promise<boolean> {
  try {
    // Check if analytics service is responsive
    // This could involve testing the IndustrySpecificAnalytics service
    const { IndustrySpecificAnalytics } = await import('../../lib/services/industry-specific-analytics');
    const analytics = new IndustrySpecificAnalytics();
    // Basic instantiation test
    return true;
  } catch (error) {
    console.error('Analytics health check failed:', error);
    return false;
  }
}

async function checkWebhooksHealth(): Promise<boolean> {
  try {
    // Check webhook service health
    // In production, this might test webhook delivery capability
    return true;
  } catch (error) {
    console.error('Webhooks health check failed:', error);
    return false;
  }
}

async function checkCacheHealth(): Promise<boolean> {
  try {
    // Check cache service (Redis, etc.)
    // For now, simulate cache check
    return true;
  } catch (error) {
    console.error('Cache health check failed:', error);
    return false;
  }
}

async function checkExternalDependencies(): Promise<Array<{name: string; status: 'up' | 'down'; responseTime?: number}>> {
  const dependencies = [
    { name: 'external-api', url: 'https://httpbin.org/status/200' },
    { name: 'ai-service', url: null } // Placeholder for AI service
  ];

  const results = await Promise.allSettled(
    dependencies.map(async (dep) => {
      if (!dep.url) {
        return { name: dep.name, status: 'up' as const };
      }

      const startTime = Date.now();
      try {
        const response = await fetch(dep.url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000)
        });
        const responseTime = Date.now() - startTime;
        return {
          name: dep.name,
          status: response.ok ? 'up' as const : 'down' as const,
          responseTime
        };
      } catch (error) {
        return {
          name: dep.name,
          status: 'down' as const,
          responseTime: Date.now() - startTime
        };
      }
    })
  );

  return results.map((result, index) =>
    result.status === 'fulfilled'
      ? result.value
      : { name: dependencies[index].name, status: 'down' as const }
  );
}

function getMemoryUsage() {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    const totalHeap = usage.heapTotal;
    const usedHeap = usage.heapUsed;
    const freeHeap = totalHeap - usedHeap;

    return {
      used: Math.round(usedHeap / 1024 / 1024), // MB
      free: Math.round(freeHeap / 1024 / 1024), // MB
      percentage: Math.round((usedHeap / totalHeap) * 100)
    };
  }

  return { used: 0, free: 0, percentage: 0 };
}
