import { CalendarDays, ChevronDown } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface ConversionDataPoint {
  date: string;
  control: number;
  variant_a: number;
  variant_b?: number;
  variant_c?: number;
}

interface TestGroup {
  id: string;
  name: string;
  color: string;
  isControl?: boolean;
}

interface ConversionRateTrendChartProps {
  className?: string;
}

const ConversionRateTrendChart: React.FC<ConversionRateTrendChartProps> = ({
  className = '',
}) => {
  const [mounted, setMounted] = useState(false);
  const [timeframe, setTimeframe] = useState('7d');
  const [selectedTest, setSelectedTest] = useState('pricing_page_test');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [showTestDropdown, setShowTestDropdown] = useState(false);
  const [data, setData] = useState<ConversionDataPoint[]>([]);
  const [loading, setLoading] = useState(false);

  // Available timeframes
  const timeframes = [
    { id: '24h', label: '24 Hours', days: 1 },
    { id: '7d', label: '7 Days', days: 7 },
    { id: '30d', label: '30 Days', days: 30 },
    { id: '90d', label: '90 Days', days: 90 },
    { id: '1y', label: '1 Year', days: 365 },
  ];

  // Available test groups
  const testGroups = [
    { id: 'pricing_page_test', name: 'Pricing Page CTA', color: '#3B82F6' },
    { id: 'onboarding_flow', name: 'Onboarding Flow', color: '#3B82F6' },
    { id: 'email_campaign', name: 'Email Subject Lines', color: '#F59E0B' },
    { id: 'landing_page', name: 'Landing Page Design', color: '#10B981' },
  ];

  // Test group variants
  const getTestVariants = (testId: string): TestGroup[] => {
    const baseVariants = [
      { id: 'control', name: 'Control', color: '#6B7280', isControl: true },
      { id: 'variant_a', name: 'Variant A', color: '#3B82F6' },
      { id: 'variant_b', name: 'Variant B', color: '#10B981' },
    ];

    switch (testId) {
      case 'pricing_page_test':
        return [
          ...baseVariants,
          { id: 'variant_c', name: 'Variant C', color: '#F59E0B' },
        ];

      case 'email_campaign':
        return [
          ...baseVariants.slice(0, 2),
          { id: 'variant_b', name: 'Personalized', color: '#3B82F6' },
        ];

      default:
        return baseVariants;
    }
  };

  // Generate mock data based on timeframe and test (deterministic for SSR)
  const generateMockData = (
    days: number,
    testId: string
  ): ConversionDataPoint[] => {
    const data: ConversionDataPoint[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Base conversion rates with deterministic variations (no Math.random)
      const baseControl = testId === 'pricing_page_test' ? 8.2 : 6.5;
      const seed = i + date.getDate(); // Deterministic seed
      const variation1 = ((seed * 17) % 100) / 50 - 1; // -1 to 1
      const variation2 = ((seed * 23) % 100) / 25 - 2; // -2 to 2

      const dataPoint: ConversionDataPoint = {
        date: date.toISOString().split('T')[0],
        control: Math.max(0, baseControl + variation1 * 0.5),
        variant_a: Math.max(0, baseControl + variation1),
        variant_b: Math.max(0, baseControl + variation2),
      };

      // Add variant C for pricing page test
      if (testId === 'pricing_page_test') {
        dataPoint.variant_c = Math.max(
          0,
          baseControl + 2.5 + variation1 * 0.8
        );
      }

      data.push(dataPoint);
    }

    return data;
  };

  // Initialize mounted state on client-side only
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load data when timeframe or test changes
  useEffect(() => {
    if (!mounted) return;

    const selectedTimeframe = timeframes.find(t => t.id === timeframe);
    const days = selectedTimeframe?.days || 7;

    // Generate demo data immediately for better UX
    const newData = generateMockData(days, selectedTest);
    setData(newData);
    setLoading(false);
  }, [mounted, timeframe, selectedTest]);

  const maxValue = 20;

  // Generate SVG path for line chart
  const generatePath = (values: number[]) => {
    if (values.length === 0) return '';

    const width = 400;
    const height = 200;
    const padding = 20;

    const xStep = (width - 2 * padding) / Math.max(values.length - 1, 1);
    const yScale = (height - 2 * padding) / maxValue;

    let path = '';
    values.forEach((value, index) => {
      const x = padding + index * xStep;
      const y = height - padding - value * yScale;
      if (index === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });

    return path;
  };

  const currentTest = testGroups.find(t => t.id === selectedTest);
  const variants = getTestVariants(selectedTest);
  const currentTimeframe = timeframes.find(t => t.id === timeframe);

  return (
    <div
      className={`bg-white rounded-xl p-6 border border-gray-200 shadow-sm ${className}`}
      data-oid='sor4t78'
    >
      {/* Header with dropdowns */}
      <div
        className='flex items-center justify-between mb-6'
        data-oid='kn-rj_s'
      >
        <div data-oid='9-rezqo'>
          <h3
            className='text-lg font-semibold text-gray-900'
            data-oid='mj-8mq:'
          >
            Conversion Rate Trends
          </h3>
          <p className='text-sm text-gray-600' data-oid='x01ox5_'>
            Compare test variants over time
          </p>
        </div>

        <div className='flex items-center gap-3' data-oid='b3m90u7'>
          {/* Test Group Selector */}
          <div className='relative' data-oid='b4-q4yo'>
            <button
              onClick={() => {
                setShowTestDropdown(!showTestDropdown);
                setShowTimeDropdown(false);
              }}
              className='flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
              data-oid='khsvt7e'
            >
              <div
                className='w-2 h-2 rounded-full'
                style={{ backgroundColor: currentTest?.color }}
                data-oid='ax0t81_'
              />

              {currentTest?.name}
              <ChevronDown className='w-3 h-3' data-oid='p03l3mw' />
            </button>

            {showTestDropdown && (
              <div
                className='absolute right-0 z-10 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg'
                data-oid='vhu_wsh'
              >
                {testGroups.map(test => (
                  <button
                    key={test.id}
                    onClick={() => {
                      setSelectedTest(test.id);
                      setShowTestDropdown(false);
                    }}
                    className='flex items-center gap-3 w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg'
                    data-oid='y9lseau'
                  >
                    <div
                      className='w-3 h-3 rounded-full'
                      style={{ backgroundColor: test.color }}
                      data-oid='z4g.2g2'
                    />

                    {test.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Timeframe Selector */}
          <div className='relative' data-oid='1mf-lm3'>
            <button
              onClick={() => {
                setShowTimeDropdown(!showTimeDropdown);
                setShowTestDropdown(false);
              }}
              className='flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
              data-oid='etb4khc'
            >
                              <CalendarDays className='w-3 h-3' data-oid='._28642' />
              {currentTimeframe?.label}
              <ChevronDown className='w-3 h-3' data-oid=':ncd2a3' />
            </button>

            {showTimeDropdown && (
              <div
                className='absolute right-0 z-10 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg'
                data-oid='v_5go9j'
              >
                {timeframes.map(tf => (
                  <button
                    key={tf.id}
                    onClick={() => {
                      setTimeframe(tf.id);
                      setShowTimeDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                      timeframe === tf.id
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700'
                    }`}
                    data-oid='eurrzwq'
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className='relative' data-oid='oom2gn_'>
        {loading ? (
          <div
            className='flex items-center justify-center h-64'
            data-oid='7d2fzg.'
          >
            <div
              className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'
              data-oid='16sfpts'
            ></div>
          </div>
        ) : (
          <div className='h-64' data-oid='n83inga'>
            <svg
              viewBox='0 0 400 200'
              className='w-full h-full'
              data-oid='ty40e0m'
            >
              {/* Grid lines */}
              <defs data-oid='nsx8la5'>
                <pattern
                  id='grid'
                  width='40'
                  height='20'
                  patternUnits='userSpaceOnUse'
                  data-oid='mcm-b_-'
                >
                  <path
                    d='M 40 0 L 0 0 0 20'
                    fill='none'
                    stroke='#f3f4f6'
                    strokeWidth='1'
                    data-oid='k55-k03'
                  />
                </pattern>
              </defs>
              <rect
                width='100%'
                height='100%'
                fill='url(#grid)'
                className='rounded-none'
                data-oid='ixmkmly'
              />

              {/* Y-axis labels */}
              {[0, 5, 10, 15, 20].map(value => (
                <g key={value} data-oid='b8uphxh'>
                  <text
                    x='15'
                    y={185 - (value / 20) * 160}
                    fontSize='10'
                    fill='#6b7280'
                    textAnchor='end'
                    data-oid='2l:5h6h'
                  >
                    {value}%
                  </text>
                </g>
              ))}

              {/* Data lines */}
              {variants.map(variant => {
                const values = data
                  .map(d => {
                    switch (variant.id) {
                      case 'control':
                        return d.control;
                      case 'variant_a':
                        return d.variant_a;
                      case 'variant_b':
                        return d.variant_b || 0;
                      case 'variant_c':
                        return d.variant_c || 0;
                      default:
                        return 0;
                    }
                  })
                  .filter(v => v > 0);

                if (values.length === 0) return null;

                return (
                  <path
                    key={variant.id}
                    d={generatePath(values)}
                    stroke={variant.color}
                    strokeWidth={variant.isControl ? '3' : '2'}
                    strokeDasharray={variant.isControl ? '0' : '0'}
                    fill='none'
                    opacity={0.8}
                    data-oid='g:mcgk3'
                  />
                );
              })}

              {/* Data points */}
              {variants.map(variant => {
                const values = data
                  .map(d => {
                    switch (variant.id) {
                      case 'control':
                        return d.control;
                      case 'variant_a':
                        return d.variant_a;
                      case 'variant_b':
                        return d.variant_b || 0;
                      case 'variant_c':
                        return d.variant_c || 0;
                      default:
                        return 0;
                    }
                  })
                  .filter(v => v > 0);

                if (values.length === 0) return null;

                const width = 400;
                const height = 200;
                const padding = 20;
                const xStep =
                  (width - 2 * padding) / Math.max(values.length - 1, 1);
                const yScale = (height - 2 * padding) / maxValue;

                return values.map((value, index) => (
                  <circle
                    key={`${variant.id}-${index}`}
                    cx={padding + index * xStep}
                    cy={height - padding - value * yScale}
                    r={variant.isControl ? '4' : '3'}
                    fill={variant.color}
                    opacity={0.8}
                    data-oid='07udaqu'
                  />
                ));
              })}
            </svg>
          </div>
        )}
      </div>

      {/* Legend */}
      <div
        className='flex flex-wrap items-center justify-center gap-2 sm:gap-4 lg:gap-6 mt-4 pt-4 border-t border-gray-200'
        data-oid='9yd_4di'
      >
        {variants.map(variant => {
          const latestValue =
            data.length > 0
              ? (() => {
                  const latest = data[data.length - 1];
                  switch (variant.id) {
                    case 'control':
                      return latest.control;
                    case 'variant_a':
                      return latest.variant_a;
                    case 'variant_b':
                      return latest.variant_b;
                    case 'variant_c':
                      return latest.variant_c;
                    default:
                      return 0;
                  }
                })()
              : 0;

          if (!latestValue) return null;

          return (
            <div
              key={variant.id}
              className='flex items-center gap-1 sm:gap-2'
              data-oid='ajfo395'
            >
              <div
                className='w-3 h-3 rounded-full'
                style={{ backgroundColor: variant.color }}
                data-oid='v25yykb'
              />

              <span className='text-xs sm:text-sm text-gray-600' data-oid='y138i1g'>
                {variant.name}
              </span>
              <span
                className='text-xs sm:text-sm font-semibold text-gray-900'
                data-oid='3x-ziv3'
              >
                {latestValue.toFixed(1)}%
              </span>
              {variant.isControl && (
                <span className='text-xs text-gray-500 ml-0.5 sm:ml-1' data-oid='l0w.25z'>
                  (baseline)
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Performance Summary */}
      <div className='mt-4 pt-4 border-t border-gray-200' data-oid='fm6hur7'>
        <div className='grid grid-cols-3 gap-4 text-center' data-oid='unxvjyq'>
          <div data-oid='_mj1qhr'>
            <div className='text-lg font-bold text-gray-900' data-oid='.u3:6-3'>
              {data.length > 0
                ? Math.max(
                    ...variants
                      .map(v => {
                        const latest = data[data.length - 1];
                        switch (v.id) {
                          case 'control':
                            return latest.control;
                          case 'variant_a':
                            return latest.variant_a;
                          case 'variant_b':
                            return latest.variant_b || 0;
                          case 'variant_c':
                            return latest.variant_c || 0;
                          default:
                            return 0;
                        }
                      })
                      .filter(Boolean)
                  ).toFixed(1)
                : '0.0'}
              %
            </div>
            <div className='text-xs text-gray-600' data-oid='y87usg9'>
              Best Performer
            </div>
          </div>
          <div data-oid='pss5gwv'>
            <div className='text-lg font-bold text-gray-900' data-oid='yl43fqh'>
              {data.length > 0
                ? (
                    ((Math.max(
                      ...variants
                        .map(v => {
                          const latest = data[data.length - 1];
                          switch (v.id) {
                            case 'control':
                              return latest.control;
                            case 'variant_a':
                              return latest.variant_a;
                            case 'variant_b':
                              return latest.variant_b || 0;
                            case 'variant_c':
                              return latest.variant_c || 0;
                            default:
                              return 0;
                          }
                        })
                        .filter(Boolean)
                    ) -
                      data[data.length - 1].control) /
                      data[data.length - 1].control) *
                    100
                  ).toFixed(1)
                : '0.0'}
              %
            </div>
            <div className='text-xs text-gray-600' data-oid='v3zm-ya'>
              Improvement
            </div>
          </div>
          <div data-oid='q5mf5jc'>
            <div className='text-lg font-bold text-gray-900' data-oid='0vh_t.o'>
              95%
            </div>
            <div className='text-xs text-gray-600' data-oid='uvu_qro'>
              Confidence
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversionRateTrendChart;
