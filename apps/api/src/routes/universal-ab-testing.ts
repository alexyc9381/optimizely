import express from 'express';
import rateLimit from 'express-rate-limit';
import { redisManager } from '../services/redis-client';
import createUniversalABTestingService from '../services/universal-ab-testing-service';

const router = express.Router();

// Initialize service
const service = createUniversalABTestingService(redisManager.getClient());

// Rate limiting
const abTestingRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many A/B testing requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
}) as any;

const highVolumeRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // Higher limit for participant tracking and conversions
  message: 'Too many tracking requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
}) as any;

const analyticsRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // limit analytics requests
  message: 'Too many analytics requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
}) as any;

// EXPERIMENT MANAGEMENT ENDPOINTS

// Create new experiment
router.post('/experiments', abTestingRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const {
      name,
      description,
      type,
      targetingRules,
      variants,
      primaryGoal,
      secondaryGoals,
      statisticalSettings,
      metadata
    } = req.body;

    if (!name || !type || !variants || !primaryGoal || !statisticalSettings || !metadata?.owner) {
      return res.status(400).json({
        error: 'Missing required fields: name, type, variants, primaryGoal, statisticalSettings, metadata.owner'
      });
    }

    // Validate variants
    if (!Array.isArray(variants) || variants.length < 2) {
      return res.status(400).json({
        error: 'At least 2 variants are required'
      });
    }

    const controlCount = variants.filter(v => v.isControl).length;
    if (controlCount !== 1) {
      return res.status(400).json({
        error: 'Exactly one variant must be marked as control'
      });
    }

    const totalAllocation = variants.reduce((sum: number, v: any) => sum + v.trafficAllocation, 0);
    if (Math.abs(totalAllocation - 100) > 0.01) {
      return res.status(400).json({
        error: 'Variant traffic allocations must sum to 100%'
      });
    }

    const experimentId = await service.createExperiment({
      name,
      description,
      type,
      status: 'draft',
      targetingRules: targetingRules || {},
      variants,
      primaryGoal,
      secondaryGoals: secondaryGoals || [],
      statisticalSettings,
      metadata: {
        owner: metadata.owner,
        team: metadata.team,
        tags: metadata.tags || [],
        hypothesis: metadata.hypothesis,
        expectedOutcome: metadata.expectedOutcome,
        businessImpact: metadata.businessImpact
      }
    });

    res.status(201).json({
      success: true,
      experimentId,
      message: 'Experiment created successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to create experiment',
      details: error.message
    });
  }
});

// Get experiment by ID
router.get('/experiments/:id', abTestingRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const experiment = await service.getExperiment(req.params.id);

    if (!experiment) {
      return res.status(404).json({
        error: 'Experiment not found'
      });
    }

    res.json({
      success: true,
      experiment
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve experiment',
      details: error.message
    });
  }
});

// List experiments with filtering
router.get('/experiments', abTestingRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { status, type, team, limit, offset } = req.query;

    const experiments = await service.getExperimentList({
      status: status as string,
      type: type as string,
      team: team as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });

    res.json({
      success: true,
      experiments,
      count: experiments.length
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve experiment list',
      details: error.message
    });
  }
});

// Update experiment
router.patch('/experiments/:id', abTestingRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const updates = req.body;

    await service.updateExperiment(req.params.id, updates);

    res.json({
      success: true,
      message: 'Experiment updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      error: 'Failed to update experiment',
      details: error.message
    });
  }
});

// EXPERIMENT LIFECYCLE ENDPOINTS

// Start experiment
router.post('/experiments/:id/start', abTestingRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    await service.startExperiment(req.params.id);

    res.json({
      success: true,
      message: 'Experiment started successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      error: 'Failed to start experiment',
      details: error.message
    });
  }
});

// Pause experiment
router.post('/experiments/:id/pause', abTestingRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    await service.pauseExperiment(req.params.id);

    res.json({
      success: true,
      message: 'Experiment paused successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      error: 'Failed to pause experiment',
      details: error.message
    });
  }
});

// Stop experiment
router.post('/experiments/:id/stop', abTestingRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { winnerId } = req.body;

    await service.stopExperiment(req.params.id, winnerId);

    res.json({
      success: true,
      message: winnerId ? 'Experiment stopped with winner declared' : 'Experiment stopped'
    });
  } catch (error: any) {
    res.status(400).json({
      error: 'Failed to stop experiment',
      details: error.message
    });
  }
});

// PARTICIPANT TRACKING ENDPOINTS

// Add participant to experiment
router.post('/experiments/:id/participants', highVolumeRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const experimentId = req.params.id;
    const {
      userId,
      sessionId,
      deviceType,
      userAgent,
      ipAddress,
      geoLocation,
      metadata
    } = req.body;

    if (!sessionId || !deviceType) {
      return res.status(400).json({
        error: 'Missing required fields: sessionId, deviceType'
      });
    }

    const variantId = await service.addParticipant({
      experimentId,
      userId,
      sessionId,
      deviceType,
      userAgent,
      ipAddress,
      geoLocation,
      metadata
    });

    res.json({
      success: true,
      variantId,
      message: 'Participant added successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      error: 'Failed to add participant',
      details: error.message
    });
  }
});

// Get participant variant (for existing participants)
router.get('/experiments/:id/participants/:participantId/variant', highVolumeRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { id: experimentId, participantId } = req.params;

    // This would typically check Redis for existing participant assignment
    // For now, we'll return a simple response
    res.json({
      success: true,
      variantId: null,
      message: 'Participant variant lookup - implement based on your participant tracking strategy'
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve participant variant',
      details: error.message
    });
  }
});

// CONVERSION TRACKING ENDPOINTS

// Record conversion
router.post('/experiments/:id/conversions', highVolumeRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const experimentId = req.params.id;
    const {
      variantId,
      participantId,
      goalId,
      value,
      properties
    } = req.body;

    if (!variantId || !participantId || !goalId) {
      return res.status(400).json({
        error: 'Missing required fields: variantId, participantId, goalId'
      });
    }

    await service.recordConversion({
      experimentId,
      variantId,
      participantId,
      goalId,
      value: value ? parseFloat(value) : undefined,
      properties
    });

    res.json({
      success: true,
      message: 'Conversion recorded successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      error: 'Failed to record conversion',
      details: error.message
    });
  }
});

// Bulk record conversions
router.post('/conversions/bulk', highVolumeRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { conversions } = req.body;

    if (!Array.isArray(conversions)) {
      return res.status(400).json({
        error: 'Conversions must be an array'
      });
    }

    const results = [];
    for (const conversion of conversions) {
      try {
        await service.recordConversion({
          ...conversion,
          value: conversion.value ? parseFloat(conversion.value) : undefined
        });
        results.push({ success: true });
      } catch (error: any) {
        results.push({ success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;

    res.json({
      success: true,
      message: `Processed ${conversions.length} conversions, ${successCount} successful`,
      results,
      successCount,
      totalCount: conversions.length
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to process bulk conversions',
      details: error.message
    });
  }
});

// STATISTICAL ANALYSIS ENDPOINTS

// Get experiment results and statistical analysis
router.get('/experiments/:id/results', analyticsRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const results = await service.calculateResults(req.params.id);

    res.json({
      success: true,
      results
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to calculate experiment results',
      details: error.message
    });
  }
});

// Get results summary for multiple experiments
router.post('/results/summary', analyticsRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { experimentIds } = req.body;

    if (!Array.isArray(experimentIds)) {
      return res.status(400).json({
        error: 'experimentIds must be an array'
      });
    }

    const summaries = [];
    for (const experimentId of experimentIds) {
      try {
        const experiment = await service.getExperiment(experimentId);
        const results = await service.calculateResults(experimentId);

        if (experiment && results) {
          summaries.push({
            experimentId,
            name: experiment.name,
            status: experiment.status,
            totalParticipants: results.totalParticipants,
            totalConversions: results.totalConversions,
            overallConversionRate: results.overallConversionRate,
            winner: results.winner,
            recommendations: results.recommendations
          });
        }
      } catch (error: any) {
        summaries.push({
          experimentId,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      summaries
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to generate results summary',
      details: error.message
    });
  }
});

// Get experiment analytics dashboard data
router.get('/analytics/dashboard', analyticsRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { status, team, days } = req.query;
    const daysBack = days ? parseInt(days as string) : 30;

    // Get filtered experiments
    const experiments = await service.getExperimentList({
      status: status as string,
      team: team as string,
      limit: 100
    });

    const dashboardData = {
      summary: {
        totalExperiments: experiments.length,
        runningExperiments: experiments.filter(e => e.status === 'running').length,
        completedExperiments: experiments.filter(e => e.status === 'completed').length,
        draftExperiments: experiments.filter(e => e.status === 'draft').length
      },
      recentExperiments: experiments.slice(0, 10).map(exp => ({
        id: exp.id,
        name: exp.name,
        status: exp.status,
        type: exp.type,
        startDate: exp.startDate,
        variants: exp.variants.length
      })),
      typeDistribution: experiments.reduce((acc, exp) => {
        acc[exp.type] = (acc[exp.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      statusDistribution: experiments.reduce((acc, exp) => {
        acc[exp.status] = (acc[exp.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    res.json({
      success: true,
      dashboard: dashboardData
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to generate dashboard data',
      details: error.message
    });
  }
});

// UTILITY ENDPOINTS

// Validate experiment configuration
router.post('/experiments/validate', abTestingRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { variants, statisticalSettings } = req.body;

    const validationErrors = [];

    // Validate variants
    if (!Array.isArray(variants) || variants.length < 2) {
      validationErrors.push('At least 2 variants are required');
    } else {
      const totalAllocation = variants.reduce((sum: number, v: any) => sum + (v.trafficAllocation || 0), 0);
      if (Math.abs(totalAllocation - 100) > 0.01) {
        validationErrors.push('Variant traffic allocations must sum to 100%');
      }

      const controlCount = variants.filter((v: any) => v.isControl).length;
      if (controlCount !== 1) {
        validationErrors.push('Exactly one variant must be marked as control');
      }
    }

    // Validate statistical settings
    if (statisticalSettings) {
      if (statisticalSettings.confidenceLevel < 80 || statisticalSettings.confidenceLevel > 99) {
        validationErrors.push('Confidence level must be between 80 and 99');
      }
      if (statisticalSettings.statisticalPower < 50 || statisticalSettings.statisticalPower > 95) {
        validationErrors.push('Statistical power must be between 50 and 95');
      }
    }

    res.json({
      success: true,
      valid: validationErrors.length === 0,
      errors: validationErrors
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to validate experiment configuration',
      details: error.message
    });
  }
});

// Calculate sample size requirements
router.post('/experiments/sample-size', abTestingRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const {
      baselineConversionRate,
      minimumDetectableEffect,
      confidenceLevel = 95,
      statisticalPower = 80,
      variants = 2
    } = req.body;

    if (!baselineConversionRate || !minimumDetectableEffect) {
      return res.status(400).json({
        error: 'Missing required fields: baselineConversionRate, minimumDetectableEffect'
      });
    }

    // Simplified sample size calculation (Welch's t-test)
    const alpha = (100 - confidenceLevel) / 100;
    const beta = (100 - statisticalPower) / 100;

    // Z-scores for alpha/2 and beta
    const zAlpha = confidenceLevel >= 99 ? 2.576 : (confidenceLevel >= 95 ? 1.96 : 1.645);
    const zBeta = statisticalPower >= 90 ? 1.282 : (statisticalPower >= 80 ? 0.842 : 0.674);

    const p1 = baselineConversionRate / 100;
    const p2 = p1 * (1 + minimumDetectableEffect / 100);

    const pooledP = (p1 + p2) / 2;
    const pooledVar = pooledP * (1 - pooledP);

    const sampleSizePerVariant = Math.ceil(
      2 * pooledVar * Math.pow(zAlpha + zBeta, 2) / Math.pow(p2 - p1, 2)
    );

    const totalSampleSize = sampleSizePerVariant * variants;

    // Estimate duration based on traffic (assuming 1000 visitors per day as baseline)
    const estimatedTrafficPerDay = 1000;
    const estimatedDuration = Math.ceil(totalSampleSize / estimatedTrafficPerDay);

    res.json({
      success: true,
      sampleSize: {
        perVariant: sampleSizePerVariant,
        total: totalSampleSize,
        estimatedDuration: estimatedDuration,
        assumptions: {
          baselineConversionRate: baselineConversionRate + '%',
          minimumDetectableEffect: minimumDetectableEffect + '%',
          confidenceLevel: confidenceLevel + '%',
          statisticalPower: statisticalPower + '%',
          variants,
          estimatedTrafficPerDay
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to calculate sample size',
      details: error.message
    });
  }
});

// HEALTH CHECK

// Service health check
router.get('/health', async (req: express.Request, res: express.Response) => {
  try {
    const health = await service.getHealthStatus();

    const statusCode = health.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json({
      service: 'Universal A/B Testing Framework',
      status: health.status,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      health
    });
  } catch (error: any) {
    res.status(503).json({
      service: 'Universal A/B Testing Framework',
      status: 'error',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      error: error.message
    });
  }
});

export default router;
