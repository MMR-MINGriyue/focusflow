import React, { useState, useEffect, useCallback } from 'react';
import { Palette, Eye, Save, RotateCcw, Copy, Download } from 'lucide-react';
import { Button } from '../ui/Button';
import { Theme, ExtendedThemeColors } from '../../services/themeService';
import { themeService } from '../../services/themeService';

import { ColorPicker } from './ColorPicker';
import { ThemePreview } from './ThemePreview';

interface ThemeEditorProps {
  onThemeChange?: (theme: Theme) => void;
}

interface NotificationState {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
}

interface ColorGroup {
  name: string;
  description: string;
  colors: (keyof ExtendedThemeColors)[];
}

const ThemeEditor: React.FC<ThemeEditorProps> = ({ onThemeChange }) => {
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [originalTheme, setOriginalTheme] = useState<Theme | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [themeName, setThemeName] = useState('');
  const [themeDescription, setThemeDescription] = useState('');
  const [notification, setNotification] = useState<NotificationState>({
    message: '',
    type: 'info',
    visible: false
  });

  // 颜色分组配置
  const colorGroups: ColorGroup[] = [
    {
      name: '基础颜色',
      description: '应用的基础背景和前景色',
      colors: ['primary', 'secondary', 'background', 'surface', 'text', 'textSecondary', 'muted']
    },
    {
      name: '功能颜色',
      description: '用于不同功能状态的颜色',
      colors: ['accent', 'success', 'warning', 'error', 'border']
    },
    {
      name: '专注应用特定',
      description: 'FocusFlow 应用特有的功能颜色',
      colors: ['focus', 'break', 'microBreak']
    }
  ];

  // 显示通知
  const showNotification = useCallback((message: string, type: NotificationState['type'] = 'info') => {
    setNotification({ message, type, visible: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  useEffect(() => {
    // 检查是否有变化
    if (editingTheme && originalTheme) {
      const hasChanges = JSON.stringify(editingTheme.colors) !== JSON.stringify(originalTheme.colors) ||
                        editingTheme.name !== originalTheme.name ||
                        editingTheme.description !== originalTheme.description;
      setHasChanges(hasChanges);
    }
  }, [editingTheme, originalTheme]);

  // 开始编辑主题
  const startEditing = (theme: Theme) => {
    const editableTheme = {
      ...theme,
      id: `custom_${Date.now()}`,
      name: `${theme.name} (副本)`,
      description: `基于 ${theme.name} 的自定义主题`,
      isCustom: true
    };
    
    setEditingTheme(editableTheme);
    setOriginalTheme(theme);
    setThemeName(editableTheme.name);
    setThemeDescription(editableTheme.description);
    setPreviewMode(false);
    setHasChanges(false);
  };

  // 更新颜色
  const updateColor = (colorKey: keyof ExtendedThemeColors, value: string) => {
    if (!editingTheme) return;

    const updatedTheme = {
      ...editingTheme,
      colors: {
        ...editingTheme.colors,
        [colorKey]: value
      }
    };

    setEditingTheme(updatedTheme);

    // 如果在预览模式，立即应用
    if (previewMode) {
      themeService.setTheme(updatedTheme.id);
    }
  };

  // 更新主题信息
  const updateThemeInfo = (name: string, description: string) => {
    if (!editingTheme) return;

    const updatedTheme = {
      ...editingTheme,
      name,
      description
    };

    setEditingTheme(updatedTheme);
    setThemeName(name);
    setThemeDescription(description);
  };





  // 切换预览模式
  const togglePreview = () => {
    if (!editingTheme) return;

    if (previewMode) {
      // 退出预览，恢复原主题
      const currentTheme = themeService.getCurrentTheme();
      themeService.setTheme(currentTheme.id);
      setPreviewMode(false);
    } else {
      // 进入预览模式 - 创建临时主题并应用
      const tempId = `preview_${Date.now()}`;
      const previewTheme = {
        ...editingTheme,
        id: tempId
      };
      themeService.createCustomTheme(previewTheme);
      themeService.setTheme(tempId);
      setPreviewMode(true);
    }
  };

  // 保存主题
  const saveTheme = () => {
    if (!editingTheme) return;

    const finalTheme = {
      ...editingTheme,
      name: themeName,
      description: themeDescription
    };

    try {
      themeService.createCustomTheme(finalTheme);
      themeService.setTheme(finalTheme.id);
      setOriginalTheme(finalTheme);
      setHasChanges(false);
      onThemeChange?.(finalTheme);

      if (previewMode) {
        setPreviewMode(false);
      }

      showNotification('主题保存成功！', 'success');
    } catch (error) {
      console.error('Failed to save theme:', error);
      showNotification('保存主题失败，请重试。', 'error');
    }
  };

  // 重置更改
  const resetChanges = () => {
    if (!originalTheme) return;

    setEditingTheme({ ...originalTheme });
    setThemeName(originalTheme.name || '');
    setThemeDescription(originalTheme.description || '');
    setHasChanges(false);

    if (previewMode && originalTheme) {
      themeService.setTheme(originalTheme.id);
    }
  };

  // 复制主题配置
  const copyThemeConfig = () => {
    if (!editingTheme) return;

    const config = JSON.stringify(editingTheme, null, 2);
    navigator.clipboard.writeText(config).then(() => {
      showNotification('主题配置已复制到剪贴板！', 'success');
    }).catch(() => {
      showNotification('复制失败，请手动复制。', 'error');
    });
  };

  // 导出主题
  const exportTheme = () => {
    if (!editingTheme) return;

    const config = JSON.stringify(editingTheme, null, 2);
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${editingTheme.name.replace(/\s+/g, '-').toLowerCase()}-theme.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 获取可用的基础主题
  const availableThemes = themeService.getAvailableThemes().filter(theme => 
    ['light', 'dark', 'nature', 'ocean', 'purple', 'minimal'].includes(theme.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Palette className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-semibold">主题编辑器</h3>
        </div>
        <div className="flex items-center space-x-2">
          {editingTheme && (
            <>
              <Button
                type="button"
                onClick={togglePreview}
                size="sm"
                variant={previewMode ? "default" : "outline"}
                className="flex items-center space-x-1"
              >
                <Eye className="h-3 w-3" />
                <span>{previewMode ? '退出预览' : '预览'}</span>
              </Button>
              {hasChanges && (
                <>
                  <Button
                    type="button"
                    onClick={resetChanges}
                    size="sm"
                    variant="outline"
                    className="flex items-center space-x-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>重置</span>
                  </Button>
                  <Button
                    type="button"
                    onClick={saveTheme}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white flex items-center space-x-1"
                  >
                    <Save className="h-3 w-3" />
                    <span>保存主题</span>
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {!editingTheme ? (
        // 选择基础主题
        <div className="space-y-4">
          <div className="text-center py-8">
            <Palette className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-700 mb-2">创建自定义主题</h4>
            <p className="text-gray-500 mb-6">选择一个基础主题开始自定义</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {availableThemes.map((theme) => (
              <div
                key={theme.id}
                className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => startEditing(theme)}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div
                    className="w-6 h-6 rounded-full border"
                    style={{ '--bg-color': theme.colors.primary, backgroundColor: 'var(--bg-color)' } as React.CSSProperties}
                  />
                  <div>
                    <div className="font-medium text-sm">{theme.name}</div>
                    <div className="text-xs text-gray-500">{theme.type}</div>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ '--bg-color': theme.colors.focus, backgroundColor: 'var(--bg-color)' } as React.CSSProperties}
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ '--bg-color': theme.colors.break, backgroundColor: 'var(--bg-color)' } as React.CSSProperties}
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ '--bg-color': theme.colors.microBreak, backgroundColor: 'var(--bg-color)' } as React.CSSProperties}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // 主题编辑界面
        <div className="space-y-6">
          {/* 主题预览和信息编辑 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 实时预览 */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">实时预览</h4>
              <ThemePreview
                theme={editingTheme}
                showDetails={true}
                className="w-full"
              />
            </div>
            
            {/* 主题信息编辑 */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">主题信息</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    主题名称
                  </label>
                  <input
                    type="text"
                    value={themeName}
                    onChange={(e) => updateThemeInfo(e.target.value, themeDescription)}
                    className="w-full p-2 border rounded text-sm"
                    placeholder="输入主题名称"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    主题描述
                  </label>
                  <textarea
                    value={themeDescription}
                    onChange={(e) => updateThemeInfo(themeName, e.target.value)}
                    className="w-full p-2 border rounded text-sm h-20 resize-none"
                    placeholder="输入主题描述"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 颜色编辑区域 */}
          <div className="space-y-4">
            {colorGroups.map((group) => (
              <div key={group.name} className="border rounded-lg p-4">
                <div className="mb-3">
                  <h4 className="font-medium text-gray-700">{group.name}</h4>
                  <p className="text-sm text-gray-500">{group.description}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.colors.map((colorKey) => (
                    <div key={colorKey} className="flex items-center space-x-3">
                      <ColorPicker
                        value={typeof editingTheme.colors[colorKey] === 'string' ? editingTheme.colors[colorKey] : '#3b82f6'}
                        onChange={(value) => updateColor(colorKey, value)}
                        label={colorKey.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        format="hsl"
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                onClick={copyThemeConfig}
                size="sm"
                variant="outline"
                className="flex items-center space-x-1"
              >
                <Copy className="h-3 w-3" />
                <span>复制配置</span>
              </Button>
              <Button
                type="button"
                onClick={exportTheme}
                size="sm"
                variant="outline"
                className="flex items-center space-x-1"
              >
                <Download className="h-3 w-3" />
                <span>导出</span>
              </Button>
            </div>
            
            {hasChanges && (
              <div className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded">
                有未保存的更改
              </div>
            )}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 bg-purple-50 p-3 rounded">
        <p><strong>使用提示：</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>选择一个基础主题开始自定义，或从现有主题创建副本</li>
          <li>使用颜色选择器调整各种颜色属性</li>
          <li>点击"预览"按钮实时查看主题效果</li>
          <li>保存前请确保主题名称和描述已填写</li>
          <li>可以导出主题配置文件与他人分享</li>
        </ul>
      </div>

      {/* 通知组件 */}
      {notification.visible && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
          notification.type === 'success' ? 'bg-green-500 text-white' :
          notification.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default ThemeEditor;
