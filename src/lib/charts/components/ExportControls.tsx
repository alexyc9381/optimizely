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
    <div className={`export-controls ${className}`} data-oid='jjtjwx-'>
      <div className='export-controls-header' data-oid='p3balc-'>
        <h3
          className='text-lg font-semibold text-gray-900 mb-4'
          data-oid='l0aclj:'
        >
          Export & Share
        </h3>
      </div>

      <div className='export-format-selector mb-4' data-oid='3f_0pm0'>
        <label
          className='block text-sm font-medium text-gray-700 mb-2'
          data-oid='i5ms3lh'
        >
          Export Format
        </label>
        <select
          value={exportFormat}
          onChange={e => setExportFormat(e.target.value as any)}
          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          data-oid='46esib3'
        >
          <option value='png' data-oid='r4.e1pw'>
            PNG Image
          </option>
          <option value='pdf' data-oid='etacac0'>
            PDF Report
          </option>
          <option value='csv' data-oid='oah_vs6'>
            CSV Data
          </option>
          <option value='json' data-oid='k1:mfes'>
            JSON Data
          </option>
          <option value='excel' data-oid='haqiays'>
            Excel Spreadsheet
          </option>
        </select>
      </div>

      <div className='export-actions space-y-3' data-oid=':tgvskj'>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className='w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'
          data-oid='_2jm9k-'
        >
          {isExporting ? (
            <div
              className='flex items-center justify-center'
              data-oid='8pkx:yt'
            >
              <div
                className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'
                data-oid='eliliz7'
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
          data-oid='nfzyr0-'
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
          data-oid='d4o:3ce'
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
      data-oid='n3hrl0s'
    >
      <div
        className='bg-white rounded-lg p-6 w-full max-w-md mx-4'
        data-oid='83761hl'
      >
        <div
          className='flex justify-between items-center mb-4'
          data-oid='nm5419-'
        >
          <h3
            className='text-lg font-semibold text-gray-900'
            data-oid='e1im_8s'
          >
            Share Chart
          </h3>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600'
            data-oid='2vfprlq'
          >
            <svg
              className='w-6 h-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              data-oid='m8g0yxc'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
                data-oid='oeu6al-'
              />
            </svg>
          </button>
        </div>

        {!createdLink ? (
          <div className='space-y-4' data-oid='mdv-2az'>
            <div data-oid='h-bi34o'>
              <label className='flex items-center' data-oid=':.qv1mv'>
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
                  data-oid='_aiv:qr'
                />
                Make link public
              </label>
            </div>

            {!accessControl.isPublic && (
              <div data-oid='yk0hz1x'>
                <label
                  className='block text-sm font-medium text-gray-700 mb-1'
                  data-oid='5jzrim7'
                >
                  Password (optional)
                </label>
                <input
                  type='password'
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder='Enter password'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  data-oid='ypn48i-'
                />
              </div>
            )}

            <div data-oid='.p--7te'>
              <label
                className='block text-sm font-medium text-gray-700 mb-1'
                data-oid='t10_g-6'
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
                data-oid=':o.n.0p'
              />
            </div>

            <div className='space-y-2' data-oid='-s-l0wz'>
              <label className='flex items-center' data-oid='t08frr9'>
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
                  data-oid='.uu-xsk'
                />
                Allow downloads
              </label>

              <label className='flex items-center' data-oid='kse.:wk'>
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
                  data-oid='yx3o0tt'
                />
                Allow embedding
              </label>
            </div>

            <button
              onClick={handleCreateLink}
              className='w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200'
              data-oid='7a4o.l2'
            >
              Create Shareable Link
            </button>
          </div>
        ) : (
          <div className='space-y-4' data-oid='g6xtpa4'>
            <div data-oid='e:cfz:0'>
              <label
                className='block text-sm font-medium text-gray-700 mb-1'
                data-oid='0.15yd:'
              >
                Shareable Link
              </label>
              <div className='flex' data-oid='l.wl2z2'>
                <input
                  type='text'
                  value={createdLink.url}
                  readOnly
                  className='flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50'
                  data-oid='13rifyz'
                />

                <button
                  onClick={() => copyToClipboard(createdLink.url)}
                  className='px-3 py-2 bg-gray-200 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-300 transition-colors duration-200'
                  data-oid='1mjuz4d'
                >
                  Copy
                </button>
              </div>
            </div>

            <div className='text-sm text-gray-600' data-oid='koqned1'>
              <p data-oid='_sq4yzl'>
                Link expires: {createdLink.expiresAt?.toLocaleDateString()}
              </p>
              <p data-oid='lkea.0r'>Views: {createdLink.viewCount}</p>
            </div>

            <div className='space-y-2' data-oid='qqcv17q'>
              <button
                onClick={() => setShowEmbedDialog(true)}
                className='w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-200'
                data-oid='s8a80g6'
              >
                Generate Embed Code
              </button>

              <button
                onClick={() => {
                  setCreatedLink(null);
                  setPassword('');
                }}
                className='w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors duration-200'
                data-oid='h5t9lgh'
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
            data-oid='pcmg_bo'
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
      data-oid='d.si8tf'
    >
      <div
        className='bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-screen overflow-y-auto'
        data-oid='p-y0w:o'
      >
        <div
          className='flex justify-between items-center mb-4'
          data-oid='d.4.nhm'
        >
          <h3
            className='text-lg font-semibold text-gray-900'
            data-oid='9097r:7'
          >
            Generate Embed Code
          </h3>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600'
            data-oid='1fwdi__'
          >
            <svg
              className='w-6 h-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              data-oid='hn2qm_v'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
                data-oid='b4h8d7a'
              />
            </svg>
          </button>
        </div>

        <div className='space-y-4' data-oid='-z3onn3'>
          <div className='grid grid-cols-2 gap-4' data-oid='57pr6oj'>
            <div data-oid='t4lp11_'>
              <label
                className='block text-sm font-medium text-gray-700 mb-1'
                data-oid='-kh0-.3'
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
                data-oid='-co-v-e'
              />
            </div>

            <div data-oid='reew_fb'>
              <label
                className='block text-sm font-medium text-gray-700 mb-1'
                data-oid='wra3sbr'
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
                data-oid='fkj_8w-'
              />
            </div>
          </div>

          <div data-oid='rp1xc6i'>
            <label
              className='block text-sm font-medium text-gray-700 mb-1'
              data-oid='83q900n'
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
              data-oid='eoa7k90'
            >
              <option value='light' data-oid='pvlybsf'>
                Light
              </option>
              <option value='dark' data-oid='roo-t.0'>
                Dark
              </option>
              <option value='auto' data-oid='_gym6nc'>
                Auto
              </option>
            </select>
          </div>

          <div className='space-y-2' data-oid='1av_yuu'>
            <label className='flex items-center' data-oid='a3mtmo-'>
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
                data-oid='th7.3rf'
              />
              Show controls
            </label>

            <label className='flex items-center' data-oid='jkw9gek'>
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
                data-oid='inblky4'
              />
              Auto refresh
            </label>

            <label className='flex items-center' data-oid='b241__o'>
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
                data-oid='kr75l3b'
              />
              White label (remove branding)
            </label>
          </div>

          {embedConfig.autoRefresh && (
            <div data-oid='i:aru4f'>
              <label
                className='block text-sm font-medium text-gray-700 mb-1'
                data-oid='xpm0vi3'
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
                data-oid='0i72zul'
              />
            </div>
          )}

          <button
            onClick={generateEmbedCode}
            className='w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200'
            data-oid='gri23by'
          >
            Generate Embed Code
          </button>

          {embedCode && (
            <div data-oid='mg8naj9'>
              <label
                className='block text-sm font-medium text-gray-700 mb-1'
                data-oid='1sz.qu_'
              >
                Embed Code
              </label>
              <div className='relative' data-oid='9g6ifrc'>
                <textarea
                  value={embedCode}
                  readOnly
                  rows={8}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm'
                  data-oid='qaywizh'
                />

                <button
                  onClick={() => copyToClipboard(embedCode)}
                  className='absolute top-2 right-2 px-2 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300 transition-colors duration-200'
                  data-oid='xfu--n_'
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
    <div className='report-scheduler space-y-4' data-oid='0ohg5l:'>
      <div data-oid='wah:d9:'>
        <h3
          className='text-lg font-semibold text-gray-900 mb-4'
          data-oid='r5ig0w-'
        >
          Schedule Report
        </h3>
      </div>

      <div data-oid='5xna0s2'>
        <label
          className='block text-sm font-medium text-gray-700 mb-1'
          data-oid='q2g:zxv'
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
          data-oid='mnz-sm2'
        />
      </div>

      <div className='grid grid-cols-2 gap-4' data-oid='ykhzl54'>
        <div data-oid='1b6ssi3'>
          <label
            className='block text-sm font-medium text-gray-700 mb-1'
            data-oid='.u5zpz0'
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
            data-oid='a3-z6wl'
          >
            <option value='daily' data-oid='r2lcja0'>
              Daily
            </option>
            <option value='weekly' data-oid='vz7n766'>
              Weekly
            </option>
            <option value='monthly' data-oid='r9tqm7i'>
              Monthly
            </option>
            <option value='quarterly' data-oid='jfnncsn'>
              Quarterly
            </option>
          </select>
        </div>

        <div data-oid='ckm1pev'>
          <label
            className='block text-sm font-medium text-gray-700 mb-1'
            data-oid='-:spsnb'
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
            data-oid='wozm09f'
          >
            <option value='pdf' data-oid='_z.3b8a'>
              PDF
            </option>
            <option value='excel' data-oid='b0ds4o7'>
              Excel
            </option>
          </select>
        </div>
      </div>

      <div data-oid='yeg_luu'>
        <label
          className='block text-sm font-medium text-gray-700 mb-1'
          data-oid='mbfywby'
        >
          Recipients
        </label>
        {reportConfig.recipients.map((email, index) => (
          <div key={index} className='flex mb-2' data-oid='2kv11cz'>
            <input
              type='email'
              value={email}
              onChange={e => updateRecipient(index, e.target.value)}
              placeholder='recipient@example.com'
              className='flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              data-oid='m.heb2:'
            />

            <button
              onClick={() => removeRecipient(index)}
              className='px-3 py-2 bg-red-500 text-white rounded-r-md hover:bg-red-600 transition-colors duration-200'
              data-oid='gf3cpt9'
            >
              Remove
            </button>
          </div>
        ))}
        <button
          onClick={addRecipient}
          className='text-blue-600 hover:text-blue-800 text-sm'
          data-oid='ric-m5.'
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
        data-oid='w_t8pcp'
      >
        Schedule Report
      </button>
    </div>
  );
};
