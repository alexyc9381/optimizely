import { NextApiRequest, NextApiResponse } from 'next';
import { BehavioralMetricsAnalyticsEngine } from '../../../lib/services/behavioral-metrics-analytics-engine';

const analyticsEngine = BehavioralMetricsAnalyticsEngine.getInstance();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({
          success: false,
          error: 'Method not allowed',
          message: `Method ${method} not allowed`,
        });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message:
        error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { action, ...params } = req.query;

  switch (action) {
    case 'health': {
      const health = await analyticsEngine.healthCheck();
      return res.json({
        success: true,
        data: health,
      });
    }

    case 'summary': {
      const summary = await analyticsEngine.getAnalyticsSummary();
      return res.json({
        success: true,
        data: summary,
      });
    }

    case 'flow-patterns': {
      const timeRange =
        params.start && params.end
          ? {
              start: new Date(params.start as string),
              end: new Date(params.end as string),
            }
          : undefined;

      const patterns = await analyticsEngine.getFlowPatterns(timeRange);
      return res.json({
        success: true,
        data: patterns,
      });
    }

    case 'top-content': {
      const limit = params.limit ? parseInt(params.limit as string) : 10;
      const topContent = await analyticsEngine.getTopPerformingContent(limit);
      return res.json({
        success: true,
        data: topContent,
      });
    }

    case 'content-comparison': {
      if (!params.contentIds) {
        return res.status(400).json({
          success: false,
          error: 'Missing parameter',
          message: 'contentIds parameter is required',
        });
      }

      const contentIds = (params.contentIds as string).split(',');
      const comparison =
        await analyticsEngine.compareContentPerformance(contentIds);
      return res.json({
        success: true,
        data: comparison,
      });
    }

    default:
      return res.status(400).json({
        success: false,
        error: 'Invalid action',
        message:
          'Valid actions: health, summary, flow-patterns, top-content, content-comparison',
      });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { action } = req.query;
  const data = req.body;

  switch (action) {
    case 'analyze-page-flow': {
      if (!data.sessionId || !data.pageViews) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'sessionId and pageViews are required',
        });
      }

      const flow = await analyticsEngine.analyzePageFlow(
        data.sessionId,
        data.pageViews
      );
      return res.json({
        success: true,
        data: flow,
      });
    }

    case 'analyze-content-engagement': {
      if (!data.contentId || !data.interactions) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'contentId and interactions are required',
        });
      }

      const engagement = await analyticsEngine.analyzeContentEngagement(
        data.contentId,
        data.interactions
      );
      return res.json({
        success: true,
        data: engagement,
      });
    }

    case 'analyze-interaction-pattern': {
      if (!data.sessionId || !data.pageViews || !data.interactions) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'sessionId, pageViews, and interactions are required',
        });
      }

      const pattern = await analyticsEngine.analyzeInteractionPattern(data);
      return res.json({
        success: true,
        data: pattern,
      });
    }

    case 'calculate-session-quality': {
      if (!data.sessionId || !data.pageViews) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'sessionId and pageViews are required',
        });
      }

      const quality = await analyticsEngine.calculateSessionQuality(data);
      return res.json({
        success: true,
        data: quality,
      });
    }

    case 'generate-report': {
      if (!data.timeRange || !data.timeRange.start || !data.timeRange.end) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'timeRange with start and end dates is required',
        });
      }

      const timeRange = {
        start: new Date(data.timeRange.start),
        end: new Date(data.timeRange.end),
      };

      const report = await analyticsEngine.generateAnalyticsReport(timeRange);
      return res.json({
        success: true,
        data: report,
      });
    }

    case 'clear-data': {
      // Only allow in development mode
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
          success: false,
          error: 'Operation not allowed',
          message: 'Data clearing is not allowed in production',
        });
      }

      analyticsEngine.clearAnalyticsData();
      return res.json({
        success: true,
        message: 'Analytics data cleared successfully',
      });
    }

    default:
      return res.status(400).json({
        success: false,
        error: 'Invalid action',
        message:
          'Valid actions: analyze-page-flow, analyze-content-engagement, analyze-interaction-pattern, calculate-session-quality, generate-report, clear-data',
      });
  }
}
