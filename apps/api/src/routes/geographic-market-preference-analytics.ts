import { Request, Response, Router } from 'express';
import GeographicMarketPreferenceAnalyticsService, {
    Industry,
    MarketType,
    PreferenceStrength
} from '../services/geographic-market-preference-analytics-service';

const router = Router();
const marketPreferenceService = GeographicMarketPreferenceAnalyticsService.getInstance();

// Create market preference
router.post('/preferences', async (req: Request, res: Response) => {
  try {
    const {
      customerId,
      industry,
      marketType,
      preferenceValue,
      explicitScore,
      geographicLocation,
      source = 'explicit',
      metadata,
      industrySpecificData,
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

    if (!marketType || !Object.values(MarketType).includes(marketType)) {
      return res.status(400).json({
        error: 'Valid market type is required',
        code: 'INVALID_MARKET_TYPE',
        supportedMarketTypes: Object.values(MarketType)
      });
    }

    if (!preferenceValue) {
      return res.status(400).json({
        error: 'Preference value is required',
        code: 'MISSING_PREFERENCE_VALUE'
      });
    }

    const preference = await marketPreferenceService.createMarketPreference(
      customerId,
      industry,
      marketType,
      preferenceValue,
      {
        explicitScore,
        geographicLocation,
        source,
        metadata,
        industrySpecificData,
        tags
      }
    );

    res.status(201).json({
      success: true,
      data: preference,
      message: 'Market preference created successfully'
    });
  } catch (error) {
    console.error('Error creating market preference:', error);
    res.status(500).json({
      error: 'Failed to create market preference',
      code: 'CREATION_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get market preference by ID
router.get('/preferences/:preferenceId', async (req: Request, res: Response) => {
  try {
    const { preferenceId } = req.params;
    const preference = marketPreferenceService.getMarketPreference(preferenceId);

    if (!preference) {
      return res.status(404).json({
        error: 'Market preference not found',
        code: 'PREFERENCE_NOT_FOUND',
        preferenceId
      });
    }

    res.json({
      success: true,
      data: preference
    });
  } catch (error) {
    console.error('Error retrieving market preference:', error);
    res.status(500).json({
      error: 'Failed to retrieve market preference',
      code: 'RETRIEVAL_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update market preference
router.put('/preferences/:preferenceId', async (req: Request, res: Response) => {
  try {
    const { preferenceId } = req.params;
    const updates = req.body;

    // Remove system-generated fields from updates
    const allowedUpdates = { ...updates };
    delete allowedUpdates.id;
    delete allowedUpdates.createdAt;
    delete allowedUpdates.preferenceScore; // Will be recalculated if needed
    delete allowedUpdates.preferenceStrength; // Will be recalculated if needed

    const updatedPreference = await marketPreferenceService.updateMarketPreference(
      preferenceId,
      allowedUpdates
    );

    res.json({
      success: true,
      data: updatedPreference,
      message: 'Market preference updated successfully'
    });
  } catch (error) {
    console.error('Error updating market preference:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Market preference not found',
        code: 'PREFERENCE_NOT_FOUND',
        preferenceId: req.params.preferenceId
      });
    }

    res.status(500).json({
      error: 'Failed to update market preference',
      code: 'UPDATE_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete market preference
router.delete('/preferences/:preferenceId', async (req: Request, res: Response) => {
  try {
    const { preferenceId } = req.params;
    const deleted = marketPreferenceService.deleteMarketPreference(preferenceId);

    if (!deleted) {
      return res.status(404).json({
        error: 'Market preference not found',
        code: 'PREFERENCE_NOT_FOUND',
        preferenceId
      });
    }

    res.json({
      success: true,
      message: 'Market preference deleted successfully',
      preferenceId
    });
  } catch (error) {
    console.error('Error deleting market preference:', error);
    res.status(500).json({
      error: 'Failed to delete market preference',
      code: 'DELETION_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get customer market preferences
router.get('/customers/:customerId/preferences', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const { industry, marketType, minScore, maxScore, limit } = req.query;

    let preferences = marketPreferenceService.getCustomerMarketPreferences(customerId);

    // Apply filters
    if (industry) {
      preferences = preferences.filter(p => p.industry === industry);
    }

    if (marketType) {
      preferences = preferences.filter(p => p.marketType === marketType);
    }

    if (minScore) {
      const minScoreNum = parseInt(minScore as string, 10);
      if (!isNaN(minScoreNum)) {
        preferences = preferences.filter(p => p.preferenceScore >= minScoreNum);
      }
    }

    if (maxScore) {
      const maxScoreNum = parseInt(maxScore as string, 10);
      if (!isNaN(maxScoreNum)) {
        preferences = preferences.filter(p => p.preferenceScore <= maxScoreNum);
      }
    }

    // Apply limit
    if (limit) {
      const limitNum = parseInt(limit as string, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        preferences = preferences.slice(0, limitNum);
      }
    }

    res.json({
      success: true,
      data: {
        customerId,
        preferences,
        total: preferences.length,
        filters: { industry, marketType, minScore, maxScore, limit }
      }
    });
  } catch (error) {
    console.error('Error retrieving customer preferences:', error);
    res.status(500).json({
      error: 'Failed to retrieve customer preferences',
      code: 'RETRIEVAL_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get customer market insights
router.get('/customers/:customerId/insights', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const { industry } = req.query;

    const insights = marketPreferenceService.generateMarketInsights(
      customerId,
      industry as Industry
    );

    res.json({
      success: true,
      data: {
        customerId,
        insights: {
          ...insights,
          summary: {
            totalPreferences: insights.topPreferences.length,
            averageScore: insights.topPreferences.length > 0
              ? Math.round(insights.topPreferences.reduce((sum, p) => sum + p.preferenceScore, 0) / insights.topPreferences.length)
              : 0,
            strongPreferences: insights.topPreferences.filter(p => p.preferenceStrength === PreferenceStrength.STRONG || p.preferenceStrength === PreferenceStrength.VERY_STRONG).length,
            geographicCoverage: insights.geographicClusters.length,
            riskLevel: insights.predictionModel.riskFactors.length > 2 ? 'high' : insights.predictionModel.riskFactors.length > 0 ? 'medium' : 'low'
          }
        }
      }
    });
  } catch (error) {
    console.error('Error generating customer insights:', error);

    if (error instanceof Error && error.message.includes('No market preferences found')) {
      return res.status(404).json({
        error: 'No market preferences found for customer',
        code: 'NO_PREFERENCES_FOUND',
        customerId: req.params.customerId
      });
    }

    res.status(500).json({
      error: 'Failed to generate customer insights',
      code: 'INSIGHTS_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get industry market preferences
router.get('/industries/:industry/preferences', async (req: Request, res: Response) => {
  try {
    const { industry } = req.params;
    const { marketType, minScore, limit } = req.query;

    if (!Object.values(Industry).includes(industry as Industry)) {
      return res.status(400).json({
        error: 'Invalid industry',
        code: 'INVALID_INDUSTRY',
        supportedIndustries: Object.values(Industry)
      });
    }

    let preferences = marketPreferenceService.getIndustryMarketPreferences(industry as Industry);

    // Apply filters
    if (marketType) {
      preferences = preferences.filter(p => p.marketType === marketType);
    }

    if (minScore) {
      const minScoreNum = parseInt(minScore as string, 10);
      if (!isNaN(minScoreNum)) {
        preferences = preferences.filter(p => p.preferenceScore >= minScoreNum);
      }
    }

    // Apply limit
    if (limit) {
      const limitNum = parseInt(limit as string, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        preferences = preferences.slice(0, limitNum);
      }
    }

    res.json({
      success: true,
      data: {
        industry,
        preferences,
        total: preferences.length,
        filters: { marketType, minScore, limit }
      }
    });
  } catch (error) {
    console.error('Error retrieving industry preferences:', error);
    res.status(500).json({
      error: 'Failed to retrieve industry preferences',
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

    const analytics = marketPreferenceService.getIndustryAnalytics(industry as Industry);

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

// Search market preferences
router.get('/preferences/search', async (req: Request, res: Response) => {
  try {
    const {
      industry,
      marketType,
      minScore,
      maxScore,
      region,
      preferenceStrength,
      tags,
      limit
    } = req.query;

    const criteria: any = {};

    if (industry && Object.values(Industry).includes(industry as Industry)) {
      criteria.industry = industry as Industry;
    }

    if (marketType && Object.values(MarketType).includes(marketType as MarketType)) {
      criteria.marketType = marketType as MarketType;
    }

    if (minScore) {
      const minScoreNum = parseInt(minScore as string, 10);
      if (!isNaN(minScoreNum)) criteria.minScore = minScoreNum;
    }

    if (maxScore) {
      const maxScoreNum = parseInt(maxScore as string, 10);
      if (!isNaN(maxScoreNum)) criteria.maxScore = maxScoreNum;
    }

    if (region) {
      criteria.region = region as string;
    }

    if (preferenceStrength && Object.values(PreferenceStrength).includes(preferenceStrength as PreferenceStrength)) {
      criteria.preferenceStrength = preferenceStrength as PreferenceStrength;
    }

    if (tags) {
      criteria.tags = typeof tags === 'string' ? [tags] : tags as string[];
    }

    let results = marketPreferenceService.searchMarketPreferences(criteria);

    // Apply limit
    if (limit) {
      const limitNum = parseInt(limit as string, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        results = results.slice(0, limitNum);
      }
    }

    res.json({
      success: true,
      data: {
        results,
        total: results.length,
        criteria,
        filters: { industry, marketType, minScore, maxScore, region, preferenceStrength, tags, limit }
      }
    });
  } catch (error) {
    console.error('Error searching market preferences:', error);
    res.status(500).json({
      error: 'Failed to search market preferences',
      code: 'SEARCH_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all industries analytics summary
router.get('/analytics/summary', async (req: Request, res: Response) => {
  try {
    const allAnalytics = Object.values(Industry).map(industry => ({
      industry,
      analytics: marketPreferenceService.getIndustryAnalytics(industry)
    })).filter(item => item.analytics);

    const summary = {
      totalIndustries: allAnalytics.length,
      totalCustomers: allAnalytics.reduce((sum, item) => sum + (item.analytics?.totalCustomers || 0), 0),
      totalPreferences: allAnalytics.reduce((sum, item) => sum + (item.analytics?.totalPreferences || 0), 0),
      averagePreferenceScore: allAnalytics.length > 0
        ? allAnalytics.reduce((sum, item) => sum + (item.analytics?.averagePreferenceScore || 0), 0) / allAnalytics.length
        : 0,
      industryBreakdown: allAnalytics.map(item => ({
        industry: item.industry,
        totalCustomers: item.analytics?.totalCustomers,
        totalPreferences: item.analytics?.totalPreferences,
        averageScore: item.analytics?.averagePreferenceScore,
        topMarketTypes: item.analytics?.topMarketTypes?.slice(0, 3).map(mt => mt.marketType) || []
      })),
      globalTrends: {
        emergingMarkets: ['AI-powered regions', 'Sustainable markets', 'Remote-first zones'],
        growingMarketTypes: [MarketType.DATA_RESIDENCY, MarketType.REGULATORY_JURISDICTION, MarketType.CLOUD_PROVIDER],
        riskFactors: ['Regulatory changes', 'Market consolidation', 'Technology disruption']
      }
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
      supportedMarketTypes: Object.values(MarketType).filter(type => {
        // Simple industry-market type mapping (simplified for this endpoint)
        switch (industry) {
          case Industry.COLLEGE_CONSULTING:
            return type.startsWith('COLLEGE_') || type.includes('ACADEMIC') || type.includes('SCHOOL') || type.includes('CLIMATE') || type.includes('COST') || type.includes('LOCATION');
          case Industry.SAAS:
            return type.includes('DEPLOYMENT') || type.includes('DATA') || type.includes('CLOUD') || type.includes('COMPLIANCE') || type.includes('MARKET') || type.includes('INTEGRATION');
          case Industry.MANUFACTURING:
            return type.includes('SUPPLIER') || type.includes('LOGISTICS') || type.includes('REGULATORY') || type.includes('TRADE') || type.includes('MANUFACTURING') || type.includes('SUPPLY');
          case Industry.HEALTHCARE:
            return type.includes('PROVIDER') || type.includes('REGULATORY') || type.includes('PATIENT') || type.includes('TREATMENT') || type.includes('PAYER') || type.includes('CARE');
          case Industry.FINTECH:
            return type.includes('REGULATORY') || type.includes('BANKING') || type.includes('PAYMENT') || type.includes('CURRENCY') || type.includes('RISK') || type.includes('FINANCIAL');
          default:
            return true;
        }
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

// Get supported market types
router.get('/market-types', async (req: Request, res: Response) => {
  try {
    const { industry } = req.query;

    let marketTypes = Object.values(MarketType);

    // Filter by industry if specified
    if (industry && Object.values(Industry).includes(industry as Industry)) {
      // Apply the same filtering logic as above
      marketTypes = marketTypes.filter(type => {
        switch (industry as Industry) {
          case Industry.COLLEGE_CONSULTING:
            return type.startsWith('COLLEGE_') || type.includes('ACADEMIC') || type.includes('SCHOOL') || type.includes('CLIMATE') || type.includes('COST') || type.includes('LOCATION');
          case Industry.SAAS:
            return type.includes('DEPLOYMENT') || type.includes('DATA') || type.includes('CLOUD') || type.includes('COMPLIANCE') || type.includes('MARKET') || type.includes('INTEGRATION');
          case Industry.MANUFACTURING:
            return type.includes('SUPPLIER') || type.includes('LOGISTICS') || type.includes('REGULATORY') || type.includes('TRADE') || type.includes('MANUFACTURING') || type.includes('SUPPLY');
          case Industry.HEALTHCARE:
            return type.includes('PROVIDER') || type.includes('REGULATORY') || type.includes('PATIENT') || type.includes('TREATMENT') || type.includes('PAYER') || type.includes('CARE');
          case Industry.FINTECH:
            return type.includes('REGULATORY') || type.includes('BANKING') || type.includes('PAYMENT') || type.includes('CURRENCY') || type.includes('RISK') || type.includes('FINANCIAL');
          default:
            return true;
        }
      });
    }

    const formattedTypes = marketTypes.map(type => ({
      value: type,
      label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      category: getMarketTypeCategory(type)
    }));

    res.json({
      success: true,
      data: formattedTypes,
      filters: { industry }
    });
  } catch (error) {
    console.error('Error retrieving market types:', error);
    res.status(500).json({
      error: 'Failed to retrieve market types',
      code: 'MARKET_TYPES_FAILED',
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
      service: 'Geographic Market Preference Analytics Service',
      version: '1.0.0',
      uptime: process.uptime(),
      supportedIndustries: Object.values(Industry).length,
      supportedMarketTypes: Object.values(MarketType).length,
      preferenceStrengths: Object.values(PreferenceStrength)
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

// Helper function to categorize market types
function getMarketTypeCategory(type: MarketType): string {
  const categoryMap: Record<MarketType, string> = {
    // College Consulting
    [MarketType.COLLEGE_REGION]: 'Geographic',
    [MarketType.ACADEMIC_TIER]: 'Academic',
    [MarketType.SCHOOL_SIZE]: 'Institutional',
    [MarketType.LOCATION_TYPE]: 'Geographic',
    [MarketType.CLIMATE_PREFERENCE]: 'Environmental',
    [MarketType.COST_TIER]: 'Financial',

    // SaaS
    [MarketType.DEPLOYMENT_REGION]: 'Technical',
    [MarketType.DATA_RESIDENCY]: 'Compliance',
    [MarketType.COMPLIANCE_JURISDICTION]: 'Regulatory',
    [MarketType.CLOUD_PROVIDER]: 'Technical',
    [MarketType.MARKET_SEGMENT]: 'Business',
    [MarketType.INTEGRATION_ECOSYSTEM]: 'Technical',

    // Manufacturing
    [MarketType.SUPPLIER_REGION]: 'Geographic',
    [MarketType.LOGISTICS_HUB]: 'Operational',
    [MarketType.REGULATORY_ZONE]: 'Regulatory',
    [MarketType.TRADE_CORRIDOR]: 'Geographic',
    [MarketType.MANUFACTURING_CLUSTER]: 'Operational',
    [MarketType.SUPPLY_CHAIN_TIER]: 'Operational',

    // Healthcare
    [MarketType.PROVIDER_NETWORK]: 'Operational',
    [MarketType.REGULATORY_FRAMEWORK]: 'Regulatory',
    [MarketType.PATIENT_DEMOGRAPHICS]: 'Demographic',
    [MarketType.TREATMENT_SPECIALIZATION]: 'Clinical',
    [MarketType.PAYER_LANDSCAPE]: 'Financial',
    [MarketType.CARE_DELIVERY_MODEL]: 'Operational',

    // FinTech
    [MarketType.REGULATORY_JURISDICTION]: 'Regulatory',
    [MarketType.BANKING_INFRASTRUCTURE]: 'Technical',
    [MarketType.PAYMENT_ECOSYSTEM]: 'Technical',
    [MarketType.CURRENCY_ZONE]: 'Financial',
    [MarketType.RISK_PROFILE_REGION]: 'Risk Management',
    [MarketType.FINANCIAL_LITERACY_LEVEL]: 'Demographic'
  };

  return categoryMap[type] || 'General';
}

export default router;
