/**
 * Theme Example
 * Comprehensive demonstration of the theming and customization system
 * with live preview, multiple chart types, and real-time theme switching.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Theme, themeEngine } from '../ThemeEngine';
import { RealTimeChart } from '../components/RealTimeChart';
import { ThemeCustomizer } from '../components/ThemeCustomizer';
import { UniversalChart } from '../components/UniversalChart';
import './ThemeExample.css';

// Sample data for charts
const generateSampleData = () => ({
  lineData: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue',
        data: [65, 59, 80, 81, 56, 95],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Expenses',
        data: [28, 48, 40, 39, 30, 45],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
      },
    ],
  },
  barData: {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
      {
        label: 'Sales',
        data: [120, 190, 300, 250],
        backgroundColor: ['#3b82f6', '#1d4ed8', '#7c3aed', '#059669'],
        borderColor: ['#2563eb', '#1e40af', '#6d28d9', '#047857'],
        borderWidth: 2,
      },
    ],
  },
  doughnutData: {
    labels: ['Desktop', 'Mobile', 'Tablet'],
    datasets: [
      {
        data: [55, 35, 10],
        backgroundColor: ['#3b82f6', '#1d4ed8', '#7c3aed'],
        borderColor: ['#2563eb', '#1e40af', '#6d28d9'],
        borderWidth: 2,
      },
    ],
  },
  scatterData: {
    datasets: [
      {
        label: 'Dataset 1',
        data: Array.from({ length: 50 }, () => ({
          x: Math.random() * 100,
          y: Math.random() * 100,
        })),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: '#3b82f6',
      },
      {
        label: 'Dataset 2',
        data: Array.from({ length: 30 }, () => ({
          x: Math.random() * 100,
          y: Math.random() * 100,
        })),
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
        borderColor: '#ef4444',
      },
    ],
  },
});

interface ThemeExampleProps {
  onThemeChange?: (theme: Theme) => void;
}

export const ThemeExample: React.FC<ThemeExampleProps> = ({
  onThemeChange,
}) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(
    themeEngine.getCurrentTheme()
  );
  const [activeTab, setActiveTab] = useState<
    'customizer' | 'preview' | 'examples'
  >('preview');
  const [sampleData] = useState(generateSampleData());
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: 'success' | 'error' | 'warning' | 'info';
      message: string;
    }>
  >([]);
  const [previewChartType, setPreviewChartType] = useState<
    'line' | 'bar' | 'doughnut' | 'scatter'
  >('line');
  const [isLoading, setIsLoading] = useState(false);

  // Handle theme changes
  const handleThemeChange = useCallback(
    (theme: Theme) => {
      setCurrentTheme(theme);
      onThemeChange?.(theme);

      // Apply theme to document
      applyThemeToDocument(theme);

      // Show notification
      addNotification('success', `Applied theme: ${theme.name}`);
    },
    [onThemeChange]
  );

  // Apply theme to document
  const applyThemeToDocument = useCallback((theme: Theme) => {
    const root = document.documentElement;

    // Apply color palette
    root.style.setProperty('--theme-primary', theme.colorPalette.primary[0]);
    root.style.setProperty(
      '--theme-secondary',
      theme.colorPalette.secondary[0]
    );
    root.style.setProperty(
      '--theme-success',
      theme.colorPalette.semantic.success[0]
    );
    root.style.setProperty(
      '--theme-warning',
      theme.colorPalette.semantic.warning[0]
    );
    root.style.setProperty(
      '--theme-error',
      theme.colorPalette.semantic.error[0]
    );
    root.style.setProperty('--theme-info', theme.colorPalette.semantic.info[0]);

    // Apply typography
    root.style.setProperty(
      '--theme-font-primary',
      theme.typography.fontFamily.primary
    );
    root.style.setProperty(
      '--theme-font-secondary',
      theme.typography.fontFamily.secondary
    );
    root.style.setProperty(
      '--theme-font-mono',
      theme.typography.fontFamily.monospace
    );

    // Apply spacing
    root.style.setProperty('--theme-spacing-sm', theme.spacing.sm);
    root.style.setProperty('--theme-spacing-md', theme.spacing.md);
    root.style.setProperty('--theme-spacing-lg', theme.spacing.lg);

    // Apply border radius
    root.style.setProperty('--theme-radius-sm', theme.borderRadius.sm);
    root.style.setProperty('--theme-radius-md', theme.borderRadius.md);
    root.style.setProperty('--theme-radius-lg', theme.borderRadius.lg);

    // Set theme category for styling
    document.body.setAttribute('data-theme-category', theme.category);
  }, []);

  // Add notification
  const addNotification = useCallback(
    (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
      const id = `notification-${Date.now()}-${Math.random()}`;
      setNotifications(prev => [...prev, { id, type, message }]);

      // Auto remove after 3 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 3000);
    },
    []
  );

  // Remove notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Handle theme export
  const handleExportTheme = useCallback(() => {
    try {
      const themeJson = themeEngine.exportTheme(currentTheme.id);
      const blob = new Blob([themeJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentTheme.name.toLowerCase().replace(/\s+/g, '-')}-theme.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addNotification('success', 'Theme exported successfully');
    } catch (error) {
      addNotification('error', 'Failed to export theme');
    }
  }, [currentTheme, addNotification]);

  // Handle theme import
  const handleImportTheme = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const themeJson = e.target?.result as string;
          const success = themeEngine.importTheme(themeJson);
          if (success) {
            addNotification('success', 'Theme imported successfully');
            setCurrentTheme(themeEngine.getCurrentTheme());
          } else {
            addNotification('error', 'Invalid theme file');
          }
        } catch (error) {
          addNotification('error', 'Failed to import theme');
        } finally {
          setIsLoading(false);
          // Clear input value
          event.target.value = '';
        }
      };
      reader.readAsText(file);
    },
    [addNotification]
  );

  // Generate random theme
  const generateRandomTheme = useCallback(() => {
    const colors = [
      '#3b82f6',
      '#1d4ed8',
      '#7c3aed',
      '#059669',
      '#f59e0b',
      '#ef4444',
      '#ec4899',
      '#8b5cf6',
    ];

    const baseColor = colors[Math.floor(Math.random() * colors.length)];

    const randomTheme: Theme = {
      ...currentTheme,
      id: `random-${Date.now()}`,
      name: `Random Theme ${new Date().toLocaleTimeString()}`,
      description: 'Randomly generated theme',
      category: 'custom',
      colorPalette: {
        ...currentTheme.colorPalette,
        primary: themeEngine.generateColorPalette(baseColor, { count: 5 }),
      },
    };

    themeEngine.registerTheme(randomTheme);
    themeEngine.setTheme(randomTheme.id);
    addNotification('success', 'Generated random theme');
  }, [currentTheme, addNotification]);

  // Reset to default theme
  const resetToDefault = useCallback(() => {
    themeEngine.setTheme('default');
    addNotification('info', 'Reset to default theme');
  }, [addNotification]);

  // Initialize theme engine observer
  useEffect(() => {
    const handleThemeUpdate = (theme: Theme) => {
      setCurrentTheme(theme);
      applyThemeToDocument(theme);
    };

    themeEngine.addObserver(handleThemeUpdate);
    applyThemeToDocument(currentTheme);

    return () => {
      themeEngine.removeObserver(handleThemeUpdate);
    };
  }, [currentTheme, applyThemeToDocument]);

  return (
    <div className='theme-example' data-oid='1a659id'>
      {/* Header */}
      <div className='theme-example-header' data-oid='hsct62p'>
        <div className='header-content' data-oid='srb99fm'>
          <h1 data-oid='3ngj4l7'>Theme System Demonstration</h1>
          <p data-oid='tg26tc-'>
            Comprehensive theming and customization capabilities with live
            preview
          </p>
        </div>

        <div className='header-actions' data-oid='5k0p44k'>
          <button
            className='btn btn-outline'
            onClick={generateRandomTheme}
            disabled={isLoading}
            data-oid='myt-u2v'
          >
            🎲 Random Theme
          </button>

          <button
            className='btn btn-outline'
            onClick={resetToDefault}
            disabled={isLoading}
            data-oid='dl-267s'
          >
            🔄 Reset Default
          </button>

          <button
            className='btn btn-secondary'
            onClick={handleExportTheme}
            disabled={isLoading}
            data-oid='ai3nvq4'
          >
            📁 Export Theme
          </button>

          <label
            className='btn btn-primary'
            style={{ cursor: 'pointer' }}
            data-oid='liv9_we'
          >
            📂 Import Theme
            <input
              type='file'
              accept='.json'
              onChange={handleImportTheme}
              style={{ display: 'none' }}
              data-oid='n:qmfc1'
            />
          </label>
        </div>
      </div>

      {/* Navigation */}
      <div className='theme-example-nav' data-oid='nf2y9al'>
        <button
          className={`nav-tab ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveTab('preview')}
          data-oid='q5moqog'
        >
          🎨 Live Preview
        </button>
        <button
          className={`nav-tab ${activeTab === 'customizer' ? 'active' : ''}`}
          onClick={() => setActiveTab('customizer')}
          data-oid='x60qmbp'
        >
          ⚙️ Theme Editor
        </button>
        <button
          className={`nav-tab ${activeTab === 'examples' ? 'active' : ''}`}
          onClick={() => setActiveTab('examples')}
          data-oid='fvtq2kp'
        >
          📊 Chart Examples
        </button>
      </div>

      {/* Content */}
      <div className='theme-example-content' data-oid='wdeblxo'>
        {/* Live Preview Tab */}
        {activeTab === 'preview' && (
          <div className='preview-section' data-oid=':ha0opw'>
            <div className='preview-header' data-oid='qj:bjb-'>
              <h2 data-oid='rchz85g'>Live Theme Preview</h2>
              <div className='chart-type-selector' data-oid='1vgg:y6'>
                <label data-oid='ml7gizp'>Chart Type:</label>
                <select
                  value={previewChartType}
                  onChange={e => setPreviewChartType(e.target.value as any)}
                  className='form-select'
                  data-oid='po4jges'
                >
                  <option value='line' data-oid=':oeghk8'>
                    Line Chart
                  </option>
                  <option value='bar' data-oid='6-yfhgk'>
                    Bar Chart
                  </option>
                  <option value='doughnut' data-oid='z04osuo'>
                    Doughnut Chart
                  </option>
                  <option value='scatter' data-oid='ba474wp'>
                    Scatter Plot
                  </option>
                </select>
              </div>
            </div>

            <div className='preview-container' data-oid='uqb7z7p'>
              <div className='preview-chart' data-oid='s882qxh'>
                <UniversalChart
                  type={previewChartType}
                  data={sampleData[`${previewChartType}Data`]}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                        labels: {
                          color: currentTheme.chart.legend.textColor,
                          font: {
                            family: currentTheme.typography.fontFamily.primary,
                            size: parseInt(currentTheme.typography.fontSize.sm),
                          },
                        },
                      },
                      title: {
                        display: true,
                        text: `${previewChartType.charAt(0).toUpperCase() + previewChartType.slice(1)} Chart Preview`,
                        color: currentTheme.chart.axes.titleColor,
                        font: {
                          family: currentTheme.typography.fontFamily.primary,
                          size: parseInt(currentTheme.typography.fontSize.lg),
                          weight: currentTheme.typography.fontWeight.semibold,
                        },
                      },
                    },
                    scales:
                      previewChartType !== 'doughnut'
                        ? {
                            x: {
                              ticks: {
                                color: currentTheme.chart.axes.labelColor,
                              },
                              grid: {
                                color: currentTheme.chart.grid.color,
                                lineWidth: currentTheme.chart.grid.strokeWidth,
                              },
                            },
                            y: {
                              ticks: {
                                color: currentTheme.chart.axes.labelColor,
                              },
                              grid: {
                                color: currentTheme.chart.grid.color,
                                lineWidth: currentTheme.chart.grid.strokeWidth,
                              },
                            },
                          }
                        : undefined,
                  }}
                  data-oid='ufs4may'
                />
              </div>

              <div className='theme-info' data-oid='t_fcso1'>
                <div className='theme-info-card' data-oid='syj5bny'>
                  <h3 data-oid='h-:6wyz'>Current Theme</h3>
                  <div className='theme-details' data-oid='hh8d29e'>
                    <div className='detail-item' data-oid='6xs_u:r'>
                      <label data-oid='qc1ovxf'>Name:</label>
                      <span data-oid='.vgw:4g'>{currentTheme.name}</span>
                    </div>
                    <div className='detail-item' data-oid='o32_:yv'>
                      <label data-oid='b473fj3'>Category:</label>
                      <span
                        className={`category-badge ${currentTheme.category}`}
                        data-oid='9j2iaq0'
                      >
                        {currentTheme.category}
                      </span>
                    </div>
                    <div className='detail-item' data-oid='zd_2hng'>
                      <label data-oid='uplnhvl'>Version:</label>
                      <span data-oid='9k2lbm.'>{currentTheme.version}</span>
                    </div>
                    <div className='detail-item' data-oid='h8ub1r4'>
                      <label data-oid='1fvx9wm'>Author:</label>
                      <span data-oid='xcjkslx'>{currentTheme.author}</span>
                    </div>
                  </div>
                </div>

                <div className='color-palette-preview' data-oid='_b69gv0'>
                  <h4 data-oid='3vx1oz8'>Color Palette</h4>
                  <div className='palette-colors' data-oid='u95y.zz'>
                    <div className='color-group' data-oid='jm_tp13'>
                      <label data-oid='orhbna1'>Primary</label>
                      <div className='color-swatches' data-oid='a4kqmqx'>
                        {currentTheme.colorPalette.primary.map(
                          (color, index) => (
                            <div
                              key={index}
                              className='color-swatch'
                              style={{ backgroundColor: color }}
                              title={color}
                              data-oid='pp4zvb8'
                            />
                          )
                        )}
                      </div>
                    </div>
                    <div className='color-group' data-oid='6n_3p9d'>
                      <label data-oid='rlfz611'>Secondary</label>
                      <div className='color-swatches' data-oid='hu4-yz-'>
                        {currentTheme.colorPalette.secondary.map(
                          (color, index) => (
                            <div
                              key={index}
                              className='color-swatch'
                              style={{ backgroundColor: color }}
                              title={color}
                              data-oid='s.rme3e'
                            />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Theme Editor Tab */}
        {activeTab === 'customizer' && (
          <div className='customizer-section' data-oid='6jr23yh'>
            <ThemeCustomizer
              onThemeChange={handleThemeChange}
              showPreview={false}
              className='full-customizer'
              data-oid='mxu9hmn'
            />
          </div>
        )}

        {/* Chart Examples Tab */}
        {activeTab === 'examples' && (
          <div className='examples-section' data-oid='ej1zj6-'>
            <h2 data-oid='xhr6c4l'>Chart Examples Gallery</h2>
            <div className='examples-grid' data-oid='gsqs:k5'>
              {/* Line Chart Example */}
              <div className='example-card' data-oid='2h36zkh'>
                <h3 data-oid='vq8sozh'>📈 Line Chart</h3>
                <div className='example-chart' data-oid='b2j-qg-'>
                  <UniversalChart
                    type='line'
                    data={sampleData.lineData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'bottom' as const },
                      },
                    }}
                    data-oid='js--bdb'
                  />
                </div>
                <div className='example-description' data-oid='gvfsnb:'>
                  Perfect for showing trends over time with multiple data
                  series.
                </div>
              </div>

              {/* Bar Chart Example */}
              <div className='example-card' data-oid='y04jy_-'>
                <h3 data-oid='kkpmo5b'>📊 Bar Chart</h3>
                <div className='example-chart' data-oid='8f6jqyo'>
                  <UniversalChart
                    type='bar'
                    data={sampleData.barData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                      },
                    }}
                    data-oid='go6y4-1'
                  />
                </div>
                <div className='example-description' data-oid='0848:k5'>
                  Ideal for comparing categorical data with clear visual
                  distinction.
                </div>
              </div>

              {/* Doughnut Chart Example */}
              <div className='example-card' data-oid='k-e2.d-'>
                <h3 data-oid='0ir_9.a'>🍩 Doughnut Chart</h3>
                <div className='example-chart' data-oid='8.24exo'>
                  <UniversalChart
                    type='doughnut'
                    data={sampleData.doughnutData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'right' as const },
                      },
                    }}
                    data-oid='n00so.h'
                  />
                </div>
                <div className='example-description' data-oid='kuzf6.h'>
                  Great for showing proportional data and part-to-whole
                  relationships.
                </div>
              </div>

              {/* Scatter Plot Example */}
              <div className='example-card' data-oid='.5iyxne'>
                <h3 data-oid='b669wol'>🎯 Scatter Plot</h3>
                <div className='example-chart' data-oid='vtg-gfn'>
                  <UniversalChart
                    type='scatter'
                    data={sampleData.scatterData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'top' as const },
                      },
                    }}
                    data-oid='k2dlown'
                  />
                </div>
                <div className='example-description' data-oid='hi0v2_a'>
                  Excellent for visualizing correlations between two variables.
                </div>
              </div>

              {/* Real-time Chart Example */}
              <div className='example-card full-width' data-oid='vo97f-w'>
                <h3 data-oid='hik1g:5'>⚡ Real-time Chart</h3>
                <div className='example-chart' data-oid='rpt8:7l'>
                  <RealTimeChart
                    type='line'
                    dataSource='analytics'
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      maxDataPoints: 50,
                      updateInterval: 1000,
                    }}
                    data-oid='j4zjx-w'
                  />
                </div>
                <div className='example-description' data-oid='3y13p:1'>
                  Live data streaming with automatic updates and trend analysis.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className='notifications-container' data-oid='p4w75sy'>
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`theme-notification ${notification.type}`}
            onClick={() => removeNotification(notification.id)}
            data-oid='lc54bkj'
          >
            <div className='notification-content' data-oid='u-l3all'>
              <span className='notification-icon' data-oid='b5kip9y'>
                {notification.type === 'success' && '✅'}
                {notification.type === 'error' && '❌'}
                {notification.type === 'warning' && '⚠️'}
                {notification.type === 'info' && 'ℹ️'}
              </span>
              <span className='notification-message' data-oid='n4:szzt'>
                {notification.message}
              </span>
            </div>
            <button
              className='notification-close'
              onClick={e => {
                e.stopPropagation();
                removeNotification(notification.id);
              }}
              aria-label='Close notification'
              data-oid='d:xa2wl'
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className='loading-overlay' data-oid='2pchs08'>
          <div className='loading-spinner' data-oid='ih18qv8' />
          <span data-oid='556bf-i'>Processing...</span>
        </div>
      )}
    </div>
  );
};

export default ThemeExample;
