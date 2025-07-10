import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, Settings, RotateCcw, Save, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { soundService, CustomSound } from '../../services/sound';

interface SoundMappingConfigProps {
  onMappingChange?: () => void;
}

interface EventTypeConfig {
  key: string;
  name: string;
  description: string;
  category: CustomSound['category'];
  defaultSound: string;
  icon: React.ReactNode;
  color: string;
}

const SoundMappingConfig: React.FC<SoundMappingConfigProps> = ({ onMappingChange }) => {
  const [sounds] = useState<CustomSound[]>(soundService.getAllSounds());
  const [soundMappings, setSoundMappings] = useState(soundService.getSoundMappings());
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalMappings, setOriginalMappings] = useState(soundService.getSoundMappings());

  // 事件类型配置
  const eventTypes: EventTypeConfig[] = [
    {
      key: 'focusStart',
      name: '专注开始',
      description: '开始专注时播放的音效',
      category: 'notification',
      defaultSound: 'focusStart',
      icon: <div className="w-3 h-3 bg-green-500 rounded-full"></div>,
      color: 'border-green-200 bg-green-50'
    },
    {
      key: 'breakStart',
      name: '休息开始',
      description: '开始休息时播放的音效',
      category: 'notification',
      defaultSound: 'breakStart',
      icon: <div className="w-3 h-3 bg-blue-500 rounded-full"></div>,
      color: 'border-blue-200 bg-blue-50'
    },
    {
      key: 'microBreak',
      name: '微休息',
      description: '微休息时播放的音效',
      category: 'notification',
      defaultSound: 'microBreak',
      icon: <div className="w-3 h-3 bg-purple-500 rounded-full"></div>,
      color: 'border-purple-200 bg-purple-50'
    },
    {
      key: 'notification',
      name: '通用通知',
      description: '其他通知时播放的音效',
      category: 'notification',
      defaultSound: 'notification',
      icon: <AlertCircle className="w-3 h-3 text-orange-500" />,
      color: 'border-orange-200 bg-orange-50'
    },
    {
      key: 'whiteNoise',
      name: '背景音',
      description: '专注时的背景环境音',
      category: 'ambient',
      defaultSound: 'whiteNoise',
      icon: <Volume2 className="w-3 h-3 text-gray-500" />,
      color: 'border-gray-200 bg-gray-50'
    }
  ];

  useEffect(() => {
    // 检查是否有变化
    const hasChanges = JSON.stringify(soundMappings) !== JSON.stringify(originalMappings);
    setHasChanges(hasChanges);
  }, [soundMappings, originalMappings]);

  // 播放音效预览
  const playSound = (soundId: string) => {
    if (playingSound === soundId) {
      soundService.stop(soundId as any);
      setPlayingSound(null);
    } else {
      if (playingSound) {
        soundService.stop(playingSound as any);
      }
      soundService.play(soundId as any);
      setPlayingSound(soundId);
      
      // 非循环音效自动停止状态
      if (soundId !== 'whiteNoise') {
        setTimeout(() => setPlayingSound(null), 3000);
      }
    }
  };

  // 设置音效映射
  const setSoundMapping = (eventType: string, soundId: string) => {
    setSoundMappings(prev => ({
      ...prev,
      [eventType]: soundId
    }));
  };

  // 重置为默认映射
  const resetToDefaults = () => {
    const defaultMappings: { [key: string]: string } = {};
    eventTypes.forEach(eventType => {
      defaultMappings[eventType.key] = eventType.defaultSound;
    });
    setSoundMappings(defaultMappings);
  };

  // 保存映射配置
  const saveMappings = () => {
    Object.entries(soundMappings).forEach(([event, soundId]) => {
      soundService.setSoundMapping(event, soundId);
    });
    setOriginalMappings({ ...soundMappings });
    setHasChanges(false);
    onMappingChange?.();
  };

  // 取消更改
  const cancelChanges = () => {
    setSoundMappings({ ...originalMappings });
    setHasChanges(false);
  };

  // 按类别获取音效
  const getSoundsByCategory = (category: CustomSound['category']) => {
    return sounds.filter(sound => sound.category === category);
  };

  // 获取音效信息
  const getSoundInfo = (soundId: string) => {
    return sounds.find(sound => sound.id === soundId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">音效映射配置</h3>
        </div>
        <div className="flex items-center space-x-2">
          {hasChanges && (
            <>
              <Button
                type="button"
                onClick={cancelChanges}
                size="sm"
                variant="outline"
                className="text-gray-600"
              >
                取消
              </Button>
              <Button
                type="button"
                onClick={saveMappings}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-1"
              >
                <Save className="h-3 w-3" />
                <span>保存配置</span>
              </Button>
            </>
          )}
          <Button
            type="button"
            onClick={resetToDefaults}
            size="sm"
            variant="outline"
            className="flex items-center space-x-1"
          >
            <RotateCcw className="h-3 w-3" />
            <span>重置默认</span>
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-yellow-800">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">有未保存的更改</span>
          </div>
          <p className="text-xs text-yellow-700 mt-1">
            您对音效映射进行了修改，请记得保存配置。
          </p>
        </div>
      )}

      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700">事件音效映射</h4>
        <div className="grid gap-4">
          {eventTypes.map((eventType) => {
            const currentSoundId = soundMappings[eventType.key] || eventType.defaultSound;
            const currentSound = getSoundInfo(currentSoundId);
            const availableSounds = getSoundsByCategory(eventType.category);

            return (
              <div key={eventType.key} className={`border rounded-lg p-4 ${eventType.color}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {eventType.icon}
                    <div>
                      <div className="font-medium text-gray-700">{eventType.name}</div>
                      <div className="text-xs text-gray-500">{eventType.description}</div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => playSound(currentSoundId)}
                    size="sm"
                    variant="outline"
                    className="flex items-center space-x-1"
                  >
                    {playingSound === currentSoundId ? (
                      <Pause className="h-3 w-3" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                    <span>预览</span>
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-600">
                    当前音效：{currentSound?.name || '未知音效'}
                    {currentSound?.type === 'custom' && (
                      <span className="ml-1 text-blue-600">(自定义)</span>
                    )}
                  </label>
                  <select
                    value={currentSoundId}
                    onChange={(e) => setSoundMapping(eventType.key, e.target.value)}
                    className="w-full p-2 border rounded text-sm bg-white"
                    aria-label={`选择${eventType.name}的音效`}
                  >
                    {availableSounds.map((sound) => (
                      <option key={sound.id} value={sound.id}>
                        {sound.name} {sound.type === 'custom' ? '(自定义)' : '(默认)'}
                        {sound.description && ` - ${sound.description}`}
                      </option>
                    ))}
                  </select>
                  {availableSounds.length === 0 && (
                    <p className="text-xs text-red-500">
                      没有可用的{eventType.category === 'notification' ? '通知' : '环境'}音效
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
        <p><strong>配置说明：</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>每个事件可以配置不同的音效</li>
          <li>通知类音效适用于短暂的提示音</li>
          <li>环境音适用于长时间循环播放</li>
          <li>修改后需要点击"保存配置"才会生效</li>
          <li>可以随时重置为默认配置</li>
        </ul>
      </div>
    </div>
  );
};

export default SoundMappingConfig;
