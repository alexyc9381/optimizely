import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StatisticalChartEngine } from '../StatisticalChartEngine';
import {
  ChartConfig,
  ChartContext,
  ChartEvents,
  ChartSeries,
  ChartType,
} from '../types';

interface UniversalChartProps {
  id: string;
  type: ChartType;
  data: ChartSeries[];
  config?: Partial<ChartConfig>;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  events?: ChartEvents;
  onLoad?: (context: ChartContext) => void;
  onError?: (error: Error) => void;
  onExport?: (data: Blob | string) => void;
}

interface ChartRendererProps {
  context: ChartContext;
  containerRef: React.RefObject<HTMLDivElement>;
}

// Canvas-based chart renderers for different chart types
const LineChartRenderer: React.FC<ChartRendererProps> = ({
  context,
  containerRef,
}) => {
  useEffect(() => {
    if (!containerRef.current || !context.data.length) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = containerRef.current;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    container.innerHTML = '';
    container.appendChild(canvas);

    const { colors } = context.config;
    const palette = colors?.palette || ['#1f77b4', '#ff7f0e', '#2ca02c'];

    const padding = 60;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;

    const allData = context.data.flatMap(series => series.data);
    const xValues = allData.map(d => (typeof d.x === 'number' ? d.x : 0));
    const yValues = allData.map(d => d.y);

    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);

    const scaleX = (x: number) =>
      padding + ((x - xMin) / (xMax - xMin)) * chartWidth;
    const scaleY = (y: number) =>
      padding + chartHeight - ((y - yMin) / (yMax - yMin)) * chartHeight;

    // Clear and setup canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = padding + (i / 10) * chartWidth;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + chartHeight);
      ctx.stroke();

      const y = padding + (i / 10) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + chartHeight);
    ctx.lineTo(padding + chartWidth, padding + chartHeight);
    ctx.stroke();

    // Draw data series
    context.data.forEach((series, seriesIndex) => {
      const color = series.color || palette[seriesIndex % palette.length];
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      let isFirstPoint = true;
      series.data.forEach(point => {
        const x = scaleX(typeof point.x === 'number' ? point.x : 0);
        const y = scaleY(point.y);

        if (isFirstPoint) {
          ctx.moveTo(x, y);
          isFirstPoint = false;
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Draw data points
      ctx.fillStyle = color;
      series.data.forEach(point => {
        const x = scaleX(typeof point.x === 'number' ? point.x : 0);
        const y = scaleY(point.y);
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    });

    // Draw labels and title
    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';

    // X-axis labels
    for (let i = 0; i <= 5; i++) {
      const value = xMin + (i / 5) * (xMax - xMin);
      const x = padding + (i / 5) * chartWidth;
      ctx.fillText(value.toFixed(1), x, padding + chartHeight + 20);
    }

    // Y-axis labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const value = yMin + (i / 5) * (yMax - yMin);
      const y = padding + chartHeight - (i / 5) * chartHeight;
      ctx.fillText(value.toFixed(1), padding - 10, y + 4);
    }

    // Title
    if (context.config.title?.text) {
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(context.config.title.text, canvas.width / 2, 30);
    }
  }, [context, containerRef]);

  return null;
};

const BarChartRenderer: React.FC<ChartRendererProps> = ({
  context,
  containerRef,
}) => {
  useEffect(() => {
    if (!containerRef.current || !context.data.length) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = containerRef.current;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    container.innerHTML = '';
    container.appendChild(canvas);

    const { colors } = context.config;
    const palette = colors?.palette || ['#1f77b4', '#ff7f0e', '#2ca02c'];

    const padding = 60;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;

    const allData = context.data.flatMap(series => series.data);
    const yMax = Math.max(...allData.map(d => d.y));
    const categories = [...new Set(allData.map(d => String(d.x)))];

    const barWidth =
      chartWidth /
      (categories.length * context.data.length + categories.length);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw axes
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + chartHeight);
    ctx.lineTo(padding + chartWidth, padding + chartHeight);
    ctx.stroke();

    // Draw bars
    categories.forEach((category, catIndex) => {
      const groupX =
        padding + catIndex * (barWidth * context.data.length + barWidth);

      context.data.forEach((series, seriesIndex) => {
        const dataPoint = series.data.find(d => String(d.x) === category);
        if (!dataPoint) return;

        const barHeight = (dataPoint.y / yMax) * chartHeight;
        const x = groupX + seriesIndex * barWidth;
        const y = padding + chartHeight - barHeight;

        const color = series.color || palette[seriesIndex % palette.length];
        ctx.fillStyle = color;
        ctx.fillRect(x, y, barWidth - 2, barHeight);
      });
    });

    // Labels
    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';

    categories.forEach((category, index) => {
      const x =
        padding +
        index * (barWidth * context.data.length + barWidth) +
        (barWidth * context.data.length) / 2;
      ctx.fillText(category, x, padding + chartHeight + 20);
    });
  }, [context, containerRef]);

  return null;
};

const PieChartRenderer: React.FC<ChartRendererProps> = ({
  context,
  containerRef,
}) => {
  useEffect(() => {
    if (!containerRef.current || !context.data.length) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = containerRef.current;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    container.innerHTML = '';
    container.appendChild(canvas);

    const { colors } = context.config;
    const palette = colors?.palette || [
      '#1f77b4',
      '#ff7f0e',
      '#2ca02c',
      '#d62728',
      '#9467bd',
    ];

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 3;

    const data = context.data[0]?.data || [];
    const total = data.reduce((sum, d) => sum + d.y, 0);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let currentAngle = -Math.PI / 2;

    data.forEach((point, index) => {
      const sliceAngle = (point.y / total) * 2 * Math.PI;
      const color = point.color || palette[index % palette.length];

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(
        centerX,
        centerY,
        radius,
        currentAngle,
        currentAngle + sliceAngle
      );
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Labels
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius + 30);
      const labelY = centerY + Math.sin(labelAngle) * (radius + 30);

      ctx.fillStyle = '#333333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      const percentage = ((point.y / total) * 100).toFixed(1);
      ctx.fillText(
        `${point.label || point.x} (${percentage}%)`,
        labelX,
        labelY
      );

      currentAngle += sliceAngle;
    });

    if (context.config.title?.text) {
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(context.config.title.text, canvas.width / 2, 30);
    }
  }, [context, containerRef]);

  return null;
};

const ScatterPlotRenderer: React.FC<ChartRendererProps> = ({
  context,
  containerRef,
}) => {
  useEffect(() => {
    if (!containerRef.current || !context.data.length) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = containerRef.current;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    container.innerHTML = '';
    container.appendChild(canvas);

    const { colors } = context.config;
    const palette = colors?.palette || ['#1f77b4', '#ff7f0e', '#2ca02c'];

    const padding = 60;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;

    const allData = context.data.flatMap(series => series.data);
    const xValues = allData.map(d => (typeof d.x === 'number' ? d.x : 0));
    const yValues = allData.map(d => d.y);

    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);

    const scaleX = (x: number) =>
      padding + ((x - xMin) / (xMax - xMin)) * chartWidth;
    const scaleY = (y: number) =>
      padding + chartHeight - ((y - yMin) / (yMax - yMin)) * chartHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 10; i++) {
      const x = padding + (i / 10) * chartWidth;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + chartHeight);
      ctx.stroke();

      const y = padding + (i / 10) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + chartHeight);
    ctx.lineTo(padding + chartWidth, padding + chartHeight);
    ctx.stroke();

    // Draw scatter points
    context.data.forEach((series, seriesIndex) => {
      const color = series.color || palette[seriesIndex % palette.length];
      ctx.fillStyle = color;

      series.data.forEach(point => {
        const x = scaleX(typeof point.x === 'number' ? point.x : 0);
        const y = scaleY(point.y);

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      });
    });

    // Draw axis labels
    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';

    for (let i = 0; i <= 5; i++) {
      const value = xMin + (i / 5) * (xMax - xMin);
      const x = padding + (i / 5) * chartWidth;
      ctx.fillText(value.toFixed(1), x, padding + chartHeight + 20);
    }

    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const value = yMin + (i / 5) * (yMax - yMin);
      const y = padding + chartHeight - (i / 5) * chartHeight;
      ctx.fillText(value.toFixed(1), padding - 10, y + 4);
    }

    // Draw title
    if (context.config.title?.text) {
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(context.config.title.text, canvas.width / 2, 30);
    }
  }, [context, containerRef]);

  return null;
};

const UniversalChart: React.FC<UniversalChartProps> = ({
  id,
  type,
  data,
  config = {},
  width = 600,
  height = 400,
  className = '',
  style = {},
  events,
  onLoad,
  onError,
  onExport,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [context, setContext] = useState<ChartContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const engineRef = useRef<StatisticalChartEngine | null>(null);

  useEffect(() => {
    engineRef.current = StatisticalChartEngine.getInstance();
    return () => {
      if (engineRef.current) {
        engineRef.current.destroyChart(id);
      }
    };
  }, [id]);

  useEffect(() => {
    if (!engineRef.current) return;

    const createChart = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const chartConfig: ChartConfig = {
          type,
          ...config,
        };

        const chartContext = await engineRef.current!.createChart(
          id,
          data,
          chartConfig,
          events
        );

        setContext(chartContext);
        onLoad?.(chartContext);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        onError?.(new Error(errorMessage));
      } finally {
        setIsLoading(false);
      }
    };

    createChart();
  }, [id, type, data, config, events, onLoad, onError]);

  const handleExport = useCallback(
    async (format: 'png' | 'svg' | 'pdf' | 'json') => {
      if (!engineRef.current) return;

      try {
        const exportData = await engineRef.current.exportChart(id, format);
        onExport?.(exportData);
      } catch (err) {
        onError?.(err instanceof Error ? err : new Error('Export failed'));
      }
    },
    [id, onExport, onError]
  );

  const renderChart = () => {
    if (!context) return null;

    switch (type) {
      case ChartType.LINE:
      case ChartType.AREA:
        return (
          <LineChartRenderer
            context={context}
            containerRef={containerRef}
            data-oid='cxa557d'
          />
        );

      case ChartType.BAR:
      case ChartType.COLUMN:
        return (
          <BarChartRenderer
            context={context}
            containerRef={containerRef}
            data-oid='3ae.k6v'
          />
        );

      case ChartType.PIE:
      case ChartType.DOUGHNUT:
        return (
          <PieChartRenderer
            context={context}
            containerRef={containerRef}
            data-oid='6syjb8z'
          />
        );

      case ChartType.SCATTER:
        return (
          <ScatterPlotRenderer
            context={context}
            containerRef={containerRef}
            data-oid='mu9289k'
          />
        );

      default:
        return (
          <LineChartRenderer
            context={context}
            containerRef={containerRef}
            data-oid='hget31-'
          />
        );
    }
  };

  const containerStyle: React.CSSProperties = {
    width,
    height,
    position: 'relative',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    backgroundColor: '#ffffff',
    ...style,
  };

  if (isLoading) {
    return (
      <div
        className={`universal-chart loading ${className}`}
        style={containerStyle}
        data-oid='tf9z:ni'
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            fontSize: '14px',
            color: '#666',
          }}
          data-oid='z8bd3:q'
        >
          Loading chart...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`universal-chart error ${className}`}
        style={containerStyle}
        data-oid='hegse4s'
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            fontSize: '14px',
            color: '#d32f2f',
            textAlign: 'center',
            padding: '20px',
          }}
          data-oid='3-y3528'
        >
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`universal-chart ${className}`}
      style={containerStyle}
      data-oid='i98hr:6'
    >
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        }}
        data-oid='hrq.4xu'
      >
        {renderChart()}
      </div>

      {/* Export controls (optional) */}
      {onExport && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            display: 'flex',
            gap: '5px',
          }}
          data-oid='8:826h0'
        >
          <button
            onClick={() => handleExport('png')}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              border: '1px solid #ccc',
              borderRadius: '3px',
              backgroundColor: '#fff',
              cursor: 'pointer',
            }}
            data-oid='ctac2hg'
          >
            PNG
          </button>
          <button
            onClick={() => handleExport('svg')}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              border: '1px solid #ccc',
              borderRadius: '3px',
              backgroundColor: '#fff',
              cursor: 'pointer',
            }}
            data-oid='8nr6lxe'
          >
            SVG
          </button>
        </div>
      )}
    </div>
  );
};

export default UniversalChart;
