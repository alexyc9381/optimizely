/**
 * @jest-environment jsdom
 */

import { Tracker } from '../core/Tracker';
import { BehavioralTracker } from '../modules/BehavioralTracker';
import { TrackerConfig } from '../types';

// Mock storage for tests
const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockStorage,
  writable: true
});

Object.defineProperty(window, 'sessionStorage', {
  value: mockStorage,
  writable: true
});

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock PerformanceObserver
const mockPerformanceObserver = jest.fn().mockImplementation(() => ({
  observe: () => null,
  disconnect: () => null
}));
Object.defineProperty(mockPerformanceObserver, 'supportedEntryTypes', {
  value: ['largest-contentful-paint', 'first-input', 'layout-shift'],
  writable: false
});
(window as any).PerformanceObserver = mockPerformanceObserver;

describe('BehavioralTracker', () => {
  let behavioralTracker: BehavioralTracker;
  let mockTracker: Tracker;
  let mockConfig: TrackerConfig;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    mockStorage.getItem.mockReturnValue(null);

    // Setup DOM
    document.body.innerHTML = `
      <div id="test-container">
        <button id="test-button" class="btn">Click Me</button>
        <form id="test-form">
          <input type="text" id="test-input" name="email" />
          <textarea id="test-textarea"></textarea>
          <input type="submit" value="Submit" />
        </form>
        <div class="content" style="height: 2000px;">Content</div>
      </div>
    `;

    // Create tracker instance
    mockConfig = {
      apiUrl: 'https://api.test.com',
      projectId: 'test-project',
      debug: true
    };

    mockTracker = new Tracker();

    // Create behavioral tracker
    behavioralTracker = new BehavioralTracker({
      enableClickTracking: true,
      enableScrollTracking: true,
      enableFormTracking: true,
      enableMouseTracking: true,
      enableVisibilityTracking: true,
      enablePerformanceTracking: true
    });

    // Set up the relationship
    (behavioralTracker as any).setTracker(mockTracker);

    // Mock tracker methods
    jest.spyOn(mockTracker, 'track').mockImplementation(() => {});
  });

  afterEach(() => {
    behavioralTracker.destroy();
    document.body.innerHTML = '';
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      const tracker = new BehavioralTracker();
      expect(tracker.name).toBe('behavioral');
    });

    test('should accept custom configuration', () => {
      const config = {
        enableClickTracking: false,
        scrollThreshold: 50
      };
      const tracker = new BehavioralTracker(config);
      expect(tracker.name).toBe('behavioral');
    });

    test('should initialize without errors', () => {
      expect(() => {
        behavioralTracker.init();
      }).not.toThrow();
    });
  });

  describe('Click Tracking', () => {
    beforeEach(() => {
      behavioralTracker.init();
    });

    test('should track button clicks', () => {
      const button = document.getElementById('test-button')!;

      // Simulate click
      const clickEvent = new MouseEvent('click', {
        clientX: 100,
        clientY: 200,
        bubbles: true
      });

      button.dispatchEvent(clickEvent);

      // Check if tracking was called
      expect(mockTracker.track).toHaveBeenCalledWith(
        'behavioral:click',
        expect.objectContaining({
          type: 'click',
          metadata: expect.objectContaining({
            element: '#test-button',
            tagName: 'button',
            x: 100,
            y: 200
          })
        })
      );
    });

    test('should not track excluded elements', () => {
      document.body.innerHTML += '<button class="tracking-ignore">Ignore Me</button>';
      const button = document.querySelector('.tracking-ignore')!;

      const clickEvent = new MouseEvent('click', { bubbles: true });
      button.dispatchEvent(clickEvent);

      // Should not be tracked
      expect(mockTracker.track).not.toHaveBeenCalledWith(
        'behavioral:click',
        expect.anything()
      );
    });
  });

  describe('Scroll Tracking', () => {
    beforeEach(() => {
      behavioralTracker.init();

      // Mock scroll properties
      Object.defineProperty(window, 'pageYOffset', {
        value: 0,
        writable: true
      });

      Object.defineProperty(document.documentElement, 'scrollTop', {
        value: 0,
        writable: true
      });

      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 2000,
        writable: true
      });

      Object.defineProperty(window, 'innerHeight', {
        value: 800,
        writable: true
      });
    });

    test('should track scroll events', async () => {
      // Simulate scroll
      Object.defineProperty(window, 'pageYOffset', { value: 400 });
      Object.defineProperty(document.documentElement, 'scrollTop', { value: 400 });

      const scrollEvent = new Event('scroll');
      window.dispatchEvent(scrollEvent);

      // Wait for throttled function
      await new Promise(resolve => setTimeout(resolve, 300));

      expect(mockTracker.track).toHaveBeenCalledWith(
        'behavioral:scroll',
        expect.objectContaining({
          type: 'scroll',
          metadata: expect.objectContaining({
            depth: expect.any(Number),
            direction: expect.any(String)
          })
        })
      );
    });
  });

  describe('Form Tracking', () => {
    beforeEach(() => {
      behavioralTracker.init();
    });

    test('should track form field focus', () => {
      const input = document.getElementById('test-input')!;

      const focusEvent = new Event('focus', { bubbles: true });
      input.dispatchEvent(focusEvent);

      expect(mockTracker.track).toHaveBeenCalledWith(
        'behavioral:form_interaction',
        expect.objectContaining({
          type: 'form_interaction',
          metadata: expect.objectContaining({
            action: 'focus',
            field: '#test-input',
            fieldType: 'text'
          })
        })
      );
    });

    test('should track form field changes', () => {
      const input = document.getElementById('test-input') as HTMLInputElement;
      input.value = 'test@example.com';

      const changeEvent = new Event('change', { bubbles: true });
      input.dispatchEvent(changeEvent);

      expect(mockTracker.track).toHaveBeenCalledWith(
        'behavioral:form_interaction',
        expect.objectContaining({
          type: 'form_interaction',
          metadata: expect.objectContaining({
            action: 'change',
            value: 'test@example.com'
          })
        })
      );
    });

    test('should track form submissions', () => {
      const form = document.getElementById('test-form')!;

      const submitEvent = new Event('submit', { bubbles: true });
      form.dispatchEvent(submitEvent);

      expect(mockTracker.track).toHaveBeenCalledWith(
        'behavioral:form_interaction',
        expect.objectContaining({
          type: 'form_interaction',
          metadata: expect.objectContaining({
            action: 'submit',
            formId: 'test-form'
          })
        })
      );
    });
  });

  describe('Mouse Tracking', () => {
    beforeEach(() => {
      behavioralTracker.init();
    });

    test('should track mouse movements', async () => {
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 250,
        clientY: 300,
        bubbles: true
      });

      document.dispatchEvent(mouseMoveEvent);

      // Wait for throttled function
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(mockTracker.track).toHaveBeenCalledWith(
        'behavioral:mouse_move',
        expect.objectContaining({
          type: 'mouse_move',
          metadata: expect.objectContaining({
            x: 250,
            y: 300,
            type: 'move'
          })
        })
      );
    });
  });

    describe('Activity Tracking', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      behavioralTracker.init();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should track user idle state', async () => {
      // Trigger idle timeout
      jest.advanceTimersByTime(35000);

      expect(mockTracker.track).toHaveBeenCalledWith(
        'behavioral:user_idle',
        expect.objectContaining({
          type: 'user_idle',
          metadata: expect.objectContaining({
            duration: 30000
          })
        })
      );
    });
  });

    describe('Engagement Metrics', () => {
    test('should calculate engagement metrics', () => {
      behavioralTracker.init();
      const metrics = behavioralTracker.getEngagementMetrics();

      expect(metrics).toEqual(expect.objectContaining({
        timeOnPage: expect.any(Number),
        scrollDepth: expect.any(Number),
        clickCount: expect.any(Number),
        formInteractions: expect.any(Number),
        mouseMovements: expect.any(Number),
        idleTime: expect.any(Number),
        engagementScore: expect.any(Number)
      }));

      expect(metrics.engagementScore).toBeGreaterThanOrEqual(0);
      expect(metrics.engagementScore).toBeLessThanOrEqual(100);
    });

    test('should track engagement metrics periodically', async () => {
      jest.useFakeTimers();
      behavioralTracker.init();

      // Fast-forward to trigger engagement tracking
      jest.advanceTimersByTime(35000);

      expect(mockTracker.track).toHaveBeenCalledWith(
        'behavioral:engagement_metrics',
        expect.objectContaining({
          type: 'engagement_metrics',
          metadata: expect.objectContaining({
            engagementScore: expect.any(Number)
          })
        })
      );

      jest.useRealTimers();
    });
  });

  describe('Custom Events', () => {
    beforeEach(() => {
      behavioralTracker.init();
    });

    test('should track custom behavioral events', () => {
      const customData = {
        action: 'video_play',
        videoId: 'abc123',
        duration: 30
      };

      behavioralTracker.trackCustomEvent('video_interaction', customData);

      expect(mockTracker.track).toHaveBeenCalledWith(
        'behavioral:video_interaction',
        expect.objectContaining({
          type: 'video_interaction',
          metadata: customData
        })
      );
    });
  });

  describe('Module Management', () => {
    test('should enable and disable tracking', () => {
      behavioralTracker.init();

      // Should be active by default
      behavioralTracker.disable();

      // Click should not be tracked when disabled
      const button = document.getElementById('test-button')!;
      const clickEvent = new MouseEvent('click', { bubbles: true });
      button.dispatchEvent(clickEvent);

      expect(mockTracker.track).not.toHaveBeenCalled();

      // Re-enable
      behavioralTracker.enable();
      button.dispatchEvent(clickEvent);

      expect(mockTracker.track).toHaveBeenCalled();
    });

    test('should clean up resources on destroy', () => {
      behavioralTracker.init();

      expect(() => {
        behavioralTracker.destroy();
      }).not.toThrow();

      // Should not track after destroy
      const button = document.getElementById('test-button')!;
      const clickEvent = new MouseEvent('click', { bubbles: true });
      button.dispatchEvent(clickEvent);

      expect(mockTracker.track).not.toHaveBeenCalled();
    });
  });

  describe('Performance Tracking', () => {
    beforeEach(() => {
      behavioralTracker.init();
    });

    test('should track performance metrics when available', () => {
      // Performance tracking is mocked, so just verify initialization doesn't fail
      expect(mockPerformanceObserver).toHaveBeenCalled();
    });
  });

  describe('Visibility Tracking', () => {
    beforeEach(() => {
      behavioralTracker.init();
    });

    test('should set up intersection observer', () => {
      expect(mockIntersectionObserver).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle initialization in non-browser environment', () => {
      // Mock non-browser environment
      const originalWindow = global.window;
      delete (global as any).window;

      expect(() => {
        const tracker = new BehavioralTracker();
        tracker.init();
      }).not.toThrow();

      global.window = originalWindow;
    });

    test('should handle missing tracker instance gracefully', () => {
      const tracker = new BehavioralTracker();

      expect(() => {
        tracker.trackCustomEvent('test', {});
      }).not.toThrow();
    });
  });
});
