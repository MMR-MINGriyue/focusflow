import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Volume1, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Slider } from '../ui/Slider';
import { soundService, VolumeSettings } from '../../services/sound';

interface SoundVolumeControlProps {
  onVolumeChange?: (volume: number) => void;
}

// VolumeSettings 接口现在从 soundService 导入

const SoundVolumeControl: React.FC<SoundVolumeControlProps> = ({ onVolumeChange }) => {
  const [volumeSettings, setVolumeSettings] = useState<VolumeSettings>(soundService.getVolumeSettings());
  const [isMuted, setIsMuted] = useState(soundService.isMutedState());
  const [playingTest, setPlayingTest] = useState<string | null>(null);

  useEffect(() => {
    onVolumeChange?.(volumeSettings.master);
  }, [volumeSettings.master, onVolumeChange]);

  const updateVolumeSetting = (key: keyof VolumeSettings, value: number) => {
    const newSettings = { ...volumeSettings, [key]: value };
    setVolumeSettings(newSettings);

    // 同步到 soundService
    if (key === 'master') {
      soundService.setMasterVolume(value);
    } else if (key === 'notification' || key === 'ambient') {
      soundService.setCategoryVolume(key, value);
    } else if (key === 'fadeInDuration' || key === 'fadeOutDuration') {
      soundService.setFadeDuration(
        key === 'fadeInDuration' ? value : volumeSettings.fadeInDuration,
        key === 'fadeOutDuration' ? value : volumeSettings.fadeOutDuration
      );
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    soundService.setMuted(newMuted);
  };

  const resetToDefaults = () => {
    const defaultSettings: VolumeSettings = {
      master: 0.7,
      notification: 0.5,
      ambient: 0.3,
      fadeInDuration: 500,
      fadeOutDuration: 500
    };

    setVolumeSettings(defaultSettings);
    setIsMuted(false);

    // 同步到 soundService
    soundService.setMasterVolume(defaultSettings.master);
    soundService.setCategoryVolume('notification', defaultSettings.notification);
    soundService.setCategoryVolume('ambient', defaultSettings.ambient);
    soundService.setFadeDuration(defaultSettings.fadeInDuration, defaultSettings.fadeOutDuration);
    soundService.setMuted(false);
  };

  const testSound = (soundType: 'notification' | 'ambient') => {
    const testSounds = {
      notification: 'notification',
      ambient: 'whiteNoise'
    };

    const soundId = testSounds[soundType];
    
    if (playingTest === soundId) {
      soundService.stop(soundId as any);
      setPlayingTest(null);
    } else {
      if (playingTest) {
        soundService.stop(playingTest as any);
      }
      
      // 设置测试音量
      const volume = isMuted ? 0 : volumeSettings.master * volumeSettings[soundType];
      soundService.setVolume(soundId as any, volume);
      soundService.play(soundId as any);
      setPlayingTest(soundId);
      
      // 非循环音效自动停止
      if (soundType === 'notification') {
        setTimeout(() => setPlayingTest(null), 3000);
      }
    }
  };

  const getVolumeIcon = (volume: number) => {
    if (isMuted || volume === 0) return <VolumeX className="h-4 w-4" />;
    if (volume < 0.5) return <Volume1 className="h-4 w-4" />;
    return <Volume2 className="h-4 w-4" />;
  };

  const formatDuration = (ms: number) => {
    return `${ms}ms`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Volume2 className="h-5 w-5 text-green-500" />
          <h3 className="text-lg font-semibold">音量控制</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            onClick={toggleMute}
            size="sm"
            variant="outline"
            className={`flex items-center space-x-1 ${isMuted ? 'text-red-600' : ''}`}
          >
            {getVolumeIcon(volumeSettings.master)}
            <span>{isMuted ? '已静音' : '静音'}</span>
          </Button>
          <Button
            type="button"
            onClick={resetToDefaults}
            size="sm"
            variant="outline"
            className="flex items-center space-x-1"
          >
            <RotateCcw className="h-3 w-3" />
            <span>重置</span>
          </Button>
        </div>
      </div>

      {/* 主音量控制 */}
      <div className="space-y-4">
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              {getVolumeIcon(volumeSettings.master)}
              <span className="font-medium text-gray-700">主音量</span>
            </div>
            <span className="text-sm text-gray-500">
              {Math.round(volumeSettings.master * 100)}%
            </span>
          </div>
          <Slider
            value={[isMuted ? 0 : volumeSettings.master * 100]}
            onValueChange={(value) => updateVolumeSetting('master', value[0] / 100)}
            max={100}
            step={1}
            className="w-full"
            disabled={isMuted}
          />
          <p className="text-xs text-gray-500 mt-2">
            控制所有音效的整体音量
          </p>
        </div>

        {/* 分类音量控制 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 通知音量 */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="font-medium text-gray-700">通知音效</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {Math.round(volumeSettings.notification * 100)}%
                </span>
                <Button
                  type="button"
                  onClick={() => testSound('notification')}
                  size="sm"
                  variant="outline"
                  className="flex items-center space-x-1"
                >
                  {playingTest === 'notification' ? (
                    <Pause className="h-3 w-3" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
            <Slider
              value={[volumeSettings.notification * 100]}
              onValueChange={(value) => updateVolumeSetting('notification', value[0] / 100)}
              max={100}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-2">
              专注开始、休息等提示音的音量
            </p>
          </div>

          {/* 环境音量 */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-gray-700">环境音效</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {Math.round(volumeSettings.ambient * 100)}%
                </span>
                <Button
                  type="button"
                  onClick={() => testSound('ambient')}
                  size="sm"
                  variant="outline"
                  className="flex items-center space-x-1"
                >
                  {playingTest === 'whiteNoise' ? (
                    <Pause className="h-3 w-3" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
            <Slider
              value={[volumeSettings.ambient * 100]}
              onValueChange={(value) => updateVolumeSetting('ambient', value[0] / 100)}
              max={100}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-2">
              白噪音等背景音效的音量
            </p>
          </div>
        </div>

        {/* 淡入淡出设置 */}
        <div className="border rounded-lg p-4">
          <h4 className="font-medium text-gray-700 mb-3">音效过渡</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                淡入时长: {formatDuration(volumeSettings.fadeInDuration)}
              </label>
              <Slider
                value={[volumeSettings.fadeInDuration]}
                onValueChange={(value) => updateVolumeSetting('fadeInDuration', value[0])}
                min={0}
                max={2000}
                step={100}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                淡出时长: {formatDuration(volumeSettings.fadeOutDuration)}
              </label>
              <Slider
                value={[volumeSettings.fadeOutDuration]}
                onValueChange={(value) => updateVolumeSetting('fadeOutDuration', value[0])}
                min={0}
                max={2000}
                step={100}
                className="w-full"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            控制音效开始和结束时的渐变效果
          </p>
        </div>
      </div>

      <div className="text-xs text-gray-500 bg-green-50 p-3 rounded">
        <p><strong>音量提示：</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>主音量控制所有音效的整体音量</li>
          <li>分类音量可以单独调节不同类型音效</li>
          <li>实际播放音量 = 主音量 × 分类音量</li>
          <li>淡入淡出可以让音效播放更加平滑</li>
          <li>点击测试按钮可以预览当前音量设置</li>
        </ul>
      </div>
    </div>
  );
};

export default SoundVolumeControl;
