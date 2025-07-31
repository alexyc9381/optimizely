/**
 * Elegant Bar Chart Component
 * Clean, minimal bar chart with smooth animations and interactions
 */

import React, { useEffect, useRef, useState } from 'react';
import { BarChartConfig, ChartDataPoint, chartUtils, defaultConfigs } from '../../lib/charts/chartEngine';
import { useUtilities } from '../../lib/useUtilities';

interface BarChartProps {
  data: ChartDataPoint[];
  config?: Partial<BarChartConfig>;
  onBarHover?: (bar: ChartDataPoint | null) => void;
  onBarClick?: (bar: ChartDataPoint) => void;
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  config = {},
  onBarHover,
  onBarClick,
  className = ''
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const [hoveredBar, setHoveredBar] = useState<ChartDataPoint | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const { colors } = useUtilities();

  const chartConfig = { ...defaultConfigs.bar, ...config };

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
  const minValue = Math.min(0, Math.min(...validData.map(d => d.value)));
  const colors_palette = chartUtils.getColorPalette(validData.length, 'mixed');

  // Scales
  const isVertical = chartConfig.orientation === 'vertical';
  const barCount = validData.length;
  const barSpacing = chartConfig.barSpacing || 0.1;

  const bandWidth = isVertical
    ? innerWidth / barCount
    : innerHeight / barCount;
  const barWidth = bandWidth * (1 - barSpacing);

  const valueScale = chartUtils.getScale(
    validData,
    [minValue, maxValue],
    isVertical ? [innerHeight, 0] : [0, innerWidth]
  );

  const positionScale = (index: number) =>
    index * bandWidth + (bandWidth - barWidth) / 2;

  // Generate bars
  const bars = validData.map((d, i) => {
    const position = positionScale(i);
    const value = valueScale(d.value);
    const zeroPosition = valueScale(0);

    return {
      data: d,
      color: d.color || colors_palette[i % colors_palette.length],
      ...(isVertical ? {
        x: position,
        y: Math.min(value, zeroPosition),
        width: barWidth,
        height: Math.abs(value - zeroPosition)
      } : {
        x: Math.min(value, zeroPosition),
        y: position,
        width: Math.abs(value - zeroPosition),
        height: barWidth
      })
    };
  });

  // Animation effect
  useEffect(() => {
    if (chartConfig.animate && svgRef.current) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), chartConfig.animationDuration);
      return () => clearTimeout(timer);
    }
  }, [data, chartConfig.animate, chartConfig.animationDuration]);

  // Handle bar interactions
  const handleBarHover = (bar: ChartDataPoint | null) => {
    setHoveredBar(bar);
    onBarHover?.(bar);
  };

  const handleBarClick = (bar: ChartDataPoint) => {
    onBarClick?.(bar);
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
        {/* Definitions for animations */}
        <defs>
          {chartConfig.animate && (
            <style>
              {`
                .bar-rect {
                  ${isVertical
                    ? `height: ${isAnimating ? '0' : 'var(--bar-height)'};
                       y: ${isAnimating ? innerHeight : 'var(--bar-y)'};`
                    : `width: ${isAnimating ? '0' : 'var(--bar-width)'};
                       x: ${isAnimating ? '0' : 'var(--bar-x)'};`
                  }
                  transition: ${isVertical ? 'height' : 'width'} ${chartConfig.animationDuration || 800}ms ease-out,
                              ${isVertical ? 'y' : 'x'} ${chartConfig.animationDuration || 800}ms ease-out;
                }
                .bar-value {
                  opacity: ${isAnimating ? '0' : '1'};
                  transition: opacity ${(chartConfig.animationDuration || 800) * 0.5}ms ease-out ${(chartConfig.animationDuration || 800) * 0.5}ms;
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
              {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                const value = minValue + (maxValue - minValue) * ratio;
                const position = valueScale(value);

                return (
                  <line
                    key={`grid-${ratio}`}
                    {...(isVertical ? {
                      x1: 0,
                      y1: position,
                      x2: innerWidth,
                      y2: position
                    } : {
                      x1: position,
                      y1: 0,
                      x2: position,
                      y2: innerHeight
                    })}
                    stroke="currentColor"
                    strokeWidth={0.5}
                    className="text-gray-400"
                  />
                );
              })}
            </g>
          )}

          {/* Bars */}
          {bars.map((bar, i) => (
            <g key={`bar-${i}`}>
              {/* Bar rectangle */}
              <rect
                x={bar.x}
                y={bar.y}
                width={bar.width}
                height={bar.height}
                fill={bar.color}
                rx={chartConfig.roundedCorners || 4}
                ry={chartConfig.roundedCorners || 4}
                className={`bar-rect cursor-pointer transition-opacity duration-200 ${
                  hoveredBar === bar.data ? 'opacity-80' : 'opacity-100'
                }`}
                style={{
                  '--bar-x': `${bar.x}px`,
                  '--bar-y': `${bar.y}px`,
                  '--bar-width': `${bar.width}px`,
                  '--bar-height': `${bar.height}px`
                } as React.CSSProperties}
                onMouseEnter={() => handleBarHover(bar.data)}
                onMouseLeave={() => handleBarHover(null)}
                onClick={() => handleBarClick(bar.data)}
              />

              {/* Hover effect */}
              {hoveredBar === bar.data && (
                <rect
                  x={bar.x - 2}
                  y={bar.y - 2}
                  width={bar.width + 4}
                  height={bar.height + 4}
                  fill="none"
                  stroke={bar.color}
                  strokeWidth={2}
                  rx={(chartConfig.roundedCorners || 4) + 2}
                  ry={(chartConfig.roundedCorners || 4) + 2}
                  className="opacity-50 animate-pulse"
                />
              )}

              {/* Value labels */}
              {chartConfig.showValues && (
                <text
                  x={isVertical ? bar.x + bar.width / 2 : bar.x + bar.width + 8}
                  y={isVertical ? bar.y - 8 : bar.y + bar.height / 2}
                  textAnchor={isVertical ? 'middle' : 'start'}
                  dominantBaseline={isVertical ? 'auto' : 'middle'}
                  className="bar-value text-xs font-semibold fill-gray-700"
                >
                  {chartUtils.formatValue(bar.data.value)}
                </text>
              )}
            </g>
          ))}

          {/* Axes */}
          <g className="text-gray-600">
            {/* Main axis */}
            <line
              {...(isVertical ? {
                x1: 0,
                y1: innerHeight,
                x2: innerWidth,
                y2: innerHeight
              } : {
                x1: 0,
                y1: 0,
                x2: 0,
                y2: innerHeight
              })}
              stroke="currentColor"
              strokeWidth={1}
            />

            {/* Value axis */}
            <line
              {...(isVertical ? {
                x1: 0,
                y1: 0,
                x2: 0,
                y2: innerHeight
              } : {
                x1: 0,
                y1: innerHeight,
                x2: innerWidth,
                y2: innerHeight
              })}
              stroke="currentColor"
              strokeWidth={1}
            />
          </g>

          {/* Labels */}
          <g className="text-xs fill-gray-600">
            {/* Category labels */}
            {bars.map((bar, i) => (
              <text
                key={`label-${i}`}
                x={isVertical ? bar.x + bar.width / 2 : -10}
                y={isVertical ? innerHeight + 20 : bar.y + bar.height / 2}
                textAnchor={isVertical ? 'middle' : 'end'}
                dominantBaseline={isVertical ? 'auto' : 'middle'}
                className="font-medium"
              >
                {bar.data.label}
              </text>
            ))}

            {/* Value axis labels */}
            {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
              const value = minValue + (maxValue - minValue) * (isVertical ? 1 - ratio : ratio);
              const position = valueScale(value);

              return (
                <text
                  key={`value-label-${ratio}`}
                  x={isVertical ? -10 : position}
                  y={isVertical ? position + 4 : innerHeight + 20}
                  textAnchor={isVertical ? 'end' : 'middle'}
                  dominantBaseline={isVertical ? 'auto' : 'auto'}
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
      {chartConfig.showTooltip && hoveredBar && (
        <div
          className={`absolute pointer-events-none z-10 px-3 py-2 rounded-lg shadow-lg ${colors.getClass('bg', 'primary', '900')} text-white text-sm font-medium`}
          style={{
            left: `${margin.left + (bars.find(b => b.data === hoveredBar)?.x || 0) + (bars.find(b => b.data === hoveredBar)?.width || 0) / 2}px`,
            top: `${margin.top + (bars.find(b => b.data === hoveredBar)?.y || 0) - 40}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="font-semibold">{hoveredBar.label}</div>
          <div>{chartUtils.formatValue(hoveredBar.value)}</div>
        </div>
      )}
    </div>
  );
};

export default BarChart;
