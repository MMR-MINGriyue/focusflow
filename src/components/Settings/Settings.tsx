import React from 'react';
import { TimerSettings } from '../../stores/timerStore';
import { Switch } from '../ui/Switch';
import { Slider } from '../ui/Slider';
import { Volume2, Bell, Clock } from 'lucide-react';

interface SettingsProps extends TimerSettings {
  onSettingsChange: (settings: TimerSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({
  focusDuration = 90,
  breakDuration = 20,
  microBreakMinInterval = 10,
  microBreakMaxInterval = 30,
  microBreakDuration = 3,
  soundEnabled = true,
  notificationEnabled = true,
  volume = 0.5,
  onSettingsChange,
}) => {
  const handleSliderChange = (name: keyof TimerSettings, value: number) => {
    onSettingsChange({
      focusDuration,
      breakDuration,
      microBreakMinInterval,
      microBreakMaxInterval,
      microBreakDuration,
      soundEnabled,
      notificationEnabled,
      volume,
      [name]: value,
    });
  };

  const handleSwitchChange = (name: keyof TimerSettings, checked: boolean) => {
    onSettingsChange({
      focusDuration,
      breakDuration,
      microBreakMinInterval,
      microBreakMaxInterval,
      microBreakDuration,
      soundEnabled,
      notificationEnabled,
      volume,
      [name]: checked,
    });
  };

  return (
    <div className="space-y-6">
      {/* 时间设置 */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">时间设置</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              专注时长: {focusDuration} 分钟
            </label>
            <Slider
              value={[focusDuration]}
              onValueChange={(value) => handleSliderChange('focusDuration', value[0])}
              max={240}
              min={15}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>15分钟</span>
              <span>240分钟</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              休息时长: {breakDuration} 分钟
            </label>
            <Slider
              value={[breakDuration]}
              onValueChange={(value) => handleSliderChange('breakDuration', value[0])}
              max={60}
              min={5}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>5分钟</span>
              <span>60分钟</span>
            </div>
          </div>
        </div>
      </div>

      {/* 微休息设置 */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-green-500" />
          <h3 className="text-lg font-semibold">微休息设置</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              最小间隔: {microBreakMinInterval} 分钟
            </label>
            <Slider
              value={[microBreakMinInterval]}
              onValueChange={(value) => handleSliderChange('microBreakMinInterval', value[0])}
              max={microBreakMaxInterval - 1}
              min={5}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              最大间隔: {microBreakMaxInterval} 分钟
            </label>
            <Slider
              value={[microBreakMaxInterval]}
              onValueChange={(value) => handleSliderChange('microBreakMaxInterval', value[0])}
              max={60}
              min={microBreakMinInterval + 1}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              持续时间: {microBreakDuration} 分钟
            </label>
            <Slider
              value={[microBreakDuration]}
              onValueChange={(value) => handleSliderChange('microBreakDuration', value[0])}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* 音频和通知设置 */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-semibold">音频和通知</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium text-gray-700">启用音效</label>
              <p className="text-xs text-gray-500">播放提示音和背景音</p>
            </div>
            <Switch
              checked={soundEnabled}
              onCheckedChange={(checked) => handleSwitchChange('soundEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium text-gray-700">桌面通知</label>
              <p className="text-xs text-gray-500">显示系统通知提醒</p>
            </div>
            <Switch
              checked={notificationEnabled}
              onCheckedChange={(checked) => handleSwitchChange('notificationEnabled', checked)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Volume2 className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">
                音量: {Math.round(volume * 100)}%
              </label>
            </div>
            <Slider
              value={[volume]}
              onValueChange={(value) => handleSliderChange('volume', value[0])}
              max={1}
              min={0}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>静音</span>
              <span>最大</span>
            </div>
          </div>
        </div>
      </div>

      {/* 预设配置 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">快速配置</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => onSettingsChange({
              focusDuration: 25,
              breakDuration: 5,
              microBreakMinInterval: 5,
              microBreakMaxInterval: 15,
              microBreakDuration: 2,
              soundEnabled,
              notificationEnabled,
              volume,
            })}
            className="p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="font-medium">番茄工作法</div>
            <div className="text-sm text-gray-500">25分钟专注 + 5分钟休息</div>
          </button>
          
          <button
            type="button"
            onClick={() => onSettingsChange({
              focusDuration: 90,
              breakDuration: 20,
              microBreakMinInterval: 10,
              microBreakMaxInterval: 30,
              microBreakDuration: 3,
              soundEnabled,
              notificationEnabled,
              volume,
            })}
            className="p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="font-medium">深度专注</div>
            <div className="text-sm text-gray-500">90分钟专注 + 20分钟休息</div>
          </button>
          
          <button
            type="button"
            onClick={() => onSettingsChange({
              focusDuration: 45,
              breakDuration: 15,
              microBreakMinInterval: 8,
              microBreakMaxInterval: 20,
              microBreakDuration: 3,
              soundEnabled,
              notificationEnabled,
              volume,
            })}
            className="p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="font-medium">平衡模式</div>
            <div className="text-sm text-gray-500">45分钟专注 + 15分钟休息</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
