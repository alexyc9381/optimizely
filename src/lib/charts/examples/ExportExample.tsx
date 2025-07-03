/**
 * Export System Example
 * Comprehensive demonstration of export, sharing, and reporting functionality.
 * Shows all features including PDF export, image export, data export,
 * shareable links, embed codes, and scheduled reports.
 */

import React, { useEffect, useRef, useState } from 'react';
import { ExportControls, ReportScheduler } from '../components/ExportControls';
import { ScheduledReport, ShareableLink, exportEngine } from '../ExportEngine';
import './ExportControls.css';

// Mock chart components for demonstration
const LineChart: React.FC<{ data: any[]; title: string }> = ({
  data,
  title,
}) => {
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

  return <div ref={chartRef} className='chart-container' data-oid='ix7r_zo' />;
};

const BarChart: React.FC<{ data: any[]; title: string }> = ({
  data,
  title,
}) => {
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

  return <div ref={chartRef} className='chart-container' data-oid='pq99x3j' />;
};

// Main example component
export const ExportExample: React.FC = () => {
  const [selectedChart, setSelectedChart] = useState<'line' | 'bar'>('line');
  const [exportHistory, setExportHistory] = useState<any[]>([]);
  const [shareableLinks, setShareableLinks] = useState<ShareableLink[]>([]);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>(
    []
  );
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
    { label: 'Jun', value: 95 },
  ];

  const barData = [
    { label: 'Product A', value: 80 },
    { label: 'Product B', value: 65 },
    { label: 'Product C', value: 90 },
    { label: 'Product D', value: 75 },
  ];

  const tableData = [
    { month: 'January', conversions: 150, revenue: 15000, ctr: 2.5 },
    { month: 'February', conversions: 180, revenue: 18500, ctr: 2.8 },
    { month: 'March', conversions: 200, revenue: 22000, ctr: 3.1 },
    { month: 'April', conversions: 175, revenue: 19500, ctr: 2.9 },
    { month: 'May', conversions: 220, revenue: 25000, ctr: 3.3 },
    { month: 'June', conversions: 240, revenue: 28000, ctr: 3.5 },
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

    exportEngine.on('export:image:success', data =>
      handleEngineEvent('image:success', data)
    );
    exportEngine.on('export:pdf:success', data =>
      handleEngineEvent('pdf:success', data)
    );
    exportEngine.on('export:data:success', data =>
      handleEngineEvent('data:success', data)
    );
    exportEngine.on('link:created', data =>
      handleEngineEvent('link:created', data)
    );
    exportEngine.on('report:scheduled', data =>
      handleEngineEvent('report:scheduled', data)
    );

    return () => {
      exportEngine.removeAllListeners();
    };
  }, []);

  return (
    <div className='export-example' data-oid='8-ygt5j'>
      <div className='container mx-auto p-6' data-oid=':rdamrx'>
        <header className='mb-8' data-oid='yoecezy'>
          <h1
            className='text-3xl font-bold text-gray-900 mb-2'
            data-oid='gyvmay7'
          >
            Export & Sharing System Demo
          </h1>
          <p className='text-gray-600' data-oid='dffz0dr'>
            Comprehensive demonstration of chart export, sharing, and reporting
            functionality. Test all export formats, create shareable links,
            generate embed codes, and schedule reports.
          </p>
        </header>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className='notifications mb-6' data-oid='hotj9yg'>
            {notifications.map((notification, index) => (
              <div
                key={index}
                className='notification bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-md mb-2'
                data-oid='8frj2j-'
              >
                {notification}
              </div>
            ))}
          </div>
        )}

        <div
          className='grid grid-cols-1 lg:grid-cols-3 gap-6'
          data-oid='u7ikqsn'
        >
          {/* Chart Display */}
          <div className='lg:col-span-2' data-oid='cbfgmgl'>
            <div
              className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'
              data-oid='r-tuja-'
            >
              <div className='mb-4' data-oid='7.:56hq'>
                <h2
                  className='text-xl font-semibold text-gray-900 mb-2'
                  data-oid='dod:9pg'
                >
                  Sample Charts
                </h2>
                <div className='flex space-x-4' data-oid='nu3t4io'>
                  <button
                    onClick={() => setSelectedChart('line')}
                    className={`px-4 py-2 rounded-md ${
                      selectedChart === 'line'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    data-oid='9-ivm.p'
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
                    data-oid='5bbief9'
                  >
                    Bar Chart
                  </button>
                </div>
              </div>

              <div className='chart-display' data-oid='v.:3_kw'>
                {selectedChart === 'line' && (
                  <div ref={lineChartRef} data-oid='yd5e46x'>
                    <LineChart
                      data={lineData}
                      title='Monthly Performance Trends'
                      data-oid='33lz3zx'
                    />
                  </div>
                )}

                {selectedChart === 'bar' && (
                  <div ref={barChartRef} data-oid='4z1p.b0'>
                    <BarChart
                      data={barData}
                      title='Product Performance Comparison'
                      data-oid='7w-w5je'
                    />
                  </div>
                )}
              </div>

              {/* Data Table */}
              <div className='mt-6' data-oid='jcrnl.a'>
                <h3
                  className='text-lg font-semibold text-gray-900 mb-3'
                  data-oid='r9y_yqn'
                >
                  Sample Data Table
                </h3>
                <div className='overflow-x-auto' data-oid='jlv:5sd'>
                  <table
                    className='min-w-full border border-gray-200 rounded-lg'
                    data-oid='g62ygdd'
                  >
                    <thead className='bg-gray-50' data-oid='8:.uf6b'>
                      <tr data-oid='xasvhq9'>
                        <th
                          className='px-4 py-2 text-left text-sm font-medium text-gray-700 border-b'
                          data-oid='o4ol.dd'
                        >
                          Month
                        </th>
                        <th
                          className='px-4 py-2 text-left text-sm font-medium text-gray-700 border-b'
                          data-oid='2pflhvl'
                        >
                          Conversions
                        </th>
                        <th
                          className='px-4 py-2 text-left text-sm font-medium text-gray-700 border-b'
                          data-oid='yq:5zmb'
                        >
                          Revenue
                        </th>
                        <th
                          className='px-4 py-2 text-left text-sm font-medium text-gray-700 border-b'
                          data-oid='-wyki3j'
                        >
                          CTR (%)
                        </th>
                      </tr>
                    </thead>
                    <tbody data-oid='w_kykhh'>
                      {tableData.map((row, index) => (
                        <tr
                          key={index}
                          className='border-b border-gray-100'
                          data-oid='y.moiru'
                        >
                          <td
                            className='px-4 py-2 text-sm text-gray-900'
                            data-oid='8vmkc7w'
                          >
                            {row.month}
                          </td>
                          <td
                            className='px-4 py-2 text-sm text-gray-900'
                            data-oid='pv56ni4'
                          >
                            {row.conversions}
                          </td>
                          <td
                            className='px-4 py-2 text-sm text-gray-900'
                            data-oid='bet9702'
                          >
                            ${row.revenue.toLocaleString()}
                          </td>
                          <td
                            className='px-4 py-2 text-sm text-gray-900'
                            data-oid='ee4nf_n'
                          >
                            {row.ctr}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Export Controls */}
          <div className='space-y-6' data-oid='89cq5l0'>
            <ExportControls
              chartElement={getCurrentChartElement()}
              chartId={`chart-${selectedChart}`}
              data={tableData}
              onExportStart={handleExportStart}
              onExportComplete={handleExportComplete}
              onExportError={handleExportError}
              data-oid='289lsyl'
            />

            {/* Report Scheduler */}
            <div
              className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'
              data-oid='n_l3kod'
            >
              <ReportScheduler
                chartIds={['chart-line', 'chart-bar']}
                onReportScheduled={handleReportScheduled}
                data-oid='089_uxf'
              />
            </div>
          </div>
        </div>

        {/* Export History */}
        {exportHistory.length > 0 && (
          <div
            className='mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6'
            data-oid='1fvidg0'
          >
            <h3
              className='text-lg font-semibold text-gray-900 mb-4'
              data-oid='8mb2wie'
            >
              Export History
            </h3>
            <div className='space-y-3' data-oid='fcdd2_l'>
              {exportHistory.map((export_, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between p-3 bg-gray-50 rounded-md'
                  data-oid='-yi9oyv'
                >
                  <div
                    className='flex items-center space-x-3'
                    data-oid='p3lu1.-'
                  >
                    <div
                      className={`file-icon ${export_.metadata?.format || 'image'}`}
                      data-oid=':xd_h-f'
                    >
                      {export_.metadata?.format?.toUpperCase().slice(0, 3) ||
                        'IMG'}
                    </div>
                    <div data-oid='9t9dspw'>
                      <p
                        className='text-sm font-medium text-gray-900'
                        data-oid='dw0qsxb'
                      >
                        {export_.filename}
                      </p>
                      <p className='text-xs text-gray-500' data-oid='c:khwyg'>
                        {export_.metadata?.fileSize &&
                          `${(export_.metadata.fileSize / 1024).toFixed(1)} KB`}
                        {export_.metadata?.exportTime &&
                          ` • ${export_.metadata.exportTime}ms`}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`status-indicator ${export_.success ? 'success' : 'error'}`}
                    data-oid='.9nybgn'
                  >
                    {export_.success ? 'Success' : 'Failed'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shareable Links */}
        {shareableLinks.length > 0 && (
          <div
            className='mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6'
            data-oid='uxm:nbt'
          >
            <h3
              className='text-lg font-semibold text-gray-900 mb-4'
              data-oid='d78w.2s'
            >
              Shareable Links
            </h3>
            <div className='space-y-3' data-oid='wp8409a'>
              {shareableLinks.map((link, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between p-3 bg-gray-50 rounded-md'
                  data-oid='uf3.fwy'
                >
                  <div data-oid='y.642fa'>
                    <p
                      className='text-sm font-medium text-gray-900'
                      data-oid='713flih'
                    >
                      Chart: {link.chartId}
                    </p>
                    <p className='text-xs text-gray-500' data-oid='l-7r9kn'>
                      Created: {link.createdAt.toLocaleDateString()} • Views:{' '}
                      {link.viewCount} •
                      {link.accessControl.isPublic ? 'Public' : 'Private'}
                    </p>
                  </div>
                  <div className='flex space-x-2' data-oid='y69kzsz'>
                    <button
                      onClick={() => navigator.clipboard.writeText(link.url)}
                      className='px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700'
                      data-oid='-6wjlx2'
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
          <div
            className='mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6'
            data-oid='.i0lx7u'
          >
            <h3
              className='text-lg font-semibold text-gray-900 mb-4'
              data-oid='9tmla:_'
            >
              Scheduled Reports
            </h3>
            <div className='space-y-3' data-oid='6mg6nlh'>
              {scheduledReports.map((report, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between p-3 bg-gray-50 rounded-md'
                  data-oid='r7dyg14'
                >
                  <div data-oid='88ak20u'>
                    <p
                      className='text-sm font-medium text-gray-900'
                      data-oid='agoq2r5'
                    >
                      {report.name}
                    </p>
                    <p className='text-xs text-gray-500' data-oid='vp4lpso'>
                      {report.frequency} • {report.format.toUpperCase()} • Next:{' '}
                      {report.nextRun.toLocaleDateString()} • Recipients:{' '}
                      {report.recipients.length}
                    </p>
                  </div>
                  <div
                    className={`status-indicator ${report.isActive ? 'success' : 'error'}`}
                    data-oid='hyhggh-'
                  >
                    {report.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Technical Features */}
        <div className='mt-8 bg-gray-50 rounded-lg p-6' data-oid='lyqir87'>
          <h3
            className='text-lg font-semibold text-gray-900 mb-4'
            data-oid='rqkw-zq'
          >
            Technical Features Demonstrated
          </h3>
          <div
            className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            data-oid='fqz9yf-'
          >
            <div className='bg-white p-4 rounded-md' data-oid='3p6.._8'>
              <h4 className='font-medium text-gray-900 mb-2' data-oid='2c3j6.6'>
                Export Formats
              </h4>
              <ul
                className='text-sm text-gray-600 space-y-1'
                data-oid='vauqoxd'
              >
                <li data-oid='hu._vgz'>• PNG/JPG/SVG Images</li>
                <li data-oid='ryi::kk'>• PDF Reports</li>
                <li data-oid='k5.-jph'>• Excel Spreadsheets</li>
                <li data-oid='92zjnbl'>• CSV Data Files</li>
                <li data-oid='m88un1s'>• JSON Data Export</li>
              </ul>
            </div>

            <div className='bg-white p-4 rounded-md' data-oid='h1v5gb-'>
              <h4 className='font-medium text-gray-900 mb-2' data-oid='qgk23c7'>
                Sharing Features
              </h4>
              <ul
                className='text-sm text-gray-600 space-y-1'
                data-oid='p0rq-0p'
              >
                <li data-oid='84hh0g5'>• Shareable Links</li>
                <li data-oid='owg14sg'>• Access Control</li>
                <li data-oid='zv-rpzm'>• Password Protection</li>
                <li data-oid='7s2y1dz'>• Expiration Dates</li>
                <li data-oid='3.xz0of'>• View Tracking</li>
              </ul>
            </div>

            <div className='bg-white p-4 rounded-md' data-oid='hf5q4z8'>
              <h4 className='font-medium text-gray-900 mb-2' data-oid='j1p4s6z'>
                Embed Options
              </h4>
              <ul
                className='text-sm text-gray-600 space-y-1'
                data-oid='60.tq36'
              >
                <li data-oid='rvoau3e'>• Responsive iFrames</li>
                <li data-oid='jry9k8n'>• Theme Selection</li>
                <li data-oid='67a88zm'>• Auto Refresh</li>
                <li data-oid='68w9gvw'>• White Label Mode</li>
                <li data-oid='u2:t7cd'>• Custom Styling</li>
              </ul>
            </div>

            <div className='bg-white p-4 rounded-md' data-oid='8jhyuqc'>
              <h4 className='font-medium text-gray-900 mb-2' data-oid='tz-:uaw'>
                Reporting
              </h4>
              <ul
                className='text-sm text-gray-600 space-y-1'
                data-oid='8d5j1le'
              >
                <li data-oid='reuhidc'>• Scheduled Reports</li>
                <li data-oid='6bgy5:v'>• Multiple Recipients</li>
                <li data-oid='r.f0t.r'>• Custom Templates</li>
                <li data-oid='htkfqrr'>• Frequency Options</li>
                <li data-oid='2a3h7e3'>• Email Integration</li>
              </ul>
            </div>

            <div className='bg-white p-4 rounded-md' data-oid='dpafo05'>
              <h4 className='font-medium text-gray-900 mb-2' data-oid='4gko-x.'>
                Advanced Features
              </h4>
              <ul
                className='text-sm text-gray-600 space-y-1'
                data-oid='qf36u2u'
              >
                <li data-oid='6d.qmee'>• Watermark Support</li>
                <li data-oid='v72mdu2'>• High DPI Export</li>
                <li data-oid='gncd-0-'>• Compression Options</li>
                <li data-oid='d2xuv8w'>• Metadata Inclusion</li>
                <li data-oid='_kbhol8'>• Progress Tracking</li>
              </ul>
            </div>

            <div className='bg-white p-4 rounded-md' data-oid='sbje8iz'>
              <h4 className='font-medium text-gray-900 mb-2' data-oid=':oelbdj'>
                Performance
              </h4>
              <ul
                className='text-sm text-gray-600 space-y-1'
                data-oid='n6xwydg'
              >
                <li data-oid='jr97j57'>• Dynamic Imports</li>
                <li data-oid='j7:ubo-'>• Bundle Optimization</li>
                <li data-oid='-9.xd8h'>• Memory Management</li>
                <li data-oid='mzql-fz'>• Error Handling</li>
                <li data-oid='wg_5x25'>• Event-Driven Architecture</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <style jsx data-oid='1u2-2_e'>{`
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
