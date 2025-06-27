import Redis from 'ioredis';

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  maxRetriesPerRequest: number;
  retryDelayOnFailover: number;
  lazyConnect: boolean;
  keepAlive: number;
  family: 4 | 6;
  connectTimeout: number;
  commandTimeout: number;
}

/**
 * Redis Manager - Universal API-First Redis Client
 * Implements singleton pattern with proper connection management
 * for B2B visitor tracking and revenue intelligence systems
 */
class RedisManager {
  private static instance: RedisManager;
  private client: Redis;
  private subscriber: Redis;
  private publisher: Redis;
  private isConnected: boolean = false;

  private constructor() {
    const config: RedisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true,
      keepAlive: 30000,
      family: 4,
      connectTimeout: 10000,
      commandTimeout: 5000,
    };

    // Create separate connections for different purposes
    this.client = new Redis(config);
    this.subscriber = new Redis(config);
    this.publisher = new Redis(config);

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Main client event handlers
    this.client.on('error', (err) => {
      console.error('❌ Redis Client Error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      console.log('🔗 Redis Client Connected');
    });

    this.client.on('ready', () => {
      console.log('✅ Redis Client Ready');
      this.isConnected = true;
    });

    this.client.on('close', () => {
      console.log('📴 Redis Client Connection Closed');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      console.log('🔄 Redis Client Reconnecting...');
    });

    // Publisher event handlers
    this.publisher.on('error', (err) => {
      console.error('❌ Redis Publisher Error:', err);
    });

    this.publisher.on('ready', () => {
      console.log('✅ Redis Publisher Ready');
    });

    // Subscriber event handlers
    this.subscriber.on('error', (err) => {
      console.error('❌ Redis Subscriber Error:', err);
    });

    this.subscriber.on('ready', () => {
      console.log('✅ Redis Subscriber Ready');
    });
  }

  public static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  public getClient(): Redis {
    return this.client;
  }

  public getSubscriber(): Redis {
    return this.subscriber;
  }

  public getPublisher(): Redis {
    return this.publisher;
  }

  public isHealthy(): boolean {
    return this.isConnected;
  }

  /**
   * Test Redis connection health
   */
  public async healthCheck(): Promise<{ status: string; latency?: number; error?: string }> {
    try {
      const start = Date.now();
      await this.client.ping();
      const latency = Date.now() - start;

      return {
        status: 'healthy',
        latency
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Graceful shutdown of all Redis connections
   */
  public async disconnect(): Promise<void> {
    try {
      await Promise.all([
        this.client.disconnect(),
        this.subscriber.disconnect(),
        this.publisher.disconnect()
      ]);
      console.log('📴 All Redis connections closed');
    } catch (error) {
      console.error('❌ Error closing Redis connections:', error);
    }
  }
}

export const redisManager = RedisManager.getInstance();
export { RedisManager };
