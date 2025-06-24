import { redisManager } from './redis-client';
import { Redis } from 'ioredis';

interface BaseEvent {
  id: string;
  type: string;
  timestamp: number;
  source: string;
  platform?: string;
  data: Record<string, any>;
}

interface B2BVisitorEvent extends BaseEvent {
  type: 'visitor_identified' | 'high_value_session' | 'conversion_intent';
  data: {
    sessionId: string;
    companyId?: string;
    companyName?: string;
    engagementScore?: number;
    leadScore?: number;
    conversionProbability?: number;
  };
}

interface RevenueEvent extends BaseEvent {
  type: 'revenue_prediction' | 'deal_scored' | 'pipeline_update';
  data: {
    companyId: string;
    predictedRevenue?: number;
    dealValue?: number;
    probability?: number;
    stage?: string;
  };
}

interface SystemEvent extends BaseEvent {
  type: 'cache_invalidated' | 'data_updated' | 'integration_error';
  data: {
    component?: string;
    errorCode?: string;
    affectedKeys?: string[];
  };
}

type AppEvent = B2BVisitorEvent | RevenueEvent | SystemEvent;

type EventHandler = (event: AppEvent) => void | Promise<void>;

/**
 * Universal Event Manager - Redis Pub/Sub for Real-time Intelligence
 * Provides event-driven architecture for B2B visitor tracking,
 * revenue predictions, and platform integrations
 */
class UniversalEventManager {
  private publisher: Redis;
  private subscriber: Redis;
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private isListening: boolean = false;

  constructor() {
    this.publisher = redisManager.getPublisher();
    this.subscriber = redisManager.getSubscriber();
    this.setupSubscriber();
  }

  /**
   * Publish an event to all subscribers
   */
  async publish(event: AppEvent): Promise<void> {
    try {
      const channel = `events:${event.type}`;
      const subscribers = await this.publisher.publish(channel, JSON.stringify(event));
      
      // Also publish to wildcard channel for global listeners
      await this.publisher.publish('events:*', JSON.stringify(event));
      
      console.log(`📢 Published ${event.type} event to ${subscribers} subscribers`);
      
      // Store recent events for replay capability
      await this.storeRecentEvent(event);
    } catch (error) {
      console.error('❌ Error publishing event:', error);
      throw error;
    }
  }

  /**
   * Subscribe to specific event types
   */
  async subscribe(eventType: string, handler: EventHandler): Promise<void> {
    try {
      const channel = `events:${eventType}`;
      
      // Add handler to local registry
      if (!this.handlers.has(channel)) {
        this.handlers.set(channel, new Set());
      }
      this.handlers.get(channel)!.add(handler);
      
      // Subscribe to Redis channel
      await this.subscriber.subscribe(channel);
      
      console.log(`👂 Subscribed to ${eventType} events`);
    } catch (error) {
      console.error('❌ Error subscribing to events:', error);
      throw error;
    }
  }

  /**
   * Subscribe to all events with wildcard
   */
  async subscribeToAll(handler: EventHandler): Promise<void> {
    try {
      const channel = 'events:*';
      
      if (!this.handlers.has(channel)) {
        this.handlers.set(channel, new Set());
      }
      this.handlers.get(channel)!.add(handler);
      
      await this.subscriber.subscribe(channel);
      console.log('👂 Subscribed to all events');
    } catch (error) {
      console.error('❌ Error subscribing to all events:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from specific event types
   */
  async unsubscribe(eventType: string, handler?: EventHandler): Promise<void> {
    try {
      const channel = `events:${eventType}`;
      
      if (handler && this.handlers.has(channel)) {
        this.handlers.get(channel)!.delete(handler);
        
        // If no more handlers, unsubscribe from Redis
        if (this.handlers.get(channel)!.size === 0) {
          await this.subscriber.unsubscribe(channel);
          this.handlers.delete(channel);
        }
      } else {
        // Remove all handlers for this event type
        this.handlers.delete(channel);
        await this.subscriber.unsubscribe(channel);
      }
      
      console.log(`🔇 Unsubscribed from ${eventType} events`);
    } catch (error) {
      console.error('❌ Error unsubscribing from events:', error);
    }
  }

  /**
   * Emit B2B visitor events
   */
  async emitVisitorEvent(
    type: B2BVisitorEvent['type'],
    sessionId: string,
    data: Partial<B2BVisitorEvent['data']>,
    platform?: string
  ): Promise<void> {
    const event: B2BVisitorEvent = {
      id: `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: Date.now(),
      source: 'visitor_tracking',
      platform: platform || 'web',
      data: {
        sessionId,
        ...data
      }
    };

    await this.publish(event);
  }

  /**
   * Emit revenue prediction events
   */
  async emitRevenueEvent(
    type: RevenueEvent['type'],
    companyId: string,
    data: Partial<RevenueEvent['data']>
  ): Promise<void> {
    const event: RevenueEvent = {
      id: `revenue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: Date.now(),
      source: 'revenue_engine',
      data: {
        companyId,
        ...data
      }
    };

    await this.publish(event);
  }

  /**
   * Emit system events
   */
  async emitSystemEvent(
    type: SystemEvent['type'],
    data: SystemEvent['data']
  ): Promise<void> {
    const event: SystemEvent = {
      id: `system_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: Date.now(),
      source: 'system',
      data
    };

    await this.publish(event);
  }

  /**
   * Get recent events for replay or debugging
   */
  async getRecentEvents(
    eventType?: string,
    limit: number = 50
  ): Promise<AppEvent[]> {
    try {
      const key = eventType ? `recent_events:${eventType}` : 'recent_events:all';
      const eventStrings = await this.publisher.lrange(key, 0, limit - 1);
      
      return eventStrings.map(eventString => JSON.parse(eventString));
    } catch (error) {
      console.error('❌ Error getting recent events:', error);
      return [];
    }
  }

  /**
   * Get event statistics
   */
  async getEventStats(): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    recentActivity: Array<{ type: string; count: number; lastSeen: number }>;
  }> {
    try {
      const [totalEventsResult, eventsByType] = await Promise.all([
        this.publisher.get('stats:events:total'),
        this.publisher.hgetall('stats:events:by_type')
      ]);
      
      const totalEvents = totalEventsResult || '0';

      // Get recent activity from each event type
      const recentActivity: Array<{ type: string; count: number; lastSeen: number }> = [];
      
      for (const [type, count] of Object.entries(eventsByType)) {
        const lastEvent = await this.publisher.lindex(`recent_events:${type}`, 0);
        if (lastEvent) {
          const parsed = JSON.parse(lastEvent);
          recentActivity.push({
            type,
            count: parseInt(count),
            lastSeen: parsed.timestamp
          });
        }
      }

      recentActivity.sort((a, b) => b.lastSeen - a.lastSeen);

      return {
        totalEvents: parseInt(totalEvents),
        eventsByType: Object.fromEntries(
          Object.entries(eventsByType).map(([k, v]) => [k, parseInt(v)])
        ),
        recentActivity
      };
    } catch (error) {
      console.error('❌ Error getting event stats:', error);
      return {
        totalEvents: 0,
        eventsByType: {},
        recentActivity: []
      };
    }
  }

  /**
   * Setup Redis subscriber message handling
   */
  private setupSubscriber(): void {
    this.subscriber.on('message', async (channel: string, message: string) => {
      try {
        const event: AppEvent = JSON.parse(message);
        
        // Get handlers for this specific channel
        const channelHandlers = this.handlers.get(channel);
        if (channelHandlers) {
          for (const handler of channelHandlers) {
            try {
              await handler(event);
            } catch (handlerError) {
              console.error(`❌ Event handler error for ${event.type}:`, handlerError);
            }
          }
        }
        
        // Also call wildcard handlers (except for wildcard channel itself)
        if (channel !== 'events:*') {
          const wildcardHandlers = this.handlers.get('events:*');
          if (wildcardHandlers) {
            for (const handler of wildcardHandlers) {
              try {
                await handler(event);
              } catch (handlerError) {
                console.error(`❌ Wildcard event handler error for ${event.type}:`, handlerError);
              }
            }
          }
        }
      } catch (error) {
        console.error('❌ Error processing event message:', error);
      }
    });

    this.subscriber.on('subscribe', (channel: string, count: number) => {
      console.log(`✅ Subscribed to ${channel} (${count} total subscriptions)`);
      this.isListening = true;
    });

    this.subscriber.on('unsubscribe', (channel: string, count: number) => {
      console.log(`❌ Unsubscribed from ${channel} (${count} remaining subscriptions)`);
      if (count === 0) {
        this.isListening = false;
      }
    });
  }

  /**
   * Store event for recent events replay
   */
  private async storeRecentEvent(event: AppEvent): Promise<void> {
    try {
      const pipeline = this.publisher.pipeline();
      
      // Store in type-specific list
      pipeline.lpush(`recent_events:${event.type}`, JSON.stringify(event));
      pipeline.ltrim(`recent_events:${event.type}`, 0, 99); // Keep last 100 events
      
      // Store in global list
      pipeline.lpush('recent_events:all', JSON.stringify(event));
      pipeline.ltrim('recent_events:all', 0, 499); // Keep last 500 events
      
      // Update statistics
      pipeline.incr('stats:events:total');
      pipeline.hincrby('stats:events:by_type', event.type, 1);
      
      await pipeline.exec();
    } catch (error) {
      console.error('❌ Error storing recent event:', error);
    }
  }

  /**
   * Health check for event system
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    isListening: boolean;
    activeSubscriptions: number;
    lastEventTime?: number;
  }> {
    try {
      const activeSubscriptions = Array.from(this.handlers.keys()).length;
      const recentEvents = await this.getRecentEvents(undefined, 1);
      const lastEventTime = recentEvents.length > 0 ? recentEvents[0].timestamp : undefined;
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (!this.isListening && activeSubscriptions > 0) {
        status = 'degraded';
      } else if (!redisManager.isHealthy()) {
        status = 'unhealthy';
      }
      
      return {
        status,
        isListening: this.isListening,
        activeSubscriptions,
        lastEventTime
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        isListening: false,
        activeSubscriptions: 0
      };
    }
  }

  /**
   * Shutdown event manager gracefully
   */
  async shutdown(): Promise<void> {
    try {
      // Unsubscribe from all channels
      for (const channel of this.handlers.keys()) {
        await this.subscriber.unsubscribe(channel);
      }
      
      this.handlers.clear();
      this.isListening = false;
      
      console.log('📴 Event manager shut down gracefully');
    } catch (error) {
      console.error('❌ Error shutting down event manager:', error);
    }
  }
}

export const eventManager = new UniversalEventManager(); 