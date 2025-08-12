import * as React from 'react';
import { Theme } from '../../services/themeService';

interface ThemePreviewProps {
  theme: Theme;
  isActive?: boolean;
  onSelect?: () => void;
  showDetails?: boolean;
  className?: string;
}

export const ThemePreview: React.FC<ThemePreviewProps> = ({
  theme,
  isActive = false,
  onSelect,
  showDetails = false,
  className = ''
}) => {
  const getColorContrast = (hexColor: string): 'light' | 'dark' => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? 'dark' : 'light';
  };

  const generateColorPalette = () => {
    const colors = [
      theme.colors.primary,
      theme.colors.focus,
      theme.colors.break,
      theme.colors.microBreak,
      theme.colors.background,
      theme.colors.surface,
      theme.colors.text,
      theme.colors.textSecondary,
      theme.colors.border,
      theme.colors.accent
    ].filter(Boolean);

    const uniqueColors = Array.from(new Set(colors));
    return uniqueColors.slice(0, 8);
  };

  const colorPalette = generateColorPalette();

  return (
    <div
      className={`
        relative p-6 rounded-lg border-2 transition-all duration-200 cursor-pointer
        ${isActive 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg' 
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
        }
        ${className}
      `}
      onClick={onSelect}
      style={{
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        borderColor: isActive ? theme.colors.primary : theme.colors.border
      }}
    >
      {/* 激活指示器 */}
      {isActive && (
        <div className="absolute top-2 right-2">
          <div 
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ backgroundColor: theme.colors.primary }}
          />
        </div>
      )}

      {/* 主题信息 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 
            className="font-semibold text-lg mb-1"
            style={{ color: theme.colors.text }}
          >
            {theme.name}
          </h3>
          <p 
            className="text-sm opacity-75"
            style={{ color: theme.colors.textSecondary }}
          >
            {theme.description}
          </p>
          <span 
            className="inline-block px-2 py-1 text-xs rounded-full mt-2"
            style={{
              backgroundColor: theme.colors.primary + '20',
              color: theme.colors.primary
            }}
          >
            {theme.type === 'light' ? '浅色' : theme.type === 'dark' ? '深色' : '自定义'}
          </span>
        </div>
      </div>

      {/* 颜色预览 */}
      <div className="space-y-3">
        {/* 主要颜色环 */}
        <div className="flex items-center space-x-2">
          <span 
            className="text-xs font-medium"
            style={{ color: theme.colors.textSecondary }}
          >
            主要颜色
          </span>
          <div className="flex space-x-1">
            {[theme.colors.primary, theme.colors.focus, theme.colors.break, theme.colors.microBreak]
              .filter(Boolean)
              .map((color, index) => (
                <div
                  key={index}
                  className="w-6 h-6 rounded-full border-2 shadow-sm"
                  style={{
                    backgroundColor: color,
                    borderColor: getColorContrast(color) === 'dark' ? '#fff' : '#000'
                  }}
                  title={`颜色 ${index + 1}`}
                />
              ))}
          </div>
        </div>

        {/* 颜色调色板 */}
        <div className="space-y-2">
          <span 
            className="text-xs font-medium"
            style={{ color: theme.colors.textSecondary }}
          >
            颜色调色板
          </span>
          <div className="grid grid-cols-8 gap-1">
            {colorPalette.map((color, index) => (
              <div
                key={index}
                className="w-full h-4 rounded cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 详细预览 */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: theme.colors.border }}>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div 
                className="mb-1 font-medium"
                style={{ color: theme.colors.text }}
              >
                背景
              </div>
              <div className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ 
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border 
                  }}
                />
                <span>{theme.colors.background}</span>
              </div>
            </div>
            <div>
              <div 
                className="mb-1 font-medium"
                style={{ color: theme.colors.text }}
              >
                文字
              </div>
              <div className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ 
                    backgroundColor: theme.colors.text,
                    borderColor: theme.colors.border 
                  }}
                />
                <span>{theme.colors.text}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 模拟UI预览 */}
      <div className="mt-4 pt-4 border-t" style={{ borderColor: theme.colors.border }}>
        <div 
          className="text-xs font-medium mb-2"
          style={{ color: theme.colors.textSecondary }}
        >
          UI预览
        </div>
        <div className="space-y-2">
          {/* 模拟按钮 */}
          <div className="flex space-x-2">
            <div 
              className="px-3 py-1 rounded text-xs"
              style={{
                backgroundColor: theme.colors.primary,
                color: getColorContrast(theme.colors.primary) === 'dark' ? '#fff' : '#000'
              }}
            >
              主要
            </div>
            <div 
              className="px-3 py-1 rounded text-xs border"
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }}
            >
              次要
            </div>
          </div>
          
          {/* 模拟进度条 */}
          <div 
            className="w-full h-2 rounded-full"
            style={{ backgroundColor: theme.colors.muted + '40' }}
          >
            <div 
              className="h-full rounded-full"
              style={{ 
                width: '60%',
                backgroundColor: theme.colors.primary 
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};