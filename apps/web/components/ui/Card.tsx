import React from 'react';
import { ANIMATION_CLASSES, animations } from '../../lib/animations';
import { cn } from '../../lib/utils';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'basic' | 'elevated' | 'interactive' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
  'data-testid'?: string;
  style?: React.CSSProperties;
  // New animation props
  hoverAnimation?: 'card' | 'button' | 'metric' | 'interactive' | 'none';
  focusVariant?: 'subtle' | 'standard' | 'prominent';
  enterAnimation?: 'fade' | 'up' | 'down' | 'left' | 'right' | 'scale' | 'none';
}

/**
 * Modern SaaS Card Component with Glassmorphism Effects and Micro-Animations
 *
 * Features:
 * - Glassmorphism effects with backdrop-blur
 * - Rounded corners (8-12px)
 * - Subtle shadows and elevation
 * - Multiple variants for different use cases
 * - Micro-animations for interactions
 * - Accessibility support with focus management
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      className,
      variant = 'basic',
      size = 'md',
      hover = false,
      onClick,
      style,
      hoverAnimation = 'card',
      focusVariant = 'standard',
      enterAnimation = 'fade',
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const isInteractive = Boolean(onClick) || hover;

    // Base styles for all cards
    const baseStyles = cn(
      // Foundation
      'relative rounded-lg border transition-all duration-300 ease-out',

      // Accessibility
      'focus:outline-none',

      // Enter animation (if not disabled)
      enterAnimation !== 'none' &&
        animations.getEntranceAnimation(enterAnimation),

      // Interactive states
      isInteractive && [
        'cursor-pointer',
        hoverAnimation !== 'none' &&
          animations.getHoverAnimation(hoverAnimation),
        animations.getFocusAnimation(focusVariant),
        ANIMATION_CLASSES.ACTIVE.CARD_PRESS,
      ]
    );

    // Variant-specific styles
    const variantStyles = {
      basic: cn(
        'bg-white border-gray-200 shadow-sm',
        isInteractive && 'hover:border-gray-300'
      ),
      elevated: cn(
        'bg-white border-gray-200 shadow-md',
        isInteractive && 'hover:shadow-lg hover:border-gray-300'
      ),
      interactive: cn(
        'bg-white border-blue-200 shadow-sm ring-1 ring-blue-100',
        isInteractive && [
          'hover:border-blue-300 hover:ring-blue-200',
          'hover:shadow-md hover:shadow-blue-500/10',
        ]
      ),
      glass: cn(
        'bg-white/60 border-white/20 backdrop-blur-sm shadow-lg',
        'before:absolute before:inset-0 before:rounded-lg',
        'before:bg-gradient-to-br before:from-white/10 before:to-white/5',
        'before:pointer-events-none',
        isInteractive && [
          'hover:bg-white/70 hover:border-white/30',
          'hover:backdrop-blur-md hover:shadow-xl',
        ]
      ),
    };

    // Size-specific padding
    const sizeStyles = {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        onClick={onClick}
        data-testid={testId}
        style={style}
        tabIndex={isInteractive ? 0 : undefined}
        role={onClick ? 'button' : undefined}
        onKeyDown={
          onClick
            ? e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
        {...props}
        data-oid='tz6mo59'
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

/**
 * Card Header Component with Typography and Spacing
 */
export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    enterAnimation?:
      | 'fade'
      | 'up'
      | 'down'
      | 'left'
      | 'right'
      | 'scale'
      | 'none';
  }
>(({ className, enterAnimation = 'up', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col space-y-1.5 pb-6',
      enterAnimation !== 'none' &&
        animations.getEntranceAnimation(enterAnimation),
      className
    )}
    {...props}
    data-oid='rlrq4wx'
  />
));
CardHeader.displayName = 'CardHeader';

/**
 * Card Title Component with Proper Typography
 */
export const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    hoverEffect?: boolean;
  }
>(({ className, hoverEffect = false, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight text-gray-900',
      hoverEffect && ANIMATION_CLASSES.HOVER.OPACITY_LIFT,
      className
    )}
    {...props}
    data-oid='m0ww.t5'
  />
));
CardTitle.displayName = 'CardTitle';

/**
 * Card Description Component
 */
export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & {
    fadeIn?: boolean;
  }
>(({ className, fadeIn = false, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      'text-sm text-gray-600 leading-relaxed',
      fadeIn && ANIMATION_CLASSES.ENTRANCE.FADE_IN,
      className
    )}
    {...props}
    data-oid='4uw6055'
  />
));
CardDescription.displayName = 'CardDescription';

/**
 * Card Content Component with Proper Spacing
 */
export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    enterAnimation?:
      | 'fade'
      | 'up'
      | 'down'
      | 'left'
      | 'right'
      | 'scale'
      | 'none';
    staggerDelay?: number;
  }
>(({ className, enterAnimation = 'fade', staggerDelay = 0, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'pt-0',
      enterAnimation !== 'none' &&
        animations.getEntranceAnimation(enterAnimation),
      className
    )}
    style={{
      animationDelay: staggerDelay ? `${staggerDelay}ms` : undefined,
    }}
    {...props}
    data-oid='v:_af8-'
  />
));
CardContent.displayName = 'CardContent';

/**
 * Card Footer Component with Action Areas
 */
export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    enterAnimation?:
      | 'fade'
      | 'up'
      | 'down'
      | 'left'
      | 'right'
      | 'scale'
      | 'none';
  }
>(({ className, enterAnimation = 'up', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center pt-6',
      enterAnimation !== 'none' &&
        animations.getEntranceAnimation(enterAnimation),
      className
    )}
    {...props}
    data-oid='cc6ain-'
  />
));
CardFooter.displayName = 'CardFooter';

export default Card;
