import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  const defaultIcon = (
    <svg
      className='w-12 h-12 text-gray-400'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1}
        d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'
      />
    </svg>
  );

  return (
    <div
      className={`text-center py-12 px-6 ${className}`}
      data-testid='empty-state'
    >
      {/* Icon */}
      <div className='mb-6 flex justify-center' data-testid='empty-state-icon'>
        {icon || defaultIcon}
      </div>

      {/* Title */}
      <h3
        className='text-lg font-medium text-gray-900 mb-3'
        data-testid='empty-state-title'
      >
        {title}
      </h3>

      {/* Description */}
      <p
        className='text-sm text-gray-600 max-w-md mx-auto mb-6 leading-relaxed'
        data-testid='empty-state-description'
      >
        {description}
      </p>

      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
            action.variant === 'secondary'
              ? 'text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300'
              : 'text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
          }`}
          data-testid='empty-state-action'
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

// Predefined empty state configurations for common scenarios
export const EmptyStates = {
  NoData: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={
        <svg
          className='w-12 h-12 text-gray-400'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={1}
            d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
          />
        </svg>
      }
      title='No data available'
      description='Data will appear here once it becomes available. Check back later or refresh the page.'
      {...props}
    />
  ),

  NoExperiments: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={
        <svg
          className='w-12 h-12 text-gray-400'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={1}
            d='M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'
          />
        </svg>
      }
      title='No experiments running'
      description='Start your first A/B test to see performance metrics and insights here.'
      {...props}
    />
  ),

  Loading: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={
        <div className='w-12 h-12 text-gray-400'>
          <svg
            className='animate-spin w-full h-full'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
            />
          </svg>
        </div>
      }
      title='Loading data...'
      description='Please wait while we fetch the latest information.'
      {...props}
    />
  ),

  Error: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={
        <svg
          className='w-12 h-12 text-red-400'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={1}
            d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
          />
        </svg>
      }
      title='Unable to load data'
      description='There was an issue loading the data. Please try refreshing the page or contact support if the problem persists.'
      {...props}
    />
  ),
};

export default EmptyState;
