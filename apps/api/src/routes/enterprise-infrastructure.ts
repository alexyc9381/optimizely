import { Request, Response, Router } from 'express';
import { enterpriseInfrastructure } from '../services/enterprise-infrastructure-service';

const router = Router();

// Enterprise Infrastructure Status Endpoint
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await enterpriseInfrastructure.getStatus();
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get infrastructure status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// System Metrics Endpoint
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const timeframe = req.query.timeframe as 'hour' | 'day' | 'week' || 'hour';
    const metrics = await enterpriseInfrastructure.getMetrics(timeframe);

    res.json({
      success: true,
      data: { timeframe, metrics, count: metrics.length },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health Check Endpoint
router.get('/health', async (req: Request, res: Response) => {
  try {
    const status = await enterpriseInfrastructure.getStatus();
    const isHealthy = status.overall === 'healthy';

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'ok' : status.overall,
      healthy: isHealthy,
      instances: status.instances,
      uptime: status.uptime,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Dashboard Data Endpoint
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const status = await enterpriseInfrastructure.getStatus();
    const metrics = await enterpriseInfrastructure.getMetrics('hour');

    res.json({
      success: true,
      data: {
        overview: { status: status.overall, instances: status.instances },
        metrics: { current: status.metrics, recent: metrics.slice(-10) },
        abTesting: status.metrics.customMetrics
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
