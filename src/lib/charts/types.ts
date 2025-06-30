// Chart Library Types for Statistical Visualization

export interface ChartDataPoint {
  x: string | number | Date;
  y: number;
  label?: string;
  color?: string;
  metadata?: Record<string, any>;
}

export interface ChartSeries {
  id: string;
  name: string;
  data: ChartDataPoint[];
  type?: ChartType;
  color?: string;
  visible?: boolean;
  yAxis?: 'primary' | 'secondary';
  opacity?: number;
  metadata?: Record<string, any>;
}

export enum ChartType {
  LINE = 'line',
  BAR = 'bar',
  COLUMN = 'column',
  PIE = 'pie',
  DOUGHNUT = 'doughnut',
  SCATTER = 'scatter',
  AREA = 'area',
  HEATMAP = 'heatmap',
  FUNNEL = 'funnel',
  COHORT = 'cohort',
  DISTRIBUTION = 'distribution',
  BOX_PLOT = 'box_plot',
  VIOLIN_PLOT = 'violin_plot',
  CANDLESTICK = 'candlestick',
  GAUGE = 'gauge',
  RADAR = 'radar',
  TREEMAP = 'treemap',
  SANKEY = 'sankey',
  BUBBLE = 'bubble',
  HISTOGRAM = 'histogram'
}

export interface ChartConfig {
  type: ChartType;
  title?: ChartTitle;
  subtitle?: ChartSubtitle;
  legend?: LegendConfig;
  axes?: AxesConfig;
  tooltip?: TooltipConfig;
  colors?: ColorConfig;
  responsive?: ResponsiveConfig;
  animations?: AnimationConfig;
  interactions?: InteractionConfig;
  statistical?: StatisticalConfig;
  performance?: PerformanceConfig;
}

export interface ChartTitle {
  text: string;
  align?: 'left' | 'center' | 'right';
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  margin?: number;
  position?: 'top' | 'bottom';
}

export interface ChartSubtitle {
  text: string;
  align?: 'left' | 'center' | 'right';
  fontSize?: number;
  color?: string;
  margin?: number;
}

export interface LegendConfig {
  enabled: boolean;
  position: 'top' | 'bottom' | 'left' | 'right' | 'floating';
  align?: 'left' | 'center' | 'right';
  layout?: 'horizontal' | 'vertical';
  itemStyle?: {
    fontSize?: number;
    color?: string;
    fontWeight?: string;
  };
  symbol?: {
    width?: number;
    height?: number;
    radius?: number;
  };
  navigation?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  shadow?: boolean;
}

export interface AxesConfig {
  xAxis?: AxisConfig;
  yAxis?: AxisConfig | AxisConfig[];
}

export interface AxisConfig {
  title?: AxisTitle;
  categories?: string[];
  type?: 'linear' | 'logarithmic' | 'datetime' | 'category';
  min?: number;
  max?: number;
  tickInterval?: number;
  tickPositions?: number[];
  reversed?: boolean;
  opposite?: boolean;
  gridLines?: GridLineConfig;
  labels?: AxisLabelConfig;
  crosshair?: boolean;
  visible?: boolean;
}

export interface AxisTitle {
  text: string;
  align?: 'low' | 'middle' | 'high';
  rotation?: number;
  style?: {
    fontSize?: number;
    color?: string;
    fontWeight?: string;
  };
}

export interface GridLineConfig {
  enabled: boolean;
  color?: string;
  width?: number;
  dashStyle?: 'solid' | 'dashed' | 'dotted';
  zIndex?: number;
}

export interface AxisLabelConfig {
  enabled: boolean;
  format?: string;
  formatter?: (value: any) => string;
  rotation?: number;
  style?: {
    fontSize?: number;
    color?: string;
  };
  step?: number;
  staggerLines?: number;
  overflow?: 'allow' | 'justify';
}

export interface TooltipConfig {
  enabled: boolean;
  shared?: boolean;
  useHTML?: boolean;
  headerFormat?: string;
  pointFormat?: string;
  footerFormat?: string;
  formatter?: (context: any) => string;
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: number;
  borderWidth?: number;
  shadow?: boolean;
  style?: {
    fontSize?: number;
    color?: string;
  };
  hideDelay?: number;
  followPointer?: boolean;
  outside?: boolean;
}

export interface ColorConfig {
  palette?: string[];
  gradients?: boolean;
  opacity?: number;
  pattern?: boolean;
  accessibility?: {
    colorBlindSafe?: boolean;
    highContrast?: boolean;
  };
}

export interface ResponsiveConfig {
  enabled: boolean;
  breakpoints?: {
    small?: number;
    medium?: number;
    large?: number;
  };
  rules?: ResponsiveRule[];
}

export interface ResponsiveRule {
  condition: {
    maxWidth?: number;
    minWidth?: number;
    maxHeight?: number;
    minHeight?: number;
  };
  chartOptions: Partial<ChartConfig>;
}

export interface AnimationConfig {
  enabled: boolean;
  duration?: number;
  easing?: string;
  defer?: number;
  startup?: boolean;
  onComplete?: () => void;
}

export interface InteractionConfig {
  enabled: boolean;
  zoom?: {
    enabled: boolean;
    type?: 'x' | 'y' | 'xy';
    resetButton?: {
      position?: {
        align: 'left' | 'center' | 'right';
        verticalAlign: 'top' | 'middle' | 'bottom';
      };
    };
  };
  pan?: {
    enabled: boolean;
    type?: 'x' | 'y' | 'xy';
  };
  selection?: {
    enabled: boolean;
    type?: 'x' | 'y' | 'xy';
    onSelect?: (event: any) => void;
  };
  brush?: {
    enabled: boolean;
    onBrush?: (event: any) => void;
  };
  crosshair?: {
    enabled: boolean;
    snap?: boolean;
  };
}

export interface StatisticalConfig {
  trendlines?: {
    enabled: boolean;
    type?: 'linear' | 'exponential' | 'polynomial' | 'logarithmic';
    degree?: number;
    color?: string;
    dashStyle?: 'solid' | 'dashed' | 'dotted';
    width?: number;
  };
  regressionLine?: {
    enabled: boolean;
    color?: string;
    showEquation?: boolean;
    showRSquared?: boolean;
  };
  confidenceInterval?: {
    enabled: boolean;
    level?: number;
    color?: string;
    opacity?: number;
  };
  errorBars?: {
    enabled: boolean;
    type?: 'standard_error' | 'standard_deviation' | 'confidence_interval' | 'custom';
    color?: string;
    width?: number;
  };
  outlierDetection?: {
    enabled: boolean;
    method?: 'iqr' | 'zscore' | 'modified_zscore';
    threshold?: number;
    highlightColor?: string;
  };
  significanceTest?: {
    enabled: boolean;
    type?: 'ttest' | 'anova' | 'chisquare' | 'mannwhitney';
    alpha?: number;
    showPValue?: boolean;
  };
}

export interface PerformanceConfig {
  lazy?: boolean;
  throttle?: number;
  debounce?: number;
  virtualScrolling?: boolean;
  clustering?: boolean;
  sampling?: {
    enabled: boolean;
    threshold: number;
    method?: 'random' | 'systematic' | 'stratified';
  };
}

// Specialized Data Types for Advanced Charts

export interface HeatmapDataPoint {
  x: string | number;
  y: string | number;
  value: number;
  color?: string;
  label?: string;
}

export interface FunnelDataPoint {
  name: string;
  value: number;
  percentage?: number;
  color?: string;
  dropoff?: number;
}

export interface CohortDataPoint {
  cohort: string;
  period: number;
  value: number;
  percentage?: number;
  retention?: number;
}

export interface BoxPlotDataPoint {
  x: string | number;
  low: number;
  q1: number;
  median: number;
  q3: number;
  high: number;
  outliers?: number[];
  name?: string;
}

export interface ViolinPlotDataPoint {
  x: string | number;
  values: number[];
  density?: number[];
  bandwidth?: number;
  name?: string;
}

export interface DistributionDataPoint {
  value: number;
  frequency: number;
  density?: number;
  cumulative?: number;
}

export interface BubbleDataPoint {
  x: number;
  y: number;
  z: number;
  name?: string;
  color?: string;
  category?: string;
}

export interface CandlestickDataPoint {
  x: string | number | Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface TreemapDataPoint {
  name: string;
  value: number;
  color?: string;
  parent?: string;
  level?: number;
  children?: TreemapDataPoint[];
}

export interface SankeyDataPoint {
  from: string;
  to: string;
  weight: number;
  color?: string;
}

// Chart Events and Callbacks

export interface ChartEvents {
  onLoad?: () => void;
  onRedraw?: () => void;
  onResize?: (event: any) => void;
  onDestroy?: () => void;
  onSelection?: (event: any) => void;
  onLegendItemClick?: (event: any) => void;
  onPointClick?: (event: any, point: ChartDataPoint) => void;
  onPointHover?: (event: any, point: ChartDataPoint) => void;
  onSeriesClick?: (event: any, series: ChartSeries) => void;
  onSeriesHover?: (event: any, series: ChartSeries) => void;
  onZoom?: (event: any) => void;
  onPan?: (event: any) => void;
  onExport?: (type: string) => void;
}

// Chart Export Options

export interface ChartExportOptions {
  filename?: string;
  type: 'png' | 'jpeg' | 'pdf' | 'svg';
  width?: number;
  height?: number;
  scale?: number;
  backgroundColor?: string;
  buttons?: {
    contextButton?: {
      enabled?: boolean;
      menuItems?: string[];
    };
  };
}

// Chart Context and State Management

export interface ChartContext {
  id: string;
  data: ChartSeries[];
  config: ChartConfig;
  events?: ChartEvents;
  state: ChartState;
  performance: ChartPerformance;
}

export interface ChartState {
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
  selectedPoints: ChartDataPoint[];
  selectedSeries: string[];
  zoomLevel: number;
  panPosition: { x: number; y: number };
  lastUpdated: Date;
}

export interface ChartPerformance {
  renderTime: number;
  dataPoints: number;
  memoryUsage: number;
  fps?: number;
  isOptimized: boolean;
}

// Statistical Analysis Results

export interface StatisticalAnalysis {
  mean: number;
  median: number;
  mode: number[];
  standardDeviation: number;
  variance: number;
  skewness: number;
  kurtosis: number;
  min: number;
  max: number;
  range: number;
  quartiles: {
    q1: number;
    q2: number;
    q3: number;
  };
  percentiles: Record<number, number>;
  outliers: number[];
  correlation?: number;
  regression?: {
    slope: number;
    intercept: number;
    rSquared: number;
    equation: string;
  };
  hypothesis?: {
    pValue: number;
    significant: boolean;
    alpha: number;
    testStatistic: number;
  };
}

// Accessibility Configuration

export interface AccessibilityConfig {
  enabled: boolean;
  description?: string;
  keyboardNavigation?: {
    enabled: boolean;
    focusIndicator?: {
      enabled: boolean;
      style?: Record<string, any>;
    };
  };
  announceNewData?: {
    enabled: boolean;
    minAnnounceInterval?: number;
  };
  landmarkVerbosity?: 'one' | 'all';
  point?: {
    valueDecimals?: number;
    descriptionFormatter?: (point: any) => string;
  };
  series?: {
    descriptionFormatter?: (series: any) => string;
  };
  sonification?: {
    enabled: boolean;
    duration?: number;
    pointGrouping?: {
      enabled: boolean;
      groupTimespan?: number;
      algorithm?: 'minmax' | 'first' | 'last' | 'middle';
    };
  };
}
