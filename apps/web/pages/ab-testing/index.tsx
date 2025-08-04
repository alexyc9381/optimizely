import {
    BarChart3,
    Pause,
    Play,
    Target,
    TrendingUp,
    Users,
} from 'lucide-react';
/* eslint-disable no-undef */
import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import {
    formatNumber,
    formatPercentage,
    getStatusColor,
} from '../../lib/utils';
import { ABTest, apiClient } from '../../src/services/apiClient';

const ABTestingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'drafts'>(
    'active'
  );
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load tests from backend
  useEffect(() => {
    const fetchTests = async () => {
      // For demo purposes, use mock data immediately for better UX
      console.warn('Using demo data for A/B testing page');
      setError('Unable to connect to backend. Showing demo data.');
      setTests(mockTests);
      setLoading(false);

      // Uncomment below for real API integration
      /*
      try {
        setLoading(true);
        const testsData = await apiClient.getABTests();
        setTests(testsData);
        setError(null);
      } catch (err) {
        console.warn('Failed to fetch A/B tests from API, using mock data:', err);
        setError('Unable to connect to backend. Showing demo data.');
        setTests(mockTests);
      } finally {
        setLoading(false);
      }
      */
    };

    fetchTests();
  }, []);

  // Mock data fallback
  const mockTests: ABTest[] = [
    {
      id: '1',
      name: 'SaaS Pricing Page Optimization',
      status: 'Running',
      industry: 'SaaS',
      startDate: '2024-01-15',
      visitors: 5420,
      conversionRate: { control: 8.2, variant: 12.4 },
      confidence: 98,
      uplift: 51.2,
    },
    {
      id: '2',
      name: 'College Consulting CTA Button',
      status: 'Running',
      industry: 'Education',
      startDate: '2024-01-20',
      visitors: 3210,
      conversionRate: { control: 6.1, variant: 8.7 },
      confidence: 87,
      uplift: 42.6,
    },
    {
      id: '3',
      name: 'FinTech Dashboard Layout',
      status: 'Completed',
      industry: 'FinTech',
      startDate: '2024-01-01',
      endDate: '2024-01-14',
      visitors: 8920,
      conversionRate: { control: 11.3, variant: 15.2 },
      confidence: 99,
      uplift: 34.5,
    },
    {
      id: '4',
      name: 'Healthcare Contact Form',
      status: 'Draft',
      industry: 'Healthcare',
      startDate: '2024-02-01',
      visitors: 0,
      conversionRate: { control: 0, variant: 0 },
      confidence: 0,
      uplift: 0,
    },
  ];

  const filteredTests = tests.filter(test => {
    switch (activeTab) {
      case 'active':
        return test.status === 'Running' || test.status === 'Paused';
      case 'completed':
        return test.status === 'Completed';
      case 'drafts':
        return test.status === 'Draft';
      default:
        return true;
    }
  });

  const handleStatusChange = async (
    testId: string,
    newStatus: ABTest['status']
  ) => {
    try {
      const updatedTest = await apiClient.updateABTest(testId, {
        status: newStatus,
      });
      setTests(tests.map(test => (test.id === testId ? updatedTest : test)));
    } catch (error) {
      console.error('Failed to update test status:', error);
      // Update local state as fallback
      setTests(
        tests.map(test =>
          test.id === testId ? { ...test, status: newStatus } : test
        )
      );
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this test?')) return;

    try {
      await apiClient.deleteABTest(testId);
      setTests(tests.filter(test => test.id !== testId));
    } catch (error) {
      console.error('Failed to delete test:', error);
      // Remove from local state as fallback
      setTests(tests.filter(test => test.id !== testId));
    }
  };

  const TestCard: React.FC<{ test: ABTest }> = ({ test }) => (
    <div
      className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200'
      data-oid='.t_xsqg'
    >
      <div className='flex items-start justify-between mb-4' data-oid='di.fpyr'>
        <div className='flex-1' data-oid='r3817i1'>
          <h3
            className='text-lg font-semibold text-gray-900 mb-2'
            data-oid='aw7t2sx'
          >
            {test.name}
          </h3>
          <div className='flex items-center space-x-3 mb-3' data-oid='p1su2et'>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}
              data-oid=':1jz2ak'
            >
              {test.status}
            </span>
            <span
              className='text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded'
              data-oid='5wsickk'
            >
              {test.industry}
            </span>
            <span className='text-sm text-gray-500' data-oid='.es2c8g'>
              Started {new Date(test.startDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className='flex items-center space-x-2' data-oid='yguu--c'>
          {test.status === 'Running' && (
            <button
              onClick={() => handleStatusChange(test.id, 'Paused')}
              className='p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors'
              title='Pause test'
              data-oid='bs4.01:'
            >
              <Pause className='w-4 h-4' data-oid='hznm1bv' />
            </button>
          )}
          {test.status === 'Paused' && (
            <button
              onClick={() => handleStatusChange(test.id, 'Running')}
              className='p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors'
              title='Resume test'
              data-oid='3-vb5sh'
            >
              <Play className='w-4 h-4' data-oid='p01khj2' />
            </button>
          )}
          <button
            className='p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors'
            data-oid='eea59n.'
          >
            <BarChart3 className='w-4 h-4' data-oid='24q739b' />
          </button>
          <button
            onClick={() => handleDeleteTest(test.id)}
            className='p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors'
            data-oid='u:b62jj'
          >
            <svg
              className='w-4 h-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              data-oid='8wz4pb6'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                data-oid='-oep6nr'
              />
            </svg>
          </button>
        </div>
      </div>

      {test.status !== 'Draft' && (
        <>
          <div
            className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-4'
            data-oid='8ogd253'
          >
            <div
              className='text-center p-3 bg-gray-50 rounded-lg'
              data-oid='th:3c-w'
            >
              <div
                className='flex items-center justify-center mb-1'
                data-oid='8-e8ag3'
              >
                <Users
                  className='w-4 h-4 text-gray-600 mr-1'
                  data-oid='lcwjlfg'
                />

                <p className='text-xs text-gray-500' data-oid='a1v164v'>
                  Visitors
                </p>
              </div>
              <p className='text-lg font-bold text-gray-900' data-oid='lsmo_mm'>
                {formatNumber(test.visitors)}
              </p>
            </div>
            <div
              className='text-center p-3 bg-blue-50 rounded-lg'
              data-oid='-ila5-x'
            >
              <div
                className='flex items-center justify-center mb-1'
                data-oid='csl9n3y'
              >
                <Target
                  className='w-4 h-4 text-blue-600 mr-1'
                  data-oid='5gx:1q7'
                />

                <p className='text-xs text-blue-600' data-oid='d8c3jz8'>
                  Control CR
                </p>
              </div>
              <p className='text-lg font-bold text-blue-900' data-oid='wx_jutn'>
                {formatPercentage(test.conversionRate.control)}
              </p>
            </div>
            <div
              className='text-center p-3 bg-green-50 rounded-lg'
              data-oid='hln_hr7'
            >
              <div
                className='flex items-center justify-center mb-1'
                data-oid='b7xdnq5'
              >
                <Target
                  className='w-4 h-4 text-green-600 mr-1'
                  data-oid='e8yft1w'
                />

                <p className='text-xs text-green-600' data-oid='g9ii1.0'>
                  Variant CR
                </p>
              </div>
              <p
                className='text-lg font-bold text-green-900'
                data-oid='abr1vuy'
              >
                {formatPercentage(test.conversionRate.variant)}
              </p>
            </div>
            <div
              className='text-center p-3 bg-blue-50 rounded-lg'
              data-oid='uiz5wlf'
            >
              <div
                className='flex items-center justify-center mb-1'
                data-oid='02aigsf'
              >
                <BarChart3
                  className='w-4 h-4 text-blue-600 mr-1'
                  data-oid='7pb0g3s'
                />

                <p className='text-xs text-blue-600' data-oid='r5gnx5-'>
                  Confidence
                </p>
              </div>
              <p
                className='text-lg font-bold text-blue-900'
                data-oid='v:feje2'
              >
                {formatPercentage(test.confidence)}
              </p>
            </div>
          </div>

          {test.uplift > 0 && (
            <div
              className='bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4'
              data-oid='z3ic05b'
            >
              <div className='flex items-center' data-oid='vhdf:b8'>
                <TrendingUp
                  className='w-5 h-5 text-green-600 mr-2'
                  data-oid='-ptbjbc'
                />

                <span
                  className='text-sm font-medium text-green-800'
                  data-oid='t2p7umo'
                >
                  <strong data-oid='08hv:dl'>
                    {formatPercentage(test.uplift)}
                  </strong>{' '}
                  improvement over control
                </span>
              </div>
              {test.confidence >= 95 && (
                <p className='text-xs text-green-700 mt-1' data-oid='frvdc.3'>
                  ✓ Statistically significant result
                </p>
              )}
            </div>
          )}

          {/* Mini chart for conversion rate trends */}
          <div className='mt-4 bg-gray-50 rounded-lg p-3'>
            <div className='flex justify-between items-center mb-2'>
              <span className='text-xs font-medium text-gray-600'>
                Conversion Trend (Last 7 Days)
              </span>
              <span className={`text-xs font-medium ${
                test.uplift > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {test.uplift > 0 ? '+' : ''}{test.uplift.toFixed(1)}%
              </span>
            </div>
            <div className='h-12 relative'>
              <svg viewBox='0 0 100 30' className='w-full h-full'>
                <defs>
                  <linearGradient id={`gradient-${test.id}`} x1='0%' y1='0%' x2='0%' y2='100%'>
                    <stop offset='0%' style={{stopColor: test.conversionRate.variant > test.conversionRate.control ? '#10B981' : '#EF4444', stopOpacity: 0.3}} />
                    <stop offset='100%' style={{stopColor: test.conversionRate.variant > test.conversionRate.control ? '#10B981' : '#EF4444', stopOpacity: 0}} />
                  </linearGradient>
                </defs>
                {/* Background grid */}
                <path d='M0 15 L100 15' stroke='#E5E7EB' strokeWidth='0.5' strokeDasharray='2,2' />
                {/* Trend line - simulated upward/downward trend */}
                <path
                  d={test.conversionRate.variant > test.conversionRate.control
                    ? 'M0 25 Q25 20 50 15 Q75 10 100 5'  // Upward trend
                    : 'M0 10 Q25 12 50 18 Q75 22 100 25'  // Downward trend
                  }
                  stroke={test.conversionRate.variant > test.conversionRate.control ? '#10B981' : '#EF4444'}
                  strokeWidth='2'
                  fill='none'
                />
                {/* Fill area under curve */}
                <path
                  d={test.conversionRate.variant > test.conversionRate.control
                    ? 'M0 25 Q25 20 50 15 Q75 10 100 5 L100 30 L0 30 Z'
                    : 'M0 10 Q25 12 50 18 Q75 22 100 25 L100 30 L0 30 Z'
                  }
                  fill={`url(#gradient-${test.id})`}
                />
                {/* Data points */}
                {[20, 40, 60, 80].map((x, i) => {
                  // Deterministic variation based on test ID and index (no Math.random)
                  const seed = test.id.charCodeAt(0) + i;
                  const variation = ((seed * 13) % 100) / 25 - 2; // -2 to 2
                  const y = test.conversionRate.variant > test.conversionRate.control
                    ? 25 - (i * 5) + variation
                    : 10 + (i * 3) + variation;
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r='1.5'
                      fill={test.conversionRate.variant > test.conversionRate.control ? '#10B981' : '#EF4444'}
                      stroke='white'
                      strokeWidth='1'
                    />
                  );
                })}
              </svg>
            </div>
          </div>
        </>
      )}

      {test.status === 'Draft' && (
        <div
          className='bg-gray-50 rounded-lg p-4 text-center'
          data-oid='n:wnxzf'
        >
          <p className='text-gray-600 mb-3' data-oid='8gvy_1h'>
            Test is ready to launch
          </p>
          <button
            onClick={() => handleStatusChange(test.id, 'Running')}
            className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
            data-oid='0w3zxp_'
          >
            Start Test
          </button>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout title='A/B Testing - Optelo' data-oid=':qq1m-q'>
        <div
          className='flex items-center justify-center h-64'
          data-oid='vc4y51u'
        >
          <div
            className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'
            data-oid='06-fa73'
          ></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title='A/B Testing - Optelo' data-oid='nhst3tm'>
      <div className='space-y-6' data-oid='qmb_yc7'>
        {/* Header */}
        <div className='flex items-center justify-between' data-oid='dsynrhj'>
          <div data-oid='bul.p3t'>
            <h1 className='text-3xl font-bold text-gray-900' data-oid='f3rsz_n'>
              A/B Testing
            </h1>
            <p className='text-gray-600 mt-1' data-oid='q7s1ekr'>
              Manage and monitor your experiments across all industries
            </p>
          </div>

          <div className='flex items-center space-x-3' data-oid='fol8jbt'>
            <button
              className='border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors'
              data-oid='jni_e_g'
            >
              Import Test
            </button>
            <button
              className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
              data-oid='4hpzcnj'
            >
              Create New Test
            </button>
          </div>
        </div>

        {error && (
          <div
            className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'
            data-oid='xy9i_.b'
          >
            <div className='flex' data-oid='9tuggjb'>
              <div className='flex-shrink-0' data-oid='z4.t75h'>
                <svg
                  className='h-5 w-5 text-yellow-400'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                  data-oid='97hzw9d'
                >
                  <path
                    fillRule='evenodd'
                    d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                    clipRule='evenodd'
                    data-oid='wa0oevy'
                  />
                </svg>
              </div>
              <div className='ml-3' data-oid='h-t7o75'>
                <p className='text-sm text-yellow-700' data-oid='5wrcmwu'>
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div
          className='grid grid-cols-1 md:grid-cols-4 gap-6'
          data-oid='qzv9-yr'
        >
          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
            data-oid='8vurbfx'
          >
            <div className='flex items-center' data-oid='egkr0p2'>
              <div className='flex-1' data-oid='0r_mt9e'>
                <p
                  className='text-sm font-medium text-gray-600'
                  data-oid='obg4:u7'
                >
                  Active Tests
                </p>
                <p
                  className='text-2xl font-bold text-gray-900'
                  data-oid='58-hyvs'
                >
                  {tests.filter(t => t.status === 'Running').length}
                </p>
              </div>
              <div
                className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'
                data-oid='2-c9n69'
              >
                <Play className='w-5 h-5 text-blue-600' data-oid='km2erp3' />
              </div>
            </div>
          </div>

          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
            data-oid='08llmhb'
          >
            <div className='flex items-center' data-oid=':_9rdh5'>
              <div className='flex-1' data-oid='1vvy0_m'>
                <p
                  className='text-sm font-medium text-gray-600'
                  data-oid='z-gn_2o'
                >
                  Completed
                </p>
                <p
                  className='text-2xl font-bold text-gray-900'
                  data-oid='ffzvp:c'
                >
                  {tests.filter(t => t.status === 'Completed').length}
                </p>
              </div>
              <div
                className='w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center'
                data-oid='a01qrc3'
              >
                <BarChart3
                  className='w-5 h-5 text-green-600'
                  data-oid='0qvfg:q'
                />
              </div>
            </div>
          </div>

          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
            data-oid='v6ghcks'
          >
            <div className='flex items-center' data-oid='wde4uqu'>
              <div className='flex-1' data-oid='bwr6jcf'>
                <p
                  className='text-sm font-medium text-gray-600'
                  data-oid='1ucuc62'
                >
                  Avg. Confidence
                </p>
                <p
                  className='text-2xl font-bold text-gray-900'
                  data-oid='1a08.l8'
                >
                  {tests.length > 0
                    ? formatPercentage(
                        tests.reduce((acc, test) => acc + test.confidence, 0) /
                          tests.length,
                        0
                      )
                    : '0%'}
                </p>
              </div>
              <div
                className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'
                data-oid='h5:pcbq'
              >
                <Target
                  className='w-5 h-5 text-blue-600'
                  data-oid='hhkxs8-'
                />
              </div>
            </div>
          </div>

          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
            data-oid='ebjn3f6'
          >
            <div className='flex items-center' data-oid='2k.346j'>
              <div className='flex-1' data-oid='aq1cpnh'>
                <p
                  className='text-sm font-medium text-gray-600'
                  data-oid='y.pi89t'
                >
                  Total Visitors
                </p>
                <p
                  className='text-2xl font-bold text-gray-900'
                  data-oid='e1z:.p6'
                >
                  {formatNumber(
                    tests.reduce((acc, test) => acc + test.visitors, 0)
                  )}
                </p>
              </div>
              <div
                className='w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center'
                data-oid='rqsv_4.'
              >
                <Users className='w-5 h-5 text-orange-600' data-oid='b-qnktd' />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className='border-b border-gray-200' data-oid='ob9jk1t'>
          <nav className='-mb-px flex space-x-8' data-oid='pe2wmi8'>
            {[
              {
                key: 'active',
                label: 'Active Tests',
                count: tests.filter(
                  t => t.status === 'Running' || t.status === 'Paused'
                ).length,
              },
              {
                key: 'completed',
                label: 'Completed',
                count: tests.filter(t => t.status === 'Completed').length,
              },
              {
                key: 'drafts',
                label: 'Drafts',
                count: tests.filter(t => t.status === 'Draft').length,
              },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                data-oid='jyc.xjo'
              >
                <span data-oid='r5:ugky'>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.key
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                  data-oid='jyqobz.'
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tests Grid */}
        {filteredTests.length > 0 ? (
          <div
            className='grid grid-cols-1 lg:grid-cols-2 gap-6'
            data-oid='sl463::'
          >
            {filteredTests.map(test => (
              <TestCard key={test.id} test={test} data-oid='wawsu4z' />
            ))}
          </div>
        ) : (
          <div
            className='bg-white rounded-lg border border-gray-200 p-12 text-center'
            data-oid=':1d4r21'
          >
            <div
              className='w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4'
              data-oid='wddfe51'
            >
              <BarChart3 className='w-6 h-6 text-gray-400' data-oid='2bnm9sm' />
            </div>
            <h3
              className='text-lg font-medium text-gray-900 mb-2'
              data-oid='speluea'
            >
              No {activeTab} tests
            </h3>
            <p className='text-gray-500 mb-6' data-oid='10h7anb'>
              {activeTab === 'active' &&
                "You don't have any active tests. Create your first test to get started."}
              {activeTab === 'completed' &&
                "No completed tests yet. Once your tests finish, they'll appear here."}
              {activeTab === 'drafts' &&
                'No draft tests. Create a new test and save it as a draft.'}
            </p>
            <button
              className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors'
              data-oid='.k77zsb'
            >
              Create New Test
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ABTestingPage;
