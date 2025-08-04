import React from 'react';
import Card from '../ui/Card';

interface ConditionalChartProps {
  title: string;
  isVisible: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  description?: string;
  itemCount?: number;
  variant?: 'basic' | 'elevated' | 'interactive' | 'glass';
}

const ConditionalChart: React.FC<ConditionalChartProps> = ({
  title,
  isVisible,
  onToggle,
  children,
  description,
  itemCount,
  variant = 'basic',
}) => {
  return (
    <Card
      variant={variant}
      size='lg'
      className='mb-8'
      enterAnimation='fade'
      data-testid='conditional-chart'
      data-oid='uten5qw'
    >
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={`flex items-center justify-between w-full p-6 rounded-lg font-medium transition-all duration-300 interactive-button focus-ring ${
          isVisible
            ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700'
            : 'bg-white text-blue-600 border border-blue-200 hover:border-blue-400 hover:bg-blue-50'
        }`}
        data-testid='toggle-button'
        data-oid='rmlnjf5'
      >
        <div className='flex items-center space-x-3' data-oid='ufv3l_4'>
          <div className='text-left' data-oid='a-hoenc'>
            <div className='font-semibold text-lg' data-oid=':hqkh5i'>
              {title}
            </div>
            {description && (
              <div
                className={`text-sm mt-1 ${isVisible ? 'text-blue-100' : 'text-gray-600'}`}
                data-oid='r50jh-x'
              >
                {description}
              </div>
            )}
          </div>
          {itemCount && (
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                isVisible
                  ? 'bg-blue-500 text-white'
                  : 'bg-blue-100 text-blue-800'
              }`}
              data-oid='zg3sh1u'
            >
              {itemCount} items
            </div>
          )}
        </div>

        <div className='flex items-center space-x-2' data-oid='9a6h2ur'>
          <div
            className={`text-sm ${isVisible ? 'text-blue-100' : 'text-blue-500'}`}
            data-oid='qo82sro'
          >
            {isVisible ? 'Hide' : 'Show'}
          </div>
          <svg
            className={`w-5 h-5 transform transition-transform duration-300 ${
              isVisible ? 'rotate-180' : 'rotate-0'
            }`}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            data-oid='g.xq27d'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M19 9l-7 7-7-7'
              data-oid='t63.w4b'
            />
          </svg>
        </div>
      </button>

      {/* Expandable Content */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isVisible ? 'max-h-screen opacity-100 pt-6' : 'max-h-0 opacity-0'
        }`}
        data-testid='expandable-content'
        data-oid='pao5p9y'
      >
        <div className='px-6 pb-6' data-oid='.8.i4m3'>
          {children}
        </div>
      </div>
    </Card>
  );
};

export default ConditionalChart;
