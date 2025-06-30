/**
 * Tests for Revenue Prediction Analytics Service
 */

import {
  RevenuePredictionAnalytics,
  CustomerRevenueContext
} from '../revenue-prediction-analytics';

describe('RevenuePredictionAnalytics', () => {
  let analytics: RevenuePredictionAnalytics;
  let mockContext: CustomerRevenueContext;

  beforeEach(() => {
    analytics = new RevenuePredictionAnalytics({
      modelSelection: 'auto',
      confidenceLevel: 0.95,
      predictionHorizon: 90,
      industryBenchmarks: true
    });

    mockContext = {
      customer_profile: {
        companySize: 'enterprise',
        industry: 'technology',
        revenue: 50000000,
        employees: 500,
        budget: 100000
      },
      behavioral_data: {
        engagementScore: 0.85,
        sessionCount: 15,
        totalTimeSpent: 3600,
        pagesVisited: 25
      },
      engagement_history: {
        firstContact: new Date('2024-01-15'),
        lastActivity: new Date(),
        touchpoints: 12,
        meetingsHeld: 3
      },
      historical_deals: [
        {
          dealId: 'deal_001',
          customerId: 'similar_customer_1',
          dealValue: 80000,
          customerSegment: 'enterprise',
          industryType: 'technology',
          dealDuration: 60,
          similarityScore: 0.9
        }
      ]
    };
  });

  describe('predictCustomerRevenue', () => {
    it('should generate comprehensive revenue prediction', async () => {
      const customerId = 'test_customer_123';
      const prediction = await analytics.predictCustomerRevenue(customerId, mockContext);

      expect(prediction).toBeDefined();
      expect(prediction.customerId).toBe(customerId);
      expect(prediction.predictedRevenue).toBeGreaterThan(0);
      expect(prediction.dealSizeEstimate).toBeDefined();
      expect(prediction.closeProbability).toBeDefined();
      expect(prediction.timeToClose).toBeDefined();
      expect(prediction.confidenceInterval).toBeDefined();
      expect(prediction.revenueModel).toBeDefined();
    });

    it('should handle different customer segments', async () => {
      const enterpriseContext = { ...mockContext };
      const smbContext = {
        ...mockContext,
        customer_profile: {
          companySize: 'small',
          revenue: 5000000,
          employees: 50,
          budget: 15000
        }
      };

      const enterprisePrediction = await analytics.predictCustomerRevenue('enterprise', enterpriseContext);
      const smbPrediction = await analytics.predictCustomerRevenue('smb', smbContext);

      expect(enterprisePrediction.dealSizeEstimate.estimatedValue)
        .toBeGreaterThan(smbPrediction.dealSizeEstimate.estimatedValue);
    });

    it('should emit prediction_generated event', async () => {
      const eventPromise = new Promise(resolve => {
        analytics.once('prediction_generated', resolve);
      });

      await analytics.predictCustomerRevenue('test_customer', mockContext);
      const event = await eventPromise;

      expect(event).toBeDefined();
    });
  });

  describe('batchPredictRevenue', () => {
    it('should handle multiple customer predictions', async () => {
      const customerContexts = [
        { customerId: 'customer_1', context: mockContext },
        { customerId: 'customer_2', context: mockContext }
      ];

      const predictions = await analytics.batchPredictRevenue(customerContexts);

      expect(predictions).toHaveLength(2);
      predictions.forEach((prediction, index) => {
        expect(prediction.customerId).toBe(`customer_${index + 1}`);
        expect(prediction.predictedRevenue).toBeGreaterThan(0);
      });
    });
  });

  describe('Deal Size Estimation', () => {
    it('should calculate realistic deal sizes', async () => {
      const prediction = await analytics.predictCustomerRevenue('test_customer', mockContext);
      const dealSize = prediction.dealSizeEstimate;

      expect(dealSize.estimatedValue).toBeGreaterThan(10000);
      expect(dealSize.estimatedValue).toBeLessThan(500000);
      expect(dealSize.confidence).toBeGreaterThan(0);
      expect(dealSize.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Close Probability Analysis', () => {
    it('should analyze deal stage accurately', async () => {
      const prediction = await analytics.predictCustomerRevenue('test_customer', mockContext);
      const closeProbability = prediction.closeProbability;

      expect(closeProbability.probability).toBeGreaterThanOrEqual(0);
      expect(closeProbability.probability).toBeLessThanOrEqual(1);
      expect(closeProbability.stage).toBeDefined();
    });
  });

  describe('Time to Close Forecasting', () => {
    it('should provide realistic time estimates', async () => {
      const prediction = await analytics.predictCustomerRevenue('test_customer', mockContext);
      const timeToClose = prediction.timeToClose;

      expect(timeToClose.estimatedDays).toBeGreaterThan(0);
      expect(timeToClose.estimatedDays).toBeLessThan(365);
      expect(timeToClose.confidence).toBeGreaterThan(0);
    });
  });

  describe('Model Performance', () => {
    it('should return performance metrics', async () => {
      const performance = await analytics.getPredictionAccuracy(30);

      expect(performance.accuracy).toBeGreaterThan(0);
      expect(performance.accuracy).toBeLessThanOrEqual(1);
      expect(performance.precision).toBeGreaterThan(0);
      expect(performance.recall).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle minimal context data', async () => {
      const minimalContext: CustomerRevenueContext = {
        customer_profile: { companySize: 'small' },
        behavioral_data: {},
        engagement_history: {}
      };

      const prediction = await analytics.predictCustomerRevenue('test_customer', minimalContext);

      expect(prediction).toBeDefined();
      expect(prediction.predictedRevenue).toBeGreaterThanOrEqual(0);
    });
  });
});
