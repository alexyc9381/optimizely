/**
 * Color System Hook for Optelo Dashboard
 * Provides React hook for accessing color system and theme management
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { COLOR_PALETTE, SEMANTIC_COLORS, colorUtils } from './colors';

/**
 * Theme types
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Color hook for React components
 * Provides easy access to color system and theme management
 */
export const useColors = () => {
  const [currentTheme, setCurrentTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Detect system theme preference
  const detectSystemTheme = useCallback((): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }, []);

  // Update resolved theme based on current theme setting
  useEffect(() => {
    if (currentTheme === 'system') {
      setResolvedTheme(detectSystemTheme());

      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setResolvedTheme(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      setResolvedTheme(currentTheme);
    }
  }, [currentTheme, detectSystemTheme]);

  // Apply theme to document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', resolvedTheme);
    }
  }, [resolvedTheme]);

  const colors = useMemo(() => {
    return {
      /**
       * Get color value by path (e.g., 'primary.500', 'success.600')
       */
      get: (colorPath: string): string => {
        const [category, shade] = colorPath.split('.');
        const colorCategory = COLOR_PALETTE[category as keyof typeof COLOR_PALETTE];

        if (colorCategory && typeof colorCategory === 'object' && shade) {
          return (colorCategory as Record<string, string>)[shade] || '#000000';
        }

        return '#000000';
      },

      /**
       * Get semantic color by intent
       */
      getSemantic: (intent: keyof typeof SEMANTIC_COLORS): Record<string, string> => {
        return SEMANTIC_COLORS[intent];
      },

      /**
       * Get accessible text color for background
       */
      getAccessibleText: (backgroundColor: string): string => {
        return colorUtils.getAccessibleTextColor(backgroundColor);
      },

      /**
       * Get color with opacity
       */
      withOpacity: (color: string, opacity: number): string => {
        return colorUtils.withOpacity(color, opacity);
      },

      /**
       * Check contrast ratio compliance
       */
      meetsContrast: (
        foreground: string,
        background: string,
        level: 'AA' | 'AAA' = 'AA'
      ): boolean => {
        return colorUtils.meetsContrastRatio(foreground, background, level);
      },

      /**
       * Get CSS custom property name for color
       */
      getCSSVar: (colorPath: string): string => {
        const [category, shade] = colorPath.split('.');
        return `var(--color-${category}-${shade})`;
      },

      /**
       * Get theme-aware color (automatically switches between light/dark)
       */
      getThemeColor: (lightColor: string, darkColor: string): string => {
        return resolvedTheme === 'dark' ? darkColor : lightColor;
      },

      /**
       * Generate inline styles with theme awareness
       */
      getThemeStyles: (styles: {
        light: Record<string, string>;
        dark: Record<string, string>;
      }): Record<string, string> => {
        return resolvedTheme === 'dark' ? styles.dark : styles.light;
      },

      /**
       * Get status color by type
       */
      getStatusColor: (
        status: 'success' | 'warning' | 'error' | 'info',
        shade: string = '500'
      ): string => {
        const statusColors = {
          success: COLOR_PALETTE.success,
          warning: COLOR_PALETTE.warning,
          error: COLOR_PALETTE.error,
          info: COLOR_PALETTE.info,
        };

        return (statusColors[status] as Record<string, string>)[shade] || '#000000';
      },

      /**
       * Get interactive color states
       */
      getInteractiveColors: (variant: 'primary' | 'secondary') => {
        const primary = {
          default: COLOR_PALETTE.primary[500],
          hover: COLOR_PALETTE.primary[600],
          active: COLOR_PALETTE.primary[700],
          disabled: COLOR_PALETTE.neutral[300],
        };

        const secondary = {
          default: COLOR_PALETTE.neutral[100],
          hover: COLOR_PALETTE.neutral[200],
          active: COLOR_PALETTE.neutral[300],
          disabled: COLOR_PALETTE.neutral[100],
        };

        return variant === 'primary' ? primary : secondary;
      },

      /**
       * Constants for direct access
       */
      palette: COLOR_PALETTE,
      semantic: SEMANTIC_COLORS,
      utils: colorUtils,
    };
  }, [resolvedTheme]);

  const theme = useMemo(() => {
    return {
      /**
       * Current theme setting
       */
      current: currentTheme,

      /**
       * Resolved theme (light/dark)
       */
      resolved: resolvedTheme,

      /**
       * Set theme
       */
      set: (newTheme: Theme) => {
        setCurrentTheme(newTheme);
        // Persist theme preference
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('theme', newTheme);
        }
      },

      /**
       * Toggle between light and dark (ignores system)
       */
      toggle: () => {
        const newTheme = resolvedTheme === 'light' ? 'dark' : 'light';
        setCurrentTheme(newTheme);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('theme', newTheme);
        }
      },

      /**
       * Check if dark mode is active
       */
      isDark: resolvedTheme === 'dark',

      /**
       * Check if light mode is active
       */
      isLight: resolvedTheme === 'light',

      /**
       * Check if system theme is being used
       */
      isSystem: currentTheme === 'system',
    };
  }, [currentTheme, resolvedTheme]);

  // Initialize theme from localStorage on mount
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setCurrentTheme(savedTheme);
      }
    }
  }, []);

  return { colors, theme };
};

// HOC removed due to TypeScript complexity - use useColors hook directly instead

/**
 * Context for theme management (optional, for complex apps)
 */
export interface ColorTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
}

export const defaultLightTheme: ColorTheme = {
  primary: COLOR_PALETTE.primary[500],
  secondary: COLOR_PALETTE.secondary[600],
  accent: COLOR_PALETTE.info[500],
  background: COLOR_PALETTE.background.primary,
  surface: COLOR_PALETTE.background.secondary,
  text: COLOR_PALETTE.text.primary,
};

export const defaultDarkTheme: ColorTheme = {
  primary: COLOR_PALETTE.primary[400],
  secondary: COLOR_PALETTE.secondary[500],
  accent: COLOR_PALETTE.info[400],
  background: COLOR_PALETTE.darkBackground.primary,
  surface: COLOR_PALETTE.darkBackground.secondary,
  text: COLOR_PALETTE.darkText.primary,
};

/**
 * Utility functions for color manipulation
 */
export const colorHelpers = {
  /**
   * Convert hex to RGB
   */
  hexToRgb: (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  },

  /**
   * Convert RGB to hex
   */
  rgbToHex: (r: number, g: number, b: number): string => {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  },

  /**
   * Lighten color by percentage
   */
  lighten: (color: string, percent: number): string => {
    const rgb = colorHelpers.hexToRgb(color);
    if (!rgb) return color;

    const factor = 1 + percent / 100;
    return colorHelpers.rgbToHex(
      Math.min(255, Math.round(rgb.r * factor)),
      Math.min(255, Math.round(rgb.g * factor)),
      Math.min(255, Math.round(rgb.b * factor))
    );
  },

  /**
   * Darken color by percentage
   */
  darken: (color: string, percent: number): string => {
    const rgb = colorHelpers.hexToRgb(color);
    if (!rgb) return color;

    const factor = 1 - percent / 100;
    return colorHelpers.rgbToHex(
      Math.max(0, Math.round(rgb.r * factor)),
      Math.max(0, Math.round(rgb.g * factor)),
      Math.max(0, Math.round(rgb.b * factor))
    );
  },
};

export default useColors;
