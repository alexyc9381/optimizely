import React from 'react';
import SimpleMetric from './SimpleMetric';

interface MetricData {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  icon?: React.ReactNode;
  type?: 'default' | 'system-health' | 'currency';
  isActive?: boolean;
}

interface MetricGridProps {
  metrics: MetricData[];
  maxItems?: number;
  className?: string;
}

const MetricGrid: React.FC<MetricGridProps> = ({
  metrics,
  maxItems = 6,
  className = '',
}) => {
  // Limit metrics to maxItems for minimalist approach
  const displayedMetrics = metrics.slice(0, maxItems);

  if (displayedMetrics.length === 0) {
    return (
      <div className='text-center py-8' data-testid='metric-grid-empty'>
        <div className='text-gray-400 mb-4'>
          <svg className='w-12 h-12 mx-auto' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={1}
              d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
            />
          </svg>
        </div>
        <h3 className='text-sm font-medium text-gray-600 mb-2'>
          No metrics available
        </h3>
        <p className='text-xs text-gray-500'>
          Metrics will appear here once data is available
        </p>
      </div>
    );
  }

  return (
    <section className={`mb-8 ${className}`} data-testid='metric-grid'>
      {/* Grid Header */}
      <div className='flex items-center justify-between mb-6'>
        <h2 className='text-lg font-semibold text-gray-900'>
          Essential Metrics
        </h2>
        <span className='text-sm text-gray-500'>
          {displayedMetrics.length} of {metrics.length} metrics
        </span>
      </div>

      {/* Responsive Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4'>
        {displayedMetrics.map((metric) => (
          <SimpleMetric
            key={metric.id}
            title={metric.title}
            value={metric.value}
            subtitle={metric.subtitle}
            trend={metric.trend}
            icon={metric.icon}
            type={metric.type}
            isActive={metric.isActive}
          />
        ))}
      </div>

      {/* Show truncation indicator if there are more metrics */}
      {metrics.length > maxItems && (
        <div className='text-center mt-6'>
          <p className='text-xs text-gray-500'>
            {metrics.length - maxItems} more metrics available via detailed analytics
          </p>
        </div>
      )}
    </section>
  );
};

export default MetricGrid;
