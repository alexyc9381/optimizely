import React from 'react';
import Card from '../ui/Card';

interface SimpleMetricProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  icon?: React.ReactNode;
  type?: 'default' | 'system-health' | 'currency';
  isActive?: boolean;
  variant?: 'basic' | 'elevated' | 'interactive' | 'glass';
  enterAnimation?: 'fade' | 'up' | 'down' | 'left' | 'right' | 'scale' | 'none';
  staggerDelay?: number;
}

const SimpleMetric: React.FC<SimpleMetricProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  type = 'default',
  isActive,
  variant = 'elevated',
  enterAnimation = 'up',
  staggerDelay = 0,
}) => {
  const isPositiveTrend = trend && trend.startsWith('+');

  // Format value based on type
  const formatValue = (value: string | number) => {
    if (type === 'currency' && typeof value === 'number') {
      return `$${(value / 1000).toFixed(0)}k`;
    }
    if (type === 'system-health') {
      return isActive ? 'Active' : 'Offline';
    }
    return value;
  };

  // Get status color for system health
  const getStatusColor = () => {
    if (type === 'system-health') {
      return isActive ? 'text-green-600' : 'text-red-600';
    }
    return 'text-gray-900';
  };

  // Get status indicator for system health
  const getStatusIndicator = () => {
    if (type === 'system-health') {
      return (
        <div
          className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`}
          data-oid='rp-4jkv'
        />
      );
    }
    return null;
  };

  return (
    <Card
      variant={variant}
      size='md'
      hoverAnimation='metric'
      enterAnimation={enterAnimation}
      style={{ animationDelay: staggerDelay ? `${staggerDelay}ms` : undefined }}
      data-testid='simple-metric'
      data-oid='o-fudmc'
    >
      <div className='text-center' data-oid='321yc:2'>
        {/* Icon */}
        {icon && (
          <div
            className='w-8 h-8 mx-auto mb-3 text-blue-600'
            data-oid='770b1c-'
          >
            {icon}
          </div>
        )}

        {/* Title */}
        <h3
          className='text-sm font-medium text-gray-600 mb-2 flex items-center justify-center gap-2'
          data-oid='oaa1ae1'
        >
          {title}
          {getStatusIndicator()}
        </h3>

        {/* Value */}
        <div
          className={`text-2xl font-bold mb-1 ${getStatusColor()}`}
          data-oid='q2ctt7v'
        >
          {formatValue(value)}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <p className='text-xs text-gray-500 mb-2' data-oid='7dhnhkr'>
            {subtitle}
          </p>
        )}

        {/* Trend */}
        {trend && (
          <div
            className={`text-xs font-medium flex items-center justify-center gap-1 ${
              isPositiveTrend ? 'text-green-600' : 'text-red-600'
            }`}
            data-oid='93yrqt6'
          >
            <svg
              className={`w-3 h-3 ${isPositiveTrend ? 'rotate-0' : 'rotate-180'}`}
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              data-oid='9ky-r7m'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M7 17l9.2-9.2M17 8v9h-9'
                data-oid='la3_8_8'
              />
            </svg>
            {trend}
          </div>
        )}
      </div>
    </Card>
  );
};

export default SimpleMetric;
