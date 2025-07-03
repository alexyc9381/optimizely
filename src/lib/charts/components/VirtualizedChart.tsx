/**
 * Virtualized Chart Components
 * High-performance React components for handling large datasets with virtualization,
 * progressive loading, and memory optimization.
 */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  MemoryConfig,
  performanceEngine,
  PerformanceMetrics,
  ProgressiveLoadingConfig,
  VirtualDataProvider,
  VirtualizationConfig,
} from '../PerformanceEngine';

// Virtualized Chart Props
export interface VirtualizedChartProps {
  data: any[];
  type: 'line' | 'bar' | 'area' | 'scatter';
  height: number;
  width?: number;
  virtualization?: Partial<VirtualizationConfig>;
  progressiveLoading?: Partial<ProgressiveLoadingConfig>;
  memory?: Partial<MemoryConfig>;
  onDataChange?: (data: any[]) => void;
  onPerformanceMetrics?: (metrics: PerformanceMetrics) => void;
  onError?: (error: Error) => void;
  className?: string;
  testId?: string;
}

// Virtual list item component
interface VirtualListItemProps {
  index: number;
  data: any;
  height: number;
  isVisible: boolean;
  onRender?: (index: number) => void;
}

const VirtualListItem: React.FC<VirtualListItemProps> = React.memo(
  ({ index, data, height, isVisible, onRender }) => {
    const itemRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (isVisible && onRender) {
        onRender(index);
      }
    }, [isVisible, index, onRender]);

    if (!isVisible) {
      return <div style={{ height }} />;
    }

    return (
      <div
        ref={itemRef}
        style={{ height }}
        className='virtual-list-item'
        data-index={index}
      >
        {/* Render chart data point */}
        <div className='data-point'>
          <span className='index'>{index}</span>
          <span className='value'>{JSON.stringify(data)}</span>
        </div>
      </div>
    );
  }
);

VirtualListItem.displayName = 'VirtualListItem';

// Custom hooks for virtualized charts
export const useVirtualization = (
  data: any[],
  containerHeight: number,
  config?: Partial<VirtualizationConfig>
) => {
  const [viewport, setViewport] = useState({
    start: 0,
    end: 0,
    height: containerHeight,
  });
  const [virtualData, setVirtualData] = useState<any[]>([]);
  const [totalHeight, setTotalHeight] = useState(0);
  const dataProviderRef = useRef<VirtualDataProvider | null>(null);

  useEffect(() => {
    if (data.length === 0) return;

    // Create virtual data provider
    dataProviderRef.current = performanceEngine.createVirtualDataProvider(
      data,
      config
    );

    // Initialize viewport
    setViewport(prev => ({ ...prev, height: containerHeight }));
  }, [data, containerHeight, config]);

  const updateViewport = useCallback(
    (scrollTop: number) => {
      if (!dataProviderRef.current) return;

      const itemHeight = config?.itemHeight || 50;
      const visibleStart = Math.floor(scrollTop / itemHeight);
      const visibleEnd = Math.min(
        data.length - 1,
        Math.ceil((scrollTop + containerHeight) / itemHeight)
      );

      setViewport({
        start: scrollTop,
        end: scrollTop + containerHeight,
        height: containerHeight,
      });

      // Get virtual data
      const virtualResult = performanceEngine.virtualizeData(
        data,
        {
          start: scrollTop,
          end: scrollTop + containerHeight,
          height: containerHeight,
        },
        config
      );

      setVirtualData(virtualResult.items);
      setTotalHeight(virtualResult.totalHeight);
    },
    [data, containerHeight, config]
  );

  return {
    virtualData,
    totalHeight,
    updateViewport,
    viewport,
  };
};

export const useProgressiveLoading = (
  dataProvider: () => Promise<any[]>,
  config?: Partial<ProgressiveLoadingConfig>
) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    if (loading) return;

    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      // Listen for progress events
      const progressHandler = (event: any) => {
        if (event.loaded && event.total) {
          setProgress((event.loaded / event.total) * 100);
        }
      };

      performanceEngine.on('data:progress', progressHandler);

      const result = await performanceEngine.loadDataProgressively(
        dataProvider,
        config
      );
      setData(result);
      setProgress(100);

      performanceEngine.off('data:progress', progressHandler);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [dataProvider, config, loading]);

  return {
    data,
    loading,
    progress,
    error,
    loadData,
  };
};

export const usePerformanceMonitoring = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const metricsHandler = (newMetrics: PerformanceMetrics) => {
      setMetrics(prev => [...prev.slice(-99), newMetrics]);
    };

    const alertHandler = (alert: any) => {
      setAlerts(prev => [
        ...prev.slice(-9),
        { ...alert, timestamp: Date.now() },
      ]);
    };

    performanceEngine.on('metrics:collected', metricsHandler);
    performanceEngine.on('alert:memory', alertHandler);
    performanceEngine.on('alert:render-time', alertHandler);
    performanceEngine.on('alert:frame-rate', alertHandler);

    return () => {
      performanceEngine.off('metrics:collected', metricsHandler);
      performanceEngine.off('alert:memory', alertHandler);
      performanceEngine.off('alert:render-time', alertHandler);
      performanceEngine.off('alert:frame-rate', alertHandler);
    };
  }, []);

  return { metrics, alerts };
};

// Main Virtualized Chart Component
export const VirtualizedChart = forwardRef<any, VirtualizedChartProps>(
  (
    {
      data,
      type,
      height,
      width = 800,
      virtualization,
      progressiveLoading,
      memory,
      onDataChange,
      onPerformanceMetrics,
      onError,
      className = '',
      testId,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [isScrolling, setIsScrolling] = useState(false);
    const [optimizedData, setOptimizedData] = useState<any[]>([]);
    const [renderTime, setRenderTime] = useState(0);

    // Performance monitoring
    const { metrics, alerts } = usePerformanceMonitoring();

    // Virtualization
    const { virtualData, totalHeight, updateViewport } = useVirtualization(
      optimizedData,
      height,
      virtualization
    );

    // Data optimization
    useEffect(() => {
      const startTime = performance.now();

      try {
        const optimized = performanceEngine.applyOptimizations(data, type);
        setOptimizedData(optimized);

        if (onDataChange) {
          onDataChange(optimized);
        }
      } catch (error) {
        if (onError) {
          onError(error as Error);
        }
      }

      const endTime = performance.now();
      setRenderTime(endTime - startTime);
    }, [data, type, onDataChange, onError]);

    // Scroll handling
    const handleScroll = useCallback(
      (event: React.UIEvent<HTMLDivElement>) => {
        const scrollTop = event.currentTarget.scrollTop;

        setIsScrolling(true);
        updateViewport(scrollTop);

        // Clear existing timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        // Set new timeout to detect scroll end
        scrollTimeoutRef.current = setTimeout(() => {
          setIsScrolling(false);
        }, 150);
      },
      [updateViewport]
    );

    // Canvas rendering
    const renderChart = useCallback(() => {
      if (!canvasRef.current || virtualData.length === 0) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const startTime = performance.now();

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Set high DPI
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // Render based on chart type
      switch (type) {
        case 'line':
          renderLineChart(ctx, virtualData, width, height);
          break;
        case 'bar':
          renderBarChart(ctx, virtualData, width, height);
          break;
        case 'area':
          renderAreaChart(ctx, virtualData, width, height);
          break;
        case 'scatter':
          renderScatterChart(ctx, virtualData, width, height);
          break;
      }

      const endTime = performance.now();
      const newRenderTime = endTime - startTime;
      setRenderTime(newRenderTime);

      // Report metrics
      if (onPerformanceMetrics) {
        onPerformanceMetrics({
          renderTime: newRenderTime,
          memoryUsage: 0, // Would be calculated
          dataProcessingTime: 0,
          virtualizedItems: virtualData.length,
          cacheHitRate: 0.85,
          frameRate: 60,
          loadTime: 0,
          gcCollections: 0,
          timestamp: Date.now(),
        });
      }
    }, [virtualData, width, height, type, onPerformanceMetrics]);

    // Render chart when data changes
    useEffect(() => {
      renderChart();
    }, [renderChart]);

    // Memory management
    useEffect(() => {
      const interval = setInterval(() => {
        performanceEngine.manageMemory();
      }, 5000);

      return () => clearInterval(interval);
    }, []);

    // Expose methods through ref
    useImperativeHandle(
      ref,
      () => ({
        refresh: () => renderChart(),
        getMetrics: () => metrics,
        exportImage: () => canvasRef.current?.toDataURL(),
        clearCache: () => performanceEngine.clearCache(),
        optimize: () => {
          const optimized = performanceEngine.applyOptimizations(data, type);
          setOptimizedData(optimized);
          return optimized;
        },
      }),
      [renderChart, metrics, data, type]
    );

    return (
      <div
        ref={containerRef}
        className={`virtualized-chart ${className}`}
        data-testid={testId}
        style={{ width, height, position: 'relative', overflow: 'hidden' }}
      >
        {/* Canvas for chart rendering */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
          }}
        />

        {/* Virtual scrollable container */}
        <div
          style={{
            height,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
          onScroll={handleScroll}
        >
          <div style={{ height: totalHeight }}>
            {virtualData.map((item, index) => (
              <VirtualListItem
                key={`${index}-${item.id || index}`}
                index={index}
                data={item}
                height={virtualization?.itemHeight || 50}
                isVisible={true}
              />
            ))}
          </div>
        </div>

        {/* Performance overlay */}
        <div className='performance-overlay'>
          <div className='metrics'>
            <span>Render: {renderTime.toFixed(2)}ms</span>
            <span>Items: {virtualData.length}</span>
            {isScrolling && <span className='scrolling'>Scrolling...</span>}
          </div>

          {/* Performance alerts */}
          {alerts.length > 0 && (
            <div className='alerts'>
              {alerts.slice(-3).map((alert, index) => (
                <div key={index} className={`alert alert-${alert.type}`}>
                  {alert.message || 'Performance warning'}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
);

VirtualizedChart.displayName = 'VirtualizedChart';

// Chart rendering functions
const renderLineChart = (
  ctx: CanvasRenderingContext2D,
  data: any[],
  width: number,
  height: number
) => {
  if (data.length === 0) return;

  ctx.beginPath();
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;

  const xStep = width / (data.length - 1);
  const maxValue = Math.max(...data.map(d => d.y || d.value || 0));
  const minValue = Math.min(...data.map(d => d.y || d.value || 0));
  const valueRange = maxValue - minValue || 1;

  data.forEach((point, index) => {
    const x = index * xStep;
    const y =
      height -
      (((point.y || point.value || 0) - minValue) / valueRange) * height;

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();
};

const renderBarChart = (
  ctx: CanvasRenderingContext2D,
  data: any[],
  width: number,
  height: number
) => {
  if (data.length === 0) return;

  const barWidth = (width / data.length) * 0.8;
  const barSpacing = (width / data.length) * 0.2;
  const maxValue = Math.max(...data.map(d => d.y || d.value || 0));

  ctx.fillStyle = '#3b82f6';

  data.forEach((point, index) => {
    const x = index * (barWidth + barSpacing);
    const barHeight = ((point.y || point.value || 0) / maxValue) * height;
    const y = height - barHeight;

    ctx.fillRect(x, y, barWidth, barHeight);
  });
};

const renderAreaChart = (
  ctx: CanvasRenderingContext2D,
  data: any[],
  width: number,
  height: number
) => {
  if (data.length === 0) return;

  const xStep = width / (data.length - 1);
  const maxValue = Math.max(...data.map(d => d.y || d.value || 0));
  const minValue = Math.min(...data.map(d => d.y || d.value || 0));
  const valueRange = maxValue - minValue || 1;

  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
  gradient.addColorStop(1, 'rgba(59, 130, 246, 0.1)');

  ctx.beginPath();
  ctx.moveTo(0, height);

  data.forEach((point, index) => {
    const x = index * xStep;
    const y =
      height -
      (((point.y || point.value || 0) - minValue) / valueRange) * height;
    ctx.lineTo(x, y);
  });

  ctx.lineTo(width, height);
  ctx.closePath();

  ctx.fillStyle = gradient;
  ctx.fill();

  // Add line on top
  ctx.beginPath();
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;

  data.forEach((point, index) => {
    const x = index * xStep;
    const y =
      height -
      (((point.y || point.value || 0) - minValue) / valueRange) * height;

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();
};

const renderScatterChart = (
  ctx: CanvasRenderingContext2D,
  data: any[],
  width: number,
  height: number
) => {
  if (data.length === 0) return;

  const maxX = Math.max(...data.map(d => d.x || 0));
  const maxY = Math.max(...data.map(d => d.y || d.value || 0));
  const minX = Math.min(...data.map(d => d.x || 0));
  const minY = Math.min(...data.map(d => d.y || d.value || 0));

  const xRange = maxX - minX || 1;
  const yRange = maxY - minY || 1;

  ctx.fillStyle = '#3b82f6';

  data.forEach(point => {
    const x = (((point.x || 0) - minX) / xRange) * width;
    const y =
      height - (((point.y || point.value || 0) - minY) / yRange) * height;

    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fill();
  });
};

// Progressive Loading Chart Component
export const ProgressiveChart: React.FC<{
  dataProvider: () => Promise<any[]>;
  type: 'line' | 'bar' | 'area' | 'scatter';
  height: number;
  width?: number;
  config?: Partial<ProgressiveLoadingConfig>;
}> = ({ dataProvider, type, height, width = 800, config }) => {
  const { data, loading, progress, error, loadData } = useProgressiveLoading(
    dataProvider,
    config
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className='progressive-loading' style={{ width, height }}>
        <div className='loading-progress'>
          <div className='progress-bar' style={{ width: `${progress}%` }} />

          <span>{progress.toFixed(1)}% loaded</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='progressive-error' style={{ width, height }}>
        <p>Error loading data: {error.message}</p>
        <button onClick={loadData}>Retry</button>
      </div>
    );
  }

  return (
    <VirtualizedChart data={data} type={type} height={height} width={width} />
  );
};

// Performance Dashboard Component
export const PerformanceDashboard: React.FC = () => {
  const { metrics, alerts } = usePerformanceMonitoring();
  const latestMetrics = metrics[metrics.length - 1];

  if (!latestMetrics) {
    return (
      <div className='performance-dashboard'>No performance data available</div>
    );
  }

  return (
    <div className='performance-dashboard'>
      <h3>Performance Metrics</h3>
      <div className='metrics-grid'>
        <div className='metric'>
          <label>Render Time</label>
          <span>{latestMetrics.renderTime.toFixed(2)}ms</span>
        </div>
        <div className='metric'>
          <label>Frame Rate</label>
          <span>{latestMetrics.frameRate.toFixed(1)} fps</span>
        </div>
        <div className='metric'>
          <label>Memory Usage</label>
          <span>{(latestMetrics.memoryUsage * 100).toFixed(1)}%</span>
        </div>
        <div className='metric'>
          <label>Cache Hit Rate</label>
          <span>{(latestMetrics.cacheHitRate * 100).toFixed(1)}%</span>
        </div>
        <div className='metric'>
          <label>Virtualized Items</label>
          <span>{latestMetrics.virtualizedItems.toLocaleString()}</span>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className='alerts-section'>
          <h4>Performance Alerts</h4>
          {alerts.slice(-5).map((alert, index) => (
            <div key={index} className='alert'>
              {alert.type}: {alert.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Export all components
export default VirtualizedChart;
