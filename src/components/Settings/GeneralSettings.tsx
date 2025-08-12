import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { Input } from '../ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Settings, Bell, Monitor, Moon, Sun, Volume2 } from 'lucide-react';

interface GeneralSettingsProps {
  className?: string;
}

const GeneralSettings: React.FC<GeneralSettingsProps> = ({ className = '' }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [theme, setTheme] = useState('system');
  const [focusDuration, setFocusDuration] = useState('25');
  const [breakDuration, setBreakDuration] = useState('5');
  const [longBreakDuration, setLongBreakDuration] = useState('15');

  const handleSaveSettings = () => {
    // 保存设置的逻辑
    console.log({
      notificationsEnabled,
      soundEnabled,
      theme,
      focusDuration,
      breakDuration,
      longBreakDuration
    });
    alert('设置已保存');
  };

  return (
    <div className={className}>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Monitor className="w-5 h-5 mr-2" />
            外观设置
          </CardTitle>
          <CardDescription>
            自定义应用的外观和主题
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Moon className="w-4 h-4 mr-2" />
              <span>深色模式</span>
            </div>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center">
                    <Sun className="w-4 h-4 mr-2" />
                    浅色
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center">
                    <Moon className="w-4 h-4 mr-2" />
                    深色
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center">
                    <Monitor className="w-4 h-4 mr-2" />
                    跟随系统
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            通知设置
          </CardTitle>
          <CardDescription>
            管理应用通知和提醒
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">启用通知</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                接收专注开始和结束的通知
              </div>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">启用声音</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                播放专注开始和结束的声音
              </div>
            </div>
            <Switch
              checked={soundEnabled}
              onCheckedChange={setSoundEnabled}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            计时器设置
          </CardTitle>
          <CardDescription>
            自定义计时器时长和行为
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">专注时长 (分钟)</label>
              <Input
                type="number"
                value={focusDuration}
                onChange={(e) => setFocusDuration(e.target.value)}
                min="1"
                max="60"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">短休息时长 (分钟)</label>
              <Input
                type="number"
                value={breakDuration}
                onChange={(e) => setBreakDuration(e.target.value)}
                min="1"
                max="30"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">长休息时长 (分钟)</label>
              <Input
                type="number"
                value={longBreakDuration}
                onChange={(e) => setLongBreakDuration(e.target.value)}
                min="1"
                max="60"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveSettings}>
          保存设置
        </Button>
      </div>
    </div>
  );
};

export default GeneralSettings;