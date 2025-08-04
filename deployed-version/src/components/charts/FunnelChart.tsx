/**
 * Elegant Funnel Chart Component
 * Clean, minimal funnel chart with smooth animations and interactions
 */

import React, { useEffect, useRef, useState } from 'react';
import { ChartDataPoint, FunnelChartConfig, chartUtils, defaultConfigs } from '../../lib/charts/chartEngine';
import { useUtilities } from '../../lib/useUtilities';

interface FunnelChartProps {
  data: ChartDataPoint[];
  config?: Partial<FunnelChartConfig>;
  onSegmentHover?: (segment: ChartDataPoint | null) => void;
  onSegmentClick?: (segment: ChartDataPoint) => void;
  className?: string;
}

export const FunnelChart: React.FC<FunnelChartProps> = ({
  data,
  config = {},
  onSegmentHover,
  onSegmentClick,
  className = ''
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 500 });
  const [hoveredSegment, setHoveredSegment] = useState<ChartDataPoint | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const { colors } = useUtilities();

  const chartConfig = { ...defaultConfigs.funnel, ...config };

  // Handle responsive resizing
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && chartConfig.responsive) {
        const newDimensions = chartUtils.getResponsiveDimensions(containerRef.current, 4/3);
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
  const margin = chartConfig.margin || { top: 20, right: 30, bottom: 40, left: 30 };
  const innerWidth = dimensions.width - margin.left - margin.right;
  const innerHeight = dimensions.height - margin.top - margin.bottom;

  // Prepare data
  const validData = data.filter(d => typeof d.value === 'number' && !isNaN(d.value) && d.value > 0);
  const maxValue = Math.max(...validData.map(d => d.value));
  const colors_palette = chartUtils.getColorPalette(validData.length, 'primary');

  // Calculate funnel segments
  const spacing = chartConfig.spacing || 8;
  const segmentHeight = (innerHeight - (validData.length - 1) * spacing) / validData.length;

  const segments = validData.map((d, i) => {
    const percentage = d.value / maxValue;
    const width = innerWidth * percentage;
    const x = (innerWidth - width) / 2;
    const y = i * (segmentHeight + spacing);

    // Calculate trapezoid points for smooth funnel shape
    // For the first segment, use the full width, for others calculate based on previous
    const topWidth = i === 0 ? width : width * (1 + (i * 0.1)); // Gradual narrowing
    const bottomWidth = i === validData.length - 1 ? width * 0.7 : width;

    const leftTop = x;
    const rightTop = x + topWidth;
    const leftBottom = (innerWidth - bottomWidth) / 2;
    const rightBottom = (innerWidth + bottomWidth) / 2;

    const pathPoints = [
      `${leftTop} ${y}`,
      `${rightTop} ${y}`,
      `${rightBottom} ${y + segmentHeight}`,
      `${leftBottom} ${y + segmentHeight}`
    ];

    return {
      data: d,
      color: d.color || colors_palette[i % colors_palette.length],
      path: `M ${pathPoints.join(' L ')} Z`,
      centerX: innerWidth / 2,
      centerY: y + segmentHeight / 2,
      width: bottomWidth,
      topWidth,
      bottomWidth,
      percentage,
      conversionRate: i === 0 ? 100 : (d.value / validData[0].value) * 100,
      y
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

  // Handle segment interactions
  const handleSegmentHover = (segment: ChartDataPoint | null) => {
    setHoveredSegment(segment);
    onSegmentHover?.(segment);
  };

  const handleSegmentClick = (segment: ChartDataPoint) => {
    onSegmentClick?.(segment);
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
          {segments.map((segment, i) => (
            <linearGradient
              key={`gradient-${i}`}
              id={`segmentGradient-${i}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor={segment.color} stopOpacity={0.8} />
              <stop offset="100%" stopColor={segment.color} stopOpacity={1} />
            </linearGradient>
          ))}

          {chartConfig.animate && (
            <style>
              {`
                .funnel-segment {
                  opacity: ${isAnimating ? '0' : '1'};
                  transform: translateY(${isAnimating ? '20px' : '0'});
                  transition: opacity ${chartConfig.animationDuration || 1200}ms ease-out,
                              transform ${chartConfig.animationDuration || 1200}ms ease-out;
                }
                .segment-text {
                  opacity: ${isAnimating ? '0' : '1'};
                  transition: opacity ${(chartConfig.animationDuration || 1200) * 0.8}ms ease-out ${(chartConfig.animationDuration || 1200) * 0.2}ms;
                }
              `}
            </style>
          )}
        </defs>

        {/* Chart container */}
        <g transform={`translate(${margin.left}, ${margin.top})`}>

          {/* Funnel segments */}
          {segments.map((segment, i) => (
            <g key={`segment-${i}`} className="funnel-segment">
              {/* Main segment */}
              <path
                d={segment.path}
                fill={`url(#segmentGradient-${i})`}
                stroke="white"
                strokeWidth={2}
                className={`cursor-pointer transition-all duration-200 ${
                  hoveredSegment === segment.data ? 'opacity-90 drop-shadow-lg' : 'opacity-100'
                }`}
                onMouseEnter={() => handleSegmentHover(segment.data)}
                onMouseLeave={() => handleSegmentHover(null)}
                onClick={() => handleSegmentClick(segment.data)}
              />

              {/* Hover effect */}
              {hoveredSegment === segment.data && (
                <path
                  d={segment.path}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={3}
                  className="opacity-60 animate-pulse"
                />
              )}

              {/* Segment labels */}
              {chartConfig.showLabels && (
                <text
                  x={segment.centerX}
                  y={segment.centerY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="segment-text text-sm font-bold fill-white drop-shadow-sm"
                >
                  {segment.data.label}
                </text>
              )}

              {/* Value display */}
              <text
                x={segment.centerX}
                y={segment.centerY + (chartConfig.showLabels ? 16 : 0)}
                textAnchor="middle"
                dominantBaseline="middle"
                className="segment-text text-xs font-semibold fill-white drop-shadow-sm"
              >
                {chartUtils.formatValue(segment.data.value)}
              </text>

              {/* Percentage display */}
              {chartConfig.showPercentages && (
                <text
                  x={segment.centerX}
                  y={segment.centerY + (chartConfig.showLabels ? 32 : 16)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="segment-text text-xs font-medium fill-white/80 drop-shadow-sm"
                >
                  {segment.conversionRate.toFixed(1)}%
                </text>
              )}

              {/* Side labels for larger segments */}
              {segment.width > 200 && (
                <>
                  {/* Left side label */}
                  <text
                    x={segment.centerX - segment.width / 2 - 20}
                    y={segment.centerY}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="segment-text text-sm font-medium fill-gray-600"
                  >
                    {segment.data.label}
                  </text>

                  {/* Right side percentage */}
                  <text
                    x={segment.centerX + segment.width / 2 + 20}
                    y={segment.centerY}
                    textAnchor="start"
                    dominantBaseline="middle"
                    className="segment-text text-sm font-bold fill-gray-700"
                  >
                    {segment.conversionRate.toFixed(1)}%
                  </text>
                </>
              )}

              {/* Conversion rate arrows (between segments) */}
              {i > 0 && (
                <g className="segment-text">
                  <line
                    x1={segment.centerX + 40}
                    y1={segments[i - 1].y + segmentHeight + spacing / 2}
                    x2={segment.centerX + 40}
                    y2={segment.y - spacing / 2}
                    stroke="currentColor"
                    strokeWidth={1}
                    className="text-gray-400"
                    markerEnd="url(#arrowhead)"
                  />

                  <text
                    x={segment.centerX + 50}
                    y={(segments[i - 1].y + segmentHeight + segment.y) / 2}
                    textAnchor="start"
                    dominantBaseline="middle"
                    className="text-xs font-medium fill-gray-500"
                  >
                    {((segment.data.value / segments[i - 1].data.value) * 100).toFixed(1)}%
                  </text>
                </g>
              )}
            </g>
          ))}

          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="6"
              markerHeight="4"
              refX="6"
              refY="2"
              orient="auto"
            >
              <polygon
                points="0 0, 6 2, 0 4"
                fill="currentColor"
                className="text-gray-400"
              />
            </marker>
          </defs>
        </g>
      </svg>

      {/* Tooltip */}
      {chartConfig.showTooltip && hoveredSegment && (
        <div
          className={`absolute pointer-events-none z-10 px-4 py-3 rounded-lg shadow-lg ${colors.getClass('bg', 'primary', '900')} text-white text-sm`}
          style={{
            left: `${margin.left + (segments.find(s => s.data === hoveredSegment)?.centerX || 0)}px`,
            top: `${margin.top + (segments.find(s => s.data === hoveredSegment)?.y || 0) - 60}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="font-bold text-base">{hoveredSegment.label}</div>
          <div className="font-medium">{chartUtils.formatValue(hoveredSegment.value)}</div>
          <div className="text-gray-300 text-xs">
            {((hoveredSegment.value / validData[0].value) * 100).toFixed(1)}% conversion rate
          </div>
        </div>
      )}
    </div>
  );
};

export default FunnelChart;
