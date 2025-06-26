import { EventEmitter } from 'events';
import { redisManager } from './redis-client';
import { RawEvent, EventType } from './data-pipeline';

export interface QualityRule {
  id: string;
  name: string;
  description: string;
  category: 'completeness' | 'accuracy' | 'consistency' | 'timeliness' | 'validity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  condition: (event: RawEvent) => boolean;
  message: string;
}

export interface QualityViolation {
  id: string;
  ruleId: string;
  eventId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  field?: string;
  value?: any;
  expectedValue?: any;
}

export class DataQualityManager extends EventEmitter {
  private isRunning: boolean = false;
  private rules: Map<string, QualityRule> = new Map();
  private violations: QualityViolation[] = [];
  private maxViolations: number = 10000;
  private qualityInterval?: NodeJS.Timeout;
  
  constructor() {
    super();
    this.initializeDefaultRules();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('🔍 Data quality monitor is already running');
      return;
    }
    this.isRunning = true;
    this.qualityInterval = setInterval(() => {
      this.generateQualityMetrics();
    }, 60000);
    console.log('🚀 Data quality monitor started');
    this.emit('quality:started');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.qualityInterval) {
      clearInterval(this.qualityInterval);
    }
    console.log('⏹️ Data quality monitor stopped');
    this.emit('quality:stopped');
  }

  async validateEvent(event: RawEvent): Promise<{
    isValid: boolean;
    violations: QualityViolation[];
    qualityScore: number;
  }> {
    const violations: QualityViolation[] = [];
    
    for (const rule of this.rules.values()) {
      try {
        if (!rule.condition(event)) {
          const violation: QualityViolation = {
            id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ruleId: rule.id,
            eventId: event.id || 'unknown',
            severity: rule.severity,
            message: rule.message,
            timestamp: new Date()
          };
          violations.push(violation);
          this.recordViolation(violation);
        }
      } catch (error) {
        console.warn(`⚠️ Error running quality rule ${rule.id}:`, error);
      }
    }

    const qualityScore = this.calculateQualityScore(violations);
    
    this.emit('quality:checked', {
      eventId: event.id,
      violations: violations.length,
      qualityScore
    });

    return {
      isValid: violations.length === 0,
      violations,
      qualityScore
    };
  }

  addRule(rule: QualityRule): void {
    this.rules.set(rule.id, rule);
    console.log(`✅ Added quality rule: ${rule.name}`);
  }

  removeRule(ruleId: string): boolean {
    const removed = this.rules.delete(ruleId);
    if (removed) {
      console.log(`🗑️ Removed quality rule: ${ruleId}`);
    }
    return removed;
  }

  getRules(): QualityRule[] {
    return Array.from(this.rules.values());
  }

  getRule(ruleId: string): QualityRule | undefined {
    return this.rules.get(ruleId);
  }

  async getRecentViolations(limit: number = 100): Promise<QualityViolation[]> {
    return this.violations
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  private initializeDefaultRules(): void {
    this.addRule({
      id: 'required-event-type',
      name: 'Event Type Required',
      description: 'Event must have a valid type',
      category: 'completeness',
      severity: 'critical',
      condition: (event) => !!event.type && Object.values(EventType).includes(event.type),
      message: 'Event type is missing or invalid'
    });

    this.addRule({
      id: 'required-session-id',
      name: 'Session ID Required',
      description: 'Event must have a session ID',
      category: 'completeness',
      severity: 'high',
      condition: (event) => !!event.sessionId && event.sessionId.length > 0,
      message: 'Session ID is missing or empty'
    });

    this.addRule({
      id: 'required-visitor-id',
      name: 'Visitor ID Required',
      description: 'Event must have a visitor ID',
      category: 'completeness',
      severity: 'high',
      condition: (event) => !!event.visitorId && event.visitorId.length > 0,
      message: 'Visitor ID is missing or empty'
    });

    console.log(`✅ Initialized ${this.rules.size} default quality rules`);
  }

  private recordViolation(violation: QualityViolation): void {
    this.violations.push(violation);
    
    if (this.violations.length > this.maxViolations) {
      this.violations = this.violations.slice(-this.maxViolations);
    }

    this.emit('quality:violation', violation);

    if (violation.severity === 'critical') {
      console.error(`�� Critical quality violation: ${violation.message}`);
    }
  }

  private calculateQualityScore(violations: QualityViolation[]): number {
    if (violations.length === 0) return 100;
    
    const severityWeights = {
      low: 1,
      medium: 3,
      high: 7,
      critical: 15
    };
    
    const totalWeight = violations.reduce((sum, v) => 
      sum + severityWeights[v.severity], 0
    );
    
    return Math.max(0, 100 - totalWeight);
  }

  private async generateQualityMetrics(): Promise<void> {
    try {
      const redis = redisManager.getClient();
      const recentViolations = this.violations.filter(
        v => Date.now() - v.timestamp.getTime() < 3600000
      );
      
      await redis.setex(
        'quality:metrics:latest',
        3600,
        JSON.stringify({
          qualityScore: recentViolations.length === 0 ? 100 : 85,
          totalViolations: recentViolations.length,
          timestamp: new Date()
        })
      );

      this.emit('quality:metrics', {
        qualityScore: recentViolations.length === 0 ? 100 : 85,
        violations: recentViolations.length
      });
      
    } catch (error) {
      console.error('❌ Error generating quality metrics:', error);
    }
  }
}

export const dataQuality = new DataQualityManager();
