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
        data-oid='h.iuk4h'
      >
        <div className='text-center' data-oid='78f1jxi'>
          <div
            className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4'
            data-oid='lrkfi6e'
          ></div>
          <p className='text-lg font-medium' data-oid='vzhrd63'>
            Initializing Real-Time System...
          </p>
          <p className='text-sm text-gray-600 mt-2' data-oid='15wpwmk'>
            Status: {connectionStatus}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className='real-time-example min-h-screen bg-gray-50 p-6'
      data-oid='e2h193r'
    >
      {/* Header */}
      <div className='mb-8' data-oid='t2b559e'>
        <h1
          className='text-3xl font-bold text-gray-900 mb-2'
          data-oid='1z-v1:i'
        >
          Real-Time Data Visualization System
        </h1>
        <p className='text-gray-600' data-oid='jxuet2m'>
          Live demonstration of WebSocket-powered real-time charts with
          performance optimization
        </p>

        {/* Status Bar */}
        <div
          className='mt-4 flex items-center justify-between bg-white p-4 rounded-lg shadow'
          data-oid='f_z3paf'
        >
          <div className='flex items-center space-x-4' data-oid='84v7fjf'>
            <div className='flex items-center space-x-2' data-oid='jf2c8.-'>
              <div
                className={`w-3 h-3 rounded-full ${
                  connectionStatus === 'connected'
                    ? 'bg-green-500'
                    : 'bg-red-500'
                }`}
                data-oid='n8lbl.x'
              />

              <span className='font-medium' data-oid='s7esbb4'>
                Connection: {connectionStatus}
              </span>
            </div>

            {serviceStats && (
              <div
                className='flex items-center space-x-4 text-sm text-gray-600'
                data-oid='c1sl1lq'
              >
                <span data-oid='7ateyzs'>
                  Clients: {serviceStats.connectedClients}
                </span>
                <span data-oid='t7uxphd'>
                  Subscriptions: {serviceStats.activeSubscriptions}
                </span>
                <span data-oid='fv0poui'>
                  Streams: {serviceStats.dataStreams}
                </span>
              </div>
            )}
          </div>

          <div className='flex items-center space-x-2' data-oid='_may-ft'>
            <button
              onClick={() => window.location.reload()}
              className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
              data-oid='k3t337:'
            >
              Restart System
            </button>
          </div>
        </div>
      </div>

      {/* Individual Chart Examples */}
      <div className='mb-12' data-oid='nfcbhdd'>
        <h2 className='text-2xl font-bold mb-6' data-oid='uutwrvg'>
          Individual Chart Examples
        </h2>

        <div
          className='grid grid-cols-1 lg:grid-cols-2 gap-8'
          data-oid='3mxqc-m'
        >
          {/* Analytics Line Chart */}
          <div className='bg-white p-6 rounded-lg shadow' data-oid='gd_grh1'>
            <div
              className='flex items-center justify-between mb-4'
              data-oid='z5bi5il'
            >
              <h3 className='text-lg font-semibold' data-oid='tj_ntp9'>
                Website Analytics (Line Chart)
              </h3>
              <RealTimeControls chartId='analytics-chart' data-oid='0db.d1u' />
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
              data-oid='7vqfwxi'
            />
          </div>

          {/* System Metrics Area Chart */}
          <div className='bg-white p-6 rounded-lg shadow' data-oid='dsphqp4'>
            <div
              className='flex items-center justify-between mb-4'
              data-oid='y:cdfrv'
            >
              <h3 className='text-lg font-semibold' data-oid='1qae:l:'>
                System Metrics (Area Chart)
              </h3>
              <RealTimeControls
                chartId='system-metrics-chart'
                data-oid='o62_s7m'
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
              data-oid='0a:3kc5'
            />
          </div>

          {/* A/B Testing Bar Chart */}
          <div className='bg-white p-6 rounded-lg shadow' data-oid='j:-0-n3'>
            <div
              className='flex items-center justify-between mb-4'
              data-oid='yog0q2h'
            >
              <h3 className='text-lg font-semibold' data-oid='gyn_k9u'>
                A/B Test Results (Bar Chart)
              </h3>
              <RealTimeControls chartId='ab-testing-chart' data-oid='pohke-_' />
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
              data-oid='r4ma-he'
            />
          </div>

          {/* Time Series Scatter Chart */}
          <div className='bg-white p-6 rounded-lg shadow' data-oid='es1gv49'>
            <div
              className='flex items-center justify-between mb-4'
              data-oid='n63w8lp'
            >
              <h3 className='text-lg font-semibold' data-oid='8lz33_5'>
                Time Series Data (Scatter Chart)
              </h3>
              <RealTimeControls
                chartId='time-series-chart'
                data-oid='s..:sr_'
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
              data-oid='n-74fih'
            />
          </div>
        </div>
      </div>

      {/* Dashboard Example */}
      <div className='mb-12' data-oid='t:a.hpg'>
        <h2 className='text-2xl font-bold mb-6' data-oid='bk4md-t'>
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
          data-oid='kzuj.2o'
        />
      </div>

      {/* Performance Monitoring */}
      <div className='mb-12' data-oid='dwwx.:o'>
        <h2 className='text-2xl font-bold mb-6' data-oid='sq0nqg.'>
          Performance Monitoring
        </h2>

        <div className='bg-white p-6 rounded-lg shadow' data-oid='e4nhls6'>
          <h3 className='text-lg font-semibold mb-4' data-oid='hrfz.h5'>
            Global Performance Metrics
          </h3>
          <RealTimeMetricsDisplay
            chartId='global'
            position='top'
            showDetails={true}
            data-oid='kdymqz7'
          />

          {/* Additional performance details */}
          <div
            className='mt-6 grid grid-cols-1 md:grid-cols-3 gap-4'
            data-oid='ahq3c6p'
          >
            <div className='p-4 bg-gray-50 rounded' data-oid='1xc6:ya'>
              <h4 className='font-medium text-gray-700 mb-2' data-oid='mj:b_11'>
                Data Throughput
              </h4>
              <p
                className='text-2xl font-bold text-blue-600'
                data-oid='af5ymz:'
              >
                {serviceStats?.dataStreams || 0} streams
              </p>
              <p className='text-sm text-gray-600' data-oid='a.2nwwe'>
                Active data streams
              </p>
            </div>

            <div className='p-4 bg-gray-50 rounded' data-oid='frq5-en'>
              <h4 className='font-medium text-gray-700 mb-2' data-oid='vna6lpa'>
                Client Connections
              </h4>
              <p
                className='text-2xl font-bold text-green-600'
                data-oid='umyqz40'
              >
                {serviceStats?.connectedClients || 0}
              </p>
              <p className='text-sm text-gray-600' data-oid='axhu3t0'>
                WebSocket connections
              </p>
            </div>

            <div className='p-4 bg-gray-50 rounded' data-oid='ujxnqb.'>
              <h4 className='font-medium text-gray-700 mb-2' data-oid='m38ypej'>
                Active Subscriptions
              </h4>
              <p
                className='text-2xl font-bold text-purple-600'
                data-oid='s2oapjn'
              >
                {serviceStats?.activeSubscriptions || 0}
              </p>
              <p className='text-sm text-gray-600' data-oid='y3petfk'>
                Chart subscriptions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Features */}
      <div className='mb-12' data-oid='fzw1xbd'>
        <h2 className='text-2xl font-bold mb-6' data-oid=':lcc7::'>
          Technical Features
        </h2>

        <div
          className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          data-oid='en24ft4'
        >
          <div className='bg-white p-6 rounded-lg shadow' data-oid='53_5:in'>
            <h3
              className='font-semibold text-green-600 mb-2'
              data-oid='_vzzfs7'
            >
              ✅ WebSocket Integration
            </h3>
            <ul className='text-sm text-gray-600 space-y-1' data-oid='ey7m4gy'>
              <li data-oid=':euww2v'>
                • Real-time bidirectional communication
              </li>
              <li data-oid='2xupsw8'>• Automatic reconnection handling</li>
              <li data-oid='54ycruu'>• Heartbeat monitoring</li>
              <li data-oid='ejgeo7u'>• Connection status tracking</li>
            </ul>
          </div>

          <div className='bg-white p-6 rounded-lg shadow' data-oid='x7nsmrl'>
            <h3 className='font-semibold text-blue-600 mb-2' data-oid='kgeu9xb'>
              ⚡ Performance Optimization
            </h3>
            <ul className='text-sm text-gray-600 space-y-1' data-oid='0yc066b'>
              <li data-oid='f1zjstn'>• Data throttling and buffering</li>
              <li data-oid='ixoy6ts'>• Efficient rendering (no animations)</li>
              <li data-oid='o41lcju'>• Memory usage monitoring</li>
              <li data-oid='-gpuzjc'>• Frame drop detection</li>
            </ul>
          </div>

          <div className='bg-white p-6 rounded-lg shadow' data-oid='1jg18rg'>
            <h3
              className='font-semibold text-purple-600 mb-2'
              data-oid='tyixbd1'
            >
              📊 Advanced Analytics
            </h3>
            <ul className='text-sm text-gray-600 space-y-1' data-oid='nrzq909'>
              <li data-oid='h.v24w-'>• Real-time trend calculation</li>
              <li data-oid='qpntbkw'>• Data aggregation windows</li>
              <li data-oid='_qc.nip'>• Filtering and transformations</li>
              <li data-oid='sxfk78_'>• Multiple chart types support</li>
            </ul>
          </div>

          <div className='bg-white p-6 rounded-lg shadow' data-oid='q523d_v'>
            <h3
              className='font-semibold text-orange-600 mb-2'
              data-oid='uzjzl1o'
            >
              🎛️ Interactive Controls
            </h3>
            <ul className='text-sm text-gray-600 space-y-1' data-oid='xh.2z6s'>
              <li data-oid='eo.-9nu'>• Pause/resume streaming</li>
              <li data-oid='i3c45u1'>• Clear chart data</li>
              <li data-oid='2vgo97y'>• Export data functionality</li>
              <li data-oid='ou2ih70'>• Real-time configuration</li>
            </ul>
          </div>

          <div className='bg-white p-6 rounded-lg shadow' data-oid='y9nym4n'>
            <h3 className='font-semibold text-red-600 mb-2' data-oid='okrh9pa'>
              🔄 Data Streaming
            </h3>
            <ul className='text-sm text-gray-600 space-y-1' data-oid='z0:omf4'>
              <li data-oid='wciyhup'>• Mock data generators</li>
              <li data-oid='y_q-dzc'>• Multiple data sources</li>
              <li data-oid='f4d.zby'>• Data compression support</li>
              <li data-oid='twkt5::'>• Buffer overflow handling</li>
            </ul>
          </div>

          <div className='bg-white p-6 rounded-lg shadow' data-oid='x6v:mho'>
            <h3
              className='font-semibold text-indigo-600 mb-2'
              data-oid='bq8pz4h'
            >
              📱 Responsive Design
            </h3>
            <ul className='text-sm text-gray-600 space-y-1' data-oid='_adcqf3'>
              <li data-oid='zwauz22'>• Mobile-optimized layouts</li>
              <li data-oid='yrm8qkq'>• Adaptive chart sizing</li>
              <li data-oid='5x7r2l9'>• Touch-friendly controls</li>
              <li data-oid='zu.4cj3'>• Cross-browser compatibility</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className='bg-blue-50 p-6 rounded-lg' data-oid='i1mlzug'>
        <h3
          className='text-lg font-semibold text-blue-900 mb-4'
          data-oid='n36:sde'
        >
          🚀 How to Use This System
        </h3>

        <div className='prose text-blue-800' data-oid='ikz7tem'>
          <ol className='list-decimal list-inside space-y-2' data-oid='31k043c'>
            <li data-oid='d0s09c7'>
              <strong data-oid='bgciqpw'>WebSocket Connection:</strong> The
              system automatically connects to a WebSocket server for real-time
              data streaming. Connection status is shown in the top status bar.
            </li>
            <li data-oid='yc6op5m'>
              <strong data-oid='ky.fzc7'>Chart Interaction:</strong> Use the
              control buttons to pause/resume data streaming, clear chart data,
              or export data to JSON format.
            </li>
            <li data-oid='0h7az6.'>
              <strong data-oid='5kyar5o'>Performance Monitoring:</strong> Watch
              the performance metrics to see real-time update rates, latency,
              buffer utilization, and memory usage.
            </li>
            <li data-oid='vtp.elg'>
              <strong data-oid='f4bfo3y'>Trend Analysis:</strong> Charts with
              trend analysis enabled show directional indicators and strength
              percentages for data trends.
            </li>
            <li data-oid='8gl77uh'>
              <strong data-oid='tfz0g1c'>Dashboard View:</strong> The dashboard
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
