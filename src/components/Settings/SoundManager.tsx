import React, { useState, useRef } from 'react';
import { Upload, Trash2, Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { soundService, CustomSound } from '../../services/sound';

interface SoundManagerProps {
  onSoundChange?: () => void;
}

const SoundManager: React.FC<SoundManagerProps> = ({ onSoundChange }) => {
  const [sounds, setSounds] = useState<CustomSound[]>(soundService.getAllSounds());
  const [soundMappings, setSoundMappings] = useState(soundService.getSoundMappings());
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const eventTypes = [
    { key: 'focusStart', name: '专注开始', description: '开始专注时播放' },
    { key: 'breakStart', name: '休息开始', description: '开始休息时播放' },
    { key: 'microBreak', name: '微休息', description: '微休息时播放' },
    { key: 'notification', name: '通知提示', description: '通用通知音' },
    { key: 'whiteNoise', name: '白噪音', description: '背景环境音（循环）' },
  ];

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

  // 上传自定义音效
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, category: CustomSound['category']) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('audio/')) {
      alert('请选择音频文件');
      return;
    }

    // 验证文件大小 (最大 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('文件大小不能超过 5MB');
      return;
    }

    setUploading(true);
    try {
      const soundId = await soundService.addCustomSound(file, file.name, category);
      const updatedSounds = soundService.getAllSounds();
      setSounds(updatedSounds);
      onSoundChange?.();
      
      // 清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to upload sound:', error);
      alert('上传音效失败，请检查文件格式');
    } finally {
      setUploading(false);
    }
  };

  // 删除自定义音效
  const deleteSound = (soundId: string) => {
    if (confirm('确定要删除这个音效吗？')) {
      soundService.removeCustomSound(soundId);
      const updatedSounds = soundService.getAllSounds();
      const updatedMappings = soundService.getSoundMappings();
      setSounds(updatedSounds);
      setSoundMappings(updatedMappings);
      onSoundChange?.();
    }
  };

  // 设置音效映射
  const setSoundMapping = (eventType: string, soundId: string) => {
    soundService.setSoundMapping(eventType, soundId);
    const updatedMappings = soundService.getSoundMappings();
    setSoundMappings(updatedMappings);
    onSoundChange?.();
  };

  // 按类别分组音效
  const getSoundsByCategory = (category: CustomSound['category']) => {
    return sounds.filter(sound => sound.category === category);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Volume2 className="h-5 w-5 text-purple-500" />
        <h3 className="text-lg font-semibold">音效管理</h3>
      </div>

      {/* 事件音效映射 */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700">事件音效设置</h4>
        {eventTypes.map((eventType) => (
          <div key={eventType.key} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-medium text-gray-700">{eventType.name}</div>
                <div className="text-xs text-gray-500">{eventType.description}</div>
              </div>
              <Button
                type="button"
                onClick={() => playSound(soundMappings[eventType.key] || eventType.key)}
                size="sm"
                variant="outline"
                className="flex items-center space-x-1"
              >
                {playingSound === (soundMappings[eventType.key] || eventType.key) ? (
                  <Pause className="h-3 w-3" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
                <span>预览</span>
              </Button>
            </div>
            
            {/* 音效选择 */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600">选择音效：</label>
              <select
                value={soundMappings[eventType.key] || eventType.key}
                onChange={(e) => setSoundMapping(eventType.key, e.target.value)}
                className="w-full p-2 border rounded text-sm"
              >
                {getSoundsByCategory(eventType.category as CustomSound['category']).map((sound) => (
                  <option key={sound.id} value={sound.id}>
                    {sound.name} {sound.type === 'custom' ? '(自定义)' : '(默认)'}
                  </option>
                ))}
              </select>
            </div>

            {/* 上传自定义音效 */}
            <div className="mt-3 pt-3 border-t">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={(e) => handleFileUpload(e, eventType.category as CustomSound['category'])}
                className="hidden"
                id={`upload-${eventType.key}`}
              />
              <label
                htmlFor={`upload-${eventType.key}`}
                className="inline-flex items-center space-x-2 px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded cursor-pointer hover:bg-blue-100 transition-colors"
              >
                <Upload className="h-3 w-3" />
                <span>{uploading ? '上传中...' : '上传自定义音效'}</span>
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* 自定义音效管理 */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700">自定义音效库</h4>
        <div className="grid grid-cols-1 gap-3">
          {sounds.filter(sound => sound.type === 'custom').map((sound) => (
            <div key={sound.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
              <div className="flex-1">
                <div className="font-medium text-gray-700">{sound.name}</div>
                <div className="text-xs text-gray-500">类别: {eventTypes.find(et => et.key === sound.category)?.name}</div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  onClick={() => playSound(sound.id)}
                  size="sm"
                  variant="outline"
                  className="flex items-center space-x-1"
                >
                  {playingSound === sound.id ? (
                    <Pause className="h-3 w-3" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={() => deleteSound(sound.id)}
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          {sounds.filter(sound => sound.type === 'custom').length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Volume2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>还没有自定义音效</p>
              <p className="text-xs">在上方为不同事件上传自定义音效</p>
            </div>
          )}
        </div>
      </div>

      <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
        <p><strong>提示：</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>支持 MP3、WAV、OGG 等常见音频格式</li>
          <li>文件大小限制为 5MB</li>
          <li>建议音效时长在 1-5 秒之间</li>
          <li>白噪音可以是较长的循环音频</li>
        </ul>
      </div>
    </div>
  );
};

export default SoundManager;
