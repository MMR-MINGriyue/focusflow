import React, { useState, useEffect } from 'react';

interface TimerStyleConfig {
  id: string;
  name: string;
  description: string;
  displayStyle: string;
  size: string;
  numberStyle: string;
  progressStyle: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
    progress: string;
    progressBackground: string;
  };
  layout: {
    alignment: string;
    spacing: string;
    showStatusIndicator: boolean;
    showProgressPercentage: boolean;
    showStateText: boolean;
  };
  animations: {
    enabled: boolean;
    transitionDuration: number;
    easing: string;
    pulseOnStateChange: boolean;
    breathingEffect: boolean;
    rotationEffect: boolean;
  };
  background: {
    pattern: string;
    opacity: number;
    color: string;
    size: string;
    animation: boolean;
  };
  particles: {
    effect: string;
    count: number;
    size: number;
    speed: number;
    color: string;
    opacity: number;
  };
  decoration: {
    element: string;
    intensity: number;
    color: string;
    animated: boolean;
  };
  responsive: {
    enabled: boolean;
    breakpoints: {
      mobile: any;
      tablet: any;
      desktop: any;
    };
  };
  isPreset: boolean;
  category: string;
  createdAt: string;
  updatedAt: string;
}

interface StyleEditorProps {
  isOpen: boolean;
  style: TimerStyleConfig | null;
  onSave: (style: TimerStyleConfig) => void;
  onCancel: () => void;
}

const StyleEditor: React.FC<StyleEditorProps> = ({ isOpen, style, onSave, onCancel }) => {
  const [editedStyle, setEditedStyle] = useState<TimerStyleConfig | null>(null);

  useEffect(() => {
    if (isOpen && style) {
      setEditedStyle({ ...style });
    } else {
      setEditedStyle(null);
    }
  }, [isOpen, style]);

  const handleChange = (field: string, value: any) => {
    if (!editedStyle) return;

    const keys = field.split('.');
    if (keys.length === 1) {
      setEditedStyle({ ...editedStyle, [keys[0]]: value });
    } else if (keys.length === 2) {
      setEditedStyle({
        ...editedStyle,
        [keys[0]]: {
          ...editedStyle[keys[0] as keyof TimerStyleConfig],
          [keys[1]]: value
        }
      });
    }
  };

  const handleSave = () => {
    if (editedStyle) {
      onSave({
        ...editedStyle,
        updatedAt: new Date().toISOString()
      });
    }
  };

  if (!isOpen || !editedStyle) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">编辑样式</h3>

        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="border-b pb-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">基本信息</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                <input
                  type="text"
                  value={editedStyle.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <input
                  type="text"
                  value={editedStyle.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">显示风格</label>
                <select
                  value={editedStyle.displayStyle}
                  onChange={(e) => handleChange('displayStyle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="digital">数字</option>
                  <option value="analog">模拟</option>
                  <option value="text">文本</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">尺寸</label>
                <select
                  value={editedStyle.size}
                  onChange={(e) => handleChange('size', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="small">小</option>
                  <option value="medium">中</option>
                  <option value="large">大</option>
                  <option value="extra-large">特大</option>
                </select>
              </div>
            </div>
          </div>

          {/* 颜色设置 */}
          <div className="border-b pb-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">颜色设置</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(editedStyle.colors).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </label>
                  <div className="flex items-center">
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => handleChange(`colors.${key}`, e.target.value)}
                      className="w-10 h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleChange(`colors.${key}`, e.target.value)}
                      className="ml-2 flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 布局设置 */}
          <div className="border-b pb-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">布局设置</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">对齐方式</label>
                <select
                  value={editedStyle.layout.alignment}
                  onChange={(e) => handleChange('layout.alignment', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="left">左对齐</option>
                  <option value="center">居中</option>
                  <option value="right">右对齐</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">间距</label>
                <select
                  value={editedStyle.layout.spacing}
                  onChange={(e) => handleChange('layout.spacing', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="compact">紧凑</option>
                  <option value="normal">正常</option>
                  <option value="spacious">宽松</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showStatusIndicator"
                  checked={editedStyle.layout.showStatusIndicator}
                  onChange={(e) => handleChange('layout.showStatusIndicator', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="showStatusIndicator" className="ml-2 block text-sm text-gray-700">
                  显示状态指示器
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showProgressPercentage"
                  checked={editedStyle.layout.showProgressPercentage}
                  onChange={(e) => handleChange('layout.showProgressPercentage', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="showProgressPercentage" className="ml-2 block text-sm text-gray-700">
                  显示进度百分比
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showStateText"
                  checked={editedStyle.layout.showStateText}
                  onChange={(e) => handleChange('layout.showStateText', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="showStateText" className="ml-2 block text-sm text-gray-700">
                  显示状态文本
                </label>
              </div>
            </div>
          </div>

          {/* 动画设置 */}
          <div className="border-b pb-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">动画设置</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="animationsEnabled"
                  checked={editedStyle.animations.enabled}
                  onChange={(e) => handleChange('animations.enabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="animationsEnabled" className="ml-2 block text-sm text-gray-700">
                  启用动画
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">过渡持续时间 (ms)</label>
                <input
                  type="number"
                  min="0"
                  max="2000"
                  value={editedStyle.animations.transitionDuration}
                  onChange={(e) => handleChange('animations.transitionDuration', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">缓动函数</label>
                <select
                  value={editedStyle.animations.easing}
                  onChange={(e) => handleChange('animations.easing', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="linear">线性</option>
                  <option value="ease">缓入缓出</option>
                  <option value="ease-in">缓入</option>
                  <option value="ease-out">缓出</option>
                  <option value="ease-in-out">缓入缓出</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="pulseOnStateChange"
                  checked={editedStyle.animations.pulseOnStateChange}
                  onChange={(e) => handleChange('animations.pulseOnStateChange', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="pulseOnStateChange" className="ml-2 block text-sm text-gray-700">
                  状态变化时脉冲
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="breathingEffect"
                  checked={editedStyle.animations.breathingEffect}
                  onChange={(e) => handleChange('animations.breathingEffect', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="breathingEffect" className="ml-2 block text-sm text-gray-700">
                  呼吸效果
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rotationEffect"
                  checked={editedStyle.animations.rotationEffect}
                  onChange={(e) => handleChange('animations.rotationEffect', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="rotationEffect" className="ml-2 block text-sm text-gray-700">
                  旋转效果
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default StyleEditor;
