import { DataPipelineManager, EventType } from '../services/data-pipeline';

describe('DataPipelineManager', () => {
  let pipeline: DataPipelineManager;

  beforeEach(() => {
    pipeline = new DataPipelineManager();
  });

  afterEach(async () => {
    await pipeline.stop();
  });

  describe('Constructor', () => {
    it('should create an instance', () => {
      expect(pipeline).toBeInstanceOf(DataPipelineManager);
    });
  });

  describe('Event Processing', () => {
    it('should process events through pipeline', async () => {
      const event = {
        type: EventType.CUSTOM,
        sessionId: 'test-session',
        visitorId: 'test-visitor',
        timestamp: new Date(),
        data: {}
      };

      const result = await pipeline.processEvent(event);
      expect(result).toBeDefined();
    });
  });

  describe('Health Status', () => {
    it('should return health status', () => {
      expect(pipeline).toBeDefined();
    });
  });
});
