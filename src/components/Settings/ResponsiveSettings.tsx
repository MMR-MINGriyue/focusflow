import React, { useState, useEffect } from 'react';
import { Smartphone, Tablet, Monitor, Eye } from 'lucide-react';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { TimerStyleConfig, TimerStyleSettings } from '../../types/timerStyle';
import { timerStyleService } from '../../services/timerStyle';

interface ResponsiveSettingsProps {
  onSettingsChange?: (settings: TimerStyleSettings) => void;
}

const ResponsiveSettings: React.FC<ResponsiveSettingsProps> = ({ onSettingsChange }) => {
  const [, setSettings] = useState<TimerStyleSettings>(timerStyleService.getSettings());
  const [currentStyle, setCurrentStyle] = useState<TimerStyleConfig>(timerStyleService.getCurrentStyle());
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop' | null>(null);

  useEffect(() => {
    const handleSettingsChange = (newSettings: TimerStyleSettings) => {
      setSettings(newSettings);
      setCurrentStyle(timerStyleService.getCurrentStyle());
      onSettingsChange?.(newSettings);
    };

    timerStyleService.addListener(handleSettingsChange);
    return () => timerStyleService.removeListener(handleSettingsChange);
  }, [onSettingsChange]);

  // 更新响应式设置
  const updateResponsiveSettings = (updates: Partial<TimerStyleConfig['responsive']>) => {
    const updatedStyle: TimerStyleConfig = {
      ...currentStyle,
      responsive: {
        ...currentStyle.responsive,
        ...updates
      },
      updatedAt: new Date().toISOString()
    };

    timerStyleService.addCustomStyle(updatedStyle);
    timerStyleService.setCurrentStyle(updatedStyle.id);
  };

  // 更新特定设备的断点配置
  const updateBreakpointSettings = (
    device: 'mobile' | 'tablet' | 'desktop',
    updates: Partial<TimerStyleConfig>
  ) => {
    const updatedStyle: TimerStyleConfig = {
      ...currentStyle,
      responsive: {
        ...currentStyle.responsive,
        breakpoints: {
          ...currentStyle.responsive.breakpoints,
          [device]: {
            ...currentStyle.responsive.breakpoints[device],
            ...updates
          }
        }
      },
      updatedAt: new Date().toISOString()
    };

    timerStyleService.addCustomStyle(updatedStyle);
    timerStyleService.setCurrentStyle(updatedStyle.id);
  };

  // 设备配置
  const devices = [
    {
      id: 'mobile' as const,
      name: '手机',
      icon: <Smartphone className="h-4 w-4" />,
      description: '小屏幕设备 (< 768px)',
      maxWidth: '767px'
    },
    {
      id: 'tablet' as const,
      name: '平板',
      icon: <Tablet className="h-4 w-4" />,
      description: '中等屏幕设备 (768px - 1024px)',
      maxWidth: '1024px'
    },
    {
      id: 'desktop' as const,
      name: '桌面',
      icon: <Monitor className="h-4 w-4" />,
      description: '大屏幕设备 (> 1024px)',
      maxWidth: '无限制'
    }
  ];

  // 尺寸选项
  const sizeOptions = [
    { value: 'small', label: '小' },
    { value: 'medium', label: '中' },
    { value: 'large', label: '大' },
    { value: 'extra-large', label: '特大' }
  ];

  // 显示样式选项
  const displayStyleOptions = [
    { value: 'digital', label: '数字' },
    { value: 'analog', label: '模拟' },
    { value: 'progress', label: '进度环' },
    { value: 'minimal', label: '极简' },
    { value: 'card', label: '卡片' },
    { value: 'neon', label: '霓虹' }
  ];

  // 预览设备
  const previewDeviceToggle = (device: 'mobile' | 'tablet' | 'desktop') => {
    if (previewDevice === device) {
      setPreviewDevice(null);
    } else {
      setPreviewDevice(device);
      // 3秒后自动停止预览
      setTimeout(() => setPreviewDevice(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Monitor className="h-5 w-5 text-green-500" />
          <h3 className="text-lg font-semibold">响应式适配</h3>
        </div>
        {previewDevice && (
          <div className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded">
            预览: {devices.find(d => d.id === previewDevice)?.name}
          </div>
        )}
      </div>

      {/* 当前样式信息 */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div 
            className="w-8 h-8 rounded-lg border-2 border-white shadow-sm flex items-center justify-center"
            style={{ backgroundColor: currentStyle.colors.primary }}
          >
            <Monitor className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="font-medium text-gray-700">
              {currentStyle.name} - 响应式配置
            </div>
            <div className="text-sm text-gray-500">
              响应式: {currentStyle.responsive.enabled ? '已启用' : '已禁用'} • 
              断点配置: {Object.keys(currentStyle.responsive.breakpoints).length} 个设备
            </div>
          </div>
        </div>
      </div>

      {/* 响应式总开关 */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-700">启用响应式适配</h4>
            <p className="text-sm text-gray-500 mt-1">
              根据不同屏幕尺寸自动调整计时器样式
            </p>
          </div>
          <Switch
            checked={currentStyle.responsive.enabled}
            onCheckedChange={(enabled) => updateResponsiveSettings({ enabled })}
          />
        </div>
      </div>

      {currentStyle.responsive.enabled && (
        <>
          {/* 设备断点配置 */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-4">设备断点配置</h4>
            <div className="space-y-6">
              {devices.map((device) => {
                const breakpointConfig = currentStyle.responsive.breakpoints[device.id];
                
                return (
                  <div key={device.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {device.icon}
                        <div>
                          <div className="font-medium text-gray-700">{device.name}</div>
                          <div className="text-sm text-gray-500">{device.description}</div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={() => previewDeviceToggle(device.id)}
                        size="sm"
                        variant={previewDevice === device.id ? "default" : "outline"}
                        className="flex items-center space-x-1"
                      >
                        <Eye className="h-3 w-3" />
                        <span>预览</span>
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 尺寸配置 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          计时器尺寸
                        </label>
                        <select
                          value={breakpointConfig?.size || currentStyle.size}
                          onChange={(e) => updateBreakpointSettings(device.id, { size: e.target.value as any })}
                          className="w-full p-2 border rounded text-sm"
                        >
                          {sizeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 显示样式配置 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          显示样式
                        </label>
                        <select
                          value={breakpointConfig?.displayStyle || currentStyle.displayStyle}
                          onChange={(e) => updateBreakpointSettings(device.id, { displayStyle: e.target.value as any })}
                          className="w-full p-2 border rounded text-sm"
                        >
                          {displayStyleOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 布局配置 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          对齐方式
                        </label>
                        <select
                          value={breakpointConfig?.layout?.alignment || currentStyle.layout.alignment}
                          onChange={(e) => updateBreakpointSettings(device.id, { 
                            layout: { 
                              ...currentStyle.layout, 
                              alignment: e.target.value as any 
                            } 
                          })}
                          className="w-full p-2 border rounded text-sm"
                        >
                          <option value="left">左对齐</option>
                          <option value="center">居中</option>
                          <option value="right">右对齐</option>
                        </select>
                      </div>

                      {/* 间距配置 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          间距设置
                        </label>
                        <select
                          value={breakpointConfig?.layout?.spacing || currentStyle.layout.spacing}
                          onChange={(e) => updateBreakpointSettings(device.id, { 
                            layout: { 
                              ...currentStyle.layout, 
                              spacing: e.target.value as any 
                            } 
                          })}
                          className="w-full p-2 border rounded text-sm"
                        >
                          <option value="compact">紧凑</option>
                          <option value="normal">正常</option>
                          <option value="relaxed">宽松</option>
                        </select>
                      </div>
                    </div>

                    {/* 显示选项 */}
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">显示状态指示器</span>
                        <Switch
                          checked={breakpointConfig?.layout?.showStatusIndicator ?? currentStyle.layout.showStatusIndicator}
                          onCheckedChange={(checked) => updateBreakpointSettings(device.id, { 
                            layout: { 
                              ...currentStyle.layout, 
                              showStatusIndicator: checked 
                            } 
                          })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">显示进度百分比</span>
                        <Switch
                          checked={breakpointConfig?.layout?.showProgressPercentage ?? currentStyle.layout.showProgressPercentage}
                          onCheckedChange={(checked) => updateBreakpointSettings(device.id, { 
                            layout: { 
                              ...currentStyle.layout, 
                              showProgressPercentage: checked 
                            } 
                          })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">显示状态文本</span>
                        <Switch
                          checked={breakpointConfig?.layout?.showStateText ?? currentStyle.layout.showStateText}
                          onCheckedChange={(checked) => updateBreakpointSettings(device.id, { 
                            layout: { 
                              ...currentStyle.layout, 
                              showStateText: checked 
                            } 
                          })}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 响应式预览 */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-4">响应式预览</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {devices.map((device) => (
                <Button
                  key={device.id}
                  type="button"
                  onClick={() => previewDeviceToggle(device.id)}
                  size="sm"
                  variant={previewDevice === device.id ? "default" : "outline"}
                  className="flex items-center space-x-1"
                >
                  {device.icon}
                  <span>{device.name}</span>
                </Button>
              ))}
            </div>
            
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              <p className="mb-2"><strong>预览说明：</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>点击设备按钮可以预览在该设备上的显示效果</li>
                <li>预览会自动应用对应的断点配置</li>
                <li>实际效果可能因浏览器窗口大小而有所不同</li>
              </ul>
            </div>
          </div>
        </>
      )}

      {/* 使用提示 */}
      <div className="text-xs text-gray-500 bg-green-50 p-3 rounded">
        <p><strong>响应式适配提示：</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>手机设备建议使用较小的尺寸和简化的显示样式</li>
          <li>平板设备可以使用中等尺寸，保持良好的可读性</li>
          <li>桌面设备可以使用较大尺寸和完整的功能显示</li>
          <li>不同设备可以配置不同的动画效果以优化性能</li>
          <li>建议在实际设备上测试响应式效果</li>
        </ul>
      </div>
    </div>
  );
};

export default ResponsiveSettings;
