/**
 * Performance Optimization Utilities for Card Components
 * Implements accessibility performance features
 */

/**
 * Initialize accessibility announcer and performance optimizations
 */
export const initializeAccessibilityPerformance = (): void => {
  // Initialize screen reader announcer from accessibility utils
  if (typeof document !== 'undefined') {
    const announcer = document.getElementById('screen-reader-announcer');
    if (!announcer) {
      const newAnnouncer = document.createElement('div');
      newAnnouncer.id = 'screen-reader-announcer';
      newAnnouncer.setAttribute('aria-live', 'polite');
      newAnnouncer.setAttribute('aria-atomic', 'true');
      newAnnouncer.className =
        'sr-only absolute -left-10000 w-1 h-1 overflow-hidden';
      document.body.appendChild(newAnnouncer);
    }
  }
};

/**
 * Performance monitoring for card rendering
 */
export const measureCardPerformance = (
  cardId: string,
  startTime: number
): void => {
  if (typeof performance !== 'undefined') {
    // eslint-disable-next-line no-undef
    const duration = performance.now() - startTime;

    // Log slow renders for monitoring
    if (duration > 100) {
      // eslint-disable-next-line no-console
      console.warn(
        `Slow card render detected: ${cardId} took ${duration.toFixed(2)}ms`
      );
    }
  }
};

/**
 * Preload critical resources for better performance
 */
export const preloadCriticalResources = async (): Promise<void> => {
  if (typeof document === 'undefined') return;

  // Preload critical fonts
  if ('fonts' in document) {
    try {
      await Promise.all([
        document.fonts.load('400 16px Inter'),
        document.fonts.load('600 16px Inter'),
        document.fonts.load('700 16px Inter'),
      ]);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Font preloading failed:', error);
    }
  }
};

/**
 * Check for accessibility issues in card components
 */
// eslint-disable-next-line no-undef
export const auditCardAccessibility = (
  container: HTMLElement
): Array<{
  type: 'warning' | 'error';
  message: string;
  // eslint-disable-next-line no-undef
  element: HTMLElement;
}> => {
  // eslint-disable-next-line no-undef
  const issues: Array<{
    type: 'warning' | 'error';
    message: string;
    element: HTMLElement;
  }> = [];

  // Check for buttons without accessible names
  const buttons = container.querySelectorAll(
    'button:not([aria-label]):not([aria-labelledby])'
  );
  buttons.forEach(button => {
    // eslint-disable-next-line no-undef
    const btnElement = button as HTMLElement;
    if (!btnElement.textContent?.trim()) {
      issues.push({
        type: 'error',
        message: 'Button without accessible name',
        element: btnElement,
      });
    }
  });

  return issues;
};

/**
 * Announce changes to screen readers
 */
export const announceToScreenReader = (
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void => {
  if (typeof document !== 'undefined') {
    const announcer = document.getElementById('screen-reader-announcer');
    if (announcer) {
      announcer.setAttribute('aria-live', priority);
      announcer.textContent = message;

      // Clear after announcement to avoid repetition
      setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    }
  }
};

export default {
  initializeAccessibilityPerformance,
  measureCardPerformance,
  preloadCriticalResources,
  auditCardAccessibility,
  announceToScreenReader,
};
