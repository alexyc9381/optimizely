import { Redis } from 'ioredis';

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

export class ABTestAutoConfigurationService {
  constructor(private redis: Redis) {}

  async autoConfigureTest(
    customerId: string, 
    templateId?: string,
    options: { autoLaunch?: boolean } = {}
  ): Promise<AutoConfiguredTest> {
    
    const customerProfile = await this.getCustomerProfile(customerId);
    if (!customerProfile) {
      throw new Error(`Customer profile not found: ${customerId}`);
    }

    const selectedTemplateId = templateId || await this.selectOptimalTemplate(customerProfile);
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
      await this.launchTest(autoTest.id);
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

  private async selectOptimalTemplate(customerProfile: CustomerProfile): Promise<string> {
    const industryTemplates: Record<string, string> = {
      'saas': 'saas_trial_conversion',
      'ecommerce': 'ecommerce_checkout_optimization',
      'fintech': 'fintech_signup_flow'
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

  async launchTest(testId: string): Promise<LaunchResult> {
    try {
      const autoTest = await this.getAutoConfiguredTest(testId);
      if (!autoTest) {
        throw new Error(`Test not found: ${testId}`);
      }

      autoTest.status = 'launched';
      autoTest.launchedAt = new Date();
      await this.storeAutoConfiguredTest(autoTest);

      return {
        success: true,
        testId,
        message: 'Test launched successfully',
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

  async rollbackTest(testId: string, reason: string): Promise<{ success: boolean; message: string }> {
    try {
      const autoTest = await this.getAutoConfiguredTest(testId);
      if (!autoTest) {
        throw new Error(`Test not found: ${testId}`);
      }

      autoTest.status = 'rolled_back';
      await this.storeAutoConfiguredTest(autoTest);

      return {
        success: true,
        message: `Test rolled back: ${reason}`
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
}

export function createABTestAutoConfigurationService(redisClient: Redis): ABTestAutoConfigurationService {
  return new ABTestAutoConfigurationService(redisClient);
}
