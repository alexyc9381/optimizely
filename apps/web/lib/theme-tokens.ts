/**
 * Theme Tokens for Optelo Dashboard
 * Centralized theme token system that works with existing color and typography systems
 */

import { COLOR_PALETTE } from './colors';
import { TYPOGRAPHY_HIERARCHY } from './typography';

/**
 * Design Token Categories
 * Organizing tokens by their usage and semantic meaning
 */

/**
 * Spacing Tokens
 * Consistent spacing scale for layout and component spacing
 */
export const SPACING_TOKENS = {
  // Base spacing scale (4px grid)
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
  32: '128px',
  40: '160px',
  48: '192px',
  56: '224px',
  64: '256px',

  // Semantic spacing tokens
  xs: '4px',    // 1
  sm: '8px',    // 2
  md: '16px',   // 4
  lg: '24px',   // 6
  xl: '32px',   // 8
  '2xl': '48px', // 12
  '3xl': '64px', // 16
} as const;

/**
 * Border Radius Tokens
 * Consistent rounded corner system
 */
export const RADIUS_TOKENS = {
  none: '0px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  full: '9999px',
  
  // Semantic radius tokens
  button: '8px',
  card: '12px',
  input: '8px',
  modal: '16px',
  avatar: '9999px',
} as const;

/**
 * Shadow Tokens
 * Elevation system for depth perception
 */
export const SHADOW_TOKENS = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
  md: '0 4px 6px -1px rgba(15, 23, 42, 0.1), 0 2px 4px -1px rgba(15, 23, 42, 0.06)',
  lg: '0 10px 15px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -2px rgba(15, 23, 42, 0.05)',
  xl: '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 10px 10px -5px rgba(15, 23, 42, 0.04)',
  '2xl': '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(15, 23, 42, 0.06)',
  
  // Semantic shadow tokens
  card: '0 4px 6px -1px rgba(15, 23, 42, 0.1), 0 2px 4px -1px rgba(15, 23, 42, 0.06)',
  modal: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
  dropdown: '0 10px 15px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -2px rgba(15, 23, 42, 0.05)',
  button: '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
  focus: '0 0 0 3px rgba(91, 108, 255, 0.3)',
} as const;

/**
 * Animation Tokens
 * Consistent timing and easing for animations
 */
export const ANIMATION_TOKENS = {
  // Duration tokens
  duration: {
    instant: '0ms',
    fast: '150ms',
    normal: '250ms',
    slow: '400ms',
    slower: '600ms',
  },
  
  // Easing tokens
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  
  // Semantic animation tokens
  hover: 'cubic-bezier(0, 0, 0.2, 1) 150ms',
  focus: 'cubic-bezier(0, 0, 0.2, 1) 150ms',
  modal: 'cubic-bezier(0.4, 0, 0.2, 1) 250ms',
  drawer: 'cubic-bezier(0.4, 0, 0.2, 1) 300ms',
} as const;

/**
 * Z-Index Tokens
 * Consistent layering system
 */
export const Z_INDEX_TOKENS = {
  base: 0,
  below: -1,
  normal: 1,
  tooltip: 10,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modal: 1000,
  popover: 1100,
  toast: 1200,
  overlay: 1300,
  max: 9999,
} as const;

/**
 * Component Theme Tokens
 * Pre-configured token combinations for common components
 */
export const COMPONENT_TOKENS = {
  button: {
    primary: {
      background: COLOR_PALETTE.primary[500],
      backgroundHover: COLOR_PALETTE.primary[600],
      backgroundActive: COLOR_PALETTE.primary[700],
      backgroundDisabled: COLOR_PALETTE.neutral[300],
      text: COLOR_PALETTE.neutral[50],
      textDisabled: COLOR_PALETTE.neutral[500],
      border: 'transparent',
      borderFocus: COLOR_PALETTE.primary[500],
      shadow: SHADOW_TOKENS.button,
      shadowHover: SHADOW_TOKENS.md,
      radius: RADIUS_TOKENS.button,
      spacing: SPACING_TOKENS[4],
    },
    secondary: {
      background: COLOR_PALETTE.neutral[100],
      backgroundHover: COLOR_PALETTE.neutral[200],
      backgroundActive: COLOR_PALETTE.neutral[300],
      backgroundDisabled: COLOR_PALETTE.neutral[100],
      text: COLOR_PALETTE.neutral[900],
      textDisabled: COLOR_PALETTE.neutral[400],
      border: COLOR_PALETTE.neutral[200],
      borderFocus: COLOR_PALETTE.primary[500],
      shadow: SHADOW_TOKENS.button,
      shadowHover: SHADOW_TOKENS.md,
      radius: RADIUS_TOKENS.button,
      spacing: SPACING_TOKENS[4],
    },
  },
  
  card: {
    default: {
      background: COLOR_PALETTE.background.card,
      border: COLOR_PALETTE.border.default,
      shadow: SHADOW_TOKENS.card,
      shadowHover: SHADOW_TOKENS.lg,
      radius: RADIUS_TOKENS.card,
      spacing: SPACING_TOKENS[6],
    },
    elevated: {
      background: COLOR_PALETTE.background.card,
      border: COLOR_PALETTE.border.subtle,
      shadow: SHADOW_TOKENS.lg,
      shadowHover: SHADOW_TOKENS.xl,
      radius: RADIUS_TOKENS.card,
      spacing: SPACING_TOKENS[6],
    },
  },
  
  input: {
    default: {
      background: COLOR_PALETTE.background.primary,
      border: COLOR_PALETTE.border.default,
      borderHover: COLOR_PALETTE.border.strong,
      borderFocus: COLOR_PALETTE.border.focus,
      borderError: COLOR_PALETTE.border.error,
      text: COLOR_PALETTE.text.primary,
      placeholder: COLOR_PALETTE.text.placeholder,
      shadow: SHADOW_TOKENS.sm,
      shadowFocus: SHADOW_TOKENS.focus,
      radius: RADIUS_TOKENS.input,
      spacing: SPACING_TOKENS[3],
    },
  },
  
  modal: {
    default: {
      background: COLOR_PALETTE.background.card,
      overlay: COLOR_PALETTE.background.overlay,
      border: COLOR_PALETTE.border.default,
      shadow: SHADOW_TOKENS.modal,
      radius: RADIUS_TOKENS.modal,
      spacing: SPACING_TOKENS[8],
    },
  },
} as const;

/**
 * Responsive Breakpoint Tokens
 * Consistent breakpoints for responsive design
 */
export const BREAKPOINT_TOKENS = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

/**
 * Theme Token Utilities
 */
export const themeTokenUtils = {
  /**
   * Generate CSS custom properties for all tokens
   */
  generateCSSProperties: (): Record<string, string> => {
    const properties: Record<string, string> = {};
    
    // Spacing tokens
    Object.entries(SPACING_TOKENS).forEach(([key, value]) => {
      properties[`--spacing-${key}`] = value;
    });
    
    // Radius tokens
    Object.entries(RADIUS_TOKENS).forEach(([key, value]) => {
      properties[`--radius-${key}`] = value;
    });
    
    // Shadow tokens
    Object.entries(SHADOW_TOKENS).forEach(([key, value]) => {
      properties[`--shadow-${key}`] = value;
    });
    
    // Animation tokens
    Object.entries(ANIMATION_TOKENS.duration).forEach(([key, value]) => {
      properties[`--duration-${key}`] = value;
    });
    
    Object.entries(ANIMATION_TOKENS.easing).forEach(([key, value]) => {
      properties[`--easing-${key}`] = value;
    });
    
    // Z-index tokens
    Object.entries(Z_INDEX_TOKENS).forEach(([key, value]) => {
      properties[`--z-${key}`] = value.toString();
    });
    
    return properties;
  },
  
  /**
   * Get component token set
   */
  getComponentTokens: (
    component: keyof typeof COMPONENT_TOKENS,
    variant: string = 'default'
  ): Record<string, string> => {
    const componentTokens = COMPONENT_TOKENS[component];
    if (componentTokens && componentTokens[variant as keyof typeof componentTokens]) {
      return componentTokens[variant as keyof typeof componentTokens];
    }
    return {};
  },
  
  /**
   * Generate Tailwind configuration for tokens
   */
  generateTailwindConfig: () => {
    return {
      spacing: SPACING_TOKENS,
      borderRadius: RADIUS_TOKENS,
      boxShadow: SHADOW_TOKENS,
      transitionDuration: ANIMATION_TOKENS.duration,
      transitionTimingFunction: ANIMATION_TOKENS.easing,
      zIndex: Z_INDEX_TOKENS,
      screens: BREAKPOINT_TOKENS,
    };
  },
  
  /**
   * Get responsive value based on breakpoint
   */
  getResponsiveValue: <T>(values: Partial<Record<keyof typeof BREAKPOINT_TOKENS, T>>): string => {
    const breakpointEntries = Object.entries(values) as [keyof typeof BREAKPOINT_TOKENS, T][];
    
    return breakpointEntries
      .map(([breakpoint, value]) => {
        const minWidth = BREAKPOINT_TOKENS[breakpoint];
        return `@media (min-width: ${minWidth}) { /* ${String(value)} */ }`;
      })
      .join(' ');
  },
};

/**
 * Theme Token Context (for advanced usage)
 */
export interface ThemeTokens {
  spacing: typeof SPACING_TOKENS;
  radius: typeof RADIUS_TOKENS;
  shadow: typeof SHADOW_TOKENS;
  animation: typeof ANIMATION_TOKENS;
  zIndex: typeof Z_INDEX_TOKENS;
  breakpoints: typeof BREAKPOINT_TOKENS;
  components: typeof COMPONENT_TOKENS;
}

export const defaultThemeTokens: ThemeTokens = {
  spacing: SPACING_TOKENS,
  radius: RADIUS_TOKENS,
  shadow: SHADOW_TOKENS,
  animation: ANIMATION_TOKENS,
  zIndex: Z_INDEX_TOKENS,
  breakpoints: BREAKPOINT_TOKENS,
  components: COMPONENT_TOKENS,
};

export default {
  SPACING_TOKENS,
  RADIUS_TOKENS,
  SHADOW_TOKENS,
  ANIMATION_TOKENS,
  Z_INDEX_TOKENS,
  COMPONENT_TOKENS,
  BREAKPOINT_TOKENS,
  themeTokenUtils,
  defaultThemeTokens,
};