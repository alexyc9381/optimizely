/**
 * Theme Customizer Components
 * Comprehensive React components for theme customization with live preview,
 * color management, typography controls, and branding options.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
    BrandingConfig,
    ChartTheme,
    ColorPalette,
    Theme,
    themeEngine,
    ThemePreset,
    ThemeValidation,
    Typography
} from '../ThemeEngine';

// Color picker component
interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label: string;
  disabled?: boolean;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, label, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempColor, setTempColor] = useState(color);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempColor(color);
  }, [color]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleColorChange = (newColor: string) => {
    setTempColor(newColor);
    onChange(newColor);
  };

  return (
    <div className="color-picker" ref={pickerRef}>
      <label className="color-picker-label">{label}</label>
      <div className="color-picker-container">
        <button
          className="color-picker-trigger"
          style={{ backgroundColor: color }}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          aria-label={`Select color for ${label}`}
        />
        <input
          type="text"
          value={color}
          onChange={(e) => handleColorChange(e.target.value)}
          className="color-picker-input"
          placeholder="#000000"
          disabled={disabled}
        />
      </div>
      {isOpen && !disabled && (
        <div className="color-picker-panel">
          <input
            type="color"
            value={tempColor}
            onChange={(e) => handleColorChange(e.target.value)}
            className="color-picker-native"
          />
          <div className="color-presets">
            {[
              '#3b82f6', '#1d4ed8', '#7c3aed', '#059669',
              '#f59e0b', '#ef4444', '#6b7280', '#000000'
            ].map(presetColor => (
              <button
                key={presetColor}
                className="color-preset"
                style={{ backgroundColor: presetColor }}
                onClick={() => handleColorChange(presetColor)}
                aria-label={`Select preset color ${presetColor}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Color palette editor
interface ColorPaletteEditorProps {
  palette: ColorPalette;
  onChange: (palette: Partial<ColorPalette>) => void;
}

const ColorPaletteEditor: React.FC<ColorPaletteEditorProps> = ({ palette, onChange }) => {
  const [selectedCategory, setSelectedCategory] = useState<'primary' | 'secondary' | 'neutral' | 'accent'>('primary');

  const updateColorInCategory = (category: string, index: number, color: string) => {
    const newPalette = { ...palette };
    (newPalette as any)[category] = [...(newPalette as any)[category]];
    (newPalette as any)[category][index] = color;
    onChange(newPalette);
  };

  const addColorToCategory = (category: string) => {
    const newPalette = { ...palette };
    (newPalette as any)[category] = [...(newPalette as any)[category], '#3b82f6'];
    onChange(newPalette);
  };

  const removeColorFromCategory = (category: string, index: number) => {
    const newPalette = { ...palette };
    (newPalette as any)[category] = (newPalette as any)[category].filter((_: any, i: number) => i !== index);
    onChange(newPalette);
  };

  const generatePalette = () => {
    const baseColor = palette.primary[0];
    const generated = themeEngine.generateColorPalette(baseColor, { count: 5 });
    onChange({
      ...palette,
      primary: generated
    });
  };

  return (
    <div className="color-palette-editor">
      <div className="palette-header">
        <h3>Color Palette</h3>
        <button onClick={generatePalette} className="btn-secondary">
          Generate from Primary
        </button>
      </div>

      <div className="palette-categories">
        {['primary', 'secondary', 'neutral', 'accent'].map(category => (
          <button
            key={category}
            className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category as any)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      <div className="palette-colors">
        {(palette as any)[selectedCategory]?.map((color: string, index: number) => (
          <div key={index} className="palette-color-item">
            <ColorPicker
              color={color}
              onChange={(newColor) => updateColorInCategory(selectedCategory, index, newColor)}
              label={`${selectedCategory} ${index + 1}`}
            />
            <button
              className="remove-color-btn"
              onClick={() => removeColorFromCategory(selectedCategory, index)}
              aria-label="Remove color"
            >
              ×
            </button>
          </div>
        ))}
        <button
          className="add-color-btn"
          onClick={() => addColorToCategory(selectedCategory)}
        >
          + Add Color
        </button>
      </div>

      <div className="semantic-colors">
        <h4>Semantic Colors</h4>
        {Object.entries(palette.semantic).map(([type, colors]) => (
          <div key={type} className="semantic-color-group">
            <label>{type.charAt(0).toUpperCase() + type.slice(1)}</label>
            <div className="semantic-colors-row">
              {colors.map((color, index) => (
                <ColorPicker
                  key={index}
                  color={color}
                  onChange={(newColor) => {
                    const newSemantic = { ...palette.semantic };
                    (newSemantic as any)[type][index] = newColor;
                    onChange({ ...palette, semantic: newSemantic });
                  }}
                  label={`${type} ${index + 1}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Typography editor
interface TypographyEditorProps {
  typography: Typography;
  onChange: (typography: Partial<Typography>) => void;
}

const TypographyEditor: React.FC<TypographyEditorProps> = ({ typography, onChange }) => {
  const [availableFonts] = useState([
    'Inter, sans-serif',
    'Roboto, sans-serif',
    'Open Sans, sans-serif',
    'Lato, sans-serif',
    'Montserrat, sans-serif',
    'Poppins, sans-serif',
    'Source Sans Pro, sans-serif',
    'Helvetica Neue, Helvetica, sans-serif',
    'Georgia, serif',
    'Times New Roman, serif',
    'Monaco, monospace',
    'Courier New, monospace'
  ]);

  const updateFontFamily = (type: 'primary' | 'secondary' | 'monospace', font: string) => {
    onChange({
      ...typography,
      fontFamily: {
        ...typography.fontFamily,
        [type]: font
      }
    });
  };

  const updateFontSize = (size: string, value: string) => {
    onChange({
      ...typography,
      fontSize: {
        ...typography.fontSize,
        [size]: value
      }
    });
  };

  const updateFontWeight = (weight: string, value: string) => {
    onChange({
      ...typography,
      fontWeight: {
        ...typography.fontWeight,
        [weight]: value
      }
    });
  };

  const loadGoogleFonts = async () => {
    try {
      const fonts = [
        typography.fontFamily.primary,
        typography.fontFamily.secondary
      ].filter(font => font.includes('Google'));

      if (fonts.length > 0) {
        await themeEngine.loadGoogleFonts(fonts);
      }
    } catch (error) {
      console.error('Failed to load Google Fonts:', error);
    }
  };

  return (
    <div className="typography-editor">
      <div className="typography-header">
        <h3>Typography</h3>
        <button onClick={loadGoogleFonts} className="btn-secondary">
          Load Google Fonts
        </button>
      </div>

      <div className="font-families">
        <h4>Font Families</h4>
        {Object.entries(typography.fontFamily).map(([type, font]) => (
          <div key={type} className="font-family-control">
            <label>{type.charAt(0).toUpperCase() + type.slice(1)}</label>
            <select
              value={font}
              onChange={(e) => updateFontFamily(type as any, e.target.value)}
              className="font-select"
            >
              {availableFonts.map(fontOption => (
                <option key={fontOption} value={fontOption}>
                  {fontOption}
                </option>
              ))}
            </select>
            <div
              className="font-preview"
              style={{ fontFamily: font }}
            >
              The quick brown fox jumps over the lazy dog
            </div>
          </div>
        ))}
      </div>

      <div className="font-sizes">
        <h4>Font Sizes</h4>
        <div className="size-controls">
          {Object.entries(typography.fontSize).map(([size, value]) => (
            <div key={size} className="size-control">
              <label>{size}</label>
              <input
                type="text"
                value={value}
                onChange={(e) => updateFontSize(size, e.target.value)}
                className="size-input"
                placeholder="1rem"
              />
              <div
                className="size-preview"
                style={{ fontSize: value }}
              >
                Sample Text
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="font-weights">
        <h4>Font Weights</h4>
        <div className="weight-controls">
          {Object.entries(typography.fontWeight).map(([weight, value]) => (
            <div key={weight} className="weight-control">
              <label>{weight}</label>
              <select
                value={value}
                onChange={(e) => updateFontWeight(weight, e.target.value)}
                className="weight-select"
              >
                <option value="100">100 - Thin</option>
                <option value="200">200 - Extra Light</option>
                <option value="300">300 - Light</option>
                <option value="400">400 - Normal</option>
                <option value="500">500 - Medium</option>
                <option value="600">600 - Semi Bold</option>
                <option value="700">700 - Bold</option>
                <option value="800">800 - Extra Bold</option>
                <option value="900">900 - Black</option>
              </select>
              <div
                className="weight-preview"
                style={{ fontWeight: value }}
              >
                Sample Text
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Branding editor
interface BrandingEditorProps {
  branding: BrandingConfig;
  onChange: (branding: Partial<BrandingConfig>) => void;
}

const BrandingEditor: React.FC<BrandingEditorProps> = ({ branding, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      onChange({
        ...branding,
        logo: {
          ...branding.logo,
          base64,
          url: undefined
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const enableWhiteLabel = () => {
    onChange({
      ...branding,
      whiteLabel: true,
      hideOptimizelyBranding: true
    });
  };

  return (
    <div className="branding-editor">
      <div className="branding-header">
        <h3>Branding & White Label</h3>
        <button
          onClick={enableWhiteLabel}
          className={`btn-${branding.whiteLabel ? 'primary' : 'secondary'}`}
        >
          {branding.whiteLabel ? 'White Label Enabled' : 'Enable White Label'}
        </button>
      </div>

      <div className="company-info">
        <h4>Company Information</h4>
        <div className="form-group">
          <label>Company Name</label>
          <input
            type="text"
            value={branding.companyName}
            onChange={(e) => onChange({ ...branding, companyName: e.target.value })}
            className="form-input"
            placeholder="Your Company Name"
          />
        </div>

        <div className="brand-colors">
          <h4>Brand Colors</h4>
          <div className="color-row">
            <ColorPicker
              color={branding.primaryColor}
              onChange={(color) => onChange({ ...branding, primaryColor: color })}
              label="Primary Color"
            />
            <ColorPicker
              color={branding.secondaryColor}
              onChange={(color) => onChange({ ...branding, secondaryColor: color })}
              label="Secondary Color"
            />
            <ColorPicker
              color={branding.accentColor}
              onChange={(color) => onChange({ ...branding, accentColor: color })}
              label="Accent Color"
            />
          </div>
        </div>
      </div>

      <div className="logo-section">
        <h4>Logo</h4>
        <div className="logo-upload">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary"
          >
            Upload Logo
          </button>
          {(branding.logo.url || branding.logo.base64) && (
            <img
              src={branding.logo.url || branding.logo.base64}
              alt="Logo preview"
              className="logo-preview"
              style={{
                width: branding.logo.width,
                height: branding.logo.height,
                opacity: branding.logo.opacity
              }}
            />
          )}
        </div>

        <div className="logo-controls">
          <div className="form-group">
            <label>Width (px)</label>
            <input
              type="number"
              value={branding.logo.width}
              onChange={(e) => onChange({
                ...branding,
                logo: { ...branding.logo, width: parseInt(e.target.value) }
              })}
              className="form-input"
              min="1"
            />
          </div>
          <div className="form-group">
            <label>Height (px)</label>
            <input
              type="number"
              value={branding.logo.height}
              onChange={(e) => onChange({
                ...branding,
                logo: { ...branding.logo, height: parseInt(e.target.value) }
              })}
              className="form-input"
              min="1"
            />
          </div>
          <div className="form-group">
            <label>Position</label>
            <select
              value={branding.logo.position}
              onChange={(e) => onChange({
                ...branding,
                logo: { ...branding.logo, position: e.target.value as any }
              })}
              className="form-select"
            >
              <option value="top-left">Top Left</option>
              <option value="top-right">Top Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-right">Bottom Right</option>
              <option value="center">Center</option>
            </select>
          </div>
          <div className="form-group">
            <label>Opacity</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={branding.logo.opacity}
              onChange={(e) => onChange({
                ...branding,
                logo: { ...branding.logo, opacity: parseFloat(e.target.value) }
              })}
              className="form-range"
            />
            <span>{branding.logo.opacity}</span>
          </div>
        </div>
      </div>

      <div className="watermark-section">
        <h4>Watermark</h4>
        <div className="form-group">
          <label>Watermark Text</label>
          <input
            type="text"
            value={branding.watermark.text || ''}
            onChange={(e) => onChange({
              ...branding,
              watermark: { ...branding.watermark, text: e.target.value }
            })}
            className="form-input"
            placeholder="© Your Company 2024"
          />
        </div>
        <div className="watermark-controls">
          <ColorPicker
            color={branding.watermark.color}
            onChange={(color) => onChange({
              ...branding,
              watermark: { ...branding.watermark, color }
            })}
            label="Watermark Color"
          />
          <div className="form-group">
            <label>Font Size</label>
            <input
              type="text"
              value={branding.watermark.fontSize}
              onChange={(e) => onChange({
                ...branding,
                watermark: { ...branding.watermark, fontSize: e.target.value }
              })}
              className="form-input"
              placeholder="12px"
            />
          </div>
          <div className="form-group">
            <label>Position</label>
            <select
              value={branding.watermark.position}
              onChange={(e) => onChange({
                ...branding,
                watermark: { ...branding.watermark, position: e.target.value as any }
              })}
              className="form-select"
            >
              <option value="top-left">Top Left</option>
              <option value="top-right">Top Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-right">Bottom Right</option>
            </select>
          </div>
        </div>
      </div>

      <div className="custom-css-section">
        <h4>Custom CSS</h4>
        <textarea
          value={branding.customCSS || ''}
          onChange={(e) => onChange({ ...branding, customCSS: e.target.value })}
          className="custom-css-editor"
          placeholder="/* Add your custom CSS here */"
          rows={8}
        />
      </div>

      <div className="advanced-options">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={branding.hideOptimizelyBranding}
            onChange={(e) => onChange({ ...branding, hideOptimizelyBranding: e.target.checked })}
          />
          Hide Optimizely Branding
        </label>
      </div>
    </div>
  );
};

// Chart theme editor
interface ChartThemeEditorProps {
  chartTheme: ChartTheme;
  onChange: (chartTheme: Partial<ChartTheme>) => void;
}

const ChartThemeEditor: React.FC<ChartThemeEditorProps> = ({ chartTheme, onChange }) => {
  return (
    <div className="chart-theme-editor">
      <h3>Chart Styling</h3>

      <div className="chart-sections">
        <div className="chart-section">
          <h4>Grid</h4>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={chartTheme.grid.show}
              onChange={(e) => onChange({
                ...chartTheme,
                grid: { ...chartTheme.grid, show: e.target.checked }
              })}
            />
            Show Grid
          </label>
          {chartTheme.grid.show && (
            <div className="grid-controls">
              <ColorPicker
                color={chartTheme.grid.color}
                onChange={(color) => onChange({
                  ...chartTheme,
                  grid: { ...chartTheme.grid, color }
                })}
                label="Grid Color"
              />
              <div className="form-group">
                <label>Opacity</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={chartTheme.grid.opacity}
                  onChange={(e) => onChange({
                    ...chartTheme,
                    grid: { ...chartTheme.grid, opacity: parseFloat(e.target.value) }
                  })}
                  className="form-range"
                />
                <span>{chartTheme.grid.opacity}</span>
              </div>
              <div className="form-group">
                <label>Stroke Width</label>
                <input
                  type="number"
                  value={chartTheme.grid.strokeWidth}
                  onChange={(e) => onChange({
                    ...chartTheme,
                    grid: { ...chartTheme.grid, strokeWidth: parseInt(e.target.value) }
                  })}
                  className="form-input"
                  min="1"
                />
              </div>
            </div>
          )}
        </div>

        <div className="chart-section">
          <h4>Axes</h4>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={chartTheme.axes.show}
              onChange={(e) => onChange({
                ...chartTheme,
                axes: { ...chartTheme.axes, show: e.target.checked }
              })}
            />
            Show Axes
          </label>
          {chartTheme.axes.show && (
            <div className="axes-controls">
              <ColorPicker
                color={chartTheme.axes.color}
                onChange={(color) => onChange({
                  ...chartTheme,
                  axes: { ...chartTheme.axes, color }
                })}
                label="Axes Color"
              />
              <ColorPicker
                color={chartTheme.axes.labelColor}
                onChange={(color) => onChange({
                  ...chartTheme,
                  axes: { ...chartTheme.axes, labelColor: color }
                })}
                label="Label Color"
              />
              <ColorPicker
                color={chartTheme.axes.titleColor}
                onChange={(color) => onChange({
                  ...chartTheme,
                  axes: { ...chartTheme.axes, titleColor: color }
                })}
                label="Title Color"
              />
            </div>
          )}
        </div>

        <div className="chart-section">
          <h4>Legend</h4>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={chartTheme.legend.show}
              onChange={(e) => onChange({
                ...chartTheme,
                legend: { ...chartTheme.legend, show: e.target.checked }
              })}
            />
            Show Legend
          </label>
          {chartTheme.legend.show && (
            <div className="legend-controls">
              <div className="form-group">
                <label>Position</label>
                <select
                  value={chartTheme.legend.position}
                  onChange={(e) => onChange({
                    ...chartTheme,
                    legend: { ...chartTheme.legend, position: e.target.value as any }
                  })}
                  className="form-select"
                >
                  <option value="top">Top</option>
                  <option value="right">Right</option>
                  <option value="bottom">Bottom</option>
                  <option value="left">Left</option>
                  <option value="top-left">Top Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-right">Bottom Right</option>
                </select>
              </div>
              <ColorPicker
                color={chartTheme.legend.backgroundColor}
                onChange={(color) => onChange({
                  ...chartTheme,
                  legend: { ...chartTheme.legend, backgroundColor: color }
                })}
                label="Background Color"
              />
              <ColorPicker
                color={chartTheme.legend.textColor}
                onChange={(color) => onChange({
                  ...chartTheme,
                  legend: { ...chartTheme.legend, textColor: color }
                })}
                label="Text Color"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Theme preset selector
interface ThemePresetSelectorProps {
  onApplyPreset: (presetId: string) => void;
  currentThemeId: string;
}

const ThemePresetSelector: React.FC<ThemePresetSelectorProps> = ({ onApplyPreset, currentThemeId }) => {
  const [presets, setPresets] = useState<ThemePreset[]>([]);
  const [availableThemes, setAvailableThemes] = useState<Theme[]>([]);

  useEffect(() => {
    setPresets(themeEngine.getPresets());
    setAvailableThemes(themeEngine.getAvailableThemes());
  }, []);

  return (
    <div className="theme-preset-selector">
      <h3>Theme Presets</h3>

      <div className="built-in-themes">
        <h4>Built-in Themes</h4>
        <div className="theme-grid">
          {availableThemes.map(theme => (
            <div
              key={theme.id}
              className={`theme-card ${currentThemeId === theme.id ? 'active' : ''}`}
              onClick={() => themeEngine.setTheme(theme.id)}
            >
              <div className="theme-thumbnail">
                <div
                  className="color-bar"
                  style={{ backgroundColor: theme.colorPalette.primary[0] }}
                />
                <div
                  className="color-bar"
                  style={{ backgroundColor: theme.colorPalette.secondary[0] }}
                />
                <div
                  className="color-bar"
                  style={{ backgroundColor: theme.colorPalette.accent[0] }}
                />
              </div>
              <div className="theme-info">
                <h5>{theme.name}</h5>
                <p>{theme.description}</p>
                <span className="theme-category">{theme.category}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="custom-presets">
        <h4>Custom Presets</h4>
        <div className="preset-grid">
          {presets.map(preset => (
            <div
              key={preset.id}
              className="preset-card"
              onClick={() => onApplyPreset(preset.id)}
            >
              <img
                src={preset.thumbnail}
                alt={preset.name}
                className="preset-thumbnail"
              />
              <div className="preset-info">
                <h5>{preset.name}</h5>
                <span className="preset-category">{preset.category}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Main theme customizer component
export interface ThemeCustomizerProps {
  onThemeChange?: (theme: Theme) => void;
  showPreview?: boolean;
  className?: string;
}

export const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({
  onThemeChange,
  showPreview = true,
  className = ''
}) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themeEngine.getCurrentTheme());
  const [activeTab, setActiveTab] = useState<'presets' | 'colors' | 'typography' | 'branding' | 'chart'>('presets');
  const [validation, setValidation] = useState<ThemeValidation>({ isValid: true, errors: [], warnings: [] });
  const [previewData] = useState([
    { name: 'Jan', value: 120, category: 'A' },
    { name: 'Feb', value: 190, category: 'B' },
    { name: 'Mar', value: 300, category: 'A' },
    { name: 'Apr', value: 500, category: 'C' },
    { name: 'May', value: 200, category: 'B' },
    { name: 'Jun', value: 400, category: 'A' }
  ]);

  useEffect(() => {
    const handleThemeChange = (theme: Theme) => {
      setCurrentTheme(theme);
      setValidation(themeEngine.validateTheme(theme));
      onThemeChange?.(theme);
    };

    themeEngine.addObserver(handleThemeChange);

    return () => {
      themeEngine.removeObserver(handleThemeChange);
    };
  }, [onThemeChange]);

  const handleColorPaletteChange = (palette: Partial<ColorPalette>) => {
    themeEngine.updateColorPalette(palette);
  };

  const handleTypographyChange = (typography: Partial<Typography>) => {
    themeEngine.updateTypography(typography);
  };

  const handleBrandingChange = (branding: Partial<BrandingConfig>) => {
    themeEngine.updateBranding(branding);
  };

  const handleChartThemeChange = (chartTheme: Partial<ChartTheme>) => {
    themeEngine.updateChartTheme(chartTheme);
  };

  const handleApplyPreset = (presetId: string) => {
    themeEngine.applyPreset(presetId);
  };

  const exportTheme = () => {
    try {
      const themeJson = themeEngine.exportTheme();
      const blob = new Blob([themeJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentTheme.name.toLowerCase().replace(/\s+/g, '-')}-theme.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export theme:', error);
    }
  };

  const importTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const themeJson = e.target?.result as string;
        if (themeEngine.importTheme(themeJson)) {
          console.log('Theme imported successfully');
        }
      } catch (error) {
        console.error('Failed to import theme:', error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={`theme-customizer ${className}`}>
      <div className="customizer-header">
        <h2>Theme Customizer</h2>
        <div className="header-actions">
          <label className="import-btn">
            <input
              type="file"
              accept=".json"
              onChange={importTheme}
              style={{ display: 'none' }}
            />
            Import Theme
          </label>
          <button onClick={exportTheme} className="btn-secondary">
            Export Theme
          </button>
        </div>
      </div>

      {!validation.isValid && (
        <div className="validation-errors">
          <h4>Theme Validation Errors:</h4>
          <ul>
            {validation.errors.map((error, index) => (
              <li key={index} className="error">{error}</li>
            ))}
          </ul>
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div className="validation-warnings">
          <h4>Warnings:</h4>
          <ul>
            {validation.warnings.map((warning, index) => (
              <li key={index} className="warning">{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="customizer-tabs">
        {[
          { id: 'presets', label: 'Presets' },
          { id: 'colors', label: 'Colors' },
          { id: 'typography', label: 'Typography' },
          { id: 'branding', label: 'Branding' },
          { id: 'chart', label: 'Chart' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as any)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="customizer-content">
        <div className="customizer-panel">
          {activeTab === 'presets' && (
            <ThemePresetSelector
              onApplyPreset={handleApplyPreset}
              currentThemeId={currentTheme.id}
            />
          )}
          {activeTab === 'colors' && (
            <ColorPaletteEditor
              palette={currentTheme.colorPalette}
              onChange={handleColorPaletteChange}
            />
          )}
          {activeTab === 'typography' && (
            <TypographyEditor
              typography={currentTheme.typography}
              onChange={handleTypographyChange}
            />
          )}
          {activeTab === 'branding' && (
            <BrandingEditor
              branding={currentTheme.branding}
              onChange={handleBrandingChange}
            />
          )}
          {activeTab === 'chart' && (
            <ChartThemeEditor
              chartTheme={currentTheme.chart}
              onChange={handleChartThemeChange}
            />
          )}
        </div>

        {showPreview && (
          <div className="theme-preview">
            <h3>Live Preview</h3>
            <div className="preview-container">
              <div className="preview-chart">
                <svg width="300" height="200" viewBox="0 0 300 200">
                  {/* Simple bar chart preview */}
                  {previewData.map((item, index) => (
                    <rect
                      key={index}
                      x={index * 45 + 20}
                      y={200 - item.value * 0.3}
                      width={30}
                      height={item.value * 0.3}
                      fill={currentTheme.colorPalette.primary[index % currentTheme.colorPalette.primary.length]}
                    />
                  ))}

                  {/* Grid lines */}
                  {currentTheme.chart.grid.show && (
                    <>
                      <line
                        x1="20" y1="50" x2="280" y2="50"
                        stroke={currentTheme.chart.grid.color}
                        strokeWidth={currentTheme.chart.grid.strokeWidth}
                        opacity={currentTheme.chart.grid.opacity}
                      />
                      <line
                        x1="20" y1="100" x2="280" y2="100"
                        stroke={currentTheme.chart.grid.color}
                        strokeWidth={currentTheme.chart.grid.strokeWidth}
                        opacity={currentTheme.chart.grid.opacity}
                      />
                      <line
                        x1="20" y1="150" x2="280" y2="150"
                        stroke={currentTheme.chart.grid.color}
                        strokeWidth={currentTheme.chart.grid.strokeWidth}
                        opacity={currentTheme.chart.grid.opacity}
                      />
                    </>
                  )}

                  {/* Axes */}
                  {currentTheme.chart.axes.show && (
                    <>
                      <line
                        x1="20" y1="20" x2="20" y2="200"
                        stroke={currentTheme.chart.axes.color}
                        strokeWidth={currentTheme.chart.axes.strokeWidth}
                      />
                      <line
                        x1="20" y1="200" x2="280" y2="200"
                        stroke={currentTheme.chart.axes.color}
                        strokeWidth={currentTheme.chart.axes.strokeWidth}
                      />
                    </>
                  )}

                  {/* Labels */}
                  {previewData.map((item, index) => (
                    <text
                      key={index}
                      x={index * 45 + 35}
                      y={195}
                      fill={currentTheme.chart.axes.labelColor}
                      fontSize="10"
                      textAnchor="middle"
                    >
                      {item.name}
                    </text>
                  ))}
                </svg>
              </div>

              <div className="preview-elements">
                <div
                  className="preview-text"
                  style={{
                    fontFamily: currentTheme.typography.fontFamily.primary,
                    color: currentTheme.chart.axes.titleColor
                  }}
                >
                  <h4>Sample Chart Title</h4>
                  <p>This is how your text will appear with the current typography settings.</p>
                </div>

                {currentTheme.chart.legend.show && (
                  <div
                    className="preview-legend"
                    style={{
                      backgroundColor: currentTheme.chart.legend.backgroundColor,
                      borderColor: currentTheme.chart.legend.borderColor,
                      borderRadius: currentTheme.chart.legend.borderRadius,
                      color: currentTheme.chart.legend.textColor,
                      fontSize: currentTheme.chart.legend.fontSize
                    }}
                  >
                    Legend Item 1
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Theme provider component for context
export const ThemeProvider: React.FC<{
  children: React.ReactNode;
  initialTheme?: string;
}> = ({ children, initialTheme }) => {
  useEffect(() => {
    if (initialTheme) {
      themeEngine.setTheme(initialTheme);
    }
  }, [initialTheme]);

  return <>{children}</>;
};

export default ThemeCustomizer;
