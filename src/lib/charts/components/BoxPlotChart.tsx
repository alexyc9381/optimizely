import React, { useEffect, useRef, useState } from 'react';
import { StatisticalChartEngine } from '../StatisticalChartEngine';
import { StatisticalAnalysis } from '../types';

interface BoxPlotChartProps {
  id?: string;
  data: number[][] | { [category: string]: number[] };
  categories?: string[];
  width?: number;
  height?: number;
  title?: string;
  showOutliers?: boolean;
  showMean?: boolean;
  showNotches?: boolean;
  outlierColor?: string;
  meanColor?: string;
  className?: string;
  style?: React.CSSProperties;
  onStatistics?: (stats: { [category: string]: StatisticalAnalysis }) => void;
}

interface BoxPlotStats {
  category: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  outliers: number[];
  mean: number;
  iqr: number;
  whiskerLow: number;
  whiskerHigh: number;
}

const BoxPlotChart: React.FC<BoxPlotChartProps> = ({
  id,
  data,
  categories,
  width = 600,
  height = 400,
  title = 'Box Plot',
  showOutliers = true,
  showMean = true,
  showNotches = false,
  outlierColor = '#ff4444',
  meanColor = '#ff8800',
  className = '',
  style = {},
  onStatistics,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [boxPlotStats, setBoxPlotStats] = useState<BoxPlotStats[]>([]);
  const engineRef = useRef<StatisticalChartEngine | null>(null);

  useEffect(() => {
    engineRef.current = StatisticalChartEngine.getInstance();
  }, []);

  // Process data into box plot statistics
  useEffect(() => {
    if (!data) return;

    const processedData: BoxPlotStats[] = [];
    const statisticsData: { [category: string]: StatisticalAnalysis } = {};

    if (Array.isArray(data[0])) {
      // Data is array of arrays
      (data as number[][]).forEach((values, index) => {
        const categoryName = categories?.[index] || `Category ${index + 1}`;
        const stats = calculateBoxPlotStats(values, categoryName);
        processedData.push(stats);

        if (engineRef.current) {
          statisticsData[categoryName] =
            engineRef.current.calculateStatistics(values);
        }
      });
    } else {
      // Data is object with categories
      const dataObj = data as { [category: string]: number[] };
      Object.entries(dataObj).forEach(([category, values]) => {
        const stats = calculateBoxPlotStats(values, category);
        processedData.push(stats);

        if (engineRef.current) {
          statisticsData[category] =
            engineRef.current.calculateStatistics(values);
        }
      });
    }

    setBoxPlotStats(processedData);
    onStatistics?.(statisticsData);
  }, [data, categories, onStatistics]);

  const calculateBoxPlotStats = (
    values: number[],
    category: string
  ): BoxPlotStats => {
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;

    if (n === 0) {
      return {
        category,
        min: 0,
        q1: 0,
        median: 0,
        q3: 0,
        max: 0,
        outliers: [],
        mean: 0,
        iqr: 0,
        whiskerLow: 0,
        whiskerHigh: 0,
      };
    }

    // Calculate quartiles
    const q1Index = Math.floor(n * 0.25);
    const q3Index = Math.floor(n * 0.75);
    const medianIndex = Math.floor(n * 0.5);

    const q1 =
      n % 4 === 0
        ? (sorted[q1Index - 1] + sorted[q1Index]) / 2
        : sorted[q1Index];
    const q3 =
      n % 4 === 0
        ? (sorted[q3Index - 1] + sorted[q3Index]) / 2
        : sorted[q3Index];
    const median =
      n % 2 === 0
        ? (sorted[medianIndex - 1] + sorted[medianIndex]) / 2
        : sorted[medianIndex];

    const iqr = q3 - q1;
    const mean = values.reduce((sum, val) => sum + val, 0) / n;

    // Calculate whiskers and outliers
    const lowerFence = q1 - 1.5 * iqr;
    const upperFence = q3 + 1.5 * iqr;

    const outliers = sorted.filter(val => val < lowerFence || val > upperFence);
    const nonOutliers = sorted.filter(
      val => val >= lowerFence && val <= upperFence
    );

    const whiskerLow = nonOutliers.length > 0 ? nonOutliers[0] : sorted[0];
    const whiskerHigh =
      nonOutliers.length > 0
        ? nonOutliers[nonOutliers.length - 1]
        : sorted[sorted.length - 1];

    return {
      category,
      min: sorted[0],
      q1,
      median,
      q3,
      max: sorted[sorted.length - 1],
      outliers,
      mean,
      iqr,
      whiskerLow,
      whiskerHigh,
    };
  };

  // Render box plot
  useEffect(() => {
    if (!containerRef.current || boxPlotStats.length === 0) return;

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

    // Chart dimensions
    const padding = 80;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;

    // Data bounds
    const allValues = boxPlotStats.flatMap(stat => [
      stat.min,
      stat.max,
      ...stat.outliers,
    ]);
    const yMin = Math.min(...allValues);
    const yMax = Math.max(...allValues);
    const yRange = yMax - yMin;
    const yPadding = yRange * 0.1;

    const scaleY = (y: number) =>
      padding +
      chartHeight -
      ((y - (yMin - yPadding)) / (yRange + 2 * yPadding)) * chartHeight;

    const boxWidth = Math.min((chartWidth / boxPlotStats.length) * 0.6, 80);
    const boxSpacing = chartWidth / boxPlotStats.length;

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

    // Draw Y-axis
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + chartHeight);
    ctx.stroke();

    // Draw Y-axis labels
    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';

    for (let i = 0; i <= 5; i++) {
      const value = yMin - yPadding + (i / 5) * (yRange + 2 * yPadding);
      const y = padding + chartHeight - (i / 5) * chartHeight;
      ctx.fillText(value.toFixed(1), padding - 10, y + 4);

      // Grid lines
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();
    }

    // Draw box plots
    boxPlotStats.forEach((stats, index) => {
      const centerX = padding + boxSpacing * index + boxSpacing / 2;
      const leftX = centerX - boxWidth / 2;
      const rightX = centerX + boxWidth / 2;

      // Scale coordinates
      const q1Y = scaleY(stats.q1);
      const medianY = scaleY(stats.median);
      const q3Y = scaleY(stats.q3);
      const whiskerLowY = scaleY(stats.whiskerLow);
      const whiskerHighY = scaleY(stats.whiskerHigh);
      const meanY = scaleY(stats.mean);

      // Draw whiskers
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 2;

      // Upper whisker
      ctx.beginPath();
      ctx.moveTo(centerX, q3Y);
      ctx.lineTo(centerX, whiskerHighY);
      ctx.stroke();

      // Lower whisker
      ctx.beginPath();
      ctx.moveTo(centerX, q1Y);
      ctx.lineTo(centerX, whiskerLowY);
      ctx.stroke();

      // Whisker caps
      ctx.beginPath();
      ctx.moveTo(leftX + boxWidth * 0.2, whiskerHighY);
      ctx.lineTo(rightX - boxWidth * 0.2, whiskerHighY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(leftX + boxWidth * 0.2, whiskerLowY);
      ctx.lineTo(rightX - boxWidth * 0.2, whiskerLowY);
      ctx.stroke();

      // Draw box
      ctx.fillStyle = 'rgba(135, 206, 235, 0.3)'; // Light blue
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 2;

      const boxHeight = q1Y - q3Y;
      ctx.fillRect(leftX, q3Y, boxWidth, boxHeight);
      ctx.strokeRect(leftX, q3Y, boxWidth, boxHeight);

      // Draw median line
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(leftX, medianY);
      ctx.lineTo(rightX, medianY);
      ctx.stroke();

      // Draw mean (if enabled)
      if (showMean) {
        ctx.fillStyle = meanColor;
        ctx.beginPath();
        ctx.arc(centerX, meanY, 4, 0, 2 * Math.PI);
        ctx.fill();

        // Mean symbol (diamond)
        ctx.strokeStyle = meanColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, meanY - 6);
        ctx.lineTo(centerX + 4, meanY);
        ctx.lineTo(centerX, meanY + 6);
        ctx.lineTo(centerX - 4, meanY);
        ctx.closePath();
        ctx.stroke();
      }

      // Draw notches (if enabled)
      if (showNotches) {
        const notchSize = boxWidth * 0.2;
        const notchY1 = medianY - 10;
        const notchY2 = medianY + 10;

        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(leftX, notchY1);
        ctx.lineTo(leftX + notchSize, medianY);
        ctx.lineTo(leftX, notchY2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(rightX, notchY1);
        ctx.lineTo(rightX - notchSize, medianY);
        ctx.lineTo(rightX, notchY2);
        ctx.stroke();
      }

      // Draw outliers (if enabled)
      if (showOutliers) {
        ctx.fillStyle = outlierColor;
        stats.outliers.forEach(outlier => {
          const outlierY = scaleY(outlier);
          ctx.beginPath();
          ctx.arc(centerX, outlierY, 3, 0, 2 * Math.PI);
          ctx.fill();
        });
      }

      // Draw category label
      ctx.fillStyle = '#333333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(stats.category, centerX, padding + chartHeight + 25);
    });

    // Draw legend
    const legendY = canvas.height - 40;
    let legendX = padding;

    // Box legend
    ctx.fillStyle = 'rgba(135, 206, 235, 0.3)';
    ctx.fillRect(legendX, legendY - 8, 12, 12);
    ctx.strokeStyle = '#333333';
    ctx.strokeRect(legendX, legendY - 8, 12, 12);

    ctx.fillStyle = '#333333';
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Quartiles', legendX + 20, legendY + 4);
    legendX += 80;

    // Median legend
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(legendX, legendY - 2);
    ctx.lineTo(legendX + 12, legendY - 2);
    ctx.stroke();
    ctx.fillText('Median', legendX + 20, legendY + 4);
    legendX += 70;

    if (showMean) {
      // Mean legend
      ctx.fillStyle = meanColor;
      ctx.beginPath();
      ctx.arc(legendX + 6, legendY - 2, 3, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = '#333333';
      ctx.fillText('Mean', legendX + 20, legendY + 4);
      legendX += 60;
    }

    if (showOutliers) {
      // Outlier legend
      ctx.fillStyle = outlierColor;
      ctx.beginPath();
      ctx.arc(legendX + 6, legendY - 2, 3, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = '#333333';
      ctx.fillText('Outliers', legendX + 20, legendY + 4);
    }
  }, [
    boxPlotStats,
    title,
    showOutliers,
    showMean,
    showNotches,
    outlierColor,
    meanColor,
  ]);

  const containerStyle: React.CSSProperties = {
    width,
    height,
    position: 'relative',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    backgroundColor: '#ffffff',
    ...style,
  };

  return (
    <div
      className={`box-plot-chart ${className}`}
      style={containerStyle}
      data-oid='f2ogwnx'
    >
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        }}
        data-oid='ndadx9p'
      />

      {/* Statistics tooltip */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '8px',
          fontSize: '11px',
          maxWidth: '200px',
          display: boxPlotStats.length > 0 ? 'block' : 'none',
        }}
        data-oid='3kmsvla'
      >
        <div
          style={{ fontWeight: 'bold', marginBottom: '4px' }}
          data-oid='sbe:jo8'
        >
          Statistics
        </div>
        {boxPlotStats.map((stats, index) => (
          <div key={index} style={{ marginBottom: '2px' }} data-oid='xd5e0kk'>
            <strong data-oid='8gvams7'>{stats.category}:</strong>
            <br data-oid='..dm1ad' />
            Q1: {stats.q1.toFixed(2)}, Q3: {stats.q3.toFixed(2)}
            <br data-oid=':660ym:' />
            Median: {stats.median.toFixed(2)}, IQR: {stats.iqr.toFixed(2)}
            <br data-oid='l1thx6a' />
            Outliers: {stats.outliers.length}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BoxPlotChart;
