/**
 * Export Engine Test Suite
 * Comprehensive tests for all export, sharing, and reporting functionality.
 * Tests image export, PDF generation, data export, shareable links, embeds, and scheduled reports.
 */

import { AccessControl, EmbedConfig, ExportEngine, ExportOptions } from '../ExportEngine';

// Mock dependencies
jest.mock('html2canvas', () => ({
  default: jest.fn(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    ctx!.fillStyle = '#ffffff';
    ctx!.fillRect(0, 0, 1200, 800);
    return Promise.resolve(canvas);
  })
}));

jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => ({
    setFontSize: jest.fn(),
    text: jest.fn(),
    addPage: jest.fn(),
    addImage: jest.fn(),
    setProperties: jest.fn(),
    setPage: jest.fn(),
    internal: {
      getNumberOfPages: jest.fn(() => 1),
      pageSize: { height: 800 }
    },
    output: jest.fn(() => new Blob(['mock pdf'], { type: 'application/pdf' }))
  }))
}));

jest.mock('xlsx', () => ({
  utils: {
    json_to_sheet: jest.fn(() => ({})),
    book_new: jest.fn(() => ({})),
    book_append_sheet: jest.fn()
  },
  write: jest.fn(() => new ArrayBuffer(8))
}));

// Mock DOM elements
const createMockCanvas = (): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 400;

  // Mock toBlob method
  canvas.toBlob = jest.fn((callback) => {
    const blob = new Blob(['mock image'], { type: 'image/png' });
    callback?.(blob);
  });

  // Mock toDataURL method
  canvas.toDataURL = jest.fn(() => 'data:image/png;base64,mock-data');

  return canvas;
};

const createMockChartElement = (): HTMLElement => {
  const element = document.createElement('div');
  element.innerHTML = '<svg><rect width="100" height="100" fill="blue"/></svg>';
  return element;
};

describe('ExportEngine', () => {
  let exportEngine: ExportEngine;

  beforeEach(() => {
    exportEngine = ExportEngine.getInstance();

    // Clear any existing state
    exportEngine.removeAllListeners();

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'https://example.com'
      },
      writable: true
    });

    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();

    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: jest.fn(() => Promise.resolve())
      },
      writable: true
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ExportEngine.getInstance();
      const instance2 = ExportEngine.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should initialize with default configuration', () => {
      expect(exportEngine).toBeDefined();
      expect(exportEngine.getExportHistory()).toEqual([]);
      expect(exportEngine.getShareableLinks()).toEqual([]);
      expect(exportEngine.getScheduledReports()).toEqual([]);
    });
  });

  describe('Image Export', () => {
    it('should export chart as PNG', async () => {
      const chartElement = createMockChartElement();
      const options: ExportOptions = {
        format: 'png',
        quality: 0.9,
        width: 1200,
        height: 800
      };

      const result = await exportEngine.exportAsImage(chartElement, options);

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Blob);
      expect(result.filename).toContain('.png');
      expect(result.metadata?.format).toBe('png');
      expect(result.metadata?.fileSize).toBeGreaterThan(0);
    });

    it('should export chart as JPG', async () => {
      const chartElement = createMockChartElement();
      const options: ExportOptions = {
        format: 'jpg',
        quality: 0.8
      };

      const result = await exportEngine.exportAsImage(chartElement, options);

      expect(result.success).toBe(true);
      expect(result.filename).toContain('.jpg');
      expect(result.metadata?.format).toBe('jpg');
    });

    it('should export chart as SVG', async () => {
      const chartElement = createMockChartElement();
      const options: ExportOptions = {
        format: 'svg'
      };

      const result = await exportEngine.exportAsImage(chartElement, options);

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Blob);
      expect(result.filename).toContain('.svg');
      expect(result.metadata?.format).toBe('svg');
    });

    it('should handle unsupported image format', async () => {
      const chartElement = createMockChartElement();
      const options: ExportOptions = {
        format: 'gif' as any
      };

      const result = await exportEngine.exportAsImage(chartElement, options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported image format');
    });

    it('should apply watermark to image', async () => {
      const chartElement = createMockChartElement();
      const options: ExportOptions = {
        format: 'png',
        watermark: {
          text: 'Optimizely',
          position: 'bottom-right',
          opacity: 0.5,
          fontSize: 16,
          color: '#666666'
        }
      };

      const result = await exportEngine.exportAsImage(chartElement, options);

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Blob);
    });
  });

  describe('PDF Export', () => {
    it('should export single chart as PDF', async () => {
      const chartElement = createMockChartElement();
      const options: ExportOptions & { title?: string } = {
        format: 'pdf',
        title: 'Test Report',
        includeMetadata: true
      };

      const result = await exportEngine.exportAsPDF([chartElement], options);

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Blob);
      expect(result.filename).toContain('.pdf');
      expect(result.metadata?.format).toBe('pdf');
    });

    it('should export multiple charts as multi-page PDF', async () => {
      const chartElements = [
        createMockChartElement(),
        createMockChartElement()
      ];
      const options: ExportOptions & { multiPage?: boolean } = {
        format: 'pdf',
        multiPage: true
      };

      const result = await exportEngine.exportAsPDF(chartElements, options);

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Blob);
    });

    it('should handle PDF export error', async () => {
      // Mock jsPDF to throw error
      const mockJsPDF = require('jspdf');
      mockJsPDF.jsPDF.mockImplementation(() => {
        throw new Error('PDF generation failed');
      });

      const chartElement = createMockChartElement();
      const options: ExportOptions = { format: 'pdf' };

      const result = await exportEngine.exportAsPDF([chartElement], options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('PDF generation failed');
    });
  });

  describe('Data Export', () => {
    const mockData = [
      { name: 'John', age: 30, city: 'New York' },
      { name: 'Jane', age: 25, city: 'San Francisco' },
      { name: 'Bob', age: 35, city: 'Chicago' }
    ];

    it('should export data as CSV', async () => {
      const options: ExportOptions = {
        format: 'csv',
        headers: ['name', 'age', 'city']
      };

      const result = await exportEngine.exportData(mockData, options);

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Blob);
      expect(result.filename).toContain('.csv');
      expect(result.metadata?.format).toBe('csv');
    });

    it('should export data as JSON', async () => {
      const options: ExportOptions = {
        format: 'json'
      };

      const result = await exportEngine.exportData(mockData, options);

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Blob);
      expect(result.filename).toContain('.json');
    });

    it('should export data as Excel', async () => {
      const options: ExportOptions & { sheetName?: string } = {
        format: 'excel',
        sheetName: 'TestData'
      };

      const result = await exportEngine.exportData(mockData, options);

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Blob);
      expect(result.filename).toContain('.xlsx');
    });

    it('should handle unsupported data format', async () => {
      const options: ExportOptions = {
        format: 'xml' as any
      };

      const result = await exportEngine.exportData(mockData, options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported data format');
    });
  });

  describe('Shareable Links', () => {
    it('should create public shareable link', () => {
      const accessControl: AccessControl = {
        isPublic: true,
        downloadEnabled: true,
        printEnabled: true,
        embedEnabled: true
      };

      const link = exportEngine.createShareableLink('chart-1', accessControl);

      expect(link).toBeDefined();
      expect(link.id).toBeDefined();
      expect(link.url).toContain('https://example.com/share/');
      expect(link.chartId).toBe('chart-1');
      expect(link.accessControl).toEqual(accessControl);
      expect(link.viewCount).toBe(0);
      expect(link.createdAt).toBeInstanceOf(Date);
    });

    it('should create private shareable link with password', () => {
      const accessControl: AccessControl = {
        isPublic: false,
        password: 'secret123',
        maxViews: 100,
        downloadEnabled: false
      };

      const link = exportEngine.createShareableLink('chart-2', accessControl);

      expect(link.accessControl.isPublic).toBe(false);
      expect(link.accessControl.password).toBe('secret123');
      expect(link.accessControl.maxViews).toBe(100);
    });

    it('should validate shareable link access', () => {
      const accessControl: AccessControl = {
        isPublic: true,
        downloadEnabled: true
      };

      const link = exportEngine.createShareableLink('chart-3', accessControl);

      const validation = exportEngine.validateShareableLink(
        link.id,
        link.accessToken
      );

      expect(validation.valid).toBe(true);
      expect(validation.link).toBeDefined();
      expect(validation.link?.viewCount).toBe(1);
    });

    it('should reject invalid access token', () => {
      const accessControl: AccessControl = { isPublic: true };
      const link = exportEngine.createShareableLink('chart-4', accessControl);

      const validation = exportEngine.validateShareableLink(
        link.id,
        'invalid-token'
      );

      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('Invalid access token');
    });

    it('should reject access to non-existent link', () => {
      const validation = exportEngine.validateShareableLink(
        'non-existent-id',
        'some-token'
      );

      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('Link not found');
    });

    it('should enforce password protection', () => {
      const accessControl: AccessControl = {
        isPublic: false,
        password: 'secret123'
      };

      const link = exportEngine.createShareableLink('chart-5', accessControl);

      // Test without password
      const validation1 = exportEngine.validateShareableLink(
        link.id,
        link.accessToken
      );

      expect(validation1.valid).toBe(false);
      expect(validation1.error).toContain('Invalid password');

      // Test with correct password
      const validation2 = exportEngine.validateShareableLink(
        link.id,
        link.accessToken,
        'secret123'
      );

      expect(validation2.valid).toBe(true);
    });

    it('should enforce maximum views limit', () => {
      const accessControl: AccessControl = {
        isPublic: true,
        maxViews: 2
      };

      const link = exportEngine.createShareableLink('chart-6', accessControl);

      // First two accesses should succeed
      const validation1 = exportEngine.validateShareableLink(link.id, link.accessToken);
      const validation2 = exportEngine.validateShareableLink(link.id, link.accessToken);

      expect(validation1.valid).toBe(true);
      expect(validation2.valid).toBe(true);

      // Third access should fail
      const validation3 = exportEngine.validateShareableLink(link.id, link.accessToken);

      expect(validation3.valid).toBe(false);
      expect(validation3.error).toContain('Maximum views exceeded');
    });
  });

  describe('Embed Code Generation', () => {
    it('should generate basic embed code', () => {
      const accessControl: AccessControl = { isPublic: true };
      const link = exportEngine.createShareableLink('chart-7', accessControl);

      const embedConfig: EmbedConfig = {
        chartId: 'chart-7',
        width: 800,
        height: 600
      };

      const embedCode = exportEngine.generateEmbedCode(link.id, embedConfig);

      expect(embedCode).toContain('<iframe');
      expect(embedCode).toContain(`src="https://example.com/embed/${link.id}?token=${link.accessToken}"`);
      expect(embedCode).toContain('width="800"');
      expect(embedCode).toContain('height="600"');
    });

    it('should generate embed code with advanced options', () => {
      const accessControl: AccessControl = { isPublic: true };
      const link = exportEngine.createShareableLink('chart-8', accessControl);

      const embedConfig: EmbedConfig = {
        chartId: 'chart-8',
        width: '100%',
        height: 400,
        theme: 'dark',
        showControls: true,
        autoRefresh: true,
        refreshInterval: 60,
        whiteLabel: true,
        customCSS: 'border: 1px solid #ccc;'
      };

      const embedCode = exportEngine.generateEmbedCode(link.id, embedConfig);

      expect(embedCode).toContain('&theme=dark');
      expect(embedCode).toContain('&controls=true');
      expect(embedCode).toContain('&refresh=60');
      expect(embedCode).toContain('&whitelabel=true');
      expect(embedCode).toContain('style="border: 1px solid #ccc;"');
    });

    it('should handle embed generation for non-existent link', () => {
      const embedConfig: EmbedConfig = {
        chartId: 'chart-9',
        width: 800,
        height: 600
      };

      expect(() => {
        exportEngine.generateEmbedCode('non-existent-link', embedConfig);
      }).toThrow('Shareable link not found');
    });
  });

  describe('Scheduled Reports', () => {
    it('should schedule daily report', () => {
      const reportConfig = {
        name: 'Daily Analytics Report',
        chartIds: ['chart-1', 'chart-2'],
        frequency: 'daily' as const,
        format: 'pdf' as const,
        recipients: ['user@example.com'],
        template: {
          title: 'Daily Report',
          includeTimestamp: true,
          includeSummary: true
        }
      };

      const report = exportEngine.scheduleReport(reportConfig);

      expect(report).toBeDefined();
      expect(report.id).toBeDefined();
      expect(report.name).toBe('Daily Analytics Report');
      expect(report.frequency).toBe('daily');
      expect(report.isActive).toBe(true);
      expect(report.nextRun).toBeInstanceOf(Date);
      expect(report.nextRun.getTime()).toBeGreaterThan(Date.now());
    });

    it('should schedule weekly report', () => {
      const reportConfig = {
        name: 'Weekly Summary',
        chartIds: ['chart-3'],
        frequency: 'weekly' as const,
        format: 'excel' as const,
        recipients: ['manager@example.com']
      };

      const report = exportEngine.scheduleReport(reportConfig);

      expect(report.frequency).toBe('weekly');
      expect(report.format).toBe('excel');
    });

    it('should calculate correct next run times', () => {
      const now = new Date();

      const dailyReport = exportEngine.scheduleReport({
        name: 'Daily',
        chartIds: ['chart-1'],
        frequency: 'daily',
        format: 'pdf',
        recipients: ['test@example.com']
      });

      const weeklyReport = exportEngine.scheduleReport({
        name: 'Weekly',
        chartIds: ['chart-1'],
        frequency: 'weekly',
        format: 'pdf',
        recipients: ['test@example.com']
      });

      const monthlyReport = exportEngine.scheduleReport({
        name: 'Monthly',
        chartIds: ['chart-1'],
        frequency: 'monthly',
        format: 'pdf',
        recipients: ['test@example.com']
      });

      // Daily report should run tomorrow
      const expectedDaily = new Date(now);
      expectedDaily.setDate(expectedDaily.getDate() + 1);
      expect(dailyReport.nextRun.getDate()).toBe(expectedDaily.getDate());

      // Weekly report should run in 7 days
      const expectedWeekly = new Date(now);
      expectedWeekly.setDate(expectedWeekly.getDate() + 7);
      expect(weeklyReport.nextRun.getDate()).toBe(expectedWeekly.getDate());

      // Monthly report should run next month
      const expectedMonthly = new Date(now);
      expectedMonthly.setMonth(expectedMonthly.getMonth() + 1);
      expect(monthlyReport.nextRun.getMonth()).toBe(expectedMonthly.getMonth());
    });
  });

  describe('Export History', () => {
    it('should track export history', async () => {
      const chartElement = createMockChartElement();
      const options: ExportOptions = { format: 'png' };

      await exportEngine.exportAsImage(chartElement, options);

      const history = exportEngine.getExportHistory();
      expect(history).toHaveLength(1);
      expect(history[0].success).toBe(true);
      expect(history[0].metadata?.format).toBe('png');
    });

    it('should limit export history to 100 items', async () => {
      const chartElement = createMockChartElement();
      const options: ExportOptions = { format: 'png' };

      // Add 105 exports to test limit
      for (let i = 0; i < 105; i++) {
        await exportEngine.exportAsImage(chartElement, options);
      }

      const history = exportEngine.getExportHistory();
      expect(history).toHaveLength(100);
    });

    it('should return limited history when requested', async () => {
      const chartElement = createMockChartElement();
      const options: ExportOptions = { format: 'png' };

      // Add 10 exports
      for (let i = 0; i < 10; i++) {
        await exportEngine.exportAsImage(chartElement, options);
      }

      const limitedHistory = exportEngine.getExportHistory(5);
      expect(limitedHistory).toHaveLength(5);
    });
  });

  describe('Event Handling', () => {
    it('should emit export success events', async () => {
      const chartElement = createMockChartElement();
      const options: ExportOptions = { format: 'png' };

      const eventSpy = jest.fn();
      exportEngine.on('export:image:success', eventSpy);

      await exportEngine.exportAsImage(chartElement, options);

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Blob),
          filename: expect.stringContaining('.png')
        })
      );
    });

    it('should emit export error events', async () => {
      const chartElement = createMockChartElement();
      const options: ExportOptions = { format: 'invalid' as any };

      const eventSpy = jest.fn();
      exportEngine.on('export:image:error', eventSpy);

      await exportEngine.exportAsImage(chartElement, options);

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Unsupported image format')
        })
      );
    });

    it('should emit link creation events', () => {
      const accessControl: AccessControl = { isPublic: true };

      const eventSpy = jest.fn();
      exportEngine.on('link:created', eventSpy);

      const link = exportEngine.createShareableLink('chart-test', accessControl);

      expect(eventSpy).toHaveBeenCalledWith(link);
    });

    it('should emit report scheduling events', () => {
      const reportConfig = {
        name: 'Test Report',
        chartIds: ['chart-1'],
        frequency: 'daily' as const,
        format: 'pdf' as const,
        recipients: ['test@example.com']
      };

      const eventSpy = jest.fn();
      exportEngine.on('report:scheduled', eventSpy);

      const report = exportEngine.scheduleReport(reportConfig);

      expect(eventSpy).toHaveBeenCalledWith(report);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing chart element for SVG export', async () => {
      const emptyElement = document.createElement('div');
      const options: ExportOptions = { format: 'svg' };

      const result = await exportEngine.exportAsImage(emptyElement, options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No SVG element found');
    });

    it('should handle canvas creation failure', async () => {
      // Mock html2canvas to reject
      const html2canvas = require('html2canvas');
      html2canvas.default.mockRejectedValueOnce(new Error('Canvas creation failed'));

      const chartElement = createMockChartElement();
      const options: ExportOptions = { format: 'png' };

      const result = await exportEngine.exportAsImage(chartElement, options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Canvas creation failed');
    });
  });

  describe('Cleanup', () => {
    it('should shutdown properly', () => {
      const eventSpy = jest.fn();
      exportEngine.on('engine:shutdown', eventSpy);

      exportEngine.shutdown();

      expect(eventSpy).toHaveBeenCalled();
      expect(exportEngine.getExportHistory()).toEqual([]);
      expect(exportEngine.getShareableLinks()).toEqual([]);
      expect(exportEngine.getScheduledReports()).toEqual([]);
    });
  });
});

describe('CSV Data Creation', () => {
  let exportEngine: ExportEngine;

  beforeEach(() => {
    exportEngine = ExportEngine.getInstance();
  });

  it('should create proper CSV with headers', async () => {
    const data = [
      { name: 'John', age: 30, city: 'New York' },
      { name: 'Jane', age: 25, city: 'San Francisco' }
    ];

    const result = await exportEngine.exportData(data, {
      format: 'csv',
      headers: ['name', 'age', 'city']
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeInstanceOf(Blob);
  });

  it('should handle CSV data with special characters', async () => {
    const data = [
      { text: 'Hello, World!', quote: 'She said "Hello"', newline: 'Line 1\nLine 2' }
    ];

    const result = await exportEngine.exportData(data, {
      format: 'csv'
    });

    expect(result.success).toBe(true);
  });

  it('should handle empty data array', async () => {
    const result = await exportEngine.exportData([], {
      format: 'csv'
    });

    expect(result.success).toBe(true);
  });
});
