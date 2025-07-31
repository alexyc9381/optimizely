/**
 * Elegant Line Chart Component
 * Clean, minimal line chart with smooth animations and interactions
 */

import React, { useEffect, useRef, useState } from 'react';
import { ChartDataPoint, LineChartConfig, chartUtils, defaultConfigs } from '../../lib/charts/chartEngine';
import { useUtilities } from '../../lib/useUtilities';

interface LineChartProps {
  data: ChartDataPoint[];
  config?: Partial<LineChartConfig>;
  onPointHover?: (point: ChartDataPoint | null) => void;
  onPointClick?: (point: ChartDataPoint) => void;
  className?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  config = {},
  onPointHover,
  onPointClick,
  className = ''
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const [hoveredPoint, setHoveredPoint] = useState<ChartDataPoint | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const { colors } = useUtilities();

  const chartConfig = { ...defaultConfigs.line, ...config };

  // Handle responsive resizing
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && chartConfig.responsive) {
        const newDimensions = chartUtils.getResponsiveDimensions(containerRef.current);
        setDimensions(newDimensions);
      }
    };

    if (chartConfig.responsive) {
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [chartConfig.responsive]);

  // Calculate chart dimensions
  const margin = chartConfig.margin || { top: 20, right: 30, bottom: 40, left: 40 };
  const innerWidth = dimensions.width - margin.left - margin.right;
  const innerHeight = dimensions.height - margin.top - margin.bottom;

  // Prepare data
  const validData = data.filter(d => typeof d.value === 'number' && !isNaN(d.value));
  const maxValue = Math.max(...validData.map(d => d.value));
  const minValue = Math.min(...validData.map(d => d.value));
  const valueRange = maxValue - minValue;
  const padding = valueRange * 0.1; // 10% padding

  // Scales
  const xScale = (index: number) => (index / Math.max(validData.length - 1, 1)) * innerWidth;
  const yScale = chartUtils.getScale(
    validData,
    [minValue - padding, maxValue + padding],
    [innerHeight, 0]
  );

  // Generate points
  const points = validData.map((d, i) => ({
    x: xScale(i),
    y: yScale(d.value),
    data: d
  }));

  // Generate path
  const linePath = chartConfig.curve === 'smooth'
    ? chartUtils.generateSmoothPath(points)
    : `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;

  // Generate gradient path for fill
  const gradientPath = chartConfig.gradient
    ? `${linePath} L ${points[points.length - 1]?.x || 0} ${innerHeight} L ${points[0]?.x || 0} ${innerHeight} Z`
    : '';

  // Animation effect
  useEffect(() => {
    if (chartConfig.animate && svgRef.current) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), chartConfig.animationDuration);
      return () => clearTimeout(timer);
    }
  }, [data, chartConfig.animate, chartConfig.animationDuration]);

  // Handle point interactions
  const handlePointHover = (point: ChartDataPoint | null) => {
    setHoveredPoint(point);
    onPointHover?.(point);
  };

  const handlePointClick = (point: ChartDataPoint) => {
    onPointClick?.(point);
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ width: chartConfig.responsive ? '100%' : dimensions.width }}
    >
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="overflow-visible"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      >
        {/* Definitions for gradients and animations */}
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" className="text-primary-500" stopColor="currentColor" stopOpacity={0.3} />
            <stop offset="100%" className="text-primary-500" stopColor="currentColor" stopOpacity={0.05} />
          </linearGradient>

          {chartConfig.animate && (
            <style>
              {`
                .line-path {
                  stroke-dasharray: 1000;
                  stroke-dashoffset: ${isAnimating ? '1000' : '0'};
                  transition: stroke-dashoffset ${chartConfig.animationDuration || 1000}ms ease-out;
                }
                .point-circle {
                  opacity: ${isAnimating ? '0' : '1'};
                  transform: scale(${isAnimating ? '0' : '1'});
                  transition: opacity ${(chartConfig.animationDuration || 1000) * 0.8}ms ease-out ${(chartConfig.animationDuration || 1000) * 0.2}ms,
                              transform ${(chartConfig.animationDuration || 1000) * 0.8}ms ease-out ${(chartConfig.animationDuration || 1000) * 0.2}ms;
                }
                .gradient-fill {
                  opacity: ${isAnimating ? '0' : '1'};
                  transition: opacity ${chartConfig.animationDuration || 1000}ms ease-out;
                }
              `}
            </style>
          )}
        </defs>

        {/* Chart container */}
        <g transform={`translate(${margin.left}, ${margin.top})`}>

          {/* Grid lines */}
          {chartConfig.showGrid && (
            <g className="opacity-20">
              {/* Horizontal grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
                <line
                  key={`h-grid-${ratio}`}
                  x1={0}
                  y1={ratio * innerHeight}
                  x2={innerWidth}
                  y2={ratio * innerHeight}
                  stroke="currentColor"
                  strokeWidth={0.5}
                  className="text-gray-400"
                />
              ))}

              {/* Vertical grid lines */}
              {points.map((point, i) => (
                <line
                  key={`v-grid-${i}`}
                  x1={point.x}
                  y1={0}
                  x2={point.x}
                  y2={innerHeight}
                  stroke="currentColor"
                  strokeWidth={0.5}
                  className="text-gray-300"
                />
              ))}
            </g>
          )}

          {/* Gradient fill */}
          {chartConfig.gradient && gradientPath && (
            <path
              d={gradientPath}
              fill="url(#lineGradient)"
              className="gradient-fill"
            />
          )}

          {/* Main line */}
          <path
            d={linePath}
            fill="none"
            stroke="currentColor"
            strokeWidth={chartConfig.strokeWidth || 2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary-500 line-path"
          />

          {/* Data points */}
          {chartConfig.showPoints && points.map((point, i) => (
            <g key={`point-${i}`}>
              {/* Point background */}
              <circle
                cx={point.x}
                cy={point.y}
                r={(chartConfig.pointRadius || 4) + 2}
                fill="white"
                className="point-circle"
              />

              {/* Main point */}
              <circle
                cx={point.x}
                cy={point.y}
                r={chartConfig.pointRadius || 4}
                fill="currentColor"
                className={`text-primary-500 point-circle cursor-pointer transition-all duration-200 ${
                  hoveredPoint === point.data ? 'transform scale-125' : ''
                }`}
                onMouseEnter={() => handlePointHover(point.data)}
                onMouseLeave={() => handlePointHover(null)}
                onClick={() => handlePointClick(point.data)}
              />

              {/* Hover ring */}
              {hoveredPoint === point.data && (
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={(chartConfig.pointRadius || 4) + 6}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="text-primary-300 animate-pulse"
                />
              )}
            </g>
          ))}

          {/* Axes */}
          <g className="text-gray-600">
            {/* X-axis */}
            <line
              x1={0}
              y1={innerHeight}
              x2={innerWidth}
              y2={innerHeight}
              stroke="currentColor"
              strokeWidth={1}
            />

            {/* Y-axis */}
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={innerHeight}
              stroke="currentColor"
              strokeWidth={1}
            />
          </g>

          {/* Labels */}
          <g className="text-xs fill-gray-600">
            {/* X-axis labels */}
            {points.map((point, i) => (
              <text
                key={`x-label-${i}`}
                x={point.x}
                y={innerHeight + 20}
                textAnchor="middle"
                className="font-medium"
              >
                {point.data.label}
              </text>
            ))}

            {/* Y-axis labels */}
            {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
              const value = minValue + (maxValue - minValue) * (1 - ratio);
              return (
                <text
                  key={`y-label-${ratio}`}
                  x={-10}
                  y={ratio * innerHeight + 4}
                  textAnchor="end"
                  className="font-medium"
                >
                  {chartUtils.formatValue(value)}
                </text>
              );
            })}
          </g>
        </g>
      </svg>

      {/* Tooltip */}
      {chartConfig.showTooltip && hoveredPoint && (
        <div
          className={`absolute pointer-events-none z-10 px-3 py-2 rounded-lg shadow-lg ${colors.getClass('bg', 'primary', '900')} text-white text-sm font-medium`}
          style={{
            left: `${margin.left + (points.find(p => p.data === hoveredPoint)?.x || 0)}px`,
            top: `${margin.top + (points.find(p => p.data === hoveredPoint)?.y || 0) - 40}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="font-semibold">{hoveredPoint.label}</div>
          <div>{chartUtils.formatValue(hoveredPoint.value)}</div>
        </div>
      )}
    </div>
  );
};

export default LineChart;
