import { StatisticalChartEngine } from '../StatisticalChartEngine';
import {
    ChartConfig,
    ChartSeries,
    ChartType,
    CohortDataPoint,
    FunnelDataPoint,
    HeatmapDataPoint
} from '../types';

describe('StatisticalChartEngine', () => {
  let engine: StatisticalChartEngine;
  let mockData: ChartSeries[];
  let mockConfig: ChartConfig;

  beforeEach(() => {
    engine = StatisticalChartEngine.getInstance();

    mockData = [
      {
        id: 'series1',
        name: 'Test Series 1',
        data: [
          { x: 1, y: 10 },
          { x: 2, y: 20 },
          { x: 3, y: 15 },
          { x: 4, y: 25 },
          { x: 5, y: 30 }
        ]
      },
      {
        id: 'series2',
        name: 'Test Series 2',
        data: [
          { x: 1, y: 8 },
          { x: 2, y: 18 },
          { x: 3, y: 12 },
          { x: 4, y: 22 },
          { x: 5, y: 28 }
        ]
      }
    ];

    mockConfig = {
      type: ChartType.LINE,
      title: { text: 'Test Chart' },
      legend: { enabled: true, position: 'bottom' },
      tooltip: { enabled: true }
    };
  });

  afterEach(() => {
    // Clean up any charts created during tests
    engine.getAllCharts().forEach(chart => {
      engine.destroyChart(chart.id);
    });
  });

  describe('Chart Creation and Management', () => {
    test('should create a chart successfully', async () => {
      const context = await engine.createChart('test-chart-1', mockData, mockConfig);

      expect(context).toBeDefined();
      expect(context.id).toBe('test-chart-1');
      expect(context.data).toHaveLength(2);
      expect(context.config.type).toBe(ChartType.LINE);
      expect(context.state.isLoading).toBe(false);
      expect(context.state.hasError).toBe(false);
    });

    test('should update chart data and config', async () => {
      await engine.createChart('test-chart-2', mockData, mockConfig);

      const newData = [
        {
          id: 'updated-series',
          name: 'Updated Series',
          data: [{ x: 1, y: 100 }, { x: 2, y: 200 }]
        }
      ];

      const result = engine.updateChart('test-chart-2', newData);
      expect(result).toBe(true);

      const updatedContext = engine.getChart('test-chart-2');
      expect(updatedContext?.data).toHaveLength(1);
      expect(updatedContext?.data[0].name).toBe('Updated Series');
    });

    test('should destroy chart successfully', async () => {
      await engine.createChart('test-chart-3', mockData, mockConfig);

      const result = engine.destroyChart('test-chart-3');
      expect(result).toBe(true);

      const deletedChart = engine.getChart('test-chart-3');
      expect(deletedChart).toBeUndefined();
    });

    test('should return undefined for non-existent chart', () => {
      const result = engine.getChart('non-existent-chart');
      expect(result).toBeUndefined();
    });

    test('should return false when updating non-existent chart', () => {
      const result = engine.updateChart('non-existent-chart', mockData);
      expect(result).toBe(false);
    });

    test('should return false when destroying non-existent chart', () => {
      const result = engine.destroyChart('non-existent-chart');
      expect(result).toBe(false);
    });
  });

  describe('Statistical Analysis', () => {
    test('should calculate basic statistics correctly', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const stats = engine.calculateStatistics(data);

      expect(stats.mean).toBe(5.5);
      expect(stats.median).toBe(5.5);
      expect(stats.min).toBe(1);
      expect(stats.max).toBe(10);
      expect(stats.range).toBe(9);
      expect(stats.quartiles.q1).toBe(3);
      expect(stats.quartiles.q2).toBe(5.5);
      expect(stats.quartiles.q3).toBe(8);
    });

    test('should calculate statistics for skewed data', () => {
      const data = [1, 1, 1, 2, 2, 3, 4, 5, 10, 20];
      const stats = engine.calculateStatistics(data);

      expect(stats.mean).toBe(4.9);
      expect(stats.median).toBe(2.5);
      expect(stats.mode).toContain(1);
      expect(stats.skewness).toBeGreaterThan(0); // Positive skew
      expect(stats.outliers.length).toBeGreaterThan(0);
    });

    test('should calculate correlation correctly', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10]; // Perfect positive correlation

      const correlation = engine.calculateCorrelation(x, y);
      expect(correlation).toBeCloseTo(1, 10);
    });

    test('should calculate linear regression', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10]; // y = 2x

      const regression = engine.calculateLinearRegression(x, y);
      expect(regression.slope).toBeCloseTo(2, 5);
      expect(regression.intercept).toBeCloseTo(0, 5);
      expect(regression.rSquared).toBeCloseTo(1, 10);
      expect(regression.equation).toContain('y = 2.0000x + 0.0000');
    });

    test('should handle empty arrays gracefully', () => {
      const correlation = engine.calculateCorrelation([], []);
      expect(correlation).toBe(0);

      const regression = engine.calculateLinearRegression([], []);
      expect(regression.slope).toBe(0);
      expect(regression.intercept).toBe(0);
      expect(regression.rSquared).toBe(0);
    });
  });

  describe('Chart Type Processing', () => {
    test('should process line chart data correctly', async () => {
      const lineConfig: ChartConfig = { type: ChartType.LINE };
      const context = await engine.createChart('line-chart', mockData, lineConfig);

      // Data should be sorted by x values
      const firstSeries = context.data[0];
      for (let i = 1; i < firstSeries.data.length; i++) {
        expect(Number(firstSeries.data[i].x)).toBeGreaterThanOrEqual(Number(firstSeries.data[i - 1].x));
      }
    });

    test('should process histogram data correctly', async () => {
      const histogramData: ChartSeries[] = [
        {
          id: 'histogram',
          name: 'Histogram Data',
          data: Array.from({ length: 100 }, (_, i) => ({ x: i, y: Math.random() * 100 }))
        }
      ];

      const histogramConfig: ChartConfig = { type: ChartType.HISTOGRAM };
      const context = await engine.createChart('histogram-chart', histogramData, histogramConfig);

      // Should create binned data
      expect(context.data[0].data.length).toBeLessThan(100); // Binned data should be smaller
      expect(context.data[0].data.every(point => point.label)).toBe(true); // Should have bin labels
    });

    test('should process bar chart data correctly', async () => {
      const barConfig: ChartConfig = { type: ChartType.BAR };
      const context = await engine.createChart('bar-chart', mockData, barConfig);

      // All data points should have valid y values
      context.data.forEach(series => {
        series.data.forEach(point => {
          expect(typeof point.y).toBe('number');
          expect(isNaN(point.y)).toBe(false);
        });
      });
    });
  });

  describe('Specialized Data Processing', () => {
    test('should process heatmap data correctly', () => {
      const heatmapData: HeatmapDataPoint[] = [
        { x: 'A', y: 'X', value: 10 },
        { x: 'A', y: 'Y', value: 20 },
        { x: 'B', y: 'X', value: 30 },
        { x: 'B', y: 'Y', value: 40 }
      ];

      const processed = engine.processHeatmapData(heatmapData);

      // Values should be normalized between 0 and 1
      processed.forEach(point => {
        expect(point.value).toBeGreaterThanOrEqual(0);
        expect(point.value).toBeLessThanOrEqual(1);
      });
    });

    test('should process funnel data correctly', () => {
      const funnelData: FunnelDataPoint[] = [
        { name: 'Awareness', value: 1000 },
        { name: 'Interest', value: 800 },
        { name: 'Consideration', value: 600 },
        { name: 'Purchase', value: 200 }
      ];

      const processed = engine.processFunnelData(funnelData);

      // Should calculate percentages and dropoff
      expect(processed[0].percentage).toBeCloseTo(40, 1); // 1000/2500 * 100
      expect(processed[1].dropoff).toBe(200); // 1000 - 800
      expect(processed.every(point => point.percentage !== undefined)).toBe(true);
    });

    test('should process cohort data correctly', () => {
      const cohortData: CohortDataPoint[] = [
        { cohort: '2023-01', period: 0, value: 100 },
        { cohort: '2023-01', period: 1, value: 80 },
        { cohort: '2023-01', period: 2, value: 60 },
        { cohort: '2023-02', period: 0, value: 120 },
        { cohort: '2023-02', period: 1, value: 90 }
      ];

      const processed = engine.processCohortData(cohortData);

      // Should calculate retention rates
      const jan2023Period1 = processed.find(p => p.cohort === '2023-01' && p.period === 1);
      expect(jan2023Period1?.retention).toBeCloseTo(80, 1); // 80/100 * 100

      expect(processed.every(point => point.retention !== undefined)).toBe(true);
    });
  });

  describe('Performance and Optimization', () => {
    test('should optimize large datasets', async () => {
      const largeData: ChartSeries[] = [
        {
          id: 'large-series',
          name: 'Large Series',
          data: Array.from({ length: 15000 }, (_, i) => ({ x: i, y: Math.random() * 100 }))
        }
      ];

      const context = await engine.createChart('large-chart', largeData, mockConfig);

      expect(context.performance.isOptimized).toBe(true);
      expect(context.data[0].data.length).toBeLessThan(15000); // Should be sampled
    });

    test('should track performance metrics', async () => {
      const context = await engine.createChart('perf-chart', mockData, mockConfig);

      expect(context.performance.renderTime).toBeGreaterThan(0);
      expect(context.performance.dataPoints).toBe(10); // 5 points per series, 2 series
      expect(typeof context.performance.memoryUsage).toBe('number');
    });

    test('should handle chart events', (done) => {
      engine.once('chart:created', (context) => {
        expect(context.id).toBe('event-chart');
        done();
      });

      engine.createChart('event-chart', mockData, mockConfig);
    });
  });

  describe('Export Functionality', () => {
    test('should export chart as JSON', async () => {
      await engine.createChart('export-chart', mockData, mockConfig);

      const exported = await engine.exportChart('export-chart', 'json');
      expect(typeof exported).toBe('string');

      const parsed = JSON.parse(exported as string);
      expect(parsed.id).toBe('export-chart');
      expect(parsed.data).toBeDefined();
      expect(parsed.config).toBeDefined();
    });

    test('should handle export errors gracefully', async () => {
      await expect(engine.exportChart('non-existent', 'json'))
        .rejects.toThrow('Chart with id non-existent not found');
    });
  });

  describe('Configuration Merging', () => {
    test('should merge config with defaults correctly', async () => {
      const minimalConfig: ChartConfig = { type: ChartType.PIE };
      const context = await engine.createChart('config-chart', mockData, minimalConfig);

      expect(context.config.legend?.enabled).toBe(true); // Default value
      expect(context.config.tooltip?.enabled).toBe(true); // Default value
      expect(context.config.animations?.enabled).toBe(true); // Default value
      expect(context.config.colors?.palette).toBeDefined(); // Default colors
    });

    test('should preserve custom config values', async () => {
      const customConfig: ChartConfig = {
        type: ChartType.BAR,
        title: { text: 'Custom Title', fontSize: 20 },
        legend: { enabled: false, position: 'top' },
        colors: { palette: ['#ff0000', '#00ff00', '#0000ff'] }
      };

      const context = await engine.createChart('custom-chart', mockData, customConfig);

      expect(context.config.title?.text).toBe('Custom Title');
      expect(context.config.title?.fontSize).toBe(20);
      expect(context.config.legend?.enabled).toBe(false);
      expect(context.config.legend?.position).toBe('top');
      expect(context.config.colors?.palette).toEqual(['#ff0000', '#00ff00', '#0000ff']);
    });
  });

  describe('Data Validation and Error Handling', () => {
    test('should handle invalid data gracefully', async () => {
      const invalidData: ChartSeries[] = [
        {
          id: 'invalid',
          name: 'Invalid Series',
          data: [
            { x: 1, y: NaN },
            { x: 2, y: Infinity },
            { x: 3, y: 10 }
          ]
        }
      ];

      const barConfig: ChartConfig = { type: ChartType.BAR };
      const context = await engine.createChart('invalid-chart', invalidData, barConfig);

      // Should filter out invalid data points
      expect(context.data[0].data.length).toBe(1); // Only the valid point should remain
      expect(context.data[0].data[0].y).toBe(10);
    });

    test('should handle empty data arrays', async () => {
      const emptyData: ChartSeries[] = [
        {
          id: 'empty',
          name: 'Empty Series',
          data: []
        }
      ];

      const context = await engine.createChart('empty-chart', emptyData, mockConfig);
      expect(context.data[0].data).toHaveLength(0);
      expect(context.performance.dataPoints).toBe(0);
    });
  });

  describe('Chart State Management', () => {
    test('should initialize chart state correctly', async () => {
      const context = await engine.createChart('state-chart', mockData, mockConfig);

      expect(context.state.isLoading).toBe(false);
      expect(context.state.hasError).toBe(false);
      expect(context.state.selectedPoints).toHaveLength(0);
      expect(context.state.selectedSeries).toHaveLength(0);
      expect(context.state.zoomLevel).toBe(1);
      expect(context.state.panPosition).toEqual({ x: 0, y: 0 });
      expect(context.state.lastUpdated).toBeInstanceOf(Date);
    });

    test('should update state on chart updates', async () => {
      const context = await engine.createChart('update-state-chart', mockData, mockConfig);
      const initialUpdate = context.state.lastUpdated;

      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 10));

      engine.updateChart('update-state-chart', mockData);
      const updatedContext = engine.getChart('update-state-chart');

      expect(updatedContext?.state.lastUpdated.getTime()).toBeGreaterThan(initialUpdate.getTime());
    });
  });
});
