import { redisManager } from './redis-client';
import { Redis } from 'ioredis';

interface CacheOptions {
  ttl?: number;
  tags?: string[];
  compress?: boolean;
  serialize?: boolean;
}

/**
 * Universal Cache Service - API-First Multi-Layer Caching
 * Implements hot/warm/cold caching strategies for B2B visitor intelligence
 * and revenue prediction systems across any platform integration
 */
class CacheService {
  private client: Redis;
  private readonly DEFAULT_TTL = 3600; // 1 hour
  private readonly COMPRESSION_THRESHOLD = 1024; // 1KB

  constructor() {
    this.client = redisManager.getClient();
  }

  /**
   * L1 Cache: Hot data with short TTL (visitor sessions, real-time metrics)
   * Used for immediate access data that changes frequently
   */
  async setHotCache<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.client.setex(`hot:${key}`, ttl, serialized);
    } catch (error) {
      console.error('❌ Error setting hot cache:', error);
      throw error;
    }
  }

  async getHotCache<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(`hot:${key}`);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('❌ Error getting hot cache:', error);
      return null;
    }
  }

  /**
   * L2 Cache: Warm data with medium TTL (company data, CRM records)
   * Used for frequently accessed but relatively stable data
   */
  async setWarmCache<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      // Note: Compression would be implemented here if needed
      const dataToStore = serialized.length > this.COMPRESSION_THRESHOLD 
        ? serialized  // Would compress in production
        : serialized;
      
      await this.client.setex(`warm:${key}`, ttl, dataToStore);
    } catch (error) {
      console.error('❌ Error setting warm cache:', error);
      throw error;
    }
  }

  async getWarmCache<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(`warm:${key}`);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('❌ Error getting warm cache:', error);
      return null;
    }
  }

  /**
   * L3 Cache: Cold data with long TTL (revenue predictions, historical data)
   * Used for data that rarely changes but is expensive to compute
   */
  async setColdCache<T>(key: string, value: T, ttl: number = 86400): Promise<void> {
    try {
      const pipeline = this.client.pipeline();
      const serialized = JSON.stringify(value);
      
      pipeline.setex(`cold:${key}`, ttl, serialized);
      pipeline.zadd('cache:expiry', Date.now() + (ttl * 1000), `cold:${key}`);
      
      await pipeline.exec();
    } catch (error) {
      console.error('❌ Error setting cold cache:', error);
      throw error;
    }
  }

  async getColdCache<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(`cold:${key}`);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('❌ Error getting cold cache:', error);
      return null;
    }
  }

  /**
   * Cache-aside pattern with automatic refresh
   * Universal pattern for any data that can be cached
   */
  async getOrSet<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    options: CacheOptions = {}
  ): Promise<T> {
    const { ttl = this.DEFAULT_TTL, tags = [] } = options;
    
    try {
      // Try to get from cache
      let cached = await this.client.get(key);
      if (cached) {
        return JSON.parse(cached);
      }

      // Fetch from source
      const data = await fetcher();
      
      // Store in cache with tags for invalidation
      const pipeline = this.client.pipeline();
      pipeline.setex(key, ttl, JSON.stringify(data));
      
      // Add to tag sets for bulk invalidation
      tags.forEach(tag => {
        pipeline.sadd(`tag:${tag}`, key);
        pipeline.expire(`tag:${tag}`, ttl); // Expire tag set after TTL
      });
      
      await pipeline.exec();
      return data;
    } catch (error) {
      console.error('❌ Error in getOrSet cache operation:', error);
      // Fallback to fetcher if cache fails
      return await fetcher();
    }
  }

  /**
   * Bulk invalidation by tags (useful for CRM data updates)
   * Invalidates all cached items associated with specific tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    try {
      const pipeline = this.client.pipeline();
      
      for (const tag of tags) {
        const keys = await this.client.smembers(`tag:${tag}`);
        if (keys.length > 0) {
          pipeline.del(...keys);
          pipeline.del(`tag:${tag}`);
        }
      }
      
      await pipeline.exec();
      console.log(`🗑️ Invalidated cache for tags: ${tags.join(', ')}`);
    } catch (error) {
      console.error('❌ Error invalidating cache by tags:', error);
      throw error;
    }
  }

  /**
   * Remove specific cache entries
   */
  async invalidate(keys: string[]): Promise<void> {
    try {
      if (keys.length > 0) {
        await this.client.del(...keys);
        console.log(`🗑️ Invalidated cache keys: ${keys.join(', ')}`);
      }
    } catch (error) {
      console.error('❌ Error invalidating cache keys:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  async getCacheStats(): Promise<{
    hotCacheKeys: number;
    warmCacheKeys: number;
    coldCacheKeys: number;
    totalKeys: number;
    memoryUsage: number;
  }> {
    try {
      const [hotKeys, warmKeys, coldKeys, info] = await Promise.all([
        this.client.keys('hot:*'),
        this.client.keys('warm:*'),
        this.client.keys('cold:*'),
        this.client.info('memory')
      ]);

      // Parse memory usage from Redis info
      const memoryMatch = info.match(/used_memory:(\d+)/);
      const memoryUsage = memoryMatch ? parseInt(memoryMatch[1]) : 0;

      return {
        hotCacheKeys: hotKeys.length,
        warmCacheKeys: warmKeys.length,
        coldCacheKeys: coldKeys.length,
        totalKeys: hotKeys.length + warmKeys.length + coldKeys.length,
        memoryUsage
      };
    } catch (error) {
      console.error('❌ Error getting cache stats:', error);
      return {
        hotCacheKeys: 0,
        warmCacheKeys: 0,
        coldCacheKeys: 0,
        totalKeys: 0,
        memoryUsage: 0
      };
    }
  }

  /**
   * Cleanup expired cache entries
   */
  async cleanupExpiredCache(): Promise<void> {
    try {
      const now = Date.now();
      const expiredKeys = await this.client.zrangebyscore('cache:expiry', 0, now);
      
      if (expiredKeys.length > 0) {
        const pipeline = this.client.pipeline();
        
        expiredKeys.forEach(key => {
          pipeline.del(key);
        });
        
        pipeline.zremrangebyscore('cache:expiry', 0, now);
        await pipeline.exec();
        
        console.log(`🗑️ Cleaned up ${expiredKeys.length} expired cache entries`);
      }
    } catch (error) {
      console.error('❌ Error cleaning up expired cache:', error);
    }
  }
}

export const cacheService = new CacheService(); 