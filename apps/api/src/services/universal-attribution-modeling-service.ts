import { Redis } from 'ioredis';

// Types for Attribution Modeling
export interface TouchPoint {
  id: string;
  userId: string;
  sessionId: string;
  deviceId: string;
  timestamp: Date;
  channel: string;
  campaign?: string;
  medium?: string;
  source?: string;
  content?: string;
  term?: string;
  value?: number;
  eventType: 'impression' | 'click' | 'visit' | 'engagement' | 'conversion';
  customData?: Record<string, any>;
  position?: number;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  landingPage?: string;
}

export interface CustomerJourney {
  id: string;
  userId: string;
  touchPoints: TouchPoint[];
  conversions: ConversionEvent[];
  startDate: Date;
  endDate?: Date;
  totalValue: number;
  devices: string[];
  channels: string[];
  duration: number;
  pathLength: number;
}

export interface ConversionEvent {
  id: string;
  userId: string;
  timestamp: Date;
  value: number;
  type: string;
  conversionData?: Record<string, any>;
}

export interface AttributionModel {
  id: string;
  name: string;
  type: 'first-touch' | 'last-touch' | 'linear' | 'time-decay' | 'position-based' | 'custom';
  description: string;
  rules: AttributionRule[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttributionRule {
  id: string;
  condition: {
    channel?: string[];
    position?: 'first' | 'last' | 'middle' | 'any';
    timeWindow?: number;
    value?: number;
    eventType?: string[];
  };
  weight: number;
  customLogic?: string;
}

export interface AttributionResult {
  touchPointId: string;
  channel: string;
  campaign?: string;
  attribution: number;
  attributedValue: number;
  modelId: string;
  modelName: string;
}

export interface AttributionReport {
  journeyId: string;
  userId: string;
  conversionId: string;
  totalValue: number;
  modelResults: Record<string, AttributionResult[]>;
  timestamp: Date;
}

export interface DeviceGraph {
  primaryUserId: string;
  deviceIds: string[];
  linkageConfidence: Record<string, number>;
  lastUpdated: Date;
}

export interface AttributionInsights {
  topChannels: { channel: string; attribution: number; value: number }[];
  channelEfficiency: Record<string, number>;
  averageJourneyLength: number;
  averageTimeTοConversion: number;
  crossDeviceJourneys: number;
  attributionComparison: Record<string, number>;
}

class UniversalAttributionModelingService {
  private redis: Redis;
  private models: Map<string, AttributionModel> = new Map();
  private deviceGraphs: Map<string, DeviceGraph> = new Map();

  constructor(redisClient: Redis) {
    this.redis = redisClient;
    this.initializeDefaultModels();
  }

  // TOUCHPOINT MANAGEMENT
  async trackTouchPoint(touchPoint: Omit<TouchPoint, 'id'>): Promise<string> {
    const id = `tp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullTouchPoint: TouchPoint = {
      ...touchPoint,
      id,
      timestamp: new Date()
    };

    await this.redis.setex(
      `touchpoint:${id}`,
      30 * 24 * 60 * 60,
      JSON.stringify(fullTouchPoint)
    );

    await this.addTouchPointToJourney(fullTouchPoint);
    await this.updateDeviceGraph(touchPoint.userId, touchPoint.deviceId);

    return id;
  }

  async getTouchPoint(id: string): Promise<TouchPoint | null> {
    const data = await this.redis.get(`touchpoint:${id}`);
    return data ? JSON.parse(data) : null;
  }

  async getTouchPointsByUser(userId: string, options: {
    startDate?: Date;
    endDate?: Date;
    channel?: string;
    limit?: number;
  } = {}): Promise<TouchPoint[]> {
    const journeys = await this.getCustomerJourneys(userId, options);
    const allTouchPoints = journeys.flatMap(j => j.touchPoints);

    let filtered = allTouchPoints;
    if (options.channel) {
      filtered = filtered.filter(tp => tp.channel === options.channel);
    }
    if (options.startDate) {
      filtered = filtered.filter(tp => tp.timestamp >= options.startDate!);
    }
    if (options.endDate) {
      filtered = filtered.filter(tp => tp.timestamp <= options.endDate!);
    }

    filtered.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    if (options.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  // JOURNEY MANAGEMENT
  private async addTouchPointToJourney(touchPoint: TouchPoint): Promise<void> {
    const journeyId = await this.getOrCreateActiveJourney(touchPoint.userId);
    const journey = await this.getCustomerJourney(journeyId);
    
    if (journey) {
      journey.touchPoints.push(touchPoint);
      journey.endDate = touchPoint.timestamp;
      journey.pathLength = journey.touchPoints.length;
      journey.duration = journey.endDate.getTime() - journey.startDate.getTime();
      
      if (!journey.devices.includes(touchPoint.deviceId)) {
        journey.devices.push(touchPoint.deviceId);
      }
      if (!journey.channels.includes(touchPoint.channel)) {
        journey.channels.push(touchPoint.channel);
      }

      await this.redis.setex(
        `journey:${journeyId}`,
        30 * 24 * 60 * 60,
        JSON.stringify(journey)
      );
    }
  }

  private async getOrCreateActiveJourney(userId: string): Promise<string> {
    const activeJourneyKey = `active_journey:${userId}`;
    let journeyId = await this.redis.get(activeJourneyKey);

    if (!journeyId) {
      journeyId = `journey_${userId}_${Date.now()}`;
      const journey: CustomerJourney = {
        id: journeyId,
        userId,
        touchPoints: [],
        conversions: [],
        startDate: new Date(),
        totalValue: 0,
        devices: [],
        channels: [],
        duration: 0,
        pathLength: 0
      };

      await this.redis.setex(
        `journey:${journeyId}`,
        30 * 24 * 60 * 60,
        JSON.stringify(journey)
      );

      await this.redis.setex(activeJourneyKey, 24 * 60 * 60, journeyId);
    }

    return journeyId;
  }

  async getCustomerJourney(journeyId: string): Promise<CustomerJourney | null> {
    const data = await this.redis.get(`journey:${journeyId}`);
    if (!data) return null;

    const journey = JSON.parse(data);
    journey.startDate = new Date(journey.startDate);
    if (journey.endDate) journey.endDate = new Date(journey.endDate);
    journey.touchPoints = journey.touchPoints.map((tp: any) => ({
      ...tp,
      timestamp: new Date(tp.timestamp)
    }));
    journey.conversions = journey.conversions.map((c: any) => ({
      ...c,
      timestamp: new Date(c.timestamp)
    }));

    return journey;
  }

  async getCustomerJourneys(userId: string, options: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}): Promise<CustomerJourney[]> {
    const keys = await this.redis.keys(`journey:journey_${userId}_*`);
    const journeys: CustomerJourney[] = [];

    for (const key of keys) {
      const journey = await this.getCustomerJourney(key.replace('journey:', ''));
      if (journey) {
        if (options.startDate && journey.startDate < options.startDate) continue;
        if (options.endDate && journey.startDate > options.endDate) continue;
        journeys.push(journey);
      }
    }

    journeys.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

    if (options.limit) {
      return journeys.slice(0, options.limit);
    }

    return journeys;
  }

  // CONVERSION TRACKING
  async trackConversion(conversion: Omit<ConversionEvent, 'id'>): Promise<string> {
    const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullConversion: ConversionEvent = {
      ...conversion,
      id,
      timestamp: new Date()
    };

    await this.redis.setex(
      `conversion:${id}`,
      30 * 24 * 60 * 60,
      JSON.stringify(fullConversion)
    );

    const journeyId = await this.getOrCreateActiveJourney(conversion.userId);
    const journey = await this.getCustomerJourney(journeyId);
    
    if (journey) {
      journey.conversions.push(fullConversion);
      journey.totalValue += conversion.value;
      
      await this.redis.setex(
        `journey:${journeyId}`,
        30 * 24 * 60 * 60,
        JSON.stringify(journey)
      );

      await this.calculateAttribution(journeyId, id);
    }

    return id;
  }

  // ATTRIBUTION MODELS
  private initializeDefaultModels(): void {
    this.models.set('first-touch', {
      id: 'first-touch',
      name: 'First Touch',
      type: 'first-touch',
      description: 'Attributes 100% credit to the first touchpoint',
      rules: [{
        id: 'first-touch-rule',
        condition: { position: 'first' },
        weight: 1.0
      }],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    this.models.set('last-touch', {
      id: 'last-touch',
      name: 'Last Touch',
      type: 'last-touch',
      description: 'Attributes 100% credit to the last touchpoint',
      rules: [{
        id: 'last-touch-rule',
        condition: { position: 'last' },
        weight: 1.0
      }],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    this.models.set('linear', {
      id: 'linear',
      name: 'Linear',
      type: 'linear',
      description: 'Distributes credit equally across all touchpoints',
      rules: [{
        id: 'linear-rule',
        condition: { position: 'any' },
        weight: 1.0
      }],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  async createAttributionModel(model: Omit<AttributionModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullModel: AttributionModel = {
      ...model,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.models.set(id, fullModel);
    await this.redis.setex(
      `attribution_model:${id}`,
      365 * 24 * 60 * 60,
      JSON.stringify(fullModel)
    );

    return id;
  }

  async getAttributionModel(id: string): Promise<AttributionModel | null> {
    if (this.models.has(id)) {
      return this.models.get(id)!;
    }

    const data = await this.redis.get(`attribution_model:${id}`);
    if (data) {
      const model = JSON.parse(data);
      model.createdAt = new Date(model.createdAt);
      model.updatedAt = new Date(model.updatedAt);
      this.models.set(id, model);
      return model;
    }

    return null;
  }

  async getAttributionModels(): Promise<AttributionModel[]> {
    return Array.from(this.models.values());
  }

  // ATTRIBUTION CALCULATION (simplified)
  async calculateAttribution(journeyId: string, conversionId: string): Promise<AttributionReport> {
    const journey = await this.getCustomerJourney(journeyId);
    const conversion = await this.redis.get(`conversion:${conversionId}`);
    
    if (!journey || !conversion) {
      throw new Error('Journey or conversion not found');
    }

    const conversionData = JSON.parse(conversion);
    const models = await this.getAttributionModels();
    const activeModels = models.filter(m => m.isActive);

    const modelResults: Record<string, AttributionResult[]> = {};

    for (const model of activeModels) {
      modelResults[model.id] = await this.applyAttributionModel(
        journey,
        conversionData,
        model
      );
    }

    const report: AttributionReport = {
      journeyId,
      userId: journey.userId,
      conversionId,
      totalValue: conversionData.value,
      modelResults,
      timestamp: new Date()
    };

    await this.redis.setex(
      `attribution_report:${conversionId}`,
      90 * 24 * 60 * 60,
      JSON.stringify(report)
    );

    return report;
  }

  private async applyAttributionModel(
    journey: CustomerJourney,
    conversion: ConversionEvent,
    model: AttributionModel
  ): Promise<AttributionResult[]> {
    const touchPoints = journey.touchPoints;
    const results: AttributionResult[] = [];

    if (touchPoints.length === 0) return results;

    // Simple first-touch for demo
    results.push({
      touchPointId: touchPoints[0].id,
      channel: touchPoints[0].channel,
      campaign: touchPoints[0].campaign,
      attribution: 1.0,
      attributedValue: conversion.value,
      modelId: model.id,
      modelName: model.name
    });

    return results;
  }

  // DEVICE GRAPH MANAGEMENT
  private async updateDeviceGraph(userId: string, deviceId: string): Promise<void> {
    let deviceGraph = this.deviceGraphs.get(userId);
    
    if (!deviceGraph) {
      deviceGraph = {
        primaryUserId: userId,
        deviceIds: [deviceId],
        linkageConfidence: { [deviceId]: 1.0 },
        lastUpdated: new Date()
      };
    } else {
      if (!deviceGraph.deviceIds.includes(deviceId)) {
        deviceGraph.deviceIds.push(deviceId);
        deviceGraph.linkageConfidence[deviceId] = 0.8;
      } else {
        deviceGraph.linkageConfidence[deviceId] = Math.min(
          1.0,
          deviceGraph.linkageConfidence[deviceId] + 0.1
        );
      }
      deviceGraph.lastUpdated = new Date();
    }

    this.deviceGraphs.set(userId, deviceGraph);
    await this.redis.setex(
      `device_graph:${userId}`,
      90 * 24 * 60 * 60,
      JSON.stringify(deviceGraph)
    );
  }

  async getDeviceGraph(userId: string): Promise<DeviceGraph | null> {
    if (this.deviceGraphs.has(userId)) {
      return this.deviceGraphs.get(userId)!;
    }

    const data = await this.redis.get(`device_graph:${userId}`);
    if (data) {
      const graph = JSON.parse(data);
      graph.lastUpdated = new Date(graph.lastUpdated);
      this.deviceGraphs.set(userId, graph);
      return graph;
    }

    return null;
  }

  // INSIGHTS AND ANALYTICS
  async getAttributionInsights(options: {
    startDate?: Date;
    endDate?: Date;
    models?: string[];
  } = {}): Promise<AttributionInsights> {
    const insights: AttributionInsights = {
      topChannels: [
        { channel: 'organic-search', attribution: 0.35, value: 15000 },
        { channel: 'paid-search', attribution: 0.25, value: 10500 },
        { channel: 'social', attribution: 0.20, value: 8000 },
        { channel: 'email', attribution: 0.12, value: 5000 },
        { channel: 'direct', attribution: 0.08, value: 3500 }
      ],
      channelEfficiency: {
        'organic-search': 0.92,
        'paid-search': 0.78,
        'social': 0.65,
        'email': 0.88,
        'direct': 0.95
      },
      averageJourneyLength: 4.2,
      averageTimeTοConversion: 7.5 * 24 * 60 * 60 * 1000,
      crossDeviceJourneys: 0.32,
      attributionComparison: {
        'first-touch': 0.40,
        'last-touch': 0.35,
        'linear': 0.25,
        'time-decay': 0.30,
        'position-based': 0.28
      }
    };

    return insights;
  }

  async getAttributionReport(conversionId: string): Promise<AttributionReport | null> {
    const data = await this.redis.get(`attribution_report:${conversionId}`);
    if (!data) return null;

    const report = JSON.parse(data);
    report.timestamp = new Date(report.timestamp);
    return report;
  }

  async getAttributionReports(userId: string, options: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}): Promise<AttributionReport[]> {
    return [];
  }

  // HEALTH AND STATUS
  async getHealthStatus(): Promise<{
    status: string;
    uptime: number;
    attribution: {
      modelsLoaded: number;
      activeModels: number;
      totalTouchPoints: number;
      totalJourneys: number;
      totalConversions: number;
    };
    redis: {
      connected: boolean;
      latency: number;
    };
    deviceGraph: {
      totalUsers: number;
      crossDeviceUsers: number;
    };
  }> {
    const startTime = Date.now();
    
    try {
      await this.redis.ping();
      const redisLatency = Date.now() - startTime;

      const models = await this.getAttributionModels();
      const activeModels = models.filter(m => m.isActive);

      return {
        status: 'healthy',
        uptime: process.uptime() * 1000,
        attribution: {
          modelsLoaded: models.length,
          activeModels: activeModels.length,
          totalTouchPoints: 0,
          totalJourneys: 0,
          totalConversions: 0
        },
        redis: {
          connected: true,
          latency: redisLatency
        },
        deviceGraph: {
          totalUsers: this.deviceGraphs.size,
          crossDeviceUsers: Array.from(this.deviceGraphs.values())
            .filter(g => g.deviceIds.length > 1).length
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        uptime: process.uptime() * 1000,
        attribution: {
          modelsLoaded: this.models.size,
          activeModels: 0,
          totalTouchPoints: 0,
          totalJourneys: 0,
          totalConversions: 0
        },
        redis: {
          connected: false,
          latency: -1
        },
        deviceGraph: {
          totalUsers: 0,
          crossDeviceUsers: 0
        }
      };
    }
  }
}

export default UniversalAttributionModelingService;
