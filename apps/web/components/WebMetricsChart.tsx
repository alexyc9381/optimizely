import {
  ArrowLeft,
  ChevronDown,
  Clock,
  MousePointer,
  TrendingUp,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface MetricDataPoint {
  date: string;
  value: number;
}

interface MetricConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  unit: string;
  current: string;
  trend: string;
  trendType: 'up' | 'down';
}

const WebMetricsChart: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState('traffic');
  const [showDropdown, setShowDropdown] = useState(false);
  const [data, setData] = useState<MetricDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const metrics: Record<string, MetricConfig> = {
    traffic: {
      id: 'traffic',
      name: 'Website Traffic',
      icon: <TrendingUp className='w-4 h-4' />,
      color: '#3B82F6',
      unit: 'visitors',
      current: '24,789',
      trend: '+12.5%',
      trendType: 'up',
    },
    ctr: {
      id: 'ctr',
      name: 'Click-Through Rate',
      icon: <MousePointer className='w-4 h-4' />,
      color: '#10B981',
      unit: '%',
      current: '3.42%',
      trend: '+0.8%',
      trendType: 'up',
    },
    bounce: {
      id: 'bounce',
      name: 'Bounce Rate',
      icon: <ArrowLeft className='w-4 h-4' />,
      color: '#F59E0B',
      unit: '%',
      current: '32.1%',
      trend: '-2.3%',
      trendType: 'down',
    },
    session: {
      id: 'session',
      name: 'Session Duration',
      icon: <Clock className='w-4 h-4' />,
      color: '#8B5CF6',
      unit: 'min',
      current: '12m 34s',
      trend: '+1.2m',
      trendType: 'up',
    },
  };

  const generateMockData = (metricType: string): MetricDataPoint[] => {
    const days = 30;
    const data: MetricDataPoint[] = [];
    const now = new Date();

    let baseValue: number;

    switch (metricType) {
      case 'traffic':
        baseValue = 20000;
        break;
      case 'ctr':
        baseValue = 3.2;
        break;
      case 'bounce':
        baseValue = 35;
        break;
      case 'session':
        baseValue = 12;
        break;
      default:
        baseValue = 100;
    }

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Add some realistic patterns
      const weekendFactor =
        date.getDay() === 0 || date.getDay() === 6 ? 0.7 : 1;
      const trendFactor =
        metricType === 'bounce' ? 1 - i * 0.002 : 1 + i * 0.002; // Bounce rate decreases, others increase
      const randomFactor = 0.8 + Math.random() * 0.4;

      const value = baseValue * weekendFactor * trendFactor * randomFactor;

      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(value * 100) / 100,
      });
    }

    return data;
  };

  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setData(generateMockData(selectedMetric));
      setLoading(false);
    }, 500);
  }, [selectedMetric]);

  const currentMetric = metrics[selectedMetric];
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;

  return (
    <div className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm'>
      {/* Header with Metric Selector */}
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center space-x-3'>
          <div className='flex items-center space-x-2 text-lg font-semibold text-gray-900'>
            {currentMetric.icon}
            <span>{currentMetric.name}</span>
          </div>
        </div>

        <div className='relative'>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className='flex items-center space-x-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg border transition-colors'
          >
            <span className='text-sm font-medium text-gray-700'>
              {currentMetric.name}
            </span>
            <ChevronDown className='w-4 h-4 text-gray-500' />
          </button>

          {showDropdown && (
            <div className='absolute right-0 top-full mt-2 w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-10'>
              {Object.values(metrics).map(metric => (
                <button
                  key={metric.id}
                  onClick={() => {
                    setSelectedMetric(metric.id);
                    setShowDropdown(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    selectedMetric === metric.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700'
                  }`}
                >
                  {metric.icon}
                  <span className='text-sm font-medium'>{metric.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Current Value and Trend */}
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center space-x-4'>
          <div>
            <div className='text-3xl font-bold text-gray-900'>
              {currentMetric.current}
            </div>
            <div className='text-sm text-gray-500'>Last 30 days</div>
          </div>
          <div
            className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${
              currentMetric.trendType === 'up'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            <span>{currentMetric.trend}</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className='relative'>
        {loading ? (
          <div className='flex items-center justify-center h-64'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
          </div>
        ) : (
          <div className='h-64'>
            <svg width='100%' height='100%' className='overflow-visible'>
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map(percent => (
                <line
                  key={percent}
                  x1='0'
                  y1={`${percent}%`}
                  x2='100%'
                  y2={`${percent}%`}
                  stroke='#f3f4f6'
                  strokeWidth='1'
                />
              ))}

              {/* Y-axis labels */}
              {[0, 25, 50, 75, 100].map(percent => {
                const value = minValue + (range * (100 - percent)) / 100;
                const displayValue =
                  selectedMetric === 'traffic'
                    ? `${Math.round(value / 1000)}k`
                    : selectedMetric === 'session'
                      ? `${Math.round(value)}m`
                      : `${value.toFixed(1)}%`;

                return (
                  <text
                    key={percent}
                    x='-8'
                    y={`${percent}%`}
                    textAnchor='end'
                    dominantBaseline='middle'
                    className='fill-gray-500 text-xs'
                  >
                    {displayValue}
                  </text>
                );
              })}

              {/* Chart line */}
              <polyline
                fill='none'
                stroke={currentMetric.color}
                strokeWidth='3'
                strokeLinecap='round'
                strokeLinejoin='round'
                points={data
                  .map((point, index) => {
                    const x = (index / (data.length - 1)) * 100;
                    const y = 100 - ((point.value - minValue) / range) * 100;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />

              {/* Data points */}
              {data.map((point, index) => {
                const x = (index / (data.length - 1)) * 100;
                const y = 100 - ((point.value - minValue) / range) * 100;
                return (
                  <circle
                    key={index}
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r='4'
                    fill={currentMetric.color}
                    className='hover:r-6 transition-all duration-200 cursor-pointer'
                  >
                    <title>{`${point.date}: ${point.value}${currentMetric.unit === 'visitors' ? '' : currentMetric.unit}`}</title>
                  </circle>
                );
              })}
            </svg>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className='flex items-center justify-between mt-4 pt-4 border-t border-gray-200'>
        <div className='flex items-center space-x-2'>
          <div
            className='w-3 h-3 rounded-full'
            style={{ backgroundColor: currentMetric.color }}
          ></div>
          <span className='text-sm text-gray-600'>{currentMetric.name}</span>
        </div>
        <div className='text-sm text-gray-500'>30-day trend</div>
      </div>
    </div>
  );
};

export default WebMetricsChart;
