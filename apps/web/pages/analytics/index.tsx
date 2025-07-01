import React, { useState } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';

interface AnalyticsData {
  totalVisitors: number;
  conversionRate: number;
  revenue: number;
  testsRunning: number;
  avgTestDuration: number;
  significantResults: number;
}

// Interface for future chart implementation
// interface ChartData {
//   date: string;
//   visitors: number;
//   conversions: number;
//   revenue: number;
// }

const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>(
    '30d'
  );
  const [selectedMetric, setSelectedMetric] = useState<
    'visitors' | 'conversions' | 'revenue'
  >('visitors');

  // Mock data - replace with real API calls
  const analyticsData: AnalyticsData = {
    totalVisitors: 47583,
    conversionRate: 3.24,
    revenue: 284750,
    testsRunning: 12,
    avgTestDuration: 14,
    significantResults: 8,
  };

  // Mock chart data for future chart implementation
  // const chartData: ChartData[] = [
  //   { date: '2024-01-01', visitors: 1200, conversions: 38, revenue: 4500 },
  //   { date: '2024-01-02', visitors: 1350, conversions: 42, revenue: 5200 },
  //   { date: '2024-01-03', visitors: 1100, conversions: 35, revenue: 4100 },
  //   { date: '2024-01-04', visitors: 1450, conversions: 48, revenue: 5800 },
  //   { date: '2024-01-05', visitors: 1600, conversions: 52, revenue: 6200 },
  //   { date: '2024-01-06', visitors: 1380, conversions: 45, revenue: 5400 },
  //   { date: '2024-01-07', visitors: 1520, conversions: 49, revenue: 5900 },
  // ];

  const industryBreakdown = [
    {
      name: 'SaaS',
      visitors: 18530,
      conversions: 601,
      revenue: 125400,
      growth: '+12.5%',
    },
    {
      name: 'E-commerce',
      visitors: 14250,
      conversions: 456,
      revenue: 89200,
      growth: '+8.3%',
    },
    {
      name: 'Healthcare',
      visitors: 8920,
      conversions: 178,
      revenue: 45600,
      growth: '+15.2%',
    },
    {
      name: 'FinTech',
      visitors: 5883,
      conversions: 147,
      revenue: 24550,
      growth: '+22.1%',
    },
  ];

  const topPerformingTests = [
    {
      name: 'Pricing Page CTA Button',
      improvement: '+18.4%',
      confidence: '99%',
      status: 'Winner',
    },
    {
      name: 'Homepage Hero Section',
      improvement: '+12.7%',
      confidence: '95%',
      status: 'Winner',
    },
    {
      name: 'Checkout Process Flow',
      improvement: '+9.3%',
      confidence: '98%',
      status: 'Running',
    },
    {
      name: 'Product Page Layout',
      improvement: '+15.8%',
      confidence: '97%',
      status: 'Winner',
    },
  ];

  return (
    <DashboardLayout title='Analytics - Universal AI Platform'>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>
              Analytics Dashboard
            </h1>
            <p className='text-sm text-gray-500 mt-1'>
              Real-time performance metrics and insights across all your
              experiments
            </p>
          </div>

          <div className='flex items-center space-x-3'>
            <select
              value={timeRange}
              onChange={e =>
                setTimeRange(e.target.value as '7d' | '30d' | '90d' | '1y')
              }
              className='border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            >
              <option value='7d'>Last 7 days</option>
              <option value='30d'>Last 30 days</option>
              <option value='90d'>Last 90 days</option>
              <option value='1y'>Last year</option>
            </select>
            <button className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium'>
              Export Report
            </button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6'>
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-gray-600'>
                  Total Visitors
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  {analyticsData.totalVisitors.toLocaleString()}
                </p>
                <p className='text-xs text-green-600 mt-1'>
                  ↗ +12.5% vs last period
                </p>
              </div>
              <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
                <svg
                  className='w-4 h-4 text-blue-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-gray-600'>
                  Conversion Rate
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  {analyticsData.conversionRate}%
                </p>
                <p className='text-xs text-green-600 mt-1'>
                  ↗ +0.8% vs last period
                </p>
              </div>
              <div className='w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center'>
                <svg
                  className='w-4 h-4 text-green-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-gray-600'>Revenue</p>
                <p className='text-2xl font-bold text-gray-900'>
                  ${analyticsData.revenue.toLocaleString()}
                </p>
                <p className='text-xs text-green-600 mt-1'>
                  ↗ +18.2% vs last period
                </p>
              </div>
              <div className='w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center'>
                <svg
                  className='w-4 h-4 text-purple-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-gray-600'>
                  Active Tests
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  {analyticsData.testsRunning}
                </p>
                <p className='text-xs text-blue-600 mt-1'>
                  4 ready for analysis
                </p>
              </div>
              <div className='w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center'>
                <svg
                  className='w-4 h-4 text-orange-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2V7a2 2 0 012-2h2a2 2 0 002 2v2a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 00-2 2v6a2 2 0 01-2 2H9z'
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-gray-600'>
                  Avg Test Duration
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  {analyticsData.avgTestDuration}d
                </p>
                <p className='text-xs text-gray-500 mt-1'>
                  Optimal range: 10-21d
                </p>
              </div>
              <div className='w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center'>
                <svg
                  className='w-4 h-4 text-indigo-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-gray-600'>
                  Significant Results
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  {analyticsData.significantResults}
                </p>
                <p className='text-xs text-green-600 mt-1'>67% success rate</p>
              </div>
              <div className='w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center'>
                <svg
                  className='w-4 h-4 text-emerald-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Performance Chart */}
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h3 className='text-lg font-semibold text-gray-900'>
                Performance Trends
              </h3>
              <div className='flex items-center space-x-2'>
                <button
                  onClick={() => setSelectedMetric('visitors')}
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    selectedMetric === 'visitors'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Visitors
                </button>
                <button
                  onClick={() => setSelectedMetric('conversions')}
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    selectedMetric === 'conversions'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Conversions
                </button>
                <button
                  onClick={() => setSelectedMetric('revenue')}
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    selectedMetric === 'revenue'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Revenue
                </button>
              </div>
            </div>

            {/* Simple chart representation */}
            <div className='h-64 bg-gray-50 rounded-lg flex items-center justify-center'>
              <div className='text-center'>
                <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3'>
                  <svg
                    className='w-8 h-8 text-blue-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2V7a2 2 0 012-2h2a2 2 0 002 2v2a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 00-2 2v6a2 2 0 01-2 2H9z'
                    />
                  </svg>
                </div>
                <p className='text-gray-600'>
                  Interactive {selectedMetric} chart
                </p>
                <p className='text-sm text-gray-500'>
                  Chart component integration ready
                </p>
              </div>
            </div>
          </div>

          {/* Industry Performance */}
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-6'>
              Industry Performance
            </h3>
            <div className='space-y-4'>
              {industryBreakdown.map((industry, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'
                >
                  <div className='flex-1'>
                    <div className='flex items-center justify-between mb-2'>
                      <h4 className='font-medium text-gray-900'>
                        {industry.name}
                      </h4>
                      <span className='text-sm font-medium text-green-600'>
                        {industry.growth}
                      </span>
                    </div>
                    <div className='grid grid-cols-3 gap-4 text-sm'>
                      <div>
                        <p className='text-gray-500'>Visitors</p>
                        <p className='font-medium'>
                          {industry.visitors.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className='text-gray-500'>Conversions</p>
                        <p className='font-medium'>{industry.conversions}</p>
                      </div>
                      <div>
                        <p className='text-gray-500'>Revenue</p>
                        <p className='font-medium'>
                          ${industry.revenue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Performing Tests */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-6'>
            <h3 className='text-lg font-semibold text-gray-900'>
              Top Performing Tests
            </h3>
            <button className='text-blue-600 hover:text-blue-700 text-sm font-medium'>
              View All Tests
            </button>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-gray-200'>
                  <th className='text-left py-3 px-4 font-medium text-gray-700'>
                    Test Name
                  </th>
                  <th className='text-left py-3 px-4 font-medium text-gray-700'>
                    Improvement
                  </th>
                  <th className='text-left py-3 px-4 font-medium text-gray-700'>
                    Confidence
                  </th>
                  <th className='text-left py-3 px-4 font-medium text-gray-700'>
                    Status
                  </th>
                  <th className='text-left py-3 px-4 font-medium text-gray-700'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {topPerformingTests.map((test, index) => (
                  <tr
                    key={index}
                    className='border-b border-gray-100 hover:bg-gray-50'
                  >
                    <td className='py-4 px-4'>
                      <p className='font-medium text-gray-900'>{test.name}</p>
                    </td>
                    <td className='py-4 px-4'>
                      <span className='text-green-600 font-medium'>
                        {test.improvement}
                      </span>
                    </td>
                    <td className='py-4 px-4'>
                      <span className='text-gray-900'>{test.confidence}</span>
                    </td>
                    <td className='py-4 px-4'>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          test.status === 'Winner'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {test.status}
                      </span>
                    </td>
                    <td className='py-4 px-4'>
                      <button className='text-blue-600 hover:text-blue-700 text-sm font-medium'>
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
