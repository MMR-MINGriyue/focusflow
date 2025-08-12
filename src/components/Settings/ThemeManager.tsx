import React, { useState, useEffect, useCallback } from 'react';
import { Palette, Trash2, Edit3, Copy, Download, Upload, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import type { Theme } from '../../services/themeService';
import { ThemeValidator, ValidationResult } from '../../utils/themeValidator';
import { ThemeValidationReport } from './ThemeValidationReport';
import { themeService } from '../../services/themeService';

interface ThemeManagerProps {
  onThemeChange?: (theme: Theme) => void;
}

interface NotificationState {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
}

interface ConfirmDialogState {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ThemeManager: React.FC<ThemeManagerProps> = ({ onThemeChange }) => {
  const [customThemes, setCustomThemes] = useState<Theme[]>(themeService.getCustomThemes());
  const [currentTheme, setCurrentTheme] = useState<Theme>(themeService.getCurrentTheme());
  const [previewTheme, setPreviewTheme] = useState<Theme | null>(null);
  const [editingTheme, setEditingTheme] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [notification, setNotification] = useState<NotificationState>({
    message: '',
    type: 'info',
    visible: false
  });

  const [showValidationReport, setShowValidationReport] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [validationTheme, setValidationTheme] = useState<Theme | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  });


  // 显示通知
  const showNotification = useCallback((message: string, type: NotificationState['type'] = 'info') => {
    setNotification({ message, type, visible: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  // 显示确认对话框
  const showConfirmDialog = useCallback((title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({
      visible: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(prev => ({ ...prev, visible: false }));
      },
      onCancel: () => {
        setConfirmDialog(prev => ({ ...prev, visible: false }));
      }
    });
  }, []);

  useEffect(() => {
    const handleThemeChange = (theme: Theme) => {
      setCurrentTheme(theme);
      onThemeChange?.(theme);
    };

    const unsubscribe = themeService.addThemeChangeListener(handleThemeChange);
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [onThemeChange]);

  // 刷新自定义主题列表
  const refreshCustomThemes = () => {
    setCustomThemes(themeService.getCustomThemes());
  };

  // 删除自定义主题
  const deleteTheme = useCallback((themeId: string) => {
    showConfirmDialog(
      '删除主题',
      '确定要删除这个自定义主题吗？此操作无法撤销。',
      () => {
        themeService.deleteCustomTheme(themeId);
        refreshCustomThemes();
        showNotification('主题删除成功！', 'success');
      }
    );
  }, [showConfirmDialog, showNotification]);

  // 开始编辑主题
  const startEditTheme = (theme: Theme) => {
    setEditingTheme(theme.id);
    setEditName(theme.name);
    setEditDescription(theme.description || '');
  };

  // 保存编辑
  const saveEdit = useCallback(() => {
    if (!editingTheme) return;

    try {
      const theme = customThemes.find(t => t.id === editingTheme);
      if (theme) {
        const updatedTheme = { ...theme, name: editName, description: editDescription };
        themeService.deleteCustomTheme(editingTheme);
        themeService.createCustomTheme(updatedTheme);
        refreshCustomThemes();
        setEditingTheme(null);
        setEditName('');
        setEditDescription('');
        showNotification('主题信息更新成功！', 'success');
      }
    } catch (error) {
      showNotification('保存失败，请重试。', 'error');
    }
  }, [editingTheme, editName, editDescription, customThemes, showNotification]);

  // 取消编辑
  const cancelEdit = () => {
    setEditingTheme(null);
    setEditName('');
    setEditDescription('');
  };

  // 复制主题
  const duplicateTheme = useCallback((themeId: string) => {
    const originalTheme = customThemes.find(t => t.id === themeId);
    if (originalTheme) {
      const duplicatedTheme = {
        ...originalTheme,
        name: `${originalTheme.name} (复制)`,
        id: `custom-${Date.now()}`
      };
      themeService.createCustomTheme(duplicatedTheme);
      refreshCustomThemes();
      showNotification(`主题 "${duplicatedTheme.name}" 创建成功！`, 'success');
    } else {
      showNotification('复制主题失败，请重试。', 'error');
    }
  }, [customThemes, showNotification]);

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
        
        // 使用主题验证器进行验证
        const validation = ThemeValidator.validateTheme(content);
        
        if (validation.isValid) {
          const themeId = themeService.importTheme(JSON.stringify(validation.theme));
          if (themeId) {
            refreshCustomThemes();
            const importedTheme = customThemes.find(t => t.id === themeId);
            
            // 显示验证报告
            let message = `主题 "${importedTheme?.name || '未知主题'}" 导入成功！`;
            if (validation.warnings.length > 0) {
              message += `\n注意：${validation.warnings.join('；')}`;
            }
            showNotification(message, 'success');
          } else {
            showNotification('导入失败，请检查文件格式。', 'error');
          }
        } else {
          // 显示详细错误信息
          const errorMessage = validation.errors.length > 0 
            ? `导入失败：${validation.errors.join('；')}`
            : '导入失败，文件格式不正确';
          showNotification(errorMessage, 'error');
        }
      } catch (error) {
        console.error('Import error:', error);
        showNotification('导入失败，请检查文件格式。', 'error');
      }
    };
    reader.readAsText(file);

    // 清空文件输入
    event.target.value = '';
  };

  // 预览主题
  const previewThemeToggle = useCallback((theme: Theme | null) => {
    if (theme) {
      themeService.previewTheme(theme);
      setPreviewTheme(theme);
    } else {
      themeService.exitPreview();
      setPreviewTheme(null);
    }
  }, [themeService]);

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

  // 验证主题
  const validateTheme = (theme: Theme) => {
    const validation = ThemeValidator.validateTheme(JSON.stringify(theme));
    setValidationResult(validation);
    setValidationTheme(theme);
    setShowValidationReport(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Palette className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">主题管理</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            onClick={() => showNotification('主题模板管理功能即将推出', 'info')}
            size="sm"
            className="bg-purple-500 hover:bg-purple-600 text-white"
          >
            <Palette className="h-3 w-3 mr-1" />
            主题模板
          </Button>
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
              style={{ '--bg-color': currentTheme.colors.primary, backgroundColor: 'var(--bg-color)' } as React.CSSProperties}
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
                          onClick={() => validateTheme(theme)}
                          size="sm"
                          variant="outline"
                          className="text-indigo-600 hover:text-indigo-700"
                          title="验证主题"
                        >
                          <ShieldCheck className="h-3 w-3" />
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
          <li>点击"验证主题"可以查看主题质量报告和可访问性分析</li>
          <li>可以编辑自定义主题的名称和描述</li>
          <li>复制主题可以基于现有主题创建新的变体</li>
          <li>导出的主题文件可以与他人分享或备份</li>
          <li>导入主题时会自动验证格式并提供详细的验证报告</li>
          <li>删除主题操作无法撤销，请谨慎操作</li>
        </ul>
      </div>

      {/* 确认对话框 */}
      {confirmDialog.visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">{confirmDialog.title}</h3>
            <p className="text-gray-600 mb-4">{confirmDialog.message}</p>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={confirmDialog.onCancel}
              >
                取消
              </Button>
              <Button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                确认
              </Button>
            </div>
          </div>
        </div>
      )}

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

      {/* 主题验证报告 */}
      {showValidationReport && validationResult && validationTheme && (
        <ThemeValidationReport
          theme={validationTheme}
          validation={validationResult}
          onClose={() => {
            setShowValidationReport(false);
            setValidationResult(null);
            setValidationTheme(null);
          }}
        />
      )}
    </div>
  );
};

export { ThemeManager };
export default ThemeManager;
