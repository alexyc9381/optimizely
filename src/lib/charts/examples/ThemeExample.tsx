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
    <div className='theme-example' data-oid='qi5319u'>
      {/* Header */}
      <div className='theme-example-header' data-oid='o9syvu-'>
        <div className='header-content' data-oid='vhox1r2'>
          <h1 data-oid='_g5tsm1'>Theme System Demonstration</h1>
          <p data-oid='4v.5i_l'>
            Comprehensive theming and customization capabilities with live
            preview
          </p>
        </div>

        <div className='header-actions' data-oid='748sfg4'>
          <button
            className='btn btn-outline'
            onClick={generateRandomTheme}
            disabled={isLoading}
            data-oid='2rf.tn3'
          >
            🎲 Random Theme
          </button>

          <button
            className='btn btn-outline'
            onClick={resetToDefault}
            disabled={isLoading}
            data-oid='6d_19js'
          >
            🔄 Reset Default
          </button>

          <button
            className='btn btn-secondary'
            onClick={handleExportTheme}
            disabled={isLoading}
            data-oid='cf1h.r.'
          >
            📁 Export Theme
          </button>

          <label
            className='btn btn-primary'
            style={{ cursor: 'pointer' }}
            data-oid='gshx4aa'
          >
            📂 Import Theme
            <input
              type='file'
              accept='.json'
              onChange={handleImportTheme}
              style={{ display: 'none' }}
              data-oid='hsmh6pp'
            />
          </label>
        </div>
      </div>

      {/* Navigation */}
      <div className='theme-example-nav' data-oid='4j04xf2'>
        <button
          className={`nav-tab ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveTab('preview')}
          data-oid='zapv6w8'
        >
          🎨 Live Preview
        </button>
        <button
          className={`nav-tab ${activeTab === 'customizer' ? 'active' : ''}`}
          onClick={() => setActiveTab('customizer')}
          data-oid='h:z9fr7'
        >
          ⚙️ Theme Editor
        </button>
        <button
          className={`nav-tab ${activeTab === 'examples' ? 'active' : ''}`}
          onClick={() => setActiveTab('examples')}
          data-oid='my-hgjl'
        >
          📊 Chart Examples
        </button>
      </div>

      {/* Content */}
      <div className='theme-example-content' data-oid='d_etjmn'>
        {/* Live Preview Tab */}
        {activeTab === 'preview' && (
          <div className='preview-section' data-oid='msrk-lv'>
            <div className='preview-header' data-oid='hxiplth'>
              <h2 data-oid='swh-08g'>Live Theme Preview</h2>
              <div className='chart-type-selector' data-oid='sksvgmr'>
                <label data-oid='6axa5tp'>Chart Type:</label>
                <select
                  value={previewChartType}
                  onChange={e => setPreviewChartType(e.target.value as any)}
                  className='form-select'
                  data-oid='0fk9pa:'
                >
                  <option value='line' data-oid='c1bfjtw'>
                    Line Chart
                  </option>
                  <option value='bar' data-oid='lbycizn'>
                    Bar Chart
                  </option>
                  <option value='doughnut' data-oid='j1fp2x3'>
                    Doughnut Chart
                  </option>
                  <option value='scatter' data-oid='8mhw91a'>
                    Scatter Plot
                  </option>
                </select>
              </div>
            </div>

            <div className='preview-container' data-oid='pdciz74'>
              <div className='preview-chart' data-oid='cvs6e-e'>
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
                  data-oid='49gj.lh'
                />
              </div>

              <div className='theme-info' data-oid='x93g5-m'>
                <div className='theme-info-card' data-oid='exqmyhu'>
                  <h3 data-oid='ly3f813'>Current Theme</h3>
                  <div className='theme-details' data-oid='lkagm.8'>
                    <div className='detail-item' data-oid='ar47bi6'>
                      <label data-oid='gjt6h4h'>Name:</label>
                      <span data-oid='3frtl51'>{currentTheme.name}</span>
                    </div>
                    <div className='detail-item' data-oid='dkesy6y'>
                      <label data-oid='9gu7_yn'>Category:</label>
                      <span
                        className={`category-badge ${currentTheme.category}`}
                        data-oid='18khb75'
                      >
                        {currentTheme.category}
                      </span>
                    </div>
                    <div className='detail-item' data-oid='l6d-zjb'>
                      <label data-oid='svc4:g5'>Version:</label>
                      <span data-oid='9nvtlik'>{currentTheme.version}</span>
                    </div>
                    <div className='detail-item' data-oid='1-7ixag'>
                      <label data-oid='dz0jyv3'>Author:</label>
                      <span data-oid='bf9khim'>{currentTheme.author}</span>
                    </div>
                  </div>
                </div>

                <div className='color-palette-preview' data-oid='g-idczt'>
                  <h4 data-oid='dv_z0e8'>Color Palette</h4>
                  <div className='palette-colors' data-oid='db9q-:u'>
                    <div className='color-group' data-oid='go0o130'>
                      <label data-oid='82uk8kw'>Primary</label>
                      <div className='color-swatches' data-oid='yui.nl4'>
                        {currentTheme.colorPalette.primary.map(
                          (color, index) => (
                            <div
                              key={index}
                              className='color-swatch'
                              style={{ backgroundColor: color }}
                              title={color}
                              data-oid='yxqpi:i'
                            />
                          )
                        )}
                      </div>
                    </div>
                    <div className='color-group' data-oid='p:l9ay:'>
                      <label data-oid='inms7nf'>Secondary</label>
                      <div className='color-swatches' data-oid='j5c97dn'>
                        {currentTheme.colorPalette.secondary.map(
                          (color, index) => (
                            <div
                              key={index}
                              className='color-swatch'
                              style={{ backgroundColor: color }}
                              title={color}
                              data-oid='.4i4.we'
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
          <div className='customizer-section' data-oid='wkk-_q5'>
            <ThemeCustomizer
              onThemeChange={handleThemeChange}
              showPreview={false}
              className='full-customizer'
              data-oid=':ur-nir'
            />
          </div>
        )}

        {/* Chart Examples Tab */}
        {activeTab === 'examples' && (
          <div className='examples-section' data-oid='0neb5bm'>
            <h2 data-oid='i-2ij.r'>Chart Examples Gallery</h2>
            <div className='examples-grid' data-oid='23p931r'>
              {/* Line Chart Example */}
              <div className='example-card' data-oid='-cv9d-z'>
                <h3 data-oid='j.dx8c.'>📈 Line Chart</h3>
                <div className='example-chart' data-oid='o.qbnjc'>
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
                    data-oid='_.5d_q3'
                  />
                </div>
                <div className='example-description' data-oid='kjkvid.'>
                  Perfect for showing trends over time with multiple data
                  series.
                </div>
              </div>

              {/* Bar Chart Example */}
              <div className='example-card' data-oid='g6:h_o4'>
                <h3 data-oid='21j7uat'>📊 Bar Chart</h3>
                <div className='example-chart' data-oid='uejy_cd'>
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
                    data-oid='y0-e.pa'
                  />
                </div>
                <div className='example-description' data-oid='35lf.kv'>
                  Ideal for comparing categorical data with clear visual
                  distinction.
                </div>
              </div>

              {/* Doughnut Chart Example */}
              <div className='example-card' data-oid='mq70j2j'>
                <h3 data-oid='7i-:290'>🍩 Doughnut Chart</h3>
                <div className='example-chart' data-oid='pa3i5df'>
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
                    data-oid='tkrflb_'
                  />
                </div>
                <div className='example-description' data-oid='abid7:-'>
                  Great for showing proportional data and part-to-whole
                  relationships.
                </div>
              </div>

              {/* Scatter Plot Example */}
              <div className='example-card' data-oid='g4g2ba-'>
                <h3 data-oid=':pfk3hh'>🎯 Scatter Plot</h3>
                <div className='example-chart' data-oid='elxyc_-'>
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
                    data-oid='onvp5ur'
                  />
                </div>
                <div className='example-description' data-oid='l-h0.3z'>
                  Excellent for visualizing correlations between two variables.
                </div>
              </div>

              {/* Real-time Chart Example */}
              <div className='example-card full-width' data-oid='5v:4jty'>
                <h3 data-oid='3pu00d:'>⚡ Real-time Chart</h3>
                <div className='example-chart' data-oid='ppj96sx'>
                  <RealTimeChart
                    type='line'
                    dataSource='analytics'
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      maxDataPoints: 50,
                      updateInterval: 1000,
                    }}
                    data-oid='cuv6j5_'
                  />
                </div>
                <div className='example-description' data-oid='ceio_ha'>
                  Live data streaming with automatic updates and trend analysis.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className='notifications-container' data-oid='ftblas3'>
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`theme-notification ${notification.type}`}
            onClick={() => removeNotification(notification.id)}
            data-oid='6-kl_vr'
          >
            <div className='notification-content' data-oid='unn_piz'>
              <span className='notification-icon' data-oid='0w_3qd9'>
                {notification.type === 'success' && '✅'}
                {notification.type === 'error' && '❌'}
                {notification.type === 'warning' && '⚠️'}
                {notification.type === 'info' && 'ℹ️'}
              </span>
              <span className='notification-message' data-oid='zj9qom2'>
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
              data-oid='zyj0u4j'
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className='loading-overlay' data-oid='yuhk:w1'>
          <div className='loading-spinner' data-oid='8gcn._k' />
          <span data-oid='bfwu-x3'>Processing...</span>
        </div>
      )}
    </div>
  );
};

export default ThemeExample;
