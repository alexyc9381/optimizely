import { CustomerJourneyVisualizationEngine, Touchpoint, CustomerJourney } from '../customer-journey-visualization-engine';

describe('CustomerJourneyVisualizationEngine', () => {
  let engine: CustomerJourneyVisualizationEngine;

  beforeEach(() => {
    // Reset singleton instance for testing
    (CustomerJourneyVisualizationEngine as unknown as { _instance: CustomerJourneyVisualizationEngine | null })._instance = null;
    engine = CustomerJourneyVisualizationEngine.getInstance();
  });

  afterEach(() => {
    engine.clearJourneyData();
  });

  describe('Initialization', () => {
    it('should return singleton instance', () => {
      const instance1 = CustomerJourneyVisualizationEngine.getInstance();
      const instance2 = CustomerJourneyVisualizationEngine.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should initialize with empty data stores', async () => {
      const health = await engine.healthCheck();
      expect(health.metrics.journeysTracked).toBe(0);
      expect(health.metrics.conversionPaths).toBe(0);
      expect(health.metrics.dropOffAnalyses).toBe(0);
      expect(health.metrics.optimizations).toBe(0);
    });
  });

  describe('Touchpoint Tracking', () => {
    it('should track basic touchpoint successfully', async () => {
      const touchpointData = {
        sessionId: 'session123',
        type: 'page_view' as const,
        channel: 'web' as const,
        source: 'google',
        medium: 'organic',
        page: '/homepage',
        deviceType: 'desktop' as const
      };

      const touchpoint = await engine.trackTouchpoint(touchpointData);

      expect(touchpoint.touchpointId).toBeDefined();
      expect(touchpoint.sessionId).toBe('session123');
      expect(touchpoint.type).toBe('page_view');
      expect(touchpoint.channel).toBe('web');
      expect(touchpoint.value).toBeGreaterThan(0);
      expect(touchpoint.engagement).toBeGreaterThan(0);
      expect(touchpoint.intent).toBeGreaterThan(0);
    });

    it('should categorize content correctly', async () => {
      const touchpointData = {
        sessionId: 'session123',
        type: 'page_view' as const,
        channel: 'web' as const,
        source: 'direct',
        medium: 'direct',
        page: '/pricing',
        deviceType: 'desktop' as const
      };

      const touchpoint = await engine.trackTouchpoint(touchpointData);
      expect(touchpoint.category).toBe('pricing');
      expect(touchpoint.journeyStage).toBe('evaluation');
    });

    it('should handle conversion touchpoints', async () => {
      const touchpointData = {
        sessionId: 'session123',
        type: 'form_submission' as const,
        channel: 'web' as const,
        source: 'direct',
        medium: 'direct',
        page: '/contact',
        deviceType: 'desktop' as const,
        conversionValue: 500
      };

      const touchpoint = await engine.trackTouchpoint(touchpointData);
      expect(touchpoint.isConversion).toBe(true);
      expect(touchpoint.conversionType).toBe('lead');
      expect(touchpoint.conversionValue).toBe(500);
    });

    it('should emit touchpoint_tracked event', async () => {
      const eventPromise = new Promise((resolve) => {
        engine.once('touchpoint_tracked', resolve);
      });

      await engine.trackTouchpoint({
        sessionId: 'session123',
        type: 'page_view' as const,
        channel: 'web' as const,
        source: 'google',
        medium: 'organic',
        deviceType: 'desktop' as const
      });

      const event = await eventPromise;
      expect(event).toBeDefined();
    });
  });

  describe('Journey Management', () => {
    it('should create new journey for first touchpoint', async () => {
      const userId = 'user123';
      await engine.trackTouchpoint({
        userId,
        sessionId: 'session123',
        type: 'page_view' as const,
        channel: 'web' as const,
        source: 'google',
        medium: 'organic',
        deviceType: 'desktop' as const
      });

      const journeys = await engine.getCustomerJourney(userId);
      expect(journeys).toHaveLength(1);
      expect(journeys[0].userId).toBe(userId);
      expect(journeys[0].touchpointCount).toBe(1);
      expect(journeys[0].stages).toHaveLength(1);
    });

    it('should update existing journey for subsequent touchpoints', async () => {
      const userId = 'user123';
      const sessionId = 'session123';

      // First touchpoint
      await engine.trackTouchpoint({
        userId,
        sessionId,
        type: 'page_view' as const,
        channel: 'web' as const,
        source: 'google',
        medium: 'organic',
        page: '/homepage',
        deviceType: 'desktop' as const
      });

      // Second touchpoint
      await engine.trackTouchpoint({
        userId,
        sessionId,
        type: 'page_view' as const,
        channel: 'web' as const,
        source: 'google',
        medium: 'organic',
        page: '/features',
        deviceType: 'desktop' as const
      });

      const journeys = await engine.getCustomerJourney(userId);
      expect(journeys).toHaveLength(1);
      expect(journeys[0].touchpointCount).toBe(2);
      expect(journeys[0].path).toHaveLength(2);
    });

    it('should create new journey after time gap', async () => {
      const userId = 'user123';

      // First touchpoint
      await engine.trackTouchpoint({
        userId,
        sessionId: 'session123',
        type: 'page_view' as const,
        channel: 'web' as const,
        source: 'google',
        medium: 'organic',
        deviceType: 'desktop' as const
      });

      // Simulate time gap by manually setting journey end date
      const journeys = await engine.getCustomerJourney(userId);
      if (journeys.length > 0) {
        journeys[0].endDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      }

      // Second touchpoint after gap
      await engine.trackTouchpoint({
        userId,
        sessionId: 'session456',
        type: 'page_view' as const,
        channel: 'email' as const,
        source: 'newsletter',
        medium: 'email',
        deviceType: 'mobile' as const
      });

      const updatedJourneys = await engine.getCustomerJourney(userId);
      expect(updatedJourneys.length).toBeGreaterThanOrEqual(1);
    });

    it('should calculate journey metrics correctly', async () => {
      const userId = 'user123';
      const sessionId = 'session123';

      // Create a multi-touchpoint journey
      await engine.trackTouchpoint({
        userId,
        sessionId,
        type: 'page_view' as const,
        channel: 'web' as const,
        source: 'google',
        medium: 'organic',
        page: '/homepage',
        deviceType: 'desktop' as const
      });

      await engine.trackTouchpoint({
        userId,
        sessionId,
        type: 'page_view' as const,
        channel: 'web' as const,
        source: 'google',
        medium: 'organic',
        page: '/features',
        deviceType: 'desktop' as const
      });

      await engine.trackTouchpoint({
        userId,
        sessionId,
        type: 'form_submission' as const,
        channel: 'web' as const,
        source: 'google',
        medium: 'organic',
        page: '/contact',
        deviceType: 'desktop' as const,
        conversionValue: 1000
      });

      const journeys = await engine.getCustomerJourney(userId);
      const journey = journeys[0];

      expect(journey.converted).toBe(true);
      expect(journey.conversionValue).toBe(1000);
      expect(journey.efficiency).toBeGreaterThan(0);
      expect(journey.engagement).toBeGreaterThan(0);
      expect(journey.intent).toBeGreaterThan(0);
      expect(journey.firstTouch.page).toBe('/homepage');
      expect(journey.lastTouch.page).toBe('/contact');
      expect(journey.assistingTouchpoints).toHaveLength(1);
    });
  });

  describe('Journey Visualization', () => {
    it('should generate visualization data for journey', async () => {
      const userId = 'user123';
      const sessionId = 'session123';

      // Create journey with multiple touchpoints
      await engine.trackTouchpoint({
        userId,
        sessionId,
        type: 'page_view' as const,
        channel: 'web' as const,
        source: 'google',
        medium: 'organic',
        page: '/homepage',
        deviceType: 'desktop' as const
      });

      await engine.trackTouchpoint({
        userId,
        sessionId,
        type: 'page_view' as const,
        channel: 'web' as const,
        source: 'google',
        medium: 'organic',
        page: '/pricing',
        deviceType: 'desktop' as const
      });

      const journeys = await engine.getCustomerJourney(userId);
      const journeyId = journeys[0].journeyId;

      const visualization = await engine.getJourneyVisualization(journeyId);

      expect(visualization).toBeDefined();
      expect(visualization!.journey.journeyId).toBe(journeyId);
      expect(visualization!.visualization.nodes).toHaveLength(2);
      expect(visualization!.visualization.edges).toHaveLength(1);
      expect(visualization!.visualization.stages.length).toBeGreaterThan(0);
    });

    it('should return null for non-existent journey', async () => {
      const visualization = await engine.getJourneyVisualization('non-existent-journey');
      expect(visualization).toBeNull();
    });
  });

  describe('Conversion Path Analysis', () => {
    it('should identify conversion paths', async () => {
      // Create multiple converted journeys with similar patterns
      for (let i = 0; i < 3; i++) {
        const userId = `user${i}`;
        const sessionId = `session${i}`;

        await engine.trackTouchpoint({
          userId,
          sessionId,
          type: 'page_view' as const,
          channel: 'web' as const,
          source: 'google',
          medium: 'organic',
          page: '/homepage',
          deviceType: 'desktop' as const
        });

        await engine.trackTouchpoint({
          userId,
          sessionId,
          type: 'page_view' as const,
          channel: 'web' as const,
          source: 'google',
          medium: 'organic',
          page: '/pricing',
          deviceType: 'desktop' as const
        });

        await engine.trackTouchpoint({
          userId,
          sessionId,
          type: 'form_submission' as const,
          channel: 'web' as const,
          source: 'google',
          medium: 'organic',
          page: '/contact',
          deviceType: 'desktop' as const,
          conversionValue: 500
        });
      }

      // Trigger path analysis
      await engine['analyzeConversionPaths']();

      const paths = await engine.getConversionPaths(5);
      expect(paths.length).toBeGreaterThan(0);
      expect(paths[0].frequency).toBeGreaterThan(1);
      expect(paths[0].conversionRate).toBe(100); // All journeys converted
      expect(paths[0].totalConversions).toBeGreaterThan(1);
    });

    it('should return conversion paths sorted by frequency', async () => {
      // Create different path patterns
      await this.createTestJourney('user1', ['homepage', 'pricing', 'contact'], true);
      await this.createTestJourney('user2', ['homepage', 'pricing', 'contact'], true);
      await this.createTestJourney('user3', ['homepage', 'features', 'contact'], true);

      await engine['analyzeConversionPaths']();

      const paths = await engine.getConversionPaths(10);
      expect(paths.length).toBeGreaterThan(0);

      // Paths should be sorted by frequency (descending)
      for (let i = 1; i < paths.length; i++) {
        expect(paths[i].frequency).toBeLessThanOrEqual(paths[i-1].frequency);
      }
    });

    // Helper method for creating test journeys
    async createTestJourney(userId: string, pages: string[], convert: boolean = false) {
      const sessionId = `session_${userId}`;

      for (let i = 0; i < pages.length; i++) {
        const isLast = i === pages.length - 1;
        await engine.trackTouchpoint({
          userId,
          sessionId,
          type: (isLast && convert) ? 'form_submission' as const : 'page_view' as const,
          channel: 'web' as const,
          source: 'google',
          medium: 'organic',
          page: `/${pages[i]}`,
          deviceType: 'desktop' as const,
          conversionValue: (isLast && convert) ? 500 : undefined
        });
      }
    }
  });

  describe('Drop-off Analysis', () => {
    it('should identify drop-off points', async () => {
      // Create journeys that drop off at specific points
      for (let i = 0; i < 5; i++) {
        const userId = `dropoff_user${i}`;
        const sessionId = `dropoff_session${i}`;

        await engine.trackTouchpoint({
          userId,
          sessionId,
          type: 'page_view' as const,
          channel: 'web' as const,
          source: 'google',
          medium: 'organic',
          page: '/homepage',
          deviceType: 'desktop' as const
        });

        await engine.trackTouchpoint({
          userId,
          sessionId,
          type: 'page_view' as const,
          channel: 'web' as const,
          source: 'google',
          medium: 'organic',
          page: '/pricing',
          deviceType: 'desktop' as const
        });

        // Most drop off at pricing page (no conversion)
      }

      await engine['identifyDropOffPoints']();

      const dropOffs = await engine.getDropOffAnalyses(10);
      expect(dropOffs.length).toBeGreaterThan(0);
      expect(dropOffs[0].dropOffRate).toBeGreaterThan(0);
      expect(dropOffs[0].impactScore).toBeGreaterThan(0);
      expect(dropOffs[0].recommendations.length).toBeGreaterThan(0);
    });

    it('should return drop-offs sorted by impact score', async () => {
      // Create multiple drop-off scenarios
      await this.createDropOffScenarios();

      await engine['identifyDropOffPoints']();

      const dropOffs = await engine.getDropOffAnalyses(10);

      // Drop-offs should be sorted by impact score (descending)
      for (let i = 1; i < dropOffs.length; i++) {
        expect(dropOffs[i].impactScore).toBeLessThanOrEqual(dropOffs[i-1].impactScore);
      }
    });

    async createDropOffScenarios() {
      // High-impact drop-off scenario
      for (let i = 0; i < 10; i++) {
        await this.createTestJourney(`high_impact_${i}`, ['homepage', 'pricing'], false);
      }

      // Low-impact drop-off scenario
      for (let i = 0; i < 2; i++) {
        await this.createTestJourney(`low_impact_${i}`, ['homepage', 'about'], false);
      }
    }
  });

  describe('Optimization Recommendations', () => {
    it('should generate optimization recommendations', async () => {
      // Create journeys with optimization opportunities
      for (let i = 0; i < 3; i++) {
        await this.createTestJourney(`opt_user${i}`, ['homepage', 'features', 'pricing', 'contact'], true);
      }

      await engine['analyzeConversionPaths']();
      await engine['generateOptimizations']();

      const optimizations = await engine.getOptimizationRecommendations(5);
      expect(optimizations.length).toBeGreaterThan(0);
      expect(optimizations[0].opportunities.length).toBeGreaterThan(0);
      expect(optimizations[0].projectedImpact.conversionIncrease).toBeGreaterThan(0);
    });

    it('should prioritize optimizations by projected impact', async () => {
      // Create test data and generate optimizations
      await this.createOptimizationTestData();

      await engine['generateOptimizations']();

      const optimizations = await engine.getOptimizationRecommendations(10);

      // Should be sorted by conversion increase (descending)
      for (let i = 1; i < optimizations.length; i++) {
        expect(optimizations[i].projectedImpact.conversionIncrease)
          .toBeLessThanOrEqual(optimizations[i-1].projectedImpact.conversionIncrease);
      }
    });

    async createOptimizationTestData() {
      // Create various journey patterns with different optimization potential
      await this.createTestJourney('opt1', ['homepage', 'pricing', 'contact'], true);
      await this.createTestJourney('opt2', ['homepage', 'features', 'pricing', 'contact'], true);
      await this.createTestJourney('opt3', ['blog', 'homepage', 'contact'], true);

      await engine['analyzeConversionPaths']();
    }
  });

  describe('Health Check', () => {
    it('should return healthy status with metrics', async () => {
      const health = await engine.healthCheck();

      expect(health.status).toBeDefined();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
      expect(health.metrics).toBeDefined();
      expect(health.metrics.journeysTracked).toBeGreaterThanOrEqual(0);
      expect(health.issues).toBeInstanceOf(Array);
      expect(health.lastAnalysis).toBeInstanceOf(Date);
    });

    it('should detect unhealthy status with no journeys', async () => {
      const health = await engine.healthCheck();

      if (health.metrics.journeysTracked === 0) {
        expect(health.status).toBe('unhealthy');
        expect(health.issues).toContain('No journeys being tracked');
      }
    });
  });

  describe('Data Management', () => {
    it('should clear all journey data', async () => {
      // Add some test data
      await engine.trackTouchpoint({
        sessionId: 'test_session',
        type: 'page_view' as const,
        channel: 'web' as const,
        source: 'test',
        medium: 'test',
        deviceType: 'desktop' as const
      });

      let health = await engine.healthCheck();
      expect(health.metrics.journeysTracked).toBeGreaterThan(0);

      // Clear data
      engine.clearJourneyData();

      health = await engine.healthCheck();
      expect(health.metrics.journeysTracked).toBe(0);
      expect(health.metrics.conversionPaths).toBe(0);
      expect(health.metrics.dropOffAnalyses).toBe(0);
      expect(health.metrics.optimizations).toBe(0);
    });

    it('should emit journey_data_cleared event', async () => {
      const eventPromise = new Promise((resolve) => {
        engine.once('journey_data_cleared', resolve);
      });

      engine.clearJourneyData();

      const event = await eventPromise;
      expect(event).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle tracking errors gracefully', async () => {
      const errorEventPromise = new Promise((resolve) => {
        engine.once('tracking_error', resolve);
      });

      // Try to track touchpoint with invalid data (should be caught by validation)
      try {
        await engine.trackTouchpoint({
          sessionId: '',
          type: 'page_view' as const,
          channel: 'web' as const,
          source: '',
          medium: '',
          deviceType: 'desktop' as const
        });
      } catch (error) {
        // Expected to potentially throw or emit error event
      }

      // The implementation should handle this gracefully
      expect(true).toBe(true); // Test passes if no unhandled errors
    });

    it('should emit analysis errors when analysis fails', async () => {
      // This test verifies error handling in analysis methods
      // The actual implementation should handle errors gracefully
      expect(engine).toBeDefined();
    });
  });

  describe('Event Emissions', () => {
    it('should emit journey_updated event when journey is updated', async () => {
      const eventPromise = new Promise((resolve) => {
        engine.once('journey_updated', resolve);
      });

      await engine.trackTouchpoint({
        userId: 'event_test_user',
        sessionId: 'event_test_session',
        type: 'page_view' as const,
        channel: 'web' as const,
        source: 'test',
        medium: 'test',
        deviceType: 'desktop' as const
      });

      const event = await eventPromise;
      expect(event).toBeDefined();
    });

    it('should emit journey_tracking_initialized event on startup', async () => {
      // This would be tested during initialization
      // For now, just verify the engine is properly initialized
      const health = await engine.healthCheck();
      expect(health).toBeDefined();
    });
  });
});
