/**
 * Utility Class Generator
 * Generates comprehensive utility classes for typography, colors, and theme tokens
 */

import { COLOR_PALETTE } from './colors';
import {
    ANIMATION_TOKENS,
    RADIUS_TOKENS,
    SHADOW_TOKENS,
    SPACING_TOKENS,
    Z_INDEX_TOKENS
} from './theme-tokens';
import { TYPOGRAPHY_HIERARCHY } from './typography';

/**
 * Typography Utility Classes
 * Generates utilities for all typography hierarchy levels
 */
export const typographyUtilities = {
  /**
   * Generate all typography utility classes as CSS
   */
  generateCSS: (): string => {
    const utilities: string[] = [];

    // Generate typography classes for each hierarchy level
    Object.entries(TYPOGRAPHY_HIERARCHY).forEach(([level, config]) => {
      utilities.push(`
.text-${level} {
  font-size: ${config.fontSize};
  line-height: ${config.lineHeight};
  font-weight: ${config.fontWeight};
  letter-spacing: ${config.letterSpacing};
}`);
    });

    // Generate responsive typography utilities
    const responsiveBreakpoints = {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px'
    };

    Object.entries(responsiveBreakpoints).forEach(([breakpoint, minWidth]) => {
      Object.entries(TYPOGRAPHY_HIERARCHY).forEach(([level, config]) => {
        utilities.push(`
@media (min-width: ${minWidth}) {
  .${breakpoint}\\:text-${level} {
    font-size: ${config.fontSize};
    line-height: ${config.lineHeight};
    font-weight: ${config.fontWeight};
    letter-spacing: ${config.letterSpacing};
  }
}`);
      });
    });

    // Generate font weight utilities
    const fontWeights = {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900'
    };

    Object.entries(fontWeights).forEach(([weight, value]) => {
      utilities.push(`
.font-${weight} {
  font-weight: ${value};
}`);
    });

    // Generate letter spacing utilities
    const letterSpacings = {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em'
    };

    Object.entries(letterSpacings).forEach(([spacing, value]) => {
      utilities.push(`
.tracking-${spacing} {
  letter-spacing: ${value};
}`);
    });

    // Generate line height utilities
    const lineHeights = {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2'
    };

    Object.entries(lineHeights).forEach(([height, value]) => {
      utilities.push(`
.leading-${height} {
  line-height: ${value};
}`);
    });

    return utilities.join('\n');
  },

  /**
   * Get Tailwind configuration for typography
   */
  getTailwindConfig: () => {
    const fontSize: Record<string, [string, any]> = {};

    Object.entries(TYPOGRAPHY_HIERARCHY).forEach(([level, config]) => {
      fontSize[level] = [
        config.fontSize,
        {
          lineHeight: config.lineHeight,
          fontWeight: config.fontWeight,
          letterSpacing: config.letterSpacing
        }
      ];
    });

    return { fontSize };
  }
};

/**
 * Color Utility Classes
 * Generates utilities for all colors with opacity variations
 */
export const colorUtilities = {
  /**
   * Generate all color utility classes as CSS
   */
  generateCSS: (): string => {
    const utilities: string[] = [];

    // Generate text color utilities
    Object.entries(COLOR_PALETTE).forEach(([category, colors]) => {
      if (typeof colors === 'object' && colors !== null) {
        if (category.includes('background') || category.includes('text') || category.includes('border')) {
          // Handle semantic color categories
          Object.entries(colors).forEach(([shade, color]) => {
            const categoryName = category.replace('dark-', '').replace('-', '');
            utilities.push(`
.text-${categoryName}-${shade} {
  color: ${color};
}`);
            utilities.push(`
.bg-${categoryName}-${shade} {
  background-color: ${color};
}`);
            utilities.push(`
.border-${categoryName}-${shade} {
  border-color: ${color};
}`);
          });
        } else {
          // Handle color scale categories (primary, secondary, neutral, etc.)
          Object.entries(colors).forEach(([shade, color]) => {
            utilities.push(`
.text-${category}-${shade} {
  color: ${color};
}`);
            utilities.push(`
.bg-${category}-${shade} {
  background-color: ${color};
}`);
            utilities.push(`
.border-${category}-${shade} {
  border-color: ${color};
}`);

            // Generate opacity variations
            const opacities = [10, 20, 30, 40, 50, 60, 70, 80, 90];
            opacities.forEach(opacity => {
              utilities.push(`
.text-${category}-${shade}\\/${opacity} {
  color: ${color}${Math.round(opacity * 2.55).toString(16).padStart(2, '0')};
}`);
              utilities.push(`
.bg-${category}-${shade}\\/${opacity} {
  background-color: ${color}${Math.round(opacity * 2.55).toString(16).padStart(2, '0')};
}`);
              utilities.push(`
.border-${category}-${shade}\\/${opacity} {
  border-color: ${color}${Math.round(opacity * 2.55).toString(16).padStart(2, '0')};
}`);
            });
          });
        }
      }
    });

    // Generate gradient utilities
    utilities.push(`
.bg-gradient-primary {
  background-image: linear-gradient(135deg, ${COLOR_PALETTE.primary[500]} 0%, ${COLOR_PALETTE.primary[600]} 100%);
}

.bg-gradient-secondary {
  background-image: linear-gradient(135deg, ${COLOR_PALETTE.secondary[500]} 0%, ${COLOR_PALETTE.secondary[600]} 100%);
}

.bg-gradient-success {
  background-image: linear-gradient(135deg, ${COLOR_PALETTE.success[500]} 0%, ${COLOR_PALETTE.success[600]} 100%);
}

.bg-gradient-warning {
  background-image: linear-gradient(135deg, ${COLOR_PALETTE.warning[500]} 0%, ${COLOR_PALETTE.warning[600]} 100%);
}

.bg-gradient-error {
  background-image: linear-gradient(135deg, ${COLOR_PALETTE.error[500]} 0%, ${COLOR_PALETTE.error[600]} 100%);
}

.text-gradient-primary {
  background-image: linear-gradient(135deg, ${COLOR_PALETTE.primary[500]} 0%, ${COLOR_PALETTE.primary[700]} 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.text-gradient-secondary {
  background-image: linear-gradient(135deg, ${COLOR_PALETTE.secondary[500]} 0%, ${COLOR_PALETTE.secondary[700]} 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}`);

    return utilities.join('\n');
  },

  /**
   * Get Tailwind configuration for colors
   */
  getTailwindConfig: () => {
    return { colors: COLOR_PALETTE };
  }
};

/**
 * Spacing Utility Classes
 * Generates utilities for consistent spacing
 */
export const spacingUtilities = {
  /**
   * Generate spacing utility classes as CSS
   */
  generateCSS: (): string => {
    const utilities: string[] = [];

    // Generate spacing utilities for margin, padding, gap
    Object.entries(SPACING_TOKENS).forEach(([token, value]) => {
      // Margin utilities
      utilities.push(`
.m-${token} { margin: ${value}; }
.mx-${token} { margin-left: ${value}; margin-right: ${value}; }
.my-${token} { margin-top: ${value}; margin-bottom: ${value}; }
.mt-${token} { margin-top: ${value}; }
.mr-${token} { margin-right: ${value}; }
.mb-${token} { margin-bottom: ${value}; }
.ml-${token} { margin-left: ${value}; }`);

      // Padding utilities
      utilities.push(`
.p-${token} { padding: ${value}; }
.px-${token} { padding-left: ${value}; padding-right: ${value}; }
.py-${token} { padding-top: ${value}; padding-bottom: ${value}; }
.pt-${token} { padding-top: ${value}; }
.pr-${token} { padding-right: ${value}; }
.pb-${token} { padding-bottom: ${value}; }
.pl-${token} { padding-left: ${value}; }`);

      // Gap utilities
      utilities.push(`
.gap-${token} { gap: ${value}; }
.gap-x-${token} { column-gap: ${value}; }
.gap-y-${token} { row-gap: ${value}; }`);

      // Width and height utilities
      utilities.push(`
.w-${token} { width: ${value}; }
.h-${token} { height: ${value}; }
.min-w-${token} { min-width: ${value}; }
.min-h-${token} { min-height: ${value}; }
.max-w-${token} { max-width: ${value}; }
.max-h-${token} { max-height: ${value}; }`);
    });

    return utilities.join('\n');
  }
};

/**
 * Component Utility Classes
 * Pre-built component utilities using design tokens
 */
export const componentUtilities = {
  /**
   * Generate component utility classes as CSS
   */
  generateCSS: (): string => {
    return `
/* Button Component Utilities */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-button);
  font-weight: 500;
  transition: all var(--duration-fast) var(--easing-ease-out);
  cursor: pointer;
  border: 1px solid transparent;
}

.btn:focus {
  outline: none;
  box-shadow: var(--shadow-focus);
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.btn-sm {
  padding: var(--spacing-2) var(--spacing-3);
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.btn-md {
  padding: var(--spacing-3) var(--spacing-4);
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.btn-lg {
  padding: var(--spacing-4) var(--spacing-6);
  font-size: 1rem;
  line-height: 1.5rem;
}

.btn-primary {
  background-color: ${COLOR_PALETTE.primary[500]};
  color: ${COLOR_PALETTE.neutral[50]};
}

.btn-primary:hover:not(:disabled) {
  background-color: ${COLOR_PALETTE.primary[600]};
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.btn-primary:active {
  background-color: ${COLOR_PALETTE.primary[700]};
  transform: translateY(0);
}

.btn-secondary {
  background-color: ${COLOR_PALETTE.neutral[100]};
  color: ${COLOR_PALETTE.neutral[900]};
  border-color: ${COLOR_PALETTE.neutral[200]};
}

.btn-secondary:hover:not(:disabled) {
  background-color: ${COLOR_PALETTE.neutral[200]};
  border-color: ${COLOR_PALETTE.neutral[300]};
}

.btn-outline {
  background-color: transparent;
  border-color: ${COLOR_PALETTE.primary[500]};
  color: ${COLOR_PALETTE.primary[500]};
}

.btn-outline:hover:not(:disabled) {
  background-color: ${COLOR_PALETTE.primary[500]};
  color: ${COLOR_PALETTE.neutral[50]};
}

/* Card Component Utilities */
.card {
  background-color: var(--color-background-card);
  border-radius: var(--radius-card);
  border: 1px solid var(--color-border-default);
  transition: all var(--duration-normal) var(--easing-ease-out);
}

.card-sm {
  padding: var(--spacing-4);
}

.card-md {
  padding: var(--spacing-6);
}

.card-lg {
  padding: var(--spacing-8);
}

.card-elevated {
  box-shadow: var(--shadow-lg);
}

.card-elevated:hover {
  box-shadow: var(--shadow-xl);
  transform: translateY(-2px);
}

.card-glass {
  background-color: var(--color-background-glass);
  backdrop-filter: blur(12px);
  border-color: var(--color-border-subtle);
}

/* Input Component Utilities */
.input {
  background-color: var(--color-background-primary);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-input);
  padding: var(--spacing-3);
  color: var(--color-text-primary);
  transition: all var(--duration-fast) var(--easing-ease-out);
  width: 100%;
}

.input:hover {
  border-color: var(--color-border-strong);
}

.input:focus {
  outline: none;
  border-color: var(--color-border-focus);
  box-shadow: var(--shadow-focus);
}

.input::placeholder {
  color: var(--color-text-placeholder);
}

.input-sm {
  padding: var(--spacing-2) var(--spacing-3);
  font-size: 0.875rem;
}

.input-lg {
  padding: var(--spacing-4) var(--spacing-5);
  font-size: 1.125rem;
}

.input-error {
  border-color: ${COLOR_PALETTE.error[500]};
}

.input-error:focus {
  border-color: ${COLOR_PALETTE.error[500]};
  box-shadow: 0 0 0 3px ${COLOR_PALETTE.error[500]}20;
}

/* Modal Component Utilities */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: var(--color-background-overlay);
  z-index: var(--z-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background-color: var(--color-background-card);
  border-radius: var(--radius-modal);
  box-shadow: var(--shadow-modal);
  border: 1px solid var(--color-border-default);
  z-index: var(--z-modal);
  max-height: 90vh;
  overflow-y: auto;
}

/* Badge Component Utilities */
.badge {
  display: inline-flex;
  align-items: center;
  border-radius: var(--radius-full);
  font-weight: 500;
  font-size: 0.75rem;
  line-height: 1rem;
  padding: var(--spacing-1) var(--spacing-2);
}

.badge-primary {
  background-color: ${COLOR_PALETTE.primary[100]};
  color: ${COLOR_PALETTE.primary[800]};
}

.badge-success {
  background-color: ${COLOR_PALETTE.success[100]};
  color: ${COLOR_PALETTE.success[800]};
}

.badge-warning {
  background-color: ${COLOR_PALETTE.warning[100]};
  color: ${COLOR_PALETTE.warning[800]};
}

.badge-error {
  background-color: ${COLOR_PALETTE.error[100]};
  color: ${COLOR_PALETTE.error[800]};
}

/* Accessibility Utilities */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.focus-visible {
  outline: 2px solid ${COLOR_PALETTE.primary[500]};
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .btn,
  .card,
  .input,
  * {
    transition-duration: 0ms !important;
    animation-duration: 0ms !important;
    transform: none !important;
  }
}
`;
  }
};

/**
 * Utility Generator Main Functions
 */
export const utilityGenerator = {
  /**
   * Generate complete CSS file with all utilities
   */
  generateCompleteCSS: (): string => {
    return `
/**
 * Generated Utility Classes
 * Auto-generated from design token system
 */

${typographyUtilities.generateCSS()}

${colorUtilities.generateCSS()}

${spacingUtilities.generateCSS()}

${componentUtilities.generateCSS()}
`;
  },

  /**
   * Generate Tailwind configuration
   */
  generateTailwindConfig: () => {
    return {
      ...typographyUtilities.getTailwindConfig(),
      ...colorUtilities.getTailwindConfig(),
      spacing: SPACING_TOKENS,
      borderRadius: RADIUS_TOKENS,
      boxShadow: SHADOW_TOKENS,
      transitionDuration: ANIMATION_TOKENS.duration,
      transitionTimingFunction: ANIMATION_TOKENS.easing,
      zIndex: Z_INDEX_TOKENS
    };
  },

  /**
   * Generate utility class documentation
   */
  generateDocumentation: (): string => {
    const typographyLevels = Object.keys(TYPOGRAPHY_HIERARCHY);
    const colorCategories = Object.keys(COLOR_PALETTE);
    const spacingTokens = Object.keys(SPACING_TOKENS);

    return `
# Design System Utility Classes

## Typography Utilities
${typographyLevels.map(level => `- \`.text-${level}\`: ${TYPOGRAPHY_HIERARCHY[level as keyof typeof TYPOGRAPHY_HIERARCHY].use}`).join('\n')}

## Color Utilities
${colorCategories.map(category => `- \`.text-${category}-*\`, \`.bg-${category}-*\`, \`.border-${category}-*\`: ${category} color variations`).join('\n')}

## Spacing Utilities
${spacingTokens.slice(0, 10).map(token => `- \`.m-${token}\`, \`.p-${token}\`, \`.gap-${token}\`: ${SPACING_TOKENS[token as keyof typeof SPACING_TOKENS]} spacing`).join('\n')}

## Component Utilities
- \`.btn\`: Base button styles with size and variant modifiers
- \`.card\`: Base card styles with elevation and glass variants
- \`.input\`: Form input styles with size and state modifiers
- \`.badge\`: Status badge styles with semantic color variants

## Responsive Utilities
All typography utilities support responsive prefixes: \`sm:\`, \`md:\`, \`lg:\`, \`xl:\`, \`2xl:\`

## Accessibility
- \`.sr-only\`: Screen reader only content
- \`.focus-visible\`: Focus indicators
- Automatic reduced motion support
`;
  }
};

export default utilityGenerator;
