import React, { useState, useCallback, useEffect } from 'react';
import UnifiedTimer from '../components/Timer/UnifiedTimer';
import Stats from '../components/Stats/Stats';
import DatabaseStats from '../components/Stats/DatabaseStats';
import HealthCheck from '../components/HealthCheck';
import KeyboardShortcutsHelp from '../components/KeyboardShortcutsHelp';
import OnboardingTour from '../components/OnboardingTour';
import ThemeToggle from '../components/ThemeToggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Clock, BarChart3, Database } from 'lucide-react';
import { appWindow } from '@tauri-apps/api/window';
import { useKeyboardShortcuts, commonShortcuts } from '../hooks/useKeyboardShortcuts';
import { useUnifiedTimerStore } from '../stores/unifiedTimerStore';
import { useSystemTray } from '../hooks/useSystemTray';
import { TimerMode } from '../types/unifiedTimer';
import { useTheme } from '../hooks/useTheme';

const Home: React.FC = () => {
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

  // 初始化主题系统
  const { theme, actualTheme } = useTheme();

  // 获取统一计时器控制函数
  const { start, pause, reset, switchMode, isActive } = useUnifiedTimerStore();

  // 确保主题正确应用
  useEffect(() => {
    // 主题已经在useTheme hook中自动初始化
    console.log('Current theme:', theme, 'Actual theme:', actualTheme);
  }, [theme, actualTheme]);

  // 系统托盘集成
  const handleFocusMode = useCallback(() => {
    setActiveTab('timer');
    switchMode(TimerMode.SMART);
    start();
  }, [switchMode, start]);

  const handleBreakMode = useCallback(() => {
    setActiveTab('timer');
    // 可以添加跳转到休息的逻辑
  }, []);

  useSystemTray({
    onFocusMode: handleFocusMode,
    onBreakMode: handleBreakMode,
  });

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
    },
    {
      ...commonShortcuts.R,
      action: () => reset(),
    },
    {
      ...commonShortcuts.T,
      action: () => setActiveTab('timer'),
      description: '切换到计时器标签',
    },
    {
      key: 'I',
      ctrlKey: true,
      action: () => setActiveTab('smart-timer'),
      description: '切换到智能计时器标签',
    },
    {
      ...commonShortcuts.STATS,
      action: () => setActiveTab('stats'),
      description: '切换到统计标签',
    },
    {
      ...commonShortcuts.D,
      action: () => setActiveTab('database'),
      description: '切换到数据库标签',
    },
    {
      ...commonShortcuts.H,
      action: () => setShowShortcutsHelp(true),
      description: '显示快捷键帮助',
    },
    {
      ...commonShortcuts.QUESTION,
      action: () => setShowShortcutsHelp(true),
      description: '显示快捷键帮助',
    },
    {
      ...commonShortcuts.ESCAPE,
      action: () => setShowShortcutsHelp(false),
      description: '关闭帮助对话框',
    },
  ];

  // 使用快捷键
  const { shortcuts: formattedShortcuts } = useKeyboardShortcuts({
    enabled: true,
    shortcuts,
  });

  // 更新任务栏图标颜色
  const updateTaskbarState = async (state: 'focus' | 'break' | 'microBreak') => {
    // 导入环境检测工具
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
  };

  // 更新统计数据
  const updateStats = (state: 'focus' | 'break' | 'microBreak') => {
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
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* 顶部工具栏 */}
      <div className="fixed top-4 right-4 z-30 flex items-center space-x-2">
        <ThemeToggle variant="dropdown" />
      </div>
      <main className="container mx-auto py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-colors">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b px-6 pt-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger
                  value="timer"
                  className="flex items-center space-x-2"
                  data-tour="timer-tab"
                >
                  <Clock className="h-4 w-4" />
                  <span>计时器</span>
                </TabsTrigger>
                <TabsTrigger
                  value="stats"
                  className="flex items-center space-x-2"
                  data-tour="stats-tab"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>统计</span>
                </TabsTrigger>
                <TabsTrigger
                  value="database"
                  className="flex items-center space-x-2"
                  data-tour="database-tab"
                >
                  <Database className="h-4 w-4" />
                  <span>数据库</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="timer" className="p-6">
              <UnifiedTimer
                onStateChange={(state: string) => {
                  updateTaskbarState(state as any);
                  updateStats(state as any);
                }}
                className="max-w-4xl mx-auto"
              />
            </TabsContent>

            <TabsContent value="stats" className="p-6">
              <Stats dailyStats={stats} />
            </TabsContent>

            <TabsContent value="database" className="p-0">
              <DatabaseStats />
            </TabsContent>
          </Tabs>
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

export default Home; 