/**
 * Advanced Animation System for Micro-interactions
 * Sophisticated animations with proper timing functions
 */

/**
 * Animation Timing Functions (Cubic Bezier)
 */
export const TIMING_FUNCTIONS = {
  // Standard easing curves
  linear: 'cubic-bezier(0, 0, 1, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',

  // Custom easing for specific interactions
  subtle: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  bouncy: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',

  // Micro-interaction specific
  button: 'cubic-bezier(0, 0, 0.2, 1)',
  card: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  modal: 'cubic-bezier(0.4, 0, 0.2, 1)',
  dropdown: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  tooltip: 'cubic-bezier(0, 0, 0.2, 1)',
} as const;

/**
 * Animation Durations (in milliseconds)
 */
export const DURATIONS = {
  instant: 0,
  fast: 150,
  normal: 250,
  slow: 400,
  slower: 600,

  // Interaction-specific durations
  hover: 150,
  focus: 100,
  press: 75,
  release: 200,
  tooltip: 200,
  modal: 300,
  page: 500,
} as const;

/**
 * Animation Keyframes
 */
export const KEYFRAMES = {
  // Entrance animations
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 }
  },

  slideUp: {
    from: { transform: 'translateY(10px)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 }
  },

  slideDown: {
    from: { transform: 'translateY(-10px)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 }
  },

  slideLeft: {
    from: { transform: 'translateX(10px)', opacity: 0 },
    to: { transform: 'translateX(0)', opacity: 1 }
  },

  slideRight: {
    from: { transform: 'translateX(-10px)', opacity: 0 },
    to: { transform: 'translateX(0)', opacity: 1 }
  },

  scaleIn: {
    from: { transform: 'scale(0.95)', opacity: 0 },
    to: { transform: 'scale(1)', opacity: 1 }
  },

  // Micro-interactions
  buttonPress: {
    from: { transform: 'scale(1)' },
    to: { transform: 'scale(0.98)' }
  },

  cardHover: {
    from: { transform: 'translateY(0) scale(1)' },
    to: { transform: 'translateY(-2px) scale(1.01)' }
  },

  pulse: {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.7 }
  },

  bounce: {
    '0%, 20%, 53%, 80%, 100%': { transform: 'translateY(0)' },
    '40%, 43%': { transform: 'translateY(-8px)' },
    '70%': { transform: 'translateY(-4px)' },
    '90%': { transform: 'translateY(-2px)' }
  },

  spin: {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' }
  },

  // Loading animations
  shimmer: {
    '0%': { transform: 'translateX(-100%)' },
    '100%': { transform: 'translateX(100%)' }
  },

  breathe: {
    '0%, 100%': { transform: 'scale(1)', opacity: 0.8 },
    '50%': { transform: 'scale(1.05)', opacity: 1 }
  }
} as const;

/**
 * CSS Animation Classes
 */
export const ANIMATION_CLASSES = {
  // Entrance animations
  'animate-fade-in': {
    animation: `fadeIn ${DURATIONS.normal}ms ${TIMING_FUNCTIONS.easeOut} forwards`
  },

  'animate-slide-up': {
    animation: `slideUp ${DURATIONS.normal}ms ${TIMING_FUNCTIONS.easeOut} forwards`
  },

  'animate-slide-down': {
    animation: `slideDown ${DURATIONS.normal}ms ${TIMING_FUNCTIONS.easeOut} forwards`
  },

  'animate-scale-in': {
    animation: `scaleIn ${DURATIONS.fast}ms ${TIMING_FUNCTIONS.easeOut} forwards`
  },

  // Interaction animations
  'animate-button-press': {
    animation: `buttonPress ${DURATIONS.press}ms ${TIMING_FUNCTIONS.button} forwards`
  },

  'animate-card-hover': {
    animation: `cardHover ${DURATIONS.hover}ms ${TIMING_FUNCTIONS.card} forwards`
  },

  // Loading animations
  'animate-pulse-subtle': {
    animation: `pulse ${DURATIONS.slower}ms ${TIMING_FUNCTIONS.easeInOut} infinite`
  },

  'animate-spin-smooth': {
    animation: `spin ${DURATIONS.slower}ms ${TIMING_FUNCTIONS.linear} infinite`
  },

  'animate-shimmer': {
    animation: `shimmer ${DURATIONS.slower}ms ${TIMING_FUNCTIONS.easeInOut} infinite`
  },

  'animate-breathe': {
    animation: `breathe ${DURATIONS.slower * 2}ms ${TIMING_FUNCTIONS.easeInOut} infinite`
  }
} as const;

/**
 * Stagger Animation Utilities
 */
export const createStaggerDelay = (index: number, baseDelay: number = 100): string => {
  return `${index * baseDelay}ms`;
};

export const createStaggerAnimation = (
  animationName: string,
  duration: number,
  easing: string,
  staggerDelay: number
): string => {
  return `${animationName} ${duration}ms ${easing} ${staggerDelay}ms forwards`;
};

/**
 * Interaction Animation Helpers
 */
export const animationHelpers = {
  /**
   * Get hover animation style
   */
  getHoverAnimation: (type: 'subtle' | 'lift' | 'scale' = 'subtle') => {
    const animations = {
      subtle: {
        transition: `all ${DURATIONS.hover}ms ${TIMING_FUNCTIONS.button}`,
        ':hover': {
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }
      },
      lift: {
        transition: `all ${DURATIONS.hover}ms ${TIMING_FUNCTIONS.card}`,
        ':hover': {
          transform: 'translateY(-4px) scale(1.01)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
        }
      },
      scale: {
        transition: `transform ${DURATIONS.hover}ms ${TIMING_FUNCTIONS.elastic}`,
        ':hover': {
          transform: 'scale(1.05)'
        }
      }
    };

    return animations[type];
  },

  /**
   * Get focus animation style
   */
  getFocusAnimation: () => ({
    transition: `all ${DURATIONS.focus}ms ${TIMING_FUNCTIONS.button}`,
    ':focus': {
      transform: 'scale(1.02)',
      outline: 'none',
      boxShadow: '0 0 0 3px rgba(91, 108, 255, 0.3)'
    }
  }),

  /**
   * Get press animation style
   */
  getPressAnimation: () => ({
    transition: `transform ${DURATIONS.press}ms ${TIMING_FUNCTIONS.button}`,
    ':active': {
      transform: 'scale(0.98)'
    }
  }),

  /**
   * Get loading animation style
   */
  getLoadingAnimation: (type: 'pulse' | 'shimmer' | 'breathe' = 'pulse') => {
    const animations = {
      pulse: {
        animation: `pulse ${DURATIONS.slower}ms ${TIMING_FUNCTIONS.easeInOut} infinite`
      },
      shimmer: {
        position: 'relative' as const,
        overflow: 'hidden' as const,
        '::before': {
          content: '""',
          position: 'absolute' as const,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
          animation: `shimmer ${DURATIONS.slower}ms ${TIMING_FUNCTIONS.easeInOut} infinite`
        }
      },
      breathe: {
        animation: `breathe ${DURATIONS.slower * 2}ms ${TIMING_FUNCTIONS.easeInOut} infinite`
      }
    };

    return animations[type];
  },

  /**
   * Get entrance animation with stagger
   */
  getEntranceAnimation: (
    type: 'fade' | 'slide-up' | 'slide-down' | 'scale' = 'fade',
    delay: number = 0
  ) => {
    const animations = {
      fade: `fadeIn ${DURATIONS.normal}ms ${TIMING_FUNCTIONS.easeOut} ${delay}ms forwards`,
      'slide-up': `slideUp ${DURATIONS.normal}ms ${TIMING_FUNCTIONS.easeOut} ${delay}ms forwards`,
      'slide-down': `slideDown ${DURATIONS.normal}ms ${TIMING_FUNCTIONS.easeOut} ${delay}ms forwards`,
      scale: `scaleIn ${DURATIONS.fast}ms ${TIMING_FUNCTIONS.easeOut} ${delay}ms forwards`
    };

    return {
      opacity: type === 'fade' ? 0 : undefined,
      transform: type.includes('slide') || type === 'scale' ? 'translateY(10px)' : undefined,
      animation: animations[type]
    };
  }
};

/**
 * Reduced Motion Support
 */
export const getReducedMotionCSS = () => `
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`;

/**
 * CSS Generator for animations
 */
export const generateAnimationCSS = (): string => {
  let css = '';

  // Add keyframes
  Object.entries(KEYFRAMES).forEach(([name, frames]) => {
    css += `@keyframes ${name} {\n`;
    Object.entries(frames).forEach(([key, value]) => {
      if (typeof value === 'object') {
        css += `  ${key} {\n`;
        Object.entries(value).forEach(([prop, val]) => {
          css += `    ${prop}: ${val};\n`;
        });
        css += `  }\n`;
      }
    });
    css += `}\n\n`;
  });

  // Add utility classes
  Object.entries(ANIMATION_CLASSES).forEach(([className, styles]) => {
    css += `.${className} {\n`;
    Object.entries(styles).forEach(([prop, value]) => {
      css += `  ${prop}: ${value};\n`;
    });
    css += `}\n\n`;
  });

  // Add reduced motion support
  css += getReducedMotionCSS();

  return css;
};

export default {
  TIMING_FUNCTIONS,
  DURATIONS,
  KEYFRAMES,
  ANIMATION_CLASSES,
  createStaggerDelay,
  createStaggerAnimation,
  animationHelpers,
  generateAnimationCSS,
  getReducedMotionCSS
};
