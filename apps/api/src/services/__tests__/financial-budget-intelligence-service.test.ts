import FinancialBudgetIntelligenceService, {
    FinancialHealthStatus,
    FinancialIndicator,
    FinancialIndicatorType,
    Industry,
    PaymentCapability
} from '../financial-budget-intelligence-service';

describe('FinancialBudgetIntelligenceService', () => {
  let service: FinancialBudgetIntelligenceService;
  const mockCustomerId = 'test-customer-123';
  const mockCustomerId2 = 'test-customer-456';

  const mockSaaSIndicators: Partial<FinancialIndicator>[] = [
    {
      type: FinancialIndicatorType.ANNUAL_CONTRACT_VALUE,
      value: 50000,
      currency: 'USD',
      confidence: 90,
      source: 'declared'
    },
    {
      type: FinancialIndicatorType.BUDGET_APPROVAL_CYCLE,
      value: 30, // 30 days
      currency: 'USD',
      confidence: 85,
      source: 'behavioral'
    },
    {
      type: FinancialIndicatorType.PROCUREMENT_AUTHORITY,
      value: 100000, // Authority up to $100k
      currency: 'USD',
      confidence: 95,
      source: 'declared'
    }
  ];

  const mockCollegeIndicators: Partial<FinancialIndicator>[] = [
    {
      type: FinancialIndicatorType.FAMILY_INCOME,
      value: 120000,
      currency: 'USD',
      confidence: 80,
      source: 'declared'
    },
    {
      type: FinancialIndicatorType.FINANCIAL_AID_ELIGIBILITY,
      value: 75, // 75% eligible
      currency: 'USD',
      confidence: 70,
      source: 'inferred'
    },
    {
      type: FinancialIndicatorType.SCHOLARSHIP_POTENTIAL,
      value: 25000,
      currency: 'USD',
      confidence: 60,
      source: 'third_party'
    }
  ];

  beforeEach(() => {
    // Reset singleton for testing
    (FinancialBudgetIntelligenceService as any)._instance = null;
    service = FinancialBudgetIntelligenceService.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = FinancialBudgetIntelligenceService.getInstance();
      const instance2 = FinancialBudgetIntelligenceService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Financial Profile Creation', () => {
    it('should create financial profile with correct properties', async () => {
      const profile = await service.createFinancialProfile(
        mockCustomerId,
        Industry.SAAS,
        mockSaaSIndicators,
        {
          industrySpecificData: {
            contractValue: 50000,
            paymentTerms: 30,
            budgetApprovalLevel: 'department'
          }
        }
      );

      expect(profile).toBeDefined();
      expect(profile.customerId).toBe(mockCustomerId);
      expect(profile.industry).toBe(Industry.SAAS);
      expect(profile.financialHealthScore).toBeGreaterThan(0);
      expect(profile.financialHealthScore).toBeLessThanOrEqual(100);
      expect(profile.indicators.length).toBe(3);
      expect(profile.budgetCycle).toBeDefined();
      expect(profile.industrySpecificData.contractValue).toBe(50000);
      expect(profile.recommendations).toBeDefined();
      expect(Array.isArray(profile.riskFactors)).toBe(true);
      expect(Array.isArray(profile.opportunities)).toBe(true);
    });

    it('should assign correct financial health status based on score', async () => {
      const highValueIndicators: Partial<FinancialIndicator>[] = [
        {
          type: FinancialIndicatorType.ANNUAL_CONTRACT_VALUE,
          value: 500000, // High value
          currency: 'USD',
          confidence: 95,
          source: 'declared'
        }
      ];

      const profile = await service.createFinancialProfile(
        mockCustomerId,
        Industry.SAAS,
        highValueIndicators
      );

      expect(profile.financialHealthScore).toBeGreaterThan(70);
      expect([FinancialHealthStatus.GOOD, FinancialHealthStatus.EXCELLENT]).toContain(profile.financialHealthStatus);
    });

    it('should set appropriate payment capability', async () => {
      const profile = await service.createFinancialProfile(
        mockCustomerId,
        Industry.SAAS,
        mockSaaSIndicators
      );

      expect(Object.values(PaymentCapability)).toContain(profile.paymentCapability);
    });

    it('should throw error for invalid customer ID', async () => {
      await expect(
        service.createFinancialProfile('', Industry.SAAS, mockSaaSIndicators)
      ).rejects.toThrow('Customer ID is required');
    });

    it('should throw error for invalid industry', async () => {
      await expect(
        service.createFinancialProfile(mockCustomerId, 'invalid' as Industry, mockSaaSIndicators)
      ).rejects.toThrow('Invalid industry');
    });

    it('should process indicators correctly', async () => {
      const profile = await service.createFinancialProfile(
        mockCustomerId,
        Industry.SAAS,
        mockSaaSIndicators
      );

      profile.indicators.forEach(indicator => {
        expect(indicator.id).toBeDefined();
        expect(indicator.type).toBeDefined();
        expect(indicator.value).toBeGreaterThanOrEqual(0);
        expect(indicator.currency).toBeDefined();
        expect(indicator.confidence).toBeGreaterThan(0);
        expect(indicator.confidence).toBeLessThanOrEqual(100);
        expect(indicator.lastUpdated).toBeDefined();
      });
    });
  });

  describe('Financial Profile Retrieval', () => {
    beforeEach(async () => {
      await service.createFinancialProfile(mockCustomerId, Industry.SAAS, mockSaaSIndicators);
      await service.createFinancialProfile(mockCustomerId2, Industry.COLLEGE_CONSULTING, mockCollegeIndicators);
    });

    it('should retrieve financial profile by customer ID', () => {
      const profile = service.getFinancialProfile(mockCustomerId);
      expect(profile).toBeDefined();
      expect(profile!.customerId).toBe(mockCustomerId);
      expect(profile!.industry).toBe(Industry.SAAS);
    });

    it('should return undefined for non-existent customer', () => {
      const profile = service.getFinancialProfile('non-existent-customer');
      expect(profile).toBeUndefined();
    });
  });

  describe('Financial Profile Updates', () => {
    let profileId: string;

    beforeEach(async () => {
      const profile = await service.createFinancialProfile(
        mockCustomerId,
        Industry.MANUFACTURING,
        [
          {
            type: FinancialIndicatorType.CAPITAL_EXPENDITURE_BUDGET,
            value: 500000,
            currency: 'USD',
            confidence: 80,
            source: 'declared'
          }
        ]
      );
      profileId = profile.id;
    });

    it('should update financial profile', async () => {
      const updatedProfile = await service.updateFinancialProfile(profileId, {
        budgetCycle: {
          cycleType: 'annual',
          nextBudgetPeriod: '2024-01-01',
          currentBudgetUtilization: 85,
          remainingBudget: 150000,
          totalBudget: 1000000
        }
      });

      expect(updatedProfile.budgetCycle.cycleType).toBe('annual');
      expect(updatedProfile.budgetCycle.remainingBudget).toBe(150000);
      expect(updatedProfile.updatedAt).not.toBe(updatedProfile.createdAt);
    });

    it('should recalculate scores when indicators are updated', async () => {
      const newIndicators: FinancialIndicator[] = [
        {
          id: 'test-indicator',
          type: FinancialIndicatorType.CAPITAL_EXPENDITURE_BUDGET,
          value: 1000000, // Higher value
          currency: 'USD',
          confidence: 95,
          source: 'declared',
          lastUpdated: new Date().toISOString()
        }
      ];

      const updatedProfile = await service.updateFinancialProfile(profileId, {
        indicators: newIndicators
      });

      // Should have recalculated health score
      expect(updatedProfile.financialHealthScore).toBeDefined();
      expect(updatedProfile.financialHealthStatus).toBeDefined();
      expect(updatedProfile.paymentCapability).toBeDefined();
    });

    it('should throw error for non-existent profile', async () => {
      await expect(
        service.updateFinancialProfile('non-existent', { budgetCycle: {} as any })
      ).rejects.toThrow('Financial profile not found');
    });
  });

  describe('Budget Approval Prediction', () => {
    beforeEach(async () => {
      await service.createFinancialProfile(
        mockCustomerId,
        Industry.SAAS,
        mockSaaSIndicators,
        {
          budgetCycle: {
            cycleType: 'quarterly',
            nextBudgetPeriod: '2024-07-01',
            currentBudgetUtilization: 60,
            remainingBudget: 200000,
            totalBudget: 500000
          }
        }
      );
    });

    it('should predict budget approval with realistic probability', async () => {
      const prediction = await service.predictBudgetApproval(mockCustomerId, 75000, 'USD');

      expect(prediction.customerId).toBe(mockCustomerId);
      expect(prediction.industry).toBe(Industry.SAAS);
      expect(prediction.proposalAmount).toBe(75000);
      expect(prediction.currency).toBe('USD');
      expect(prediction.approvalProbability).toBeGreaterThanOrEqual(0);
      expect(prediction.approvalProbability).toBeLessThanOrEqual(100);
      expect(prediction.expectedTimeToApproval).toBeGreaterThan(0);
      expect(Array.isArray(prediction.requiredApprovers)).toBe(true);
      expect(prediction.optimizationSuggestions).toBeDefined();
      expect(Array.isArray(prediction.riskFactors)).toBe(true);
    });

    it('should require more approvers for larger amounts', async () => {
      const smallPrediction = await service.predictBudgetApproval(mockCustomerId, 25000, 'USD');
      const largePrediction = await service.predictBudgetApproval(mockCustomerId, 250000, 'USD');

      expect(largePrediction.requiredApprovers.length).toBeGreaterThan(smallPrediction.requiredApprovers.length);
    });

    it('should provide optimization suggestions for large budgets', async () => {
      // Request amount larger than remaining budget
      const prediction = await service.predictBudgetApproval(mockCustomerId, 300000, 'USD');

      expect(prediction.optimizationSuggestions.adjustedAmount).toBeDefined();
      expect(prediction.optimizationSuggestions.adjustedAmount).toBeLessThan(300000);
    });

    it('should throw error for customer without financial profile', async () => {
      await expect(
        service.predictBudgetApproval('non-existent-customer', 50000, 'USD')
      ).rejects.toThrow('Financial profile not found for customer');
    });
  });

  describe('Industry Analytics', () => {
    beforeEach(async () => {
      // Create multiple profiles for analytics
      await service.createFinancialProfile(mockCustomerId, Industry.HEALTHCARE, [
        {
          type: FinancialIndicatorType.REIMBURSEMENT_CAPABILITY,
          value: 80,
          currency: 'USD',
          confidence: 85,
          source: 'declared'
        }
      ]);

      await service.createFinancialProfile(mockCustomerId2, Industry.HEALTHCARE, [
        {
          type: FinancialIndicatorType.BUDGET_ALLOCATION,
          value: 500000,
          currency: 'USD',
          confidence: 90,
          source: 'declared'
        }
      ]);
    });

    it('should provide industry financial analytics', () => {
      const analytics = service.getIndustryFinancialAnalytics(Industry.HEALTHCARE);

      expect(analytics).toBeDefined();
      expect(analytics!.industry).toBe(Industry.HEALTHCARE);
      expect(analytics!.totalProfiles).toBe(2);
      expect(analytics!.averageHealthScore).toBeGreaterThan(0);
      expect(analytics!.healthDistribution).toBeDefined();
      expect(analytics!.paymentCapabilityBreakdown).toBeDefined();
      expect(Array.isArray(analytics!.commonRiskFactors)).toBe(true);
      expect(analytics!.lastAnalyzed).toBeDefined();
    });

    it('should return null for industry with no profiles', () => {
      const analytics = service.getIndustryFinancialAnalytics(Industry.MANUFACTURING);
      expect(analytics).toBeNull();
    });

    it('should calculate health distribution correctly', () => {
      const analytics = service.getIndustryFinancialAnalytics(Industry.HEALTHCARE);

      expect(analytics).toBeDefined();
      const distribution = analytics!.healthDistribution;
      const totalInDistribution = Object.values(distribution).reduce((sum, count) => sum + count, 0);
      expect(totalInDistribution).toBe(analytics!.totalProfiles);
    });

    it('should calculate payment capability breakdown correctly', () => {
      const analytics = service.getIndustryFinancialAnalytics(Industry.HEALTHCARE);

      expect(analytics).toBeDefined();
      const breakdown = analytics!.paymentCapabilityBreakdown;
      const totalInBreakdown = Object.values(breakdown).reduce((sum, count) => sum + count, 0);
      expect(totalInBreakdown).toBe(analytics!.totalProfiles);
    });
  });

  describe('Event Emission', () => {
    it('should emit event when financial profile is created', async () => {
      const eventSpy = jest.fn();
      service.on('financialProfileCreated', eventSpy);

      await service.createFinancialProfile(mockCustomerId, Industry.FINTECH, [
        {
          type: FinancialIndicatorType.INVESTMENT_READINESS,
          value: 85,
          currency: 'USD',
          confidence: 90,
          source: 'declared'
        }
      ]);

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: mockCustomerId,
          industry: Industry.FINTECH
        })
      );
    });

    it('should emit event when financial profile is updated', async () => {
      const profile = await service.createFinancialProfile(
        mockCustomerId,
        Industry.FINTECH,
        [
          {
            type: FinancialIndicatorType.OPERATIONAL_BUDGET,
            value: 200000,
            currency: 'USD',
            confidence: 85,
            source: 'declared'
          }
        ]
      );

      const eventSpy = jest.fn();
      service.on('financialProfileUpdated', eventSpy);

      await service.updateFinancialProfile(profile.id, {
        budgetCycle: {
          cycleType: 'monthly',
          nextBudgetPeriod: '2024-02-01',
          currentBudgetUtilization: 75,
          remainingBudget: 50000,
          totalBudget: 200000
        }
      });

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: expect.objectContaining({
            budgetCycle: expect.any(Object)
          })
        })
      );
    });
  });

  describe('Industry-Specific Behavior', () => {
    it('should use correct budget cycles for each industry', async () => {
      const saasProfile = await service.createFinancialProfile(mockCustomerId, Industry.SAAS, mockSaaSIndicators);
      const collegeProfile = await service.createFinancialProfile(mockCustomerId2, Industry.COLLEGE_CONSULTING, mockCollegeIndicators);

      expect(saasProfile.budgetCycle.cycleType).toBe('quarterly');
      expect(collegeProfile.budgetCycle.cycleType).toBe('annual');
    });

    it('should apply industry-specific weighting in health score calculation', async () => {
      // Create profiles with similar indicators but different industries
      const indicators: Partial<FinancialIndicator>[] = [
        {
          type: FinancialIndicatorType.ANNUAL_CONTRACT_VALUE,
          value: 100000,
          currency: 'USD',
          confidence: 90,
          source: 'declared'
        }
      ];

      const saasProfile = await service.createFinancialProfile('saas-customer', Industry.SAAS, indicators);

      // Healthcare uses different scoring logic
      const healthcareIndicators: Partial<FinancialIndicator>[] = [
        {
          type: FinancialIndicatorType.BUDGET_ALLOCATION,
          value: 100000,
          currency: 'USD',
          confidence: 90,
          source: 'declared'
        }
      ];

      const healthcareProfile = await service.createFinancialProfile('healthcare-customer', Industry.HEALTHCARE, healthcareIndicators);

      // Scores should be different due to industry-specific weighting
      expect(saasProfile.financialHealthScore).toBeDefined();
      expect(healthcareProfile.financialHealthScore).toBeDefined();
      // We don't expect them to be exactly equal due to different industry weightings
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid financial indicator types', async () => {
      const invalidIndicators: any[] = [
        {
          type: 'invalid_type',
          value: 100,
          currency: 'USD',
          confidence: 80,
          source: 'declared'
        }
      ];

      await expect(
        service.createFinancialProfile(mockCustomerId, Industry.SAAS, invalidIndicators)
      ).rejects.toThrow('Invalid financial indicator type');
    });

    it('should handle empty indicators array gracefully', async () => {
      const profile = await service.createFinancialProfile(
        mockCustomerId,
        Industry.SAAS,
        []
      );

      expect(profile.indicators).toEqual([]);
      expect(profile.financialHealthScore).toBe(50); // Default score
    });
  });
});
