/**
 * Mobile Responsive Chart Components
 * React components optimized for mobile devices with touch gestures,
 * responsive layouts, and adaptive UI elements.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  DetectedGesture,
  DeviceInfo,
  MobileChartConfig,
  mobileChartEngine,
  ResponsiveBreakpoint,
} from '../MobileChartEngine';

// Mobile Chart Props
export interface MobileChartProps {
  data: any[];
  type: 'line' | 'bar' | 'area' | 'scatter' | 'pie' | 'doughnut';
  width?: number;
  height?: number;
  config?: Partial<MobileChartConfig>;
  onGesture?: (gesture: DetectedGesture) => void;
  onDataSelect?: (data: any) => void;
  className?: string;
  testId?: string;
}

// Custom hooks for mobile chart functionality
export const useMobileChart = (containerRef: React.RefObject<HTMLElement>) => {
  const [chartId, setChartId] = useState<string>('');
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [currentBreakpoint, setCurrentBreakpoint] =
    useState<ResponsiveBreakpoint | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isTouch, setIsTouch] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    'portrait'
  );

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize mobile chart
    const id = mobileChartEngine.initializeMobileChart(containerRef.current);
    setChartId(id);

    // Get device info
    const info = mobileChartEngine.getDeviceInfo();
    setDeviceInfo(info);
    setIsTouch(info.type === 'mobile' || info.type === 'tablet');

    // Get current breakpoint
    const breakpoint = mobileChartEngine.getCurrentBreakpoint();
    setCurrentBreakpoint(breakpoint);
    setOrientation(info.orientation);

    // Setup event listeners
    const handleOrientationChange = () => {
      setOrientation(mobileChartEngine.getDeviceInfo().orientation);
      setCurrentBreakpoint(mobileChartEngine.getCurrentBreakpoint());
    };

    const handleResize = () => {
      if (containerRef.current) {
        const dims = mobileChartEngine.getOptimalDimensions(
          containerRef.current
        );
        setDimensions(dims);
      }
    };

    mobileChartEngine.on('orientation:changed', handleOrientationChange);
    mobileChartEngine.on('breakpoint:changed', handleResize);
    mobileChartEngine.on('chart:resize', handleResize);

    // Initial resize
    handleResize();

    return () => {
      mobileChartEngine.off('orientation:changed', handleOrientationChange);
      mobileChartEngine.off('breakpoint:changed', handleResize);
      mobileChartEngine.off('chart:resize', handleResize);
    };
  }, [containerRef]);

  return {
    chartId,
    deviceInfo,
    currentBreakpoint,
    dimensions,
    isTouch,
    orientation,
    isMobile: deviceInfo?.type === 'mobile',
    isTablet: deviceInfo?.type === 'tablet',
    supportsMultiTouch:
      deviceInfo?.touchCapabilities.supportsMultiTouch || false,
  };
};

// Touch gesture hook
export const useTouchGestures = (
  containerRef: React.RefObject<HTMLElement>,
  onGesture?: (gesture: DetectedGesture) => void
) => {
  const [activeGesture, setActiveGesture] = useState<DetectedGesture | null>(
    null
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const handleGesture = (
      event: CustomEvent<{ gesture: DetectedGesture }>
    ) => {
      const gesture = event.detail.gesture;
      setActiveGesture(gesture);
      onGesture?.(gesture);

      // Clear active gesture after animation
      setTimeout(() => setActiveGesture(null), 300);
    };

    const container = containerRef.current;
    container.addEventListener(
      'gesture:detected',
      handleGesture as EventListener
    );

    return () => {
      container.removeEventListener(
        'gesture:detected',
        handleGesture as EventListener
      );
    };
  }, [containerRef, onGesture]);

  return { activeGesture };
};

// Responsive dimensions hook
export const useResponsiveDimensions = (
  containerRef: React.RefObject<HTMLElement>,
  aspectRatio?: number
) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      let { width, height } = rect;

      if (aspectRatio) {
        height = width / aspectRatio;
      }

      setDimensions({ width, height });
    };

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);

    updateDimensions();

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef, aspectRatio]);

  return dimensions;
};

// Main Mobile Chart Component
export const MobileResponsiveChart: React.FC<MobileChartProps> = ({
  data,
  type,
  width,
  height,
  config,
  onGesture,
  onDataSelect,
  className = '',
  testId = 'mobile-chart',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    chartId,
    deviceInfo,
    currentBreakpoint,
    dimensions,
    isTouch,
    orientation,
    isMobile,
    isTablet,
  } = useMobileChart(containerRef);

  const { activeGesture } = useTouchGestures(containerRef, onGesture);

  // Get mobile-optimized configuration
  const mobileConfig = useMemo(() => {
    return mobileChartEngine.getMobileConfig(config);
  }, [config, currentBreakpoint]);

  // Responsive dimensions
  const chartDimensions = useResponsiveDimensions(
    containerRef,
    mobileConfig?.layout.aspectRatio
  );

  const finalWidth = width || chartDimensions.width || 300;
  const finalHeight = height || chartDimensions.height || 200;

  // Render chart based on type and mobile optimizations
  const renderChart = useCallback(() => {
    if (!canvasRef.current || !data.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, finalWidth, finalHeight);

    // Apply mobile-specific styling
    ctx.font = `${mobileConfig.ui.fontSize}px sans-serif`;
    ctx.lineWidth = isMobile ? 2 : 1;

    // Render based on chart type
    switch (type) {
      case 'line':
        renderLineChart(ctx, data, finalWidth, finalHeight, mobileConfig);
        break;
      case 'bar':
        renderBarChart(ctx, data, finalWidth, finalHeight, mobileConfig);
        break;
      case 'area':
        renderAreaChart(ctx, data, finalWidth, finalHeight, mobileConfig);
        break;
      case 'scatter':
        renderScatterChart(ctx, data, finalWidth, finalHeight, mobileConfig);
        break;
      case 'pie':
        renderPieChart(ctx, data, finalWidth, finalHeight, mobileConfig);
        break;
      case 'doughnut':
        renderDoughnutChart(ctx, data, finalWidth, finalHeight, mobileConfig);
        break;
    }
  }, [data, type, finalWidth, finalHeight, mobileConfig, isMobile]);

  // Re-render when data or config changes
  useEffect(() => {
    renderChart();
  }, [renderChart]);

  // Handle touch feedback
  useEffect(() => {
    if (activeGesture && mobileConfig.touch.feedback === 'haptic') {
      mobileChartEngine.provideFeedback('light');
    }
  }, [activeGesture, mobileConfig.touch.feedback]);

  // Mobile-specific class names
  const mobileClasses = useMemo(() => {
    const classes = ['mobile-responsive-chart'];

    if (isMobile) classes.push('mobile-chart');
    if (isTablet) classes.push('tablet-chart');
    if (isTouch) classes.push('touch-enabled');
    if (orientation) classes.push(`orientation-${orientation}`);
    if (currentBreakpoint) classes.push(`breakpoint-${currentBreakpoint.name}`);
    if (activeGesture) classes.push(`gesture-${activeGesture.type}`);

    return classes.join(' ');
  }, [
    isMobile,
    isTablet,
    isTouch,
    orientation,
    currentBreakpoint,
    activeGesture,
  ]);

  return (
    <div
      ref={containerRef}
      className={`${mobileClasses} ${className}`}
      data-testid={testId}
      data-chart-id={chartId}
      data-device-type={deviceInfo?.type}
      data-orientation={orientation}
      style={{
        width: width || '100%',
        height: height || 'auto',
        minHeight: mobileConfig.layout.minHeight,
        maxHeight: mobileConfig.layout.maxHeight,
        padding: mobileConfig.layout.padding,
        touchAction: 'none',
        userSelect: 'none',
      }}
      data-oid='-1l.9c6'
    >
      <canvas
        ref={canvasRef}
        width={finalWidth}
        height={finalHeight}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
        role='img'
        aria-label={`${type} chart with ${data.length} data points`}
        data-oid='qc0378-'
      />

      {/* Mobile-optimized legend */}
      {mobileConfig.ui.legendPosition !== 'hidden' && (
        <MobileLegend
          data={data}
          position={mobileConfig.ui.legendPosition}
          fontSize={mobileConfig.ui.fontSize}
          touchTargetSize={mobileConfig.ui.touchTargetSize}
          data-oid='wlzvth.'
        />
      )}

      {/* Touch controls overlay */}
      {isTouch && (
        <MobileTouchControls
          chartId={chartId}
          config={mobileConfig}
          onDataSelect={onDataSelect}
          data-oid='5710cse'
        />
      )}

      {/* Performance indicator for debug */}
      {process.env.NODE_ENV === 'development' && (
        <div className='mobile-chart-debug' data-oid='zziwi5_'>
          <small data-oid='7.1gu-v'>
            {deviceInfo?.type} | {currentBreakpoint?.name} | {orientation}
          </small>
        </div>
      )}
    </div>
  );
};

// Mobile-optimized Legend component
interface MobileLegendProps {
  data: any[];
  position: 'top' | 'bottom' | 'left' | 'right' | 'overlay' | 'hidden';
  fontSize: number;
  touchTargetSize: number;
}

const MobileLegend: React.FC<MobileLegendProps> = ({
  data,
  position,
  fontSize,
  touchTargetSize,
}) => {
  if (position === 'hidden' || !data.length) return null;

  const legendItems = data.map((item, index) => (
    <div
      key={index}
      className='mobile-legend-item'
      style={{
        minHeight: touchTargetSize,
        fontSize,
        display: 'flex',
        alignItems: 'center',
        padding: '4px 8px',
        cursor: 'pointer',
      }}
      data-oid='xcgu_ak'
    >
      <div
        className='legend-color'
        style={{
          width: 12,
          height: 12,
          backgroundColor: item.color || `hsl(${index * 45}, 70%, 50%)`,
          marginRight: 8,
          borderRadius: 2,
        }}
        data-oid='j2oc2ih'
      />

      <span data-oid='e.x9y-8'>{item.label || `Series ${index + 1}`}</span>
    </div>
  ));

  const legendClasses = `mobile-legend position-${position}`;

  return (
    <div className={legendClasses} data-oid='ta.sy3c'>
      {legendItems}
    </div>
  );
};

// Mobile Touch Controls component
interface MobileTouchControlsProps {
  chartId: string;
  config: MobileChartConfig;
  onDataSelect?: (data: any) => void;
}

const MobileTouchControls: React.FC<MobileTouchControlsProps> = ({
  chartId,
  config,
  onDataSelect,
}) => {
  const [showControls, setShowControls] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(zoomLevel * 1.2, 5);
    setZoomLevel(newZoom);
    mobileChartEngine.emit('chart:zoom', { chartId, zoomLevel: newZoom });
  }, [chartId, zoomLevel]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(zoomLevel / 1.2, 0.5);
    setZoomLevel(newZoom);
    mobileChartEngine.emit('chart:zoom', { chartId, zoomLevel: newZoom });
  }, [chartId, zoomLevel]);

  const handleReset = useCallback(() => {
    setZoomLevel(1);
    mobileChartEngine.emit('chart:reset', { chartId });
  }, [chartId]);

  if (!showControls) {
    return (
      <button
        className='mobile-controls-toggle'
        onClick={() => setShowControls(true)}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: config.ui.touchTargetSize,
          height: config.ui.touchTargetSize,
          background: 'rgba(0,0,0,0.1)',
          border: 'none',
          borderRadius: '50%',
          fontSize: config.ui.fontSize,
        }}
        aria-label='Show chart controls'
        data-oid='lw71f1d'
      >
        ⚙️
      </button>
    );
  }

  return (
    <div
      className='mobile-touch-controls'
      style={{
        position: 'absolute',
        top: 8,
        right: 8,
        background: 'rgba(255,255,255,0.9)',
        borderRadius: 8,
        padding: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
      data-oid='gwwuyj0'
    >
      <button
        onClick={handleZoomIn}
        style={{
          width: config.ui.touchTargetSize,
          height: config.ui.touchTargetSize,
          border: 'none',
          borderRadius: 4,
          background: '#007AFF',
          color: 'white',
          fontSize: config.ui.fontSize,
        }}
        aria-label='Zoom in'
        data-oid='y407ov_'
      >
        +
      </button>

      <button
        onClick={handleZoomOut}
        style={{
          width: config.ui.touchTargetSize,
          height: config.ui.touchTargetSize,
          border: 'none',
          borderRadius: 4,
          background: '#007AFF',
          color: 'white',
          fontSize: config.ui.fontSize,
        }}
        aria-label='Zoom out'
        data-oid='ef2pzc4'
      >
        −
      </button>

      <button
        onClick={handleReset}
        style={{
          width: config.ui.touchTargetSize,
          height: config.ui.touchTargetSize,
          border: 'none',
          borderRadius: 4,
          background: '#34C759',
          color: 'white',
          fontSize: config.ui.fontSize - 2,
        }}
        aria-label='Reset zoom'
        data-oid='y8v.57e'
      >
        ↺
      </button>

      <button
        onClick={() => setShowControls(false)}
        style={{
          width: config.ui.touchTargetSize,
          height: config.ui.touchTargetSize,
          border: 'none',
          borderRadius: 4,
          background: '#FF3B30',
          color: 'white',
          fontSize: config.ui.fontSize,
        }}
        aria-label='Hide controls'
        data-oid='5ixgrkn'
      >
        ×
      </button>
    </div>
  );
};

// Chart rendering functions
const renderLineChart = (
  ctx: CanvasRenderingContext2D,
  data: any[],
  width: number,
  height: number,
  config: MobileChartConfig
) => {
  if (!data.length) return;

  const margin = config.layout.margin;
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Calculate scales
  const xScale = chartWidth / (data.length - 1);
  const maxY = Math.max(...data.map(d => d.y || d.value || 0));
  const yScale = chartHeight / maxY;

  // Draw line
  ctx.beginPath();
  ctx.strokeStyle = '#007AFF';
  ctx.lineWidth = 2;

  data.forEach((point, index) => {
    const x = margin.left + index * xScale;
    const y = height - margin.bottom - (point.y || point.value || 0) * yScale;

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();

  // Draw points
  data.forEach((point, index) => {
    const x = margin.left + index * xScale;
    const y = height - margin.bottom - (point.y || point.value || 0) * yScale;

    ctx.beginPath();
    ctx.fillStyle = '#007AFF';
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fill();
  });
};

const renderBarChart = (
  ctx: CanvasRenderingContext2D,
  data: any[],
  width: number,
  height: number,
  config: MobileChartConfig
) => {
  if (!data.length) return;

  const margin = config.layout.margin;
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const barWidth = (chartWidth / data.length) * 0.8;
  const barSpacing = (chartWidth / data.length) * 0.2;
  const maxY = Math.max(...data.map(d => d.y || d.value || 0));
  const yScale = chartHeight / maxY;

  data.forEach((point, index) => {
    const x = margin.left + index * (barWidth + barSpacing) + barSpacing / 2;
    const barHeight = (point.y || point.value || 0) * yScale;
    const y = height - margin.bottom - barHeight;

    ctx.fillStyle = point.color || `hsl(${index * 45}, 70%, 50%)`;
    ctx.fillRect(x, y, barWidth, barHeight);
  });
};

const renderAreaChart = (
  ctx: CanvasRenderingContext2D,
  data: any[],
  width: number,
  height: number,
  config: MobileChartConfig
) => {
  if (!data.length) return;

  const margin = config.layout.margin;
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const xScale = chartWidth / (data.length - 1);
  const maxY = Math.max(...data.map(d => d.y || d.value || 0));
  const yScale = chartHeight / maxY;

  // Draw area
  ctx.beginPath();
  ctx.fillStyle = 'rgba(0, 122, 255, 0.3)';

  // Start from bottom-left
  ctx.moveTo(margin.left, height - margin.bottom);

  // Draw line to each point
  data.forEach((point, index) => {
    const x = margin.left + index * xScale;
    const y = height - margin.bottom - (point.y || point.value || 0) * yScale;
    ctx.lineTo(x, y);
  });

  // Close path to bottom-right
  ctx.lineTo(margin.left + chartWidth, height - margin.bottom);
  ctx.closePath();
  ctx.fill();

  // Draw line on top
  renderLineChart(ctx, data, width, height, config);
};

const renderScatterChart = (
  ctx: CanvasRenderingContext2D,
  data: any[],
  width: number,
  height: number,
  config: MobileChartConfig
) => {
  if (!data.length) return;

  const margin = config.layout.margin;
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const maxX = Math.max(...data.map(d => d.x || 0));
  const maxY = Math.max(...data.map(d => d.y || d.value || 0));
  const xScale = chartWidth / maxX;
  const yScale = chartHeight / maxY;

  data.forEach((point, index) => {
    const x = margin.left + (point.x || index) * xScale;
    const y = height - margin.bottom - (point.y || point.value || 0) * yScale;

    ctx.beginPath();
    ctx.fillStyle = point.color || `hsl(${index * 45}, 70%, 50%)`;
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.fill();
  });
};

const renderPieChart = (
  ctx: CanvasRenderingContext2D,
  data: any[],
  width: number,
  height: number,
  config: MobileChartConfig
) => {
  if (!data.length) return;

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 20;

  const total = data.reduce((sum, d) => sum + (d.value || d.y || 0), 0);
  let currentAngle = -Math.PI / 2;

  data.forEach((slice, index) => {
    const sliceAngle = ((slice.value || slice.y || 0) / total) * 2 * Math.PI;

    ctx.beginPath();
    ctx.fillStyle = slice.color || `hsl(${index * 45}, 70%, 50%)`;
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.lineTo(centerX, centerY);
    ctx.closePath();
    ctx.fill();

    currentAngle += sliceAngle;
  });
};

const renderDoughnutChart = (
  ctx: CanvasRenderingContext2D,
  data: any[],
  width: number,
  height: number,
  config: MobileChartConfig
) => {
  if (!data.length) return;

  const centerX = width / 2;
  const centerY = height / 2;
  const outerRadius = Math.min(width, height) / 2 - 20;
  const innerRadius = outerRadius * 0.6;

  const total = data.reduce((sum, d) => sum + (d.value || d.y || 0), 0);
  let currentAngle = -Math.PI / 2;

  data.forEach((slice, index) => {
    const sliceAngle = ((slice.value || slice.y || 0) / total) * 2 * Math.PI;

    ctx.beginPath();
    ctx.fillStyle = slice.color || `hsl(${index * 45}, 70%, 50%)`;
    ctx.arc(
      centerX,
      centerY,
      outerRadius,
      currentAngle,
      currentAngle + sliceAngle
    );
    ctx.arc(
      centerX,
      centerY,
      innerRadius,
      currentAngle + sliceAngle,
      currentAngle,
      true
    );
    ctx.closePath();
    ctx.fill();

    currentAngle += sliceAngle;
  });
};

export default MobileResponsiveChart;
