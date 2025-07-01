/**
 * Real-Time Chart Engine Tests
 * Comprehensive test suite for real-time data streaming, WebSocket integration,
 * performance monitoring, and chart engine functionality.
 */

import {
    ChartSubscription,
    RealTimeChartEngine,
    RealTimeDataPoint,
    RealTimeDataUtils,
    RealTimeStreamConfig
} from '../RealTimeChartEngine';

// Mock WebSocket for testing
global.WebSocket = jest.fn().mockImplementation(() => ({
  close: jest.fn(),
  send: jest.fn(),
  readyState: 1, // OPEN
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  onopen: null,
  onclose: null,
  onmessage: null,
  onerror: null
}));

// Mock EventEmitter for Node.js compatibility
jest.mock('events', () => ({
  EventEmitter: class MockEventEmitter {
    private listeners: Map<string, Function[]> = new Map();

    on(event: string, listener: Function) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event)!.push(listener);
    }

    off(event: string, listener: Function) {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        const index = eventListeners.indexOf(listener);
        if (index > -1) {
          eventListeners.splice(index, 1);
        }
      }
    }

    emit(event: string, ...args: any[]) {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.forEach(listener => listener(...args));
      }
    }

    setMaxListeners(max: number) {
      // Mock implementation
    }
  }
}));

describe('RealTimeChartEngine', () => {
  let engine: RealTimeChartEngine;
  let mockWebSocket: any;

  beforeEach(() => {
    // Reset singleton instance for each test
    (RealTimeChartEngine as any).instance = null;
    engine = RealTimeChartEngine.getInstance();

    // Setup WebSocket mock
    mockWebSocket = {
      close: jest.fn(),
      send: jest.fn(),
      readyState: 1,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      onopen: null,
      onclose: null,
      onmessage: null,
      onerror: null
    };

    (global.WebSocket as jest.Mock).mockImplementation(() => mockWebSocket);

    // Clear all timers
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    engine.shutdown();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = RealTimeChartEngine.getInstance();
      const instance2 = RealTimeChartEngine.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should initialize only once', () => {
      const instance1 = RealTimeChartEngine.getInstance();
      const instance2 = RealTimeChartEngine.getInstance();

      expect(instance1).toBeInstanceOf(RealTimeChartEngine);
      expect(instance2).toBeInstanceOf(RealTimeChartEngine);
    });
  });

  describe('Initialization', () => {
    it('should initialize with WebSocket configuration', async () => {
      const wsConfig = {
        url: 'ws://localhost:8080',
        reconnectInterval: 5000,
        maxReconnectAttempts: 3,
        heartbeatInterval: 30000
      };

      // Mock successful connection
      setTimeout(() => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen();
        }
      }, 0);

      await expect(engine.initialize(wsConfig)).resolves.toBeUndefined();
      expect(global.WebSocket).toHaveBeenCalledWith(wsConfig.url);
    });

    it('should handle initialization errors', async () => {
      const wsConfig = {
        url: 'ws://invalid-url',
        reconnectInterval: 5000,
        maxReconnectAttempts: 3
      };

      // Mock connection error
      setTimeout(() => {
        if (mockWebSocket.onerror) {
          mockWebSocket.onerror(new Error('Connection failed'));
        }
      }, 0);

      await expect(engine.initialize(wsConfig)).rejects.toThrow();
    });
  });

  describe('Chart Registration', () => {
    it('should register a chart with configuration', () => {
      const chartId = 'test-chart';
      const config: RealTimeStreamConfig = {
        maxDataPoints: 100,
        updateInterval: 1000,
        throttleDelay: 100,
        bufferSize: 500,
        autoScale: true
      };

      const emitSpy = jest.spyOn(engine, 'emit');

      engine.registerChart(chartId, config);

      expect(emitSpy).toHaveBeenCalledWith('chart:registered', {
        chartId,
        config
      });
    });

    it('should set up update timers for registered charts', () => {
      const chartId = 'test-chart';
      const config: RealTimeStreamConfig = {
        maxDataPoints: 100,
        updateInterval: 1000,
        throttleDelay: 100,
        bufferSize: 500
      };

      const setIntervalSpy = jest.spyOn(global, 'setInterval');

      engine.registerChart(chartId, config);

      expect(setIntervalSpy).toHaveBeenCalledWith(
        expect.any(Function),
        config.updateInterval
      );
    });
  });

  describe('Data Point Management', () => {
    beforeEach(() => {
      const config: RealTimeStreamConfig = {
        maxDataPoints: 5,
        updateInterval: 1000,
        throttleDelay: 100,
        bufferSize: 10
      };

      engine.registerChart('test-chart', config);
    });

    it('should add data points to buffer', () => {
      const dataPoint: RealTimeDataPoint = {
        timestamp: Date.now(),
        value: 42,
        metadata: { source: 'test' }
      };

      engine.addDataPoint('test-chart', dataPoint);

      const chartData = engine.getChartData('test-chart');
      expect(chartData).toHaveLength(1);
      expect(chartData[0]).toEqual(dataPoint);
    });

    it('should apply timestamp if not provided', () => {
      const dataPoint: RealTimeDataPoint = {
        timestamp: 0, // Will be overridden
        value: 42
      };

      const beforeTime = Date.now();
      engine.addDataPoint('test-chart', dataPoint);
      const afterTime = Date.now();

      const chartData = engine.getChartData('test-chart');
      expect(chartData[0].timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(chartData[0].timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should maintain buffer size limits', () => {
      const config: RealTimeStreamConfig = {
        maxDataPoints: 3,
        updateInterval: 1000,
        throttleDelay: 100,
        bufferSize: 10
      };

      engine.registerChart('limited-chart', config);

      // Add more data points than the limit
      for (let i = 0; i < 5; i++) {
        engine.addDataPoint('limited-chart', {
          timestamp: Date.now() + i,
          value: i
        });
      }

      const chartData = engine.getChartData('limited-chart');
      expect(chartData).toHaveLength(3);

      // Should contain the last 3 data points
      expect(chartData[0].value).toBe(2);
      expect(chartData[1].value).toBe(3);
      expect(chartData[2].value).toBe(4);
    });

    it('should clear chart data', () => {
      engine.addDataPoint('test-chart', {
        timestamp: Date.now(),
        value: 42
      });

      expect(engine.getChartData('test-chart')).toHaveLength(1);

      engine.clearChartData('test-chart');

      expect(engine.getChartData('test-chart')).toHaveLength(0);
    });
  });

  describe('Subscriptions', () => {
    it('should handle chart subscriptions', () => {
      const subscription: ChartSubscription = {
        id: 'sub-1',
        chartId: 'test-chart',
        dataTypes: ['value'],
        filters: [],
        transform: (data) => data
      };

      const emitSpy = jest.spyOn(engine, 'emit');

      engine.subscribe(subscription);

      expect(emitSpy).toHaveBeenCalledWith('subscription:created', {
        subscription
      });
    });

    it('should handle unsubscriptions', () => {
      const subscription: ChartSubscription = {
        id: 'sub-1',
        chartId: 'test-chart',
        dataTypes: ['value'],
        filters: []
      };

      engine.subscribe(subscription);

      const emitSpy = jest.spyOn(engine, 'emit');

      engine.unsubscribe('sub-1');

      expect(emitSpy).toHaveBeenCalledWith('subscription:removed', {
        subscriptionId: 'sub-1'
      });
    });
  });

  describe('Performance Metrics', () => {
    it('should return performance metrics', () => {
      const metrics = engine.getPerformanceMetrics();

      expect(metrics).toHaveProperty('updateRate');
      expect(metrics).toHaveProperty('averageLatency');
      expect(metrics).toHaveProperty('bufferUtilization');
      expect(metrics).toHaveProperty('droppedFrames');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('lastUpdate');

      expect(typeof metrics.updateRate).toBe('number');
      expect(typeof metrics.averageLatency).toBe('number');
      expect(typeof metrics.bufferUtilization).toBe('number');
      expect(typeof metrics.droppedFrames).toBe('number');
      expect(typeof metrics.memoryUsage).toBe('number');
      expect(typeof metrics.lastUpdate).toBe('number');
    });

    it('should calculate buffer utilization correctly', () => {
      const config: RealTimeStreamConfig = {
        maxDataPoints: 10,
        updateInterval: 1000,
        throttleDelay: 100,
        bufferSize: 20
      };

      engine.registerChart('test-chart', config);

      // Add 5 data points (50% of buffer)
      for (let i = 0; i < 5; i++) {
        engine.addDataPoint('test-chart', {
          timestamp: Date.now() + i,
          value: i
        });
      }

      // Advance time to trigger metrics calculation
      jest.advanceTimersByTime(1000);

      const metrics = engine.getPerformanceMetrics();
      expect(metrics.bufferUtilization).toBeCloseTo(50, 0);
    });
  });

  describe('Data Compression', () => {
    it('should enable/disable compression', () => {
      const emitSpy = jest.spyOn(engine, 'emit');

      engine.setCompressionEnabled(true);

      expect(emitSpy).toHaveBeenCalledWith('compression:toggled', {
        enabled: true
      });
    });
  });

  describe('Chart Destruction', () => {
    it('should destroy chart and clean up resources', () => {
      const chartId = 'test-chart';
      const config: RealTimeStreamConfig = {
        maxDataPoints: 100,
        updateInterval: 1000,
        throttleDelay: 100,
        bufferSize: 500
      };

      engine.registerChart(chartId, config);

      // Add some data
      engine.addDataPoint(chartId, {
        timestamp: Date.now(),
        value: 42
      });

      expect(engine.getChartData(chartId)).toHaveLength(1);

      const emitSpy = jest.spyOn(engine, 'emit');
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      engine.destroyChart(chartId);

      expect(engine.getChartData(chartId)).toHaveLength(0);
      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(emitSpy).toHaveBeenCalledWith('chart:destroyed', { chartId });
    });
  });

  describe('Shutdown', () => {
    it('should clean up all resources on shutdown', () => {
      const chartId = 'test-chart';
      const config: RealTimeStreamConfig = {
        maxDataPoints: 100,
        updateInterval: 1000,
        throttleDelay: 100,
        bufferSize: 500
      };

      engine.registerChart(chartId, config);

      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      const emitSpy = jest.spyOn(engine, 'emit');

      engine.shutdown();

      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(emitSpy).toHaveBeenCalledWith('engine:shutdown');
      expect(mockWebSocket.close).toHaveBeenCalled();
    });
  });
});

describe('RealTimeDataUtils', () => {
  let engine: RealTimeChartEngine;

  beforeEach(() => {
    (RealTimeChartEngine as any).instance = null;
    engine = RealTimeChartEngine.getInstance();

    const config: RealTimeStreamConfig = {
      maxDataPoints: 100,
      updateInterval: 1000,
      throttleDelay: 100,
      bufferSize: 500
    };

    engine.registerChart('test-chart', config);
  });

  afterEach(() => {
    engine.shutdown();
    jest.useRealTimers();
  });

  describe('Mock Data Stream', () => {
    it('should create a mock data stream', () => {
      jest.useFakeTimers();

      const cleanup = RealTimeDataUtils.createMockDataStream(
        'test-chart',
        1000,
        engine
      );

      expect(typeof cleanup).toBe('function');

      // Advance timer and check if data was added
      jest.advanceTimersByTime(1000);

      const data = engine.getChartData('test-chart');
      expect(data.length).toBeGreaterThan(0);

      cleanup();
    });
  });

  describe('Chart Data Formatting', () => {
    const sampleData: RealTimeDataPoint[] = [
      { timestamp: 1000, value: 10 },
      { timestamp: 2000, value: 20, category: 'A' },
      { timestamp: 3000, value: 30, metadata: { size: 15 } }
    ];

    it('should format data for line charts', () => {
      const formatted = RealTimeDataUtils.formatForChartType(sampleData, 'line');

      expect(formatted).toEqual([
        { x: 1000, y: 10, timestamp: 1000 },
        { x: 2000, y: 20, timestamp: 2000 },
        { x: 3000, y: 30, timestamp: 3000 }
      ]);
    });

    it('should format data for area charts', () => {
      const formatted = RealTimeDataUtils.formatForChartType(sampleData, 'area');

      expect(formatted).toEqual([
        { x: 1000, y: 10, timestamp: 1000 },
        { x: 2000, y: 20, timestamp: 2000 },
        { x: 3000, y: 30, timestamp: 3000 }
      ]);
    });

    it('should format data for bar charts', () => {
      const formatted = RealTimeDataUtils.formatForChartType(sampleData, 'bar');

      expect(formatted).toEqual([
        { name: 'Point 0', value: 10, timestamp: 1000 },
        { name: 'A', value: 20, timestamp: 2000 },
        { name: 'Point 2', value: 30, timestamp: 3000 }
      ]);
    });

    it('should format data for scatter charts', () => {
      const formatted = RealTimeDataUtils.formatForChartType(sampleData, 'scatter');

      expect(formatted).toEqual([
        { x: 1000, y: 10, size: 5 },
        { x: 2000, y: 20, size: 5 },
        { x: 3000, y: 30, size: 15 }
      ]);
    });
  });

  describe('Trend Calculation', () => {
    it('should calculate upward trend', () => {
      const data: RealTimeDataPoint[] = [
        { timestamp: 1000, value: 10 },
        { timestamp: 2000, value: 15 },
        { timestamp: 3000, value: 20 }
      ];

      const trend = RealTimeDataUtils.calculateTrend(data);

      expect(trend.direction).toBe('up');
      expect(trend.strength).toBeGreaterThan(0);
      expect(trend.change).toBeGreaterThan(0);
    });

    it('should calculate downward trend', () => {
      const data: RealTimeDataPoint[] = [
        { timestamp: 1000, value: 20 },
        { timestamp: 2000, value: 15 },
        { timestamp: 3000, value: 10 }
      ];

      const trend = RealTimeDataUtils.calculateTrend(data);

      expect(trend.direction).toBe('down');
      expect(trend.strength).toBeGreaterThan(0);
      expect(trend.change).toBeLessThan(0);
    });

    it('should calculate stable trend', () => {
      const data: RealTimeDataPoint[] = [
        { timestamp: 1000, value: 10 },
        { timestamp: 2000, value: 10.001 }, // Very small change
        { timestamp: 3000, value: 10.002 }
      ];

      const trend = RealTimeDataUtils.calculateTrend(data);

      expect(trend.direction).toBe('stable');
      expect(Math.abs(trend.change)).toBeLessThan(0.01);
    });

    it('should handle insufficient data', () => {
      const data: RealTimeDataPoint[] = [
        { timestamp: 1000, value: 10 }
      ];

      const trend = RealTimeDataUtils.calculateTrend(data);

      expect(trend.direction).toBe('stable');
      expect(trend.strength).toBe(0);
      expect(trend.change).toBe(0);
    });

    it('should handle non-numeric values', () => {
      const data: RealTimeDataPoint[] = [
        { timestamp: 1000, value: 'text' },
        { timestamp: 2000, value: 'more text' }
      ];

      const trend = RealTimeDataUtils.calculateTrend(data);

      expect(trend.direction).toBe('stable');
      expect(trend.strength).toBe(0);
      expect(trend.change).toBe(0);
    });
  });
});

describe('Error Handling', () => {
  let engine: RealTimeChartEngine;

  beforeEach(() => {
    (RealTimeChartEngine as any).instance = null;
    engine = RealTimeChartEngine.getInstance();
  });

  afterEach(() => {
    engine.shutdown();
  });

  it('should handle adding data to non-existent chart', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    engine.addDataPoint('non-existent-chart', {
      timestamp: Date.now(),
      value: 42
    });

    expect(consoleSpy).toHaveBeenCalledWith('Chart non-existent-chart not registered');

    consoleSpy.mockRestore();
  });

  it('should handle getting data from non-existent chart', () => {
    const data = engine.getChartData('non-existent-chart');

    expect(data).toEqual([]);
  });

  it('should handle clearing data from non-existent chart', () => {
    // Should not throw an error
    expect(() => {
      engine.clearChartData('non-existent-chart');
    }).not.toThrow();
  });
});

describe('Configuration Validation', () => {
  let engine: RealTimeChartEngine;

  beforeEach(() => {
    (RealTimeChartEngine as any).instance = null;
    engine = RealTimeChartEngine.getInstance();
  });

  afterEach(() => {
    engine.shutdown();
  });

  it('should handle valid configurations', () => {
    const config: RealTimeStreamConfig = {
      maxDataPoints: 100,
      updateInterval: 1000,
      throttleDelay: 100,
      bufferSize: 500,
      aggregationWindow: 5000,
      autoScale: true,
      compression: true
    };

    expect(() => {
      engine.registerChart('valid-chart', config);
    }).not.toThrow();
  });

  it('should handle minimal configurations', () => {
    const config: RealTimeStreamConfig = {
      maxDataPoints: 50,
      updateInterval: 2000,
      throttleDelay: 200,
      bufferSize: 100
    };

    expect(() => {
      engine.registerChart('minimal-chart', config);
    }).not.toThrow();
  });
});
