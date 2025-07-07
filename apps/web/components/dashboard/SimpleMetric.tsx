import React from 'react';

interface SimpleMetricProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  icon?: React.ReactNode;
  type?: 'default' | 'system-health' | 'currency';
  isActive?: boolean;
}

const SimpleMetric: React.FC<SimpleMetricProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  type = 'default',
  isActive,
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
      return isActive
        ? 'text-green-600 bg-green-50 border-green-200'
        : 'text-red-600 bg-red-50 border-red-200';
    }
    return 'text-gray-900 bg-white border-gray-200';
  };

  return (
    <div
      className={`p-6 rounded-lg border ${getStatusColor()} transition-colors duration-200`}
      data-testid='simple-metric'
    >
      {/* Header with Icon and Title */}
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center'>
          {icon && (
            <div className='w-8 h-8 mr-3 text-gray-600' data-testid='metric-icon'>
              {icon}
            </div>
          )}
          <h3 className='text-sm font-medium text-gray-600'>{title}</h3>
        </div>

        {/* System Health Status Dot */}
        {type === 'system-health' && (
          <div className='flex items-center'>
            <div
              className={`w-2 h-2 rounded-full ${
                isActive ? 'bg-green-500' : 'bg-red-500'
              }`}
              data-testid='status-dot'
            />
          </div>
        )}
      </div>

      {/* Main Value */}
      <div className='mb-2'>
        <span
          className={`text-2xl font-bold ${
            type === 'system-health'
              ? isActive ? 'text-green-700' : 'text-red-700'
              : 'text-gray-900'
          }`}
          data-testid='metric-value'
        >
          {formatValue(value)}
        </span>
      </div>

      {/* Trend and Subtitle */}
      <div className='flex items-center justify-between'>
        {subtitle && (
          <span className='text-xs text-gray-500' data-testid='metric-subtitle'>
            {subtitle}
          </span>
        )}

        {trend && type !== 'system-health' && (
          <span
            className={`text-xs font-medium flex items-center ${
              isPositiveTrend ? 'text-green-600' : 'text-red-600'
            }`}
            data-testid='metric-trend'
          >
            {isPositiveTrend ? (
              <svg className='w-3 h-3 mr-1' fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z'
                  clipRule='evenodd'
                />
              </svg>
            ) : (
              <svg className='w-3 h-3 mr-1' fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z'
                  clipRule='evenodd'
                />
              </svg>
            )}
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};

export default SimpleMetric;
