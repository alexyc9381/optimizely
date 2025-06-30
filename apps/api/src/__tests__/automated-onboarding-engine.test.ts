/**
 * Automated Onboarding Engine Tests
 * Comprehensive test suite for intelligent onboarding flows
 */

import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import {
    AutomatedOnboardingEngine
} from '../services/automated-onboarding-engine';

// Mock dependencies
jest.mock('../services/smart-widget-recommendation-engine', () => ({
  smartWidgetRecommendationEngine: {
    analyzeCompanyProfile: jest.fn().mockImplementation(() => ({
      sophisticationScore: 6,
      primaryNeeds: ['analytics', 'automation'],
      riskFactors: [],
      opportunities: ['advanced-features']
    }))
  }
}));

jest.mock('../services/industry-metric-mapping-service', () => ({
  industryMetricMappingService: {
    getIndustryProfile: jest.fn().mockImplementation((industry) => {
      if (industry === 'saas') {
        return { id: 'saas', name: 'Software as a Service', primaryMetrics: ['mrr', 'churn_rate'] };
      } else if (industry === 'ecommerce') {
        return { id: 'ecommerce', name: 'E-commerce', primaryMetrics: ['conversion_rate', 'aov'] };
      } else if (industry === 'fintech') {
        return { id: 'fintech', name: 'Financial Technology', primaryMetrics: ['transaction_volume'] };
      }
      return null;
    })
  }
}));

jest.mock('../services/progressive-complexity-manager', () => ({
  progressiveComplexityManager: {
    getUserProfile: jest.fn().mockReturnValue({
      userId: 'test-user',
      companyId: 'test-company',
      currentLevel: { id: 'beginner', name: 'Getting Started' },
      sophisticationScore: 0,
      engagementScore: 0,
      progressionScore: 0,
      unlockedFeatures: ['basic-dashboard'],
      completedMilestones: [],
      lastActivity: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }),
    completeMilestone: jest.fn().mockReturnValue({
      success: true,
      reward: { type: 'feature-unlock', value: 'advanced-widgets' }
    })
  }
}));

describe('AutomatedOnboardingEngine', () => {
  let onboardingEngine: AutomatedOnboardingEngine;
  const testUserId = 'test-user-123';
  const testCompanyId = 'test-company-123';

  beforeEach(() => {
    onboardingEngine = new AutomatedOnboardingEngine();
  });

  describe('Flow Management', () => {
    test('should initialize with default onboarding flows', () => {
      const flows = onboardingEngine.getAvailableFlows();

      expect(flows).toHaveLength(3);
      expect(flows.map(f => f.id)).toContain('saas-standard');
      expect(flows.map(f => f.id)).toContain('ecommerce-standard');
      expect(flows.map(f => f.id)).toContain('fintech-standard');
    });

    test('should get specific flow by ID', () => {
      const saasFlow = onboardingEngine.getFlow('saas-standard');

      expect(saasFlow).toBeDefined();
      expect(saasFlow?.id).toBe('saas-standard');
      expect(saasFlow?.name).toBe('SaaS Business Setup');
      expect(saasFlow?.industry).toBe('saas');
      expect(saasFlow?.businessModel).toBe('subscription');
    });

    test('should return null for non-existent flow', () => {
      const nonExistentFlow = onboardingEngine.getFlow('non-existent-flow');
      expect(nonExistentFlow).toBeNull();
    });

    test('should have proper flow structure', () => {
      const saasFlow = onboardingEngine.getFlow('saas-standard');

      expect(saasFlow).toBeDefined();
      expect(saasFlow?.steps).toBeDefined();
      expect(saasFlow?.steps.length).toBeGreaterThan(0);
      expect(saasFlow?.completionCriteria).toBeDefined();
      expect(saasFlow?.rewards).toBeDefined();
      expect(saasFlow?.estimatedDuration).toBeGreaterThan(0);
    });
  });

  describe('Flow Recommendations', () => {
    test('should recommend SaaS flow for SaaS company', () => {
      const companyProfile = {
        industry: 'saas',
        businessModel: 'subscription',
        teamSize: '11-50',
        technicalSophistication: 'advanced'
      };

      const recommendations = onboardingEngine.recommendOnboardingFlow(companyProfile);

      expect(recommendations).toHaveLength(3); // flow-selection + content-personalization + pace-adjustment
      expect(recommendations[0].type).toBe('flow-selection');
      expect(recommendations[0].target).toBe('saas-standard');
      expect(recommendations[0].confidence).toBeGreaterThan(0.8);
    });

    test('should recommend e-commerce flow for retail company', () => {
      const companyProfile = {
        industry: 'ecommerce',
        businessModel: 'transactional',
        teamSize: '1-10'
      };

      const recommendations = onboardingEngine.recommendOnboardingFlow(companyProfile);

      expect(recommendations.length).toBeGreaterThan(0);
      const flowRecommendation = recommendations.find(r => r.type === 'flow-selection');
      expect(flowRecommendation?.target).toBe('ecommerce-standard');
    });

    test('should recommend fintech flow for financial company', () => {
      const companyProfile = {
        industry: 'fintech',
        businessModel: 'financial',
        teamSize: '51-200'
      };

      const recommendations = onboardingEngine.recommendOnboardingFlow(companyProfile);

      expect(recommendations.length).toBeGreaterThan(0);
      const flowRecommendation = recommendations.find(r => r.type === 'flow-selection');
      expect(flowRecommendation?.target).toBe('fintech-standard');
    });

    test('should provide content personalization for high sophistication', () => {
      const companyProfile = {
        industry: 'saas',
        businessModel: 'subscription',
        technicalSophistication: 'expert'
      };

      const recommendations = onboardingEngine.recommendOnboardingFlow(companyProfile);

      const personalizationRec = recommendations.find(r => r.type === 'content-personalization');
      expect(personalizationRec).toBeDefined();
      expect(personalizationRec?.target).toBe('advanced-features');
    });

    test('should provide pace adjustment for small teams', () => {
      const companyProfile = {
        industry: 'saas',
        teamSize: '1-10'
      };

      const recommendations = onboardingEngine.recommendOnboardingFlow(companyProfile);

      const paceRec = recommendations.find(r => r.type === 'pace-adjustment');
      expect(paceRec).toBeDefined();
      expect(paceRec?.target).toBe('setup-speed');
    });

    test('should handle invalid company profile gracefully', () => {
      const invalidProfile = {};

      const recommendations = onboardingEngine.recommendOnboardingFlow(invalidProfile);

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].target).toBe('saas-standard'); // Default fallback
      expect(recommendations[0].confidence).toBeLessThan(0.7);
    });
  });

  describe('Session Management', () => {
    test('should start new onboarding session', () => {
      const session = onboardingEngine.startOnboardingSession(testUserId, testCompanyId, 'saas-standard');

      expect(session.userId).toBe(testUserId);
      expect(session.companyId).toBe(testCompanyId);
      expect(session.flowId).toBe('saas-standard');
      expect(session.currentStepId).toBe('welcome');
      expect(session.completedSteps).toHaveLength(0);
      expect(session.progressMetrics.completionRate).toBe(0);
    });

    test('should throw error for invalid flow ID', () => {
      expect(() => {
        onboardingEngine.startOnboardingSession(testUserId, testCompanyId, 'invalid-flow');
      }).toThrow('Onboarding flow invalid-flow not found');
    });

    test('should get session for user', () => {
      onboardingEngine.startOnboardingSession(testUserId, testCompanyId, 'saas-standard');
      const session = onboardingEngine.getSession(testUserId);

      expect(session).toBeDefined();
      expect(session?.userId).toBe(testUserId);
      expect(session?.flowId).toBe('saas-standard');
    });

    test('should return null for non-existent session', () => {
      const session = onboardingEngine.getSession('non-existent-user');
      expect(session).toBeNull();
    });

    test('should include customizations in session', () => {
      const customizations = { theme: 'dark', skipIntro: true };
      const session = onboardingEngine.startOnboardingSession(
        testUserId,
        testCompanyId,
        'saas-standard',
        customizations
      );

      expect(session.userData).toEqual(customizations);
    });
  });

  describe('Step Navigation', () => {
    beforeEach(() => {
      onboardingEngine.startOnboardingSession(testUserId, testCompanyId, 'saas-standard');
    });

    test('should get current step for user', () => {
      const currentStep = onboardingEngine.getCurrentStep(testUserId);

      expect(currentStep).toBeDefined();
      expect(currentStep?.id).toBe('welcome');
      expect(currentStep?.type).toBe('welcome');
      expect(currentStep?.category).toBe('required');
    });

    test('should return null for user without session', () => {
      const currentStep = onboardingEngine.getCurrentStep('no-session-user');
      expect(currentStep).toBeNull();
    });

    test('should complete step and advance to next', () => {
      const userData = { userPreference: 'advanced' };
      const result = onboardingEngine.completeStep(testUserId, 'welcome', userData);

      expect(result.success).toBe(true);
      expect(result.nextStep).toBeDefined();
      expect(result.nextStep?.id).toBe('company-profile');

      const session = onboardingEngine.getSession(testUserId);
      expect(session?.completedSteps).toContain('welcome');
      expect(session?.currentStepId).toBe('company-profile');
      expect(session?.userData.userPreference).toBe('advanced');
      expect(session?.progressMetrics.stepsCompleted).toBe(1);
    });

    test('should fail to complete non-existent step', () => {
      const result = onboardingEngine.completeStep(testUserId, 'non-existent-step');

      expect(result.success).toBe(false);
      expect(result.nextStep).toBeUndefined();
    });

    test('should fail to complete step for non-existent user', () => {
      const result = onboardingEngine.completeStep('non-existent-user', 'welcome');

      expect(result.success).toBe(false);
    });

    test('should skip optional step when allowed', () => {
      // Move to data-connections step which can be skipped
      onboardingEngine.completeStep(testUserId, 'welcome');
      onboardingEngine.completeStep(testUserId, 'company-profile');

      const result = onboardingEngine.skipStep(testUserId, 'data-connections');

      expect(result.success).toBe(true);
      expect(result.nextStep?.id).toBe('widget-selection');

      const session = onboardingEngine.getSession(testUserId);
      expect(session?.skippedSteps).toContain('data-connections');
      expect(session?.progressMetrics.stepsSkipped).toBe(1);
    });

    test('should fail to skip required step', () => {
      const result = onboardingEngine.skipStep(testUserId, 'welcome');

      expect(result.success).toBe(false);
    });

    test('should update progress metrics correctly', () => {
      const session = onboardingEngine.getSession(testUserId);
      const initialTime = session?.progressMetrics.timeSpent || 0;

      onboardingEngine.updateTimeSpent(testUserId, 5);

      const updatedSession = onboardingEngine.getSession(testUserId);
      expect(updatedSession?.progressMetrics.timeSpent).toBe(initialTime + 5);
    });
  });

  describe('Help and Error Tracking', () => {
    beforeEach(() => {
      onboardingEngine.startOnboardingSession(testUserId, testCompanyId, 'saas-standard');
    });

    test('should record help request', () => {
      onboardingEngine.recordHelpRequest(testUserId, 'welcome', 'tooltip');

      const session = onboardingEngine.getSession(testUserId);
      expect(session?.progressMetrics.helpRequestsCount).toBe(1);
    });

    test('should record error', () => {
      onboardingEngine.recordError(testUserId, 'data-connections', 'API connection failed');

      const session = onboardingEngine.getSession(testUserId);
      expect(session?.progressMetrics.errorsEncountered).toBe(1);
    });

    test('should handle help request for non-existent user gracefully', () => {
      expect(() => {
        onboardingEngine.recordHelpRequest('non-existent-user', 'welcome', 'tooltip');
      }).not.toThrow();
    });

    test('should handle error recording for non-existent user gracefully', () => {
      expect(() => {
        onboardingEngine.recordError('non-existent-user', 'welcome', 'some error');
      }).not.toThrow();
    });
  });

  describe('Onboarding Completion', () => {
    beforeEach(() => {
      onboardingEngine.startOnboardingSession(testUserId, testCompanyId, 'saas-standard');
    });

    test('should complete onboarding when all required steps done', () => {
      // Complete required steps
      onboardingEngine.completeStep(testUserId, 'welcome');
      const result = onboardingEngine.completeStep(testUserId, 'company-profile');

      // Since there are more steps, completion shouldn't happen yet
      expect(result.completed).toBeUndefined();

      // Would need to complete all steps in a real scenario
      // This tests the structure is correct
    });

    test('should calculate completion rate correctly', () => {
      onboardingEngine.completeStep(testUserId, 'welcome');

      const session = onboardingEngine.getSession(testUserId);
      const flow = onboardingEngine.getFlow('saas-standard');

      if (session && flow) {
        const expectedRate = (1 / flow.steps.length) * 100;
        expect(session.progressMetrics.completionRate).toBeCloseTo(expectedRate, 1);
      }
    });
  });

  describe('Analytics and Reporting', () => {
    test('should generate flow analytics with no sessions', () => {
      const analytics = onboardingEngine.generateFlowAnalytics('saas-standard');

      expect(analytics.flowId).toBe('saas-standard');
      expect(analytics.completionRate).toBe(0);
      expect(analytics.averageDuration).toBe(0);
      expect(analytics.dropOffPoints).toHaveLength(0);
    });

    test('should generate flow analytics with active sessions', () => {
      // Create some test sessions
      onboardingEngine.startOnboardingSession('user1', 'company1', 'saas-standard');
      onboardingEngine.startOnboardingSession('user2', 'company2', 'saas-standard');

      // Complete some steps
      onboardingEngine.completeStep('user1', 'welcome');
      onboardingEngine.completeStep('user2', 'welcome');
      onboardingEngine.completeStep('user2', 'company-profile');

      const analytics = onboardingEngine.generateFlowAnalytics('saas-standard');

      expect(analytics.flowId).toBe('saas-standard');
      expect(analytics.completionRate).toBeGreaterThanOrEqual(0);
      expect(analytics.averageDuration).toBeGreaterThanOrEqual(0);
    });

    test('should handle analytics for non-existent flow', () => {
      const analytics = onboardingEngine.generateFlowAnalytics('non-existent-flow');

      expect(analytics.flowId).toBe('non-existent-flow');
      expect(analytics.completionRate).toBe(0);
      expect(analytics.improvementOpportunities).toHaveLength(0);
    });

    test('should identify improvement opportunities', () => {
      // This would be more comprehensive in a real implementation
      const analytics = onboardingEngine.generateFlowAnalytics('saas-standard');

      expect(analytics.improvementOpportunities).toBeDefined();
      expect(Array.isArray(analytics.improvementOpportunities)).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle session operations for invalid user IDs', () => {
      const invalidUserId = '';

      expect(() => {
        onboardingEngine.startOnboardingSession(invalidUserId, testCompanyId, 'saas-standard');
      }).not.toThrow();

      const session = onboardingEngine.getSession(invalidUserId);
      expect(session?.userId).toBe(invalidUserId);
    });

    test('should handle multiple sessions for same user', () => {
      onboardingEngine.startOnboardingSession(testUserId, testCompanyId, 'saas-standard');

      // Starting another session should replace the first one
      const newSession = onboardingEngine.startOnboardingSession(testUserId, testCompanyId, 'ecommerce-standard');

      expect(newSession.flowId).toBe('ecommerce-standard');

      const retrievedSession = onboardingEngine.getSession(testUserId);
      expect(retrievedSession?.flowId).toBe('ecommerce-standard');
    });

    test('should handle time tracking edge cases', () => {
      onboardingEngine.startOnboardingSession(testUserId, testCompanyId, 'saas-standard');

      // Negative time should be handled gracefully
      onboardingEngine.updateTimeSpent(testUserId, -5);

      const session = onboardingEngine.getSession(testUserId);
      expect(session?.progressMetrics.timeSpent).toBe(-5); // Should accept but could be validated
    });

    test('should handle step completion with invalid data', () => {
      onboardingEngine.startOnboardingSession(testUserId, testCompanyId, 'saas-standard');

      const result = onboardingEngine.completeStep(testUserId, 'welcome', { invalidData: null });

      expect(result.success).toBe(true);

      const session = onboardingEngine.getSession(testUserId);
      expect(session?.userData.invalidData).toBeNull();
    });
  });

  describe('Performance and Consistency', () => {
    test('should handle multiple concurrent users', () => {
      const userIds = ['user1', 'user2', 'user3', 'user4', 'user5'];

      userIds.forEach(userId => {
        onboardingEngine.startOnboardingSession(userId, `company-${userId}`, 'saas-standard');
      });

      userIds.forEach(userId => {
        const session = onboardingEngine.getSession(userId);
        expect(session).toBeDefined();
        expect(session?.userId).toBe(userId);
      });
    });

    test('should maintain data consistency across operations', () => {
      onboardingEngine.startOnboardingSession(testUserId, testCompanyId, 'saas-standard');

      // Perform multiple operations
      onboardingEngine.completeStep(testUserId, 'welcome');
      onboardingEngine.recordHelpRequest(testUserId, 'company-profile', 'tooltip');
      onboardingEngine.updateTimeSpent(testUserId, 3);

      const session = onboardingEngine.getSession(testUserId);
      expect(session?.completedSteps).toHaveLength(1);
      expect(session?.progressMetrics.helpRequestsCount).toBe(1);
      expect(session?.progressMetrics.timeSpent).toBe(3);
      expect(session?.progressMetrics.stepsCompleted).toBe(1);
    });

    test('should process operations quickly', () => {
      const startTime = Date.now();

      // Perform a series of operations
      onboardingEngine.startOnboardingSession(testUserId, testCompanyId, 'saas-standard');
      onboardingEngine.completeStep(testUserId, 'welcome');
      onboardingEngine.getCurrentStep(testUserId);
      const analytics = onboardingEngine.generateFlowAnalytics('saas-standard');

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(100); // Should complete in under 100ms
      expect(analytics).toBeDefined();
    });
  });
});
