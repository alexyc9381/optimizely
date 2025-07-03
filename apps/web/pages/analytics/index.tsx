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
      <DashboardLayout title='Analytics - Optelo' data-oid='7ez.29e'>
        <div
          className='flex items-center justify-center h-64'
          data-oid='jwtpie4'
        >
          <div
            className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'
            data-oid='segmeej'
          ></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title='Analytics - Optelo' data-oid='xlnzut8'>
      <div className='space-y-6' data-oid=':nq4b6u'>
        {/* Header */}
        <div className='flex items-center justify-between' data-oid='z174lms'>
          <div data-oid='h8hypoi'>
            <h1 className='text-3xl font-bold text-gray-900' data-oid='ecy_d_w'>
              Analytics Dashboard
            </h1>
            <p className='text-gray-600 mt-1' data-oid='fxr9ro6'>
              Real-time performance metrics and insights across all your
              experiments
            </p>
          </div>

          <div className='flex items-center space-x-3' data-oid='s615a9-'>
            <div className='flex items-center space-x-2' data-oid='523errx'>
              <Calendar className='w-4 h-4 text-gray-500' data-oid='r1sv:kx' />
              <select
                value={timeRange}
                onChange={e => setTimeRange(e.target.value as any)}
                className='border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                data-oid='c781c-s'
              >
                <option value='7d' data-oid='2782l78'>
                  Last 7 days
                </option>
                <option value='30d' data-oid='fheg305'>
                  Last 30 days
                </option>
                <option value='90d' data-oid='07utj1.'>
                  Last 90 days
                </option>
                <option value='1y' data-oid='c.2o4.f'>
                  Last year
                </option>
              </select>
            </div>
            <button
              className='flex items-center space-x-2 border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors'
              data-oid='ay911ix'
            >
              <Filter className='w-4 h-4' data-oid='uekqu9w' />
              <span data-oid='gjteho-'>Filters</span>
            </button>
            <button
              className='flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
              data-oid='.uda3pn'
            >
              <Download className='w-4 h-4' data-oid='b1k_x6a' />
              <span data-oid='okvj.xb'>Export Report</span>
            </button>
          </div>
        </div>

        {error && (
          <div
            className='bg-red-50 border border-red-200 rounded-lg p-4'
            data-oid='p41.4ef'
          >
            <p className='text-red-800' data-oid='v8mt7dk'>
              {error}
            </p>
          </div>
        )}

        {/* Key Metrics Cards */}
        <div
          className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6'
          data-oid='h5pt-v4'
        >
          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
            data-oid='_n_qlbb'
          >
            <div
              className='flex items-center justify-between'
              data-oid='uuw-s08'
            >
              <div className='flex-1' data-oid='bt2mpg2'>
                <p
                  className='text-sm font-medium text-gray-600'
                  data-oid='6:rztqk'
                >
                  Total Visitors
                </p>
                <p
                  className='text-2xl font-bold text-gray-900'
                  data-oid='0df-mh5'
                >
                  {analyticsData
                    ? formatNumber(analyticsData.totalVisitors)
                    : '0'}
                </p>
                <p
                  className='text-xs text-green-600 mt-1 flex items-center'
                  data-oid='i7l19xf'
                >
                  <TrendingUp className='w-3 h-3 mr-1' data-oid='-i6c9f0' />
                  +12.5% vs last period
                </p>
              </div>
              <div
                className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'
                data-oid='vv:ci7e'
              >
                <Users className='w-5 h-5 text-blue-600' data-oid='yp.-we4' />
              </div>
            </div>
          </div>

          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
            data-oid='kvw:gru'
          >
            <div
              className='flex items-center justify-between'
              data-oid='-ym9kje'
            >
              <div className='flex-1' data-oid='sxqa3p4'>
                <p
                  className='text-sm font-medium text-gray-600'
                  data-oid='r5d:_35'
                >
                  Conversion Rate
                </p>
                <p
                  className='text-2xl font-bold text-gray-900'
                  data-oid='upjryf3'
                >
                  {analyticsData
                    ? formatPercentage(analyticsData.conversionRate)
                    : '0%'}
                </p>
                <p
                  className='text-xs text-green-600 mt-1 flex items-center'
                  data-oid='6ir60hl'
                >
                  <TrendingUp className='w-3 h-3 mr-1' data-oid='hwqxwmi' />
                  +0.8% vs last period
                </p>
              </div>
              <div
                className='w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center'
                data-oid='2cijbd:'
              >
                <Target className='w-5 h-5 text-green-600' data-oid='_0iyawn' />
              </div>
            </div>
          </div>

          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
            data-oid='wbtenkb'
          >
            <div
              className='flex items-center justify-between'
              data-oid='eqp:ql2'
            >
              <div className='flex-1' data-oid=':k:lde4'>
                <p
                  className='text-sm font-medium text-gray-600'
                  data-oid='e:fvh9x'
                >
                  Revenue
                </p>
                <p
                  className='text-2xl font-bold text-gray-900'
                  data-oid='szx017c'
                >
                  {analyticsData ? formatCurrency(analyticsData.revenue) : '$0'}
                </p>
                <p
                  className='text-xs text-green-600 mt-1 flex items-center'
                  data-oid='s4ho6.g'
                >
                  <TrendingUp className='w-3 h-3 mr-1' data-oid='zuzyt9g' />
                  +18.2% vs last period
                </p>
              </div>
              <div
                className='w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center'
                data-oid='.6j8x9n'
              >
                <DollarSign
                  className='w-5 h-5 text-green-600'
                  data-oid='cs8jw4_'
                />
              </div>
            </div>
          </div>

          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
            data-oid=':-_0ib3'
          >
            <div
              className='flex items-center justify-between'
              data-oid='eq0079n'
            >
              <div className='flex-1' data-oid=':7005wg'>
                <p
                  className='text-sm font-medium text-gray-600'
                  data-oid='_pnsk8u'
                >
                  Tests Running
                </p>
                <p
                  className='text-2xl font-bold text-gray-900'
                  data-oid='9vu_qx1'
                >
                  {analyticsData ? analyticsData.testsRunning : 0}
                </p>
                <p
                  className='text-xs text-blue-600 mt-1 flex items-center'
                  data-oid='he_n61v'
                >
                  <Activity className='w-3 h-3 mr-1' data-oid='6.0gjls' />
                  Active experiments
                </p>
              </div>
              <div
                className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'
                data-oid='npu.y7-'
              >
                <BarChart3
                  className='w-5 h-5 text-blue-600'
                  data-oid='kaxh8yb'
                />
              </div>
            </div>
          </div>

          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
            data-oid=':eu3i83'
          >
            <div
              className='flex items-center justify-between'
              data-oid='i9oo25l'
            >
              <div className='flex-1' data-oid='-3z8a7k'>
                <p
                  className='text-sm font-medium text-gray-600'
                  data-oid='5my7z5a'
                >
                  Avg. Duration
                </p>
                <p
                  className='text-2xl font-bold text-gray-900'
                  data-oid='o41yx-a'
                >
                  {analyticsData ? `${analyticsData.avgTestDuration}d` : '0d'}
                </p>
                <p className='text-xs text-gray-500 mt-1' data-oid='qitwxhc'>
                  Test duration
                </p>
              </div>
              <div
                className='w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center'
                data-oid='srl-5q0'
              >
                <Calendar
                  className='w-5 h-5 text-purple-600'
                  data-oid='._-g2vp'
                />
              </div>
            </div>
          </div>

          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
            data-oid='zqrj3xi'
          >
            <div
              className='flex items-center justify-between'
              data-oid='jmsmex8'
            >
              <div className='flex-1' data-oid='6ghakv3'>
                <p
                  className='text-sm font-medium text-gray-600'
                  data-oid='bh-cs0s'
                >
                  Significant Results
                </p>
                <p
                  className='text-2xl font-bold text-gray-900'
                  data-oid='4fjsuu-'
                >
                  {analyticsData ? analyticsData.significantResults : 0}
                </p>
                <p className='text-xs text-green-600 mt-1' data-oid='19e6yjs'>
                  95%+ confidence
                </p>
              </div>
              <div
                className='w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center'
                data-oid='00-rmmk'
              >
                <Target className='w-5 h-5 text-green-600' data-oid='6i8iit9' />
              </div>
            </div>
          </div>
        </div>

        {/* Chart Placeholder */}
        <div
          className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
          data-oid='pcr2ajc'
        >
          <div
            className='flex items-center justify-between mb-6'
            data-oid='.3omasv'
          >
            <div data-oid='bj0i:8u'>
              <h3
                className='text-lg font-semibold text-gray-900'
                data-oid='imc9p4b'
              >
                Performance Trends
              </h3>
              <p className='text-sm text-gray-500' data-oid='m._3anp'>
                {getTimeRangeLabel(timeRange)} performance overview
              </p>
            </div>
            <div className='flex items-center space-x-2' data-oid='uwhntb0'>
              <button
                onClick={() => setSelectedMetric('visitors')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === 'visitors'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                data-oid='.j8ifa5'
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
                data-oid='h8r6qyi'
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
                data-oid='e36cjpa'
              >
                Revenue
              </button>
            </div>
          </div>

          {/* Chart placeholder - would integrate with a charting library */}
          <div
            className='h-64 bg-gray-50 rounded-lg flex items-center justify-center'
            data-oid='12wur48'
          >
            <div className='text-center' data-oid='59sz39l'>
              <BarChart3
                className='w-12 h-12 text-gray-400 mx-auto mb-3'
                data-oid='0sm-_4p'
              />

              <p className='text-gray-500' data-oid='xe4yp:e'>
                Chart visualization for {selectedMetric}
              </p>
              <p className='text-sm text-gray-400 mt-1' data-oid='8pkhk_u'>
                Chart implementation with libraries like Chart.js or Recharts
              </p>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div
          className='grid grid-cols-1 lg:grid-cols-2 gap-6'
          data-oid='9.xvr81'
        >
          {/* Industry Breakdown */}
          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
            data-oid='7d55-t5'
          >
            <div
              className='flex items-center justify-between mb-6'
              data-oid='-kbe:i-'
            >
              <h3
                className='text-lg font-semibold text-gray-900'
                data-oid='q-1v2dq'
              >
                Industry Breakdown
              </h3>
              <span className='text-sm text-gray-500' data-oid='1_gpue-'>
                {getTimeRangeLabel(timeRange)}
              </span>
            </div>

            <div className='space-y-4' data-oid='b-s79bl'>
              {industryBreakdown.map((industry, index) => (
                <div
                  key={index}
                  className='border border-gray-200 rounded-lg p-4'
                  data-oid='xvbh4ta'
                >
                  <div
                    className='flex items-center justify-between mb-3'
                    data-oid='fpf7deo'
                  >
                    <div
                      className='flex items-center space-x-3'
                      data-oid='2iq_s:2'
                    >
                      <div
                        className={`w-3 h-3 rounded-full ${getIndustryColor(industry.color)}`}
                        data-oid='y47rhdw'
                      ></div>
                      <h4
                        className='font-medium text-gray-900'
                        data-oid='0_-7v5_'
                      >
                        {industry.name}
                      </h4>
                      <span
                        className='text-sm text-green-600 font-medium'
                        data-oid='au4cauq'
                      >
                        {industry.growth}
                      </span>
                    </div>
                    <div className='text-right' data-oid='epv4eev'>
                      <p
                        className='text-sm font-medium text-gray-900'
                        data-oid='dxce03:'
                      >
                        {formatCurrency(industry.revenue)}
                      </p>
                    </div>
                  </div>

                  <div
                    className='grid grid-cols-3 gap-4 text-sm'
                    data-oid='0l1psqz'
                  >
                    <div data-oid='x3ftx6y'>
                      <p className='text-gray-500' data-oid='ufk5sab'>
                        Visitors
                      </p>
                      <p
                        className='font-medium text-gray-900'
                        data-oid='70jh36z'
                      >
                        {formatNumber(industry.visitors)}
                      </p>
                    </div>
                    <div data-oid='r0-:q_8'>
                      <p className='text-gray-500' data-oid='eiy21:w'>
                        Conversions
                      </p>
                      <p
                        className='font-medium text-gray-900'
                        data-oid='riz2eax'
                      >
                        {formatNumber(industry.conversions)}
                      </p>
                    </div>
                    <div data-oid='7wonpt:'>
                      <p className='text-gray-500' data-oid='f-a6npo'>
                        Conv. Rate
                      </p>
                      <p
                        className='font-medium text-gray-900'
                        data-oid='1-n_l.m'
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
            data-oid='n8qak59'
          >
            <div
              className='flex items-center justify-between mb-6'
              data-oid='-ajt0u-'
            >
              <h3
                className='text-lg font-semibold text-gray-900'
                data-oid='b2t4v-9'
              >
                Top Performing Tests
              </h3>
              <button
                className='text-blue-600 hover:text-blue-700 text-sm font-medium'
                data-oid='_i869je'
              >
                View All →
              </button>
            </div>

            <div className='space-y-4' data-oid='7g6_2oj'>
              {topTests.map((test, index) => (
                <div
                  key={index}
                  className='border border-gray-200 rounded-lg p-4'
                  data-oid='qouwn2r'
                >
                  <div
                    className='flex items-start justify-between mb-2'
                    data-oid='dg2gvuk'
                  >
                    <div className='flex-1' data-oid='hgm7g7r'>
                      <h4
                        className='font-medium text-gray-900 mb-1'
                        data-oid='8qo3_lr'
                      >
                        {test.name}
                      </h4>
                      <div
                        className='flex items-center space-x-2'
                        data-oid='p2usax8'
                      >
                        <span
                          className='text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded'
                          data-oid='0vod2gg'
                        >
                          {test.industry}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            test.status === 'Winner'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                          data-oid='fh:iev6'
                        >
                          {test.status}
                        </span>
                      </div>
                    </div>
                    <div className='text-right' data-oid='678hbzx'>
                      <p
                        className='text-lg font-bold text-green-600'
                        data-oid='-3becwv'
                      >
                        {test.improvement}
                      </p>
                      <p className='text-xs text-gray-500' data-oid='e1-uvc2'>
                        {test.confidence} confidence
                      </p>
                    </div>
                  </div>

                  <div
                    className='bg-green-50 rounded-md p-2 mt-3'
                    data-oid='9rpqc58'
                  >
                    <div className='flex items-center' data-oid='0rl2jop'>
                      <TrendingUp
                        className='w-4 h-4 text-green-600 mr-2'
                        data-oid='w_39gwd'
                      />

                      <span
                        className='text-sm text-green-800'
                        data-oid='_q4c6ts'
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
          data-oid=':pd4h34'
        >
          <div className='flex items-start space-x-4' data-oid='rvb4ngl'>
            <div
              className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0'
              data-oid='f6yzzfo'
            >
              <Activity className='w-5 h-5 text-blue-600' data-oid='5-c3b6e' />
            </div>
            <div data-oid='n0-51sq'>
              <h3
                className='text-lg font-semibold text-gray-900 mb-2'
                data-oid='pk2bbhp'
              >
                AI-Powered Insights
              </h3>
              <div
                className='space-y-2 text-sm text-gray-700'
                data-oid='5.kkt0g'
              >
                <p data-oid='led0_4m'>
                  • Your SaaS industry tests are performing 15% above average
                  this period
                </p>
                <p data-oid='gia70qe'>
                  • Consider running more tests on checkout flows - they show
                  highest uplift potential
                </p>
                <p data-oid='4ni6u2d'>
                  • Mobile traffic has increased 23% but conversion rate is 8%
                  lower than desktop
                </p>
                <p data-oid='24t4rsf'>
                  • Tests with social proof elements are showing 31% higher
                  success rates
                </p>
              </div>
              <button
                className='mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium'
                data-oid='px1-o_2'
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
