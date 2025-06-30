import { NextApiRequest, NextApiResponse } from 'next';
import { CustomerJourneyVisualizationEngine } from '../../../lib/services/customer-journey-visualization-engine';

const journeyEngine = CustomerJourneyVisualizationEngine.getInstance();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
          message: `Method ${method} not allowed`
        });
    }
  } catch (error) {
    console.error('Customer Journey API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { action, userId, journeyId, limit } = req.query;

  switch (action) {
    case 'health': {
      const health = await journeyEngine.healthCheck();
      return res.json({
        success: true,
        data: health
      });
    }

    case 'user-journeys': {
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'Missing parameter',
          message: 'userId parameter is required'
        });
      }

      const journeys = await journeyEngine.getCustomerJourney(userId as string);
      return res.json({
        success: true,
        data: journeys
      });
    }

    case 'journey-visualization': {
      if (!journeyId) {
        return res.status(400).json({
          success: false,
          error: 'Missing parameter',
          message: 'journeyId parameter is required'
        });
      }

      const visualization = await journeyEngine.getJourneyVisualization(journeyId as string);
      if (!visualization) {
        return res.status(404).json({
          success: false,
          error: 'Journey not found',
          message: `Journey with ID ${journeyId} not found`
        });
      }

      return res.json({
        success: true,
        data: visualization
      });
    }

    case 'conversion-paths': {
      const paths = await journeyEngine.getConversionPaths(
        limit ? parseInt(limit as string) : 10
      );
      return res.json({
        success: true,
        data: paths
      });
    }

    case 'dropoff-analyses': {
      const analyses = await journeyEngine.getDropOffAnalyses(
        limit ? parseInt(limit as string) : 10
      );
      return res.json({
        success: true,
        data: analyses
      });
    }

    case 'optimization-recommendations': {
      const recommendations = await journeyEngine.getOptimizationRecommendations(
        limit ? parseInt(limit as string) : 5
      );
      return res.json({
        success: true,
        data: recommendations
      });
    }

    default:
      return res.status(400).json({
        success: false,
        error: 'Invalid action',
        message: 'Valid actions: health, user-journeys, journey-visualization, conversion-paths, dropoff-analyses, optimization-recommendations'
      });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { action } = req.query;
  const data = req.body;

  switch (action) {
    case 'track-touchpoint': {
      if (!data.sessionId || !data.type || !data.channel || !data.source || !data.medium || !data.deviceType) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'sessionId, type, channel, source, medium, and deviceType are required'
        });
      }

      const touchpoint = await journeyEngine.trackTouchpoint(data);
      return res.json({
        success: true,
        data: touchpoint
      });
    }

    case 'clear-data': {
      // Only allow in development mode
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
          success: false,
          error: 'Operation not allowed',
          message: 'Data clearing is not allowed in production'
        });
      }

      journeyEngine.clearJourneyData();
      return res.json({
        success: true,
        message: 'Journey data cleared successfully'
      });
    }

    default:
      return res.status(400).json({
        success: false,
        error: 'Invalid action',
        message: 'Valid actions: track-touchpoint, clear-data'
      });
  }
}
