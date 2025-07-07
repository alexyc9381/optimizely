import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'basic' | 'elevated' | 'interactive' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
  'data-testid'?: string;
}

/**
 * Modern SaaS Card Component with Glassmorphism Effects
 *
 * Features:
 * - Glassmorphism effects with backdrop-blur
 * - Rounded corners (8-12px)
 * - Subtle shadows and elevation
 * - Multiple variants for different use cases
 * - Micro-animations for interactions
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({
    children,
    className,
    variant = 'basic',
    size = 'md',
    hover = false,
    onClick,
    'data-testid': dataTestId,
    ...props
  }, ref) => {

    const isInteractive = onClick || variant === 'interactive';

    // Base card styles with glassmorphism foundation
    const baseStyles = cn(
      // Base structure and layout
      'relative overflow-hidden',
      'rounded-xl', // 12px rounded corners for modern look

      // Glassmorphism foundation
      'bg-white/80 backdrop-blur-sm',
      'border border-white/20',

      // Subtle elevation system
      'shadow-sm',

      // Smooth transitions for all interactions
      'transition-all duration-300 ease-out',

      // Size-based padding (breathing room)
      {
        'p-4': size === 'sm',     // 16px padding
        'p-6': size === 'md',     // 24px padding
        'p-8': size === 'lg',     // 32px padding
      },

      className
    );

    // Variant-specific styles
    const variantStyles = cn({
      // Basic card - minimal elevation
      'shadow-sm border-gray-200/50': variant === 'basic',

      // Elevated card - enhanced shadow and glassmorphism
      'shadow-lg shadow-gray-200/20 bg-white/90 backdrop-blur-md border-white/30':
        variant === 'elevated',

      // Interactive card - hover effects and cursor
      'cursor-pointer hover:shadow-xl hover:shadow-gray-200/25 hover:-translate-y-1 hover:bg-white/95 active:scale-[0.98]':
        variant === 'interactive' || isInteractive,

      // Glass card - maximum glassmorphism effect
      'bg-white/60 backdrop-blur-lg border-white/40 shadow-xl shadow-gray-200/30':
        variant === 'glass',
    });

    // Hover enhancement styles (when hover prop is true)
    const hoverStyles = cn({
      'hover:shadow-lg hover:shadow-gray-200/20 hover:-translate-y-0.5 hover:bg-white/90':
        hover && !isInteractive,
    });

    // Combine all styles
    const cardClasses = cn(baseStyles, variantStyles, hoverStyles);

    return (
      <div
        ref={ref}
        className={cardClasses}
        onClick={onClick}
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        onKeyDown={isInteractive ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
          }
        } : undefined}
        data-testid={dataTestId || 'card'}
        {...props}
      >
        {/* Subtle inner glow for glassmorphism effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none rounded-xl" />

        {/* Content container */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    );
  }
);

Card.displayName = 'Card';

// Additional card-related components for composition
export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-2 pb-4 mb-4 border-b border-gray-100/50', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight text-gray-900', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-600 leading-relaxed', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex-1', className)}
    {...props}
  />
));
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-4 mt-4 border-t border-gray-100/50', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export default Card;
