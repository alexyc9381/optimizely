/**
 * Optimizely Charts Library
 * Comprehensive chart library with advanced analytics, real-time streaming,
 * and comprehensive export/sharing capabilities.
 */

// Core chart engine and analytics
export { AdvancedAnalyticsEngine, analyticsEngine } from './AdvancedAnalyticsEngine';
export { ChartEngine, chartEngine } from './ChartEngine';

// Real-time streaming components
export { RealTimeChartEngine, realTimeChartEngine } from './RealTimeChartEngine';
export { RealTimeDataService } from './services/RealTimeDataService';

// Export and sharing system
export {
    EmbedDialog, ExportControls, ReportScheduler, ShareDialog
} from './components/ExportControls';
export { ExportEngine, exportEngine } from './ExportEngine';

// Mobile-responsive chart system
export { MobileResponsiveChart, useMobileChart, useResponsiveDimensions, useTouchGestures } from './components/MobileResponsiveChart';
export { MobileChartEngine, mobileChartEngine } from './MobileChartEngine';

// Performance optimization and virtualization
export { PerformanceDashboard, ProgressiveChart, VirtualizedChart, usePerformanceMonitoring, useProgressiveLoading, useVirtualization } from './components/VirtualizedChart';
export { PerformanceEngine, performanceEngine } from './PerformanceEngine';

// Theme customization and theming engine
export { ThemeCustomizer } from './components/ThemeCustomizer';
export { ThemeEngine, themeEngine } from './ThemeEngine';

// Chart components
export {
    AreaChart, BarChart, HeatmapChart, LineChart, PieChart,
    ScatterChart
} from './components/Charts';

export {
    RealTimeAreaChart,
    RealTimeBarChart, RealTimeLineChart, RealTimeScatterChart
} from './components/RealTimeChart';

export { AnalyticsInterface } from './components/AnalyticsInterface';

// Custom hooks
export {
    useAnalytics, useChartData, useRealTimeData,
    useRealTimeMetrics
} from './hooks/chartHooks';

// Utility functions
export {
    calculateTrend, downloadFile, exportToCSV,
    exportToPDF, formatCurrency,
    formatDate, formatNumber,
    formatPercentage, generateColors
} from './utils/chartUtils';

export {
    aggregateData, calculateDerivative, normalizeData, smoothData, transformRealTimeData
} from './utils/dataTransforms';

// Type definitions
export type {
    AnimationConfig, ChartConfig,
    ChartData, ChartDimensions,
    ChartMargins, ChartTheme
} from './types/chartTypes';

export type {
    AnalyticsMetrics, CorrelationResult, InsightData, RegressionResult, TestResult, TrendAnalysis
} from './types/analyticsTypes';

export type {
    DataBuffer, DataTransformation, PerformanceMetrics, RealTimeConfig, TrendDirection
} from './types/realTimeTypes';

export type {
    AccessControl,
    EmbedConfig, ExportOptions,
    ExportResult, ReportSection, ReportTemplate, ScheduledReport, ShareableLink, WatermarkConfig
} from './ExportEngine';

export type {
    DetectedGesture, DeviceInfo, MobileChartConfig,
    ResponsiveBreakpoint, TouchCapabilities, TouchGesture
} from './MobileChartEngine';

export type {
    DataChunk, MemoryConfig, PerformanceConfig, PerformanceWorker, ProgressiveLoadingConfig, VirtualDataProvider, VirtualizationConfig
} from './PerformanceEngine';

export type { BorderRadiusConfig, BrandingConfig, ColorPalette, ShadowConfig, SpacingConfig, Theme, AnimationConfig as ThemeAnimationConfig, ChartTheme as ThemeChartConfig, ThemeObserver, ThemePreset, ThemeValidationResult, Typography } from './ThemeEngine';

// Example components
export { AnalyticsExample } from './examples/AnalyticsExample';
export { ChartExample } from './examples/ChartExample';
export { ExportExample } from './examples/ExportExample';
export { MobileExample, ResponsiveTestGrid } from './examples/MobileExample';
export { PerformanceExample, PerformanceTestGrid } from './examples/PerformanceExample';
export { RealTimeExample } from './examples/RealTimeExample';
export { ThemeExample } from './examples/ThemeExample';

// CSS imports for styling
import './components/AnalyticsInterface.css';
import './components/Charts.css';
import './components/ExportControls.css';
import './components/MobileChart.css';
import './components/PerformanceChart.css';
import './components/RealTimeChart.css';
import './components/ThemeCustomizer.css';
import './examples/ThemeExample.css';

// Version and metadata
export const VERSION = '1.0.0';
export const BUILD_DATE = new Date().toISOString();

/**
 * Initialize the charts library with default configuration
 */
export const initializeCharts = (config?: {
  theme?: 'light' | 'dark' | 'high-contrast' | 'corporate' | 'minimal' | string;
  animations?: boolean;
  realTime?: boolean;
  analytics?: boolean;
  export?: boolean;
  mobile?: boolean;
  performance?: boolean;
  theming?: boolean;
}) => {
  const defaultConfig = {
    theme: 'light' as const,
    animations: true,
    realTime: true,
    analytics: true,
    export: true,
    mobile: true,
    performance: true,
    theming: true,
    ...config
  };

  // Initialize chart engine
  const chartEngineInstance = chartEngine;

  // Initialize analytics if enabled
  if (defaultConfig.analytics) {
    const analyticsEngineInstance = analyticsEngine;
    console.log('Analytics engine initialized');
  }

  // Initialize real-time capabilities if enabled
  if (defaultConfig.realTime) {
    const realTimeEngineInstance = realTimeChartEngine;
    console.log('Real-time chart engine initialized');
  }

  // Initialize export capabilities if enabled
  if (defaultConfig.export) {
    const exportEngineInstance = exportEngine;
    console.log('Export engine initialized');
  }

  // Initialize mobile capabilities if enabled
  if (defaultConfig.mobile) {
    const mobileEngineInstance = mobileChartEngine;
    console.log('Mobile chart engine initialized');
  }

  // Initialize performance optimization if enabled
  if (defaultConfig.performance) {
    const performanceEngineInstance = performanceEngine;
    console.log('Performance engine initialized');
  }

  // Initialize theming engine if enabled
  if (defaultConfig.theming) {
    const themeEngineInstance = themeEngine;
    // Set initial theme if specified
    if (typeof defaultConfig.theme === 'string' && defaultConfig.theme !== 'light') {
      themeEngineInstance.setTheme(defaultConfig.theme);
    }
    console.log('Theme engine initialized');
  }

  console.log(`Optimizely Charts Library v${VERSION} initialized with config:`, defaultConfig);

  return {
    chartEngine: chartEngineInstance,
    analyticsEngine: defaultConfig.analytics ? analyticsEngine : null,
    realTimeEngine: defaultConfig.realTime ? realTimeChartEngine : null,
    exportEngine: defaultConfig.export ? exportEngine : null,
    mobileEngine: defaultConfig.mobile ? mobileChartEngine : null,
    performanceEngine: defaultConfig.performance ? performanceEngine : null,
    themeEngine: defaultConfig.theming ? themeEngine : null,
    config: defaultConfig
  };
};

/**
 * Cleanup function to properly shutdown all engines
 */
export const shutdownCharts = () => {
  try {
    chartEngine.shutdown();
    analyticsEngine.shutdown();
    realTimeChartEngine.shutdown();
    exportEngine.shutdown();
    mobileChartEngine.shutdown();
    performanceEngine.shutdown();
    themeEngine.shutdown();
    console.log('All chart engines shut down successfully');
  } catch (error) {
    console.error('Error shutting down chart engines:', error);
  }
};

// Standalone theme utility functions
export {
    applyWhiteLabel, createColorPalette,
    getAccessibleColor,
    validateTheme
} from './ThemeEngine';

// Default export
export default {
  ChartEngine,
  AdvancedAnalyticsEngine,
  RealTimeChartEngine,
  ExportEngine,
  MobileChartEngine,
  PerformanceEngine,
  ThemeEngine,
  initializeCharts,
  shutdownCharts,
  VERSION,
  BUILD_DATE
};

