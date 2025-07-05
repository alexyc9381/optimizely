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
    <div className='color-picker' ref={pickerRef} data-oid='b-1q_yu'>
      <label className='color-picker-label' data-oid='icarorr'>
        {label}
      </label>
      <div className='color-picker-container' data-oid='jh3ujqq'>
        <button
          className='color-picker-trigger'
          style={{ backgroundColor: color }}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          aria-label={`Select color for ${label}`}
          data-oid='keiu2i9'
        />

        <input
          type='text'
          value={color}
          onChange={e => handleColorChange(e.target.value)}
          className='color-picker-input'
          placeholder='#000000'
          disabled={disabled}
          data-oid='6qho-fe'
        />
      </div>
      {isOpen && !disabled && (
        <div className='color-picker-panel' data-oid='glqq:yt'>
          <input
            type='color'
            value={tempColor}
            onChange={e => handleColorChange(e.target.value)}
            className='color-picker-native'
            data-oid='-y2jzn-'
          />

          <div className='color-presets' data-oid='avnkfah'>
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
                data-oid='l0rfhs6'
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
    <div className='color-palette-editor' data-oid=':y4i-l2'>
      <div className='palette-header' data-oid='89ag0w0'>
        <h3 data-oid='-355y:6'>Color Palette</h3>
        <button
          onClick={generatePalette}
          className='btn-secondary'
          data-oid='q_z2gbu'
        >
          Generate from Primary
        </button>
      </div>

      <div className='palette-categories' data-oid='g7y1qe3'>
        {['primary', 'secondary', 'neutral', 'accent'].map(category => (
          <button
            key={category}
            className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category as any)}
            data-oid='dmbmr9.'
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      <div className='palette-colors' data-oid='73c_dun'>
        {(palette as any)[selectedCategory]?.map(
          (color: string, index: number) => (
            <div key={index} className='palette-color-item' data-oid='f7-161f'>
              <ColorPicker
                color={color}
                onChange={newColor =>
                  updateColorInCategory(selectedCategory, index, newColor)
                }
                label={`${selectedCategory} ${index + 1}`}
                data-oid='qb9ae.0'
              />

              <button
                className='remove-color-btn'
                onClick={() => removeColorFromCategory(selectedCategory, index)}
                aria-label='Remove color'
                data-oid='jeemb1_'
              >
                ×
              </button>
            </div>
          )
        )}
        <button
          className='add-color-btn'
          onClick={() => addColorToCategory(selectedCategory)}
          data-oid='pr:rfcl'
        >
          + Add Color
        </button>
      </div>

      <div className='semantic-colors' data-oid='d9e88hc'>
        <h4 data-oid='ojn-cmp'>Semantic Colors</h4>
        {Object.entries(palette.semantic).map(([type, colors]) => (
          <div key={type} className='semantic-color-group' data-oid='6flq7uz'>
            <label data-oid='xngct8p'>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </label>
            <div className='semantic-colors-row' data-oid='1jz:c1f'>
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
                  data-oid='1qroqxn'
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
    <div className='typography-editor' data-oid='45pmavf'>
      <div className='typography-header' data-oid='qq3n1_5'>
        <h3 data-oid='8:q0_34'>Typography</h3>
        <button
          onClick={loadGoogleFonts}
          className='btn-secondary'
          data-oid='1.2h1g6'
        >
          Load Google Fonts
        </button>
      </div>

      <div className='font-families' data-oid='.5u3nc2'>
        <h4 data-oid='9r_w0t6'>Font Families</h4>
        {Object.entries(typography.fontFamily).map(([type, font]) => (
          <div key={type} className='font-family-control' data-oid='vfvps2j'>
            <label data-oid='kcm2cf6'>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </label>
            <select
              value={font}
              onChange={e => updateFontFamily(type as any, e.target.value)}
              className='font-select'
              data-oid='20361at'
            >
              {availableFonts.map(fontOption => (
                <option key={fontOption} value={fontOption} data-oid='xke3w63'>
                  {fontOption}
                </option>
              ))}
            </select>
            <div
              className='font-preview'
              style={{ fontFamily: font }}
              data-oid='hrs0-mj'
            >
              The quick brown fox jumps over the lazy dog
            </div>
          </div>
        ))}
      </div>

      <div className='font-sizes' data-oid='6z.g5mu'>
        <h4 data-oid='c23v4kr'>Font Sizes</h4>
        <div className='size-controls' data-oid='pdq4zmk'>
          {Object.entries(typography.fontSize).map(([size, value]) => (
            <div key={size} className='size-control' data-oid='8qphrs1'>
              <label data-oid='o9o.rr_'>{size}</label>
              <input
                type='text'
                value={value}
                onChange={e => updateFontSize(size, e.target.value)}
                className='size-input'
                placeholder='1rem'
                data-oid='6w9sj3a'
              />

              <div
                className='size-preview'
                style={{ fontSize: value }}
                data-oid='.le:9-7'
              >
                Sample Text
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className='font-weights' data-oid='-:etu-k'>
        <h4 data-oid='8_klwqx'>Font Weights</h4>
        <div className='weight-controls' data-oid='593nect'>
          {Object.entries(typography.fontWeight).map(([weight, value]) => (
            <div key={weight} className='weight-control' data-oid='2ot8cqp'>
              <label data-oid='or4pa0x'>{weight}</label>
              <select
                value={value}
                onChange={e => updateFontWeight(weight, e.target.value)}
                className='weight-select'
                data-oid='4tyzeex'
              >
                <option value='100' data-oid='x6ly9a5'>
                  100 - Thin
                </option>
                <option value='200' data-oid='g48xkn5'>
                  200 - Extra Light
                </option>
                <option value='300' data-oid=':b1_2md'>
                  300 - Light
                </option>
                <option value='400' data-oid='4j8ewaw'>
                  400 - Normal
                </option>
                <option value='500' data-oid='vyl25mh'>
                  500 - Medium
                </option>
                <option value='600' data-oid='h078rkz'>
                  600 - Semi Bold
                </option>
                <option value='700' data-oid='tr__co2'>
                  700 - Bold
                </option>
                <option value='800' data-oid='td4x.s9'>
                  800 - Extra Bold
                </option>
                <option value='900' data-oid='dt5x8-f'>
                  900 - Black
                </option>
              </select>
              <div
                className='weight-preview'
                style={{ fontWeight: value }}
                data-oid='2f28x-u'
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
    <div className='branding-editor' data-oid='zjywfzd'>
      <div className='branding-header' data-oid='1.l-2a5'>
        <h3 data-oid='3a:tlc0'>Branding & White Label</h3>
        <button
          onClick={enableWhiteLabel}
          className={`btn-${branding.whiteLabel ? 'primary' : 'secondary'}`}
          data-oid='m9-4p-q'
        >
          {branding.whiteLabel ? 'White Label Enabled' : 'Enable White Label'}
        </button>
      </div>

      <div className='company-info' data-oid='-zhj4gu'>
        <h4 data-oid='qksn:7f'>Company Information</h4>
        <div className='form-group' data-oid='2gcq6n8'>
          <label data-oid='73qjj1z'>Company Name</label>
          <input
            type='text'
            value={branding.companyName}
            onChange={e =>
              onChange({ ...branding, companyName: e.target.value })
            }
            className='form-input'
            placeholder='Your Company Name'
            data-oid='c8plu3r'
          />
        </div>

        <div className='brand-colors' data-oid='8kmtfkq'>
          <h4 data-oid='ayy7:zw'>Brand Colors</h4>
          <div className='color-row' data-oid='ro.y0.i'>
            <ColorPicker
              color={branding.primaryColor}
              onChange={color => onChange({ ...branding, primaryColor: color })}
              label='Primary Color'
              data-oid='soh3rwp'
            />

            <ColorPicker
              color={branding.secondaryColor}
              onChange={color =>
                onChange({ ...branding, secondaryColor: color })
              }
              label='Secondary Color'
              data-oid='xz-hr7u'
            />

            <ColorPicker
              color={branding.accentColor}
              onChange={color => onChange({ ...branding, accentColor: color })}
              label='Accent Color'
              data-oid='qeqksnu'
            />
          </div>
        </div>
      </div>

      <div className='logo-section' data-oid='52:kve5'>
        <h4 data-oid='b2vebxp'>Logo</h4>
        <div className='logo-upload' data-oid='tg7ax3a'>
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            onChange={handleLogoUpload}
            style={{ display: 'none' }}
            data-oid='oue34ye'
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className='btn-secondary'
            data-oid='cistluh'
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
              data-oid='h7d_tic'
            />
          )}
        </div>

        <div className='logo-controls' data-oid='dj74jc0'>
          <div className='form-group' data-oid='9:bvgzf'>
            <label data-oid='w54q6ee'>Width (px)</label>
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
              data-oid='la0bgnk'
            />
          </div>
          <div className='form-group' data-oid='4mr6nit'>
            <label data-oid='h5ynav_'>Height (px)</label>
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
              data-oid='a50ct.p'
            />
          </div>
          <div className='form-group' data-oid='ifukzsk'>
            <label data-oid='khuxhq9'>Position</label>
            <select
              value={branding.logo.position}
              onChange={e =>
                onChange({
                  ...branding,
                  logo: { ...branding.logo, position: e.target.value as any },
                })
              }
              className='form-select'
              data-oid='l4ssm79'
            >
              <option value='top-left' data-oid='f6ryj21'>
                Top Left
              </option>
              <option value='top-right' data-oid='n56-xw:'>
                Top Right
              </option>
              <option value='bottom-left' data-oid='ztadl1e'>
                Bottom Left
              </option>
              <option value='bottom-right' data-oid='ois-fr5'>
                Bottom Right
              </option>
              <option value='center' data-oid='3qh_oa9'>
                Center
              </option>
            </select>
          </div>
          <div className='form-group' data-oid='89vxjak'>
            <label data-oid='9b5:nq4'>Opacity</label>
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
              data-oid='5m8cf8:'
            />

            <span data-oid='2lqo3np'>{branding.logo.opacity}</span>
          </div>
        </div>
      </div>

      <div className='watermark-section' data-oid='0uloj1c'>
        <h4 data-oid='c5_4cn0'>Watermark</h4>
        <div className='form-group' data-oid='82nvvkn'>
          <label data-oid='.1d9y.9'>Watermark Text</label>
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
            data-oid='5.i:dye'
          />
        </div>
        <div className='watermark-controls' data-oid='fe.u0js'>
          <ColorPicker
            color={branding.watermark.color}
            onChange={color =>
              onChange({
                ...branding,
                watermark: { ...branding.watermark, color },
              })
            }
            label='Watermark Color'
            data-oid='._rbggd'
          />

          <div className='form-group' data-oid='n_irfcv'>
            <label data-oid='7.bxny7'>Font Size</label>
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
              data-oid='gjmr1:0'
            />
          </div>
          <div className='form-group' data-oid='r56ubzo'>
            <label data-oid='2xt00ix'>Position</label>
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
              data-oid='lm:1pdo'
            >
              <option value='top-left' data-oid='dc268o:'>
                Top Left
              </option>
              <option value='top-right' data-oid='v2k8stn'>
                Top Right
              </option>
              <option value='bottom-left' data-oid='3eb-udv'>
                Bottom Left
              </option>
              <option value='bottom-right' data-oid='o9x:_l8'>
                Bottom Right
              </option>
            </select>
          </div>
        </div>
      </div>

      <div className='custom-css-section' data-oid='c_93sf9'>
        <h4 data-oid='9z94gvz'>Custom CSS</h4>
        <textarea
          value={branding.customCSS || ''}
          onChange={e => onChange({ ...branding, customCSS: e.target.value })}
          className='custom-css-editor'
          placeholder='/* Add your custom CSS here */'
          rows={8}
          data-oid='_d-qkwg'
        />
      </div>

      <div className='advanced-options' data-oid='t9x87iu'>
        <label className='checkbox-label' data-oid='xlz031r'>
          <input
            type='checkbox'
            checked={branding.hideOptimizelyBranding}
            onChange={e =>
              onChange({
                ...branding,
                hideOptimizelyBranding: e.target.checked,
              })
            }
            data-oid='jl8nnuy'
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
    <div className='chart-theme-editor' data-oid='3vq7yaj'>
      <h3 data-oid='ev3iv6k'>Chart Styling</h3>

      <div className='chart-sections' data-oid='6tdq9fv'>
        <div className='chart-section' data-oid='7xm66bg'>
          <h4 data-oid='dai:a7n'>Grid</h4>
          <label className='checkbox-label' data-oid='wf93w:u'>
            <input
              type='checkbox'
              checked={chartTheme.grid.show}
              onChange={e =>
                onChange({
                  ...chartTheme,
                  grid: { ...chartTheme.grid, show: e.target.checked },
                })
              }
              data-oid='evj8pr3'
            />
            Show Grid
          </label>
          {chartTheme.grid.show && (
            <div className='grid-controls' data-oid='u.ji-mf'>
              <ColorPicker
                color={chartTheme.grid.color}
                onChange={color =>
                  onChange({
                    ...chartTheme,
                    grid: { ...chartTheme.grid, color },
                  })
                }
                label='Grid Color'
                data-oid='3tn15iz'
              />

              <div className='form-group' data-oid='z29sad.'>
                <label data-oid='di0zv3c'>Opacity</label>
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
                  data-oid='nv_i.ku'
                />

                <span data-oid='bjsradw'>{chartTheme.grid.opacity}</span>
              </div>
              <div className='form-group' data-oid='s1.qfcg'>
                <label data-oid='3dbc:.5'>Stroke Width</label>
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
                  data-oid='5y4m4nm'
                />
              </div>
            </div>
          )}
        </div>

        <div className='chart-section' data-oid='i7f0wa:'>
          <h4 data-oid='8xt965x'>Axes</h4>
          <label className='checkbox-label' data-oid='4t81g-.'>
            <input
              type='checkbox'
              checked={chartTheme.axes.show}
              onChange={e =>
                onChange({
                  ...chartTheme,
                  axes: { ...chartTheme.axes, show: e.target.checked },
                })
              }
              data-oid='xjw4sx1'
            />
            Show Axes
          </label>
          {chartTheme.axes.show && (
            <div className='axes-controls' data-oid='l-on_rx'>
              <ColorPicker
                color={chartTheme.axes.color}
                onChange={color =>
                  onChange({
                    ...chartTheme,
                    axes: { ...chartTheme.axes, color },
                  })
                }
                label='Axes Color'
                data-oid='jsgu9m_'
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
                data-oid='0460rod'
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
                data-oid='ezwkg8i'
              />
            </div>
          )}
        </div>

        <div className='chart-section' data-oid='1o5yvm4'>
          <h4 data-oid='1zzjzpz'>Legend</h4>
          <label className='checkbox-label' data-oid='z29n2xi'>
            <input
              type='checkbox'
              checked={chartTheme.legend.show}
              onChange={e =>
                onChange({
                  ...chartTheme,
                  legend: { ...chartTheme.legend, show: e.target.checked },
                })
              }
              data-oid='6mig04-'
            />
            Show Legend
          </label>
          {chartTheme.legend.show && (
            <div className='legend-controls' data-oid=':75u_ob'>
              <div className='form-group' data-oid='k6c1t_i'>
                <label data-oid='hmktdta'>Position</label>
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
                  data-oid='g:qnr6:'
                >
                  <option value='top' data-oid='5-9kqmn'>
                    Top
                  </option>
                  <option value='right' data-oid='ohoq-9:'>
                    Right
                  </option>
                  <option value='bottom' data-oid='ak5r0we'>
                    Bottom
                  </option>
                  <option value='left' data-oid='s33ngfm'>
                    Left
                  </option>
                  <option value='top-left' data-oid='8srbg5x'>
                    Top Left
                  </option>
                  <option value='top-right' data-oid=':zk06ic'>
                    Top Right
                  </option>
                  <option value='bottom-left' data-oid='8pri78e'>
                    Bottom Left
                  </option>
                  <option value='bottom-right' data-oid='x7yqh-t'>
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
                data-oid='qi:u.:q'
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
                data-oid=':8uvj_h'
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
    <div className='theme-preset-selector' data-oid='0cjwb2f'>
      <h3 data-oid='zcq9jwb'>Theme Presets</h3>

      <div className='built-in-themes' data-oid='-.cujvs'>
        <h4 data-oid='4y9gcyy'>Built-in Themes</h4>
        <div className='theme-grid' data-oid='t2vb3.1'>
          {availableThemes.map(theme => (
            <div
              key={theme.id}
              className={`theme-card ${currentThemeId === theme.id ? 'active' : ''}`}
              onClick={() => themeEngine.setTheme(theme.id)}
              data-oid='igls_zh'
            >
              <div className='theme-thumbnail' data-oid='yfjav:w'>
                <div
                  className='color-bar'
                  style={{ backgroundColor: theme.colorPalette.primary[0] }}
                  data-oid='xg7r49b'
                />

                <div
                  className='color-bar'
                  style={{ backgroundColor: theme.colorPalette.secondary[0] }}
                  data-oid='jf6t04n'
                />

                <div
                  className='color-bar'
                  style={{ backgroundColor: theme.colorPalette.accent[0] }}
                  data-oid='vg9szct'
                />
              </div>
              <div className='theme-info' data-oid='grtzv-x'>
                <h5 data-oid='vequq.f'>{theme.name}</h5>
                <p data-oid='o-y:84v'>{theme.description}</p>
                <span className='theme-category' data-oid='1i5uo80'>
                  {theme.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className='custom-presets' data-oid='hof5tat'>
        <h4 data-oid='z5qr9_8'>Custom Presets</h4>
        <div className='preset-grid' data-oid='s6_zbce'>
          {presets.map(preset => (
            <div
              key={preset.id}
              className='preset-card'
              onClick={() => onApplyPreset(preset.id)}
              data-oid='_0jxzdb'
            >
              <img
                src={preset.thumbnail}
                alt={preset.name}
                className='preset-thumbnail'
                data-oid='8iqxgp5'
              />

              <div className='preset-info' data-oid='dut7eln'>
                <h5 data-oid='gdywdks'>{preset.name}</h5>
                <span className='preset-category' data-oid='pj.swo1'>
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
    <div className={`theme-customizer ${className}`} data-oid='5o.x4t8'>
      <div className='customizer-header' data-oid='ecgxfm-'>
        <h2 data-oid='uz6xkvl'>Theme Customizer</h2>
        <div className='header-actions' data-oid='dt-mrg4'>
          <label className='import-btn' data-oid='d2sgkfh'>
            <input
              type='file'
              accept='.json'
              onChange={importTheme}
              style={{ display: 'none' }}
              data-oid='p2iimqs'
            />
            Import Theme
          </label>
          <button
            onClick={exportTheme}
            className='btn-secondary'
            data-oid='fz73gq:'
          >
            Export Theme
          </button>
        </div>
      </div>

      {!validation.isValid && (
        <div className='validation-errors' data-oid='ufdpwob'>
          <h4 data-oid='rv.14fa'>Theme Validation Errors:</h4>
          <ul data-oid='k8bw_xx'>
            {validation.errors.map((error, index) => (
              <li key={index} className='error' data-oid='a0yha6h'>
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div className='validation-warnings' data-oid='f7efspv'>
          <h4 data-oid='9d._p4m'>Warnings:</h4>
          <ul data-oid='oy498wz'>
            {validation.warnings.map((warning, index) => (
              <li key={index} className='warning' data-oid='1ez10:l'>
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className='customizer-tabs' data-oid='8va3hwg'>
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
            data-oid='2_wbv7x'
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className='customizer-content' data-oid='ta:k.ny'>
        <div className='customizer-panel' data-oid='dzg3o7z'>
          {activeTab === 'presets' && (
            <ThemePresetSelector
              onApplyPreset={handleApplyPreset}
              currentThemeId={currentTheme.id}
              data-oid='9xvzk.r'
            />
          )}
          {activeTab === 'colors' && (
            <ColorPaletteEditor
              palette={currentTheme.colorPalette}
              onChange={handleColorPaletteChange}
              data-oid='j8__o0y'
            />
          )}
          {activeTab === 'typography' && (
            <TypographyEditor
              typography={currentTheme.typography}
              onChange={handleTypographyChange}
              data-oid='n20excs'
            />
          )}
          {activeTab === 'branding' && (
            <BrandingEditor
              branding={currentTheme.branding}
              onChange={handleBrandingChange}
              data-oid='n_s7-82'
            />
          )}
          {activeTab === 'chart' && (
            <ChartThemeEditor
              chartTheme={currentTheme.chart}
              onChange={handleChartThemeChange}
              data-oid='rpe3a-6'
            />
          )}
        </div>

        {showPreview && (
          <div className='theme-preview' data-oid='u.7oo_c'>
            <h3 data-oid='juffira'>Live Preview</h3>
            <div className='preview-container' data-oid='5wh0h73'>
              <div className='preview-chart' data-oid='20ge7ck'>
                <svg
                  width='300'
                  height='200'
                  viewBox='0 0 300 200'
                  data-oid='08yfsa5'
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
                      data-oid='muya-hx'
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
                        data-oid='t5ftiu5'
                      />

                      <line
                        x1='20'
                        y1='100'
                        x2='280'
                        y2='100'
                        stroke={currentTheme.chart.grid.color}
                        strokeWidth={currentTheme.chart.grid.strokeWidth}
                        opacity={currentTheme.chart.grid.opacity}
                        data-oid='w6zg:t.'
                      />

                      <line
                        x1='20'
                        y1='150'
                        x2='280'
                        y2='150'
                        stroke={currentTheme.chart.grid.color}
                        strokeWidth={currentTheme.chart.grid.strokeWidth}
                        opacity={currentTheme.chart.grid.opacity}
                        data-oid='nb4.l-0'
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
                        data-oid='_uwj2j1'
                      />

                      <line
                        x1='20'
                        y1='200'
                        x2='280'
                        y2='200'
                        stroke={currentTheme.chart.axes.color}
                        strokeWidth={currentTheme.chart.axes.strokeWidth}
                        data-oid='9n9wk-8'
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
                      data-oid='3q.lfje'
                    >
                      {item.name}
                    </text>
                  ))}
                </svg>
              </div>

              <div className='preview-elements' data-oid='xlrrtrs'>
                <div
                  className='preview-text'
                  style={{
                    fontFamily: currentTheme.typography.fontFamily.primary,
                    color: currentTheme.chart.axes.titleColor,
                  }}
                  data-oid='k8a2e0:'
                >
                  <h4 data-oid='6fjhqal'>Sample Chart Title</h4>
                  <p data-oid='55kktea'>
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
                    data-oid='y4c1po7'
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
