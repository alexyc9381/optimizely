import express from 'express';
import { industryMetricMappingService } from '../services/industry-metric-mapping-service';

const router = express.Router();

/**
 * Get all available industries
 */
router.get('/industries', (req: express.Request, res: express.Response) => {
  try {
    const industries = industryMetricMappingService.getAllIndustries();
    res.json({
      success: true,
      data: {
        industries,
        count: industries.length
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get industry profile with all metrics and characteristics
 */
router.get('/industries/:industry', (req: express.Request, res: express.Response) => {
  try {
    const { industry } = req.params;
    const profile = industryMetricMappingService.getIndustryProfile(industry);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Industry not found'
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get top A/B testing metrics for an industry
 */
router.get('/industries/:industry/ab-test-metrics', (req: express.Request, res: express.Response) => {
  try {
    const { industry } = req.params;
    const limit = parseInt(req.query.limit as string) || 5;
    
    const metrics = industryMetricMappingService.getTopABTestMetrics(industry, limit);
    
    res.json({
      success: true,
      data: {
        industry,
        metrics,
        count: metrics.length
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
