/**
 * Export Engine
 * Comprehensive export and sharing system for charts and analytics data.
 * Supports PDF, image, data exports, shareable links, embeds, and scheduled reports.
 */

import { EventEmitter } from 'events';

// Export interfaces
export interface ExportOptions {
  format: 'pdf' | 'png' | 'jpg' | 'svg' | 'excel' | 'csv' | 'json';
  quality?: number; // 0.1 - 1.0 for images
  width?: number;
  height?: number;
  backgroundColor?: string;
  includeData?: boolean;
  includeMetadata?: boolean;
  customStyles?: Record<string, any>;
  watermark?: WatermarkConfig;
  compression?: boolean;
}

export interface WatermarkConfig {
  text?: string;
  image?: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity?: number;
  fontSize?: number;
  color?: string;
}

export interface ShareableLink {
  id: string;
  url: string;
  chartId: string;
  accessToken: string;
  expiresAt?: Date;
  accessControl: AccessControl;
  viewCount: number;
  createdAt: Date;
  metadata: Record<string, any>;
}

export interface AccessControl {
  isPublic: boolean;
  password?: string;
  allowedDomains?: string[];
  allowedEmails?: string[];
  maxViews?: number;
  downloadEnabled?: boolean;
  printEnabled?: boolean;
  embedEnabled?: boolean;
}

export interface EmbedConfig {
  chartId: string;
  width: number | string;
  height: number | string;
  theme?: 'light' | 'dark' | 'auto';
  showControls?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  customCSS?: string;
  whiteLabel?: boolean;
}

export interface ScheduledReport {
  id: string;
  name: string;
  chartIds: string[];
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  format: 'pdf' | 'excel';
  recipients: string[];
  nextRun: Date;
  lastRun?: Date;
  isActive: boolean;
  template?: ReportTemplate;
}

export interface ReportTemplate {
  title: string;
  subtitle?: string;
  logo?: string;
  headerText?: string;
  footerText?: string;
  includeTimestamp?: boolean;
  includeSummary?: boolean;
  customSections?: ReportSection[];
}

export interface ReportSection {
  title: string;
  content: string;
  chartIds?: string[];
  type: 'text' | 'chart' | 'table' | 'image';
}

export interface ExportResult {
  success: boolean;
  data?: Blob | string;
  url?: string;
  filename?: string;
  error?: string;
  metadata?: {
    fileSize: number;
    exportTime: number;
    format: string;
  };
}

// Export Engine class
export class ExportEngine extends EventEmitter {
  private static instance: ExportEngine | null = null;

  private shareableLinks = new Map<string, ShareableLink>();
  private scheduledReports = new Map<string, ScheduledReport>();
  private exportHistory: ExportResult[] = [];
  private reportScheduler: NodeJS.Timeout | null = null;

  private config = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxShareableLinks: 100,
    defaultLinkExpiration: 7 * 24 * 60 * 60 * 1000, // 7 days
    supportedFormats: ['pdf', 'png', 'jpg', 'svg', 'excel', 'csv', 'json'],
    defaultQuality: 0.9,
    defaultImageDimensions: { width: 1200, height: 800 }
  };

  // Singleton pattern
  public static getInstance(): ExportEngine {
    if (!ExportEngine.instance) {
      ExportEngine.instance = new ExportEngine();
    }
    return ExportEngine.instance;
  }

  constructor() {
    super();
    this.setMaxListeners(50);
    this.startReportScheduler();
  }

  /**
   * Export chart as image (PNG, JPG, SVG)
   */
  public async exportAsImage(
    chartElement: HTMLElement,
    options: ExportOptions
  ): Promise<ExportResult> {
    const startTime = Date.now();

    try {
      if (!['png', 'jpg', 'svg'].includes(options.format)) {
        throw new Error(`Unsupported image format: ${options.format}`);
      }

      const canvas = await this.createCanvasFromElement(chartElement, options);
      let blob: Blob;
      let filename: string;

      if (options.format === 'svg') {
        const svgData = this.createSVGFromElement(chartElement, options);
        blob = new Blob([svgData], { type: 'image/svg+xml' });
        filename = `chart_${Date.now()}.svg`;
      } else {
        const quality = options.quality || this.config.defaultQuality;
        const mimeType = options.format === 'png' ? 'image/png' : 'image/jpeg';

        blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => resolve(blob!), mimeType, quality);
        });

        filename = `chart_${Date.now()}.${options.format}`;
      }

      // Apply watermark if configured
      if (options.watermark) {
        blob = await this.applyWatermark(blob, options.watermark);
      }

      const result: ExportResult = {
        success: true,
        data: blob,
        filename,
        metadata: {
          fileSize: blob.size,
          exportTime: Date.now() - startTime,
          format: options.format
        }
      };

      this.addToHistory(result);
      this.emit('export:image:success', result);

      return result;

    } catch (error) {
      const result: ExportResult = {
        success: false,
        error: error.message
      };

      this.emit('export:image:error', result);
      return result;
    }
  }

  /**
   * Export chart as PDF
   */
  public async exportAsPDF(
    chartElements: HTMLElement[],
    options: ExportOptions & { title?: string; multiPage?: boolean }
  ): Promise<ExportResult> {
    const startTime = Date.now();

    try {
      // Dynamic import of jsPDF to avoid bundle bloat
      const jsPDF = await import('jspdf');
      const doc = new jsPDF.jsPDF({
        orientation: options.width && options.width > options.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [options.width || 1200, options.height || 800]
      });

      // Add title if provided
      if (options.title) {
        doc.setFontSize(20);
        doc.text(options.title, 40, 40);
      }

      // Process each chart element
      for (let i = 0; i < chartElements.length; i++) {
        const element = chartElements[i];

        if (i > 0 && options.multiPage) {
          doc.addPage();
        }

        const canvas = await this.createCanvasFromElement(element, options);
        const imgData = canvas.toDataURL('image/png');

        const yPosition = options.title ? 80 : 40;
        doc.addImage(imgData, 'PNG', 40, yPosition, canvas.width, canvas.height);
      }

      // Add metadata
      if (options.includeMetadata) {
        this.addPDFMetadata(doc, options);
      }

      const pdfBlob = doc.output('blob');
      const filename = `report_${Date.now()}.pdf`;

      const result: ExportResult = {
        success: true,
        data: pdfBlob,
        filename,
        metadata: {
          fileSize: pdfBlob.size,
          exportTime: Date.now() - startTime,
          format: 'pdf'
        }
      };

      this.addToHistory(result);
      this.emit('export:pdf:success', result);

      return result;

    } catch (error) {
      const result: ExportResult = {
        success: false,
        error: error.message
      };

      this.emit('export:pdf:error', result);
      return result;
    }
  }

  /**
   * Export data as Excel, CSV, or JSON
   */
  public async exportData(
    data: any[],
    options: ExportOptions & { headers?: string[]; sheetName?: string }
  ): Promise<ExportResult> {
    const startTime = Date.now();

    try {
      let blob: Blob;
      let filename: string;

      switch (options.format) {
        case 'excel':
          blob = await this.createExcelFile(data, options);
          filename = `data_${Date.now()}.xlsx`;
          break;

        case 'csv':
          const csvData = this.createCSVData(data, options.headers);
          blob = new Blob([csvData], { type: 'text/csv' });
          filename = `data_${Date.now()}.csv`;
          break;

        case 'json':
          const jsonData = JSON.stringify(data, null, 2);
          blob = new Blob([jsonData], { type: 'application/json' });
          filename = `data_${Date.now()}.json`;
          break;

        default:
          throw new Error(`Unsupported data format: ${options.format}`);
      }

      const result: ExportResult = {
        success: true,
        data: blob,
        filename,
        metadata: {
          fileSize: blob.size,
          exportTime: Date.now() - startTime,
          format: options.format
        }
      };

      this.addToHistory(result);
      this.emit('export:data:success', result);

      return result;

    } catch (error) {
      const result: ExportResult = {
        success: false,
        error: error.message
      };

      this.emit('export:data:error', result);
      return result;
    }
  }

  /**
   * Create shareable link for chart
   */
  public createShareableLink(
    chartId: string,
    accessControl: AccessControl,
    customExpiration?: Date
  ): ShareableLink {
    const id = this.generateId();
    const accessToken = this.generateAccessToken();
    const expiresAt = customExpiration || new Date(Date.now() + this.config.defaultLinkExpiration);

    const link: ShareableLink = {
      id,
      url: `${window.location.origin}/share/${id}?token=${accessToken}`,
      chartId,
      accessToken,
      expiresAt,
      accessControl,
      viewCount: 0,
      createdAt: new Date(),
      metadata: {}
    };

    this.shareableLinks.set(id, link);
    this.emit('link:created', link);

    return link;
  }

  /**
   * Validate and access shareable link
   */
  public validateShareableLink(
    linkId: string,
    accessToken?: string,
    password?: string,
    userEmail?: string
  ): { valid: boolean; link?: ShareableLink; error?: string } {
    const link = this.shareableLinks.get(linkId);

    if (!link) {
      return { valid: false, error: 'Link not found' };
    }

    if (link.expiresAt && link.expiresAt < new Date()) {
      return { valid: false, error: 'Link has expired' };
    }

    if (link.accessToken !== accessToken) {
      return { valid: false, error: 'Invalid access token' };
    }

    // Check access control
    if (!link.accessControl.isPublic) {
      if (link.accessControl.password && link.accessControl.password !== password) {
        return { valid: false, error: 'Invalid password' };
      }

      if (link.accessControl.allowedEmails?.length &&
          (!userEmail || !link.accessControl.allowedEmails.includes(userEmail))) {
        return { valid: false, error: 'Email not authorized' };
      }

      if (link.accessControl.maxViews && link.viewCount >= link.accessControl.maxViews) {
        return { valid: false, error: 'Maximum views exceeded' };
      }
    }

    // Increment view count
    link.viewCount++;
    this.emit('link:accessed', link);

    return { valid: true, link };
  }

  /**
   * Generate embed code for chart
   */
  public generateEmbedCode(linkId: string, config: EmbedConfig): string {
    const link = this.shareableLinks.get(linkId);
    if (!link) {
      throw new Error('Shareable link not found');
    }

    const embedUrl = `${window.location.origin}/embed/${linkId}`;
    const themeParam = config.theme ? `&theme=${config.theme}` : '';
    const controlsParam = config.showControls ? '&controls=true' : '';
    const refreshParam = config.autoRefresh ? `&refresh=${config.refreshInterval || 30}` : '';
    const whitelabelParam = config.whiteLabel ? '&whitelabel=true' : '';

    const embedCode = `<iframe
  src="${embedUrl}?token=${link.accessToken}${themeParam}${controlsParam}${refreshParam}${whitelabelParam}"
  width="${config.width}"
  height="${config.height}"
  frameborder="0"
  allowtransparency="true"
  ${config.customCSS ? `style="${config.customCSS}"` : ''}
></iframe>`;

    this.emit('embed:generated', { linkId, config, embedCode });

    return embedCode;
  }

  /**
   * Schedule a report
   */
  public scheduleReport(report: Omit<ScheduledReport, 'id' | 'nextRun' | 'lastRun'>): ScheduledReport {
    const id = this.generateId();
    const nextRun = this.calculateNextRun(report.frequency);

    const scheduledReport: ScheduledReport = {
      ...report,
      id,
      nextRun,
      isActive: true
    };

    this.scheduledReports.set(id, scheduledReport);
    this.emit('report:scheduled', scheduledReport);

    return scheduledReport;
  }

  /**
   * Get export history
   */
  public getExportHistory(limit: number = 50): ExportResult[] {
    return this.exportHistory.slice(-limit);
  }

  /**
   * Get shareable links
   */
  public getShareableLinks(): ShareableLink[] {
    return Array.from(this.shareableLinks.values());
  }

  /**
   * Get scheduled reports
   */
  public getScheduledReports(): ScheduledReport[] {
    return Array.from(this.scheduledReports.values());
  }

  // Private helper methods
  private async createCanvasFromElement(element: HTMLElement, options: ExportOptions): Promise<HTMLCanvasElement> {
    // Dynamic import of html2canvas to avoid bundle bloat
    const html2canvas = await import('html2canvas');

    const canvas = await html2canvas.default(element, {
      width: options.width || this.config.defaultImageDimensions.width,
      height: options.height || this.config.defaultImageDimensions.height,
      backgroundColor: options.backgroundColor || '#ffffff',
      scale: 2, // High DPI support
      useCORS: true,
      allowTaint: false
    });

    return canvas;
  }

  private createSVGFromElement(element: HTMLElement, options: ExportOptions): string {
    // Create SVG representation of the element
    const svgElement = element.querySelector('svg');
    if (!svgElement) {
      throw new Error('No SVG element found in chart');
    }

    const svgData = new XMLSerializer().serializeToString(svgElement);
    return svgData;
  }

  private async applyWatermark(blob: Blob, watermarkConfig: WatermarkConfig): Promise<Blob> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // Load the original image
    const img = new Image();
    const imgUrl = URL.createObjectURL(blob);

    return new Promise((resolve) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw the original image
        ctx.drawImage(img, 0, 0);

        // Apply watermark
        ctx.globalAlpha = watermarkConfig.opacity || 0.5;
        ctx.fillStyle = watermarkConfig.color || '#666666';
        ctx.font = `${watermarkConfig.fontSize || 16}px Arial`;

        if (watermarkConfig.text) {
          const text = watermarkConfig.text;
          const textMetrics = ctx.measureText(text);
          const { x, y } = this.getWatermarkPosition(
            watermarkConfig.position,
            canvas.width,
            canvas.height,
            textMetrics.width,
            20
          );

          ctx.fillText(text, x, y);
        }

        canvas.toBlob((watermarkedBlob) => {
          URL.revokeObjectURL(imgUrl);
          resolve(watermarkedBlob!);
        });
      };

      img.src = imgUrl;
    });
  }

  private getWatermarkPosition(
    position: string,
    canvasWidth: number,
    canvasHeight: number,
    textWidth: number,
    textHeight: number
  ): { x: number; y: number } {
    const margin = 20;

    switch (position) {
      case 'top-left':
        return { x: margin, y: margin + textHeight };
      case 'top-right':
        return { x: canvasWidth - textWidth - margin, y: margin + textHeight };
      case 'bottom-left':
        return { x: margin, y: canvasHeight - margin };
      case 'bottom-right':
        return { x: canvasWidth - textWidth - margin, y: canvasHeight - margin };
      case 'center':
        return {
          x: (canvasWidth - textWidth) / 2,
          y: (canvasHeight + textHeight) / 2
        };
      default:
        return { x: margin, y: margin + textHeight };
    }
  }

  private async createExcelFile(data: any[], options: any): Promise<Blob> {
    // Dynamic import of xlsx to avoid bundle bloat
    const XLSX = await import('xlsx');

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || 'Data');

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
      compression: options.compression
    });

    return new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  }

  private createCSVData(data: any[], headers?: string[]): string {
    if (data.length === 0) return '';

    const keys = headers || Object.keys(data[0]);
    const csvRows = [];

    // Add header row
    csvRows.push(keys.join(','));

    // Add data rows
    for (const row of data) {
      const values = keys.map(key => {
        const value = row[key];
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  private addPDFMetadata(doc: any, options: ExportOptions): void {
    const currentDate = new Date().toISOString();

    doc.setProperties({
      title: 'Chart Export',
      subject: 'Analytics Report',
      author: 'Optimizely Analytics',
      creator: 'Optimizely Export Engine',
      producer: 'Optimizely',
      creationDate: currentDate
    });

    // Add footer with timestamp
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Generated on ${currentDate} - Page ${i} of ${pageCount}`,
        40,
        doc.internal.pageSize.height - 20
      );
    }
  }

  private calculateNextRun(frequency: string): Date {
    const now = new Date();

    switch (frequency) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth;
      case 'quarterly':
        const nextQuarter = new Date(now);
        nextQuarter.setMonth(nextQuarter.getMonth() + 3);
        return nextQuarter;
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  private startReportScheduler(): void {
    this.reportScheduler = setInterval(() => {
      this.processScheduledReports();
    }, 60000); // Check every minute
  }

  private async processScheduledReports(): Promise<void> {
    const now = new Date();

    for (const [id, report] of this.scheduledReports.entries()) {
      if (report.isActive && report.nextRun <= now) {
        try {
          await this.executeScheduledReport(report);

          // Update next run time
          report.lastRun = now;
          report.nextRun = this.calculateNextRun(report.frequency);

          this.emit('report:executed', report);
        } catch (error) {
          this.emit('report:error', { report, error: error.message });
        }
      }
    }
  }

  private async executeScheduledReport(report: ScheduledReport): Promise<void> {
    // This would integrate with the chart system to generate the report
    // For now, it's a placeholder that emits an event
    this.emit('report:generate', {
      reportId: report.id,
      chartIds: report.chartIds,
      format: report.format,
      recipients: report.recipients,
      template: report.template
    });
  }

  private addToHistory(result: ExportResult): void {
    this.exportHistory.push(result);

    // Keep only last 100 exports
    if (this.exportHistory.length > 100) {
      this.exportHistory.shift();
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private generateAccessToken(): string {
    return Math.random().toString(36).substr(2, 15) + Math.random().toString(36).substr(2, 15);
  }

  /**
   * Cleanup resources
   */
  public shutdown(): void {
    if (this.reportScheduler) {
      clearInterval(this.reportScheduler);
      this.reportScheduler = null;
    }

    this.shareableLinks.clear();
    this.scheduledReports.clear();
    this.exportHistory = [];

    this.emit('engine:shutdown');
  }
}

// Create singleton instance
export const exportEngine = ExportEngine.getInstance();
