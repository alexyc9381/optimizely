import React, { useEffect, useState } from 'react';
import { apiClient } from '../src/services/apiClient';

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Start with fallback data immediately, attempt API connection in background
    const fetchDashboardData = async () => {
      // Only attempt API connection if explicitly enabled
      const enableAPIConnection = false; // Set to true to enable API calls

      if (!enableAPIConnection) {
        setError('Using offline mode - API connection disabled');
        return;
      }

      try {
        setLoading(true);
        setError(null);

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
                fetchWithTimeout(apiClient.getDashboardData()),
                fetchWithTimeout(apiClient.getABTests()),
                fetchWithTimeout(apiClient.getModelStats()),
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
              const models = modelsResponse.value as ModelMetric[];
              // Transform to expected format
              setModelMetrics(
                Array.isArray(models)
                  ? models.slice(0, 3).map((model: ModelMetric) => ({
                      name: model.name || 'Unknown Model',
                      accuracy: model.accuracy || 90.0,
                      confidence: model.confidence || 85.0,
                      status: model.status || 'Active',
                    }))
                  : models
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
        setError('Using offline mode - some features may be limited');
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
    <div className='bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg'>
      <div className='flex items-center justify-between mb-4'>
        <div className='bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded'>
          {icon}
        </div>
        <div className='text-xs text-gray-500'>{subtitle}</div>
      </div>
      <div className='mb-2'>
        <div className='text-2xl font-bold text-gray-900'>{value || 0}</div>
        <div className='text-sm text-gray-600'>{title}</div>
      </div>
      {trend && (
        <div
          className={`text-xs ${trend.startsWith('+') ? 'text-green-600' : trend.startsWith('-') ? 'text-red-600' : 'text-gray-600'}`}
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
    <div className='flex items-center justify-between py-2'>
      <span className='text-gray-600 text-sm'>{service}</span>
      <div className='flex items-center'>
        <div
          className={`w-2 h-2 rounded-full mr-2 ${status ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`}
        />
        <span
          className={`text-xs font-medium ${status ? 'text-blue-600' : 'text-gray-600'}`}
        >
          {status ? 'Active' : 'Offline'}
        </span>
      </div>
    </div>
  );

  const ExperimentCard: React.FC<{ experiment: Experiment }> = ({
    experiment,
  }) => (
    <div className='bg-gray-50 p-4 rounded-lg border border-gray-200'>
      <div className='flex items-center justify-between mb-2'>
        <h4 className='text-gray-900 font-medium text-sm'>{experiment.name}</h4>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            experiment.status === 'Running'
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-gray-100 text-gray-700 border border-gray-200'
          }`}
        >
          {experiment.status}
        </span>
      </div>
      <div className='grid grid-cols-2 gap-2 text-xs'>
        <div>
          <span className='text-gray-500'>Conversion: </span>
          <span
            className={`font-medium ${
              experiment.conversionRate > 10
                ? 'text-green-600'
                : experiment.conversionRate > 5
                  ? 'text-orange-500'
                  : 'text-red-600'
            }`}
          >
            {experiment.conversionRate}%
          </span>
        </div>
        <div>
          <span className='text-gray-500'>Confidence: </span>
          <span
            className={`font-medium ${
              experiment.confidence > 95
                ? 'text-green-600'
                : experiment.confidence > 80
                  ? 'text-orange-500'
                  : 'text-red-600'
            }`}
          >
            {experiment.confidence}%
          </span>
        </div>
      </div>
      <p className='text-xs text-blue-600 mt-2'>{experiment.industry}</p>
    </div>
  );

  const ModelMetricCard: React.FC<{ metric: ModelMetric }> = ({ metric }) => (
    <div className='bg-gray-50 p-4 rounded-lg border border-gray-200'>
      <div className='flex items-center justify-between mb-2'>
        <h4 className='text-gray-900 font-medium text-sm'>{metric.name}</h4>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            metric.status === 'Active'
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-gray-100 text-gray-700 border border-gray-200'
          }`}
        >
          {metric.status}
        </span>
      </div>
      <div className='grid grid-cols-2 gap-2 text-xs'>
        <div>
          <span className='text-gray-500'>Accuracy: </span>
          <span
            className={`font-medium ${
              metric.accuracy > 95
                ? 'text-green-600'
                : metric.accuracy > 85
                  ? 'text-orange-500'
                  : 'text-red-600'
            }`}
          >
            {metric.accuracy}%
          </span>
        </div>
        <div>
          <span className='text-gray-500'>Confidence: </span>
          <span
            className={`font-medium ${
              metric.confidence > 95
                ? 'text-green-600'
                : metric.confidence > 85
                  ? 'text-orange-500'
                  : 'text-red-600'
            }`}
          >
            {metric.confidence}%
          </span>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-background-primary via-background-secondary to-background-primary flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4'></div>
          <p className='text-text-secondary'>Loading Optelo Platform...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 text-gray-900'>
      <style jsx>{`
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
      <header className='bg-white/90 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50 shadow-sm'>
        <div className='max-w-7xl mx-auto px-6 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center'>
                <span className='text-white font-bold text-sm'>AI</span>
              </div>
              <div>
                <h1 className='text-xl font-bold text-blue-600'>Optelo</h1>
                <p className='text-gray-600 text-xs'>
                  Multi-Industry A/B Testing & Analytics
                </p>
              </div>
            </div>

            <div className='flex items-center space-x-4'>
              <div
                className={`flex items-center px-3 py-1 rounded-full text-xs ${
                  apiConnected
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full mr-2 ${
                    apiConnected ? 'bg-blue-500 animate-pulse' : 'bg-gray-500'
                  }`}
                />
                API {apiConnected ? 'Connected' : 'Offline'}
              </div>

              <div className='text-gray-600 text-xs'>
                85% Complete • 17/20 Tasks
              </div>
            </div>
          </div>

          {error && (
            <div className='mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800'>
              {error}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className='max-w-7xl mx-auto px-6 py-8'>
        {/* Key Metrics */}
        <section className='mb-8'>
          <h2 className='text-2xl font-bold mb-6 flex items-center text-gray-900'>
            <span className='text-blue-600'>Platform Overview</span>
            <div className='ml-3 w-6 h-6 bg-blue-600 rounded animate-pulse'></div>
          </h2>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6'>
            <StatCard
              title='Total Visitors'
              value={dashboardStats?.totalVisitors?.toLocaleString() || '0'}
              subtitle='Cross-platform tracking'
              trend='+12.3% this week'
              icon='VIS'
            />
            <StatCard
              title='Active Sessions'
              value={dashboardStats?.totalSessions?.toLocaleString() || '0'}
              subtitle='Real-time monitoring'
              trend='+8.7% today'
              icon='SES'
            />
            <StatCard
              title='Conversion Rate'
              value={`${dashboardStats?.conversionRate || 0}%`}
              subtitle='AI-optimized funnels'
              trend='+2.1% improvement'
              icon='CVR'
            />
            <StatCard
              title='Revenue Generated'
              value={`$${Math.round((dashboardStats?.revenueGenerated || 0) / 1000)}K`}
              subtitle='Attribution modeling'
              trend='+15.4% this month'
              icon='REV'
            />
            <StatCard
              title='A/B Experiments'
              value={dashboardStats?.activeExperiments || '0'}
              subtitle='Running across industries'
              trend='3 completed today'
              icon='AB'
            />
            <StatCard
              title='Model Accuracy'
              value={`${dashboardStats?.modelAccuracy || 0}%`}
              subtitle='ML performance'
              trend='+1.8% improvement'
              icon='ML'
            />
          </div>
        </section>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* System Health */}
          <section className='lg:col-span-1'>
            <h3 className='text-xl font-semibold mb-4 text-gray-900'>
              System Health
            </h3>
            <div className='bg-white rounded-xl shadow-lg border border-gray-200 p-6 h-96 flex flex-col'>
              <div className='flex-1 overflow-y-auto dashboard-scrollable'>
                <div className='space-y-3'>
                  <HealthIndicator
                    service='API Gateway'
                    status={apiConnected}
                  />
                  <HealthIndicator
                    service='ML Engine'
                    status={systemHealth.mlEngine || apiConnected}
                  />
                  <HealthIndicator
                    service='A/B Testing'
                    status={systemHealth.abTesting || apiConnected}
                  />
                  <HealthIndicator
                    service='Analytics'
                    status={systemHealth.analytics || apiConnected}
                  />
                  <HealthIndicator
                    service='Recommendations'
                    status={systemHealth.recommendations || apiConnected}
                  />
                </div>

                <div className='mt-6 pt-4 border-t border-gray-200'>
                  <p className='text-gray-500 text-xs mb-2'>System Status</p>
                  <div className='flex items-center justify-between'>
                    <span className='text-gray-900 font-medium'>
                      Overall Health
                    </span>
                    <span className='text-green-600 font-bold'>98.5%</span>
                  </div>
                  <div className='w-full bg-gray-200 rounded-full h-2 mt-2'>
                    <div
                      className='bg-green-500 h-2 rounded-full transition-all duration-500'
                      style={{ width: '98.5%' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Active A/B Experiments */}
          <section className='lg:col-span-1'>
            <h3 className='text-xl font-semibold mb-4 text-gray-900'>
              Active Experiments
            </h3>
            <div className='bg-white rounded-xl shadow-lg border border-gray-200 p-6 h-96 flex flex-col'>
              <div className='flex-1 overflow-y-auto dashboard-scrollable'>
                <div className='space-y-4'>
                  {experiments.map(experiment => (
                    <ExperimentCard
                      key={experiment.id}
                      experiment={experiment}
                    />
                  ))}
                </div>
              </div>

              <div className='mt-6 pt-4 border-t border-gray-200'>
                <button className='w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all duration-300'>
                  View All Experiments
                </button>
              </div>
            </div>
          </section>

          {/* ML Model Performance */}
          <section className='lg:col-span-1'>
            <h3 className='text-xl font-semibold mb-4 text-gray-900'>
              ML Models
            </h3>
            <div className='bg-white rounded-xl shadow-lg border border-gray-200 p-6 h-96 flex flex-col'>
              <div className='flex-1 overflow-y-auto dashboard-scrollable'>
                <div className='space-y-4'>
                  {modelMetrics.map((metric, index) => (
                    <ModelMetricCard key={index} metric={metric} />
                  ))}
                </div>
              </div>

              <div className='mt-6 pt-4 border-t border-gray-200'>
                <button className='w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all duration-300'>
                  Model Refinement Dashboard
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Enhanced Analytics Section */}
        <section className='mt-8'>
          <h3 className='text-xl font-semibold mb-6 text-blue-600'>
            SaaS Analytics Dashboard
          </h3>

          {/* Conversion Funnel Chart */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
            <div className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm'>
              <h4 className='text-lg font-semibold text-gray-900 mb-4'>
                Conversion Funnel
              </h4>
              <div className='space-y-3'>
                <div className='flex items-center justify-between p-3 bg-blue-50 rounded-lg'>
                  <span className='text-sm font-medium text-gray-700'>
                    Visitors
                  </span>
                  <div className='flex items-center space-x-2'>
                    <div className='w-32 bg-gray-200 rounded-full h-2'>
                      <div
                        className='bg-blue-600 h-2 rounded-full'
                        style={{ width: '100%' }}
                      ></div>
                    </div>
                    <span className='text-sm font-bold text-gray-900'>
                      24,789
                    </span>
                  </div>
                </div>
                <div className='flex items-center justify-between p-3 bg-green-50 rounded-lg'>
                  <span className='text-sm font-medium text-gray-700'>
                    Sign-ups
                  </span>
                  <div className='flex items-center space-x-2'>
                    <div className='w-32 bg-gray-200 rounded-full h-2'>
                      <div
                        className='bg-green-600 h-2 rounded-full'
                        style={{ width: '45%' }}
                      ></div>
                    </div>
                    <span className='text-sm font-bold text-gray-900'>
                      11,155
                    </span>
                  </div>
                </div>
                <div className='flex items-center justify-between p-3 bg-orange-50 rounded-lg'>
                  <span className='text-sm font-medium text-gray-700'>
                    Trial Users
                  </span>
                  <div className='flex items-center space-x-2'>
                    <div className='w-32 bg-gray-200 rounded-full h-2'>
                      <div
                        className='bg-orange-600 h-2 rounded-full'
                        style={{ width: '25%' }}
                      ></div>
                    </div>
                    <span className='text-sm font-bold text-gray-900'>
                      6,197
                    </span>
                  </div>
                </div>
                <div className='flex items-center justify-between p-3 bg-blue-50 rounded-lg'>
                  <span className='text-sm font-medium text-gray-700'>
                    Paid Customers
                  </span>
                  <div className='flex items-center space-x-2'>
                    <div className='w-32 bg-gray-200 rounded-full h-2'>
                      <div
                        className='bg-blue-600 h-2 rounded-full'
                        style={{ width: '8%' }}
                      ></div>
                    </div>
                    <span className='text-sm font-bold text-gray-900'>
                      1,983
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Trend Chart */}
            <div className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm'>
              <h4 className='text-lg font-semibold text-gray-900 mb-4'>
                Monthly Recurring Revenue
              </h4>
              <div className='mb-4'>
                <div className='flex items-end space-x-1 h-32'>
                  {[45, 52, 48, 61, 58, 67, 72, 69, 78, 82, 89, 94].map(
                    (height, index) => (
                      <div
                        key={index}
                        className='flex flex-col items-center flex-1'
                      >
                        <div
                          className='bg-blue-600 rounded-t w-full transition-all duration-300 hover:bg-blue-700'
                          style={{ height: `${height}%` }}
                        ></div>
                        <span className='text-xs text-gray-500 mt-1'>
                          {
                            [
                              'J',
                              'F',
                              'M',
                              'A',
                              'M',
                              'J',
                              'J',
                              'A',
                              'S',
                              'O',
                              'N',
                              'D',
                            ][index]
                          }
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-gray-600'>Current MRR</span>
                <span className='text-lg font-bold text-green-600'>
                  $847,500
                </span>
              </div>
              <div className='flex items-center justify-between text-sm mt-1'>
                <span className='text-gray-600'>Growth Rate</span>
                <span className='text-sm font-medium text-green-600'>
                  +15.3% MoM
                </span>
              </div>
            </div>
          </div>

          {/* A/B Testing Performance */}
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
            <div className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm'>
              <h4 className='text-lg font-semibold text-gray-900 mb-4'>
                Active A/B Tests
              </h4>
              <div className='space-y-4'>
                <div className='border-l-4 border-green-500 pl-4'>
                  <h5 className='font-medium text-gray-900'>
                    Pricing Page CTA
                  </h5>
                  <p className='text-sm text-gray-600'>Testing button colors</p>
                  <div className='flex items-center justify-between mt-2'>
                    <span className='text-xs text-gray-500'>Confidence</span>
                    <span className='text-sm font-bold text-green-600'>
                      96%
                    </span>
                  </div>
                </div>
                <div className='border-l-4 border-blue-500 pl-4'>
                  <h5 className='font-medium text-gray-900'>Onboarding Flow</h5>
                  <p className='text-sm text-gray-600'>3-step vs 5-step</p>
                  <div className='flex items-center justify-between mt-2'>
                    <span className='text-xs text-gray-500'>Confidence</span>
                    <span className='text-sm font-bold text-blue-600'>78%</span>
                  </div>
                </div>
                <div className='border-l-4 border-orange-500 pl-4'>
                  <h5 className='font-medium text-gray-900'>
                    Email Subject Lines
                  </h5>
                  <p className='text-sm text-gray-600'>Personalization test</p>
                  <div className='flex items-center justify-between mt-2'>
                    <span className='text-xs text-gray-500'>Confidence</span>
                    <span className='text-sm font-bold text-orange-600'>
                      45%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* User Engagement Metrics */}
            <div className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm'>
              <h4 className='text-lg font-semibold text-gray-900 mb-4'>
                User Engagement
              </h4>
              <div className='space-y-4'>
                <div>
                  <div className='flex items-center justify-between mb-1'>
                    <span className='text-sm text-gray-600'>
                      Daily Active Users
                    </span>
                    <span className='text-sm font-bold text-gray-900'>
                      8,943
                    </span>
                  </div>
                  <div className='w-full bg-gray-200 rounded-full h-2'>
                    <div
                      className='bg-green-600 h-2 rounded-full'
                      style={{ width: '73%' }}
                    ></div>
                  </div>
                  <span className='text-xs text-green-600'>
                    +8.2% vs last week
                  </span>
                </div>
                <div>
                  <div className='flex items-center justify-between mb-1'>
                    <span className='text-sm text-gray-600'>
                      Session Duration
                    </span>
                    <span className='text-sm font-bold text-gray-900'>
                      12m 34s
                    </span>
                  </div>
                  <div className='w-full bg-gray-200 rounded-full h-2'>
                    <div
                      className='bg-blue-600 h-2 rounded-full'
                      style={{ width: '68%' }}
                    ></div>
                  </div>
                  <span className='text-xs text-blue-600'>
                    +2.1% vs last week
                  </span>
                </div>
                <div>
                  <div className='flex items-center justify-between mb-1'>
                    <span className='text-sm text-gray-600'>
                      Feature Adoption
                    </span>
                    <span className='text-sm font-bold text-gray-900'>67%</span>
                  </div>
                  <div className='w-full bg-gray-200 rounded-full h-2'>
                    <div
                      className='bg-orange-600 h-2 rounded-full'
                      style={{ width: '67%' }}
                    ></div>
                  </div>
                  <span className='text-xs text-orange-600'>
                    -1.3% vs last week
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Satisfaction */}
            <div className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm'>
              <h4 className='text-lg font-semibold text-gray-900 mb-4'>
                Customer Health
              </h4>
              <div className='space-y-4'>
                <div className='text-center'>
                  <div className='inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-2'>
                    <span className='text-2xl font-bold text-green-600'>
                      8.7
                    </span>
                  </div>
                  <p className='text-sm text-gray-600'>Net Promoter Score</p>
                  <span className='text-xs text-green-600'>Excellent</span>
                </div>
                <div className='grid grid-cols-2 gap-4 pt-4 border-t border-gray-200'>
                  <div className='text-center'>
                    <span className='text-lg font-bold text-gray-900'>
                      2.1%
                    </span>
                    <p className='text-xs text-gray-600'>Churn Rate</p>
                    <span className='text-xs text-green-600'>↓ 0.3%</span>
                  </div>
                  <div className='text-center'>
                    <span className='text-lg font-bold text-gray-900'>94%</span>
                    <p className='text-xs text-gray-600'>Retention</p>
                    <span className='text-xs text-green-600'>↑ 1.2%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Activity Feed */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <div className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm'>
              <h4 className='text-lg font-semibold text-gray-900 mb-4'>
                Real-time Activity
              </h4>
              <div className='space-y-3'>
                <div className='flex items-center space-x-3 p-3 bg-green-50 rounded-lg'>
                  <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                  <div className='flex-1'>
                    <p className='text-sm text-gray-900'>
                      New trial signup from enterprise lead
                    </p>
                    <span className='text-xs text-gray-500'>2 minutes ago</span>
                  </div>
                </div>
                <div className='flex items-center space-x-3 p-3 bg-blue-50 rounded-lg'>
                  <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                  <div className='flex-1'>
                    <p className='text-sm text-gray-900'>
                      A/B test reached statistical significance
                    </p>
                    <span className='text-xs text-gray-500'>8 minutes ago</span>
                  </div>
                </div>
                <div className='flex items-center space-x-3 p-3 bg-orange-50 rounded-lg'>
                  <div className='w-2 h-2 bg-orange-500 rounded-full'></div>
                  <div className='flex-1'>
                    <p className='text-sm text-gray-900'>
                      User completed onboarding flow
                    </p>
                    <span className='text-xs text-gray-500'>
                      12 minutes ago
                    </span>
                  </div>
                </div>
                <div className='flex items-center space-x-3 p-3 bg-green-50 rounded-lg'>
                  <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                  <div className='flex-1'>
                    <p className='text-sm text-gray-900'>
                      Payment received: $299/month plan
                    </p>
                    <span className='text-xs text-gray-500'>
                      18 minutes ago
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Performance Indicators */}
            <div className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm'>
              <h4 className='text-lg font-semibold text-gray-900 mb-4'>
                Performance Summary
              </h4>
              <div className='grid grid-cols-2 gap-4'>
                <div className='text-center p-4 bg-blue-50 rounded-lg'>
                  <span className='text-2xl font-bold text-blue-600'>
                    15.3%
                  </span>
                  <p className='text-sm text-gray-600'>Conversion Rate</p>
                  <span className='text-xs text-green-600'>↑ 2.1%</span>
                </div>
                <div className='text-center p-4 bg-green-50 rounded-lg'>
                  <span className='text-2xl font-bold text-green-600'>
                    $127
                  </span>
                  <p className='text-sm text-gray-600'>Avg. Deal Size</p>
                  <span className='text-xs text-green-600'>↑ $12</span>
                </div>
                <div className='text-center p-4 bg-orange-50 rounded-lg'>
                  <span className='text-2xl font-bold text-orange-600'>
                    18 days
                  </span>
                  <p className='text-sm text-gray-600'>Sales Cycle</p>
                  <span className='text-xs text-red-600'>↑ 2 days</span>
                </div>
                <div className='text-center p-4 bg-blue-50 rounded-lg'>
                  <span className='text-2xl font-bold text-blue-600'>
                    94.2%
                  </span>
                  <p className='text-sm text-gray-600'>Model Accuracy</p>
                  <span className='text-xs text-green-600'>↑ 1.8%</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default UniversalAIDashboard;
