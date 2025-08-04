/**
 * Modern SaaS Breathing Room Standards
 * Defines consistent spacing system for card design system
 */

export const BREATHING_ROOM = {
  // Card Group Spacing (minimum 32px between card groups)
  CARD_GROUP: {
    xs: '24px',    // 6 * 4px - tight spacing for mobile
    sm: '32px',    // 8 * 4px - minimum standard
    md: '40px',    // 10 * 4px - comfortable desktop
    lg: '48px',    // 12 * 4px - generous spacing
    xl: '64px',    // 16 * 4px - maximum spacing
  },

  // Internal Card Padding (24-32px generous internal padding)
  CARD_INTERNAL: {
    sm: '16px',    // 4 * 4px - compact cards
    md: '24px',    // 6 * 4px - standard cards
    lg: '32px',    // 8 * 4px - generous cards
    xl: '40px',    // 10 * 4px - hero cards
  },

  // Section Spacing (between different dashboard sections)
  SECTION: {
    xs: '16px',    // tight sections
    sm: '24px',    // compact sections
    md: '32px',    // standard sections
    lg: '48px',    // generous sections
    xl: '64px',    // maximum section spacing
  },

  // Element Spacing (within cards and components)
  ELEMENT: {
    xs: '8px',     // minimal spacing
    sm: '12px',    // compact spacing
    md: '16px',    // standard spacing
    lg: '24px',    // comfortable spacing
    xl: '32px',    // generous spacing
  },
} as const;

/**
 * Tailwind CSS Class Constants for Breathing Room Standards
 */
export const SPACING_CLASSES = {
  // Card Group Spacing Classes
  CARD_GROUP: {
    xs: 'gap-6 space-y-6',       // 24px
    sm: 'gap-8 space-y-8',       // 32px - minimum standard
    md: 'gap-10 space-y-10',     // 40px
    lg: 'gap-12 space-y-12',     // 48px
    xl: 'gap-16 space-y-16',     // 64px
  },

  // Grid Spacing Classes
  GRID: {
    xs: 'gap-6',                 // 24px
    sm: 'gap-8',                 // 32px - minimum standard
    md: 'gap-10',                // 40px
    lg: 'gap-12',                // 48px
    xl: 'gap-16',                // 64px
  },

  // Internal Card Padding Classes (already implemented in Card.tsx)
  CARD_INTERNAL: {
    sm: 'p-4',                   // 16px
    md: 'p-6',                   // 24px - standard
    lg: 'p-8',                   // 32px - generous
    xl: 'p-10',                  // 40px
  },

  // Section Margin Classes
  SECTION: {
    xs: 'mb-4',                  // 16px
    sm: 'mb-6',                  // 24px
    md: 'mb-8',                  // 32px - standard
    lg: 'mb-12',                 // 48px
    xl: 'mb-16',                 // 64px
  },

  // Element Spacing Classes
  ELEMENT: {
    xs: 'space-y-2 gap-2',       // 8px
    sm: 'space-y-3 gap-3',       // 12px
    md: 'space-y-4 gap-4',       // 16px - standard
    lg: 'space-y-6 gap-6',       // 24px
    xl: 'space-y-8 gap-8',       // 32px
  },
} as const;

/**
 * Responsive Spacing Classes for Different Screen Sizes
 */
export const RESPONSIVE_SPACING = {
  // Mobile-first responsive card group spacing
  CARD_GROUP_RESPONSIVE: 'gap-6 space-y-6 md:gap-8 md:space-y-8 lg:gap-10 lg:space-y-10',

  // Mobile-first responsive grid spacing
  GRID_RESPONSIVE: 'gap-6 md:gap-8 lg:gap-10',

  // Mobile-first responsive section spacing
  SECTION_RESPONSIVE: 'mb-6 md:mb-8 lg:mb-12',

  // Mobile-first responsive element spacing
  ELEMENT_RESPONSIVE: 'space-y-3 gap-3 md:space-y-4 md:gap-4 lg:space-y-6 lg:gap-6',
} as const;

/**
 * Layout Container Classes with Breathing Room Standards
 */
export const LAYOUT_CLASSES = {
  // Main dashboard container with proper breathing room
  DASHBOARD_CONTAINER: 'max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8 lg:px-8 lg:py-12',

  // Card container with standard spacing
  CARD_CONTAINER: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 lg:gap-10',

  // Section container with breathing room
  SECTION_CONTAINER: 'mb-8 md:mb-10 lg:mb-12',

  // Hero section with standard spacing
  HERO_CONTAINER: 'text-center py-6 mb-6 md:py-8 md:mb-8',
} as const;

/**
 * Utility Functions for Dynamic Spacing
 */
export const spacing = {
  /**
   * Get card group spacing class based on density preference
   */
  getCardGroupSpacing: (density: 'compact' | 'comfortable' | 'spacious' = 'comfortable') => {
    switch (density) {
      case 'compact':
        return SPACING_CLASSES.CARD_GROUP.xs;
      case 'comfortable':
        return SPACING_CLASSES.CARD_GROUP.sm; // 32px minimum standard
      case 'spacious':
        return SPACING_CLASSES.CARD_GROUP.lg;
      default:
        return SPACING_CLASSES.CARD_GROUP.sm;
    }
  },

  /**
   * Get responsive spacing class for card groups
   */
  getResponsiveCardSpacing: () => RESPONSIVE_SPACING.CARD_GROUP_RESPONSIVE,

  /**
   * Get grid spacing class based on content type
   */
  getGridSpacing: (contentType: 'metrics' | 'charts' | 'forms' | 'general' = 'general') => {
    switch (contentType) {
      case 'metrics':
        return SPACING_CLASSES.GRID.sm; // Metrics need standard spacing
      case 'charts':
        return SPACING_CLASSES.GRID.md; // Charts need more breathing room
      case 'forms':
        return SPACING_CLASSES.GRID.lg; // Forms need generous spacing
      case 'general':
      default:
        return SPACING_CLASSES.GRID.sm; // Default to standard
    }
  },

  /**
   * Get section spacing based on importance
   */
  getSectionSpacing: (importance: 'low' | 'medium' | 'high' = 'medium') => {
    switch (importance) {
      case 'low':
        return SPACING_CLASSES.SECTION.sm;
      case 'medium':
        return SPACING_CLASSES.SECTION.md; // 32px standard
      case 'high':
        return SPACING_CLASSES.SECTION.lg;
      default:
        return SPACING_CLASSES.SECTION.md;
    }
  },
};

/**
 * Design System Guidelines (for documentation)
 */
export const SPACING_GUIDELINES = {
  MINIMUM_CARD_GROUP_SPACING: '32px',
  RECOMMENDED_CARD_INTERNAL_PADDING: '24px',
  MAXIMUM_RECOMMENDED_SPACING: '64px',
  MOBILE_MINIMUM_SPACING: '16px',
  DESKTOP_COMFORTABLE_SPACING: '40px',

  RULES: [
    'Always maintain minimum 32px between card groups',
    'Use 24-32px internal padding for cards',
    'Responsive spacing: tighter on mobile, more generous on desktop',
    'Consistent spacing creates visual rhythm and hierarchy',
    'Breathing room improves readability and reduces cognitive load',
  ],
} as const;
