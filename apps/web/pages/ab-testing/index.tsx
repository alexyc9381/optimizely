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
      try {
        setLoading(true);
        const testsData = await apiClient.getABTests();
        setTests(testsData);
      } catch (err) {
        setError('Failed to load A/B tests');
        console.error('Error fetching tests:', err);
        // Fallback to mock data if API fails
        setTests(mockTests);
      } finally {
        setLoading(false);
      }
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
      data-oid='a458u24'
    >
      <div className='flex items-start justify-between mb-4' data-oid='vgps5mh'>
        <div className='flex-1' data-oid='jzugyow'>
          <h3
            className='text-lg font-semibold text-gray-900 mb-2'
            data-oid='w548u2:'
          >
            {test.name}
          </h3>
          <div className='flex items-center space-x-3 mb-3' data-oid='9flzh:f'>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}
              data-oid='tbbu2_l'
            >
              {test.status}
            </span>
            <span
              className='text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded'
              data-oid='ajb9np:'
            >
              {test.industry}
            </span>
            <span className='text-sm text-gray-500' data-oid='m7vwafs'>
              Started {new Date(test.startDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className='flex items-center space-x-2' data-oid='4_0v1_h'>
          {test.status === 'Running' && (
            <button
              onClick={() => handleStatusChange(test.id, 'Paused')}
              className='p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors'
              title='Pause test'
              data-oid='r9yfcbu'
            >
              <Pause className='w-4 h-4' data-oid='ymxn1fk' />
            </button>
          )}
          {test.status === 'Paused' && (
            <button
              onClick={() => handleStatusChange(test.id, 'Running')}
              className='p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors'
              title='Resume test'
              data-oid='dpk_xes'
            >
              <Play className='w-4 h-4' data-oid='-67pegh' />
            </button>
          )}
          <button
            className='p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors'
            data-oid='mvzchv6'
          >
            <BarChart3 className='w-4 h-4' data-oid='zhslpy5' />
          </button>
          <button
            onClick={() => handleDeleteTest(test.id)}
            className='p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors'
            data-oid='twcoia8'
          >
            <svg
              className='w-4 h-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              data-oid='9q2e:rw'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                data-oid='i2qpxzp'
              />
            </svg>
          </button>
        </div>
      </div>

      {test.status !== 'Draft' && (
        <>
          <div
            className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-4'
            data-oid='31qgobk'
          >
            <div
              className='text-center p-3 bg-gray-50 rounded-lg'
              data-oid='g2hnjk5'
            >
              <div
                className='flex items-center justify-center mb-1'
                data-oid='u6u.itv'
              >
                <Users
                  className='w-4 h-4 text-gray-600 mr-1'
                  data-oid='h5phhsz'
                />

                <p className='text-xs text-gray-500' data-oid='kv7124k'>
                  Visitors
                </p>
              </div>
              <p className='text-lg font-bold text-gray-900' data-oid='prpp46u'>
                {formatNumber(test.visitors)}
              </p>
            </div>
            <div
              className='text-center p-3 bg-blue-50 rounded-lg'
              data-oid='ec-i9me'
            >
              <div
                className='flex items-center justify-center mb-1'
                data-oid='g7wp4ct'
              >
                <Target
                  className='w-4 h-4 text-blue-600 mr-1'
                  data-oid='_1fs_bm'
                />

                <p className='text-xs text-blue-600' data-oid='2.mh5.s'>
                  Control CR
                </p>
              </div>
              <p className='text-lg font-bold text-blue-900' data-oid='-k46a64'>
                {formatPercentage(test.conversionRate.control)}
              </p>
            </div>
            <div
              className='text-center p-3 bg-green-50 rounded-lg'
              data-oid='8z64bx2'
            >
              <div
                className='flex items-center justify-center mb-1'
                data-oid='a:em-7-'
              >
                <Target
                  className='w-4 h-4 text-green-600 mr-1'
                  data-oid='j-fg2.i'
                />

                <p className='text-xs text-green-600' data-oid='67v1nk6'>
                  Variant CR
                </p>
              </div>
              <p
                className='text-lg font-bold text-green-900'
                data-oid=':pjko5j'
              >
                {formatPercentage(test.conversionRate.variant)}
              </p>
            </div>
            <div
              className='text-center p-3 bg-purple-50 rounded-lg'
              data-oid='tt1xvm8'
            >
              <div
                className='flex items-center justify-center mb-1'
                data-oid='pk2nr61'
              >
                <BarChart3
                  className='w-4 h-4 text-purple-600 mr-1'
                  data-oid='67opcj1'
                />

                <p className='text-xs text-purple-600' data-oid='0n73ykr'>
                  Confidence
                </p>
              </div>
              <p
                className='text-lg font-bold text-purple-900'
                data-oid='-wy0722'
              >
                {formatPercentage(test.confidence)}
              </p>
            </div>
          </div>

          {test.uplift > 0 && (
            <div
              className='bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4'
              data-oid='s97_r_n'
            >
              <div className='flex items-center' data-oid='vrxgpfm'>
                <TrendingUp
                  className='w-5 h-5 text-green-600 mr-2'
                  data-oid='9rdq57l'
                />

                <span
                  className='text-sm font-medium text-green-800'
                  data-oid='f7arili'
                >
                  <strong data-oid='8:9q3_a'>
                    {formatPercentage(test.uplift)}
                  </strong>{' '}
                  improvement over control
                </span>
              </div>
              {test.confidence >= 95 && (
                <p className='text-xs text-green-700 mt-1' data-oid='26anv_l'>
                  ✓ Statistically significant result
                </p>
              )}
            </div>
          )}
        </>
      )}

      {test.status === 'Draft' && (
        <div
          className='bg-gray-50 rounded-lg p-4 text-center'
          data-oid='c0-.eta'
        >
          <p className='text-gray-600 mb-3' data-oid='5bf24.b'>
            Test is ready to launch
          </p>
          <button
            onClick={() => handleStatusChange(test.id, 'Running')}
            className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
            data-oid='9ll.j92'
          >
            Start Test
          </button>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout title='A/B Testing - Optelo' data-oid='bp0vzna'>
        <div
          className='flex items-center justify-center h-64'
          data-oid='d_:fff5'
        >
          <div
            className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'
            data-oid='3k5ootd'
          ></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title='A/B Testing - Optelo' data-oid='9t.lz:e'>
      <div className='space-y-6' data-oid='wk0rxkq'>
        {/* Header */}
        <div className='flex items-center justify-between' data-oid='oqdhwu3'>
          <div data-oid='_y7cmuc'>
            <h1 className='text-3xl font-bold text-gray-900' data-oid='eyz9:qn'>
              A/B Testing
            </h1>
            <p className='text-gray-600 mt-1' data-oid='lqt_olh'>
              Manage and monitor your experiments across all industries
            </p>
          </div>

          <div className='flex items-center space-x-3' data-oid='4iw12oe'>
            <button
              className='border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors'
              data-oid='cn-uej2'
            >
              Import Test
            </button>
            <button
              className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
              data-oid='9dkl1-.'
            >
              Create New Test
            </button>
          </div>
        </div>

        {error && (
          <div
            className='bg-red-50 border border-red-200 rounded-lg p-4'
            data-oid='ahp_gsj'
          >
            <p className='text-red-800' data-oid='rgq1nf9'>
              {error}
            </p>
          </div>
        )}

        {/* Stats Cards */}
        <div
          className='grid grid-cols-1 md:grid-cols-4 gap-6'
          data-oid='21d7mq1'
        >
          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
            data-oid='6giqw3d'
          >
            <div className='flex items-center' data-oid='13u:2f6'>
              <div className='flex-1' data-oid='x9f0-_b'>
                <p
                  className='text-sm font-medium text-gray-600'
                  data-oid='dcjm40l'
                >
                  Active Tests
                </p>
                <p
                  className='text-2xl font-bold text-gray-900'
                  data-oid='u2t70r_'
                >
                  {tests.filter(t => t.status === 'Running').length}
                </p>
              </div>
              <div
                className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'
                data-oid='io_-v5_'
              >
                <Play className='w-5 h-5 text-blue-600' data-oid='371ve8-' />
              </div>
            </div>
          </div>

          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
            data-oid='e_2-ca1'
          >
            <div className='flex items-center' data-oid='svuuv.o'>
              <div className='flex-1' data-oid='nxmzqj1'>
                <p
                  className='text-sm font-medium text-gray-600'
                  data-oid='axvy:79'
                >
                  Completed
                </p>
                <p
                  className='text-2xl font-bold text-gray-900'
                  data-oid='ohe3u.h'
                >
                  {tests.filter(t => t.status === 'Completed').length}
                </p>
              </div>
              <div
                className='w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center'
                data-oid='j8dgv86'
              >
                <BarChart3
                  className='w-5 h-5 text-green-600'
                  data-oid='8wv0c7u'
                />
              </div>
            </div>
          </div>

          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
            data-oid='8skyzh1'
          >
            <div className='flex items-center' data-oid='r_iefe:'>
              <div className='flex-1' data-oid='mks-0a:'>
                <p
                  className='text-sm font-medium text-gray-600'
                  data-oid='l2:rg37'
                >
                  Avg. Confidence
                </p>
                <p
                  className='text-2xl font-bold text-gray-900'
                  data-oid='6e7vojs'
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
                className='w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center'
                data-oid='6q9rl27'
              >
                <Target
                  className='w-5 h-5 text-purple-600'
                  data-oid='9r-b._p'
                />
              </div>
            </div>
          </div>

          <div
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
            data-oid='-..-nyl'
          >
            <div className='flex items-center' data-oid='2vehl7-'>
              <div className='flex-1' data-oid='6969.df'>
                <p
                  className='text-sm font-medium text-gray-600'
                  data-oid='ofgks:7'
                >
                  Total Visitors
                </p>
                <p
                  className='text-2xl font-bold text-gray-900'
                  data-oid='lsb8ntn'
                >
                  {formatNumber(
                    tests.reduce((acc, test) => acc + test.visitors, 0)
                  )}
                </p>
              </div>
              <div
                className='w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center'
                data-oid='xf..afr'
              >
                <Users className='w-5 h-5 text-orange-600' data-oid='-pdthqt' />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className='border-b border-gray-200' data-oid='beorxiy'>
          <nav className='-mb-px flex space-x-8' data-oid='e9lgzw0'>
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
                data-oid='jk-tku-'
              >
                <span data-oid='5n-_em_'>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.key
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                  data-oid='3bcv62u'
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
            data-oid='npyytwt'
          >
            {filteredTests.map(test => (
              <TestCard key={test.id} test={test} data-oid='b:0kvvw' />
            ))}
          </div>
        ) : (
          <div
            className='bg-white rounded-lg border border-gray-200 p-12 text-center'
            data-oid='ixkouv8'
          >
            <div
              className='w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4'
              data-oid='7.2.jws'
            >
              <BarChart3 className='w-6 h-6 text-gray-400' data-oid='m:x619e' />
            </div>
            <h3
              className='text-lg font-medium text-gray-900 mb-2'
              data-oid='gb_yzym'
            >
              No {activeTab} tests
            </h3>
            <p className='text-gray-500 mb-6' data-oid='edc:.ib'>
              {activeTab === 'active' &&
                "You don't have any active tests. Create your first test to get started."}
              {activeTab === 'completed' &&
                "No completed tests yet. Once your tests finish, they'll appear here."}
              {activeTab === 'drafts' &&
                'No draft tests. Create a new test and save it as a draft.'}
            </p>
            <button
              className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors'
              data-oid='zy56jub'
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
