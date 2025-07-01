/**
 * Test Suite for Multi-Industry Pipeline Management Service
 * 
 * Tests comprehensive customer journey tracking across multiple industries
 * with industry-specific lifecycle analytics and universal API.
 */

import MultiIndustryPipelineManagementService, { 
  Industry, 
  PipelineStage, 
  CustomerJourney,
  StakeholderData,
  CriticalDate 
} from '../multi-industry-pipeline-management-service';

describe('MultiIndustryPipelineManagementService', () => {
  let service: MultiIndustryPipelineManagementService;
  const mockCustomerId = 'test-customer-123';

  beforeEach(() => {
    service = MultiIndustryPipelineManagementService.getInstance();
    // Clear any existing journeys for clean tests
    (service as any).journeys.clear();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = MultiIndustryPipelineManagementService.getInstance();
      const instance2 = MultiIndustryPipelineManagementService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should initialize analytics for all industries', () => {
      Object.values(Industry).forEach(industry => {
        const analytics = service.getIndustryAnalytics(industry);
        expect(analytics).toBeDefined();
        expect(analytics?.conversionRates).toBeDefined();
      });
    });
  });

  describe('Journey Creation', () => {
    it('should create a SaaS journey with correct initial stage', async () => {
      const journey = await service.createJourney(mockCustomerId, Industry.SAAS);
      
      expect(journey.customerId).toBe(mockCustomerId);
      expect(journey.industry).toBe(Industry.SAAS);
      expect(journey.currentStage).toBe(PipelineStage.AWARENESS);
      expect(journey.conversionProbability).toBe(0.15);
    });

    it('should create different industry journeys', async () => {
      const saasJourney = await service.createJourney('saas-customer', Industry.SAAS);
      const mfgJourney = await service.createJourney('mfg-customer', Industry.MANUFACTURING);
      
      expect(saasJourney.conversionProbability).toBe(0.15);
      expect(mfgJourney.conversionProbability).toBe(0.25);
    });
  });

  describe('Stage Advancement', () => {
    beforeEach(async () => {
      await service.createJourney(mockCustomerId, Industry.SAAS);
    });

    it('should advance through SaaS stages', async () => {
      const journey = await service.advanceStage(
        mockCustomerId, 
        PipelineStage.TRIAL_SIGNUP
      );
      
      expect(journey.currentStage).toBe(PipelineStage.TRIAL_SIGNUP);
      expect(journey.stages).toHaveLength(2);
    });

    it('should throw error for invalid stage', async () => {
      await expect(
        service.advanceStage(mockCustomerId, PipelineStage.RFQ_SUBMISSION)
      ).rejects.toThrow('Invalid stage rfq_submission for industry saas');
    });
  });

  describe('Stakeholder Management', () => {
    beforeEach(async () => {
      await service.createJourney(mockCustomerId, Industry.SAAS);
    });

    it('should add stakeholder to journey', async () => {
      const stakeholder: StakeholderData = {
        stakeholderId: 'stakeholder-1',
        role: 'decision_maker',
        influence: 85,
        engagement: 70,
        lastInteraction: new Date().toISOString()
      };

      const journey = await service.addStakeholder(mockCustomerId, stakeholder);
      
      expect(journey.stakeholders).toHaveLength(1);
      expect(journey.stakeholders[0]).toEqual(stakeholder);
    });
  });

  describe('Critical Date Management', () => {
    beforeEach(async () => {
      await service.createJourney(mockCustomerId, Industry.COLLEGE_CONSULTING);
    });

    it('should add critical date to journey', async () => {
      const criticalDate: CriticalDate = {
        dateType: 'application_deadline',
        date: new Date().toISOString(),
        urgency: 80,
        industryContext: 'college_application',
        description: 'Application deadline'
      };

      const journey = await service.addCriticalDate(mockCustomerId, criticalDate);
      
      expect(journey.criticalDates).toHaveLength(1);
      expect(journey.criticalDates[0]).toEqual(criticalDate);
    });
  });

  describe('Analytics Integration', () => {
    beforeEach(async () => {
      await service.createJourney(mockCustomerId, Industry.SAAS);
    });

    it('should update analytics when advancing stages', async () => {
      await service.advanceStage(mockCustomerId, PipelineStage.TRIAL_SIGNUP);
      
      const analytics = service.getIndustryAnalytics(Industry.SAAS)!;
      expect(analytics.conversionRates['awareness_to_trial_signup']).toBeDefined();
    });
  });
});
