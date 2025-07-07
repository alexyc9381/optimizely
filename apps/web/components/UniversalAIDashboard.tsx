import React, { useEffect, useState } from 'react';
import ConversionRateTrendChart from './ConversionRateTrendChart';
import WebMetricsChart from './WebMetricsChart';
import ConditionalChart from './dashboard/ConditionalChart';
import { EmptyStates } from './dashboard/EmptyState';
import HeroMetric from './dashboard/HeroMetric';
import MetricGrid from './dashboard/MetricGrid';

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
  // Core state with fallback values for immediate content display
  const [dashboardStats] = useState<DashboardStats>({
    totalVisitors: 24789,
    totalSessions: 15432,
    conversionRate: 8.6,
    revenueGenerated: 847500,
    activeExperiments: 12,
    modelAccuracy: 94.2,
  });

  const [systemHealth] = useState<SystemHealth>({
    apiGateway: true,
    mlEngine: true,
    abTesting: false,
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

  // Progressive Disclosure States
  const [showDetailedAnalytics, setShowDetailedAnalytics] = useState(false);
  const [showEngagementMetrics, setShowEngagementMetrics] = useState(false);
  const [showSystemDetails, setShowSystemDetails] = useState(false);

  // Loading and connectivity states
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

  // Generate essential metrics for MetricGrid component
  const essentialMetrics = [
    {
      id: 'visitors',
      title: 'Total Visitors',
      value: dashboardStats.totalVisitors.toLocaleString(),
      subtitle: 'Website visitors',
      trend: '+12.3%',
      icon: (
        <svg
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          className='w-full h-full'
          data-oid='kvgh6mk'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={1.5}
            d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
            data-oid='us4288c'
          />
        </svg>
      ),
    },
    {
      id: 'sessions',
      title: 'Active Sessions',
      value: dashboardStats.totalSessions.toLocaleString(),
      subtitle: 'Current sessions',
      trend: '+8.7%',
      icon: (
        <svg
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          className='w-full h-full'
          data-oid='ua0bnbu'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={1.5}
            d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
            data-oid='4oyk_j9'
          />
        </svg>
      ),
    },
    {
      id: 'system-health',
      title: 'System Health',
      value: 'Active',
      subtitle: 'All systems operational',
      type: 'system-health' as const,
      isActive: systemHealth.analytics && systemHealth.apiGateway,
      icon: (
        <svg
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          className='w-full h-full'
          data-oid=':oaxkhr'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={1.5}
            d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
            data-oid='1:9z.o1'
          />
        </svg>
      ),
    },
    {
      id: 'experiments',
      title: 'A/B Experiments',
      value: dashboardStats.activeExperiments,
      subtitle: 'Currently running',
      trend: '+2',
      icon: (
        <svg
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          className='w-full h-full'
          data-oid='1-6031_'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={1.5}
            d='M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'
            data-oid='yi9thig'
          />
        </svg>
      ),
    },
    {
      id: 'model-accuracy',
      title: 'Model Accuracy',
      value: `${dashboardStats.modelAccuracy}%`,
      subtitle: 'AI performance',
      trend: '+0.8%',
      icon: (
        <svg
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          className='w-full h-full'
          data-oid='g-:sj0t'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={1.5}
            d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
            data-oid='-8q_z7l'
          />
        </svg>
      ),
    },
  ];

  // Initialize data and handle API connections
  useEffect(() => {
    const fetchDashboardData = async () => {
      const enableAPIConnection = false; // Set to true to enable API calls
      if (!enableAPIConnection) return;

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

  // Show loading state
  if (loading) {
    return (
      <div className='p-4 space-y-8' data-oid='-7peesl'>
        <EmptyStates.Loading data-oid='mp8v:g6' />
      </div>
    );
  }

  return (
    <div
      className='min-h-screen bg-gray-50'
      data-testid='universal-ai-dashboard'
      data-oid='g7n.5w_'
    >
      <div className='container mx-auto px-4 py-6 max-w-7xl' data-oid='00qtaa_'>
        {/* Hero Metric - Conversion Rate */}
        <HeroMetric
          title='Conversion Rate'
          value={dashboardStats.conversionRate}
          unit='%'
          trend='+2.3%'
          subtitle='Overall conversion performance across all channels'
          data-oid='o-fml37'
        />

        {/* Essential Metrics Grid */}
        <MetricGrid
          metrics={essentialMetrics}
          maxItems={5}
          data-oid='88q:-7q'
        />

        {/* Progressive Disclosure Controls */}
        <section className='mb-8' data-oid='..3q5ua'>
          <div className='text-center mb-4' data-oid='b5wogmp'>
            <p className='text-sm text-blue-600 font-medium' data-oid='fbe2nk_'>
              {(() => {
                const visibleSections = [
                  showDetailedAnalytics,
                  showEngagementMetrics,
                  showSystemDetails,
                ].filter(Boolean).length;
                return visibleSections === 0
                  ? 'All detailed sections hidden - showing essential metrics only'
                  : `${visibleSections} detailed section${visibleSections === 1 ? '' : 's'} visible`;
              })()}
            </p>
          </div>

          <div
            className='flex flex-wrap gap-4 justify-center'
            data-oid='z9xxkfs'
          >
            {/* Show All/Hide All Toggle */}
            <button
              onClick={() => {
                const allVisible =
                  showDetailedAnalytics &&
                  showEngagementMetrics &&
                  showSystemDetails;
                setShowDetailedAnalytics(!allVisible);
                setShowEngagementMetrics(!allVisible);
                setShowSystemDetails(!allVisible);
              }}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                showDetailedAnalytics &&
                showEngagementMetrics &&
                showSystemDetails
                  ? 'bg-red-600 text-white shadow-lg hover:bg-red-700'
                  : 'bg-green-600 text-white shadow-lg hover:bg-green-700'
              }`}
              data-oid='_dt8dca'
            >
              <span data-oid='yfy2hae'>
                {showDetailedAnalytics &&
                showEngagementMetrics &&
                showSystemDetails
                  ? 'Hide All'
                  : 'Show All'}
              </span>
            </button>
          </div>
        </section>

        {/* Detailed Analytics - Progressive Disclosure */}
        <ConditionalChart
          title='Detailed Analytics'
          isVisible={showDetailedAnalytics}
          onToggle={() => setShowDetailedAnalytics(!showDetailedAnalytics)}
          description='Interactive conversion funnel and real-time metrics'
          itemCount={4}
          data-oid='lg2tttn'
        >
          <div className='space-y-8' data-oid='ieykhpn'>
            {/* Conversion Funnel */}
            <div
              className='bg-white p-6 rounded-lg border border-gray-200'
              data-oid='q5k0jn-'
            >
              <h3
                className='text-lg font-semibold text-gray-900 mb-6'
                data-oid='1bkdhmu'
              >
                Conversion Funnel
              </h3>
              <div
                className='grid grid-cols-1 md:grid-cols-4 gap-6'
                data-oid='83n0sit'
              >
                {/* Funnel stages with progressive font sizing */}
                {Object.entries(funnelData).map(([key, data], index) => {
                  const fontSizes = [
                    'text-xl',
                    'text-lg',
                    'text-base',
                    'text-sm',
                  ];
                  const labelSizes = [
                    'text-sm',
                    'text-sm',
                    'text-xs',
                    'text-xs',
                  ];

                  return (
                    <div key={key} className='text-center' data-oid='yj:xeyd'>
                      <div className='mb-4' data-oid='rg6w5a2'>
                        <div
                          className={`${fontSizes[index]} font-bold text-gray-900`}
                          data-oid='yfhg1l6'
                        >
                          {data.count.toLocaleString()}
                        </div>
                        <div
                          className={`${labelSizes[index]} text-gray-600 capitalize`}
                          data-oid='joja5s.'
                        >
                          {key}
                        </div>
                      </div>
                      <div
                        className={`text-xs text-green-600 font-medium`}
                        data-oid='8uqtp-l'
                      >
                        {data.trend}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Charts */}
            <div
              className='grid grid-cols-1 lg:grid-cols-2 gap-6'
              data-oid='2dh8zxy'
            >
              <ConversionRateTrendChart data-oid='vuj.jrd' />
              <WebMetricsChart data-oid='tfam3y4' />
            </div>
          </div>
        </ConditionalChart>

        {/* System Details - Progressive Disclosure */}
        <ConditionalChart
          title='System Details'
          isVisible={showSystemDetails}
          onToggle={() => setShowSystemDetails(!showSystemDetails)}
          description='Detailed system health, experiments, and ML model performance'
          itemCount={experiments.length + modelMetrics.length}
          data-oid='49ddti4'
        >
          <div className='space-y-8' data-oid='gbfzau:'>
            {/* System Health Details */}
            <div
              className='grid grid-cols-1 lg:grid-cols-2 gap-6'
              data-oid='rvbo3fu'
            >
              {/* Experiments */}
              <div
                className='bg-white p-6 rounded-lg border border-gray-200'
                data-oid='i4czvp5'
              >
                <h3
                  className='text-lg font-semibold text-gray-900 mb-4'
                  data-oid='9d6ush:'
                >
                  Active Experiments
                </h3>
                {experiments.length > 0 ? (
                  <div className='space-y-4' data-oid='bv1xe0r'>
                    {experiments.map(experiment => (
                      <div
                        key={experiment.id}
                        className='p-4 bg-gray-50 rounded-lg'
                        data-oid='pls5vex'
                      >
                        <div
                          className='flex justify-between items-start mb-2'
                          data-oid='mb_gnmh'
                        >
                          <h4
                            className='font-medium text-gray-900'
                            data-oid='kh7p-bp'
                          >
                            {experiment.name}
                          </h4>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              experiment.status === 'Running'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                            data-oid='.bnsjqy'
                          >
                            {experiment.status}
                          </span>
                        </div>
                        <div
                          className='text-sm text-gray-600'
                          data-oid='.4wsk32'
                        >
                          <div data-oid='-.u64um'>
                            Conversion Rate: {experiment.conversionRate}%
                          </div>
                          <div data-oid='zzgwpfe'>
                            Confidence: {experiment.confidence}%
                          </div>
                          <div data-oid='xgro1ts'>
                            Industry: {experiment.industry}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyStates.NoExperiments data-oid='yyl171j' />
                )}
              </div>

              {/* ML Models */}
              <div
                className='bg-white p-6 rounded-lg border border-gray-200'
                data-oid='r8nvtqa'
              >
                <h3
                  className='text-lg font-semibold text-gray-900 mb-4'
                  data-oid='f-4wkeu'
                >
                  ML Model Performance
                </h3>
                {modelMetrics.length > 0 ? (
                  <div className='space-y-4' data-oid='c4pxwvk'>
                    {modelMetrics.map((metric, index) => (
                      <div
                        key={index}
                        className='p-4 bg-gray-50 rounded-lg'
                        data-oid='zgp8u63'
                      >
                        <div
                          className='flex justify-between items-start mb-2'
                          data-oid='tvhkfs:'
                        >
                          <h4
                            className='font-medium text-gray-900'
                            data-oid='5_7_v8t'
                          >
                            {metric.name}
                          </h4>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              metric.status === 'Active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                            data-oid='27roxn9'
                          >
                            {metric.status}
                          </span>
                        </div>
                        <div
                          className='text-sm text-gray-600'
                          data-oid='z1x5qol'
                        >
                          <div data-oid='j8-_n15'>
                            Accuracy: {metric.accuracy}%
                          </div>
                          <div data-oid='._-dbah'>
                            Confidence: {metric.confidence}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyStates.NoData data-oid='w4:9.:o' />
                )}
              </div>
            </div>
          </div>
        </ConditionalChart>
      </div>
    </div>
  );
};

export default UniversalAIDashboard;
