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
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4'></div>
          <p className='text-lg font-medium'>
            Initializing Real-Time System...
          </p>
          <p className='text-sm text-gray-600 mt-2'>
            Status: {connectionStatus}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='real-time-example min-h-screen bg-gray-50 p-6'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>
          Real-Time Data Visualization System
        </h1>
        <p className='text-gray-600'>
          Live demonstration of WebSocket-powered real-time charts with
          performance optimization
        </p>

        {/* Status Bar */}
        <div className='mt-4 flex items-center justify-between bg-white p-4 rounded-lg shadow'>
          <div className='flex items-center space-x-4'>
            <div className='flex items-center space-x-2'>
              <div
                className={`w-3 h-3 rounded-full ${
                  connectionStatus === 'connected'
                    ? 'bg-green-500'
                    : 'bg-red-500'
                }`}
              />

              <span className='font-medium'>
                Connection: {connectionStatus}
              </span>
            </div>

            {serviceStats && (
              <div className='flex items-center space-x-4 text-sm text-gray-600'>
                <span>Clients: {serviceStats.connectedClients}</span>
                <span>Subscriptions: {serviceStats.activeSubscriptions}</span>
                <span>Streams: {serviceStats.dataStreams}</span>
              </div>
            )}
          </div>

          <div className='flex items-center space-x-2'>
            <button
              onClick={() => window.location.reload()}
              className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
            >
              Restart System
            </button>
          </div>
        </div>
      </div>

      {/* Individual Chart Examples */}
      <div className='mb-12'>
        <h2 className='text-2xl font-bold mb-6'>Individual Chart Examples</h2>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* Analytics Line Chart */}
          <div className='bg-white p-6 rounded-lg shadow'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold'>
                Website Analytics (Line Chart)
              </h3>
              <RealTimeControls chartId='analytics-chart' />
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
            />
          </div>

          {/* System Metrics Area Chart */}
          <div className='bg-white p-6 rounded-lg shadow'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold'>
                System Metrics (Area Chart)
              </h3>
              <RealTimeControls chartId='system-metrics-chart' />
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
            />
          </div>

          {/* A/B Testing Bar Chart */}
          <div className='bg-white p-6 rounded-lg shadow'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold'>
                A/B Test Results (Bar Chart)
              </h3>
              <RealTimeControls chartId='ab-testing-chart' />
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
            />
          </div>

          {/* Time Series Scatter Chart */}
          <div className='bg-white p-6 rounded-lg shadow'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold'>
                Time Series Data (Scatter Chart)
              </h3>
              <RealTimeControls chartId='time-series-chart' />
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
            />
          </div>
        </div>
      </div>

      {/* Dashboard Example */}
      <div className='mb-12'>
        <h2 className='text-2xl font-bold mb-6'>Real-Time Dashboard</h2>

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
        />
      </div>

      {/* Performance Monitoring */}
      <div className='mb-12'>
        <h2 className='text-2xl font-bold mb-6'>Performance Monitoring</h2>

        <div className='bg-white p-6 rounded-lg shadow'>
          <h3 className='text-lg font-semibold mb-4'>
            Global Performance Metrics
          </h3>
          <RealTimeMetricsDisplay
            chartId='global'
            position='top'
            showDetails={true}
          />

          {/* Additional performance details */}
          <div className='mt-6 grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='p-4 bg-gray-50 rounded'>
              <h4 className='font-medium text-gray-700 mb-2'>
                Data Throughput
              </h4>
              <p className='text-2xl font-bold text-blue-600'>
                {serviceStats?.dataStreams || 0} streams
              </p>
              <p className='text-sm text-gray-600'>Active data streams</p>
            </div>

            <div className='p-4 bg-gray-50 rounded'>
              <h4 className='font-medium text-gray-700 mb-2'>
                Client Connections
              </h4>
              <p className='text-2xl font-bold text-green-600'>
                {serviceStats?.connectedClients || 0}
              </p>
              <p className='text-sm text-gray-600'>WebSocket connections</p>
            </div>

            <div className='p-4 bg-gray-50 rounded'>
              <h4 className='font-medium text-gray-700 mb-2'>
                Active Subscriptions
              </h4>
              <p className='text-2xl font-bold text-purple-600'>
                {serviceStats?.activeSubscriptions || 0}
              </p>
              <p className='text-sm text-gray-600'>Chart subscriptions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Features */}
      <div className='mb-12'>
        <h2 className='text-2xl font-bold mb-6'>Technical Features</h2>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          <div className='bg-white p-6 rounded-lg shadow'>
            <h3 className='font-semibold text-green-600 mb-2'>
              ✅ WebSocket Integration
            </h3>
            <ul className='text-sm text-gray-600 space-y-1'>
              <li>• Real-time bidirectional communication</li>
              <li>• Automatic reconnection handling</li>
              <li>• Heartbeat monitoring</li>
              <li>• Connection status tracking</li>
            </ul>
          </div>

          <div className='bg-white p-6 rounded-lg shadow'>
            <h3 className='font-semibold text-blue-600 mb-2'>
              ⚡ Performance Optimization
            </h3>
            <ul className='text-sm text-gray-600 space-y-1'>
              <li>• Data throttling and buffering</li>
              <li>• Efficient rendering (no animations)</li>
              <li>• Memory usage monitoring</li>
              <li>• Frame drop detection</li>
            </ul>
          </div>

          <div className='bg-white p-6 rounded-lg shadow'>
            <h3 className='font-semibold text-purple-600 mb-2'>
              📊 Advanced Analytics
            </h3>
            <ul className='text-sm text-gray-600 space-y-1'>
              <li>• Real-time trend calculation</li>
              <li>• Data aggregation windows</li>
              <li>• Filtering and transformations</li>
              <li>• Multiple chart types support</li>
            </ul>
          </div>

          <div className='bg-white p-6 rounded-lg shadow'>
            <h3 className='font-semibold text-orange-600 mb-2'>
              🎛️ Interactive Controls
            </h3>
            <ul className='text-sm text-gray-600 space-y-1'>
              <li>• Pause/resume streaming</li>
              <li>• Clear chart data</li>
              <li>• Export data functionality</li>
              <li>• Real-time configuration</li>
            </ul>
          </div>

          <div className='bg-white p-6 rounded-lg shadow'>
            <h3 className='font-semibold text-red-600 mb-2'>
              🔄 Data Streaming
            </h3>
            <ul className='text-sm text-gray-600 space-y-1'>
              <li>• Mock data generators</li>
              <li>• Multiple data sources</li>
              <li>• Data compression support</li>
              <li>• Buffer overflow handling</li>
            </ul>
          </div>

          <div className='bg-white p-6 rounded-lg shadow'>
            <h3 className='font-semibold text-indigo-600 mb-2'>
              📱 Responsive Design
            </h3>
            <ul className='text-sm text-gray-600 space-y-1'>
              <li>• Mobile-optimized layouts</li>
              <li>• Adaptive chart sizing</li>
              <li>• Touch-friendly controls</li>
              <li>• Cross-browser compatibility</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className='bg-blue-50 p-6 rounded-lg'>
        <h3 className='text-lg font-semibold text-blue-900 mb-4'>
          🚀 How to Use This System
        </h3>

        <div className='prose text-blue-800'>
          <ol className='list-decimal list-inside space-y-2'>
            <li>
              <strong>WebSocket Connection:</strong> The system automatically
              connects to a WebSocket server for real-time data streaming.
              Connection status is shown in the top status bar.
            </li>
            <li>
              <strong>Chart Interaction:</strong> Use the control buttons to
              pause/resume data streaming, clear chart data, or export data to
              JSON format.
            </li>
            <li>
              <strong>Performance Monitoring:</strong> Watch the performance
              metrics to see real-time update rates, latency, buffer
              utilization, and memory usage.
            </li>
            <li>
              <strong>Trend Analysis:</strong> Charts with trend analysis
              enabled show directional indicators and strength percentages for
              data trends.
            </li>
            <li>
              <strong>Dashboard View:</strong> The dashboard combines multiple
              charts with global performance metrics for comprehensive
              monitoring.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default RealTimeExample;
