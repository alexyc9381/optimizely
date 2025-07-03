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
      data-oid='nn71xrs'
    >
      <div className='mb-2' data-oid='zgq-pe6' key='olk-ch7D'>
        <div className='text-2xl font-bold text-gray-900' data-oid='h3l0k1b'>
          {value || 0}
        </div>
        <div className='text-sm text-gray-600' data-oid='7-iwfhq'>
          {title}
        </div>
      </div>
      {trend && (
        <div className='text-xs text-green-600' data-oid='x1::7m.'>
          {trend}
        </div>
      )}
    </div>
  );

  const HealthIndicator: React.FC<{ service: string; status: boolean }> = ({
    service,
    status,
  }) => (
    <div className='flex items-center justify-between py-2' data-oid='hp_4jg-'>
      <span className='text-gray-600 text-sm' data-oid='soz:9gv'>
        {service}
      </span>
      <div className='flex items-center' data-oid='x9lzp5r'>
        <div
          className={`w-2 h-2 rounded-full mr-2 ${status ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`}
          data-oid='mtse0k7'
        />

        <span
          className={`text-xs font-medium ${status ? 'text-blue-600' : 'text-gray-600'}`}
          data-oid='1u9sqss'
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
      data-oid='e3-p8t1'
    >
      <div
        className='flex items-center justify-between mb-2'
        data-oid='f.a14k:'
      >
        <h4 className='text-gray-900 font-medium text-sm' data-oid='ov_nhd:'>
          {experiment.name}
        </h4>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            experiment.status === 'Running'
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-gray-100 text-gray-700 border border-gray-200'
          }`}
          data-oid='dzi0h9_'
        >
          {experiment.status}
        </span>
      </div>
      <div className='grid grid-cols-2 gap-2 text-xs' data-oid='oz:ab1x'>
        <div data-oid='ae9.8ss'>
          <span className='text-gray-500' data-oid='s0ep:co'>
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
            data-oid='omlfhjy'
          >
            {experiment.conversionRate}%
          </span>
        </div>
        <div data-oid='16r4109'>
          <span className='text-gray-500' data-oid='.7qfnru'>
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
            data-oid='28_e6t1'
          >
            {experiment.confidence}%
          </span>
        </div>
      </div>
      <p className='text-xs text-blue-600 mt-2' data-oid='obr9r1f'>
        {experiment.industry}
      </p>
    </div>
  );

  const ModelMetricCard: React.FC<{ metric: ModelMetric }> = ({ metric }) => (
    <div
      className='bg-gray-50 p-4 rounded-lg border border-gray-200'
      data-oid='8j5ax6v'
    >
      <div
        className='flex items-center justify-between mb-2'
        data-oid='i2w.m7p'
      >
        <h4 className='text-gray-900 font-medium text-sm' data-oid='k4:x.f4'>
          {metric.name}
        </h4>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            metric.status === 'Active'
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-gray-100 text-gray-700 border border-gray-200'
          }`}
          data-oid='o5c50n5'
        >
          {metric.status}
        </span>
      </div>
      <div className='grid grid-cols-2 gap-2 text-xs' data-oid='lcqig3_'>
        <div data-oid='7.d:.tg'>
          <span className='text-gray-500' data-oid='cn10nup'>
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
            data-oid='avcbeyh'
          >
            {metric.accuracy}%
          </span>
        </div>
        <div data-oid='ne5jujg'>
          <span className='text-gray-500' data-oid='q3ms.qh'>
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
            data-oid='_vr_thm'
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
        data-oid='-:hntvw'
      >
        <div className='text-center' data-oid='-q4kr::'>
          <div
            className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4'
            data-oid='-5b_3mp'
          ></div>
          <p className='text-text-secondary' data-oid='wt12req'>
            Loading Optelo Platform...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 text-gray-900' data-oid='2q_kd6b'>
      <style jsx data-oid='_q-ncyb'>{`
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
      <main className='max-w-7xl mx-auto px-6 py-8' data-oid='6c-r2pp'>
        {/* Key Metrics */}
        <section className='mb-8' data-oid='59e2n6j'>
          <h2
            className='text-2xl font-bold mb-6 flex items-center text-gray-900'
            data-oid='mcybnvi'
          >
            <span className='text-blue-600' data-oid='8xi4-:n' key='olk-awWV'>
              Analytics Overview
            </span>
          </h2>

          <div
            className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6'
            data-oid='wey28mt'
          >
            <StatCard
              title='Total Visitors'
              value={dashboardStats?.totalVisitors?.toLocaleString() || '0'}
              subtitle='Cross-platform tracking'
              trend='+12.3% this week'
              icon='VIS'
              data-oid='v5n_qu1'
            />

            <StatCard
              title='Active Sessions'
              value={dashboardStats?.totalSessions?.toLocaleString() || '0'}
              subtitle='Real-time monitoring'
              trend='+8.7% today'
              icon='SES'
              data-oid='0yhfbak'
            />

            <StatCard
              title='Conversion Rate'
              value={`${dashboardStats?.conversionRate || 0}%`}
              subtitle='AI-optimized funnels'
              trend='+2.1% improvement'
              icon='CVR'
              data-oid='s3w.8-g'
            />

            <StatCard
              title='Revenue Generated'
              value={`$${Math.round((dashboardStats?.revenueGenerated || 0) / 1000)}K`}
              subtitle='Attribution modeling'
              trend='+15.4% this month'
              icon='REV'
              data-oid='95e4wn_'
            />

            <StatCard
              title='A/B Experiments'
              value={dashboardStats?.activeExperiments || '0'}
              subtitle='Running across industries'
              trend='3 completed today'
              icon='AB'
              data-oid='cv_tbrj'
            />

            <StatCard
              title='Model Accuracy'
              value={`${dashboardStats?.modelAccuracy || 0}%`}
              subtitle='ML performance'
              trend='+1.8% improvement'
              icon='ML'
              data-oid='mjj1mtq'
            />
          </div>
        </section>

        {/* Enhanced Analytics Section */}
        <section className='mt-8' data-oid='9xvqi_5'>
          <h3
            className='text-xl font-semibold mb-6 text-blue-600'
            data-oid='h7q0c1k'
          >
            SaaS Analytics Dashboard
          </h3>

          {/* Conversion Rate Trend Chart - Now First */}
          <div className='mb-8' data-oid='qlh3boz'>
            <ConversionRateTrendChart data-oid='.mz77m1' />
          </div>

          {/* Main Analytics Charts */}
          <div
            className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'
            data-oid='9zb6c34'
          >
            <div
              className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm h-[498px]'
              data-oid='w57h782'
            >
              <h4
                className='text-lg font-semibold text-gray-900 mb-4'
                data-oid='baobf_g'
              >
                Conversion Funnel
              </h4>
              <div className='space-y-3' data-oid='nex3hb7'>
                <div
                  className='flex items-center justify-between p-3 bg-blue-50 rounded-lg'
                  data-oid='iqm9fpx'
                >
                  <span
                    className='text-sm font-medium text-gray-700'
                    data-oid='a6ad0x0'
                  >
                    Visitors
                  </span>
                  <div
                    className='flex items-center space-x-2'
                    data-oid='3qmejub'
                  >
                    <div
                      className='w-32 bg-gray-200 rounded-full h-2'
                      data-oid='2vmodnp'
                    >
                      <div
                        className='bg-blue-600 h-2 rounded-full'
                        style={{ width: '100%' }}
                        data-oid='4h74ynd'
                      ></div>
                    </div>
                    <span
                      className='text-sm font-bold text-gray-900'
                      data-oid='ske38v7'
                    >
                      24,789
                    </span>
                  </div>
                </div>
                <div
                  className='flex items-center justify-between p-3 bg-green-50 rounded-lg'
                  data-oid='w6u.:83'
                >
                  <span
                    className='text-sm font-medium text-gray-700'
                    data-oid='inp.0n3'
                  >
                    Sign-ups
                  </span>
                  <div
                    className='flex items-center space-x-2'
                    data-oid='.k-m3vw'
                  >
                    <div
                      className='w-32 bg-gray-200 rounded-full h-2'
                      data-oid='33qbxjl'
                    >
                      <div
                        className='bg-green-600 h-2 rounded-full'
                        style={{ width: '45%' }}
                        data-oid='tebe.gp'
                      ></div>
                    </div>
                    <span
                      className='text-sm font-bold text-gray-900'
                      data-oid='6w9n797'
                    >
                      11,155
                    </span>
                  </div>
                </div>
                <div
                  className='flex items-center justify-between p-3 bg-orange-50 rounded-lg'
                  data-oid='69myn3j'
                >
                  <span
                    className='text-sm font-medium text-gray-700'
                    data-oid='pwqsyoc'
                  >
                    Trial Users
                  </span>
                  <div
                    className='flex items-center space-x-2'
                    data-oid='9lsxcym'
                  >
                    <div
                      className='w-32 bg-gray-200 rounded-full h-2'
                      data-oid='5380vb:'
                    >
                      <div
                        className='bg-orange-600 h-2 rounded-full'
                        style={{ width: '25%' }}
                        data-oid='wn3o55g'
                      ></div>
                    </div>
                    <span
                      className='text-sm font-bold text-gray-900'
                      data-oid='99he9n.'
                    >
                      6,197
                    </span>
                  </div>
                </div>
                <div
                  className='flex items-center justify-between p-3 bg-blue-50 rounded-lg'
                  data-oid='_zynic:'
                >
                  <span
                    className='text-sm font-medium text-gray-700'
                    data-oid='dek4ckj'
                  >
                    Paid Customers
                  </span>
                  <div
                    className='flex items-center space-x-2'
                    data-oid='x6wtb_v'
                  >
                    <div
                      className='w-32 bg-gray-200 rounded-full h-2'
                      data-oid='eb61gi8'
                    >
                      <div
                        className='bg-blue-600 h-2 rounded-full'
                        style={{ width: '8%' }}
                        data-oid='ni_htud'
                      ></div>
                    </div>
                    <span
                      className='text-sm font-bold text-gray-900'
                      data-oid='fsekqxc'
                    >
                      1,983
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Switchable Web Metrics Chart - Replaces MRR Chart */}
            <WebMetricsChart data-oid='vu7t-fi' />
          </div>

          {/* A/B Testing Performance */}
          <div
            className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'
            data-oid='kz24zn.'
          >
            <div
              className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm'
              data-oid='qep89jo'
            >
              <h4
                className='text-lg font-semibold text-gray-900 mb-4'
                data-oid='76wh5fl'
              >
                Active A/B Tests
              </h4>
              <div className='space-y-4' data-oid='2v43d8x'>
                <div
                  className='border-l-4 border-green-500 pl-4'
                  data-oid='73sf4w7'
                >
                  <h5 className='font-medium text-gray-900' data-oid='z240j-9'>
                    Pricing Page CTA
                  </h5>
                  <p className='text-sm text-gray-600' data-oid='vc0j24w'>
                    Testing button colors
                  </p>
                  <div
                    className='flex items-center justify-between mt-2'
                    data-oid='bq:e0vg'
                  >
                    <span className='text-xs text-gray-500' data-oid='e90bvoq'>
                      Confidence
                    </span>
                    <span
                      className='text-sm font-bold text-green-600'
                      data-oid='c43u76o'
                    >
                      96%
                    </span>
                  </div>
                </div>
                <div
                  className='border-l-4 border-blue-500 pl-4'
                  data-oid='sojoe-o'
                >
                  <h5 className='font-medium text-gray-900' data-oid='nq3sqop'>
                    Onboarding Flow
                  </h5>
                  <p className='text-sm text-gray-600' data-oid='ya3api5'>
                    3-step vs 5-step
                  </p>
                  <div
                    className='flex items-center justify-between mt-2'
                    data-oid='6dy_3j0'
                  >
                    <span className='text-xs text-gray-500' data-oid='7it4crp'>
                      Confidence
                    </span>
                    <span
                      className='text-sm font-bold text-blue-600'
                      data-oid='d0qwsvq'
                    >
                      78%
                    </span>
                  </div>
                </div>
                <div
                  className='border-l-4 border-orange-500 pl-4'
                  data-oid='r1l75wu'
                >
                  <h5 className='font-medium text-gray-900' data-oid='pc-mde9'>
                    Email Subject Lines
                  </h5>
                  <p className='text-sm text-gray-600' data-oid='so0a24h'>
                    Personalization test
                  </p>
                  <div
                    className='flex items-center justify-between mt-2'
                    data-oid='i1vgmlx'
                  >
                    <span className='text-xs text-gray-500' data-oid='rthu1jb'>
                      Confidence
                    </span>
                    <span
                      className='text-sm font-bold text-orange-600'
                      data-oid='ln8_931'
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
              data-oid='.72sach'
            >
              <h4
                className='text-lg font-semibold text-gray-900 mb-4'
                data-oid='-u.g_2w'
              >
                Engagement
              </h4>
              <div className='space-y-4' data-oid='e:w1ns0'>
                <div data-oid='5413y32'>
                  <div
                    className='flex items-center justify-between mb-1'
                    data-oid='iq0e.ur'
                  >
                    <span className='text-sm text-gray-600' data-oid='6jders2'>
                      Daily Active Users
                    </span>
                    <span
                      className='text-sm font-bold text-gray-900'
                      data-oid='9tb55n2'
                    >
                      8,943
                    </span>
                  </div>
                  <div
                    className='w-full bg-gray-200 rounded-full h-2'
                    data-oid='e2wl509'
                  >
                    <div
                      className='bg-green-600 h-2 rounded-full'
                      style={{ width: '73%' }}
                      data-oid='kz4hh9i'
                    ></div>
                  </div>
                  <span className='text-xs text-green-600' data-oid='s9gk4r8'>
                    +8.2% vs last week
                  </span>
                </div>
                <div data-oid='4lr2-m3'>
                  <div
                    className='flex items-center justify-between mb-1'
                    data-oid='caut9to'
                  >
                    <span className='text-sm text-gray-600' data-oid='trcrl4e'>
                      Session Duration
                    </span>
                    <span
                      className='text-sm font-bold text-gray-900'
                      data-oid='wev01s1'
                    >
                      12m 34s
                    </span>
                  </div>
                  <div
                    className='w-full bg-gray-200 rounded-full h-2'
                    data-oid='d-oomg2'
                  >
                    <div
                      className='bg-blue-600 h-2 rounded-full'
                      style={{ width: '68%' }}
                      data-oid='woao4mf'
                    ></div>
                  </div>
                  <span className='text-xs text-blue-600' data-oid='o9lvk.2'>
                    +2.1% vs last week
                  </span>
                </div>
                <div data-oid='6e_-jaw'>
                  <div
                    className='flex items-center justify-between mb-1'
                    data-oid='qkadj:z'
                  >
                    <span className='text-sm text-gray-600' data-oid='50xbsu0'>
                      Feature Adoption
                    </span>
                    <span
                      className='text-sm font-bold text-gray-900'
                      data-oid='wfb4hga'
                    >
                      67%
                    </span>
                  </div>
                  <div
                    className='w-full bg-gray-200 rounded-full h-2'
                    data-oid='67djfyx'
                  >
                    <div
                      className='bg-orange-600 h-2 rounded-full'
                      style={{ width: '67%' }}
                      data-oid='wcx0uie'
                    ></div>
                  </div>
                  <span className='text-xs text-orange-600' data-oid='sdo6-kl'>
                    -1.3% vs last week
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Satisfaction */}
            <div
              className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm'
              data-oid='vwrcvrv'
            >
              <h4
                className='text-lg font-semibold text-gray-900 mb-4'
                data-oid='n9-rppg'
              >
                Customer Metrics
              </h4>
              <div className='space-y-4' data-oid='yb89vsd'>
                <div className='text-center' data-oid='rw-dlrv'>
                  <div
                    className='inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-2'
                    data-oid='tye-q-g'
                  >
                    <span
                      className='text-2xl font-bold text-green-600'
                      data-oid='71finej'
                    >
                      8.7
                    </span>
                  </div>
                  <p className='text-sm text-gray-600' data-oid='s_y8gz9'>
                    Customer Satisfaction Score
                  </p>
                  <span className='text-xs text-green-600' data-oid='200cl8_'>
                    Excellent
                  </span>
                </div>
                <div
                  className='grid grid-cols-2 gap-4 pt-4 border-t border-gray-200'
                  data-oid='8gxe19_'
                >
                  <div className='text-center' data-oid='633nou4'>
                    <span
                      className='text-lg font-bold text-gray-900'
                      data-oid='zg-r0ln'
                    >
                      2.1%
                    </span>
                    <p className='text-xs text-gray-600' data-oid='yl07boe'>
                      Churn Rate
                    </p>
                    <span className='text-xs text-green-600' data-oid='ovgr7lj'>
                      ↓ 0.3%
                    </span>
                  </div>
                  <div className='text-center' data-oid='rlbjw14'>
                    <span
                      className='text-lg font-bold text-gray-900'
                      data-oid='ve1oikm'
                    >
                      94%
                    </span>
                    <p className='text-xs text-gray-600' data-oid='h.hbrhn'>
                      Retention
                    </p>
                    <span className='text-xs text-green-600' data-oid='1jywqer'>
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
            data-oid='t_g8pqt'
          >
            <div
              className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm'
              data-oid='dgmau6.'
            >
              <h4
                className='text-lg font-semibold text-gray-900 mb-4'
                data-oid='14u3it3'
              >
                Real-time Activity
              </h4>
              <div className='space-y-3' data-oid='zy7s4if'>
                <div
                  className='flex items-center space-x-3 p-3 bg-green-50 rounded-lg'
                  data-oid='ssz3kgw'
                >
                  <div
                    className='w-2 h-2 bg-green-500 rounded-full'
                    data-oid='_n8nbph'
                  ></div>
                  <div className='flex-1' data-oid='wt48ndc'>
                    <p className='text-sm text-gray-900' data-oid='td6o4nl'>
                      New trial signup from enterprise lead
                    </p>
                    <span className='text-xs text-gray-500' data-oid='r9c64qc'>
                      2 minutes ago
                    </span>
                  </div>
                </div>
                <div
                  className='flex items-center space-x-3 p-3 bg-blue-50 rounded-lg'
                  data-oid='z4uu-r_'
                >
                  <div
                    className='w-2 h-2 bg-blue-500 rounded-full'
                    data-oid='tpf0nly'
                  ></div>
                  <div className='flex-1' data-oid='2g8jm1q'>
                    <p className='text-sm text-gray-900' data-oid='sgcubfa'>
                      A/B test reached statistical significance
                    </p>
                    <span className='text-xs text-gray-500' data-oid='afq5igz'>
                      8 minutes ago
                    </span>
                  </div>
                </div>
                <div
                  className='flex items-center space-x-3 p-3 bg-orange-50 rounded-lg'
                  data-oid='x5eqex-'
                >
                  <div
                    className='w-2 h-2 bg-orange-500 rounded-full'
                    data-oid='n7q69-6'
                  ></div>
                  <div className='flex-1' data-oid='ns6u8ox'>
                    <p className='text-sm text-gray-900' data-oid='4omkpde'>
                      User completed onboarding flow
                    </p>
                    <span className='text-xs text-gray-500' data-oid='sptujgz'>
                      12 minutes ago
                    </span>
                  </div>
                </div>
                <div
                  className='flex items-center space-x-3 p-3 bg-green-50 rounded-lg'
                  data-oid='aafs7x4'
                >
                  <div
                    className='w-2 h-2 bg-green-500 rounded-full'
                    data-oid='e7rr:vu'
                  ></div>
                  <div className='flex-1' data-oid='0x_ve3z'>
                    <p className='text-sm text-gray-900' data-oid='v6oox1j'>
                      Payment received: $299/month plan
                    </p>
                    <span className='text-xs text-gray-500' data-oid='z1k4x:-'>
                      18 minutes ago
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Performance Indicators */}
            <div
              className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm'
              data-oid='--qz:sq'
            >
              <h4
                className='text-lg font-semibold text-gray-900 mb-4'
                data-oid='8:rljob'
              >
                Performance Summary
              </h4>
              <div className='grid grid-cols-2 gap-4' data-oid='fz8njrz'>
                <div
                  className='text-center p-4 bg-blue-50 rounded-lg'
                  data-oid='z28p0u-'
                >
                  <span
                    className='text-2xl font-bold text-blue-600'
                    data-oid='58vfcs6'
                  >
                    15.3%
                  </span>
                  <p className='text-sm text-gray-600' data-oid='z34:p4g'>
                    Conversion Rate
                  </p>
                  <span className='text-xs text-green-600' data-oid='rk29gll'>
                    ↑ 2.1%
                  </span>
                </div>
                <div
                  className='text-center p-4 bg-green-50 rounded-lg'
                  data-oid='xy53zwu'
                >
                  <span
                    className='text-2xl font-bold text-green-600'
                    data-oid='r8ke3q-'
                  >
                    $127
                  </span>
                  <p className='text-sm text-gray-600' data-oid='ym51j3r'>
                    Avg. Deal Size
                  </p>
                  <span className='text-xs text-green-600' data-oid='i1mxxxl'>
                    ↑ $12
                  </span>
                </div>
                <div
                  className='text-center p-4 bg-orange-50 rounded-lg'
                  data-oid='uz7_c_b'
                >
                  <span
                    className='text-2xl font-bold text-orange-600'
                    data-oid='8mmc1qp'
                  >
                    18 days
                  </span>
                  <p className='text-sm text-gray-600' data-oid='q3ak1-f'>
                    Sales Cycle
                  </p>
                  <span className='text-xs text-red-600' data-oid='b0yomn5'>
                    ↑ 2 days
                  </span>
                </div>
                <div
                  className='text-center p-4 bg-blue-50 rounded-lg'
                  data-oid='ct10d0k'
                >
                  <span
                    className='text-2xl font-bold text-blue-600'
                    data-oid='ov51mpd'
                  >
                    94.2%
                  </span>
                  <p className='text-sm text-gray-600' data-oid='miqni3k'>
                    Model Accuracy
                  </p>
                  <span className='text-xs text-green-600' data-oid='ftncr8.'>
                    ↑ 1.8%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div
          className='grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12'
          data-oid=':r5:5qr'
        >
          {/* System Health */}
          <section className='lg:col-span-1' data-oid='m36vk.l'>
            <h3
              className='text-xl font-semibold mb-4 text-gray-900'
              data-oid='uqbxfeb'
            >
              System Health
            </h3>
            <div
              className='bg-white rounded-xl shadow-lg border border-gray-200 p-6 h-96 flex flex-col'
              data-oid='yh0er-o'
            >
              <div
                className='flex-1 overflow-y-auto dashboard-scrollable'
                data-oid='yfj_z50'
              >
                <div className='space-y-3' data-oid='v4fo84-'>
                  <HealthIndicator
                    service='API Gateway'
                    status={apiConnected}
                    data-oid='69ob4rp'
                  />

                  <HealthIndicator
                    service='ML Engine'
                    status={systemHealth.mlEngine || apiConnected}
                    data-oid='gnn3r7g'
                  />

                  <HealthIndicator
                    service='A/B Testing'
                    status={systemHealth.abTesting || apiConnected}
                    data-oid='n1au0rp'
                  />

                  <HealthIndicator
                    service='Analytics'
                    status={systemHealth.analytics || apiConnected}
                    data-oid='-:5hblm'
                  />

                  <HealthIndicator
                    service='Recommendations'
                    status={systemHealth.recommendations || apiConnected}
                    data-oid='mi-xz3l'
                  />
                </div>

                <div
                  className='mt-6 pt-4 border-t border-gray-200'
                  data-oid='hm5-3k5'
                >
                  <p className='text-gray-500 text-xs mb-2' data-oid='0_o0.j5'>
                    System Status
                  </p>
                  <div
                    className='flex items-center justify-between'
                    data-oid='.41ztci'
                  >
                    <span
                      className='text-gray-900 font-medium'
                      data-oid='152kt5b'
                    >
                      Overall Health
                    </span>
                    <span
                      className='text-green-600 font-bold'
                      data-oid='v1m8h.y'
                    >
                      98.5%
                    </span>
                  </div>
                  <div
                    className='w-full bg-gray-200 rounded-full h-2 mt-2'
                    data-oid='tpwu1uh'
                  >
                    <div
                      className='bg-green-500 h-2 rounded-full transition-all duration-500'
                      style={{ width: '98.5%' }}
                      data-oid='rmz15k4'
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Active A/B Experiments */}
          <section className='lg:col-span-1' data-oid='vwggi_m'>
            <h3
              className='text-xl font-semibold mb-4 text-gray-900'
              data-oid='c03dl3m'
            >
              Active Experiments
            </h3>
            <div
              className='bg-white rounded-xl shadow-lg border border-gray-200 p-6 h-96 flex flex-col'
              data-oid='75imvqo'
            >
              <div
                className='flex-1 overflow-y-auto dashboard-scrollable'
                data-oid='l4spupd'
              >
                <div className='space-y-4' data-oid='j6fwwww'>
                  {experiments.map(experiment => (
                    <ExperimentCard
                      key={experiment.id}
                      experiment={experiment}
                      data-oid='_um2fl-'
                    />
                  ))}
                </div>
              </div>

              <div
                className='mt-6 pt-4 border-t border-gray-200'
                data-oid='srx_7ze'
              >
                <button
                  className='w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all duration-300'
                  data-oid='p2u0ktw'
                >
                  View All Experiments
                </button>
              </div>
            </div>
          </section>

          {/* ML Model Performance */}
          <section className='lg:col-span-1' data-oid='6wiodqc'>
            <h3
              className='text-xl font-semibold mb-4 text-gray-900'
              data-oid='.qf::-4'
            >
              ML Models
            </h3>
            <div
              className='bg-white rounded-xl shadow-lg border border-gray-200 p-6 h-96 flex flex-col'
              data-oid='uau51x1'
            >
              <div
                className='flex-1 overflow-y-auto dashboard-scrollable'
                data-oid='lqyfns0'
              >
                <div className='space-y-4' data-oid='-fg4q-z'>
                  {modelMetrics.map((metric, index) => (
                    <ModelMetricCard
                      key={index}
                      metric={metric}
                      data-oid='uupg.69'
                    />
                  ))}
                </div>
              </div>

              <div
                className='mt-6 pt-4 border-t border-gray-200'
                data-oid='eo-drd3'
              >
                <button
                  className='w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all duration-300'
                  data-oid='2y25f2v'
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
