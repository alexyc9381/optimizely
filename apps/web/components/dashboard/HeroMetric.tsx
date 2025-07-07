import React from 'react';
import Card from '../ui/Card';

interface HeroMetricProps {
  title: string;
  value: number;
  unit?: string;
  trend?: string;
  subtitle?: string;
  variant?: 'basic' | 'elevated' | 'interactive' | 'glass';
  showCard?: boolean;
}

const HeroMetric: React.FC<HeroMetricProps> = ({
  title,
  value,
  unit = '%',
  trend,
  subtitle,
  variant = 'glass',
  showCard = true,
}) => {
  const isPositiveTrend = trend && trend.startsWith('+');

  const content = (
    <div className='text-center' data-testid='hero-metric' data-oid='q8ouux_'>
      {/* Title */}
      <h1 className='text-lg font-medium text-gray-600 mb-4' data-oid='f7_syez'>
        {title}
      </h1>

      {/* Main Value */}
      <div className='mb-4' data-oid='1ijyg_r'>
        <span
          className='text-6xl font-bold text-gray-900'
          data-testid='hero-value'
          data-oid=':rvk3vs'
        >
          {value.toFixed(1)}
        </span>
        <span
          className='text-3xl font-medium text-gray-600 ml-2'
          data-oid='aduaxlf'
        >
          {unit}
        </span>
      </div>

      {/* Trend Indicator */}
      {trend && (
        <div
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${
            isPositiveTrend
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}
          data-oid='mm5_9sa'
        >
          <svg
            className={`w-4 h-4 mr-1 ${isPositiveTrend ? 'rotate-0' : 'rotate-180'}`}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            data-oid='e.prhi8'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M7 17l9.2-9.2M17 8v9h-9'
              data-oid='kkhp_3g'
            />
          </svg>
          {trend}
        </div>
      )}

      {/* Subtitle */}
      {subtitle && (
        <p
          className='text-gray-500 max-w-md mx-auto leading-relaxed'
          data-oid='qifcr-d'
        >
          {subtitle}
        </p>
      )}
    </div>
  );

  if (!showCard) {
    return content;
  }

  return (
    <Card
      variant={variant}
      size='lg'
      hoverAnimation='interactive'
      focusVariant='subtle'
      enterAnimation='scale'
      className='max-w-2xl mx-auto'
      data-oid='0my:613'
    >
      {content}
    </Card>
  );
};

export default HeroMetric;
