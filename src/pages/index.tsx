import React, { useState } from 'react';
import Timer from '../components/Timer/Timer';
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
import { useTimerStore } from '../stores/timerStore';

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

  // 获取计时器控制函数
  const { startTimer, pauseTimer, resetTimer, isActive } = useTimerStore();

  // 定义快捷键
  const shortcuts = [
    {
      ...commonShortcuts.SPACE,
      action: () => {
        if (isActive) {
          pauseTimer();
        } else {
          startTimer();
        }
      },
    },
    {
      ...commonShortcuts.R,
      action: () => resetTimer(),
    },
    {
      ...commonShortcuts.T,
      action: () => setActiveTab('timer'),
      description: '切换到计时器标签',
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
    try {
      const stateText = state === 'focus' ? '专注中' :
                       state === 'break' ? '休息中' : '微休息中';
      await appWindow.setTitle(`FocusFlow - ${stateText}`);
    } catch (error) {
      console.error('Failed to update taskbar:', error);
    }
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
              <Timer
                onStateChange={(state) => {
                  updateTaskbarState(state);
                  updateStats(state);
                }}
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