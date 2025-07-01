/**
 * Test Suite for Stakeholder Influence Analytics Service
 *
 * Tests comprehensive stakeholder influence tracking, engagement analytics,
 * and decision-making influence measurement across multiple industries.
 */

import StakeholderInfluenceAnalyticsService, {
    EngagementType,
    EnhancedStakeholderData,
    InfluenceLevel,
    StakeholderRole
} from '../stakeholder-influence-analytics-service';

import { Industry } from '../multi-industry-pipeline-management-service';

describe('StakeholderInfluenceAnalyticsService', () => {
  let service: StakeholderInfluenceAnalyticsService;
  const mockCustomerId = 'test-customer-analytics-123';

  beforeEach(() => {
    service = StakeholderInfluenceAnalyticsService.getInstance();
    // Clear any existing networks for clean tests
    (service as any).stakeholderNetworks.clear();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = StakeholderInfluenceAnalyticsService.getInstance();
      const instance2 = StakeholderInfluenceAnalyticsService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should initialize analytics for all industries', () => {
      Object.values(Industry).forEach(industry => {
        const analytics = service.getIndustryAnalytics(industry);
        expect(analytics).toBeDefined();
        expect(analytics?.industryBenchmarks).toBeDefined();
      });
    });
  });

  describe('Stakeholder Network Management', () => {
    it('should initialize empty stakeholder network', async () => {
      const network = await service.initializeStakeholderNetwork(
        mockCustomerId,
        Industry.SAAS
      );

      expect(network.customerId).toBe(mockCustomerId);
      expect(network.stakeholders.size).toBe(0);
      expect(network.networkHealth).toBe('weak');
      expect(network.networkStrength).toBe(0);
    });

    it('should initialize network with initial stakeholders', async () => {
      const initialStakeholders: EnhancedStakeholderData[] = [
        {
          stakeholderId: 'test-stakeholder-1',
          role: StakeholderRole.TECHNICAL_CHAMPION,
          influence: 75,
          engagement: 60,
          lastInteraction: new Date().toISOString(),
          seniority: 'senior',
          decisionMakingPower: 70,
          budgetInfluence: 20,
          technicalInfluence: 90,
          politicalInfluence: 40,
          overallInfluenceScore: 65,
          influenceLevel: InfluenceLevel.HIGH,
          engagementHistory: [],
          interactionHistory: [],
          relationshipStrength: 70,
          advocacyLevel: 65,
          riskScore: 30,
          communicationPreference: 'email',
          timezone: 'UTC',
          industrySpecificData: {},
          engagementTrend: 'stable',
          lastEngagementDate: new Date().toISOString(),
          predictionScore: 70
        }
      ];

      const network = await service.initializeStakeholderNetwork(
        mockCustomerId,
        Industry.SAAS,
        initialStakeholders
      );

      expect(network.stakeholders.size).toBe(1);
      expect(network.networkHealth).toBe('moderate');
      expect(network.champions.length).toBe(1);
    });
  });

  describe('Enhanced Stakeholder Management', () => {
    beforeEach(async () => {
      await service.initializeStakeholderNetwork(mockCustomerId, Industry.SAAS);
    });

    it('should add enhanced stakeholder with calculated metrics', async () => {
      const stakeholderData = {
        stakeholderId: 'saas-decision-maker-1',
        role: StakeholderRole.DECISION_MAKER,
        seniority: 'executive' as const,
        department: 'Engineering',
        location: 'San Francisco'
      };

      const stakeholder = await service.addEnhancedStakeholder(
        mockCustomerId,
        stakeholderData,
        Industry.SAAS
      );

      expect(stakeholder.stakeholderId).toBe('saas-decision-maker-1');
      expect(stakeholder.role).toBe(StakeholderRole.DECISION_MAKER);
      expect(stakeholder.overallInfluenceScore).toBeGreaterThan(0);
      expect(stakeholder.influenceLevel).toBeDefined();
      expect(stakeholder.decisionMakingPower).toBeGreaterThan(0);
      expect(stakeholder.predictionScore).toBeGreaterThan(0);
    });

    it('should calculate industry-specific influence scores', async () => {
      // SaaS Technical Champion
      const saasStakeholder = await service.addEnhancedStakeholder(
        mockCustomerId,
        { role: StakeholderRole.TECHNICAL_CHAMPION },
        Industry.SAAS
      );

      // Manufacturing Engineer
      const mfgStakeholder = await service.addEnhancedStakeholder(
        'mfg-customer',
        { role: StakeholderRole.ENGINEER },
        Industry.MANUFACTURING
      );

      // Initialize manufacturing network
      await service.initializeStakeholderNetwork('mfg-customer', Industry.MANUFACTURING);
      await service.addEnhancedStakeholder(
        'mfg-customer',
        { role: StakeholderRole.ENGINEER },
        Industry.MANUFACTURING
      );

      expect(saasStakeholder.technicalInfluence).toBe(90);
      expect(mfgStakeholder.technicalInfluence).toBe(90);
      // Different decision making power based on industry weights
      expect(saasStakeholder.decisionMakingPower).not.toBe(mfgStakeholder.decisionMakingPower);
    });

    it('should handle different stakeholder roles correctly', async () => {
      const roles = [
        StakeholderRole.BUDGET_OWNER,
        StakeholderRole.TECHNICAL_CHAMPION,
        StakeholderRole.END_USER,
        StakeholderRole.GATEKEEPER
      ];

      for (const role of roles) {
        const stakeholder = await service.addEnhancedStakeholder(
          mockCustomerId,
          { role, stakeholderId: `test-${role}` },
          Industry.SAAS
        );

        expect(stakeholder.role).toBe(role);
        expect(stakeholder.overallInfluenceScore).toBeGreaterThan(0);
        expect(stakeholder.influenceLevel).toBeDefined();
      }

      const network = service.getStakeholderNetwork(mockCustomerId);
      expect(network?.stakeholders.size).toBe(roles.length);
    });
  });

  describe('Engagement Tracking', () => {
    let stakeholderId: string;

    beforeEach(async () => {
      await service.initializeStakeholderNetwork(mockCustomerId, Industry.SAAS);
      const stakeholder = await service.addEnhancedStakeholder(
        mockCustomerId,
        { role: StakeholderRole.DECISION_MAKER },
        Industry.SAAS
      );
      stakeholderId = stakeholder.stakeholderId;
    });

    it('should record engagement events', async () => {
      const engagement = {
        type: EngagementType.DEMO_ATTENDED,
        duration: 60,
        sourceChannel: 'sales_team',
        metadata: { demo_type: 'product_overview' }
      };

      await service.recordEngagement(
        mockCustomerId,
        stakeholderId,
        engagement,
        Industry.SAAS
      );

      const network = service.getStakeholderNetwork(mockCustomerId);
      const stakeholder = network?.stakeholders.get(stakeholderId);

      expect(stakeholder?.engagementHistory.length).toBe(1);
      expect(stakeholder?.engagementHistory[0].type).toBe(EngagementType.DEMO_ATTENDED);
      expect(stakeholder?.engagement).toBeGreaterThan(0);
    });

    it('should calculate engagement scores correctly', async () => {
      const highValueEngagement = {
        type: EngagementType.PROPOSAL_REVIEWED,
        sourceChannel: 'email'
      };

      const lowValueEngagement = {
        type: EngagementType.EMAIL_OPEN,
        sourceChannel: 'email'
      };

      await service.recordEngagement(
        mockCustomerId,
        stakeholderId,
        highValueEngagement,
        Industry.SAAS
      );

      const network1 = service.getStakeholderNetwork(mockCustomerId);
      const stakeholder1 = network1?.stakeholders.get(stakeholderId);
      const highEngagementScore = stakeholder1?.engagement || 0;

      // Reset engagement for comparison
      stakeholder1!.engagement = 0;
      stakeholder1!.engagementHistory = [];

      await service.recordEngagement(
        mockCustomerId,
        stakeholderId,
        lowValueEngagement,
        Industry.SAAS
      );

      const network2 = service.getStakeholderNetwork(mockCustomerId);
      const stakeholder2 = network2?.stakeholders.get(stakeholderId);
      const lowEngagementScore = stakeholder2?.engagement || 0;

      expect(highEngagementScore).toBeGreaterThan(lowEngagementScore);
    });

    it('should track engagement trends', async () => {
      // Record multiple high-value engagements to create increasing trend
      const engagements = [
        { type: EngagementType.EMAIL_OPEN },
        { type: EngagementType.WEBSITE_VISIT },
        { type: EngagementType.DEMO_ATTENDED },
        { type: EngagementType.PROPOSAL_REVIEWED },
        { type: EngagementType.TRIAL_STARTED },
        { type: EngagementType.FEATURE_USED }
      ];

      for (const engagement of engagements) {
        await service.recordEngagement(
          mockCustomerId,
          stakeholderId,
          engagement,
          Industry.SAAS
        );
      }

      const network = service.getStakeholderNetwork(mockCustomerId);
      const stakeholder = network?.stakeholders.get(stakeholderId);

      expect(stakeholder?.engagementTrend).toBe('increasing');
    });
  });

  describe('Stakeholder Interactions', () => {
    let stakeholder1Id: string;
    let stakeholder2Id: string;

    beforeEach(async () => {
      await service.initializeStakeholderNetwork(mockCustomerId, Industry.SAAS);

      const stakeholder1 = await service.addEnhancedStakeholder(
        mockCustomerId,
        { role: StakeholderRole.DECISION_MAKER },
        Industry.SAAS
      );
      stakeholder1Id = stakeholder1.stakeholderId;

      const stakeholder2 = await service.addEnhancedStakeholder(
        mockCustomerId,
        { role: StakeholderRole.TECHNICAL_CHAMPION },
        Industry.SAAS
      );
      stakeholder2Id = stakeholder2.stakeholderId;
    });

    it('should record stakeholder interactions', async () => {
      const interaction = {
        stakeholderIds: [stakeholder1Id, stakeholder2Id],
        type: 'meeting' as const,
        duration: 45,
        outcome: 'positive' as const,
        influenceTransfer: 10,
        notes: 'Productive technical discussion'
      };

      await service.recordInteraction(
        mockCustomerId,
        interaction,
        Industry.SAAS
      );

      const network = service.getStakeholderNetwork(mockCustomerId);
      expect(network?.relationships.length).toBe(1);
      expect(network?.relationships[0].outcome).toBe('positive');

      const stakeholder1 = network?.stakeholders.get(stakeholder1Id);
      expect(stakeholder1?.interactionHistory.length).toBe(1);
      expect(stakeholder1?.relationshipStrength).toBeGreaterThan(0);
    });

    it('should update relationship strength based on interaction outcomes', async () => {
      const network = service.getStakeholderNetwork(mockCustomerId);
      const initialRelationship = network?.stakeholders.get(stakeholder1Id)?.relationshipStrength || 0;

      // Positive interaction
      await service.recordInteraction(
        mockCustomerId,
        {
          stakeholderIds: [stakeholder1Id, stakeholder2Id],
          type: 'meeting' as const,
          outcome: 'positive' as const
        },
        Industry.SAAS
      );

      const afterPositive = network?.stakeholders.get(stakeholder1Id)?.relationshipStrength || 0;
      expect(afterPositive).toBeGreaterThan(initialRelationship);

      // Negative interaction
      await service.recordInteraction(
        mockCustomerId,
        {
          stakeholderIds: [stakeholder1Id, stakeholder2Id],
          type: 'phone_call' as const,
          outcome: 'negative' as const
        },
        Industry.SAAS
      );

      const afterNegative = network?.stakeholders.get(stakeholder1Id)?.relationshipStrength || 0;
      expect(afterNegative).toBeLessThan(afterPositive);
    });
  });

  describe('Network Analysis', () => {
    beforeEach(async () => {
      await service.initializeStakeholderNetwork(mockCustomerId, Industry.SAAS);

      // Add decision makers
      await service.addEnhancedStakeholder(
        mockCustomerId,
        {
          role: StakeholderRole.DECISION_MAKER,
          stakeholderId: 'decision-maker-1',
          advocacyLevel: 80,
          relationshipStrength: 85
        },
        Industry.SAAS
      );

      // Add champion
      await service.addEnhancedStakeholder(
        mockCustomerId,
        {
          role: StakeholderRole.TECHNICAL_CHAMPION,
          stakeholderId: 'champion-1',
          advocacyLevel: 75,
          relationshipStrength: 80
        },
        Industry.SAAS
      );

      // Add potential blocker
      await service.addEnhancedStakeholder(
        mockCustomerId,
        {
          role: StakeholderRole.GATEKEEPER,
          stakeholderId: 'gatekeeper-1',
          riskScore: 70,
          relationshipStrength: 25
        },
        Industry.SAAS
      );
    });

    it('should identify decision committee correctly', async () => {
      const network = service.getStakeholderNetwork(mockCustomerId);
      expect(network?.decisionCommittee.length).toBeGreaterThan(0);
      expect(network?.decisionCommittee).toContain('decision-maker-1');
    });

    it('should identify champions and blockers', async () => {
      const network = service.getStakeholderNetwork(mockCustomerId);
      expect(network?.champions.length).toBeGreaterThan(0);
      expect(network?.blockers.length).toBeGreaterThan(0);
      expect(network?.champions).toContain('champion-1');
      expect(network?.blockers).toContain('gatekeeper-1');
    });

    it('should calculate network health correctly', async () => {
      const network = service.getStakeholderNetwork(mockCustomerId);
      expect(network?.networkHealth).toBeDefined();
      expect(['strong', 'moderate', 'weak', 'at_risk']).toContain(network?.networkHealth);
      expect(network?.networkStrength).toBeGreaterThan(0);
    });
  });

  describe('Stakeholder Insights', () => {
    beforeEach(async () => {
      await service.initializeStakeholderNetwork(mockCustomerId, Industry.HEALTHCARE);

      // Add various stakeholders for healthcare industry
      await service.addEnhancedStakeholder(
        mockCustomerId,
        {
          role: StakeholderRole.PHYSICIAN,
          stakeholderId: 'physician-1',
          engagement: 75,
          advocacyLevel: 70
        },
        Industry.HEALTHCARE
      );

      await service.addEnhancedStakeholder(
        mockCustomerId,
        {
          role: StakeholderRole.ADMINISTRATOR,
          stakeholderId: 'admin-1',
          engagement: 50,
          riskScore: 60
        },
        Industry.HEALTHCARE
      );
    });

    it('should generate comprehensive stakeholder insights', async () => {
      const insights = await service.getStakeholderInsights(mockCustomerId, Industry.HEALTHCARE);

      expect(insights.customerId).toBe(mockCustomerId);
      expect(insights.totalStakeholders).toBe(2);
      expect(insights.averageInfluence).toBeGreaterThan(0);
      expect(insights.networkStrength).toBeGreaterThan(0);
      expect(insights.decisionReadiness).toBeGreaterThan(0);
      expect(insights.recommendedActions).toBeDefined();
      expect(insights.riskFactors).toBeDefined();
      expect(insights.opportunities).toBeDefined();
      expect(insights.nextBestActions).toBeDefined();
    });

    it('should provide actionable recommendations', async () => {
      const insights = await service.getStakeholderInsights(mockCustomerId, Industry.HEALTHCARE);

      expect(Array.isArray(insights.recommendedActions)).toBe(true);
      expect(Array.isArray(insights.riskFactors)).toBe(true);
      expect(Array.isArray(insights.opportunities)).toBe(true);
      expect(Array.isArray(insights.nextBestActions)).toBe(true);

      // Check next best actions structure
      if (insights.nextBestActions.length > 0) {
        const action = insights.nextBestActions[0];
        expect(action.stakeholderId).toBeDefined();
        expect(action.action).toBeDefined();
        expect(['high', 'medium', 'low']).toContain(action.priority);
        expect(action.expectedImpact).toBeGreaterThan(0);
      }
    });
  });

  describe('Industry-Specific Analytics', () => {
    it('should handle different industries correctly', async () => {
      const industries = [
        Industry.SAAS,
        Industry.MANUFACTURING,
        Industry.HEALTHCARE,
        Industry.FINTECH,
        Industry.COLLEGE_CONSULTING
      ];

      for (const industry of industries) {
        const customerId = `customer-${industry}`;

        await service.initializeStakeholderNetwork(customerId, industry);

        // Add industry-appropriate stakeholder
        const roleMap = {
          [Industry.SAAS]: StakeholderRole.TECHNICAL_CHAMPION,
          [Industry.MANUFACTURING]: StakeholderRole.ENGINEER,
          [Industry.HEALTHCARE]: StakeholderRole.PHYSICIAN,
          [Industry.FINTECH]: StakeholderRole.COMPLIANCE_OFFICER,
          [Industry.COLLEGE_CONSULTING]: StakeholderRole.PARENT
        };

        const stakeholder = await service.addEnhancedStakeholder(
          customerId,
          { role: roleMap[industry] },
          industry
        );

        expect(stakeholder.role).toBe(roleMap[industry]);
        expect(stakeholder.overallInfluenceScore).toBeGreaterThan(0);

        const analytics = service.getIndustryAnalytics(industry);
        expect(analytics).toBeDefined();
      }
    });

    it('should calculate different influence scores per industry', async () => {
      // Same role in different industries should have different influence
      const saasCustomer = 'saas-customer';
      const mfgCustomer = 'mfg-customer';

      await service.initializeStakeholderNetwork(saasCustomer, Industry.SAAS);
      await service.initializeStakeholderNetwork(mfgCustomer, Industry.MANUFACTURING);

      const saasDecisionMaker = await service.addEnhancedStakeholder(
        saasCustomer,
        { role: StakeholderRole.DECISION_MAKER },
        Industry.SAAS
      );

      const mfgDecisionMaker = await service.addEnhancedStakeholder(
        mfgCustomer,
        { role: StakeholderRole.DECISION_MAKER },
        Industry.MANUFACTURING
      );

      // Different industries may weight decision makers differently
      expect(saasDecisionMaker.decisionMakingPower).toBeDefined();
      expect(mfgDecisionMaker.decisionMakingPower).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should throw error for non-existent customer network', async () => {
      await expect(
        service.addEnhancedStakeholder(
          'non-existent-customer',
          { role: StakeholderRole.USER },
          Industry.SAAS
        )
      ).rejects.toThrow('Stakeholder network not found');
    });

    it('should throw error for non-existent stakeholder in engagement', async () => {
      await service.initializeStakeholderNetwork(mockCustomerId, Industry.SAAS);

      await expect(
        service.recordEngagement(
          mockCustomerId,
          'non-existent-stakeholder',
          { type: EngagementType.EMAIL_OPEN },
          Industry.SAAS
        )
      ).rejects.toThrow('Stakeholder not found');
    });

    it('should throw error for insights on non-existent network', async () => {
      await expect(
        service.getStakeholderInsights('non-existent-customer', Industry.SAAS)
      ).rejects.toThrow('Stakeholder network not found');
    });
  });

  describe('Event Emissions', () => {
    it('should emit events for network operations', async () => {
      const networkInitializedSpy = jest.fn();
      const stakeholderAddedSpy = jest.fn();
      const engagementRecordedSpy = jest.fn();

      service.on('networkInitialized', networkInitializedSpy);
      service.on('stakeholderAdded', stakeholderAddedSpy);
      service.on('engagementRecorded', engagementRecordedSpy);

      await service.initializeStakeholderNetwork(mockCustomerId, Industry.SAAS);
      expect(networkInitializedSpy).toHaveBeenCalled();

      const stakeholder = await service.addEnhancedStakeholder(
        mockCustomerId,
        { role: StakeholderRole.USER },
        Industry.SAAS
      );
      expect(stakeholderAddedSpy).toHaveBeenCalledWith(mockCustomerId, stakeholder);

      await service.recordEngagement(
        mockCustomerId,
        stakeholder.stakeholderId,
        { type: EngagementType.EMAIL_OPEN },
        Industry.SAAS
      );
      expect(engagementRecordedSpy).toHaveBeenCalled();
    });
  });
});
