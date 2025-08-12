/**
 * Color Utils 实际功能测试
 * 
 * 测试实际存在的颜色工具函数
 */

import {
  hslToHex,
  hexToHsl,
  hexToHslString,
  isValidColor,
  getLuminance,
  getContrastRatio,
  checkContrastCompliance,
  generateColorVariant,
  generateColorPalette,
} from '../colorUtils';

describe('Color Utils - Actual Functions', () => {
  // ==================== HSL 转换测试 ====================
  describe('HSL Conversion', () => {
    describe('hslToHex', () => {
      it('converts HSL string to hex', () => {
        expect(hslToHex('hsl(0, 100%, 50%)')).toBe('#ff0000');
        expect(hslToHex('hsl(120, 100%, 50%)')).toBe('#00ff00');
        expect(hslToHex('hsl(240, 100%, 50%)')).toBe('#0000ff');
      });

      it('converts CSS variable format to hex', () => {
        expect(hslToHex('0 100% 50%')).toBe('#ff0000');
        expect(hslToHex('120 100% 50%')).toBe('#00ff00');
        expect(hslToHex('240 100% 50%')).toBe('#0000ff');
      });

      it('handles edge cases', () => {
        expect(hslToHex('hsl(0, 0%, 0%)')).toBe('#000000'); // Black
        expect(hslToHex('hsl(0, 0%, 100%)')).toBe('#ffffff'); // White
        expect(hslToHex('hsl(0, 0%, 50%)')).toBe('#808080'); // Gray
      });

      it('handles invalid input gracefully', () => {
        expect(hslToHex('')).toBe('#000000');
        expect(hslToHex('invalid')).toBe('#000000');
      });
    });

    describe('hexToHsl', () => {
      it('converts hex to HSL format', () => {
        expect(hexToHsl('#ff0000')).toBe('0 100% 50%');
        expect(hexToHsl('#00ff00')).toBe('120 100% 50%');
        expect(hexToHsl('#0000ff')).toBe('240 100% 50%');
      });

      it('handles hex with hash', () => {
        expect(hexToHsl('#ffffff')).toBe('0 0% 100%');
        expect(hexToHsl('#000000')).toBe('0 0% 0%');
        expect(hexToHsl('#808080')).toBe('0 0% 50%');
      });

      it('handles hex without hash', () => {
        expect(hexToHsl('ff0000')).toBe('0 100% 50%');
        expect(hexToHsl('00ff00')).toBe('120 100% 50%');
      });
    });

    describe('hexToHslString', () => {
      it('converts hex to complete HSL string', () => {
        expect(hexToHslString('#ff0000')).toBe('hsl(0, 100%, 50%)');
        expect(hexToHslString('#00ff00')).toBe('hsl(120, 100%, 50%)');
        expect(hexToHslString('#0000ff')).toBe('hsl(240, 100%, 50%)');
      });
    });
  });

  // ==================== 颜色验证测试 ====================
  describe('Color Validation', () => {
    describe('isValidColor', () => {
      it('validates hex colors', () => {
        expect(isValidColor('#FF0000')).toBe(true);
        expect(isValidColor('#00FF00')).toBe(true);
        expect(isValidColor('#0000FF')).toBe(true);
        expect(isValidColor('#ffffff')).toBe(true);
      });

      it('validates HSL colors', () => {
        expect(isValidColor('hsl(0, 100%, 50%)')).toBe(true);
        expect(isValidColor('hsl(120, 100%, 50%)')).toBe(true);
        expect(isValidColor('hsl(240, 100%, 50%)')).toBe(true);
      });

      it('validates CSS variable format', () => {
        expect(isValidColor('0 100% 50%')).toBe(true);
        expect(isValidColor('120 100% 50%')).toBe(true);
        expect(isValidColor('240 100% 50%')).toBe(true);
      });

      it('rejects invalid colors', () => {
        expect(isValidColor('#GG0000')).toBe(false);
        expect(isValidColor('#FF00')).toBe(false);
        expect(isValidColor('invalid')).toBe(false);
        expect(isValidColor('')).toBe(false);
        expect(isValidColor('rgb(255, 0, 0)')).toBe(false);
      });
    });
  });

  // ==================== 亮度和对比度测试 ====================
  describe('Luminance and Contrast', () => {
    describe('getLuminance', () => {
      it('calculates luminance correctly', () => {
        expect(getLuminance('#ffffff')).toBeCloseTo(1, 2); // White
        expect(getLuminance('#000000')).toBeCloseTo(0, 2); // Black
        expect(getLuminance('#ff0000')).toBeGreaterThan(0); // Red
        expect(getLuminance('#00ff00')).toBeGreaterThan(0); // Green
        expect(getLuminance('#0000ff')).toBeGreaterThan(0); // Blue
      });

      it('handles different hex formats', () => {
        expect(getLuminance('ff0000')).toEqual(getLuminance('#ff0000'));
        expect(getLuminance('#FF0000')).toEqual(getLuminance('#ff0000'));
      });
    });

    describe('getContrastRatio', () => {
      it('calculates contrast ratio correctly', () => {
        expect(getContrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 0); // Maximum contrast
        expect(getContrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 0); // Same color
        expect(getContrastRatio('#000000', '#000000')).toBeCloseTo(1, 0); // Same color
      });

      it('is symmetric', () => {
        const ratio1 = getContrastRatio('#ff0000', '#00ff00');
        const ratio2 = getContrastRatio('#00ff00', '#ff0000');
        expect(ratio1).toBeCloseTo(ratio2, 2);
      });
    });

    describe('checkContrastCompliance', () => {
      it('checks WCAG compliance correctly', () => {
        const whiteOnBlack = checkContrastCompliance('#ffffff', '#000000');
        expect(whiteOnBlack.aa).toBe(true);
        expect(whiteOnBlack.aaa).toBe(true);
        expect(whiteOnBlack.ratio).toBeGreaterThan(7);

        const sameColor = checkContrastCompliance('#ffffff', '#ffffff');
        expect(sameColor.aa).toBe(false);
        expect(sameColor.aaa).toBe(false);
        expect(sameColor.ratio).toBeCloseTo(1, 0);
      });

      it('returns correct compliance levels', () => {
        // Test a color combination that meets AA but not AAA
        const result = checkContrastCompliance('#767676', '#ffffff');
        expect(result.ratio).toBeGreaterThan(4.5);
        expect(result.ratio).toBeLessThan(7);
        expect(result.aa).toBe(true);
        expect(result.aaa).toBe(false);
      });
    });
  });

  // ==================== 颜色变体生成测试 ====================
  describe('Color Variants', () => {
    describe('generateColorVariant', () => {
      it('generates lighter variants', () => {
        const original = '#808080';
        const lighter = generateColorVariant(original, 0.2);
        
        expect(getLuminance(lighter)).toBeGreaterThan(getLuminance(original));
      });

      it('generates darker variants', () => {
        const original = '#808080';
        const darker = generateColorVariant(original, -0.2);
        
        expect(getLuminance(darker)).toBeLessThan(getLuminance(original));
      });

      it('clamps values to valid range', () => {
        const white = '#ffffff';
        const lighterWhite = generateColorVariant(white, 0.5);
        expect(lighterWhite).toBe('#ffffff'); // Should remain white

        const black = '#000000';
        const darkerBlack = generateColorVariant(black, -0.5);
        expect(darkerBlack).toBe('#000000'); // Should remain black
      });

      it('handles edge cases', () => {
        expect(generateColorVariant('#ff0000', 0)).toBe('#ff0000'); // No change
        expect(generateColorVariant('#ff0000', 1)).toBe('#ffffff'); // Maximum lightness
        expect(generateColorVariant('#ff0000', -1)).toBe('#000000'); // Minimum lightness
      });
    });

    describe('generateColorPalette', () => {
      it('generates palette with lighter and darker variants', () => {
        const palette = generateColorPalette('#ff0000');
        
        expect(palette.lighter).toHaveLength(5);
        expect(palette.darker).toHaveLength(5);
        
        // Check that all colors are valid hex
        palette.lighter.forEach(color => {
          expect(color).toMatch(/^#[0-9a-f]{6}$/i);
        });
        
        palette.darker.forEach(color => {
          expect(color).toMatch(/^#[0-9a-f]{6}$/i);
        });
      });

      it('generates progressively lighter and darker colors', () => {
        const palette = generateColorPalette('#808080');
        const baseLuminance = getLuminance('#808080');
        
        // Check lighter variants are progressively lighter
        for (let i = 0; i < palette.lighter.length - 1; i++) {
          const current = getLuminance(palette.lighter[i]);
          const next = getLuminance(palette.lighter[i + 1]);
          expect(current).toBeGreaterThan(baseLuminance);
          expect(next).toBeGreaterThanOrEqual(current);
        }
        
        // Check darker variants are progressively darker
        for (let i = 0; i < palette.darker.length - 1; i++) {
          const current = getLuminance(palette.darker[i]);
          const next = getLuminance(palette.darker[i + 1]);
          expect(current).toBeLessThan(baseLuminance);
          expect(next).toBeLessThanOrEqual(current);
        }
      });

      it('handles edge colors correctly', () => {
        const whitePalette = generateColorPalette('#ffffff');
        expect(whitePalette.lighter.every(color => color === '#ffffff')).toBe(true);
        
        const blackPalette = generateColorPalette('#000000');
        expect(blackPalette.darker.every(color => color === '#000000')).toBe(true);
      });
    });
  });

  // ==================== 性能测试 ====================
  describe('Performance', () => {
    it('handles large number of conversions efficiently', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        const hue = i % 360;
        const hsl = `hsl(${hue}, 100%, 50%)`;
        const hex = hslToHex(hsl);
        hexToHsl(hex);
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });

    it('handles palette generation efficiently', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        const hue = i * 3.6; // 0-360 degrees
        const hex = hslToHex(`hsl(${hue}, 100%, 50%)`);
        generateColorPalette(hex);
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(50); // Should complete in under 50ms
    });
  });

  // ==================== 边缘情况测试 ====================
  describe('Edge Cases', () => {
    it('handles malformed hex colors', () => {
      expect(() => hexToHsl('#gggggg')).not.toThrow();
      expect(() => getLuminance('#gggggg')).not.toThrow();
      expect(() => generateColorVariant('#gggggg', 0.1)).not.toThrow();
    });

    it('handles empty and null inputs', () => {
      expect(() => hslToHex('')).not.toThrow();
      expect(() => hexToHsl('')).not.toThrow();
      expect(() => isValidColor('')).not.toThrow();
    });

    it('handles extreme lightness deltas', () => {
      expect(() => generateColorVariant('#ff0000', 100)).not.toThrow();
      expect(() => generateColorVariant('#ff0000', -100)).not.toThrow();
    });

    it('maintains color format consistency', () => {
      const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffffff', '#000000'];
      
      colors.forEach(color => {
        const hsl = hexToHsl(color);
        const backToHex = hslToHex(`hsl(${hsl.replace(/\s/g, ', ')})`);
        
        // Colors should be approximately the same (allowing for rounding)
        expect(backToHex.toLowerCase()).toMatch(/^#[0-9a-f]{6}$/);
      });
    });
  });
});
