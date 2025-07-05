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

  return <div ref={chartRef} className='chart-container' data-oid='7y42ub_' />;
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

  return <div ref={chartRef} className='chart-container' data-oid='5hap103' />;
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
    <div className='export-example' data-oid='-92fa28'>
      <div className='container mx-auto p-6' data-oid='0zmhbde'>
        <header className='mb-8' data-oid='sm14756'>
          <h1
            className='text-3xl font-bold text-gray-900 mb-2'
            data-oid='4j50419'
          >
            Export & Sharing System Demo
          </h1>
          <p className='text-gray-600' data-oid='-4g76xh'>
            Comprehensive demonstration of chart export, sharing, and reporting
            functionality. Test all export formats, create shareable links,
            generate embed codes, and schedule reports.
          </p>
        </header>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className='notifications mb-6' data-oid='q7y19g8'>
            {notifications.map((notification, index) => (
              <div
                key={index}
                className='notification bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-md mb-2'
                data-oid='gm4xgls'
              >
                {notification}
              </div>
            ))}
          </div>
        )}

        <div
          className='grid grid-cols-1 lg:grid-cols-3 gap-6'
          data-oid='-y5f230'
        >
          {/* Chart Display */}
          <div className='lg:col-span-2' data-oid='q0d7.x5'>
            <div
              className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'
              data-oid='xw4l6lr'
            >
              <div className='mb-4' data-oid='3b3klnl'>
                <h2
                  className='text-xl font-semibold text-gray-900 mb-2'
                  data-oid='8ru:mz.'
                >
                  Sample Charts
                </h2>
                <div className='flex space-x-4' data-oid='d.xm:sk'>
                  <button
                    onClick={() => setSelectedChart('line')}
                    className={`px-4 py-2 rounded-md ${
                      selectedChart === 'line'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    data-oid='c481tsa'
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
                    data-oid='bl5.0a3'
                  >
                    Bar Chart
                  </button>
                </div>
              </div>

              <div className='chart-display' data-oid='xtf.6m:'>
                {selectedChart === 'line' && (
                  <div ref={lineChartRef} data-oid='e_li9sb'>
                    <LineChart
                      data={lineData}
                      title='Monthly Performance Trends'
                      data-oid='4boicv-'
                    />
                  </div>
                )}

                {selectedChart === 'bar' && (
                  <div ref={barChartRef} data-oid='b82z5d.'>
                    <BarChart
                      data={barData}
                      title='Product Performance Comparison'
                      data-oid='fg5:xb.'
                    />
                  </div>
                )}
              </div>

              {/* Data Table */}
              <div className='mt-6' data-oid='1hb20at'>
                <h3
                  className='text-lg font-semibold text-gray-900 mb-3'
                  data-oid='ofa78pe'
                >
                  Sample Data Table
                </h3>
                <div className='overflow-x-auto' data-oid='e2uzh:0'>
                  <table
                    className='min-w-full border border-gray-200 rounded-lg'
                    data-oid='4tjswvx'
                  >
                    <thead className='bg-gray-50' data-oid='my2mzul'>
                      <tr data-oid='cyp-4:p'>
                        <th
                          className='px-4 py-2 text-left text-sm font-medium text-gray-700 border-b'
                          data-oid='ttanwo3'
                        >
                          Month
                        </th>
                        <th
                          className='px-4 py-2 text-left text-sm font-medium text-gray-700 border-b'
                          data-oid='av8kbj:'
                        >
                          Conversions
                        </th>
                        <th
                          className='px-4 py-2 text-left text-sm font-medium text-gray-700 border-b'
                          data-oid='w4s0ef9'
                        >
                          Revenue
                        </th>
                        <th
                          className='px-4 py-2 text-left text-sm font-medium text-gray-700 border-b'
                          data-oid='4-6mlhx'
                        >
                          CTR (%)
                        </th>
                      </tr>
                    </thead>
                    <tbody data-oid='p1rz1c:'>
                      {tableData.map((row, index) => (
                        <tr
                          key={index}
                          className='border-b border-gray-100'
                          data-oid='uoonlv4'
                        >
                          <td
                            className='px-4 py-2 text-sm text-gray-900'
                            data-oid='7pa6kse'
                          >
                            {row.month}
                          </td>
                          <td
                            className='px-4 py-2 text-sm text-gray-900'
                            data-oid='sqtp4eo'
                          >
                            {row.conversions}
                          </td>
                          <td
                            className='px-4 py-2 text-sm text-gray-900'
                            data-oid='xonefrj'
                          >
                            ${row.revenue.toLocaleString()}
                          </td>
                          <td
                            className='px-4 py-2 text-sm text-gray-900'
                            data-oid='wk-aq8z'
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
          <div className='space-y-6' data-oid='mez.jax'>
            <ExportControls
              chartElement={getCurrentChartElement()}
              chartId={`chart-${selectedChart}`}
              data={tableData}
              onExportStart={handleExportStart}
              onExportComplete={handleExportComplete}
              onExportError={handleExportError}
              data-oid='efp--0a'
            />

            {/* Report Scheduler */}
            <div
              className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'
              data-oid='4dfqyz2'
            >
              <ReportScheduler
                chartIds={['chart-line', 'chart-bar']}
                onReportScheduled={handleReportScheduled}
                data-oid='0uneopr'
              />
            </div>
          </div>
        </div>

        {/* Export History */}
        {exportHistory.length > 0 && (
          <div
            className='mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6'
            data-oid='krlqig1'
          >
            <h3
              className='text-lg font-semibold text-gray-900 mb-4'
              data-oid='cey86wg'
            >
              Export History
            </h3>
            <div className='space-y-3' data-oid='j:ofb6i'>
              {exportHistory.map((export_, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between p-3 bg-gray-50 rounded-md'
                  data-oid='bbfxmg0'
                >
                  <div
                    className='flex items-center space-x-3'
                    data-oid='-x9n_7x'
                  >
                    <div
                      className={`file-icon ${export_.metadata?.format || 'image'}`}
                      data-oid='jmq_.vx'
                    >
                      {export_.metadata?.format?.toUpperCase().slice(0, 3) ||
                        'IMG'}
                    </div>
                    <div data-oid='8ie000e'>
                      <p
                        className='text-sm font-medium text-gray-900'
                        data-oid='8yjbuau'
                      >
                        {export_.filename}
                      </p>
                      <p className='text-xs text-gray-500' data-oid='j-u81zs'>
                        {export_.metadata?.fileSize &&
                          `${(export_.metadata.fileSize / 1024).toFixed(1)} KB`}
                        {export_.metadata?.exportTime &&
                          ` • ${export_.metadata.exportTime}ms`}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`status-indicator ${export_.success ? 'success' : 'error'}`}
                    data-oid='m13:w2n'
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
            data-oid='c928m52'
          >
            <h3
              className='text-lg font-semibold text-gray-900 mb-4'
              data-oid='n83m363'
            >
              Shareable Links
            </h3>
            <div className='space-y-3' data-oid='owo7npd'>
              {shareableLinks.map((link, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between p-3 bg-gray-50 rounded-md'
                  data-oid='fle_gew'
                >
                  <div data-oid='xg_-_u3'>
                    <p
                      className='text-sm font-medium text-gray-900'
                      data-oid='r47yx6w'
                    >
                      Chart: {link.chartId}
                    </p>
                    <p className='text-xs text-gray-500' data-oid='.p69008'>
                      Created: {link.createdAt.toLocaleDateString()} • Views:{' '}
                      {link.viewCount} •
                      {link.accessControl.isPublic ? 'Public' : 'Private'}
                    </p>
                  </div>
                  <div className='flex space-x-2' data-oid='t55bk16'>
                    <button
                      onClick={() => navigator.clipboard.writeText(link.url)}
                      className='px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700'
                      data-oid='.9qjrff'
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
            data-oid=':8krri4'
          >
            <h3
              className='text-lg font-semibold text-gray-900 mb-4'
              data-oid='ae5mbj2'
            >
              Scheduled Reports
            </h3>
            <div className='space-y-3' data-oid='p:82pn_'>
              {scheduledReports.map((report, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between p-3 bg-gray-50 rounded-md'
                  data-oid='28.gpvn'
                >
                  <div data-oid='0:fec-b'>
                    <p
                      className='text-sm font-medium text-gray-900'
                      data-oid='aha0xf1'
                    >
                      {report.name}
                    </p>
                    <p className='text-xs text-gray-500' data-oid='h7i2g6:'>
                      {report.frequency} • {report.format.toUpperCase()} • Next:{' '}
                      {report.nextRun.toLocaleDateString()} • Recipients:{' '}
                      {report.recipients.length}
                    </p>
                  </div>
                  <div
                    className={`status-indicator ${report.isActive ? 'success' : 'error'}`}
                    data-oid='--2bm19'
                  >
                    {report.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Technical Features */}
        <div className='mt-8 bg-gray-50 rounded-lg p-6' data-oid='sfglk6.'>
          <h3
            className='text-lg font-semibold text-gray-900 mb-4'
            data-oid='ry6qf8z'
          >
            Technical Features Demonstrated
          </h3>
          <div
            className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            data-oid='e:agfur'
          >
            <div className='bg-white p-4 rounded-md' data-oid='016sarm'>
              <h4 className='font-medium text-gray-900 mb-2' data-oid='0qn1j8d'>
                Export Formats
              </h4>
              <ul
                className='text-sm text-gray-600 space-y-1'
                data-oid='n91smzf'
              >
                <li data-oid='ucjqprs'>• PNG/JPG/SVG Images</li>
                <li data-oid='1u.ry6d'>• PDF Reports</li>
                <li data-oid='ly:lk6h'>• Excel Spreadsheets</li>
                <li data-oid='rqkl4ht'>• CSV Data Files</li>
                <li data-oid='pepsmqp'>• JSON Data Export</li>
              </ul>
            </div>

            <div className='bg-white p-4 rounded-md' data-oid='n0xcbfg'>
              <h4 className='font-medium text-gray-900 mb-2' data-oid='1druy2j'>
                Sharing Features
              </h4>
              <ul
                className='text-sm text-gray-600 space-y-1'
                data-oid='7394qss'
              >
                <li data-oid='od3rebh'>• Shareable Links</li>
                <li data-oid='58rdxfn'>• Access Control</li>
                <li data-oid='91fk:b8'>• Password Protection</li>
                <li data-oid='5x_09u1'>• Expiration Dates</li>
                <li data-oid='h50cbn2'>• View Tracking</li>
              </ul>
            </div>

            <div className='bg-white p-4 rounded-md' data-oid='k3okf9w'>
              <h4 className='font-medium text-gray-900 mb-2' data-oid='wj5r0ro'>
                Embed Options
              </h4>
              <ul
                className='text-sm text-gray-600 space-y-1'
                data-oid='6k_4giq'
              >
                <li data-oid='06uly3n'>• Responsive iFrames</li>
                <li data-oid='a28pun0'>• Theme Selection</li>
                <li data-oid='e-:kwpe'>• Auto Refresh</li>
                <li data-oid='ap0l.td'>• White Label Mode</li>
                <li data-oid='y0bj.md'>• Custom Styling</li>
              </ul>
            </div>

            <div className='bg-white p-4 rounded-md' data-oid='zj4iulr'>
              <h4 className='font-medium text-gray-900 mb-2' data-oid='9w.wwql'>
                Reporting
              </h4>
              <ul
                className='text-sm text-gray-600 space-y-1'
                data-oid='o82ow2w'
              >
                <li data-oid='5mrvsq-'>• Scheduled Reports</li>
                <li data-oid='k6h87u9'>• Multiple Recipients</li>
                <li data-oid='ogvqtt1'>• Custom Templates</li>
                <li data-oid='1310rz2'>• Frequency Options</li>
                <li data-oid=':j-b3_0'>• Email Integration</li>
              </ul>
            </div>

            <div className='bg-white p-4 rounded-md' data-oid='af2hfky'>
              <h4 className='font-medium text-gray-900 mb-2' data-oid='z8ios7-'>
                Advanced Features
              </h4>
              <ul
                className='text-sm text-gray-600 space-y-1'
                data-oid='.id4cmv'
              >
                <li data-oid='13bkjzi'>• Watermark Support</li>
                <li data-oid='wgum.t:'>• High DPI Export</li>
                <li data-oid='3x9c6jq'>• Compression Options</li>
                <li data-oid='ftr-e0v'>• Metadata Inclusion</li>
                <li data-oid='58f:fhx'>• Progress Tracking</li>
              </ul>
            </div>

            <div className='bg-white p-4 rounded-md' data-oid='f2qsj1g'>
              <h4 className='font-medium text-gray-900 mb-2' data-oid='s5d_qsm'>
                Performance
              </h4>
              <ul
                className='text-sm text-gray-600 space-y-1'
                data-oid='wzp2d:0'
              >
                <li data-oid='esy92ov'>• Dynamic Imports</li>
                <li data-oid='rcthxa1'>• Bundle Optimization</li>
                <li data-oid='5idcg97'>• Memory Management</li>
                <li data-oid='_jzitd6'>• Error Handling</li>
                <li data-oid='46c0dl:'>• Event-Driven Architecture</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <style jsx data-oid='c2ekf_k'>{`
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
