import { Redis } from 'ioredis';
import createABTestTemplateService from './ab-test-template-service';

export interface CustomerProfile {
  id: string;
  companyName: string;
  industry: string;
  businessModel: 'b2b' | 'b2c' | 'hybrid';
  currentConversionRate: number;
  monthlyTraffic: number;
  primaryGoals: string[];
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  questionnaire: Record<string, any>;
}

export interface AutoConfiguredTest {
  id: string;
  name: string;
  description: string;
  templateId: string;
  customerId: string;
  configuration: TestConfiguration;
  variations: TestVariation[];
  status: 'configured' | 'launched' | 'running' | 'completed' | 'rolled_back';
  createdAt: Date;
  launchedAt?: Date;
}

export interface TestConfiguration {
  trafficAllocation: number;
  trafficSplit: Record<string, number>;
  duration: number;
  minimumSampleSize: number;
  confidenceLevel: number;
  targetMetrics: TargetMetric[];
}

export interface TestVariation {
  id: string;
  name: string;
  description: string;
  isControl: boolean;
  trafficAllocation: number;
  expectedLift: number;
}

export interface TargetMetric {
  name: string;
  type: 'conversion' | 'revenue' | 'engagement';
  isPrimary: boolean;
  targetImprovement: number;
}

export interface LaunchResult {
  success: boolean;
  testId: string;
  message: string;
  launchedAt: Date;
  warnings: string[];
  errors: string[];
}

export interface SafetyCheck {
  type: 'traffic' | 'duration' | 'conflict' | 'compliance' | 'performance';
  status: 'pass' | 'warning' | 'fail';
  message: string;
  recommendation?: string;
}

export interface PreLaunchValidation {
  isValid: boolean;
  safetyChecks: SafetyCheck[];
  warnings: string[];
  blockingIssues: string[];
}

export class ABTestAutoConfigurationService {
  constructor(private redis: Redis) {}

  async autoConfigureTest(
    customerId: string,
    templateId?: string,
    options: { autoLaunch?: boolean; skipSafetyChecks?: boolean } = {}
  ): Promise<AutoConfiguredTest> {

    const customerProfile = await this.getCustomerProfile(customerId);
    if (!customerProfile) {
      throw new Error(`Customer profile not found: ${customerId}`);
    }

    const selectedTemplateId = templateId || await this.selectOptimalTemplateAdvanced(customerProfile);
    const configuration = await this.generateTestConfiguration(customerProfile);
    const variations = await this.generateTestVariations(customerProfile);

    const autoTest: AutoConfiguredTest = {
      id: `auto_${customerId}_${Date.now()}`,
      name: `Auto Test - ${customerProfile.companyName}`,
      description: `Auto-configured test for ${customerProfile.industry} business`,
      templateId: selectedTemplateId,
      customerId,
      configuration,
      variations,
      status: 'configured',
      createdAt: new Date()
    };

    await this.storeAutoConfiguredTest(autoTest);

    if (options.autoLaunch) {
      if (!options.skipSafetyChecks) {
        const validation = await this.performPreLaunchValidation(autoTest, customerProfile);
        if (!validation.isValid) {
          throw new Error(`Launch blocked due to safety issues: ${validation.blockingIssues.join(', ')}`);
        }

        if (validation.warnings.length > 0) {
          await this.logSafetyWarnings(autoTest.id, validation.warnings);
        }
      }

      await this.launchTestWithSafety(autoTest.id);
    }

    return autoTest;
  }

  private async getCustomerProfile(customerId: string): Promise<CustomerProfile | null> {
    try {
      const data = await this.redis.hgetall(`customer:${customerId}:profile`);
      if (!data || !data.id) return null;

      return {
        id: data.id,
        companyName: data.companyName || 'Unknown Company',
        industry: data.industry || 'general',
        businessModel: (data.businessModel as any) || 'b2c',
        currentConversionRate: parseFloat(data.currentConversionRate) || 0.05,
        monthlyTraffic: parseInt(data.monthlyTraffic) || 10000,
        primaryGoals: JSON.parse(data.primaryGoals || '["conversion"]'),
        riskTolerance: (data.riskTolerance as any) || 'moderate',
        questionnaire: JSON.parse(data.questionnaire || '{}')
      };
    } catch (error) {
      console.error('Error getting customer profile:', error);
      return null;
    }
  }

  private async selectOptimalTemplateAdvanced(customerProfile: CustomerProfile): Promise<string> {
    try {
      const templateService = createABTestTemplateService(this.redis);
      const recommendations = await templateService.getRecommendedTemplates(customerProfile);

      if (recommendations.length > 0) {
        return recommendations[0].template.id;
      }
    } catch (error) {
      console.warn('Template service unavailable, falling back to basic selection');
    }

    const industryTemplates: Record<string, string> = {
      'saas': 'saas_trial_conversion',
      'ecommerce': 'ecommerce_checkout_optimization',
      'fintech': 'fintech_signup_flow',
      'healthcare': 'healthcare_conversion_optimization',
      'manufacturing': 'manufacturing_lead_optimization'
    };

    return industryTemplates[customerProfile.industry.toLowerCase()] || 'default_conversion_optimization';
  }

  private async generateTestConfiguration(customerProfile: CustomerProfile): Promise<TestConfiguration> {
    const sampleSize = this.calculateSampleSize(customerProfile);

    return {
      trafficAllocation: this.calculateTrafficAllocation(customerProfile),
      trafficSplit: { control: 50, variation_1: 50 },
      duration: this.calculateTestDuration(customerProfile, sampleSize),
      minimumSampleSize: sampleSize,
      confidenceLevel: this.getConfidenceLevel(customerProfile.riskTolerance),
      targetMetrics: [{
        name: 'conversion_rate',
        type: 'conversion',
        isPrimary: true,
        targetImprovement: 10
      }]
    };
  }

  private async generateTestVariations(customerProfile: CustomerProfile): Promise<TestVariation[]> {
    return [
      {
        id: 'control',
        name: 'Control (Original)',
        description: 'Current implementation',
        isControl: true,
        trafficAllocation: 50,
        expectedLift: 0
      },
      {
        id: 'variation_1',
        name: 'Optimized Version',
        description: `Optimized for ${customerProfile.industry}`,
        isControl: false,
        trafficAllocation: 50,
        expectedLift: 15
      }
    ];
  }

  private calculateSampleSize(customerProfile: CustomerProfile): number {
    const baselineRate = customerProfile.currentConversionRate || 0.05;
    const minimumDetectableEffect = 0.15;
    const sampleSize = Math.ceil(16 * Math.pow(baselineRate * (1 - baselineRate), 2) / Math.pow(minimumDetectableEffect, 2));
    return Math.max(sampleSize, 1000);
  }

  private calculateTrafficAllocation(customerProfile: CustomerProfile): number {
    if (customerProfile.riskTolerance === 'conservative') return 20;
    if (customerProfile.riskTolerance === 'moderate') return 50;
    return 80;
  }

  private calculateTestDuration(customerProfile: CustomerProfile, sampleSize: number): number {
    const dailyTraffic = customerProfile.monthlyTraffic / 30;
    const daysNeeded = Math.ceil(sampleSize / dailyTraffic);
    return Math.min(Math.max(daysNeeded, 7), 30);
  }

  private getConfidenceLevel(riskTolerance: string): number {
    switch (riskTolerance) {
      case 'conservative': return 0.99;
      case 'moderate': return 0.95;
      case 'aggressive': return 0.90;
      default: return 0.95;
    }
  }

  private async performPreLaunchValidation(
    autoTest: AutoConfiguredTest,
    customerProfile: CustomerProfile
  ): Promise<PreLaunchValidation> {
    const safetyChecks: SafetyCheck[] = [];
    const warnings: string[] = [];
    const blockingIssues: string[] = [];

    const trafficCheck = await this.validateTrafficRequirements(autoTest, customerProfile);
    safetyChecks.push(trafficCheck);
    if (trafficCheck.status === 'fail') {
      blockingIssues.push(trafficCheck.message);
    } else if (trafficCheck.status === 'warning') {
      warnings.push(trafficCheck.message);
    }

    const durationCheck = this.validateTestDuration(autoTest, customerProfile);
    safetyChecks.push(durationCheck);
    if (durationCheck.status === 'warning') {
      warnings.push(durationCheck.message);
    }

    const conflictCheck = await this.detectTestConflicts(autoTest, customerProfile);
    safetyChecks.push(conflictCheck);
    if (conflictCheck.status === 'fail') {
      blockingIssues.push(conflictCheck.message);
    } else if (conflictCheck.status === 'warning') {
      warnings.push(conflictCheck.message);
    }

    const performanceCheck = this.validatePerformanceImpact(autoTest, customerProfile);
    safetyChecks.push(performanceCheck);
    if (performanceCheck.status === 'warning') {
      warnings.push(performanceCheck.message);
    }

    const complianceCheck = this.validateCompliance(autoTest, customerProfile);
    safetyChecks.push(complianceCheck);
    if (complianceCheck.status === 'fail') {
      blockingIssues.push(complianceCheck.message);
    }

    return {
      isValid: blockingIssues.length === 0,
      safetyChecks,
      warnings,
      blockingIssues
    };
  }

  private async validateTrafficRequirements(
    autoTest: AutoConfiguredTest,
    customerProfile: CustomerProfile
  ): Promise<SafetyCheck> {
    const dailyTraffic = customerProfile.monthlyTraffic / 30;
    const requiredDailyTraffic = autoTest.configuration.minimumSampleSize / autoTest.configuration.duration;

    if (dailyTraffic < requiredDailyTraffic * 0.5) {
      return {
        type: 'traffic',
        status: 'fail',
        message: `Insufficient traffic: need ${Math.ceil(requiredDailyTraffic)} daily visitors, have ${Math.ceil(dailyTraffic)}`,
        recommendation: 'Reduce sample size requirements or extend test duration'
      };
    } else if (dailyTraffic < requiredDailyTraffic * 0.8) {
      return {
        type: 'traffic',
        status: 'warning',
        message: `Low traffic margin: test may take longer than expected`,
        recommendation: 'Consider extending test duration by 25%'
      };
    }

    return {
      type: 'traffic',
      status: 'pass',
      message: 'Traffic requirements satisfied'
    };
  }

  private validateTestDuration(
    autoTest: AutoConfiguredTest,
    customerProfile: CustomerProfile
  ): SafetyCheck {
    const duration = autoTest.configuration.duration;

    if (duration > 45) {
      return {
        type: 'duration',
        status: 'warning',
        message: `Test duration of ${duration} days is longer than recommended maximum of 45 days`,
        recommendation: 'Consider reducing sample size requirements or increasing traffic allocation'
      };
    } else if (duration < 7) {
      return {
        type: 'duration',
        status: 'warning',
        message: `Test duration of ${duration} days may not account for weekly seasonality`,
        recommendation: 'Consider extending to at least 14 days for more reliable results'
      };
    }

    return {
      type: 'duration',
      status: 'pass',
      message: 'Test duration is appropriate'
    };
  }

  private async detectTestConflicts(
    autoTest: AutoConfiguredTest,
    customerProfile: CustomerProfile
  ): Promise<SafetyCheck> {
    try {
      const runningTests = await this.getRunningTests(customerProfile.id);

      if (runningTests.length >= 3) {
        return {
          type: 'conflict',
          status: 'fail',
          message: `Too many concurrent tests: ${runningTests.length} already running (max 3)`,
          recommendation: 'Wait for current tests to complete or stop non-critical tests'
        };
      } else if (runningTests.length >= 2) {
        return {
          type: 'conflict',
          status: 'warning',
          message: `Multiple concurrent tests detected: ${runningTests.length} running`,
          recommendation: 'Monitor for interaction effects between tests'
        };
      }

      return {
        type: 'conflict',
        status: 'pass',
        message: 'No test conflicts detected'
      };
    } catch (error) {
      return {
        type: 'conflict',
        status: 'warning',
        message: 'Could not verify test conflicts',
        recommendation: 'Manual review recommended'
      };
    }
  }

  private validatePerformanceImpact(
    autoTest: AutoConfiguredTest,
    customerProfile: CustomerProfile
  ): SafetyCheck {
    const trafficAllocation = autoTest.configuration.trafficAllocation;

    if (trafficAllocation > 80) {
      return {
        type: 'performance',
        status: 'warning',
        message: `High traffic allocation (${trafficAllocation}%) may impact user experience`,
        recommendation: 'Consider reducing to 50% or less for safer testing'
      };
    }

    return {
      type: 'performance',
      status: 'pass',
      message: 'Performance impact within acceptable limits'
    };
  }

  private validateCompliance(
    autoTest: AutoConfiguredTest,
    customerProfile: CustomerProfile
  ): SafetyCheck {
    const highComplianceIndustries = ['healthcare', 'fintech', 'finance', 'government'];

    if (highComplianceIndustries.includes(customerProfile.industry.toLowerCase())) {
      return {
        type: 'compliance',
        status: 'warning',
        message: `${customerProfile.industry} industry may have special compliance requirements`,
        recommendation: 'Ensure test variations comply with industry regulations'
      };
    }

    return {
      type: 'compliance',
      status: 'pass',
      message: 'No special compliance requirements detected'
    };
  }

  private async getRunningTests(customerId: string): Promise<AutoConfiguredTest[]> {
    const testIds = await this.redis.smembers(`customer:${customerId}:tests`);
    const runningTests: AutoConfiguredTest[] = [];

    for (const testId of testIds) {
      const test = await this.getAutoConfiguredTest(testId);
      if (test && (test.status === 'launched' || test.status === 'running')) {
        runningTests.push(test);
      }
    }

    return runningTests;
  }

  private async logSafetyWarnings(testId: string, warnings: string[]): Promise<void> {
    const warningLog = {
      testId,
      warnings,
      timestamp: new Date().toISOString()
    };

    await this.redis.lpush(`safety_warnings:${testId}`, JSON.stringify(warningLog));
    await this.redis.expire(`safety_warnings:${testId}`, 30 * 24 * 60 * 60);
  }

  async launchTestWithSafety(testId: string): Promise<LaunchResult> {
    try {
      const autoTest = await this.getAutoConfiguredTest(testId);
      if (!autoTest) {
        throw new Error(`Test not found: ${testId}`);
      }

      autoTest.status = 'launched';
      autoTest.launchedAt = new Date();
      await this.storeAutoConfiguredTest(autoTest);

      await this.setupAutomatedMonitoring(testId);

      return {
        success: true,
        testId,
        message: 'Test launched successfully with safety monitoring enabled',
        launchedAt: new Date(),
        warnings: [],
        errors: []
      };
    } catch (error: any) {
      return {
        success: false,
        testId,
        message: `Launch failed: ${error.message}`,
        launchedAt: new Date(),
        warnings: [],
        errors: [error.message]
      };
    }
  }

  private async setupAutomatedMonitoring(testId: string): Promise<void> {
    const monitoringConfig = {
      testId,
      checkInterval: 60 * 60,
      enabled: true,
      alertThresholds: {
        maxErrorRate: 0.05,
        minConversionRate: 0.001,
        maxPerformanceImpact: 0.15
      },
      createdAt: new Date().toISOString()
    };

    await this.redis.setex(
      `monitoring:${testId}`,
      7 * 24 * 60 * 60,
      JSON.stringify(monitoringConfig)
    );
  }

  async rollbackTestWithSafety(testId: string, reason: string, automatic = false): Promise<{ success: boolean; message: string }> {
    try {
      const autoTest = await this.getAutoConfiguredTest(testId);
      if (!autoTest) {
        throw new Error(`Test not found: ${testId}`);
      }

      const rollbackMetadata = {
        reason,
        automatic,
        originalStatus: autoTest.status,
        rolledBackAt: new Date().toISOString(),
        testDuration: autoTest.launchedAt ?
          Math.round((Date.now() - autoTest.launchedAt.getTime()) / (1000 * 60 * 60)) : 0
      };

      autoTest.status = 'rolled_back';
      await this.storeAutoConfiguredTest(autoTest);

      await this.redis.setex(
        `rollback:${testId}`,
        30 * 24 * 60 * 60,
        JSON.stringify(rollbackMetadata)
      );

      await this.redis.del(`monitoring:${testId}`);

      return {
        success: true,
        message: `Test rolled back: ${reason}${automatic ? ' (automatic)' : ''}`
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Rollback failed: ${error.message}`
      };
    }
  }

  async getCustomerTests(customerId: string): Promise<AutoConfiguredTest[]> {
    const testIds = await this.redis.smembers(`customer:${customerId}:tests`);
    const tests: AutoConfiguredTest[] = [];

    for (const testId of testIds) {
      const test = await this.getAutoConfiguredTest(testId);
      if (test) tests.push(test);
    }

    return tests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  private async storeAutoConfiguredTest(autoTest: AutoConfiguredTest): Promise<void> {
    await this.redis.hset(`auto_test:${autoTest.id}`, {
      ...autoTest,
      configuration: JSON.stringify(autoTest.configuration),
      variations: JSON.stringify(autoTest.variations),
      createdAt: autoTest.createdAt.toISOString(),
      launchedAt: autoTest.launchedAt?.toISOString() || ''
    });

    await this.redis.sadd(`customer:${autoTest.customerId}:tests`, autoTest.id);
  }

  private async getAutoConfiguredTest(testId: string): Promise<AutoConfiguredTest | null> {
    const data = await this.redis.hgetall(`auto_test:${testId}`);
    if (!data || !data.id) return null;

    return {
      ...data,
      configuration: JSON.parse(data.configuration),
      variations: JSON.parse(data.variations),
      createdAt: new Date(data.createdAt),
      launchedAt: data.launchedAt ? new Date(data.launchedAt) : undefined
    } as AutoConfiguredTest;
  }

  // Backward compatibility methods
  async launchTest(testId: string): Promise<LaunchResult> {
    return this.launchTestWithSafety(testId);
  }

  async rollbackTest(testId: string, reason: string): Promise<{ success: boolean; message: string }> {
    return this.rollbackTestWithSafety(testId, reason, false);
  }

  // API methods for safety features
  async validateTestSafety(testId: string): Promise<PreLaunchValidation> {
    const autoTest = await this.getAutoConfiguredTest(testId);
    if (!autoTest) {
      throw new Error(`Test not found: ${testId}`);
    }

    const customerProfile = await this.getCustomerProfile(autoTest.customerId);
    if (!customerProfile) {
      throw new Error(`Customer profile not found: ${autoTest.customerId}`);
    }

    return this.performPreLaunchValidation(autoTest, customerProfile);
  }

  async getSafetyWarnings(testId: string): Promise<any[]> {
    const warnings = await this.redis.lrange(`safety_warnings:${testId}`, 0, -1);
    return warnings.map(warning => JSON.parse(warning));
  }

  async getMonitoringStatus(testId: string): Promise<any> {
    const monitoringData = await this.redis.get(`monitoring:${testId}`);
    return monitoringData ? JSON.parse(monitoringData) : null;
  }

  async getRollbackMetadata(testId: string): Promise<any> {
    const rollbackData = await this.redis.get(`rollback:${testId}`);
    return rollbackData ? JSON.parse(rollbackData) : null;
  }
}

export function createABTestAutoConfigurationService(redisClient: Redis): ABTestAutoConfigurationService {
  return new ABTestAutoConfigurationService(redisClient);
}
