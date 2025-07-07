import React from 'react';

interface ConditionalChartProps {
  title: string;
  isVisible: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  description?: string;
  itemCount?: number;
}

const ConditionalChart: React.FC<ConditionalChartProps> = ({
  title,
  isVisible,
  onToggle,
  children,
  description,
  itemCount,
}) => {
  return (
    <div className='mb-8' data-testid='conditional-chart'>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={`flex items-center justify-between w-full px-6 py-4 rounded-lg font-medium transition-all duration-300 ${
          isVisible
            ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700'
            : 'bg-white text-blue-600 border border-blue-200 hover:border-blue-400 hover:bg-blue-50'
        }`}
        data-testid='chart-toggle'
      >
        <div className='flex items-center space-x-3'>
          <span className='font-medium'>{title}</span>
          {itemCount !== undefined && (
            <span
              className={`px-2 py-1 text-xs rounded-full ${
                isVisible
                  ? 'bg-blue-500 text-blue-100'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {itemCount} items
            </span>
          )}
        </div>

        <div className='flex items-center space-x-2'>
          {description && !isVisible && (
            <span
              className={`text-xs ${
                isVisible ? 'text-blue-100' : 'text-gray-500'
              }`}
            >
              {description}
            </span>
          )}

          {/* Chevron Icon */}
          <svg
            className={`w-5 h-5 transition-transform duration-300 ${
              isVisible ? 'transform rotate-180' : ''
            }`}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            data-testid='chevron-icon'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M19 9l-7 7-7-7'
            />
          </svg>
        </div>
      </button>

      {/* Collapsible Content */}
      {isVisible && (
        <div
          className='mt-4 transition-all duration-500 ease-in-out animate-fadeIn'
          data-testid='chart-content'
        >
          <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
            {/* Optional Description */}
            {description && (
              <div className='px-6 py-4 bg-gray-50 border-b border-gray-200'>
                <p className='text-sm text-gray-600'>{description}</p>
              </div>
            )}

            {/* Chart Content */}
            <div className='p-6'>
              {children}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConditionalChart;
