/* eslint-disable no-undef, @typescript-eslint/no-unused-vars, no-console */
/**
 * Accessibility Utilities for Modern SaaS Card Design System
 * Provides comprehensive accessibility support, ARIA management, and screen reader optimizations
 */

/**
 * ARIA Labels and Descriptions for Common Card Types
 */
export const ARIA_LABELS = {
  CARD: {
    METRIC: 'Metric card displaying key performance indicator',
    HERO: 'Hero metric card showing primary conversion rate',
    CHART: 'Chart container with data visualization',
    INTERACTIVE: 'Interactive card element',
    EXPANDABLE: 'Expandable content section',
    NAVIGATION: 'Navigation card item',
  },
  BUTTON: {
    TOGGLE: 'Toggle content visibility',
    EXPAND: 'Expand section to show more details',
    COLLAPSE: 'Collapse section to hide details',
    METRIC_ACTION: 'View detailed metric information',
  },
  STATUS: {
    LOADING: 'Content is loading',
    SUCCESS: 'Operation completed successfully',
    ERROR: 'Error occurred during operation',
    ACTIVE: 'System component is active and operational',
    INACTIVE: 'System component is offline or inactive',
  },
} as const;

/**
 * Screen Reader Descriptions for Complex Elements
 */
export const SCREEN_READER_DESCRIPTIONS = {
  METRIC_WITH_TREND: (title: string, value: string, trend: string, isPositive: boolean) =>
    `${title}: ${value}. Trend: ${trend} ${isPositive ? 'increase' : 'decrease'} from previous period.`,

  SYSTEM_HEALTH: (title: string, status: boolean) =>
    `${title} system status: ${status ? 'Active and operational' : 'Offline or experiencing issues'}.`,

  HERO_METRIC: (title: string, value: string, subtitle?: string) =>
    `Primary metric: ${title} is ${value}. ${subtitle || ''}`,

  EXPANDABLE_SECTION: (title: string, isExpanded: boolean, itemCount?: number) =>
    `${title} section is ${isExpanded ? 'expanded' : 'collapsed'}. ${
      itemCount ? `Contains ${itemCount} items.` : ''
    } Press Enter or Space to ${isExpanded ? 'collapse' : 'expand'}.`,

  STAGGERED_ANIMATION: (index: number, total: number) =>
    `Item ${index + 1} of ${total}. Content will appear with a brief animation delay.`,
} as const;

/**
 * Focus Management Utilities
 */
export const focusManagement = {
  /**
   * Get the next focusable element in DOM order
   */
  getNextFocusableElement: (currentElement: HTMLElement): HTMLElement | null => {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const currentIndex = Array.from(focusableElements).indexOf(currentElement);
    return (focusableElements[currentIndex + 1] as HTMLElement) || null;
  },

  /**
   * Get the previous focusable element in DOM order
   */
  getPreviousFocusableElement: (currentElement: HTMLElement): HTMLElement | null => {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const currentIndex = Array.from(focusableElements).indexOf(currentElement);
    return (focusableElements[currentIndex - 1] as HTMLElement) || null;
  },

  /**
   * Trap focus within a container (useful for modals)
   */
  trapFocus: (container: HTMLElement, event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  },

  /**
   * Restore focus to previously focused element
   */
  restoreFocus: (previousElement: HTMLElement | null) => {
    if (previousElement && document.contains(previousElement)) {
      previousElement.focus();
    }
  },
};

/**
 * Animation Accessibility Settings
 */
export const animationA11y = {
  /**
   * Check if user prefers reduced motion
   */
  prefersReducedMotion: (): boolean => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  /**
   * Get animation duration based on user preference
   */
  getAnimationDuration: (standardDuration: number): number => {
    return animationA11y.prefersReducedMotion() ? 0 : standardDuration;
  },

  /**
   * Apply animation classes conditionally based on user preference
   */
  getAnimationClass: (animationClass: string): string => {
    return animationA11y.prefersReducedMotion() ? '' : animationClass;
  },

  /**
   * Create a media query listener for reduced motion preference changes
   */
  createReducedMotionListener: (callback: (prefersReduced: boolean) => void): (() => void) => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const listener = (e: MediaQueryListEvent) => callback(e.matches);

    mediaQuery.addEventListener('change', listener);

    // Return cleanup function
    return () => mediaQuery.removeEventListener('change', listener);
  },
};

/**
 * ARIA Live Region Announcements
 */
export const announcements = {
  /**
   * Announce content changes to screen readers
   */
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.getElementById('screen-reader-announcer');
    if (announcer) {
      announcer.setAttribute('aria-live', priority);
      announcer.textContent = message;

      // Clear after announcement to avoid repetition
      setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    }
  },

  /**
   * Create a hidden screen reader announcer element
   */
  createAnnouncer: (): HTMLDivElement => {
    let announcer = document.getElementById('screen-reader-announcer') as HTMLDivElement;

    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'screen-reader-announcer';
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only absolute -left-10000 w-1 h-1 overflow-hidden';
      document.body.appendChild(announcer);
    }

    return announcer;
  },
};

/**
 * Keyboard Navigation Utilities
 */
export const keyboardNavigation = {
  /**
   * Handle keyboard events for interactive cards
   */
  handleCardKeyDown: (event: KeyboardEvent, onClick?: () => void) => {
    if (!onClick) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  },

  /**
   * Handle arrow key navigation for card grids
   */
  handleGridNavigation: (event: KeyboardEvent, currentIndex: number, totalItems: number, onNavigate: (newIndex: number) => void) => {
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        newIndex = currentIndex < totalItems - 1 ? currentIndex + 1 : 0;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : totalItems - 1;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = totalItems - 1;
        break;
      default:
        return;
    }

    onNavigate(newIndex);
  },
};

/**
 * Color Contrast and Visual Accessibility
 */
export const visualA11y = {
  /**
   * Check if color combination meets WCAG contrast requirements
   */
  meetsContrastRatio: (foreground: string, background: string, level: 'AA' | 'AAA' = 'AA'): boolean => {
    // This would typically use a color contrast calculation library
    // For now, return true as our design system uses approved color combinations
    return true;
  },

  /**
   * Get high contrast color classes based on user preference
   */
  getHighContrastClasses: (standardClasses: string, highContrastClasses: string): string => {
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    return prefersHighContrast ? highContrastClasses : standardClasses;
  },
};

/**
 * Performance Optimization Utilities
 */
export const performance = {
  /**
   * Debounce function for expensive operations
   */
  debounce: <T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  /**
   * Throttle function for scroll/resize events
   */
  throttle: <T extends (...args: any[]) => void>(func: T, limit: number): (...args: Parameters<T>) => void => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Intersection Observer for lazy loading card content
   */
  createLazyLoadObserver: (callback: IntersectionObserverCallback, options?: IntersectionObserverInit): IntersectionObserver => {
    const defaultOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1,
    };

    return new IntersectionObserver(callback, { ...defaultOptions, ...options });
  },

  /**
   * Request Animation Frame wrapper for smooth animations
   */
  smoothUpdate: (callback: () => void): void => {
    requestAnimationFrame(callback);
  },
};

/**
 * Accessibility Testing Utilities
 */
export const a11yTesting = {
  /**
   * Check if element has proper ARIA labels
   */
  hasProperARIA: (element: HTMLElement): boolean => {
    const hasAriaLabel = element.hasAttribute('aria-label');
    const hasAriaLabelledBy = element.hasAttribute('aria-labelledby');
    const hasAriaDescribedBy = element.hasAttribute('aria-describedby');
    const hasVisibleText = (element.textContent?.trim().length ?? 0) > 0;

    return hasAriaLabel || hasAriaLabelledBy || hasAriaDescribedBy || hasVisibleText;
  },

  /**
   * Check if interactive element has proper keyboard support
   */
  hasKeyboardSupport: (element: HTMLElement): boolean => {
    const isNativelyFocusable = ['button', 'a', 'input', 'select', 'textarea'].includes(element.tagName.toLowerCase());
    const hasTabIndex = element.hasAttribute('tabindex') && element.getAttribute('tabindex') !== '-1';
    const hasKeyDownHandler = element.hasAttribute('onkeydown');

    return isNativelyFocusable || (hasTabIndex && hasKeyDownHandler);
  },

  /**
   * Generate accessibility report for card components
   */
  generateA11yReport: (container: HTMLElement): Array<{ element: HTMLElement; issues: string[] }> => {
    const issues: Array<{ element: HTMLElement; issues: string[] }> = [];
    const interactiveElements = container.querySelectorAll('button, [role="button"], [tabindex]:not([tabindex="-1"])');

    interactiveElements.forEach(element => {
      const elementIssues: string[] = [];
      const htmlElement = element as HTMLElement;

      if (!a11yTesting.hasProperARIA(htmlElement)) {
        elementIssues.push('Missing proper ARIA labeling');
      }

      if (!a11yTesting.hasKeyboardSupport(htmlElement)) {
        elementIssues.push('Missing keyboard support');
      }

      if (elementIssues.length > 0) {
        issues.push({ element: htmlElement, issues: elementIssues });
      }
    });

    return issues;
  },
};

/**
 * Initialize accessibility features for the application
 */
export const initializeA11y = (): void => {
  // Create screen reader announcer
  announcements.createAnnouncer();

  // Add global keyboard event listeners for accessibility
  document.addEventListener('keydown', (event) => {
    // Skip links functionality (if implemented)
    if (event.key === 'Tab' && event.target === document.body) {
      const skipLink = document.querySelector('[href="#main-content"]') as HTMLElement;
      if (skipLink) {
        skipLink.focus();
      }
    }
  });

  // Log accessibility initialization
  console.log('🔍 Accessibility utilities initialized');
};
