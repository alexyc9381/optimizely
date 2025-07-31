import React from 'react';
import { SCREEN_READER_DESCRIPTIONS } from '../../lib/accessibility';
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
  const formattedValue = `${value.toFixed(1)}${unit}`;

  // Generate comprehensive screen reader description
  const screenReaderDescription = SCREEN_READER_DESCRIPTIONS.HERO_METRIC(
    title,
    formattedValue,
    subtitle
  );

  const content = (
    <div className='text-center' data-testid='hero-metric' data-oid='q8ouux_'>
      {/* Title */}
      <h1
        className='text-lg font-medium text-gray-600 mb-4'
        id={`hero-metric-title-${title.replace(/\s+/g, '-').toLowerCase()}`}
        data-oid='f7_syez'
      >
        {title}
      </h1>

      {/* Main Value */}
      <div className='mb-4' data-oid='1ijyg_r'>
        <span
          className='text-6xl font-bold text-gray-900'
          data-testid='hero-value'
          aria-label={`${title} value: ${formattedValue}`}
          role='text'
          data-oid=':rvk3vs'
        >
          {value.toFixed(1)}
        </span>
        <span
          className='text-3xl font-medium text-gray-600 ml-2'
          aria-hidden='true'
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
          role='status'
          aria-label={`Trend: ${trend} ${isPositiveTrend ? 'increase' : 'decrease'} from previous period`}
          data-oid='mm5_9sa'
        >
          <svg
            className={`w-4 h-4 mr-1 ${isPositiveTrend ? 'rotate-0' : 'rotate-180'}`}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            aria-hidden='true'
            role='img'
            data-oid='e.prhi8'
          >
            <title>
              {isPositiveTrend ? 'Upward trend arrow' : 'Downward trend arrow'}
            </title>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M7 17l9.2-9.2M17 8v9h-9'
              data-oid='kkhp_3g'
            />
          </svg>
          <span aria-hidden='true'>{trend}</span>
        </div>
      )}

      {/* Subtitle */}
      {subtitle && (
        <p
          className='text-gray-500 max-w-md mx-auto leading-relaxed'
          id={`hero-metric-subtitle-${title.replace(/\s+/g, '-').toLowerCase()}`}
          data-oid='qifcr-d'
        >
          {subtitle}
        </p>
      )}
    </div>
  );

  if (!showCard) {
    return (
      <section
        aria-labelledby={`hero-metric-title-${title.replace(/\s+/g, '-').toLowerCase()}`}
        aria-describedby={
          subtitle
            ? `hero-metric-subtitle-${title.replace(/\s+/g, '-').toLowerCase()}`
            : undefined
        }
        role='region'
        aria-label={screenReaderDescription}
      >
        {content}
      </section>
    );
  }

  return (
    <Card
      variant={variant}
      size='lg'
      isMetric={true}
      metricTitle={title}
      metricValue={formattedValue}
      metricTrend={trend}
      ariaLabel={screenReaderDescription}
      role='region'
      data-testid='hero-metric-card'
    >
      {content}
    </Card>
  );
};

export default HeroMetric;
