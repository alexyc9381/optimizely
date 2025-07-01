/**
 * Export Engine
 * Comprehensive system for exporting charts, dashboards, and reports in multiple formats
 * with high-quality output, customization options, and sharing capabilities.
 */

import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

// Export interfaces
export interface ExportConfig {
  format: 'pdf' | 'png' | 'jpg' | 'svg' | 'excel' | 'csv' | 'json';
  quality?: number; // 0.1 to 1.0 for image quality
  scale?: number; // Device pixel ratio for high-DPI export
  width?: number;
  height?: number;
  backgroundColor?: string;
  includeLogo?: boolean;
  watermark?: string;
  filename?: string;
  title?: string;
  subtitle?: string;
  metadata?: Record<string, any>;
}

export interface PDFExportConfig extends ExportConfig {
  format: 'pdf';
  pageSize?: 'a4' | 'a3' | 'letter' | 'legal' | 'tabloid';
  orientation?: 'portrait' | 'landscape';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  header?: {
    text: string;
    logo?: string;
    height?: number;
  };
  footer?: {
    text: string;
    includePageNumbers?: boolean;
    includeTimestamp?: boolean;
    height?: number;
  };
  multiPage?: boolean;
  pageBreaks?: number[]; // Element indices where to break pages
}

export interface ShareConfig {
  type: 'public' | 'private' | 'embedded';
  expiresAt?: Date;
  password?: string;
  allowDownload?: boolean;
  allowPrint?: boolean;
  branding?: {
    logo?: string;
    companyName?: string;
    customColors?: Record<string, string>;
    hideWatermark?: boolean;
  };
  permissions?: {
    view: boolean;
    export: boolean;
    comment: boolean;
  };
}

export interface ExportResult {
  success: boolean;
  data?: Blob | string;
  url?: string;
  shareUrl?: string;
  error?: string;
  metadata?: {
    fileSize: number;
    format: string;
    timestamp: number;
    dimensions?: { width: number; height: number };
  };
}

export interface ScheduledReport {
  id: string;
  name: string;
  description?: string;
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    time: string; // HH:MM format
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
    timezone?: string;
  };
  recipients: string[];
  config: ExportConfig;
  chartIds: string[];
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
  createdAt: Date;
  createdBy: string;
}

// Main export engine class
export class ExportEngine {
  private static instance: ExportEngine | null = null;
  private shareUrls = new Map<string, { config: ShareConfig; data: any; expiresAt?: Date }>();
  private scheduledReports = new Map<string, ScheduledReport>();
  private reportTimer: NodeJS.Timeout | null = null;

  // Singleton pattern
  public static getInstance(): ExportEngine {
    if (!ExportEngine.instance) {
      ExportEngine.instance = new ExportEngine();
    }
    return ExportEngine.instance;
  }

  constructor() {
    this.startScheduledReportsTimer();
  }

  /**
   * Export chart or dashboard element to specified format
   */
  public async exportElement(
    element: HTMLElement,
    config: ExportConfig
  ): Promise<ExportResult> {
    try {
      switch (config.format) {
        case 'pdf':
          return await this.exportToPDF(element, config as PDFExportConfig);
        case 'png':
        case 'jpg':
          return await this.exportToImage(element, config);
        case 'svg':
          return await this.exportToSVG(element, config);
        case 'excel':
        case 'csv':
        case 'json':
          return await this.exportData(element, config);
        default:
          throw new Error(`Unsupported export format: ${config.format}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      };
    }
  }

  /**
   * Export multiple charts as a PDF report
   */
  public async exportReport(
    elements: HTMLElement[],
    config: PDFExportConfig,
    reportData?: {
      title?: string;
      subtitle?: string;
      summary?: string;
      sections?: Array<{ title: string; content: string }>;
    }
  ): Promise<ExportResult> {
    try {
      const pdf = this.createPDFDocument(config);

      // Add cover page if report data provided
      if (reportData) {
        this.addCoverPage(pdf, reportData, config);
        pdf.addPage();
      }

      // Export each chart/element
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        const canvas = await html2canvas(element, {
          scale: config.scale || 2,
          backgroundColor: config.backgroundColor || '#ffffff',
          width: config.width,
          height: config.height,
          useCORS: true,
          allowTaint: true
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pdf.internal.pageSize.getWidth() -
          (config.margins?.left || 20) - (config.margins?.right || 20);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Add new page if not the first chart
        if (i > 0) {
          pdf.addPage();
        }

        // Add chart to PDF
        pdf.addImage(
          imgData,
          'PNG',
          config.margins?.left || 20,
          config.margins?.top || 20,
          imgWidth,
          imgHeight
        );

        // Add header and footer if configured
        this.addHeaderFooter(pdf, config, i + 1, elements.length);
      }

      const blob = pdf.output('blob');
      const filename = config.filename || `report-${Date.now()}.pdf`;

      return {
        success: true,
        data: blob,
        metadata: {
          fileSize: blob.size,
          format: 'pdf',
          timestamp: Date.now(),
          dimensions: {
            width: pdf.internal.pageSize.getWidth(),
            height: pdf.internal.pageSize.getHeight()
          }
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Report export failed'
      };
    }
  }

  /**
   * Create shareable link for chart or dashboard
   */
  public createShareableLink(
    data: any,
    config: ShareConfig
  ): { shareUrl: string; shareId: string } {
    const shareId = this.generateShareId();
    const shareData = {
      config,
      data,
      expiresAt: config.expiresAt
    };

    this.shareUrls.set(shareId, shareData);

    const baseUrl = typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:3000';

    const shareUrl = `${baseUrl}/shared/${shareId}`;

    return { shareUrl, shareId };
  }

  /**
   * Get shared content by share ID
   */
  public getSharedContent(shareId: string, password?: string): {
    success: boolean;
    data?: any;
    config?: ShareConfig;
    error?: string;
  } {
    const shareData = this.shareUrls.get(shareId);

    if (!shareData) {
      return { success: false, error: 'Share link not found' };
    }

    // Check expiration
    if (shareData.expiresAt && shareData.expiresAt < new Date()) {
      this.shareUrls.delete(shareId);
      return { success: false, error: 'Share link has expired' };
    }

    // Check password
    if (shareData.config.password && shareData.config.password !== password) {
      return { success: false, error: 'Invalid password' };
    }

    return {
      success: true,
      data: shareData.data,
      config: shareData.config
    };
  }

  /**
   * Generate embeddable HTML/JavaScript code
   */
  public generateEmbedCode(
    shareId: string,
    options: {
      width?: number | string;
      height?: number | string;
      responsive?: boolean;
      theme?: 'light' | 'dark';
      showControls?: boolean;
    } = {}
  ): string {
    const {
      width = '100%',
      height = '400px',
      responsive = true,
      theme = 'light',
      showControls = true
    } = options;

    const baseUrl = typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:3000';

    const embedUrl = `${baseUrl}/embed/${shareId}`;

    const iframeStyle = responsive
      ? 'width: 100%; min-height: 400px; border: 0;'
      : `width: ${width}; height: ${height}; border: 0;`;

    return `
<!-- Optimizely Chart Embed -->
<iframe
  src="${embedUrl}?theme=${theme}&controls=${showControls}"
  style="${iframeStyle}"
  frameborder="0"
  allowtransparency="true"
  scrolling="no">
</iframe>
<div style="text-align: center; margin-top: 8px; font-size: 12px; color: #666;">
  <a href="${embedUrl}" target="_blank" style="text-decoration: none; color: #0066cc;">
    Powered by Optimizely Analytics
  </a>
</div>`.trim();
  }

  /**
   * Schedule automated report
   */
  public scheduleReport(report: Omit<ScheduledReport, 'id' | 'createdAt'>): string {
    const reportId = this.generateReportId();
    const scheduledReport: ScheduledReport = {
      ...report,
      id: reportId,
      createdAt: new Date(),
      nextRun: this.calculateNextRun(report.schedule)
    };

    this.scheduledReports.set(reportId, scheduledReport);

    return reportId;
  }

  /**
   * Get scheduled report by ID
   */
  public getScheduledReport(reportId: string): ScheduledReport | null {
    return this.scheduledReports.get(reportId) || null;
  }

  /**
   * Update scheduled report
   */
  public updateScheduledReport(
    reportId: string,
    updates: Partial<ScheduledReport>
  ): boolean {
    const report = this.scheduledReports.get(reportId);
    if (!report) return false;

    const updatedReport = { ...report, ...updates };
    if (updates.schedule) {
      updatedReport.nextRun = this.calculateNextRun(updates.schedule);
    }

    this.scheduledReports.set(reportId, updatedReport);
    return true;
  }

  /**
   * Delete scheduled report
   */
  public deleteScheduledReport(reportId: string): boolean {
    return this.scheduledReports.delete(reportId);
  }

  /**
   * Get all scheduled reports
   */
  public getScheduledReports(): ScheduledReport[] {
    return Array.from(this.scheduledReports.values());
  }

  /**
   * Download file with browser save dialog
   */
  public downloadFile(blob: Blob, filename: string): void {
    saveAs(blob, filename);
  }

  // Private methods

  private async exportToPDF(
    element: HTMLElement,
    config: PDFExportConfig
  ): Promise<ExportResult> {
    const canvas = await html2canvas(element, {
      scale: config.scale || 2,
      backgroundColor: config.backgroundColor || '#ffffff',
      width: config.width,
      height: config.height,
      useCORS: true,
      allowTaint: true
    });

    const pdf = this.createPDFDocument(config);
    const imgData = canvas.toDataURL('image/png');

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margins = config.margins || { top: 20, right: 20, bottom: 20, left: 20 };

    const availableWidth = pdfWidth - margins.left - margins.right;
    const availableHeight = pdfHeight - margins.top - margins.bottom;

    const imgWidth = availableWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Add header and footer space if configured
    const headerHeight = config.header?.height || 0;
    const footerHeight = config.footer?.height || 0;
    const contentHeight = availableHeight - headerHeight - footerHeight;

    // Check if image fits on one page
    if (imgHeight <= contentHeight) {
      pdf.addImage(
        imgData,
        'PNG',
        margins.left,
        margins.top + headerHeight,
        imgWidth,
        imgHeight
      );
    } else {
      // Split into multiple pages
      const ratio = imgWidth / canvas.width;
      const pageHeight = contentHeight / ratio;
      let sourceY = 0;

      while (sourceY < canvas.height) {
        const sourceHeight = Math.min(pageHeight, canvas.height - sourceY);
        const destHeight = sourceHeight * ratio;

        if (sourceY > 0) {
          pdf.addPage();
        }

        pdf.addImage(
          imgData,
          'PNG',
          margins.left,
          margins.top + headerHeight,
          imgWidth,
          destHeight,
          undefined,
          'FAST',
          0,
          -sourceY * ratio
        );

        sourceY += pageHeight;
      }
    }

    // Add header and footer
    this.addHeaderFooter(pdf, config);

    const blob = pdf.output('blob');
    const filename = config.filename || `export-${Date.now()}.pdf`;

    return {
      success: true,
      data: blob,
      metadata: {
        fileSize: blob.size,
        format: 'pdf',
        timestamp: Date.now(),
        dimensions: { width: pdfWidth, height: pdfHeight }
      }
    };
  }

  private async exportToImage(
    element: HTMLElement,
    config: ExportConfig
  ): Promise<ExportResult> {
    const canvas = await html2canvas(element, {
      scale: config.scale || 2,
      backgroundColor: config.backgroundColor || '#ffffff',
      width: config.width,
      height: config.height,
      useCORS: true,
      allowTaint: true
    });

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({
              success: false,
              error: 'Failed to generate image blob'
            });
            return;
          }

          const filename = config.filename ||
            `export-${Date.now()}.${config.format}`;

          resolve({
            success: true,
            data: blob,
            metadata: {
              fileSize: blob.size,
              format: config.format,
              timestamp: Date.now(),
              dimensions: { width: canvas.width, height: canvas.height }
            }
          });
        },
        `image/${config.format}`,
        config.quality || 0.9
      );
    });
  }

  private async exportToSVG(
    element: HTMLElement,
    config: ExportConfig
  ): Promise<ExportResult> {
    // This is a simplified SVG export - in a real implementation,
    // you'd want to use a library like svg-crowbar or implement
    // proper SVG serialization
    const svgData = new XMLSerializer().serializeToString(element);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const filename = config.filename || `export-${Date.now()}.svg`;

    return {
      success: true,
      data: blob,
      metadata: {
        fileSize: blob.size,
        format: 'svg',
        timestamp: Date.now()
      }
    };
  }

  private async exportData(
    element: HTMLElement,
    config: ExportConfig
  ): Promise<ExportResult> {
    // Extract data from chart element (this would need to be implemented
    // based on your specific chart library's data access methods)
    const data = this.extractChartData(element);

    let blob: Blob;
    let filename: string;

    switch (config.format) {
      case 'excel':
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Chart Data');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        blob = new Blob([excelBuffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        filename = config.filename || `export-${Date.now()}.xlsx`;
        break;

      case 'csv':
        const csvContent = this.jsonToCSV(data);
        blob = new Blob([csvContent], { type: 'text/csv' });
        filename = config.filename || `export-${Date.now()}.csv`;
        break;

      case 'json':
        const jsonContent = JSON.stringify(data, null, 2);
        blob = new Blob([jsonContent], { type: 'application/json' });
        filename = config.filename || `export-${Date.now()}.json`;
        break;

      default:
        throw new Error(`Unsupported data format: ${config.format}`);
    }

    return {
      success: true,
      data: blob,
      metadata: {
        fileSize: blob.size,
        format: config.format,
        timestamp: Date.now()
      }
    };
  }

  private createPDFDocument(config: PDFExportConfig): jsPDF {
    const orientation = config.orientation || 'portrait';
    const pageSize = config.pageSize || 'a4';

    return new jsPDF({
      orientation,
      unit: 'mm',
      format: pageSize
    });
  }

  private addCoverPage(
    pdf: jsPDF,
    reportData: any,
    config: PDFExportConfig
  ): void {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;

    // Add title
    if (reportData.title) {
      pdf.setFontSize(24);
      pdf.setFont(undefined, 'bold');
      pdf.text(reportData.title, centerX, 50, { align: 'center' });
    }

    // Add subtitle
    if (reportData.subtitle) {
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'normal');
      pdf.text(reportData.subtitle, centerX, 70, { align: 'center' });
    }

    // Add summary
    if (reportData.summary) {
      pdf.setFontSize(12);
      const lines = pdf.splitTextToSize(reportData.summary, pageWidth - 40);
      pdf.text(lines, 20, 100);
    }

    // Add timestamp
    pdf.setFontSize(10);
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, 20, pdf.internal.pageSize.getHeight() - 20);
  }

  private addHeaderFooter(
    pdf: jsPDF,
    config: PDFExportConfig,
    pageNumber?: number,
    totalPages?: number
  ): void {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Add header
    if (config.header) {
      pdf.setFontSize(10);
      pdf.text(config.header.text, 20, 15);
    }

    // Add footer
    if (config.footer) {
      const footerY = pageHeight - 10;
      pdf.setFontSize(8);

      if (config.footer.text) {
        pdf.text(config.footer.text, 20, footerY);
      }

      if (config.footer.includePageNumbers && pageNumber && totalPages) {
        pdf.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - 20, footerY, { align: 'right' });
      }

      if (config.footer.includeTimestamp) {
        const timestamp = new Date().toLocaleString();
        pdf.text(timestamp, pageWidth / 2, footerY, { align: 'center' });
      }
    }
  }

  private extractChartData(element: HTMLElement): any[] {
    // This is a placeholder implementation
    // In a real scenario, you'd extract data from your chart library
    const dataAttribute = element.getAttribute('data-chart-data');
    if (dataAttribute) {
      try {
        return JSON.parse(dataAttribute);
      } catch {
        // Fallback to empty array
      }
    }

    return [];
  }

  private jsonToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  private generateShareId(): string {
    return `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateNextRun(schedule: ScheduledReport['schedule']): Date {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);

    const nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);

    switch (schedule.frequency) {
      case 'daily':
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;

      case 'weekly':
        const dayOfWeek = schedule.dayOfWeek || 0;
        const daysUntilNextRun = (dayOfWeek - nextRun.getDay() + 7) % 7;
        if (daysUntilNextRun === 0 && nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 7);
        } else {
          nextRun.setDate(nextRun.getDate() + daysUntilNextRun);
        }
        break;

      case 'monthly':
        const dayOfMonth = schedule.dayOfMonth || 1;
        nextRun.setDate(dayOfMonth);
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        break;

      case 'quarterly':
        const currentQuarter = Math.floor(nextRun.getMonth() / 3);
        const nextQuarterStart = new Date(nextRun.getFullYear(), currentQuarter * 3 + 3, 1);
        nextRun.setTime(nextQuarterStart.getTime());
        break;
    }

    return nextRun;
  }

  private startScheduledReportsTimer(): void {
    // Check for scheduled reports every minute
    this.reportTimer = setInterval(() => {
      this.processScheduledReports();
    }, 60000);
  }

  private processScheduledReports(): void {
    const now = new Date();

    for (const [reportId, report] of this.scheduledReports.entries()) {
      if (
        report.isActive &&
        report.nextRun &&
        report.nextRun <= now
      ) {
        this.executeScheduledReport(report);
      }
    }
  }

  private async executeScheduledReport(report: ScheduledReport): Promise<void> {
    try {
      console.log(`Executing scheduled report: ${report.name}`);

      // Update last run and calculate next run
      report.lastRun = new Date();
      report.nextRun = this.calculateNextRun(report.schedule);

      // In a real implementation, you would:
      // 1. Gather the chart elements based on report.chartIds
      // 2. Generate the report using exportReport()
      // 3. Send the report to recipients via email/notification service

      console.log(`Scheduled report ${report.name} executed successfully`);

    } catch (error) {
      console.error(`Failed to execute scheduled report ${report.name}:`, error);
    }
  }

  /**
   * Cleanup resources
   */
  public shutdown(): void {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = null;
    }

    // Clear expired share URLs
    for (const [shareId, shareData] of this.shareUrls.entries()) {
      if (shareData.expiresAt && shareData.expiresAt < new Date()) {
        this.shareUrls.delete(shareId);
      }
    }
  }
}

// Export singleton instance
export const exportEngine = ExportEngine.getInstance();
