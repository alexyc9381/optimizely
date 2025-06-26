import { AnalyticsServiceManager } from '../services/analytics-service';

describe('AnalyticsServiceManager', () => {
  let service: AnalyticsServiceManager;

  beforeEach(() => {
    service = new AnalyticsServiceManager();
  });

  afterEach(async () => {
    await service.destroy();
  });

  describe('Constructor', () => {
    it('should create an instance', () => {
      expect(service).toBeInstanceOf(AnalyticsServiceManager);
    });
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const health = await service.getHealthStatus();
      expect(health).toBeDefined();
      expect(health.status).toBe('healthy');
    });
  });

  describe('Event Ingestion', () => {
    it('should accept valid events', async () => {
      const event = {
        type: 'page_view',
        sessionId: 'test-session',
        visitorId: 'test-visitor',
        timestamp: new Date(),
        data: { url: '/test' }
      };

      const result = await service.ingestEvent(event);
      expect(result.success).toBe(true);
    });
  });
});
