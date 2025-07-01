/**
 * Mobile Chart Engine
 * Comprehensive mobile-responsive chart system with touch gesture support,
 * adaptive layouts, and mobile-optimized interactions for tablets and mobile devices.
 */

import { EventEmitter } from 'events';

// Mobile device detection and capabilities
export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  os: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';
  browser: string;
  screenSize: {
    width: number;
    height: number;
    devicePixelRatio: number;
  };
  touchCapabilities: {
    maxTouchPoints: number;
    supportsMultiTouch: boolean;
    supportsPressure: boolean;
    supportsHover: boolean;
  };
  orientation: 'portrait' | 'landscape';
  isHighDPI: boolean;
  supportedGestures: TouchGesture[];
}

export interface TouchGesture {
  type: 'tap' | 'double-tap' | 'long-press' | 'swipe' | 'pinch' | 'pan' | 'rotate';
  direction?: 'up' | 'down' | 'left' | 'right';
  sensitivity: number;
  enabled: boolean;
}

export interface ResponsiveBreakpoint {
  name: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  minWidth: number;
  maxWidth?: number;
  chartConfig: MobileChartConfig;
}

export interface MobileChartConfig {
  // Layout adaptations
  layout: {
    margin: { top: number; right: number; bottom: number; left: number };
    padding: number;
    minHeight: number;
    maxHeight?: number;
    aspectRatio?: number;
  };

  // Touch interactions
  touch: {
    enabled: boolean;
    gestures: TouchGesture[];
    feedback: 'haptic' | 'visual' | 'audio' | 'none';
    longPressDelay: number;
    doubleTapDelay: number;
    swipeThreshold: number;
    pinchThreshold: number;
  };

  // Mobile UI optimizations
  ui: {
    fontSize: number;
    lineHeight: number;
    touchTargetSize: number;
    tooltipStyle: 'compact' | 'full' | 'minimal';
    legendPosition: 'top' | 'bottom' | 'left' | 'right' | 'overlay' | 'hidden';
    showGrid: boolean;
    showAxes: boolean;
    labelsRotation: number;
  };

  // Performance optimizations
  performance: {
    enableVirtualization: boolean;
    maxDataPoints: number;
    renderThrottleMs: number;
    useWebGL: boolean;
    enableLazyLoading: boolean;
  };

  // Accessibility
  accessibility: {
    enableVoiceOver: boolean;
    enableScreenReader: boolean;
    highContrastMode: boolean;
    reducedMotion: boolean;
    keyboardNavigation: boolean;
  };
}

export interface TouchEvent {
  type: string;
  touches: TouchPoint[];
  timestamp: number;
  target: Element;
  chartArea: DOMRect;
  gesture?: DetectedGesture;
}

export interface TouchPoint {
  id: number;
  x: number;
  y: number;
  pressure: number;
  radiusX: number;
  radiusY: number;
  rotationAngle: number;
}

export interface DetectedGesture {
  type: TouchGesture['type'];
  direction?: TouchGesture['direction'];
  velocity?: number;
  scale?: number;
  rotation?: number;
  distance?: number;
  duration: number;
}

export interface MobileChartState {
  deviceInfo: DeviceInfo;
  currentBreakpoint: ResponsiveBreakpoint;
  isTouch: boolean;
  orientation: 'portrait' | 'landscape';
  viewportSize: { width: number; height: number };
  zoomLevel: number;
  panOffset: { x: number; y: number };
  selectedDataPoints: any[];
  touchHistory: TouchEvent[];
}

// Mobile Chart Engine class
export class MobileChartEngine extends EventEmitter {
  private static instance: MobileChartEngine | null = null;

  private deviceInfo: DeviceInfo;
  private currentState: MobileChartState;
  private gestureRecognizer: GestureRecognizer;
  private resizeObserver: ResizeObserver | null = null;
  private orientationChangeListener: ((event: Event) => void) | null = null;

  private breakpoints: ResponsiveBreakpoint[] = [
    {
      name: 'xs',
      minWidth: 0,
      maxWidth: 575,
      chartConfig: this.getXSConfig()
    },
    {
      name: 'sm',
      minWidth: 576,
      maxWidth: 767,
      chartConfig: this.getSMConfig()
    },
    {
      name: 'md',
      minWidth: 768,
      maxWidth: 991,
      chartConfig: this.getMDConfig()
    },
    {
      name: 'lg',
      minWidth: 992,
      maxWidth: 1199,
      chartConfig: this.getLGConfig()
    },
    {
      name: 'xl',
      minWidth: 1200,
      chartConfig: this.getXLConfig()
    }
  ];

  // Singleton pattern
  public static getInstance(): MobileChartEngine {
    if (!MobileChartEngine.instance) {
      MobileChartEngine.instance = new MobileChartEngine();
    }
    return MobileChartEngine.instance;
  }

  constructor() {
    super();
    this.setMaxListeners(100);

    this.deviceInfo = this.detectDevice();
    this.gestureRecognizer = new GestureRecognizer();
    this.currentState = this.initializeState();

    this.setupEventListeners();
    this.initializeResponsiveSystem();
  }

  /**
   * Initialize chart with mobile optimizations
   */
  public initializeMobileChart(container: HTMLElement, config?: Partial<MobileChartConfig>): string {
    const chartId = this.generateChartId();
    const breakpoint = this.getCurrentBreakpoint();
    const mobileConfig = { ...breakpoint.chartConfig, ...config };

    // Apply mobile-specific styling
    this.applyMobileStyles(container, mobileConfig);

    // Setup touch event listeners
    this.setupTouchEvents(container, chartId);

    // Configure responsive behavior
    this.setupResponsiveBehavior(container, chartId);

    // Initialize accessibility features
    this.setupAccessibility(container, mobileConfig);

    this.emit('chart:mobile:initialized', {
      chartId,
      deviceInfo: this.deviceInfo,
      config: mobileConfig,
      breakpoint
    });

    return chartId;
  }

  /**
   * Get current device information
   */
  public getDeviceInfo(): DeviceInfo {
    return this.deviceInfo;
  }

  /**
   * Get current responsive breakpoint
   */
  public getCurrentBreakpoint(): ResponsiveBreakpoint {
    const width = window.innerWidth;
    return this.breakpoints.find(bp =>
      width >= bp.minWidth && (bp.maxWidth ? width <= bp.maxWidth : true)
    ) || this.breakpoints[this.breakpoints.length - 1];
  }

  /**
   * Get mobile-optimized configuration for current device
   */
  public getMobileConfig(customConfig?: Partial<MobileChartConfig>): MobileChartConfig {
    const breakpoint = this.getCurrentBreakpoint();
    return { ...breakpoint.chartConfig, ...customConfig };
  }

  /**
   * Handle touch gesture on chart
   */
  public handleGesture(chartId: string, gesture: DetectedGesture, target: Element): void {
    switch (gesture.type) {
      case 'tap':
        this.handleTap(chartId, gesture, target);
        break;
      case 'double-tap':
        this.handleDoubleTap(chartId, gesture, target);
        break;
      case 'long-press':
        this.handleLongPress(chartId, gesture, target);
        break;
      case 'swipe':
        this.handleSwipe(chartId, gesture, target);
        break;
      case 'pinch':
        this.handlePinch(chartId, gesture, target);
        break;
      case 'pan':
        this.handlePan(chartId, gesture, target);
        break;
    }

    this.emit('gesture:detected', { chartId, gesture, target });
  }

  /**
   * Update chart for device orientation change
   */
  public handleOrientationChange(): void {
    const newOrientation = this.getOrientation();

    if (newOrientation !== this.currentState.orientation) {
      this.currentState.orientation = newOrientation;
      this.currentState.viewportSize = {
        width: window.innerWidth,
        height: window.innerHeight
      };

      this.emit('orientation:changed', {
        orientation: newOrientation,
        viewportSize: this.currentState.viewportSize
      });

      // Recalculate layouts for all charts
      this.recalculateAllCharts();
    }
  }

  /**
   * Enable/disable specific touch gestures
   */
  public configureGestures(chartId: string, gestures: Partial<TouchGesture>[]): void {
    gestures.forEach(gestureConfig => {
      this.gestureRecognizer.updateGesture(chartId, gestureConfig);
    });

    this.emit('gestures:configured', { chartId, gestures });
  }

  /**
   * Get optimal chart dimensions for current device
   */
  public getOptimalDimensions(container: HTMLElement): { width: number; height: number } {
    const breakpoint = this.getCurrentBreakpoint();
    const containerRect = container.getBoundingClientRect();
    const config = breakpoint.chartConfig;

    let width = containerRect.width;
    let height = containerRect.height;

    // Apply aspect ratio if specified
    if (config.layout.aspectRatio) {
      height = width / config.layout.aspectRatio;
    }

    // Respect min/max height constraints
    height = Math.max(height, config.layout.minHeight);
    if (config.layout.maxHeight) {
      height = Math.min(height, config.layout.maxHeight);
    }

    // Adjust for high DPI displays
    if (this.deviceInfo.isHighDPI) {
      width *= this.deviceInfo.screenSize.devicePixelRatio;
      height *= this.deviceInfo.screenSize.devicePixelRatio;
    }

    return { width, height };
  }

  /**
   * Check if current device supports specific feature
   */
  public supportsFeature(feature: 'multitouch' | 'pressure' | 'hover' | 'haptic' | 'webgl'): boolean {
    switch (feature) {
      case 'multitouch':
        return this.deviceInfo.touchCapabilities.supportsMultiTouch;
      case 'pressure':
        return this.deviceInfo.touchCapabilities.supportsPressure;
      case 'hover':
        return this.deviceInfo.touchCapabilities.supportsHover;
      case 'haptic':
        return 'vibrate' in navigator;
      case 'webgl':
        return this.supportsWebGL();
      default:
        return false;
    }
  }

  /**
   * Provide haptic feedback if supported
   */
  public provideFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'error'): void {
    if (!this.supportsFeature('haptic')) return;

    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 50, 10],
      error: [50, 50, 50]
    };

    if (navigator.vibrate) {
      navigator.vibrate(patterns[type]);
    }
  }

  // Private methods
  private detectDevice(): DeviceInfo {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const maxTouchPoints = navigator.maxTouchPoints || 0;

    // Detect device type
    let type: DeviceInfo['type'] = 'desktop';
    if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      type = 'mobile';
    } else if (/iPad|Android(?!.*Mobile)/i.test(userAgent) || maxTouchPoints > 1) {
      type = 'tablet';
    }

    // Detect OS
    let os: DeviceInfo['os'] = 'unknown';
    if (/iPhone|iPad|iPod/i.test(userAgent)) os = 'ios';
    else if (/Android/i.test(userAgent)) os = 'android';
    else if (/Windows/i.test(userAgent)) os = 'windows';
    else if (/Mac/i.test(platform)) os = 'macos';
    else if (/Linux/i.test(platform)) os = 'linux';

    // Detect browser
    let browser = 'unknown';
    if (/Chrome/i.test(userAgent)) browser = 'chrome';
    else if (/Safari/i.test(userAgent)) browser = 'safari';
    else if (/Firefox/i.test(userAgent)) browser = 'firefox';
    else if (/Edge/i.test(userAgent)) browser = 'edge';

    return {
      type,
      os,
      browser,
      screenSize: {
        width: screen.width,
        height: screen.height,
        devicePixelRatio: window.devicePixelRatio || 1
      },
      touchCapabilities: {
        maxTouchPoints,
        supportsMultiTouch: maxTouchPoints > 1,
        supportsPressure: 'ontouchstart' in window && 'force' in Touch.prototype,
        supportsHover: window.matchMedia('(hover: hover)').matches
      },
      orientation: this.getOrientation(),
      isHighDPI: window.devicePixelRatio > 1,
      supportedGestures: this.getSupportedGestures()
    };
  }

  private initializeState(): MobileChartState {
    return {
      deviceInfo: this.deviceInfo,
      currentBreakpoint: this.getCurrentBreakpoint(),
      isTouch: 'ontouchstart' in window,
      orientation: this.getOrientation(),
      viewportSize: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      zoomLevel: 1,
      panOffset: { x: 0, y: 0 },
      selectedDataPoints: [],
      touchHistory: []
    };
  }

  private setupEventListeners(): void {
    // Orientation change
    this.orientationChangeListener = () => {
      setTimeout(() => this.handleOrientationChange(), 100);
    };
    window.addEventListener('orientationchange', this.orientationChangeListener);
    window.addEventListener('resize', this.orientationChangeListener);

    // Visibility change (for performance)
    document.addEventListener('visibilitychange', () => {
      this.emit('visibility:changed', { hidden: document.hidden });
    });
  }

  private setupTouchEvents(container: HTMLElement, chartId: string): void {
    const touchHandler = (event: Event) => {
      event.preventDefault();

      const touchEvent = this.processTouchEvent(event as globalThis.TouchEvent, container);
      const gesture = this.gestureRecognizer.recognizeGesture(touchEvent);

      if (gesture) {
        this.handleGesture(chartId, gesture, container);
      }
    };

    container.addEventListener('touchstart', touchHandler, { passive: false });
    container.addEventListener('touchmove', touchHandler, { passive: false });
    container.addEventListener('touchend', touchHandler, { passive: false });
    container.addEventListener('touchcancel', touchHandler, { passive: false });
  }

  private applyMobileStyles(container: HTMLElement, config: MobileChartConfig): void {
    const styles = {
      touchAction: 'none',
      userSelect: 'none',
      fontSize: `${config.ui.fontSize}px`,
      lineHeight: config.ui.lineHeight.toString(),
      padding: `${config.layout.padding}px`,
      minHeight: `${config.layout.minHeight}px`
    };

    Object.assign(container.style, styles);
    container.classList.add('mobile-chart-container');
  }

  private setupResponsiveBehavior(container: HTMLElement, chartId: string): void {
    if (!this.resizeObserver) {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          this.handleResize(entry.target as HTMLElement, chartId);
        }
      });
    }

    this.resizeObserver.observe(container);
  }

  private setupAccessibility(container: HTMLElement, config: MobileChartConfig): void {
    if (config.accessibility.enableScreenReader) {
      container.setAttribute('role', 'img');
      container.setAttribute('aria-label', 'Interactive chart');
    }

    if (config.accessibility.keyboardNavigation) {
      container.setAttribute('tabindex', '0');
      container.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));
    }
  }

  private handleTap(chartId: string, gesture: DetectedGesture, target: Element): void {
    // Implement tap handling logic
    this.provideFeedback('light');
    this.emit('chart:tap', { chartId, gesture, target });
  }

  private handleDoubleTap(chartId: string, gesture: DetectedGesture, target: Element): void {
    // Implement double-tap zoom
    this.currentState.zoomLevel = this.currentState.zoomLevel === 1 ? 2 : 1;
    this.provideFeedback('medium');
    this.emit('chart:zoom', { chartId, zoomLevel: this.currentState.zoomLevel });
  }

  private handleLongPress(chartId: string, gesture: DetectedGesture, target: Element): void {
    // Show context menu or detailed tooltip
    this.provideFeedback('heavy');
    this.emit('chart:context-menu', { chartId, gesture, target });
  }

  private handleSwipe(chartId: string, gesture: DetectedGesture, target: Element): void {
    // Handle chart navigation or data scrolling
    this.emit('chart:swipe', { chartId, direction: gesture.direction, velocity: gesture.velocity });
  }

  private handlePinch(chartId: string, gesture: DetectedGesture, target: Element): void {
    // Handle zoom
    if (gesture.scale) {
      this.currentState.zoomLevel *= gesture.scale;
      this.currentState.zoomLevel = Math.max(0.5, Math.min(5, this.currentState.zoomLevel));
      this.emit('chart:pinch-zoom', { chartId, scale: gesture.scale, totalZoom: this.currentState.zoomLevel });
    }
  }

  private handlePan(chartId: string, gesture: DetectedGesture, target: Element): void {
    // Handle chart panning
    this.emit('chart:pan', { chartId, gesture });
  }

  private processTouchEvent(event: globalThis.TouchEvent, container: HTMLElement): TouchEvent {
    const chartArea = container.getBoundingClientRect();

    const touches: TouchPoint[] = Array.from(event.touches).map(touch => ({
      id: touch.identifier,
      x: touch.clientX - chartArea.left,
      y: touch.clientY - chartArea.top,
      pressure: (touch as any).force || 1,
      radiusX: touch.radiusX || 1,
      radiusY: touch.radiusY || 1,
      rotationAngle: touch.rotationAngle || 0
    }));

    return {
      type: event.type,
      touches,
      timestamp: Date.now(),
      target: event.target as Element,
      chartArea
    };
  }

  private handleResize(container: HTMLElement, chartId: string): void {
    const newBreakpoint = this.getCurrentBreakpoint();

    if (newBreakpoint.name !== this.currentState.currentBreakpoint.name) {
      this.currentState.currentBreakpoint = newBreakpoint;
      this.emit('breakpoint:changed', { chartId, breakpoint: newBreakpoint });
    }

    const dimensions = this.getOptimalDimensions(container);
    this.emit('chart:resize', { chartId, dimensions });
  }

  private handleKeyboardNavigation(event: KeyboardEvent): void {
    // Implement keyboard navigation for accessibility
    const { key } = event;

    switch (key) {
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowUp':
      case 'ArrowDown':
        event.preventDefault();
        this.emit('keyboard:navigation', { direction: key.replace('Arrow', '').toLowerCase() });
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.emit('keyboard:select');
        break;
      case 'Escape':
        this.emit('keyboard:escape');
        break;
    }
  }

  private recalculateAllCharts(): void {
    this.emit('charts:recalculate');
  }

  private getOrientation(): 'portrait' | 'landscape' {
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  }

  private getSupportedGestures(): TouchGesture[] {
    const baseGestures: TouchGesture[] = [
      { type: 'tap', sensitivity: 1, enabled: true },
      { type: 'double-tap', sensitivity: 1, enabled: true },
      { type: 'long-press', sensitivity: 1, enabled: true }
    ];

    if (this.deviceInfo.touchCapabilities.supportsMultiTouch) {
      baseGestures.push(
        { type: 'pinch', sensitivity: 1, enabled: true },
        { type: 'pan', sensitivity: 1, enabled: true }
      );
    }

    baseGestures.push(
      { type: 'swipe', direction: 'left', sensitivity: 1, enabled: true },
      { type: 'swipe', direction: 'right', sensitivity: 1, enabled: true },
      { type: 'swipe', direction: 'up', sensitivity: 1, enabled: true },
      { type: 'swipe', direction: 'down', sensitivity: 1, enabled: true }
    );

    return baseGestures;
  }

  private supportsWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch {
      return false;
    }
  }

  private generateChartId(): string {
    return `mobile-chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Configuration presets for different breakpoints
  private getXSConfig(): MobileChartConfig {
    return {
      layout: {
        margin: { top: 10, right: 10, bottom: 30, left: 30 },
        padding: 8,
        minHeight: 200,
        maxHeight: 300,
        aspectRatio: 16/9
      },
      touch: {
        enabled: true,
        gestures: this.getSupportedGestures(),
        feedback: 'haptic',
        longPressDelay: 500,
        doubleTapDelay: 300,
        swipeThreshold: 50,
        pinchThreshold: 1.1
      },
      ui: {
        fontSize: 10,
        lineHeight: 1.2,
        touchTargetSize: 44,
        tooltipStyle: 'compact',
        legendPosition: 'bottom',
        showGrid: false,
        showAxes: true,
        labelsRotation: 45
      },
      performance: {
        enableVirtualization: true,
        maxDataPoints: 50,
        renderThrottleMs: 16,
        useWebGL: false,
        enableLazyLoading: true
      },
      accessibility: {
        enableVoiceOver: true,
        enableScreenReader: true,
        highContrastMode: false,
        reducedMotion: false,
        keyboardNavigation: true
      }
    };
  }

  private getSMConfig(): MobileChartConfig {
    const baseConfig = this.getXSConfig();
    return {
      ...baseConfig,
      layout: {
        ...baseConfig.layout,
        margin: { top: 15, right: 15, bottom: 40, left: 40 },
        padding: 12,
        minHeight: 250,
        maxHeight: 400
      },
      ui: {
        ...baseConfig.ui,
        fontSize: 11,
        touchTargetSize: 48,
        showGrid: true
      },
      performance: {
        ...baseConfig.performance,
        maxDataPoints: 100
      }
    };
  }

  private getMDConfig(): MobileChartConfig {
    const baseConfig = this.getSMConfig();
    return {
      ...baseConfig,
      layout: {
        ...baseConfig.layout,
        margin: { top: 20, right: 20, bottom: 50, left: 50 },
        padding: 16,
        minHeight: 300,
        maxHeight: 500
      },
      ui: {
        ...baseConfig.ui,
        fontSize: 12,
        touchTargetSize: 44,
        tooltipStyle: 'full',
        legendPosition: 'right'
      },
      performance: {
        ...baseConfig.performance,
        maxDataPoints: 200,
        useWebGL: true
      }
    };
  }

  private getLGConfig(): MobileChartConfig {
    const baseConfig = this.getMDConfig();
    return {
      ...baseConfig,
      layout: {
        ...baseConfig.layout,
        margin: { top: 25, right: 25, bottom: 60, left: 60 },
        padding: 20,
        minHeight: 350,
        maxHeight: 600
      },
      ui: {
        ...baseConfig.ui,
        fontSize: 13,
        labelsRotation: 0
      },
      performance: {
        ...baseConfig.performance,
        maxDataPoints: 500
      }
    };
  }

  private getXLConfig(): MobileChartConfig {
    const baseConfig = this.getLGConfig();
    return {
      ...baseConfig,
      layout: {
        ...baseConfig.layout,
        margin: { top: 30, right: 30, bottom: 70, left: 70 },
        padding: 24,
        minHeight: 400,
        aspectRatio: undefined
      },
      ui: {
        ...baseConfig.ui,
        fontSize: 14,
        touchTargetSize: 40
      },
      performance: {
        ...baseConfig.performance,
        maxDataPoints: 1000,
        enableVirtualization: false
      }
    };
  }

  /**
   * Cleanup resources
   */
  public shutdown(): void {
    if (this.orientationChangeListener) {
      window.removeEventListener('orientationchange', this.orientationChangeListener);
      window.removeEventListener('resize', this.orientationChangeListener);
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    this.emit('engine:shutdown');
  }
}

// Gesture Recognition System
class GestureRecognizer {
  private gestureState = new Map<string, any>();
  private gestureTimers = new Map<string, NodeJS.Timeout>();

  recognizeGesture(touchEvent: TouchEvent): DetectedGesture | null {
    const { type, touches, timestamp } = touchEvent;

    switch (type) {
      case 'touchstart':
        return this.handleTouchStart(touches, timestamp);
      case 'touchmove':
        return this.handleTouchMove(touches, timestamp);
      case 'touchend':
        return this.handleTouchEnd(touches, timestamp);
      default:
        return null;
    }
  }

  updateGesture(chartId: string, gestureConfig: Partial<TouchGesture>): void {
    // Implementation for updating gesture configuration
  }

  private handleTouchStart(touches: TouchPoint[], timestamp: number): DetectedGesture | null {
    if (touches.length === 1) {
      this.gestureState.set('singleTouch', {
        startTime: timestamp,
        startPosition: { x: touches[0].x, y: touches[0].y },
        lastPosition: { x: touches[0].x, y: touches[0].y }
      });
    } else if (touches.length === 2) {
      const distance = this.calculateDistance(touches[0], touches[1]);
      this.gestureState.set('multiTouch', {
        startTime: timestamp,
        startDistance: distance,
        lastDistance: distance
      });
    }

    return null;
  }

  private handleTouchMove(touches: TouchPoint[], timestamp: number): DetectedGesture | null {
    if (touches.length === 1 && this.gestureState.has('singleTouch')) {
      const state = this.gestureState.get('singleTouch');
      const currentPos = { x: touches[0].x, y: touches[0].y };
      const distance = this.calculateDistance(state.startPosition, currentPos);

      if (distance > 10) { // Threshold for pan gesture
        return {
          type: 'pan',
          duration: timestamp - state.startTime,
          distance
        };
      }
    } else if (touches.length === 2 && this.gestureState.has('multiTouch')) {
      const state = this.gestureState.get('multiTouch');
      const currentDistance = this.calculateDistance(touches[0], touches[1]);
      const scale = currentDistance / state.startDistance;

      if (Math.abs(scale - 1) > 0.1) { // Threshold for pinch gesture
        return {
          type: 'pinch',
          scale,
          duration: timestamp - state.startTime
        };
      }
    }

    return null;
  }

  private handleTouchEnd(touches: TouchPoint[], timestamp: number): DetectedGesture | null {
    if (this.gestureState.has('singleTouch')) {
      const state = this.gestureState.get('singleTouch');
      const duration = timestamp - state.startTime;

      if (duration < 200) {
        this.gestureState.delete('singleTouch');
        return {
          type: 'tap',
          duration
        };
      } else if (duration > 500) {
        this.gestureState.delete('singleTouch');
        return {
          type: 'long-press',
          duration
        };
      }
    }

    this.gestureState.clear();
    return null;
  }

  private calculateDistance(point1: { x: number; y: number }, point2: { x: number; y: number }): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

// Create singleton instance
export const mobileChartEngine = MobileChartEngine.getInstance();
