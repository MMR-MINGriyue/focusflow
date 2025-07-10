/**
 * 统一设置组件
 * 支持经典模式和智能模式的所有设置选项
 */

import React, { useState } from 'react';
import { UnifiedTimerSettings, TimerMode } from '../../types/unifiedTimer';
import { Switch } from '../ui/Switch';
import { Slider } from '../ui/Slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import {
  Volume2,
  Settings as SettingsIcon,
  Palette,
  Monitor,
  Brain,
  Timer as TimerIcon
} from 'lucide-react';
import SoundManager from './SoundManager';
import ThemeManager from './ThemeManager';
import TimerStyleManager from './TimerStyleManager';

interface UnifiedSettingsProps {
  settings: UnifiedTimerSettings;
  onSettingsChange: (settings: Partial<UnifiedTimerSettings>) => void;
}

const UnifiedSettings: React.FC<UnifiedSettingsProps> = ({
  settings,
  onSettingsChange
}) => {
  const [activeTab, setActiveTab] = useState<'mode' | 'classic' | 'smart' | 'sound' | 'theme' | 'style'>('mode');

  // 更新设置的辅助函数
  const updateSetting = <K extends keyof UnifiedTimerSettings>(
    key: K, 
    value: UnifiedTimerSettings[K]
  ) => {
    onSettingsChange({ [key]: value });
  };

  const updateClassicSetting = <K extends keyof UnifiedTimerSettings['classic']>(
    key: K,
    value: UnifiedTimerSettings['classic'][K]
  ) => {
    onSettingsChange({
      classic: {
        ...settings.classic,
        [key]: value
      }
    });
  };

  const updateSmartSetting = <K extends keyof UnifiedTimerSettings['smart']>(
    key: K,
    value: UnifiedTimerSettings['smart'][K]
  ) => {
    onSettingsChange({
      smart: {
        ...settings.smart,
        [key]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="mode" className="flex items-center space-x-1">
            <SettingsIcon className="h-4 w-4" />
            <span>模式</span>
          </TabsTrigger>
          <TabsTrigger value="classic" className="flex items-center space-x-1">
            <TimerIcon className="h-4 w-4" />
            <span>经典</span>
          </TabsTrigger>
          <TabsTrigger value="smart" className="flex items-center space-x-1">
            <Brain className="h-4 w-4" />
            <span>智能</span>
          </TabsTrigger>
          <TabsTrigger value="sound" className="flex items-center space-x-1">
            <Volume2 className="h-4 w-4" />
            <span>音效</span>
          </TabsTrigger>
          <TabsTrigger value="theme" className="flex items-center space-x-1">
            <Palette className="h-4 w-4" />
            <span>主题</span>
          </TabsTrigger>
          <TabsTrigger value="style" className="flex items-center space-x-1">
            <Monitor className="h-4 w-4" />
            <span>样式</span>
          </TabsTrigger>
        </TabsList>

        {/* 模式设置 */}
        <TabsContent value="mode" className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">计时器模式设置</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">默认模式</label>
                  <p className="text-xs text-muted-foreground">应用启动时的默认计时器模式</p>
                </div>
                <select
                  value={settings.defaultMode}
                  onChange={(e) => updateSetting('defaultMode', e.target.value as TimerMode)}
                  className="px-3 py-2 border border-border rounded-md bg-background"
                  title="选择默认计时器模式"
                >
                  <option value={TimerMode.CLASSIC}>经典模式</option>
                  <option value={TimerMode.SMART}>智能模式</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">显示模式选择器</label>
                  <p className="text-xs text-muted-foreground">在计时器界面显示模式切换选项</p>
                </div>
                <Switch
                  checked={settings.showModeSelector}
                  onCheckedChange={(checked) => updateSetting('showModeSelector', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">允许运行时切换</label>
                  <p className="text-xs text-muted-foreground">允许在计时器运行时切换模式</p>
                </div>
                <Switch
                  checked={settings.allowModeSwitch}
                  onCheckedChange={(checked) => updateSetting('allowModeSwitch', checked)}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 经典模式设置 */}
        <TabsContent value="classic" className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">经典模式设置</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">专注时长（分钟）</label>
                <Slider
                  value={[settings.classic.focusDuration]}
                  onValueChange={([value]) => updateClassicSetting('focusDuration', value)}
                  max={120}
                  min={5}
                  step={5}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  当前: {settings.classic.focusDuration} 分钟
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">休息时长（分钟）</label>
                <Slider
                  value={[settings.classic.breakDuration]}
                  onValueChange={([value]) => updateClassicSetting('breakDuration', value)}
                  max={30}
                  min={1}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  当前: {settings.classic.breakDuration} 分钟
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">微休息间隔（分钟）</label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className="text-xs text-muted-foreground">最小间隔</label>
                    <Slider
                      value={[settings.classic.microBreakMinInterval]}
                      onValueChange={([value]) => updateClassicSetting('microBreakMinInterval', value)}
                      max={60}
                      min={5}
                      step={5}
                      className="mt-1"
                    />
                    <div className="text-xs text-muted-foreground">
                      {settings.classic.microBreakMinInterval} 分钟
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">最大间隔</label>
                    <Slider
                      value={[settings.classic.microBreakMaxInterval]}
                      onValueChange={([value]) => updateClassicSetting('microBreakMaxInterval', value)}
                      max={120}
                      min={settings.classic.microBreakMinInterval}
                      step={5}
                      className="mt-1"
                    />
                    <div className="text-xs text-muted-foreground">
                      {settings.classic.microBreakMaxInterval} 分钟
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">微休息时长（分钟）</label>
                <Slider
                  value={[settings.classic.microBreakDuration]}
                  onValueChange={([value]) => updateClassicSetting('microBreakDuration', value)}
                  max={10}
                  min={1}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  当前: {settings.classic.microBreakDuration} 分钟
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 智能模式设置 */}
        <TabsContent value="smart" className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">智能模式设置</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">基础专注时长（分钟）</label>
                <Slider
                  value={[settings.smart.focusDuration]}
                  onValueChange={([value]) => updateSmartSetting('focusDuration', value)}
                  max={180}
                  min={30}
                  step={15}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  当前: {settings.smart.focusDuration} 分钟（系统会根据表现自动调整）
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">基础休息时长（分钟）</label>
                <Slider
                  value={[settings.smart.breakDuration]}
                  onValueChange={([value]) => updateSmartSetting('breakDuration', value)}
                  max={60}
                  min={5}
                  step={5}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  当前: {settings.smart.breakDuration} 分钟
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">启用微休息</label>
                  <p className="text-xs text-muted-foreground">在专注期间随机插入短暂休息</p>
                </div>
                <Switch
                  checked={settings.smart.enableMicroBreaks}
                  onCheckedChange={(checked) => updateSmartSetting('enableMicroBreaks', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">自适应调整</label>
                  <p className="text-xs text-muted-foreground">根据效率评分自动调整时间长度</p>
                </div>
                <Switch
                  checked={settings.smart.enableAdaptiveAdjustment}
                  onCheckedChange={(checked) => updateSmartSetting('enableAdaptiveAdjustment', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">生理节律优化</label>
                  <p className="text-xs text-muted-foreground">根据一天中的时间调整专注强度</p>
                </div>
                <Switch
                  checked={settings.smart.enableCircadianOptimization}
                  onCheckedChange={(checked) => updateSmartSetting('enableCircadianOptimization', checked)}
                />
              </div>

              <div>
                <label className="text-sm font-medium">强制休息阈值（分钟）</label>
                <Slider
                  value={[settings.smart.forcedBreakThreshold]}
                  onValueChange={([value]) => updateSmartSetting('forcedBreakThreshold', value)}
                  max={300}
                  min={60}
                  step={15}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  连续专注超过 {settings.smart.forcedBreakThreshold} 分钟将强制休息
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 音效设置 */}
        <TabsContent value="sound" className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">音效设置</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">启用音效</label>
                  <p className="text-xs text-muted-foreground">播放状态切换和通知音效</p>
                </div>
                <Switch
                  checked={settings.soundEnabled}
                  onCheckedChange={(checked) => updateSetting('soundEnabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">启用通知</label>
                  <p className="text-xs text-muted-foreground">显示系统通知</p>
                </div>
                <Switch
                  checked={settings.notificationEnabled}
                  onCheckedChange={(checked) => updateSetting('notificationEnabled', checked)}
                />
              </div>

              <div>
                <label className="text-sm font-medium">音量</label>
                <Slider
                  value={[settings.volume * 100]}
                  onValueChange={([value]) => updateSetting('volume', value / 100)}
                  max={100}
                  min={0}
                  step={5}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  当前: {Math.round(settings.volume * 100)}%
                </div>
              </div>
            </div>

            <SoundManager />
          </div>
        </TabsContent>

        {/* 主题设置 */}
        <TabsContent value="theme" className="space-y-6">
          <ThemeManager />
        </TabsContent>

        {/* 样式设置 */}
        <TabsContent value="style" className="space-y-6">
          <TimerStyleManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UnifiedSettings;
