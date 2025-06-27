import {
  PsychographicProfilingService,
  VisitorBehaviorData,
} from '../services/psychographic-profiling-service';

describe('PsychographicProfilingService', () => {
  let service: PsychographicProfilingService;

  const mockBehaviorData: VisitorBehaviorData = {
    sessionId: 'test_session_123',
    userId: 'user_456',
    pageViews: [
      {
        url: '/pricing',
        title: 'Pricing Plans',
        timeOnPage: 120,
        scrollDepth: 0.8,
        bounceRate: 0.2,
        exitRate: 0.1,
        timestamp: new Date(),
      },
      {
        url: '/features',
        title: 'Product Features',
        timeOnPage: 180,
        scrollDepth: 0.9,
        bounceRate: 0.1,
        exitRate: 0.0,
        timestamp: new Date(),
      },
    ],
    interactions: [
      {
        type: 'click',
        element: 'pricing-cta',
        elementType: 'button',
        position: { x: 100, y: 200 },
        timestamp: new Date(),
      },
      {
        type: 'scroll',
        element: 'feature-section',
        elementType: 'div',
        position: { x: 0, y: 500 },
        timestamp: new Date(),
      },
      {
        type: 'hover',
        element: 'demo-button',
        elementType: 'button',
        position: { x: 150, y: 250 },
        timestamp: new Date(),
      },
    ],
    contentEngagement: {
      articlesRead: 3,
      videosWatched: 1,
      documentsDownloaded: 2,
      formsStarted: 1,
      formsCompleted: 1,
      searchQueries: ['pricing comparison', 'features vs competitors'],
      contentCategories: ['pricing', 'features', 'testimonials'],
      engagementDepth: 'deep',
    },
    navigationPatterns: [
      {
        path: ['/', '/features', '/pricing', '/contact'],
        backtrackCount: 1,
        linearityScore: 0.8,
        explorationScore: 0.6,
      },
    ],
    timeSpent: {
      totalSessionTime: 600,
      averagePageTime: 150,
      quickExits: 0,
      deepEngagement: 4,
    },
    deviceInfo: {
      type: 'desktop',
      browser: 'Chrome',
      os: 'macOS',
      screenSize: { width: 1920, height: 1080 },
    },
    referralSource: 'search_google',
    timestamp: new Date(),
  };

  beforeEach(() => {
    service = new PsychographicProfilingService();
  });

  afterEach(() => {
    service.removeAllListeners();
  });

  describe('Behavior Analysis', () => {
    it('should analyze visitor behavior and generate profile', async () => {
      const result = await service.analyzeVisitorBehavior(mockBehaviorData);

      expect(result).toBeDefined();
      expect(result.profile).toBeDefined();
      expect(result.profile.sessionId).toBe('test_session_123');
      expect(result.profile.userId).toBe('user_456');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should classify decision making style correctly', async () => {
      const analyticalBehavior = {
        ...mockBehaviorData,
        contentEngagement: {
          ...mockBehaviorData.contentEngagement,
          articlesRead: 5,
          documentsDownloaded: 4,
          engagementDepth: 'deep' as const,
        },
        timeSpent: {
          ...mockBehaviorData.timeSpent,
          averagePageTime: 200,
          deepEngagement: 6,
        },
      };

      const result = await service.analyzeVisitorBehavior(analyticalBehavior);

      expect(result.profile.decisionMakingStyle.primary).toBe('analytical');
      expect(result.profile.decisionMakingStyle.confidence).toBeGreaterThan(
        0.5
      );
      expect(result.profile.decisionMakingStyle.indicators).toContain(
        'deep content engagement'
      );
    });

    it('should assess risk tolerance accurately', async () => {
      const result = await service.analyzeVisitorBehavior(mockBehaviorData);

      expect(['low', 'moderate', 'high']).toContain(
        result.profile.riskTolerance.level
      );
      expect(result.profile.riskTolerance.confidence).toBeGreaterThan(0.4);
      expect(result.profile.riskTolerance.indicators).toBeDefined();
      expect(Array.isArray(result.profile.riskTolerance.indicators)).toBe(true);
    });

    it('should analyze value perception correctly', async () => {
      const result = await service.analyzeVisitorBehavior(mockBehaviorData);

      expect([
        'price_sensitive',
        'quality_focused',
        'convenience_oriented',
        'status_conscious',
      ]).toContain(result.profile.valuePerception.primary);
      expect(result.profile.valuePerception.confidence).toBeGreaterThan(0);
      expect(Array.isArray(result.profile.valuePerception.indicators)).toBe(
        true
      );
    });

    it('should detect communication preferences', async () => {
      const visualPreference = {
        ...mockBehaviorData,
        contentEngagement: {
          ...mockBehaviorData.contentEngagement,
          videosWatched: 5,
          articlesRead: 1,
        },
      };

      const result = await service.analyzeVisitorBehavior(visualPreference);

      expect(result.profile.communicationPreference.style).toBe('visual');
      expect(result.profile.communicationPreference.indicators).toContain(
        'video preference'
      );
    });

    it('should identify buying journey stage', async () => {
      const decisionStage = {
        ...mockBehaviorData,
        contentEngagement: {
          ...mockBehaviorData.contentEngagement,
          formsCompleted: 2,
        },
      };

      const result = await service.analyzeVisitorBehavior(decisionStage);

      expect(result.profile.buyingJourneyStage.stage).toBe('decision');
      expect(result.profile.buyingJourneyStage.indicators).toContain(
        'form completion'
      );
    });
  });

  describe('Profile Management', () => {
    it('should store and retrieve profiles', async () => {
      await service.analyzeVisitorBehavior(mockBehaviorData);

      const storedProfile = service.getProfile('test_session_123');

      expect(storedProfile).toBeDefined();
      expect(storedProfile!.sessionId).toBe('test_session_123');
      expect(storedProfile!.userId).toBe('user_456');
    });

    it('should return null for non-existent profiles', () => {
      const profile = service.getProfile('non_existent_session');

      expect(profile).toBeNull();
    });

    it('should update existing profiles with new data', async () => {
      await service.analyzeVisitorBehavior(mockBehaviorData);

      const newBehaviorData = {
        pageViews: [
          {
            url: '/demo',
            title: 'Product Demo',
            timeOnPage: 300,
            scrollDepth: 1.0,
            bounceRate: 0,
            exitRate: 0,
            timestamp: new Date(),
          },
        ],
      };

      const updatedProfile = await service.updateProfile(
        'test_session_123',
        newBehaviorData
      );

      expect(updatedProfile).toBeDefined();
      expect(updatedProfile!.sessionId).toBe('test_session_123');
      // Profile should be updated with new data
      expect(updatedProfile!.lastUpdated).toBeInstanceOf(Date);
    });

    it('should return null when updating non-existent profile', async () => {
      const result = await service.updateProfile('non_existent', {});

      expect(result).toBeNull();
    });
  });

  describe('Segmentation', () => {
    it('should retrieve profiles by segment', async () => {
      await service.analyzeVisitorBehavior(mockBehaviorData);

      const profile = service.getProfile('test_session_123');
      expect(profile).toBeDefined();

      if (profile && profile.behaviorSegments.length > 0) {
        const segment = profile.behaviorSegments[0];
        const segmentProfiles = service.getProfilesBySegment(segment);

        expect(segmentProfiles).toHaveLength(1);
        expect(segmentProfiles[0].sessionId).toBe('test_session_123');
      }
    });

    it('should return empty array for non-existent segment', () => {
      const profiles = service.getProfilesBySegment('non_existent_segment');

      expect(profiles).toEqual([]);
    });

    it('should generate appropriate behavior segments', async () => {
      const result = await service.analyzeVisitorBehavior(mockBehaviorData);

      expect(result.profile.behaviorSegments).toBeDefined();
      expect(result.profile.behaviorSegments.length).toBeGreaterThan(0);

      // Check that segments contain expected patterns
      const segments = result.profile.behaviorSegments.join(' ');
      expect(segments).toMatch(/risk/);
      expect(segments).toMatch(/communicator/);
    });
  });

  describe('Analytics and Insights', () => {
    it('should provide analytics data', async () => {
      await service.analyzeVisitorBehavior(mockBehaviorData);

      const analytics = service.getAnalytics();

      expect(analytics).toBeDefined();
      expect(analytics.totalProfiles).toBe(1);
      expect(analytics.accuracyMetrics.overall).toBeGreaterThan(0.9);
      expect(analytics.segmentDistribution).toBeInstanceOf(Map);
      expect(analytics.confidenceDistribution).toBeDefined();
      expect(analytics.lastUpdated).toBeInstanceOf(Date);
    });

    it('should track confidence distribution', async () => {
      await service.analyzeVisitorBehavior(mockBehaviorData);

      const analytics = service.getAnalytics();
      const { high, medium, low } = analytics.confidenceDistribution;

      expect(high + medium + low).toBe(1);
      expect(high).toBeGreaterThanOrEqual(0);
      expect(medium).toBeGreaterThanOrEqual(0);
      expect(low).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Service Status and Health', () => {
    it('should provide service status', () => {
      const status = service.getStatus();

      expect(status).toBeDefined();
      expect(status.isRunning).toBe(true);
      expect(status.totalProfiles).toBeGreaterThanOrEqual(0);
      expect(status.activeModels).toBeGreaterThan(0);
      expect(status.averageAccuracy).toBeGreaterThan(0.9);
      expect(['healthy', 'warning', 'critical']).toContain(status.healthStatus);
    });

    it('should export profiles in JSON format', async () => {
      await service.analyzeVisitorBehavior(mockBehaviorData);

      const exportData = service.exportProfiles('json');

      expect(exportData).toBeDefined();
      const parsed = JSON.parse(exportData);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].sessionId).toBe('test_session_123');
    });

    it('should export profiles in CSV format', async () => {
      await service.analyzeVisitorBehavior(mockBehaviorData);

      const exportData = service.exportProfiles('csv');

      expect(exportData).toBeDefined();
      expect(typeof exportData).toBe('string');
      expect(exportData).toContain('sessionId');
      expect(exportData).toContain('test_session_123');
      expect(exportData).toContain('user_456');
    });
  });

  describe('Event Emission', () => {
    it('should emit profile_generated event', async () => {
      const eventPromise = new Promise(resolve => {
        service.once('profile_generated', resolve);
      });

      await service.analyzeVisitorBehavior(mockBehaviorData);

      const event = await eventPromise;
      expect(event).toBeDefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty behavior data gracefully', async () => {
      const minimalData: VisitorBehaviorData = {
        sessionId: 'minimal_session',
        pageViews: [],
        interactions: [],
        contentEngagement: {
          articlesRead: 0,
          videosWatched: 0,
          documentsDownloaded: 0,
          formsStarted: 0,
          formsCompleted: 0,
          searchQueries: [],
          contentCategories: [],
          engagementDepth: 'surface',
        },
        navigationPatterns: [],
        timeSpent: {
          totalSessionTime: 10,
          averagePageTime: 5,
          quickExits: 1,
          deepEngagement: 0,
        },
        deviceInfo: {
          type: 'mobile',
          browser: 'Safari',
          os: 'iOS',
          screenSize: { width: 375, height: 812 },
        },
        referralSource: 'direct',
        timestamp: new Date(),
      };

      const result = await service.analyzeVisitorBehavior(minimalData);

      expect(result).toBeDefined();
      expect(result.profile.sessionId).toBe('minimal_session');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle high-engagement visitor correctly', async () => {
      const highEngagementData: VisitorBehaviorData = {
        ...mockBehaviorData,
        sessionId: 'high_engagement_session',
        contentEngagement: {
          articlesRead: 10,
          videosWatched: 5,
          documentsDownloaded: 8,
          formsStarted: 3,
          formsCompleted: 3,
          searchQueries: [
            'detailed comparison',
            'enterprise features',
            'security certifications',
          ],
          contentCategories: [
            'features',
            'security',
            'enterprise',
            'case-studies',
          ],
          engagementDepth: 'deep',
        },
        timeSpent: {
          totalSessionTime: 1800, // 30 minutes
          averagePageTime: 300,
          quickExits: 0,
          deepEngagement: 15,
        },
      };

      const result = await service.analyzeVisitorBehavior(highEngagementData);

      expect(result.profile.decisionMakingStyle.primary).toBe('analytical');
      expect(result.profile.buyingJourneyStage.stage).toBe('decision');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should maintain accuracy above threshold', async () => {
      // Test multiple profiles to ensure accuracy
      const profiles = [];

      for (let i = 0; i < 10; i++) {
        const testData = {
          ...mockBehaviorData,
          sessionId: `test_session_${i}`,
          userId: `user_${i}`,
        };

        const result = await service.analyzeVisitorBehavior(testData);
        profiles.push(result);
      }

      const avgConfidence =
        profiles.reduce((sum, p) => sum + p.confidence, 0) / profiles.length;
      expect(avgConfidence).toBeGreaterThan(0.7); // Expect 70%+ confidence on average

      const analytics = service.getAnalytics();
      expect(analytics.accuracyMetrics.overall).toBeGreaterThan(0.9); // 90%+ accuracy requirement
    });
  });
});
