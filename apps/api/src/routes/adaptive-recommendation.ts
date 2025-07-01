import { Request, Response, Router } from 'express';
import AdaptiveRecommendationEngine, {
    ActionType,
    BehaviorContext,
    RecommendationInteraction,
    RecommendationType,
    UserBehavior
} from '../services/adaptive-recommendation-engine';

const router = Router();
const engine = AdaptiveRecommendationEngine.getInstance();

// Validation helpers
const validateUserId = (userId: string): boolean => {
  return !!(userId && typeof userId === 'string' && userId.length > 0);
};

const validateBehavior = (behavior: any): behavior is UserBehavior => {
  return (
    behavior &&
    typeof behavior.userId === 'string' &&
    typeof behavior.sessionId === 'string' &&
    typeof behavior.timestamp === 'string' &&
    behavior.action &&
    Object.values(ActionType).includes(behavior.action.type) &&
    behavior.context
  );
};

const validateRecommendationInteraction = (interaction: any): interaction is RecommendationInteraction => {
  return (
    interaction &&
    typeof interaction.recommendationId === 'string' &&
    ['viewed', 'accepted', 'rejected', 'ignored', 'deferred'].includes(interaction.action) &&
    typeof interaction.timestamp === 'string'
  );
};

// 1. Record User Behavior
router.post('/behavior', async (req: Request, res: Response) => {
  try {
    const behavior = req.body;

    if (!validateBehavior(behavior)) {
      return res.status(400).json({
        error: 'Invalid behavior data',
        message: 'Please provide valid behavior data with userId, sessionId, timestamp, action, and context'
      });
    }

    await engine.recordUserBehavior(behavior);

    res.status(201).json({
      success: true,
      message: 'Behavior recorded successfully',
      behaviorId: `${behavior.userId}_${behavior.timestamp}`
    });
  } catch (error) {
    console.error('Error recording behavior:', error);
    res.status(500).json({
      error: 'Failed to record behavior',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 2. Get Personalized Recommendations
router.get('/recommendations/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const context = req.query as Partial<BehaviorContext>;

    if (!validateUserId(userId)) {
      return res.status(400).json({
        error: 'Invalid user ID',
        message: 'Please provide a valid user ID'
      });
    }

    const recommendations = await engine.getUserRecommendations(userId, context);

    res.status(200).json({
      success: true,
      data: {
        userId,
        recommendations,
        count: recommendations.length,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({
      error: 'Failed to generate recommendations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 3. Track Recommendation Interaction
router.post('/recommendations/:userId/interactions', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { recommendationId, ...interactionData } = req.body;

    if (!validateUserId(userId)) {
      return res.status(400).json({
        error: 'Invalid user ID',
        message: 'Please provide a valid user ID'
      });
    }

    if (!validateRecommendationInteraction(interactionData)) {
      return res.status(400).json({
        error: 'Invalid interaction data',
        message: 'Please provide valid interaction data with recommendationId, action, and timestamp'
      });
    }

    await engine.trackRecommendationInteraction(userId, recommendationId, interactionData);

    res.status(201).json({
      success: true,
      message: 'Recommendation interaction tracked successfully',
      interactionId: `${userId}_${recommendationId}_${interactionData.timestamp}`
    });
  } catch (error) {
    console.error('Error tracking recommendation interaction:', error);
    res.status(500).json({
      error: 'Failed to track interaction',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 4. Get User Profile
router.get('/profile/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!validateUserId(userId)) {
      return res.status(400).json({
        error: 'Invalid user ID',
        message: 'Please provide a valid user ID'
      });
    }

    const profile = await engine.getUserProfile(userId);

    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found',
        message: `No profile found for user: ${userId}`
      });
    }

    res.status(200).json({
      success: true,
      data: {
        profile,
        profileAge: new Date().getTime() - new Date(profile.lastUpdated).getTime(),
        interactionCount: profile.recommendationHistory.length,
        behaviorPatternCount: profile.behaviorPatterns.length
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      error: 'Failed to fetch profile',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 5. Update User Goals
router.put('/profile/:userId/goals', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { goals } = req.body;

    if (!validateUserId(userId)) {
      return res.status(400).json({
        error: 'Invalid user ID',
        message: 'Please provide a valid user ID'
      });
    }

    if (!Array.isArray(goals)) {
      return res.status(400).json({
        error: 'Invalid goals data',
        message: 'Goals must be an array'
      });
    }

    // Validate goal structure
    const validGoals = goals.every((goal: any) =>
      goal &&
      typeof goal.id === 'string' &&
      typeof goal.description === 'string' &&
      typeof goal.priority === 'number' &&
      typeof goal.progress === 'number'
    );

    if (!validGoals) {
      return res.status(400).json({
        error: 'Invalid goal structure',
        message: 'Each goal must have id, description, priority, and progress fields'
      });
    }

    await engine.updateUserGoals(userId, goals);

    res.status(200).json({
      success: true,
      message: 'User goals updated successfully',
      goalsCount: goals.length
    });
  } catch (error) {
    console.error('Error updating user goals:', error);
    res.status(500).json({
      error: 'Failed to update goals',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 6. Get Recommendation Types
router.get('/recommendation-types', async (req: Request, res: Response) => {
  try {
    const types = Object.values(RecommendationType).map(type => ({
      value: type,
      label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: getRecommendationTypeDescription(type)
    }));

    res.status(200).json({
      success: true,
      data: {
        types,
        count: types.length
      }
    });
  } catch (error) {
    console.error('Error fetching recommendation types:', error);
    res.status(500).json({
      error: 'Failed to fetch recommendation types',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 7. Get Engine Statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = engine.getEngineStats();

    res.status(200).json({
      success: true,
      data: {
        ...stats,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      }
    });
  } catch (error) {
    console.error('Error fetching engine stats:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 8. Batch Record Behaviors
router.post('/behavior/batch', async (req: Request, res: Response) => {
  try {
    const { behaviors } = req.body;

    if (!Array.isArray(behaviors)) {
      return res.status(400).json({
        error: 'Invalid behaviors data',
        message: 'Behaviors must be an array'
      });
    }

    const validBehaviors = behaviors.filter(validateBehavior);
    const invalidCount = behaviors.length - validBehaviors.length;

    // Record all valid behaviors
    const promises = validBehaviors.map(behavior => engine.recordUserBehavior(behavior));
    await Promise.all(promises);

    res.status(201).json({
      success: true,
      message: 'Batch behaviors recorded successfully',
      processed: validBehaviors.length,
      invalid: invalidCount,
      total: behaviors.length
    });
  } catch (error) {
    console.error('Error recording batch behaviors:', error);
    res.status(500).json({
      error: 'Failed to record batch behaviors',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 9. Get User Behavior Patterns
router.get('/profile/:userId/patterns', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!validateUserId(userId)) {
      return res.status(400).json({
        error: 'Invalid user ID',
        message: 'Please provide a valid user ID'
      });
    }

    const profile = await engine.getUserProfile(userId);

    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found',
        message: `No profile found for user: ${userId}`
      });
    }

    const patterns = profile.behaviorPatterns.map(pattern => ({
      ...pattern,
      successRate: pattern.outcomes.length > 0
        ? pattern.outcomes.reduce((sum, outcome) => sum + outcome, 0) / pattern.outcomes.length
        : 0
    }));

    res.status(200).json({
      success: true,
      data: {
        userId,
        patterns,
        totalPatterns: patterns.length,
        averageConfidence: patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length || 0
      }
    });
  } catch (error) {
    console.error('Error fetching behavior patterns:', error);
    res.status(500).json({
      error: 'Failed to fetch behavior patterns',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 10. Health Check
router.get('/health', async (req: Request, res: Response) => {
  try {
    const stats = engine.getEngineStats();
    const isHealthy = stats.totalUsers >= 0; // Basic health check

    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      engine: 'adaptive-recommendation',
      stats: {
        totalUsers: stats.totalUsers,
        avgAdaptationScore: stats.avgAdaptationScore
      }
    });
  } catch (error) {
    console.error('Error in health check:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Helper function for recommendation type descriptions
function getRecommendationTypeDescription(type: RecommendationType): string {
  const descriptions: Record<RecommendationType, string> = {
    [RecommendationType.WIDGET_SUGGESTION]: 'Recommend specific widgets for user dashboards',
    [RecommendationType.DASHBOARD_LAYOUT]: 'Suggest optimal dashboard layout configurations',
    [RecommendationType.FEATURE_INTRODUCTION]: 'Introduce new features based on user behavior',
    [RecommendationType.WORKFLOW_OPTIMIZATION]: 'Optimize existing user workflows and processes',
    [RecommendationType.INTEGRATION_SUGGESTION]: 'Suggest beneficial third-party integrations',
    [RecommendationType.ONBOARDING_STEP]: 'Guide users through onboarding processes',
    [RecommendationType.CONTENT_PERSONALIZATION]: 'Personalize content based on preferences',
    [RecommendationType.ALERT_CONFIGURATION]: 'Recommend alert and notification settings',
    [RecommendationType.AUTOMATION_RULE]: 'Suggest automation rules and workflows',
    [RecommendationType.TRAINING_CONTENT]: 'Recommend relevant training and educational content'
  };

  return descriptions[type] || 'General recommendation';
}

// Error handling middleware for this router
router.use((error: Error, req: Request, res: Response, next: Function) => {
  console.error('Adaptive Recommendation Router Error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred in the recommendation engine',
    timestamp: new Date().toISOString()
  });
});

export default router;
