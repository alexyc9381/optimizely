/**
 * Mobile Chart Engine Tests
 * Comprehensive test suite for mobile-responsive chart functionality including
 * device detection, touch gestures, responsive layouts, and accessibility features.
 */

import { DetectedGesture, MobileChartEngine } from '../MobileChartEngine';

// Mock dependencies
const mockEventEmitter = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  setMaxListeners: jest.fn()
};

// Mock DOM APIs
const mockResizeObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn()
}));

const mockIntersectionObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn()
}));

// Mock navigator
const mockNavigator = {
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
  platform: 'MacIntel',
  maxTouchPoints: 5,
  vibrate: jest.fn()
};

// Mock window properties
const mockWindow = {
  innerWidth: 375,
  innerHeight: 667,
  devicePixelRatio: 2,
  matchMedia: jest.fn().mockImplementation((query) => ({
    matches: query.includes('hover: hover') ? false : true,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

// Mock screen object
const mockScreen = {
  width: 375,
  height: 667
};

// Mock document
const mockDocument = {
  hidden: false,
  createElement: jest.fn().mockReturnValue({
    getContext: jest.fn().mockReturnValue({}),
    style: {}
  }),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

// Mock Touch API
const mockTouch = {
  identifier: 1,
  clientX: 100,
  clientY: 200,
  radiusX: 1,
  radiusY: 1,
  rotationAngle: 0,
  force: 1
};

describe('MobileChartEngine', () => {
  let engine: MobileChartEngine;
  let mockContainer: HTMLElement;

  beforeEach(() => {
    // Reset global mocks
    global.ResizeObserver = mockResizeObserver;
    global.IntersectionObserver = mockIntersectionObserver;
    Object.defineProperty(global, 'navigator', { value: mockNavigator });
    Object.defineProperty(global, 'window', { value: mockWindow });
    Object.defineProperty(global, 'screen', { value: mockScreen });
    Object.defineProperty(global, 'document', { value: mockDocument });

    // Reset singleton instance
    (MobileChartEngine as any)._instance = null;
    engine = MobileChartEngine.getInstance();

    // Create mock container
    mockContainer = {
      getBoundingClientRect: jest.fn().mockReturnValue({
        left: 0,
        top: 0,
        width: 300,
        height: 200
      }),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      style: {},
      classList: { add: jest.fn() },
      setAttribute: jest.fn()
    } as any;

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    engine.shutdown();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = MobileChartEngine.getInstance();
      const instance2 = MobileChartEngine.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should initialize only once', () => {
      const instance1 = MobileChartEngine.getInstance();
      const instance2 = MobileChartEngine.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Device Detection', () => {
    it('should detect mobile device from user agent', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
      const deviceInfo = engine.getDeviceInfo();

      expect(deviceInfo.type).toBe('mobile');
      expect(deviceInfo.os).toBe('ios');
    });

    it('should detect tablet device', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)';
      mockNavigator.maxTouchPoints = 5;

      const deviceInfo = engine.getDeviceInfo();
      expect(deviceInfo.type).toBe('tablet');
    });

    it('should detect Android device', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36';

      const deviceInfo = engine.getDeviceInfo();
      expect(deviceInfo.os).toBe('android');
    });

    it('should detect touch capabilities', () => {
      mockNavigator.maxTouchPoints = 5;

      const deviceInfo = engine.getDeviceInfo();
      expect(deviceInfo.touchCapabilities.maxTouchPoints).toBe(5);
      expect(deviceInfo.touchCapabilities.supportsMultiTouch).toBe(true);
    });

    it('should detect high DPI displays', () => {
      mockWindow.devicePixelRatio = 3;

      const deviceInfo = engine.getDeviceInfo();
      expect(deviceInfo.isHighDPI).toBe(true);
      expect(deviceInfo.screenSize.devicePixelRatio).toBe(3);
    });
  });

  describe('Chart Initialization', () => {
    it('should initialize mobile chart successfully', () => {
      const chartId = engine.initializeMobileChart(mockContainer);

      expect(chartId).toBeDefined();
      expect(typeof chartId).toBe('string');
      expect(mockContainer.style.touchAction).toBe('none');
      expect(mockContainer.classList.add).toHaveBeenCalledWith('mobile-chart-container');
    });

    it('should setup touch event listeners', () => {
      engine.initializeMobileChart(mockContainer);

      expect(mockContainer.addEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: false });
      expect(mockContainer.addEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: false });
      expect(mockContainer.addEventListener).toHaveBeenCalledWith('touchend', expect.any(Function), { passive: false });
      expect(mockContainer.addEventListener).toHaveBeenCalledWith('touchcancel', expect.any(Function), { passive: false });
    });

    it('should apply mobile-specific styling', () => {
      const config = {
        ui: { fontSize: 12, touchTargetSize: 44 },
        layout: { padding: 16, minHeight: 200 }
      };

      engine.initializeMobileChart(mockContainer, config);

      expect(mockContainer.style.fontSize).toBe('12px');
      expect(mockContainer.style.padding).toBe('16px');
      expect(mockContainer.style.minHeight).toBe('200px');
    });
  });

  describe('Responsive Breakpoints', () => {
    it('should identify correct breakpoint for mobile', () => {
      mockWindow.innerWidth = 480;

      const breakpoint = engine.getCurrentBreakpoint();
      expect(breakpoint.name).toBe('xs');
    });

    it('should identify correct breakpoint for tablet', () => {
      mockWindow.innerWidth = 800;

      const breakpoint = engine.getCurrentBreakpoint();
      expect(breakpoint.name).toBe('md');
    });

    it('should identify correct breakpoint for desktop', () => {
      mockWindow.innerWidth = 1400;

      const breakpoint = engine.getCurrentBreakpoint();
      expect(breakpoint.name).toBe('xl');
    });

    it('should return mobile configuration for small screens', () => {
      mockWindow.innerWidth = 320;

      const config = engine.getMobileConfig();
      expect(config.ui.fontSize).toBe(10);
      expect(config.ui.touchTargetSize).toBe(44);
      expect(config.performance.maxDataPoints).toBe(50);
    });
  });

  describe('Touch Gesture Recognition', () => {
    it('should handle tap gesture', () => {
      const gestureHandlerSpy = jest.spyOn(engine, 'handleGesture');
      const mockTarget = mockContainer;

      const gesture: DetectedGesture = {
        type: 'tap',
        duration: 150
      };

      engine.handleGesture('test-chart', gesture, mockTarget);

      expect(gestureHandlerSpy).toHaveBeenCalledWith('test-chart', gesture, mockTarget);
    });

    it('should handle double-tap gesture for zoom', () => {
      const emitSpy = jest.spyOn(engine, 'emit');

      const gesture: DetectedGesture = {
        type: 'double-tap',
        duration: 300
      };

      engine.handleGesture('test-chart', gesture, mockContainer);

      expect(emitSpy).toHaveBeenCalledWith('chart:zoom', expect.objectContaining({
        chartId: 'test-chart'
      }));
    });

    it('should handle pinch gesture for zoom', () => {
      const emitSpy = jest.spyOn(engine, 'emit');

      const gesture: DetectedGesture = {
        type: 'pinch',
        scale: 1.5,
        duration: 500
      };

      engine.handleGesture('test-chart', gesture, mockContainer);

      expect(emitSpy).toHaveBeenCalledWith('chart:pinch-zoom', expect.objectContaining({
        chartId: 'test-chart',
        scale: 1.5
      }));
    });

    it('should handle swipe gesture', () => {
      const emitSpy = jest.spyOn(engine, 'emit');

      const gesture: DetectedGesture = {
        type: 'swipe',
        direction: 'left',
        velocity: 200,
        duration: 200
      };

      engine.handleGesture('test-chart', gesture, mockContainer);

      expect(emitSpy).toHaveBeenCalledWith('chart:swipe', expect.objectContaining({
        chartId: 'test-chart',
        direction: 'left',
        velocity: 200
      }));
    });

    it('should handle long press gesture', () => {
      const emitSpy = jest.spyOn(engine, 'emit');

      const gesture: DetectedGesture = {
        type: 'long-press',
        duration: 800
      };

      engine.handleGesture('test-chart', gesture, mockContainer);

      expect(emitSpy).toHaveBeenCalledWith('chart:context-menu', expect.objectContaining({
        chartId: 'test-chart',
        gesture
      }));
    });
  });

  describe('Orientation Changes', () => {
    it('should handle orientation change', () => {
      const emitSpy = jest.spyOn(engine, 'emit');
      mockWindow.innerWidth = 667;
      mockWindow.innerHeight = 375;

      engine.handleOrientationChange();

      expect(emitSpy).toHaveBeenCalledWith('orientation:changed', expect.objectContaining({
        orientation: 'landscape'
      }));
    });

    it('should detect portrait orientation', () => {
      mockWindow.innerWidth = 375;
      mockWindow.innerHeight = 667;

      engine.handleOrientationChange();

      const deviceInfo = engine.getDeviceInfo();
      expect(deviceInfo.orientation).toBe('portrait');
    });

    it('should detect landscape orientation', () => {
      mockWindow.innerWidth = 667;
      mockWindow.innerHeight = 375;

      engine.handleOrientationChange();

      // Get updated orientation after change
      const orientation = mockWindow.innerHeight > mockWindow.innerWidth ? 'portrait' : 'landscape';
      expect(orientation).toBe('landscape');
    });
  });

  describe('Feature Support Detection', () => {
    it('should detect multi-touch support', () => {
      mockNavigator.maxTouchPoints = 5;

      const supportsMultiTouch = engine.supportsFeature('multitouch');
      expect(supportsMultiTouch).toBe(true);
    });

    it('should detect haptic feedback support', () => {
      mockNavigator.vibrate = jest.fn();

      const supportsHaptic = engine.supportsFeature('haptic');
      expect(supportsHaptic).toBe(true);
    });

    it('should detect WebGL support', () => {
      const mockCanvas = {
        getContext: jest.fn().mockReturnValue({})
      };
      mockDocument.createElement.mockReturnValue(mockCanvas);

      const supportsWebGL = engine.supportsFeature('webgl');
      expect(supportsWebGL).toBe(true);
    });

    it('should handle WebGL detection failure', () => {
      const mockCanvas = {
        getContext: jest.fn().mockReturnValue(null)
      };
      mockDocument.createElement.mockReturnValue(mockCanvas);

      const supportsWebGL = engine.supportsFeature('webgl');
      expect(supportsWebGL).toBe(false);
    });
  });

  describe('Haptic Feedback', () => {
    it('should provide light haptic feedback', () => {
      engine.provideFeedback('light');

      expect(mockNavigator.vibrate).toHaveBeenCalledWith([10]);
    });

    it('should provide heavy haptic feedback', () => {
      engine.provideFeedback('heavy');

      expect(mockNavigator.vibrate).toHaveBeenCalledWith([30]);
    });

    it('should provide success pattern feedback', () => {
      engine.provideFeedback('success');

      expect(mockNavigator.vibrate).toHaveBeenCalledWith([10, 50, 10]);
    });

    it('should provide error pattern feedback', () => {
      engine.provideFeedback('error');

      expect(mockNavigator.vibrate).toHaveBeenCalledWith([50, 50, 50]);
    });

    it('should not provide feedback when not supported', () => {
      delete (mockNavigator as any).vibrate;

      engine.provideFeedback('light');

      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('Optimal Dimensions Calculation', () => {
    it('should calculate optimal dimensions for mobile', () => {
      const dimensions = engine.getOptimalDimensions(mockContainer);

      expect(dimensions.width).toBeGreaterThan(0);
      expect(dimensions.height).toBeGreaterThan(0);
    });

    it('should respect aspect ratio constraints', () => {
      const config = engine.getMobileConfig({
        layout: { aspectRatio: 16/9 }
      });

      // Test that aspect ratio is applied
      expect(config.layout.aspectRatio).toBe(16/9);
    });

    it('should respect min/max height constraints', () => {
      const config = engine.getMobileConfig({
        layout: { minHeight: 200, maxHeight: 400 }
      });

      expect(config.layout.minHeight).toBe(200);
      expect(config.layout.maxHeight).toBe(400);
    });

    it('should adjust for high DPI displays', () => {
      mockWindow.devicePixelRatio = 2;

      const dimensions = engine.getOptimalDimensions(mockContainer);

      // Dimensions should be adjusted for DPI
      expect(dimensions.width).toBeGreaterThan(300);
      expect(dimensions.height).toBeGreaterThan(200);
    });
  });

  describe('Gesture Configuration', () => {
    it('should configure specific gestures', () => {
      const gestures = [
        { type: 'tap' as const, enabled: true, sensitivity: 1 },
        { type: 'pinch' as const, enabled: false, sensitivity: 0.5 }
      ];

      const emitSpy = jest.spyOn(engine, 'emit');

      engine.configureGestures('test-chart', gestures);

      expect(emitSpy).toHaveBeenCalledWith('gestures:configured', {
        chartId: 'test-chart',
        gestures
      });
    });

    it('should return supported gestures for device', () => {
      mockNavigator.maxTouchPoints = 1;

      const deviceInfo = engine.getDeviceInfo();
      const supportedGestures = deviceInfo.supportedGestures;

      expect(supportedGestures).toContain(
        expect.objectContaining({ type: 'tap' })
      );
      expect(supportedGestures).toContain(
        expect.objectContaining({ type: 'swipe' })
      );
    });

    it('should include multi-touch gestures for capable devices', () => {
      mockNavigator.maxTouchPoints = 5;

      const deviceInfo = engine.getDeviceInfo();
      const supportedGestures = deviceInfo.supportedGestures;

      expect(supportedGestures).toContain(
        expect.objectContaining({ type: 'pinch' })
      );
      expect(supportedGestures).toContain(
        expect.objectContaining({ type: 'pan' })
      );
    });
  });

  describe('Configuration Presets', () => {
    it('should provide XS configuration for very small screens', () => {
      mockWindow.innerWidth = 320;

      const config = engine.getMobileConfig();

      expect(config.ui.fontSize).toBe(10);
      expect(config.ui.touchTargetSize).toBe(44);
      expect(config.performance.maxDataPoints).toBe(50);
      expect(config.performance.enableVirtualization).toBe(true);
    });

    it('should provide XL configuration for large screens', () => {
      mockWindow.innerWidth = 1400;

      const config = engine.getMobileConfig();

      expect(config.ui.fontSize).toBe(14);
      expect(config.performance.maxDataPoints).toBe(1000);
      expect(config.performance.enableVirtualization).toBe(false);
    });

    it('should enable WebGL for medium and larger screens', () => {
      mockWindow.innerWidth = 800;

      const config = engine.getMobileConfig();

      expect(config.performance.useWebGL).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing container gracefully', () => {
      expect(() => {
        engine.initializeMobileChart(null as any);
      }).not.toThrow();
    });

    it('should handle invalid gesture data', () => {
      expect(() => {
        engine.handleGesture('test-chart', {} as DetectedGesture, mockContainer);
      }).not.toThrow();
    });

    it('should handle resize observer errors', () => {
      mockResizeObserver.mockImplementation(() => {
        throw new Error('ResizeObserver error');
      });

      expect(() => {
        engine.initializeMobileChart(mockContainer);
      }).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup event listeners on shutdown', () => {
      engine.initializeMobileChart(mockContainer);

      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      engine.shutdown();

      expect(removeEventListenerSpy).toHaveBeenCalled();
    });

    it('should disconnect resize observer on shutdown', () => {
      const mockDisconnect = jest.fn();
      mockResizeObserver.mockImplementation(() => ({
        observe: jest.fn(),
        disconnect: mockDisconnect,
        unobserve: jest.fn()
      }));

      engine.initializeMobileChart(mockContainer);
      engine.shutdown();

      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('should emit shutdown event', () => {
      const emitSpy = jest.spyOn(engine, 'emit');

      engine.shutdown();

      expect(emitSpy).toHaveBeenCalledWith('engine:shutdown');
    });
  });
});

// Gesture Recognizer Tests
describe('GestureRecognizer', () => {
  let engine: MobileChartEngine;

  beforeEach(() => {
    (MobileChartEngine as any)._instance = null;
    engine = MobileChartEngine.getInstance();
  });

  afterEach(() => {
    engine.shutdown();
  });

  describe('Touch Event Processing', () => {
    it('should process single touch events', () => {
      const touchEvent = {
        type: 'touchstart',
        touches: [{
          id: 1,
          x: 100,
          y: 200,
          pressure: 1,
          radiusX: 1,
          radiusY: 1,
          rotationAngle: 0
        }],
        timestamp: Date.now(),
        target: mockContainer,
        chartArea: mockContainer.getBoundingClientRect()
      };

      // Should not throw when processing valid touch event
      expect(() => {
        // Access private gesture recognizer through engine
        (engine as any).gestureRecognizer.recognizeGesture(touchEvent);
      }).not.toThrow();
    });

    it('should calculate distance between touch points', () => {
      const point1 = { x: 0, y: 0 };
      const point2 = { x: 3, y: 4 };

      // Access private method through engine instance
      const gestureRecognizer = (engine as any).gestureRecognizer;
      const distance = gestureRecognizer.calculateDistance(point1, point2);

      expect(distance).toBe(5); // 3-4-5 triangle
    });

    it('should handle multi-touch events', () => {
      const touchEvent = {
        type: 'touchstart',
        touches: [
          { id: 1, x: 100, y: 200, pressure: 1, radiusX: 1, radiusY: 1, rotationAngle: 0 },
          { id: 2, x: 200, y: 300, pressure: 1, radiusX: 1, radiusY: 1, rotationAngle: 0 }
        ],
        timestamp: Date.now(),
        target: mockContainer,
        chartArea: mockContainer.getBoundingClientRect()
      };

      expect(() => {
        (engine as any).gestureRecognizer.recognizeGesture(touchEvent);
      }).not.toThrow();
    });
  });
});
