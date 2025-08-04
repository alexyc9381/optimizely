import React from 'react';
import { spacing } from '../../lib/spacing';
import { EmptyStates } from './EmptyState';
import SimpleMetric from './SimpleMetric';

interface MetricData {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  icon?: React.ReactNode;
  type?: 'default' | 'success' | 'warning' | 'error' | 'info';
  isActive?: boolean;
}

interface MetricGridProps {
  metrics: MetricData[];
  maxItems?: number;
  className?: string;
  variant?: 'basic' | 'elevated' | 'interactive' | 'glass';
  enableStaggerAnimation?: boolean;
  gridLayout?: 'auto' | '2-col' | '3-col' | '4-col' | '5-col';
}

const MetricGrid: React.FC<MetricGridProps> = ({
  metrics,
  maxItems = 6,
  className = '',
  variant = 'elevated',
  enableStaggerAnimation = true,
  gridLayout = 'auto',
}) => {
  // Limit metrics to maxItems for minimalist approach
  const displayedMetrics = metrics.slice(0, maxItems);

  // Get grid column classes based on layout preference
  const getGridColumns = () => {
    switch (gridLayout) {
      case '2-col':
        return 'grid-cols-1 md:grid-cols-2';
      case '3-col':
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case '4-col':
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
      case '5-col':
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5';
      case 'auto':
      default:
        // Auto-responsive based on number of metrics
        if (displayedMetrics.length <= 2) {
          return 'grid-cols-1 md:grid-cols-2';
        } else if (displayedMetrics.length <= 3) {
          return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
        } else if (displayedMetrics.length <= 4) {
          return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
        } else {
          return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5';
        }
    }
  };

  if (displayedMetrics.length === 0) {
    return (
      <div
        className='text-center py-8'
        data-testid='metric-grid-empty'
        data-oid='n0706du'
      >
        <EmptyStates.NoData
          title='No Metrics Available'
          description='Metrics will appear here once data is available'
          data-oid='2w40wiw'
        />
      </div>
    );
  }

  return (
    <div
      className={`grid ${getGridColumns()} ${spacing.getGridSpacing('metrics')} ${className}`}
      data-testid='metric-grid'
      data-oid='o:y2w::'
    >
      {displayedMetrics.map((metric, index) => (
        <SimpleMetric
          key={metric.id}
          title={metric.title}
          value={metric.value}
          subtitle={metric.subtitle}
          trend={metric.trend}
          icon={metric.icon}
          type={metric.type}
          isActive={metric.isActive}
          variant={variant}
          enterAnimation={enableStaggerAnimation ? 'up' : 'none'}
          staggerDelay={enableStaggerAnimation ? index * 100 : 0}
          data-oid='_qcxw-0'
        />
      ))}
    </div>
  );
};

export default MetricGrid;
