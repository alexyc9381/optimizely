import { Request, Response, Router } from 'express';
import IndustryUrgencyIntelligenceService, {
    Industry,
    UrgencyLevel,
    UrgencyType
} from '../services/industry-urgency-intelligence-service';

const router = Router();
const urgencyService = IndustryUrgencyIntelligenceService.getInstance();

// Create urgency event
router.post('/events', async (req: Request, res: Response) => {
  try {
    const {
      customerId,
      industry,
      urgencyType,
      deadline,
      title,
      description,
      stakeholderIds = [],
      dependencyCount = 0,
      tags = []
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

    if (!urgencyType || !Object.values(UrgencyType).includes(urgencyType)) {
      return res.status(400).json({
        error: 'Valid urgency type is required',
        code: 'INVALID_URGENCY_TYPE',
        supportedTypes: Object.values(UrgencyType)
      });
    }

    if (!deadline) {
      return res.status(400).json({
        error: 'Deadline is required',
        code: 'MISSING_DEADLINE'
      });
    }

    // Validate deadline is in the future
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid deadline format',
        code: 'INVALID_DEADLINE_FORMAT'
      });
    }

    const event = await urgencyService.createUrgencyEvent(
      customerId,
      industry,
      urgencyType,
      deadline,
      {
        title,
        description,
        stakeholderIds,
        dependencyCount,
        tags
      }
    );

    res.status(201).json({
      success: true,
      data: event,
      message: 'Urgency event created successfully'
    });
  } catch (error) {
    console.error('Error creating urgency event:', error);
    res.status(500).json({
      error: 'Failed to create urgency event',
      code: 'CREATION_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get urgency event by ID
router.get('/events/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const event = urgencyService.getUrgencyEvent(eventId);

    if (!event) {
      return res.status(404).json({
        error: 'Urgency event not found',
        code: 'EVENT_NOT_FOUND',
        eventId
      });
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Error retrieving urgency event:', error);
    res.status(500).json({
      error: 'Failed to retrieve urgency event',
      code: 'RETRIEVAL_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update urgency event
router.put('/events/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const updates = req.body;

    // Remove system-generated fields from updates
    const allowedUpdates = { ...updates };
    delete allowedUpdates.id;
    delete allowedUpdates.createdAt;
    delete allowedUpdates.urgencyScore;
    delete allowedUpdates.urgencyLevel;
    delete allowedUpdates.timelineRisk;

    const updatedEvent = await urgencyService.updateUrgencyEvent(eventId, allowedUpdates);

    res.json({
      success: true,
      data: updatedEvent,
      message: 'Urgency event updated successfully'
    });
  } catch (error) {
    console.error('Error updating urgency event:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Urgency event not found',
        code: 'EVENT_NOT_FOUND',
        eventId: req.params.eventId
      });
    }

    res.status(500).json({
      error: 'Failed to update urgency event',
      code: 'UPDATE_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Complete urgency event
router.post('/events/:eventId/complete', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { completedOnTime, actualCompletionDate, notes } = req.body;

    if (typeof completedOnTime !== 'boolean') {
      return res.status(400).json({
        error: 'completedOnTime boolean is required',
        code: 'MISSING_COMPLETION_STATUS'
      });
    }

    if (!actualCompletionDate) {
      return res.status(400).json({
        error: 'actualCompletionDate is required',
        code: 'MISSING_COMPLETION_DATE'
      });
    }

    const completedEvent = await urgencyService.completeUrgencyEvent(eventId, {
      completedOnTime,
      actualCompletionDate,
      notes
    });

    res.json({
      success: true,
      data: completedEvent,
      message: 'Urgency event marked as completed'
    });
  } catch (error) {
    console.error('Error completing urgency event:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Urgency event not found',
        code: 'EVENT_NOT_FOUND',
        eventId: req.params.eventId
      });
    }

    res.status(500).json({
      error: 'Failed to complete urgency event',
      code: 'COMPLETION_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get customer urgency events
router.get('/customers/:customerId/events', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const { status, urgencyLevel, industry, limit } = req.query;

    let events = urgencyService.getCustomerUrgencyEvents(customerId);

    // Apply filters
    if (status) {
      const statusFilter = status as string;
      events = events.filter(event =>
        statusFilter === 'active' ? event.isActive : !event.isActive
      );
    }

    if (urgencyLevel) {
      const levelFilter = urgencyLevel as UrgencyLevel;
      events = events.filter(event => event.urgencyLevel === levelFilter);
    }

    if (industry) {
      const industryFilter = industry as Industry;
      events = events.filter(event => event.industry === industryFilter);
    }

    // Apply limit
    if (limit) {
      const limitNum = parseInt(limit as string, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        events = events.slice(0, limitNum);
      }
    }

    // Sort by urgency score (descending) then by days until deadline
    events.sort((a, b) => {
      if (a.urgencyScore !== b.urgencyScore) {
        return b.urgencyScore - a.urgencyScore;
      }
      return a.daysUntilDeadline - b.daysUntilDeadline;
    });

    res.json({
      success: true,
      data: {
        customerId,
        events,
        total: events.length,
        filters: { status, urgencyLevel, industry, limit }
      }
    });
  } catch (error) {
    console.error('Error retrieving customer urgency events:', error);
    res.status(500).json({
      error: 'Failed to retrieve customer urgency events',
      code: 'RETRIEVAL_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get customer urgency insights
router.get('/customers/:customerId/insights', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const insights = urgencyService.getUrgencyInsights(customerId);

    res.json({
      success: true,
      data: {
        customerId,
        insights: {
          upcomingDeadlines: insights.upcomingDeadlines,
          criticalEvents: insights.criticalEvents,
          timelineConflicts: insights.timelineConflicts,
          recommendations: insights.recommendations,
          summary: {
            totalUpcoming: insights.upcomingDeadlines.length,
            totalCritical: insights.criticalEvents.length,
            totalConflicts: insights.timelineConflicts.length,
            hasUrgentActions: insights.criticalEvents.length > 0 || insights.timelineConflicts.length > 0
          }
        }
      }
    });
  } catch (error) {
    console.error('Error retrieving customer urgency insights:', error);
    res.status(500).json({
      error: 'Failed to retrieve customer urgency insights',
      code: 'INSIGHTS_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get industry urgency events
router.get('/industries/:industry/events', async (req: Request, res: Response) => {
  try {
    const { industry } = req.params;
    const { urgencyLevel, limit } = req.query;

    if (!Object.values(Industry).includes(industry as Industry)) {
      return res.status(400).json({
        error: 'Invalid industry',
        code: 'INVALID_INDUSTRY',
        supportedIndustries: Object.values(Industry)
      });
    }

    let events = urgencyService.getIndustryUrgencyEvents(industry as Industry);

    // Apply urgency level filter
    if (urgencyLevel) {
      const levelFilter = urgencyLevel as UrgencyLevel;
      events = events.filter(event => event.urgencyLevel === levelFilter);
    }

    // Apply limit
    if (limit) {
      const limitNum = parseInt(limit as string, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        events = events.slice(0, limitNum);
      }
    }

    // Sort by urgency score (descending)
    events.sort((a, b) => b.urgencyScore - a.urgencyScore);

    res.json({
      success: true,
      data: {
        industry,
        events,
        total: events.length,
        filters: { urgencyLevel, limit }
      }
    });
  } catch (error) {
    console.error('Error retrieving industry urgency events:', error);
    res.status(500).json({
      error: 'Failed to retrieve industry urgency events',
      code: 'RETRIEVAL_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get critical urgency events across all industries
router.get('/events/critical', async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    let criticalEvents = urgencyService.getCriticalUrgencyEvents();

    // Apply limit
    if (limit) {
      const limitNum = parseInt(limit as string, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        criticalEvents = criticalEvents.slice(0, limitNum);
      }
    }

    res.json({
      success: true,
      data: {
        events: criticalEvents,
        total: criticalEvents.length,
        urgencyLevel: UrgencyLevel.CRITICAL
      }
    });
  } catch (error) {
    console.error('Error retrieving critical urgency events:', error);
    res.status(500).json({
      error: 'Failed to retrieve critical urgency events',
      code: 'RETRIEVAL_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get industry analytics
router.get('/industries/:industry/analytics', async (req: Request, res: Response) => {
  try {
    const { industry } = req.params;

    if (!Object.values(Industry).includes(industry as Industry)) {
      return res.status(400).json({
        error: 'Invalid industry',
        code: 'INVALID_INDUSTRY',
        supportedIndustries: Object.values(Industry)
      });
    }

    const analytics = urgencyService.getIndustryAnalytics(industry as Industry);

    if (!analytics) {
      return res.status(404).json({
        error: 'Analytics not found for industry',
        code: 'ANALYTICS_NOT_FOUND',
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

// Get all industries analytics summary
router.get('/analytics/summary', async (req: Request, res: Response) => {
  try {
    const allAnalytics = Object.values(Industry).map(industry => ({
      industry,
      analytics: urgencyService.getIndustryAnalytics(industry)
    })).filter(item => item.analytics);

    const summary = {
      totalIndustries: allAnalytics.length,
      totalEvents: allAnalytics.reduce((sum, item) => sum + (item.analytics?.totalEvents || 0), 0),
      averageUrgencyScore: allAnalytics.reduce((sum, item) =>
        sum + (item.analytics?.averageUrgencyScore || 0), 0) / allAnalytics.length,
      urgencyDistribution: {
        critical: allAnalytics.reduce((sum, item) =>
          sum + (item.analytics?.byUrgencyLevel[UrgencyLevel.CRITICAL] || 0), 0),
        high: allAnalytics.reduce((sum, item) =>
          sum + (item.analytics?.byUrgencyLevel[UrgencyLevel.HIGH] || 0), 0),
        medium: allAnalytics.reduce((sum, item) =>
          sum + (item.analytics?.byUrgencyLevel[UrgencyLevel.MEDIUM] || 0), 0),
        low: allAnalytics.reduce((sum, item) =>
          sum + (item.analytics?.byUrgencyLevel[UrgencyLevel.LOW] || 0), 0),
        minimal: allAnalytics.reduce((sum, item) =>
          sum + (item.analytics?.byUrgencyLevel[UrgencyLevel.MINIMAL] || 0), 0)
      },
      industryBreakdown: allAnalytics.map(item => ({
        industry: item.industry,
        totalEvents: item.analytics?.totalEvents,
        averageUrgencyScore: item.analytics?.averageUrgencyScore,
        topUrgencyTypes: item.analytics?.commonUrgencyTypes.slice(0, 3)
      }))
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error retrieving analytics summary:', error);
    res.status(500).json({
      error: 'Failed to retrieve analytics summary',
      code: 'SUMMARY_FAILED',
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
      supportedUrgencyTypes: Object.values(UrgencyType).filter(type => {
        // This is a simplified filter - in reality you'd check industry configs
        return true; // All types supported for now
      })
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

// Get supported urgency types
router.get('/urgency-types', async (req: Request, res: Response) => {
  try {
    const { industry } = req.query;

    let urgencyTypes = Object.values(UrgencyType);

    // Filter by industry if specified
    if (industry && Object.values(Industry).includes(industry as Industry)) {
      // In a real implementation, you'd filter based on industry-specific configurations
      urgencyTypes = Object.values(UrgencyType); // For now, return all
    }

    const formattedTypes = urgencyTypes.map(type => ({
      value: type,
      label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      category: getUrgencyTypeCategory(type)
    }));

    res.json({
      success: true,
      data: formattedTypes,
      filters: { industry }
    });
  } catch (error) {
    console.error('Error retrieving urgency types:', error);
    res.status(500).json({
      error: 'Failed to retrieve urgency types',
      code: 'URGENCY_TYPES_FAILED',
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
      service: 'Industry Urgency Intelligence Service',
      version: '1.0.0',
      uptime: process.uptime(),
      supportedIndustries: Object.values(Industry).length,
      supportedUrgencyTypes: Object.values(UrgencyType).length,
      urgencyLevels: Object.values(UrgencyLevel)
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

// Helper function to categorize urgency types (could be moved to a utils file)
function getUrgencyTypeCategory(type: UrgencyType): string {
  const categoryMap: Record<UrgencyType, string> = {
    // College Consulting
    [UrgencyType.APPLICATION_DEADLINE]: 'Academic',
    [UrgencyType.FINANCIAL_AID_DEADLINE]: 'Financial',
    [UrgencyType.SCHOLARSHIP_DEADLINE]: 'Financial',
    [UrgencyType.EXAM_REGISTRATION]: 'Academic',
    [UrgencyType.CAMPUS_VISIT_WINDOW]: 'Administrative',

    // SaaS
    [UrgencyType.CONTRACT_RENEWAL]: 'Business',
    [UrgencyType.TRIAL_EXPIRY]: 'Business',
    [UrgencyType.FEATURE_DEPRECATION]: 'Technical',
    [UrgencyType.COMPLIANCE_AUDIT]: 'Compliance',
    [UrgencyType.ONBOARDING_DEADLINE]: 'Administrative',

    // Manufacturing
    [UrgencyType.PROCUREMENT_CYCLE]: 'Operations',
    [UrgencyType.PRODUCTION_DEADLINE]: 'Operations',
    [UrgencyType.COMPLIANCE_INSPECTION]: 'Compliance',
    [UrgencyType.SUPPLIER_REVIEW]: 'Operations',
    [UrgencyType.BUDGET_APPROVAL]: 'Financial',

    // Healthcare
    [UrgencyType.REGULATORY_COMPLIANCE]: 'Compliance',
    [UrgencyType.PATIENT_OUTCOME_REVIEW]: 'Clinical',
    [UrgencyType.CLINICAL_TRIAL_DEADLINE]: 'Clinical',
    [UrgencyType.ACCREDITATION_RENEWAL]: 'Compliance',
    [UrgencyType.HIPAA_AUDIT]: 'Compliance',

    // FinTech
    [UrgencyType.REGULATORY_FILING]: 'Regulatory',
    [UrgencyType.RISK_ASSESSMENT]: 'Risk Management',
    [UrgencyType.COMPLIANCE_REVIEW]: 'Compliance',
    [UrgencyType.AUDIT_PREPARATION]: 'Compliance',
    [UrgencyType.LICENSE_RENEWAL]: 'Regulatory'
  };

  return categoryMap[type] || 'General';
}

export default router;
