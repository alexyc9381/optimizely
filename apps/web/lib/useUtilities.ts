/**
 * React Hook for Utility Classes
 * Provides programmatic access to design system utility classes
 */

import React, { useMemo } from 'react';
import { utilityGenerator } from './utility-generator';

/**
 * Utility class categories
 */
export type UtilityCategory =
  | 'typography'
  | 'colors'
  | 'spacing'
  | 'components';

/**
 * Typography utility types
 */
export type TypographyLevel =
  | 'display-2xl' | 'display-xl' | 'display-lg' | 'display-md' | 'display-sm'
  | 'heading-xl' | 'heading-lg' | 'heading-md' | 'heading-sm'
  | 'body-xl' | 'body-lg' | 'body-md' | 'body-sm' | 'body-xs'
  | 'label-lg' | 'label-md' | 'label-sm' | 'label-xs';

/**
 * Color categories and scales
 */
export type ColorCategory = 'primary' | 'secondary' | 'neutral' | 'success' | 'warning' | 'error' | 'info';
export type ColorScale = '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | '950';
export type ColorType = 'text' | 'bg' | 'border';

/**
 * Spacing tokens
 */
export type SpacingToken = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '10' | '12' | '16' | '20' | '24' | '32' | '40' | '48' | '56' | '64' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
export type SpacingType = 'm' | 'p' | 'gap' | 'mx' | 'my' | 'mt' | 'mr' | 'mb' | 'ml' | 'px' | 'py' | 'pt' | 'pr' | 'pb' | 'pl';

/**
 * Component variants
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type CardVariant = 'default' | 'elevated' | 'glass';
export type CardSize = 'sm' | 'md' | 'lg';
export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'info';

/**
 * Responsive breakpoints
 */
export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Utility class builder functions
 */
export interface UtilityHelpers {
  typography: {
    /**
     * Get typography class name
     */
    getClass: (level: TypographyLevel) => string;

    /**
     * Get responsive typography classes
     */
    getResponsive: (config: Partial<Record<Breakpoint, TypographyLevel>>) => string;

    /**
     * Build typography class with custom properties
     */
    build: (options: {
      level: TypographyLevel;
      weight?: 'thin' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';
      tracking?: 'tighter' | 'tight' | 'normal' | 'wide' | 'wider' | 'widest';
      leading?: 'none' | 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose';
    }) => string;
  };

  colors: {
    /**
     * Get color class name
     */
    getClass: (type: ColorType, category: ColorCategory, scale: ColorScale) => string;

    /**
     * Get semantic color classes
     */
    getSemantic: (type: ColorType, semantic: 'success' | 'warning' | 'error' | 'info') => string;

    /**
     * Get gradient classes
     */
    getGradient: (type: 'bg' | 'text', variant: ColorCategory) => string;

    /**
     * Build color class with opacity
     */
    buildWithOpacity: (type: ColorType, category: ColorCategory, scale: ColorScale, opacity: number) => string;
  };

  spacing: {
    /**
     * Get spacing class name
     */
    getClass: (type: SpacingType, token: SpacingToken) => string;

    /**
     * Get responsive spacing classes
     */
    getResponsive: (type: SpacingType, config: Partial<Record<Breakpoint, SpacingToken>>) => string;

    /**
     * Build spacing classes for all sides
     */
    buildAll: (padding?: SpacingToken, margin?: SpacingToken, gap?: SpacingToken) => string;
  };

  components: {
    /**
     * Get button classes
     */
    button: (variant: ButtonVariant, size: ButtonSize) => string;

    /**
     * Get card classes
     */
    card: (variant: CardVariant, size: CardSize) => string;

    /**
     * Get input classes
     */
    input: (size?: 'sm' | 'lg', error?: boolean) => string;

    /**
     * Get badge classes
     */
    badge: (variant: BadgeVariant) => string;

    /**
     * Get modal classes
     */
    modal: () => { overlay: string; content: string };
  };
}

/**
 * Main hook for utility classes
 */
export const useUtilities = (): UtilityHelpers => {
  const utilities = useMemo((): UtilityHelpers => {
    return {
      typography: {
        getClass: (level: TypographyLevel): string => `text-${level}`,

        getResponsive: (config: Partial<Record<Breakpoint, TypographyLevel>>): string => {
          return Object.entries(config)
            .map(([breakpoint, level]) =>
              breakpoint === 'sm' ? `text-${level}` : `${breakpoint}:text-${level}`
            )
            .join(' ');
        },

        build: (options): string => {
          const classes = [`text-${options.level}`];
          if (options.weight) classes.push(`font-${options.weight}`);
          if (options.tracking) classes.push(`tracking-${options.tracking}`);
          if (options.leading) classes.push(`leading-${options.leading}`);
          return classes.join(' ');
        }
      },

      colors: {
        getClass: (type: ColorType, category: ColorCategory, scale: ColorScale): string =>
          `${type}-${category}-${scale}`,

        getSemantic: (type: ColorType, semantic): string => {
          const scaleMap = {
            success: '600',
            warning: '600',
            error: '600',
            info: '600'
          };
          return `${type}-${semantic}-${scaleMap[semantic]}`;
        },

        getGradient: (type: 'bg' | 'text', variant: ColorCategory): string =>
          `${type}-gradient-${variant}`,

        buildWithOpacity: (type: ColorType, category: ColorCategory, scale: ColorScale, opacity: number): string =>
          `${type}-${category}-${scale}/${opacity}`
      },

      spacing: {
        getClass: (type: SpacingType, token: SpacingToken): string => `${type}-${token}`,

        getResponsive: (type: SpacingType, config: Partial<Record<Breakpoint, SpacingToken>>): string => {
          return Object.entries(config)
            .map(([breakpoint, token]) =>
              breakpoint === 'sm' ? `${type}-${token}` : `${breakpoint}:${type}-${token}`
            )
            .join(' ');
        },

        buildAll: (padding?: SpacingToken, margin?: SpacingToken, gap?: SpacingToken): string => {
          const classes: string[] = [];
          if (padding) classes.push(`p-${padding}`);
          if (margin) classes.push(`m-${margin}`);
          if (gap) classes.push(`gap-${gap}`);
          return classes.join(' ');
        }
      },

      components: {
        button: (variant: ButtonVariant, size: ButtonSize): string =>
          `btn btn-${variant} btn-${size}`,

        card: (variant: CardVariant, size: CardSize): string => {
          const base = variant === 'default' ? 'card' : `card card-${variant}`;
          return `${base} card-${size}`;
        },

        input: (size?: 'sm' | 'lg', error?: boolean): string => {
          const classes = ['input'];
          if (size) classes.push(`input-${size}`);
          if (error) classes.push('input-error');
          return classes.join(' ');
        },

        badge: (variant: BadgeVariant): string => `badge badge-${variant}`,

        modal: () => ({
          overlay: 'modal-overlay',
          content: 'modal-content'
        })
      }
    };
  }, []);

  return utilities;
};

/**
 * Utility class validator
 */
export const validateUtilityClass = (className: string): boolean => {
  const validPrefixes = [
    'text-', 'bg-', 'border-', 'font-', 'tracking-', 'leading-',
    'm-', 'mx-', 'my-', 'mt-', 'mr-', 'mb-', 'ml-',
    'p-', 'px-', 'py-', 'pt-', 'pr-', 'pb-', 'pl-',
    'gap-', 'gap-x-', 'gap-y-',
    'btn', 'card', 'input', 'badge', 'modal-'
  ];

  return validPrefixes.some(prefix => className.startsWith(prefix));
};

// HOC removed due to TypeScript complexity - use useUtilities hook directly instead

/**
 * Utility class constants
 */
export const UTILITY_CONSTANTS = {
  TYPOGRAPHY_LEVELS: [
    'display-2xl', 'display-xl', 'display-lg', 'display-md', 'display-sm',
    'heading-xl', 'heading-lg', 'heading-md', 'heading-sm',
    'body-xl', 'body-lg', 'body-md', 'body-sm', 'body-xs',
    'label-lg', 'label-md', 'label-sm', 'label-xs'
  ] as TypographyLevel[],

  COLOR_CATEGORIES: ['primary', 'secondary', 'neutral', 'success', 'warning', 'error', 'info'] as ColorCategory[],

  COLOR_SCALES: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] as ColorScale[],

  SPACING_TOKENS: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '10', '12', '16', '20', '24', '32', '40', '48', '56', '64', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as SpacingToken[],

  BREAKPOINTS: ['sm', 'md', 'lg', 'xl', '2xl'] as Breakpoint[]
};

export default useUtilities;
