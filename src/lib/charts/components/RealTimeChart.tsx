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
          <LineChart {...commonProps} data-oid='d92r7o9'>
            <CartesianGrid strokeDasharray='3 3' data-oid='5agvjgr' />
            <XAxis
              dataKey='timestamp'
              type='number'
              scale='time'
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatTimestamp}
              data-oid='kh:mu4b'
            />

            <YAxis data-oid='rpbqug9' />
            <Tooltip
              labelFormatter={value => formatTimestamp(value as number)}
              formatter={(value: number) => [value.toFixed(2), 'Value']}
              data-oid='i-3n-23'
            />

            <Legend data-oid='ee2kr7t' />
            <Line
              type='monotone'
              dataKey='y'
              stroke={colors[0]}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              data-oid='m-igbik'
            />

            {showTrend && trendData && (
              <ReferenceLine
                y={trendData.average}
                stroke={trendData.direction === 'up' ? '#4ade80' : '#f87171'}
                strokeDasharray='5 5'
                label={`Trend: ${trendData.direction}`}
                data-oid='1z40w6n'
              />
            )}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps} data-oid='7yqiyjs'>
            <CartesianGrid strokeDasharray='3 3' data-oid='9gckaw8' />
            <XAxis
              dataKey='timestamp'
              type='number'
              scale='time'
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatTimestamp}
              data-oid='ev2ai_i'
            />

            <YAxis data-oid='5bhonm.' />
            <Tooltip
              labelFormatter={value => formatTimestamp(value as number)}
              formatter={(value: number) => [value.toFixed(2), 'Value']}
              data-oid='axi-8eh'
            />

            <Legend data-oid='xm-z3_e' />
            <Area
              type='monotone'
              dataKey='y'
              stroke={colors[0]}
              fill={colors[0]}
              fillOpacity={0.3}
              isAnimationActive={false}
              data-oid='f3b7d:a'
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps} data-oid='krzuvi0'>
            <CartesianGrid strokeDasharray='3 3' data-oid='8wt_lme' />
            <XAxis
              dataKey='name'
              tickFormatter={(value, index) => `${index + 1}`}
              data-oid='-ybcrjr'
            />

            <YAxis data-oid='-czrai2' />
            <Tooltip
              formatter={(value: number) => [value.toFixed(2), 'Value']}
              data-oid='6cf5z.6'
            />

            <Legend data-oid='6_jyw5g' />
            <Bar
              dataKey='y'
              fill={colors[0]}
              isAnimationActive={false}
              data-oid='8zmm:d7'
            />
          </BarChart>
        );

      case 'scatter':
        return (
          <ScatterChart {...commonProps} data-oid='ggdbbtz'>
            <CartesianGrid strokeDasharray='3 3' data-oid='wovbzk2' />
            <XAxis
              dataKey='timestamp'
              type='number'
              scale='time'
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatTimestamp}
              data-oid='vwvnr05'
            />

            <YAxis dataKey='y' data-oid='frl65dy' />
            <Tooltip
              labelFormatter={value => formatTimestamp(value as number)}
              formatter={(value: number) => [value.toFixed(2), 'Value']}
              data-oid='n66f6fy'
            />

            <Legend data-oid='2lfczei' />
            <Scatter dataKey='y' fill={colors[0]} data-oid='5cqc:bb' />
          </ScatterChart>
        );

      default:
        return <div data-oid='7xgj9:l'>Unsupported chart type</div>;
    }
  };

  return (
    <div className={`real-time-chart ${className}`} data-oid='hagthxh'>
      {/* Connection Status */}
      <div
        className='flex items-center justify-between mb-4'
        data-oid='73fn0u9'
      >
        <div className='flex items-center space-x-2' data-oid=':pv8fvp'>
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
            data-oid='me6tqx9'
          />

          <span className='text-sm text-gray-600' data-oid='9hl3871'>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          {isPaused && (
            <span className='text-sm text-orange-600 ml-2' data-oid='dzedux7'>
              Paused
            </span>
          )}
        </div>

        {showTrend && trendData && (
          <div
            className='flex items-center space-x-2 text-sm'
            data-oid='-fj1x7d'
          >
            <span data-oid='uipcc:g'>Trend:</span>
            <span
              className={`font-medium ${
                trendData.direction === 'up'
                  ? 'text-green-600'
                  : trendData.direction === 'down'
                    ? 'text-red-600'
                    : 'text-gray-600'
              }`}
              data-oid='t1:it8f'
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
          data-oid='2cx9t32'
        >
          Error: {error}
        </div>
      )}

      {/* Chart */}
      <ResponsiveContainer width={width} height={height} data-oid='c9ohdmu'>
        {renderChart()}
      </ResponsiveContainer>

      {/* Performance Metrics */}
      {showPerformanceMetrics && (
        <RealTimeMetricsDisplay
          chartId={chartId}
          position='bottom'
          data-oid='oetyghf'
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
      data-oid='flnfmvl'
    >
      <div
        className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'
        data-oid='-j3jxpo'
      >
        <div className='text-center' data-oid='wl349gr'>
          <div className='font-medium text-gray-600' data-oid='1rn_yjd'>
            Update Rate
          </div>
          <div className='text-lg font-bold' data-oid='tfyn-8z'>
            {metrics.updateRate.toFixed(1)} Hz
          </div>
        </div>

        <div className='text-center' data-oid='t2v5fl6'>
          <div className='font-medium text-gray-600' data-oid='c_.otdn'>
            Latency
          </div>
          <div className='text-lg font-bold' data-oid='q5uqh-4'>
            {metrics.averageLatency.toFixed(0)}ms
          </div>
        </div>

        <div className='text-center' data-oid='e-eff8q'>
          <div className='font-medium text-gray-600' data-oid='1vxbvml'>
            Buffer
          </div>
          <div className='text-lg font-bold' data-oid='j7r1lbp'>
            {metrics.bufferUtilization.toFixed(1)}%
          </div>
        </div>

        <div className='text-center' data-oid='s.yt:zb'>
          <div className='font-medium text-gray-600' data-oid='xr.eb-l'>
            Memory
          </div>
          <div className='text-lg font-bold' data-oid='395lk_1'>
            {metrics.memoryUsage.toFixed(1)}MB
          </div>
        </div>
      </div>

      {showDetails && (
        <div
          className='mt-2 text-xs text-gray-500 text-center'
          data-oid='r64ucp1'
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
      data-oid='elsk.ri'
    >
      <button
        onClick={isPaused ? handleResume : handlePause}
        className={`px-3 py-1 rounded text-sm font-medium ${
          isPaused
            ? 'bg-green-500 hover:bg-green-600 text-white'
            : 'bg-orange-500 hover:bg-orange-600 text-white'
        }`}
        data-oid='ub:s8.q'
      >
        {isPaused ? 'Resume' : 'Pause'}
      </button>

      <button
        onClick={handleClear}
        className='px-3 py-1 rounded text-sm font-medium bg-red-500 hover:bg-red-600 text-white'
        data-oid='9_2ie4z'
      >
        Clear
      </button>

      <button
        onClick={handleExport}
        className='px-3 py-1 rounded text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white'
        data-oid='hjlwu0u'
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
    <div className='real-time-dashboard' data-oid='me:9ae:'>
      {showGlobalMetrics && (
        <div className='mb-6 p-4 bg-gray-50 rounded-lg' data-oid='94y0pqf'>
          <h3 className='text-lg font-medium mb-4' data-oid='siy9q1m'>
            Global Performance Metrics
          </h3>
          <RealTimeMetricsDisplay
            chartId='global'
            position='top'
            showDetails={true}
            data-oid='kaxd2a0'
          />
        </div>
      )}

      <div className={layoutClasses[layout]} data-oid='vek0jo4'>
        {charts.map(chart => (
          <div key={chart.id} className='chart-container' data-oid='x76g.jc'>
            <div
              className='mb-2 flex items-center justify-between'
              data-oid='gtgofjx'
            >
              <h4 className='font-medium' data-oid='dhzzdtf'>
                {chart.title}
              </h4>
              <RealTimeControls chartId={chart.id} data-oid='9exm42.' />
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
              data-oid='pe93p43'
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
