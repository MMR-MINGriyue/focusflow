import React, { useState, useEffect } from 'react';
import { Clock, Eye, EyeOff, Palette, Monitor } from 'lucide-react';
import { Button } from '../ui/Button';
import { TimerStyleConfig, TimerStyleSettings } from '../../types/timerStyle';
import { timerStyleService } from '../../services/timerStyle';

interface TimerStyleSelectorProps {
  onStyleChange?: (style: TimerStyleConfig) => void;
}

const TimerStyleSelector: React.FC<TimerStyleSelectorProps> = ({ onStyleChange }) => {
  const [settings, setSettings] = useState<TimerStyleSettings>(timerStyleService.getSettings());
  const [previewStyle, setPreviewStyle] = useState<TimerStyleConfig | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const handleSettingsChange = (newSettings: TimerStyleSettings) => {
      setSettings(newSettings);
      setPreviewStyle(timerStyleService.getPreviewStyle());
    };

    timerStyleService.addListener(handleSettingsChange);
    return () => timerStyleService.removeListener(handleSettingsChange);
  }, []);

  // 获取所有样式
  const allStyles = timerStyleService.getAllStyles();
  
  // 按类别过滤样式
  const filteredStyles = selectedCategory === 'all' 
    ? allStyles 
    : allStyles.filter(style => style.category === selectedCategory);

  // 获取类别列表
  const categories = [
    { id: 'all', name: '全部', count: allStyles.length },
    { id: 'modern', name: '现代', count: allStyles.filter(s => s.category === 'modern').length },
    { id: 'classic', name: '经典', count: allStyles.filter(s => s.category === 'classic').length },
    { id: 'minimal', name: '极简', count: allStyles.filter(s => s.category === 'minimal').length },
    { id: 'creative', name: '创意', count: allStyles.filter(s => s.category === 'creative').length },
    { id: 'professional', name: '专业', count: allStyles.filter(s => s.category === 'professional').length }
  ];

  // 应用样式
  const applyStyle = (styleId: string) => {
    const success = timerStyleService.setCurrentStyle(styleId);
    if (success) {
      const style = timerStyleService.getCurrentStyle();
      onStyleChange?.(style);
    }
  };

  // 预览样式
  const togglePreview = (styleId: string) => {
    if (previewStyle && previewStyle.id === styleId) {
      // 退出预览
      timerStyleService.exitPreview();
    } else {
      // 开始预览
      timerStyleService.previewStyle(styleId);
    }
  };

  // 获取样式显示名称
  const getDisplayStyleName = (displayStyle: TimerStyleConfig['displayStyle']) => {
    const nameMap = {
      'digital': '数字',
      'analog': '模拟',
      'progress': '进度环',
      'minimal': '极简',
      'card': '卡片',
      'neon': '霓虹'
    };
    return nameMap[displayStyle] || displayStyle;
  };

  // 获取尺寸显示名称
  const getSizeName = (size: TimerStyleConfig['size']) => {
    const sizeMap = {
      'small': '小',
      'medium': '中',
      'large': '大',
      'extra-large': '特大'
    };
    return sizeMap[size] || size;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">计时器样式</h3>
        </div>
        {previewStyle && (
          <div className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded">
            预览模式: {previewStyle.name}
          </div>
        )}
      </div>

      {/* 当前样式信息 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="w-8 h-8 rounded-lg border-2 border-white shadow-sm flex items-center justify-center"
              style={{ backgroundColor: settings.currentStyleId ? timerStyleService.getCurrentStyle().colors.primary : '#3b82f6' }}
            >
              <Monitor className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="font-medium text-gray-700">
                {timerStyleService.getCurrentStyle().name}
              </div>
              <div className="text-sm text-gray-500">
                {getDisplayStyleName(timerStyleService.getCurrentStyle().displayStyle)} • 
                {getSizeName(timerStyleService.getCurrentStyle().size)} • 
                {timerStyleService.getCurrentStyle().category}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 类别筛选 */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              selectedCategory === category.id
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {category.name} ({category.count})
          </button>
        ))}
      </div>

      {/* 样式网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStyles.map((style) => (
          <div
            key={style.id}
            className={`border rounded-lg p-4 transition-all cursor-pointer hover:shadow-md ${
              settings.currentStyleId === style.id
                ? 'border-blue-500 bg-blue-50'
                : previewStyle?.id === style.id
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            {/* 样式预览区域 */}
            <div 
              className="h-24 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden"
              style={{ backgroundColor: style.colors.background }}
            >
              {/* 模拟计时器显示 */}
              <div className="text-center">
                <div 
                  className="text-lg font-bold mb-1"
                  style={{ 
                    color: style.colors.primary,
                    fontFamily: style.numberStyle === 'mono' ? 'monospace' : 'inherit'
                  }}
                >
                  25:00
                </div>
                {style.displayStyle === 'progress' && (
                  <div className="w-16 h-1 bg-gray-300 rounded-full mx-auto">
                    <div 
                      className="h-1 bg-current rounded-full"
                      style={{ 
                        width: '60%',
                        color: style.colors.progress
                      }}
                    />
                  </div>
                )}
                {style.displayStyle === 'analog' && (
                  <div className="w-8 h-8 border-2 rounded-full mx-auto relative"
                       style={{ borderColor: style.colors.progressBackground }}>
                    <div 
                      className="absolute inset-0 border-2 rounded-full"
                      style={{ 
                        borderColor: style.colors.progress,
                        borderTopColor: 'transparent',
                        borderRightColor: 'transparent',
                        transform: 'rotate(45deg)'
                      }}
                    />
                  </div>
                )}
              </div>
              
              {/* 样式标识 */}
              <div className="absolute top-1 right-1">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: style.colors.accent }}
                />
              </div>
            </div>

            {/* 样式信息 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-700 text-sm">{style.name}</h4>
                {style.isPreset && (
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                    预设
                  </span>
                )}
              </div>
              
              <p className="text-xs text-gray-500 line-clamp-2">{style.description}</p>
              
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{getDisplayStyleName(style.displayStyle)}</span>
                <span>{getSizeName(style.size)}</span>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <Button
                type="button"
                onClick={() => togglePreview(style.id)}
                size="sm"
                variant="outline"
                className="flex items-center space-x-1 text-xs"
              >
                {previewStyle?.id === style.id ? (
                  <>
                    <EyeOff className="h-3 w-3" />
                    <span>退出</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3" />
                    <span>预览</span>
                  </>
                )}
              </Button>
              
              {settings.currentStyleId !== style.id && (
                <Button
                  type="button"
                  onClick={() => applyStyle(style.id)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                >
                  应用
                </Button>
              )}
              
              {settings.currentStyleId === style.id && (
                <span className="text-xs text-blue-600 font-medium">
                  当前使用
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredStyles.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Palette className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>该类别下暂无样式</p>
        </div>
      )}

      {/* 使用提示 */}
      <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
        <p><strong>使用提示：</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>点击"预览"可以临时查看样式效果</li>
          <li>点击"应用"将样式设为当前使用的样式</li>
          <li>不同样式适合不同的使用场景和个人喜好</li>
          <li>可以在"主题编辑"中创建自定义样式</li>
        </ul>
      </div>
    </div>
  );
};

export default TimerStyleSelector;
