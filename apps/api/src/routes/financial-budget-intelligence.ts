import { Request, Response, Router } from 'express';
import FinancialBudgetIntelligenceService, {
    FinancialHealthStatus,
    FinancialIndicatorType,
    Industry,
    PaymentCapability
} from '../services/financial-budget-intelligence-service';

const router = Router();
const financialService = FinancialBudgetIntelligenceService.getInstance();

// Create financial profile
router.post('/profiles', async (req: Request, res: Response) => {
  try {
    const {
      customerId,
      industry,
      indicators = [],
      budgetCycle,
      industrySpecificData
    } = req.body;

    // Validation
    if (!customerId) {
      return res.status(400).json({
        error: 'Customer ID is required',
        code: 'MISSING_CUSTOMER_ID'
      });
    }

    if (!industry || !Object.values(Industry).includes(industry)) {
      return res.status(400).json({
        error: 'Valid industry is required',
        code: 'INVALID_INDUSTRY',
        supportedIndustries: Object.values(Industry)
      });
    }

    if (!Array.isArray(indicators)) {
      return res.status(400).json({
        error: 'Indicators must be an array',
        code: 'INVALID_INDICATORS_FORMAT'
      });
    }

    const profile = await financialService.createFinancialProfile(
      customerId,
      industry,
      indicators,
      {
        budgetCycle,
        industrySpecificData
      }
    );

    res.status(201).json({
      success: true,
      data: profile,
      message: 'Financial profile created successfully'
    });
  } catch (error) {
    console.error('Error creating financial profile:', error);
    res.status(500).json({
      error: 'Failed to create financial profile',
      code: 'CREATION_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get financial profile by customer ID
router.get('/profiles/customer/:customerId', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const profile = financialService.getFinancialProfile(customerId);

    if (!profile) {
      return res.status(404).json({
        error: 'Financial profile not found',
        code: 'PROFILE_NOT_FOUND',
        customerId
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error retrieving financial profile:', error);
    res.status(500).json({
      error: 'Failed to retrieve financial profile',
      code: 'RETRIEVAL_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update financial profile
router.put('/profiles/:profileId', async (req: Request, res: Response) => {
  try {
    const { profileId } = req.params;
    const updates = req.body;

    // Remove system-generated fields from updates
    const allowedUpdates = { ...updates };
    delete allowedUpdates.id;
    delete allowedUpdates.createdAt;

    const updatedProfile = await financialService.updateFinancialProfile(
      profileId,
      allowedUpdates
    );

    res.json({
      success: true,
      data: updatedProfile,
      message: 'Financial profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating financial profile:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Financial profile not found',
        code: 'PROFILE_NOT_FOUND',
        profileId: req.params.profileId
      });
    }

    res.status(500).json({
      error: 'Failed to update financial profile',
      code: 'UPDATE_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get budget approval prediction
router.post('/budget-approval/predict', async (req: Request, res: Response) => {
  try {
    const {
      customerId,
      proposalAmount,
      currency = 'USD'
    } = req.body;

    // Validation
    if (!customerId) {
      return res.status(400).json({
        error: 'Customer ID is required',
        code: 'MISSING_CUSTOMER_ID'
      });
    }

    if (!proposalAmount || proposalAmount <= 0) {
      return res.status(400).json({
        error: 'Valid proposal amount is required',
        code: 'INVALID_PROPOSAL_AMOUNT'
      });
    }

    const prediction = await financialService.predictBudgetApproval(
      customerId,
      proposalAmount,
      currency
    );

    res.json({
      success: true,
      data: {
        prediction,
        summary: {
          approvalLikelihood: prediction.approvalProbability >= 70 ? 'high' :
                             prediction.approvalProbability >= 50 ? 'medium' : 'low',
          timelineCategory: prediction.expectedTimeToApproval <= 7 ? 'fast' :
                          prediction.expectedTimeToApproval <= 21 ? 'normal' : 'slow',
          complexityLevel: prediction.requiredApprovers.length <= 2 ? 'simple' :
                          prediction.requiredApprovers.length <= 4 ? 'moderate' : 'complex',
          riskLevel: prediction.riskFactors.length === 0 ? 'low' :
                    prediction.riskFactors.length <= 2 ? 'medium' : 'high'
        }
      }
    });
  } catch (error) {
    console.error('Error predicting budget approval:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Financial profile not found for customer',
        code: 'PROFILE_NOT_FOUND',
        customerId: req.body.customerId
      });
    }

    res.status(500).json({
      error: 'Failed to predict budget approval',
      code: 'PREDICTION_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get industry financial analytics
router.get('/analytics/industry/:industry', async (req: Request, res: Response) => {
  try {
    const { industry } = req.params;

    if (!Object.values(Industry).includes(industry as Industry)) {
      return res.status(400).json({
        error: 'Invalid industry',
        code: 'INVALID_INDUSTRY',
        supportedIndustries: Object.values(Industry)
      });
    }

    const analytics = financialService.getIndustryFinancialAnalytics(industry as Industry);

    if (!analytics) {
      return res.status(404).json({
        error: 'No financial data found for industry',
        code: 'NO_INDUSTRY_DATA',
        industry
      });
    }

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error retrieving industry analytics:', error);
    res.status(500).json({
      error: 'Failed to retrieve industry analytics',
      code: 'ANALYTICS_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get comprehensive financial intelligence summary
router.get('/intelligence/customer/:customerId', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const profile = financialService.getFinancialProfile(customerId);

    if (!profile) {
      return res.status(404).json({
        error: 'Financial profile not found',
        code: 'PROFILE_NOT_FOUND',
        customerId
      });
    }

    // Generate intelligent insights
    const intelligence = {
      profile: {
        healthScore: profile.financialHealthScore,
        healthStatus: profile.financialHealthStatus,
        paymentCapability: profile.paymentCapability,
        industry: profile.industry
      },
      budgetInsights: {
        cycleType: profile.budgetCycle.cycleType,
        utilizationRate: profile.budgetCycle.currentBudgetUtilization,
        remainingBudget: profile.budgetCycle.remainingBudget,
        daysToNextCycle: Math.ceil(
          (new Date(profile.budgetCycle.nextBudgetPeriod).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      },
      keyIndicators: profile.indicators
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5)
        .map(indicator => ({
          type: indicator.type,
          value: indicator.value,
          confidence: indicator.confidence,
          trend: indicator.trendData?.direction || 'stable'
        })),
      riskAssessment: {
        riskLevel: profile.riskFactors.length === 0 ? 'low' :
                  profile.riskFactors.length <= 2 ? 'medium' : 'high',
        topRisks: profile.riskFactors.slice(0, 3),
        mitigationActions: profile.recommendations
          .filter(rec => rec.priority === 'high')
          .map(rec => rec.action)
      },
      opportunities: {
        growthPotential: profile.opportunities.length > 0 ? 'high' : 'medium',
        topOpportunities: profile.opportunities.slice(0, 3),
        priorityActions: profile.recommendations
          .sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          })
          .slice(0, 3)
      },
      industryComparison: financialService.getIndustryFinancialAnalytics(profile.industry)
    };

    res.json({
      success: true,
      data: intelligence,
      metadata: {
        generatedAt: new Date().toISOString(),
        customerId,
        profileLastUpdated: profile.updatedAt
      }
    });
  } catch (error) {
    console.error('Error generating financial intelligence:', error);
    res.status(500).json({
      error: 'Failed to generate financial intelligence',
      code: 'INTELLIGENCE_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get financial readiness assessment
router.get('/readiness/customer/:customerId', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const { targetAmount, targetCurrency = 'USD' } = req.query;

    const profile = financialService.getFinancialProfile(customerId);

    if (!profile) {
      return res.status(404).json({
        error: 'Financial profile not found',
        code: 'PROFILE_NOT_FOUND',
        customerId
      });
    }

    let prediction = null;
    if (targetAmount) {
      const amount = parseFloat(targetAmount as string);
      if (!isNaN(amount) && amount > 0) {
        prediction = await financialService.predictBudgetApproval(
          customerId,
          amount,
          targetCurrency as string
        );
      }
    }

    const readiness = {
      overallReadiness: profile.financialHealthScore >= 70 ? 'ready' :
                       profile.financialHealthScore >= 50 ? 'conditional' : 'not_ready',
      financialHealth: {
        score: profile.financialHealthScore,
        status: profile.financialHealthStatus,
        strengths: profile.opportunities,
        concerns: profile.riskFactors
      },
      paymentCapability: {
        capability: profile.paymentCapability,
        timeframe: profile.paymentCapability === PaymentCapability.IMMEDIATE ? '0 days' :
                  profile.paymentCapability === PaymentCapability.SHORT_TERM ? '1-30 days' :
                  profile.paymentCapability === PaymentCapability.MEDIUM_TERM ? '31-90 days' :
                  profile.paymentCapability === PaymentCapability.LONG_TERM ? '91+ days' : 'Requires financing'
      },
      budgetStatus: {
        cycleType: profile.budgetCycle.cycleType,
        utilization: profile.budgetCycle.currentBudgetUtilization,
        availableBudget: profile.budgetCycle.remainingBudget,
        budgetHealth: profile.budgetCycle.currentBudgetUtilization < 70 ? 'healthy' :
                     profile.budgetCycle.currentBudgetUtilization < 90 ? 'strained' : 'critical'
      },
      recommendations: profile.recommendations.map(rec => ({
        priority: rec.priority,
        action: rec.action,
        impact: rec.expectedImpact,
        timeframe: rec.timeframe,
        cost: rec.costEstimate
      })),
      ...(prediction && {
        targetAssessment: {
          targetAmount: parseFloat(targetAmount as string),
          currency: targetCurrency,
          approvalProbability: prediction.approvalProbability,
          expectedTimeToApproval: prediction.expectedTimeToApproval,
          requiredApprovers: prediction.requiredApprovers,
          optimizations: prediction.optimizationSuggestions
        }
      })
    };

    res.json({
      success: true,
      data: readiness,
      metadata: {
        assessmentDate: new Date().toISOString(),
        customerId,
        industry: profile.industry
      }
    });
  } catch (error) {
    console.error('Error assessing financial readiness:', error);
    res.status(500).json({
      error: 'Failed to assess financial readiness',
      code: 'READINESS_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get supported financial indicator types
router.get('/indicator-types', async (req: Request, res: Response) => {
  try {
    const { industry } = req.query;

    let indicatorTypes = Object.values(FinancialIndicatorType);

    // Filter by industry if specified
    if (industry && Object.values(Industry).includes(industry as Industry)) {
      const industryFilters = {
        [Industry.COLLEGE_CONSULTING]: [
          FinancialIndicatorType.FAMILY_INCOME,
          FinancialIndicatorType.FINANCIAL_AID_ELIGIBILITY,
          FinancialIndicatorType.SCHOLARSHIP_POTENTIAL,
          FinancialIndicatorType.TUITION_AFFORDABILITY,
          FinancialIndicatorType.LOAN_CAPACITY,
          FinancialIndicatorType.PAYMENT_PLAN_ELIGIBILITY
        ],
        [Industry.SAAS]: [
          FinancialIndicatorType.ANNUAL_CONTRACT_VALUE,
          FinancialIndicatorType.BUDGET_APPROVAL_CYCLE,
          FinancialIndicatorType.PAYMENT_TERMS_PREFERENCE,
          FinancialIndicatorType.PROCUREMENT_AUTHORITY,
          FinancialIndicatorType.RENEWAL_BUDGET_STATUS,
          FinancialIndicatorType.EXPANSION_BUDGET
        ],
        [Industry.MANUFACTURING]: [
          FinancialIndicatorType.CAPITAL_EXPENDITURE_BUDGET,
          FinancialIndicatorType.PROCUREMENT_CYCLE_TIMING,
          FinancialIndicatorType.SUPPLIER_PAYMENT_TERMS,
          FinancialIndicatorType.CREDIT_RATING,
          FinancialIndicatorType.CASH_FLOW_STATUS,
          FinancialIndicatorType.INVESTMENT_APPROVAL_PROCESS
        ],
        [Industry.HEALTHCARE]: [
          FinancialIndicatorType.REIMBURSEMENT_CAPABILITY,
          FinancialIndicatorType.BUDGET_ALLOCATION,
          FinancialIndicatorType.ROI_REQUIREMENTS,
          FinancialIndicatorType.PAYMENT_PROCESSING_CAPABILITY,
          FinancialIndicatorType.INSURANCE_COVERAGE,
          FinancialIndicatorType.COMPLIANCE_BUDGET
        ],
        [Industry.FINTECH]: [
          FinancialIndicatorType.INVESTMENT_READINESS,
          FinancialIndicatorType.REGULATORY_CAPITAL,
          FinancialIndicatorType.OPERATIONAL_BUDGET,
          FinancialIndicatorType.TECHNOLOGY_INVESTMENT,
          FinancialIndicatorType.COMPLIANCE_SPEND,
          FinancialIndicatorType.GROWTH_CAPITAL
        ]
      };

      indicatorTypes = industryFilters[industry as Industry] || indicatorTypes;
    }

    const formattedTypes = indicatorTypes.map(type => ({
      value: type,
      label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      category: getIndicatorCategory(type),
      description: getIndicatorDescription(type)
    }));

    res.json({
      success: true,
      data: formattedTypes,
      filters: { industry }
    });
  } catch (error) {
    console.error('Error retrieving indicator types:', error);
    res.status(500).json({
      error: 'Failed to retrieve indicator types',
      code: 'INDICATOR_TYPES_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get supported industries
router.get('/industries', async (req: Request, res: Response) => {
  try {
    const industries = Object.values(Industry).map(industry => ({
      value: industry,
      label: industry.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      supportedIndicators: Object.values(FinancialIndicatorType).filter(type =>
        isIndicatorSupportedByIndustry(type, industry)
      ).length,
      defaultBudgetCycle: getDefaultBudgetCycleType(industry)
    }));

    res.json({
      success: true,
      data: industries
    });
  } catch (error) {
    console.error('Error retrieving supported industries:', error);
    res.status(500).json({
      error: 'Failed to retrieve supported industries',
      code: 'INDUSTRIES_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check endpoint
router.get('/health', async (req: Request, res: Response) => {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Financial Budget Intelligence Service',
      version: '1.0.0',
      uptime: process.uptime(),
      supportedIndustries: Object.values(Industry).length,
      supportedIndicatorTypes: Object.values(FinancialIndicatorType).length,
      financialHealthStatuses: Object.values(FinancialHealthStatus),
      paymentCapabilities: Object.values(PaymentCapability)
    };

    res.json({
      success: true,
      data: healthData
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      error: 'Health check failed',
      code: 'HEALTH_CHECK_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper functions
function getIndicatorCategory(type: FinancialIndicatorType): string {
  const categoryMap: Record<FinancialIndicatorType, string> = {
    // College Consulting
    [FinancialIndicatorType.FAMILY_INCOME]: 'Income',
    [FinancialIndicatorType.FINANCIAL_AID_ELIGIBILITY]: 'Financial Aid',
    [FinancialIndicatorType.SCHOLARSHIP_POTENTIAL]: 'Financial Aid',
    [FinancialIndicatorType.TUITION_AFFORDABILITY]: 'Affordability',
    [FinancialIndicatorType.LOAN_CAPACITY]: 'Credit',
    [FinancialIndicatorType.PAYMENT_PLAN_ELIGIBILITY]: 'Payment',

    // SaaS
    [FinancialIndicatorType.ANNUAL_CONTRACT_VALUE]: 'Revenue',
    [FinancialIndicatorType.BUDGET_APPROVAL_CYCLE]: 'Process',
    [FinancialIndicatorType.PAYMENT_TERMS_PREFERENCE]: 'Payment',
    [FinancialIndicatorType.PROCUREMENT_AUTHORITY]: 'Authority',
    [FinancialIndicatorType.RENEWAL_BUDGET_STATUS]: 'Budget',
    [FinancialIndicatorType.EXPANSION_BUDGET]: 'Budget',

    // Manufacturing
    [FinancialIndicatorType.CAPITAL_EXPENDITURE_BUDGET]: 'Budget',
    [FinancialIndicatorType.PROCUREMENT_CYCLE_TIMING]: 'Process',
    [FinancialIndicatorType.SUPPLIER_PAYMENT_TERMS]: 'Payment',
    [FinancialIndicatorType.CREDIT_RATING]: 'Credit',
    [FinancialIndicatorType.CASH_FLOW_STATUS]: 'Cash Flow',
    [FinancialIndicatorType.INVESTMENT_APPROVAL_PROCESS]: 'Process',

    // Healthcare
    [FinancialIndicatorType.REIMBURSEMENT_CAPABILITY]: 'Revenue',
    [FinancialIndicatorType.BUDGET_ALLOCATION]: 'Budget',
    [FinancialIndicatorType.ROI_REQUIREMENTS]: 'Investment',
    [FinancialIndicatorType.PAYMENT_PROCESSING_CAPABILITY]: 'Payment',
    [FinancialIndicatorType.INSURANCE_COVERAGE]: 'Insurance',
    [FinancialIndicatorType.COMPLIANCE_BUDGET]: 'Compliance',

    // FinTech
    [FinancialIndicatorType.INVESTMENT_READINESS]: 'Investment',
    [FinancialIndicatorType.REGULATORY_CAPITAL]: 'Capital',
    [FinancialIndicatorType.OPERATIONAL_BUDGET]: 'Budget',
    [FinancialIndicatorType.TECHNOLOGY_INVESTMENT]: 'Technology',
    [FinancialIndicatorType.COMPLIANCE_SPEND]: 'Compliance',
    [FinancialIndicatorType.GROWTH_CAPITAL]: 'Capital'
  };

  return categoryMap[type] || 'General';
}

function getIndicatorDescription(type: FinancialIndicatorType): string {
  const descriptions: Record<FinancialIndicatorType, string> = {
    [FinancialIndicatorType.FAMILY_INCOME]: 'Annual household income for college affordability assessment',
    [FinancialIndicatorType.ANNUAL_CONTRACT_VALUE]: 'Total yearly contract value for SaaS subscriptions',
    [FinancialIndicatorType.CAPITAL_EXPENDITURE_BUDGET]: 'Available budget for capital equipment purchases',
    [FinancialIndicatorType.REIMBURSEMENT_CAPABILITY]: 'Healthcare provider reimbursement rate percentage',
    [FinancialIndicatorType.INVESTMENT_READINESS]: 'FinTech company readiness for technology investments',
    // Add more descriptions as needed
  } as any;

  return descriptions[type] || 'Financial indicator for industry-specific analysis';
}

function isIndicatorSupportedByIndustry(type: FinancialIndicatorType, industry: Industry): boolean {
  const supportMap = {
    [Industry.COLLEGE_CONSULTING]: type.includes('FAMILY') || type.includes('FINANCIAL_AID') || type.includes('SCHOLARSHIP') || type.includes('TUITION') || type.includes('LOAN') || type.includes('PAYMENT_PLAN'),
    [Industry.SAAS]: type.includes('ANNUAL_CONTRACT') || type.includes('BUDGET') || type.includes('PAYMENT_TERMS') || type.includes('PROCUREMENT') || type.includes('RENEWAL') || type.includes('EXPANSION'),
    [Industry.MANUFACTURING]: type.includes('CAPITAL') || type.includes('PROCUREMENT') || type.includes('SUPPLIER') || type.includes('CREDIT') || type.includes('CASH_FLOW') || type.includes('INVESTMENT'),
    [Industry.HEALTHCARE]: type.includes('REIMBURSEMENT') || type.includes('BUDGET') || type.includes('ROI') || type.includes('PAYMENT_PROCESSING') || type.includes('INSURANCE') || type.includes('COMPLIANCE'),
    [Industry.FINTECH]: type.includes('INVESTMENT') || type.includes('REGULATORY') || type.includes('OPERATIONAL') || type.includes('TECHNOLOGY') || type.includes('COMPLIANCE') || type.includes('GROWTH')
  };

  return supportMap[industry] || false;
}

function getDefaultBudgetCycleType(industry: Industry): string {
  const cycleTypes = {
    [Industry.COLLEGE_CONSULTING]: 'annual',
    [Industry.SAAS]: 'quarterly',
    [Industry.MANUFACTURING]: 'quarterly',
    [Industry.HEALTHCARE]: 'annual',
    [Industry.FINTECH]: 'quarterly'
  };

  return cycleTypes[industry];
}

export default router;
