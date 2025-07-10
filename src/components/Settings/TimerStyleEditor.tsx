import React, { useState, useEffect } from 'react';
import { Palette, Eye, Save, RotateCcw, Copy, Download } from 'lucide-react';
import { Button } from '../ui/Button';
import { TimerStyleConfig, DEFAULT_TIMER_STYLES } from '../../types/timerStyle';
import { timerStyleService } from '../../services/timerStyle';
import { hslToHex } from '../../utils/colorUtils';

interface TimerStyleEditorProps {
  onStyleChange?: (style: TimerStyleConfig) => void;
}

const TimerStyleEditor: React.FC<TimerStyleEditorProps> = ({ onStyleChange }) => {
  const [editingStyle, setEditingStyle] = useState<TimerStyleConfig | null>(null);
  const [originalStyle, setOriginalStyle] = useState<TimerStyleConfig | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [styleName, setStyleName] = useState('');
  const [styleDescription, setStyleDescription] = useState('');

  useEffect(() => {
    // 检查是否有变化
    if (editingStyle && originalStyle) {
      const hasChanges = JSON.stringify(editingStyle) !== JSON.stringify(originalStyle);
      setHasChanges(hasChanges);
    }
  }, [editingStyle, originalStyle]);

  // 开始编辑样式
  const startEditing = (style: TimerStyleConfig) => {
    const editableStyle = {
      ...style,
      id: `custom_${Date.now()}`,
      name: `${style.name} (副本)`,
      description: `基于 ${style.name} 的自定义样式`,
      isPreset: false
    };
    
    setEditingStyle(editableStyle);
    setOriginalStyle(style);
    setStyleName(editableStyle.name);
    setStyleDescription(editableStyle.description);
    setPreviewMode(false);
    setHasChanges(false);
  };

  // 更新样式属性
  const updateStyle = (updates: Partial<TimerStyleConfig>) => {
    if (!editingStyle) return;

    const updatedStyle = {
      ...editingStyle,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    setEditingStyle(updatedStyle);

    // 如果在预览模式，立即应用
    if (previewMode) {
      // 临时添加到服务中进行预览
      timerStyleService.addCustomStyle(updatedStyle);
      timerStyleService.previewStyle(updatedStyle.id);
    }
  };

  // 更新颜色
  const updateColor = (colorKey: keyof TimerStyleConfig['colors'], value: string) => {
    if (!editingStyle) return;

    updateStyle({
      colors: {
        ...editingStyle.colors,
        [colorKey]: value
      }
    });
  };

  // 切换预览模式
  const togglePreview = () => {
    if (!editingStyle) return;

    if (previewMode) {
      // 退出预览
      timerStyleService.exitPreview();
      setPreviewMode(false);
    } else {
      // 进入预览模式
      timerStyleService.addCustomStyle(editingStyle);
      timerStyleService.previewStyle(editingStyle.id);
      setPreviewMode(true);
    }
  };

  // 保存样式
  const saveStyle = () => {
    if (!editingStyle) return;

    const finalStyle = {
      ...editingStyle,
      name: styleName,
      description: styleDescription
    };

    const success = timerStyleService.addCustomStyle(finalStyle);
    if (success) {
      timerStyleService.setCurrentStyle(finalStyle.id);
      setOriginalStyle(finalStyle);
      setHasChanges(false);
      onStyleChange?.(finalStyle);
      
      alert('样式保存成功！');
    } else {
      alert('保存样式失败，请重试。');
    }
  };

  // 重置更改
  const resetChanges = () => {
    if (!originalStyle) return;

    setEditingStyle({ ...originalStyle });
    setStyleName(originalStyle.name);
    setStyleDescription(originalStyle.description);
    setHasChanges(false);

    if (previewMode) {
      timerStyleService.addCustomStyle(originalStyle);
      timerStyleService.previewStyle(originalStyle.id);
    }
  };

  // 复制样式配置
  const copyStyleConfig = () => {
    if (!editingStyle) return;

    const config = JSON.stringify(editingStyle, null, 2);
    navigator.clipboard.writeText(config).then(() => {
      alert('样式配置已复制到剪贴板！');
    }).catch(() => {
      alert('复制失败，请手动复制。');
    });
  };

  // 导出样式
  const exportStyle = () => {
    if (!editingStyle) return;

    const config = timerStyleService.exportStyle(editingStyle.id);
    if (config) {
      const blob = new Blob([config], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${editingStyle.name.replace(/\s+/g, '-').toLowerCase()}-timer-style.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // 获取可用的基础样式
  const availableStyles = DEFAULT_TIMER_STYLES;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Palette className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-semibold">计时器样式编辑器</h3>
        </div>
        <div className="flex items-center space-x-2">
          {editingStyle && (
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
                    onClick={saveStyle}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white flex items-center space-x-1"
                  >
                    <Save className="h-3 w-3" />
                    <span>保存样式</span>
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {!editingStyle ? (
        // 选择基础样式
        <div className="space-y-4">
          <div className="text-center py-8">
            <Palette className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-700 mb-2">创建自定义计时器样式</h4>
            <p className="text-gray-500 mb-6">选择一个基础样式开始自定义</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableStyles.map((style) => (
              <div
                key={style.id}
                className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => startEditing(style)}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div
                    className="w-6 h-6 rounded-full border"
                    style={{ backgroundColor: style.colors.primary }}
                  />
                  <div>
                    <div className="font-medium text-sm">{style.name}</div>
                    <div className="text-xs text-gray-500">{style.displayStyle} • {style.category}</div>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: style.colors.primary }}
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: style.colors.accent }}
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: style.colors.progress }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // 样式编辑界面
        <div className="space-y-6">
          {/* 样式信息编辑 */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium text-gray-700 mb-3">样式信息</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  样式名称
                </label>
                <input
                  type="text"
                  value={styleName}
                  onChange={(e) => setStyleName(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                  placeholder="输入样式名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  样式描述
                </label>
                <input
                  type="text"
                  value={styleDescription}
                  onChange={(e) => setStyleDescription(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                  placeholder="输入样式描述"
                />
              </div>
            </div>
          </div>

          {/* 基础配置 */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-3">基础配置</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  显示样式
                </label>
                <select
                  value={editingStyle.displayStyle}
                  onChange={(e) => updateStyle({ displayStyle: e.target.value as any })}
                  className="w-full p-2 border rounded text-sm"
                >
                  <option value="digital">数字显示</option>
                  <option value="analog">模拟时钟</option>
                  <option value="progress">进度环</option>
                  <option value="minimal">极简模式</option>
                  <option value="card">卡片模式</option>
                  <option value="neon">霓虹灯效果</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  尺寸
                </label>
                <select
                  value={editingStyle.size}
                  onChange={(e) => updateStyle({ size: e.target.value as any })}
                  className="w-full p-2 border rounded text-sm"
                >
                  <option value="small">小</option>
                  <option value="medium">中</option>
                  <option value="large">大</option>
                  <option value="extra-large">特大</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  数字样式
                </label>
                <select
                  value={editingStyle.numberStyle}
                  onChange={(e) => updateStyle({ numberStyle: e.target.value as any })}
                  className="w-full p-2 border rounded text-sm"
                >
                  <option value="standard">标准</option>
                  <option value="mono">等宽</option>
                  <option value="digital">数码管</option>
                  <option value="handwritten">手写</option>
                  <option value="bold">粗体</option>
                  <option value="thin">细体</option>
                </select>
              </div>
            </div>
          </div>

          {/* 颜色配置 */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-3">颜色配置</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(editingStyle.colors).map(([colorKey, colorValue]) => (
                <div key={colorKey} className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={colorValue.startsWith('#') ? colorValue : hslToHex(colorValue)}
                    onChange={(e) => updateColor(colorKey as any, e.target.value)}
                    className="w-8 h-8 rounded border cursor-pointer"
                    title={`选择 ${colorKey} 颜色`}
                    aria-label={`选择 ${colorKey} 颜色`}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-700">
                      {colorKey.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      {colorValue}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 布局配置 */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-3">布局配置</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editingStyle.layout.showStatusIndicator}
                    onChange={(e) => updateStyle({
                      layout: { ...editingStyle.layout, showStatusIndicator: e.target.checked }
                    })}
                    className="rounded"
                  />
                  <span className="text-sm">显示状态指示器</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editingStyle.layout.showProgressPercentage}
                    onChange={(e) => updateStyle({
                      layout: { ...editingStyle.layout, showProgressPercentage: e.target.checked }
                    })}
                    className="rounded"
                  />
                  <span className="text-sm">显示进度百分比</span>
                </label>
              </div>
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editingStyle.layout.showStateText}
                    onChange={(e) => updateStyle({
                      layout: { ...editingStyle.layout, showStateText: e.target.checked }
                    })}
                    className="rounded"
                  />
                  <span className="text-sm">显示状态文本</span>
                </label>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    对齐方式
                  </label>
                  <select
                    value={editingStyle.layout.alignment}
                    onChange={(e) => updateStyle({
                      layout: { ...editingStyle.layout, alignment: e.target.value as any }
                    })}
                    className="w-full p-2 border rounded text-sm"
                  >
                    <option value="left">左对齐</option>
                    <option value="center">居中</option>
                    <option value="right">右对齐</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 动画配置 */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-3">动画配置</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editingStyle.animations.enabled}
                    onChange={(e) => updateStyle({
                      animations: { ...editingStyle.animations, enabled: e.target.checked }
                    })}
                    className="rounded"
                  />
                  <span className="text-sm">启用动画</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editingStyle.animations.pulseOnStateChange}
                    onChange={(e) => updateStyle({
                      animations: { ...editingStyle.animations, pulseOnStateChange: e.target.checked }
                    })}
                    className="rounded"
                  />
                  <span className="text-sm">状态变化时脉冲</span>
                </label>
              </div>
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editingStyle.animations.breathingEffect}
                    onChange={(e) => updateStyle({
                      animations: { ...editingStyle.animations, breathingEffect: e.target.checked }
                    })}
                    className="rounded"
                  />
                  <span className="text-sm">呼吸效果</span>
                </label>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    动画时长 (ms)
                  </label>
                  <input
                    type="number"
                    value={editingStyle.animations.transitionDuration}
                    onChange={(e) => updateStyle({
                      animations: { ...editingStyle.animations, transitionDuration: parseInt(e.target.value) }
                    })}
                    className="w-full p-2 border rounded text-sm"
                    min="100"
                    max="2000"
                    step="100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                onClick={copyStyleConfig}
                size="sm"
                variant="outline"
                className="flex items-center space-x-1"
              >
                <Copy className="h-3 w-3" />
                <span>复制配置</span>
              </Button>
              <Button
                type="button"
                onClick={exportStyle}
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
          <li>选择一个基础样式开始自定义，或从现有样式创建副本</li>
          <li>调整颜色、尺寸、动画等属性来创建独特的计时器样式</li>
          <li>点击"预览"按钮实时查看样式效果</li>
          <li>保存前请确保样式名称和描述已填写</li>
          <li>可以导出样式配置文件与他人分享</li>
        </ul>
      </div>
    </div>
  );
};

export default TimerStyleEditor;
