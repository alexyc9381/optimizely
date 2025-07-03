import {
    Activity,
    BarChart3,
    Calendar,
    DollarSign,
    Download,
    Filter,
    Target,
    TrendingUp,
    Users
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import { formatCurrency, formatNumber, formatPercentage } from '../../lib/utils';
import { AnalyticsData, apiClient } from '../../src/services/apiClient';

// Interface for future chart implementation
// interface ChartData {
//   date: string;
//   visitors: number;
//   conversions: number;
//   revenue: number;
// }

const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'visitors' | 'conversions' | 'revenue'>('visitors');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [industryBreakdown, setIndustryBreakdown] = useState<any[]>([]);
  const [topTests, setTopTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load analytics data from backend
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [analytics, breakdown, tests] = await Promise.all([
          apiClient.getAnalytics(timeRange),
          apiClient.getIndustryBreakdown(timeRange),
          apiClient.getTopPerformingTests()
        ]);

        setAnalyticsData(analytics);
        setIndustryBreakdown(breakdown);
        setTopTests(tests);
      } catch (err) {
        setError('Failed to load analytics data');
        console.error('Error fetching analytics:', err);
        // Fallback to mock data
        setAnalyticsData(mockAnalyticsData);
        setIndustryBreakdown(mockIndustryBreakdown);
        setTopTests(mockTopTests);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  // Mock data fallback
  const mockAnalyticsData: AnalyticsData = {
    totalVisitors: 47583,
    conversionRate: 3.24,
    revenue: 284750,
    testsRunning: 12,
    avgTestDuration: 14,
    significantResults: 8,
  };

  const mockIndustryBreakdown = [
    {
      name: 'SaaS',
      visitors: 18530,
      conversions: 601,
      revenue: 125400,
      growth: '+12.5%',
      color: 'blue',
    },
    {
      name: 'E-commerce',
      visitors: 14250,
      conversions: 456,
      revenue: 89200,
      growth: '+8.3%',
      color: 'green',
    },
    {
      name: 'Healthcare',
      visitors: 8920,
      conversions: 178,
      revenue: 45600,
      growth: '+15.2%',
      color: 'purple',
    },
    {
      name: 'FinTech',
      visitors: 5883,
      conversions: 147,
      revenue: 24550,
      growth: '+22.1%',
      color: 'orange',
    },
  ];

  const mockTopTests = [
    {
      name: 'Pricing Page CTA Button',
      improvement: '+18.4%',
      confidence: '99%',
      status: 'Winner',
      industry: 'SaaS',
    },
    {
      name: 'Homepage Hero Section',
      improvement: '+12.7%',
      confidence: '95%',
      status: 'Winner',
      industry: 'E-commerce',
    },
    {
      name: 'Checkout Process Flow',
      improvement: '+9.3%',
      confidence: '98%',
      status: 'Running',
      industry: 'FinTech',
    },
    {
      name: 'Product Page Layout',
      improvement: '+15.8%',
      confidence: '97%',
      status: 'Winner',
      industry: 'Healthcare',
    },
  ];

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '7d': return 'Last 7 days';
      case '30d': return 'Last 30 days';
      case '90d': return 'Last 90 days';
      case '1y': return 'Last year';
      default: return 'Last 30 days';
    }
  };

  const getIndustryColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
    };
    return colors[color as keyof typeof colors] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <DashboardLayout title='Analytics - Optelo'>
        <div className='flex items-center justify-center h-64'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title='Analytics - Optelo'>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Analytics Dashboard</h1>
            <p className='text-gray-600 mt-1'>
              Real-time performance metrics and insights across all your experiments
            </p>
          </div>

          <div className='flex items-center space-x-3'>
            <div className='flex items-center space-x-2'>
              <Calendar className='w-4 h-4 text-gray-500' />
              <select
                value={timeRange}
                onChange={e => setTimeRange(e.target.value as any)}
                className='border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              >
                <option value='7d'>Last 7 days</option>
                <option value='30d'>Last 30 days</option>
                <option value='90d'>Last 90 days</option>
                <option value='1y'>Last year</option>
              </select>
            </div>
            <button className='flex items-center space-x-2 border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors'>
              <Filter className='w-4 h-4' />
              <span>Filters</span>
            </button>
            <button className='flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'>
              <Download className='w-4 h-4' />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {error && (
          <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
            <p className='text-red-800'>{error}</p>
          </div>
        )}

        {/* Key Metrics Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6'>
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center justify-between'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-gray-600'>Total Visitors</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {analyticsData ? formatNumber(analyticsData.totalVisitors) : '0'}
                </p>
                <p className='text-xs text-green-600 mt-1 flex items-center'>
                  <TrendingUp className='w-3 h-3 mr-1' />
                  +12.5% vs last period
                </p>
              </div>
              <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'>
                <Users className='w-5 h-5 text-blue-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center justify-between'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-gray-600'>Conversion Rate</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {analyticsData ? formatPercentage(analyticsData.conversionRate) : '0%'}
                </p>
                <p className='text-xs text-green-600 mt-1 flex items-center'>
                  <TrendingUp className='w-3 h-3 mr-1' />
                  +0.8% vs last period
                </p>
              </div>
              <div className='w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center'>
                <Target className='w-5 h-5 text-green-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center justify-between'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-gray-600'>Revenue</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {analyticsData ? formatCurrency(analyticsData.revenue) : '$0'}
                </p>
                <p className='text-xs text-green-600 mt-1 flex items-center'>
                  <TrendingUp className='w-3 h-3 mr-1' />
                  +18.2% vs last period
                </p>
              </div>
              <div className='w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center'>
                <DollarSign className='w-5 h-5 text-green-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center justify-between'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-gray-600'>Tests Running</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {analyticsData ? analyticsData.testsRunning : 0}
                </p>
                <p className='text-xs text-blue-600 mt-1 flex items-center'>
                  <Activity className='w-3 h-3 mr-1' />
                  Active experiments
                </p>
              </div>
              <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'>
                <BarChart3 className='w-5 h-5 text-blue-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center justify-between'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-gray-600'>Avg. Duration</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {analyticsData ? `${analyticsData.avgTestDuration}d` : '0d'}
                </p>
                <p className='text-xs text-gray-500 mt-1'>Test duration</p>
              </div>
              <div className='w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center'>
                <Calendar className='w-5 h-5 text-purple-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center justify-between'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-gray-600'>Significant Results</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {analyticsData ? analyticsData.significantResults : 0}
                </p>
                <p className='text-xs text-green-600 mt-1'>95%+ confidence</p>
              </div>
              <div className='w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center'>
                <Target className='w-5 h-5 text-green-600' />
              </div>
            </div>
          </div>
        </div>

        {/* Chart Placeholder */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h3 className='text-lg font-semibold text-gray-900'>Performance Trends</h3>
              <p className='text-sm text-gray-500'>
                {getTimeRangeLabel(timeRange)} performance overview
              </p>
            </div>
            <div className='flex items-center space-x-2'>
              <button
                onClick={() => setSelectedMetric('visitors')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === 'visitors'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Visitors
              </button>
              <button
                onClick={() => setSelectedMetric('conversions')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === 'conversions'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Conversions
              </button>
              <button
                onClick={() => setSelectedMetric('revenue')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === 'revenue'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Revenue
              </button>
            </div>
          </div>

          {/* Chart placeholder - would integrate with a charting library */}
          <div className='h-64 bg-gray-50 rounded-lg flex items-center justify-center'>
            <div className='text-center'>
              <BarChart3 className='w-12 h-12 text-gray-400 mx-auto mb-3' />
              <p className='text-gray-500'>Chart visualization for {selectedMetric}</p>
              <p className='text-sm text-gray-400 mt-1'>
                Chart implementation with libraries like Chart.js or Recharts
              </p>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Industry Breakdown */}
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h3 className='text-lg font-semibold text-gray-900'>Industry Breakdown</h3>
              <span className='text-sm text-gray-500'>{getTimeRangeLabel(timeRange)}</span>
            </div>

            <div className='space-y-4'>
              {industryBreakdown.map((industry, index) => (
                <div key={index} className='border border-gray-200 rounded-lg p-4'>
                  <div className='flex items-center justify-between mb-3'>
                    <div className='flex items-center space-x-3'>
                      <div className={`w-3 h-3 rounded-full ${getIndustryColor(industry.color)}`}></div>
                      <h4 className='font-medium text-gray-900'>{industry.name}</h4>
                      <span className='text-sm text-green-600 font-medium'>{industry.growth}</span>
                    </div>
                    <div className='text-right'>
                      <p className='text-sm font-medium text-gray-900'>
                        {formatCurrency(industry.revenue)}
                      </p>
                    </div>
                  </div>

                  <div className='grid grid-cols-3 gap-4 text-sm'>
                    <div>
                      <p className='text-gray-500'>Visitors</p>
                      <p className='font-medium text-gray-900'>{formatNumber(industry.visitors)}</p>
                    </div>
                    <div>
                      <p className='text-gray-500'>Conversions</p>
                      <p className='font-medium text-gray-900'>{formatNumber(industry.conversions)}</p>
                    </div>
                    <div>
                      <p className='text-gray-500'>Conv. Rate</p>
                      <p className='font-medium text-gray-900'>
                        {formatPercentage((industry.conversions / industry.visitors) * 100)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performing Tests */}
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h3 className='text-lg font-semibold text-gray-900'>Top Performing Tests</h3>
              <button className='text-blue-600 hover:text-blue-700 text-sm font-medium'>
                View All →
              </button>
            </div>

            <div className='space-y-4'>
              {topTests.map((test, index) => (
                <div key={index} className='border border-gray-200 rounded-lg p-4'>
                  <div className='flex items-start justify-between mb-2'>
                    <div className='flex-1'>
                      <h4 className='font-medium text-gray-900 mb-1'>{test.name}</h4>
                      <div className='flex items-center space-x-2'>
                        <span className='text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded'>
                          {test.industry}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          test.status === 'Winner'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {test.status}
                        </span>
                      </div>
                    </div>
                    <div className='text-right'>
                      <p className='text-lg font-bold text-green-600'>{test.improvement}</p>
                      <p className='text-xs text-gray-500'>{test.confidence} confidence</p>
                    </div>
                  </div>

                  <div className='bg-green-50 rounded-md p-2 mt-3'>
                    <div className='flex items-center'>
                      <TrendingUp className='w-4 h-4 text-green-600 mr-2' />
                      <span className='text-sm text-green-800'>
                        Significant improvement detected
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Insights Section */}
        <div className='bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6'>
          <div className='flex items-start space-x-4'>
            <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0'>
              <Activity className='w-5 h-5 text-blue-600' />
            </div>
            <div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>AI-Powered Insights</h3>
              <div className='space-y-2 text-sm text-gray-700'>
                <p>• Your SaaS industry tests are performing 15% above average this period</p>
                <p>• Consider running more tests on checkout flows - they show highest uplift potential</p>
                <p>• Mobile traffic has increased 23% but conversion rate is 8% lower than desktop</p>
                <p>• Tests with social proof elements are showing 31% higher success rates</p>
              </div>
              <button className='mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium'>
                View Detailed Insights →
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
