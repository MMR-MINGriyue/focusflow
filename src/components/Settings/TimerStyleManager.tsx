import React, { useEffect, useCallback, useMemo, useReducer } from 'react';
import { Monitor, Trash2, Edit3, Copy, Download, Upload, Eye, EyeOff, Info } from 'lucide-react';
import { Button } from '../ui/Button';
import MacNotification from '../ui/MacNotification';
import { TimerStyleConfig, TimerStyleSettings, getStyleById } from '../../types/timerStyle';
import { timerStyleService } from '../../services/timerStyle';

interface TimerStyleManagerProps {
  onStyleChange?: (style: TimerStyleConfig) => void;
}

interface NotificationState {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
}

interface ConfirmDialogState {
  visible: boolean;
  message: string;
  action: () => void;
}

interface EditingState {
  styleId: string | null;
  name: string;
  description: string;
}

// 组件状态管理
interface ComponentState {
  settings: TimerStyleSettings;
  currentStyle: TimerStyleConfig;
  previewStyle: TimerStyleConfig | null;
  editing: EditingState;
  notification: NotificationState;
  confirmDialog: ConfirmDialogState;
}

type ComponentAction =
  | { type: 'SET_SETTINGS'; payload: TimerStyleSettings }
  | { type: 'SET_CURRENT_STYLE'; payload: TimerStyleConfig }
  | { type: 'SET_PREVIEW_STYLE'; payload: TimerStyleConfig | null }
  | { type: 'START_EDITING'; payload: { styleId: string; name: string; description: string } }
  | { type: 'UPDATE_EDITING'; payload: Partial<EditingState> }
  | { type: 'STOP_EDITING' }
  | { type: 'SHOW_NOTIFICATION'; payload: { message: string; type: 'success' | 'error' | 'info' } }
  | { type: 'HIDE_NOTIFICATION' }
  | { type: 'SHOW_CONFIRM_DIALOG'; payload: { message: string; action: () => void } }
  | { type: 'HIDE_CONFIRM_DIALOG' };

// 状态管理 reducer
const componentReducer = (state: ComponentState, action: ComponentAction): ComponentState => {
  switch (action.type) {
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    case 'SET_CURRENT_STYLE':
      return { ...state, currentStyle: action.payload };
    case 'SET_PREVIEW_STYLE':
      return { ...state, previewStyle: action.payload };
    case 'START_EDITING':
      return {
        ...state,
        editing: {
          styleId: action.payload.styleId,
          name: action.payload.name,
          description: action.payload.description
        }
      };
    case 'UPDATE_EDITING':
      return {
        ...state,
        editing: { ...state.editing, ...action.payload }
      };
    case 'STOP_EDITING':
      return {
        ...state,
        editing: { styleId: null, name: '', description: '' }
      };
    case 'SHOW_NOTIFICATION':
      return {
        ...state,
        notification: {
          message: action.payload.message,
          type: action.payload.type,
          visible: true
        }
      };
    case 'HIDE_NOTIFICATION':
      return {
        ...state,
        notification: { ...state.notification, visible: false }
      };
    case 'SHOW_CONFIRM_DIALOG':
      return {
        ...state,
        confirmDialog: {
          visible: true,
          message: action.payload.message,
          action: action.payload.action
        }
      };
    case 'HIDE_CONFIRM_DIALOG':
      return {
        ...state,
        confirmDialog: { visible: false, message: '', action: () => {} }
      };
    default:
      return state;
  }
};

const TimerStyleManager: React.FC<TimerStyleManagerProps> = ({ onStyleChange }) => {
  // 初始化状态
  const initialState: ComponentState = useMemo(() => {
    try {
      return {
        settings: timerStyleService.getSettings(),
        currentStyle: timerStyleService.getCurrentStyle(),
        previewStyle: timerStyleService.getPreviewStyle(),
        editing: { styleId: null, name: '', description: '' },
        notification: { message: '', type: 'info', visible: false },
        confirmDialog: { visible: false, message: '', action: () => {} }
      };
    } catch (error) {
      console.error('Failed to initialize TimerStyleManager:', error);
      // 返回默认状态
      return {
        settings: {
          currentStyleId: 'digital-modern',
          customStyles: [],
          previewMode: false,
          autoSwitchByState: false
        },
        currentStyle: {
          id: 'digital-modern',
          name: 'Modern Digital',
          description: 'Modern digital timer style',
          displayStyle: 'digital',
          size: 'large',
          numberStyle: 'digital',
          progressStyle: 'linear',
          colors: {
            primary: '#3B82F6',
            secondary: '#10B981',
            background: '#FFFFFF',
            text: '#1F2937',
            accent: '#3B82F6',
            progress: '#3B82F6',
            progressBackground: '#E5E7EB'
          },
          layout: {
            alignment: 'center',
            spacing: 'normal',
            showStatusIndicator: true,
            showProgressPercentage: true,
            showStateText: true
          },
          animations: {
            enabled: true,
            transitionDuration: 300,
            easing: 'ease-in-out',
            pulseOnStateChange: true,
            breathingEffect: true,
            rotationEffect: false
          },
          background: {
            pattern: 'none',
            opacity: 1,
            color: '#FFFFFF',
            size: 'medium',
            animation: false
          },
          particles: {
            effect: 'none',
            count: 0,
            size: 0,
            speed: 0,
            color: '#000000',
            opacity: 1
          },
          decoration: {
            element: 'none',
            intensity: 0,
            color: '#000000',
            animated: false
          },
          responsive: {
            enabled: true,
            breakpoints: {
              mobile: {},
              tablet: {},
              desktop: {}
            }
          },
          isPreset: true,
          category: 'modern',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        previewStyle: null,
        editing: { styleId: null, name: '', description: '' },
        notification: { message: '', type: 'info', visible: false },
        confirmDialog: { visible: false, message: '', action: () => {} }
      };
    }
  }, []);

  const [state, dispatch] = useReducer(componentReducer, initialState);

  // 缓存计算结果以提升性能
  const customStyles = useMemo(() => timerStyleService.getCustomStyles(), [state.settings]);

  // 缓存当前样式和预览样式的引用
  const { currentStyle, previewStyle, editing, notification } = state;

  // 防抖的通知系统
  const notificationTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const showNotification = useCallback((message: string, type: NotificationState['type'] = 'info') => {
    // 清除之前的定时器
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }

    dispatch({ type: 'SHOW_NOTIFICATION', payload: { message, type } });

    // 设置新的自动隐藏定时器
    notificationTimeoutRef.current = setTimeout(() => {
      dispatch({ type: 'HIDE_NOTIFICATION' });
      notificationTimeoutRef.current = null;
    }, 3000);
  }, []);

  // 优化的确认对话框
  const showConfirmDialog = useCallback((message: string, onConfirm: () => void) => {
    dispatch({ type: 'SHOW_CONFIRM_DIALOG', payload: { message, action: onConfirm } });
  }, []);

  // 优化的确认对话框处理
  const handleConfirm = useCallback(() => {
    state.confirmDialog.action();
    dispatch({ type: 'HIDE_CONFIRM_DIALOG' });
  }, [state.confirmDialog.action]);

  const handleCancel = useCallback(() => {
    dispatch({ type: 'HIDE_CONFIRM_DIALOG' });
  }, []);

  // 优化的事件监听器
  const handleSettingsChange = useCallback((newSettings: TimerStyleSettings) => {
    dispatch({ type: 'SET_SETTINGS', payload: newSettings });
    dispatch({ type: 'SET_CURRENT_STYLE', payload: timerStyleService.getCurrentStyle() });
    dispatch({ type: 'SET_PREVIEW_STYLE', payload: timerStyleService.getPreviewStyle() });
    onStyleChange?.(timerStyleService.getCurrentStyle());
  }, [onStyleChange]);

  useEffect(() => {
    timerStyleService.addListener(handleSettingsChange);

    return () => {
      timerStyleService.removeListener(handleSettingsChange);
      // 清理通知定时器
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
        notificationTimeoutRef.current = null;
      }
    };
  }, [handleSettingsChange]);

  // 开始编辑样式
  const startEditStyle = useCallback((style: TimerStyleConfig) => {
    dispatch({
      type: 'START_EDITING',
      payload: { styleId: style.id, name: style.name, description: style.description }
    });
  }, []);

  // 保存编辑
  const saveEdit = useCallback(() => {
    if (!state.editing.styleId) return;

    // 更新样式信息
    const style = customStyles.find(s => s.id === state.editing.styleId);
    if (style) {
      const updatedStyle = {
        ...style,
        name: state.editing.name,
        description: state.editing.description,
        updatedAt: new Date().toISOString()
      };

      const success = timerStyleService.addCustomStyle(updatedStyle);
      if (success) {
        dispatch({ type: 'STOP_EDITING' });
        showNotification('样式保存成功！', 'success');
      } else {
        showNotification('保存失败，请重试。', 'error');
      }
    }
  }, [state.editing, customStyles, showNotification]);

  // 取消编辑
  const cancelEdit = useCallback(() => {
    dispatch({ type: 'STOP_EDITING' });
  }, []);

  // 预览样式
  const handlePreviewStyle = useCallback((styleId: string) => {
    timerStyleService.previewStyle(styleId);
    showNotification('预览模式已启用', 'info');
  }, [showNotification]);

  // 退出预览
  const exitPreview = useCallback(() => {
    timerStyleService.exitPreview();
    showNotification('已退出预览模式', 'info');
  }, [showNotification]);

  // 优化的应用样式函数
  const applyStyle = useCallback((styleId: string) => {
    // 使用 requestAnimationFrame 来优化 DOM 更新
    requestAnimationFrame(() => {
      timerStyleService.setCurrentStyle(styleId);
      const style = getStyleById(styleId, customStyles);
      if (style) {
        showNotification(`已应用样式 "${style.name}"`, 'success');
      }
    });
  }, [customStyles, showNotification]);

  // 复制样式
  const duplicateStyle = useCallback((styleId: string) => {
    const duplicatedStyle = timerStyleService.duplicateStyle(styleId);
    if (duplicatedStyle) {
      showNotification(`样式 "${duplicatedStyle.name}" 复制成功！`, 'success');
    } else {
      showNotification('复制失败，请重试。', 'error');
    }
  }, [showNotification]);

  // 删除样式
  const deleteStyle = useCallback((styleId: string) => {
    const style = customStyles.find(s => s.id === styleId);
    if (style) {
      showConfirmDialog(
        `确定要删除样式 "${style.name}" 吗？此操作无法撤销。`,
        () => {
          const success = timerStyleService.removeCustomStyle(styleId);
          if (success) {
            showNotification('样式删除成功！', 'success');
          } else {
            showNotification('删除失败，请重试。', 'error');
          }
        }
      );
    }
  }, [customStyles, showConfirmDialog, showNotification]);

  // 导出样式
  const exportStyle = useCallback((styleId: string) => {
    try {
      const styleData = timerStyleService.exportStyle(styleId);
      if (!styleData) {
        showNotification('导出失败，样式不存在。', 'error');
        return;
      }
      const blob = new Blob([styleData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timer-style-${styleId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification('样式导出成功！', 'success');
    } catch (error) {
      showNotification('导出失败，请重试。', 'error');
    }
  }, [showNotification]);

  // 导入样式
  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const styleData = e.target?.result as string;
        const importedStyle = timerStyleService.importStyle(styleData);
        if (importedStyle) {
          showNotification(`样式 "${importedStyle.name}" 导入成功！`, 'success');
        } else {
          showNotification('导入失败，文件格式不正确。', 'error');
        }
      } catch (error) {
        showNotification('导入失败，请检查文件格式。', 'error');
      }
    };
    reader.readAsText(file);

    // 重置文件输入
    event.target.value = '';
  }, [showNotification]);

  return (
    <div className="space-y-8 p-6 animate-mac-slide-in">
      {/* 标题和导入按钮 */}
      <div className="mac-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-mac">
              <Monitor className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold font-system text-gray-900">
                计时器样式管理
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                自定义您的计时器外观和动画效果
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <input
              accept=".json"
              className="hidden"
              id="style-import"
              type="file"
              onChange={handleImport}
            />
            <label className="cursor-pointer" htmlFor="style-import">
              <div className="mac-button-secondary flex items-center space-x-2 px-4 py-2">
                <Upload className="h-4 w-4" />
                <span>导入样式</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* 当前样式显示 */}
      <div className="mac-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div
                className="w-12 h-12 rounded-mac border-2 border-white shadow-mac"
                style={{ backgroundColor: currentStyle.colors.primary }}
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <div className="font-semibold font-system text-gray-900 text-lg">
                {currentStyle.name}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {currentStyle.description} • {currentStyle.displayStyle}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 自定义样式列表 */}
      <div className="mac-card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-xl font-semibold font-system text-gray-900">
            自定义样式
          </h4>
          <div className="mac-badge-primary">
            {customStyles.length} 个样式
          </div>
        </div>

        <div className="space-y-4">
          {customStyles.map((style) => (
            <div key={style.id} className="mac-card hover:shadow-mac-lg transition-all duration-300 ease-mac">
              {editing.styleId === style.id ? (
                // Mac风格编辑模式
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium font-system text-gray-700 mb-2">
                      样式名称
                    </label>
                    <input
                      type="text"
                      value={editing.name}
                      onChange={(e) => dispatch({ type: 'UPDATE_EDITING', payload: { name: e.target.value } })}
                      className="mac-input w-full"
                      placeholder="输入样式名称"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium font-system text-gray-700 mb-2">
                      样式描述
                    </label>
                    <input
                      type="text"
                      value={editing.description}
                      onChange={(e) => dispatch({ type: 'UPDATE_EDITING', payload: { description: e.target.value } })}
                      className="mac-input w-full"
                      placeholder="输入样式描述"
                    />
                  </div>
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                    <Button
                      variant="secondary"
                      onClick={cancelEdit}
                      className="px-4 py-2"
                    >
                      取消
                    </Button>
                    <Button
                      onClick={saveEdit}
                      className="px-4 py-2"
                    >
                      保存
                    </Button>
                  </div>
                </div>
              ) : (
                // Mac风格显示模式
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="relative">
                        <div
                          className="w-10 h-10 rounded-mac border-2 border-white shadow-mac"
                          style={{ backgroundColor: style.colors.primary }}
                        />
                        {previewStyle?.id === style.id && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border border-white"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <div className="font-semibold font-system text-gray-900">{style.name}</div>
                          {previewStyle?.id === style.id && (
                            <span className="mac-badge-warning text-xs">预览中</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{style.description}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {style.displayStyle} • {style.size} • {style.numberStyle}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => applyStyle(style.id)}
                        className="mac-button-primary text-xs px-3 py-1"
                      >
                        应用
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={previewStyle?.id === style.id ? exitPreview : () => handlePreviewStyle(style.id)}
                        title={previewStyle?.id === style.id ? "退出预览" : "预览样式"}
                        className="p-2"
                      >
                        {previewStyle?.id === style.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditStyle(style)}
                        title="编辑样式"
                        className="p-2"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => duplicateStyle(style.id)}
                        title="复制样式"
                        className="p-2"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => exportStyle(style.id)}
                        title="导出样式"
                        className="p-2"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteStyle(style.id)}
                        title="删除样式"
                        className="p-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 使用帮助 */}
      <div className="mac-card p-6">
        <div className="flex items-start space-x-4">
          <div className="p-2 bg-blue-100 rounded-mac">
            <Info className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold font-system text-gray-900 mb-3">
              使用说明
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                <span>点击"应用"按钮立即切换到该样式</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                <span>使用"预览"功能可以临时查看样式效果</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0"></span>
                <span>复制样式可以基于现有样式创建新的变体</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                <span>导出的样式文件可以与他人分享或备份</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0"></span>
                <span>删除样式操作无法撤销，请谨慎操作</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Mac风格通知组件 */}
      <MacNotification
        message={notification.message}
        type={notification.type}
        visible={notification.visible}
        onClose={() => dispatch({ type: 'HIDE_NOTIFICATION' })}
      />

      {/* Mac风格确认对话框 */}
      {state.confirmDialog.visible && (
        <div className="mac-modal-overlay">
          <div className="mac-modal animate-mac-bounce">
            <div className="mac-modal-header">
              <h3 className="mac-modal-title">确认操作</h3>
            </div>
            <div className="mac-modal-content">
              <p className="text-gray-600">{state.confirmDialog.message}</p>
            </div>
            <div className="mac-modal-footer">
              <Button
                variant="secondary"
                onClick={handleCancel}
                className="px-4 py-2"
              >
                取消
              </Button>
              <Button
                onClick={handleConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white"
              >
                确认
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimerStyleManager;
