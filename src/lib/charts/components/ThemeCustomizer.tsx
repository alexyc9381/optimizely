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
  Typography,
} from '../ThemeEngine';

// Color picker component
interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label: string;
  disabled?: boolean;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  color,
  onChange,
  label,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempColor, setTempColor] = useState(color);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempColor(color);
  }, [color]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
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
    <div className='color-picker' ref={pickerRef} data-oid='3s2.qu_'>
      <label className='color-picker-label' data-oid='1b9o01v'>
        {label}
      </label>
      <div className='color-picker-container' data-oid='yhpmwpz'>
        <button
          className='color-picker-trigger'
          style={{ backgroundColor: color }}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          aria-label={`Select color for ${label}`}
          data-oid='2oe3cqc'
        />

        <input
          type='text'
          value={color}
          onChange={e => handleColorChange(e.target.value)}
          className='color-picker-input'
          placeholder='#000000'
          disabled={disabled}
          data-oid='z8z2h29'
        />
      </div>
      {isOpen && !disabled && (
        <div className='color-picker-panel' data-oid='.b4lrp:'>
          <input
            type='color'
            value={tempColor}
            onChange={e => handleColorChange(e.target.value)}
            className='color-picker-native'
            data-oid='2zvpya8'
          />

          <div className='color-presets' data-oid='8_mznow'>
            {[
              '#3b82f6',
              '#1d4ed8',
              '#7c3aed',
              '#059669',
              '#f59e0b',
              '#ef4444',
              '#6b7280',
              '#000000',
            ].map(presetColor => (
              <button
                key={presetColor}
                className='color-preset'
                style={{ backgroundColor: presetColor }}
                onClick={() => handleColorChange(presetColor)}
                aria-label={`Select preset color ${presetColor}`}
                data-oid='97o5za.'
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

const ColorPaletteEditor: React.FC<ColorPaletteEditorProps> = ({
  palette,
  onChange,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<
    'primary' | 'secondary' | 'neutral' | 'accent'
  >('primary');

  const updateColorInCategory = (
    category: string,
    index: number,
    color: string
  ) => {
    const newPalette = { ...palette };
    (newPalette as any)[category] = [...(newPalette as any)[category]];
    (newPalette as any)[category][index] = color;
    onChange(newPalette);
  };

  const addColorToCategory = (category: string) => {
    const newPalette = { ...palette };
    (newPalette as any)[category] = [
      ...(newPalette as any)[category],
      '#3b82f6',
    ];

    onChange(newPalette);
  };

  const removeColorFromCategory = (category: string, index: number) => {
    const newPalette = { ...palette };
    (newPalette as any)[category] = (newPalette as any)[category].filter(
      (_: any, i: number) => i !== index
    );
    onChange(newPalette);
  };

  const generatePalette = () => {
    const baseColor = palette.primary[0];
    const generated = themeEngine.generateColorPalette(baseColor, { count: 5 });
    onChange({
      ...palette,
      primary: generated,
    });
  };

  return (
    <div className='color-palette-editor' data-oid='t-o8bpa'>
      <div className='palette-header' data-oid='b2r4ae0'>
        <h3 data-oid='yiiwuwf'>Color Palette</h3>
        <button
          onClick={generatePalette}
          className='btn-secondary'
          data-oid='wko.l6q'
        >
          Generate from Primary
        </button>
      </div>

      <div className='palette-categories' data-oid='_f765_9'>
        {['primary', 'secondary', 'neutral', 'accent'].map(category => (
          <button
            key={category}
            className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category as any)}
            data-oid='ar0ckxn'
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      <div className='palette-colors' data-oid='q5-db.2'>
        {(palette as any)[selectedCategory]?.map(
          (color: string, index: number) => (
            <div key={index} className='palette-color-item' data-oid='_20dbqz'>
              <ColorPicker
                color={color}
                onChange={newColor =>
                  updateColorInCategory(selectedCategory, index, newColor)
                }
                label={`${selectedCategory} ${index + 1}`}
                data-oid='_:fvbxb'
              />

              <button
                className='remove-color-btn'
                onClick={() => removeColorFromCategory(selectedCategory, index)}
                aria-label='Remove color'
                data-oid='nra_sx1'
              >
                ×
              </button>
            </div>
          )
        )}
        <button
          className='add-color-btn'
          onClick={() => addColorToCategory(selectedCategory)}
          data-oid='_pllcz:'
        >
          + Add Color
        </button>
      </div>

      <div className='semantic-colors' data-oid='qiqupxl'>
        <h4 data-oid='99c-g30'>Semantic Colors</h4>
        {Object.entries(palette.semantic).map(([type, colors]) => (
          <div key={type} className='semantic-color-group' data-oid=':q11g20'>
            <label data-oid='4bwr9k.'>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </label>
            <div className='semantic-colors-row' data-oid='z-:71ek'>
              {colors.map((color, index) => (
                <ColorPicker
                  key={index}
                  color={color}
                  onChange={newColor => {
                    const newSemantic = { ...palette.semantic };
                    (newSemantic as any)[type][index] = newColor;
                    onChange({ ...palette, semantic: newSemantic });
                  }}
                  label={`${type} ${index + 1}`}
                  data-oid='._q4xzq'
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

const TypographyEditor: React.FC<TypographyEditorProps> = ({
  typography,
  onChange,
}) => {
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
    'Courier New, monospace',
  ]);

  const updateFontFamily = (
    type: 'primary' | 'secondary' | 'monospace',
    font: string
  ) => {
    onChange({
      ...typography,
      fontFamily: {
        ...typography.fontFamily,
        [type]: font,
      },
    });
  };

  const updateFontSize = (size: string, value: string) => {
    onChange({
      ...typography,
      fontSize: {
        ...typography.fontSize,
        [size]: value,
      },
    });
  };

  const updateFontWeight = (weight: string, value: string) => {
    onChange({
      ...typography,
      fontWeight: {
        ...typography.fontWeight,
        [weight]: value,
      },
    });
  };

  const loadGoogleFonts = async () => {
    try {
      const fonts = [
        typography.fontFamily.primary,
        typography.fontFamily.secondary,
      ].filter(font => font.includes('Google'));

      if (fonts.length > 0) {
        await themeEngine.loadGoogleFonts(fonts);
      }
    } catch (error) {
      console.error('Failed to load Google Fonts:', error);
    }
  };

  return (
    <div className='typography-editor' data-oid='td3impc'>
      <div className='typography-header' data-oid='4yhk.c6'>
        <h3 data-oid='2k95.1:'>Typography</h3>
        <button
          onClick={loadGoogleFonts}
          className='btn-secondary'
          data-oid='x2b6.ku'
        >
          Load Google Fonts
        </button>
      </div>

      <div className='font-families' data-oid='hkeiut8'>
        <h4 data-oid='pp:rqvo'>Font Families</h4>
        {Object.entries(typography.fontFamily).map(([type, font]) => (
          <div key={type} className='font-family-control' data-oid='q2nk08-'>
            <label data-oid='--rxiur'>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </label>
            <select
              value={font}
              onChange={e => updateFontFamily(type as any, e.target.value)}
              className='font-select'
              data-oid='af237w3'
            >
              {availableFonts.map(fontOption => (
                <option key={fontOption} value={fontOption} data-oid='evkz31c'>
                  {fontOption}
                </option>
              ))}
            </select>
            <div
              className='font-preview'
              style={{ fontFamily: font }}
              data-oid='i964ye7'
            >
              The quick brown fox jumps over the lazy dog
            </div>
          </div>
        ))}
      </div>

      <div className='font-sizes' data-oid='75:tr.u'>
        <h4 data-oid='26yccxu'>Font Sizes</h4>
        <div className='size-controls' data-oid='oqsyk6t'>
          {Object.entries(typography.fontSize).map(([size, value]) => (
            <div key={size} className='size-control' data-oid='2saut:x'>
              <label data-oid='5qdjv00'>{size}</label>
              <input
                type='text'
                value={value}
                onChange={e => updateFontSize(size, e.target.value)}
                className='size-input'
                placeholder='1rem'
                data-oid='-qfmd-3'
              />

              <div
                className='size-preview'
                style={{ fontSize: value }}
                data-oid='0.50zjg'
              >
                Sample Text
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className='font-weights' data-oid='l.cf.g8'>
        <h4 data-oid='z8ao.es'>Font Weights</h4>
        <div className='weight-controls' data-oid='zni-3x3'>
          {Object.entries(typography.fontWeight).map(([weight, value]) => (
            <div key={weight} className='weight-control' data-oid='r-:xaji'>
              <label data-oid='t5_ekee'>{weight}</label>
              <select
                value={value}
                onChange={e => updateFontWeight(weight, e.target.value)}
                className='weight-select'
                data-oid='h1a7j9x'
              >
                <option value='100' data-oid='_5ahypp'>
                  100 - Thin
                </option>
                <option value='200' data-oid='h:h.h8.'>
                  200 - Extra Light
                </option>
                <option value='300' data-oid='jgt95-p'>
                  300 - Light
                </option>
                <option value='400' data-oid='bl8p7hg'>
                  400 - Normal
                </option>
                <option value='500' data-oid='w0odj:p'>
                  500 - Medium
                </option>
                <option value='600' data-oid='7er1vz-'>
                  600 - Semi Bold
                </option>
                <option value='700' data-oid='7yqek9w'>
                  700 - Bold
                </option>
                <option value='800' data-oid='nsp22-f'>
                  800 - Extra Bold
                </option>
                <option value='900' data-oid='s_2jyzk'>
                  900 - Black
                </option>
              </select>
              <div
                className='weight-preview'
                style={{ fontWeight: value }}
                data-oid='e22q8r.'
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

const BrandingEditor: React.FC<BrandingEditorProps> = ({
  branding,
  onChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      const base64 = e.target?.result as string;
      onChange({
        ...branding,
        logo: {
          ...branding.logo,
          base64,
          url: undefined,
        },
      });
    };
    reader.readAsDataURL(file);
  };

  const enableWhiteLabel = () => {
    onChange({
      ...branding,
      whiteLabel: true,
      hideOptimizelyBranding: true,
    });
  };

  return (
    <div className='branding-editor' data-oid='yh5j3bj'>
      <div className='branding-header' data-oid='gnu04-m'>
        <h3 data-oid='biil1:i'>Branding & White Label</h3>
        <button
          onClick={enableWhiteLabel}
          className={`btn-${branding.whiteLabel ? 'primary' : 'secondary'}`}
          data-oid='_0zalkb'
        >
          {branding.whiteLabel ? 'White Label Enabled' : 'Enable White Label'}
        </button>
      </div>

      <div className='company-info' data-oid='9jfqt:0'>
        <h4 data-oid='10buj3d'>Company Information</h4>
        <div className='form-group' data-oid='3vt2f-.'>
          <label data-oid='sl:swfg'>Company Name</label>
          <input
            type='text'
            value={branding.companyName}
            onChange={e =>
              onChange({ ...branding, companyName: e.target.value })
            }
            className='form-input'
            placeholder='Your Company Name'
            data-oid='e:g6t3l'
          />
        </div>

        <div className='brand-colors' data-oid='e.:8djv'>
          <h4 data-oid='1.stn4a'>Brand Colors</h4>
          <div className='color-row' data-oid='r51neh0'>
            <ColorPicker
              color={branding.primaryColor}
              onChange={color => onChange({ ...branding, primaryColor: color })}
              label='Primary Color'
              data-oid='0-jeabp'
            />

            <ColorPicker
              color={branding.secondaryColor}
              onChange={color =>
                onChange({ ...branding, secondaryColor: color })
              }
              label='Secondary Color'
              data-oid='-jelymn'
            />

            <ColorPicker
              color={branding.accentColor}
              onChange={color => onChange({ ...branding, accentColor: color })}
              label='Accent Color'
              data-oid='-k:uvbo'
            />
          </div>
        </div>
      </div>

      <div className='logo-section' data-oid='g_vtn26'>
        <h4 data-oid='.b84f2i'>Logo</h4>
        <div className='logo-upload' data-oid='6nrcgk:'>
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            onChange={handleLogoUpload}
            style={{ display: 'none' }}
            data-oid='oiw-19p'
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className='btn-secondary'
            data-oid='gpkgn0y'
          >
            Upload Logo
          </button>
          {(branding.logo.url || branding.logo.base64) && (
            <img
              src={branding.logo.url || branding.logo.base64}
              alt='Logo preview'
              className='logo-preview'
              style={{
                width: branding.logo.width,
                height: branding.logo.height,
                opacity: branding.logo.opacity,
              }}
              data-oid='erl:b6r'
            />
          )}
        </div>

        <div className='logo-controls' data-oid='yom_iyy'>
          <div className='form-group' data-oid='.h5mrx2'>
            <label data-oid='tv5gdcu'>Width (px)</label>
            <input
              type='number'
              value={branding.logo.width}
              onChange={e =>
                onChange({
                  ...branding,
                  logo: { ...branding.logo, width: parseInt(e.target.value) },
                })
              }
              className='form-input'
              min='1'
              data-oid='jrg:ocl'
            />
          </div>
          <div className='form-group' data-oid='g.op1uj'>
            <label data-oid='k3e76lf'>Height (px)</label>
            <input
              type='number'
              value={branding.logo.height}
              onChange={e =>
                onChange({
                  ...branding,
                  logo: { ...branding.logo, height: parseInt(e.target.value) },
                })
              }
              className='form-input'
              min='1'
              data-oid='nxnj4kn'
            />
          </div>
          <div className='form-group' data-oid='sd0ufid'>
            <label data-oid='gugyok:'>Position</label>
            <select
              value={branding.logo.position}
              onChange={e =>
                onChange({
                  ...branding,
                  logo: { ...branding.logo, position: e.target.value as any },
                })
              }
              className='form-select'
              data-oid='g:tqklz'
            >
              <option value='top-left' data-oid='drxmynd'>
                Top Left
              </option>
              <option value='top-right' data-oid='qh_hs6z'>
                Top Right
              </option>
              <option value='bottom-left' data-oid='27ytc:a'>
                Bottom Left
              </option>
              <option value='bottom-right' data-oid='wpe3ptz'>
                Bottom Right
              </option>
              <option value='center' data-oid='aezivga'>
                Center
              </option>
            </select>
          </div>
          <div className='form-group' data-oid='i_zz1_:'>
            <label data-oid='enf3htx'>Opacity</label>
            <input
              type='range'
              min='0'
              max='1'
              step='0.1'
              value={branding.logo.opacity}
              onChange={e =>
                onChange({
                  ...branding,
                  logo: {
                    ...branding.logo,
                    opacity: parseFloat(e.target.value),
                  },
                })
              }
              className='form-range'
              data-oid='2gwwqlz'
            />

            <span data-oid='fpnw19l'>{branding.logo.opacity}</span>
          </div>
        </div>
      </div>

      <div className='watermark-section' data-oid='ghl5:rg'>
        <h4 data-oid='ditkm38'>Watermark</h4>
        <div className='form-group' data-oid='heio9w0'>
          <label data-oid='yn8z-7m'>Watermark Text</label>
          <input
            type='text'
            value={branding.watermark.text || ''}
            onChange={e =>
              onChange({
                ...branding,
                watermark: { ...branding.watermark, text: e.target.value },
              })
            }
            className='form-input'
            placeholder='© Your Company 2024'
            data-oid='0-._ntz'
          />
        </div>
        <div className='watermark-controls' data-oid='uel6.ri'>
          <ColorPicker
            color={branding.watermark.color}
            onChange={color =>
              onChange({
                ...branding,
                watermark: { ...branding.watermark, color },
              })
            }
            label='Watermark Color'
            data-oid='grx_mex'
          />

          <div className='form-group' data-oid='ss0psks'>
            <label data-oid='47jw6vh'>Font Size</label>
            <input
              type='text'
              value={branding.watermark.fontSize}
              onChange={e =>
                onChange({
                  ...branding,
                  watermark: {
                    ...branding.watermark,
                    fontSize: e.target.value,
                  },
                })
              }
              className='form-input'
              placeholder='12px'
              data-oid=':7_f_00'
            />
          </div>
          <div className='form-group' data-oid='d5girh7'>
            <label data-oid='h2zwweu'>Position</label>
            <select
              value={branding.watermark.position}
              onChange={e =>
                onChange({
                  ...branding,
                  watermark: {
                    ...branding.watermark,
                    position: e.target.value as any,
                  },
                })
              }
              className='form-select'
              data-oid='cjb_2yl'
            >
              <option value='top-left' data-oid='dfz6no:'>
                Top Left
              </option>
              <option value='top-right' data-oid='m9g9e6t'>
                Top Right
              </option>
              <option value='bottom-left' data-oid='0lthx99'>
                Bottom Left
              </option>
              <option value='bottom-right' data-oid='_pf.o:5'>
                Bottom Right
              </option>
            </select>
          </div>
        </div>
      </div>

      <div className='custom-css-section' data-oid='v.yufha'>
        <h4 data-oid='4003si_'>Custom CSS</h4>
        <textarea
          value={branding.customCSS || ''}
          onChange={e => onChange({ ...branding, customCSS: e.target.value })}
          className='custom-css-editor'
          placeholder='/* Add your custom CSS here */'
          rows={8}
          data-oid='l2v9s6c'
        />
      </div>

      <div className='advanced-options' data-oid='lb60a_q'>
        <label className='checkbox-label' data-oid='4zre.ys'>
          <input
            type='checkbox'
            checked={branding.hideOptimizelyBranding}
            onChange={e =>
              onChange({
                ...branding,
                hideOptimizelyBranding: e.target.checked,
              })
            }
            data-oid='c:6t92e'
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

const ChartThemeEditor: React.FC<ChartThemeEditorProps> = ({
  chartTheme,
  onChange,
}) => {
  return (
    <div className='chart-theme-editor' data-oid='pb-7fdh'>
      <h3 data-oid='5vsjslc'>Chart Styling</h3>

      <div className='chart-sections' data-oid='udkyz9j'>
        <div className='chart-section' data-oid='py95v_p'>
          <h4 data-oid='o05i7dm'>Grid</h4>
          <label className='checkbox-label' data-oid='zj_ytzw'>
            <input
              type='checkbox'
              checked={chartTheme.grid.show}
              onChange={e =>
                onChange({
                  ...chartTheme,
                  grid: { ...chartTheme.grid, show: e.target.checked },
                })
              }
              data-oid='2c-7q8l'
            />
            Show Grid
          </label>
          {chartTheme.grid.show && (
            <div className='grid-controls' data-oid='ai8omrv'>
              <ColorPicker
                color={chartTheme.grid.color}
                onChange={color =>
                  onChange({
                    ...chartTheme,
                    grid: { ...chartTheme.grid, color },
                  })
                }
                label='Grid Color'
                data-oid='9ptxj3p'
              />

              <div className='form-group' data-oid='ayi.9xo'>
                <label data-oid='gwg4917'>Opacity</label>
                <input
                  type='range'
                  min='0'
                  max='1'
                  step='0.1'
                  value={chartTheme.grid.opacity}
                  onChange={e =>
                    onChange({
                      ...chartTheme,
                      grid: {
                        ...chartTheme.grid,
                        opacity: parseFloat(e.target.value),
                      },
                    })
                  }
                  className='form-range'
                  data-oid='3orthl5'
                />

                <span data-oid='ls_sraw'>{chartTheme.grid.opacity}</span>
              </div>
              <div className='form-group' data-oid='bnbt:3v'>
                <label data-oid='465t.z9'>Stroke Width</label>
                <input
                  type='number'
                  value={chartTheme.grid.strokeWidth}
                  onChange={e =>
                    onChange({
                      ...chartTheme,
                      grid: {
                        ...chartTheme.grid,
                        strokeWidth: parseInt(e.target.value),
                      },
                    })
                  }
                  className='form-input'
                  min='1'
                  data-oid='a545nl-'
                />
              </div>
            </div>
          )}
        </div>

        <div className='chart-section' data-oid='7tvy8ki'>
          <h4 data-oid='p_1uwcw'>Axes</h4>
          <label className='checkbox-label' data-oid='ld9qfjj'>
            <input
              type='checkbox'
              checked={chartTheme.axes.show}
              onChange={e =>
                onChange({
                  ...chartTheme,
                  axes: { ...chartTheme.axes, show: e.target.checked },
                })
              }
              data-oid='pyepcpd'
            />
            Show Axes
          </label>
          {chartTheme.axes.show && (
            <div className='axes-controls' data-oid='3j:d6nh'>
              <ColorPicker
                color={chartTheme.axes.color}
                onChange={color =>
                  onChange({
                    ...chartTheme,
                    axes: { ...chartTheme.axes, color },
                  })
                }
                label='Axes Color'
                data-oid='z7:dg1v'
              />

              <ColorPicker
                color={chartTheme.axes.labelColor}
                onChange={color =>
                  onChange({
                    ...chartTheme,
                    axes: { ...chartTheme.axes, labelColor: color },
                  })
                }
                label='Label Color'
                data-oid='ihbm81.'
              />

              <ColorPicker
                color={chartTheme.axes.titleColor}
                onChange={color =>
                  onChange({
                    ...chartTheme,
                    axes: { ...chartTheme.axes, titleColor: color },
                  })
                }
                label='Title Color'
                data-oid='g0b08dt'
              />
            </div>
          )}
        </div>

        <div className='chart-section' data-oid='kmtrmdy'>
          <h4 data-oid='2ej2mui'>Legend</h4>
          <label className='checkbox-label' data-oid='36za5_r'>
            <input
              type='checkbox'
              checked={chartTheme.legend.show}
              onChange={e =>
                onChange({
                  ...chartTheme,
                  legend: { ...chartTheme.legend, show: e.target.checked },
                })
              }
              data-oid='hk6jljz'
            />
            Show Legend
          </label>
          {chartTheme.legend.show && (
            <div className='legend-controls' data-oid='-n9oxuk'>
              <div className='form-group' data-oid='7cmt5io'>
                <label data-oid='jo46em6'>Position</label>
                <select
                  value={chartTheme.legend.position}
                  onChange={e =>
                    onChange({
                      ...chartTheme,
                      legend: {
                        ...chartTheme.legend,
                        position: e.target.value as any,
                      },
                    })
                  }
                  className='form-select'
                  data-oid='36b1zu9'
                >
                  <option value='top' data-oid='odk34sn'>
                    Top
                  </option>
                  <option value='right' data-oid='d-skfwz'>
                    Right
                  </option>
                  <option value='bottom' data-oid='o-0igvy'>
                    Bottom
                  </option>
                  <option value='left' data-oid='ffm8rig'>
                    Left
                  </option>
                  <option value='top-left' data-oid='kf8p5s_'>
                    Top Left
                  </option>
                  <option value='top-right' data-oid='hi2ptu8'>
                    Top Right
                  </option>
                  <option value='bottom-left' data-oid='8ecg5.z'>
                    Bottom Left
                  </option>
                  <option value='bottom-right' data-oid='tshgvkn'>
                    Bottom Right
                  </option>
                </select>
              </div>
              <ColorPicker
                color={chartTheme.legend.backgroundColor}
                onChange={color =>
                  onChange({
                    ...chartTheme,
                    legend: { ...chartTheme.legend, backgroundColor: color },
                  })
                }
                label='Background Color'
                data-oid='vu_ih:v'
              />

              <ColorPicker
                color={chartTheme.legend.textColor}
                onChange={color =>
                  onChange({
                    ...chartTheme,
                    legend: { ...chartTheme.legend, textColor: color },
                  })
                }
                label='Text Color'
                data-oid='o9pizlo'
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

const ThemePresetSelector: React.FC<ThemePresetSelectorProps> = ({
  onApplyPreset,
  currentThemeId,
}) => {
  const [presets, setPresets] = useState<ThemePreset[]>([]);
  const [availableThemes, setAvailableThemes] = useState<Theme[]>([]);

  useEffect(() => {
    setPresets(themeEngine.getPresets());
    setAvailableThemes(themeEngine.getAvailableThemes());
  }, []);

  return (
    <div className='theme-preset-selector' data-oid='py5.0vj'>
      <h3 data-oid='x:28f._'>Theme Presets</h3>

      <div className='built-in-themes' data-oid='7u9jqpw'>
        <h4 data-oid='nbf_v4u'>Built-in Themes</h4>
        <div className='theme-grid' data-oid='bjnbhq1'>
          {availableThemes.map(theme => (
            <div
              key={theme.id}
              className={`theme-card ${currentThemeId === theme.id ? 'active' : ''}`}
              onClick={() => themeEngine.setTheme(theme.id)}
              data-oid='5h89yx6'
            >
              <div className='theme-thumbnail' data-oid='aoet.d2'>
                <div
                  className='color-bar'
                  style={{ backgroundColor: theme.colorPalette.primary[0] }}
                  data-oid='ye8l.l9'
                />

                <div
                  className='color-bar'
                  style={{ backgroundColor: theme.colorPalette.secondary[0] }}
                  data-oid='lhy-c:v'
                />

                <div
                  className='color-bar'
                  style={{ backgroundColor: theme.colorPalette.accent[0] }}
                  data-oid='.ew2fii'
                />
              </div>
              <div className='theme-info' data-oid='5qa5pp4'>
                <h5 data-oid='n-9it3y'>{theme.name}</h5>
                <p data-oid='l7h-2oz'>{theme.description}</p>
                <span className='theme-category' data-oid='zl9h30a'>
                  {theme.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className='custom-presets' data-oid='ok2ee-h'>
        <h4 data-oid='ax-0w:l'>Custom Presets</h4>
        <div className='preset-grid' data-oid='dkkdq5q'>
          {presets.map(preset => (
            <div
              key={preset.id}
              className='preset-card'
              onClick={() => onApplyPreset(preset.id)}
              data-oid='rga1rjg'
            >
              <img
                src={preset.thumbnail}
                alt={preset.name}
                className='preset-thumbnail'
                data-oid='c296dkn'
              />

              <div className='preset-info' data-oid='8rfs:dw'>
                <h5 data-oid='ysum_0o'>{preset.name}</h5>
                <span className='preset-category' data-oid='k6u:lyd'>
                  {preset.category}
                </span>
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
  className = '',
}) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(
    themeEngine.getCurrentTheme()
  );
  const [activeTab, setActiveTab] = useState<
    'presets' | 'colors' | 'typography' | 'branding' | 'chart'
  >('presets');
  const [validation, setValidation] = useState<ThemeValidation>({
    isValid: true,
    errors: [],
    warnings: [],
  });
  const [previewData] = useState([
    { name: 'Jan', value: 120, category: 'A' },
    { name: 'Feb', value: 190, category: 'B' },
    { name: 'Mar', value: 300, category: 'A' },
    { name: 'Apr', value: 500, category: 'C' },
    { name: 'May', value: 200, category: 'B' },
    { name: 'Jun', value: 400, category: 'A' },
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
    reader.onload = e => {
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
    <div className={`theme-customizer ${className}`} data-oid='5bwq7i0'>
      <div className='customizer-header' data-oid='.80ud6j'>
        <h2 data-oid='gw3an05'>Theme Customizer</h2>
        <div className='header-actions' data-oid='npyc8y8'>
          <label className='import-btn' data-oid='k3ii04k'>
            <input
              type='file'
              accept='.json'
              onChange={importTheme}
              style={{ display: 'none' }}
              data-oid='74icr-2'
            />
            Import Theme
          </label>
          <button
            onClick={exportTheme}
            className='btn-secondary'
            data-oid='l3dwngw'
          >
            Export Theme
          </button>
        </div>
      </div>

      {!validation.isValid && (
        <div className='validation-errors' data-oid='6vcjjsd'>
          <h4 data-oid='1c-_np0'>Theme Validation Errors:</h4>
          <ul data-oid='_7s8f1_'>
            {validation.errors.map((error, index) => (
              <li key={index} className='error' data-oid='7c1nn_s'>
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div className='validation-warnings' data-oid='j-yy02a'>
          <h4 data-oid='0fti:ic'>Warnings:</h4>
          <ul data-oid='ki1tnp-'>
            {validation.warnings.map((warning, index) => (
              <li key={index} className='warning' data-oid='c447fe_'>
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className='customizer-tabs' data-oid='1n886lb'>
        {[
          { id: 'presets', label: 'Presets' },
          { id: 'colors', label: 'Colors' },
          { id: 'typography', label: 'Typography' },
          { id: 'branding', label: 'Branding' },
          { id: 'chart', label: 'Chart' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as any)}
            data-oid='oaes5lm'
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className='customizer-content' data-oid='8nrcnnw'>
        <div className='customizer-panel' data-oid='0irra2m'>
          {activeTab === 'presets' && (
            <ThemePresetSelector
              onApplyPreset={handleApplyPreset}
              currentThemeId={currentTheme.id}
              data-oid='ep-8k1l'
            />
          )}
          {activeTab === 'colors' && (
            <ColorPaletteEditor
              palette={currentTheme.colorPalette}
              onChange={handleColorPaletteChange}
              data-oid='_.jlxrz'
            />
          )}
          {activeTab === 'typography' && (
            <TypographyEditor
              typography={currentTheme.typography}
              onChange={handleTypographyChange}
              data-oid='7.o9e91'
            />
          )}
          {activeTab === 'branding' && (
            <BrandingEditor
              branding={currentTheme.branding}
              onChange={handleBrandingChange}
              data-oid='pe.fviz'
            />
          )}
          {activeTab === 'chart' && (
            <ChartThemeEditor
              chartTheme={currentTheme.chart}
              onChange={handleChartThemeChange}
              data-oid='ni.me9r'
            />
          )}
        </div>

        {showPreview && (
          <div className='theme-preview' data-oid='yb6i23v'>
            <h3 data-oid='5b3r4ku'>Live Preview</h3>
            <div className='preview-container' data-oid='aj2-1bs'>
              <div className='preview-chart' data-oid='istsb-n'>
                <svg
                  width='300'
                  height='200'
                  viewBox='0 0 300 200'
                  data-oid='sse.qy_'
                >
                  {/* Simple bar chart preview */}
                  {previewData.map((item, index) => (
                    <rect
                      key={index}
                      x={index * 45 + 20}
                      y={200 - item.value * 0.3}
                      width={30}
                      height={item.value * 0.3}
                      fill={
                        currentTheme.colorPalette.primary[
                          index % currentTheme.colorPalette.primary.length
                        ]
                      }
                      data-oid='09j832x'
                    />
                  ))}

                  {/* Grid lines */}
                  {currentTheme.chart.grid.show && (
                    <>
                      <line
                        x1='20'
                        y1='50'
                        x2='280'
                        y2='50'
                        stroke={currentTheme.chart.grid.color}
                        strokeWidth={currentTheme.chart.grid.strokeWidth}
                        opacity={currentTheme.chart.grid.opacity}
                        data-oid='dn4zrqy'
                      />

                      <line
                        x1='20'
                        y1='100'
                        x2='280'
                        y2='100'
                        stroke={currentTheme.chart.grid.color}
                        strokeWidth={currentTheme.chart.grid.strokeWidth}
                        opacity={currentTheme.chart.grid.opacity}
                        data-oid='y6i2bew'
                      />

                      <line
                        x1='20'
                        y1='150'
                        x2='280'
                        y2='150'
                        stroke={currentTheme.chart.grid.color}
                        strokeWidth={currentTheme.chart.grid.strokeWidth}
                        opacity={currentTheme.chart.grid.opacity}
                        data-oid='-byh5:7'
                      />
                    </>
                  )}

                  {/* Axes */}
                  {currentTheme.chart.axes.show && (
                    <>
                      <line
                        x1='20'
                        y1='20'
                        x2='20'
                        y2='200'
                        stroke={currentTheme.chart.axes.color}
                        strokeWidth={currentTheme.chart.axes.strokeWidth}
                        data-oid='w0gfxi:'
                      />

                      <line
                        x1='20'
                        y1='200'
                        x2='280'
                        y2='200'
                        stroke={currentTheme.chart.axes.color}
                        strokeWidth={currentTheme.chart.axes.strokeWidth}
                        data-oid='kfx8ne9'
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
                      fontSize='10'
                      textAnchor='middle'
                      data-oid='q0yr.xi'
                    >
                      {item.name}
                    </text>
                  ))}
                </svg>
              </div>

              <div className='preview-elements' data-oid='gix2dui'>
                <div
                  className='preview-text'
                  style={{
                    fontFamily: currentTheme.typography.fontFamily.primary,
                    color: currentTheme.chart.axes.titleColor,
                  }}
                  data-oid='o0o-de:'
                >
                  <h4 data-oid='gluc134'>Sample Chart Title</h4>
                  <p data-oid='xwg_2i4'>
                    This is how your text will appear with the current
                    typography settings.
                  </p>
                </div>

                {currentTheme.chart.legend.show && (
                  <div
                    className='preview-legend'
                    style={{
                      backgroundColor:
                        currentTheme.chart.legend.backgroundColor,
                      borderColor: currentTheme.chart.legend.borderColor,
                      borderRadius: currentTheme.chart.legend.borderRadius,
                      color: currentTheme.chart.legend.textColor,
                      fontSize: currentTheme.chart.legend.fontSize,
                    }}
                    data-oid='24_0hyl'
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
