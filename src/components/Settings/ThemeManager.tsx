import React, { useState, useEffect } from 'react';
import { Palette, Trash2, Edit3, Copy, Download, Upload, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/Button';
import { Theme } from '../../types/theme';
import { themeService } from '../../services/theme';

interface ThemeManagerProps {
  onThemeChange?: (theme: Theme) => void;
}

const ThemeManager: React.FC<ThemeManagerProps> = ({ onThemeChange }) => {
  const [customThemes, setCustomThemes] = useState<Theme[]>(themeService.getCustomThemes());
  const [currentTheme, setCurrentTheme] = useState<Theme>(themeService.getCurrentTheme());
  const [previewTheme, setPreviewTheme] = useState<Theme | null>(themeService.getPreviewTheme());
  const [editingTheme, setEditingTheme] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    const handleThemeChange = (theme: Theme) => {
      setCurrentTheme(theme);
      onThemeChange?.(theme);
    };

    themeService.addListener(handleThemeChange);
    return () => themeService.removeListener(handleThemeChange);
  }, [onThemeChange]);

  // 刷新自定义主题列表
  const refreshCustomThemes = () => {
    setCustomThemes(themeService.getCustomThemes());
  };

  // 删除自定义主题
  const deleteTheme = (themeId: string) => {
    if (confirm('确定要删除这个自定义主题吗？此操作无法撤销。')) {
      const success = themeService.removeCustomTheme(themeId);
      if (success) {
        refreshCustomThemes();
        alert('主题删除成功！');
      } else {
        alert('删除主题失败，请重试。');
      }
    }
  };

  // 开始编辑主题
  const startEditTheme = (theme: Theme) => {
    setEditingTheme(theme.id);
    setEditName(theme.name);
    setEditDescription(theme.description);
  };

  // 保存编辑
  const saveEdit = () => {
    if (!editingTheme) return;

    const success = themeService.renameCustomTheme(editingTheme, editName, editDescription);
    if (success) {
      refreshCustomThemes();
      setEditingTheme(null);
      setEditName('');
      setEditDescription('');
    } else {
      alert('保存失败，请重试。');
    }
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingTheme(null);
    setEditName('');
    setEditDescription('');
  };

  // 复制主题
  const duplicateTheme = (themeId: string) => {
    const duplicated = themeService.duplicateTheme(themeId);
    if (duplicated) {
      refreshCustomThemes();
      alert(`主题 "${duplicated.name}" 创建成功！`);
    } else {
      alert('复制主题失败，请重试。');
    }
  };

  // 导出主题
  const exportTheme = (theme: Theme) => {
    const config = JSON.stringify(theme, null, 2);
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${theme.name.replace(/\s+/g, '-').toLowerCase()}-theme.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 导入主题
  const importTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const theme = themeService.importTheme(content);
        if (theme) {
          refreshCustomThemes();
          alert(`主题 "${theme.name}" 导入成功！`);
        } else {
          alert('导入失败，请检查文件格式。');
        }
      } catch (error) {
        console.error('Import error:', error);
        alert('导入失败，请检查文件格式。');
      }
    };
    reader.readAsText(file);

    // 清空文件输入
    event.target.value = '';
  };

  // 预览主题
  const previewThemeToggle = (theme: Theme) => {
    if (previewTheme && previewTheme.id === theme.id) {
      // 退出预览
      themeService.exitPreview();
      setPreviewTheme(null);
    } else {
      // 开始预览
      themeService.previewTheme(theme);
      setPreviewTheme(theme);
    }
  };

  // 应用主题
  const applyTheme = (themeId: string) => {
    themeService.setTheme(themeId);
    setPreviewTheme(null);
  };

  // 格式化主题类型
  const formatThemeType = (type: string) => {
    switch (type) {
      case 'light': return '浅色';
      case 'dark': return '深色';
      case 'auto': return '自动';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Palette className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">主题管理</h3>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="file"
            accept=".json"
            onChange={importTheme}
            className="hidden"
            id="theme-import"
          />
          <label htmlFor="theme-import" className="cursor-pointer">
            <div className="inline-flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <Upload className="h-3 w-3" />
              <span>导入主题</span>
            </div>
          </label>
        </div>
      </div>

      {/* 当前主题信息 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: currentTheme.colors.primary }}
            />
            <div>
              <div className="font-medium text-gray-700">{currentTheme.name}</div>
              <div className="text-sm text-gray-500">
                {currentTheme.description} • {formatThemeType(currentTheme.type)}
              </div>
            </div>
          </div>
          {previewTheme && (
            <div className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded">
              预览模式
            </div>
          )}
        </div>
      </div>

      {/* 自定义主题列表 */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700">
          自定义主题 ({customThemes.length})
        </h4>

        {customThemes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Palette className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>还没有自定义主题</p>
            <p className="text-sm">前往"主题编辑"创建您的第一个自定义主题</p>
          </div>
        ) : (
          <div className="space-y-3">
            {customThemes.map((theme) => (
              <div key={theme.id} className="border rounded-lg bg-gray-50">
                {editingTheme === theme.id ? (
                  // 编辑模式
                  <div className="p-4 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        主题名称
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full p-2 border rounded text-sm"
                        placeholder="输入主题名称"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        主题描述
                      </label>
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full p-2 border rounded text-sm"
                        placeholder="输入主题描述"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        onClick={saveEdit}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        保存
                      </Button>
                      <Button
                        type="button"
                        onClick={cancelEdit}
                        size="sm"
                        variant="outline"
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                ) : (
                  // 显示模式
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div
                          className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: theme.colors.primary }}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-700">{theme.name}</div>
                          <div className="text-sm text-gray-500 mt-1">{theme.description}</div>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-xs text-gray-400">
                              类型: {formatThemeType(theme.type)}
                            </span>
                            {currentTheme.id === theme.id && (
                              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                当前使用
                              </span>
                            )}
                            {previewTheme?.id === theme.id && (
                              <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                预览中
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-3">
                        <Button
                          type="button"
                          onClick={() => previewThemeToggle(theme)}
                          size="sm"
                          variant="outline"
                          className="flex items-center space-x-1"
                          title={previewTheme?.id === theme.id ? '退出预览' : '预览主题'}
                        >
                          {previewTheme?.id === theme.id ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                        
                        {currentTheme.id !== theme.id && (
                          <Button
                            type="button"
                            onClick={() => applyTheme(theme.id)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                          >
                            应用
                          </Button>
                        )}
                        
                        <Button
                          type="button"
                          onClick={() => startEditTheme(theme)}
                          size="sm"
                          variant="outline"
                          className="text-blue-600 hover:text-blue-700"
                          title="编辑主题"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        
                        <Button
                          type="button"
                          onClick={() => duplicateTheme(theme.id)}
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700"
                          title="复制主题"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        
                        <Button
                          type="button"
                          onClick={() => exportTheme(theme)}
                          size="sm"
                          variant="outline"
                          className="text-purple-600 hover:text-purple-700"
                          title="导出主题"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        
                        <Button
                          type="button"
                          onClick={() => deleteTheme(theme.id)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          title="删除主题"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
        <p><strong>主题管理提示：</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>点击"预览"按钮可以临时查看主题效果，不会保存设置</li>
          <li>点击"应用"按钮将主题设为当前使用的主题</li>
          <li>可以编辑自定义主题的名称和描述</li>
          <li>复制主题可以基于现有主题创建新的变体</li>
          <li>导出的主题文件可以与他人分享或备份</li>
          <li>删除主题操作无法撤销，请谨慎操作</li>
        </ul>
      </div>
    </div>
  );
};

export default ThemeManager;
