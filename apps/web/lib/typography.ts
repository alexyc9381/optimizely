/**
 * Typography System for Optelo Dashboard
 * Comprehensive typography scale with semantic hierarchy and responsive behavior
 * Based on 1.125 (major second) scale for optimal visual rhythm
 */

/**
 * Font Size Scale (Minor Third - 1.125 ratio)
 * Ensures consistent vertical rhythm and visual hierarchy
 */
export const FONT_SIZES = {
  xs: '0.75rem', // 12px
  sm: '0.875rem', // 14px
  base: '1rem', // 16px (base)
  lg: '1.125rem', // 18px
  xl: '1.25rem', // 20px
  '2xl': '1.5rem', // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
  '5xl': '3rem', // 48px
  '6xl': '3.75rem', // 60px
  '7xl': '4.5rem', // 72px
} as const;

/**
 * Line Height Scale
 * Optimized for readability across different font sizes
 */
export const LINE_HEIGHTS = {
  none: '1',
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2',
  xs: '1rem', // 16px
  sm: '1.25rem', // 20px
  base: '1.5rem', // 24px
  lg: '1.75rem', // 28px
  xl: '1.75rem', // 28px
  '2xl': '2rem', // 32px
  '3xl': '2.25rem', // 36px
  '4xl': '2.5rem', // 40px
  '5xl': '1', // 1
  '6xl': '1', // 1
  '7xl': '1', // 1
} as const;

/**
 * Font Weight Scale
 * Carefully selected weights for optimal hierarchy
 */
export const FONT_WEIGHTS = {
  thin: '100',
  extralight: '200',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const;

/**
 * Letter Spacing Scale
 * Improves readability for different font sizes
 */
export const LETTER_SPACING = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
} as const;

/**
 * Semantic Typography Hierarchy
 * Defines consistent typography patterns for different content types
 */
export const TYPOGRAPHY_HIERARCHY = {
  // Display Text (Hero sections, landing pages)
  'display-2xl': {
    fontSize: FONT_SIZES['7xl'],
    lineHeight: LINE_HEIGHTS['7xl'],
    fontWeight: FONT_WEIGHTS['bold'],
    letterSpacing: LETTER_SPACING['tighter'],
    use: 'Hero headlines, marketing displays',
  },
  'display-xl': {
    fontSize: FONT_SIZES['6xl'],
    lineHeight: LINE_HEIGHTS['6xl'],
    fontWeight: FONT_WEIGHTS['bold'],
    letterSpacing: LETTER_SPACING['tighter'],
    use: 'Page hero titles',
  },
  'display-lg': {
    fontSize: FONT_SIZES['5xl'],
    lineHeight: LINE_HEIGHTS['5xl'],
    fontWeight: FONT_WEIGHTS['bold'],
    letterSpacing: LETTER_SPACING['tight'],
    use: 'Section hero titles',
  },

  // Headings (Content hierarchy)
  'heading-xl': {
    fontSize: FONT_SIZES['4xl'],
    lineHeight: LINE_HEIGHTS['4xl'],
    fontWeight: FONT_WEIGHTS['bold'],
    letterSpacing: LETTER_SPACING['tight'],
    use: 'H1, Main page titles',
  },
  'heading-lg': {
    fontSize: FONT_SIZES['3xl'],
    lineHeight: LINE_HEIGHTS['3xl'],
    fontWeight: FONT_WEIGHTS['semibold'],
    letterSpacing: LETTER_SPACING['tight'],
    use: 'H2, Section titles',
  },
  'heading-md': {
    fontSize: FONT_SIZES['2xl'],
    lineHeight: LINE_HEIGHTS['2xl'],
    fontWeight: FONT_WEIGHTS['semibold'],
    letterSpacing: LETTER_SPACING['normal'],
    use: 'H3, Subsection titles',
  },
  'heading-sm': {
    fontSize: FONT_SIZES['xl'],
    lineHeight: LINE_HEIGHTS['xl'],
    fontWeight: FONT_WEIGHTS['semibold'],
    letterSpacing: LETTER_SPACING['normal'],
    use: 'H4, Card titles',
  },
  'heading-xs': {
    fontSize: FONT_SIZES['lg'],
    lineHeight: LINE_HEIGHTS['lg'],
    fontWeight: FONT_WEIGHTS['semibold'],
    letterSpacing: LETTER_SPACING['normal'],
    use: 'H5, Small section titles',
  },

  // Body Text (Content, descriptions)
  'body-xl': {
    fontSize: FONT_SIZES['xl'],
    lineHeight: LINE_HEIGHTS['xl'],
    fontWeight: FONT_WEIGHTS['normal'],
    letterSpacing: LETTER_SPACING['normal'],
    use: 'Large body text, introductions',
  },
  'body-lg': {
    fontSize: FONT_SIZES['lg'],
    lineHeight: LINE_HEIGHTS['lg'],
    fontWeight: FONT_WEIGHTS['normal'],
    letterSpacing: LETTER_SPACING['normal'],
    use: 'Medium body text',
  },
  'body-md': {
    fontSize: FONT_SIZES['base'],
    lineHeight: LINE_HEIGHTS['base'],
    fontWeight: FONT_WEIGHTS['normal'],
    letterSpacing: LETTER_SPACING['normal'],
    use: 'Default body text, paragraphs',
  },
  'body-sm': {
    fontSize: FONT_SIZES['sm'],
    lineHeight: LINE_HEIGHTS['sm'],
    fontWeight: FONT_WEIGHTS['normal'],
    letterSpacing: LETTER_SPACING['normal'],
    use: 'Small body text, descriptions',
  },
  'body-xs': {
    fontSize: FONT_SIZES['xs'],
    lineHeight: LINE_HEIGHTS['xs'],
    fontWeight: FONT_WEIGHTS['normal'],
    letterSpacing: LETTER_SPACING['wide'],
    use: 'Caption text, metadata',
  },

  // Labels (Form fields, UI elements)
  'label-lg': {
    fontSize: FONT_SIZES['base'],
    lineHeight: LINE_HEIGHTS['base'],
    fontWeight: FONT_WEIGHTS['medium'],
    letterSpacing: LETTER_SPACING['normal'],
    use: 'Large form labels',
  },
  'label-md': {
    fontSize: FONT_SIZES['sm'],
    lineHeight: LINE_HEIGHTS['sm'],
    fontWeight: FONT_WEIGHTS['medium'],
    letterSpacing: LETTER_SPACING['normal'],
    use: 'Default form labels, buttons',
  },
  'label-sm': {
    fontSize: FONT_SIZES['xs'],
    lineHeight: LINE_HEIGHTS['xs'],
    fontWeight: FONT_WEIGHTS['medium'],
    letterSpacing: LETTER_SPACING['wide'],
    use: 'Small labels, tags',
  },
} as const;

/**
 * Responsive Typography Utilities
 * Provides responsive behavior for different screen sizes
 */
export const RESPONSIVE_TYPOGRAPHY = {
  'display-responsive': {
    mobile: TYPOGRAPHY_HIERARCHY['heading-xl'],
    tablet: TYPOGRAPHY_HIERARCHY['display-lg'],
    desktop: TYPOGRAPHY_HIERARCHY['display-xl'],
  },
  'heading-responsive': {
    mobile: TYPOGRAPHY_HIERARCHY['heading-md'],
    tablet: TYPOGRAPHY_HIERARCHY['heading-lg'],
    desktop: TYPOGRAPHY_HIERARCHY['heading-xl'],
  },
  'body-responsive': {
    mobile: TYPOGRAPHY_HIERARCHY['body-sm'],
    tablet: TYPOGRAPHY_HIERARCHY['body-md'],
    desktop: TYPOGRAPHY_HIERARCHY['body-lg'],
  },
} as const;

/**
 * Typography Utility Functions
 */
export const typographyUtils = {
  /**
   * Get typography styles for a specific hierarchy level
   */
  getTypographyStyle: (level: keyof typeof TYPOGRAPHY_HIERARCHY) => {
    return TYPOGRAPHY_HIERARCHY[level];
  },

  /**
   * Generate CSS custom properties for typography
   */
  generateTypographyCSS: () => {
    const css = `:root {
  /* Font Sizes */
${Object.entries(FONT_SIZES)
  .map(([key, value]) => `  --font-size-${key}: ${value};`)
  .join('\n')}

  /* Line Heights */
${Object.entries(LINE_HEIGHTS)
  .map(([key, value]) => `  --line-height-${key}: ${value};`)
  .join('\n')}

  /* Font Weights */
${Object.entries(FONT_WEIGHTS)
  .map(([key, value]) => `  --font-weight-${key}: ${value};`)
  .join('\n')}

  /* Letter Spacing */
${Object.entries(LETTER_SPACING)
  .map(([key, value]) => `  --letter-spacing-${key}: ${value};`)
  .join('\n')}
}

/* Typography Hierarchy Classes */
${Object.entries(TYPOGRAPHY_HIERARCHY)
  .map(
    ([key, styles]) => `
.text-${key} {
  font-size: ${styles.fontSize};
  line-height: ${styles.lineHeight};
  font-weight: ${styles.fontWeight};
  letter-spacing: ${styles.letterSpacing};
}`
  )
  .join('')}

/* Responsive Typography */
@media (max-width: 768px) {
  .text-display-responsive {
    font-size: ${RESPONSIVE_TYPOGRAPHY['display-responsive'].mobile.fontSize};
    line-height: ${RESPONSIVE_TYPOGRAPHY['display-responsive'].mobile.lineHeight};
    font-weight: ${RESPONSIVE_TYPOGRAPHY['display-responsive'].mobile.fontWeight};
  }
  
  .text-heading-responsive {
    font-size: ${RESPONSIVE_TYPOGRAPHY['heading-responsive'].mobile.fontSize};
    line-height: ${RESPONSIVE_TYPOGRAPHY['heading-responsive'].mobile.lineHeight};
    font-weight: ${RESPONSIVE_TYPOGRAPHY['heading-responsive'].mobile.fontWeight};
  }
  
  .text-body-responsive {
    font-size: ${RESPONSIVE_TYPOGRAPHY['body-responsive'].mobile.fontSize};
    line-height: ${RESPONSIVE_TYPOGRAPHY['body-responsive'].mobile.lineHeight};
    font-weight: ${RESPONSIVE_TYPOGRAPHY['body-responsive'].mobile.fontWeight};
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .text-display-responsive {
    font-size: ${RESPONSIVE_TYPOGRAPHY['display-responsive'].tablet.fontSize};
    line-height: ${RESPONSIVE_TYPOGRAPHY['display-responsive'].tablet.lineHeight};
    font-weight: ${RESPONSIVE_TYPOGRAPHY['display-responsive'].tablet.fontWeight};
  }
  
  .text-heading-responsive {
    font-size: ${RESPONSIVE_TYPOGRAPHY['heading-responsive'].tablet.fontSize};
    line-height: ${RESPONSIVE_TYPOGRAPHY['heading-responsive'].tablet.lineHeight};
    font-weight: ${RESPONSIVE_TYPOGRAPHY['heading-responsive'].tablet.fontWeight};
  }
  
  .text-body-responsive {
    font-size: ${RESPONSIVE_TYPOGRAPHY['body-responsive'].tablet.fontSize};
    line-height: ${RESPONSIVE_TYPOGRAPHY['body-responsive'].tablet.lineHeight};
    font-weight: ${RESPONSIVE_TYPOGRAPHY['body-responsive'].tablet.fontWeight};
  }
}

@media (min-width: 1025px) {
  .text-display-responsive {
    font-size: ${RESPONSIVE_TYPOGRAPHY['display-responsive'].desktop.fontSize};
    line-height: ${RESPONSIVE_TYPOGRAPHY['display-responsive'].desktop.lineHeight};
    font-weight: ${RESPONSIVE_TYPOGRAPHY['display-responsive'].desktop.fontWeight};
  }
  
  .text-heading-responsive {
    font-size: ${RESPONSIVE_TYPOGRAPHY['heading-responsive'].desktop.fontSize};
    line-height: ${RESPONSIVE_TYPOGRAPHY['heading-responsive'].desktop.lineHeight};
    font-weight: ${RESPONSIVE_TYPOGRAPHY['heading-responsive'].desktop.fontWeight};
  }
  
  .text-body-responsive {
    font-size: ${RESPONSIVE_TYPOGRAPHY['body-responsive'].desktop.fontSize};
    line-height: ${RESPONSIVE_TYPOGRAPHY['body-responsive'].desktop.lineHeight};
    font-weight: ${RESPONSIVE_TYPOGRAPHY['body-responsive'].desktop.fontWeight};
  }
}`;
    return css;
  },

  /**
   * Generate Tailwind configuration for typography
   */
  generateTailwindConfig: () => {
    return {
      fontSize: FONT_SIZES,
      lineHeight: LINE_HEIGHTS,
      fontWeight: FONT_WEIGHTS,
      letterSpacing: LETTER_SPACING,
    };
  },
};

export default {
  FONT_SIZES,
  LINE_HEIGHTS,
  FONT_WEIGHTS,
  LETTER_SPACING,
  TYPOGRAPHY_HIERARCHY,
  RESPONSIVE_TYPOGRAPHY,
  typographyUtils,
};
