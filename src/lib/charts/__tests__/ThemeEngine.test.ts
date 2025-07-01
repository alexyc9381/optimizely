/**
 * Theme Engine Test Suite
 * Comprehensive tests for theming and customization functionality
 */

import { BrandingConfig, ChartTheme, ColorPalette, Theme, ThemeEngine, Typography } from '../ThemeEngine';

// Mock external dependencies
jest.mock('events', () => ({
  EventEmitter: class MockEventEmitter {
    private listeners: Map<string, Function[]> = new Map();

    on(event: string, listener: Function) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event)!.push(listener);
    }

    emit(event: string, ...args: any[]) {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.forEach(listener => listener(...args));
      }
    }

    removeListener(event: string, listener: Function) {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        const index = eventListeners.indexOf(listener);
        if (index > -1) {
          eventListeners.splice(index, 1);
        }
      }
    }
  }
}));

// Mock Google Fonts API
Object.defineProperty(global, 'fetch', {
  value: jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        items: [
          { family: 'Roboto', variants: ['400', '500', '700'] },
          { family: 'Inter', variants: ['400', '500', '600', '700'] }
        ]
      })
    })
  ),
  writable: true
});

// Mock DOM methods
Object.defineProperty(document, 'head', {
  value: {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    querySelector: jest.fn()
  },
  writable: true
});

Object.defineProperty(document, 'createElement', {
  value: jest.fn(() => ({
    href: '',
    rel: '',
    onload: null,
    onerror: null,
    remove: jest.fn()
  })),
  writable: true
});

Object.defineProperty(document.documentElement, 'style', {
  value: {
    setProperty: jest.fn(),
    removeProperty: jest.fn()
  },
  writable: true
});

describe('ThemeEngine', () => {
  let themeEngine: ThemeEngine;

  beforeEach(() => {
    // Reset singleton instance
    (ThemeEngine as any)._instance = undefined;
    themeEngine = ThemeEngine.getInstance();
    jest.clearAllMocks();
  });

  afterEach(() => {
    themeEngine.shutdown();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ThemeEngine.getInstance();
      const instance2 = ThemeEngine.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should initialize with default theme', () => {
      const currentTheme = themeEngine.getCurrentTheme();
      expect(currentTheme).toBeDefined();
      expect(currentTheme.id).toBe('default');
      expect(currentTheme.name).toBe('Default');
    });
  });

  describe('Theme Management', () => {
    const mockTheme: Theme = {
      id: 'test-theme',
      name: 'Test Theme',
      description: 'A test theme',
      version: '1.0.0',
      author: 'Test Author',
      category: 'custom',
      colorPalette: {
        id: 'test-palette',
        name: 'Test Palette',
        description: 'Test color palette',
        primary: ['#3b82f6', '#2563eb', '#1d4ed8'],
        secondary: ['#6b7280', '#4b5563', '#374151'],
        tertiary: ['#8b5cf6', '#7c3aed', '#6d28d9'],
        neutral: ['#f8fafc', '#e2e8f0', '#cbd5e1'],
        accent: ['#10b981', '#059669', '#047857'],
        semantic: {
          success: ['#10b981', '#059669'],
          warning: ['#f59e0b', '#d97706'],
          error: ['#ef4444', '#dc2626'],
          info: ['#3b82f6', '#2563eb']
        },
        gradient: [{
          start: '#3b82f6',
          end: '#8b5cf6',
          stops: [
            { offset: 0, color: '#3b82f6' },
            { offset: 1, color: '#8b5cf6' }
          ]
        }]
      },
      typography: {
        fontFamily: {
          primary: 'Inter, sans-serif',
          secondary: 'Roboto, sans-serif',
          monospace: 'Monaco, monospace'
        },
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          xxl: '1.5rem',
          xxxl: '2rem'
        },
        fontWeight: {
          light: '300',
          normal: '400',
          medium: '500',
          semibold: '600',
          bold: '700'
        },
        lineHeight: {
          tight: '1.25',
          normal: '1.5',
          relaxed: '1.75'
        },
        letterSpacing: {
          tight: '-0.025em',
          normal: '0',
          wide: '0.025em'
        }
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        xxl: '3rem',
        xxxl: '4rem'
      },
      borderRadius: {
        none: '0',
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        full: '9999px'
      },
      shadows: {
        none: 'none',
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
      },
      animations: {
        duration: {
          fast: '150ms',
          normal: '300ms',
          slow: '500ms'
        },
        easing: {
          linear: 'linear',
          easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
          easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
          easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
          bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
        },
        enabled: true
      },
      branding: {
        logo: {
          url: 'https://example.com/logo.png',
          width: 120,
          height: 40,
          position: 'top-left',
          opacity: 1
        },
        watermark: {
          text: 'Test Watermark',
          position: 'bottom-right',
          opacity: 0.5,
          fontSize: '12px',
          color: '#6b7280'
        },
        companyName: 'Test Company',
        primaryColor: '#3b82f6',
        secondaryColor: '#6b7280',
        accentColor: '#10b981',
        whiteLabel: false,
        hideOptimizelyBranding: false
      },
      chart: {
        grid: {
          show: true,
          color: '#e2e8f0',
          opacity: 0.5,
          strokeWidth: 1,
          strokeDashArray: '0'
        },
        axes: {
          show: true,
          color: '#374151',
          strokeWidth: 1,
          tickColor: '#6b7280',
          tickSize: 4,
          labelColor: '#374151',
          titleColor: '#111827'
        },
        legend: {
          show: true,
          position: 'top',
          backgroundColor: '#ffffff',
          borderColor: '#e2e8f0',
          borderRadius: '0.5rem',
          padding: '0.5rem',
          margin: '1rem',
          textColor: '#374151',
          fontSize: '0.875rem'
        },
        tooltip: {
          backgroundColor: '#374151',
          borderColor: '#4b5563',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          textColor: '#ffffff',
          fontSize: '0.875rem',
          padding: '0.5rem',
          arrow: true
        },
        dataLabels: {
          show: false,
          color: '#374151',
          fontSize: '0.75rem',
          fontWeight: '500',
          position: 'top',
          offset: 5
        }
      },
      customProperties: {
        testProperty: 'testValue'
      }
    };

    it('should register a new theme', () => {
      const result = themeEngine.registerTheme(mockTheme);
      expect(result).toBe(true);

      const availableThemes = themeEngine.getAvailableThemes();
      expect(availableThemes.some(theme => theme.id === 'test-theme')).toBe(true);
    });

    it('should not register a theme with duplicate id', () => {
      themeEngine.registerTheme(mockTheme);
      const result = themeEngine.registerTheme(mockTheme);
      expect(result).toBe(false);
    });

    it('should set and get current theme', () => {
      themeEngine.registerTheme(mockTheme);
      const result = themeEngine.setTheme('test-theme');
      expect(result).toBe(true);

      const currentTheme = themeEngine.getCurrentTheme();
      expect(currentTheme.id).toBe('test-theme');
    });

    it('should not set non-existent theme', () => {
      const result = themeEngine.setTheme('non-existent');
      expect(result).toBe(false);
    });

    it('should unregister theme', () => {
      themeEngine.registerTheme(mockTheme);
      const result = themeEngine.unregisterTheme('test-theme');
      expect(result).toBe(true);

      const availableThemes = themeEngine.getAvailableThemes();
      expect(availableThemes.some(theme => theme.id === 'test-theme')).toBe(false);
    });

    it('should not unregister non-existent theme', () => {
      const result = themeEngine.unregisterTheme('non-existent');
      expect(result).toBe(false);
    });

    it('should not unregister current theme', () => {
      themeEngine.registerTheme(mockTheme);
      themeEngine.setTheme('test-theme');
      const result = themeEngine.unregisterTheme('test-theme');
      expect(result).toBe(false);
    });

    it('should get themes by category', () => {
      themeEngine.registerTheme(mockTheme);
      const customThemes = themeEngine.getThemesByCategory('custom');
      expect(customThemes.some(theme => theme.id === 'test-theme')).toBe(true);

      const lightThemes = themeEngine.getThemesByCategory('light');
      expect(lightThemes.length).toBeGreaterThan(0);
    });
  });

  describe('Color Management', () => {
    it('should update color palette', () => {
      const newPalette: Partial<ColorPalette> = {
        primary: ['#ff0000', '#00ff00', '#0000ff']
      };

      themeEngine.updateColorPalette(newPalette);
      const currentTheme = themeEngine.getCurrentTheme();
      expect(currentTheme.colorPalette.primary).toEqual(['#ff0000', '#00ff00', '#0000ff']);
    });

    it('should generate color palette from base color', () => {
      const colors = themeEngine.generateColorPalette('#3b82f6', { count: 5 });
      expect(colors).toHaveLength(5);
      expect(colors.every(color => color.startsWith('#'))).toBe(true);
    });

    it('should generate color palette with custom options', () => {
      const colors = themeEngine.generateColorPalette('#3b82f6', {
        count: 3,
        lightness: [0.2, 0.5, 0.8],
        saturation: [0.8, 0.6, 0.4],
        hue: [0, 30, 60]
      });
      expect(colors).toHaveLength(3);
    });

    it('should get accessible color pair', () => {
      const textColor = themeEngine.getAccessibleColorPair('#ffffff');
      expect(textColor).toBe('#000000');

      const textColor2 = themeEngine.getAccessibleColorPair('#000000');
      expect(textColor2).toBe('#ffffff');
    });

    it('should respect preferred text color if accessible', () => {
      const textColor = themeEngine.getAccessibleColorPair('#ffffff', '#333333');
      expect(textColor).toBe('#333333');
    });

    it('should fallback if preferred text color is not accessible', () => {
      const textColor = themeEngine.getAccessibleColorPair('#ffffff', '#ffffff');
      expect(textColor).toBe('#000000');
    });
  });

  describe('Typography Management', () => {
    it('should update typography', () => {
      const newTypography: Partial<Typography> = {
        fontFamily: {
          primary: 'Custom Font, sans-serif',
          secondary: 'Secondary Font, serif',
          monospace: 'Custom Mono, monospace'
        }
      };

      themeEngine.updateTypography(newTypography);
      const currentTheme = themeEngine.getCurrentTheme();
      expect(currentTheme.typography.fontFamily.primary).toBe('Custom Font, sans-serif');
    });

    it('should load Google Fonts', async () => {
      const fontFamilies = ['Roboto', 'Inter'];
      await themeEngine.loadGoogleFonts(fontFamilies);

      expect(document.createElement).toHaveBeenCalledWith('link');
      expect(document.head.appendChild).toHaveBeenCalled();
    });

    it('should handle Google Fonts loading error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(themeEngine.loadGoogleFonts(['InvalidFont'])).rejects.toThrow('Network error');
    });
  });

  describe('Branding Management', () => {
    it('should update branding', () => {
      const newBranding: Partial<BrandingConfig> = {
        companyName: 'New Company',
        primaryColor: '#ff0000',
        logo: {
          url: 'https://example.com/new-logo.png',
          width: 100,
          height: 50,
          position: 'top-right',
          opacity: 0.8
        }
      };

      themeEngine.updateBranding(newBranding);
      const currentTheme = themeEngine.getCurrentTheme();
      expect(currentTheme.branding.companyName).toBe('New Company');
      expect(currentTheme.branding.primaryColor).toBe('#ff0000');
    });

    it('should enable white label mode', () => {
      const config = {
        companyName: 'White Label Co',
        primaryColor: '#00ff00',
        logo: {
          url: 'https://example.com/wl-logo.png',
          width: 150,
          height: 60
        },
        customCSS: '.custom { color: red; }'
      };

      themeEngine.enableWhiteLabel(config);
      const currentTheme = themeEngine.getCurrentTheme();
      expect(currentTheme.branding.whiteLabel).toBe(true);
      expect(currentTheme.branding.hideOptimizelyBranding).toBe(true);
      expect(currentTheme.branding.companyName).toBe('White Label Co');
    });
  });

  describe('Chart Theme Management', () => {
    it('should update chart theme', () => {
      const newChartTheme: Partial<ChartTheme> = {
        grid: {
          show: false,
          color: '#ff0000',
          opacity: 0.8,
          strokeWidth: 2,
          strokeDashArray: '5,5'
        },
        legend: {
          show: true,
          position: 'bottom',
          backgroundColor: '#f0f0f0',
          borderColor: '#cccccc',
          borderRadius: '1rem',
          padding: '1rem',
          margin: '2rem',
          textColor: '#333333',
          fontSize: '1rem'
        }
      };

      themeEngine.updateChartTheme(newChartTheme);
      const currentTheme = themeEngine.getCurrentTheme();
      expect(currentTheme.chart.grid.show).toBe(false);
      expect(currentTheme.chart.legend.position).toBe('bottom');
    });
  });

  describe('Custom CSS Management', () => {
    it('should add custom CSS', () => {
      const css = '.custom { color: blue; }';
      themeEngine.addCustomCSS('test-css', css);

      const customCSS = themeEngine.getCustomCSS();
      expect(customCSS.get('test-css')).toBe(css);
    });

    it('should remove custom CSS', () => {
      themeEngine.addCustomCSS('test-css', '.custom { color: blue; }');
      const result = themeEngine.removeCustomCSS('test-css');
      expect(result).toBe(true);

      const customCSS = themeEngine.getCustomCSS();
      expect(customCSS.has('test-css')).toBe(false);
    });

    it('should not remove non-existent custom CSS', () => {
      const result = themeEngine.removeCustomCSS('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('Preset Management', () => {
    it('should get presets', () => {
      const presets = themeEngine.getPresets();
      expect(Array.isArray(presets)).toBe(true);
      expect(presets.length).toBeGreaterThan(0);
    });

    it('should apply preset', () => {
      const presets = themeEngine.getPresets();
      const preset = presets[0];

      const result = themeEngine.applyPreset(preset.id);
      expect(result).toBe(true);
    });

    it('should not apply non-existent preset', () => {
      const result = themeEngine.applyPreset('non-existent');
      expect(result).toBe(false);
    });

    it('should create custom preset', () => {
      const themeOverrides: Partial<Theme> = {
        colorPalette: {
          primary: ['#ff0000', '#00ff00', '#0000ff']
        } as any
      };

      const preset = themeEngine.createPreset('Custom Preset', 'custom', themeOverrides);
      expect(preset.name).toBe('Custom Preset');
      expect(preset.category).toBe('custom');

      const presets = themeEngine.getPresets();
      expect(presets.some(p => p.id === preset.id)).toBe(true);
    });
  });

  describe('Theme Validation', () => {
    it('should validate valid theme', () => {
      const mockTheme: Theme = {
        id: 'valid-theme',
        name: 'Valid Theme',
        description: 'A valid theme',
        version: '1.0.0',
        author: 'Test Author',
        category: 'custom',
        colorPalette: {
          id: 'valid-palette',
          name: 'Valid Palette',
          description: 'Valid palette',
          primary: ['#3b82f6'],
          secondary: ['#6b7280'],
          tertiary: ['#8b5cf6'],
          neutral: ['#f8fafc'],
          accent: ['#10b981'],
          semantic: {
            success: ['#10b981'],
            warning: ['#f59e0b'],
            error: ['#ef4444'],
            info: ['#3b82f6']
          },
          gradient: []
        }
      } as any;

      const validation = themeEngine.validateTheme(mockTheme);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should validate invalid theme', () => {
      const invalidTheme = {
        id: '',
        name: '',
        colorPalette: {
          primary: ['invalid-color']
        }
      } as any;

      const validation = themeEngine.validateTheme(invalidTheme);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should provide warnings for theme issues', () => {
      const warningTheme = {
        id: 'warning-theme',
        name: 'Warning Theme',
        description: 'Theme with warnings',
        version: '1.0.0',
        author: 'Test',
        category: 'custom',
        colorPalette: {
          id: 'palette',
          name: 'Palette',
          description: 'Palette',
          primary: ['#ffffff', '#ffffff'], // Low contrast
          secondary: ['#6b7280'],
          tertiary: ['#8b5cf6'],
          neutral: ['#f8fafc'],
          accent: ['#10b981'],
          semantic: {
            success: ['#10b981'],
            warning: ['#f59e0b'],
            error: ['#ef4444'],
            info: ['#3b82f6']
          },
          gradient: []
        }
      } as any;

      const validation = themeEngine.validateTheme(warningTheme);
      expect(validation.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Import/Export', () => {
    it('should export theme', () => {
      const themeJson = themeEngine.exportTheme();
      expect(typeof themeJson).toBe('string');

      const parsed = JSON.parse(themeJson);
      expect(parsed.id).toBeDefined();
      expect(parsed.name).toBeDefined();
    });

    it('should export specific theme', () => {
      const themeJson = themeEngine.exportTheme('default');
      expect(typeof themeJson).toBe('string');

      const parsed = JSON.parse(themeJson);
      expect(parsed.id).toBe('default');
    });

    it('should import valid theme', () => {
      const theme = themeEngine.getCurrentTheme();
      const themeJson = JSON.stringify(theme);

      const result = themeEngine.importTheme(themeJson);
      expect(result).toBe(true);
    });

    it('should not import invalid theme JSON', () => {
      const result = themeEngine.importTheme('invalid json');
      expect(result).toBe(false);
    });

    it('should not import invalid theme structure', () => {
      const invalidTheme = JSON.stringify({ invalid: 'structure' });
      const result = themeEngine.importTheme(invalidTheme);
      expect(result).toBe(false);
    });
  });

  describe('Observer Pattern', () => {
    it('should add and notify observers', () => {
      const mockObserver = jest.fn();
      themeEngine.addObserver(mockObserver);

      themeEngine.setTheme('dark');
      expect(mockObserver).toHaveBeenCalled();
    });

    it('should remove observers', () => {
      const mockObserver = jest.fn();
      themeEngine.addObserver(mockObserver);
      themeEngine.removeObserver(mockObserver);

      themeEngine.setTheme('high-contrast');
      expect(mockObserver).not.toHaveBeenCalled();
    });
  });

  describe('Color Utilities', () => {
    it('should convert hex to HSL', () => {
      const hsl = (themeEngine as any).hexToHsl('#3b82f6');
      expect(hsl).toHaveProperty('h');
      expect(hsl).toHaveProperty('s');
      expect(hsl).toHaveProperty('l');
      expect(hsl.h).toBeGreaterThanOrEqual(0);
      expect(hsl.h).toBeLessThanOrEqual(360);
    });

    it('should convert HSL to hex', () => {
      const hex = (themeEngine as any).hslToHex(217, 91, 60);
      expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should calculate relative luminance', () => {
      const luminance = (themeEngine as any).getRelativeLuminance('#ffffff');
      expect(luminance).toBe(1);

      const blackLuminance = (themeEngine as any).getRelativeLuminance('#000000');
      expect(blackLuminance).toBe(0);
    });

    it('should calculate contrast ratio', () => {
      const ratio = (themeEngine as any).getContrastRatio(1, 0);
      expect(ratio).toBe(21);
    });

    it('should validate color format', () => {
      expect((themeEngine as any).isValidColor('#ffffff')).toBe(true);
      expect((themeEngine as any).isValidColor('#fff')).toBe(true);
      expect((themeEngine as any).isValidColor('rgb(255, 255, 255)')).toBe(true);
      expect((themeEngine as any).isValidColor('invalid')).toBe(false);
    });

    it('should convert hex to RGB', () => {
      const rgb = (themeEngine as any).hexToRgb('#ffffff');
      expect(rgb).toEqual({ r: 255, g: 255, b: 255 });

      const rgb2 = (themeEngine as any).hexToRgb('#000000');
      expect(rgb2).toEqual({ r: 0, g: 0, b: 0 });
    });
  });

  describe('Theme Merging', () => {
    it('should merge themes correctly', () => {
      const baseTheme = themeEngine.getCurrentTheme();
      const override = {
        name: 'Merged Theme',
        colorPalette: {
          primary: ['#ff0000']
        }
      };

      const merged = (themeEngine as any).mergeThemes(baseTheme, override);
      expect(merged.name).toBe('Merged Theme');
      expect(merged.colorPalette.primary).toEqual(['#ff0000']);
      expect(merged.id).toBe(baseTheme.id); // Base properties preserved
    });
  });

  describe('Thumbnail Generation', () => {
    it('should generate thumbnail for theme', () => {
      const theme = { colorPalette: { primary: ['#3b82f6'] } };
      const thumbnail = (themeEngine as any).generateThumbnail(theme);
      expect(typeof thumbnail).toBe('string');
      expect(thumbnail.startsWith('data:image/svg+xml')).toBe(true);
    });
  });

  describe('Built-in Themes', () => {
    it('should have default theme', () => {
      const themes = themeEngine.getAvailableThemes();
      expect(themes.some(theme => theme.id === 'default')).toBe(true);
    });

    it('should have dark theme', () => {
      const themes = themeEngine.getAvailableThemes();
      expect(themes.some(theme => theme.id === 'dark')).toBe(true);
    });

    it('should have high-contrast theme', () => {
      const themes = themeEngine.getAvailableThemes();
      expect(themes.some(theme => theme.id === 'high-contrast')).toBe(true);
    });

    it('should have corporate theme', () => {
      const themes = themeEngine.getAvailableThemes();
      expect(themes.some(theme => theme.id === 'corporate')).toBe(true);
    });

    it('should have minimal theme', () => {
      const themes = themeEngine.getAvailableThemes();
      expect(themes.some(theme => theme.id === 'minimal')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid color in palette generation', () => {
      const colors = themeEngine.generateColorPalette('invalid-color');
      expect(colors).toHaveLength(5); // Should return default colors
    });

    it('should handle empty font families in Google Fonts loading', async () => {
      await expect(themeEngine.loadGoogleFonts([])).resolves.not.toThrow();
    });

    it('should handle document style errors gracefully', () => {
      // Mock document.documentElement.style to throw
      const originalSetProperty = document.documentElement.style.setProperty;
      document.documentElement.style.setProperty = jest.fn(() => {
        throw new Error('Style error');
      });

      expect(() => themeEngine.setTheme('default')).not.toThrow();

      // Restore original
      document.documentElement.style.setProperty = originalSetProperty;
    });
  });

  describe('Shutdown', () => {
    it('should cleanup resources on shutdown', () => {
      const mockObserver = jest.fn();
      themeEngine.addObserver(mockObserver);

      themeEngine.shutdown();

      // Should not notify observers after shutdown
      themeEngine.setTheme('dark');
      expect(mockObserver).not.toHaveBeenCalled();
    });
  });

  describe('Standalone Functions', () => {
    it('should export standalone color palette creation function', () => {
      const { createColorPalette } = require('../ThemeEngine');
      const colors = createColorPalette('#3b82f6');
      expect(Array.isArray(colors)).toBe(true);
      expect(colors.length).toBeGreaterThan(0);
    });

    it('should export standalone accessible color function', () => {
      const { getAccessibleColor } = require('../ThemeEngine');
      const color = getAccessibleColor('#ffffff');
      expect(typeof color).toBe('string');
      expect(color.startsWith('#')).toBe(true);
    });

    it('should export standalone theme validation function', () => {
      const { validateTheme } = require('../ThemeEngine');
      const theme = themeEngine.getCurrentTheme();
      const validation = validateTheme(theme);
      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('errors');
      expect(validation).toHaveProperty('warnings');
    });

    it('should export standalone white label function', () => {
      const { applyWhiteLabel } = require('../ThemeEngine');
      const config = {
        companyName: 'Test Company',
        primaryColor: '#ff0000'
      };

      expect(() => applyWhiteLabel(config)).not.toThrow();
    });
  });
});

// Performance tests
describe('ThemeEngine Performance', () => {
  let themeEngine: ThemeEngine;

  beforeEach(() => {
    (ThemeEngine as any)._instance = undefined;
    themeEngine = ThemeEngine.getInstance();
  });

  afterEach(() => {
    themeEngine.shutdown();
  });

  it('should handle large number of themes efficiently', () => {
    const startTime = Date.now();

    // Register 100 themes
    for (let i = 0; i < 100; i++) {
      const theme = {
        ...themeEngine.getCurrentTheme(),
        id: `theme-${i}`,
        name: `Theme ${i}`
      };
      themeEngine.registerTheme(theme);
    }

    const registrationTime = Date.now() - startTime;
    expect(registrationTime).toBeLessThan(1000); // Should take less than 1 second

    // Test theme switching performance
    const switchStartTime = Date.now();
    for (let i = 0; i < 10; i++) {
      themeEngine.setTheme(`theme-${i}`);
    }
    const switchTime = Date.now() - switchStartTime;
    expect(switchTime).toBeLessThan(500); // Should take less than 500ms
  });

  it('should handle large color palette generation efficiently', () => {
    const startTime = Date.now();

    const colors = themeEngine.generateColorPalette('#3b82f6', { count: 50 });

    const generationTime = Date.now() - startTime;
    expect(generationTime).toBeLessThan(100); // Should take less than 100ms
    expect(colors).toHaveLength(50);
  });

  it('should handle multiple observers efficiently', () => {
    const observers = [];

    // Add 100 observers
    for (let i = 0; i < 100; i++) {
      const observer = jest.fn();
      observers.push(observer);
      themeEngine.addObserver(observer);
    }

    const startTime = Date.now();
    themeEngine.setTheme('dark');
    const notificationTime = Date.now() - startTime;

    expect(notificationTime).toBeLessThan(50); // Should take less than 50ms

    // All observers should be called
    observers.forEach(observer => {
      expect(observer).toHaveBeenCalled();
    });
  });
});
