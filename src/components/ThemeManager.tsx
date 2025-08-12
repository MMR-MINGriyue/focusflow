import React, { useState, useEffect, useCallback } from 'react';
import { themeService, Theme, CustomTheme } from '../services/themeService';
import { Download, Trash2, Palette } from 'lucide-react';
import { ColorPicker } from './Settings/ColorPicker';

interface ThemeManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeManager: React.FC<ThemeManagerProps> = ({ isOpen, onClose }) => {
  const [currentTheme, setCurrentTheme] = useState(themeService.getCurrentTheme());
  const [availableThemes, setAvailableThemes] = useState(themeService.getAvailableThemes());
  const [customThemes, setCustomThemes] = useState(themeService.getCustomThemes());
  const [activeTab, setActiveTab] = useState<'themes' | 'custom' | 'create'>('themes');
  const [newTheme, setNewTheme] = useState<Partial<CustomTheme>>({
    name: '',
    type: 'light',
    colors: {
      primary: 'hsl(221, 83%, 53%)',
      secondary: 'hsl(215, 78%, 51%)',
      background: 'hsl(0, 0%, 100%)',
      surface: 'hsl(0, 0%, 98%)',
      text: 'hsl(222, 47%, 11%)',
      textSecondary: 'hsl(215, 16%, 47%)',
      accent: 'hsl(221, 83%, 53%)',
      border: 'hsl(214, 32%, 91%)',
      success: 'hsl(142, 71%, 45%)',
      warning: 'hsl(38, 92%, 50%)',
      error: 'hsl(0, 84%, 60%)',
      focus: 'hsl(221, 83%, 53%)',
      break: 'hsl(142, 71%, 45%)',
      microBreak: 'hsl(38, 92%, 50%)',
      muted: 'hsl(215, 16%, 47%)',
      timer: {
        primary: 'hsl(221, 83%, 53%)',
        secondary: 'hsl(215, 78%, 51%)',
        accent: 'hsl(221, 83%, 53%)',
        glow: 'hsl(221, 83%, 53%, 0.3)'
      }
    },
    fonts: {
      primary: 'Inter, system-ui, sans-serif',
      mono: 'JetBrains Mono, monospace'
    }
  });

  // 主题变更监听
  useEffect(() => {
    const unsubscribe = themeService.addThemeChangeListener((theme) => {
      setCurrentTheme(theme);
    });

    // 加载自定义主题
    themeService.loadCustomThemes();
    setCustomThemes(themeService.getCustomThemes());
    setAvailableThemes(themeService.getAvailableThemes());

    return unsubscribe;
  }, []);

  const handleThemeChange = useCallback((themeId: string) => {
    themeService.setTheme(themeId);
  }, []);

  const handleCreateTheme = useCallback(() => {
    if (!newTheme.name) return;

    const customTheme: CustomTheme = {
      id: Date.now().toString(),
      name: newTheme.name || '未命名主题',
      type: newTheme.type || 'light',
      isCustom: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      colors: newTheme.colors || {
        primary: 'hsl(221, 83%, 53%)',
        secondary: 'hsl(215, 78%, 51%)',
        background: 'hsl(0, 0%, 100%)',
        surface: 'hsl(0, 0%, 98%)',
        text: 'hsl(222, 47%, 11%)',
        textSecondary: 'hsl(215, 16%, 47%)',
        accent: 'hsl(221, 83%, 53%)',
        border: 'hsl(214, 32%, 91%)',
        success: 'hsl(142, 71%, 45%)',
        warning: 'hsl(38, 92%, 50%)',
        error: 'hsl(0, 84%, 60%)',
        focus: 'hsl(221, 83%, 53%)',
        break: 'hsl(142, 71%, 45%)',
        microBreak: 'hsl(38, 92%, 50%)',
        muted: 'hsl(215, 16%, 47%)',
        timer: {
          primary: 'hsl(221, 83%, 53%)',
          secondary: 'hsl(215, 78%, 51%)',
          accent: 'hsl(221, 83%, 53%)',
          glow: 'hsl(221, 83%, 53%, 0.3)'
        }
      },
      fonts: newTheme.fonts || {
        primary: 'Inter, system-ui, sans-serif',
        mono: 'JetBrains Mono, monospace'
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        xxl: '3rem',
        borderRadius: '0.5rem'
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        glow: '0 0 20px rgba(59, 130, 246, 0.5)'
      },
      animations: {
        duration: '200ms',
        easing: 'ease-out'
      }
    };

    themeService.createCustomTheme(customTheme);
    setCustomThemes(themeService.getCustomThemes());
    setAvailableThemes(themeService.getAvailableThemes());
    setActiveTab('custom');
    setNewTheme({ name: '', type: 'light', colors: {
      primary: 'hsl(221, 83%, 53%)',
      secondary: 'hsl(215, 78%, 51%)',
      background: 'hsl(0, 0%, 100%)',
      surface: 'hsl(0, 0%, 98%)',
      text: 'hsl(222, 47%, 11%)',
      textSecondary: 'hsl(215, 16%, 47%)',
      accent: 'hsl(221, 83%, 53%)',
      border: 'hsl(214, 32%, 91%)',
      success: 'hsl(142, 71%, 45%)',
      warning: 'hsl(38, 92%, 50%)',
      error: 'hsl(0, 84%, 60%)',
      focus: 'hsl(221, 83%, 53%)',
      break: 'hsl(142, 71%, 45%)',
      microBreak: 'hsl(38, 92%, 50%)',
      muted: 'hsl(215, 16%, 47%)',
      timer: {
        primary: 'hsl(221, 83%, 53%)',
        secondary: 'hsl(215, 78%, 51%)',
        accent: 'hsl(221, 83%, 53%)',
        glow: 'hsl(221, 83%, 53%, 0.3)'
      }
    }, fonts: {
      primary: 'Inter, system-ui, sans-serif',
      mono: 'JetBrains Mono, monospace'
    } });
  }, [newTheme]);

  const handleDeleteTheme = useCallback((themeId: string) => {
    themeService.deleteCustomTheme(themeId);
    setCustomThemes(themeService.getCustomThemes());
    setAvailableThemes(themeService.getAvailableThemes());
  }, []);

  const handleExportTheme = useCallback((themeId: string) => {
    try {
      const themeJson = themeService.exportTheme(themeId);
      const blob = new Blob([themeJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${themeId}-theme.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出主题失败:', error);
    }
  }, []);

  const handleImportTheme = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const themeJson = e.target?.result as string;
        themeService.importTheme(themeJson);
        setCustomThemes(themeService.getCustomThemes());
        setAvailableThemes(themeService.getAvailableThemes());
      } catch (error) {
        console.error('导入主题失败:', error);
      }
    };
    reader.readAsText(file);
  }, []);

  const handleAutoDetect = useCallback(() => {
    themeService.autoDetectTheme();
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">主题管理</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ×
          </button>
        </div>

        {/* 标签页 */}
        <div className="flex border-b dark:border-gray-700">
          <button
            onClick={() => setActiveTab('themes')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'themes'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            预设主题
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'custom'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            自定义主题 ({customThemes.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'create'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            创建主题
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'themes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableThemes.map((theme) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  isActive={currentTheme.id === theme.id}
                  onSelect={() => handleThemeChange(theme.id)}
                  onExport={() => handleExportTheme(theme.id)}
                />
              ))}
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="space-y-4">
              {customThemes.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Palette className="mx-auto mb-2 h-12 w-12" />
                  <p>还没有自定义主题</p>
                </div>
              ) : (
                customThemes.map((customTheme) => {
                  const theme = availableThemes.find(t => t.id === `custom-${customTheme.name}`);
                  return theme && (
                    <ThemeCard
                      key={theme.id}
                      theme={theme}
                      isActive={currentTheme.id === theme.id}
                      onSelect={() => handleThemeChange(theme.id)}
                      onDelete={() => handleDeleteTheme(theme.id)}
                      onExport={() => handleExportTheme(theme.id)}
                    />
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'create' && (
            <ThemeCreator
              newTheme={newTheme}
              onChange={setNewTheme}
              onCreate={handleCreateTheme}
            />
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-between p-4 border-t dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleAutoDetect}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              自动检测系统主题
            </button>
            <label className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 cursor-pointer">
              <input
                type="file"
                accept=".json"
                onChange={handleImportTheme}
                className="hidden"
              />
              导入主题
            </label>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};

interface ThemeCardProps {
  theme: Theme;
  isActive: boolean;
  onSelect: () => void;
  onDelete?: () => void;
  onExport?: () => void;
}

const ThemeCard: React.FC<ThemeCardProps> = ({
  theme,
  isActive,
  onSelect,
  onDelete,
  onExport
}) => {
  return (
    <div
      className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
        isActive
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{theme.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{theme.type}</p>
        </div>
        <div
          className="w-6 h-6 rounded-full border-2 border-gray-300"
          style={{ backgroundColor: theme.colors.primary }}
        />
      </div>

      <div className="space-y-2">
        <div className="flex space-x-1">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: theme.colors.background }}
          />
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: theme.colors.surface }}
          />
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: theme.colors.text }}
          />
        </div>

        <div className="flex space-x-2 mt-3">
          {onExport && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExport();
              }}
              className="text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <Download className="w-3 h-3" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-xs text-red-600 hover:text-red-800"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {isActive && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full" />
        </div>
      )}
    </div>
  );
};

interface ThemeCreatorProps {
  newTheme: Partial<CustomTheme>;
  onChange: (theme: Partial<CustomTheme>) => void;
  onCreate: () => void;
}

const ThemeCreator: React.FC<ThemeCreatorProps> = ({
  newTheme,
  onChange,
  onCreate
}) => {
  const handleColorChange = (key: string, value: string) => {
    const currentColors = newTheme.colors || {
      primary: 'hsl(221, 83%, 53%)',
      secondary: 'hsl(215, 78%, 51%)',
      background: 'hsl(0, 0%, 100%)',
      surface: 'hsl(0, 0%, 98%)',
      text: 'hsl(222, 47%, 11%)',
      textSecondary: 'hsl(215, 16%, 47%)',
      accent: 'hsl(221, 83%, 53%)',
      border: 'hsl(214, 32%, 91%)',
      success: 'hsl(142, 71%, 45%)',
      warning: 'hsl(38, 92%, 50%)',
      error: 'hsl(0, 84%, 60%)',
      focus: 'hsl(221, 83%, 53%)',
      break: 'hsl(142, 71%, 45%)',
      microBreak: 'hsl(38, 92%, 50%)',
      muted: 'hsl(215, 16%, 47%)',
      timer: {
        primary: 'hsl(221, 83%, 53%)',
        secondary: 'hsl(215, 78%, 51%)',
        accent: 'hsl(221, 83%, 53%)',
        glow: 'hsl(221, 83%, 53%, 0.3)'
      }
    };
    
    onChange({
      ...newTheme,
      colors: {
        ...currentColors,
        [key]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          主题名称
        </label>
        <input
          type="text"
          value={newTheme.name || ''}
          onChange={(e) => onChange({ ...newTheme, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="输入主题名称"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          主题类型
        </label>
        <select
          value={newTheme.type || 'light'}
          onChange={(e) => onChange({ ...newTheme, type: e.target.value as 'light' | 'dark' })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="light">浅色</option>
          <option value="dark">深色</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          主题颜色
        </label>
        <div className="space-y-4">
          <ColorPicker
            value={(newTheme.colors && newTheme.colors.primary) || '#3b82f6'}
            onChange={(value) => handleColorChange('primary', value)}
            label="主色"
            format="hsl"
            className="w-full"
          />
          <ColorPicker
            value={(newTheme.colors && newTheme.colors.background) || '#ffffff'}
            onChange={(value) => handleColorChange('background', value)}
            label="背景色"
            format="hsl"
            className="w-full"
          />
          <ColorPicker
            value={(newTheme.colors && newTheme.colors.text) || '#000000'}
            onChange={(value) => handleColorChange('text', value)}
            label="文字颜色"
            format="hsl"
            className="w-full"
          />
        </div>
      </div>

      <button
        onClick={onCreate}
        disabled={!newTheme.name}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        创建主题
      </button>
    </div>
  );
};

export default ThemeManager;