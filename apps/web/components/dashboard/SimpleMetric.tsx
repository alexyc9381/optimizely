import React from 'react';
import {
  ARIA_LABELS,
  SCREEN_READER_DESCRIPTIONS,
} from '../../lib/accessibility';
import { cn } from '../../lib/utils';
import Card from '../ui/Card';

interface SimpleMetricProps {
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: string;
  icon?: React.ReactNode;
  type?: 'default' | 'success' | 'warning' | 'error' | 'info';
  isActive?: boolean;
  variant?: 'basic' | 'elevated' | 'interactive' | 'glass';
  enterAnimation?: 'fade' | 'up' | 'down' | 'left' | 'right' | 'none';
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
  staggerDelay,
}) => {
  const isPositiveTrend = Boolean(trend && trend.startsWith('+'));
  const formattedValue =
    typeof value === 'number' ? value.toLocaleString() : value;

  // Generate comprehensive screen reader description
  const getScreenReaderDescription = (): string => {
    if (trend) {
      return SCREEN_READER_DESCRIPTIONS.METRIC_WITH_TREND(
        title,
        formattedValue.toString(),
        trend,
        isPositiveTrend
      );
    }

    if (type !== 'default' && typeof isActive === 'boolean') {
      return SCREEN_READER_DESCRIPTIONS.SYSTEM_HEALTH(title, isActive);
    }

    return `${title}: ${formattedValue}${subtitle ? '. ' + subtitle : ''}`;
  };

  // Format value with accessibility considerations
  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') return val;
    return val.toLocaleString();
  };

  const getStatusColor = () => {
    if (isActive !== undefined) {
      return isActive ? 'text-green-600' : 'text-red-600';
    }

    switch (type) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      case 'info':
        return 'text-blue-600';
      default:
        return 'text-gray-900';
    }
  };

  const getStatusIndicator = () => {
    if (isActive !== undefined) {
      return (
        <div
          className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`}
          role='status'
          aria-label={
            isActive ? ARIA_LABELS.STATUS.ACTIVE : ARIA_LABELS.STATUS.INACTIVE
          }
          title={isActive ? 'System Active' : 'System Inactive'}
          data-oid='rp-4jkv'
        />
      );
    }
    return null;
  };

  // Generate unique IDs for ARIA relationships
  const titleId = `metric-title-${title.replace(/\s+/g, '-').toLowerCase()}`;
  const valueId = `metric-value-${title.replace(/\s+/g, '-').toLowerCase()}`;
  const subtitleId = subtitle
    ? `metric-subtitle-${title.replace(/\s+/g, '-').toLowerCase()}`
    : undefined;
  const trendId = trend
    ? `metric-trend-${title.replace(/\s+/g, '-').toLowerCase()}`
    : undefined;

  return (
    <Card
      variant={variant}
      size='md'
      hoverAnimation='metric'
      enterAnimation={enterAnimation}
      style={{ animationDelay: staggerDelay ? `${staggerDelay}ms` : undefined }}
      isMetric={true}
      metricTitle={title}
      metricValue={formattedValue.toString()}
      metricTrend={trend}
      ariaLabel={getScreenReaderDescription()}
      role='region'
      ariaDescribedBy={cn(subtitleId, trendId).trim() || undefined}
      data-testid='simple-metric'
      data-oid='o-fudmc'
    >
      <div className='text-center' data-oid='321yc:2'>
        {/* Icon */}
        {icon && (
          <div
            className='w-8 h-8 mx-auto mb-3 text-blue-600'
            aria-hidden='true'
            role='img'
            data-oid='770b1c-'
          >
            {icon}
          </div>
        )}

        {/* Title */}
        <h3
          id={titleId}
          className='text-sm font-medium text-gray-600 mb-2 flex items-center justify-center gap-2'
          data-oid='oaa1ae1'
        >
          {title}
          {getStatusIndicator()}
        </h3>

        {/* Value */}
        <div
          id={valueId}
          className={`text-2xl font-bold mb-1 ${getStatusColor()}`}
          role='text'
          aria-labelledby={titleId}
          data-oid='q2ctt7v'
        >
          {formatValue(value)}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <p
            id={subtitleId}
            className='text-xs text-gray-500 mb-2'
            data-oid='7dhnhkr'
          >
            {subtitle}
          </p>
        )}

        {/* Trend */}
        {trend && (
          <div
            id={trendId}
            className={`text-xs font-medium flex items-center justify-center gap-1 ${
              isPositiveTrend ? 'text-green-600' : 'text-red-600'
            }`}
            role='status'
            aria-label={`Trend: ${trend} ${isPositiveTrend ? 'increase' : 'decrease'} from previous period`}
            data-oid='93yrqt6'
          >
            <svg
              className={`w-3 h-3 ${isPositiveTrend ? 'rotate-0' : 'rotate-180'}`}
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              aria-hidden='true'
              role='img'
              data-oid='9ky-r7m'
            >
              <title>
                {isPositiveTrend ? 'Upward trend' : 'Downward trend'}
              </title>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M7 17l9.2-9.2M17 8v9h-9'
                data-oid='la3_8_8'
              />
            </svg>
            <span aria-hidden='true'>{trend}</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SimpleMetric;
