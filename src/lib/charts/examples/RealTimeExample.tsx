/**
 * Real-Time Chart Example
 * Demonstrates the complete real-time data visualization system with WebSocket integration,
 * multiple chart types, performance monitoring, and interactive controls.
 */

import React, { useEffect, useState } from 'react';
import {
  RealTimeChart,
  RealTimeControls,
  RealTimeDashboard,
  RealTimeMetricsDisplay,
} from '../components/RealTimeChart';
import {
  ChartSubscription,
  realTimeChartEngine,
  RealTimeDataUtils,
  RealTimeStreamConfig,
} from '../RealTimeChartEngine';
import { realTimeDataService } from '../services/RealTimeDataService';

// Example configurations
const chartConfigs: Record<string, RealTimeStreamConfig> = {
  analytics: {
    maxDataPoints: 50,
    updateInterval: 2000,
    throttleDelay: 500,
    bufferSize: 200,
    aggregationWindow: 10000,
    autoScale: true,
    compression: true,
  },

  systemMetrics: {
    maxDataPoints: 100,
    updateInterval: 1000,
    throttleDelay: 100,
    bufferSize: 500,
    autoScale: true,
    compression: false,
  },

  abTesting: {
    maxDataPoints: 30,
    updateInterval: 3000,
    throttleDelay: 1000,
    bufferSize: 100,
    aggregationWindow: 15000,
    autoScale: true,
    compression: true,
  },

  timeSeries: {
    maxDataPoints: 200,
    updateInterval: 500,
    throttleDelay: 50,
    bufferSize: 1000,
    autoScale: true,
    compression: false,
  },
};

// Sample subscriptions
const subscriptions: Record<string, Omit<ChartSubscription, 'chartId'>> = {
  analytics: {
    id: 'analytics-subscription',
    dataTypes: ['pageViews', 'uniqueVisitors', 'revenue'],
    filters: [{ field: 'pageViews', operator: 'gt', value: 0 }],

    transform: data => ({
      ...data,
      value: typeof data.value === 'object' ? data.value.pageViews : data.value,
    }),
  },

  systemMetrics: {
    id: 'system-subscription',
    dataTypes: ['cpu', 'memory', 'network'],
    filters: [],
    transform: data => ({
      ...data,
      value: typeof data.value === 'object' ? data.value.cpu : data.value,
    }),
  },

  abTesting: {
    id: 'ab-subscription',
    dataTypes: ['conversion', 'variant'],
    filters: [{ field: 'conversion', operator: 'eq', value: true }],
  },

  timeSeries: {
    id: 'timeseries-subscription',
    dataTypes: ['value'],
    filters: [],
  },
};

// Main example component
export const RealTimeExample: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'connecting' | 'connected'
  >('disconnected');
  const [serviceStats, setServiceStats] = useState<any>(null);
  const [mockDataStreams, setMockDataStreams] = useState<Array<() => void>>([]);

  // Initialize the real-time system
  useEffect(() => {
    const initializeRealTimeSystem = async () => {
      try {
        setConnectionStatus('connecting');

        // Initialize the data service (backend)
        await realTimeDataService.initialize(8080);

        // Initialize the chart engine (frontend)
        await realTimeChartEngine.initialize({
          url: 'ws://localhost:8080',
          reconnectInterval: 5000,
          maxReconnectAttempts: 5,
          heartbeatInterval: 30000,
        });

        setConnectionStatus('connected');
        setIsInitialized(true);

        // Start mock data streams for demonstration
        startMockDataStreams();

        // Update service stats periodically
        const statsInterval = setInterval(() => {
          setServiceStats(realTimeDataService.getStats());
        }, 2000);

        return () => clearInterval(statsInterval);
      } catch (error) {
        console.error('Failed to initialize real-time system:', error);
        setConnectionStatus('disconnected');
      }
    };

    initializeRealTimeSystem();

    return () => {
      // Cleanup
      mockDataStreams.forEach(cleanup => cleanup());
      realTimeChartEngine.shutdown();
      realTimeDataService.shutdown();
    };
  }, []);

  // Start mock data streams for demonstration
  const startMockDataStreams = () => {
    const streams: Array<() => void> = [];

    // Analytics stream
    const analyticsCleanup = RealTimeDataUtils.createMockDataStream(
      'analytics-chart',
      2000,
      realTimeChartEngine
    );
    streams.push(analyticsCleanup);

    // System metrics stream
    const systemCleanup = RealTimeDataUtils.createMockDataStream(
      'system-metrics-chart',
      1000,
      realTimeChartEngine
    );
    streams.push(systemCleanup);

    // A/B testing stream
    const abTestingCleanup = RealTimeDataUtils.createMockDataStream(
      'ab-testing-chart',
      3000,
      realTimeChartEngine
    );
    streams.push(abTestingCleanup);

    // Time series stream
    const timeSeriesCleanup = RealTimeDataUtils.createMockDataStream(
      'time-series-chart',
      500,
      realTimeChartEngine
    );
    streams.push(timeSeriesCleanup);

    setMockDataStreams(streams);
  };

  if (!isInitialized) {
    return (
      <div
        className='flex items-center justify-center min-h-screen'
        data-oid='fsnrgc0'
      >
        <div className='text-center' data-oid='o16uhj6'>
          <div
            className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4'
            data-oid='ul1c7_0'
          ></div>
          <p className='text-lg font-medium' data-oid='4.9929a'>
            Initializing Real-Time System...
          </p>
          <p className='text-sm text-gray-600 mt-2' data-oid='gpu.xca'>
            Status: {connectionStatus}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className='real-time-example min-h-screen bg-gray-50 p-6'
      data-oid='zm3teid'
    >
      {/* Header */}
      <div className='mb-8' data-oid='0u4o3hi'>
        <h1
          className='text-3xl font-bold text-gray-900 mb-2'
          data-oid='5ejtdh1'
        >
          Real-Time Data Visualization System
        </h1>
        <p className='text-gray-600' data-oid='u4.ir90'>
          Live demonstration of WebSocket-powered real-time charts with
          performance optimization
        </p>

        {/* Status Bar */}
        <div
          className='mt-4 flex items-center justify-between bg-white p-4 rounded-lg shadow'
          data-oid='ya012fh'
        >
          <div className='flex items-center space-x-4' data-oid='e6trk1s'>
            <div className='flex items-center space-x-2' data-oid='v4sbd9z'>
              <div
                className={`w-3 h-3 rounded-full ${
                  connectionStatus === 'connected'
                    ? 'bg-green-500'
                    : 'bg-red-500'
                }`}
                data-oid='wpjdwlr'
              />

              <span className='font-medium' data-oid='vkzyg1a'>
                Connection: {connectionStatus}
              </span>
            </div>

            {serviceStats && (
              <div
                className='flex items-center space-x-4 text-sm text-gray-600'
                data-oid='rgbpa1.'
              >
                <span data-oid='uc.e0m-'>
                  Clients: {serviceStats.connectedClients}
                </span>
                <span data-oid='3p-5c1_'>
                  Subscriptions: {serviceStats.activeSubscriptions}
                </span>
                <span data-oid='gi6slas'>
                  Streams: {serviceStats.dataStreams}
                </span>
              </div>
            )}
          </div>

          <div className='flex items-center space-x-2' data-oid='-hrh87m'>
            <button
              onClick={() => window.location.reload()}
              className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
              data-oid='8l8iz4s'
            >
              Restart System
            </button>
          </div>
        </div>
      </div>

      {/* Individual Chart Examples */}
      <div className='mb-12' data-oid='phld1_i'>
        <h2 className='text-2xl font-bold mb-6' data-oid='wl20:y4'>
          Individual Chart Examples
        </h2>

        <div
          className='grid grid-cols-1 lg:grid-cols-2 gap-8'
          data-oid='m_vt7f7'
        >
          {/* Analytics Line Chart */}
          <div className='bg-white p-6 rounded-lg shadow' data-oid='q9kybq-'>
            <div
              className='flex items-center justify-between mb-4'
              data-oid='q1pv8r.'
            >
              <h3 className='text-lg font-semibold' data-oid='kzvu2e-'>
                Website Analytics (Line Chart)
              </h3>
              <RealTimeControls chartId='analytics-chart' data-oid='gnc8fo6' />
            </div>

            <RealTimeChart
              chartId='analytics-chart'
              chartType='line'
              config={chartConfigs.analytics}
              subscription={subscriptions.analytics}
              height={300}
              showPerformanceMetrics={true}
              showTrend={true}
              colors={['#3b82f6', '#10b981', '#f59e0b']}
              data-oid='q6aw3nu'
            />
          </div>

          {/* System Metrics Area Chart */}
          <div className='bg-white p-6 rounded-lg shadow' data-oid='fvnxx:x'>
            <div
              className='flex items-center justify-between mb-4'
              data-oid='h1fgorv'
            >
              <h3 className='text-lg font-semibold' data-oid='l_s0n2e'>
                System Metrics (Area Chart)
              </h3>
              <RealTimeControls
                chartId='system-metrics-chart'
                data-oid='jxg0nve'
              />
            </div>

            <RealTimeChart
              chartId='system-metrics-chart'
              chartType='area'
              config={chartConfigs.systemMetrics}
              subscription={subscriptions.systemMetrics}
              height={300}
              showPerformanceMetrics={true}
              showTrend={true}
              colors={['#ef4444', '#8b5cf6', '#06b6d4']}
              data-oid='zb-fwdk'
            />
          </div>

          {/* A/B Testing Bar Chart */}
          <div className='bg-white p-6 rounded-lg shadow' data-oid='o7_bs5u'>
            <div
              className='flex items-center justify-between mb-4'
              data-oid='26:gx2l'
            >
              <h3 className='text-lg font-semibold' data-oid='luco5tn'>
                A/B Test Results (Bar Chart)
              </h3>
              <RealTimeControls chartId='ab-testing-chart' data-oid='4uce-y1' />
            </div>

            <RealTimeChart
              chartId='ab-testing-chart'
              chartType='bar'
              config={chartConfigs.abTesting}
              subscription={subscriptions.abTesting}
              height={300}
              showPerformanceMetrics={true}
              showTrend={false}
              colors={['#f97316', '#84cc16', '#ec4899']}
              data-oid='gf_f1t.'
            />
          </div>

          {/* Time Series Scatter Chart */}
          <div className='bg-white p-6 rounded-lg shadow' data-oid='u.:_ll0'>
            <div
              className='flex items-center justify-between mb-4'
              data-oid='wjig1zh'
            >
              <h3 className='text-lg font-semibold' data-oid='jg0951s'>
                Time Series Data (Scatter Chart)
              </h3>
              <RealTimeControls
                chartId='time-series-chart'
                data-oid='ju8mnf2'
              />
            </div>

            <RealTimeChart
              chartId='time-series-chart'
              chartType='scatter'
              config={chartConfigs.timeSeries}
              subscription={subscriptions.timeSeries}
              height={300}
              showPerformanceMetrics={true}
              showTrend={true}
              colors={['#6366f1']}
              data-oid='4e02bo9'
            />
          </div>
        </div>
      </div>

      {/* Dashboard Example */}
      <div className='mb-12' data-oid='8dyy1zb'>
        <h2 className='text-2xl font-bold mb-6' data-oid='8xc1mwt'>
          Real-Time Dashboard
        </h2>

        <RealTimeDashboard
          charts={[
            {
              id: 'dashboard-analytics',
              title: 'Analytics Overview',
              type: 'line',
              config: chartConfigs.analytics,
              subscription: subscriptions.analytics,
            },
            {
              id: 'dashboard-system',
              title: 'System Health',
              type: 'area',
              config: chartConfigs.systemMetrics,
              subscription: subscriptions.systemMetrics,
            },
            {
              id: 'dashboard-ab',
              title: 'A/B Tests',
              type: 'bar',
              config: chartConfigs.abTesting,
              subscription: subscriptions.abTesting,
            },
          ]}
          layout='grid'
          showGlobalMetrics={true}
          data-oid='.-.g2m_'
        />
      </div>

      {/* Performance Monitoring */}
      <div className='mb-12' data-oid='e_68szj'>
        <h2 className='text-2xl font-bold mb-6' data-oid='_b2.6xt'>
          Performance Monitoring
        </h2>

        <div className='bg-white p-6 rounded-lg shadow' data-oid='-qfc9v9'>
          <h3 className='text-lg font-semibold mb-4' data-oid='zmsdkm3'>
            Global Performance Metrics
          </h3>
          <RealTimeMetricsDisplay
            chartId='global'
            position='top'
            showDetails={true}
            data-oid='420eikh'
          />

          {/* Additional performance details */}
          <div
            className='mt-6 grid grid-cols-1 md:grid-cols-3 gap-4'
            data-oid='d8y3a-3'
          >
            <div className='p-4 bg-gray-50 rounded' data-oid='qvehyd3'>
              <h4 className='font-medium text-gray-700 mb-2' data-oid='3lo-z1y'>
                Data Throughput
              </h4>
              <p
                className='text-2xl font-bold text-blue-600'
                data-oid='2gxvika'
              >
                {serviceStats?.dataStreams || 0} streams
              </p>
              <p className='text-sm text-gray-600' data-oid='xovml58'>
                Active data streams
              </p>
            </div>

            <div className='p-4 bg-gray-50 rounded' data-oid='qwhilw6'>
              <h4 className='font-medium text-gray-700 mb-2' data-oid='24pmoxd'>
                Client Connections
              </h4>
              <p
                className='text-2xl font-bold text-green-600'
                data-oid='4qu:rke'
              >
                {serviceStats?.connectedClients || 0}
              </p>
              <p className='text-sm text-gray-600' data-oid='2wst5lb'>
                WebSocket connections
              </p>
            </div>

            <div className='p-4 bg-gray-50 rounded' data-oid='39cjx5t'>
              <h4 className='font-medium text-gray-700 mb-2' data-oid='7va6.zg'>
                Active Subscriptions
              </h4>
              <p
                className='text-2xl font-bold text-purple-600'
                data-oid='mhkny6t'
              >
                {serviceStats?.activeSubscriptions || 0}
              </p>
              <p className='text-sm text-gray-600' data-oid='au9pzr0'>
                Chart subscriptions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Features */}
      <div className='mb-12' data-oid=':fz72ud'>
        <h2 className='text-2xl font-bold mb-6' data-oid='h9u2s8f'>
          Technical Features
        </h2>

        <div
          className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          data-oid='nul159k'
        >
          <div className='bg-white p-6 rounded-lg shadow' data-oid='m.53f-a'>
            <h3
              className='font-semibold text-green-600 mb-2'
              data-oid='nf-kuh4'
            >
              ✅ WebSocket Integration
            </h3>
            <ul className='text-sm text-gray-600 space-y-1' data-oid='t4azdzd'>
              <li data-oid='e7fdu57'>
                • Real-time bidirectional communication
              </li>
              <li data-oid='diq7:uz'>• Automatic reconnection handling</li>
              <li data-oid='nd75u6u'>• Heartbeat monitoring</li>
              <li data-oid='m6-ze5y'>• Connection status tracking</li>
            </ul>
          </div>

          <div className='bg-white p-6 rounded-lg shadow' data-oid='yn4-4i-'>
            <h3 className='font-semibold text-blue-600 mb-2' data-oid='2locw_.'>
              ⚡ Performance Optimization
            </h3>
            <ul className='text-sm text-gray-600 space-y-1' data-oid='k76uzvs'>
              <li data-oid='1f_ma9k'>• Data throttling and buffering</li>
              <li data-oid='.szb_5s'>• Efficient rendering (no animations)</li>
              <li data-oid=':0jowh2'>• Memory usage monitoring</li>
              <li data-oid='ehwc5j4'>• Frame drop detection</li>
            </ul>
          </div>

          <div className='bg-white p-6 rounded-lg shadow' data-oid='y1k3a36'>
            <h3
              className='font-semibold text-purple-600 mb-2'
              data-oid='.:.r0h3'
            >
              📊 Advanced Analytics
            </h3>
            <ul className='text-sm text-gray-600 space-y-1' data-oid='f1cj:__'>
              <li data-oid='pix3ujs'>• Real-time trend calculation</li>
              <li data-oid='1tl863z'>• Data aggregation windows</li>
              <li data-oid='-s6j6hk'>• Filtering and transformations</li>
              <li data-oid='p1y1a.i'>• Multiple chart types support</li>
            </ul>
          </div>

          <div className='bg-white p-6 rounded-lg shadow' data-oid='hlaxd-:'>
            <h3
              className='font-semibold text-orange-600 mb-2'
              data-oid='s52kmn4'
            >
              🎛️ Interactive Controls
            </h3>
            <ul className='text-sm text-gray-600 space-y-1' data-oid='_65f8n.'>
              <li data-oid='rumml6c'>• Pause/resume streaming</li>
              <li data-oid='1kgn52t'>• Clear chart data</li>
              <li data-oid='kag7w4k'>• Export data functionality</li>
              <li data-oid='hh-jkro'>• Real-time configuration</li>
            </ul>
          </div>

          <div className='bg-white p-6 rounded-lg shadow' data-oid='b50wvrk'>
            <h3 className='font-semibold text-red-600 mb-2' data-oid='wd:0zgp'>
              🔄 Data Streaming
            </h3>
            <ul className='text-sm text-gray-600 space-y-1' data-oid='kzt5v6q'>
              <li data-oid='2fmlfje'>• Mock data generators</li>
              <li data-oid='gr5k6r.'>• Multiple data sources</li>
              <li data-oid='qy6yl:.'>• Data compression support</li>
              <li data-oid='ebieb8k'>• Buffer overflow handling</li>
            </ul>
          </div>

          <div className='bg-white p-6 rounded-lg shadow' data-oid='t.1s.z5'>
            <h3
              className='font-semibold text-indigo-600 mb-2'
              data-oid='ql69epo'
            >
              📱 Responsive Design
            </h3>
            <ul className='text-sm text-gray-600 space-y-1' data-oid='4my-gg5'>
              <li data-oid='9sqwbs-'>• Mobile-optimized layouts</li>
              <li data-oid='0vlco6u'>• Adaptive chart sizing</li>
              <li data-oid='bpzn.29'>• Touch-friendly controls</li>
              <li data-oid='h7:djtw'>• Cross-browser compatibility</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className='bg-blue-50 p-6 rounded-lg' data-oid='27kfd21'>
        <h3
          className='text-lg font-semibold text-blue-900 mb-4'
          data-oid='dy0k4uz'
        >
          🚀 How to Use This System
        </h3>

        <div className='prose text-blue-800' data-oid='nj87z5_'>
          <ol className='list-decimal list-inside space-y-2' data-oid='2.zaa.4'>
            <li data-oid='v8i4.-5'>
              <strong data-oid='da9_488'>WebSocket Connection:</strong> The
              system automatically connects to a WebSocket server for real-time
              data streaming. Connection status is shown in the top status bar.
            </li>
            <li data-oid='7bwbbir'>
              <strong data-oid='b-a5ta3'>Chart Interaction:</strong> Use the
              control buttons to pause/resume data streaming, clear chart data,
              or export data to JSON format.
            </li>
            <li data-oid='rfk349_'>
              <strong data-oid='o_t_wdb'>Performance Monitoring:</strong> Watch
              the performance metrics to see real-time update rates, latency,
              buffer utilization, and memory usage.
            </li>
            <li data-oid='6x2vo0c'>
              <strong data-oid='r:tstpw'>Trend Analysis:</strong> Charts with
              trend analysis enabled show directional indicators and strength
              percentages for data trends.
            </li>
            <li data-oid='ek8p6fm'>
              <strong data-oid='8_c22p.'>Dashboard View:</strong> The dashboard
              combines multiple charts with global performance metrics for
              comprehensive monitoring.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default RealTimeExample;
