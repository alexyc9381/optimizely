import { Router } from 'express';
import { BuyerPersona, BuyerProfileService } from '../services/buyer-profile-service';
import { LeadData } from '../services/ml-types';

const router = Router();
const buyerProfileService = new BuyerProfileService();

/**
 * @route POST /api/buyer-profiles/classify
 * @desc Classify a single lead into buyer persona
 * @access Public
 */
router.post('/classify', async (req, res) => {
  try {
    const leadData: LeadData = req.body.leadData;

    if (!leadData) {
      return res.status(400).json({
        success: false,
        error: 'Lead data is required',
        message: 'Please provide lead data for classification'
      });
    }

    const classification = await buyerProfileService.classifyBuyerProfile(leadData);

    res.json({
      success: true,
      data: {
        classification,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    });
  } catch (error) {
    console.error('Error classifying buyer profile:', error);
    res.status(500).json({
      success: false,
      error: 'Classification failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * @route POST /api/buyer-profiles/classify/batch
 * @desc Classify multiple leads into buyer personas
 * @access Public
 */
router.post('/classify/batch', async (req, res) => {
  try {
    const { leads, options } = req.body;

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Lead data array is required',
        message: 'Please provide an array of lead data for batch classification'
      });
    }

    if (leads.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Batch size too large',
        message: 'Maximum batch size is 100 leads per request'
      });
    }

    const classifications = await buyerProfileService.batchClassifyProfiles(leads);

    res.json({
      success: true,
      data: {
        classifications,
        totalProcessed: leads.length,
        successCount: classifications.length,
        timestamp: new Date().toISOString(),
        options: options || {}
      }
    });
  } catch (error) {
    console.error('Error in batch classification:', error);
    res.status(500).json({
      success: false,
      error: 'Batch classification failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * @route GET /api/buyer-profiles/personas
 * @desc Get all available buyer personas
 * @access Public
 */
router.get('/personas', async (req, res) => {
  try {
    const personas: BuyerPersona[] = [
      'enterprise_ceo',
      'enterprise_cto',
      'enterprise_vp_sales',
      'enterprise_vp_marketing',
      'enterprise_procurement',
      'mid_market_owner',
      'mid_market_director',
      'mid_market_manager',
      'smb_founder',
      'smb_owner',
      'smb_operator',
      'individual_practitioner',
      'consultant',
      'evaluator',
      'influencer'
    ];

    res.json({
      success: true,
      data: {
        personas,
        count: personas.length,
        categories: {
          enterprise: personas.filter(p => p.startsWith('enterprise_')),
          mid_market: personas.filter(p => p.startsWith('mid_market')),
          smb: personas.filter(p => p.startsWith('smb_')),
          individual: personas.filter(p => p.startsWith('individual_') || ['consultant', 'evaluator', 'influencer'].includes(p))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching personas:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch personas',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * @route GET /api/buyer-profiles/personas/:persona/model
 * @desc Get persona model details
 * @access Public
 */
router.get('/personas/:persona/model', async (req, res) => {
  try {
    const persona = req.params.persona as BuyerPersona;
    const model = await buyerProfileService.getPersonaModel(persona);

    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Persona model not found',
        message: `No model found for persona: ${persona}`
      });
    }

    res.json({
      success: true,
      data: {
        model,
        persona: persona
      }
    });
  } catch (error) {
    console.error('Error fetching persona model:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch persona model',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * @route GET /api/buyer-profiles/models
 * @desc Get all persona models
 * @access Public
 */
router.get('/models', async (req, res) => {
  try {
    const models = await buyerProfileService.getAllPersonaModels();

    res.json({
      success: true,
      data: {
        models,
        count: models.length,
        lastUpdate: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching persona models:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch persona models',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * @route PUT /api/buyer-profiles/personas/:persona/model
 * @desc Update persona model
 * @access Public
 */
router.put('/personas/:persona/model', async (req, res) => {
  try {
    const persona = req.params.persona as BuyerPersona;
    const updates = req.body.updates;

    if (!updates) {
      return res.status(400).json({
        success: false,
        error: 'Model updates required',
        message: 'Please provide model updates in the request body'
      });
    }

    const updatedModel = await buyerProfileService.updatePersonaModel(persona, updates);

    res.json({
      success: true,
      data: {
        model: updatedModel,
        persona: persona,
        updated: true
      }
    });
  } catch (error) {
    console.error('Error updating persona model:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update persona model',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * @route GET /api/buyer-profiles/analytics
 * @desc Get buyer profile analytics and insights
 * @access Public
 */
router.get('/analytics', async (req, res) => {
  try {
    const analytics = await buyerProfileService.getPersonaAnalytics();

    res.json({
      success: true,
      data: {
        analytics,
        timestamp: new Date().toISOString(),
        insights: {
          topPersona: Object.entries(analytics.personaDistribution)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown',
          totalClassifications: Object.values(analytics.personaDistribution)
            .reduce((sum, count) => sum + count, 0),
          averageConfidence: Object.values(analytics.averageScores)
            .reduce((sum, score) => sum + score, 0) / Object.keys(analytics.averageScores).length || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * @route GET /api/buyer-profiles/personas/:persona/engagement-strategy
 * @desc Get engagement strategy for specific persona
 * @access Public
 */
router.get('/personas/:persona/engagement-strategy', async (req, res) => {
  try {
    const persona = req.params.persona as BuyerPersona;

    // Get the engagement strategy by doing a dummy classification
    const dummyLeadData: LeadData = {
      firmographic: {
        companySize: persona.startsWith('enterprise_') ? 'enterprise' :
                     persona.startsWith('smb_') ? 'smb' : 'mid_market',
        industry: 'technology',
        revenue: 1000000,
        employees: 100,
        techStack: ['javascript', 'typescript'],
        companyMaturity: 'growth',
        geolocation: {
          country: 'US',
          region: 'North America',
          timezone: 'PST'
        }
      },
      behavioral: {
        sessionCount: 5,
        avgSessionDuration: 300,
        pageViewsPerSession: 8,
        contentEngagement: {
          documentsDownloaded: 2,
          videosWatched: 1,
          formsCompleted: 1,
          pricingPageViews: 2,
          featurePageViews: 5
        },
        technicalDepth: {
          integrationDocsViewed: persona.includes('cto') || persona.includes('technical'),
          apiDocsViewed: persona.includes('cto') || persona.includes('technical'),
          technicalResourcesAccessed: persona.includes('cto') ? 5 : 1
        },
        timeOnSite: 1200,
        returnVisitorPattern: 'frequent'
      },
      intent: {
        searchKeywords: ['revenue prediction', 'ai scoring'],
        competitorResearch: true,
        buyingStageSignals: {
          awareness: 0.8,
          consideration: 0.9,
          decision: 0.7,
          purchase: 0.6
        },
        contentTopicsEngaged: ['ml', 'scoring', 'prediction'],
        urgencyIndicators: {
          fastTrackRequests: persona.startsWith('smb_'),
          demoRequests: 2,
          contactFormSubmissions: 1,
          salesInquiries: 1
        },
        socialProof: {
          testimonialViews: 3,
          caseStudyDownloads: 2,
          customerSuccessStories: 1
        }
      },
      timing: {
        dayOfWeek: 2,
        hourOfDay: 14,
        monthOfYear: 3,
        quarterOfYear: 1,
        seasonality: 'high',
        recentActivity: true,
        engagementVelocity: 3.5,
        lastVisitDays: 2,
        accountAge: 30
      }
    };

    const classification = await buyerProfileService.classifyBuyerProfile(dummyLeadData);

    res.json({
      success: true,
      data: {
        persona: persona,
        engagementStrategy: classification.engagementStrategy,
        scoringAdjustments: classification.scoringAdjustments,
        characteristics: classification.characteristics,
        hierarchicalClassification: classification.hierarchicalClassification
      }
    });
  } catch (error) {
    console.error('Error fetching engagement strategy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch engagement strategy',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * @route POST /api/buyer-profiles/simulate
 * @desc Simulate buyer profile classification with sample data
 * @access Public
 */
router.post('/simulate', async (req, res) => {
  try {
    const { companySize, industry, behaviorType } = req.body;

    // Generate sample lead data based on parameters
    const sampleLeadData: LeadData = {
      firmographic: {
        companySize: companySize || 'mid_market',
        industry: industry || 'technology',
        revenue: companySize === 'enterprise' ? 50000000 :
                companySize === 'smb' ? 500000 : 5000000,
        employees: companySize === 'enterprise' ? 1000 :
                  companySize === 'smb' ? 50 : 200,
        techStack: ['javascript', 'typescript', 'react'],
        companyMaturity: 'growth',
        geolocation: {
          country: 'US',
          region: 'North America',
          timezone: 'PST'
        }
      },
      behavioral: {
        sessionCount: behaviorType === 'high_engagement' ? 15 :
                     behaviorType === 'low_engagement' ? 2 : 7,
        avgSessionDuration: behaviorType === 'high_engagement' ? 600 :
                           behaviorType === 'low_engagement' ? 120 : 300,
        pageViewsPerSession: behaviorType === 'high_engagement' ? 12 :
                            behaviorType === 'low_engagement' ? 3 : 6,
        contentEngagement: {
          documentsDownloaded: behaviorType === 'high_engagement' ? 5 : 1,
          videosWatched: behaviorType === 'high_engagement' ? 3 : 0,
          formsCompleted: behaviorType === 'high_engagement' ? 2 : 0,
          pricingPageViews: behaviorType === 'high_engagement' ? 4 : 1,
          featurePageViews: behaviorType === 'high_engagement' ? 8 : 2
        },
        technicalDepth: {
          integrationDocsViewed: behaviorType === 'high_engagement',
          apiDocsViewed: behaviorType === 'high_engagement',
          technicalResourcesAccessed: behaviorType === 'high_engagement' ? 8 : 1
        },
        timeOnSite: behaviorType === 'high_engagement' ? 2400 : 600,
        returnVisitorPattern: behaviorType === 'high_engagement' ? 'power_user' : 'occasional'
      },
      intent: {
        searchKeywords: ['revenue prediction', 'ml scoring', 'lead scoring'],
        competitorResearch: true,
        buyingStageSignals: {
          awareness: 0.9,
          consideration: behaviorType === 'high_engagement' ? 0.8 : 0.5,
          decision: behaviorType === 'high_engagement' ? 0.7 : 0.3,
          purchase: behaviorType === 'high_engagement' ? 0.6 : 0.2
        },
        contentTopicsEngaged: ['ai', 'machine learning', 'revenue optimization'],
        urgencyIndicators: {
          fastTrackRequests: behaviorType === 'high_engagement',
          demoRequests: behaviorType === 'high_engagement' ? 3 : 1,
          contactFormSubmissions: behaviorType === 'high_engagement' ? 2 : 0,
          salesInquiries: behaviorType === 'high_engagement' ? 1 : 0
        },
        socialProof: {
          testimonialViews: 2,
          caseStudyDownloads: 1,
          customerSuccessStories: 1
        }
      },
      timing: {
        dayOfWeek: 2,
        hourOfDay: 14,
        monthOfYear: 3,
        quarterOfYear: 1,
        seasonality: 'high',
        recentActivity: true,
        engagementVelocity: behaviorType === 'high_engagement' ? 5.0 : 2.0,
        lastVisitDays: 1,
        accountAge: 15
      }
    };

    const classification = await buyerProfileService.classifyBuyerProfile(sampleLeadData);

    res.json({
      success: true,
      data: {
        simulation: true,
        inputParameters: { companySize, industry, behaviorType },
        sampleLeadData,
        classification,
        interpretation: {
          confidence_level: classification.confidence > 0.8 ? 'High' :
                           classification.confidence > 0.6 ? 'Medium' : 'Low',
          primary_traits: [
            classification.characteristics.decisionLevel,
            classification.characteristics.organizationalLevel,
            classification.characteristics.communicationStyle
          ],
          recommended_approach: classification.engagementStrategy.primaryApproach
        }
      }
    });
  } catch (error) {
    console.error('Error in simulation:', error);
    res.status(500).json({
      success: false,
      error: 'Simulation failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * @route GET /api/buyer-profiles/health
 * @desc Get buyer profile service health status
 * @access Public
 */
router.get('/health', async (req, res) => {
  try {
    const health = buyerProfileService.getServiceHealth();

    res.json({
      success: true,
      data: {
        ...health,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
      }
    });
  } catch (error) {
    console.error('Error checking health:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * @route DELETE /api/buyer-profiles/data
 * @desc Clear all buyer profile data (for testing/reset)
 * @access Public
 */
router.delete('/data', async (req, res) => {
  try {
    await buyerProfileService.clearData();

    res.json({
      success: true,
      data: {
        message: 'All buyer profile data cleared successfully',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error clearing data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear data',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * @route GET /api/buyer-profiles/export
 * @desc Export buyer profile models and analytics
 * @access Public
 */
router.get('/export', async (req, res) => {
  try {
    const models = await buyerProfileService.getAllPersonaModels();
    const analytics = await buyerProfileService.getPersonaAnalytics();

    const exportData = {
      models,
      analytics,
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        totalModels: models.length,
        systemInfo: buyerProfileService.getServiceHealth()
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=buyer-profiles-export-${Date.now()}.json`);
    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({
      success: false,
      error: 'Export failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export default router;
