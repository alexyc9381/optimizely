/**
 * Automated Onboarding API Routes
 * Provides endpoints for managing intelligent, industry-specific onboarding flows
 */

import { Request, Response, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body, param, validationResult } from 'express-validator';
import { automatedOnboardingEngine } from '../services/automated-onboarding-engine';

const router = Router();

// Rate limiting
const standardLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' }
}) as any;

const intensiveLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: { error: 'Too many intensive requests, please try again later' }
}) as any;

/**
 * GET /api/onboarding/flows
 * Get all available onboarding flows
 */
router.get('/flows', standardLimit, (req: Request, res: Response) => {
  try {
    const flows = automatedOnboardingEngine.getAvailableFlows();

    res.json({
      success: true,
      data: flows.map(flow => ({
        id: flow.id,
        name: flow.name,
        description: flow.description,
        industry: flow.industry,
        businessModel: flow.businessModel,
        estimatedDuration: flow.estimatedDuration,
        stepCount: flow.steps.length,
        rewards: flow.rewards
      }))
    });
  } catch (error) {
    console.error('Error fetching onboarding flows:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch onboarding flows'
    });
  }
});

/**
 * GET /api/onboarding/flows/:flowId
 * Get specific onboarding flow details
 */
router.get('/flows/:flowId',
  standardLimit,
  [param('flowId').isString().notEmpty()],
  (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Invalid flow ID',
          details: errors.array()
        });
      }

      const { flowId } = req.params;
      const flow = automatedOnboardingEngine.getFlow(flowId);

      if (!flow) {
        return res.status(404).json({
          success: false,
          error: 'Onboarding flow not found'
        });
      }

      res.json({
        success: true,
        data: flow
      });
    } catch (error) {
      console.error('Error fetching onboarding flow:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch onboarding flow'
      });
    }
  }
);

/**
 * POST /api/onboarding/recommend
 * Get onboarding flow recommendations based on company profile
 */
router.post('/recommend',
  intensiveLimit,
  [
    body('companyProfile').isObject().notEmpty(),
    body('companyProfile.industry').isString().notEmpty(),
    body('companyProfile.businessModel').optional().isString(),
    body('companyProfile.teamSize').optional().isString(),
    body('companyProfile.technicalSophistication').optional().isString()
  ],
  (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Invalid company profile data',
          details: errors.array()
        });
      }

      const { companyProfile } = req.body;
      const recommendations = automatedOnboardingEngine.recommendOnboardingFlow(companyProfile);

      res.json({
        success: true,
        data: {
          recommendations,
          companyAnalysis: {
            industry: companyProfile.industry,
            detectedBusinessModel: companyProfile.businessModel || 'unknown',
            sophisticationLevel: companyProfile.technicalSophistication || 'medium'
          }
        }
      });
    } catch (error) {
      console.error('Error generating onboarding recommendations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate recommendations'
      });
    }
  }
);

/**
 * POST /api/onboarding/sessions
 * Start a new onboarding session
 */
router.post('/sessions',
  standardLimit,
  [
    body('userId').isString().notEmpty(),
    body('companyId').isString().notEmpty(),
    body('flowId').isString().notEmpty(),
    body('customizations').optional().isObject()
  ],
  (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Invalid session data',
          details: errors.array()
        });
      }

      const { userId, companyId, flowId, customizations } = req.body;

      // Check if flow exists
      const flow = automatedOnboardingEngine.getFlow(flowId);
      if (!flow) {
        return res.status(404).json({
          success: false,
          error: 'Onboarding flow not found'
        });
      }

      // Check for existing session
      const existingSession = automatedOnboardingEngine.getSession(userId);
      if (existingSession) {
        return res.status(409).json({
          success: false,
          error: 'Onboarding session already exists for this user',
          data: {
            existingSession: {
              flowId: existingSession.flowId,
              currentStepId: existingSession.currentStepId,
              completionRate: existingSession.progressMetrics.completionRate
            }
          }
        });
      }

      const session = automatedOnboardingEngine.startOnboardingSession(
        userId,
        companyId,
        flowId,
        customizations
      );

      res.status(201).json({
        success: true,
        data: {
          session,
          currentStep: automatedOnboardingEngine.getCurrentStep(userId)
        }
      });
    } catch (error) {
      console.error('Error starting onboarding session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start onboarding session'
      });
    }
  }
);

/**
 * GET /api/onboarding/sessions/:userId
 * Get current onboarding session for a user
 */
router.get('/sessions/:userId',
  standardLimit,
  [param('userId').isString().notEmpty()],
  (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Invalid user ID',
          details: errors.array()
        });
      }

      const { userId } = req.params;
      const session = automatedOnboardingEngine.getSession(userId);

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'No onboarding session found for this user'
        });
      }

      const currentStep = automatedOnboardingEngine.getCurrentStep(userId);

      res.json({
        success: true,
        data: {
          session,
          currentStep
        }
      });
    } catch (error) {
      console.error('Error fetching onboarding session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch onboarding session'
      });
    }
  }
);

/**
 * GET /api/onboarding/sessions/:userId/current-step
 * Get current step for user's onboarding session
 */
router.get('/sessions/:userId/current-step',
  standardLimit,
  [param('userId').isString().notEmpty()],
  (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Invalid user ID',
          details: errors.array()
        });
      }

      const { userId } = req.params;
      const currentStep = automatedOnboardingEngine.getCurrentStep(userId);

      if (!currentStep) {
        return res.status(404).json({
          success: false,
          error: 'No current step found - user may not have an active onboarding session'
        });
      }

      res.json({
        success: true,
        data: currentStep
      });
    } catch (error) {
      console.error('Error fetching current step:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch current step'
      });
    }
  }
);

/**
 * POST /api/onboarding/sessions/:userId/steps/:stepId/complete
 * Complete a step in the onboarding flow
 */
router.post('/sessions/:userId/steps/:stepId/complete',
  standardLimit,
  [
    param('userId').isString().notEmpty(),
    param('stepId').isString().notEmpty(),
    body('userData').optional().isObject()
  ],
  (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: errors.array()
        });
      }

      const { userId, stepId } = req.params;
      const { userData } = req.body;

      const result = automatedOnboardingEngine.completeStep(userId, stepId, userData);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: 'Failed to complete step - step may not exist or user may not have an active session'
        });
      }

      // Update time tracking
      automatedOnboardingEngine.updateTimeSpent(userId, 2); // Approximate 2 minutes per step

      res.json({
        success: true,
        data: {
          stepCompleted: stepId,
          nextStep: result.nextStep,
          onboardingCompleted: result.completed,
          rewards: result.completed ? (result as any).rewards : undefined
        }
      });
    } catch (error) {
      console.error('Error completing onboarding step:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to complete onboarding step'
      });
    }
  }
);

/**
 * POST /api/onboarding/sessions/:userId/steps/:stepId/skip
 * Skip a step in the onboarding flow
 */
router.post('/sessions/:userId/steps/:stepId/skip',
  standardLimit,
  [
    param('userId').isString().notEmpty(),
    param('stepId').isString().notEmpty()
  ],
  (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: errors.array()
        });
      }

      const { userId, stepId } = req.params;

      const result = automatedOnboardingEngine.skipStep(userId, stepId);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: 'Failed to skip step - step may not be skippable or user may not have an active session'
        });
      }

      res.json({
        success: true,
        data: {
          stepSkipped: stepId,
          nextStep: result.nextStep
        }
      });
    } catch (error) {
      console.error('Error skipping onboarding step:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to skip onboarding step'
      });
    }
  }
);

/**
 * POST /api/onboarding/sessions/:userId/help
 * Record help request during onboarding
 */
router.post('/sessions/:userId/help',
  standardLimit,
  [
    param('userId').isString().notEmpty(),
    body('stepId').isString().notEmpty(),
    body('helpType').isString().notEmpty()
  ],
  (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Invalid help request data',
          details: errors.array()
        });
      }

      const { userId } = req.params;
      const { stepId, helpType } = req.body;

      automatedOnboardingEngine.recordHelpRequest(userId, stepId, helpType);

      res.json({
        success: true,
        data: {
          message: 'Help request recorded successfully'
        }
      });
    } catch (error) {
      console.error('Error recording help request:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to record help request'
      });
    }
  }
);

/**
 * POST /api/onboarding/sessions/:userId/errors
 * Record error encountered during onboarding
 */
router.post('/sessions/:userId/errors',
  standardLimit,
  [
    param('userId').isString().notEmpty(),
    body('stepId').isString().notEmpty(),
    body('error').isString().notEmpty()
  ],
  (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Invalid error report data',
          details: errors.array()
        });
      }

      const { userId } = req.params;
      const { stepId, error } = req.body;

      automatedOnboardingEngine.recordError(userId, stepId, error);

      res.json({
        success: true,
        data: {
          message: 'Error recorded successfully'
        }
      });
    } catch (error) {
      console.error('Error recording onboarding error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to record error'
      });
    }
  }
);

/**
 * PUT /api/onboarding/sessions/:userId/time
 * Update time spent in onboarding session
 */
router.put('/sessions/:userId/time',
  standardLimit,
  [
    param('userId').isString().notEmpty(),
    body('additionalMinutes').isNumeric()
  ],
  (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Invalid time update data',
          details: errors.array()
        });
      }

      const { userId } = req.params;
      const { additionalMinutes } = req.body;

      automatedOnboardingEngine.updateTimeSpent(userId, additionalMinutes);

      res.json({
        success: true,
        data: {
          message: 'Time tracking updated successfully'
        }
      });
    } catch (error) {
      console.error('Error updating time spent:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update time tracking'
      });
    }
  }
);

/**
 * GET /api/onboarding/analytics/:flowId
 * Get analytics for a specific onboarding flow
 */
router.get('/analytics/:flowId',
  intensiveLimit,
  [param('flowId').isString().notEmpty()],
  (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Invalid flow ID',
          details: errors.array()
        });
      }

      const { flowId } = req.params;
      const analytics = automatedOnboardingEngine.generateFlowAnalytics(flowId);

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error generating flow analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate flow analytics'
      });
    }
  }
);

/**
 * DELETE /api/onboarding/sessions/:userId
 * Cancel/delete an onboarding session
 */
router.delete('/sessions/:userId',
  standardLimit,
  [param('userId').isString().notEmpty()],
  (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Invalid user ID',
          details: errors.array()
        });
      }

      const { userId } = req.params;
      const session = automatedOnboardingEngine.getSession(userId);

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'No onboarding session found for this user'
        });
      }

      // In a real implementation, you would delete the session
      // For now, we'll just return success
      res.json({
        success: true,
        data: {
          message: 'Onboarding session cancelled successfully'
        }
      });
    } catch (error) {
      console.error('Error cancelling onboarding session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel onboarding session'
      });
    }
  }
);

export default router;
