/**
 * 统一设置管理组件
 * 提供完整的应用设置管理界面，支持分类、搜索、预览和实时应用
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input, SearchInput } from '../ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, ConfirmDialog } from '../ui/Dialog';
import { ThemeSelector, ThemePreferencesPanel, useTheme } from '../../theme/ThemeProvider';
import { useSettingsStore } from '../../stores/settingsStore';
import { cn } from '../../utils/cn';
import { 
  Settings, 
  Clock, 
  Bell, 
  Palette, 
  Volume2, 
  Shield, 
  Database, 
  Keyboard,
  Monitor,
  Smartphone,
  Globe,
  Download,
  Upload,
  Search,
  RefreshCw,
  Save,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Info,
  Zap,
  Moon,
  Sun,
  Eye,
  EyeOff,
  Filter,
  Star,
  Bookmark,
  History,
  ChevronRight,
  X,
  Plus,
  Minus
} from 'lucide-react';

// 设置过滤器类型
type SettingsFilter = 'all' | 'favorites' | 'recent' | 'modified' | 'experimental' | 'premium';

// 设置类别
export interface SettingsCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  settings: SettingsItem[];
  color?: string; // 分类颜色
  badge?: string; // 分类徽章
}

// 设置项类型
export interface SettingsItem {
  id: string;
  name: string;
  description: string;
  type: 'boolean' | 'number' | 'string' | 'select' | 'range' | 'color' | 'time' | 'shortcut' | 'action';
  value: any;
  defaultValue: any;
  options?: Array<{ label: string; value: any; description?: string }>;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  validation?: (value: any) => string | null;
  dependencies?: string[]; // 依赖的其他设置项
  premium?: boolean; // 是否为高级功能
  experimental?: boolean; // 是否为实验性功能
  favorite?: boolean; // 是否为收藏项
  lastModified?: number; // 最后修改时间
  tags?: string[]; // 标签
  preview?: boolean; // 是否支持实时预览
  restartRequired?: boolean; // 是否需要重启应用
  onAction?: () => void; // 动作按钮回调
}

// 设置预设
export interface SettingsPreset {
  id: string;
  name: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  settings: Record<string, any>;
  tags?: string[];
}

/**
 * 统一设置组件
 */
export const UnifiedSettings: React.FC<{
  className?: string;
}> = ({ className }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('timer');
  const [activeFilter, setActiveFilter] = useState<SettingsFilter>('all');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetTarget, setResetTarget] = useState<'all' | string>('all');
  const [previewMode, setPreviewMode] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [recentlyModified, setRecentlyModified] = useState<Set<string>>(new Set());
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  
  const { theme, updatePreferences } = useTheme();
  const settingsStore = useSettingsStore();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 模拟设置数据
  const [settingsData, setSettingsData] = useState<Record<string, any>>({
    // 计时器设置
    'timer.focusDuration': 25,
    'timer.shortBreakDuration': 5,
    'timer.longBreakDuration': 15,
    'timer.longBreakInterval': 4,
    'timer.autoStartBreaks': false,
    'timer.autoStartFocus': false,
    'timer.tickSound': true,
    'timer.endSound': true,
    'timer.soundVolume': 50,
    
    // 通知设置
    'notifications.enabled': true,
    'notifications.desktop': true,
    'notifications.sound': true,
    'notifications.breakReminders': true,
    'notifications.sessionComplete': true,
    'notifications.dailyGoal': true,
    
    // 外观设置
    'appearance.theme': 'system',
    'appearance.fontSize': 'medium',
    'appearance.reducedMotion': false,
    'appearance.highContrast': false,
    'appearance.colorBlindFriendly': false,
    'appearance.compactMode': false,
    
    // 隐私设置
    'privacy.analytics': true,
    'privacy.crashReports': true,
    'privacy.dataCollection': false,
    'privacy.shareUsageStats': false,
    
    // 高级设置
    'advanced.enableExperimentalFeatures': false,
    'advanced.debugMode': false,
    'advanced.performanceMode': false,
    'advanced.autoBackup': true,
    'advanced.backupInterval': 7
  });

  // 设置分类定义
  const settingsCategories: SettingsCategory[] = useMemo(() => [
    {
      id: 'timer',
      name: '计时器',
      description: '专注时间和休息时间设置',
      icon: Clock,
      settings: [
        {
          id: 'timer.focusDuration',
          name: '专注时长',
          description: '每个专注会话的持续时间',
          type: 'number',
          value: settingsData['timer.focusDuration'],
          defaultValue: 25,
          min: 1,
          max: 120,
          unit: '分钟'
        },
        {
          id: 'timer.shortBreakDuration',
          name: '短休息时长',
          description: '短休息的持续时间',
          type: 'number',
          value: settingsData['timer.shortBreakDuration'],
          defaultValue: 5,
          min: 1,
          max: 30,
          unit: '分钟'
        },
        {
          id: 'timer.longBreakDuration',
          name: '长休息时长',
          description: '长休息的持续时间',
          type: 'number',
          value: settingsData['timer.longBreakDuration'],
          defaultValue: 15,
          min: 5,
          max: 60,
          unit: '分钟'
        },
        {
          id: 'timer.longBreakInterval',
          name: '长休息间隔',
          description: '多少个专注会话后进行长休息',
          type: 'number',
          value: settingsData['timer.longBreakInterval'],
          defaultValue: 4,
          min: 2,
          max: 10,
          unit: '个会话'
        },
        {
          id: 'timer.autoStartBreaks',
          name: '自动开始休息',
          description: '专注时间结束后自动开始休息',
          type: 'boolean',
          value: settingsData['timer.autoStartBreaks'],
          defaultValue: false
        },
        {
          id: 'timer.autoStartFocus',
          name: '自动开始专注',
          description: '休息时间结束后自动开始专注',
          type: 'boolean',
          value: settingsData['timer.autoStartFocus'],
          defaultValue: false
        },
        {
          id: 'timer.tickSound',
          name: '滴答声',
          description: '计时器运行时播放滴答声',
          type: 'boolean',
          value: settingsData['timer.tickSound'],
          defaultValue: true
        },
        {
          id: 'timer.endSound',
          name: '结束提示音',
          description: '计时器结束时播放提示音',
          type: 'boolean',
          value: settingsData['timer.endSound'],
          defaultValue: true
        },
        {
          id: 'timer.soundVolume',
          name: '音量',
          description: '提示音和滴答声的音量',
          type: 'range',
          value: settingsData['timer.soundVolume'],
          defaultValue: 50,
          min: 0,
          max: 100,
          unit: '%',
          dependencies: ['timer.tickSound', 'timer.endSound']
        }
      ]
    },
    {
      id: 'notifications',
      name: '通知',
      description: '通知和提醒设置',
      icon: Bell,
      settings: [
        {
          id: 'notifications.enabled',
          name: '启用通知',
          description: '允许应用发送通知',
          type: 'boolean',
          value: settingsData['notifications.enabled'],
          defaultValue: true
        },
        {
          id: 'notifications.desktop',
          name: '桌面通知',
          description: '在桌面显示通知',
          type: 'boolean',
          value: settingsData['notifications.desktop'],
          defaultValue: true,
          dependencies: ['notifications.enabled']
        },
        {
          id: 'notifications.sound',
          name: '通知声音',
          description: '通知时播放声音',
          type: 'boolean',
          value: settingsData['notifications.sound'],
          defaultValue: true,
          dependencies: ['notifications.enabled']
        },
        {
          id: 'notifications.breakReminders',
          name: '休息提醒',
          description: '提醒您该休息了',
          type: 'boolean',
          value: settingsData['notifications.breakReminders'],
          defaultValue: true,
          dependencies: ['notifications.enabled']
        },
        {
          id: 'notifications.sessionComplete',
          name: '会话完成通知',
          description: '专注会话完成时通知',
          type: 'boolean',
          value: settingsData['notifications.sessionComplete'],
          defaultValue: true,
          dependencies: ['notifications.enabled']
        },
        {
          id: 'notifications.dailyGoal',
          name: '每日目标通知',
          description: '达成每日目标时通知',
          type: 'boolean',
          value: settingsData['notifications.dailyGoal'],
          defaultValue: true,
          dependencies: ['notifications.enabled']
        }
      ]
    },
    {
      id: 'appearance',
      name: '外观',
      description: '主题和界面设置',
      icon: Palette,
      settings: [
        {
          id: 'appearance.theme',
          name: '主题',
          description: '选择应用主题',
          type: 'select',
          value: settingsData['appearance.theme'],
          defaultValue: 'system',
          options: [
            { label: '跟随系统', value: 'system' },
            { label: '浅色模式', value: 'light' },
            { label: '深色模式', value: 'dark' }
          ]
        },
        {
          id: 'appearance.fontSize',
          name: '字体大小',
          description: '界面字体大小',
          type: 'select',
          value: settingsData['appearance.fontSize'],
          defaultValue: 'medium',
          options: [
            { label: '小', value: 'small' },
            { label: '中', value: 'medium' },
            { label: '大', value: 'large' }
          ]
        },
        {
          id: 'appearance.reducedMotion',
          name: '减少动画',
          description: '减少界面动画效果',
          type: 'boolean',
          value: settingsData['appearance.reducedMotion'],
          defaultValue: false
        },
        {
          id: 'appearance.highContrast',
          name: '高对比度',
          description: '使用高对比度颜色',
          type: 'boolean',
          value: settingsData['appearance.highContrast'],
          defaultValue: false
        },
        {
          id: 'appearance.colorBlindFriendly',
          name: '色盲友好',
          description: '使用色盲友好的颜色方案',
          type: 'boolean',
          value: settingsData['appearance.colorBlindFriendly'],
          defaultValue: false
        },
        {
          id: 'appearance.compactMode',
          name: '紧凑模式',
          description: '使用更紧凑的界面布局',
          type: 'boolean',
          value: settingsData['appearance.compactMode'],
          defaultValue: false
        }
      ]
    },
    {
      id: 'privacy',
      name: '隐私',
      description: '数据和隐私设置',
      icon: Shield,
      settings: [
        {
          id: 'privacy.analytics',
          name: '分析数据',
          description: '允许收集匿名使用分析',
          type: 'boolean',
          value: settingsData['privacy.analytics'],
          defaultValue: true
        },
        {
          id: 'privacy.crashReports',
          name: '崩溃报告',
          description: '自动发送崩溃报告',
          type: 'boolean',
          value: settingsData['privacy.crashReports'],
          defaultValue: true
        },
        {
          id: 'privacy.dataCollection',
          name: '数据收集',
          description: '允许收集使用数据以改进产品',
          type: 'boolean',
          value: settingsData['privacy.dataCollection'],
          defaultValue: false
        },
        {
          id: 'privacy.shareUsageStats',
          name: '分享使用统计',
          description: '与开发者分享匿名使用统计',
          type: 'boolean',
          value: settingsData['privacy.shareUsageStats'],
          defaultValue: false
        }
      ]
    },
    {
      id: 'advanced',
      name: '高级',
      description: '高级功能和实验性设置',
      icon: Settings,
      settings: [
        {
          id: 'advanced.enableExperimentalFeatures',
          name: '实验性功能',
          description: '启用实验性功能（可能不稳定）',
          type: 'boolean',
          value: settingsData['advanced.enableExperimentalFeatures'],
          defaultValue: false,
          experimental: true
        },
        {
          id: 'advanced.debugMode',
          name: '调试模式',
          description: '启用调试信息显示',
          type: 'boolean',
          value: settingsData['advanced.debugMode'],
          defaultValue: false,
          experimental: true
        },
        {
          id: 'advanced.performanceMode',
          name: '性能模式',
          description: '优化性能，可能影响视觉效果',
          type: 'boolean',
          value: settingsData['advanced.performanceMode'],
          defaultValue: false
        },
        {
          id: 'advanced.autoBackup',
          name: '自动备份',
          description: '定期自动备份数据',
          type: 'boolean',
          value: settingsData['advanced.autoBackup'],
          defaultValue: true
        },
        {
          id: 'advanced.backupInterval',
          name: '备份间隔',
          description: '自动备份的间隔天数',
          type: 'number',
          value: settingsData['advanced.backupInterval'],
          defaultValue: 7,
          min: 1,
          max: 30,
          unit: '天',
          dependencies: ['advanced.autoBackup']
        }
      ]
    }
  ], [settingsData]);

  // 过滤设置项
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return settingsCategories;

    return settingsCategories.map(category => ({
      ...category,
      settings: category.settings.filter(setting =>
        setting.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        setting.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(category => category.settings.length > 0);
  }, [settingsCategories, searchQuery]);

  // 更新设置值
  const updateSetting = useCallback((settingId: string, value: any) => {
    setSettingsData(prev => ({
      ...prev,
      [settingId]: value
    }));
    setHasUnsavedChanges(true);
  }, []);

  // 重置设置
  const resetSetting = useCallback((settingId: string) => {
    const setting = settingsCategories
      .flatMap(cat => cat.settings)
      .find(s => s.id === settingId);
    
    if (setting) {
      updateSetting(settingId, setting.defaultValue);
    }
  }, [settingsCategories, updateSetting]);

  // 保存设置
  const saveSettings = useCallback(async () => {
    // 模拟保存过程
    await new Promise(resolve => setTimeout(resolve, 1000));
    setHasUnsavedChanges(false);
    // 这里应该调用实际的保存API
    console.log('Settings saved:', settingsData);
  }, [settingsData]);

  // 重置所有设置
  const resetAllSettings = useCallback(() => {
    const defaultSettings: Record<string, any> = {};
    settingsCategories.forEach(category => {
      category.settings.forEach(setting => {
        defaultSettings[setting.id] = setting.defaultValue;
      });
    });
    setSettingsData(defaultSettings);
    setHasUnsavedChanges(true);
  }, [settingsCategories]);

  // 导出设置
  const exportSettings = useCallback(() => {
    const blob = new Blob([JSON.stringify(settingsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focusflow-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [settingsData]);

  // 导入设置
  const importSettings = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const importedSettings = JSON.parse(text);
      
      // 验证设置格式
      const validSettings: Record<string, any> = {};
      const allSettingIds = settingsCategories.flatMap(cat => cat.settings.map(s => s.id));
      
      Object.entries(importedSettings).forEach(([key, value]) => {
        if (allSettingIds.includes(key)) {
          validSettings[key] = value;
        }
      });
      
      setSettingsData(prev => ({ ...prev, ...validSettings }));
      setHasUnsavedChanges(true);
      setShowImportDialog(false);
    } catch (error) {
      alert('导入失败：无效的设置文件格式');
    }
  }, [settingsCategories]);

  // 渲染设置项
  const renderSettingItem = useCallback((setting: SettingsItem) => {
    const isDisabled = setting.dependencies?.some(dep => !settingsData[dep]);
    
    return (
      <div
        key={setting.id}
        className={cn(
          'flex items-center justify-between p-4 border rounded-lg',
          isDisabled && 'opacity-50',
          setting.experimental && 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/10',
          setting.premium && 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/10'
        )}
      >
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{setting.name}</span>
            {setting.experimental && (
              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                实验性
              </span>
            )}
            {setting.premium && (
              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                高级
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{setting.description}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 设置控件 */}
          {setting.type === 'boolean' && (
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={setting.value}
                onChange={(e) => updateSetting(setting.id, e.target.checked)}
                disabled={isDisabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          )}
          
          {setting.type === 'number' && (
            <Input
              type="number"
              value={setting.value}
              onChange={(e) => updateSetting(setting.id, parseInt(e.target.value))}
              min={setting.min}
              max={setting.max}
              disabled={isDisabled}
              className="w-20"
            />
          )}
          
          {setting.type === 'range' && (
            <div className="flex items-center gap-2">
              <input
                type="range"
                value={setting.value}
                onChange={(e) => updateSetting(setting.id, parseInt(e.target.value))}
                min={setting.min}
                max={setting.max}
                step={setting.step || 1}
                disabled={isDisabled}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground w-12">
                {setting.value}{setting.unit}
              </span>
            </div>
          )}
          
          {setting.type === 'select' && (
            <select
              value={setting.value}
              onChange={(e) => updateSetting(setting.id, e.target.value)}
              disabled={isDisabled}
              className="p-2 border border-input rounded-md bg-background min-w-[120px]"
            >
              {setting.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
          
          {/* 重置按钮 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => resetSetting(setting.id)}
            disabled={isDisabled || setting.value === setting.defaultValue}
            title="重置为默认值"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }, [settingsData, updateSetting, resetSetting]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* 标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">设置</h2>
          <p className="text-muted-foreground">自定义您的专注体验</p>
        </div>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <Button onClick={saveSettings} size="sm">
              <Save className="h-4 w-4 mr-2" />
              保存更改
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)}>
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            导入
          </Button>
        </div>
      </div>

      {/* 搜索和过滤 */}
      <div className="flex items-center gap-4">
        <SearchInput
          placeholder="搜索设置..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
          className="max-w-md"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
          {showAdvanced ? '隐藏高级' : '显示高级'}
        </Button>
      </div>

      {/* 设置内容 */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-5">
          {filteredCategories.map(category => {
            const IconComponent = category.icon;
            return (
              <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                <IconComponent className="h-4 w-4" />
                <span className="hidden sm:inline">{category.name}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {filteredCategories.map(category => (
          <TabsContent key={category.id} value={category.id} className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{category.name}</h3>
              <p className="text-muted-foreground">{category.description}</p>
            </div>
            
            <div className="space-y-3">
              {category.settings
                .filter(setting => showAdvanced || (!setting.experimental && !setting.premium))
                .map(renderSettingItem)}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* 危险操作 */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            危险操作
          </CardTitle>
          <CardDescription>
            这些操作可能会影响您的数据，请谨慎操作
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={resetAllSettings}
            disabled={hasUnsavedChanges}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            重置所有设置
          </Button>
        </CardContent>
      </Card>

      {/* 导入对话框 */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>导入设置</DialogTitle>
            <DialogDescription>
              选择一个设置文件来导入配置
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <input
              type="file"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  importSettings(file);
                }
              }}
              className="w-full p-2 border border-input rounded-md"
            />
            <p className="text-sm text-muted-foreground">
              只支持JSON格式的设置文件
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* 导出对话框 */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>导出设置</DialogTitle>
            <DialogDescription>
              将当前设置导出为文件
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              取消
            </Button>
            <Button onClick={() => {
              exportSettings();
              setShowExportDialog(false);
            }}>
              <Download className="h-4 w-4 mr-2" />
              导出
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnifiedSettings;