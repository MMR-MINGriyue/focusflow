/**
 * 颜色转换工具函数
 */

/**
 * 将HSL颜色转换为Hex格式
 */
export function hslToHex(hslString: string): string {
  // 解析HSL字符串，支持多种格式
  let h = 0, s = 0, l = 0;
  
  if (hslString.startsWith('hsl(')) {
    // 格式: hsl(360, 100%, 50%)
    const match = hslString.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (match) {
      h = parseInt(match[1]);
      s = parseInt(match[2]) / 100;
      l = parseInt(match[3]) / 100;
    }
  } else {
    // 格式: "360 100% 50%" (CSS变量格式)
    const parts = hslString.split(/\s+/);
    if (parts.length >= 3) {
      h = parseFloat(parts[0]);
      s = parseFloat(parts[1].replace('%', '')) / 100;
      l = parseFloat(parts[2].replace('%', '')) / 100;
    }
  }

  // 将HSL转换为RGB
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  // 转换为0-255范围并转换为hex
  const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
  const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
  const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}

/**
 * 将Hex颜色转换为HSL格式
 */
export function hexToHsl(hex: string): string {
  // 移除#号
  const cleanHex = hex.replace('#', '');
  
  // 解析RGB值
  const r = parseInt(cleanHex.substr(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substr(2, 2), 16) / 255;
  const b = parseInt(cleanHex.substr(4, 2), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  const sum = max + min;
  
  const l = sum / 2;
  
  let h = 0;
  let s = 0;

  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - sum) : diff / sum;

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

  // 转换为度数和百分比
  const hDeg = Math.round(h * 360);
  const sPercent = Math.round(s * 100);
  const lPercent = Math.round(l * 100);

  return `${hDeg} ${sPercent}% ${lPercent}%`;
}

/**
 * 将Hex颜色转换为完整的HSL字符串
 */
export function hexToHslString(hex: string): string {
  const hsl = hexToHsl(hex);
  return `hsl(${hsl.replace(/\s/g, ', ')})`;
}

/**
 * 验证颜色格式是否有效
 */
export function isValidColor(color: string): boolean {
  // 检查hex格式
  if (/^#[0-9A-F]{6}$/i.test(color)) {
    return true;
  }
  
  // 检查HSL格式
  if (/^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/i.test(color)) {
    return true;
  }
  
  // 检查CSS变量格式
  if (/^\d+\s+\d+%\s+\d+%$/.test(color)) {
    return true;
  }
  
  return false;
}

/**
 * 获取颜色的亮度值 (0-1)
 */
export function getLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substr(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substr(2, 2), 16) / 255;
  const b = parseInt(cleanHex.substr(4, 2), 16) / 255;

  // 使用相对亮度公式
  const rLum = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gLum = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bLum = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  return 0.2126 * rLum + 0.7152 * gLum + 0.0722 * bLum;
}

/**
 * 计算两个颜色之间的对比度
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * 检查颜色对比度是否符合WCAG标准
 */
export function checkContrastCompliance(foreground: string, background: string): {
  ratio: number;
  aa: boolean;
  aaa: boolean;
} {
  const ratio = getContrastRatio(foreground, background);
  
  return {
    ratio,
    aa: ratio >= 4.5,   // WCAG AA标准
    aaa: ratio >= 7     // WCAG AAA标准
  };
}

/**
 * 生成颜色的变体（更亮或更暗）
 */
export function generateColorVariant(hex: string, lightnessDelta: number): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substr(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substr(2, 2), 16) / 255;
  const b = parseInt(cleanHex.substr(4, 2), 16) / 255;

  // 转换为HSL
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  const sum = max + min;
  
  let h = 0;
  let s = 0;
  let l = sum / 2;

  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - sum) : diff / sum;

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

  // 调整亮度
  l = Math.max(0, Math.min(1, l + lightnessDelta));

  // 转换回RGB
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h * 6) % 2 - 1));
  const m = l - c / 2;

  let newR = 0, newG = 0, newB = 0;

  if (0 <= h * 360 && h * 360 < 60) {
    newR = c; newG = x; newB = 0;
  } else if (60 <= h * 360 && h * 360 < 120) {
    newR = x; newG = c; newB = 0;
  } else if (120 <= h * 360 && h * 360 < 180) {
    newR = 0; newG = c; newB = x;
  } else if (180 <= h * 360 && h * 360 < 240) {
    newR = 0; newG = x; newB = c;
  } else if (240 <= h * 360 && h * 360 < 300) {
    newR = x; newG = 0; newB = c;
  } else if (300 <= h * 360 && h * 360 < 360) {
    newR = c; newG = 0; newB = x;
  }

  // 转换为hex
  const rHex = Math.round((newR + m) * 255).toString(16).padStart(2, '0');
  const gHex = Math.round((newG + m) * 255).toString(16).padStart(2, '0');
  const bHex = Math.round((newB + m) * 255).toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}

/**
 * 生成颜色调色板
 */
export function generateColorPalette(baseColor: string): {
  lighter: string[];
  darker: string[];
} {
  const lighter = [];
  const darker = [];

  // 生成更亮的变体
  for (let i = 1; i <= 5; i++) {
    lighter.push(generateColorVariant(baseColor, i * 0.1));
  }

  // 生成更暗的变体
  for (let i = 1; i <= 5; i++) {
    darker.push(generateColorVariant(baseColor, -i * 0.1));
  }

  return { lighter, darker };
}
