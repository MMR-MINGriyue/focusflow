import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, Eye, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { Slider } from '../ui/Slider';
import { TimerStyleConfig, TimerStyleSettings } from '../../types/timerStyle';
import { timerStyleService } from '../../services/timerStyle';

interface BackgroundDecorationSettingsProps {
  onSettingsChange?: (settings: TimerStyleSettings) => void;
}

const BackgroundDecorationSettings: React.FC<BackgroundDecorationSettingsProps> = ({
  onSettingsChange
}) => {
  const [, setSettings] = useState<TimerStyleSettings>(timerStyleService.getSettings());
  const [currentStyle, setCurrentStyle] = useState<TimerStyleConfig>(timerStyleService.getCurrentStyle());
  const [previewEffect, setPreviewEffect] = useState<string | null>(null);
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

  // 更新背景设置
  const updateBackgroundSettings = useCallback((updates: Partial<TimerStyleConfig['background']>) => {
    const updatedStyle: TimerStyleConfig = {
      ...currentStyle,
      background: {
        ...currentStyle.background,
        ...updates
      },
      updatedAt: new Date().toISOString()
    };

    timerStyleService.addCustomStyle(updatedStyle);
    timerStyleService.setCurrentStyle(updatedStyle.id);
  }, [currentStyle]);

  // 更新粒子设置
  const updateParticleSettings = useCallback((updates: Partial<TimerStyleConfig['particles']>) => {
    const updatedStyle: TimerStyleConfig = {
      ...currentStyle,
      particles: {
        ...currentStyle.particles,
        ...updates
      },
      updatedAt: new Date().toISOString()
    };

    timerStyleService.addCustomStyle(updatedStyle);
    timerStyleService.setCurrentStyle(updatedStyle.id);
  }, [currentStyle]);

  // 更新装饰设置
  const updateDecorationSettings = useCallback((updates: Partial<TimerStyleConfig['decoration']>) => {
    const updatedStyle: TimerStyleConfig = {
      ...currentStyle,
      decoration: {
        ...currentStyle.decoration,
        ...updates
      },
      updatedAt: new Date().toISOString()
    };

    timerStyleService.addCustomStyle(updatedStyle);
    timerStyleService.setCurrentStyle(updatedStyle.id);
  }, [currentStyle]);

  // 预览效果
  const previewEffectToggle = useCallback((effectType: string) => {
    // 清除之前的定时器
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }

    if (previewEffect === effectType) {
      setPreviewEffect(null);
    } else {
      setPreviewEffect(effectType);
      // 3秒后自动停止预览
      previewTimeoutRef.current = setTimeout(() => {
        setPreviewEffect(null);
        previewTimeoutRef.current = null;
      }, 3000);
    }
  }, [previewEffect]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, []);

  // 背景图案选项
  const backgroundPatterns = [
    { value: 'none', label: '无背景' },
    { value: 'dots', label: '点状图案' },
    { value: 'grid', label: '网格图案' },
    { value: 'waves', label: '波浪图案' },
    { value: 'geometric', label: '几何图案' },
    { value: 'organic', label: '有机图案' },
    { value: 'gradient', label: '渐变背景' }
  ];

  // 粒子效果选项
  const particleEffects = [
    { value: 'none', label: '无粒子效果' },
    { value: 'floating', label: '漂浮粒子' },
    { value: 'falling', label: '下落粒子' },
    { value: 'orbiting', label: '环绕粒子' },
    { value: 'pulsing', label: '脉冲粒子' },
    { value: 'sparkling', label: '闪烁粒子' }
  ];

  // 装饰元素选项
  const decorationElements = [
    { value: 'none', label: '无装饰' },
    { value: 'frame', label: '边框装饰' },
    { value: 'corners', label: '角落装饰' },
    { value: 'glow', label: '发光效果' },
    { value: 'shadow', label: '阴影效果' },
    { value: 'border', label: '边界装饰' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-semibold">背景和装饰效果</h3>
        </div>
        {previewEffect && (
          <div className="text-sm text-purple-600 bg-purple-50 px-3 py-1 rounded">
            预览中: {previewEffect}
          </div>
        )}
      </div>

      {/* 当前样式信息 */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div
            className="w-8 h-8 rounded-lg border-2 border-white shadow-sm flex items-center justify-center"
            style={{ '--bg-color': currentStyle.colors.primary, backgroundColor: 'var(--bg-color)' } as React.CSSProperties}
          >
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="font-medium text-gray-700">
              {currentStyle.name} - 背景装饰
            </div>
            <div className="text-sm text-gray-500">
              背景: {backgroundPatterns.find(p => p.value === currentStyle.background.pattern)?.label} • 
              粒子: {particleEffects.find(p => p.value === currentStyle.particles.effect)?.label} • 
              装饰: {decorationElements.find(d => d.value === currentStyle.decoration.element)?.label}
            </div>
          </div>
        </div>
      </div>

      {/* 背景图案设置 */}
      <div className="border rounded-lg p-4">
        <h4 className="font-medium text-gray-700 mb-4">背景图案</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              图案类型
            </label>
            <select
              value={currentStyle.background.pattern}
              onChange={(e) => updateBackgroundSettings({
                pattern: e.target.value as TimerStyleConfig['background']['pattern']
              })}
              className="w-full p-2 border rounded text-sm"
              aria-label="选择背景图案类型"
            >
              {backgroundPatterns.map((pattern) => (
                <option key={pattern.value} value={pattern.value}>
                  {pattern.label}
                </option>
              ))}
            </select>
          </div>

          {currentStyle.background.pattern !== 'none' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  透明度: {Math.round(currentStyle.background.opacity * 100)}%
                </label>
                <Slider
                  value={[currentStyle.background.opacity]}
                  onValueChange={([value]) => updateBackgroundSettings({ opacity: value })}
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  图案尺寸
                </label>
                <select
                  value={currentStyle.background.size}
                  onChange={(e) => updateBackgroundSettings({
                    size: e.target.value as TimerStyleConfig['background']['size']
                  })}
                  className="w-full p-2 border rounded text-sm"
                  aria-label="选择背景图案尺寸"
                >
                  <option value="small">小</option>
                  <option value="medium">中</option>
                  <option value="large">大</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  图案颜色
                </label>
                <input
                  type="color"
                  value={currentStyle.background.color}
                  onChange={(e) => updateBackgroundSettings({ color: e.target.value })}
                  className="w-full h-10 border rounded cursor-pointer"
                  aria-label="选择背景图案颜色"
                  title="选择背景图案颜色"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">启用动画</span>
                <Switch
                  checked={currentStyle.background.animation}
                  onCheckedChange={(animation) => updateBackgroundSettings({ animation })}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* 粒子效果设置 */}
      <div className="border rounded-lg p-4">
        <h4 className="font-medium text-gray-700 mb-4">粒子效果</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              效果类型
            </label>
            <select
              value={currentStyle.particles.effect}
              onChange={(e) => updateParticleSettings({
                effect: e.target.value as TimerStyleConfig['particles']['effect']
              })}
              className="w-full p-2 border rounded text-sm"
              aria-label="选择粒子效果类型"
            >
              {particleEffects.map((effect) => (
                <option key={effect.value} value={effect.value}>
                  {effect.label}
                </option>
              ))}
            </select>
          </div>

          {currentStyle.particles.effect !== 'none' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  粒子数量: {currentStyle.particles.count}
                </label>
                <Slider
                  value={[currentStyle.particles.count]}
                  onValueChange={([value]) => updateParticleSettings({ count: value })}
                  min={5}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  粒子大小: {currentStyle.particles.size}px
                </label>
                <Slider
                  value={[currentStyle.particles.size]}
                  onValueChange={([value]) => updateParticleSettings({ size: value })}
                  min={1}
                  max={10}
                  step={0.5}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  运动速度: {currentStyle.particles.speed}
                </label>
                <Slider
                  value={[currentStyle.particles.speed]}
                  onValueChange={([value]) => updateParticleSettings({ speed: value })}
                  min={0.1}
                  max={5}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  透明度: {Math.round(currentStyle.particles.opacity * 100)}%
                </label>
                <Slider
                  value={[currentStyle.particles.opacity]}
                  onValueChange={([value]) => updateParticleSettings({ opacity: value })}
                  min={0.1}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  粒子颜色
                </label>
                <input
                  type="color"
                  value={currentStyle.particles.color}
                  onChange={(e) => updateParticleSettings({ color: e.target.value })}
                  className="w-full h-10 border rounded cursor-pointer"
                  aria-label="选择粒子颜色"
                  title="选择粒子颜色"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* 装饰元素设置 */}
      <div className="border rounded-lg p-4">
        <h4 className="font-medium text-gray-700 mb-4">装饰元素</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              装饰类型
            </label>
            <select
              value={currentStyle.decoration.element}
              onChange={(e) => updateDecorationSettings({
                element: e.target.value as TimerStyleConfig['decoration']['element']
              })}
              className="w-full p-2 border rounded text-sm"
              aria-label="选择装饰元素类型"
            >
              {decorationElements.map((element) => (
                <option key={element.value} value={element.value}>
                  {element.label}
                </option>
              ))}
            </select>
          </div>

          {currentStyle.decoration.element !== 'none' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  强度: {Math.round(currentStyle.decoration.intensity * 100)}%
                </label>
                <Slider
                  value={[currentStyle.decoration.intensity]}
                  onValueChange={([value]) => updateDecorationSettings({ intensity: value })}
                  min={0.1}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  装饰颜色
                </label>
                <input
                  type="color"
                  value={currentStyle.decoration.color}
                  onChange={(e) => updateDecorationSettings({ color: e.target.value })}
                  className="w-full h-10 border rounded cursor-pointer"
                  aria-label="选择装饰颜色"
                  title="选择装饰颜色"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">启用动画</span>
                <Switch
                  checked={currentStyle.decoration.animated}
                  onCheckedChange={(animated) => updateDecorationSettings({ animated })}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* 效果预览 */}
      <div className="border rounded-lg p-4">
        <h4 className="font-medium text-gray-700 mb-4">效果预览</h4>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => previewEffectToggle('background')}
            size="sm"
            variant={previewEffect === 'background' ? "default" : "outline"}
            className="text-xs"
          >
            <Eye className="h-3 w-3 mr-1" />
            背景图案
          </Button>
          <Button
            type="button"
            onClick={() => previewEffectToggle('particles')}
            size="sm"
            variant={previewEffect === 'particles' ? "default" : "outline"}
            className="text-xs"
          >
            <Eye className="h-3 w-3 mr-1" />
            粒子效果
          </Button>
          <Button
            type="button"
            onClick={() => previewEffectToggle('decoration')}
            size="sm"
            variant={previewEffect === 'decoration' ? "default" : "outline"}
            className="text-xs"
          >
            <Eye className="h-3 w-3 mr-1" />
            装饰元素
          </Button>
          <Button
            type="button"
            onClick={() => setPreviewEffect(null)}
            size="sm"
            variant="outline"
            className="text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            停止预览
          </Button>
        </div>
      </div>

      {/* 使用提示 */}
      <div className="text-xs text-gray-500 bg-purple-50 p-3 rounded">
        <p><strong>背景装饰提示：</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>背景图案可以增加视觉层次感，建议使用较低的透明度</li>
          <li>粒子效果适合营造动态氛围，但过多会影响性能</li>
          <li>装饰元素可以突出计时器区域，增强视觉焦点</li>
          <li>建议根据使用场景选择合适的效果强度</li>
          <li>在低性能设备上建议减少或禁用动画效果</li>
        </ul>
      </div>
    </div>
  );
};

export default BackgroundDecorationSettings;
