/**
 * Performance Monitoring and Optimization Utilities
 * Provides tools for monitoring and optimizing application performance
 */

import React from 'react';

// Performance metrics interface
export interface PerformanceMetrics {
  renderTime: number;
  componentCount: number;
  memoryUsage?: number;
  bundleSize?: number;
  timestamp: number;
}

// Performance observer for monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private observers: PerformanceObserver[] = [];

  private constructor() {
    this.initializeObservers();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private initializeObservers(): void {
    if (typeof window === 'undefined') return;

    try {
      // Monitor paint timing
      const paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          console.log(`Performance: ${entry.name} - ${entry.startTime}ms`);
        });
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);

      // Monitor navigation timing
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            console.log(`Performance: Page load time - ${navEntry.loadEventEnd - navEntry.fetchStart}ms`);
          }
        });
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);

      // Monitor long tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          console.warn(`Performance: Long task detected - ${entry.duration}ms`);
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    } catch (error) {
      console.warn('Performance monitoring not supported:', error);
    }
  }

  public recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push({
      ...metric,
      timestamp: Date.now(),
    });

    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  public getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  public getAverageRenderTime(): number {
    if (this.metrics.length === 0) return 0;
    const sum = this.metrics.reduce((acc, metric) => acc + metric.renderTime, 0);
    return sum / this.metrics.length;
  }

  public cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics = [];
  }
}

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance();

  const recordRender = (componentName: string, renderTime: number) => {
    monitor.recordMetric({
      renderTime,
      componentCount: 1,
      timestamp: Date.now(),
    });
  };

  const getMetrics = () => monitor.getMetrics();
  const getAverageRenderTime = () => monitor.getAverageRenderTime();

  return {
    recordRender,
    getMetrics,
    getAverageRenderTime,
  };
}

// HOC for automatic performance monitoring
export function withPerformanceMonitoring<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  componentName: string
) {
  return function PerformanceMonitoredComponent(props: T) {
    const { recordRender } = usePerformanceMonitor();
    const startTime = performance.now();

    React.useEffect(() => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      recordRender(componentName, renderTime);
    });

    return React.createElement(WrappedComponent, props);
  };
}

// Utility for measuring function performance
export function measurePerformance<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    
    console.log(`Performance: ${name} took ${end - start}ms`);
    
    return result;
  }) as T;
}

// Virtual scrolling utility for large datasets
export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function calculateVirtualScrollItems(
  totalItems: number,
  scrollTop: number,
  options: VirtualScrollOptions
) {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    totalItems - 1,
    startIndex + Math.ceil(containerHeight / itemHeight) + overscan * 2
  );
  
  return {
    startIndex,
    endIndex,
    visibleItems: endIndex - startIndex + 1,
    offsetY: startIndex * itemHeight,
  };
}

// Debounce utility for performance optimization
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Throttle utility for performance optimization
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

// Memory usage monitoring
export function getMemoryUsage(): number | undefined {
  if (typeof window !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory;
    return memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
  }
  return undefined;
}

// Bundle analyzer utility
export function logBundleInfo(): void {
  if (typeof window !== 'undefined') {
    const scripts = Array.from(document.getElementsByTagName('script'));
    const stylesheets = Array.from(document.getElementsByTagName('link'))
      .filter(link => link.rel === 'stylesheet');
    
    console.group('Bundle Analysis');
    console.log(`Scripts loaded: ${scripts.length}`);
    console.log(`Stylesheets loaded: ${stylesheets.length}`);
    console.log('Memory usage:', getMemoryUsage(), 'MB');
    console.groupEnd();
  }
}