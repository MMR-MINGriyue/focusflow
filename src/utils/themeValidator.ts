import { Theme } from '../services/themeService';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  theme?: Theme;
  report?: {
    contrastAnalysis: Record<string, {
      foreground: string;
      background: string;
      ratio: number;
      level: string;
    }>;
  };
}

export interface ThemeSchema {
  id: string;
  name: string;
  description: string;
  primary: string;
  background: string;
  text: string;
  accent?: string;
  border?: string;
  error?: string;
  success?: string;
  warning?: string;
  type: 'light' | 'dark';
}

export class ThemeValidator {
  private static readonly HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  private static readonly HSL_COLOR_REGEX = /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/;

  static validateTheme(themeData: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const contrastAnalysis: Record<string, any> = {};

    // 处理字符串输入
    if (typeof themeData === 'string') {
      try {
        themeData = JSON.parse(themeData);
      } catch (error) {
        return {
          isValid: false,
          errors: [`无效的JSON格式: ${error instanceof Error ? error.message : '未知错误'}`],
          warnings: []
        };
      }
    }

    // 基础结构验证
    if (!themeData || typeof themeData !== 'object') {
      errors.push('主题数据必须是对象');
      return { isValid: false, errors, warnings };
    }

    // 必需字段验证
    const requiredFields = ['id', 'name', 'colors', 'type'];
    for (const field of requiredFields) {
      if (!themeData[field]) {
        errors.push(`缺少必需字段: ${field}`);
      }
    }

    // 字段类型验证
    if (themeData.id && typeof themeData.id !== 'string') {
      errors.push('id 必须是字符串');
    }

    if (themeData.name && typeof themeData.name !== 'string') {
      errors.push('name 必须是字符串');
    }

    if (themeData.description && typeof themeData.description !== 'string') {
      errors.push('description 必须是字符串');
    }

    if (themeData.type && !['light', 'dark'].includes(themeData.type)) {
      errors.push('type 必须是 "light" 或 "dark"');
    }

    // 颜色格式验证
    const colorFields = ['primary', 'background', 'text'];
    if (themeData.colors) {
      for (const field of colorFields) {
        const value = themeData.colors[field];
        if (value && !this.isValidColor(value)) {
          errors.push(`无效的颜色格式 colors.${field}: ${value}`);
        }
      }
    }

    // 颜色一致性检查
    if (themeData.colors?.primary && themeData.colors?.background) {
      const contrast = this.calculateContrast(themeData.colors.primary, themeData.colors.background);
      if (contrast < 4.5) {
        warnings.push('主色与背景色的对比度较低，可能影响可读性');
      }
    }

    if (themeData.colors?.text && themeData.colors?.background) {
      const contrast = this.calculateContrast(themeData.colors.text, themeData.colors.background);
      if (contrast < 4.5) {
        warnings.push('文本色与背景色的对比度较低，可能影响可读性');
      }
    }

    // 默认值处理
    const validatedTheme: Theme = {
      id: themeData.id || `theme-${Date.now()}`,
      name: themeData.name || '未命名主题',
      description: themeData.description || '无描述',
      type: themeData.type || 'light',
      colors: {
        primary: this.normalizeColor(themeData.colors?.primary || '#2563eb'),
        secondary: this.normalizeColor(themeData.colors?.secondary || '#64748b'),
        background: this.normalizeColor(themeData.colors?.background || '#ffffff'),
        surface: this.normalizeColor(themeData.colors?.surface || '#f8fafc'),
        text: this.normalizeColor(themeData.colors?.text || '#1f2937'),
        textSecondary: this.normalizeColor(themeData.colors?.textSecondary || '#64748b'),
        border: this.normalizeColor(themeData.colors?.border || '#e2e8f0'),
        accent: this.normalizeColor(themeData.colors?.accent || '#10b981'),
        success: this.normalizeColor(themeData.colors?.success || '#10b981'),
        warning: this.normalizeColor(themeData.colors?.warning || '#f59e0b'),
        error: this.normalizeColor(themeData.colors?.error || '#ef4444'),
        focus: this.normalizeColor(themeData.colors?.focus || '#3b82f6'),
        break: this.normalizeColor(themeData.colors?.break || '#10b981'),
        microBreak: this.normalizeColor(themeData.colors?.microBreak || '#f59e0b'),
        timer: {
          primary: this.normalizeColor(themeData.colors?.timer?.primary || '#2563eb'),
          secondary: this.normalizeColor(themeData.colors?.timer?.secondary || '#64748b'),
          accent: this.normalizeColor(themeData.colors?.timer?.accent || '#10b981'),
          glow: this.normalizeColor(themeData.colors?.timer?.glow || '#2563eb')
        },
        muted: this.normalizeColor(themeData.colors?.muted || '#9ca3af')
      },
      fonts: themeData.fonts || {
        primary: 'system-ui, -apple-system, sans-serif',
        mono: 'ui-monospace, SFMono-Regular, monospace'
      },
      spacing: themeData.spacing || {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        xxl: '3rem',
        borderRadius: '0.5rem'
      },
      shadows: themeData.shadows || {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        glow: '0 0 20px hsl(220, 90%, 56%, 0.3)'
      },
      animations: themeData.animations || {
        duration: '200ms',
        easing: 'ease-out'
      }
    };

    // 生成对比度分析报告
    const colorPairs = [
      { name: '主文本/背景', fg: validatedTheme.colors.text, bg: validatedTheme.colors.background },
      { name: '主色/背景', fg: validatedTheme.colors.primary, bg: validatedTheme.colors.background },
      { name: '主色/文本', fg: validatedTheme.colors.primary, bg: validatedTheme.colors.text },
    ];

    colorPairs.forEach(pair => {
      const ratio = this.calculateContrast(pair.fg, pair.bg);
      contrastAnalysis[pair.name] = {
        foreground: pair.fg,
        background: pair.bg,
        ratio,
        level: this.getContrastLevel(ratio)
      };
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      theme: errors.length === 0 ? validatedTheme : undefined,
      report: {
        contrastAnalysis
      }
    };
  }

  static validateThemeFile(fileContent: string): ValidationResult {
    try {
      const parsedData = JSON.parse(fileContent);
      return this.validateTheme(parsedData);
    } catch (error) {
      return {
        isValid: false,
        errors: [`无效的JSON格式: ${error instanceof Error ? error.message : '未知错误'}`],
        warnings: []
      };
    }
  }

  static isValidColor(color: string): boolean {
    if (!color || typeof color !== 'string') return false;
    
    // 检查HEX格式
    if (this.HEX_COLOR_REGEX.test(color)) return true;
    
    // 检查HSL格式
    if (this.HSL_COLOR_REGEX.test(color)) return true;
    
    return false;
  }

  static normalizeColor(color: string): string {
    if (!color) return '#000000';
    
    // 如果是HSL格式，转换为HEX
    if (color.startsWith('hsl')) {
      return this.hslToHex(color);
    }
    
    // 确保HEX格式正确
    let hex = color.trim();
    if (!hex.startsWith('#')) {
      hex = `#${hex}`;
    }
    
    // 转换为6位HEX
    if (hex.length === 4) {
      hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    }
    
    return hex.toLowerCase();
  }

  private static hslToHex(hsl: string): string {
    const match = hsl.match(/hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)/);
    if (!match) return '#000000';

    const h = parseInt(match[1]) / 360;
    const s = parseInt(match[2]) / 100;
    const l = parseInt(match[3]) / 100;

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    const toHex = (c: number) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  private static getContrastLevel(ratio: number): string {
    if (ratio >= 7) return '优秀';
    if (ratio >= 4.5) return '良好';
    if (ratio >= 3) return '一般';
    return '较差';
  }

  private static calculateContrast(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return 0;

    const l1 = this.getLuminance(rgb1);
    const l2 = this.getLuminance(rgb2);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  private static getLuminance(rgb: { r: number; g: number; b: number }): number {
    const a = [rgb.r, rgb.g, rgb.b].map(v => {
      v /= 255;
      return v <= 0.03928
        ? v / 12.92
        : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

  static generateThemeReport(theme: Theme): string {
    const report: string[] = [];
    
    report.push(`主题报告: ${theme.name}`);
    report.push(`描述: ${theme.description}`);
    report.push(`类型: ${theme.type}`);
    report.push('');
    
    report.push('颜色配置:');
    report.push(`- 主色: ${theme.colors.primary}`);
    report.push(`- 背景: ${theme.colors.background}`);
    report.push(`- 文本: ${theme.colors.text}`);
    report.push(`- 强调: ${theme.colors.accent}`);
    report.push(`- 边框: ${theme.colors.border}`);
    report.push(`- 错误: ${theme.colors.error}`);
    report.push(`- 成功: ${theme.colors.success}`);
    report.push(`- 警告: ${theme.colors.warning}`);
    report.push('');
    
    const primaryBgContrast = this.calculateContrast(theme.colors.primary, theme.colors.background);
    const textBgContrast = this.calculateContrast(theme.colors.text, theme.colors.background);
    
    report.push('对比度检查:');
    report.push(`- 主色/背景: ${primaryBgContrast.toFixed(2)} (${primaryBgContrast >= 4.5 ? '通过' : '不通过'})`);
    report.push(`- 文本/背景: ${textBgContrast.toFixed(2)} (${textBgContrast >= 4.5 ? '通过' : '不通过'})`);
    
    return report.join('\n');
  }
}