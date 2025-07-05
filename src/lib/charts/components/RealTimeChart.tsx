/**
 * Real-Time Chart Components
 * React components for real-time data visualization with WebSocket integration,
 * performance optimization, and responsive design.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartSubscription,
  PerformanceMetrics,
  RealTimeChartEngine,
  realTimeChartEngine,
  RealTimeDataPoint,
  RealTimeStreamConfig,
} from '../RealTimeChartEngine';

// Component interfaces
export interface RealTimeChartProps {
  chartId: string;
  chartType: 'line' | 'area' | 'bar' | 'scatter';
  config: RealTimeStreamConfig;
  subscription?: Omit<ChartSubscription, 'chartId'>;
  width?: number | string;
  height?: number | string;
  showPerformanceMetrics?: boolean;
  showTrend?: boolean;
  colors?: string[];
  className?: string;
  onDataUpdate?: (data: RealTimeDataPoint[]) => void;
  onError?: (error: any) => void;
}

export interface RealTimeMetricsDisplayProps {
  chartId: string;
  position?: 'top' | 'bottom' | 'overlay';
  showDetails?: boolean;
}

export interface RealTimeControlsProps {
  chartId: string;
  onPause?: () => void;
  onResume?: () => void;
  onClear?: () => void;
  onExport?: () => void;
}

// Custom hooks for real-time data management
export const useRealTimeData = (
  chartId: string,
  config: RealTimeStreamConfig
) => {
  const [data, setData] = useState<RealTimeDataPoint[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const engineRef = useRef<RealTimeChartEngine>(realTimeChartEngine);

  useEffect(() => {
    const engine = engineRef.current;

    // Register chart
    engine.registerChart(chartId, config);

    // Set up event listeners
    const handleChartUpdate = (event: any) => {
      if (event.chartId === chartId && !isPaused) {
        setData(event.data);
      }
    };

    const handleConnection = () => setIsConnected(true);
    const handleDisconnection = () => setIsConnected(false);
    const handleError = (event: any) => setError(event.error);

    engine.on('chart:update', handleChartUpdate);
    engine.on('websocket:connected', handleConnection);
    engine.on('websocket:disconnected', handleDisconnection);
    engine.on('websocket:error', handleError);

    return () => {
      engine.off('chart:update', handleChartUpdate);
      engine.off('websocket:connected', handleConnection);
      engine.off('websocket:disconnected', handleDisconnection);
      engine.off('websocket:error', handleError);
      engine.destroyChart(chartId);
    };
  }, [chartId, config, isPaused]);

  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => setIsPaused(false), []);
  const clear = useCallback(() => {
    engineRef.current.clearChartData(chartId);
    setData([]);
  }, [chartId]);

  return {
    data,
    isConnected,
    error,
    isPaused,
    pause,
    resume,
    clear,
  };
};

export const useRealTimeMetrics = (chartId: string) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    const engine = realTimeChartEngine;

    const handleMetricsUpdate = (newMetrics: PerformanceMetrics) => {
      setMetrics(newMetrics);
    };

    engine.on('metrics:update', handleMetricsUpdate);

    // Get initial metrics
    setMetrics(engine.getPerformanceMetrics());

    return () => {
      engine.off('metrics:update', handleMetricsUpdate);
    };
  }, [chartId]);

  return metrics;
};

// Main real-time chart component
export const RealTimeChart: React.FC<RealTimeChartProps> = ({
  chartId,
  chartType,
  config,
  subscription,
  width = '100%',
  height = 400,
  showPerformanceMetrics = false,
  showTrend = false,
  colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'],
  className = '',
  onDataUpdate,
  onError,
}) => {
  const { data, isConnected, error, isPaused } = useRealTimeData(
    chartId,
    config
  );
  const [trendData, setTrendData] = useState<any>(null);

  // Subscribe to data if subscription provided
  useEffect(() => {
    if (subscription) {
      const fullSubscription: ChartSubscription = {
        ...subscription,
        chartId,
        id: `${chartId}-${Date.now()}`,
      };

      realTimeChartEngine.subscribe(fullSubscription);

      return () => {
        realTimeChartEngine.unsubscribe(fullSubscription.id);
      };
    }
  }, [chartId, subscription]);

  // Calculate trend data
  useEffect(() => {
    if (showTrend && data.length > 1) {
      const trend = calculateTrend(data);
      setTrendData(trend);
    }
  }, [data, showTrend]);

  // Notify parent of data updates
  useEffect(() => {
    if (onDataUpdate) {
      onDataUpdate(data);
    }
  }, [data, onDataUpdate]);

  // Handle errors
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Format data for charts
  const chartData = useMemo(() => {
    return data.map((point, index) => ({
      x: point.timestamp,
      y: typeof point.value === 'number' ? point.value : 0,
      timestamp: point.timestamp,
      name: point.category || `Point ${index}`,
      value: point.value,
      index,
    }));
  }, [data]);

  // Format timestamp for display
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  // Render the appropriate chart type
  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps} data-oid='x3glt2i'>
            <CartesianGrid strokeDasharray='3 3' data-oid='6i-y3g9' />
            <XAxis
              dataKey='timestamp'
              type='number'
              scale='time'
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatTimestamp}
              data-oid='jwnr62z'
            />

            <YAxis data-oid='_genwf:' />
            <Tooltip
              labelFormatter={value => formatTimestamp(value as number)}
              formatter={(value: number) => [value.toFixed(2), 'Value']}
              data-oid='qluqk3c'
            />

            <Legend data-oid='oyiw1yl' />
            <Line
              type='monotone'
              dataKey='y'
              stroke={colors[0]}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              data-oid='f-8np9w'
            />

            {showTrend && trendData && (
              <ReferenceLine
                y={trendData.average}
                stroke={trendData.direction === 'up' ? '#4ade80' : '#f87171'}
                strokeDasharray='5 5'
                label={`Trend: ${trendData.direction}`}
                data-oid='wdlj70f'
              />
            )}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps} data-oid='fff:c7-'>
            <CartesianGrid strokeDasharray='3 3' data-oid='2-gxunh' />
            <XAxis
              dataKey='timestamp'
              type='number'
              scale='time'
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatTimestamp}
              data-oid='z_5j4pi'
            />

            <YAxis data-oid='aj9jdlt' />
            <Tooltip
              labelFormatter={value => formatTimestamp(value as number)}
              formatter={(value: number) => [value.toFixed(2), 'Value']}
              data-oid='t-_y7s-'
            />

            <Legend data-oid='7x1x:_f' />
            <Area
              type='monotone'
              dataKey='y'
              stroke={colors[0]}
              fill={colors[0]}
              fillOpacity={0.3}
              isAnimationActive={false}
              data-oid=':awgx7-'
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps} data-oid='kebwaw0'>
            <CartesianGrid strokeDasharray='3 3' data-oid=':qjhqb3' />
            <XAxis
              dataKey='name'
              tickFormatter={(value, index) => `${index + 1}`}
              data-oid='k:ip_2z'
            />

            <YAxis data-oid='vuxtjlc' />
            <Tooltip
              formatter={(value: number) => [value.toFixed(2), 'Value']}
              data-oid='3yx5o5:'
            />

            <Legend data-oid='i8o.wik' />
            <Bar
              dataKey='y'
              fill={colors[0]}
              isAnimationActive={false}
              data-oid='4tspz1k'
            />
          </BarChart>
        );

      case 'scatter':
        return (
          <ScatterChart {...commonProps} data-oid='-d1a5zp'>
            <CartesianGrid strokeDasharray='3 3' data-oid='au24-4h' />
            <XAxis
              dataKey='timestamp'
              type='number'
              scale='time'
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatTimestamp}
              data-oid='244:16t'
            />

            <YAxis dataKey='y' data-oid='xugjxeo' />
            <Tooltip
              labelFormatter={value => formatTimestamp(value as number)}
              formatter={(value: number) => [value.toFixed(2), 'Value']}
              data-oid='kzfxtsd'
            />

            <Legend data-oid='quxzdqz' />
            <Scatter dataKey='y' fill={colors[0]} data-oid='c.4g79y' />
          </ScatterChart>
        );

      default:
        return <div data-oid='sctzfgo'>Unsupported chart type</div>;
    }
  };

  return (
    <div className={`real-time-chart ${className}`} data-oid='kfvb1mw'>
      {/* Connection Status */}
      <div
        className='flex items-center justify-between mb-4'
        data-oid='5e_8u19'
      >
        <div className='flex items-center space-x-2' data-oid='fdn81qk'>
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
            data-oid='9bmx9iq'
          />

          <span className='text-sm text-gray-600' data-oid='x1m756x'>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          {isPaused && (
            <span className='text-sm text-orange-600 ml-2' data-oid='n0dl1.u'>
              Paused
            </span>
          )}
        </div>

        {showTrend && trendData && (
          <div
            className='flex items-center space-x-2 text-sm'
            data-oid='4wfx:j.'
          >
            <span data-oid='s2xzjsn'>Trend:</span>
            <span
              className={`font-medium ${
                trendData.direction === 'up'
                  ? 'text-green-600'
                  : trendData.direction === 'down'
                    ? 'text-red-600'
                    : 'text-gray-600'
              }`}
              data-oid='7jl3k2k'
            >
              {trendData.direction} ({trendData.strength.toFixed(1)}%)
            </span>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div
          className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'
          data-oid='d:w52h4'
        >
          Error: {error}
        </div>
      )}

      {/* Chart */}
      <ResponsiveContainer width={width} height={height} data-oid='_8-s:s_'>
        {renderChart()}
      </ResponsiveContainer>

      {/* Performance Metrics */}
      {showPerformanceMetrics && (
        <RealTimeMetricsDisplay
          chartId={chartId}
          position='bottom'
          data-oid='7l2469f'
        />
      )}
    </div>
  );
};

// Performance metrics display component
export const RealTimeMetricsDisplay: React.FC<RealTimeMetricsDisplayProps> = ({
  chartId,
  position = 'bottom',
  showDetails = true,
}) => {
  const metrics = useRealTimeMetrics(chartId);

  if (!metrics) {
    return null;
  }

  const positionClasses = {
    top: 'mb-4',
    bottom: 'mt-4',
    overlay: 'absolute top-4 right-4 bg-white bg-opacity-90 rounded p-2',
  };

  return (
    <div
      className={`real-time-metrics ${positionClasses[position]}`}
      data-oid='_y_cb2m'
    >
      <div
        className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'
        data-oid='8oc-fj8'
      >
        <div className='text-center' data-oid='1p86594'>
          <div className='font-medium text-gray-600' data-oid='y6nxlbr'>
            Update Rate
          </div>
          <div className='text-lg font-bold' data-oid='tgr3hoz'>
            {metrics.updateRate.toFixed(1)} Hz
          </div>
        </div>

        <div className='text-center' data-oid='4kal97n'>
          <div className='font-medium text-gray-600' data-oid='v2_h5q.'>
            Latency
          </div>
          <div className='text-lg font-bold' data-oid='4n8--1x'>
            {metrics.averageLatency.toFixed(0)}ms
          </div>
        </div>

        <div className='text-center' data-oid='ggijo:g'>
          <div className='font-medium text-gray-600' data-oid='zx8w5mz'>
            Buffer
          </div>
          <div className='text-lg font-bold' data-oid='wt3a60z'>
            {metrics.bufferUtilization.toFixed(1)}%
          </div>
        </div>

        <div className='text-center' data-oid='bg.v:a4'>
          <div className='font-medium text-gray-600' data-oid='qhxbr:d'>
            Memory
          </div>
          <div className='text-lg font-bold' data-oid='z-kw8f3'>
            {metrics.memoryUsage.toFixed(1)}MB
          </div>
        </div>
      </div>

      {showDetails && (
        <div
          className='mt-2 text-xs text-gray-500 text-center'
          data-oid='c:kkqz8'
        >
          Dropped: {metrics.droppedFrames} | Last Update:{' '}
          {new Date(metrics.lastUpdate).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

// Control panel for real-time charts
export const RealTimeControls: React.FC<RealTimeControlsProps> = ({
  chartId,
  onPause,
  onResume,
  onClear,
  onExport,
}) => {
  const { isPaused, pause, resume, clear } = useRealTimeData(chartId, {
    maxDataPoints: 100,
    updateInterval: 1000,
    throttleDelay: 100,
    bufferSize: 1000,
  });

  const handlePause = () => {
    pause();
    onPause?.();
  };

  const handleResume = () => {
    resume();
    onResume?.();
  };

  const handleClear = () => {
    clear();
    onClear?.();
  };

  const handleExport = () => {
    const data = realTimeChartEngine.getChartData(chartId);
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `real-time-data-${chartId}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onExport?.();
  };

  return (
    <div
      className='real-time-controls flex items-center space-x-2'
      data-oid='a8odxlm'
    >
      <button
        onClick={isPaused ? handleResume : handlePause}
        className={`px-3 py-1 rounded text-sm font-medium ${
          isPaused
            ? 'bg-green-500 hover:bg-green-600 text-white'
            : 'bg-orange-500 hover:bg-orange-600 text-white'
        }`}
        data-oid='e7o1ibv'
      >
        {isPaused ? 'Resume' : 'Pause'}
      </button>

      <button
        onClick={handleClear}
        className='px-3 py-1 rounded text-sm font-medium bg-red-500 hover:bg-red-600 text-white'
        data-oid='d9rc:-.'
      >
        Clear
      </button>

      <button
        onClick={handleExport}
        className='px-3 py-1 rounded text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white'
        data-oid='-1dpvl0'
      >
        Export
      </button>
    </div>
  );
};

// Multi-chart dashboard for real-time data
export interface RealTimeDashboardProps {
  charts: Array<{
    id: string;
    title: string;
    type: 'line' | 'area' | 'bar' | 'scatter';
    config: RealTimeStreamConfig;
    subscription?: Omit<ChartSubscription, 'chartId'>;
  }>;
  layout?: 'grid' | 'vertical' | 'horizontal';
  showGlobalMetrics?: boolean;
}

export const RealTimeDashboard: React.FC<RealTimeDashboardProps> = ({
  charts,
  layout = 'grid',
  showGlobalMetrics = true,
}) => {
  const layoutClasses = {
    grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    vertical: 'space-y-6',
    horizontal: 'flex space-x-6 overflow-x-auto',
  };

  return (
    <div className='real-time-dashboard' data-oid='y1d4skv'>
      {showGlobalMetrics && (
        <div className='mb-6 p-4 bg-gray-50 rounded-lg' data-oid='mfd3jnz'>
          <h3 className='text-lg font-medium mb-4' data-oid='8xesiyf'>
            Global Performance Metrics
          </h3>
          <RealTimeMetricsDisplay
            chartId='global'
            position='top'
            showDetails={true}
            data-oid='zpykbag'
          />
        </div>
      )}

      <div className={layoutClasses[layout]} data-oid='9opi8yc'>
        {charts.map(chart => (
          <div key={chart.id} className='chart-container' data-oid='y083u7h'>
            <div
              className='mb-2 flex items-center justify-between'
              data-oid='-nfgb-k'
            >
              <h4 className='font-medium' data-oid='xuesi5y'>
                {chart.title}
              </h4>
              <RealTimeControls chartId={chart.id} data-oid='-it:1rn' />
            </div>

            <RealTimeChart
              chartId={chart.id}
              chartType={chart.type}
              config={chart.config}
              subscription={chart.subscription}
              height={300}
              showPerformanceMetrics={false}
              showTrend={true}
              className='border border-gray-200 rounded p-4'
              data-oid='cd-01c3'
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// Utility function for trend calculation
function calculateTrend(data: RealTimeDataPoint[]) {
  if (data.length < 2) {
    return { direction: 'stable', strength: 0, average: 0 };
  }

  const numericValues = data
    .map(p => p.value)
    .filter(v => typeof v === 'number') as number[];

  if (numericValues.length < 2) {
    return { direction: 'stable', strength: 0, average: 0 };
  }

  const average =
    numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
  const first = numericValues[0];
  const last = numericValues[numericValues.length - 1];
  const change = last - first;
  const changePercent = Math.abs(change / first) * 100;

  let direction: 'up' | 'down' | 'stable' = 'stable';
  if (Math.abs(change) > average * 0.05) {
    // 5% threshold
    direction = change > 0 ? 'up' : 'down';
  }

  return {
    direction,
    strength: changePercent,
    average,
  };
}
