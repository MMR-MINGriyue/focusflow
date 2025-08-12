import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { hslToHex, hexToHsl, hexToHslString } from '../../utils/colorUtils';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  format?: 'hex' | 'hsl';
  showAlpha?: boolean;
  className?: string;
}

interface ColorState {
  hex: string;
  hsl: string;
  h: number;
  s: number;
  l: number;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  label,
  format = 'hex',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [colorState, setColorState] = useState<ColorState>(() => {
    const hex = value.startsWith('#') ? value : hslToHex(value);
    const hsl = hexToHsl(hex);
    const [h, s, l] = hsl.split(' ').map(v => parseFloat(v.replace('%', '')));
    return {
      hex,
      hsl: hexToHslString(hex),
      h,
      s,
      l
    };
  });

  const pickerRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const saturationRef = useRef<HTMLDivElement>(null);
  const lightnessRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const hex = value.startsWith('#') ? value : hslToHex(value);
    const hsl = hexToHsl(hex);
    const [h, s, l] = hsl.split(' ').map(v => parseFloat(v.replace('%', '')));
    setColorState({
      hex,
      hsl: hexToHslString(hex),
      h,
      s,
      l
    });
  }, [value]);

  const updateColor = (h: number, s: number, l: number) => {
    const newHsl = `${h} ${s}% ${l}%`;
    const newHex = hslToHex(newHsl);
    
    setColorState({
      hex: newHex,
      hsl: hexToHslString(newHex),
      h,
      s,
      l
    });

    onChange(format === 'hex' ? newHex : newHsl);
  };

  const handleHexChange = (hex: string) => {
    if (hex.match(/^#[0-9A-Fa-f]{6}$/)) {
      const hsl = hexToHsl(hex);
      const [h, s, l] = hsl.split(' ').map(v => parseFloat(v.replace('%', '')));
      
      setColorState({
        hex,
        hsl: hexToHslString(hex),
        h,
        s,
        l
      });
      
      onChange(format === 'hex' ? hex : hsl);
    }
  };

  const handleSaturationChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (saturationRef.current) {
      const rect = saturationRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      
      const s = x * 100;
      const l = (1 - y) * 100;
      
      updateColor(colorState.h, s, l);
    }
  };

  const handleHueChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hueRef.current) {
      const rect = hueRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const h = Math.round(x * 360);
      
      updateColor(h, colorState.s, colorState.l);
    }
  };

  const handleLightnessChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (lightnessRef.current) {
      const rect = lightnessRef.current.getBoundingClientRect();
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      const l = Math.round(y * 100);
      
      updateColor(colorState.h, colorState.s, l);
    }
  };

  const generateShades = (baseHex: string, count: number = 5) => {
    const shades = [];
    for (let i = 0; i < count; i++) {
      const lightness = 20 + (i * 60) / (count - 1);
      const hsl = hexToHsl(baseHex);
      const [h, s] = hsl.split(' ').map(v => parseFloat(v.replace('%', '')));
      const newHsl = `${h} ${s}% ${lightness}%`;
      shades.push(hslToHex(newHsl));
    }
    return shades;
  };

  const shades = generateShades(colorState.hex);

  return (
    <div className={`relative ${className}`} ref={pickerRef}>
      <div className="flex items-center space-x-2">
        {label && (
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <div
          className="w-8 h-8 rounded border-2 cursor-pointer hover:shadow-md transition-shadow"
          style={{ backgroundColor: colorState.hex }}
          onClick={() => setIsOpen(!isOpen)}
          title="点击选择颜色"
        />
        <input
          type="text"
          value={format === 'hex' ? colorState.hex : colorState.hsl}
          onChange={(e) => {
            const val = e.target.value;
            if (format === 'hex') {
              handleHexChange(val);
            } else {
              onChange(val);
            }
          }}
          className="px-2 py-1 text-sm border rounded w-32 font-mono"
          placeholder={format === 'hex' ? '#rrggbb' : 'hsl(h,s%,l%)'}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white dark:bg-gray-800 border rounded-lg shadow-xl p-4 w-80">
          <div className="space-y-4">
            {/* 颜色选择器主体 */}
            <div className="grid grid-cols-2 gap-4">
              {/* 饱和度/亮度选择器 */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  饱和度/亮度
                </label>
                <div
                  ref={saturationRef}
                  className="relative w-full h-32 rounded border cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, hsl(${colorState.h}, 0%, 50%), hsl(${colorState.h}, 100%, 50%)),
                                linear-gradient(to bottom, transparent, black)`,
                    backgroundBlendMode: 'multiply'
                  }}
                  onMouseDown={(e) => {
                    const handleMouseMove = (e: MouseEvent) => handleSaturationChange(e as any);
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                    handleSaturationChange(e);
                  }}
                >
                  <div
                    className="absolute w-2 h-2 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow"
                    style={{
                      left: `${colorState.s}%`,
                      top: `${100 - colorState.l}%`
                    }}
                  />
                </div>
              </div>

              {/* 色相选择器 */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  色相
                </label>
                <div
                  ref={hueRef}
                  className="relative w-full h-32 rounded border cursor-pointer"
                  style={{
                    background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
                  }}
                  onMouseDown={(e) => {
                    const handleMouseMove = (e: MouseEvent) => handleHueChange(e as any);
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                    handleHueChange(e);
                  }}
                >
                  <div
                    className="absolute w-2 h-full border-2 border-white transform -translate-x-1/2 shadow"
                    style={{
                      left: `${(colorState.h / 360) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 亮度滑块 */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                亮度: {colorState.l}%
              </label>
              <div
                ref={lightnessRef}
                className="relative w-full h-4 rounded border cursor-pointer"
                style={{
                  background: `linear-gradient(to right, hsl(${colorState.h}, ${colorState.s}%, 0%), hsl(${colorState.h}, ${colorState.s}%, 50%), hsl(${colorState.h}, ${colorState.s}%, 100%))`
                }}
                onMouseDown={(e) => {
                  const handleMouseMove = (e: MouseEvent) => handleLightnessChange(e as any);
                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                  handleLightnessChange(e);
                }}
              >
                <div
                  className="absolute w-2 h-full border-2 border-white transform -translate-x-1/2 shadow"
                  style={{
                    left: `${colorState.l}%`
                  }}
                />
              </div>
            </div>

            {/* 颜色值显示 */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <span className="text-gray-600 dark:text-gray-400">HEX:</span>
                <span className="ml-1">{colorState.hex}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">HSL:</span>
                <span className="ml-1">{colorState.hsl}</span>
              </div>
            </div>

            {/* 颜色渐变 */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                颜色渐变
              </label>
              <div className="flex space-x-1">
                {shades.map((shade, index) => (
                  <div
                    key={index}
                    className="flex-1 h-6 rounded cursor-pointer hover:scale-110 transition-transform"
                    style={{ backgroundColor: shade }}
                    onClick={() => handleHexChange(shade)}
                    title={`亮度 ${20 + (index * 60) / (shades.length - 1)}%`}
                  />
                ))}
              </div>
            </div>

            {/* 预设颜色 */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                预设颜色
              </label>
              <div className="grid grid-cols-6 gap-1">
                {[
                  '#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#8b00ff',
                  '#ff1493', '#00ced1', '#ffd700', '#32cd32', '#ff69b4', '#4169e1'
                ].map((preset) => (
                  <div
                    key={preset}
                    className="w-8 h-8 rounded cursor-pointer hover:scale-110 transition-transform"
                    style={{ backgroundColor: preset }}
                    onClick={() => handleHexChange(preset)}
                  />
                ))}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};