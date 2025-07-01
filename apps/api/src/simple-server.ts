import cors from 'cors';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Mock API endpoints for frontend
app.get('/api/v1/analytics/overview', (req, res) => {
  res.json({
    totalVisitors: 12540,
    totalSessions: 18250,
    conversionRate: 8.4,
    revenueGenerated: 245000,
    activeExperiments: 7,
    modelAccuracy: 94.2
  });
});

app.get('/api/v1/ab-testing/experiments', (req, res) => {
  res.json([
    {
      id: '1',
      name: 'Dashboard Layout Optimization',
      status: 'running',
      conversionRate: 12.5,
      confidence: 95.2,
      participantCount: 1250
    },
    {
      id: '2',
      name: 'CTA Button Color Test',
      status: 'completed',
      conversionRate: 18.7,
      confidence: 98.1,
      participantCount: 2100
    }
  ]);
});

app.get('/api/v1/adaptive-recommendation/stats', (req, res) => {
  res.json({
    totalRecommendations: 8450,
    clickThroughRate: 24.8,
    userEngagement: 78.5,
    personalizedExperiences: 3200
  });
});

app.get('/api/v1/model-refinement/performance', (req, res) => {
  res.json({
    overallAccuracy: 94.2,
    modelsTracked: 8,
    retrainingsThisWeek: 3,
    performanceImprovement: 8.7
  });
});

app.get('/api/v1/outcome-tracking/metrics', (req, res) => {
  res.json({
    businessOutcomes: [
      { metric: 'Revenue Growth', value: 23.5, unit: '%' },
      { metric: 'Customer Retention', value: 89.2, unit: '%' },
      { metric: 'Conversion Rate', value: 8.4, unit: '%' },
      { metric: 'User Engagement', value: 78.5, unit: '%' }
    ],
    lastUpdated: new Date().toISOString()
  });
});

// System health endpoints
app.get('/api/v1/system/health', (req, res) => {
  res.json({
    services: {
      'API Gateway': { status: 'Connected', uptime: '99.9%' },
      'ML Engine': { status: 'Connected', uptime: '98.7%' },
      'A/B Testing': { status: 'Connected', uptime: '99.2%' },
      'Analytics': { status: 'Connected', uptime: '99.8%' },
      'Recommendations': { status: 'Connected', uptime: '97.5%' }
    },
    lastChecked: new Date().toISOString()
  });
});

app.get('/api/v1/dashboard/data', (req, res) => {
  res.json({
    metrics: {
      totalVisitors: 12540,
      totalSessions: 18250,
      conversionRate: 8.4,
      revenueGenerated: 245000,
      activeExperiments: 7,
      modelAccuracy: 94.2
    },
    experiments: [
      { name: 'Dashboard Layout', status: 'running', performance: 95.2 },
      { name: 'CTA Optimization', status: 'completed', performance: 98.1 }
    ],
    recommendations: {
      totalRecommendations: 8450,
      clickThroughRate: 24.8,
      userEngagement: 78.5
    },
    modelPerformance: {
      overallAccuracy: 94.2,
      modelsTracked: 8,
      retrainingsThisWeek: 3
    },
    businessOutcomes: [
      { metric: 'Revenue Growth', value: 23.5, unit: '%' },
      { metric: 'Customer Retention', value: 89.2, unit: '%' },
      { metric: 'Conversion Rate', value: 8.4, unit: '%' },
      { metric: 'User Engagement', value: 78.5, unit: '%' }
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple API Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📈 Dashboard data: http://localhost:${PORT}/api/v1/dashboard/data`);
});
