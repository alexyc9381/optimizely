import { NextApiRequest, NextApiResponse } from 'next';
import { rateLimitCheck, validateApiKey } from '../../../lib/middleware/api-auth';
import { IndustrySpecificAnalytics } from '../../../lib/services/industry-specific-analytics';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Authentication and rate limiting
    const authResult = await validateApiKey(req);
    if (!authResult.valid) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const rateLimitResult = await rateLimitCheck(req, authResult.clientId);
    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        resetTime: rateLimitResult.resetTime
      });
    }

    const analytics = new IndustrySpecificAnalytics();

    switch (req.method) {
      case 'GET':
        return handleGetAnalytics(req, res, analytics);
      case 'POST':
        return handlePostAnalytics(req, res, analytics);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Customer Analytics API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGetAnalytics(req: NextApiRequest, res: NextApiResponse, analytics: IndustrySpecificAnalytics) {
  const { customerId, industry, metrics } = req.query;

  if (!customerId) {
    return res.status(400).json({ error: 'customerId is required' });
  }

  try {
    // Create customer profile
    const profile = {
      customerId: customerId as string,
      industryType: (industry as any) || 'saas',
      companySize: 'medium' as const,
      customFields: {}
    };

    // Mock behavior data
    const behaviorData = {
      pageViews: 15,
      sessionDuration: 300,
      engagementScore: 0.75,
      conversionEvents: 2
    };

    // Get comprehensive customer analytics
    const insights = await analytics.analyzeCustomer(customerId as string, profile, behaviorData);

        let industryAnalytics: any = null;
    if (industry) {
      industryAnalytics = await analytics.getIndustryMetrics(
        customerId as string,
        industry as any
      );
    }

    const recommendations = await analytics.generateRecommendations(insights, profile.industryType);

    return res.status(200).json({
      customerId,
      profile,
      behaviorData,
      industryAnalytics,
      insights,
      recommendations,
      metadata: {
        generatedAt: new Date().toISOString(),
        industry: industry || 'generic',
        metricsRequested: metrics || 'all'
      }
    });
  } catch (error) {
    console.error('Error retrieving customer analytics:', error);
    return res.status(500).json({ error: 'Failed to retrieve analytics' });
  }
}

async function handlePostAnalytics(req: NextApiRequest, res: NextApiResponse, analytics: IndustrySpecificAnalytics) {
  const { customerId, events, industry } = req.body;

  if (!customerId) {
    return res.status(400).json({ error: 'customerId is required' });
  }

  try {
    // Create customer profile for analysis
    const profile = {
      customerId,
      industryType: industry || 'saas',
      companySize: 'medium' as const,
      customFields: {}
    };

    // Mock behavior data from events
    const behaviorData = {
      pageViews: events?.length || 1,
      sessionDuration: 300,
      engagementScore: 0.75,
      conversionEvents: events?.filter((e: any) => e.type === 'conversion').length || 0
    };

    // Trigger analysis update with new events
    const insights = await analytics.analyzeCustomer(customerId, profile, behaviorData);

    return res.status(200).json({
      success: true,
      customerId,
      eventsProcessed: events?.length || 0,
      insights: insights.slice(0, 3), // Return top 3 insights
      analysisTimestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing customer analytics:', error);
    return res.status(500).json({ error: 'Failed to process analytics' });
  }
}
