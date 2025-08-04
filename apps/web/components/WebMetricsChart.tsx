import {
    ChevronDown,
    ChevronLeft,
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
  const [mounted, setMounted] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('traffic');
  const [showDropdown, setShowDropdown] = useState(false);
  const [data, setData] = useState<MetricDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const metrics: Record<string, MetricConfig> = {
    traffic: {
      id: 'traffic',
      name: 'Website Traffic',
      icon: <TrendingUp className='w-4 h-4' data-oid='bxj7xry' />,
      color: '#3B82F6',
      unit: 'visitors',
      current: '24,789',
      trend: '+12.5%',
      trendType: 'up',
    },
    ctr: {
      id: 'ctr',
      name: 'Click-Through Rate',
      icon: <MousePointer className='w-4 h-4' data-oid='.7vr_1:' />,
      color: '#10B981',
      unit: '%',
      current: '3.42%',
      trend: '+0.8%',
      trendType: 'up',
    },
    bounce: {
      id: 'bounce',
      name: 'Bounce Rate',
      icon: <ChevronLeft className='w-4 h-4' data-oid='sn1dml5' />,
      color: '#F59E0B',
      unit: '%',
      current: '32.1%',
      trend: '-2.3%',
      trendType: 'down',
    },
    session: {
      id: 'session',
      name: 'Session Duration',
      icon: <Clock className='w-4 h-4' data-oid='gdxx2zi' />,
      color: '#3B82F6',
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

  // Initialize mounted state on client-side only
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Generate demo data immediately for better UX
    setData(generateMockData(selectedMetric));
    setLoading(false);
  }, [mounted, selectedMetric]);

  const currentMetric = metrics[selectedMetric];
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;

  return (
    <div
      className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm w-full'
      data-oid='-8:79wi'
    >
      {/* Header with Metric Selector */}
      <div
        className='flex items-center justify-between mb-6'
        data-oid='5b9zz59'
      >
        <div className='flex items-center space-x-3' data-oid='ew0h-pf'>
          <div
            className='flex items-center space-x-2 text-lg font-semibold text-gray-900'
            data-oid='u1l:khv'
          >
            {currentMetric.icon}
            <span data-oid='vlu576m'>{currentMetric.name}</span>
          </div>
        </div>

        <div className='relative' data-oid='td7aifr'>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className='flex items-center space-x-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-50 rounded-lg border transition-colors'
            data-oid='go-bnlw'
          >
            <span
              className='text-xs font-medium text-gray-700'
              data-oid='zgdutlh'
            >
              {currentMetric.name}
            </span>
            <ChevronDown className='w-3 h-3 text-gray-500' data-oid='8z.z0wp' />
          </button>

          {showDropdown && (
            <div
              className='absolute right-0 top-full mt-2 w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-10'
              data-oid='f.buxsp'
            >
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
                  data-oid='ldxff7f'
                >
                  {metric.icon}
                  <span className='text-sm font-medium' data-oid='vvj425h'>
                    {metric.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Current Value and Trend */}
      <div
        className='flex items-center justify-between mb-6'
        data-oid='my1v_:g'
      >
        <div className='flex items-center space-x-4' data-oid='c7y:1ep'>
          <div data-oid='-mkr6ph'>
            <div
              className='text-3xl font-bold text-gray-900'
              data-oid='d30bwx3'
            >
              {currentMetric.current}
            </div>
            <div className='text-sm text-gray-500' data-oid='8txrrkp'>
              Last 30 days
            </div>
          </div>
          <div
            className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${
              currentMetric.trendType === 'up'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
            data-oid='ms_cjum'
          >
            <span data-oid='65tjhw-'>{currentMetric.trend}</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className='relative' data-oid='jfjls0w'>
        {loading ? (
          <div
            className='flex items-center justify-center h-64'
            data-oid='ks0_26d'
          >
            <div
              className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'
              data-oid='kudvp9p'
            ></div>
          </div>
        ) : (
          <div className='h-64 relative' data-oid='f:d7u2d'>
            <svg
              viewBox='0 0 400 200'
              className='w-full h-full'
              data-oid='3p5b_01'
            >
              {/* Grid lines */}
              <defs data-oid='-je0-wm'>
                <pattern
                  id='webMetricsGrid'
                  width='40'
                  height='20'
                  patternUnits='userSpaceOnUse'
                  data-oid='yk-bc5i'
                >
                  <path
                    d='M 40 0 L 0 0 0 20'
                    fill='none'
                    stroke='#f3f4f6'
                    strokeWidth='1'
                    data-oid='xspu0we'
                  />
                </pattern>
              </defs>
              <rect
                width='100%'
                height='100%'
                fill='url(#webMetricsGrid)'
                data-oid='z91jcx-'
              />

              {/* Y-axis labels */}
              {[0, 5, 10, 15, 20].map((step, index) => {
                const value = minValue + (range * (4 - index)) / 4;
                const displayValue =
                  selectedMetric === 'traffic'
                    ? `${Math.round(value / 1000)}k`
                    : selectedMetric === 'session'
                      ? `${Math.round(value)}m`
                      : `${value.toFixed(1)}%`;

                return (
                  <text
                    key={step}
                    x='15'
                    y={185 - (step / 20) * 160}
                    fontSize='10'
                    fill='#6b7280'
                    textAnchor='end'
                    data-oid='s131693'
                  >
                    {displayValue}
                  </text>
                );
              })}

              {/* Chart line */}
              <path
                d={data
                  .map((point, index) => {
                    const x = 20 + (index / (data.length - 1)) * 360;
                    const y = 180 - ((point.value - minValue) / range) * 160;
                    return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
                  })
                  .join(' ')}
                fill='none'
                stroke={currentMetric.color}
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
                data-oid='2wkp7-m'
              />

              {/* Data points with hover */}
              {data.map((point, index) => {
                const x = 20 + (index / (data.length - 1)) * 360;
                const y = 180 - ((point.value - minValue) / range) * 160;
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r='3'
                    fill={currentMetric.color}
                    className='hover:r-5 transition-all duration-200 cursor-pointer opacity-80 hover:opacity-100'
                    data-oid='e8cq-6d'
                    onMouseEnter={e => {
                      const tooltip = document.getElementById('chart-tooltip');
                      if (tooltip) {
                        tooltip.style.display = 'block';
                        tooltip.style.left = `${e.clientX - tooltip.offsetWidth / 2}px`;
                        tooltip.style.top = `${e.clientY - tooltip.offsetHeight - 10}px`;
                        tooltip.innerHTML = `
                          <div class="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
                            <div class="font-semibold">${new Date(point.date).toLocaleDateString()}</div>
                            <div class="text-gray-300">${currentMetric.name}</div>
                            <div class="font-bold text-lg">${point.value}${currentMetric.unit === 'visitors' ? '' : currentMetric.unit}</div>
                            <div class="text-xs text-gray-400 mt-1">
                              ${
                                selectedMetric === 'traffic'
                                  ? 'Unique visitors'
                                  : selectedMetric === 'ctr'
                                    ? 'Click-through rate'
                                    : selectedMetric === 'bounce'
                                      ? 'Bounce rate'
                                      : 'Average session duration'
                              }
                            </div>
                          </div>
                        `;
                      }
                    }}
                    onMouseLeave={() => {
                      const tooltip = document.getElementById('chart-tooltip');
                      if (tooltip) {
                        tooltip.style.display = 'none';
                      }
                    }}
                  />
                );
              })}
            </svg>

            {/* Tooltip container */}
            <div
              id='chart-tooltip'
              className='fixed z-50 pointer-events-none'
              style={{ display: 'none' }}
              data-oid='2j3cwa-'
            />
          </div>
        )}
      </div>

      {/* Legend */}
      <div
        className='flex items-center justify-between mt-4 pt-4 border-t border-gray-200'
        data-oid='-uksm.k'
      >
        <div className='flex items-center space-x-2' data-oid='e2ekcos'>
          <div
            className='w-3 h-3 rounded-full'
            style={{ backgroundColor: currentMetric.color }}
            data-oid='1ktzasf'
          ></div>
          <span className='text-sm text-gray-600' data-oid='f24j1i_'>
            {currentMetric.name}
          </span>
        </div>
        <div className='text-sm text-gray-500' data-oid='-ehv39h'>
          30-day trend
        </div>
      </div>
    </div>
  );
};

export default WebMetricsChart;
