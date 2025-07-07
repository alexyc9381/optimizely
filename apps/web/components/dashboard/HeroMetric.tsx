import React from 'react';

interface HeroMetricProps {
  title: string;
  value: number;
  unit?: string;
  trend?: string;
  subtitle?: string;
}

const HeroMetric: React.FC<HeroMetricProps> = ({
  title,
  value,
  unit = '%',
  trend,
  subtitle,
}) => {
  const isPositiveTrend = trend && trend.startsWith('+');

  return (
    <div className='text-center py-8 mb-8' data-testid='hero-metric'>
      {/* Title */}
      <h1 className='text-lg font-medium text-gray-600 mb-4'>{title}</h1>

      {/* Main Value */}
      <div className='mb-4'>
        <span className='text-6xl font-bold text-gray-900' data-testid='hero-value'>
          {value.toFixed(1)}
        </span>
        <span className='text-3xl font-medium text-gray-600 ml-2'>{unit}</span>
      </div>

      {/* Trend Indicator */}
      {trend && (
        <div className='flex items-center justify-center mb-2'>
          <span
            className={`flex items-center text-sm font-medium ${
              isPositiveTrend ? 'text-green-600' : 'text-red-600'
            }`}
            data-testid='hero-trend'
          >
            {isPositiveTrend ? (
              <svg className='w-4 h-4 mr-1' fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z'
                  clipRule='evenodd'
                />
              </svg>
            ) : (
              <svg className='w-4 h-4 mr-1' fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z'
                  clipRule='evenodd'
                />
              </svg>
            )}
            {trend}
          </span>
        </div>
      )}

      {/* Subtitle */}
      {subtitle && (
        <p className='text-sm text-gray-500' data-testid='hero-subtitle'>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default HeroMetric;
