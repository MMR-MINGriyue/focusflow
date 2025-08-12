/**
 * 设置预览组件
 * 提供设置更改的实时预览功能
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Play,
  Pause,
  RotateCcw,
  Check,
  X,
  Clock,
  Bell,
  Volume2,
  Palette,
  Monitor,
  Smartphone
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { cn } from '../../utils/cn';

// 预览模式类型
export type PreviewMode = 'live' | 'staged' | 'off';

// 预览设置项
export interface PreviewSetting {
  id: string;
  name: string;
  oldValue: any;
  newValue: any;
  category: string;
  previewComponent?: React.ComponentType<{ value: any }>;
}

// 组件属性
export interface SettingsPreviewProps {
  mode: PreviewMode;
  onModeChange: (mode: PreviewMode) => void;
  previewSettings: PreviewSetting[];
  onApplyChanges: () => void;
  onRevertChanges: () => void;
  onApplySetting: (settingId: string) => void;
  onRevertSetting: (settingId: string) => void;
  className?: string;
}

// 计时器预览组件
const TimerPreview: React.FC<{ value: any }> = ({ value }) => {
  const [time, setTime] = useState(value * 60); // 转换为秒
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    setTime(value * 60);
  }, [value]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && time > 0) {
      interval = setInterval(() => {
        setTime(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, time]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((value * 60 - time) / (value * 60)) * 100;

  return (
    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-muted"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeDasharray={`${progress * 1.76} 176`}
            className="text-primary transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-mono">{formatTime(time)}</span>
        </div>
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium">{value}分钟计时器</div>
        <div className="text-xs text-muted-foreground">预览模式</div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsRunning(!isRunning)}
        disabled={time === 0}
      >
        {isRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setTime(value * 60);
          setIsRunning(false);
        }}
      >
        <RotateCcw className="h-3 w-3" />
      </Button>
    </div>
  );
};

// 主题预览组件
const ThemePreview: React.FC<{ value: any }> = ({ value }) => {
  const themes = {
    light: { bg: 'bg-white', text: 'text-gray-900', accent: 'bg-blue-500' },
    dark: { bg: 'bg-gray-900', text: 'text-white', accent: 'bg-blue-400' },
    system: { bg: 'bg-gradient-to-r from-white to-gray-900', text: 'text-gray-600', accent: 'bg-blue-500' }
  };

  const theme = themes[value as keyof typeof themes] || themes.light;

  return (
    <div className="p-3 bg-muted/30 rounded-lg">
      <div className="text-sm font-medium mb-2">{value === 'system' ? '跟随系统' : value === 'light' ? '浅色模式' : '深色模式'}</div>
      <div className={cn('p-3 rounded border', theme.bg, theme.text)}>
        <div className="flex items-center gap-2 mb-2">
          <div className={cn('w-3 h-3 rounded-full', theme.accent)}></div>
          <span className="text-xs">示例界面</span>
        </div>
        <div className="text-xs opacity-70">这是预览效果</div>
      </div>
    </div>
  );
};

// 音量预览组件
const VolumePreview: React.FC<{ value: any }> = ({ value }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const playTestSound = () => {
    setIsPlaying(true);
    // 模拟播放声音
    setTimeout(() => setIsPlaying(false), 1000);
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
      <div className="flex-1">
        <div className="text-sm font-medium mb-1">音量: {value}%</div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={playTestSound}
        disabled={isPlaying || value === 0}
        className="flex items-center gap-1"
      >
        <Volume2 className="h-3 w-3" />
        {isPlaying ? '播放中...' : '测试'}
      </Button>
    </div>
  );
};

// 通知预览组件
const NotificationPreview: React.FC<{ value: any }> = ({ value }) => {
  const [showDemo, setShowDemo] = useState(false);

  const showDemoNotification = () => {
    setShowDemo(true);
    setTimeout(() => setShowDemo(false), 3000);
  };

  return (
    <div className="p-3 bg-muted/30 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">
          通知: {value ? '已启用' : '已禁用'}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={showDemoNotification}
          disabled={!value}
          className="flex items-center gap-1"
        >
          <Bell className="h-3 w-3" />
          预览
        </Button>
      </div>
      
      <AnimatePresence>
        {showDemo && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-2 bg-primary/10 border border-primary/20 rounded text-xs"
          >
            <div className="flex items-center gap-2">
              <Bell className="h-3 w-3 text-primary" />
              <span>这是一个示例通知</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * 设置预览组件
 */
export const SettingsPreview: React.FC<SettingsPreviewProps> = ({
  mode,
  onModeChange,
  previewSettings,
  onApplyChanges,
  onRevertChanges,
  onApplySetting,
  onRevertSetting,
  className
}) => {
  const [expandedSettings, setExpandedSettings] = useState<Set<string>>(new Set());

  // 切换设置展开状态
  const toggleExpanded = useCallback((settingId: string) => {
    setExpandedSettings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(settingId)) {
        newSet.delete(settingId);
      } else {
        newSet.add(settingId);
      }
      return newSet;
    });
  }, []);

  // 获取预览组件
  const getPreviewComponent = useCallback((setting: PreviewSetting) => {
    if (setting.previewComponent) {
      return <setting.previewComponent value={setting.newValue} />;
    }

    // 根据设置类型返回默认预览组件
    switch (setting.category) {
      case 'timer':
        if (setting.id.includes('Duration')) {
          return <TimerPreview value={setting.newValue} />;
        }
        break;
      case 'appearance':
        if (setting.id.includes('theme')) {
          return <ThemePreview value={setting.newValue} />;
        }
        break;
      case 'audio':
        if (setting.id.includes('Volume')) {
          return <VolumePreview value={setting.newValue} />;
        }
        break;
      case 'notifications':
        if (setting.id.includes('enabled')) {
          return <NotificationPreview value={setting.newValue} />;
        }
        break;
    }

    // 默认预览
    return (
      <div className="p-3 bg-muted/30 rounded-lg">
        <div className="text-sm">
          <span className="text-muted-foreground">旧值: </span>
          <span className="line-through">{String(setting.oldValue)}</span>
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">新值: </span>
          <span className="font-medium text-primary">{String(setting.newValue)}</span>
        </div>
      </div>
    );
  }, []);

  // 模式选项
  const modeOptions = [
    { value: 'off', label: '关闭预览', icon: EyeOff, description: '不显示预览效果' },
    { value: 'staged', label: '暂存预览', icon: Eye, description: '预览更改但不立即应用' },
    { value: 'live', label: '实时预览', icon: Play, description: '立即应用并预览更改' }
  ];

  if (mode === 'off' || previewSettings.length === 0) {
    return (
      <Card className={cn('border-dashed', className)}>
        <CardContent className="p-6 text-center">
          <EyeOff className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">
            {mode === 'off' ? '预览功能已关闭' : '没有可预览的更改'}
          </p>
          {mode === 'off' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onModeChange('staged')}
              className="mt-2"
            >
              启用预览
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              设置预览
            </CardTitle>
            <CardDescription>
              预览您的设置更改效果
            </CardDescription>
          </div>
          
          {/* 模式切换 */}
          <div className="flex items-center gap-1 border rounded-md">
            {modeOptions.map(option => {
              const IconComponent = option.icon;
              const isActive = mode === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => onModeChange(option.value as PreviewMode)}
                  className={cn(
                    'p-2 text-xs transition-colors',
                    isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  )}
                  title={option.description}
                >
                  <IconComponent className="h-3 w-3" />
                </button>
              );
            })}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 批量操作 */}
        {previewSettings.length > 1 && (
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <span className="text-sm text-muted-foreground">
              {previewSettings.length} 项更改待处理
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onRevertChanges}
                className="flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                全部撤销
              </Button>
              <Button
                size="sm"
                onClick={onApplyChanges}
                className="flex items-center gap-1"
              >
                <Check className="h-3 w-3" />
                全部应用
              </Button>
            </div>
          </div>
        )}

        {/* 设置预览列表 */}
        <div className="space-y-3">
          {previewSettings.map(setting => {
            const isExpanded = expandedSettings.has(setting.id);
            
            return (
              <motion.div
                key={setting.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="border rounded-lg overflow-hidden"
              >
                {/* 设置头部 */}
                <div className="flex items-center justify-between p-3 bg-muted/20">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{setting.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {setting.category} • {String(setting.oldValue)} → {String(setting.newValue)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(setting.id)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      {isExpanded ? '收起' : '预览'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRevertSetting(setting.id)}
                      className="flex items-center gap-1"
                    >
                      <X className="h-3 w-3" />
                      撤销
                    </Button>
                    
                    {mode === 'staged' && (
                      <Button
                        size="sm"
                        onClick={() => onApplySetting(setting.id)}
                        className="flex items-center gap-1"
                      >
                        <Check className="h-3 w-3" />
                        应用
                      </Button>
                    )}
                  </div>
                </div>

                {/* 预览内容 */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 border-t">
                        {getPreviewComponent(setting)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* 预览提示 */}
        <div className="text-xs text-muted-foreground text-center p-2 bg-muted/20 rounded">
          {mode === 'live' && '更改将立即应用到界面'}
          {mode === 'staged' && '更改已暂存，点击"应用"按钮生效'}
        </div>
      </CardContent>
    </Card>
  );
};

export default SettingsPreview;