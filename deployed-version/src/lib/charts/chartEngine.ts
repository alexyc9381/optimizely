/**
 * Elegant Chart Engine for Optelo Dashboard
 * Clean, minimal data visualization system with smooth animations
 */


export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  metadata?: Record<string, any>;
}

export interface ChartConfig {
  width?: number;
  height?: number;
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  animate?: boolean;
  animationDuration?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  responsive?: boolean;
  theme?: 'light' | 'dark';
}

export interface LineChartConfig extends ChartConfig {
  curve?: 'linear' | 'smooth' | 'step';
  showPoints?: boolean;
  pointRadius?: number;
  strokeWidth?: number;
  gradient?: boolean;
}

export interface BarChartConfig extends ChartConfig {
  orientation?: 'vertical' | 'horizontal';
  barSpacing?: number;
  roundedCorners?: number;
  showValues?: boolean;
}

export interface FunnelChartConfig extends ChartConfig {
  showPercentages?: boolean;
  showLabels?: boolean;
  spacing?: number;
}

/**
 * Base chart utilities
 */
export const chartUtils = {
  /**
   * Generate elegant color palette for charts
   */
  getColorPalette: (count: number, category: 'primary' | 'secondary' | 'mixed' = 'mixed'): string[] => {
    const palettes = {
      primary: [
        '#5b6cff', '#4c52ff', '#3d3eeb', '#3133bc', '#2e3295',
        '#7d8cff', '#aab9ff', '#d0dcff', '#e5edff', '#f0f4ff'
      ],
      secondary: [
        '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95', '#3730a3',
        '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'
      ],
      mixed: [
        '#5b6cff', '#7c3aed', '#059669', '#dc2626', '#ea580c',
        '#0891b2', '#7c2d12', '#be123c', '#7e22ce', '#0369a1'
      ]
    };

    const palette = palettes[category] || palettes.mixed;

    if (count <= palette.length) {
      return palette.slice(0, count);
    }

    // Generate additional colors if needed
    const result = [...palette];
    while (result.length < count) {
      const hue = (result.length * 137.508) % 360; // Golden angle
      result.push(`hsl(${hue}, 65%, 55%)`);
    }

    return result.slice(0, count);
  },

  /**
   * Calculate responsive dimensions
   */
  getResponsiveDimensions: (container: HTMLElement, aspectRatio: number = 16/9): { width: number; height: number } => {
    const containerWidth = container.clientWidth || 400;
    const maxWidth = Math.min(containerWidth, 800);
    const height = maxWidth / aspectRatio;

    return {
      width: maxWidth,
      height: Math.max(height, 200)
    };
  },

  /**
   * Format chart values
   */
  formatValue: (value: number, type: 'number' | 'percentage' | 'currency' = 'number'): string => {
    switch (type) {
      case 'percentage':
        return `${(value * 100).toFixed(1)}%`;
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      default:
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 1,
        }).format(value);
    }
  },

  /**
   * Calculate chart scales
   */
  getScale: (data: ChartDataPoint[], domain: [number, number], range: [number, number]) => {
    const [domainMin, domainMax] = domain;
    const [rangeMin, rangeMax] = range;
    const domainSpan = domainMax - domainMin;
    const rangeSpan = rangeMax - rangeMin;

    return (value: number) => {
      // Handle edge cases that could produce NaN
      if (!isFinite(value) || !isFinite(domainSpan) || domainSpan === 0 || !isFinite(rangeSpan)) {
        return rangeMin;
      }
      return rangeMin + ((value - domainMin) / domainSpan) * rangeSpan;
    };
  },

  /**
   * Generate smooth curve path
   */
  generateSmoothPath: (points: Array<{ x: number; y: number }>): string => {
    if (points.length < 2) return '';

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const current = points[i];
      const previous = points[i - 1];

      // Control points for smooth curves
      const cpx1 = previous.x + (current.x - previous.x) * 0.4;
      const cpy1 = previous.y;
      const cpx2 = current.x - (current.x - previous.x) * 0.4;
      const cpy2 = current.y;

      path += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${current.x} ${current.y}`;
    }

    return path;
  },

  /**
   * Generate elegant animations
   */
  getAnimationClasses: () => {
    return {
      fadeIn: 'animate-fade-in',
      slideUp: 'animate-slide-up',
      scaleIn: 'animate-scale-in',
      drawLine: 'animate-draw-line',
      fillBar: 'animate-fill-bar'
    };
  }
};

/**
 * Default chart configurations
 */
export const defaultConfigs = {
  line: {
    width: 600,
    height: 400,
    margin: { top: 20, right: 30, bottom: 40, left: 40 },
    animate: true,
    animationDuration: 1000,
    showGrid: true,
    showTooltip: true,
    responsive: true,
    curve: 'smooth',
    showPoints: true,
    pointRadius: 4,
    strokeWidth: 2,
    gradient: true
  } as LineChartConfig,

  bar: {
    width: 600,
    height: 400,
    margin: { top: 20, right: 30, bottom: 40, left: 40 },
    animate: true,
    animationDuration: 800,
    showGrid: true,
    showTooltip: true,
    responsive: true,
    orientation: 'vertical',
    barSpacing: 0.1,
    roundedCorners: 4,
    showValues: true
  } as BarChartConfig,

  funnel: {
    width: 600,
    height: 500,
    margin: { top: 20, right: 30, bottom: 40, left: 30 },
    animate: true,
    animationDuration: 1200,
    showTooltip: true,
    responsive: true,
    showPercentages: true,
    showLabels: true,
    spacing: 8
  } as FunnelChartConfig
};

/**
 * Chart data validators
 */
export const validators = {
  validateData: (data: ChartDataPoint[]): boolean => {
    if (!Array.isArray(data) || data.length === 0) return false;

    return data.every(point =>
      typeof point.label === 'string' &&
      typeof point.value === 'number' &&
      !isNaN(point.value)
    );
  },

  validateConfig: (config: ChartConfig): boolean => {
    if (!config) return false;

    if (config.width && (config.width < 100 || config.width > 2000)) return false;
    if (config.height && (config.height < 100 || config.height > 1000)) return false;

    return true;
  }
};

export default chartUtils;
