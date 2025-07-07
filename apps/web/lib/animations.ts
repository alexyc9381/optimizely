/**
 * Modern SaaS Micro-Animation System
 * Provides smooth transitions, hover effects, and micro-animations for enhanced user experience
 */

export const ANIMATION_DURATIONS = {
  // Standard timing for micro-animations
  FAST: '150ms',       // Quick feedback (buttons, toggles)
  STANDARD: '200ms',   // Standard transitions (hover states)
  COMFORTABLE: '300ms', // Card animations, modals
  SLOW: '500ms',       // Page transitions, major state changes
  EXTRA_SLOW: '700ms', // Complex animations, data loading
} as const;

export const ANIMATION_EASINGS = {
  // Modern easing functions for smooth, natural motion
  EASE: 'ease',
  EASE_IN: 'ease-in',
  EASE_OUT: 'ease-out',
  EASE_IN_OUT: 'ease-in-out',

  // Custom cubic-bezier curves for premium feel
  SMOOTH: 'cubic-bezier(0.4, 0, 0.2, 1)',      // Material Design standard
  BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Subtle bounce
  SPRING: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Spring effect
  ELEGANT: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',   // Elegant transition
} as const;

/**
 * Pre-built Animation Classes for Common Patterns
 */
export const ANIMATION_CLASSES = {
  // Hover Effects for Cards and Interactive Elements
  HOVER: {
    // Subtle lift effect (2-4px translation)
    LIFT_SUBTLE: 'hover:-translate-y-1 transition-transform duration-200 ease-out',
    LIFT_MEDIUM: 'hover:-translate-y-2 transition-transform duration-300 ease-out',
    LIFT_STRONG: 'hover:-translate-y-3 transition-transform duration-200 ease-out',

    // Shadow enhancement on hover
    SHADOW_GROW: 'hover:shadow-lg transition-shadow duration-300 ease-out',
    SHADOW_GLOW: 'hover:shadow-xl hover:shadow-blue-500/10 transition-shadow duration-300 ease-out',

    // Scale effects (very subtle for modern feel)
    SCALE_SUBTLE: 'hover:scale-[1.02] transition-transform duration-200 ease-out',
    SCALE_MEDIUM: 'hover:scale-105 transition-transform duration-300 ease-out',

    // Opacity effects
    OPACITY_LIFT: 'hover:opacity-90 transition-opacity duration-200 ease-out',
    OPACITY_GLOW: 'hover:opacity-100 opacity-95 transition-opacity duration-300 ease-out',

    // Combined effects for different interaction types
    CARD_HOVER: 'hover:-translate-y-1 hover:shadow-lg transition-all duration-300 ease-out',
    BUTTON_HOVER: 'hover:scale-[1.02] hover:shadow-md transition-all duration-200 ease-out',
    METRIC_HOVER: 'hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 ease-out',
  },

  // Active/Press States
  ACTIVE: {
    // Subtle press effect
    PRESS_SUBTLE: 'active:scale-[0.98] active:translate-y-0 transition-transform duration-100 ease-in',
    PRESS_MEDIUM: 'active:scale-[0.95] transition-transform duration-100 ease-in',

    // Shadow reduction on press
    SHADOW_REDUCE: 'active:shadow-sm transition-shadow duration-100 ease-in',

    // Combined press effects
    BUTTON_PRESS: 'active:scale-[0.98] active:shadow-sm transition-all duration-100 ease-in',
    CARD_PRESS: 'active:scale-[0.99] active:translate-y-0 transition-all duration-150 ease-in',
  },

  // Focus States for Accessibility
  FOCUS: {
    // Accessible focus rings
    RING_BLUE: 'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200',
    RING_SUBTLE: 'focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-1 transition-all duration-200',
    RING_GLOW: 'focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:shadow-lg transition-all duration-200',

    // Outline alternatives
    OUTLINE_BLUE: 'focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200',
    OUTLINE_SUBTLE: 'focus:outline-none focus:ring-1 focus:ring-blue-400 transition-all duration-200',
  },

  // Loading and State Transitions
  LOADING: {
    // Pulse animation for loading states
    PULSE: 'animate-pulse',
    PULSE_SLOW: 'animate-pulse [animation-duration:2s]',

    // Spin animation for spinners
    SPIN: 'animate-spin',
    SPIN_SLOW: 'animate-spin [animation-duration:2s]',

    // Bounce for activity indicators
    BOUNCE: 'animate-bounce',
    BOUNCE_SLOW: 'animate-bounce [animation-duration:1.5s]',

    // Custom shimmer effect
    SHIMMER: 'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]',
  },

  // Entrance Animations
  ENTRANCE: {
    // Fade in effects
    FADE_IN: 'animate-in fade-in duration-300 ease-out',
    FADE_IN_UP: 'animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out',
    FADE_IN_DOWN: 'animate-in fade-in slide-in-from-top-4 duration-300 ease-out',
    FADE_IN_LEFT: 'animate-in fade-in slide-in-from-left-4 duration-300 ease-out',
    FADE_IN_RIGHT: 'animate-in fade-in slide-in-from-right-4 duration-300 ease-out',

    // Scale in effects
    SCALE_IN: 'animate-in zoom-in-50 duration-200 ease-out',
    SCALE_IN_SMOOTH: 'animate-in zoom-in-95 fade-in duration-300 ease-out',
  },

  // Exit Animations
  EXIT: {
    // Fade out effects
    FADE_OUT: 'animate-out fade-out duration-200 ease-in',
    FADE_OUT_UP: 'animate-out fade-out slide-out-to-top-4 duration-200 ease-in',
    FADE_OUT_DOWN: 'animate-out fade-out slide-out-to-bottom-4 duration-200 ease-in',

    // Scale out effects
    SCALE_OUT: 'animate-out zoom-out-50 duration-150 ease-in',
    SCALE_OUT_SMOOTH: 'animate-out zoom-out-95 fade-out duration-200 ease-in',
  },
} as const;

/**
 * Transition Classes for Smooth Property Changes
 */
export const TRANSITION_CLASSES = {
  // Basic transitions
  ALL: 'transition-all duration-300 ease-out',
  ALL_FAST: 'transition-all duration-200 ease-out',
  ALL_SLOW: 'transition-all duration-500 ease-out',

  // Specific property transitions
  TRANSFORM: 'transition-transform duration-300 ease-out',
  OPACITY: 'transition-opacity duration-300 ease-out',
  SHADOW: 'transition-shadow duration-300 ease-out',
  COLORS: 'transition-colors duration-300 ease-out',

  // Combined property transitions
  TRANSFORM_SHADOW: 'transition-[transform,box-shadow] duration-300 ease-out',
  TRANSFORM_OPACITY: 'transition-[transform,opacity] duration-300 ease-out',
  COLORS_SHADOW: 'transition-[colors,box-shadow] duration-300 ease-out',
} as const;

/**
 * Keyframe Animations for Custom Effects
 */
export const KEYFRAME_ANIMATIONS = {
  // Custom shimmer animation for loading states
  shimmer: {
    '0%': { backgroundPosition: '-200% 0' },
    '100%': { backgroundPosition: '200% 0' },
  },

  // Subtle bounce for success states
  subtleBounce: {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-2px)' },
  },

  // Gentle pulse for important elements
  gentlePulse: {
    '0%, 100%': { opacity: '1' },
    '50%': { opacity: '0.8' },
  },

  // Floating animation for hero elements
  float: {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-4px)' },
  },
} as const;

/**
 * Animation Utility Functions
 */
export const animations = {
  /**
   * Get hover animation class based on element type
   */
  getHoverAnimation: (elementType: 'card' | 'button' | 'metric' | 'interactive' = 'card') => {
    switch (elementType) {
      case 'card':
        return ANIMATION_CLASSES.HOVER.CARD_HOVER;
      case 'button':
        return ANIMATION_CLASSES.HOVER.BUTTON_HOVER;
      case 'metric':
        return ANIMATION_CLASSES.HOVER.METRIC_HOVER;
      case 'interactive':
        return ANIMATION_CLASSES.HOVER.LIFT_MEDIUM;
      default:
        return ANIMATION_CLASSES.HOVER.CARD_HOVER;
    }
  },

  /**
   * Get focus animation class for accessibility
   */
  getFocusAnimation: (variant: 'subtle' | 'standard' | 'prominent' = 'standard') => {
    switch (variant) {
      case 'subtle':
        return ANIMATION_CLASSES.FOCUS.RING_SUBTLE;
      case 'standard':
        return ANIMATION_CLASSES.FOCUS.RING_BLUE;
      case 'prominent':
        return ANIMATION_CLASSES.FOCUS.RING_GLOW;
      default:
        return ANIMATION_CLASSES.FOCUS.RING_BLUE;
    }
  },

  /**
   * Get transition class based on properties to animate
   */
  getTransition: (properties: 'all' | 'transform' | 'opacity' | 'shadow' | 'colors' | 'transform-shadow' = 'all') => {
    switch (properties) {
      case 'all':
        return TRANSITION_CLASSES.ALL;
      case 'transform':
        return TRANSITION_CLASSES.TRANSFORM;
      case 'opacity':
        return TRANSITION_CLASSES.OPACITY;
      case 'shadow':
        return TRANSITION_CLASSES.SHADOW;
      case 'colors':
        return TRANSITION_CLASSES.COLORS;
      case 'transform-shadow':
        return TRANSITION_CLASSES.TRANSFORM_SHADOW;
      default:
        return TRANSITION_CLASSES.ALL;
    }
  },

  /**
   * Get entrance animation class
   */
  getEntranceAnimation: (direction: 'fade' | 'up' | 'down' | 'left' | 'right' | 'scale' = 'fade') => {
    switch (direction) {
      case 'fade':
        return ANIMATION_CLASSES.ENTRANCE.FADE_IN;
      case 'up':
        return ANIMATION_CLASSES.ENTRANCE.FADE_IN_UP;
      case 'down':
        return ANIMATION_CLASSES.ENTRANCE.FADE_IN_DOWN;
      case 'left':
        return ANIMATION_CLASSES.ENTRANCE.FADE_IN_LEFT;
      case 'right':
        return ANIMATION_CLASSES.ENTRANCE.FADE_IN_RIGHT;
      case 'scale':
        return ANIMATION_CLASSES.ENTRANCE.SCALE_IN_SMOOTH;
      default:
        return ANIMATION_CLASSES.ENTRANCE.FADE_IN;
    }
  },

  /**
   * Combine multiple animation classes safely
   */
  combine: (...animationClasses: string[]) => {
    return animationClasses.filter(Boolean).join(' ');
  },
};

/**
 * Design System Guidelines for Animations
 */
export const ANIMATION_GUIDELINES = {
  PRINCIPLES: [
    'Animations should enhance usability, not distract from it',
    'Use subtle animations (2-4px translations, 200-300ms durations)',
    'Provide immediate feedback for user interactions',
    'Respect prefers-reduced-motion accessibility setting',
    'Maintain consistent timing across similar elements',
    'Use easing functions for natural, smooth motion',
  ],

  TIMING: {
    MICRO_INTERACTIONS: '150-200ms',
    HOVER_STATES: '200-300ms',
    STATE_CHANGES: '300-500ms',
    PAGE_TRANSITIONS: '500-700ms',
  },

  EASING_USAGE: {
    HOVER_IN: 'ease-out (quick start, slow end)',
    HOVER_OUT: 'ease-in (slow start, quick end)',
    GENERAL: 'ease-in-out (balanced)',
    ENTRANCES: 'cubic-bezier(0.4, 0, 0.2, 1) (smooth)',
  },
} as const;
