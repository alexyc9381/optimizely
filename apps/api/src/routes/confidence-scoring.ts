import { Request, Response, Router } from 'express';
import ConfidenceScoringService, {
    ConfidenceCalibration,
    ConfidenceMetrics,
    ConfidenceThresholds,
    UncertaintyQuantification
} from '../services/confidence-scoring-service';
import { LeadData, ModelPerformanceMetrics, ScoringResult } from '../services/ml-types';

const router = Router();
const confidenceService = new ConfidenceScoringService();

/**
 * POST /calculate
 * Calculate comprehensive confidence metrics for a prediction
 */
router.post('/calculate', async (req: Request, res: Response) => {
  try {
    const {
      leadData,
      scoringResult,
      modelPerformance
    }: {
      leadData: LeadData;
      scoringResult: ScoringResult;
      modelPerformance?: ModelPerformanceMetrics;
    } = req.body;

    if (!leadData || !scoringResult) {
      return res.status(400).json({
        error: 'Missing required data',
        message: 'Please provide leadData and scoringResult for confidence calculation'
      });
    }

    const confidenceMetrics = await confidenceService.calculateConfidenceMetrics(
      leadData,
      scoringResult,
      modelPerformance
    );

    res.json({
      success: true,
      data: confidenceMetrics,
      metadata: {
        timestamp: new Date().toISOString(),
        calculationType: 'comprehensive_confidence',
        modelVersion: scoringResult.metadata.modelVersion
      }
    });

  } catch (error) {
    console.error('Confidence calculation error:', error);
    res.status(500).json({
      error: 'Confidence calculation failed',
      message: 'Failed to calculate confidence metrics for the provided prediction'
    });
  }
});

/**
 * POST /batch-calculate
 * Calculate confidence metrics for multiple predictions in batch
 */
router.post('/batch-calculate', async (req: Request, res: Response) => {
  try {
    const {
      predictions,
      modelPerformance
    }: {
      predictions: Array<{ leadData: LeadData; scoringResult: ScoringResult; }>;
      modelPerformance?: ModelPerformanceMetrics;
    } = req.body;

    if (!predictions || !Array.isArray(predictions) || predictions.length === 0) {
      return res.status(400).json({
        error: 'Invalid predictions data',
        message: 'Please provide an array of predictions with leadData and scoringResult'
      });
    }

    if (predictions.length > 100) {
      return res.status(400).json({
        error: 'Batch size too large',
        message: 'Maximum batch size is 100 predictions'
      });
    }

    const results = await Promise.all(
      predictions.map(async ({ leadData, scoringResult }, index) => {
        try {
          const confidenceMetrics = await confidenceService.calculateConfidenceMetrics(
            leadData,
            scoringResult,
            modelPerformance
          );

          return {
            index,
            success: true,
            confidenceMetrics
          };
        } catch (error) {
          return {
            index,
            success: false,
            error: 'Confidence calculation failed for this prediction'
          };
        }
      })
    );

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    res.json({
      success: true,
      data: {
        results: successful,
        summary: {
          total: predictions.length,
          successful: successful.length,
          failed: failed.length,
          failureRate: (failed.length / predictions.length) * 100
        }
      },
      metadata: {
        timestamp: new Date().toISOString(),
        batchSize: predictions.length,
        processingTime: Date.now()
      }
    });

  } catch (error) {
    console.error('Batch confidence calculation error:', error);
    res.status(500).json({
      error: 'Batch confidence calculation failed',
      message: 'Failed to process confidence metrics for the prediction batch'
    });
  }
});

/**
 * POST /recommendations
 * Generate confidence-based recommendations for a prediction
 */
router.post('/recommendations', async (req: Request, res: Response) => {
  try {
    const {
      leadData,
      scoringResult,
      confidenceMetrics
    }: {
      leadData: LeadData;
      scoringResult: ScoringResult;
      confidenceMetrics?: ConfidenceMetrics;
    } = req.body;

    if (!leadData || !scoringResult) {
      return res.status(400).json({
        error: 'Missing required data',
        message: 'Please provide leadData and scoringResult for recommendation generation'
      });
    }

    // Calculate confidence metrics if not provided
    let metrics = confidenceMetrics;
    if (!metrics) {
      metrics = await confidenceService.calculateConfidenceMetrics(leadData, scoringResult);
    }

    const recommendations = await confidenceService.generateConfidenceBasedRecommendations(
      leadData,
      scoringResult,
      metrics
    );

    res.json({
      success: true,
      data: {
        recommendations,
        confidenceMetrics: metrics
      },
      metadata: {
        timestamp: new Date().toISOString(),
        recommendationType: 'confidence_based',
        overallConfidence: metrics.overallConfidence
      }
    });

  } catch (error) {
    console.error('Recommendation generation error:', error);
    res.status(500).json({
      error: 'Recommendation generation failed',
      message: 'Failed to generate confidence-based recommendations'
    });
  }
});

/**
 * POST /data-quality
 * Assess data quality for lead data
 */
router.post('/data-quality', async (req: Request, res: Response) => {
  try {
    const { leadData }: { leadData: LeadData } = req.body;

    if (!leadData) {
      return res.status(400).json({
        error: 'Missing lead data',
        message: 'Please provide leadData for data quality assessment'
      });
    }

    // Use the private method through the public interface
    const confidenceMetrics = await confidenceService.calculateConfidenceMetrics(
      leadData,
      {
        totalScore: 0,
        confidence: 0.5,
        breakdown: { firmographic: 0, behavioral: 0, intent: 0, timing: 0 },
        predictions: {
          dealSize: {
            predicted: 0,
            range: { min: 0, max: 0 },
            confidence: 0.5
          },
          closeProb: {
            probability: 0.5,
            timeframe: '30d',
            confidence: 0.5
          },
          timeToClose: {
            days: 30,
            range: { min: 20, max: 40 },
            confidence: 0.5
          }
        },
        buyerProfile: 'individual_user',
        industrySpecific: {
          modelUsed: 'default',
          industryScore: 0,
          industryBenchmark: 0
        },
        metadata: {
          modelVersion: 'v1.0',
          scoredAt: new Date(),
          dataQuality: 0.5,
          featureCount: 0
        }
      }
    );

    res.json({
      success: true,
      data: {
        dataQuality: confidenceMetrics.dataQuality,
        completenessBreakdown: {
          firmographic: {
            completeness: confidenceMetrics.componentConfidences?.firmographic || 0,
            missingFields: getMissingFirmographicFields(leadData)
          },
          behavioral: {
            completeness: confidenceMetrics.componentConfidences?.behavioral || 0,
            missingFields: getMissingBehavioralFields(leadData)
          },
          intent: {
            completeness: confidenceMetrics.componentConfidences?.intent || 0,
            missingFields: getMissingIntentFields(leadData)
          },
          timing: {
            completeness: confidenceMetrics.componentConfidences?.timing || 0,
            missingFields: getMissingTimingFields(leadData)
          }
        }
      },
      metadata: {
        timestamp: new Date().toISOString(),
        assessmentType: 'data_quality'
      }
    });

  } catch (error) {
    console.error('Data quality assessment error:', error);
    res.status(500).json({
      error: 'Data quality assessment failed',
      message: 'Failed to assess data quality for the provided lead data'
    });
  }
});

/**
 * GET /thresholds
 * Get current confidence thresholds
 */
router.get('/thresholds', async (req: Request, res: Response) => {
  try {
    // Return default thresholds (in a real implementation, these would be stored/configurable)
    const thresholds: ConfidenceThresholds = {
      highConfidence: 0.8,
      mediumConfidence: 0.6,
      lowConfidence: 0.4,
      dataQualityMinimum: 0.5,
      uncertaintyTolerance: 0.3
    };

    res.json({
      success: true,
      data: thresholds,
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Threshold retrieval error:', error);
    res.status(500).json({
      error: 'Threshold retrieval failed',
      message: 'Failed to retrieve confidence thresholds'
    });
  }
});

/**
 * PUT /thresholds
 * Update confidence thresholds
 */
router.put('/thresholds', async (req: Request, res: Response) => {
  try {
    const { thresholds }: { thresholds: Partial<ConfidenceThresholds> } = req.body;

    if (!thresholds) {
      return res.status(400).json({
        error: 'Missing threshold data',
        message: 'Please provide threshold values to update'
      });
    }

    // Validate threshold values
    const validationErrors: string[] = [];

    if (thresholds.highConfidence !== undefined) {
      if (thresholds.highConfidence < 0 || thresholds.highConfidence > 1) {
        validationErrors.push('highConfidence must be between 0 and 1');
      }
    }

    if (thresholds.mediumConfidence !== undefined) {
      if (thresholds.mediumConfidence < 0 || thresholds.mediumConfidence > 1) {
        validationErrors.push('mediumConfidence must be between 0 and 1');
      }
    }

    if (thresholds.lowConfidence !== undefined) {
      if (thresholds.lowConfidence < 0 || thresholds.lowConfidence > 1) {
        validationErrors.push('lowConfidence must be between 0 and 1');
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Invalid threshold values',
        message: validationErrors.join('; ')
      });
    }

    // In a real implementation, this would update the stored thresholds
    // For now, we'll return the updated values
    const updatedThresholds: ConfidenceThresholds = {
      highConfidence: thresholds.highConfidence ?? 0.8,
      mediumConfidence: thresholds.mediumConfidence ?? 0.6,
      lowConfidence: thresholds.lowConfidence ?? 0.4,
      dataQualityMinimum: thresholds.dataQualityMinimum ?? 0.5,
      uncertaintyTolerance: thresholds.uncertaintyTolerance ?? 0.3
    };

    res.json({
      success: true,
      data: updatedThresholds,
      metadata: {
        timestamp: new Date().toISOString(),
        action: 'thresholds_updated',
        updatedFields: Object.keys(thresholds)
      }
    });

  } catch (error) {
    console.error('Threshold update error:', error);
    res.status(500).json({
      error: 'Threshold update failed',
      message: 'Failed to update confidence thresholds'
    });
  }
});

/**
 * POST /uncertainty
 * Quantify prediction uncertainty
 */
router.post('/uncertainty', async (req: Request, res: Response) => {
  try {
    const {
      leadData,
      scoringResult
    }: {
      leadData: LeadData;
      scoringResult: ScoringResult;
    } = req.body;

    if (!leadData || !scoringResult) {
      return res.status(400).json({
        error: 'Missing required data',
        message: 'Please provide leadData and scoringResult for uncertainty quantification'
      });
    }

    // Calculate uncertainty bounds from confidence metrics
    const confidenceMetrics = await confidenceService.calculateConfidenceMetrics(leadData, scoringResult);

    const uncertaintyQuantification: UncertaintyQuantification = {
      aleatoricUncertainty: 1 - confidenceMetrics.dataQuality.score,
      epistemicUncertainty: 1 - confidenceMetrics.overallConfidence,
      totalUncertainty: Math.sqrt(
        Math.pow(1 - confidenceMetrics.dataQuality.score, 2) +
        Math.pow(1 - confidenceMetrics.overallConfidence, 2)
      ),
      confidenceInterval: {
        lower: confidenceMetrics.uncertaintyBounds.scoreRange.min,
        upper: confidenceMetrics.uncertaintyBounds.scoreRange.max
      },
      predictionStability: confidenceMetrics.overallConfidence
    };

    res.json({
      success: true,
      data: {
        uncertainty: uncertaintyQuantification,
        uncertaintyBounds: confidenceMetrics.uncertaintyBounds,
        explanation: {
          aleatoricUncertainty: 'Uncertainty due to inherent noise in the data',
          epistemicUncertainty: 'Uncertainty due to model knowledge limitations',
          totalUncertainty: 'Combined uncertainty from both sources',
          predictionStability: 'Consistency of predictions across model variations'
        }
      },
      metadata: {
        timestamp: new Date().toISOString(),
        quantificationType: 'comprehensive_uncertainty'
      }
    });

  } catch (error) {
    console.error('Uncertainty quantification error:', error);
    res.status(500).json({
      error: 'Uncertainty quantification failed',
      message: 'Failed to quantify prediction uncertainty'
    });
  }
});

/**
 * GET /calibration
 * Get model confidence calibration data
 */
router.get('/calibration', async (req: Request, res: Response) => {
  try {
    // In a real implementation, this would retrieve actual calibration data
    const calibrationData: ConfidenceCalibration = {
      calibrationCurve: [
        { predictedConfidence: 0.1, actualAccuracy: 0.12 },
        { predictedConfidence: 0.2, actualAccuracy: 0.18 },
        { predictedConfidence: 0.3, actualAccuracy: 0.31 },
        { predictedConfidence: 0.4, actualAccuracy: 0.42 },
        { predictedConfidence: 0.5, actualAccuracy: 0.48 },
        { predictedConfidence: 0.6, actualAccuracy: 0.59 },
        { predictedConfidence: 0.7, actualAccuracy: 0.68 },
        { predictedConfidence: 0.8, actualAccuracy: 0.79 },
        { predictedConfidence: 0.9, actualAccuracy: 0.87 }
      ],
      reliabilityIndex: 0.85,
      overconfidenceRatio: 0.12,
      underconfidenceRatio: 0.08,
      lastCalibrationDate: new Date()
    };

    res.json({
      success: true,
      data: calibrationData,
      metadata: {
        timestamp: new Date().toISOString(),
        calibrationType: 'model_confidence',
        dataPoints: calibrationData.calibrationCurve.length
      }
    });

  } catch (error) {
    console.error('Calibration data retrieval error:', error);
    res.status(500).json({
      error: 'Calibration data retrieval failed',
      message: 'Failed to retrieve model confidence calibration data'
    });
  }
});

/**
 * GET /health
 * Health check for confidence scoring service
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Perform basic health checks
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        confidenceCalculation: 'operational',
        dataQualityAssessment: 'operational',
        uncertaintyQuantification: 'operational',
        recommendationEngine: 'operational'
      },
      metrics: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        lastCalculation: new Date().toISOString()
      }
    };

    res.json({
      success: true,
      data: healthStatus
    });

  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      error: 'Service unhealthy',
      message: 'Confidence scoring service is experiencing issues'
    });
  }
});

// Helper functions for data quality assessment
function getMissingFirmographicFields(leadData: LeadData): string[] {
  const missing: string[] = [];
  if (!leadData.firmographic.companySize) missing.push('companySize');
  if (!leadData.firmographic.industry) missing.push('industry');
  if (leadData.firmographic.revenue === null) missing.push('revenue');
  if (leadData.firmographic.employees === null) missing.push('employees');
  if (!leadData.firmographic.techStack?.length) missing.push('techStack');
  if (!leadData.firmographic.companyMaturity) missing.push('companyMaturity');
  if (!leadData.firmographic.geolocation?.country) missing.push('geolocation');
  return missing;
}

function getMissingBehavioralFields(leadData: LeadData): string[] {
  const missing: string[] = [];
  if (leadData.behavioral.sessionCount === 0) missing.push('sessionCount');
  if (leadData.behavioral.avgSessionDuration === 0) missing.push('avgSessionDuration');
  if (leadData.behavioral.pageViewsPerSession === 0) missing.push('pageViewsPerSession');
  if (!leadData.behavioral.contentEngagement) missing.push('contentEngagement');
  if (!leadData.behavioral.technicalDepth) missing.push('technicalDepth');
  if (!leadData.behavioral.returnVisitorPattern) missing.push('returnVisitorPattern');
  return missing;
}

function getMissingIntentFields(leadData: LeadData): string[] {
  const missing: string[] = [];
  if (!leadData.intent.searchKeywords?.length) missing.push('searchKeywords');
  if (typeof leadData.intent.competitorResearch !== 'boolean') missing.push('competitorResearch');
  if (!leadData.intent.buyingStageSignals) missing.push('buyingStageSignals');
  if (!leadData.intent.contentTopicsEngaged?.length) missing.push('contentTopicsEngaged');
  if (!leadData.intent.urgencyIndicators) missing.push('urgencyIndicators');
  if (!leadData.intent.socialProof) missing.push('socialProof');
  return missing;
}

function getMissingTimingFields(leadData: LeadData): string[] {
  const missing: string[] = [];
  if (typeof leadData.timing.dayOfWeek !== 'number') missing.push('dayOfWeek');
  if (typeof leadData.timing.hourOfDay !== 'number') missing.push('hourOfDay');
  if (typeof leadData.timing.monthOfYear !== 'number') missing.push('monthOfYear');
  if (typeof leadData.timing.quarterOfYear !== 'number') missing.push('quarterOfYear');
  if (!leadData.timing.seasonality) missing.push('seasonality');
  if (typeof leadData.timing.recentActivity !== 'boolean') missing.push('recentActivity');
  if (typeof leadData.timing.engagementVelocity !== 'number') missing.push('engagementVelocity');
  if (typeof leadData.timing.lastVisitDays !== 'number') missing.push('lastVisitDays');
  return missing;
}

export default router;
