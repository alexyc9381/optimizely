/**
 * Multi-Industry Pipeline Management API Routes
 *
 * RESTful API endpoints for comprehensive customer journey tracking
 * across multiple industries with universal pipeline management.
 */

import express from 'express';
import MultiIndustryPipelineManagementService, {
    CriticalDate,
    Industry,
    PipelineStage,
    StakeholderData
} from '../services/multi-industry-pipeline-management-service';

const router = express.Router();
const pipelineService = MultiIndustryPipelineManagementService.getInstance();

// ============================================================================
// JOURNEY MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * POST /api/pipeline/journeys
 * Create a new customer journey
 */
router.post('/journeys', async (req, res) => {
  try {
    const { customerId, industry, initialData } = req.body;

    if (!customerId || !industry) {
      return res.status(400).json({
        error: 'Missing required fields: customerId, industry'
      });
    }

    if (!Object.values(Industry).includes(industry)) {
      return res.status(400).json({
        error: 'Invalid industry. Must be one of: ' + Object.values(Industry).join(', ')
      });
    }

    const journey = await pipelineService.createJourney(
      customerId,
      industry as Industry,
      initialData
    );

    res.status(201).json({
      success: true,
      data: journey
    });
  } catch (error) {
    console.error('Error creating journey:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/pipeline/journeys/:customerId
 * Get customer journey by ID
 */
router.get('/journeys/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const journey = pipelineService.getJourney(customerId);

    if (!journey) {
      return res.status(404).json({
        error: 'Journey not found',
        customerId
      });
    }

    res.json({
      success: true,
      data: journey
    });
  } catch (error) {
    console.error('Error retrieving journey:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/pipeline/journeys/:customerId/stage
 * Advance customer to next stage
 */
router.put('/journeys/:customerId/stage', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { targetStage, metadata } = req.body;

    if (!targetStage) {
      return res.status(400).json({
        error: 'Missing required field: targetStage'
      });
    }

    if (!Object.values(PipelineStage).includes(targetStage)) {
      return res.status(400).json({
        error: 'Invalid pipeline stage. Must be one of: ' + Object.values(PipelineStage).join(', ')
      });
    }

    const journey = await pipelineService.advanceStage(
      customerId,
      targetStage as PipelineStage,
      metadata
    );

    res.json({
      success: true,
      data: journey
    });
  } catch (error) {
    console.error('Error advancing stage:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        error: error.message,
        customerId: req.params.customerId
      });
    } else if (error instanceof Error && error.message.includes('Invalid stage')) {
      res.status(400).json({
        error: error.message
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

// ============================================================================
// STAKEHOLDER MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * POST /api/pipeline/journeys/:customerId/stakeholders
 * Add stakeholder to customer journey
 */
router.post('/journeys/:customerId/stakeholders', async (req, res) => {
  try {
    const { customerId } = req.params;
    const stakeholderData: StakeholderData = req.body;

    if (!stakeholderData.stakeholderId || !stakeholderData.role) {
      return res.status(400).json({
        error: 'Missing required stakeholder fields: stakeholderId, role'
      });
    }

    if (typeof stakeholderData.influence !== 'number' ||
        stakeholderData.influence < 0 ||
        stakeholderData.influence > 100) {
      return res.status(400).json({
        error: 'Influence must be a number between 0 and 100'
      });
    }

    if (typeof stakeholderData.engagement !== 'number' ||
        stakeholderData.engagement < 0 ||
        stakeholderData.engagement > 100) {
      return res.status(400).json({
        error: 'Engagement must be a number between 0 and 100'
      });
    }

    const journey = await pipelineService.addStakeholder(customerId, stakeholderData);

    res.status(201).json({
      success: true,
      data: journey
    });
  } catch (error) {
    console.error('Error adding stakeholder:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        error: error.message,
        customerId: req.params.customerId
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

// ============================================================================
// CRITICAL DATE MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * POST /api/pipeline/journeys/:customerId/critical-dates
 * Add critical date to customer journey
 */
router.post('/journeys/:customerId/critical-dates', async (req, res) => {
  try {
    const { customerId } = req.params;
    const criticalDateData: CriticalDate = req.body;

    if (!criticalDateData.dateType || !criticalDateData.date) {
      return res.status(400).json({
        error: 'Missing required critical date fields: dateType, date'
      });
    }

    if (typeof criticalDateData.urgency !== 'number' ||
        criticalDateData.urgency < 0 ||
        criticalDateData.urgency > 100) {
      return res.status(400).json({
        error: 'Urgency must be a number between 0 and 100'
      });
    }

    // Validate date format
    const dateObj = new Date(criticalDateData.date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format. Please use ISO 8601 format'
      });
    }

    const journey = await pipelineService.addCriticalDate(customerId, criticalDateData);

    res.status(201).json({
      success: true,
      data: journey
    });
  } catch (error) {
    console.error('Error adding critical date:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        error: error.message,
        customerId: req.params.customerId
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

// ============================================================================
// INDUSTRY AND ANALYTICS ENDPOINTS
// ============================================================================

/**
 * GET /api/pipeline/industries/:industry/journeys
 * Get all journeys for specific industry
 */
router.get('/industries/:industry/journeys', async (req, res) => {
  try {
    const { industry } = req.params;

    if (!Object.values(Industry).includes(industry as Industry)) {
      return res.status(400).json({
        error: 'Invalid industry. Must be one of: ' + Object.values(Industry).join(', ')
      });
    }

    const journeys = pipelineService.getJourneysByIndustry(industry as Industry);

    res.json({
      success: true,
      data: {
        industry,
        totalJourneys: journeys.length,
        journeys
      }
    });
  } catch (error) {
    console.error('Error retrieving industry journeys:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/pipeline/industries/:industry/analytics
 * Get analytics for specific industry
 */
router.get('/industries/:industry/analytics', async (req, res) => {
  try {
    const { industry } = req.params;

    if (!Object.values(Industry).includes(industry as Industry)) {
      return res.status(400).json({
        error: 'Invalid industry. Must be one of: ' + Object.values(Industry).join(', ')
      });
    }

    const analytics = pipelineService.getIndustryAnalytics(industry as Industry);

    if (!analytics) {
      return res.status(404).json({
        error: 'Analytics not found for industry',
        industry
      });
    }

    res.json({
      success: true,
      data: {
        industry,
        analytics
      }
    });
  } catch (error) {
    console.error('Error retrieving industry analytics:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// UTILITY ENDPOINTS
// ============================================================================

/**
 * GET /api/pipeline/industries
 * Get list of supported industries
 */
router.get('/industries', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        industries: Object.values(Industry),
        totalSupported: Object.values(Industry).length
      }
    });
  } catch (error) {
    console.error('Error retrieving industries:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/pipeline/stages
 * Get list of all pipeline stages
 */
router.get('/stages', async (req, res) => {
  try {
    const { industry } = req.query;

    if (industry && !Object.values(Industry).includes(industry as Industry)) {
      return res.status(400).json({
        error: 'Invalid industry parameter. Must be one of: ' + Object.values(Industry).join(', ')
      });
    }

    const allStages = Object.values(PipelineStage);

    res.json({
      success: true,
      data: {
        stages: allStages,
        totalStages: allStages.length,
        industry: industry || 'all'
      }
    });
  } catch (error) {
    console.error('Error retrieving pipeline stages:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/pipeline/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    const totalJourneys = Array.from((pipelineService as any).journeys.values()).length;
    const totalAnalytics = Array.from((pipelineService as any).industryAnalytics.values()).length;

    res.json({
      success: true,
      data: {
        status: 'healthy',
        service: 'Multi-Industry Pipeline Management',
        totalJourneys,
        totalAnalytics,
        supportedIndustries: Object.values(Industry).length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in health check:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
