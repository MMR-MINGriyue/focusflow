import React, { useState, useRef } from 'react';
import { Upload, Trash2, Play, Pause, Volume2, Edit3, Info, Download } from 'lucide-react';
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
  const [editingSound, setEditingSound] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [showStorageInfo, setShowStorageInfo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const eventTypes = [
    { key: 'focusStart', name: '专注开始', description: '开始专注时播放', category: 'notification' as CustomSound['category'] },
    { key: 'breakStart', name: '休息开始', description: '开始休息时播放', category: 'notification' as CustomSound['category'] },
    { key: 'microBreak', name: '微休息', description: '微休息时播放', category: 'notification' as CustomSound['category'] },
    { key: 'notification', name: '通知提示', description: '通用通知音', category: 'notification' as CustomSound['category'] },
    { key: 'whiteNoise', name: '白噪音', description: '背景环境音（循环）', category: 'ambient' as CustomSound['category'] },
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

    setUploading(true);
    try {
      await soundService.addCustomSound(file, file.name, category);
      const updatedSounds = soundService.getAllSounds();
      setSounds(updatedSounds);
      onSoundChange?.();

      // 清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      alert('音效上传成功！');
    } catch (error) {
      console.error('Failed to upload sound:', error);
      alert(`上传失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setUploading(false);
    }
  };

  // 开始编辑音效
  const startEditSound = (sound: CustomSound) => {
    setEditingSound(sound.id);
    setEditName(sound.name);
    setEditDescription(sound.description || '');
  };

  // 保存编辑
  const saveEdit = () => {
    if (!editingSound) return;

    soundService.renameCustomSound(editingSound, editName);
    soundService.updateSoundDescription(editingSound, editDescription);

    const updatedSounds = soundService.getAllSounds();
    setSounds(updatedSounds);
    setEditingSound(null);
    onSoundChange?.();
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingSound(null);
    setEditName('');
    setEditDescription('');
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

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化时长
  const formatDuration = (seconds: number): string => {
    if (!seconds) return '--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 导出音效配置
  const exportConfig = () => {
    const config = soundService.exportSoundConfig();
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focusflow-sound-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 获取存储信息
  const storageInfo = soundService.getStorageInfo();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Volume2 className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-semibold">音效管理</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            onClick={() => setShowStorageInfo(!showStorageInfo)}
            size="sm"
            variant="outline"
            className="flex items-center space-x-1"
          >
            <Info className="h-3 w-3" />
            <span>存储信息</span>
          </Button>
          <Button
            type="button"
            onClick={exportConfig}
            size="sm"
            variant="outline"
            className="flex items-center space-x-1"
          >
            <Download className="h-3 w-3" />
            <span>导出配置</span>
          </Button>
        </div>
      </div>

      {/* 存储信息 */}
      {showStorageInfo && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">存储使用情况</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">总音效数：</span>
              <span className="font-medium">{storageInfo.totalSounds}</span>
            </div>
            <div>
              <span className="text-gray-500">自定义音效：</span>
              <span className="font-medium">{storageInfo.customSounds}</span>
            </div>
            <div>
              <span className="text-gray-500">占用空间：</span>
              <span className="font-medium">{formatFileSize(storageInfo.totalSize)}</span>
            </div>
          </div>
        </div>
      )}

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
                aria-label={`选择${eventType.name}的音效`}
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
            <div key={sound.id} className="border rounded-lg bg-gray-50">
              {editingSound === sound.id ? (
                // 编辑模式
                <div className="p-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">音效名称</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full p-2 border rounded text-sm"
                      placeholder="输入音效名称"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">描述</label>
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full p-2 border rounded text-sm"
                      placeholder="输入音效描述"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      onClick={saveEdit}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      保存
                    </Button>
                    <Button
                      type="button"
                      onClick={cancelEdit}
                      size="sm"
                      variant="outline"
                    >
                      取消
                    </Button>
                  </div>
                </div>
              ) : (
                // 显示模式
                <div className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-700">{sound.name}</div>
                      {sound.description && (
                        <div className="text-xs text-gray-500 mt-1">{sound.description}</div>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>类别: {sound.category === 'notification' ? '通知音' : '环境音'}</span>
                        {sound.duration && <span>时长: {formatDuration(sound.duration)}</span>}
                        {sound.size && <span>大小: {formatFileSize(sound.size)}</span>}
                        {sound.uploadDate && (
                          <span>上传: {new Date(sound.uploadDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-3">
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
                        onClick={() => startEditSound(sound)}
                        size="sm"
                        variant="outline"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit3 className="h-3 w-3" />
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
                </div>
              )}
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
        <p><strong>使用提示：</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>支持 MP3、WAV、OGG 等常见音频格式</li>
          <li>文件大小限制为 10MB</li>
          <li>通知音建议时长在 1-5 秒之间</li>
          <li>环境音可以是较长的循环音频</li>
          <li>点击编辑按钮可以修改音效名称和描述</li>
          <li>可以导出配置文件备份您的音效设置</li>
        </ul>
      </div>
    </div>
  );
};

export default SoundManager;
