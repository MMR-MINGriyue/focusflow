import React, { useState, useRef, useEffect } from 'react';
import { Upload, Trash2, Play, Pause, Volume2, Edit3, Info, Download, Plus, Save, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { soundService, CustomSound } from '../../services/soundService';
import { useConfirmDialog } from '../ui/ConfirmDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Switch } from '../ui/Switch';
import { Slider } from '../ui/Slider';

interface EnhancedSoundManagerProps {
  onSoundChange?: () => void;
}

/**
 * 增强版音效管理组件
 * 提供更完善的音效管理功能，包括上传、编辑、播放测试和音效映射
 */
const EnhancedSoundManager: React.FC<EnhancedSoundManagerProps> = ({ onSoundChange }) => {
  const [sounds, setSounds] = useState<CustomSound[]>(soundService.getAllSounds());
  const [soundMappings, setSoundMappings] = useState(soundService.getSoundMappings());
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingSound, setEditingSound] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [showStorageInfo, setShowStorageInfo] = useState(false);
  const [volumeSettings, setVolumeSettings] = useState(soundService.getVolumeSettings());
  const [selectedTab, setSelectedTab] = useState('sounds');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 确认对话框Hook
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();

  // 事件类型定义
  const eventTypes = [
    { key: 'focusStart', name: '专注开始', description: '开始专注时播放', category: 'notification' as CustomSound['category'] },
    { key: 'breakStart', name: '休息开始', description: '开始休息时播放', category: 'notification' as CustomSound['category'] },
    { key: 'microBreak', name: '微休息', description: '微休息时播放', category: 'notification' as CustomSound['category'] },
    { key: 'notification', name: '通知提示', description: '通用通知音', category: 'notification' as CustomSound['category'] },
    { key: 'focusEnd', name: '专注结束', description: '专注结束时播放', category: 'notification' as CustomSound['category'] },
    { key: 'breakEnd', name: '休息结束', description: '休息结束时播放', category: 'notification' as CustomSound['category'] },
    { key: 'achievement', name: '成就解锁', description: '解锁成就时播放', category: 'notification' as CustomSound['category'] },
    { key: 'ambient', name: '环境音', description: '专注时播放的环境音', category: 'ambient' as CustomSound['category'] },
  ];

  // 刷新音效列表
  const refreshSounds = () => {
    setSounds(soundService.getAllSounds());
    setSoundMappings(soundService.getSoundMappings());
    if (onSoundChange) onSoundChange();
  };

  // 播放音效
  const playSound = (soundId: string) => {
    if (playingSound) {
      soundService.stop(playingSound);
    }

    setPlayingSound(soundId);
    soundService.play(soundId, () => {
      setPlayingSound(null);
    });
  };

  // 停止播放
  const stopSound = () => {
    if (playingSound) {
      soundService.stop(playingSound);
      setPlayingSound(null);
    }
  };

  // 上传音效
  const handleUploadSound = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 处理文件选择
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploading(true);

    try {
      await soundService.uploadSound(file);
      refreshSounds();
    } catch (error) {
      console.error('上传音效失败:', error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 删除音效
  const handleDeleteSound = (soundId: string) => {
    showConfirmDialog(
      '确定要删除这个音效吗？删除后将无法恢复。',
      () => {
        soundService.deleteSound(soundId);
        refreshSounds();
      },
      {
        title: '删除音效',
        confirmText: '删除',
        cancelText: '取消'
      }
    );
  };

  // 开始编辑音效
  const startEditingSound = (sound: CustomSound) => {
    setEditingSound(sound.id);
    setEditName(sound.name);
    setEditDescription(sound.description || '');
  };

  // 保存编辑
  const saveEdit = () => {
    if (editingSound) {
      soundService.updateSound(editingSound, {
        name: editName,
        description: editDescription
      });
      refreshSounds();
      cancelEdit();
    }
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingSound(null);
    setEditName('');
    setEditDescription('');
  };

  // 更新音效映射
  const updateSoundMapping = (eventType: string, soundId: string) => {
    soundService.updateSoundMapping(eventType, soundId);
    setSoundMappings(soundService.getSoundMappings());
    if (onSoundChange) onSoundChange();
  };

  // 更新音量设置
  const updateVolumeSetting = (key: keyof typeof volumeSettings, value: number) => {
    const newSettings = { ...volumeSettings, [key]: value };
    soundService.saveVolumeSettings(newSettings);
    setVolumeSettings(newSettings);
  };

  // 测试事件音效
  const testEventSound = (eventType: string) => {
    const soundId = soundMappings[eventType];
    if (soundId) {
      playSound(soundId);
    }
  };

  // 下载音效
  const downloadSound = (sound: CustomSound) => {
    soundService.downloadSound(sound.id);
  };

  // 重置所有设置
  const resetAllSettings = () => {
    showConfirmDialog(
      '确定要重置所有音效设置吗？这将恢复默认设置并删除所有自定义音效。',
      () => {
        soundService.resetToDefaults();
        refreshSounds();
        setVolumeSettings(soundService.getVolumeSettings());
      },
      {
        title: '重置音效设置',
        confirmText: '重置',
        cancelText: '取消'
      }
    );
  };

  return (
    <div className="space-y-6">
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sounds">音效管理</TabsTrigger>
          <TabsTrigger value="mappings">音效映射</TabsTrigger>
          <TabsTrigger value="settings">音效设置</TabsTrigger>
        </TabsList>

        {/* 音效管理标签页 */}
        <TabsContent value="sounds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>音效库</span>
                <div className="flex space-x-2">
                  <Button onClick={handleUploadSound} disabled={uploading}>
                    <Upload className="h-4 w-4 mr-2" />
                    上传音效
                  </Button>
                  <Button variant="outline" onClick={() => setShowStorageInfo(!showStorageInfo)}>
                    <Info className="h-4 w-4 mr-2" />
                    存储信息
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                管理您的自定义音效，支持MP3、WAV、OGG等格式
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* 存储信息 */}
              {showStorageInfo && (
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h3 className="font-medium mb-2">存储信息</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">已用空间:</span>
                      <span className="ml-2">{soundService.getStorageInfo().usedSpace}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">可用空间:</span>
                      <span className="ml-2">{soundService.getStorageInfo().freeSpace}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">音效数量:</span>
                      <span className="ml-2">{sounds.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">最大文件大小:</span>
                      <span className="ml-2">{soundService.getStorageInfo().maxFileSize}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 文件上传输入 */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="audio/*"
                className="hidden"
              />

              {/* 音效列表 */}
              <div className="space-y-4">
                {sounds.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>暂无自定义音效</p>
                    <p className="text-sm mt-2">点击"上传音效"按钮添加您的第一个音效</p>
                  </div>
                ) : (
                  sounds.map((sound) => (
                    <div key={sound.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <Volume2 className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                        </div>
                        <div>
                          {editingSound === sound.id ? (
                            <div className="space-y-2">
                              <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="音效名称"
                                className="w-64"
                              />
                              <Input
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                placeholder="音效描述"
                                className="w-64"
                              />
                            </div>
                          ) : (
                            <div>
                              <h3 className="font-medium">{sound.name}</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {sound.description || '无描述'}
                              </p>
                              <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                <span>类型: {sound.type}</span>
                                <span>分类: {sound.category === 'notification' ? '通知' : '环境'}</span>
                                {sound.duration && <span>时长: {sound.duration}秒</span>}
                                {sound.size && <span>大小: {(sound.size / 1024).toFixed(2)}KB</span>}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {editingSound === sound.id ? (
                          <>
                            <Button size="sm" onClick={saveEdit}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit}>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => playSound(sound.id)}
                              disabled={playingSound === sound.id}
                            >
                              {playingSound === sound.id ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => startEditingSound(sound)}>
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => downloadSound(sound)}>
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteSound(sound.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 音效映射标签页 */}
        <TabsContent value="mappings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>音效映射</CardTitle>
              <CardDescription>
                为不同的事件设置对应的提示音效
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {eventTypes.map((event) => (
                  <div key={event.key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{event.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{event.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <select
                        value={soundMappings[event.key] || ''}
                        onChange={(e) => updateSoundMapping(event.key, e.target.value)}
                        className="px-3 py-2 border rounded-md w-48"
                      >
                        <option value="">无音效</option>
                        {sounds
                          .filter(sound => sound.category === event.category)
                          .map(sound => (
                            <option key={sound.id} value={sound.id}>
                              {sound.name}
                            </option>
                          ))}
                      </select>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testEventSound(event.key)}
                        disabled={!soundMappings[event.key]}
                      >
                        {playingSound === soundMappings[event.key] ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 音效设置标签页 */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>音效设置</CardTitle>
              <CardDescription>
                调整音效的播放设置和音量控制
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 主音量控制 */}
              <div className="space-y-2">
                <Label>主音量</Label>
                <div className="flex items-center space-x-4">
                  <Slider
                    value={[volumeSettings.master]}
                    onValueChange={(value) => updateVolumeSetting('master', value[0])}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <span className="w-12 text-right">{volumeSettings.master}%</span>
                </div>
              </div>

              {/* 通知音量控制 */}
              <div className="space-y-2">
                <Label>通知音量</Label>
                <div className="flex items-center space-x-4">
                  <Slider
                    value={[volumeSettings.notification]}
                    onValueChange={(value) => updateVolumeSetting('notification', value[0])}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <span className="w-12 text-right">{volumeSettings.notification}%</span>
                </div>
              </div>

              {/* 环境音量控制 */}
              <div className="space-y-2">
                <Label>环境音量</Label>
                <div className="flex items-center space-x-4">
                  <Slider
                    value={[volumeSettings.ambient]}
                    onValueChange={(value) => updateVolumeSetting('ambient', value[0])}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <span className="w-12 text-right">{volumeSettings.ambient}%</span>
                </div>
              </div>

              {/* 淡入淡出设置 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>淡入时长 (秒)</Label>
                  <div className="flex items-center space-x-4">
                    <Slider
                      value={[volumeSettings.fadeInDuration]}
                      onValueChange={(value) => updateVolumeSetting('fadeInDuration', value[0])}
                      max={5}
                      step={0.1}
                      className="flex-1"
                    />
                    <span className="w-12 text-right">{volumeSettings.fadeInDuration}s</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>淡出时长 (秒)</Label>
                  <div className="flex items-center space-x-4">
                    <Slider
                      value={[volumeSettings.fadeOutDuration]}
                      onValueChange={(value) => updateVolumeSetting('fadeOutDuration', value[0])}
                      max={5}
                      step={0.1}
                      className="flex-1"
                    />
                    <span className="w-12 text-right">{volumeSettings.fadeOutDuration}s</span>
                  </div>
                </div>
              </div>

              {/* 重置按钮 */}
              <div className="pt-4 border-t">
                <Button variant="outline" onClick={resetAllSettings}>
                  重置所有设置
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 确认对话框 */}
      <ConfirmDialog />
    </div>
  );
};

export default EnhancedSoundManager;
