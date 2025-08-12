import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Palette, Moon, Sun, Monitor, Download, Upload, RotateCcw } from 'lucide-react';

interface AppearanceSettingsProps {
  className?: string;
}

const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({ className = '' }) => {
  const [theme, setTheme] = useState('system');
  const [accentColor, setAccentColor] = useState('blue');
  const [fontSize, setFontSize] = useState('medium');
  const [reduceMotion, setReduceMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  const handleSaveSettings = () => {
    // 保存设置的逻辑
    console.log({
      theme,
      accentColor,
      fontSize,
      reduceMotion,
      highContrast
    });
    alert('外观设置已保存');
  };

  const handleResetSettings = () => {
    // 重置设置的逻辑
    setTheme('system');
    setAccentColor('blue');
    setFontSize('medium');
    setReduceMotion(false);
    setHighContrast(false);
    alert('外观设置已重置');
  };

  const handleExportTheme = () => {
    // 导出主题的逻辑
    alert('主题导出功能已触发');
  };

  const handleImportTheme = () => {
    // 导入主题的逻辑
    alert('主题导入功能已触发');
  };

  return (
    <div className={className}>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="w-5 h-5 mr-2" />
            主题设置
          </CardTitle>
          <CardDescription>
            自定义应用的外观和主题
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Monitor className="w-4 h-4 mr-2" />
              <span>主题模式</span>
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

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">强调色</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                选择应用的主要颜色
              </div>
            </div>
            <Select value={accentColor} onValueChange={setAccentColor}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blue">蓝色</SelectItem>
                <SelectItem value="green">绿色</SelectItem>
                <SelectItem value="purple">紫色</SelectItem>
                <SelectItem value="red">红色</SelectItem>
                <SelectItem value="orange">橙色</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">字体大小</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                调整应用中的文本大小
              </div>
            </div>
            <Select value={fontSize} onValueChange={setFontSize}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">小</SelectItem>
                <SelectItem value="medium">中</SelectItem>
                <SelectItem value="large">大</SelectItem>
                <SelectItem value="x-large">特大</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Monitor className="w-5 h-5 mr-2" />
            辅助功能
          </CardTitle>
          <CardDescription>
            提高应用的可访问性和易用性
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">减少动画</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                减少界面中的动画效果
              </div>
            </div>
            <Switch
              checked={reduceMotion}
              onCheckedChange={setReduceMotion}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">高对比度</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                增加文本和背景之间的对比度
              </div>
            </div>
            <Switch
              checked={highContrast}
              onCheckedChange={setHighContrast}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="w-5 h-5 mr-2" />
            主题管理
          </CardTitle>
          <CardDescription>
            导入、导出或重置主题设置
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={handleExportTheme}
              className="flex items-center justify-center"
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              导出主题
            </Button>

            <Button 
              onClick={handleImportTheme}
              className="flex items-center justify-center"
              variant="outline"
            >
              <Upload className="w-4 h-4 mr-2" />
              导入主题
            </Button>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button 
              onClick={handleResetSettings}
              className="flex items-center justify-center w-full"
              variant="outline"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              重置为默认设置
            </Button>
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

export default AppearanceSettings;