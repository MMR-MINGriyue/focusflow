import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Zap, Eye } from 'lucide-react';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { Slider } from '../ui/Slider';
import { TimerStyleConfig, TimerStyleSettings } from '../../types/timerStyle';
import { timerStyleService } from '../../services/timerStyle';

interface TimerAnimationSettingsProps {
  onSettingsChange?: (settings: TimerStyleSettings) => void;
}

const TimerAnimationSettings: React.FC<TimerAnimationSettingsProps> = ({ onSettingsChange }) => {
  const [, setSettings] = useState<TimerStyleSettings>(timerStyleService.getSettings());
  const [currentStyle, setCurrentStyle] = useState<TimerStyleConfig>(timerStyleService.getCurrentStyle());
  const [previewAnimation, setPreviewAnimation] = useState<string | null>(null);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleSettingsChange = (newSettings: TimerStyleSettings) => {
      setSettings(newSettings);
      setCurrentStyle(timerStyleService.getCurrentStyle());
      onSettingsChange?.(newSettings);
    };

    timerStyleService.addListener(handleSettingsChange);
    return () => timerStyleService.removeListener(handleSettingsChange);
  }, [onSettingsChange]);

  // 更新动画设置
  const updateAnimationSettings = useCallback((updates: Partial<TimerStyleConfig['animations']>) => {
    const updatedStyle: TimerStyleConfig = {
      ...currentStyle,
      animations: {
        ...currentStyle.animations,
        ...updates
      },
      updatedAt: new Date().toISOString()
    };

    timerStyleService.addCustomStyle(updatedStyle);
    timerStyleService.setCurrentStyle(updatedStyle.id);
  }, [currentStyle]);

  // 预览动画效果
  const previewAnimationEffect = useCallback((animationType: string) => {
    // 清除之前的定时器
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }

    setPreviewAnimation(animationType);

    // 3秒后自动停止预览
    previewTimeoutRef.current = setTimeout(() => {
      setPreviewAnimation(null);
      previewTimeoutRef.current = null;
    }, 3000);
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, []);

  // 动画效果列表
  const animationEffects = [
    {
      id: 'pulse',
      name: '脉冲效果',
      description: '计时器会有规律地放大缩小',
      property: 'pulseOnStateChange' as keyof TimerStyleConfig['animations']
    },
    {
      id: 'breathing',
      name: '呼吸效果',
      description: '计时器会有呼吸般的明暗变化',
      property: 'breathingEffect' as keyof TimerStyleConfig['animations']
    },
    {
      id: 'rotation',
      name: '旋转效果',
      description: '适用于模拟时钟样式的旋转动画',
      property: 'rotationEffect' as keyof TimerStyleConfig['animations']
    }
  ] as const;



  // 缓动函数选项
  const easingOptions = [
    { value: 'ease', label: '默认' },
    { value: 'ease-in', label: '缓入' },
    { value: 'ease-out', label: '缓出' },
    { value: 'ease-in-out', label: '缓入缓出' },
    { value: 'linear', label: '线性' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-semibold">动画效果设置</h3>
        </div>
        {previewAnimation && (
          <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded">
            预览中: {animationEffects.find(e => e.id === previewAnimation)?.name}
          </div>
        )}
      </div>

      {/* 当前样式信息 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div
            className="w-8 h-8 rounded-lg border-2 border-white shadow-sm flex items-center justify-center"
            style={{ '--bg-color': currentStyle.colors.primary, backgroundColor: 'var(--bg-color)' } as React.CSSProperties}
          >
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="font-medium text-gray-700">
              {currentStyle.name} - 动画设置
            </div>
            <div className="text-sm text-gray-500">
              {currentStyle.displayStyle} 样式 • 
              {currentStyle.animations.enabled ? '动画已启用' : '动画已禁用'}
            </div>
          </div>
        </div>
      </div>

      {/* 动画总开关 */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-700">启用动画效果</h4>
            <p className="text-sm text-gray-500 mt-1">
              控制计时器的所有动画效果
            </p>
          </div>
          <Switch
            checked={currentStyle.animations.enabled}
            onCheckedChange={(enabled) => updateAnimationSettings({ enabled })}
          />
        </div>
      </div>

      {currentStyle.animations.enabled && (
        <>
          {/* 动画效果选项 */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-4">动画效果</h4>
            <div className="space-y-4">
              {animationEffects.map((effect) => (
                <div key={effect.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <div className="font-medium text-sm">{effect.name}</div>
                        <div className="text-xs text-gray-500">{effect.description}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      onClick={() => previewAnimationEffect(effect.id)}
                      size="sm"
                      variant="outline"
                      className="flex items-center space-x-1"
                    >
                      <Eye className="h-3 w-3" />
                      <span>预览</span>
                    </Button>
                    <Switch
                      checked={currentStyle.animations[effect.property] as boolean}
                      onCheckedChange={(checked) =>
                        updateAnimationSettings({ [effect.property]: checked })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 动画参数设置 */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-4">动画参数</h4>
            <div className="space-y-6">
              {/* 动画时长 */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  动画时长: {currentStyle.animations.transitionDuration}ms
                </label>
                <Slider
                  value={[currentStyle.animations.transitionDuration]}
                  onValueChange={([value]) => updateAnimationSettings({ transitionDuration: value })}
                  min={100}
                  max={2000}
                  step={100}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>100ms (很快)</span>
                  <span>2000ms (很慢)</span>
                </div>
              </div>

              {/* 缓动函数 */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  缓动函数
                </label>
                <select
                  value={currentStyle.animations.easing}
                  onChange={(e) => updateAnimationSettings({ easing: e.target.value })}
                  className="w-full p-2 border rounded text-sm"
                  aria-label="选择动画缓动函数"
                >
                  {easingOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 动画预览区域 */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-4">动画预览</h4>
            <div className="flex items-center justify-center py-8 bg-gray-50 rounded-lg">
              <div
                className={`text-4xl font-bold transition-all ${
                  previewAnimation === 'pulse' ? 'timer-pulse' : ''
                } ${
                  previewAnimation === 'breathing' ? 'timer-breathing' : ''
                } ${
                  previewAnimation === 'rotation' ? 'timer-rotation' : ''
                }`}
                style={{
                  '--timer-color': currentStyle.colors.primary,
                  '--timer-duration': `${currentStyle.animations.transitionDuration}ms`,
                  '--timer-easing': currentStyle.animations.easing,
                  color: 'var(--timer-color)',
                  transitionDuration: 'var(--timer-duration)',
                  transitionTimingFunction: 'var(--timer-easing)'
                } as React.CSSProperties}
              >
                25:00
              </div>
            </div>
            <div className="flex justify-center space-x-2 mt-4">
              {animationEffects.map((effect) => (
                <Button
                  key={effect.id}
                  type="button"
                  onClick={() => previewAnimationEffect(effect.id)}
                  size="sm"
                  variant={previewAnimation === effect.id ? "default" : "outline"}
                  className="text-xs"
                >
                  {effect.name}
                </Button>
              ))}
              <Button
                type="button"
                onClick={() => setPreviewAnimation(null)}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                停止
              </Button>
            </div>
          </div>

          {/* 性能设置 */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-3">性能设置</h4>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                <p className="mb-2">动画性能提示：</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>较短的动画时长可以提高性能</li>
                  <li>在低性能设备上建议禁用复杂动画</li>
                  <li>系统设置中的"减少动画"选项会自动禁用所有动画</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 使用提示 */}
      <div className="text-xs text-gray-500 bg-yellow-50 p-3 rounded">
        <p><strong>动画效果提示：</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>脉冲效果适合在专注状态下使用，可以帮助保持注意力</li>
          <li>呼吸效果有助于放松，适合在休息时间使用</li>
          <li>旋转效果主要适用于模拟时钟样式</li>
          <li>可以组合使用多种动画效果</li>
          <li>动画时长建议设置在300-500ms之间以获得最佳体验</li>
        </ul>
      </div>
    </div>
  );
};

export default TimerAnimationSettings;
