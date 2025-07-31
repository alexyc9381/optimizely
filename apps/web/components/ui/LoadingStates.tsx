/**
 * Advanced Loading States System
 * Sophisticated skeleton screens and progress indicators
 */

import React from 'react';
import { useUtilities } from '../../lib/useUtilities';

/**
 * Skeleton Component for loading states
 */
interface SkeletonProps {
  variant?: 'text' | 'rect' | 'circle' | 'rounded';
  width?: string | number;
  height?: string | number;
  className?: string;
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
  animate = true
}) => {
  const { colors } = useUtilities();

  const baseClasses = [
    colors.getClass('bg', 'secondary', '200'),
    animate ? 'animate-pulse' : '',
    'block'
  ];

  const variantClasses = {
    text: 'h-4 rounded',
    rect: 'rounded',
    circle: 'rounded-full',
    rounded: 'rounded-lg'
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses.join(' ')} ${variantClasses[variant]} ${className}`}
      style={style}
      role="status"
      aria-label="Loading..."
    />
  );
};

/**
 * Card Skeleton for loading card layouts
 */
export const CardSkeleton: React.FC<{ showAvatar?: boolean; lines?: number }> = ({
  showAvatar = false,
  lines = 3
}) => {
  const { spacing } = useUtilities();

  return (
    <div className={`${spacing.getClass('p', '6')} border rounded-card`}>
      <div className="animate-pulse">
        {showAvatar && (
          <div className="flex items-center mb-4">
            <Skeleton variant="circle" width={40} height={40} />
            <div className="ml-3 flex-1">
              <Skeleton variant="text" width="40%" className="mb-2" />
              <Skeleton variant="text" width="60%" />
            </div>
          </div>
        )}

        <div className="space-y-3">
          {Array.from({ length: lines }).map((_, index) => (
            <Skeleton
              key={index}
              variant="text"
              width={index === lines - 1 ? '75%' : '100%'}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Metric Skeleton for dashboard metrics
 */
export const MetricSkeleton: React.FC = () => {
  const { spacing } = useUtilities();

  return (
    <div className={`${spacing.getClass('p', '6')} border rounded-card`}>
      <div className="animate-pulse text-center">
        <Skeleton variant="circle" width={48} height={48} className="mx-auto mb-4" />
        <Skeleton variant="text" width="60%" className="mx-auto mb-2" />
        <Skeleton variant="text" width="40%" className="mx-auto mb-3" />
        <Skeleton variant="text" width="30%" className="mx-auto" />
      </div>
    </div>
  );
};

/**
 * Progress Bar Component
 */
interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  label?: string;
  animated?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  variant = 'default',
  size = 'md',
  showValue = false,
  label,
  animated = true,
  className = ''
}) => {
  const { colors, typography } = useUtilities();

  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const variantClasses = {
    default: colors.getClass('bg', 'primary', '500'),
    success: colors.getClass('bg', 'success', '500'),
    warning: colors.getClass('bg', 'warning', '500'),
    error: colors.getClass('bg', 'error', '500')
  };

  return (
    <div className={className}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className={typography.getClass('label-sm')}>{label}</span>
          {showValue && (
            <span className={`${typography.getClass('label-sm')} ${colors.getClass('text', 'secondary', '600')}`}>
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      <div className={`${colors.getClass('bg', 'secondary', '200')} rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${variantClasses[variant]} ${sizeClasses[size]} rounded-full transition-all duration-300 ease-out ${
            animated ? 'animate-pulse' : ''
          }`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label || 'Progress'}
        />
      </div>
    </div>
  );
};

/**
 * Circular Progress Component
 */
interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'default' | 'success' | 'warning' | 'error';
  showValue?: boolean;
  label?: string;
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max = 100,
  size = 64,
  strokeWidth = 4,
  variant = 'default',
  showValue = true,
  label,
  className = ''
}) => {
  const { colors, typography } = useUtilities();

  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference.toFixed(3);
  const strokeDashoffset = (circumference - (percentage / 100) * circumference).toFixed(3);

  const variantColors = {
    default: 'stroke-primary-500',
    success: 'stroke-success-500',
    warning: 'stroke-warning-500',
    error: 'stroke-error-500'
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || 'Circular progress'}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className={colors.getClass('text', 'secondary', '200')}
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className={`${variantColors[variant]} transition-all duration-300 ease-out`}
        />
      </svg>

      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${typography.getClass('label-sm')} font-medium ${colors.getClass('text', 'secondary', '900')}`}>
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Loading Dots Animation
 */
interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  className?: string;
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({
  size = 'md',
  variant = 'default',
  className = ''
}) => {
  const { colors } = useUtilities();

  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  };

  const variantClasses = {
    default: colors.getClass('bg', 'secondary', '400'),
    primary: colors.getClass('bg', 'primary', '500'),
    success: colors.getClass('bg', 'success', '500'),
    warning: colors.getClass('bg', 'warning', '500'),
    error: colors.getClass('bg', 'error', '500')
  };

  return (
    <div className={`flex space-x-1 ${className}`} role="status" aria-label="Loading">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-full animate-pulse`}
          style={{
            animationDelay: `${index * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );
};

/**
 * Page Loading Component
 */
export const PageLoading: React.FC<{ message?: string }> = ({
  message = 'Loading...'
}) => {
  const { typography, colors } = useUtilities();

  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-modal">
      <div className="text-center">
        <CircularProgress value={75} size={48} variant="default" showValue={false} />
        <p className={`${typography.getClass('body-md')} ${colors.getClass('text', 'secondary', '600')} mt-4`}>
          {message}
        </p>
      </div>
    </div>
  );
};

/**
 * Table Loading Component
 */
export const TableLoading: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4
}) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              variant="text"
              width={colIndex === 0 ? '20%' : '25%'}
              className="flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default {
  Skeleton,
  CardSkeleton,
  MetricSkeleton,
  ProgressBar,
  CircularProgress,
  LoadingDots,
  PageLoading,
  TableLoading
};
