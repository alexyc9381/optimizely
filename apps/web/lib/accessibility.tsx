/**
 * Accessibility Utilities and WCAG 2.1 AA Compliance Tools
 * Provides comprehensive accessibility support for the application
 */

import React, { useEffect, useRef, useState } from 'react';

// Screen reader descriptions for common UI elements
export const SCREEN_READER_DESCRIPTIONS = {
  LOADING: 'Loading content, please wait',
  ERROR: 'An error occurred',
  SUCCESS: 'Action completed successfully',
  WARNING: 'Warning message',
  INFO: 'Information',
  CLOSE: 'Close dialog',
  MENU: 'Navigation menu',
  SEARCH: 'Search',
  FILTER: 'Filter options',
  SORT: 'Sort options',
  PAGINATION: 'Page navigation',
  CHART: 'Data visualization chart',
  TABLE: 'Data table',
  FORM: 'Form input',
  BUTTON: 'Button',
  LINK: 'Link',
  IMAGE: 'Image',
  VIDEO: 'Video player',
  AUDIO: 'Audio player',
  HERO_METRIC: (title: string, value: string, subtitle?: string) => 
    `${title}: ${value}${subtitle ? `. ${subtitle}` : ''}`,
  METRIC_WITH_TREND: (title: string, value: string, trend: string, isPositive?: boolean | string) =>
    `${title}: ${value}. Trend: ${trend}${typeof isPositive === 'boolean' ? (isPositive ? ' (positive trend)' : ' (negative trend)') : (isPositive ? `. ${isPositive}` : '')}`,
  SIMPLE_METRIC: (title: string, value: string, subtitle?: string) =>
    `${title}: ${value}${subtitle ? `. ${subtitle}` : ''}`,
  SYSTEM_HEALTH: (title: string, isActive: boolean) =>
    `${title}: ${isActive ? 'Active and healthy' : 'Inactive or experiencing issues'}`,
  EXPANDABLE_SECTION: (title: string, isExpanded: boolean) =>
    `${title}: ${isExpanded ? 'Expanded' : 'Collapsed'}. Press Enter or Space to ${isExpanded ? 'collapse' : 'expand'}.`,
} as const;

// ARIA labels for common UI elements
export const ARIA_LABELS = {
  CLOSE: 'Close',
  OPEN: 'Open',
  MENU: 'Menu',
  SEARCH: 'Search',
  FILTER: 'Filter',
  SORT: 'Sort',
  EDIT: 'Edit',
  DELETE: 'Delete',
  SAVE: 'Save',
  CANCEL: 'Cancel',
  SUBMIT: 'Submit',
  RESET: 'Reset',
  NEXT: 'Next',
  PREVIOUS: 'Previous',
  FIRST: 'First',
  LAST: 'Last',
  LOADING: 'Loading',
  ERROR: 'Error',
  SUCCESS: 'Success',
  WARNING: 'Warning',
  INFO: 'Information',
  REQUIRED: 'Required',
  OPTIONAL: 'Optional',
  EXPAND: 'Expand',
  COLLAPSE: 'Collapse',
  SHOW: 'Show',
  HIDE: 'Hide',
  STATUS: {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    ONLINE: 'Online',
    OFFLINE: 'Offline',
    HEALTHY: 'Healthy',
    ERROR: 'Error',
    WARNING: 'Warning',
    LOADING: 'Loading',
  },
  CARD: {
    INTERACTIVE: 'Interactive card',
    METRIC: 'Metric card',
    CONTENT: 'Content card',
    EXPANDABLE: 'Expandable card',
  },
} as const;

// ARIA roles and properties
export const ARIA_ROLES = {
  BUTTON: 'button',
  LINK: 'link',
  TAB: 'tab',
  TABPANEL: 'tabpanel',
  TABLIST: 'tablist',
  MENU: 'menu',
  MENUITEM: 'menuitem',
  DIALOG: 'dialog',
  ALERT: 'alert',
  STATUS: 'status',
  PROGRESSBAR: 'progressbar',
  SLIDER: 'slider',
  SPINBUTTON: 'spinbutton',
  COMBOBOX: 'combobox',
  LISTBOX: 'listbox',
  OPTION: 'option',
  GRID: 'grid',
  GRIDCELL: 'gridcell',
  ROW: 'row',
  COLUMNHEADER: 'columnheader',
  ROWHEADER: 'rowheader',
} as const;

// Color contrast utilities for WCAG AA compliance
export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string): number => {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Convert to linear RGB
    const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    const rLinear = toLinear(r);
    const gLinear = toLinear(g);
    const bLinear = toLinear(b);

    // Calculate luminance
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

export function isWCAGAACompliant(foreground: string, background: string, isLargeText = false): boolean {
  const contrastRatio = getContrastRatio(foreground, background);
  const requiredRatio = isLargeText ? 3 : 4.5;
  return contrastRatio >= requiredRatio;
}

// Focus management utilities
export function useFocusManagement() {
  const focusableElementsSelector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ');

  const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
    return Array.from(container.querySelectorAll(focusableElementsSelector));
  };

  const trapFocus = (container: HTMLElement) => {
    const focusableElements = getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  };

  return { getFocusableElements, trapFocus };
}

// Keyboard navigation hook
export function useKeyboardNavigation(options: {
  onEnter?: () => void;
  onSpace?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
}) {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
        options.onEnter?.();
        break;
      case ' ':
        event.preventDefault();
        options.onSpace?.();
        break;
      case 'Escape':
        options.onEscape?.();
        break;
      case 'ArrowUp':
        event.preventDefault();
        options.onArrowUp?.();
        break;
      case 'ArrowDown':
        event.preventDefault();
        options.onArrowDown?.();
        break;
      case 'ArrowLeft':
        options.onArrowLeft?.();
        break;
      case 'ArrowRight':
        options.onArrowRight?.();
        break;
    }
  };

  return { handleKeyDown };
}

// Screen reader utilities
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('class', 'sr-only');
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// High contrast mode detection
export function useHighContrastMode() {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const checkHighContrast = () => {
      if (typeof window !== 'undefined') {
        // Check for Windows high contrast mode
        const hasHighContrast = window.matchMedia('(prefers-contrast: high)').matches ||
                               window.matchMedia('(-ms-high-contrast: active)').matches;
        setIsHighContrast(hasHighContrast);
      }
    };

    checkHighContrast();

    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    mediaQuery.addListener(checkHighContrast);

    return () => {
      mediaQuery.removeListener(checkHighContrast);
    };
  }, []);

  return isHighContrast;
}

// Reduced motion detection
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addListener(handleChange);

    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return prefersReducedMotion;
}

// ARIA live region hook
export function useAriaLiveRegion() {
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (liveRegionRef.current) {
      liveRegionRef.current.setAttribute('aria-live', priority);
      liveRegionRef.current.textContent = message;
    }
  };

  const LiveRegionComponent = () => (
    <div
      ref={liveRegionRef}
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  );

  return { announce, LiveRegionComponent };
}

// Skip link component for keyboard navigation
export interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function SkipLink({ href, children, className = '' }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={`sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded ${className}`}
    >
      {children}
    </a>
  );
}

// Accessible button component with proper ARIA attributes
export interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

export function AccessibleButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  ariaLabel,
  ariaDescribedBy,
  className = '',
  disabled,
  ...props
}: AccessibleButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-busy={loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}

// Accessible form field component
export interface AccessibleFieldProps {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  description?: string;
}

export function AccessibleField({
  id,
  label,
  error,
  required = false,
  children,
  description,
}: AccessibleFieldProps) {
  const errorId = error ? `${id}-error` : undefined;
  const descriptionId = description ? `${id}-description` : undefined;
  const ariaDescribedBy = [errorId, descriptionId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      
      {description && (
        <p id={descriptionId} className="text-sm text-gray-600">
          {description}
        </p>
      )}
      
      <div>
        {React.cloneElement(children as React.ReactElement, {
          id,
          'aria-describedby': ariaDescribedBy,
          'aria-invalid': error ? 'true' : 'false',
          'aria-required': required,
        })}
      </div>
      
      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}