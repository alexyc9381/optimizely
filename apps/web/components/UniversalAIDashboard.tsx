import React, { useEffect, useState } from 'react';
import ConversionRateTrendChart from './ConversionRateTrendChart';
import WebMetricsChart from './WebMetricsChart';

interface DashboardStats {
  totalVisitors: number;
  totalSessions: number;
  conversionRate: number;
  revenueGenerated: number;
  activeExperiments: number;
  modelAccuracy: number;
}

interface SystemHealth {
  apiGateway: boolean;
  mlEngine: boolean;
  abTesting: boolean;
  analytics: boolean;
  recommendations: boolean;
}

interface Experiment {
  id: string;
  name: string;
  status: string;
  conversionRate: number;
  confidence: number;
  industry: string;
}

interface ModelMetric {
  name: string;
  accuracy: number;
  confidence: number;
  status: string;
}

const UniversalAIDashboard: React.FC = () => {
  // Initialize with fallback values to show content immediately
  const [dashboardStats] = useState<DashboardStats>({
    totalVisitors: 24789,
    totalSessions: 15432,
    conversionRate: 8.6,
    revenueGenerated: 847500,
    activeExperiments: 12,
    modelAccuracy: 94.2,
  });

  const [systemHealth] = useState<SystemHealth>({
    apiGateway: false,
    mlEngine: true,
    abTesting: true,
    analytics: true,
    recommendations: true,
  });

  const [experiments] = useState<Experiment[]>([
    {
      id: '1',
      name: 'SaaS Pricing Page',
      status: 'Running',
      conversionRate: 12.4,
      confidence: 98,
      industry: 'SaaS',
    },
    {
      id: '2',
      name: 'College Consulting CTA',
      status: 'Running',
      conversionRate: 8.7,
      confidence: 87,
      industry: 'Education',
    },
    {
      id: '3',
      name: 'FinTech Dashboard',
      status: 'Analyzing',
      conversionRate: 15.2,
      confidence: 76,
      industry: 'FinTech',
    },
  ]);

  const [modelMetrics] = useState<ModelMetric[]>([
    { name: 'Lead Scoring', accuracy: 94.2, confidence: 97, status: 'Active' },
    {
      name: 'Revenue Prediction',
      accuracy: 89.1,
      confidence: 92,
      status: 'Learning',
    },
    {
      name: 'Churn Prevention',
      accuracy: 91.8,
      confidence: 89,
      status: 'Active',
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);

  // Funnel mock data with realistic variations
  const [funnelData, setFunnelData] = useState({
    visitors: {
      count: 24789,
      percentage: 100,
      trend: '+12.3%',
      conversionFromPrevious: 100,
    },
    signups: {
      count: 11155,
      percentage: 45,
      trend: '+8.7%',
      conversionFromPrevious: 45,
    },
    trials: {
      count: 6197,
      percentage: 25,
      trend: '+5.2%',
      conversionFromPrevious: 56,
    },
    paid: {
      count: 1983,
      percentage: 8,
      trend: '+2.1%',
      conversionFromPrevious: 32,
    },
  });

  // Generate realistic funnel mock data
  const generateFunnelMockData = () => {
    const baseVisitors = 20000 + Math.floor(Math.random() * 10000);
    const signupRate = 0.42 + Math.random() * 0.08; // 42-50%
    const trialRate = 0.52 + Math.random() * 0.12; // 52-64% of signups
    const paidRate = 0.28 + Math.random() * 0.12; // 28-40% of trials

    const visitors = baseVisitors;
    const signups = Math.floor(visitors * signupRate);
    const trials = Math.floor(signups * trialRate);
    const paid = Math.floor(trials * paidRate);

    return {
      visitors: {
        count: visitors,
        percentage: 100,
        trend: `+${(8 + Math.random() * 8).toFixed(1)}%`,
        conversionFromPrevious: 100,
      },
      signups: {
        count: signups,
        percentage: Math.round((signups / visitors) * 100),
        trend: `+${(5 + Math.random() * 6).toFixed(1)}%`,
        conversionFromPrevious: Math.round((signups / visitors) * 100),
      },
      trials: {
        count: trials,
        percentage: Math.round((trials / visitors) * 100),
        trend: `+${(2 + Math.random() * 6).toFixed(1)}%`,
        conversionFromPrevious: Math.round((trials / signups) * 100),
      },
      paid: {
        count: paid,
        percentage: Math.round((paid / visitors) * 100),
        trend: `+${(1 + Math.random() * 4).toFixed(1)}%`,
        conversionFromPrevious: Math.round((paid / trials) * 100),
      },
    };
  };

  const refreshFunnelData = () => {
    setFunnelData(generateFunnelMockData());
  };

  useEffect(() => {
    // Start with fallback data immediately, attempt API connection in background
    const fetchDashboardData = async () => {
      // Only attempt API connection if explicitly enabled
      const enableAPIConnection = false; // Set to true to enable API calls
      if (!enableAPIConnection) {
        return;
      }

      try {
        setLoading(true);
        // API connection logic would go here
        setApiConnected(false);
      } catch {
        setApiConnected(false);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle: string;
    trend?: string;
    icon: string;
  }> = ({ title, value, subtitle, trend }) => (
    <div
      className='bg-white rounded-lg p-6 border border-blue-100 hover:border-blue-300 transition-all duration-300 hover:shadow-xl shadow-sm'
      data-oid='p:e473g'
    >
      <div className='mb-4' data-oid='8loawcj'>
        <div
          className='text-3xl font-bold text-blue-900 mb-2'
          data-oid='6wdme3g'
        >
          {value || 0}
        </div>
        <div className='text-sm font-medium text-blue-600' data-oid='tsj7i54'>
          {title}
        </div>
        <div className='text-xs text-blue-400 mt-1' data-oid='gep7hxz'>
          {subtitle}
        </div>
      </div>
      {trend && (
        <div
          className='text-xs font-semibold text-green-600'
          data-oid='4anel3_'
        >
          {trend}
        </div>
      )}
    </div>
  );

  const HealthIndicator: React.FC<{ service: string; status: boolean }> = ({
    service,
    status,
  }) => (
    <div className='flex items-center justify-between py-3' data-oid='u3spq63'>
      <span className='text-blue-700 text-sm font-medium' data-oid='dg6hb6b'>
        {service}
      </span>
      <div className='flex items-center' data-oid='fjlqu2e'>
        <div
          className={`w-3 h-3 rounded-full mr-3 ${
            status ? 'bg-green-500 animate-pulse' : 'bg-red-400'
          }`}
          data-oid='w3kgbbn'
        />

        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full ${
            status ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
          }`}
          data-oid='z6v:48:'
        >
          {status ? 'Active' : 'Offline'}
        </span>
      </div>
    </div>
  );

  const ExperimentCard: React.FC<{ experiment: Experiment }> = ({
    experiment,
  }) => (
    <div
      className='bg-blue-50 p-6 rounded-lg border border-blue-100 hover:border-blue-200 transition-all duration-200'
      data-oid='01491fk'
    >
      <div
        className='flex items-center justify-between mb-4'
        data-oid=':x8q1l:'
      >
        <h4 className='text-blue-900 font-semibold text-sm' data-oid='mb19_g8'>
          {experiment.name}
        </h4>
        <span
          className={`text-xs px-3 py-1 rounded-full font-medium ${
            experiment.status === 'Running'
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-blue-200 text-blue-800 border border-blue-300'
          }`}
          data-oid='lt.749x'
        >
          {experiment.status}
        </span>
      </div>
      <div className='grid grid-cols-2 gap-4 text-xs' data-oid=':hg4g5s'>
        <div data-oid='hmqo5xb'>
          <span className='text-blue-600 font-medium' data-oid='j9wrddy'>
            Conversion:{' '}
          </span>
          <span
            className={`font-bold ${
              experiment.conversionRate > 10
                ? 'text-green-600'
                : experiment.conversionRate > 5
                  ? 'text-yellow-600'
                  : 'text-red-600'
            }`}
            data-oid='p1:25-0'
          >
            {experiment.conversionRate}%
          </span>
        </div>
        <div data-oid='s559gmj'>
          <span className='text-blue-600 font-medium' data-oid='a_4kcjo'>
            Confidence:{' '}
          </span>
          <span
            className={`font-bold ${
              experiment.confidence > 95
                ? 'text-green-600'
                : experiment.confidence > 80
                  ? 'text-yellow-600'
                  : 'text-red-600'
            }`}
            data-oid='pcdilch'
          >
            {experiment.confidence}%
          </span>
        </div>
      </div>
      <p
        className='text-xs text-blue-700 font-medium mt-3 px-2 py-1 bg-blue-100 rounded-lg inline-block'
        data-oid='zt4jje:'
      >
        {experiment.industry}
      </p>
    </div>
  );

  const ModelMetricCard: React.FC<{ metric: ModelMetric }> = ({ metric }) => (
    <div
      className='bg-blue-50 p-6 rounded-lg border border-blue-100 hover:border-blue-200 transition-all duration-200'
      data-oid='t-czf5o'
    >
      <div
        className='flex items-center justify-between mb-4'
        data-oid='gwsh6wa'
      >
        <h4 className='text-blue-900 font-semibold text-sm' data-oid='4dlrbpt'>
          {metric.name}
        </h4>
        <span
          className={`text-xs px-3 py-1 rounded-full font-medium ${
            metric.status === 'Active'
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-blue-200 text-blue-800 border border-blue-300'
          }`}
          data-oid='14zmfw1'
        >
          {metric.status}
        </span>
      </div>
      <div className='grid grid-cols-2 gap-4 text-xs' data-oid='1u125bh'>
        <div data-oid='9ka.ie7'>
          <span className='text-blue-600 font-medium' data-oid='lju9z1b'>
            Accuracy:{' '}
          </span>
          <span
            className={`font-bold ${
              metric.accuracy > 95
                ? 'text-green-600'
                : metric.accuracy > 85
                  ? 'text-yellow-600'
                  : 'text-red-600'
            }`}
            data-oid='5-8h9.-'
          >
            {metric.accuracy}%
          </span>
        </div>
        <div data-oid='p37js_k'>
          <span className='text-blue-600 font-medium' data-oid='oknukq_'>
            Confidence:{' '}
          </span>
          <span
            className={`font-bold ${
              metric.confidence > 95
                ? 'text-green-600'
                : metric.confidence > 85
                  ? 'text-yellow-600'
                  : 'text-red-600'
            }`}
            data-oid='.cqfizw'
          >
            {metric.confidence}%
          </span>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div
        className='min-h-screen bg-gradient-to-br from-blue-50 via-blue-25 to-blue-50 flex items-center justify-center'
        data-oid='c5y1rsx'
      >
        <div className='text-center' data-oid='eqz:1_n'>
          <div
            className='animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-8'
            data-oid='c_t_t_0'
          ></div>
          <p className='text-blue-700 font-medium text-lg' data-oid='zzx2mpr'>
            Loading Optelo Platform...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-blue-25 text-blue-900' data-oid='ksev72_'>
      <style jsx data-oid='b.ne2bn'>{`
        /* Custom scrollbar styling for dashboard components */
        .dashboard-scrollable {
          scrollbar-width: thin;
          scrollbar-color: #d1d5db #f3f4f6;
        }
        .dashboard-scrollable::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .dashboard-scrollable::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 10px;
        }
        .dashboard-scrollable::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
          border: 1px solid #f3f4f6;
        }
        .dashboard-scrollable::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
        .dashboard-scrollable::-webkit-scrollbar-corner {
          background: #f3f4f6;
        }
        /* Global scrollbar styling for the main page */
        html {
          scrollbar-width: thin;
          scrollbar-color: #d1d5db #f9fafb;
        }
        html::-webkit-scrollbar {
          width: 8px;
        }
        html::-webkit-scrollbar-track {
          background: #f9fafb;
          border-radius: 10px;
        }
        html::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
          border: 2px solid #f9fafb;
        }
        html::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>

      {/* Main Content */}
      <main className='max-w-7xl mx-auto px-4 py-6' data-oid='6ia2n3:'>
        {/* Key Metrics */}
        <section className='mb-8' data-oid='fhwph:o'>
          <h2
            className='text-4xl font-bold mb-6 flex items-center text-blue-900'
            data-oid='u.qbej4'
          >
            <span className='text-blue-700' data-oid='ga9-0id'>
              Analytics Overview
            </span>
          </h2>
          <div
            className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4'
            data-oid='-.w:vvd'
          >
            <StatCard
              title='Total Visitors'
              value={dashboardStats?.totalVisitors?.toLocaleString() || '0'}
              subtitle='Cross-platform tracking'
              trend='+12.3% this week'
              icon='VIS'
              data-oid='_jhwbli'
            />

            <StatCard
              title='Active Sessions'
              value={dashboardStats?.totalSessions?.toLocaleString() || '0'}
              subtitle='Real-time monitoring'
              trend='+8.7% today'
              icon='SES'
              data-oid='9u.9gh9'
            />

            <StatCard
              title='Conversion Rate'
              value={`${dashboardStats?.conversionRate || 0}%`}
              subtitle='AI-optimized funnels'
              trend='+2.1% improvement'
              icon='CVR'
              data-oid='xzh9666'
            />

            <StatCard
              title='A/B Experiments'
              value={dashboardStats?.activeExperiments || '0'}
              subtitle='Running across industries'
              trend='3 completed today'
              icon='AB'
              data-oid='icgh0xs'
            />

            <StatCard
              title='Model Accuracy'
              value={`${dashboardStats?.modelAccuracy || 0}%`}
              subtitle='ML performance'
              trend='+1.8% improvement'
              icon='ML'
              data-oid='0byk9gw'
            />
          </div>
        </section>

        {/* Enhanced Analytics Section */}
        <section className='mt-8' data-oid='p2p8wld'>
          <h3
            className='text-3xl font-bold mb-6 text-blue-800'
            data-oid='6xa1vth'
          >
            Detailed Analytics
          </h3>

          {/* Conversion Rate Trend Chart - Now First */}
          <div className='mb-8' data-oid='j3_1ot4'>
            <ConversionRateTrendChart data-oid='lfas5h8' />
          </div>

          {/* Main Analytics Charts */}
          <div
            className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'
            data-oid='u_06m6u'
          >
            <div
              className='bg-white rounded-lg p-6 border border-blue-100 shadow-lg h-[520px]'
              data-oid='ohqq:_-'
            >
              <div
                className='flex items-center justify-between mb-4'
                data-oid='qehu85l'
              >
                <h4
                  className='text-xl font-bold text-blue-900'
                  data-oid='uso4lx_'
                >
                  Conversion Funnel
                </h4>
                <button
                  onClick={refreshFunnelData}
                  className='p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200'
                  title='Refresh funnel data'
                  data-oid='98t4scx'
                >
                  <svg
                    className='w-5 h-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                    data-oid='f0jfdlt'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                      data-oid='6jxcaqc'
                    />
                  </svg>
                </button>
              </div>

              <div
                className='h-[440px] flex flex-col justify-center'
                data-oid='0se-r:v'
              >
                {/* Interactive Funnel Visualization */}
                <div className='space-y-6' data-oid='w:eu5yy'>
                  {/* Visitors - Top of funnel */}
                  <div
                    className='relative group cursor-pointer transition-all duration-500 hover:scale-105'
                    data-oid='jyjrlmu'
                  >
                    <div
                      className='bg-gradient-to-r from-blue-600 to-blue-700 h-20 rounded-lg shadow-xl flex items-center justify-between px-4 text-white transform transition-all duration-500'
                      data-oid='48_xzma'
                    >
                      <div data-oid='c-787e9'>
                        <div
                          className='text-xl font-bold transition-all duration-500'
                          data-oid='cru2ksq'
                        >
                          {funnelData.visitors.count.toLocaleString()}
                        </div>
                        <div className='text-sm opacity-90' data-oid='ec_jklg'>
                          Visitors
                        </div>
                      </div>
                      <div className='text-right' data-oid='8p7pukg'>
                        <div className='text-sm opacity-90' data-oid='fdb5l6n'>
                          {funnelData.visitors.percentage}%
                        </div>
                        <div className='text-xs opacity-75' data-oid='rmf7p1k'>
                          {funnelData.visitors.trend} vs last week
                        </div>
                      </div>
                    </div>
                    {/* Tooltip */}
                    <div
                      className='absolute left-1/2 transform -translate-x-1/2 -top-16 bg-blue-900 text-white px-4 py-2 rounded-xl text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10'
                      data-oid='_g.6ax.'
                    >
                      Total unique visitors across all channels
                    </div>
                  </div>

                  {/* Sign-ups */}
                  <div
                    className='relative group cursor-pointer transition-all duration-500 hover:scale-105 ml-8'
                    data-oid='rb:4kjh'
                  >
                    <div
                      className='bg-gradient-to-r from-blue-500 to-blue-600 h-16 rounded-lg shadow-xl flex items-center justify-between px-4 text-white transform transition-all duration-500'
                      style={{
                        width: `${Math.max(funnelData.signups.percentage * 2, 60)}%`,
                      }}
                      data-oid='3u5b7nu'
                    >
                      <div data-oid='_t8xlql'>
                        <div
                          className='text-lg font-bold transition-all duration-500'
                          data-oid='02r_i18'
                        >
                          {funnelData.signups.count.toLocaleString()}
                        </div>
                        <div className='text-sm opacity-90' data-oid='vvna5pu'>
                          Sign-ups
                        </div>
                      </div>
                      <div className='text-right' data-oid='bhwxe2j'>
                        <div className='text-sm opacity-90' data-oid='9n-90s9'>
                          {funnelData.signups.percentage}%
                        </div>
                        <div className='text-xs opacity-75' data-oid='4d9crya'>
                          {funnelData.signups.conversionFromPrevious}%
                          conversion
                        </div>
                      </div>
                    </div>
                    <div
                      className='absolute left-1/2 transform -translate-x-1/2 -top-16 bg-blue-900 text-white px-4 py-2 rounded-xl text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10'
                      data-oid='b:_:o8x'
                    >
                      Users who completed registration
                    </div>
                  </div>

                  {/* Trial Users */}
                  <div
                    className='relative group cursor-pointer transition-all duration-500 hover:scale-105 ml-16'
                    data-oid='-_9dqf_'
                  >
                    <div
                      className='bg-gradient-to-r from-blue-400 to-blue-500 h-14 rounded-lg shadow-xl flex items-center justify-between px-4 text-white transform transition-all duration-500'
                      style={{
                        width: `${Math.max(funnelData.trials.percentage * 2.5, 50)}%`,
                      }}
                      data-oid='u98_wnk'
                    >
                      <div data-oid='71jqdd:'>
                        <div
                          className='text-base font-bold transition-all duration-500'
                          data-oid='o52a.f-'
                        >
                          {funnelData.trials.count.toLocaleString()}
                        </div>
                        <div className='text-xs opacity-90' data-oid='txv:zdo'>
                          Trial Users
                        </div>
                      </div>
                      <div className='text-right' data-oid='2rgjp4h'>
                        <div className='text-xs opacity-90' data-oid='ziux-3z'>
                          {funnelData.trials.percentage}%
                        </div>
                        <div className='text-xs opacity-75' data-oid='-3dvdko'>
                          {funnelData.trials.conversionFromPrevious}% from
                          signups
                        </div>
                      </div>
                    </div>
                    <div
                      className='absolute left-1/2 transform -translate-x-1/2 -top-16 bg-blue-900 text-white px-4 py-2 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10'
                      data-oid='6sjyojm'
                    >
                      Active trial subscriptions
                    </div>
                  </div>

                  {/* Paid Customers */}
                  <div
                    className='relative group cursor-pointer transition-all duration-500 hover:scale-105 ml-24'
                    data-oid='us82r3k'
                  >
                    <div
                      className='bg-gradient-to-r from-blue-300 to-blue-400 h-12 rounded-lg shadow-xl flex items-center justify-between px-4 text-white transform transition-all duration-500'
                      style={{
                        width: `${Math.max(funnelData.paid.percentage * 4, 40)}%`,
                      }}
                      data-oid='c82lbwg'
                    >
                      <div data-oid='s0w.m-g'>
                        <div
                          className='text-sm font-bold transition-all duration-500'
                          data-oid='89l6bs.'
                        >
                          {funnelData.paid.count.toLocaleString()}
                        </div>
                        <div className='text-xs opacity-90' data-oid='i3.id3g'>
                          Paid Customers
                        </div>
                      </div>
                      <div className='text-right' data-oid='d8ute-4'>
                        <div className='text-xs opacity-90' data-oid='7_fbwr_'>
                          {funnelData.paid.percentage}%
                        </div>
                        <div className='text-xs opacity-75' data-oid='9vdlmrz'>
                          {funnelData.paid.conversionFromPrevious}% from trials
                        </div>
                      </div>
                    </div>
                    <div
                      className='absolute left-1/2 transform -translate-x-1/2 -top-16 bg-blue-900 text-white px-4 py-2 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10'
                      data-oid='56b1eqr'
                    >
                      Converting paid subscribers
                    </div>
                  </div>
                </div>

                {/* Funnel Insights - Dynamic */}
                <div
                  className='mt-8 pt-6 border-t border-blue-200'
                  data-oid='u12mcww'
                >
                  <div
                    className='grid grid-cols-3 gap-6 text-center'
                    data-oid='6x1:0u8'
                  >
                    <div data-oid='dplkht-'>
                      <div
                        className='text-sm font-bold text-green-600'
                        data-oid='3_gkhi1'
                      >
                        Best Stage
                      </div>
                      <div
                        className='text-xs text-blue-700 font-medium'
                        data-oid='cfds019'
                      >
                        {funnelData.signups.conversionFromPrevious >
                          funnelData.trials.conversionFromPrevious &&
                        funnelData.signups.conversionFromPrevious >
                          funnelData.paid.conversionFromPrevious
                          ? 'Visitor → Signup'
                          : funnelData.trials.conversionFromPrevious >
                              funnelData.paid.conversionFromPrevious
                            ? 'Signup → Trial'
                            : 'Trial → Paid'}
                      </div>
                      <div
                        className='text-xs text-blue-600 transition-all duration-500'
                        data-oid='ea0:_p6'
                      >
                        {Math.max(
                          funnelData.signups.conversionFromPrevious,
                          funnelData.trials.conversionFromPrevious,
                          funnelData.paid.conversionFromPrevious
                        )}
                        % conversion
                      </div>
                    </div>
                    <div data-oid='mjvvjer'>
                      <div
                        className='text-sm font-bold text-yellow-600'
                        data-oid='6wz0ifw'
                      >
                        Opportunity
                      </div>
                      <div
                        className='text-xs text-blue-700 font-medium'
                        data-oid='1dc81ab'
                      >
                        {funnelData.paid.conversionFromPrevious <
                          funnelData.trials.conversionFromPrevious &&
                        funnelData.paid.conversionFromPrevious <
                          funnelData.signups.conversionFromPrevious
                          ? 'Trial → Paid'
                          : funnelData.trials.conversionFromPrevious <
                              funnelData.signups.conversionFromPrevious
                            ? 'Signup → Trial'
                            : 'Visitor → Signup'}
                      </div>
                      <div
                        className='text-xs text-blue-600 transition-all duration-500'
                        data-oid='n1aznv2'
                      >
                        {Math.min(
                          funnelData.signups.conversionFromPrevious,
                          funnelData.trials.conversionFromPrevious,
                          funnelData.paid.conversionFromPrevious
                        )}
                        % conversion
                      </div>
                    </div>
                    <div data-oid='fefyenz'>
                      <div
                        className='text-sm font-bold text-blue-700'
                        data-oid='r9t9zgq'
                      >
                        Overall
                      </div>
                      <div
                        className='text-xs text-blue-700 font-medium'
                        data-oid='4250cgt'
                      >
                        End-to-end
                      </div>
                      <div
                        className='text-xs text-blue-600 transition-all duration-500'
                        data-oid='3he:c21'
                      >
                        {funnelData.paid.percentage}% conversion
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Switchable Web Metrics Chart - Replaces MRR Chart */}
            <WebMetricsChart data-oid='o54n18a' />
          </div>

          {/* A/B Testing Performance */}
          <div
            className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'
            data-oid='uh1ipsv'
          >
            <div
              className='bg-white rounded-lg p-6 border border-blue-100 shadow-lg'
              data-oid='zdy1yzp'
            >
              <h4
                className='text-xl font-bold text-blue-900 mb-4'
                data-oid='4:ik7e-'
              >
                Active A/B Tests
              </h4>
              <div className='space-y-6' data-oid='wlfyxy9'>
                <div
                  className='border-l-4 border-blue-500 pl-6'
                  data-oid='2ro5349'
                >
                  <h5
                    className='font-semibold text-blue-900'
                    data-oid='66ogx8r'
                  >
                    Pricing Page CTA
                  </h5>
                  <p className='text-sm text-blue-600' data-oid='ssnf_xu'>
                    Testing button colors
                  </p>
                  <div
                    className='flex items-center justify-between mt-3'
                    data-oid='5h9lh5y'
                  >
                    <span className='text-xs text-blue-500' data-oid='97y5toz'>
                      Confidence
                    </span>
                    <span
                      className='text-sm font-bold text-blue-600'
                      data-oid='r28n3ey'
                    >
                      96%
                    </span>
                  </div>
                </div>
                <div
                  className='border-l-4 border-blue-500 pl-6'
                  data-oid='nq9ji_u'
                >
                  <h5
                    className='font-semibold text-blue-900'
                    data-oid='1b3v1:0'
                  >
                    Onboarding Flow
                  </h5>
                  <p className='text-sm text-blue-600' data-oid='_8jhfmj'>
                    3-step vs 5-step
                  </p>
                  <div
                    className='flex items-center justify-between mt-3'
                    data-oid='r_hw5we'
                  >
                    <span className='text-xs text-blue-500' data-oid='na2s0ip'>
                      Confidence
                    </span>
                    <span
                      className='text-sm font-bold text-blue-600'
                      data-oid='cbdil:q'
                    >
                      78%
                    </span>
                  </div>
                </div>
                <div
                  className='border-l-4 border-yellow-500 pl-6'
                  data-oid='0zimwqr'
                >
                  <h5
                    className='font-semibold text-blue-900'
                    data-oid='ew:urf4'
                  >
                    Email Subject Lines
                  </h5>
                  <p className='text-sm text-blue-600' data-oid='_7nlm59'>
                    Personalization test
                  </p>
                  <div
                    className='flex items-center justify-between mt-3'
                    data-oid='ar3.u-k'
                  >
                    <span className='text-xs text-blue-500' data-oid='t_ek3nw'>
                      Confidence
                    </span>
                    <span
                      className='text-sm font-bold text-yellow-600'
                      data-oid='.oc7ab4'
                    >
                      45%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* User Engagement Metrics */}
            <div
              className='bg-white rounded-lg p-6 border border-blue-100 shadow-lg'
              data-oid='hm8673p'
            >
              <h4
                className='text-xl font-bold text-blue-900 mb-4'
                data-oid='.7svvn9'
              >
                Engagement
              </h4>
              <div className='space-y-6' data-oid='-gmj8yj'>
                <div data-oid='8qnwddd'>
                  <div
                    className='flex items-center justify-between mb-2'
                    data-oid='83gc8vy'
                  >
                    <span
                      className='text-sm text-blue-700 font-medium'
                      data-oid='r3qcd0c'
                    >
                      Daily Active Users
                    </span>
                    <span
                      className='text-sm font-bold text-blue-900'
                      data-oid='2vzl2uh'
                    >
                      8,943
                    </span>
                  </div>
                  <div
                    className='w-full bg-blue-100 rounded-full h-3'
                    data-oid='y1o84a5'
                  >
                    <div
                      className='bg-green-600 h-3 rounded-full'
                      style={{ width: '73%' }}
                      data-oid='.jot-w9'
                    ></div>
                  </div>
                  <span
                    className='text-xs text-green-600 font-semibold'
                    data-oid='6.g13a0'
                  >
                    +8.2% vs last week
                  </span>
                </div>
                <div data-oid='2:gn21d'>
                  <div
                    className='flex items-center justify-between mb-2'
                    data-oid='ylpu26n'
                  >
                    <span
                      className='text-sm text-blue-700 font-medium'
                      data-oid='xbs596t'
                    >
                      Session Duration
                    </span>
                    <span
                      className='text-sm font-bold text-blue-900'
                      data-oid='brq5t_j'
                    >
                      12m 34s
                    </span>
                  </div>
                  <div
                    className='w-full bg-blue-100 rounded-full h-3'
                    data-oid='ntgae6l'
                  >
                    <div
                      className='bg-blue-600 h-3 rounded-full'
                      style={{ width: '68%' }}
                      data-oid='---.-o4'
                    ></div>
                  </div>
                  <span
                    className='text-xs text-blue-600 font-semibold'
                    data-oid='y8t:8zv'
                  >
                    +2.1% vs last week
                  </span>
                </div>
                <div data-oid='.shfn6v'>
                  <div
                    className='flex items-center justify-between mb-2'
                    data-oid='lq5glfx'
                  >
                    <span
                      className='text-sm text-blue-700 font-medium'
                      data-oid='w0x58k2'
                    >
                      Feature Adoption
                    </span>
                    <span
                      className='text-sm font-bold text-blue-900'
                      data-oid='a3ylt5-'
                    >
                      67%
                    </span>
                  </div>
                  <div
                    className='w-full bg-blue-100 rounded-full h-3'
                    data-oid='gzk5-yx'
                  >
                    <div
                      className='bg-yellow-600 h-3 rounded-full'
                      style={{ width: '67%' }}
                      data-oid='zi0o4o4'
                    ></div>
                  </div>
                  <span
                    className='text-xs text-yellow-600 font-semibold'
                    data-oid='syq.nzp'
                  >
                    -1.3% vs last week
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Satisfaction */}
            <div
              className='bg-white rounded-lg p-6 border border-blue-100 shadow-lg'
              data-oid='mzq..wz'
            >
              <h4
                className='text-xl font-bold text-blue-900 mb-4'
                data-oid='2dcb5b:'
              >
                Customer Metrics
              </h4>
              <div className='space-y-6' data-oid='07by--v'>
                <div className='text-center' data-oid='f-t94nt'>
                  <div
                    className='inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-4'
                    data-oid='::veojq'
                  >
                    <span
                      className='text-3xl font-bold text-green-600'
                      data-oid='d28ivta'
                    >
                      8.7
                    </span>
                  </div>
                  <p
                    className='text-sm text-blue-700 font-medium'
                    data-oid='j89jvk5'
                  >
                    Customer Satisfaction Score
                  </p>
                  <span
                    className='text-xs text-green-600 font-semibold'
                    data-oid='-zvfum4'
                  >
                    Excellent
                  </span>
                </div>
                <div
                  className='grid grid-cols-2 gap-6 pt-6 border-t border-blue-200'
                  data-oid='pfsoy92'
                >
                  <div className='text-center' data-oid='c1s79mv'>
                    <span
                      className='text-xl font-bold text-blue-900'
                      data-oid='ldkybr0'
                    >
                      2.1%
                    </span>
                    <p
                      className='text-xs text-blue-600 font-medium'
                      data-oid='nd77v24'
                    >
                      Churn Rate
                    </p>
                    <span
                      className='text-xs text-green-600 font-semibold'
                      data-oid='8e7m-hz'
                    >
                      ↓ 0.3%
                    </span>
                  </div>
                  <div className='text-center' data-oid='9qrebh.'>
                    <span
                      className='text-xl font-bold text-blue-900'
                      data-oid='xmykn59'
                    >
                      94%
                    </span>
                    <p
                      className='text-xs text-blue-600 font-medium'
                      data-oid='u8eoj16'
                    >
                      Retention
                    </p>
                    <span
                      className='text-xs text-green-600 font-semibold'
                      data-oid='.-0of1j'
                    >
                      ↑ 1.2%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Activity Feed */}
          <div
            className='grid grid-cols-1 lg:grid-cols-2 gap-6'
            data-oid='p-pbvcg'
          >
            <div
              className='bg-white rounded-lg p-6 border border-blue-100 shadow-lg'
              data-oid='oc8ulle'
            >
              <h4
                className='text-xl font-bold text-blue-900 mb-4'
                data-oid='yd9tltw'
              >
                Real-time Activity
              </h4>
              <div className='space-y-4' data-oid='_dp7z3m'>
                <div
                  className='flex items-center space-x-4 p-4 bg-green-50 rounded-xl'
                  data-oid='11slqi0'
                >
                  <div
                    className='w-3 h-3 bg-green-500 rounded-full'
                    data-oid='czcqjyk'
                  ></div>
                  <div className='flex-1' data-oid='8hjbvrc'>
                    <p
                      className='text-sm text-blue-900 font-medium'
                      data-oid='ei4_yn6'
                    >
                      New trial signup from enterprise lead
                    </p>
                    <span className='text-xs text-blue-600' data-oid='mkg_5-x'>
                      2 minutes ago
                    </span>
                  </div>
                </div>
                <div
                  className='flex items-center space-x-4 p-4 bg-blue-50 rounded-xl'
                  data-oid='5bwd7ku'
                >
                  <div
                    className='w-3 h-3 bg-blue-500 rounded-full'
                    data-oid='6av:tt1'
                  ></div>
                  <div className='flex-1' data-oid='et:uxcg'>
                    <p
                      className='text-sm text-blue-900 font-medium'
                      data-oid='e68ygue'
                    >
                      A/B test reached statistical significance
                    </p>
                    <span className='text-xs text-blue-600' data-oid='bm9v8.7'>
                      8 minutes ago
                    </span>
                  </div>
                </div>
                <div
                  className='flex items-center space-x-4 p-4 bg-yellow-50 rounded-xl'
                  data-oid='y.l_q-5'
                >
                  <div
                    className='w-3 h-3 bg-yellow-500 rounded-full'
                    data-oid='-abh-.v'
                  ></div>
                  <div className='flex-1' data-oid='1bcte6d'>
                    <p
                      className='text-sm text-blue-900 font-medium'
                      data-oid='un3:yv:'
                    >
                      User completed onboarding flow
                    </p>
                    <span className='text-xs text-blue-600' data-oid='h45igd:'>
                      12 minutes ago
                    </span>
                  </div>
                </div>
                <div
                  className='flex items-center space-x-4 p-4 bg-green-50 rounded-xl'
                  data-oid='1ea9z5j'
                >
                  <div
                    className='w-3 h-3 bg-green-500 rounded-full'
                    data-oid='ngzhvv_'
                  ></div>
                  <div className='flex-1' data-oid='9c42bv1'>
                    <p
                      className='text-sm text-blue-900 font-medium'
                      data-oid='t1w5kc_'
                    >
                      Payment received: $299/month plan
                    </p>
                    <span className='text-xs text-blue-600' data-oid='773g8.9'>
                      18 minutes ago
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Performance Indicators */}
            <div
              className='bg-white rounded-lg p-6 border border-blue-100 shadow-lg'
              data-oid='-10.ker'
            >
              <h4
                className='text-xl font-bold text-blue-900 mb-4'
                data-oid='a7mmpnv'
              >
                Performance Summary
              </h4>
              <div className='grid grid-cols-2 gap-6' data-oid='bn-crf:'>
                <div
                  className='text-center p-6 bg-blue-50 rounded-xl'
                  data-oid='kff71yi'
                >
                  <span
                    className='text-3xl font-bold text-blue-600'
                    data-oid='.aed_qa'
                  >
                    15.3%
                  </span>
                  <p
                    className='text-sm text-blue-700 font-medium'
                    data-oid='n48v_ip'
                  >
                    Conversion Rate
                  </p>
                  <span
                    className='text-xs text-green-600 font-semibold'
                    data-oid='k3ljz:m'
                  >
                    ↑ 2.1%
                  </span>
                </div>
                <div
                  className='text-center p-6 bg-green-50 rounded-xl'
                  data-oid='wy0r7hn'
                >
                  <span
                    className='text-3xl font-bold text-green-600'
                    data-oid='05zd0rw'
                  >
                    $127
                  </span>
                  <p
                    className='text-sm text-blue-700 font-medium'
                    data-oid='o61hvpq'
                  >
                    Avg. Deal Size
                  </p>
                  <span
                    className='text-xs text-green-600 font-semibold'
                    data-oid='t8am8l5'
                  >
                    ↑ $12
                  </span>
                </div>
                <div
                  className='text-center p-6 bg-yellow-50 rounded-xl'
                  data-oid='bdw-1vq'
                >
                  <span
                    className='text-3xl font-bold text-yellow-600'
                    data-oid='32w-zem'
                  >
                    18 days
                  </span>
                  <p
                    className='text-sm text-blue-700 font-medium'
                    data-oid='w9nnr1s'
                  >
                    Sales Cycle
                  </p>
                  <span
                    className='text-xs text-red-600 font-semibold'
                    data-oid='-b8mw23'
                  >
                    ↑ 2 days
                  </span>
                </div>
                <div
                  className='text-center p-6 bg-blue-50 rounded-xl'
                  data-oid='a2t89tg'
                >
                  <span
                    className='text-3xl font-bold text-blue-600'
                    data-oid='ev8o7z4'
                  >
                    94.2%
                  </span>
                  <p
                    className='text-sm text-blue-700 font-medium'
                    data-oid='ln-nzhy'
                  >
                    Model Accuracy
                  </p>
                  <span
                    className='text-xs text-green-600 font-semibold'
                    data-oid='g3z7cqt'
                  >
                    ↑ 1.8%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div
          className='grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8'
          data-oid='x-yr26f'
        >
          {/* System Health */}
          <section className='lg:col-span-1' data-oid='m2-cioc'>
            <h3
              className='text-2xl font-bold mb-4 text-blue-900'
              data-oid='2oo6_oa'
            >
              System Health
            </h3>
            <div
              className='bg-white rounded-lg shadow-xl border border-blue-100 p-6 h-96 flex flex-col'
              data-oid='ih:5xqs'
            >
              <div
                className='flex-1 overflow-y-auto dashboard-scrollable'
                data-oid='9b1ld7e'
              >
                <div className='space-y-4' data-oid='fxeeix4'>
                  <HealthIndicator
                    service='API Gateway'
                    status={apiConnected}
                    data-oid='44fx28o'
                  />

                  <HealthIndicator
                    service='ML Engine'
                    status={systemHealth.mlEngine || apiConnected}
                    data-oid='tkg74r.'
                  />

                  <HealthIndicator
                    service='A/B Testing'
                    status={systemHealth.abTesting || apiConnected}
                    data-oid='yf7p8ln'
                  />

                  <HealthIndicator
                    service='Analytics'
                    status={systemHealth.analytics || apiConnected}
                    data-oid='euynstq'
                  />

                  <HealthIndicator
                    service='Recommendations'
                    status={systemHealth.recommendations || apiConnected}
                    data-oid='0_uvx37'
                  />
                </div>
                <div
                  className='mt-8 pt-6 border-t border-blue-200'
                  data-oid='iihsxxe'
                >
                  <p
                    className='text-blue-600 text-xs mb-3 font-medium'
                    data-oid='z48kaeh'
                  >
                    System Status
                  </p>
                  <div
                    className='flex items-center justify-between'
                    data-oid='fd5hvyp'
                  >
                    <span
                      className='text-blue-900 font-semibold'
                      data-oid='lse2fhq'
                    >
                      Overall Health
                    </span>
                    <span
                      className='text-green-600 font-bold'
                      data-oid='ff.j-xo'
                    >
                      98.5%
                    </span>
                  </div>
                  <div
                    className='w-full bg-blue-100 rounded-full h-3 mt-3'
                    data-oid='o9-pggx'
                  >
                    <div
                      className='bg-green-500 h-3 rounded-full transition-all duration-500'
                      style={{ width: '98.5%' }}
                      data-oid='ox.lwia'
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Active A/B Experiments */}
          <section className='lg:col-span-1' data-oid='-na8vz1'>
            <h3
              className='text-2xl font-bold mb-4 text-blue-900'
              data-oid='t3lor4y'
            >
              Active Experiments
            </h3>
            <div
              className='bg-white rounded-lg shadow-xl border border-blue-100 p-6 h-96 flex flex-col'
              data-oid='6r0f1fl'
            >
              <div
                className='flex-1 overflow-y-auto dashboard-scrollable'
                data-oid='hbjzhlo'
              >
                <div className='space-y-6' data-oid='_cfoz-o'>
                  {experiments.map(experiment => (
                    <ExperimentCard
                      key={experiment.id}
                      experiment={experiment}
                      data-oid='8a-1spc'
                    />
                  ))}
                </div>
              </div>
              <div
                className='mt-8 pt-6 border-t border-blue-200'
                data-oid='w6vsd4e'
              >
                <button
                  className='w-full bg-blue-600 text-white py-3 px-6 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all duration-300'
                  data-oid='53wr4eu'
                >
                  View All Experiments
                </button>
              </div>
            </div>
          </section>

          {/* ML Model Performance */}
          <section className='lg:col-span-1' data-oid='hwy90t6'>
            <h3
              className='text-2xl font-bold mb-4 text-blue-900'
              data-oid='xpa4qq9'
            >
              ML Models
            </h3>
            <div
              className='bg-white rounded-lg shadow-xl border border-blue-100 p-6 h-96 flex flex-col'
              data-oid='0ai68ux'
            >
              <div
                className='flex-1 overflow-y-auto dashboard-scrollable'
                data-oid='hg:j2nv'
              >
                <div className='space-y-6' data-oid='__o-8wz'>
                  {modelMetrics.map((metric, index) => (
                    <ModelMetricCard
                      key={index}
                      metric={metric}
                      data-oid='eowr_ol'
                    />
                  ))}
                </div>
              </div>
              <div
                className='mt-8 pt-6 border-t border-blue-200'
                data-oid='lgmx51:'
              >
                <button
                  className='w-full bg-blue-600 text-white py-3 px-6 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all duration-300'
                  data-oid='_rbskzt'
                >
                  Model Refinement Page
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default UniversalAIDashboard;
