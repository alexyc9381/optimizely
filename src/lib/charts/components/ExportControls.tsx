/**
 * Export Controls Components
 * React components for chart export, sharing, and reporting functionality.
 * Provides intuitive UI for all export formats and sharing options.
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  AccessControl,
  EmbedConfig,
  ExportOptions,
  ReportTemplate,
  ScheduledReport,
  ShareableLink,
  exportEngine,
} from '../ExportEngine';

// Component interfaces
export interface ExportControlsProps {
  chartElement: HTMLElement | null;
  chartId: string;
  data?: any[];
  onExportStart?: () => void;
  onExportComplete?: (result: any) => void;
  onExportError?: (error: string) => void;
  className?: string;
}

export interface ShareDialogProps {
  isOpen: boolean;
  chartId: string;
  onClose: () => void;
  onLinkCreated?: (link: ShareableLink) => void;
}

export interface EmbedDialogProps {
  isOpen: boolean;
  shareableLink: ShareableLink | null;
  onClose: () => void;
  onEmbedGenerated?: (embedCode: string) => void;
}

export interface ReportSchedulerProps {
  chartIds: string[];
  onReportScheduled?: (report: ScheduledReport) => void;
}

// Main export controls component
export const ExportControls: React.FC<ExportControlsProps> = ({
  chartElement,
  chartId,
  data,
  onExportStart,
  onExportComplete,
  onExportError,
  className = '',
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'pdf' | 'csv'>(
    'png'
  );
  const [showShareDialog, setShowShareDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = useCallback(async () => {
    if (!chartElement && !data) {
      onExportError?.('No chart element or data available for export');
      return;
    }

    setIsExporting(true);
    onExportStart?.();

    try {
      let result;
      const options: ExportOptions = {
        format: exportFormat,
        quality: 0.9,
        width: 1200,
        height: 800,
        backgroundColor: '#ffffff',
        includeMetadata: true,
      };

      if (exportFormat === 'pdf' && chartElement) {
        result = await exportEngine.exportAsPDF([chartElement], {
          ...options,
          title: `Chart Report - ${new Date().toLocaleDateString()}`,
          multiPage: false,
        });
      } else if (['png', 'jpg', 'svg'].includes(exportFormat) && chartElement) {
        result = await exportEngine.exportAsImage(chartElement, options);
      } else if (['csv', 'json', 'excel'].includes(exportFormat) && data) {
        result = await exportEngine.exportData(data, {
          ...options,
          headers: data.length > 0 ? Object.keys(data[0]) : [],
        });
      } else {
        throw new Error('Invalid export configuration');
      }

      if (result.success && result.data) {
        // Create download
        const url = URL.createObjectURL(result.data as Blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename || `export_${Date.now()}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        onExportComplete?.(result);
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      onExportError?.(error.message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [
    chartElement,
    data,
    exportFormat,
    onExportStart,
    onExportComplete,
    onExportError,
  ]);

  return (
    <div className={`export-controls ${className}`} data-oid='6abe8..'>
      <div className='export-controls-header' data-oid='8w.5f4h'>
        <h3
          className='text-lg font-semibold text-gray-900 mb-4'
          data-oid='5j4vs-:'
        >
          Export & Share
        </h3>
      </div>

      <div className='export-format-selector mb-4' data-oid='184us7b'>
        <label
          className='block text-sm font-medium text-gray-700 mb-2'
          data-oid='o3.kv6u'
        >
          Export Format
        </label>
        <select
          value={exportFormat}
          onChange={e => setExportFormat(e.target.value as any)}
          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          data-oid='.n2pnvj'
        >
          <option value='png' data-oid='c2o4r2k'>
            PNG Image
          </option>
          <option value='pdf' data-oid='a42li58'>
            PDF Report
          </option>
          <option value='csv' data-oid='hgfj8d2'>
            CSV Data
          </option>
          <option value='json' data-oid='i-vdh4z'>
            JSON Data
          </option>
          <option value='excel' data-oid='xfe86r2'>
            Excel Spreadsheet
          </option>
        </select>
      </div>

      <div className='export-actions space-y-3' data-oid='v3w66mt'>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className='w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'
          data-oid='.hok-fr'
        >
          {isExporting ? (
            <div
              className='flex items-center justify-center'
              data-oid='jpsvva1'
            >
              <div
                className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'
                data-oid='01zizh7'
              ></div>
              Exporting...
            </div>
          ) : (
            `Export as ${exportFormat.toUpperCase()}`
          )}
        </button>

        <button
          onClick={() => setShowShareDialog(true)}
          className='w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-200'
          data-oid='uursl8l'
        >
          Create Shareable Link
        </button>
      </div>

      {showShareDialog && (
        <ShareDialog
          isOpen={showShareDialog}
          chartId={chartId}
          onClose={() => setShowShareDialog(false)}
          onLinkCreated={link => {
            console.log('Shareable link created:', link);
            setShowShareDialog(false);
          }}
          data-oid='j2jl7tc'
        />
      )}
    </div>
  );
};

// Share dialog component
export const ShareDialog: React.FC<ShareDialogProps> = ({
  isOpen,
  chartId,
  onClose,
  onLinkCreated,
}) => {
  const [accessControl, setAccessControl] = useState<AccessControl>({
    isPublic: true,
    downloadEnabled: true,
    printEnabled: true,
    embedEnabled: true,
  });
  const [password, setPassword] = useState('');
  const [expirationDays, setExpirationDays] = useState(7);
  const [createdLink, setCreatedLink] = useState<ShareableLink | null>(null);
  const [showEmbedDialog, setShowEmbedDialog] = useState(false);

  const handleCreateLink = useCallback(() => {
    const updatedAccessControl = {
      ...accessControl,
      password: password || undefined,
    };

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + expirationDays);

    const link = exportEngine.createShareableLink(
      chartId,
      updatedAccessControl,
      expirationDate
    );

    setCreatedLink(link);
    onLinkCreated?.(link);
  }, [chartId, accessControl, password, expirationDays, onLinkCreated]);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
      data-oid='7:.5xm_'
    >
      <div
        className='bg-white rounded-lg p-6 w-full max-w-md mx-4'
        data-oid='98jqdna'
      >
        <div
          className='flex justify-between items-center mb-4'
          data-oid='gd6ts60'
        >
          <h3
            className='text-lg font-semibold text-gray-900'
            data-oid='a9g2ihx'
          >
            Share Chart
          </h3>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600'
            data-oid='zq:kh:y'
          >
            <svg
              className='w-6 h-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              data-oid='_b1kdiu'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
                data-oid='ktzm:ie'
              />
            </svg>
          </button>
        </div>

        {!createdLink ? (
          <div className='space-y-4' data-oid='fxsuvlo'>
            <div data-oid='nji6mhe'>
              <label className='flex items-center' data-oid='_ynckkq'>
                <input
                  type='checkbox'
                  checked={accessControl.isPublic}
                  onChange={e =>
                    setAccessControl({
                      ...accessControl,
                      isPublic: e.target.checked,
                    })
                  }
                  className='mr-2'
                  data-oid='50a3f8s'
                />
                Make link public
              </label>
            </div>

            {!accessControl.isPublic && (
              <div data-oid='1eytd40'>
                <label
                  className='block text-sm font-medium text-gray-700 mb-1'
                  data-oid='0ry9mkr'
                >
                  Password (optional)
                </label>
                <input
                  type='password'
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder='Enter password'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  data-oid=':43s2-s'
                />
              </div>
            )}

            <div data-oid='1h5hu1u'>
              <label
                className='block text-sm font-medium text-gray-700 mb-1'
                data-oid='jq:5m3o'
              >
                Expires in (days)
              </label>
              <input
                type='number'
                value={expirationDays}
                onChange={e => setExpirationDays(Number(e.target.value))}
                min='1'
                max='365'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                data-oid='k:kzj8p'
              />
            </div>

            <div className='space-y-2' data-oid='nvgqbua'>
              <label className='flex items-center' data-oid='5618gxj'>
                <input
                  type='checkbox'
                  checked={accessControl.downloadEnabled}
                  onChange={e =>
                    setAccessControl({
                      ...accessControl,
                      downloadEnabled: e.target.checked,
                    })
                  }
                  className='mr-2'
                  data-oid='-phfhmb'
                />
                Allow downloads
              </label>

              <label className='flex items-center' data-oid='5h6zlfn'>
                <input
                  type='checkbox'
                  checked={accessControl.embedEnabled}
                  onChange={e =>
                    setAccessControl({
                      ...accessControl,
                      embedEnabled: e.target.checked,
                    })
                  }
                  className='mr-2'
                  data-oid='.te0a_5'
                />
                Allow embedding
              </label>
            </div>

            <button
              onClick={handleCreateLink}
              className='w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200'
              data-oid='pzbfh5d'
            >
              Create Shareable Link
            </button>
          </div>
        ) : (
          <div className='space-y-4' data-oid='wkx2yhl'>
            <div data-oid='g6bbmmj'>
              <label
                className='block text-sm font-medium text-gray-700 mb-1'
                data-oid='q25jrw_'
              >
                Shareable Link
              </label>
              <div className='flex' data-oid='w6ho38i'>
                <input
                  type='text'
                  value={createdLink.url}
                  readOnly
                  className='flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50'
                  data-oid='c0_28b-'
                />

                <button
                  onClick={() => copyToClipboard(createdLink.url)}
                  className='px-3 py-2 bg-gray-200 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-300 transition-colors duration-200'
                  data-oid='2x_-2uc'
                >
                  Copy
                </button>
              </div>
            </div>

            <div className='text-sm text-gray-600' data-oid='bi19xx_'>
              <p data-oid='n5-yocf'>
                Link expires: {createdLink.expiresAt?.toLocaleDateString()}
              </p>
              <p data-oid='lfvj1c_'>Views: {createdLink.viewCount}</p>
            </div>

            <div className='space-y-2' data-oid='08bkreu'>
              <button
                onClick={() => setShowEmbedDialog(true)}
                className='w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-200'
                data-oid='s_5hgvo'
              >
                Generate Embed Code
              </button>

              <button
                onClick={() => {
                  setCreatedLink(null);
                  setPassword('');
                }}
                className='w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors duration-200'
                data-oid='39xg56d'
              >
                Create Another Link
              </button>
            </div>
          </div>
        )}

        {showEmbedDialog && createdLink && (
          <EmbedDialog
            isOpen={showEmbedDialog}
            shareableLink={createdLink}
            onClose={() => setShowEmbedDialog(false)}
            onEmbedGenerated={embedCode => {
              console.log('Embed code generated:', embedCode);
              setShowEmbedDialog(false);
            }}
            data-oid='.cxrmac'
          />
        )}
      </div>
    </div>
  );
};

// Embed dialog component
export const EmbedDialog: React.FC<EmbedDialogProps> = ({
  isOpen,
  shareableLink,
  onClose,
  onEmbedGenerated,
}) => {
  const [embedConfig, setEmbedConfig] = useState<EmbedConfig>({
    chartId: shareableLink?.chartId || '',
    width: 800,
    height: 600,
    theme: 'light',
    showControls: true,
    autoRefresh: false,
    refreshInterval: 30,
    whiteLabel: false,
  });
  const [embedCode, setEmbedCode] = useState('');

  const generateEmbedCode = useCallback(() => {
    if (!shareableLink) return;

    const code = exportEngine.generateEmbedCode(shareableLink.id, embedConfig);
    setEmbedCode(code);
    onEmbedGenerated?.(code);
  }, [shareableLink, embedConfig, onEmbedGenerated]);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, []);

  if (!isOpen || !shareableLink) return null;

  return (
    <div
      className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
      data-oid='ss:x18a'
    >
      <div
        className='bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-screen overflow-y-auto'
        data-oid='o13nm_f'
      >
        <div
          className='flex justify-between items-center mb-4'
          data-oid='k5u.fi9'
        >
          <h3
            className='text-lg font-semibold text-gray-900'
            data-oid='qdlzz5j'
          >
            Generate Embed Code
          </h3>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600'
            data-oid='pfogjp0'
          >
            <svg
              className='w-6 h-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              data-oid='k9ojpla'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
                data-oid='xy4o-4p'
              />
            </svg>
          </button>
        </div>

        <div className='space-y-4' data-oid='84s:w24'>
          <div className='grid grid-cols-2 gap-4' data-oid='e4mj0-.'>
            <div data-oid='gfucm4a'>
              <label
                className='block text-sm font-medium text-gray-700 mb-1'
                data-oid='tppz6zw'
              >
                Width
              </label>
              <input
                type='number'
                value={embedConfig.width}
                onChange={e =>
                  setEmbedConfig({
                    ...embedConfig,
                    width: Number(e.target.value),
                  })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                data-oid='fwq.-ni'
              />
            </div>

            <div data-oid='1-ec1-p'>
              <label
                className='block text-sm font-medium text-gray-700 mb-1'
                data-oid='fa_2iii'
              >
                Height
              </label>
              <input
                type='number'
                value={embedConfig.height}
                onChange={e =>
                  setEmbedConfig({
                    ...embedConfig,
                    height: Number(e.target.value),
                  })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                data-oid='o.fice3'
              />
            </div>
          </div>

          <div data-oid='h9icci5'>
            <label
              className='block text-sm font-medium text-gray-700 mb-1'
              data-oid='8t86ueo'
            >
              Theme
            </label>
            <select
              value={embedConfig.theme}
              onChange={e =>
                setEmbedConfig({
                  ...embedConfig,
                  theme: e.target.value as 'light' | 'dark' | 'auto',
                })
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              data-oid='ajyvw6_'
            >
              <option value='light' data-oid='98da-kt'>
                Light
              </option>
              <option value='dark' data-oid='lh79a01'>
                Dark
              </option>
              <option value='auto' data-oid='u303yn3'>
                Auto
              </option>
            </select>
          </div>

          <div className='space-y-2' data-oid='p3rbhr7'>
            <label className='flex items-center' data-oid='rjq68it'>
              <input
                type='checkbox'
                checked={embedConfig.showControls}
                onChange={e =>
                  setEmbedConfig({
                    ...embedConfig,
                    showControls: e.target.checked,
                  })
                }
                className='mr-2'
                data-oid='-954dtq'
              />
              Show controls
            </label>

            <label className='flex items-center' data-oid='d3di0eq'>
              <input
                type='checkbox'
                checked={embedConfig.autoRefresh}
                onChange={e =>
                  setEmbedConfig({
                    ...embedConfig,
                    autoRefresh: e.target.checked,
                  })
                }
                className='mr-2'
                data-oid='dyqee77'
              />
              Auto refresh
            </label>

            <label className='flex items-center' data-oid=':bta254'>
              <input
                type='checkbox'
                checked={embedConfig.whiteLabel}
                onChange={e =>
                  setEmbedConfig({
                    ...embedConfig,
                    whiteLabel: e.target.checked,
                  })
                }
                className='mr-2'
                data-oid='55o-y.6'
              />
              White label (remove branding)
            </label>
          </div>

          {embedConfig.autoRefresh && (
            <div data-oid='7wzd42l'>
              <label
                className='block text-sm font-medium text-gray-700 mb-1'
                data-oid='7xkzqcp'
              >
                Refresh Interval (seconds)
              </label>
              <input
                type='number'
                value={embedConfig.refreshInterval}
                onChange={e =>
                  setEmbedConfig({
                    ...embedConfig,
                    refreshInterval: Number(e.target.value),
                  })
                }
                min='10'
                max='3600'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                data-oid='irf_hnv'
              />
            </div>
          )}

          <button
            onClick={generateEmbedCode}
            className='w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200'
            data-oid='83f_yoi'
          >
            Generate Embed Code
          </button>

          {embedCode && (
            <div data-oid='nyzk0tt'>
              <label
                className='block text-sm font-medium text-gray-700 mb-1'
                data-oid='4simlxb'
              >
                Embed Code
              </label>
              <div className='relative' data-oid=':c4f4b2'>
                <textarea
                  value={embedCode}
                  readOnly
                  rows={8}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm'
                  data-oid='yfyd287'
                />

                <button
                  onClick={() => copyToClipboard(embedCode)}
                  className='absolute top-2 right-2 px-2 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300 transition-colors duration-200'
                  data-oid='9pyd:hj'
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Report scheduler component
export const ReportScheduler: React.FC<ReportSchedulerProps> = ({
  chartIds,
  onReportScheduled,
}) => {
  const [reportConfig, setReportConfig] = useState({
    name: '',
    frequency: 'weekly' as 'daily' | 'weekly' | 'monthly' | 'quarterly',
    format: 'pdf' as 'pdf' | 'excel',
    recipients: [''],
    template: {
      title: 'Analytics Report',
      includeTimestamp: true,
      includeSummary: true,
    } as ReportTemplate,
  });

  const handleScheduleReport = useCallback(() => {
    const report = exportEngine.scheduleReport({
      name: reportConfig.name,
      chartIds,
      frequency: reportConfig.frequency,
      format: reportConfig.format,
      recipients: reportConfig.recipients.filter(email => email.trim() !== ''),
      template: reportConfig.template,
    });

    onReportScheduled?.(report);

    // Reset form
    setReportConfig({
      name: '',
      frequency: 'weekly',
      format: 'pdf',
      recipients: [''],
      template: {
        title: 'Analytics Report',
        includeTimestamp: true,
        includeSummary: true,
      },
    });
  }, [chartIds, reportConfig, onReportScheduled]);

  const addRecipient = useCallback(() => {
    setReportConfig({
      ...reportConfig,
      recipients: [...reportConfig.recipients, ''],
    });
  }, [reportConfig]);

  const updateRecipient = useCallback(
    (index: number, email: string) => {
      const newRecipients = [...reportConfig.recipients];
      newRecipients[index] = email;
      setReportConfig({
        ...reportConfig,
        recipients: newRecipients,
      });
    },
    [reportConfig]
  );

  const removeRecipient = useCallback(
    (index: number) => {
      const newRecipients = reportConfig.recipients.filter(
        (_, i) => i !== index
      );
      setReportConfig({
        ...reportConfig,
        recipients: newRecipients,
      });
    },
    [reportConfig]
  );

  return (
    <div className='report-scheduler space-y-4' data-oid='iitj.05'>
      <div data-oid='mgkg4hd'>
        <h3
          className='text-lg font-semibold text-gray-900 mb-4'
          data-oid='a7idrsx'
        >
          Schedule Report
        </h3>
      </div>

      <div data-oid='5z963rk'>
        <label
          className='block text-sm font-medium text-gray-700 mb-1'
          data-oid='b.0dag3'
        >
          Report Name
        </label>
        <input
          type='text'
          value={reportConfig.name}
          onChange={e =>
            setReportConfig({
              ...reportConfig,
              name: e.target.value,
            })
          }
          placeholder='Weekly Analytics Report'
          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          data-oid='ni6:09a'
        />
      </div>

      <div className='grid grid-cols-2 gap-4' data-oid='rj00kg1'>
        <div data-oid='focm4_l'>
          <label
            className='block text-sm font-medium text-gray-700 mb-1'
            data-oid='kjhg7li'
          >
            Frequency
          </label>
          <select
            value={reportConfig.frequency}
            onChange={e =>
              setReportConfig({
                ...reportConfig,
                frequency: e.target.value as any,
              })
            }
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            data-oid='47s_112'
          >
            <option value='daily' data-oid='cd1zz3u'>
              Daily
            </option>
            <option value='weekly' data-oid='gm8yclg'>
              Weekly
            </option>
            <option value='monthly' data-oid='s.cx0x2'>
              Monthly
            </option>
            <option value='quarterly' data-oid='jxxxg7n'>
              Quarterly
            </option>
          </select>
        </div>

        <div data-oid='6bvhav9'>
          <label
            className='block text-sm font-medium text-gray-700 mb-1'
            data-oid='ylw_n_v'
          >
            Format
          </label>
          <select
            value={reportConfig.format}
            onChange={e =>
              setReportConfig({
                ...reportConfig,
                format: e.target.value as 'pdf' | 'excel',
              })
            }
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            data-oid='rvu:_va'
          >
            <option value='pdf' data-oid='5forbcq'>
              PDF
            </option>
            <option value='excel' data-oid=':p01on_'>
              Excel
            </option>
          </select>
        </div>
      </div>

      <div data-oid='gqhjlnf'>
        <label
          className='block text-sm font-medium text-gray-700 mb-1'
          data-oid='n.rtu3m'
        >
          Recipients
        </label>
        {reportConfig.recipients.map((email, index) => (
          <div key={index} className='flex mb-2' data-oid='ujva07e'>
            <input
              type='email'
              value={email}
              onChange={e => updateRecipient(index, e.target.value)}
              placeholder='recipient@example.com'
              className='flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              data-oid='cp5m06h'
            />

            <button
              onClick={() => removeRecipient(index)}
              className='px-3 py-2 bg-red-500 text-white rounded-r-md hover:bg-red-600 transition-colors duration-200'
              data-oid='bkv87sk'
            >
              Remove
            </button>
          </div>
        ))}
        <button
          onClick={addRecipient}
          className='text-blue-600 hover:text-blue-800 text-sm'
          data-oid='5coplv3'
        >
          + Add Recipient
        </button>
      </div>

      <button
        onClick={handleScheduleReport}
        disabled={
          !reportConfig.name ||
          reportConfig.recipients.every(email => !email.trim())
        }
        className='w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'
        data-oid='u99hp7t'
      >
        Schedule Report
      </button>
    </div>
  );
};
