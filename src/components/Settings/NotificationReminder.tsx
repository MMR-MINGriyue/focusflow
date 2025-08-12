import React, { useState, useEffect, useRef } from 'react';
import { Bell, Volume2, VolumeX, Eye, EyeOff, Monitor, Smartphone, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { Slider } from '../ui/Slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Label } from '../ui/Label';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { useEnhancedNotificationService } from '../../hooks/useEnhancedNotificationService';
import { useEnhancedSoundService } from '../../hooks/useEnhancedSoundService';
import { useSettingsStore } from '../../stores/settingsStore';

interface NotificationReminderProps {
  className?: string;
}

/**
 * 增强版通知提醒组件
 * 实现文档中提到的多通道提示功能，包括音频提醒和视觉提醒
 */
const NotificationReminder: React.FC<NotificationReminderProps> = ({ className = '' }) => {
  // 服务
  const notificationService = useEnhancedNotificationService();
  const soundService = useEnhancedSoundService();
  const { settings, updateSettings } = useSettingsStore();

  // 本地状态
  const [notificationEnabled, setNotificationEnabled] = useState(settings.notificationsEnabled);
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);
  const [volume, setVolume] = useState(80);
  const [selectedSound, setSelectedSound] = useState('notification');
  const [visualEnabled, setVisualEnabled] = useState(true);
  const [visualType, setVisualType] = useState<'popup' | 'edge' | 'tray'>('popup');
  const [edgeColor, setEdgeColor] = useState('#3b82f6');
  const [testNotificationVisible, setTestNotificationVisible] = useState(false);
  const [customMessage, setCustomMessage] = useState('这是一个测试通知');
  const [previewVolume, setPreviewVolume] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 音效列表
  const soundOptions = [
    { value: 'focus-start', label: '专注开始' },
    { value: 'focus-end', label: '专注结束' },
    { value: 'break-start', label: '休息开始' },
    { value: 'break-end', label: '休息结束' },
    { value: 'micro-break', label: '微休息' },
    { value: 'notification', label: '通知提示' },
    { value: 'achievement', label: '成就解锁' }
  ];

  // 监听设置变化
  useEffect(() => {
    setNotificationEnabled(settings.notificationsEnabled);
    setSoundEnabled(settings.soundEnabled);
  }, [settings]);

  // 更新通知设置
  useEffect(() => {
    notificationService.setEnabled(notificationEnabled);
    updateSettings({ notificationsEnabled: notificationEnabled });
  }, [notificationEnabled, notificationService, updateSettings]);

  // 更新音效设置
  useEffect(() => {
    soundService.setSoundEnabled(soundEnabled);
    updateSettings({ soundEnabled: soundEnabled });
  }, [soundEnabled, soundService, updateSettings]);

  // 更新音量设置
  useEffect(() => {
    soundService.saveVolumeSettings({
      master: volume,
      notification: volume,
      ambient: 50,
      fadeInDuration: 0.5,
      fadeOutDuration: 0.5
    });
  }, [volume, soundService]);

  // 测试通知
  const testNotification = () => {
    notificationService.notify({
      title: '测试通知',
      body: customMessage,
      sound: soundEnabled ? selectedSound : undefined
    });
    setTestNotificationVisible(true);
    setTimeout(() => setTestNotificationVisible(false), 3000);
  };

  // 预览音效
  const previewSound = () => {
    if (isPlaying) {
      soundService.stop(selectedSound);
      setIsPlaying(false);
      setPreviewVolume(0);
      return;
    }

    setIsPlaying(true);
    soundService.play(selectedSound, () => {
      setIsPlaying(false);
      setPreviewVolume(0);
    });

    // 模拟音量变化动画
    let currentVolume = 0;
    const interval = setInterval(() => {
      currentVolume += 10;
      setPreviewVolume(currentVolume);

      if (currentVolume >= 100) {
        clearInterval(interval);

        // 淡出
        const fadeOutInterval = setInterval(() => {
          currentVolume -= 10;
          setPreviewVolume(currentVolume);

          if (currentVolume <= 0) {
            clearInterval(fadeOutInterval);
          }
        }, 100);
      }
    }, 100);
  };

  // 渲染音效预览
  const renderSoundPreview = () => {
    return (
      <div className="flex items-center space-x-4">
        <Button
          onClick={previewSound}
          variant="outline"
          size="sm"
          className="w-10 h-10 p-0"
        >
          {isPlaying ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
        <div className="flex-1">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${previewVolume}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">通知提醒</h2>
        <p className="text-gray-600 dark:text-gray-400">
          配置专注和休息提醒的通知方式
        </p>
      </div>

      <Tabs defaultValue="notification" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notification">通知设置</TabsTrigger>
          <TabsTrigger value="sound">音效设置</TabsTrigger>
          <TabsTrigger value="visual">视觉设置</TabsTrigger>
        </TabsList>

        {/* 通知设置标签页 */}
        <TabsContent value="notification" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                通知设置
              </CardTitle>
              <CardDescription>
                配置系统通知和应用内通知
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">启用通知</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    接收专注和休息提醒通知
                  </p>
                </div>
                <Switch
                  checked={notificationEnabled}
                  onCheckedChange={setNotificationEnabled}
                />
              </div>

              {notificationEnabled && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="custom-message">自定义通知消息</Label>
                    <Input
                      id="custom-message"
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder="输入自定义通知消息"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button onClick={testNotification}>
                      测试通知
                    </Button>
                    {testNotificationVisible && (
                      <Badge variant="outline">通知已发送</Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 音效设置标签页 */}
        <TabsContent value="sound" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Volume2 className="h-5 w-5 mr-2" />
                音效设置
              </CardTitle>
              <CardDescription>
                配置提醒音效和音量
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">启用音效</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    播放专注和休息提醒音效
                  </p>
                </div>
                <Switch
                  checked={soundEnabled}
                  onCheckedChange={setSoundEnabled}
                />
              </div>

              {soundEnabled && (
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>音量</Label>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{volume}%</span>
                    </div>
                    <Slider
                      value={[volume]}
                      onValueChange={(value) => setVolume(value[0])}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Label>选择音效</Label>
                    <Select value={selectedSound} onValueChange={setSelectedSound}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {soundOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="mt-2">
                      {renderSoundPreview()}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 视觉设置标签页 */}
        <TabsContent value="visual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                视觉设置
              </CardTitle>
              <CardDescription>
                配置视觉提醒方式
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">启用视觉提醒</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    显示视觉提醒效果
                  </p>
                </div>
                <Switch
                  checked={visualEnabled}
                  onCheckedChange={setVisualEnabled}
                />
              </div>

              {visualEnabled && (
                <div className="space-y-6">
                  <div>
                    <Label>视觉提醒类型</Label>
                    <Select value={visualType} onValueChange={(value: any) => setVisualType(value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="popup">弹窗提醒</SelectItem>
                        <SelectItem value="edge">屏幕边缘色带</SelectItem>
                        <SelectItem value="tray">任务栏图标</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {visualType === 'edge' && (
                    <div>
                      <Label>边缘色带颜色</Label>
                      <div className="flex items-center space-x-2 mt-2">
                        <input
                          type="color"
                          value={edgeColor}
                          onChange={(e) => setEdgeColor(e.target.value)}
                          className="w-10 h-10 p-1 border rounded"
                        />
                        <span className="text-sm">{edgeColor}</span>
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-medium mb-2">预览</h4>
                    <div className="flex justify-center">
                      {visualType === 'popup' && (
                        <div className="w-64 p-4 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
                          <div className="font-medium">专注时间结束</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            是时候休息一下了
                          </div>
                        </div>
                      )}

                      {visualType === 'edge' && (
                        <div className="relative w-64 h-32 border-4 rounded-lg" style={{ borderColor: edgeColor }}>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm">屏幕边缘色带效果</span>
                          </div>
                        </div>
                      )}

                      {visualType === 'tray' && (
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-500 rounded"></div>
                          <span>任务栏图标变色效果</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationReminder;
