/**
 * Typography Hook for Optelo Dashboard
 * Provides React hook for accessing typography system programmatically
 */

import { useMemo } from 'react';
import { RESPONSIVE_TYPOGRAPHY, TYPOGRAPHY_HIERARCHY } from './typography';

/**
 * Typography hook for React components
 * Provides easy access to typography styles and utilities
 */
export const useTypography = () => {
  const typography = useMemo(() => {
    return {
      /**
       * Get typography styles for a specific level
       */
      getStyle: (level: keyof typeof TYPOGRAPHY_HIERARCHY) => {
        return TYPOGRAPHY_HIERARCHY[level];
      },

      /**
       * Get responsive typography styles
       */
      getResponsiveStyle: (level: keyof typeof RESPONSIVE_TYPOGRAPHY) => {
        return RESPONSIVE_TYPOGRAPHY[level];
      },

      /**
       * Generate inline styles for a typography level
       */
      getInlineStyles: (level: keyof typeof TYPOGRAPHY_HIERARCHY) => {
        const style = TYPOGRAPHY_HIERARCHY[level];
        return {
          fontSize: style.fontSize,
          lineHeight: style.lineHeight,
          fontWeight: style.fontWeight,
          letterSpacing: style.letterSpacing,
        };
      },

      /**
       * Get CSS class name for a typography level
       */
      getClassName: (level: keyof typeof TYPOGRAPHY_HIERARCHY) => {
        return `text-${level}`;
      },

      /**
       * Get responsive CSS class name
       */
      getResponsiveClassName: (level: keyof typeof RESPONSIVE_TYPOGRAPHY) => {
        return `text-${level}`;
      },

      /**
       * Check if current device prefers reduced motion
       */
      prefersReducedMotion: () => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      },

      /**
       * Get appropriate font size based on device and content type
       */
      getContextualSize: (
        context: 'mobile' | 'tablet' | 'desktop',
        type: 'display' | 'heading' | 'body'
      ) => {
        const responsiveKey =
          `${type}-responsive` as keyof typeof RESPONSIVE_TYPOGRAPHY;
        if (RESPONSIVE_TYPOGRAPHY[responsiveKey]) {
          return RESPONSIVE_TYPOGRAPHY[responsiveKey][context];
        }
        return TYPOGRAPHY_HIERARCHY['body-md'];
      },

      /**
       * Generate CSS custom properties for a specific theme
       */
      generateCSSProperties: (prefix = '--typography') => {
        const properties: Record<string, string> = {};

        Object.entries(TYPOGRAPHY_HIERARCHY).forEach(([key, style]) => {
          properties[`${prefix}-${key}-font-size`] = style.fontSize;
          properties[`${prefix}-${key}-line-height`] = style.lineHeight;
          properties[`${prefix}-${key}-font-weight`] = style.fontWeight;
          properties[`${prefix}-${key}-letter-spacing`] = style.letterSpacing;
        });

        return properties;
      },

      /**
       * Constants for direct access
       */
      hierarchy: TYPOGRAPHY_HIERARCHY,
      responsive: RESPONSIVE_TYPOGRAPHY,
    };
  }, []);

  return typography;
};

// HOC removed due to TypeScript complexity - use useTypography hook directly instead

/**
 * Typography context for theme switching
 */
export interface TypographyTheme {
  fontFamily: string;
  baseSize: string;
  scale: number;
  weights: {
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
}

export const defaultTypographyTheme: TypographyTheme = {
  fontFamily: 'Inter',
  baseSize: '1rem',
  scale: 1.125,
  weights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
};

/**
 * Utility functions for typography calculations
 */
export const typographyUtils = {
  /**
   * Calculate font size based on scale and steps
   */
  calculateFontSize: (
    baseSize: number,
    scale: number,
    steps: number
  ): string => {
    const size = baseSize * Math.pow(scale, steps);
    return `${size}rem`;
  },

  /**
   * Calculate optimal line height for given font size
   */
  calculateLineHeight: (fontSize: number): number => {
    // Golden ratio approach for optimal readability
    if (fontSize <= 0.75) return 1.6;
    if (fontSize <= 1) return 1.5;
    if (fontSize <= 1.25) return 1.4;
    if (fontSize <= 2) return 1.3;
    return 1.2;
  },

  /**
   * Get contrast-compliant color for text
   */
  getTextColor: (background: 'light' | 'dark'): string => {
    return background === 'dark' ? '#e2e8f0' : '#1e293b';
  },

  /**
   * Generate fluid typography CSS
   */
  generateFluidTypography: (
    minSize: number,
    maxSize: number,
    minViewport: number = 320,
    maxViewport: number = 1200
  ): string => {
    const slope = (maxSize - minSize) / (maxViewport - minViewport);
    const yAxisIntersection = -minViewport * slope + minSize;

    return `clamp(${minSize}rem, ${yAxisIntersection}rem + ${slope * 100}vw, ${maxSize}rem)`;
  },
};

export default useTypography;
