import React, { useEffect, useState } from 'react';
import { LAYOUT_CLASSES, RESPONSIVE_SPACING, spacing } from '../lib/spacing';
import { useUtilities } from '../lib/useUtilities';
import ConversionRateTrendChart from './ConversionRateTrendChart';
import WebMetricsChart from './WebMetricsChart';
import { EmptyStates } from './dashboard/EmptyState';
import HeroMetric from './dashboard/HeroMetric';

interface DashboardStats {
  totalVisitors: number;
  totalSessions: number;
  conversionRate: number;
  revenueGenerated: number;
  activeExperiments: number;
  modelAccuracy: number;
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
  const { components } = useUtilities();

  // Dashboard controls state
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('30d');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications] = useState([
    {
      id: 1,
      type: 'success',
      message: 'Experiment "SaaS Pricing" reached statistical significance',
      time: '2 min ago',
    },
    {
      id: 2,
      type: 'warning',
      message: 'Model accuracy dropped below 90% for Lead Scoring',
      time: '15 min ago',
    },
    {
      id: 3,
      type: 'info',
      message: 'New A/B test started: College Consulting CTA',
      time: '1 hour ago',
    },
  ]);

  const dateRangeOptions = [
    { id: '7d', name: 'Last 7 days' },
    { id: '30d', name: 'Last 30 days' },
    { id: '90d', name: 'Last 90 days' },
    { id: '1y', name: 'Last year' },
    { id: 'custom', name: 'Custom range' },
  ];

  // Core state with fallback values for immediate content display
  const [dashboardStats] = useState<DashboardStats>({
    totalVisitors: 24789,
    totalSessions: 15432,
    conversionRate: 8.6,
    revenueGenerated: 847500,
    activeExperiments: 12,
    modelAccuracy: 94.2,
  });

  // Initialize timestamp on client-side only to prevent hydration mismatch
  useEffect(() => {
    setLastUpdated(new Date());
  }, []);

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

  // Progressive Disclosure States - removed (showing all content directly)

  // Loading and connectivity states
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_apiConnected, setApiConnected] = useState(false);

  // Initialize timestamp on client-side only to prevent hydration mismatch
  useEffect(() => {
    setLastUpdated(new Date());
  }, []);

  // Funnel mock data with realistic variations

  // Initialize data and handle API connections
  useEffect(() => {
    const fetchDashboardData = async () => {
      const enableAPIConnection = false; // Set to true to enable API calls
      if (!enableAPIConnection) {
        setLastUpdated(new Date());
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
        setLastUpdated(new Date());
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update timestamp display every minute
  useEffect(() => {
    const timestampInterval = setInterval(() => {
      setLastUpdated(new Date());
    }, 60000);
    return () => clearInterval(timestampInterval);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      const target = event.target as any;
      if (
        showNotifications &&
        !target.closest('[data-notifications-dropdown]')
      ) {
        setShowNotifications(false);
      }
      if (showDateDropdown && !target.closest('[data-date-dropdown]')) {
        setShowDateDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications, showDateDropdown]);

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
      {/* Dashboard Header */}
      <header
        className='bg-white border-b border-gray-200 px-4 sm:px-6 py-4 mb-6'
        data-oid='dashboard-header'
      >
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0'>
          {/* Left side - Title */}
          <div>
            <h1 className='text-xl sm:text-2xl font-bold text-gray-900'>
              Optelo Dashboard
            </h1>
            <p className='text-sm text-gray-600'>
              Real-time analytics and insights
            </p>
          </div>

          {/* Right side - Controls */}
          <div className='flex flex-wrap items-center gap-3 sm:gap-4'>
            {/* Date Range Picker */}
            <div className='flex items-center space-x-2'>
              <label className='text-sm font-medium text-gray-700'>
                Period:
              </label>
              <div className='relative' data-date-dropdown>
                <button
                  onClick={() => setShowDateDropdown(!showDateDropdown)}
                  className='flex items-center space-x-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-50 rounded-lg border transition-colors'
                >
                  <span className='text-xs font-medium text-gray-700'>
                    {
                      dateRangeOptions.find(option => option.id === dateRange)
                        ?.name
                    }
                  </span>
                  <svg
                    className='w-3 h-3 text-gray-500'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M19 9l-7 7-7-7'
                    />
                  </svg>
                </button>

                {showDateDropdown && (
                  <div className='absolute right-0 top-full mt-2 w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-10'>
                    {dateRangeOptions.map(option => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setDateRange(option.id);
                          setShowDateDropdown(false);
                        }}
                        className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                          dateRange === option.id
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700'
                        }`}
                      >
                        <span className='text-sm font-medium'>
                          {option.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Global Search Bar */}
            <div className='relative'>
              <svg
                className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                />
              </svg>
              <input
                type='text'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder='Search metrics, reports...'
                className='pl-10 pr-4 py-1.5 w-48 sm:w-64 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              />
            </div>

            {/* Real-time Data Timestamp */}
            <div className='flex items-center space-x-2 text-sm text-gray-600'>
              <svg
                className='w-4 h-4 text-green-500'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <circle cx='10' cy='10' r='3' />
              </svg>
              <span suppressHydrationWarning>
                Updated:{' '}
                {lastUpdated ? lastUpdated.toLocaleTimeString() : '--:--:--'}
              </span>
            </div>

            {/* Notifications/Alerts Dropdown */}
            <div className='relative' data-notifications-dropdown>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className='p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors'
              >
                <svg
                  className='w-5 h-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M10 5a2 2 0 114 0v2a8 8 0 018 8v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a8 8 0 018-8V5zM9.5 21h5'
                  />
                </svg>
                {/* Notification Badge */}
                {notifications.length > 0 && (
                  <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs font-medium min-w-[18px] h-[18px] rounded-full flex items-center justify-center'>
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className='absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50'>
                  <div className='p-4 border-b border-gray-200'>
                    <h3 className='text-sm font-semibold text-gray-900'>
                      Notifications
                    </h3>
                  </div>
                  <div className='max-h-64 overflow-y-auto'>
                    {notifications.map(notification => (
                      <div
                        key={notification.id}
                        className='p-4 border-b border-gray-100 hover:bg-gray-50'
                      >
                        <div className='flex items-start space-x-3'>
                          <div
                            className={`w-2 h-2 rounded-full mt-2 ${
                              notification.type === 'success'
                                ? 'bg-green-500'
                                : notification.type === 'warning'
                                  ? 'bg-yellow-500'
                                  : 'bg-blue-500'
                            }`}
                          />
                          <div className='flex-1 min-w-0'>
                            <p className='text-sm text-gray-900'>
                              {notification.message}
                            </p>
                            <p className='text-xs text-gray-500 mt-1'>
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className='p-3 border-t border-gray-200'>
                    <button className='text-xs text-blue-600 hover:text-blue-800 font-medium'>
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className={LAYOUT_CLASSES.DASHBOARD_CONTAINER} data-oid='00qtaa_'>
        {/* Hero Metric - Conversion Rate */}
        <div className={LAYOUT_CLASSES.HERO_CONTAINER} data-oid='kow3:vd'>
          <HeroMetric
            title='Conversion Rate'
            value={dashboardStats.conversionRate}
            unit='%'
            trend='+2.3%'
            subtitle='Overall conversion performance across all channels'
            showChart={true}
            data-oid='o-fml37'
          />
        </div>

        {/* Essential Metrics Grid - New 5-Column Layout */}
        <section
          className={spacing.getSectionSpacing('high')}
          data-oid='g_z8q5n'
        >
          <div className='grid grid-cols-1 lg:grid-cols-5 gap-4'>
            {/* Conversion Rate Card - With Chart */}
            <div className='w-auto col-span-1 p-5 border border-gray-200 rounded-lg bg-white'>
              <h3 className='text-sm font-semibold text-gray-600 mb-2'>
                Conversion Rate
              </h3>
              <div className='text-2xl font-bold text-gray-900 leading-tight mb-1'>
                {dashboardStats.conversionRate}%
              </div>
              <div className='text-xs text-green-600 mb-3'>+2.3%</div>
              <div className='text-xs text-gray-500 mb-3'>
                Overall conversion performance across all channels
              </div>
              <div className='h-20 mt-3'>
                <ConversionRateTrendChart data-oid='vuj.jrd' />
              </div>
            </div>

            {/* Total Visitors Card */}
            <div className='w-auto col-span-1 p-5 border border-gray-200 rounded-lg bg-white'>
              <h3 className='text-sm font-semibold text-gray-600 mb-2'>
                Total Visitors
              </h3>
              <div className='text-2xl font-bold text-gray-900 leading-tight mb-1'>
                {dashboardStats.totalVisitors.toLocaleString()}
              </div>
              <div className='text-xs text-green-600 mb-3'>+12.3%</div>
              <div className='text-xs text-gray-500 mb-3'>Website visitors</div>
            </div>

            {/* Active Sessions Card */}
            <div className='w-auto col-span-1 p-5 border border-gray-200 rounded-lg bg-white'>
              <h3 className='text-sm font-semibold text-gray-600 mb-2'>
                Active Sessions
              </h3>
              <div className='text-2xl font-bold text-gray-900 leading-tight mb-1'>
                {dashboardStats.totalSessions.toLocaleString()}
              </div>
              <div className='text-xs text-green-600 mb-3'>+8.7%</div>
              <div className='text-xs text-gray-500 mb-3'>Current sessions</div>
            </div>

            {/* A/B Experiments Card */}
            <div className='w-auto col-span-1 p-5 border border-gray-200 rounded-lg bg-white'>
              <h3 className='text-sm font-semibold text-gray-600 mb-2'>
                A/B Experiments
              </h3>
              <div className='text-2xl font-bold text-gray-900 leading-tight mb-1'>
                {dashboardStats.activeExperiments}
              </div>
              <div className='text-xs text-green-600 mb-3'>+2</div>
              <div className='text-xs text-gray-500 mb-3'>
                Currently running
              </div>
            </div>

            {/* Model Accuracy Card */}
            <div className='w-auto col-span-1 p-5 border border-gray-200 rounded-lg bg-white'>
              <h3 className='text-sm font-semibold text-gray-600 mb-2'>
                Model Accuracy
              </h3>
              <div className='text-2xl font-bold text-gray-900 leading-tight mb-1'>
                {dashboardStats.modelAccuracy}%
              </div>
              <div className='text-xs text-green-600 mb-3'>+0.8%</div>
              <div className='text-xs text-gray-500 mb-3'>AI performance</div>
            </div>
          </div>
        </section>

        {/* Detailed Analytics */}
        <section
          className={spacing.getSectionSpacing('medium')}
          data-oid='lg2tttn'
        >
          <div className='mb-6'>
            <h2 className='text-2xl font-bold text-gray-900 mb-2'>
              Detailed Analytics
            </h2>
            <p className='text-gray-600'>
              Real-time analytics and interactive charts
            </p>
          </div>

          <div
            className={RESPONSIVE_SPACING.CARD_GROUP_RESPONSIVE}
            data-oid='ieykhpn'
          >
            {/* Charts */}
            <div
              className='grid grid-cols-1 lg:grid-cols-1 gap-6'
              data-oid='2dh8zxy'
            >
              <WebMetricsChart data-oid='tfam3y4' />
            </div>
          </div>
        </section>

        {/* System Details */}
        <section
          className={spacing.getSectionSpacing('medium')}
          data-oid='49ddti4'
        >
          <div className='mb-6'>
            <h2 className='text-2xl font-bold text-gray-900 mb-2'>
              System Details
            </h2>
            <p className='text-gray-600'>
              Detailed system health, experiments, and ML model performance
            </p>
          </div>

          <div className='space-y-8' data-oid='gbfzau:'>
            {/* System Health Details */}
            <div
              className='grid grid-cols-1 lg:grid-cols-2 gap-6'
              data-oid='rvbo3fu'
            >
              {/* Experiments */}
              <div
                className={`${components.card('elevated', 'md')} bg-white`}
                data-oid='i4czvp5'
              >
                <h3
                  className='text-xl font-semibold text-gray-900 mb-4'
                  data-oid='9d6ush:'
                >
                  Active Experiments
                </h3>
                {experiments.length > 0 ? (
                  <div className='space-y-4' data-oid='bv1xe0r'>
                    {experiments.map(experiment => (
                      <div
                        key={experiment.id}
                        className={`${components.card('default', 'sm')} bg-white`}
                        data-oid='pls5vex'
                      >
                        <div
                          className='flex justify-between items-start mb-2'
                          data-oid='mb_gnmh'
                        >
                          <h4
                            className='text-lg font-medium text-gray-900'
                            data-oid='kh7p-bp'
                          >
                            {experiment.name}
                          </h4>
                          <span
                            className={`${components.badge(experiment.status === 'Running' ? 'success' : 'warning')} text-xs`}
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
                          <div className='mt-2 pt-2 border-t border-gray-100'>
                            <div className='grid grid-cols-2 gap-2 text-xs'>
                              <div data-oid='exp-start'>
                                Started: Dec 15, 2024
                              </div>
                              <div data-oid='exp-sample'>
                                Sample: 12,450 users
                              </div>
                              <div data-oid='exp-significance'>
                                Significance: 95%
                              </div>
                              <div data-oid='exp-lift'>
                                Lift: +24% vs control
                              </div>
                            </div>
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
                className={`${components.card('elevated', 'md')} bg-white`}
                data-oid='r8nvtqa'
              >
                <h3
                  className='text-xl font-semibold text-gray-900 mb-4'
                  data-oid='f-4wkeu'
                >
                  ML Model Performance
                </h3>
                {modelMetrics.length > 0 ? (
                  <div className='space-y-4' data-oid='c4pxwvk'>
                    {modelMetrics.map((metric, index) => (
                      <div
                        key={index}
                        className={`${components.card('default', 'sm')} bg-white`}
                        data-oid='zgp8u63'
                      >
                        <div
                          className='flex justify-between items-start mb-2'
                          data-oid='tvhkfs:'
                        >
                          <h4
                            className='text-lg font-medium text-gray-900'
                            data-oid='5_7_v8t'
                          >
                            {metric.name}
                          </h4>
                          <span
                            className={`${components.badge(metric.status === 'Active' ? 'success' : 'primary')} text-xs`}
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
                          <div className='mt-2 pt-2 border-t border-gray-100'>
                            <div className='grid grid-cols-2 gap-2 text-xs'>
                              <div data-oid='model-trained'>
                                Last trained: 2 hours ago
                              </div>
                              <div data-oid='model-training'>
                                Training set: 145K records
                              </div>
                              <div data-oid='model-version'>v2.1.3</div>
                              <div data-oid='model-deploy'>
                                Production since: Jan 15
                              </div>
                            </div>
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
        </section>
      </div>
    </div>
  );
};

export default UniversalAIDashboard;
