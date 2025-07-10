import React, { useState, useEffect, useCallback } from 'react';
import { Monitor, Trash2, Edit3, Copy, Download, Upload, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/Button';
import { TimerStyleConfig, TimerStyleSettings } from '../../types/timerStyle';
import { timerStyleService } from '../../services/timerStyle';

interface TimerStyleManagerProps {
  onStyleChange?: (style: TimerStyleConfig) => void;
}

interface NotificationState {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
}

// interface ConfirmDialogState {
//   visible: boolean;
//   title: string;
//   message: string;
//   onConfirm: () => void;
//   onCancel: () => void;
// }

const TimerStyleManager: React.FC<TimerStyleManagerProps> = ({ onStyleChange }) => {
  const [, setSettings] = useState<TimerStyleSettings>(timerStyleService.getSettings());
  const [currentStyle, setCurrentStyle] = useState<TimerStyleConfig>(timerStyleService.getCurrentStyle());
  const [previewStyle, setPreviewStyle] = useState<TimerStyleConfig | null>(timerStyleService.getPreviewStyle());
  const [editingStyle, setEditingStyle] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  // TODO: 实现通知和确认对话框功能
  // const [notification, setNotification] = useState<NotificationState>({
  //   message: '',
  //   type: 'info',
  //   visible: false
  // });
  // const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
  //   visible: false,
  //   title: '',
  //   message: '',
  //   onConfirm: () => {},
  //   onCancel: () => {}
  // });

  useEffect(() => {
    const handleSettingsChange = (newSettings: TimerStyleSettings) => {
      setSettings(newSettings);
      setCurrentStyle(timerStyleService.getCurrentStyle());
      setPreviewStyle(timerStyleService.getPreviewStyle());
      onStyleChange?.(timerStyleService.getCurrentStyle());
    };

    timerStyleService.addListener(handleSettingsChange);
    return () => timerStyleService.removeListener(handleSettingsChange);
  }, [onStyleChange]);

  // 获取自定义样式
  const customStyles = timerStyleService.getCustomStyles();

  // 显示通知
  const showNotification = useCallback((message: string, type: NotificationState['type'] = 'info') => {
    console.log(`${type}: ${message}`);
  }, []);

  // 删除自定义样式
  const deleteStyle = useCallback((styleId: string) => {
    if (confirm('确定要删除这个自定义样式吗？此操作无法撤销。')) {
      const success = timerStyleService.removeCustomStyle(styleId);
      if (success) {
        showNotification('样式删除成功！', 'success');
      } else {
        showNotification('删除样式失败，请重试。', 'error');
      }
    }
  }, [showNotification]);

  // 开始编辑样式
  const startEditStyle = (style: TimerStyleConfig) => {
    setEditingStyle(style.id);
    setEditName(style.name);
    setEditDescription(style.description);
  };

  // 保存编辑
  const saveEdit = () => {
    if (!editingStyle) return;

    // 更新样式信息
    const style = customStyles.find(s => s.id === editingStyle);
    if (style) {
      const updatedStyle = {
        ...style,
        name: editName,
        description: editDescription,
        updatedAt: new Date().toISOString()
      };
      
      const success = timerStyleService.addCustomStyle(updatedStyle);
      if (success) {
        setEditingStyle(null);
        setEditName('');
        setEditDescription('');
      } else {
        alert('保存失败，请重试。');
      }
    }
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingStyle(null);
    setEditName('');
    setEditDescription('');
  };

  // 复制样式
  const duplicateStyle = (styleId: string) => {
    const duplicated = timerStyleService.duplicateStyle(styleId);
    if (duplicated) {
      alert(`样式 "${duplicated.name}" 创建成功！`);
    } else {
      alert('复制样式失败，请重试。');
    }
  };

  // 导出样式
  const exportStyle = (style: TimerStyleConfig) => {
    const config = timerStyleService.exportStyle(style.id);
    if (config) {
      const blob = new Blob([config], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${style.name.replace(/\s+/g, '-').toLowerCase()}-timer-style.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // 导入样式
  const importStyle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const style = timerStyleService.importStyle(content);
        if (style) {
          alert(`样式 "${style.name}" 导入成功！`);
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

  // 预览样式
  const previewStyleToggle = (style: TimerStyleConfig) => {
    if (previewStyle && previewStyle.id === style.id) {
      // 退出预览
      timerStyleService.exitPreview();
    } else {
      // 开始预览
      timerStyleService.previewStyle(style.id);
    }
  };

  // 应用样式
  const applyStyle = (styleId: string) => {
    timerStyleService.setCurrentStyle(styleId);
  };

  // 格式化样式类型
  const formatDisplayStyle = (displayStyle: string) => {
    const styleMap = {
      'digital': '数字',
      'analog': '模拟',
      'progress': '进度环',
      'minimal': '极简',
      'card': '卡片',
      'neon': '霓虹'
    };
    return styleMap[displayStyle as keyof typeof styleMap] || displayStyle;
  };

  return (
    <div className="space-y-6 p-4 bg-background text-foreground">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Monitor className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">计时器样式管理</h3>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="file"
            accept=".json"
            onChange={importStyle}
            className="hidden"
            id="style-import"
          />
          <label htmlFor="style-import" className="cursor-pointer">
            <div className="inline-flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-foreground bg-card border border-border rounded-md hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors">
              <Upload className="h-3 w-3" />
              <span>导入样式</span>
            </div>
          </label>
        </div>
      </div>

      {/* 当前样式信息 */}
      <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className="w-8 h-8 rounded-full border-2 border-background shadow-sm"
              style={{ backgroundColor: currentStyle.colors.primary }}
            />
            <div>
              <div className="font-medium text-card-foreground">{currentStyle.name}</div>
              <div className="text-sm text-muted-foreground">
                {currentStyle.description} • {formatDisplayStyle(currentStyle.displayStyle)}
              </div>
            </div>
          </div>
          {previewStyle && (
            <div className="text-sm text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400 px-3 py-1 rounded">
              预览模式
            </div>
          )}
        </div>
      </div>

      {/* 自定义样式列表 */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-foreground">
          自定义样式 ({customStyles.length})
        </h4>

        {customStyles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Monitor className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>还没有自定义样式</p>
            <p className="text-sm">前往"样式编辑"创建您的第一个自定义样式</p>
          </div>
        ) : (
          <div className="space-y-3">
            {customStyles.map((style) => (
              <div key={style.id} className="border border-border rounded-lg bg-card shadow-sm">
                {editingStyle === style.id ? (
                  // 编辑模式
                  <div className="p-4 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        样式名称
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full p-2 border border-input rounded text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                        placeholder="输入样式名称"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        样式描述
                      </label>
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full p-2 border border-input rounded text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                        placeholder="输入样式描述"
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
                          className="w-8 h-8 rounded-full border-2 border-background shadow-sm"
                          style={{ backgroundColor: style.colors.primary }}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-card-foreground">{style.name}</div>
                          <div className="text-sm text-muted-foreground mt-1">{style.description}</div>
                          <div className="flex items-center space-x-4 mt-2 flex-wrap gap-2">
                            <span className="text-xs text-muted-foreground">
                              类型: {formatDisplayStyle(style.displayStyle)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              尺寸: {style.size}
                            </span>
                            {currentStyle.id === style.id && (
                              <span className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-1 rounded">
                                当前使用
                              </span>
                            )}
                            {previewStyle?.id === style.id && (
                              <span className="text-xs text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400 px-2 py-1 rounded">
                                预览中
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 ml-3 flex-wrap gap-1">
                        <Button
                          type="button"
                          onClick={() => previewStyleToggle(style)}
                          size="sm"
                          variant="outline"
                          className="flex items-center space-x-1 border-border hover:bg-accent hover:text-accent-foreground"
                          title={previewStyle?.id === style.id ? '退出预览' : '预览样式'}
                        >
                          {previewStyle?.id === style.id ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>

                        {currentStyle.id !== style.id && (
                          <Button
                            type="button"
                            onClick={() => applyStyle(style.id)}
                            size="sm"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
                          >
                            应用
                          </Button>
                        )}

                        <Button
                          type="button"
                          onClick={() => startEditStyle(style)}
                          size="sm"
                          variant="outline"
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 border-border hover:bg-accent"
                          title="编辑样式"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>

                        <Button
                          type="button"
                          onClick={() => duplicateStyle(style.id)}
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 border-border hover:bg-accent"
                          title="复制样式"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>

                        <Button
                          type="button"
                          onClick={() => exportStyle(style)}
                          size="sm"
                          variant="outline"
                          className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 border-border hover:bg-accent"
                          title="导出样式"
                        >
                          <Download className="h-3 w-3" />
                        </Button>

                        <Button
                          type="button"
                          onClick={() => deleteStyle(style.id)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border-border hover:bg-accent"
                          title="删除样式"
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

      <div className="text-xs text-muted-foreground bg-muted p-3 rounded border border-border">
        <p className="font-medium text-foreground"><strong>样式管理提示：</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>点击"预览"按钮可以临时查看样式效果，不会保存设置</li>
          <li>点击"应用"按钮将样式设为当前使用的样式</li>
          <li>可以编辑自定义样式的名称和描述</li>
          <li>复制样式可以基于现有样式创建新的变体</li>
          <li>导出的样式文件可以与他人分享或备份</li>
          <li>删除样式操作无法撤销，请谨慎操作</li>
        </ul>
      </div>
    </div>
  );
};

export default TimerStyleManager;
