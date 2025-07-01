import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StatisticalChartEngine } from '../StatisticalChartEngine';
import { HeatmapDataPoint } from '../types';

interface HeatmapChartProps {
  id?: string;
  data: HeatmapDataPoint[] | number[][];
  xLabels?: string[];
  yLabels?: string[];
  width?: number;
  height?: number;
  title?: string;
  colorScheme?: 'viridis' | 'plasma' | 'inferno' | 'blues' | 'reds' | 'greens' | 'custom';
  customColors?: string[];
  showValues?: boolean;
  showColorScale?: boolean;
  cellBorder?: boolean;
  borderColor?: string;
  className?: string;
  style?: React.CSSProperties;
  onCellClick?: (x: string | number, y: string | number, value: number) => void;
  onCellHover?: (x: string | number, y: string | number, value: number) => void;
}

interface ProcessedHeatmapData {
  x: string | number;
  y: string | number;
  value: number;
  normalizedValue: number;
  color: string;
}

interface ColorScale {
  min: number;
  max: number;
  colors: string[];
}

const HeatmapChart: React.FC<HeatmapChartProps> = ({
  id,
  data,
  xLabels,
  yLabels,
  width = 600,
  height = 400,
  title = 'Heatmap',
  colorScheme = 'viridis',
  customColors,
  showValues = true,
  showColorScale = true,
  cellBorder = true,
  borderColor = '#ffffff',
  className = '',
  style = {},
  onCellClick,
  onCellHover
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [processedData, setProcessedData] = useState<ProcessedHeatmapData[]>([]);
  const [colorScale, setColorScale] = useState<ColorScale>({ min: 0, max: 1, colors: [] });
  const [hoveredCell, setHoveredCell] = useState<{ x: string | number; y: string | number; value: number } | null>(null);
  const engineRef = useRef<StatisticalChartEngine | null>(null);

  useEffect(() => {
    engineRef.current = StatisticalChartEngine.getInstance();
  }, []);

  // Color schemes
  const getColorScheme = (scheme: string): string[] => {
    switch (scheme) {
      case 'viridis':
        return ['#440154', '#482777', '#3f4a8a', '#31678e', '#26838f', '#1f9d8a', '#6cce5a', '#b6de2b', '#fee825'];
      case 'plasma':
        return ['#0c0786', '#5302a3', '#8b0aa5', '#b83289', '#db5c68', '#f48849', '#febd2a', '#f0f921'];
      case 'inferno':
        return ['#000003', '#1b0c41', '#4a0c6b', '#781c6d', '#a52c60', '#cf4446', '#ed6925', '#fb9b06', '#f7d03c'];
      case 'blues':
        return ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'];
      case 'reds':
        return ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d'];
      case 'greens':
        return ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'];
      case 'custom':
        return customColors || ['#ffffff', '#000000'];
      default:
        return ['#440154', '#482777', '#3f4a8a', '#31678e', '#26838f', '#1f9d8a', '#6cce5a', '#b6de2b', '#fee825'];
    }
  };

  // Convert array data to heatmap format
  const convertArrayToHeatmap = (arrayData: number[][]): HeatmapDataPoint[] => {
    const heatmapData: HeatmapDataPoint[] = [];

    arrayData.forEach((row, yIndex) => {
      row.forEach((value, xIndex) => {
        heatmapData.push({
          x: xLabels?.[xIndex] || xIndex,
          y: yLabels?.[yIndex] || yIndex,
          value
        });
      });
    });

    return heatmapData;
  };

  // Interpolate color based on value
  const interpolateColor = (value: number, colors: string[]): string => {
    if (colors.length === 0) return '#000000';
    if (colors.length === 1) return colors[0];

    const normalizedValue = Math.max(0, Math.min(1, value));
    const index = normalizedValue * (colors.length - 1);
    const lowerIndex = Math.floor(index);
    const upperIndex = Math.ceil(index);

    if (lowerIndex === upperIndex) {
      return colors[lowerIndex];
    }

    const ratio = index - lowerIndex;
    const lowerColor = hexToRgb(colors[lowerIndex]);
    const upperColor = hexToRgb(colors[upperIndex]);

    if (!lowerColor || !upperColor) return colors[lowerIndex];

    const r = Math.round(lowerColor.r + (upperColor.r - lowerColor.r) * ratio);
    const g = Math.round(lowerColor.g + (upperColor.g - lowerColor.g) * ratio);
    const b = Math.round(lowerColor.b + (upperColor.b - lowerColor.b) * ratio);

    return `rgb(${r}, ${g}, ${b})`;
  };

  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Process data
  useEffect(() => {
    if (!data) return;

    let heatmapData: HeatmapDataPoint[];

    if (Array.isArray(data[0])) {
      heatmapData = convertArrayToHeatmap(data as number[][]);
    } else {
      heatmapData = data as HeatmapDataPoint[];
    }

    if (engineRef.current) {
      heatmapData = engineRef.current.processHeatmapData(heatmapData);
    }

    const values = heatmapData.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const colors = getColorScheme(colorScheme);

    const processed: ProcessedHeatmapData[] = heatmapData.map(point => {
      const normalizedValue = max === min ? 0.5 : (point.value - min) / (max - min);
      const color = interpolateColor(normalizedValue, colors);

      return {
        x: point.x,
        y: point.y,
        value: point.value,
        normalizedValue,
        color
      };
    });

    setProcessedData(processed);
    setColorScale({ min, max, colors });
  }, [data, colorScheme, customColors, xLabels, yLabels]);

  // Get unique x and y values for grid layout
  const getGridDimensions = () => {
    const xValues = [...new Set(processedData.map(d => d.x))].sort();
    const yValues = [...new Set(processedData.map(d => d.y))].sort();
    return { xValues, yValues };
  };

  // Handle mouse events
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const { xValues, yValues } = getGridDimensions();
    const cellWidth = (width - 120) / xValues.length;
    const cellHeight = (height - 120) / yValues.length;
    const startX = 80;
    const startY = 60;

    const cellX = Math.floor((x - startX) / cellWidth);
    const cellY = Math.floor((y - startY) / cellHeight);

    if (cellX >= 0 && cellX < xValues.length && cellY >= 0 && cellY < yValues.length) {
      const xVal = xValues[cellX];
      const yVal = yValues[cellY];
      const dataPoint = processedData.find(d => d.x === xVal && d.y === yVal);

      if (dataPoint) {
        setHoveredCell({ x: xVal, y: yVal, value: dataPoint.value });
        onCellHover?.(xVal, yVal, dataPoint.value);
      }
    } else {
      setHoveredCell(null);
    }
  }, [processedData, width, height, onCellHover]);

  const handleClick = useCallback((event: MouseEvent) => {
    if (hoveredCell) {
      onCellClick?.(hoveredCell.x, hoveredCell.y, hoveredCell.value);
    }
  }, [hoveredCell, onCellClick]);

  // Render heatmap
  useEffect(() => {
    if (!containerRef.current || processedData.length === 0) return;

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

    // Add event listeners
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    const { xValues, yValues } = getGridDimensions();

    // Chart dimensions
    const padding = 80;
    const colorBarWidth = showColorScale ? 30 : 0;
    const colorBarPadding = showColorScale ? 20 : 0;
    const chartWidth = canvas.width - padding - colorBarWidth - colorBarPadding;
    const chartHeight = canvas.height - padding - 40;

    const cellWidth = chartWidth / xValues.length;
    const cellHeight = chartHeight / yValues.length;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw title
    if (title) {
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(title, canvas.width / 2, 30);
    }

    // Draw heatmap cells
    processedData.forEach(point => {
      const xIndex = xValues.indexOf(point.x);
      const yIndex = yValues.indexOf(point.y);

      const x = padding + xIndex * cellWidth;
      const y = 60 + yIndex * cellHeight;

      // Fill cell
      ctx.fillStyle = point.color;
      ctx.fillRect(x, y, cellWidth, cellHeight);

      // Draw border
      if (cellBorder) {
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cellWidth, cellHeight);
      }

      // Draw value text
      if (showValues && cellWidth > 30 && cellHeight > 20) {
        ctx.fillStyle = point.normalizedValue > 0.5 ? '#ffffff' : '#000000';
        ctx.font = `${Math.min(cellWidth / 4, cellHeight / 3, 12)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          point.value.toFixed(2),
          x + cellWidth / 2,
          y + cellHeight / 2
        );
      }
    });

    // Draw x-axis labels
    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    xValues.forEach((label, index) => {
      const x = padding + index * cellWidth + cellWidth / 2;
      const y = 60 + chartHeight + 10;
      ctx.fillText(String(label), x, y);
    });

    // Draw y-axis labels
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    yValues.forEach((label, index) => {
      const x = padding - 10;
      const y = 60 + index * cellHeight + cellHeight / 2;
      ctx.fillText(String(label), x, y);
    });

    // Draw color scale
    if (showColorScale) {
      const colorBarX = padding + chartWidth + colorBarPadding;
      const colorBarY = 60;
      const colorBarHeight = chartHeight;

      // Draw color gradient
      const gradient = ctx.createLinearGradient(0, colorBarY, 0, colorBarY + colorBarHeight);
      colorScale.colors.forEach((color, index) => {
        gradient.addColorStop(index / (colorScale.colors.length - 1), color);
      });

      ctx.fillStyle = gradient;
      ctx.fillRect(colorBarX, colorBarY, colorBarWidth, colorBarHeight);

      // Draw color scale border
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 1;
      ctx.strokeRect(colorBarX, colorBarY, colorBarWidth, colorBarHeight);

      // Draw color scale labels
      ctx.fillStyle = '#333333';
      ctx.font = '10px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      const steps = 5;
      for (let i = 0; i <= steps; i++) {
        const value = colorScale.min + (colorScale.max - colorScale.min) * (i / steps);
        const y = colorBarY + colorBarHeight - (i / steps) * colorBarHeight;
        ctx.fillText(value.toFixed(2), colorBarX + colorBarWidth + 5, y);
      }
    }

    // Cleanup function
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };

  }, [processedData, title, showValues, showColorScale, cellBorder, borderColor, colorScale, handleMouseMove, handleClick]);

  const containerStyle: React.CSSProperties = {
    width,
    height,
    position: 'relative',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    backgroundColor: '#ffffff',
    cursor: onCellClick ? 'pointer' : 'default',
    ...style
  };

  return (
    <div className={`heatmap-chart ${className}`} style={containerStyle}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden'
        }}
      />

      {/* Hover tooltip */}
      {hoveredCell && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: '#ffffff',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          pointerEvents: 'none',
          zIndex: 1000
        }}>
          <div><strong>X:</strong> {hoveredCell.x}</div>
          <div><strong>Y:</strong> {hoveredCell.y}</div>
          <div><strong>Value:</strong> {hoveredCell.value.toFixed(3)}</div>
        </div>
      )}

      {/* Statistics panel */}
      {processedData.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '8px',
          fontSize: '11px',
          maxWidth: '150px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Statistics</div>
          <div>Min: {colorScale.min.toFixed(3)}</div>
          <div>Max: {colorScale.max.toFixed(3)}</div>
          <div>Cells: {processedData.length}</div>
          <div>Range: {(colorScale.max - colorScale.min).toFixed(3)}</div>
        </div>
      )}
    </div>
  );
};

export default HeatmapChart;
