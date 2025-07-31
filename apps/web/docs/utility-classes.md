# Design System Utility Classes

This document provides a comprehensive guide to all available utility classes in the Optelo design system.

## Typography Utilities

### Hierarchy Classes
Our typography system uses semantic naming based on content hierarchy:

#### Display Text (Hero sections, landing pages)
- `.text-display-2xl`: Largest display text (4.5rem, bold, tight spacing)
- `.text-display-xl`: Large display text (3.75rem, bold, tight spacing)
- `.text-display-lg`: Medium display text (3rem, bold)
- `.text-display-md`: Small display text (2.25rem, bold)
- `.text-display-sm`: Smallest display text (1.875rem, semibold)

#### Headings (Section titles, component headers)
- `.text-heading-xl`: Large headings (1.5rem, semibold)
- `.text-heading-lg`: Medium-large headings (1.25rem, semibold)
- `.text-heading-md`: Medium headings (1.125rem, semibold)
- `.text-heading-sm`: Small headings (1rem, semibold)

#### Body Text (Content, descriptions)
- `.text-body-xl`: Large body text (1.25rem, normal weight)
- `.text-body-lg`: Medium-large body text (1.125rem, normal weight)
- `.text-body-md`: Medium body text (1rem, normal weight) - Default
- `.text-body-sm`: Small body text (0.875rem, normal weight)
- `.text-body-xs`: Extra small body text (0.75rem, normal weight)

#### Labels (Form labels, buttons, small UI text)
- `.text-label-lg`: Large labels (1rem, medium weight)
- `.text-label-md`: Medium labels (0.875rem, medium weight)
- `.text-label-sm`: Small labels (0.75rem, medium weight, wide spacing)
- `.text-label-xs`: Extra small labels (0.625rem, medium weight, wider spacing)

### Font Weight Utilities
- `.font-thin`: 100 weight
- `.font-extralight`: 200 weight
- `.font-light`: 300 weight
- `.font-normal`: 400 weight
- `.font-medium`: 500 weight
- `.font-semibold`: 600 weight
- `.font-bold`: 700 weight
- `.font-extrabold`: 800 weight
- `.font-black`: 900 weight

### Letter Spacing Utilities
- `.tracking-tighter`: -0.05em
- `.tracking-tight`: -0.025em
- `.tracking-normal`: 0em
- `.tracking-wide`: 0.025em
- `.tracking-wider`: 0.05em
- `.tracking-widest`: 0.1em

### Line Height Utilities
- `.leading-none`: 1
- `.leading-tight`: 1.25
- `.leading-snug`: 1.375
- `.leading-normal`: 1.5
- `.leading-relaxed`: 1.625
- `.leading-loose`: 2

### Responsive Typography
All typography utilities support responsive prefixes:
- `sm:text-*`: 640px and up
- `md:text-*`: 768px and up
- `lg:text-*`: 1024px and up
- `xl:text-*`: 1280px and up
- `2xl:text-*`: 1536px and up

**Example:** `text-body-sm md:text-body-md lg:text-body-lg`

## Color Utilities

### Primary Colors
Brand blue color scale (50-950):
- Text: `.text-primary-50` through `.text-primary-950`
- Background: `.bg-primary-50` through `.bg-primary-950`
- Border: `.border-primary-50` through `.border-primary-950`

### Secondary Colors
Neutral gray color scale (50-950):
- Text: `.text-secondary-50` through `.text-secondary-950`
- Background: `.bg-secondary-50` through `.bg-secondary-950`
- Border: `.border-secondary-50` through `.border-secondary-950`

### Semantic Colors

#### Success (Green)
- `.text-success-*`: Success text colors
- `.bg-success-*`: Success background colors
- `.border-success-*`: Success border colors

#### Warning (Amber)
- `.text-warning-*`: Warning text colors
- `.bg-warning-*`: Warning background colors
- `.border-warning-*`: Warning border colors

#### Error (Red)
- `.text-error-*`: Error text colors
- `.bg-error-*`: Error background colors
- `.border-error-*`: Error border colors

#### Info (Blue)
- `.text-info-*`: Info text colors
- `.bg-info-*`: Info background colors
- `.border-info-*`: Info border colors

### Gradient Utilities

#### Background Gradients
- `.bg-gradient-primary`: Primary blue gradient
- `.bg-gradient-secondary`: Secondary gray gradient
- `.bg-gradient-success`: Success green gradient
- `.bg-gradient-warning`: Warning amber gradient
- `.bg-gradient-error`: Error red gradient

#### Text Gradients
- `.text-gradient-primary`: Primary gradient text effect
- `.text-gradient-secondary`: Secondary gradient text effect

## Spacing Utilities

### Margin Utilities
- `.m-{size}`: All sides margin
- `.mx-{size}`: Horizontal margin
- `.my-{size}`: Vertical margin
- `.mt-{size}`: Top margin
- `.mr-{size}`: Right margin
- `.mb-{size}`: Bottom margin
- `.ml-{size}`: Left margin

### Padding Utilities
- `.p-{size}`: All sides padding
- `.px-{size}`: Horizontal padding
- `.py-{size}`: Vertical padding
- `.pt-{size}`: Top padding
- `.pr-{size}`: Right padding
- `.pb-{size}`: Bottom padding
- `.pl-{size}`: Left padding

### Gap Utilities
- `.gap-{size}`: Gap between flex/grid items
- `.gap-x-{size}`: Horizontal gap
- `.gap-y-{size}`: Vertical gap

### Spacing Scale
- `0`: 0px
- `1`: 4px
- `2`: 8px
- `3`: 12px
- `4`: 16px
- `6`: 24px
- `8`: 32px
- Semantic sizes: `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`

## Component Utilities

### Button Classes

#### Base Button
```css
.btn {
  /* Base button styles */
}
```

#### Button Sizes
- `.btn-sm`: Small button (padding: 8px 12px)
- `.btn-md`: Medium button (padding: 12px 16px)
- `.btn-lg`: Large button (padding: 16px 24px)

#### Button Variants
- `.btn-primary`: Primary blue button
- `.btn-secondary`: Secondary gray button
- `.btn-outline`: Outlined button

#### Usage Example
```html
<button class="btn btn-primary btn-md">
  Primary Button
</button>
```

### Card Classes

#### Base Card
```css
.card {
  /* Base card styles */
}
```

#### Card Sizes
- `.card-sm`: Small card (padding: 16px)
- `.card-md`: Medium card (padding: 24px)
- `.card-lg`: Large card (padding: 32px)

#### Card Variants
- `.card-elevated`: Card with shadow elevation
- `.card-glass`: Glass morphism effect

#### Usage Example
```html
<div class="card card-elevated card-md">
  Card content
</div>
```

### Input Classes

#### Base Input
```css
.input {
  /* Base input styles */
}
```

#### Input Sizes
- `.input-sm`: Small input
- `.input-lg`: Large input

#### Input States
- `.input-error`: Error state styling

#### Usage Example
```html
<input class="input input-lg" placeholder="Enter text" />
```

### Badge Classes

#### Base Badge
```css
.badge {
  /* Base badge styles */
}
```

#### Badge Variants
- `.badge-primary`: Primary blue badge
- `.badge-success`: Success green badge
- `.badge-warning`: Warning amber badge
- `.badge-error`: Error red badge

#### Usage Example
```html
<span class="badge badge-success">Active</span>
```

### Modal Classes

#### Modal Structure
```css
.modal-overlay {
  /* Overlay background */
}

.modal-content {
  /* Modal content container */
}
```

#### Usage Example
```html
<div class="modal-overlay">
  <div class="modal-content">
    Modal content
  </div>
</div>
```

## Accessibility Utilities

### Screen Reader
- `.sr-only`: Hide content visually but keep it available to screen readers

### Focus Management
- `.focus-visible`: Custom focus indicator styling

### Reduced Motion
All animations automatically respect `prefers-reduced-motion: reduce` and disable transitions/transforms when needed.

## Best Practices

### Typography Hierarchy
1. Use semantic classes (`.text-heading-lg`) instead of size classes (`.text-xl`)
2. Maintain consistent hierarchy: display → heading → body → label
3. Use responsive typography for better mobile experience

### Color Usage
1. Prefer semantic colors (`.text-success-600`) for status indicators
2. Use primary colors for brand elements
3. Use neutral colors for general UI elements
4. Test color contrast for accessibility compliance

### Spacing Consistency
1. Use the spacing scale consistently across components
2. Prefer semantic spacing tokens (`.p-md`) when possible
3. Use responsive spacing for different screen sizes

### Component Composition
1. Combine base classes with modifiers: `.btn .btn-primary .btn-lg`
2. Use utility classes for fine-tuning: `.btn .btn-primary .btn-lg .mt-4`
3. Keep component classes semantic and reusable

## Performance Notes

- All utility classes are tree-shakeable when using with Tailwind CSS
- CSS custom properties enable efficient theme switching
- Classes are optimized for minimal specificity conflicts
- Utilities are designed to work with existing Tailwind classes

## Migration Guide

If migrating from existing classes:
- Replace custom spacing with spacing tokens
- Update color classes to use the new semantic system
- Replace custom typography with hierarchy classes
- Update component classes to use the new variants