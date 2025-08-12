import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Slider } from '../ui/Slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import {
  TimerMode,
  ClassicTimerSettings,
  SmartTimerSettings,
  UnifiedTimerSettings
} from '../../types/unifiedTimer';
import GeneralSettings from './GeneralSettings';
import NotificationSettings from './NotificationSettings';
import AppearanceSettings from './AppearanceSettings';
import ShortcutSettings from './ShortcutSettings';
import EnhancedSoundManager from './EnhancedSoundManager';
import { useSettingsStore } from '../../stores/settingsStore';
import { soundService } from '../../services/soundService';

interface EnhancedSettingsProps {
  settings: UnifiedTimerSettings;
  onSettingsChange: (settings: Partial<UnifiedTimerSettings>) => void;
  onClose?: () => void;
}

/**
 * 增强版设置组件
 * 整合所有设置功能，提供统一的设置界面
 */
const EnhancedSettings: React.FC<EnhancedSettingsProps> = ({
  settings,
  onSettingsChange,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('general');
  const [localSettings, setLocalSettings] = useState<UnifiedTimerSettings>(settings);
  const { settings: appSettings, updateSettings } = useSettingsStore();

  // 当外部设置变化时，更新本地设置
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // 处理设置变化
  const handleSettingsChange = (newSettings: Partial<UnifiedTimerSettings>) => {
    const updatedSettings = { ...localSettings, ...newSettings };
    setLocalSettings(updatedSettings);
    onSettingsChange(updatedSettings);
  };

  // 保存设置
  const saveSettings = () => {
    // 更新应用设置
    updateSettings({
      mode: localSettings.mode,
      workDuration: localSettings.classic.focusDuration,
      shortBreakDuration: localSettings.classic.breakDuration,
      longBreakDuration: localSettings.classic.longBreakDuration || 15,
      longBreakInterval: localSettings.classic.longBreakInterval || 4,
      autoStartBreaks: localSettings.autoStartBreaks,
      autoStartPomodoros: localSettings.autoStartWork,
      soundEnabled: localSettings.soundEnabled,
      notificationsEnabled: localSettings.notificationEnabled,
      theme: localSettings.theme,
      accentColor: localSettings.accentColor || '#3b82f6',
      fontSize: localSettings.fontSize || 'medium',
      showMicroBreakReminders: localSettings.classic.enableMicroBreaks || false
    });

    // 保存音效设置
    soundService.saveVolumeSettings({
      master: localSettings.volume,
      notification: localSettings.volume,
      ambient: 0,
      fadeInDuration: 0.5,
      fadeOutDuration: 0.5
    });

    if (onClose) onClose();
  };

  // 重置设置
  const resetSettings = () => {
    if (confirm('确定要重置所有设置吗？这将恢复默认设置。')) {
      // 重置为默认设置
      const defaultSettings: UnifiedTimerSettings = {
        mode: 'classic',
        classic: {
          focusDuration: 25,
          breakDuration: 5,
          longBreakDuration: 15,
          longBreakInterval: 4,
          microBreakMinInterval: 5,
          microBreakMaxInterval: 15,
          microBreakDuration: 1,
          enableMicroBreaks: false
        },
        smart: {
          focusDuration: 25,
          breakDuration: 5,
          enableMicroBreaks: false,
          microBreakMinInterval: 5,
          microBreakMaxInterval: 15,
          microBreakMinDuration: 1,
          microBreakMaxDuration: 3,
          enableAdaptiveAdjustment: false,
          adaptiveFactorFocus: 1.0,
          adaptiveFactorBreak: 1.0,
          enableCircadianOptimization: false,
          peakFocusHours: [9, 10, 11, 14, 15, 16],
          lowEnergyHours: [13, 15],
          maxContinuousFocusTime: 120,
          forcedBreakThreshold: 150
        },
        notificationEnabled: true,
        volume: 80,
        soundEnabled: true,
        theme: 'system',
        accentColor: '#3b82f6',
        autoStartBreaks: true,
        autoStartWork: false,
        fontSize: 'medium'
      };

      setLocalSettings(defaultSettings);
      onSettingsChange(defaultSettings);
    }
  };

  return (
    <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">设置</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={resetSettings}>
            重置设置
          </Button>
          <Button onClick={saveSettings}>
            保存设置
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              关闭
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">通用</TabsTrigger>
          <TabsTrigger value="timer">计时器</TabsTrigger>
          <TabsTrigger value="notifications">通知</TabsTrigger>
          <TabsTrigger value="appearance">外观</TabsTrigger>
          <TabsTrigger value="shortcuts">快捷键</TabsTrigger>
        </TabsList>

        {/* 通用设置标签页 */}
        <TabsContent value="general" className="space-y-6">
          <GeneralSettings
            settings={localSettings}
            onSettingsChange={handleSettingsChange}
          />
        </TabsContent>

        {/* 计时器设置标签页 */}
        <TabsContent value="timer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>计时器模式</CardTitle>
              <CardDescription>
                选择您偏好的计时器模式
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">计时器模式</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {localSettings.mode === 'classic' 
                      ? '经典番茄工作法：固定时长的工作和休息周期' 
                      : '智能模式：根据您的专注状态自动调整时长'}
                  </p>
                </div>
                <Switch
                  checked={localSettings.mode === 'smart'}
                  onCheckedChange={(checked) => 
                    handleSettingsChange({ mode: checked ? 'smart' : 'classic' })
                  }
                />
              </div>

              {/* 经典模式设置 */}
              {localSettings.mode === 'classic' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="focusDuration">专注时长（分钟）</Label>
                      <Input
                        id="focusDuration"
                        type="number"
                        min="1"
                        max="60"
                        value={localSettings.classic.focusDuration}
                        onChange={(e) => 
                          handleSettingsChange({
                            classic: {
                              ...localSettings.classic,
                              focusDuration: parseInt(e.target.value) || 25
                            }
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="breakDuration">休息时长（分钟）</Label>
                      <Input
                        id="breakDuration"
                        type="number"
                        min="1"
                        max="30"
                        value={localSettings.classic.breakDuration}
                        onChange={(e) => 
                          handleSettingsChange({
                            classic: {
                              ...localSettings.classic,
                              breakDuration: parseInt(e.target.value) || 5
                            }
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="longBreakDuration">长休息时长（分钟）</Label>
                      <Input
                        id="longBreakDuration"
                        type="number"
                        min="5"
                        max="60"
                        value={localSettings.classic.longBreakDuration || 15}
                        onChange={(e) => 
                          handleSettingsChange({
                            classic: {
                              ...localSettings.classic,
                              longBreakDuration: parseInt(e.target.value) || 15
                            }
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="longBreakInterval">长休息间隔</Label>
                      <Input
                        id="longBreakInterval"
                        type="number"
                        min="2"
                        max="10"
                        value={localSettings.classic.longBreakInterval || 4}
                        onChange={(e) => 
                          handleSettingsChange({
                            classic: {
                              ...localSettings.classic,
                              longBreakInterval: parseInt(e.target.value) || 4
                            }
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">微休息提醒</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        在专注期间定期提醒您进行短暂休息
                      </p>
                    </div>
                    <Switch
                      checked={localSettings.classic.enableMicroBreaks || false}
                      onCheckedChange={(checked) => 
                        handleSettingsChange({
                          classic: {
                            ...localSettings.classic,
                            enableMicroBreaks: checked
                          }
                        })
                      }
                    />
                  </div>

                  {localSettings.classic.enableMicroBreaks && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="microBreakMinInterval">最短间隔（分钟）</Label>
                        <Input
                          id="microBreakMinInterval"
                          type="number"
                          min="1"
                          max="30"
                          value={localSettings.classic.microBreakMinInterval || 5}
                          onChange={(e) => 
                            handleSettingsChange({
                              classic: {
                                ...localSettings.classic,
                                microBreakMinInterval: parseInt(e.target.value) || 5
                              }
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="microBreakMaxInterval">最长间隔（分钟）</Label>
                        <Input
                          id="microBreakMaxInterval"
                          type="number"
                          min="1"
                          max="60"
                          value={localSettings.classic.microBreakMaxInterval || 15}
                          onChange={(e) => 
                            handleSettingsChange({
                              classic: {
                                ...localSettings.classic,
                                microBreakMaxInterval: parseInt(e.target.value) || 15
                              }
                            })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 智能模式设置 */}
              {localSettings.mode === 'smart' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smartFocusDuration">默认专注时长（分钟）</Label>
                      <Input
                        id="smartFocusDuration"
                        type="number"
                        min="5"
                        max="120"
                        value={localSettings.smart.focusDuration}
                        onChange={(e) => 
                          handleSettingsChange({
                            smart: {
                              ...localSettings.smart,
                              focusDuration: parseInt(e.target.value) || 25
                            }
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="smartBreakDuration">默认休息时长（分钟）</Label>
                      <Input
                        id="smartBreakDuration"
                        type="number"
                        min="1"
                        max="30"
                        value={localSettings.smart.breakDuration}
                        onChange={(e) => 
                          handleSettingsChange({
                            smart: {
                              ...localSettings.smart,
                              breakDuration: parseInt(e.target.value) || 5
                            }
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">自适应调整</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        根据您的专注状态自动调整时长
                      </p>
                    </div>
                    <Switch
                      checked={localSettings.smart.enableAdaptiveAdjustment || false}
                      onCheckedChange={(checked) => 
                        handleSettingsChange({
                          smart: {
                            ...localSettings.smart,
                            enableAdaptiveAdjustment: checked
                          }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">昼夜节律优化</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        根据一天中的时间优化专注时长
                      </p>
                    </div>
                    <Switch
                      checked={localSettings.smart.enableCircadianOptimization || false}
                      onCheckedChange={(checked) => 
                        handleSettingsChange({
                          smart: {
                            ...localSettings.smart,
                            enableCircadianOptimization: checked
                          }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">微休息提醒</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        在专注期间定期提醒您进行短暂休息
                      </p>
                    </div>
                    <Switch
                      checked={localSettings.smart.enableMicroBreaks || false}
                      onCheckedChange={(checked) => 
                        handleSettingsChange({
                          smart: {
                            ...localSettings.smart,
                            enableMicroBreaks: checked
                          }
                        })
                      }
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">自动开始休息</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    专注结束后自动开始休息
                  </p>
                </div>
                <Switch
                  checked={localSettings.autoStartBreaks}
                  onCheckedChange={(checked) => 
                    handleSettingsChange({ autoStartBreaks: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">自动开始专注</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    休息结束后自动开始专注
                  </p>
                </div>
                <Switch
                  checked={localSettings.autoStartWork}
                  onCheckedChange={(checked) => 
                    handleSettingsChange({ autoStartWork: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 通知设置标签页 */}
        <TabsContent value="notifications" className="space-y-6">
          <NotificationSettings
            notificationEnabled={localSettings.notificationEnabled}
            onNotificationEnabledChange={(enabled) => 
              handleSettingsChange({ notificationEnabled: enabled })
            }
            soundEnabled={localSettings.soundEnabled}
            onSoundEnabledChange={(enabled) => 
              handleSettingsChange({ soundEnabled: enabled })
            }
          />

          <Card>
            <CardHeader>
              <CardTitle>音量设置</CardTitle>
              <CardDescription>
                调整通知音效的音量
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <Label htmlFor="volume">主音量</Label>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {localSettings.volume}%
                  </span>
                </div>
                <Slider
                  id="volume"
                  min={0}
                  max={100}
                  step={1}
                  value={[localSettings.volume]}
                  onValueChange={(value) => 
                    handleSettingsChange({ volume: value[0] })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <EnhancedSoundManager onSoundChange={() => {}} />
        </TabsContent>

        {/* 外观设置标签页 */}
        <TabsContent value="appearance" className="space-y-6">
          <AppearanceSettings
            settings={localSettings}
            onSettingsChange={handleSettingsChange}
          />
        </TabsContent>

        {/* 快捷键设置标签页 */}
        <TabsContent value="shortcuts" className="space-y-6">
          <ShortcutSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedSettings;
