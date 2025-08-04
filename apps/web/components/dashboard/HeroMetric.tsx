import React from 'react';
import { SCREEN_READER_DESCRIPTIONS } from '../../lib/accessibility';
import { useUtilities } from '../../lib/useUtilities';
import Card from '../ui/Card';

interface HeroMetricProps {
  title: string;
  value: number;
  unit?: string;
  trend?: string;
  subtitle?: string;
  variant?: 'basic' | 'elevated' | 'interactive' | 'glass';
  showCard?: boolean;
  showChart?: boolean;
}

const HeroMetric: React.FC<HeroMetricProps> = ({
  title,
  value,
  unit = '%',
  trend,
  subtitle,
  variant = 'glass',
  showCard = true,
  showChart = false,
}) => {
  const { colors, components } = useUtilities();
  const isPositiveTrend = trend && trend.startsWith('+');
  const formattedValue = `${value.toFixed(1)}${unit}`;

  // Generate comprehensive screen reader description
  const screenReaderDescription = SCREEN_READER_DESCRIPTIONS.HERO_METRIC(
    title,
    formattedValue,
    subtitle
  );

        const content = (
    <div className={`${showChart ? 'flex flex-col lg:flex-row lg:items-center lg:gap-8' : 'text-center'}`} data-testid='hero-metric' data-oid='q8ouux_'>
      {/* Statistics Section */}
      <div className={`${showChart ? 'text-center lg:text-left flex-shrink-0 lg:w-1/2' : ''}`}>
        {/* Title */}
        <h1
          className={`text-heading-md font-semibold text-gray-900 mb-4`}
          id={`hero-metric-title-${title.replace(/\s+/g, '-').toLowerCase()}`}
          data-oid='f7_syez'
        >
          {title}
        </h1>

        {/* Main Value */}
        <div className='mb-4' data-oid='1ijyg_r'>
          <span
            className={`text-display-lg font-bold ${colors.getClass('text', 'secondary', '900')}`}
            data-testid='hero-value'
            aria-label={`${title} value: ${formattedValue}`}
            role='text'
            data-oid=':rvk3vs'
          >
            {value.toFixed(1)}
          </span>
          <span
            className={`text-body-lg font-medium text-gray-900 ml-2`}
            aria-hidden='true'
            data-oid='aduaxlf'
          >
            {unit}
          </span>
        </div>

        {/* Trend Indicator */}
        {trend && (
          <div
            className={`${components.badge(isPositiveTrend ? 'success' : 'error')} inline-flex items-center px-3 py-1 rounded-full text-label-md font-medium mb-4`}
            role='status'
            aria-label={`Trend: ${trend} ${isPositiveTrend ? 'increase' : 'decrease'} from previous period`}
            data-oid='mm5_9sa'
          >
            <span aria-hidden='true'>{trend}</span>
          </div>
        )}

        {/* Subtitle */}
        {subtitle && (
          <p
            className={`text-body-md text-gray-900 ${showChart ? 'max-w-none lg:max-w-sm' : 'max-w-md mx-auto'} leading-relaxed ${showChart ? 'mb-6 lg:mb-0' : 'mb-6'}`}
            id={`hero-metric-subtitle-${title.replace(/\s+/g, '-').toLowerCase()}`}
            data-oid='qifcr-d'
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Chart Section */}
      {showChart && (
        <div className="flex-grow lg:w-1/2">
          <div className="relative h-32 w-full">
            <svg width="100%" height="100%" viewBox="0 0 300 100" className="overflow-visible">
              <defs>
                <pattern id="grid" width="25" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 25 0 L 0 0 0 20" fill="none" stroke="rgba(156, 163, 175, 0.1)" strokeWidth="0.5"/>
                </pattern>
                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{stopColor: '#3B82F6', stopOpacity: 0.2}} />
                  <stop offset="100%" style={{stopColor: '#3B82F6', stopOpacity: 0}} />
                </linearGradient>
                <filter id="dropShadow">
                  <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.1"/>
                </filter>
              </defs>

              {/* Grid background */}
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Gradient fill under line */}
              <polygon
                fill="url(#chartGradient)"
                points="0,70 27,65 54,60 81,55 108,50 135,45 162,40 189,42 216,38 243,35 270,30 300,25 300,100 0,100"
              />

              {/* Trend line */}
              <polyline
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="0,70 27,65 54,60 81,55 108,50 135,45 162,40 189,42 216,38 243,35 270,30 300,25"
                filter="url(#dropShadow)"
              />

              {/* Data points with enhanced hover insights */}
              {[
                { x: 0, y: 70, date: '30d ago', rate: '6.3%', visitors: 1247, conversions: 78, trend: 'stable', topSource: 'organic' },
                { x: 27, y: 65, date: '27d ago', rate: '6.8%', visitors: 1389, conversions: 94, trend: '+0.5%', topSource: 'organic' },
                { x: 54, y: 60, date: '24d ago', rate: '7.2%', visitors: 1456, conversions: 105, trend: '+0.4%', topSource: 'paid' },
                { x: 81, y: 55, date: '21d ago', rate: '7.6%', visitors: 1523, conversions: 116, trend: '+0.4%', topSource: 'organic' },
                { x: 108, y: 50, date: '18d ago', rate: '8.0%', visitors: 1687, conversions: 135, trend: '+0.4%', topSource: 'organic' },
                { x: 135, y: 45, date: '15d ago', rate: '8.4%', visitors: 1789, conversions: 150, trend: '+0.4%', topSource: 'paid' },
                { x: 162, y: 40, date: '12d ago', rate: '8.8%', visitors: 1834, conversions: 161, trend: '+0.4%', topSource: 'organic' },
                { x: 189, y: 42, date: '9d ago', rate: '8.7%', visitors: 1798, conversions: 156, trend: '-0.1%', topSource: 'social' },
                { x: 216, y: 38, date: '6d ago', rate: '9.0%', visitors: 1923, conversions: 173, trend: '+0.3%', topSource: 'organic' },
                { x: 243, y: 35, date: '3d ago', rate: '9.2%', visitors: 2045, conversions: 188, trend: '+0.2%', topSource: 'paid' },
                { x: 270, y: 30, date: 'Today', rate: '8.6%', visitors: 2134, conversions: 184, trend: '-0.6%', topSource: 'organic' }
              ].map((point, index) => (
                <g key={index}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="4"
                    fill="#3B82F6"
                    stroke="white"
                    strokeWidth="2"
                    className="hover:r-6 transition-all duration-200 cursor-pointer drop-shadow-sm"
                    filter="url(#dropShadow)"
                  />

                  {/* Enhanced tooltip with more insights */}
                  <g className="opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <rect
                      x={point.x - 45}
                      y={point.y - 55}
                      width="90"
                      height="50"
                      fill="rgba(0, 0, 0, 0.9)"
                      rx="8"
                      ry="8"
                    />
                    <text x={point.x} y={point.y - 42} textAnchor="middle" fontSize="11" fill="white" fontWeight="bold">
                      {point.rate}
                    </text>
                    <text x={point.x} y={point.y - 32} textAnchor="middle" fontSize="9" fill="#E5E7EB">
                      {point.conversions} of {point.visitors.toLocaleString()}
                    </text>
                    <text x={point.x} y={point.y - 22} textAnchor="middle" fontSize="8" fill="#9CA3AF">
                      Top: {point.topSource} • {point.trend}
                    </text>
                    <text x={point.x} y={point.y - 14} textAnchor="middle" fontSize="8" fill="#6B7280">
                      {point.date}
                    </text>
                  </g>
                </g>
              ))}
            </svg>
          </div>
        </div>
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
