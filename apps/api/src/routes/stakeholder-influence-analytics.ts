/**
 * Stakeholder Influence Analytics API Routes
 *
 * RESTful API endpoints for advanced stakeholder influence tracking,
 * engagement analytics, and decision-making influence measurement
 * across multiple industries.
 */

import { Request, Response, Router } from 'express';
import { Industry } from '../services/multi-industry-pipeline-management-service';
import StakeholderInfluenceAnalyticsService, {
    EngagementType,
    StakeholderRole
} from '../services/stakeholder-influence-analytics-service';

const router = Router();
const analyticsService = StakeholderInfluenceAnalyticsService.getInstance();

// ============================================================================
// STAKEHOLDER NETWORK MANAGEMENT
// ============================================================================

/**
 * POST /stakeholder-analytics/networks
 * Initialize stakeholder network for a customer
 */
router.post('/networks', async (req: Request, res: Response) => {
  try {
    const { customerId, industry, initialStakeholders } = req.body;

    if (!customerId || !industry) {
      return res.status(400).json({
        error: 'Missing required fields: customerId and industry'
      });
    }

    if (!Object.values(Industry).includes(industry)) {
      return res.status(400).json({
        error: 'Invalid industry. Must be one of: ' + Object.values(Industry).join(', ')
      });
    }

    const network = await analyticsService.initializeStakeholderNetwork(
      customerId,
      industry,
      initialStakeholders
    );

    res.status(201).json({
      success: true,
      data: {
        customerId: network.customerId,
        networkHealth: network.networkHealth,
        networkStrength: network.networkStrength,
        stakeholderCount: network.stakeholders.size,
        championsCount: network.champions.length,
        blockersCount: network.blockers.length,
        decisionCommitteeSize: network.decisionCommittee.length
      }
    });
  } catch (error) {
    console.error('Error initializing stakeholder network:', error);
    res.status(500).json({
      error: 'Failed to initialize stakeholder network',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /stakeholder-analytics/networks/:customerId
 * Get stakeholder network overview
 */
router.get('/networks/:customerId', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const network = analyticsService.getStakeholderNetwork(customerId);

    if (!network) {
      return res.status(404).json({
        error: 'Stakeholder network not found'
      });
    }

    // Convert Map to object for JSON serialization
    const stakeholdersArray = Array.from(network.stakeholders.values());

    res.json({
      success: true,
      data: {
        customerId: network.customerId,
        networkHealth: network.networkHealth,
        networkStrength: network.networkStrength,
        stakeholders: stakeholdersArray,
        relationships: network.relationships,
        decisionCommittee: network.decisionCommittee,
        champions: network.champions,
        blockers: network.blockers
      }
    });
  } catch (error) {
    console.error('Error retrieving stakeholder network:', error);
    res.status(500).json({
      error: 'Failed to retrieve stakeholder network',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// STAKEHOLDER MANAGEMENT
// ============================================================================

/**
 * POST /stakeholder-analytics/networks/:customerId/stakeholders
 * Add enhanced stakeholder to network
 */
router.post('/networks/:customerId/stakeholders', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const { stakeholder, industry } = req.body;

    if (!stakeholder || !industry) {
      return res.status(400).json({
        error: 'Missing required fields: stakeholder and industry'
      });
    }

    if (!Object.values(Industry).includes(industry)) {
      return res.status(400).json({
        error: 'Invalid industry. Must be one of: ' + Object.values(Industry).join(', ')
      });
    }

    if (stakeholder.role && !Object.values(StakeholderRole).includes(stakeholder.role)) {
      return res.status(400).json({
        error: 'Invalid stakeholder role. Must be one of: ' + Object.values(StakeholderRole).join(', ')
      });
    }

    const enhancedStakeholder = await analyticsService.addEnhancedStakeholder(
      customerId,
      stakeholder,
      industry
    );

    res.status(201).json({
      success: true,
      data: enhancedStakeholder
    });
  } catch (error) {
    console.error('Error adding stakeholder:', error);
    res.status(500).json({
      error: 'Failed to add stakeholder',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /stakeholder-analytics/networks/:customerId/stakeholders/:stakeholderId
 * Get specific stakeholder details
 */
router.get('/networks/:customerId/stakeholders/:stakeholderId', async (req: Request, res: Response) => {
  try {
    const { customerId, stakeholderId } = req.params;
    const network = analyticsService.getStakeholderNetwork(customerId);

    if (!network) {
      return res.status(404).json({
        error: 'Stakeholder network not found'
      });
    }

    const stakeholder = network.stakeholders.get(stakeholderId);
    if (!stakeholder) {
      return res.status(404).json({
        error: 'Stakeholder not found'
      });
    }

    res.json({
      success: true,
      data: stakeholder
    });
  } catch (error) {
    console.error('Error retrieving stakeholder:', error);
    res.status(500).json({
      error: 'Failed to retrieve stakeholder',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// ENGAGEMENT TRACKING
// ============================================================================

/**
 * POST /stakeholder-analytics/networks/:customerId/stakeholders/:stakeholderId/engagements
 * Record engagement event
 */
router.post('/networks/:customerId/stakeholders/:stakeholderId/engagements', async (req: Request, res: Response) => {
  try {
    const { customerId, stakeholderId } = req.params;
    const { engagement, industry } = req.body;

    if (!engagement || !industry) {
      return res.status(400).json({
        error: 'Missing required fields: engagement and industry'
      });
    }

    if (!Object.values(Industry).includes(industry)) {
      return res.status(400).json({
        error: 'Invalid industry. Must be one of: ' + Object.values(Industry).join(', ')
      });
    }

    if (engagement.type && !Object.values(EngagementType).includes(engagement.type)) {
      return res.status(400).json({
        error: 'Invalid engagement type. Must be one of: ' + Object.values(EngagementType).join(', ')
      });
    }

    await analyticsService.recordEngagement(
      customerId,
      stakeholderId,
      engagement,
      industry
    );

    // Get updated stakeholder data
    const network = analyticsService.getStakeholderNetwork(customerId);
    const updatedStakeholder = network?.stakeholders.get(stakeholderId);

    res.status(201).json({
      success: true,
      data: {
        message: 'Engagement recorded successfully',
        stakeholder: {
          stakeholderId: updatedStakeholder?.stakeholderId,
          engagement: updatedStakeholder?.engagement,
          engagementTrend: updatedStakeholder?.engagementTrend,
          predictionScore: updatedStakeholder?.predictionScore,
          lastEngagementDate: updatedStakeholder?.lastEngagementDate
        }
      }
    });
  } catch (error) {
    console.error('Error recording engagement:', error);
    res.status(500).json({
      error: 'Failed to record engagement',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /stakeholder-analytics/networks/:customerId/stakeholders/:stakeholderId/engagements
 * Get stakeholder engagement history
 */
router.get('/networks/:customerId/stakeholders/:stakeholderId/engagements', async (req: Request, res: Response) => {
  try {
    const { customerId, stakeholderId } = req.params;
    const { limit = '50', type } = req.query;

    const network = analyticsService.getStakeholderNetwork(customerId);
    if (!network) {
      return res.status(404).json({
        error: 'Stakeholder network not found'
      });
    }

    const stakeholder = network.stakeholders.get(stakeholderId);
    if (!stakeholder) {
      return res.status(404).json({
        error: 'Stakeholder not found'
      });
    }

    let engagements = stakeholder.engagementHistory;

    // Filter by type if specified
    if (type && Object.values(EngagementType).includes(type as EngagementType)) {
      engagements = engagements.filter(e => e.type === type);
    }

    // Limit results
    const limitNum = parseInt(limit as string);
    if (limitNum > 0) {
      engagements = engagements.slice(-limitNum); // Get most recent
    }

    res.json({
      success: true,
      data: {
        stakeholderId,
        totalEngagements: stakeholder.engagementHistory.length,
        filteredEngagements: engagements.length,
        engagementScore: stakeholder.engagement,
        engagementTrend: stakeholder.engagementTrend,
        engagements
      }
    });
  } catch (error) {
    console.error('Error retrieving engagements:', error);
    res.status(500).json({
      error: 'Failed to retrieve engagements',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// STAKEHOLDER INTERACTIONS
// ============================================================================

/**
 * POST /stakeholder-analytics/networks/:customerId/interactions
 * Record stakeholder interaction
 */
router.post('/networks/:customerId/interactions', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const { interaction, industry } = req.body;

    if (!interaction || !industry) {
      return res.status(400).json({
        error: 'Missing required fields: interaction and industry'
      });
    }

    if (!Object.values(Industry).includes(industry)) {
      return res.status(400).json({
        error: 'Invalid industry. Must be one of: ' + Object.values(Industry).join(', ')
      });
    }

    if (!interaction.stakeholderIds || !Array.isArray(interaction.stakeholderIds)) {
      return res.status(400).json({
        error: 'stakeholderIds must be provided as an array'
      });
    }

    const validOutcomes = ['positive', 'neutral', 'negative'];
    if (interaction.outcome && !validOutcomes.includes(interaction.outcome)) {
      return res.status(400).json({
        error: 'Invalid outcome. Must be one of: ' + validOutcomes.join(', ')
      });
    }

    await analyticsService.recordInteraction(
      customerId,
      interaction,
      industry
    );

    res.status(201).json({
      success: true,
      data: {
        message: 'Interaction recorded successfully'
      }
    });
  } catch (error) {
    console.error('Error recording interaction:', error);
    res.status(500).json({
      error: 'Failed to record interaction',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /stakeholder-analytics/networks/:customerId/interactions
 * Get network interaction history
 */
router.get('/networks/:customerId/interactions', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const { limit = '50', type, outcome } = req.query;

    const network = analyticsService.getStakeholderNetwork(customerId);
    if (!network) {
      return res.status(404).json({
        error: 'Stakeholder network not found'
      });
    }

    let interactions = network.relationships;

    // Filter by type if specified
    const validTypes = ['meeting', 'email_thread', 'phone_call', 'collaboration'];
    if (type && validTypes.includes(type as string)) {
      interactions = interactions.filter(i => i.type === type);
    }

    // Filter by outcome if specified
    const validOutcomes = ['positive', 'neutral', 'negative'];
    if (outcome && validOutcomes.includes(outcome as string)) {
      interactions = interactions.filter(i => i.outcome === outcome);
    }

    // Limit results
    const limitNum = parseInt(limit as string);
    if (limitNum > 0) {
      interactions = interactions.slice(-limitNum); // Get most recent
    }

    res.json({
      success: true,
      data: {
        customerId,
        totalInteractions: network.relationships.length,
        filteredInteractions: interactions.length,
        interactions
      }
    });
  } catch (error) {
    console.error('Error retrieving interactions:', error);
    res.status(500).json({
      error: 'Failed to retrieve interactions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// ANALYTICS AND INSIGHTS
// ============================================================================

/**
 * GET /stakeholder-analytics/networks/:customerId/insights
 * Get comprehensive stakeholder insights
 */
router.get('/networks/:customerId/insights', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const { industry } = req.query;

    if (!industry) {
      return res.status(400).json({
        error: 'Missing required query parameter: industry'
      });
    }

    if (!Object.values(Industry).includes(industry as Industry)) {
      return res.status(400).json({
        error: 'Invalid industry. Must be one of: ' + Object.values(Industry).join(', ')
      });
    }

    const insights = await analyticsService.getStakeholderInsights(
      customerId,
      industry as Industry
    );

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({
      error: 'Failed to generate insights',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /stakeholder-analytics/industries/:industry/analytics
 * Get industry-wide analytics
 */
router.get('/industries/:industry/analytics', async (req: Request, res: Response) => {
  try {
    const { industry } = req.params;

    if (!Object.values(Industry).includes(industry as Industry)) {
      return res.status(400).json({
        error: 'Invalid industry. Must be one of: ' + Object.values(Industry).join(', ')
      });
    }

    const analytics = analyticsService.getIndustryAnalytics(industry as Industry);

    if (!analytics) {
      return res.status(404).json({
        error: 'Analytics not found for industry'
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
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// UTILITY ENDPOINTS
// ============================================================================

/**
 * GET /stakeholder-analytics/roles
 * Get all available stakeholder roles
 */
router.get('/roles', (req: Request, res: Response) => {
  const roles = Object.values(StakeholderRole).map(role => ({
    value: role,
    label: role.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }));

  res.json({
    success: true,
    data: roles
  });
});

/**
 * GET /stakeholder-analytics/engagement-types
 * Get all available engagement types
 */
router.get('/engagement-types', (req: Request, res: Response) => {
  const engagementTypes = Object.values(EngagementType).map(type => ({
    value: type,
    label: type.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }));

  res.json({
    success: true,
    data: engagementTypes
  });
});

/**
 * GET /stakeholder-analytics/industries
 * Get all supported industries
 */
router.get('/industries', (req: Request, res: Response) => {
  const industries = Object.values(Industry).map(industry => ({
    value: industry,
    label: industry.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }));

  res.json({
    success: true,
    data: industries
  });
});

/**
 * GET /stakeholder-analytics/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'Stakeholder Influence Analytics',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;
