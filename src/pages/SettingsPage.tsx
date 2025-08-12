import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Settings, User, Bell, Palette, Keyboard, Info } from 'lucide-react';
import SettingsComponent from '../components/Settings/Settings';
import GeneralSettings from '../components/Settings/GeneralSettings';
import NotificationSettings from '../components/Settings/NotificationSettings';
import AppearanceSettings from '../components/Settings/AppearanceSettings';
import ShortcutSettings from '../components/Settings/ShortcutSettings';
import { useSettingsStore } from '../stores/settingsStore';
import { UnifiedTimerSettings } from '../types/unifiedTimer';

/**
 * 设置页面组件
 */
const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings: appSettings } = useSettingsStore();
  
  // 将 AppSettings 转换为 UnifiedTimerSettings
  const unifiedSettings: UnifiedTimerSettings = {
    classic: {
      focusDuration: appSettings.workDuration,
      breakDuration: appSettings.shortBreakDuration,
      microBreakMinInterval: 5,
      microBreakMaxInterval: 15,
      microBreakDuration: 1
    },
    smart: {
      focusDuration: appSettings.workDuration,
      breakDuration: appSettings.shortBreakDuration,
      enableMicroBreaks: appSettings.showMicroBreakReminders,
      microBreakMinInterval: 5,
      microBreakMaxInterval: 15,
      microBreakMinDuration: 1,
      microBreakMaxDuration: 3,
      enableAdaptiveAdjustment: false,
      adaptiveFactorFocus: 1.0,
      adaptiveFactorBreak: 1.0,
      enableCircadianOptimization: false,
      peakFocusHours: [9, 10, 11, 14, 15, 16],
      lowEnergyHours: [13, 15],
      maxContinuousFocusTime: 120,
      forcedBreakThreshold: 150
    },
    notificationEnabled: appSettings.notificationsEnabled,
    volume: appSettings.soundEnabled ? 80 : 0,
    soundEnabled: appSettings.soundEnabled,
    theme: appSettings.theme,
    autoStartBreaks: appSettings.autoStartBreaks,
    autoStartWork: appSettings.autoStartPomodoros
  };
  const [activeTab, setActiveTab] = useState<'general' | 'timer' | 'notifications' | 'appearance' | 'shortcuts'>('general');

  const settingsTabs = [
    { id: 'general', label: '通用', icon: <Settings className="w-5 h-5" /> },
    { id: 'timer', label: '计时器', icon: <User className="w-5 h-5" /> },
    { id: 'notifications', label: '通知', icon: <Bell className="w-5 h-5" /> },
    { id: 'appearance', label: '外观', icon: <Palette className="w-5 h-5" /> },
    { id: 'shortcuts', label: '快捷键', icon: <Keyboard className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* 顶部导航 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="mr-4"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Settings className="w-6 h-6 mr-2" />
              设置
            </h1>
          </div>
        </div>
      </div>

      {/* 主内容 */}
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* 侧边栏 */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
                <nav className="space-y-1">
                  {settingsTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* 设置摘要 */}
              <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Info className="w-5 h-5 mr-2" />
                  设置摘要
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">计时器模式</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {settings.mode === 'classic' ? '经典模式' : '智能模式'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">专注时长</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {settings.workDuration} 分钟
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">通知</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {settings.notificationsEnabled ? '已启用' : '已禁用'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">主题</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {settings.theme === 'light' ? '浅色' : 
                       settings.theme === 'dark' ? '深色' : '系统'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 设置内容 */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                {activeTab === 'general' && <GeneralSettings />}
                {activeTab === 'timer' && <SettingsComponent settings={unifiedSettings} onSettingsChange={(newSettings) => {}} />}
                {activeTab === 'notifications' && (
                  <NotificationSettings 
                    notificationEnabled={settings.notificationsEnabled}
                    onNotificationEnabledChange={(enabled) => {}}
                    soundEnabled={settings.soundEnabled}
                    onSoundEnabledChange={(enabled) => {}}
                  />
                )}
                {activeTab === 'appearance' && <AppearanceSettings />}
                {activeTab === 'shortcuts' && <ShortcutSettings />}
              </div>

              {/* 提示信息 */}
              <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl shadow-lg border border-blue-200 dark:border-blue-800 p-6">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">提示</h3>
                <p className="text-blue-700 dark:text-blue-300">
                  设置更改后会自动保存。某些更改可能需要重启应用程序才能完全生效。
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
