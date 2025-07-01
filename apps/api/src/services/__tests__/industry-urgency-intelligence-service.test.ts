import IndustryUrgencyIntelligenceService, {
    Industry,
    UrgencyLevel,
    UrgencyType
} from '../industry-urgency-intelligence-service';

describe('IndustryUrgencyIntelligenceService', () => {
  let service: IndustryUrgencyIntelligenceService;
  const mockCustomerId = 'test-customer-123';

  beforeEach(() => {
    // Reset singleton for testing
    (IndustryUrgencyIntelligenceService as any)._instance = null;
    service = IndustryUrgencyIntelligenceService.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = IndustryUrgencyIntelligenceService.getInstance();
      const instance2 = IndustryUrgencyIntelligenceService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Event Creation', () => {
    it('should create urgency event with correct properties', async () => {
      const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const event = await service.createUrgencyEvent(
        mockCustomerId,
        Industry.SAAS,
        UrgencyType.CONTRACT_RENEWAL,
        deadline
      );

      expect(event).toBeDefined();
      expect(event.customerId).toBe(mockCustomerId);
      expect(event.industry).toBe(Industry.SAAS);
      expect(event.urgencyType).toBe(UrgencyType.CONTRACT_RENEWAL);
      expect(event.urgencyScore).toBeGreaterThan(0);
      expect(event.isActive).toBe(true);
    });

    it('should calculate high urgency for near deadlines', async () => {
      const urgentDeadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

      const event = await service.createUrgencyEvent(
        mockCustomerId,
        Industry.SAAS,
        UrgencyType.TRIAL_EXPIRY,
        urgentDeadline
      );

      expect(event.urgencyScore).toBeGreaterThan(70);
      expect(event.urgencyLevel).toBe(UrgencyLevel.CRITICAL);
    });

    it('should throw error for invalid customer ID', async () => {
      const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      await expect(
        service.createUrgencyEvent('', Industry.SAAS, UrgencyType.TRIAL_EXPIRY, deadline)
      ).rejects.toThrow('Customer ID is required');
    });
  });

  describe('Event Retrieval', () => {
    beforeEach(async () => {
      const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await service.createUrgencyEvent(mockCustomerId, Industry.SAAS, UrgencyType.CONTRACT_RENEWAL, deadline);
    });

    it('should retrieve customer events', () => {
      const events = service.getCustomerUrgencyEvents(mockCustomerId);
      expect(events.length).toBe(1);
      expect(events[0].customerId).toBe(mockCustomerId);
    });

    it('should retrieve industry events', () => {
      const events = service.getIndustryUrgencyEvents(Industry.SAAS);
      expect(events.length).toBe(1);
      expect(events[0].industry).toBe(Industry.SAAS);
    });
  });

  describe('Event Updates', () => {
    let eventId: string;

    beforeEach(async () => {
      const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const event = await service.createUrgencyEvent(
        mockCustomerId,
        Industry.SAAS,
        UrgencyType.CONTRACT_RENEWAL,
        deadline
      );
      eventId = event.id;
    });

    it('should update urgency event', async () => {
      const updated = await service.updateUrgencyEvent(eventId, {
        title: 'Updated Title',
        impactScore: 95
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.impactScore).toBe(95);
    });

    it('should complete urgency event', async () => {
      const completed = await service.completeUrgencyEvent(eventId, {
        completedOnTime: true,
        actualCompletionDate: new Date().toISOString()
      });

      expect(completed.isActive).toBe(false);
    });

    it('should throw error for non-existent event', async () => {
      await expect(
        service.updateUrgencyEvent('non-existent', { title: 'Updated' })
      ).rejects.toThrow('Urgency event not found');
    });
  });

  describe('Analytics', () => {
    beforeEach(async () => {
      const deadline1 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const deadline2 = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

      await service.createUrgencyEvent(mockCustomerId, Industry.SAAS, UrgencyType.CONTRACT_RENEWAL, deadline1);
      await service.createUrgencyEvent(mockCustomerId, Industry.SAAS, UrgencyType.TRIAL_EXPIRY, deadline2);
    });

    it('should provide industry analytics', () => {
      const analytics = service.getIndustryAnalytics(Industry.SAAS);
      expect(analytics).toBeDefined();
      expect(analytics!.totalEvents).toBe(2);
      expect(analytics!.averageUrgencyScore).toBeGreaterThan(0);
    });

    it('should generate customer insights', () => {
      const insights = service.getUrgencyInsights(mockCustomerId);
      expect(insights.upcomingDeadlines).toBeDefined();
      expect(insights.criticalEvents).toBeDefined();
      expect(insights.recommendations).toBeDefined();
      expect(insights.upcomingDeadlines.length).toBeGreaterThan(0);
    });

    it('should retrieve critical events', () => {
      const criticalEvents = service.getCriticalUrgencyEvents();
      expect(Array.isArray(criticalEvents)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid industry', async () => {
      const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      await expect(
        service.createUrgencyEvent(mockCustomerId, 'invalid' as Industry, UrgencyType.CONTRACT_RENEWAL, deadline)
      ).rejects.toThrow();
    });

    it('should handle past deadlines', async () => {
      const pastDeadline = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      await expect(
        service.createUrgencyEvent(mockCustomerId, Industry.SAAS, UrgencyType.CONTRACT_RENEWAL, pastDeadline)
      ).rejects.toThrow('Deadline cannot be in the past');
    });
  });
});
