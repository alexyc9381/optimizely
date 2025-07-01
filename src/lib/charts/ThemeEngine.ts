/**
 * Theme Engine
 * Comprehensive theming and customization system for charts with color palettes,
 * typography, branding options, and white-label deployment capabilities.
 */

import { EventEmitter } from 'events';

// Color system
export interface ColorPalette {
  id: string;
  name: string;
  description: string;
  primary: string[];
  secondary: string[];
  tertiary: string[];
  neutral: string[];
  accent: string[];
  semantic: {
    success: string[];
    warning: string[];
    error: string[];
    info: string[];
  };
  gradient: {
    start: string;
    end: string;
    stops?: Array<{ offset: number; color: string }>;
  }[];
}

// Typography system
export interface Typography {
  fontFamily: {
    primary: string;
    secondary: string;
    monospace: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    xxl: string;
    xxxl: string;
  };
  fontWeight: {
    light: string;
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
  };
  lineHeight: {
    tight: string;
    normal: string;
    relaxed: string;
  };
  letterSpacing: {
    tight: string;
    normal: string;
    wide: string;
  };
}

// Spacing system
export interface Spacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
  xxxl: string;
}

// Border radius system
export interface BorderRadius {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

// Shadow system
export interface Shadows {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  inner: string;
}

// Animation system
export interface Animations {
  duration: {
    fast: string;
    normal: string;
    slow: string;
  };
  easing: {
    linear: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
    bounce: string;
  };
  enabled: boolean;
}

// Branding configuration
export interface BrandingConfig {
  logo: {
    url?: string;
    base64?: string;
    width: number;
    height: number;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    opacity: number;
  };
  watermark: {
    text?: string;
    image?: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    opacity: number;
    fontSize: string;
    color: string;
  };
  companyName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  customCSS?: string;
  whiteLabel: boolean;
  hideOptimizelyBranding: boolean;
}

// Chart-specific theme configuration
export interface ChartTheme {
  grid: {
    show: boolean;
    color: string;
    opacity: number;
    strokeWidth: number;
    strokeDashArray: string;
  };
  axes: {
    show: boolean;
    color: string;
    strokeWidth: number;
    tickColor: string;
    tickSize: number;
    labelColor: string;
    titleColor: string;
  };
  legend: {
    show: boolean;
    position: 'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    backgroundColor: string;
    borderColor: string;
    borderRadius: string;
    padding: string;
    margin: string;
    textColor: string;
    fontSize: string;
  };
  tooltip: {
    backgroundColor: string;
    borderColor: string;
    borderRadius: string;
    boxShadow: string;
    textColor: string;
    fontSize: string;
    padding: string;
    arrow: boolean;
  };
  dataLabels: {
    show: boolean;
    color: string;
    fontSize: string;
    fontWeight: string;
    position: 'top' | 'center' | 'bottom' | 'inside' | 'outside';
    offset: number;
  };
}

// Complete theme configuration
export interface Theme {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  category: 'light' | 'dark' | 'high-contrast' | 'colorful' | 'minimal' | 'corporate' | 'custom';
  colorPalette: ColorPalette;
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  shadows: Shadows;
  animations: Animations;
  branding: BrandingConfig;
  chart: ChartTheme;
  customProperties: Record<string, any>;
}

// Theme validation schema
export interface ThemeValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Theme preset
export interface ThemePreset {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  theme: Partial<Theme>;
}

/**
 * Main Theme Engine Class
 */
export class ThemeEngine extends EventEmitter {
  private static _instance: ThemeEngine;
  private currentTheme: Theme;
  private themes = new Map<string, Theme>();
  private presets = new Map<string, ThemePreset>();
  private customCSS = new Map<string, string>();
  private observers = new Set<(theme: Theme) => void>();

  private constructor() {
    super();
    this.setMaxListeners(50);
    this.currentTheme = this.getDefaultTheme();
    this.initializeBuiltInThemes();
    this.initializeBuiltInPresets();
  }

  public static getInstance(): ThemeEngine {
    if (!ThemeEngine._instance) {
      ThemeEngine._instance = new ThemeEngine();
    }
    return ThemeEngine._instance;
  }

  // Theme management
  public getCurrentTheme(): Theme {
    return { ...this.currentTheme };
  }

  public setTheme(themeId: string): boolean {
    const theme = this.themes.get(themeId);
    if (!theme) {
      this.emit('error', new Error(`Theme not found: ${themeId}`));
      return false;
    }

    const validation = this.validateTheme(theme);
    if (!validation.isValid) {
      this.emit('error', new Error(`Invalid theme: ${validation.errors.join(', ')}`));
      return false;
    }

    const previousTheme = this.currentTheme;
    this.currentTheme = { ...theme };

    this.applyTheme();
    this.notifyObservers();

    this.emit('theme:changed', {
      previous: previousTheme,
      current: this.currentTheme
    });

    return true;
  }

  public registerTheme(theme: Theme): boolean {
    const validation = this.validateTheme(theme);
    if (!validation.isValid) {
      this.emit('error', new Error(`Cannot register invalid theme: ${validation.errors.join(', ')}`));
      return false;
    }

    this.themes.set(theme.id, { ...theme });
    this.emit('theme:registered', theme);
    return true;
  }

  public unregisterTheme(themeId: string): boolean {
    if (themeId === this.currentTheme.id) {
      this.emit('error', new Error('Cannot unregister current theme'));
      return false;
    }

    const deleted = this.themes.delete(themeId);
    if (deleted) {
      this.emit('theme:unregistered', themeId);
    }
    return deleted;
  }

  public getAvailableThemes(): Theme[] {
    return Array.from(this.themes.values());
  }

  public getThemesByCategory(category: string): Theme[] {
    return this.getAvailableThemes().filter(theme => theme.category === category);
  }

  // Color palette management
  public updateColorPalette(palette: Partial<ColorPalette>): void {
    this.currentTheme.colorPalette = {
      ...this.currentTheme.colorPalette,
      ...palette
    };

    this.applyTheme();
    this.notifyObservers();
    this.emit('palette:updated', this.currentTheme.colorPalette);
  }

  public generateColorPalette(baseColor: string, options?: {
    count?: number;
    lightness?: number[];
    saturation?: number[];
    hue?: number[];
  }): string[] {
    const count = options?.count || 5;
    const palette: string[] = [];

    // Convert base color to HSL
    const hsl = this.hexToHsl(baseColor);

    for (let i = 0; i < count; i++) {
      const factor = i / (count - 1);

      // Adjust lightness, saturation, and hue
      const h = hsl.h + (options?.hue?.[i] || (factor * 30 - 15));
      const s = Math.max(0, Math.min(100, hsl.s + (options?.saturation?.[i] || (factor * 20 - 10))));
      const l = Math.max(0, Math.min(100, hsl.l + (options?.lightness?.[i] || (factor * 40 - 20))));

      palette.push(this.hslToHex(h % 360, s, l));
    }

    return palette;
  }

  public getAccessibleColorPair(backgroundColor: string, preferredTextColor?: string): string {
    const bgLuminance = this.getRelativeLuminance(backgroundColor);
    const darkTextColor = preferredTextColor || '#000000';
    const lightTextColor = '#ffffff';

    const darkContrast = this.getContrastRatio(bgLuminance, this.getRelativeLuminance(darkTextColor));
    const lightContrast = this.getContrastRatio(bgLuminance, this.getRelativeLuminance(lightTextColor));

    // WCAG AA standard requires 4.5:1 contrast ratio
    if (darkContrast >= 4.5) return darkTextColor;
    if (lightContrast >= 4.5) return lightTextColor;

    // Return the one with better contrast
    return darkContrast > lightContrast ? darkTextColor : lightTextColor;
  }

  // Typography management
  public updateTypography(typography: Partial<Typography>): void {
    this.currentTheme.typography = {
      ...this.currentTheme.typography,
      fontFamily: { ...this.currentTheme.typography.fontFamily, ...typography.fontFamily },
      fontSize: { ...this.currentTheme.typography.fontSize, ...typography.fontSize },
      fontWeight: { ...this.currentTheme.typography.fontWeight, ...typography.fontWeight },
      lineHeight: { ...this.currentTheme.typography.lineHeight, ...typography.lineHeight },
      letterSpacing: { ...this.currentTheme.typography.letterSpacing, ...typography.letterSpacing }
    };

    this.applyTheme();
    this.notifyObservers();
    this.emit('typography:updated', this.currentTheme.typography);
  }

  public loadGoogleFonts(fontFamilies: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?${fontFamilies.map(font =>
          `family=${font.replace(/\s+/g, '+')}`
        ).join('&')}&display=swap`;

        link.onload = () => resolve();
        link.onerror = () => reject(new Error('Failed to load Google Fonts'));

        document.head.appendChild(link);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Branding management
  public updateBranding(branding: Partial<BrandingConfig>): void {
    this.currentTheme.branding = {
      ...this.currentTheme.branding,
      ...branding,
      logo: { ...this.currentTheme.branding.logo, ...branding.logo },
      watermark: { ...this.currentTheme.branding.watermark, ...branding.watermark }
    };

    this.applyTheme();
    this.notifyObservers();
    this.emit('branding:updated', this.currentTheme.branding);
  }

  public enableWhiteLabel(config: {
    companyName: string;
    primaryColor: string;
    logo?: { url: string; width: number; height: number };
    customCSS?: string;
  }): void {
    this.updateBranding({
      whiteLabel: true,
      hideOptimizelyBranding: true,
      companyName: config.companyName,
      primaryColor: config.primaryColor,
      logo: config.logo ? {
        ...this.currentTheme.branding.logo,
        ...config.logo,
        position: 'top-left',
        opacity: 1
      } : this.currentTheme.branding.logo,
      customCSS: config.customCSS
    });
  }

  // Chart theme management
  public updateChartTheme(chartTheme: Partial<ChartTheme>): void {
    this.currentTheme.chart = {
      ...this.currentTheme.chart,
      grid: { ...this.currentTheme.chart.grid, ...chartTheme.grid },
      axes: { ...this.currentTheme.chart.axes, ...chartTheme.axes },
      legend: { ...this.currentTheme.chart.legend, ...chartTheme.legend },
      tooltip: { ...this.currentTheme.chart.tooltip, ...chartTheme.tooltip },
      dataLabels: { ...this.currentTheme.chart.dataLabels, ...chartTheme.dataLabels }
    };

    this.applyTheme();
    this.notifyObservers();
    this.emit('chart-theme:updated', this.currentTheme.chart);
  }

  // Custom CSS management
  public addCustomCSS(id: string, css: string): void {
    this.customCSS.set(id, css);
    this.applyCustomCSS();
    this.emit('custom-css:added', { id, css });
  }

  public removeCustomCSS(id: string): boolean {
    const removed = this.customCSS.delete(id);
    if (removed) {
      this.applyCustomCSS();
      this.emit('custom-css:removed', id);
    }
    return removed;
  }

  public getCustomCSS(): Map<string, string> {
    return new Map(this.customCSS);
  }

  // Theme presets
  public getPresets(): ThemePreset[] {
    return Array.from(this.presets.values());
  }

  public applyPreset(presetId: string): boolean {
    const preset = this.presets.get(presetId);
    if (!preset) {
      this.emit('error', new Error(`Preset not found: ${presetId}`));
      return false;
    }

    // Merge preset with current theme
    this.currentTheme = this.mergeThemes(this.currentTheme, preset.theme);

    this.applyTheme();
    this.notifyObservers();
    this.emit('preset:applied', preset);

    return true;
  }

  public createPreset(name: string, category: string, themeOverrides: Partial<Theme>): ThemePreset {
    const preset: ThemePreset = {
      id: `preset-${Date.now()}`,
      name,
      category,
      thumbnail: this.generateThumbnail(themeOverrides),
      theme: themeOverrides
    };

    this.presets.set(preset.id, preset);
    this.emit('preset:created', preset);

    return preset;
  }

  // Theme validation
  public validateTheme(theme: Theme): ThemeValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!theme.id) errors.push('Theme ID is required');
    if (!theme.name) errors.push('Theme name is required');
    if (!theme.colorPalette) errors.push('Color palette is required');
    if (!theme.typography) errors.push('Typography is required');

    // Color validation
    if (theme.colorPalette) {
      if (!theme.colorPalette.primary?.length) errors.push('Primary colors are required');
      if (!this.isValidColor(theme.colorPalette.primary?.[0])) {
        errors.push('Invalid primary color format');
      }
    }

    // Typography validation
    if (theme.typography) {
      if (!theme.typography.fontFamily?.primary) errors.push('Primary font family is required');
    }

    // Accessibility checks
    if (theme.colorPalette && theme.chart) {
      const bgColor = theme.colorPalette.neutral?.[0] || '#ffffff';
      const textColor = theme.chart.axes?.labelColor || '#000000';

      if (this.getContrastRatio(
        this.getRelativeLuminance(bgColor),
        this.getRelativeLuminance(textColor)
      ) < 4.5) {
        warnings.push('Low contrast ratio between background and text colors');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Theme export/import
  public exportTheme(themeId?: string): string {
    const theme = themeId ? this.themes.get(themeId) : this.currentTheme;
    if (!theme) {
      throw new Error(`Theme not found: ${themeId}`);
    }

    return JSON.stringify(theme, null, 2);
  }

  public importTheme(themeJson: string): boolean {
    try {
      const theme = JSON.parse(themeJson) as Theme;
      return this.registerTheme(theme);
    } catch (error) {
      this.emit('error', new Error(`Failed to import theme: ${error}`));
      return false;
    }
  }

  // Observer pattern
  public addObserver(callback: (theme: Theme) => void): void {
    this.observers.add(callback);
  }

  public removeObserver(callback: (theme: Theme) => void): void {
    this.observers.delete(callback);
  }

  private notifyObservers(): void {
    this.observers.forEach(callback => {
      try {
        callback(this.currentTheme);
      } catch (error) {
        console.warn('Theme observer error:', error);
      }
    });
  }

  // Theme application
  private applyTheme(): void {
    this.applyCSSVariables();
    this.applyCustomCSS();
    this.applyBranding();
  }

  private applyCSSVariables(): void {
    const root = document.documentElement;
    const theme = this.currentTheme;

    // Color variables
    const colors = theme.colorPalette;
    colors.primary.forEach((color, index) => {
      root.style.setProperty(`--color-primary-${index}`, color);
    });
    colors.secondary.forEach((color, index) => {
      root.style.setProperty(`--color-secondary-${index}`, color);
    });
    colors.neutral.forEach((color, index) => {
      root.style.setProperty(`--color-neutral-${index}`, color);
    });

    // Typography variables
    const typography = theme.typography;
    root.style.setProperty('--font-family-primary', typography.fontFamily.primary);
    root.style.setProperty('--font-family-secondary', typography.fontFamily.secondary);
    root.style.setProperty('--font-family-monospace', typography.fontFamily.monospace);

    Object.entries(typography.fontSize).forEach(([key, value]) => {
      root.style.setProperty(`--font-size-${key}`, value);
    });

    Object.entries(typography.fontWeight).forEach(([key, value]) => {
      root.style.setProperty(`--font-weight-${key}`, value);
    });

    // Spacing variables
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });

    // Border radius variables
    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--border-radius-${key}`, value);
    });

    // Shadow variables
    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });

    // Animation variables
    Object.entries(theme.animations.duration).forEach(([key, value]) => {
      root.style.setProperty(`--animation-duration-${key}`, value);
    });

    Object.entries(theme.animations.easing).forEach(([key, value]) => {
      root.style.setProperty(`--animation-easing-${key}`, value);
    });
  }

  private applyCustomCSS(): void {
    // Remove existing custom styles
    const existingStyles = document.querySelectorAll('style[data-theme-engine]');
    existingStyles.forEach(style => style.remove());

    // Apply current custom CSS
    const combinedCSS = Array.from(this.customCSS.values()).join('\n');
    if (this.currentTheme.branding.customCSS) {
      combinedCSS + '\n' + this.currentTheme.branding.customCSS;
    }

    if (combinedCSS.trim()) {
      const styleElement = document.createElement('style');
      styleElement.setAttribute('data-theme-engine', 'true');
      styleElement.textContent = combinedCSS;
      document.head.appendChild(styleElement);
    }
  }

  private applyBranding(): void {
    const branding = this.currentTheme.branding;

    // Hide/show Optimizely branding
    const optimizelyElements = document.querySelectorAll('[data-optimizely-branding]');
    optimizelyElements.forEach(element => {
      (element as HTMLElement).style.display = branding.hideOptimizelyBranding ? 'none' : '';
    });

    // Apply logo if present
    if (branding.logo && (branding.logo.url || branding.logo.base64)) {
      const logoElements = document.querySelectorAll('[data-theme-logo]');
      logoElements.forEach(element => {
        const img = element as HTMLImageElement;
        img.src = branding.logo.url || branding.logo.base64!;
        img.style.width = `${branding.logo.width}px`;
        img.style.height = `${branding.logo.height}px`;
        img.style.opacity = branding.logo.opacity.toString();
      });
    }

    // Apply watermark if present
    if (branding.watermark && (branding.watermark.text || branding.watermark.image)) {
      const watermarkElements = document.querySelectorAll('[data-theme-watermark]');
      watermarkElements.forEach(element => {
        const el = element as HTMLElement;
        if (branding.watermark.text) {
          el.textContent = branding.watermark.text;
          el.style.fontSize = branding.watermark.fontSize;
          el.style.color = branding.watermark.color;
        }
        el.style.opacity = branding.watermark.opacity.toString();
      });
    }
  }

  // Utility methods
  private hexToHsl(hex: string): { h: number; s: number; l: number } {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    const add = max + min;
    const l = add * 0.5;

    let h = 0;
    let s = 0;

    if (diff !== 0) {
      s = l < 0.5 ? diff / add : diff / (2 - add);

      switch (max) {
        case r:
          h = ((g - b) / diff) + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / diff + 2;
          break;
        case b:
          h = (r - g) / diff + 4;
          break;
      }
      h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  private hslToHex(h: number, s: number, l: number): string {
    h /= 360;
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h * 6) % 2 - 1));
    const m = l - c / 2;

    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 1/6) {
      r = c; g = x; b = 0;
    } else if (1/6 <= h && h < 2/6) {
      r = x; g = c; b = 0;
    } else if (2/6 <= h && h < 3/6) {
      r = 0; g = c; b = x;
    } else if (3/6 <= h && h < 4/6) {
      r = 0; g = x; b = c;
    } else if (4/6 <= h && h < 5/6) {
      r = x; g = 0; b = c;
    } else if (5/6 <= h && h < 1) {
      r = c; g = 0; b = x;
    }

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private getRelativeLuminance(color: string): number {
    const rgb = this.hexToRgb(color);
    const rsRGB = rgb.r / 255;
    const gsRGB = rgb.g / 255;
    const bsRGB = rgb.b / 255;

    const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  private getContrastRatio(l1: number, l2: number): number {
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  private isValidColor(color: string): boolean {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  }

  private mergeThemes(base: Theme, override: Partial<Theme>): Theme {
    return {
      ...base,
      ...override,
      colorPalette: { ...base.colorPalette, ...override.colorPalette },
      typography: { ...base.typography, ...override.typography },
      spacing: { ...base.spacing, ...override.spacing },
      borderRadius: { ...base.borderRadius, ...override.borderRadius },
      shadows: { ...base.shadows, ...override.shadows },
      animations: { ...base.animations, ...override.animations },
      branding: { ...base.branding, ...override.branding },
      chart: { ...base.chart, ...override.chart },
      customProperties: { ...base.customProperties, ...override.customProperties }
    };
  }

  private generateThumbnail(theme: Partial<Theme>): string {
    // Generate a simple thumbnail representation
    const primaryColor = theme.colorPalette?.primary?.[0] || '#3b82f6';
    const secondaryColor = theme.colorPalette?.secondary?.[0] || '#6b7280';

    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="120" height="80" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="80" fill="${primaryColor}"/>
        <rect x="10" y="10" width="100" height="60" fill="${secondaryColor}" opacity="0.8"/>
        <rect x="20" y="20" width="80" height="40" fill="white" opacity="0.9"/>
      </svg>
    `)}`;
  }

  // Built-in themes and presets
  private initializeBuiltInThemes(): void {
    const themes = [
      this.getDefaultTheme(),
      this.getDarkTheme(),
      this.getHighContrastTheme(),
      this.getCorporateTheme(),
      this.getMinimalTheme()
    ];

    themes.forEach(theme => {
      this.themes.set(theme.id, theme);
    });
  }

  private initializeBuiltInPresets(): void {
    const presets: ThemePreset[] = [
      {
        id: 'modern-blue',
        name: 'Modern Blue',
        category: 'Business',
        thumbnail: '',
        theme: {
          colorPalette: {
            primary: ['#3b82f6', '#1d4ed8', '#1e40af'],
            accent: ['#06b6d4', '#0891b2', '#0e7490']
          } as any
        }
      },
      {
        id: 'vibrant-purple',
        name: 'Vibrant Purple',
        category: 'Creative',
        thumbnail: '',
        theme: {
          colorPalette: {
            primary: ['#8b5cf6', '#7c3aed', '#6d28d9'],
            accent: ['#f59e0b', '#d97706', '#b45309']
          } as any
        }
      }
    ];

    presets.forEach(preset => {
      preset.thumbnail = this.generateThumbnail(preset.theme);
      this.presets.set(preset.id, preset);
    });
  }

  private getDefaultTheme(): Theme {
    return {
      id: 'default',
      name: 'Default Light',
      description: 'Clean and professional light theme',
      version: '1.0.0',
      author: 'Optimizely',
      category: 'light',
      colorPalette: {
        id: 'default-palette',
        name: 'Default Palette',
        description: 'Default color scheme',
        primary: ['#3b82f6', '#1d4ed8', '#1e40af', '#1e3a8a', '#1f2937'],
        secondary: ['#6b7280', '#4b5563', '#374151', '#1f2937', '#111827'],
        tertiary: ['#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280'],
        neutral: ['#ffffff', '#f9fafb', '#f3f4f6', '#e5e7eb', '#d1d5db'],
        accent: ['#10b981', '#059669', '#047857', '#065f46', '#064e3b'],
        semantic: {
          success: ['#10b981', '#059669', '#047857'],
          warning: ['#f59e0b', '#d97706', '#b45309'],
          error: ['#ef4444', '#dc2626', '#b91c1c'],
          info: ['#3b82f6', '#1d4ed8', '#1e40af']
        },
        gradient: [
          { start: '#3b82f6', end: '#1d4ed8' },
          { start: '#10b981', end: '#059669' }
        ]
      },
      typography: {
        fontFamily: {
          primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          secondary: 'Georgia, "Times New Roman", serif',
          monospace: '"SF Mono", Monaco, Consolas, "Liberation Mono", monospace'
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
          normal: '0em',
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
        sm: '0.125rem',
        md: '0.375rem',
        lg: '0.5rem',
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
          width: 120,
          height: 40,
          position: 'top-left',
          opacity: 1
        },
        watermark: {
          position: 'bottom-right',
          opacity: 0.5,
          fontSize: '12px',
          color: '#6b7280'
        },
        companyName: 'Optimizely',
        primaryColor: '#3b82f6',
        secondaryColor: '#6b7280',
        accentColor: '#10b981',
        whiteLabel: false,
        hideOptimizelyBranding: false
      },
      chart: {
        grid: {
          show: true,
          color: '#e5e7eb',
          opacity: 0.5,
          strokeWidth: 1,
          strokeDashArray: '0'
        },
        axes: {
          show: true,
          color: '#374151',
          strokeWidth: 1,
          tickColor: '#6b7280',
          tickSize: 5,
          labelColor: '#374151',
          titleColor: '#111827'
        },
        legend: {
          show: true,
          position: 'top-right',
          backgroundColor: '#ffffff',
          borderColor: '#e5e7eb',
          borderRadius: '0.375rem',
          padding: '0.75rem',
          margin: '1rem',
          textColor: '#374151',
          fontSize: '0.875rem'
        },
        tooltip: {
          backgroundColor: '#1f2937',
          borderColor: '#374151',
          borderRadius: '0.375rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          textColor: '#f9fafb',
          fontSize: '0.875rem',
          padding: '0.75rem',
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
      customProperties: {}
    };
  }

  private getDarkTheme(): Theme {
    const theme = this.getDefaultTheme();
    return {
      ...theme,
      id: 'dark',
      name: 'Dark Theme',
      description: 'Sleek dark theme for low-light environments',
      category: 'dark',
      colorPalette: {
        ...theme.colorPalette,
        neutral: ['#111827', '#1f2937', '#374151', '#4b5563', '#6b7280'],
        primary: ['#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af']
      },
      chart: {
        ...theme.chart,
        grid: {
          ...theme.chart.grid,
          color: '#374151'
        },
        axes: {
          ...theme.chart.axes,
          color: '#9ca3af',
          labelColor: '#d1d5db',
          titleColor: '#f9fafb'
        },
        legend: {
          ...theme.chart.legend,
          backgroundColor: '#1f2937',
          borderColor: '#374151',
          textColor: '#d1d5db'
        }
      }
    };
  }

  private getHighContrastTheme(): Theme {
    const theme = this.getDefaultTheme();
    return {
      ...theme,
      id: 'high-contrast',
      name: 'High Contrast',
      description: 'High contrast theme for accessibility',
      category: 'high-contrast',
      colorPalette: {
        ...theme.colorPalette,
        primary: ['#000000', '#ffffff', '#ffff00', '#ff0000', '#0000ff'],
        neutral: ['#ffffff', '#000000', '#ffff00'],
        accent: ['#ff0000', '#00ff00', '#0000ff']
      },
      chart: {
        ...theme.chart,
        grid: {
          ...theme.chart.grid,
          color: '#000000',
          strokeWidth: 2
        },
        axes: {
          ...theme.chart.axes,
          color: '#000000',
          strokeWidth: 2,
          labelColor: '#000000',
          titleColor: '#000000'
        }
      }
    };
  }

  private getCorporateTheme(): Theme {
    const theme = this.getDefaultTheme();
    return {
      ...theme,
      id: 'corporate',
      name: 'Corporate',
      description: 'Professional corporate theme',
      category: 'corporate',
      colorPalette: {
        ...theme.colorPalette,
        primary: ['#1e40af', '#1e3a8a', '#1f2937', '#111827', '#030712'],
        secondary: ['#64748b', '#475569', '#334155', '#1e293b', '#0f172a'],
        accent: ['#059669', '#047857', '#065f46', '#064e3b', '#022c22']
      },
      typography: {
        ...theme.typography,
        fontFamily: {
          primary: '"Helvetica Neue", Helvetica, Arial, sans-serif',
          secondary: 'Georgia, "Times New Roman", serif',
          monospace: '"Courier New", monospace'
        }
      }
    };
  }

  private getMinimalTheme(): Theme {
    const theme = this.getDefaultTheme();
    return {
      ...theme,
      id: 'minimal',
      name: 'Minimal',
      description: 'Clean and minimal design',
      category: 'minimal',
      colorPalette: {
        ...theme.colorPalette,
        primary: ['#000000', '#525252', '#737373', '#a3a3a3', '#d4d4d4'],
        secondary: ['#f5f5f5', '#e5e5e5', '#d4d4d4', '#a3a3a3', '#737373'],
        accent: ['#000000', '#404040', '#525252']
      },
      chart: {
        ...theme.chart,
        grid: {
          ...theme.chart.grid,
          show: false
        },
        legend: {
          ...theme.chart.legend,
          backgroundColor: 'transparent',
          borderColor: 'transparent'
        }
      }
    };
  }

  public shutdown(): void {
    this.observers.clear();
    this.customCSS.clear();
    this.emit('engine:shutdown');
    this.removeAllListeners();
  }
}

// Singleton instance
export const themeEngine = ThemeEngine.getInstance();

// Utility functions for external use
export const createColorPalette = (baseColor: string, options?: any) =>
  themeEngine.generateColorPalette(baseColor, options);

export const getAccessibleColor = (backgroundColor: string, preferredTextColor?: string) =>
  themeEngine.getAccessibleColorPair(backgroundColor, preferredTextColor);

export const validateTheme = (theme: Theme) =>
  themeEngine.validateTheme(theme);

export const applyWhiteLabel = (config: any) =>
  themeEngine.enableWhiteLabel(config);

export default ThemeEngine;
