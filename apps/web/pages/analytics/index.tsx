import {
  Activity,
  BarChart3,
  Calendar,
  DollarSign,
  Download,
  Filter,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
} from '../../lib/utils';
import { AnalyticsData, apiClient } from '../../src/services/apiClient';

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
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
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
          apiClient.getTopPerformingTests(),
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
      case '7d':
        return 'Last 7 days';
      case '30d':
        return 'Last 30 days';
      case '90d':
        return 'Last 90 days';
      case '1y':
        return 'Last year';
      default:
        return 'Last 30 days';
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
      <DashboardLayout title='Analytics - Optelo' data-oid='ac5oexh'>
        <div
          className='flex items-center justify-center h-64'
          data-oid='6xz5fn9'
        >
          <div
            className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'
            data-oid='xc:9cxg'
          ></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title='Analytics - Optelo' data-oid='r85hs8v'>
      <div className='space-y-6' data-oid='bdlw2hf'>
        {/* Header */}
        <div className='flex items-center justify-between' data-oid='eq.q.6d'>
          <div data-oid='ey9cg-t'>
            <h1 className='text-3xl font-bold text-gray-900' data-oid='bowyalf'>
              Analytics Dashboard
            </h1>
            <p className='text-gray-600 mt-1' data-oid='f3tc-1d'>
              Real-time performance metrics and insights across all your
              experiments
            </p>
          </div>

          <div className='flex items-center space-x-3' data-oid=':8bx2m9'>
            <div className='flex items-center space-x-2' data-oid='12ji8or'>
              <Calendar className='w-4 h-4 text-gray-500' data-oid='gpmg1uk' />
              <select
                value={timeRange}
                onChange={e => setTimeRange(e.target.value as any)}
                className='border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                data-oid='fykt4jt'
              >
                <option value='7d' data-oid='j_j95a5'>
                  Last 7 days
                </option>
                <option value='30d' data-oid='cste1c7'>
                  Last 30 days
                </option>
                <option value='90d' data-oid='l_1v5si'>
                  Last 90 days
                </option>
                <option value='1y' data-oid='2n2.u8t'>
                  Last year
                </option>
              </select>
            </div>
            <button
              className='flex items-center space-x-2 border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors'
              data-oid='n.q8hp8'
            >
              <Filter className='w-4 h-4' data-oid='eyi9xzt' />
              <span data-oid='2vsquri'>Filters</span>
            </button>
            <button
              className='flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
              data-oid='-bzd1a3'
            >
              <Download className='w-4 h-4' data-oid='igt-3vl' />
              <span data-oid='w4:::y:'>Export Report</span>
            </button>
          </div>
        </div>

        {error && (
          <div
            className='bg-red-50 border border-red-200 rounded-lg p-4'
            data-oid='xk--7_1'
          >
            <p className='text-red-800' data-oid='8nwc1yu'>
              {error}
            </p>
          </div>
        )}

        {/* Key Metrics Cards */}
        <div
          className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6'
          data-oid='iyvo7xb'
        >
          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
            data-oid='nidismj'
          >
            <div
              className='flex items-center justify-between'
              data-oid='sn94d_-'
            >
              <div className='flex-1' data-oid='e11j7kg'>
                <p
                  className='text-sm font-medium text-gray-600'
                  data-oid='.yejjo8'
                >
                  Total Visitors
                </p>
                <p
                  className='text-2xl font-bold text-gray-900'
                  data-oid='pe6t8zz'
                >
                  {analyticsData
                    ? formatNumber(analyticsData.totalVisitors)
                    : '0'}
                </p>
                <p
                  className='text-xs text-green-600 mt-1 flex items-center'
                  data-oid='gbiooox'
                >
                  <TrendingUp className='w-3 h-3 mr-1' data-oid='tzyld7k' />
                  +12.5% vs last period
                </p>
              </div>
              <div
                className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'
                data-oid='4hx3wy4'
              >
                <Users className='w-5 h-5 text-blue-600' data-oid='f_0zxr1' />
              </div>
            </div>
          </div>

          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
            data-oid='97kkkxf'
          >
            <div
              className='flex items-center justify-between'
              data-oid='y:kix08'
            >
              <div className='flex-1' data-oid='w_drjjv'>
                <p
                  className='text-sm font-medium text-gray-600'
                  data-oid='t96t-qv'
                >
                  Conversion Rate
                </p>
                <p
                  className='text-2xl font-bold text-gray-900'
                  data-oid='tco30bi'
                >
                  {analyticsData
                    ? formatPercentage(analyticsData.conversionRate)
                    : '0%'}
                </p>
                <p
                  className='text-xs text-green-600 mt-1 flex items-center'
                  data-oid='-gozvzn'
                >
                  <TrendingUp className='w-3 h-3 mr-1' data-oid='mitq4zl' />
                  +0.8% vs last period
                </p>
              </div>
              <div
                className='w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center'
                data-oid='8qmvzp2'
              >
                <Target className='w-5 h-5 text-green-600' data-oid='ily5o_b' />
              </div>
            </div>
          </div>

          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
            data-oid='9f_.emg'
          >
            <div
              className='flex items-center justify-between'
              data-oid='uuhbahl'
            >
              <div className='flex-1' data-oid='1k16s9b'>
                <p
                  className='text-sm font-medium text-gray-600'
                  data-oid='6uvu3uh'
                >
                  Revenue
                </p>
                <p
                  className='text-2xl font-bold text-gray-900'
                  data-oid='uf2q2jp'
                >
                  {analyticsData ? formatCurrency(analyticsData.revenue) : '$0'}
                </p>
                <p
                  className='text-xs text-green-600 mt-1 flex items-center'
                  data-oid='7pyq5bq'
                >
                  <TrendingUp className='w-3 h-3 mr-1' data-oid='kl:8p9d' />
                  +18.2% vs last period
                </p>
              </div>
              <div
                className='w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center'
                data-oid='-mi912e'
              >
                <DollarSign
                  className='w-5 h-5 text-green-600'
                  data-oid='v7y2-u1'
                />
              </div>
            </div>
          </div>

          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
            data-oid='2pc83m8'
          >
            <div
              className='flex items-center justify-between'
              data-oid='8zhod:m'
            >
              <div className='flex-1' data-oid='b7hsf6f'>
                <p
                  className='text-sm font-medium text-gray-600'
                  data-oid='qffayo3'
                >
                  Tests Running
                </p>
                <p
                  className='text-2xl font-bold text-gray-900'
                  data-oid='pd3.x56'
                >
                  {analyticsData ? analyticsData.testsRunning : 0}
                </p>
                <p
                  className='text-xs text-blue-600 mt-1 flex items-center'
                  data-oid='5rmuv4c'
                >
                  <Activity className='w-3 h-3 mr-1' data-oid='27clz_n' />
                  Active experiments
                </p>
              </div>
              <div
                className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'
                data-oid='i8t5ty6'
              >
                <BarChart3
                  className='w-5 h-5 text-blue-600'
                  data-oid='-efdy0o'
                />
              </div>
            </div>
          </div>

          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
            data-oid='vj_hb13'
          >
            <div
              className='flex items-center justify-between'
              data-oid='3swhfkw'
            >
              <div className='flex-1' data-oid='qambedd'>
                <p
                  className='text-sm font-medium text-gray-600'
                  data-oid='v.qimig'
                >
                  Avg. Duration
                </p>
                <p
                  className='text-2xl font-bold text-gray-900'
                  data-oid='al-thlh'
                >
                  {analyticsData ? `${analyticsData.avgTestDuration}d` : '0d'}
                </p>
                <p className='text-xs text-gray-500 mt-1' data-oid='fen2rwo'>
                  Test duration
                </p>
              </div>
              <div
                className='w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center'
                data-oid='srg02zj'
              >
                <Calendar
                  className='w-5 h-5 text-purple-600'
                  data-oid='06jys67'
                />
              </div>
            </div>
          </div>

          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
            data-oid='mw5flue'
          >
            <div
              className='flex items-center justify-between'
              data-oid='34k5p9f'
            >
              <div className='flex-1' data-oid='wpik8:o'>
                <p
                  className='text-sm font-medium text-gray-600'
                  data-oid='3oz4k7j'
                >
                  Significant Results
                </p>
                <p
                  className='text-2xl font-bold text-gray-900'
                  data-oid='5ebg0r8'
                >
                  {analyticsData ? analyticsData.significantResults : 0}
                </p>
                <p className='text-xs text-green-600 mt-1' data-oid='l0.ovmk'>
                  95%+ confidence
                </p>
              </div>
              <div
                className='w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center'
                data-oid='2ilea74'
              >
                <Target className='w-5 h-5 text-green-600' data-oid='77s5yc-' />
              </div>
            </div>
          </div>
        </div>

        {/* Chart Placeholder */}
        <div
          className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
          data-oid='d-y3.pu'
        >
          <div
            className='flex items-center justify-between mb-6'
            data-oid='pj.ycua'
          >
            <div data-oid='zz9:pi2'>
              <h3
                className='text-lg font-semibold text-gray-900'
                data-oid='sk43:xn'
              >
                Performance Trends
              </h3>
              <p className='text-sm text-gray-500' data-oid='ifzixyj'>
                {getTimeRangeLabel(timeRange)} performance overview
              </p>
            </div>
            <div className='flex items-center space-x-2' data-oid='4.mgefx'>
              <button
                onClick={() => setSelectedMetric('visitors')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === 'visitors'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                data-oid='haa4zl5'
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
                data-oid='cnsn76k'
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
                data-oid='fkup5hn'
              >
                Revenue
              </button>
            </div>
          </div>

          {/* Chart placeholder - would integrate with a charting library */}
          <div
            className='h-64 bg-gray-50 rounded-lg flex items-center justify-center'
            data-oid='8bx:-fp'
          >
            <div className='text-center' data-oid='ftwxwo-'>
              <BarChart3
                className='w-12 h-12 text-gray-400 mx-auto mb-3'
                data-oid='4fn-8hi'
              />

              <p className='text-gray-500' data-oid='5pams31'>
                Chart visualization for {selectedMetric}
              </p>
              <p className='text-sm text-gray-400 mt-1' data-oid='ccdifte'>
                Chart implementation with libraries like Chart.js or Recharts
              </p>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div
          className='grid grid-cols-1 lg:grid-cols-2 gap-6'
          data-oid='kku7ft5'
        >
          {/* Industry Breakdown */}
          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
            data-oid='y0g2h2h'
          >
            <div
              className='flex items-center justify-between mb-6'
              data-oid='3:.nqru'
            >
              <h3
                className='text-lg font-semibold text-gray-900'
                data-oid='4jj8:9y'
              >
                Industry Breakdown
              </h3>
              <span className='text-sm text-gray-500' data-oid='3jr7t1p'>
                {getTimeRangeLabel(timeRange)}
              </span>
            </div>

            <div className='space-y-4' data-oid='6br73p4'>
              {industryBreakdown.map((industry, index) => (
                <div
                  key={index}
                  className='border border-gray-200 rounded-lg p-4'
                  data-oid='2uif9oe'
                >
                  <div
                    className='flex items-center justify-between mb-3'
                    data-oid='2j3_z7j'
                  >
                    <div
                      className='flex items-center space-x-3'
                      data-oid='1xuc2jp'
                    >
                      <div
                        className={`w-3 h-3 rounded-full ${getIndustryColor(industry.color)}`}
                        data-oid='uxb7jhg'
                      ></div>
                      <h4
                        className='font-medium text-gray-900'
                        data-oid='i5woq.m'
                      >
                        {industry.name}
                      </h4>
                      <span
                        className='text-sm text-green-600 font-medium'
                        data-oid='-_3h26l'
                      >
                        {industry.growth}
                      </span>
                    </div>
                    <div className='text-right' data-oid='jsmla3x'>
                      <p
                        className='text-sm font-medium text-gray-900'
                        data-oid='vyp._t0'
                      >
                        {formatCurrency(industry.revenue)}
                      </p>
                    </div>
                  </div>

                  <div
                    className='grid grid-cols-3 gap-4 text-sm'
                    data-oid='sh3vf2l'
                  >
                    <div data-oid='_7pf9jp'>
                      <p className='text-gray-500' data-oid='7dbiq0.'>
                        Visitors
                      </p>
                      <p
                        className='font-medium text-gray-900'
                        data-oid='9.c6:.b'
                      >
                        {formatNumber(industry.visitors)}
                      </p>
                    </div>
                    <div data-oid='vo.:4zb'>
                      <p className='text-gray-500' data-oid='39ghqwk'>
                        Conversions
                      </p>
                      <p
                        className='font-medium text-gray-900'
                        data-oid='.di-:zv'
                      >
                        {formatNumber(industry.conversions)}
                      </p>
                    </div>
                    <div data-oid='fm-2zfn'>
                      <p className='text-gray-500' data-oid='ucbmq00'>
                        Conv. Rate
                      </p>
                      <p
                        className='font-medium text-gray-900'
                        data-oid='7-qz:da'
                      >
                        {formatPercentage(
                          (industry.conversions / industry.visitors) * 100
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performing Tests */}
          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
            data-oid='nwu30g9'
          >
            <div
              className='flex items-center justify-between mb-6'
              data-oid='i3p-vrc'
            >
              <h3
                className='text-lg font-semibold text-gray-900'
                data-oid='0j3pujz'
              >
                Top Performing Tests
              </h3>
              <button
                className='text-blue-600 hover:text-blue-700 text-sm font-medium'
                data-oid='-lzanrn'
              >
                View All →
              </button>
            </div>

            <div className='space-y-4' data-oid='0_q4rp8'>
              {topTests.map((test, index) => (
                <div
                  key={index}
                  className='border border-gray-200 rounded-lg p-4'
                  data-oid='awfofjb'
                >
                  <div
                    className='flex items-start justify-between mb-2'
                    data-oid='-0vatti'
                  >
                    <div className='flex-1' data-oid='m3y6tgo'>
                      <h4
                        className='font-medium text-gray-900 mb-1'
                        data-oid='qz5hf.d'
                      >
                        {test.name}
                      </h4>
                      <div
                        className='flex items-center space-x-2'
                        data-oid='e.5rnwn'
                      >
                        <span
                          className='text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded'
                          data-oid='k4-5_zv'
                        >
                          {test.industry}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            test.status === 'Winner'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                          data-oid='f:puned'
                        >
                          {test.status}
                        </span>
                      </div>
                    </div>
                    <div className='text-right' data-oid='xsscuhm'>
                      <p
                        className='text-lg font-bold text-green-600'
                        data-oid='xvsiamn'
                      >
                        {test.improvement}
                      </p>
                      <p className='text-xs text-gray-500' data-oid='e..4awx'>
                        {test.confidence} confidence
                      </p>
                    </div>
                  </div>

                  <div
                    className='bg-green-50 rounded-md p-2 mt-3'
                    data-oid='af2a34j'
                  >
                    <div className='flex items-center' data-oid='pt7xzsj'>
                      <TrendingUp
                        className='w-4 h-4 text-green-600 mr-2'
                        data-oid='su.xskt'
                      />

                      <span
                        className='text-sm text-green-800'
                        data-oid='tb6zti5'
                      >
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
        <div
          className='bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6'
          data-oid='2m:6ed3'
        >
          <div className='flex items-start space-x-4' data-oid='0y_d1rz'>
            <div
              className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0'
              data-oid='0569dkh'
            >
              <Activity className='w-5 h-5 text-blue-600' data-oid='4zxt1rz' />
            </div>
            <div data-oid='hj8u1p6'>
              <h3
                className='text-lg font-semibold text-gray-900 mb-2'
                data-oid='ogfvub-'
              >
                AI-Powered Insights
              </h3>
              <div
                className='space-y-2 text-sm text-gray-700'
                data-oid='80qqs4f'
              >
                <p data-oid='paj:gf-'>
                  • Your SaaS industry tests are performing 15% above average
                  this period
                </p>
                <p data-oid='zn1f95a'>
                  • Consider running more tests on checkout flows - they show
                  highest uplift potential
                </p>
                <p data-oid='u_nkqda'>
                  • Mobile traffic has increased 23% but conversion rate is 8%
                  lower than desktop
                </p>
                <p data-oid='6:be:ar'>
                  • Tests with social proof elements are showing 31% higher
                  success rates
                </p>
              </div>
              <button
                className='mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium'
                data-oid='hmwwstq'
              >
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
