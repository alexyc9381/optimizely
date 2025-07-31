/**
 * Advanced Button Component with Interactive Elements
 * Implements sophisticated button system with micro-interactions
 */

import React, { forwardRef, useState } from 'react';
import { useUtilities } from '../../lib/useUtilities';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'outline' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
  href?: string;
  target?: string;
  rel?: string;
  loadingText?: string;
  spinnerPlacement?: 'start' | 'end';
}

/**
 * Loading Spinner Component
 */
const LoadingSpinner: React.FC<{ size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }> = ({ size }) => {
  const sizeMap = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7'
  };

  return (
    <svg
      className={`${sizeMap[size]} animate-spin`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      role="status"
      aria-label="Loading"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

/**
 * Advanced Button Component
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      className = '',
      href,
      target,
      rel,
      loadingText,
      spinnerPlacement = 'start',
      onClick,
      onMouseEnter,
      onMouseLeave,
      onFocus,
      onBlur,
      ...rest
    },
    ref
  ) => {
    const { colors, typography, spacing } = useUtilities();
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [isPressed, setIsPressed] = useState(false);

    const isDisabled = disabled || loading;

    // Base button styles
    const baseStyles = [
      'inline-flex',
      'items-center',
      'justify-center',
      'font-medium',
      'rounded-button',
      'transition-all',
      'duration-fast',
      'ease-out',
      'relative',
      'overflow-hidden',
      'select-none',
      'focus:outline-none',
      'focus-visible:outline-none',
      fullWidth ? 'w-full' : 'w-auto'
    ];

    // Size-based styles
    const sizeStyles = {
      xs: [
        typography.getClass('label-xs'),
        spacing.getClass('px', '2'),
        spacing.getClass('py', '1'),
        'min-h-6'
      ],
      sm: [
        typography.getClass('label-sm'),
        spacing.getClass('px', '3'),
        spacing.getClass('py', '2'),
        'min-h-8'
      ],
      md: [
        typography.getClass('label-md'),
        spacing.getClass('px', '4'),
        spacing.getClass('py', '3'),
        'min-h-10'
      ],
      lg: [
        typography.getClass('label-lg'),
        spacing.getClass('px', '6'),
        spacing.getClass('py', '4'),
        'min-h-12'
      ],
      xl: [
        typography.getClass('body-md'),
        spacing.getClass('px', '8'),
        spacing.getClass('py', '5'),
        'min-h-14'
      ]
    };

    // Variant-based styles
    const variantStyles = {
      primary: {
        base: [
          colors.getClass('bg', 'primary', '500'),
          colors.getClass('text', 'secondary', '50'),
          'border',
          'border-transparent',
          'shadow-button'
        ],
        hover: [
          colors.getClass('bg', 'primary', '600'),
          'shadow-md',
          'transform',
          '-translate-y-0.5'
        ],
        active: [
          colors.getClass('bg', 'primary', '700'),
          'transform',
          'translate-y-0'
        ],
        focus: [
          'ring-2',
          'ring-offset-2',
          colors.getClass('ring', 'primary', '500'),
          'ring-opacity-50'
        ],
        disabled: [
          colors.getClass('bg', 'secondary', '300'),
          colors.getClass('text', 'secondary', '500'),
          'cursor-not-allowed',
          'transform-none',
          'shadow-none'
        ]
      },
      secondary: {
        base: [
          colors.getClass('bg', 'secondary', '100'),
          colors.getClass('text', 'secondary', '900'),
          'border',
          colors.getClass('border', 'secondary', '200'),
          'shadow-button'
        ],
        hover: [
          colors.getClass('bg', 'secondary', '200'),
          colors.getClass('border', 'secondary', '300'),
          'shadow-md',
          'transform',
          '-translate-y-0.5'
        ],
        active: [
          colors.getClass('bg', 'secondary', '300'),
          'transform',
          'translate-y-0'
        ],
        focus: [
          'ring-2',
          'ring-offset-2',
          colors.getClass('ring', 'secondary', '500'),
          'ring-opacity-50'
        ],
        disabled: [
          colors.getClass('bg', 'secondary', '50'),
          colors.getClass('text', 'secondary', '400'),
          'cursor-not-allowed',
          'transform-none',
          'shadow-none'
        ]
      },
      tertiary: {
        base: [
          'bg-transparent',
          colors.getClass('text', 'secondary', '700'),
          'border',
          'border-transparent'
        ],
        hover: [
          colors.getClass('bg', 'secondary', '100'),
          colors.getClass('text', 'secondary', '900')
        ],
        active: [
          colors.getClass('bg', 'secondary', '200')
        ],
        focus: [
          'ring-2',
          'ring-offset-2',
          colors.getClass('ring', 'secondary', '500'),
          'ring-opacity-50'
        ],
        disabled: [
          colors.getClass('text', 'secondary', '400'),
          'cursor-not-allowed'
        ]
      },
      ghost: {
        base: [
          'bg-transparent',
          colors.getClass('text', 'secondary', '600'),
          'border',
          'border-transparent'
        ],
        hover: [
          colors.getClass('bg', 'secondary', '50'),
          colors.getClass('text', 'secondary', '900')
        ],
        active: [
          colors.getClass('bg', 'secondary', '100')
        ],
        focus: [
          'ring-2',
          'ring-offset-2',
          colors.getClass('ring', 'secondary', '500'),
          'ring-opacity-50'
        ],
        disabled: [
          colors.getClass('text', 'secondary', '300'),
          'cursor-not-allowed'
        ]
      },
      outline: {
        base: [
          'bg-transparent',
          colors.getClass('text', 'primary', '600'),
          'border',
          colors.getClass('border', 'primary', '500')
        ],
        hover: [
          colors.getClass('bg', 'primary', '500'),
          colors.getClass('text', 'secondary', '50'),
          'transform',
          '-translate-y-0.5'
        ],
        active: [
          colors.getClass('bg', 'primary', '600'),
          'transform',
          'translate-y-0'
        ],
        focus: [
          'ring-2',
          'ring-offset-2',
          colors.getClass('ring', 'primary', '500'),
          'ring-opacity-50'
        ],
        disabled: [
          colors.getClass('text', 'secondary', '400'),
          colors.getClass('border', 'secondary', '300'),
          'cursor-not-allowed',
          'transform-none'
        ]
      },
      danger: {
        base: [
          colors.getClass('bg', 'error', '500'),
          colors.getClass('text', 'secondary', '50'),
          'border',
          'border-transparent',
          'shadow-button'
        ],
        hover: [
          colors.getClass('bg', 'error', '600'),
          'shadow-md',
          'transform',
          '-translate-y-0.5'
        ],
        active: [
          colors.getClass('bg', 'error', '700'),
          'transform',
          'translate-y-0'
        ],
        focus: [
          'ring-2',
          'ring-offset-2',
          colors.getClass('ring', 'error', '500'),
          'ring-opacity-50'
        ],
        disabled: [
          colors.getClass('bg', 'secondary', '300'),
          colors.getClass('text', 'secondary', '500'),
          'cursor-not-allowed',
          'transform-none',
          'shadow-none'
        ]
      }
    };

    // Build className
    const getButtonClasses = () => {
      const classes = [
        ...baseStyles,
        ...sizeStyles[size],
        ...variantStyles[variant].base
      ];

      if (isDisabled) {
        classes.push(...variantStyles[variant].disabled);
      } else {
        if (isHovered) {
          classes.push(...variantStyles[variant].hover);
        }
        if (isPressed) {
          classes.push(...variantStyles[variant].active);
        }
        if (isFocused) {
          classes.push(...variantStyles[variant].focus);
        }
      }

      return classes.join(' ');
    };

    // Event handlers
    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isDisabled) {
        setIsHovered(true);
      }
      onMouseEnter?.(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
      setIsHovered(false);
      setIsPressed(false);
      onMouseLeave?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLButtonElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLButtonElement>) => {
      setIsFocused(false);
      setIsPressed(false);
      onBlur?.(e);
    };

    const handleMouseDown = () => {
      if (!isDisabled) {
        setIsPressed(true);
      }
    };

    const handleMouseUp = () => {
      setIsPressed(false);
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isDisabled && onClick) {
        onClick(e);
      }
    };

    // Content with loading state
    const getButtonContent = () => {
      if (loading) {
        return (
          <>
            {spinnerPlacement === 'start' && (
              <LoadingSpinner size={size} />
            )}
            {loadingText && (
              <span className={spinnerPlacement === 'start' ? 'ml-2' : 'mr-2'}>
                {loadingText}
              </span>
            )}
            {!loadingText && (
              <span className="opacity-0">{children}</span>
            )}
            {spinnerPlacement === 'end' && (
              <LoadingSpinner size={size} />
            )}
          </>
        );
      }

      return (
        <>
          {leftIcon && (
            <span className="mr-2 flex-shrink-0">
              {leftIcon}
            </span>
          )}
          <span>{children}</span>
          {rightIcon && (
            <span className="ml-2 flex-shrink-0">
              {rightIcon}
            </span>
          )}
        </>
      );
    };

    // If href is provided, render as a link
    if (href) {
      return (
        <a
          href={href}
          target={target}
          rel={rel}
          className={`${getButtonClasses()} ${className}`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          aria-disabled={isDisabled}
          role="button"
        >
          {getButtonContent()}
        </a>
      );
    }

    return (
      <button
        ref={ref}
        className={`${getButtonClasses()} ${className}`}
        disabled={isDisabled}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        aria-disabled={isDisabled}
        {...rest}
      >
        {getButtonContent()}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
