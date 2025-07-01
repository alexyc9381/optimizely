/**
 * Export System Example
 * Comprehensive demonstration of export, sharing, and reporting functionality.
 * Shows all features including PDF export, image export, data export,
 * shareable links, embed codes, and scheduled reports.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
    ExportControls,
    ReportScheduler
} from '../components/ExportControls';
import {
    ScheduledReport,
    ShareableLink,
    exportEngine
} from '../ExportEngine';
import './ExportControls.css';

// Mock chart components for demonstration
const LineChart: React.FC<{ data: any[]; title: string }> = ({ data, title }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartRef.current) {
      // Mock chart rendering
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 400;
      const ctx = canvas.getContext('2d')!;

      // Draw mock line chart
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, 600, 400);

      ctx.strokeStyle = '#007bff';
      ctx.lineWidth = 2;
      ctx.beginPath();

      data.forEach((point, index) => {
        const x = (index / (data.length - 1)) * 500 + 50;
        const y = 350 - (point.value / 100) * 300;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Add title
      ctx.fillStyle = '#333';
      ctx.font = '16px Arial';
      ctx.fillText(title, 50, 30);

      chartRef.current.innerHTML = '';
      chartRef.current.appendChild(canvas);
    }
  }, [data, title]);

  return <div ref={chartRef} className="chart-container" />;
};

const BarChart: React.FC<{ data: any[]; title: string }> = ({ data, title }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartRef.current) {
      // Mock chart rendering
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 400;
      const ctx = canvas.getContext('2d')!;

      // Draw mock bar chart
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, 600, 400);

      const barWidth = 400 / data.length;

      data.forEach((point, index) => {
        const x = index * barWidth + 50;
        const height = (point.value / 100) * 300;
        const y = 350 - height;

        ctx.fillStyle = '#28a745';
        ctx.fillRect(x, y, barWidth - 10, height);

        // Add labels
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.fillText(point.label, x, 370);
      });

      // Add title
      ctx.fillStyle = '#333';
      ctx.font = '16px Arial';
      ctx.fillText(title, 50, 30);

      chartRef.current.innerHTML = '';
      chartRef.current.appendChild(canvas);
    }
  }, [data, title]);

  return <div ref={chartRef} className="chart-container" />;
};

// Main example component
export const ExportExample: React.FC = () => {
  const [selectedChart, setSelectedChart] = useState<'line' | 'bar'>('line');
  const [exportHistory, setExportHistory] = useState<any[]>([]);
  const [shareableLinks, setShareableLinks] = useState<ShareableLink[]>([]);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);

  const lineChartRef = useRef<HTMLDivElement>(null);
  const barChartRef = useRef<HTMLDivElement>(null);

  // Mock data for demonstrations
  const lineData = [
    { label: 'Jan', value: 65 },
    { label: 'Feb', value: 75 },
    { label: 'Mar', value: 85 },
    { label: 'Apr', value: 78 },
    { label: 'May', value: 90 },
    { label: 'Jun', value: 95 }
  ];

  const barData = [
    { label: 'Product A', value: 80 },
    { label: 'Product B', value: 65 },
    { label: 'Product C', value: 90 },
    { label: 'Product D', value: 75 }
  ];

  const tableData = [
    { month: 'January', conversions: 150, revenue: 15000, ctr: 2.5 },
    { month: 'February', conversions: 180, revenue: 18500, ctr: 2.8 },
    { month: 'March', conversions: 200, revenue: 22000, ctr: 3.1 },
    { month: 'April', conversions: 175, revenue: 19500, ctr: 2.9 },
    { month: 'May', conversions: 220, revenue: 25000, ctr: 3.3 },
    { month: 'June', conversions: 240, revenue: 28000, ctr: 3.5 }
  ];

  // Event handlers
  const handleExportStart = () => {
    addNotification('Export started...');
  };

  const handleExportComplete = (result: any) => {
    setExportHistory(prev => [result, ...prev.slice(0, 9)]);
    addNotification(`Export completed: ${result.filename}`);
  };

  const handleExportError = (error: string) => {
    addNotification(`Export failed: ${error}`);
  };

  const handleLinkCreated = (link: ShareableLink) => {
    setShareableLinks(prev => [link, ...prev]);
    addNotification(`Shareable link created: ${link.id}`);
  };

  const handleReportScheduled = (report: ScheduledReport) => {
    setScheduledReports(prev => [report, ...prev]);
    addNotification(`Report scheduled: ${report.name}`);
  };

  const addNotification = (message: string) => {
    setNotifications(prev => [message, ...prev.slice(0, 4)]);
    setTimeout(() => {
      setNotifications(prev => prev.slice(0, -1));
    }, 5000);
  };

  // Get current chart element
  const getCurrentChartElement = (): HTMLElement | null => {
    if (selectedChart === 'line') {
      return lineChartRef.current?.querySelector('canvas') || null;
    } else {
      return barChartRef.current?.querySelector('canvas') || null;
    }
  };

  const getCurrentData = () => {
    return selectedChart === 'line' ? lineData : barData;
  };

  useEffect(() => {
    // Set up export engine event listeners
    const handleEngineEvent = (event: string, data: any) => {
      console.log(`Export Engine Event: ${event}`, data);
    };

    exportEngine.on('export:image:success', (data) => handleEngineEvent('image:success', data));
    exportEngine.on('export:pdf:success', (data) => handleEngineEvent('pdf:success', data));
    exportEngine.on('export:data:success', (data) => handleEngineEvent('data:success', data));
    exportEngine.on('link:created', (data) => handleEngineEvent('link:created', data));
    exportEngine.on('report:scheduled', (data) => handleEngineEvent('report:scheduled', data));

    return () => {
      exportEngine.removeAllListeners();
    };
  }, []);

  return (
    <div className="export-example">
      <div className="container mx-auto p-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Export & Sharing System Demo
          </h1>
          <p className="text-gray-600">
            Comprehensive demonstration of chart export, sharing, and reporting functionality.
            Test all export formats, create shareable links, generate embed codes, and schedule reports.
          </p>
        </header>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="notifications mb-6">
            {notifications.map((notification, index) => (
              <div
                key={index}
                className="notification bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-md mb-2"
              >
                {notification}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Display */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Sample Charts
                </h2>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setSelectedChart('line')}
                    className={`px-4 py-2 rounded-md ${
                      selectedChart === 'line'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Line Chart
                  </button>
                  <button
                    onClick={() => setSelectedChart('bar')}
                    className={`px-4 py-2 rounded-md ${
                      selectedChart === 'bar'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Bar Chart
                  </button>
                </div>
              </div>

              <div className="chart-display">
                {selectedChart === 'line' && (
                  <div ref={lineChartRef}>
                    <LineChart data={lineData} title="Monthly Performance Trends" />
                  </div>
                )}

                {selectedChart === 'bar' && (
                  <div ref={barChartRef}>
                    <BarChart data={barData} title="Product Performance Comparison" />
                  </div>
                )}
              </div>

              {/* Data Table */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Sample Data Table
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">
                          Month
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">
                          Conversions
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">
                          Revenue
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">
                          CTR (%)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((row, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="px-4 py-2 text-sm text-gray-900">{row.month}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{row.conversions}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">${row.revenue.toLocaleString()}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{row.ctr}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Export Controls */}
          <div className="space-y-6">
            <ExportControls
              chartElement={getCurrentChartElement()}
              chartId={`chart-${selectedChart}`}
              data={tableData}
              onExportStart={handleExportStart}
              onExportComplete={handleExportComplete}
              onExportError={handleExportError}
            />

            {/* Report Scheduler */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <ReportScheduler
                chartIds={['chart-line', 'chart-bar']}
                onReportScheduled={handleReportScheduled}
              />
            </div>
          </div>
        </div>

        {/* Export History */}
        {exportHistory.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Export History
            </h3>
            <div className="space-y-3">
              {exportHistory.map((export_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`file-icon ${export_.metadata?.format || 'image'}`}>
                      {export_.metadata?.format?.toUpperCase().slice(0, 3) || 'IMG'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {export_.filename}
                      </p>
                      <p className="text-xs text-gray-500">
                        {export_.metadata?.fileSize &&
                          `${(export_.metadata.fileSize / 1024).toFixed(1)} KB`}
                        {export_.metadata?.exportTime &&
                          ` • ${export_.metadata.exportTime}ms`}
                      </p>
                    </div>
                  </div>
                  <div className={`status-indicator ${export_.success ? 'success' : 'error'}`}>
                    {export_.success ? 'Success' : 'Failed'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shareable Links */}
        {shareableLinks.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Shareable Links
            </h3>
            <div className="space-y-3">
              {shareableLinks.map((link, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Chart: {link.chartId}
                    </p>
                    <p className="text-xs text-gray-500">
                      Created: {link.createdAt.toLocaleDateString()} •
                      Views: {link.viewCount} •
                      {link.accessControl.isPublic ? 'Public' : 'Private'}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(link.url)}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scheduled Reports */}
        {scheduledReports.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Scheduled Reports
            </h3>
            <div className="space-y-3">
              {scheduledReports.map((report, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {report.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {report.frequency} • {report.format.toUpperCase()} •
                      Next: {report.nextRun.toLocaleDateString()} •
                      Recipients: {report.recipients.length}
                    </p>
                  </div>
                  <div className={`status-indicator ${report.isActive ? 'success' : 'error'}`}>
                    {report.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Technical Features */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Technical Features Demonstrated
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-md">
              <h4 className="font-medium text-gray-900 mb-2">Export Formats</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• PNG/JPG/SVG Images</li>
                <li>• PDF Reports</li>
                <li>• Excel Spreadsheets</li>
                <li>• CSV Data Files</li>
                <li>• JSON Data Export</li>
              </ul>
            </div>

            <div className="bg-white p-4 rounded-md">
              <h4 className="font-medium text-gray-900 mb-2">Sharing Features</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Shareable Links</li>
                <li>• Access Control</li>
                <li>• Password Protection</li>
                <li>• Expiration Dates</li>
                <li>• View Tracking</li>
              </ul>
            </div>

            <div className="bg-white p-4 rounded-md">
              <h4 className="font-medium text-gray-900 mb-2">Embed Options</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Responsive iFrames</li>
                <li>• Theme Selection</li>
                <li>• Auto Refresh</li>
                <li>• White Label Mode</li>
                <li>• Custom Styling</li>
              </ul>
            </div>

            <div className="bg-white p-4 rounded-md">
              <h4 className="font-medium text-gray-900 mb-2">Reporting</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Scheduled Reports</li>
                <li>• Multiple Recipients</li>
                <li>• Custom Templates</li>
                <li>• Frequency Options</li>
                <li>• Email Integration</li>
              </ul>
            </div>

            <div className="bg-white p-4 rounded-md">
              <h4 className="font-medium text-gray-900 mb-2">Advanced Features</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Watermark Support</li>
                <li>• High DPI Export</li>
                <li>• Compression Options</li>
                <li>• Metadata Inclusion</li>
                <li>• Progress Tracking</li>
              </ul>
            </div>

            <div className="bg-white p-4 rounded-md">
              <h4 className="font-medium text-gray-900 mb-2">Performance</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Dynamic Imports</li>
                <li>• Bundle Optimization</li>
                <li>• Memory Management</li>
                <li>• Error Handling</li>
                <li>• Event-Driven Architecture</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .chart-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 400px;
          background: #f8f9fa;
          border-radius: 8px;
          margin: 16px 0;
        }

        .chart-container canvas {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .notification {
          animation: slideInDown 0.3s ease-out;
        }

        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ExportExample;
