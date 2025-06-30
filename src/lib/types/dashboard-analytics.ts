// Dashboard Analytics Types
export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  isPublic: boolean;
  layout: DashboardLayout;
  widgets: DashboardWidget[];
  filters: DashboardFilter[];
  settings: DashboardSettings;
  createdAt: string;
  updatedAt: string;
  lastViewedAt?: string;
  viewCount: number;
  tags: string[];
}

export interface DashboardLayout {
  type: 'grid' | 'freeform' | 'responsive';
  columns: number;
  rowHeight: number;
  gaps: {
    horizontal: number;
    vertical: number;
  };
  breakpoints: {
    lg: number;
    md: number;
    sm: number;
    xs: number;
  };
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  position: WidgetPosition;
  size: WidgetSize;
  configuration: WidgetConfiguration;
  dataSource: DataSource;
  filters: WidgetFilter[];
  refreshInterval?: number; // in seconds
  isVisible: boolean;
  permissions: WidgetPermissions;
  createdAt: string;
  updatedAt: string;
}

export enum WidgetType {
  LINE_CHART = 'line_chart',
  BAR_CHART = 'bar_chart',
  PIE_CHART = 'pie_chart',
  AREA_CHART = 'area_chart',
  SCATTER_PLOT = 'scatter_plot',
  HEATMAP = 'heatmap',
  GAUGE = 'gauge',
  KPI_CARD = 'kpi_card',
  TABLE = 'table',
  FUNNEL_CHART = 'funnel_chart',
  COHORT_ANALYSIS = 'cohort_analysis',
  DISTRIBUTION_CHART = 'distribution_chart',
  CORRELATION_MATRIX = 'correlation_matrix',
  GEOGRAPHIC_MAP = 'geographic_map',
  TIMELINE = 'timeline',
  CUSTOM = 'custom'
}

export interface WidgetPosition {
  x: number;
  y: number;
  z?: number; // for layering
}

export interface WidgetSize {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface WidgetConfiguration {
  chartConfig: ChartConfiguration;
  styling: WidgetStyling;
  interactions: WidgetInteractions;
  annotations?: WidgetAnnotation[];
}

export interface ChartConfiguration {
  title?: ChartTitle;
  axes?: ChartAxes;
  legend?: ChartLegend;
  series: ChartSeries[];
  aggregation?: DataAggregation;
  sorting?: DataSorting;
  grouping?: DataGrouping;
}

export interface ChartTitle {
  text: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  styling: TextStyling;
}

export interface ChartAxes {
  x: ChartAxis;
  y: ChartAxis;
  secondary?: ChartAxis;
}

export interface ChartAxis {
  title?: string;
  type: 'linear' | 'logarithmic' | 'datetime' | 'category';
  min?: number | string;
  max?: number | string;
  tickInterval?: number;
  format?: string;
  gridLines: boolean;
  reversed?: boolean;
}

export interface ChartLegend {
  enabled: boolean;
  position: 'top' | 'bottom' | 'left' | 'right' | 'floating';
  alignment?: 'start' | 'center' | 'end';
  itemStyle?: TextStyling;
}

export interface ChartSeries {
  id: string;
  name: string;
  type: WidgetType;
  dataField: string;
  color?: string;
  styling?: SeriesStyling;
  visible: boolean;
  yAxisIndex?: number;
}

export interface SeriesStyling {
  lineWidth?: number;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  fillOpacity?: number;
  markerSize?: number;
  markerStyle?: 'circle' | 'square' | 'triangle' | 'diamond';
}

export interface DataAggregation {
  field: string;
  method: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'median' | 'percentile';
  percentile?: number;
  groupBy?: string[];
  timeInterval?: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export interface DataSorting {
  field: string;
  direction: 'asc' | 'desc';
  nullsFirst?: boolean;
}

export interface DataGrouping {
  field: string;
  buckets?: number;
  customRanges?: GroupingRange[];
}

export interface GroupingRange {
  min: number;
  max: number;
  label: string;
}

export interface WidgetStyling {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding: number;
  margin: number;
  shadow?: BoxShadow;
  theme?: 'light' | 'dark' | 'auto';
}

export interface BoxShadow {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
}

export interface TextStyling {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | number;
  color?: string;
  alignment?: 'left' | 'center' | 'right';
}

export interface WidgetInteractions {
  enableZoom: boolean;
  enablePan: boolean;
  enableSelection: boolean;
  enableCrosshair: boolean;
  enableTooltip: boolean;
  tooltipFormat?: string;
  clickAction?: InteractionAction;
  hoverAction?: InteractionAction;
}

export interface InteractionAction {
  type: 'none' | 'drill_down' | 'filter' | 'navigate' | 'popup' | 'custom';
  target?: string;
  parameters?: Record<string, any>;
}

export interface WidgetAnnotation {
  id: string;
  type: 'line' | 'band' | 'point' | 'text';
  value: number | string | Date;
  axis: 'x' | 'y';
  label?: string;
  color?: string;
  style?: 'solid' | 'dashed' | 'dotted';
}

export interface DataSource {
  id: string;
  type: 'api' | 'database' | 'file' | 'realtime' | 'custom';
  connection: DataConnection;
  query: DataQuery;
  caching: DataCaching;
  refreshStrategy: RefreshStrategy;
}

export interface DataConnection {
  endpoint?: string;
  authentication?: DataAuthentication;
  headers?: Record<string, string>;
  timeout?: number;
  retryPolicy?: RetryPolicy;
}

export interface DataAuthentication {
  type: 'none' | 'api_key' | 'bearer' | 'basic' | 'oauth';
  credentials: Record<string, string>;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffMultiplier: number;
  initialDelay: number;
  maxDelay: number;
}

export interface DataQuery {
  statement: string;
  parameters?: Record<string, any>;
  variables?: QueryVariable[];
  pagination?: QueryPagination;
}

export interface QueryVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array';
  defaultValue: any;
  required: boolean;
}

export interface QueryPagination {
  enabled: boolean;
  pageSize: number;
  maxRecords?: number;
}

export interface DataCaching {
  enabled: boolean;
  ttl: number; // time to live in seconds
  strategy: 'memory' | 'redis' | 'file';
  key?: string;
}

export interface RefreshStrategy {
  type: 'manual' | 'interval' | 'realtime' | 'event_driven';
  interval?: number; // in seconds
  events?: string[]; // event names for event-driven refresh
}

export interface DashboardFilter {
  id: string;
  name: string;
  type: FilterType;
  field: string;
  operator: FilterOperator;
  value: any;
  isGlobal: boolean;
  affectedWidgets: string[];
  isVisible: boolean;
  isRequired: boolean;
}

export enum FilterType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  RANGE = 'range',
  DATE_RANGE = 'date_range',
  BOOLEAN = 'boolean'
}

export enum FilterOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  GREATER_THAN = 'greater_than',
  GREATER_THAN_OR_EQUAL = 'greater_than_or_equal',
  LESS_THAN = 'less_than',
  LESS_THAN_OR_EQUAL = 'less_than_or_equal',
  BETWEEN = 'between',
  IN = 'in',
  NOT_IN = 'not_in',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null'
}

export interface WidgetFilter extends DashboardFilter {
  widgetId: string;
}

export interface DashboardSettings {
  refreshInterval?: number; // global refresh interval in seconds
  theme: 'light' | 'dark' | 'auto';
  timezone: string;
  locale: string;
  currency: string;
  numberFormat: NumberFormat;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
  allowExport: boolean;
  allowSharing: boolean;
  allowEmbedding: boolean;
}

export interface NumberFormat {
  decimalPlaces: number;
  thousandsSeparator: string;
  decimalSeparator: string;
  prefix?: string;
  suffix?: string;
}

export interface WidgetPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  canExport: boolean;
}

// Real-time data interfaces
export interface RealTimeDataUpdate {
  dashboardId: string;
  widgetId: string;
  data: any;
  timestamp: string;
  updateType: 'append' | 'replace' | 'merge';
}

export interface WebSocketMessage {
  type: 'data_update' | 'error' | 'connection_status';
  payload: any;
  timestamp: string;
}

// Dashboard template interfaces
export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  industry?: string;
  tags: string[];
  thumbnail?: string;
  template: Partial<Dashboard>;
  requiredDataFields: string[];
  createdAt: string;
  popularity: number;
}

// Dashboard sharing interfaces
export interface DashboardShare {
  id: string;
  dashboardId: string;
  shareType: 'public' | 'private' | 'organization';
  permissions: SharePermissions;
  expiresAt?: string;
  password?: string;
  allowedEmails?: string[];
  embedCode?: string;
  customDomain?: string;
  createdAt: string;
}

export interface SharePermissions {
  canView: boolean;
  canComment: boolean;
  canDownload: boolean;
  canCopy: boolean;
}

// Export interfaces
export interface ExportRequest {
  dashboardId: string;
  widgetIds?: string[];
  format: 'pdf' | 'png' | 'svg' | 'csv' | 'excel';
  options: ExportOptions;
}

export interface ExportOptions {
  width?: number;
  height?: number;
  dpi?: number;
  includeData?: boolean;
  includeFilters?: boolean;
  orientation?: 'portrait' | 'landscape';
  paperSize?: 'A4' | 'letter' | 'legal' | 'custom';
}

// API response interfaces
export interface DashboardResponse {
  dashboard: Dashboard;
  data: Record<string, any>;
  metadata: DashboardMetadata;
}

export interface DashboardMetadata {
  totalWidgets: number;
  lastRefresh: string;
  dataFreshness: Record<string, string>;
  performance: PerformanceMetrics;
}

export interface PerformanceMetrics {
  renderTime: number;
  dataLoadTime: number;
  totalSize: number;
  cacheHitRate: number;
}
