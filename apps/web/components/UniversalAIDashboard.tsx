import React, { useEffect, useState } from 'react';
import { AIModel, apiClient } from '../src/services/apiClient';
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
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalVisitors: 24789,
    totalSessions: 15432,
    conversionRate: 8.6,
    revenueGenerated: 847500,
    activeExperiments: 12,
    modelAccuracy: 94.2,
  });

  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    apiGateway: false,
    mlEngine: true,
    abTesting: true,
    analytics: true,
    recommendations: true,
  });

  const [experiments, setExperiments] = useState<Experiment[]>([
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

  const [modelMetrics, setModelMetrics] = useState<ModelMetric[]>([
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

        // Test API connection first with timeout
        const controller =
          typeof window !== 'undefined' && window.AbortController
            ? new window.AbortController()
            : null;
        const timeoutId = setTimeout(() => controller?.abort(), 3000); // 3 second timeout

        try {
          const healthResponse = await fetch('http://localhost:4000/health', {
            signal: controller?.signal,
            headers: {
              'Content-Type': 'application/json',
            },
          });
          clearTimeout(timeoutId);

          if (healthResponse.ok) {
            setApiConnected(true);

            // Fetch real data using existing API methods with timeout
            const fetchWithTimeout = async (
              promise: Promise<unknown>,
              timeout = 2000
            ) => {
              return Promise.race([
                promise,
                new Promise((_, reject) =>
                  setTimeout(
                    () => reject(new Error('Request timeout')),
                    timeout
                  )
                ),
              ]);
            };

            const [dashboardResponse, experimentsResponse, modelsResponse] =
              await Promise.allSettled([
                fetchWithTimeout(apiClient.getDashboardMetrics()),
                fetchWithTimeout(apiClient.getABTests()),
                fetchWithTimeout(apiClient.getModels()),
              ]);

            // Handle dashboard stats
            if (
              dashboardResponse.status === 'fulfilled' &&
              dashboardResponse.value
            ) {
              const data = dashboardResponse.value as DashboardStats;
              // Transform the response to match expected format
              setDashboardStats({
                totalVisitors: data?.totalVisitors || 24789,
                totalSessions: data?.totalSessions || 15432,
                conversionRate: data?.conversionRate || 8.6,
                revenueGenerated: data?.revenueGenerated || 847500,
                activeExperiments: data?.activeExperiments || 12,
                modelAccuracy: data?.modelAccuracy || 94.2,
              });
            }

            // Handle experiments
            if (
              experimentsResponse.status === 'fulfilled' &&
              experimentsResponse.value
            ) {
              const experiments = experimentsResponse.value as Experiment[];
              // Transform to expected format
              setExperiments(
                Array.isArray(experiments)
                  ? experiments.slice(0, 3).map((exp: Experiment) => ({
                      id: exp.id || '1',
                      name: exp.name || 'Unknown Experiment',
                      status: exp.status || 'Running',
                      conversionRate: exp.conversionRate || 10.0,
                      confidence: exp.confidence || 95,
                      industry: exp.industry || 'General',
                    }))
                  : experiments
              );
            }

            // Handle model metrics
            if (modelsResponse.status === 'fulfilled' && modelsResponse.value) {
              const models = modelsResponse.value as AIModel[];
              // Transform to expected format
              setModelMetrics(
                Array.isArray(models)
                  ? models.slice(0, 3).map((model: AIModel) => ({
                      name: model.name || 'Unknown Model',
                      accuracy: model.accuracy || 90.0,
                      confidence: 85.0, // AIModel doesn't have confidence, use default
                      status: model.status || 'Active',
                    }))
                  : []
              );
            }

            setSystemHealth({
              apiGateway: true,
              mlEngine: true,
              abTesting: true,
              analytics: true,
              recommendations: true,
            });
          } else {
            throw new Error('API connection failed');
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          throw fetchError;
        }
      } catch {
        setApiConnected(false);
      } finally {
        // Ensure loading is always set to false
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Set up periodic updates
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle: string;
    trend?: string;
    icon: string;
  }> = ({ title, value, subtitle, trend, icon }) => (
    <div
      className='bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg'
      data-oid='3c4:k1h'
    >
      <div className='mb-2' data-oid='jm5y8ak'>
        <div className='text-2xl font-bold text-gray-900' data-oid='wwh4680'>
          {value || 0}
        </div>
        <div className='text-sm text-gray-600' data-oid='x1qjiit'>
          {title}
        </div>
      </div>
      {trend && (
        <div className='text-xs text-green-600' data-oid='svmy:j6'>
          {trend}
        </div>
      )}
    </div>
  );

  const HealthIndicator: React.FC<{ service: string; status: boolean }> = ({
    service,
    status,
  }) => (
    <div className='flex items-center justify-between py-2' data-oid='v3-pj85'>
      <span className='text-gray-600 text-sm' data-oid='9.t3xrv'>
        {service}
      </span>
      <div className='flex items-center' data-oid='c.nug8s'>
        <div
          className={`w-2 h-2 rounded-full mr-2 ${status ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`}
          data-oid='6-z1m6f'
        />

        <span
          className={`text-xs font-medium ${status ? 'text-blue-600' : 'text-gray-600'}`}
          data-oid=':4q92m8'
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
      className='bg-gray-50 p-4 rounded-lg border border-gray-200'
      data-oid='gnljat5'
    >
      <div
        className='flex items-center justify-between mb-2'
        data-oid='ld9jot7'
      >
        <h4 className='text-gray-900 font-medium text-sm' data-oid='zxzp.a9'>
          {experiment.name}
        </h4>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            experiment.status === 'Running'
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-gray-100 text-gray-700 border border-gray-200'
          }`}
          data-oid='la.ld6f'
        >
          {experiment.status}
        </span>
      </div>
      <div className='grid grid-cols-2 gap-2 text-xs' data-oid='_fv-f7h'>
        <div data-oid='f.2-bue'>
          <span className='text-gray-500' data-oid='36dd99-'>
            Conversion:{' '}
          </span>
          <span
            className={`font-medium ${
              experiment.conversionRate > 10
                ? 'text-green-600'
                : experiment.conversionRate > 5
                  ? 'text-orange-500'
                  : 'text-red-600'
            }`}
            data-oid='sv2qf:-'
          >
            {experiment.conversionRate}%
          </span>
        </div>
        <div data-oid='3r-.6gr'>
          <span className='text-gray-500' data-oid='.ybyf-h'>
            Confidence:{' '}
          </span>
          <span
            className={`font-medium ${
              experiment.confidence > 95
                ? 'text-green-600'
                : experiment.confidence > 80
                  ? 'text-orange-500'
                  : 'text-red-600'
            }`}
            data-oid='d05-9_2'
          >
            {experiment.confidence}%
          </span>
        </div>
      </div>
      <p className='text-xs text-blue-600 mt-2' data-oid='1:1f67-'>
        {experiment.industry}
      </p>
    </div>
  );

  const ModelMetricCard: React.FC<{ metric: ModelMetric }> = ({ metric }) => (
    <div
      className='bg-gray-50 p-4 rounded-lg border border-gray-200'
      data-oid='9frls8-'
    >
      <div
        className='flex items-center justify-between mb-2'
        data-oid='mp:77q9'
      >
        <h4 className='text-gray-900 font-medium text-sm' data-oid='i9te6w8'>
          {metric.name}
        </h4>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            metric.status === 'Active'
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-gray-100 text-gray-700 border border-gray-200'
          }`}
          data-oid='rzfd923'
        >
          {metric.status}
        </span>
      </div>
      <div className='grid grid-cols-2 gap-2 text-xs' data-oid='_ja_wtq'>
        <div data-oid='q6jlduq'>
          <span className='text-gray-500' data-oid='a_1ufpi'>
            Accuracy:{' '}
          </span>
          <span
            className={`font-medium ${
              metric.accuracy > 95
                ? 'text-green-600'
                : metric.accuracy > 85
                  ? 'text-orange-500'
                  : 'text-red-600'
            }`}
            data-oid='_si_agf'
          >
            {metric.accuracy}%
          </span>
        </div>
        <div data-oid='_ajl3um'>
          <span className='text-gray-500' data-oid='22rmgue'>
            Confidence:{' '}
          </span>
          <span
            className={`font-medium ${
              metric.confidence > 95
                ? 'text-green-600'
                : metric.confidence > 85
                  ? 'text-orange-500'
                  : 'text-red-600'
            }`}
            data-oid='6.cmklf'
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
        className='min-h-screen bg-gradient-to-br from-background-primary via-background-secondary to-background-primary flex items-center justify-center'
        data-oid=':4_63g9'
      >
        <div className='text-center' data-oid='a:krcaf'>
          <div
            className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4'
            data-oid='dasj61v'
          ></div>
          <p className='text-text-secondary' data-oid='7qewdxc'>
            Loading Optelo Platform...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 text-gray-900' data-oid='y14-0_5'>
      <style jsx data-oid='jhucejd'>{`
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
      {/* Header */}

      {/* Main Content */}
      <main className='max-w-7xl mx-auto px-6 py-8' data-oid='18n4m4s'>
        {/* Key Metrics */}
        <section className='mb-8' data-oid='k3eextj'>
          <h2
            className='text-2xl font-bold mb-6 flex items-center text-gray-900'
            data-oid='ni2r09m'
          >
            <span className='text-blue-600' data-oid='ca5j8y4'>
              Analytics Overview
            </span>
          </h2>

          <div
            className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6'
            data-oid='-yhwcbh'
          >
            <StatCard
              title='Total Visitors'
              value={dashboardStats?.totalVisitors?.toLocaleString() || '0'}
              subtitle='Cross-platform tracking'
              trend='+12.3% this week'
              icon='VIS'
              data-oid='g-494xo'
              key='olk--CZz'
            />

            <StatCard
              title='Active Sessions'
              value={dashboardStats?.totalSessions?.toLocaleString() || '0'}
              subtitle='Real-time monitoring'
              trend='+8.7% today'
              icon='SES'
              data-oid='fzvsc-_'
              key='olk-pzli'
            />

            <StatCard
              title='Conversion Rate'
              value={`${dashboardStats?.conversionRate || 0}%`}
              subtitle='AI-optimized funnels'
              trend='+2.1% improvement'
              icon='CVR'
              data-oid='21.snpj'
              key='olk-0RSF'
            />

            <StatCard
              title='A/B Experiments'
              value={dashboardStats?.activeExperiments || '0'}
              subtitle='Running across industries'
              trend='3 completed today'
              icon='AB'
              data-oid='ojc0-br'
              key='olk-_fqI'
            />

            <StatCard
              title='Model Accuracy'
              value={`${dashboardStats?.modelAccuracy || 0}%`}
              subtitle='ML performance'
              trend='+1.8% improvement'
              icon='ML'
              data-oid='4t:ou:d'
              key='olk-Uqdb'
            />
          </div>
        </section>

        {/* Enhanced Analytics Section */}
        <section className='mt-8' data-oid='pez31fe'>
          <h3
            className='text-xl font-semibold mb-6 text-blue-600'
            data-oid='z-4840b'
          >
            Detailed Analytics
          </h3>

          {/* Conversion Rate Trend Chart - Now First */}
          <div className='mb-8' data-oid='j694z.e'>
            <ConversionRateTrendChart data-oid='mucxjuh' />
          </div>

          {/* Main Analytics Charts */}
          <div
            className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'
            data-oid='v2iq:pn'
          >
            <div
              className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm h-[498px]'
              data-oid='65mm1r5'
            >
              <h4
                className='text-lg font-semibold text-gray-900 mb-4'
                data-oid='lb3233a'
              >
                Conversion Funnel
              </h4>
              <div
                className='h-[420px] flex flex-col justify-center'
                data-oid='_4ox-_u'
              >
                {/* Interactive Funnel Visualization */}
                <div className='space-y-4' data-oid='7._3aqb'>
                  {/* Visitors - Top of funnel */}
                  <div
                    className='relative group cursor-pointer transition-all duration-300 hover:scale-105'
                    data-oid='qe09rh8'
                  >
                    <div
                      className='bg-gradient-to-r from-blue-500 to-blue-600 h-16 rounded-lg shadow-lg flex items-center justify-between px-6 text-white'
                      data-oid='-d40968'
                    >
                      <div data-oid='daev-rx'>
                        <div className='text-lg font-bold' data-oid='bs-u55-'>
                          24,789
                        </div>
                        <div className='text-sm opacity-90' data-oid='3e1-:9w'>
                          Visitors
                        </div>
                      </div>
                      <div className='text-right' data-oid='b63xqko'>
                        <div className='text-sm opacity-90' data-oid='571x7_w'>
                          100%
                        </div>
                        <div className='text-xs opacity-75' data-oid='ugruyar'>
                          +12.3% vs last week
                        </div>
                      </div>
                    </div>
                    {/* Tooltip */}
                    <div
                      className='absolute left-1/2 transform -translate-x-1/2 -top-12 bg-gray-900 text-white px-3 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap'
                      data-oid='c:yea6d'
                    >
                      Total unique visitors across all channels
                    </div>
                  </div>

                  {/* Sign-ups */}
                  <div
                    className='relative group cursor-pointer transition-all duration-300 hover:scale-105 ml-8'
                    data-oid='2t-a-57'
                  >
                    <div
                      className='bg-gradient-to-r from-green-500 to-green-600 h-14 rounded-lg shadow-lg flex items-center justify-between px-6 text-white'
                      style={{ width: '85%' }}
                      data-oid='ymntvyb'
                    >
                      <div data-oid='z5flwp9'>
                        <div className='text-lg font-bold' data-oid='9bysfw1'>
                          11,155
                        </div>
                        <div className='text-sm opacity-90' data-oid='bwo6vsh'>
                          Sign-ups
                        </div>
                      </div>
                      <div className='text-right' data-oid='iyxr.zx'>
                        <div className='text-sm opacity-90' data-oid=':ptnfo4'>
                          45%
                        </div>
                        <div className='text-xs opacity-75' data-oid='ti2esoy'>
                          +8.7% conversion
                        </div>
                      </div>
                    </div>
                    <div
                      className='absolute left-1/2 transform -translate-x-1/2 -top-12 bg-gray-900 text-white px-3 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap'
                      data-oid='cvys4yc'
                    >
                      Users who completed registration
                    </div>
                  </div>

                  {/* Trial Users */}
                  <div
                    className='relative group cursor-pointer transition-all duration-300 hover:scale-105 ml-16'
                    data-oid='j1nlw2z'
                  >
                    <div
                      className='bg-gradient-to-r from-orange-500 to-orange-600 h-12 rounded-lg shadow-lg flex items-center justify-between px-6 text-white'
                      style={{ width: '70%' }}
                      data-oid='t4on3um'
                    >
                      <div data-oid='55_qxpc'>
                        <div className='text-lg font-bold' data-oid='npc9tff'>
                          6,197
                        </div>
                        <div className='text-sm opacity-90' data-oid='p3ywn00'>
                          Trial Users
                        </div>
                      </div>
                      <div className='text-right' data-oid='be:.djg'>
                        <div className='text-sm opacity-90' data-oid='aoj:ono'>
                          25%
                        </div>
                        <div className='text-xs opacity-75' data-oid='vifjrbw'>
                          55.6% from signups
                        </div>
                      </div>
                    </div>
                    <div
                      className='absolute left-1/2 transform -translate-x-1/2 -top-12 bg-gray-900 text-white px-3 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap'
                      data-oid='66v._xa'
                    >
                      Active trial subscriptions
                    </div>
                  </div>

                  {/* Paid Customers */}
                  <div
                    className='relative group cursor-pointer transition-all duration-300 hover:scale-105 ml-24'
                    data-oid='f-k0e8m'
                  >
                    <div
                      className='bg-gradient-to-r from-purple-500 to-purple-600 h-10 rounded-lg shadow-lg flex items-center justify-between px-6 text-white'
                      style={{ width: '55%' }}
                      data-oid='kl25r1j'
                    >
                      <div data-oid='hhv7k2l'>
                        <div className='text-lg font-bold' data-oid=':hny0mi'>
                          1,983
                        </div>
                        <div className='text-sm opacity-90' data-oid='hvvsh11'>
                          Paid Customers
                        </div>
                      </div>
                      <div className='text-right' data-oid='ia68_.1'>
                        <div className='text-sm opacity-90' data-oid='275hkqz'>
                          8%
                        </div>
                        <div className='text-xs opacity-75' data-oid='woazb3k'>
                          32% from trials
                        </div>
                      </div>
                    </div>
                    <div
                      className='absolute left-1/2 transform -translate-x-1/2 -top-12 bg-gray-900 text-white px-3 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap'
                      data-oid='7c:tb0n'
                    >
                      Converting paid subscribers
                    </div>
                  </div>
                </div>

                {/* Funnel Insights */}
                <div
                  className='mt-6 pt-4 border-t border-gray-200'
                  data-oid='xqlkoke'
                >
                  <div
                    className='grid grid-cols-3 gap-4 text-center'
                    data-oid='3hgkjc2'
                  >
                    <div data-oid='2qq5-gg'>
                      <div
                        className='text-sm font-semibold text-green-600'
                        data-oid='he.knn7'
                      >
                        Best Stage
                      </div>
                      <div className='text-xs text-gray-600' data-oid='.kkt12-'>
                        Visitor → Signup
                      </div>
                      <div className='text-xs text-gray-500' data-oid='0b21rua'>
                        45% conversion
                      </div>
                    </div>
                    <div data-oid='ja-6x1l'>
                      <div
                        className='text-sm font-semibold text-orange-600'
                        data-oid='-cok_ax'
                      >
                        Opportunity
                      </div>
                      <div className='text-xs text-gray-600' data-oid='lajl.ln'>
                        Trial → Paid
                      </div>
                      <div className='text-xs text-gray-500' data-oid='_hcza:i'>
                        32% conversion
                      </div>
                    </div>
                    <div data-oid='mt5_v8k'>
                      <div
                        className='text-sm font-semibold text-blue-600'
                        data-oid='kx6wt6.'
                      >
                        Overall
                      </div>
                      <div className='text-xs text-gray-600' data-oid='8.7w8.9'>
                        End-to-end
                      </div>
                      <div className='text-xs text-gray-500' data-oid='iith94d'>
                        8% conversion
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Switchable Web Metrics Chart - Replaces MRR Chart */}
            <WebMetricsChart data-oid='kh0aaow' />
          </div>

          {/* A/B Testing Performance */}
          <div
            className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'
            data-oid=':h3dm4z'
          >
            <div
              className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm'
              data-oid='mw82ixm'
            >
              <h4
                className='text-lg font-semibold text-gray-900 mb-4'
                data-oid=':va-jx:'
              >
                Active A/B Tests
              </h4>
              <div className='space-y-4' data-oid='qxl5wv3'>
                <div
                  className='border-l-4 border-green-500 pl-4'
                  data-oid='989z:4a'
                >
                  <h5 className='font-medium text-gray-900' data-oid='wj:z_yn'>
                    Pricing Page CTA
                  </h5>
                  <p className='text-sm text-gray-600' data-oid='5n-lpts'>
                    Testing button colors
                  </p>
                  <div
                    className='flex items-center justify-between mt-2'
                    data-oid='shkf5nm'
                  >
                    <span className='text-xs text-gray-500' data-oid='x_.rk.o'>
                      Confidence
                    </span>
                    <span
                      className='text-sm font-bold text-green-600'
                      data-oid='bbrw4ya'
                    >
                      96%
                    </span>
                  </div>
                </div>
                <div
                  className='border-l-4 border-blue-500 pl-4'
                  data-oid='kv9hm7x'
                >
                  <h5 className='font-medium text-gray-900' data-oid='dys-t_8'>
                    Onboarding Flow
                  </h5>
                  <p className='text-sm text-gray-600' data-oid='olwqmw6'>
                    3-step vs 5-step
                  </p>
                  <div
                    className='flex items-center justify-between mt-2'
                    data-oid='6q2o2na'
                  >
                    <span className='text-xs text-gray-500' data-oid='my5.xvn'>
                      Confidence
                    </span>
                    <span
                      className='text-sm font-bold text-blue-600'
                      data-oid='wse8dy:'
                    >
                      78%
                    </span>
                  </div>
                </div>
                <div
                  className='border-l-4 border-orange-500 pl-4'
                  data-oid='mcotqh0'
                >
                  <h5 className='font-medium text-gray-900' data-oid=':_juze5'>
                    Email Subject Lines
                  </h5>
                  <p className='text-sm text-gray-600' data-oid='1-0mkzr'>
                    Personalization test
                  </p>
                  <div
                    className='flex items-center justify-between mt-2'
                    data-oid='ett6:-5'
                  >
                    <span className='text-xs text-gray-500' data-oid='g5o4n4.'>
                      Confidence
                    </span>
                    <span
                      className='text-sm font-bold text-orange-600'
                      data-oid='212al9x'
                    >
                      45%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* User Engagement Metrics */}
            <div
              className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm'
              data-oid='eqil4dm'
            >
              <h4
                className='text-lg font-semibold text-gray-900 mb-4'
                data-oid='ydmzhvu'
              >
                Engagement
              </h4>
              <div className='space-y-4' data-oid='hde5qjp'>
                <div data-oid='utlxgvn'>
                  <div
                    className='flex items-center justify-between mb-1'
                    data-oid='jg-uihk'
                  >
                    <span className='text-sm text-gray-600' data-oid='pql7ocu'>
                      Daily Active Users
                    </span>
                    <span
                      className='text-sm font-bold text-gray-900'
                      data-oid='40.0.l1'
                    >
                      8,943
                    </span>
                  </div>
                  <div
                    className='w-full bg-gray-200 rounded-full h-2'
                    data-oid='v_dxl6f'
                  >
                    <div
                      className='bg-green-600 h-2 rounded-full'
                      style={{ width: '73%' }}
                      data-oid='eaw_56n'
                    ></div>
                  </div>
                  <span className='text-xs text-green-600' data-oid='rwu_bl6'>
                    +8.2% vs last week
                  </span>
                </div>
                <div data-oid='i3994la'>
                  <div
                    className='flex items-center justify-between mb-1'
                    data-oid='z04ru05'
                  >
                    <span className='text-sm text-gray-600' data-oid=':vf:9no'>
                      Session Duration
                    </span>
                    <span
                      className='text-sm font-bold text-gray-900'
                      data-oid='8gb920g'
                    >
                      12m 34s
                    </span>
                  </div>
                  <div
                    className='w-full bg-gray-200 rounded-full h-2'
                    data-oid='fy6lzxk'
                  >
                    <div
                      className='bg-blue-600 h-2 rounded-full'
                      style={{ width: '68%' }}
                      data-oid='hy-xr7x'
                    ></div>
                  </div>
                  <span className='text-xs text-blue-600' data-oid='m9y7.b4'>
                    +2.1% vs last week
                  </span>
                </div>
                <div data-oid='p0:be:z'>
                  <div
                    className='flex items-center justify-between mb-1'
                    data-oid='m747r5u'
                  >
                    <span className='text-sm text-gray-600' data-oid='uptzlbe'>
                      Feature Adoption
                    </span>
                    <span
                      className='text-sm font-bold text-gray-900'
                      data-oid='c-jg11_'
                    >
                      67%
                    </span>
                  </div>
                  <div
                    className='w-full bg-gray-200 rounded-full h-2'
                    data-oid='c88xac3'
                  >
                    <div
                      className='bg-orange-600 h-2 rounded-full'
                      style={{ width: '67%' }}
                      data-oid='53i5b._'
                    ></div>
                  </div>
                  <span className='text-xs text-orange-600' data-oid='sdeqz6-'>
                    -1.3% vs last week
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Satisfaction */}
            <div
              className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm'
              data-oid='9_5:veq'
            >
              <h4
                className='text-lg font-semibold text-gray-900 mb-4'
                data-oid='q-_ca._'
              >
                Customer Metrics
              </h4>
              <div className='space-y-4' data-oid='z:tfhts'>
                <div className='text-center' data-oid='-yt_-sm'>
                  <div
                    className='inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-2'
                    data-oid=':qp0ewy'
                  >
                    <span
                      className='text-2xl font-bold text-green-600'
                      data-oid='1y.8mmw'
                    >
                      8.7
                    </span>
                  </div>
                  <p className='text-sm text-gray-600' data-oid='3dpa.-d'>
                    Customer Satisfaction Score
                  </p>
                  <span className='text-xs text-green-600' data-oid='9ue7pe1'>
                    Excellent
                  </span>
                </div>
                <div
                  className='grid grid-cols-2 gap-4 pt-4 border-t border-gray-200'
                  data-oid='90-15n:'
                >
                  <div className='text-center' data-oid='99lf292'>
                    <span
                      className='text-lg font-bold text-gray-900'
                      data-oid='b:j6fk:'
                    >
                      2.1%
                    </span>
                    <p className='text-xs text-gray-600' data-oid='m.n:t3b'>
                      Churn Rate
                    </p>
                    <span className='text-xs text-green-600' data-oid='x.ivz7-'>
                      ↓ 0.3%
                    </span>
                  </div>
                  <div className='text-center' data-oid='d7wof_4'>
                    <span
                      className='text-lg font-bold text-gray-900'
                      data-oid='puy6t.2'
                    >
                      94%
                    </span>
                    <p className='text-xs text-gray-600' data-oid='z0ccz8q'>
                      Retention
                    </p>
                    <span className='text-xs text-green-600' data-oid='5xn5tkx'>
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
            data-oid='cyryzfs'
          >
            <div
              className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm'
              data-oid='8-xz-2z'
            >
              <h4
                className='text-lg font-semibold text-gray-900 mb-4'
                data-oid='t4505m7'
              >
                Real-time Activity
              </h4>
              <div className='space-y-3' data-oid='bt3:czh'>
                <div
                  className='flex items-center space-x-3 p-3 bg-green-50 rounded-lg'
                  data-oid='gns.ct2'
                >
                  <div
                    className='w-2 h-2 bg-green-500 rounded-full'
                    data-oid='fva-ky8'
                  ></div>
                  <div className='flex-1' data-oid='1q6il3c'>
                    <p className='text-sm text-gray-900' data-oid='ib2hcl0'>
                      New trial signup from enterprise lead
                    </p>
                    <span className='text-xs text-gray-500' data-oid='aoidktf'>
                      2 minutes ago
                    </span>
                  </div>
                </div>
                <div
                  className='flex items-center space-x-3 p-3 bg-blue-50 rounded-lg'
                  data-oid='igv0od8'
                >
                  <div
                    className='w-2 h-2 bg-blue-500 rounded-full'
                    data-oid='lb_dp_h'
                  ></div>
                  <div className='flex-1' data-oid='.ingx82'>
                    <p className='text-sm text-gray-900' data-oid='a1nw0kj'>
                      A/B test reached statistical significance
                    </p>
                    <span className='text-xs text-gray-500' data-oid='fkyrl3f'>
                      8 minutes ago
                    </span>
                  </div>
                </div>
                <div
                  className='flex items-center space-x-3 p-3 bg-orange-50 rounded-lg'
                  data-oid='71hb.6_'
                >
                  <div
                    className='w-2 h-2 bg-orange-500 rounded-full'
                    data-oid='x12ul-.'
                  ></div>
                  <div className='flex-1' data-oid='reqopdl'>
                    <p className='text-sm text-gray-900' data-oid='-ua8o:d'>
                      User completed onboarding flow
                    </p>
                    <span className='text-xs text-gray-500' data-oid='5pda5--'>
                      12 minutes ago
                    </span>
                  </div>
                </div>
                <div
                  className='flex items-center space-x-3 p-3 bg-green-50 rounded-lg'
                  data-oid='c-okuf.'
                >
                  <div
                    className='w-2 h-2 bg-green-500 rounded-full'
                    data-oid=':wzx-bq'
                  ></div>
                  <div className='flex-1' data-oid='g8eja1-'>
                    <p className='text-sm text-gray-900' data-oid='j64aqtl'>
                      Payment received: $299/month plan
                    </p>
                    <span className='text-xs text-gray-500' data-oid='m5525u9'>
                      18 minutes ago
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Performance Indicators */}
            <div
              className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm'
              data-oid='m_-t4l5'
            >
              <h4
                className='text-lg font-semibold text-gray-900 mb-4'
                data-oid='zwa1-vf'
              >
                Performance Summary
              </h4>
              <div className='grid grid-cols-2 gap-4' data-oid='mbi9pgs'>
                <div
                  className='text-center p-4 bg-blue-50 rounded-lg'
                  data-oid='t9h3vx2'
                >
                  <span
                    className='text-2xl font-bold text-blue-600'
                    data-oid='v38q79c'
                  >
                    15.3%
                  </span>
                  <p className='text-sm text-gray-600' data-oid='j:t61t1'>
                    Conversion Rate
                  </p>
                  <span className='text-xs text-green-600' data-oid='ilk42t6'>
                    ↑ 2.1%
                  </span>
                </div>
                <div
                  className='text-center p-4 bg-green-50 rounded-lg'
                  data-oid='y7._ozp'
                >
                  <span
                    className='text-2xl font-bold text-green-600'
                    data-oid='i-b9e59'
                  >
                    $127
                  </span>
                  <p className='text-sm text-gray-600' data-oid='87uumtk'>
                    Avg. Deal Size
                  </p>
                  <span className='text-xs text-green-600' data-oid='abae_b4'>
                    ↑ $12
                  </span>
                </div>
                <div
                  className='text-center p-4 bg-orange-50 rounded-lg'
                  data-oid='7c1eh:m'
                >
                  <span
                    className='text-2xl font-bold text-orange-600'
                    data-oid='1726uf.'
                  >
                    18 days
                  </span>
                  <p className='text-sm text-gray-600' data-oid='d:iec7f'>
                    Sales Cycle
                  </p>
                  <span className='text-xs text-red-600' data-oid='cf7mk67'>
                    ↑ 2 days
                  </span>
                </div>
                <div
                  className='text-center p-4 bg-blue-50 rounded-lg'
                  data-oid='y.so4hf'
                >
                  <span
                    className='text-2xl font-bold text-blue-600'
                    data-oid='fri-ypg'
                  >
                    94.2%
                  </span>
                  <p className='text-sm text-gray-600' data-oid='ilfglxy'>
                    Model Accuracy
                  </p>
                  <span className='text-xs text-green-600' data-oid='ouon7ru'>
                    ↑ 1.8%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div
          className='grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12'
          data-oid='i04atkc'
        >
          {/* System Health */}
          <section className='lg:col-span-1' data-oid='4dm:.:s'>
            <h3
              className='text-xl font-semibold mb-4 text-gray-900'
              data-oid='vwmmteh'
            >
              System Health
            </h3>
            <div
              className='bg-white rounded-xl shadow-lg border border-gray-200 p-6 h-96 flex flex-col'
              data-oid='9lg8khy'
            >
              <div
                className='flex-1 overflow-y-auto dashboard-scrollable'
                data-oid='vvrick4'
              >
                <div className='space-y-3' data-oid='b1jyghy'>
                  <HealthIndicator
                    service='API Gateway'
                    status={apiConnected}
                    data-oid='b0v:y2d'
                  />

                  <HealthIndicator
                    service='ML Engine'
                    status={systemHealth.mlEngine || apiConnected}
                    data-oid='v_uzu8f'
                  />

                  <HealthIndicator
                    service='A/B Testing'
                    status={systemHealth.abTesting || apiConnected}
                    data-oid='edj2324'
                  />

                  <HealthIndicator
                    service='Analytics'
                    status={systemHealth.analytics || apiConnected}
                    data-oid='ug664sl'
                  />

                  <HealthIndicator
                    service='Recommendations'
                    status={systemHealth.recommendations || apiConnected}
                    data-oid='o0gzzcd'
                  />
                </div>

                <div
                  className='mt-6 pt-4 border-t border-gray-200'
                  data-oid='z6aup29'
                >
                  <p className='text-gray-500 text-xs mb-2' data-oid='u._sms:'>
                    System Status
                  </p>
                  <div
                    className='flex items-center justify-between'
                    data-oid='22t:_xh'
                  >
                    <span
                      className='text-gray-900 font-medium'
                      data-oid='159gypy'
                    >
                      Overall Health
                    </span>
                    <span
                      className='text-green-600 font-bold'
                      data-oid='vbqj2a.'
                    >
                      98.5%
                    </span>
                  </div>
                  <div
                    className='w-full bg-gray-200 rounded-full h-2 mt-2'
                    data-oid='2s6sx9h'
                  >
                    <div
                      className='bg-green-500 h-2 rounded-full transition-all duration-500'
                      style={{ width: '98.5%' }}
                      data-oid='t0sw76t'
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Active A/B Experiments */}
          <section className='lg:col-span-1' data-oid='ku-jdq7'>
            <h3
              className='text-xl font-semibold mb-4 text-gray-900'
              data-oid='01ts_vm'
            >
              Active Experiments
            </h3>
            <div
              className='bg-white rounded-xl shadow-lg border border-gray-200 p-6 h-96 flex flex-col'
              data-oid='s08901g'
            >
              <div
                className='flex-1 overflow-y-auto dashboard-scrollable'
                data-oid='mbg2d2a'
              >
                <div className='space-y-4' data-oid='kj_id2w'>
                  {experiments.map(experiment => (
                    <ExperimentCard
                      key={experiment.id}
                      experiment={experiment}
                      data-oid='fbn7yyr'
                    />
                  ))}
                </div>
              </div>

              <div
                className='mt-6 pt-4 border-t border-gray-200'
                data-oid='nztlnpf'
              >
                <button
                  className='w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all duration-300'
                  data-oid='_3o6pij'
                >
                  View All Experiments
                </button>
              </div>
            </div>
          </section>

          {/* ML Model Performance */}
          <section className='lg:col-span-1' data-oid='vqmyygh'>
            <h3
              className='text-xl font-semibold mb-4 text-gray-900'
              data-oid='-.ktksh'
            >
              ML Models
            </h3>
            <div
              className='bg-white rounded-xl shadow-lg border border-gray-200 p-6 h-96 flex flex-col'
              data-oid='c8ip70y'
            >
              <div
                className='flex-1 overflow-y-auto dashboard-scrollable'
                data-oid='hl814in'
              >
                <div className='space-y-4' data-oid='lu2sxiy'>
                  {modelMetrics.map((metric, index) => (
                    <ModelMetricCard
                      key={index}
                      metric={metric}
                      data-oid='qkol0fz'
                    />
                  ))}
                </div>
              </div>

              <div
                className='mt-6 pt-4 border-t border-gray-200'
                data-oid='dfr413t'
              >
                <button
                  className='w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all duration-300'
                  data-oid='6mu2f4g'
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
