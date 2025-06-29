import { Redis } from 'ioredis';

// Core interfaces for A/B testing framework
export interface Experiment {
  id: string;
  name: string;
  description?: string;
  type: 'ab_test' | 'multivariate' | 'split_url' | 'redirect' | 'feature_flag';
  status: 'draft' | 'running' | 'paused' | 'completed' | 'archived';
  startDate?: Date;
  endDate?: Date;
  targetingRules: {
    audience?: string[];
    segments?: string[];
    devices?: ('desktop' | 'mobile' | 'tablet')[];
    browsers?: string[];
    geoLocations?: string[];
    trafficAllocation?: number; // 0-100 percentage
    customRules?: Record<string, any>;
  };
  variants: ExperimentVariant[];
  primaryGoal: ConversionGoal;
  secondaryGoals?: ConversionGoal[];
  statisticalSettings: {
    confidenceLevel: number; // 90, 95, 99
    minimumDetectableEffect: number; // percentage
    statisticalPower: number; // typically 80%
    trafficSplit: 'even' | 'weighted';
    sampleSizeCalculation: 'automatic' | 'manual';
    minimumSampleSize?: number;
    maxRunDuration?: number; // days
  };
  metadata: {
    owner: string;
    team?: string;
    tags: string[];
    hypothesis?: string;
    expectedOutcome?: string;
    businessImpact?: string;
    winnerId?: string;
    winnerName?: string;
  };
}

export interface ExperimentVariant {
  id: string;
  name: string;
  description?: string;
  trafficAllocation: number; // percentage
  isControl: boolean;
  changes: {
    type: 'content' | 'design' | 'flow' | 'feature' | 'redirect' | 'code';
    target: string; // CSS selector, URL, feature flag name, etc.
    modification: any; // depends on type
  }[];
  metadata?: Record<string, any>;
}

export interface ConversionGoal {
  id: string;
  name: string;
  type: 'revenue' | 'conversion' | 'engagement' | 'custom';
  metric: 'count' | 'rate' | 'sum' | 'average' | 'unique';
  conditions: {
    event?: string;
    property?: string;
    operator?: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'exists';
    value?: any;
    url?: string;
    selector?: string;
  }[];
  valueProperty?: string; // for revenue goals
  improvementDirection: 'increase' | 'decrease';
}

export interface ExperimentResult {
  experimentId: string;
  variantId: string;
  participantCount: number;
  conversionCount: number;
  conversionRate: number;
  revenue?: number;
  revenuePerVisitor?: number;
  customMetrics?: Record<string, number>;
  confidence: number;
  significanceLevel: number;
  pValue?: number;
  confidenceInterval?: {
    lower: number;
    upper: number;
  };
  statisticalSignificance: boolean;
  improvement?: number; // percentage vs control
  timestamp: Date;
}

export interface StatisticalAnalysis {
  experimentId: string;
  totalParticipants: number;
  totalConversions: number;
  overallConversionRate: number;
  variants: ExperimentResult[];
  winner?: {
    variantId: string;
    confidence: number;
    improvement: number;
    significance: number;
  };
  recommendations: {
    action: 'continue' | 'stop_winner' | 'stop_inconclusive' | 'extend_duration' | 'increase_traffic';
    reason: string;
    confidence: number;
  };
  chartData: {
    timeline: Array<{
      date: string;
      variants: Record<string, {
        participants: number;
        conversions: number;
        conversionRate: number;
      }>;
    }>;
    distribution: Record<string, number>;
  };
}

export interface ExperimentParticipant {
  experimentId: string;
  variantId: string;
  userId?: string;
  sessionId: string;
  timestamp: Date;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  userAgent?: string;
  ipAddress?: string;
  geoLocation?: {
    country?: string;
    region?: string;
    city?: string;
  };
  metadata?: Record<string, any>;
}

export interface ParticipantInput {
  experimentId: string;
  userId?: string;
  sessionId: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  userAgent?: string;
  ipAddress?: string;
  geoLocation?: {
    country?: string;
    region?: string;
    city?: string;
  };
  metadata?: Record<string, any>;
}

export interface ConversionEvent {
  experimentId: string;
  variantId: string;
  participantId: string;
  goalId: string;
  timestamp: Date;
  value?: number;
  properties?: Record<string, any>;
}

class UniversalABTestingService {
  private redis: Redis;
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly RESULTS_CACHE_TTL = 300; // 5 minutes

  constructor(redisClient: Redis) {
    this.redis = redisClient;
  }

  // EXPERIMENT MANAGEMENT
  async createExperiment(experiment: Omit<Experiment, 'id'>): Promise<string> {
    const id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Validate traffic allocation
    const totalAllocation = experiment.variants.reduce((sum, v) => sum + v.trafficAllocation, 0);
    if (Math.abs(totalAllocation - 100) > 0.01) {
      throw new Error('Variant traffic allocations must sum to 100%');
    }

    // Ensure one control variant
    const controlVariants = experiment.variants.filter(v => v.isControl);
    if (controlVariants.length !== 1) {
      throw new Error('Exactly one variant must be marked as control');
    }

    const fullExperiment: Experiment = {
      id,
      ...experiment,
      status: experiment.status || 'draft'
    };

    await this.redis.setex(
      `experiment:${id}`,
      365 * 24 * 60 * 60, // 1 year
      JSON.stringify(fullExperiment)
    );

    // Add to experiment indexes
    await this.redis.sadd('experiments:all', id);
    await this.redis.sadd(`experiments:status:${experiment.status || 'draft'}`, id);
    await this.redis.sadd(`experiments:type:${experiment.type}`, id);

    if (experiment.metadata.team) {
      await this.redis.sadd(`experiments:team:${experiment.metadata.team}`, id);
    }

    return id;
  }

  async getExperiment(experimentId: string): Promise<Experiment | null> {
    const data = await this.redis.get(`experiment:${experimentId}`);
    if (!data) return null;

    const experiment = JSON.parse(data);
    if (experiment.startDate) experiment.startDate = new Date(experiment.startDate);
    if (experiment.endDate) experiment.endDate = new Date(experiment.endDate);
    return experiment;
  }

  async updateExperiment(experimentId: string, updates: Partial<Experiment>): Promise<void> {
    const experiment = await this.getExperiment(experimentId);
    if (!experiment) {
      throw new Error('Experiment not found');
    }

    // Prevent certain updates when running
    if (experiment.status === 'running') {
      const forbiddenUpdates = ['variants', 'primaryGoal', 'statisticalSettings', 'targetingRules'];
      const hasUpdates = forbiddenUpdates.some(field => field in updates);
      if (hasUpdates) {
        throw new Error('Cannot modify variants, goals, or settings while experiment is running');
      }
    }

    const updatedExperiment = { ...experiment, ...updates };

    await this.redis.setex(
      `experiment:${experimentId}`,
      365 * 24 * 60 * 60,
      JSON.stringify(updatedExperiment)
    );

    // Update indexes if status changed
    if (updates.status && updates.status !== experiment.status) {
      await this.redis.srem(`experiments:status:${experiment.status}`, experimentId);
      await this.redis.sadd(`experiments:status:${updates.status}`, experimentId);
    }
  }

  async getExperimentList(options: {
    status?: string;
    type?: string;
    team?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Experiment[]> {
    let experimentIds: string[] = [];

    if (options.status) {
      experimentIds = await this.redis.smembers(`experiments:status:${options.status}`);
    } else if (options.type) {
      experimentIds = await this.redis.smembers(`experiments:type:${options.type}`);
    } else if (options.team) {
      experimentIds = await this.redis.smembers(`experiments:team:${options.team}`);
    } else {
      experimentIds = await this.redis.smembers('experiments:all');
    }

    const experiments: Experiment[] = [];
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    for (let i = offset; i < Math.min(offset + limit, experimentIds.length); i++) {
      const experiment = await this.getExperiment(experimentIds[i]);
      if (experiment) {
        experiments.push(experiment);
      }
    }

    return experiments.sort((a, b) => {
      const aDate = a.startDate || new Date(0);
      const bDate = b.startDate || new Date(0);
      return bDate.getTime() - aDate.getTime();
    });
  }

  // PARTICIPANT TRACKING
  async addParticipant(participant: ParticipantInput): Promise<string> {
    const experiment = await this.getExperiment(participant.experimentId);
    if (!experiment || experiment.status !== 'running') {
      throw new Error('Experiment not found or not running');
    }

    // Check if user already participated
    const participantKey = participant.userId || participant.sessionId;
    const existingVariant = await this.redis.get(`participant:${participant.experimentId}:${participantKey}`);

    if (existingVariant) {
      return existingVariant;
    }

    // Assign variant based on traffic allocation
    const variantId = this.assignVariant(experiment.variants, participantKey);

    const fullParticipant: ExperimentParticipant = {
      ...participant,
      variantId,
      timestamp: new Date()
    };

    const participantId = `${participant.experimentId}_${participantKey}_${Date.now()}`;

    // Store participant data
    await this.redis.setex(
      `participant:${participantId}`,
      30 * 24 * 60 * 60, // 30 days
      JSON.stringify(fullParticipant)
    );

    // Store user-variant mapping
    await this.redis.setex(
      `participant:${participant.experimentId}:${participantKey}`,
      30 * 24 * 60 * 60,
      variantId
    );

    // Update participant counts
    await this.redis.hincrby(`experiment:${participant.experimentId}:participants`, variantId, 1);
    await this.redis.hincrby(`experiment:${participant.experimentId}:participants:daily:${this.getDateKey()}`, variantId, 1);

    return variantId;
  }

  private assignVariant(variants: ExperimentVariant[], seed: string): string {
    // Use consistent hashing for deterministic variant assignment
    const hash = this.hashString(seed);
    const percentage = (hash % 100) + 1;

    let cumulative = 0;
    for (const variant of variants) {
      cumulative += variant.trafficAllocation;
      if (percentage <= cumulative) {
        return variant.id;
      }
    }

    // Fallback to control
    return variants.find(v => v.isControl)?.id || variants[0].id;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // CONVERSION TRACKING
  async recordConversion(conversion: Omit<ConversionEvent, 'timestamp'>): Promise<void> {
    const experiment = await this.getExperiment(conversion.experimentId);
    if (!experiment || experiment.status !== 'running') {
      throw new Error('Experiment not found or not running');
    }

    const fullConversion: ConversionEvent = {
      ...conversion,
      timestamp: new Date()
    };

    const conversionId = `${conversion.experimentId}_${conversion.participantId}_${conversion.goalId}_${Date.now()}`;

    // Store conversion event
    await this.redis.setex(
      `conversion:${conversionId}`,
      30 * 24 * 60 * 60, // 30 days
      JSON.stringify(fullConversion)
    );

    // Update conversion counts
    await this.redis.hincrby(`experiment:${conversion.experimentId}:conversions:${conversion.goalId}`, conversion.variantId, 1);
    await this.redis.hincrby(`experiment:${conversion.experimentId}:conversions:${conversion.goalId}:daily:${this.getDateKey()}`, conversion.variantId, 1);

    // Update revenue if applicable
    if (conversion.value) {
      await this.redis.hincrbyfloat(`experiment:${conversion.experimentId}:revenue:${conversion.goalId}`, conversion.variantId, conversion.value);
      await this.redis.hincrbyfloat(`experiment:${conversion.experimentId}:revenue:${conversion.goalId}:daily:${this.getDateKey()}`, conversion.variantId, conversion.value);
    }

    // Clear results cache
    await this.redis.del(`results:${conversion.experimentId}`);
  }

  private getDateKey(): string {
    return new Date().toISOString().split('T')[0];
  }

  // STATISTICAL ANALYSIS
  async calculateResults(experimentId: string): Promise<StatisticalAnalysis> {
    const cacheKey = `results:${experimentId}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      const results = JSON.parse(cached);
      results.timestamp = new Date(results.timestamp);
      return results;
    }

    const experiment = await this.getExperiment(experimentId);
    if (!experiment) {
      throw new Error('Experiment not found');
    }

    // Get participant counts
    const participantCounts = await this.redis.hgetall(`experiment:${experimentId}:participants`);

    // Get conversion counts for primary goal
    const conversionCounts = await this.redis.hgetall(`experiment:${experimentId}:conversions:${experiment.primaryGoal.id}`);

    // Get revenue data if applicable
    const revenueCounts = await this.redis.hgetall(`experiment:${experimentId}:revenue:${experiment.primaryGoal.id}`);

    const variants: ExperimentResult[] = [];
    let totalParticipants = 0;
    let totalConversions = 0;

    // Calculate results for each variant
    for (const variant of experiment.variants) {
      const participants = parseInt(participantCounts[variant.id] || '0');
      const conversions = parseInt(conversionCounts[variant.id] || '0');
      const revenue = parseFloat(revenueCounts[variant.id] || '0');

      totalParticipants += participants;
      totalConversions += conversions;

      const conversionRate = participants > 0 ? conversions / participants : 0;
      const revenuePerVisitor = participants > 0 ? revenue / participants : 0;

      variants.push({
        experimentId,
        variantId: variant.id,
        participantCount: participants,
        conversionCount: conversions,
        conversionRate,
        revenue,
        revenuePerVisitor,
        confidence: 0, // Will be calculated below
        significanceLevel: experiment.statisticalSettings.confidenceLevel,
        statisticalSignificance: false,
        timestamp: new Date()
      });
    }

    // Calculate statistical significance
    const controlVariant = variants.find(v => {
      const variant = experiment.variants.find(ev => ev.id === v.variantId);
      return variant?.isControl;
    });

    if (controlVariant) {
      for (const variant of variants) {
        if (variant.variantId !== controlVariant.variantId) {
          const stats = this.calculateStatisticalSignificance(
            controlVariant,
            variant,
            experiment.statisticalSettings.confidenceLevel
          );

          variant.confidence = stats.confidence;
          variant.pValue = stats.pValue;
          variant.confidenceInterval = stats.confidenceInterval;
          variant.statisticalSignificance = stats.significant;
          variant.improvement = stats.improvement;
        }
      }
    }

    // Determine winner and recommendations
    const winner = this.determineWinner(variants, experiment);
    const recommendations = this.generateRecommendations(variants, experiment, winner);

    // Generate chart data
    const chartData = await this.generateChartData(experimentId, experiment);

    const analysis: StatisticalAnalysis = {
      experimentId,
      totalParticipants,
      totalConversions,
      overallConversionRate: totalParticipants > 0 ? totalConversions / totalParticipants : 0,
      variants,
      winner,
      recommendations,
      chartData
    };

    // Cache results for 5 minutes
    await this.redis.setex(cacheKey, this.RESULTS_CACHE_TTL, JSON.stringify(analysis));

    return analysis;
  }

  private calculateStatisticalSignificance(
    control: ExperimentResult,
    variant: ExperimentResult,
    confidenceLevel: number
  ) {
    // Simplified z-test for proportions
    const controlRate = control.conversionRate;
    const variantRate = variant.conversionRate;

    if (control.participantCount === 0 || variant.participantCount === 0) {
      return {
        confidence: 0,
        pValue: 1,
        significant: false,
        improvement: 0,
        confidenceInterval: { lower: 0, upper: 0 }
      };
    }

    // Pool the proportions
    const pooledRate = (control.conversionCount + variant.conversionCount) /
                      (control.participantCount + variant.participantCount);

    // Calculate standard error
    const se = Math.sqrt(pooledRate * (1 - pooledRate) *
                        (1 / control.participantCount + 1 / variant.participantCount));

    // Calculate z-score
    const zScore = se > 0 ? (variantRate - controlRate) / se : 0;

    // Calculate p-value (two-tailed)
    const pValue = 2 * (1 - this.standardNormalCDF(Math.abs(zScore)));

    // Determine significance
    const alpha = (100 - confidenceLevel) / 100;
    const significant = pValue < alpha;

    // Calculate improvement percentage
    const improvement = controlRate > 0 ? ((variantRate - controlRate) / controlRate) * 100 : 0;

    // Calculate confidence interval for the difference
    const criticalValue = this.getZCritical(confidenceLevel);
    const seDiff = Math.sqrt((controlRate * (1 - controlRate) / control.participantCount) +
                           (variantRate * (1 - variantRate) / variant.participantCount));

    const diff = variantRate - controlRate;
    const margin = criticalValue * seDiff;

    return {
      confidence: significant ? confidenceLevel : 0,
      pValue,
      significant,
      improvement,
      confidenceInterval: {
        lower: (diff - margin) * 100,
        upper: (diff + margin) * 100
      }
    };
  }

  private standardNormalCDF(z: number): number {
    // Approximation of standard normal CDF
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = z < 0 ? -1 : 1;
    z = Math.abs(z);

    const t = 1.0 / (1.0 + p * z);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);

    return 0.5 * (1.0 + sign * y);
  }

  private getZCritical(confidenceLevel: number): number {
    const alpha = (100 - confidenceLevel) / 200; // Two-tailed
    if (alpha <= 0.005) return 2.576; // 99%
    if (alpha <= 0.025) return 1.96;  // 95%
    if (alpha <= 0.05) return 1.645;  // 90%
    return 1.96; // Default to 95%
  }

  private determineWinner(variants: ExperimentResult[], experiment: Experiment) {
    const significantVariants = variants.filter(v =>
      v.statisticalSignificance &&
      v.improvement !== undefined &&
      v.improvement > 0
    );

    if (significantVariants.length === 0) {
      return undefined;
    }

    // Find variant with highest improvement and confidence
    const winner = significantVariants.reduce((best, current) => {
      const currentScore = (current.improvement || 0) * (current.confidence / 100);
      const bestScore = (best.improvement || 0) * (best.confidence / 100);
      return currentScore > bestScore ? current : best;
    });

    return {
      variantId: winner.variantId,
      confidence: winner.confidence,
      improvement: winner.improvement || 0,
      significance: winner.pValue || 1
    };
  }

  private generateRecommendations(
    variants: ExperimentResult[],
    experiment: Experiment,
    winner?: any
  ) {
    const totalParticipants = variants.reduce((sum, v) => sum + v.participantCount, 0);
    const minSampleSize = experiment.statisticalSettings.minimumSampleSize || 1000;

    if (totalParticipants < minSampleSize) {
      return {
        action: 'continue' as const,
        reason: `Need more data. Current: ${totalParticipants}, Required: ${minSampleSize}`,
        confidence: 0
      };
    }

    if (winner && winner.confidence >= experiment.statisticalSettings.confidenceLevel) {
      return {
        action: 'stop_winner' as const,
        reason: `Clear winner found with ${winner.confidence}% confidence and ${winner.improvement.toFixed(1)}% improvement`,
        confidence: winner.confidence
      };
    }

    const hasSignificantResults = variants.some(v => v.statisticalSignificance);
    if (!hasSignificantResults && totalParticipants > minSampleSize * 2) {
      return {
        action: 'stop_inconclusive' as const,
        reason: 'No significant difference detected after sufficient sample size',
        confidence: 0
      };
    }

    return {
      action: 'continue' as const,
      reason: 'Continue collecting data for statistical significance',
      confidence: 0
    };
  }

  private async generateChartData(experimentId: string, experiment: Experiment) {
    // Generate timeline data for the last 30 days
    const timeline = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];

      const dayParticipants = await this.redis.hgetall(`experiment:${experimentId}:participants:daily:${dateKey}`);
      const dayConversions = await this.redis.hgetall(`experiment:${experimentId}:conversions:${experiment.primaryGoal.id}:daily:${dateKey}`);

      const variants: Record<string, any> = {};

      for (const variant of experiment.variants) {
        const participants = parseInt(dayParticipants[variant.id] || '0');
        const conversions = parseInt(dayConversions[variant.id] || '0');
        const conversionRate = participants > 0 ? conversions / participants : 0;

        variants[variant.id] = {
          participants,
          conversions,
          conversionRate
        };
      }

      timeline.push({
        date: dateKey,
        variants
      });
    }

    // Generate distribution data
    const participantCounts = await this.redis.hgetall(`experiment:${experimentId}:participants`);
    const distribution: Record<string, number> = {};

    for (const variant of experiment.variants) {
      distribution[variant.id] = parseInt(participantCounts[variant.id] || '0');
    }

    return {
      timeline,
      distribution
    };
  }

  // EXPERIMENT LIFECYCLE
  async startExperiment(experimentId: string): Promise<void> {
    const experiment = await this.getExperiment(experimentId);
    if (!experiment) {
      throw new Error('Experiment not found');
    }

    if (experiment.status !== 'draft') {
      throw new Error('Only draft experiments can be started');
    }

    await this.updateExperiment(experimentId, {
      status: 'running',
      startDate: new Date()
    });
  }

  async pauseExperiment(experimentId: string): Promise<void> {
    const experiment = await this.getExperiment(experimentId);
    if (!experiment) {
      throw new Error('Experiment not found');
    }

    if (experiment.status !== 'running') {
      throw new Error('Only running experiments can be paused');
    }

    await this.updateExperiment(experimentId, {
      status: 'paused'
    });
  }

  async stopExperiment(experimentId: string, winnerId?: string): Promise<void> {
    const experiment = await this.getExperiment(experimentId);
    if (!experiment) {
      throw new Error('Experiment not found');
    }

    if (experiment.status !== 'running' && experiment.status !== 'paused') {
      throw new Error('Only running or paused experiments can be stopped');
    }

    const updates: Partial<Experiment> = {
      status: 'completed',
      endDate: new Date()
    };

    if (winnerId) {
      const winner = experiment.variants.find(v => v.id === winnerId);
      if (!winner) {
        throw new Error('Invalid winner variant ID');
      }
      updates.metadata = {
        ...experiment.metadata,
        winnerId,
        winnerName: winner.name
      };
    }

    await this.updateExperiment(experimentId, updates);
  }

  // HEALTH CHECK
  async getHealthStatus() {
    try {
      const totalExperiments = await this.redis.scard('experiments:all');
      const runningExperiments = await this.redis.scard('experiments:status:running');

      const testKey = `health_test_${Date.now()}`;
      await this.redis.setex(testKey, 10, 'test');
      const testValue = await this.redis.get(testKey);
      await this.redis.del(testKey);

      const status = testValue === 'test' ? 'healthy' : 'degraded';

      return {
        status,
        timestamp: new Date().toISOString(),
        metrics: {
          totalExperiments,
          runningExperiments,
          redisConnected: status === 'healthy'
        },
        version: '1.0.0'
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        version: '1.0.0'
      };
    }
  }
}

export function createUniversalABTestingService(redisClient: Redis): UniversalABTestingService {
  return new UniversalABTestingService(redisClient);
}

export default createUniversalABTestingService;
