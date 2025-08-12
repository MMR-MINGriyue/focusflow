/**
 * 优化的设置面板组件
 * 提供分类、搜索、预览和实时应用功能
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Clock,
  Bell,
  Palette,
  Volume2,
  Shield,
  Database,
  Keyboard,
  Search,
  Filter,
  Star,
  Bookmark,
  History,
  Download,
  Upload,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronDown,
  X,
  Plus,
  Minus,
  Zap,
  Sun,
  Moon,
  AlertTriangle,
  CheckCircle,
  Info,
  BellOff,
  VolumeX
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input, SearchInput } from '../ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, ConfirmDialog } from '../ui/Dialog';
import { useTheme } from '../../theme/ThemeProvider';
import { useSettingsStore } from '../../stores/settingsStore';
import { cn } from '../../utils/cn';

// 设置过滤器类型
type SettingsFilter = 'all' | 'favorites' | 'recent' | 'modified' | 'experimental' | 'premium';

// 设置类别
interface SettingsCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  settings: SettingsItem[];
}

// 设置项类型
interface SettingsItem {
  id: string;
  name: string;
  description: string;
  type: 'boolean' | 'number' | 'string' | 'select' | 'range' | 'color' | 'action';
  value: any;
  defaultValue: any;
  options?: Array<{ label: string; value: any; description?: string }>;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  validation?: (value: any) => string | null;
  dependencies?: string[];
  premium?: boolean;
  experimental?: boolean;
  favorite?: boolean;
  lastModified?: number;
  tags?: string[];
  preview?: boolean;
  restartRequired?: boolean;
  onAction?: () => void;
}

// 设置预设
interface SettingsPreset {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  settings: Record<string, any>;
  tags: string[];
}

// 优化设置面板属性
export interface OptimizedSettingsPanelProps {
  className?: string;
  onClose?: () => void;
}

/**
 * 优化设置面板组件
 */
export const OptimizedSettingsPanel: React.FC<OptimizedSettingsPanelProps> = ({
  className,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('timer');
  const [activeFilter, setActiveFilter] = useState<SettingsFilter>('all');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetTarget, setResetTarget] = useState<'all' | string>('all');
  const [previewMode, setPreviewMode] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [recentlyModified, setRecentlyModified] = useState<Set<string>>(new Set());
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['timer']));
  
  const { theme, updatePreferences } = useTheme();
  const settingsStore = useSettingsStore();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 设置预设
  const settingsPresets: SettingsPreset[] = useMemo(() => [
    {
      id: 'focus-intensive',
      name: '专注强化',
      description: '适合需要长时间专注的工作',
      icon: Zap,
      settings: {
        'timer.focusDuration': 50 * 60,
        'timer.shortBreakDuration': 10 * 60,
        'timer.longBreakDuration': 30 * 60,
        'timer.longBreakInterval': 3,
        'timer.autoStartBreaks': false,
        'timer.autoStartFocus': false
      },
      tags: ['productivity', 'focus']
    },
    {
      id: 'balanced',
      name: '平衡模式',
      description: '工作与休息的完美平衡',
      icon: Clock,
      settings: {
        'timer.focusDuration': 25 * 60,
        'timer.shortBreakDuration': 5 * 60,
        'timer.longBreakDuration': 15 * 60,
        'timer.longBreakInterval': 4,
        'timer.autoStartBreaks': true,
        'timer.autoStartFocus': false
      },
      tags: ['balanced', 'standard']
    },
    {
      id: 'gentle',
      name: '温和模式',
      description: '适合初学者或需要频繁休息的用户',
      icon: Sun,
      settings: {
        'timer.focusDuration': 15 * 60,
        'timer.shortBreakDuration': 5 * 60,
        'timer.longBreakDuration': 20 * 60,
        'timer.longBreakInterval': 3,
        'timer.autoStartBreaks': true,
        'timer.autoStartFocus': false
      },
      tags: ['beginner', 'gentle']
    }
  ], []);

  // 快捷操作
  const quickActions = useMemo(() => [
    {
      id: 'toggle-theme',
      name: '切换主题',
      icon: theme.mode === 'dark' ? Sun : Moon,
      action: () => updatePreferences({ mode: theme.mode === 'dark' ? 'light' : 'dark' })
    },
    {
      id: 'toggle-notifications',
      name: '切换通知',
      icon: settingsStore.settings.notifications?.enabled ? Bell : BellOff,
      action: () => settingsStore.updateNotificationSettings({ 
        enabled: !settingsStore.settings.notifications?.enabled 
      })
    },
    {
      id: 'toggle-sounds',
      name: '切换声音',
      icon: (settingsStore.settings.audio?.masterVolume || 0) > 0 ? Volume2 : VolumeX,
      action: () => settingsStore.updateAudioSettings({ 
        masterVolume: (settingsStore.settings.audio?.masterVolume || 0) > 0 ? 0 : 80 
      })
    }
  ], [theme.mode, settingsStore, updatePreferences]);

  // 设置分类定义
  const settingsCategories: SettingsCategory[] = useMemo(() => [
    {
      id: 'timer',
      name: '计时器',
      description: '专注时间和休息时间设置',
      icon: Clock,
      color: 'blue',
      settings: [
        {
          id: 'timer.focusDuration',
          name: '专注时长',
          description: '每个专注会话的持续时间',
          type: 'number',
          value: Math.round((settingsStore.settings.timer?.focusDuration || 1500) / 60),
          defaultValue: 25,
          min: 1,
          max: 120,
          unit: '分钟',
          preview: true,
          tags: ['time', 'focus']
        },
        {
          id: 'timer.shortBreakDuration',
          name: '短休息时长',
          description: '短休息的持续时间',
          type: 'number',
          value: Math.round((settingsStore.settings.timer?.shortBreakDuration || 300) / 60),
          defaultValue: 5,
          min: 1,
          max: 30,
          unit: '分钟',
          preview: true,
          tags: ['time', 'break']
        },
        {
          id: 'timer.longBreakDuration',
          name: '长休息时长',
          description: '长休息的持续时间',
          type: 'number',
          value: Math.round((settingsStore.settings.timer?.longBreakDuration || 900) / 60),
          defaultValue: 15,
          min: 5,
          max: 60,
          unit: '分钟',
          preview: true,
          tags: ['time', 'break']
        },
        {
          id: 'timer.longBreakInterval',
          name: '长休息间隔',
          description: '多少个专注会话后进行长休息',
          type: 'number',
          value: settingsStore.settings.timer?.longBreakInterval || 4,
          defaultValue: 4,
          min: 2,
          max: 10,
          unit: '个会话',
          tags: ['interval']
        },
        {
          id: 'timer.autoStartBreaks',
          name: '自动开始休息',
          description: '专注时间结束后自动开始休息',
          type: 'boolean',
          value: settingsStore.settings.timer?.autoStartBreaks || false,
          defaultValue: false,
          preview: true,
          tags: ['automation']
        },
        {
          id: 'timer.autoStartFocus',
          name: '自动开始专注',
          description: '休息时间结束后自动开始专注',
          type: 'boolean',
          value: settingsStore.settings.timer?.autoStartFocus || false,
          defaultValue: false,
          preview: true,
          tags: ['automation']
        }
      ]
    },
    {
      id: 'notifications',
      name: '通知',
      description: '通知和提醒设置',
      icon: Bell,
      color: 'green',
      settings: [
        {
          id: 'notifications.enabled',
          name: '启用通知',
          description: '允许应用发送通知',
          type: 'boolean',
          value: settingsStore.settings.notifications?.enabled || true,
          defaultValue: true,
          preview: true,
          tags: ['notification']
        },
        {
          id: 'notifications.desktop',
          name: '桌面通知',
          description: '在桌面显示通知',
          type: 'boolean',
          value: settingsStore.settings.notifications?.desktop || true,
          defaultValue: true,
          dependencies: ['notifications.enabled'],
          tags: ['notification', 'desktop']
        },
        {
          id: 'notifications.sound',
          name: '通知声音',
          description: '通知时播放声音',
          type: 'boolean',
          value: settingsStore.settings.notifications?.sound || true,
          defaultValue: true,
          dependencies: ['notifications.enabled'],
          preview: true,
          tags: ['notification', 'sound']
        }
      ]
    },
    {
      id: 'appearance',
      name: '外观',
      description: '主题和界面设置',
      icon: Palette,
      color: 'purple',
      settings: [
        {
          id: 'appearance.theme',
          name: '主题',
          description: '选择应用主题',
          type: 'select',
          value: theme.mode,
          defaultValue: 'system',
          options: [
            { label: '跟随系统', value: 'system' },
            { label: '浅色模式', value: 'light' },
            { label: '深色模式', value: 'dark' }
          ],
          preview: true,
          tags: ['theme', 'appearance']
        },
        {
          id: 'appearance.fontSize',
          name: '字体大小',
          description: '界面字体大小',
          type: 'select',
          value: theme.fontSize,
          defaultValue: 'medium',
          options: [
            { label: '小', value: 'small' },
            { label: '中', value: 'medium' },
            { label: '大', value: 'large' }
          ],
          preview: true,
          tags: ['font', 'accessibility']
        },
        {
          id: 'appearance.reducedMotion',
          name: '减少动画',
          description: '减少界面动画效果',
          type: 'boolean',
          value: theme.reducedMotion,
          defaultValue: false,
          preview: true,
          tags: ['animation', 'accessibility']
        },
        {
          id: 'appearance.highContrast',
          name: '高对比度',
          description: '使用高对比度颜色',
          type: 'boolean',
          value: theme.highContrast,
          defaultValue: false,
          preview: true,
          tags: ['contrast', 'accessibility']
        }
      ]
    },
    {
      id: 'audio',
      name: '音频',
      description: '声音和音效设置',
      icon: Volume2,
      color: 'orange',
      settings: [
        {
          id: 'audio.masterVolume',
          name: '主音量',
          description: '调整整体音量',
          type: 'range',
          value: settingsStore.settings.audio?.masterVolume || 80,
          defaultValue: 80,
          min: 0,
          max: 100,
          unit: '%',
          preview: true,
          tags: ['volume', 'audio']
        },
        {
          id: 'audio.tickingSound',
          name: '滴答声',
          description: '播放计时器滴答声',
          type: 'boolean',
          value: settingsStore.settings.audio?.tickingSound || false,
          defaultValue: false,
          preview: true,
          tags: ['sound', 'timer']
        },
        {
          id: 'audio.completionSound',
          name: '完成音效',
          description: '时间结束时播放音效',
          type: 'select',
          value: settingsStore.settings.audio?.completionSound || 'bell',
          defaultValue: 'bell',
          options: [
            { label: '铃声', value: 'bell' },
            { label: '提示音', value: 'chime' },
            { label: '无声', value: 'none' }
          ],
          preview: true,
          tags: ['sound', 'completion']
        }
      ]
    },
    {
      id: 'privacy',
      name: '隐私',
      description: '数据和隐私设置',
      icon: Shield,
      color: 'red',
      settings: [
        {
          id: 'privacy.analytics',
          name: '使用统计',
          description: '帮助改进应用体验',
          type: 'boolean',
          value: settingsStore.settings.privacy?.analytics || false,
          defaultValue: false,
          tags: ['privacy', 'analytics']
        },
        {
          id: 'privacy.crashReports',
          name: '崩溃报告',
          description: '自动发送崩溃报告',
          type: 'boolean',
          value: settingsStore.settings.privacy?.crashReports || false,
          defaultValue: false,
          tags: ['privacy', 'reports']
        }
      ]
    },
    {
      id: 'advanced',
      name: '高级',
      description: '高级功能和实验性设置',
      icon: Settings,
      color: 'gray',
      settings: [
        {
          id: 'advanced.enableExperimentalFeatures',
          name: '实验性功能',
          description: '启用实验性功能（可能不稳定）',
          type: 'boolean',
          value: false,
          defaultValue: false,
          experimental: true,
          restartRequired: true,
          tags: ['experimental', 'advanced']
        },
        {
          id: 'advanced.debugMode',
          name: '调试模式',
          description: '启用调试信息显示',
          type: 'boolean',
          value: false,
          defaultValue: false,
          experimental: true,
          tags: ['debug', 'advanced']
        },
        {
          id: 'data.exportData',
          name: '导出数据',
          description: '导出所有应用数据',
          type: 'action',
          value: null,
          defaultValue: null,
          onAction: () => handleExportData(),
          tags: ['data', 'export']
        },
        {
          id: 'data.clearData',
          name: '清除所有数据',
          description: '删除所有应用数据（不可撤销）',
          type: 'action',
          value: null,
          defaultValue: null,
          onAction: () => handleClearData(),
          tags: ['data', 'danger']
        }
      ]
    }
  ], [settingsStore.settings, theme]);

  // 过滤设置项
  const filteredCategories = useMemo(() => {
    let categories = settingsCategories;

    // 应用搜索过滤
    if (searchQuery) {
      categories = categories.map(category => ({
        ...category,
        settings: category.settings.filter(setting =>
          setting.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          setting.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          setting.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      })).filter(category => category.settings.length > 0);
    }

    // 应用过滤器
    if (activeFilter !== 'all') {
      categories = categories.map(category => ({
        ...category,
        settings: category.settings.filter(setting => {
          switch (activeFilter) {
            case 'favorites':
              return favorites.has(setting.id);
            case 'recent':
              return recentlyModified.has(setting.id);
            case 'modified':
              return setting.value !== setting.defaultValue;
            case 'experimental':
              return setting.experimental;
            case 'premium':
              return setting.premium;
            default:
              return true;
          }
        })
      })).filter(category => category.settings.length > 0);
    }

    // 隐藏高级设置
    if (!showAdvanced) {
      categories = categories.map(category => ({
        ...category,
        settings: category.settings.filter(setting => !setting.experimental && !setting.premium)
      })).filter(category => category.settings.length > 0);
    }

    return categories;
  }, [settingsCategories, searchQuery, activeFilter, favorites, recentlyModified, showAdvanced]);

  // 更新设置值
  const updateSetting = useCallback((settingId: string, value: any) => {
    const [category, key] = settingId.split('.');
    
    // 更新最近修改列表
    setRecentlyModified(prev => new Set([...prev, settingId]));
    
    // 根据分类更新设置
    switch (category) {
      case 'timer':
        if (key === 'focusDuration' || key === 'shortBreakDuration' || key === 'longBreakDuration') {
          settingsStore.updateTimerSettings({ [key]: value * 60 });
        } else {
          settingsStore.updateTimerSettings({ [key]: value });
        }
        break;
      case 'notifications':
        settingsStore.updateNotificationSettings({ [key]: value });
        break;
      case 'appearance':
        if (key === 'theme') {
          updatePreferences({ mode: value });
        } else if (key === 'fontSize') {
          updatePreferences({ fontSize: value });
        } else if (key === 'reducedMotion') {
          updatePreferences({ reducedMotion: value });
        } else if (key === 'highContrast') {
          updatePreferences({ highContrast: value });
        }
        break;
      case 'audio':
        settingsStore.updateAudioSettings({ [key]: value });
        break;
      case 'privacy':
        settingsStore.updatePrivacySettings({ [key]: value });
        break;
      default:
        console.warn(`Unknown setting category: ${category}`);
    }
  }, [settingsStore, updatePreferences]);

  // 切换收藏
  const toggleFavorite = useCallback((settingId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(settingId)) {
        newFavorites.delete(settingId);
      } else {
        newFavorites.add(settingId);
      }
      return newFavorites;
    });
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

  // 应用预设
  const applyPreset = useCallback((presetId: string) => {
    const preset = settingsPresets.find(p => p.id === presetId);
    if (preset) {
      Object.entries(preset.settings).forEach(([key, value]) => {
        updateSetting(key, value);
      });
      setSelectedPreset(presetId);
    }
  }, [settingsPresets, updateSetting]);

  // 导出数据
  const handleExportData = useCallback(() => {
    const data = {
      settings: settingsStore.settings,
      favorites: Array.from(favorites),
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focusflow-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [settingsStore.settings, favorites]);

  // 清除数据
  const handleClearData = useCallback(() => {
    setShowResetDialog(true);
    setResetTarget('all');
  }, []);

  // 确认重置
  const confirmReset = useCallback(() => {
    if (resetTarget === 'all') {
      settingsStore.resetAllSettings();
      setFavorites(new Set());
      setRecentlyModified(new Set());
    } else {
      settingsStore.resetSettings(resetTarget as any);
    }
    setShowResetDialog(false);
  }, [resetTarget, settingsStore]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'f':
            e.preventDefault();
            searchInputRef.current?.focus();
            break;
          case 's':
            e.preventDefault();
            settingsStore.markSaved();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [settingsStore]);

  // 渲染设置项
  const renderSettingItem = useCallback((setting: SettingsItem) => {
    const isDisabled = setting.dependencies?.some(dep => {
      const [category, key] = dep.split('.');
      const categorySettings = settingsStore.settings[category as keyof typeof settingsStore.settings];
      return !categorySettings?.[key as keyof typeof categorySettings];
    });
    
    const isFavorite = favorites.has(setting.id);
    const isModified = setting.value !== setting.defaultValue;

    return (
      <motion.div
        key={setting.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          'group relative flex items-center justify-between p-4 border rounded-lg transition-all',
          isDisabled && 'opacity-50',
          setting.experimental && 'border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-900/10',
          setting.premium && 'border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-900/10',
          isModified && 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10',
          'hover:shadow-sm hover:border-primary/20'
        )}
      >
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{setting.name}</span>
            
            {/* 标签 */}
            {setting.experimental && (
              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full dark:bg-yellow-900/20 dark:text-yellow-400">
                实验性
              </span>
            )}
            {setting.premium && (
              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full dark:bg-purple-900/20 dark:text-purple-400">
                高级
              </span>
            )}
            {setting.restartRequired && isModified && (
              <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full dark:bg-orange-900/20 dark:text-orange-400">
                需重启
              </span>
            )}
            
            {/* 收藏按钮 */}
            <button
              onClick={() => toggleFavorite(setting.id)}
              className={cn(
                'opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded',
                isFavorite && 'opacity-100 text-yellow-500'
              )}
              title={isFavorite ? '取消收藏' : '添加收藏'}
            >
              <Star className={cn('h-3 w-3', isFavorite && 'fill-current')} />
            </button>
          </div>
          
          <p className="text-sm text-muted-foreground">{setting.description}</p>
          
          {/* 标签 */}
          {setting.tags && setting.tags.length > 0 && (
            <div className="flex gap-1 mt-1">
              {setting.tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 text-xs bg-muted text-muted-foreground rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
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
              <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
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
                <option key={option.value} value={option.value} title={option.description}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
          
          {setting.type === 'action' && (
            <Button
              variant="outline"
              size="sm"
              onClick={setting.onAction}
              disabled={isDisabled}
            >
              {setting.name}
            </Button>
          )}
          
          {/* 重置按钮 */}
          {setting.type !== 'action' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => resetSetting(setting.id)}
              disabled={isDisabled || !isModified}
              title="重置为默认值"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </motion.div>
    );
  }, [settingsStore.settings, favorites, updateSetting, toggleFavorite, resetSetting]);

  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* 标题栏 */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold">设置</h1>
          <p className="text-muted-foreground">自定义您的专注体验</p>
        </div>
        <div className="flex items-center gap-2">
          {settingsStore.hasUnsavedChanges && (
            <Button onClick={() => settingsStore.markSaved()} size="sm">
              <Save className="h-4 w-4 mr-2" />
              保存更改
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* 工具栏 */}
      <div className="flex items-center gap-4 p-4 border-b bg-muted/30">
        {/* 搜索 */}
        <div className="flex-1 max-w-md">
          <SearchInput
            ref={searchInputRef}
            placeholder="搜索设置... (Ctrl+F)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
          />
        </div>

        {/* 过滤器 */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as SettingsFilter)}
            className="p-2 border border-input rounded-md bg-background text-sm"
          >
            <option value="all">全部</option>
            <option value="favorites">收藏</option>
            <option value="recent">最近</option>
            <option value="modified">已修改</option>
            <option value="experimental">实验性</option>
            <option value="premium">高级</option>
          </select>
        </div>

        {/* 高级选项 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
          {showAdvanced ? '隐藏高级' : '显示高级'}
        </Button>
      </div>

      {/* 快捷操作 */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">快捷操作</span>
        </div>
        <div className="flex gap-2">
          {quickActions.map(action => {
            const IconComponent = action.icon;
            return (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                onClick={action.action}
                className="flex items-center gap-2"
              >
                <IconComponent className="h-4 w-4" />
                {action.name}
              </Button>
            );
          })}
        </div>
      </div>

      {/* 预设 */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-3">
          <Bookmark className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">预设配置</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {settingsPresets.map(preset => {
            const IconComponent = preset.icon;
            const isSelected = selectedPreset === preset.id;
            return (
              <Button
                key={preset.id}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => applyPreset(preset.id)}
                className="flex items-center gap-2 justify-start h-auto p-3"
              >
                <IconComponent className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">{preset.name}</div>
                  <div className="text-xs text-muted-foreground">{preset.description}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </div>

      {/* 设置内容 */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-6 mx-4 mt-4">
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

          <div className="flex-1 overflow-y-auto p-4">
            <AnimatePresence mode="wait">
              {filteredCategories.map(category => (
                <TabsContent key={category.id} value={category.id} className="space-y-4 mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <category.icon className="h-5 w-5" />
                        {category.name}
                      </h3>
                      <p className="text-muted-foreground">{category.description}</p>
                    </div>
                    
                    <div className="space-y-3">
                      <AnimatePresence>
                        {category.settings.map(renderSettingItem)}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </TabsContent>
              ))}
            </AnimatePresence>
          </div>
        </Tabs>
      </div>

      {/* 重置确认对话框 */}
      <ConfirmDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        title="重置设置"
        description="确定要重置所有设置吗？此操作不可撤销。"
        confirmText="重置"
        cancelText="取消"
        variant="destructive"
        onConfirm={confirmReset}
      />
    </div>
  );
};

export default OptimizedSettingsPanel;