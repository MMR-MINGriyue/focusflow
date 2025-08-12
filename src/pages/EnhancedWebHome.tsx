
/**
 * 增强版Web主页组件
 * 应用现代化Web设计，提供更丰富的视觉效果和交互体验
 */

import React, { useState, useCallback, useEffect } from 'react';
import EnhancedWebTimer from '../components/Timer/EnhancedWebTimer';
import Stats from '../components/Stats/Stats';
import DatabaseStats from '../components/Stats/DatabaseStats';
import HealthCheck from '../components/HealthCheck';
import KeyboardShortcutsHelp from '../components/KeyboardShortcutsHelp';
import OnboardingTour from '../components/OnboardingTour';
import ThemeToggle from '../components/ThemeToggle';
import { ModernTabs, ModernTabsContent, ModernTabsList, ModernTabsTrigger } from '../components/ui/ModernTabs';
import { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardContent, ModernCardFooter } from '../components/ui/ModernCard';
import { ModernButton } from '../components/ui/ModernButton';
import { ModernNavbar } from '../components/ui/ModernNavbar';
import { ModernSidebar, SidebarTrigger, SidebarOverlay } from '../components/ui/ModernSidebar';
import { Clock, BarChart3, BarChart2, Database, Zap, Settings, Info, Sparkles, Award, Target, Home, Timer, Cog, HelpCircle } from 'lucide-react';
import { useKeyboardShortcuts, commonShortcuts } from '../hooks/useKeyboardShortcuts';
import { useUnifiedTimerStore } from '../stores/unifiedTimerStore';
import { useSystemTray } from '../hooks/useSystemTray';
import { TimerMode } from '../types/unifiedTimer';
import { useTheme } from '../hooks/useTheme';
import { wrapFunction } from '../utils/errorHandler';
import { useNotification } from '../components/ui/ModernNotificationSystem';

const EnhancedWebHome: React.FC = () => {
  const [stats, setStats] = useState([
    {
      date: new Date().toLocaleDateString(),
      focusTime: 0,
      breakTime: 0,
      efficiency: 0,
    },
  ]);

  const [activeTab, setActiveTab] = useState('timer');
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // 通知功能
  const { addNotification } = useNotification();

  // 初始化主题系统
  const { theme, actualTheme } = useTheme();

  // 获取统一计时器控制函数
  const { start, pause, reset, switchMode, isActive } = useUnifiedTimerStore();

  // 确保主题正确应用
  useEffect(() => {
    // 主题已经在useTheme hook中自动初始化
    console.log('Current theme:', theme, 'Actual theme:', actualTheme);
  }, [theme, actualTheme]);

  // 系统托盘集成（仅在桌面版可用）
  const handleFocusMode = useCallback(() => {
    setActiveTab('timer');
    switchMode(TimerMode.SMART);
    start();
  }, [switchMode, start]);

  const handleBreakMode = useCallback(() => {
    setActiveTab('timer');
    // 可以添加跳转到休息的逻辑
  }, []);

  // 检查是否在桌面环境中
  const isDesktopEnvironment = useCallback(() => {
    return typeof window !== 'undefined' &&
           window.__TAURI__ !== undefined;
  }, []);

  // 仅在桌面环境中使用系统托盘
  if (isDesktopEnvironment()) {
    useSystemTray({
      onFocusMode: handleFocusMode,
      onBreakMode: handleBreakMode,
    });
  }

  // 定义快捷键
  const shortcuts = [
    {
      ...commonShortcuts.SPACE,
      action: () => {
        if (isActive) {
          pause();
        } else {
          start();
        }
      },
      displayKey: 'Space',
    },
    {
      ...commonShortcuts.R,
      action: () => reset(),
      displayKey: 'R',
    },
    {
      ...commonShortcuts.T,
      action: () => setActiveTab('timer'),
      description: '切换到计时器标签',
      displayKey: 'T',
    },
    {
      key: 'I',
      ctrlKey: true,
      action: () => setActiveTab('smart-timer'),
      description: '切换到智能计时器标签',
      displayKey: 'Ctrl + I',
    },
    {
      ...commonShortcuts.STATS,
      action: () => setActiveTab('stats'),
      description: '切换到统计标签',
      displayKey: 'S',
    },
    {
      ...commonShortcuts.D,
      action: () => setActiveTab('database'),
      description: '切换到数据库标签',
      displayKey: 'D',
    },
    {
      key: 'P',
      ctrlKey: true,
      action: () => console.log('性能演示快捷键已触发'),
      description: '打开性能演示',
      displayKey: 'Ctrl + P',
    },
    {
      ...commonShortcuts.H,
      action: () => setShowShortcutsHelp(true),
      description: '显示快捷键帮助',
      displayKey: 'H',
    },
    {
      ...commonShortcuts.QUESTION,
      action: () => setShowShortcutsHelp(true),
      description: '显示快捷键帮助',
      displayKey: '?',
    },
    {
      ...commonShortcuts.ESCAPE,
      action: () => setShowShortcutsHelp(false),
      description: '关闭帮助对话框',
      displayKey: 'Esc',
    },
  ];

  // 使用快捷键
  const { shortcuts: formattedShortcuts } = useKeyboardShortcuts({
    enabled: true,
    shortcuts,
  });

  // 更新任务栏状态（仅在桌面版）
  const updateTaskbarState = useCallback(async (state: 'focus' | 'break' | 'microBreak') => {
    if (!isDesktopEnvironment()) {
      return; // 非Tauri环境不更新任务栏
    }

    // 动态导入，避免在Web环境中加载
    const { appWindow } = await import('@tauri-apps/api/window');
    const { safeTauriCall } = await import('../utils/environment');

    const stateText = state === 'focus' ? '专注中' :
                     state === 'break' ? '休息中' : '微休息中';

    await safeTauriCall(
      () => appWindow.setTitle(`FocusFlow - ${stateText}`),
      undefined,
      {
        silent: true, // 静默失败，避免重复错误日志
        logPrefix: 'Update taskbar'
      }
    );
  }, [isDesktopEnvironment]);

  // 更新统计数据
  const updateStats = useCallback((state: 'focus' | 'break' | 'microBreak') => {
    setStats(prevStats => {
      const today = new Date().toLocaleDateString();
      const lastStat = prevStats[prevStats.length - 1];

      if (lastStat.date === today) {
        const updatedStat = {
          ...lastStat,
          [state === 'focus' ? 'focusTime' : 'breakTime']:
            lastStat[state === 'focus' ? 'focusTime' : 'breakTime'] +
            (state === 'focus' ? 90 : 20),
        };
        return [...prevStats.slice(0, -1), updatedStat];
      }

      return [...prevStats, {
        date: today,
        focusTime: state === 'focus' ? 90 : 0,
        breakTime: state === 'break' ? 20 : 0,
        efficiency: 0,
      }];
    });
  }, []);

  // 侧边栏导航项
  const sidebarItems = [
    {
      id: 'dashboard',
      label: '仪表盘',
      icon: <Home className="h-5 w-5" />,
      href: '/enhanced',
    },
    {
      id: 'timer',
      label: '计时器',
      icon: <Timer className="h-5 w-5" />,
      href: '/enhanced',
    },
    {
      id: 'stats',
      label: '统计',
      icon: <BarChart2 className="h-5 w-5" />,
      href: '/enhanced',
    },
    {
      id: 'settings',
      label: '设置',
      icon: <Cog className="h-5 w-5" />,
      href: '/enhanced',
    },
    {
      id: 'help',
      label: '帮助',
      icon: <HelpCircle className="h-5 w-5" />,
      href: '/enhanced',
    },
  ];

  // 关闭欢迎界面
  const closeWelcome = useCallback(() => {
    setShowWelcome(false);
    // 保存用户已看过欢迎界面的状态
    localStorage.setItem('welcomeSeen', 'true');
  }, []);

  // 检查用户是否已看过欢迎界面
  useEffect(() => {
    const welcomeSeen = localStorage.getItem('welcomeSeen');
    if (welcomeSeen) {
      setShowWelcome(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-colors">
      {/* 欢迎界面 */}
      {showWelcome && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <ModernCard className="max-w-md w-full transform transition-all duration-300 scale-95 animate-scale-in">
            <ModernCardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <ModernCardTitle className="text-2xl">
                欢迎使用增强版番茄工作法
              </ModernCardTitle>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                全新设计的界面，更丰富的功能，助您提升工作效率
              </p>
            </ModernCardHeader>

            <ModernCardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="mt-1 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 dark:text-gray-200">专注模式</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">科学计时，帮助您保持专注状态</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="mt-1 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Award className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 dark:text-gray-200">成就系统</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">记录您的进步，激励持续提升</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="mt-1 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 dark:text-gray-200">数据分析</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">详尽的统计，帮助您了解工作模式</p>
                </div>
              </div>
            </ModernCardContent>

            <ModernCardFooter className="pt-2">
              <div className="flex justify-center">
                <ModernButton
                  onClick={closeWelcome}
                  variant="gradient"
                  className="px-6 py-3"
                >
                  开始体验
                </ModernButton>
              </div>
            </ModernCardFooter>
          </ModernCard>
        </div>
      )}

      {/* 现代化导航栏 */}
      <ModernNavbar
        brand="番茄工作法"
        brandHref="/enhanced"
        actions={
          <div className="flex items-center space-x-4">
            <ThemeToggle variant="dropdown" />
            <SidebarTrigger 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              isOpen={isSidebarOpen} 
            />
          </div>
        }
        themeToggle={false}
        mobileMenu={false}
      />

      <main className="container mx-auto py-6 px-4">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Timer Section */}
          <div className="xl:col-span-2 space-y-6">
            <div className="enhanced-card p-6">
              <EnhancedWebTimer
                onStateChange={wrapFunction((state: string) => {
                  updateTaskbarState(state as any);
                  updateStats(state as any);
                }, { component: 'EnhancedWebHome', action: 'handleStateChange' })}
                displayMode="enhanced"
                enableAnimations={true}
                showAdvancedFeatures={true}
              />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="enhanced-card p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">0</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">今日完成</div>
              </div>
              <div className="enhanced-card p-4 text-center">
                <div className="text-2xl font-bold text-green-600">25</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">专注时长(分钟)</div>
              </div>
              <div className="enhanced-card p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">1</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">连续天数</div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="enhanced-card p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                快速操作
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('timer')}
                  className="w-full px-3 py-2 gradient-button rounded-lg text-sm"
                >
                  开始专注
                </button>
                <button
                  onClick={() => setActiveTab('performance')}
                  className="w-full px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
                >
                  性能演示
                </button>
              </div>
            </div>

            {/* Shortcuts */}
            <div className="enhanced-card p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Info className="w-5 h-5 mr-2" />
                快捷键
              </h3>
              <KeyboardShortcutsHelp shortcuts={shortcuts} />
            </div>

            {/* Tour */}
            <div className="enhanced-card p-4">
              <h3 className="text-lg font-semibold mb-3">新手指南</h3>
              <OnboardingTour />
            </div>
          </div>
        </div>

          {/* Tabs Section */}
          <div className="mt-6">
            <ModernTabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <ModernTabsList className="grid w-full grid-cols-4">
                <ModernTabsTrigger value="timer" className="flex items-center justify-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>计时器</span>
                </ModernTabsTrigger>
                <ModernTabsTrigger value="performance" className="flex items-center justify-center space-x-2">
                  <Zap className="h-4 w-4" />
                  <span>性能演示</span>
                </ModernTabsTrigger>
                <ModernTabsTrigger value="stats" className="flex items-center justify-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>统计</span>
                </ModernTabsTrigger>
                <ModernTabsTrigger value="database" className="flex items-center justify-center space-x-2">
                  <Database className="h-4 w-4" />
                  <span>数据库</span>
                </ModernTabsTrigger>
              </ModernTabsList>

              <ModernTabsContent value="timer" className="mt-4">
                <ModernCard className="p-6">
                  <EnhancedWebTimer
                    onStateChange={wrapFunction((state: string) => {
                      updateTaskbarState(state as any);
                      updateStats(state as any);
                    }, { component: 'EnhancedWebHome', action: 'handleStateChange' })}
                    displayMode="enhanced"
                    enableAnimations={true}
                    showAdvancedFeatures={true}
                  />
                </ModernCard>
              </ModernTabsContent>

              <ModernTabsContent value="performance" className="mt-4">
                <ModernCard className="p-6">
                  <ModernCardHeader className="text-center mb-6">
                    <ModernCardTitle className="text-2xl">Phase 2 性能优化演示</ModernCardTitle>
                    <p className="text-gray-600 dark:text-gray-400">体验WebAssembly、Web Worker和CDN优化的性能提升</p>
                  </ModernCardHeader>
                  <ModernCardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <ModernCard className="text-center p-4 bg-blue-50 dark:bg-blue-900/20">
                        <Zap className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                        <h3 className="font-semibold mb-1">综合演示</h3>
                        <a href="/performance-demo" className="text-sm text-blue-600 hover:underline">开始演示 →</a>
                      </ModernCard>
                      <ModernCard className="text-center p-4 bg-green-50 dark:bg-green-900/20">
                        <Zap className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                        <h3 className="font-semibold mb-1">Web Worker</h3>
                        <a href="/worker-demo" className="text-sm text-green-600 hover:underline">开始演示 →</a>
                      </ModernCard>
                      <ModernCard className="text-center p-4 bg-purple-50 dark:bg-purple-900/20">
                        <BarChart3 className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                        <h3 className="font-semibold mb-1">性能对比</h3>
                        <a href="/comparison" className="text-sm text-purple-600 hover:underline">开始对比 →</a>
                      </ModernCard>
                    </div>
                  </ModernCardContent>
                </ModernCard>
              </ModernTabsContent>

              <ModernTabsContent value="stats" className="mt-4">
                <ModernCard className="p-6">
                  <Stats dailyStats={stats} />
                </ModernCard>
              </ModernTabsContent>

              <ModernTabsContent value="database" className="mt-4">
                <ModernCard>
                  <DatabaseStats />
                </ModernCard>
              </ModernTabsContent>
            </ModernTabs>
          </div>
      </main>

      {/* 健康检查组件 */}
      <HealthCheck />

      {/* 快捷键帮助 */}
      <KeyboardShortcutsHelp
        shortcuts={formattedShortcuts}
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />

      {/* 首次使用引导 */}
      <OnboardingTour />
    </div>
  );
};

export default EnhancedWebHome;
