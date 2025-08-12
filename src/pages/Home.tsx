import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Stats from '../components/Stats';
import WorldClock from '../components/WorldClock';
import HealthCheck from '../components/HealthCheck';
import KeyboardShortcutsHelp from '../components/KeyboardShortcutsHelp';
import OnboardingTour from '../components/OnboardingTour';
import { commonShortcuts } from '../hooks/useKeyboardShortcuts';
import Navbar from '../components/Navigation/Navbar';
import Sidebar from '../components/Navigation/Sidebar';
import { Button } from '../components/ui/Button';
import { 
  Timer, 
  BarChart3, 
  Globe, 
  Settings, 
  Play, 
  Pause, 
  RotateCcw,
  Menu,
  Zap,
  Award,
  Users
} from 'lucide-react';
import { appWindow } from '@tauri-apps/api/window';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useUnifiedTimerStore } from '../stores/unifiedTimerStore';
import { useSystemTray } from '../hooks/useSystemTray';
import { useTheme } from '../hooks/useTheme';

import { TimerMode } from '../types/unifiedTimer';
import UnifiedTimerFinal from '../components/Timer/UnifiedTimerFinal';

const HomePage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [activeSection, setActiveSection] = useState('timer');

  // 初始化主题系统
  const { theme, actualTheme } = useTheme();

  // 获取统一计时器控制函数
  const { start, pause, reset, switchMode, isActive } = useUnifiedTimerStore();

  // 确保主题正确应用
  useEffect(() => {
    console.log('Current theme:', theme, 'Actual theme:', actualTheme);
  }, [theme, actualTheme]);

  // 系统托盘集成
  const handleFocusMode = useCallback(() => {
    setActiveSection('timer');
    switchMode(TimerMode.SMART);
    start();
  }, [switchMode, start]);

  const handleBreakMode = useCallback(() => {
    setActiveSection('timer');
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
      displayKey: 'Space',
    },
    {
      ...commonShortcuts.R,
      action: () => reset(),
      displayKey: 'R',
    },
    {
      ...commonShortcuts.T,
      action: () => setActiveSection('timer'),
      description: '切换到计时器',
      displayKey: 'T',
    },
    {
      ...commonShortcuts.STATS,
      action: () => setActiveSection('stats'),
      description: '切换到统计',
      displayKey: 'S',
    },
    {
      key: 'W',
      ctrlKey: true,
      action: () => setActiveSection('world-clock'),
      description: '切换到世界时钟',
      displayKey: 'Ctrl + W',
    },
    {
      key: 'M',
      ctrlKey: true,
      action: () => setIsSidebarOpen(!isSidebarOpen),
      description: '切换侧边栏',
      displayKey: 'Ctrl + M',
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

  // 更新任务栏图标颜色
  const updateTaskbarState = async (state: 'focus' | 'break' | 'microBreak') => {
    // 导入环境检测工具
    const { safeTauriCall, isTauriEnvironment } = await import('../utils/environment');

    if (!isTauriEnvironment()) {
      return; // 非Tauri环境不更新任务栏
    }

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

  // 渲染主要内容
  const renderContent = () => {
    switch (activeSection) {
      case 'timer':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <UnifiedTimerFinal
                  onStateChange={(state: string) => {
                    updateTaskbarState(state as any);
                  }}
                />
              </div>
            </div>

            <div className="space-y-6">
              {/* 快速统计 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    今日统计
                  </h3>
                  <Link to="/stats/enhanced">
                    <Button size="sm" variant="ghost" className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                      查看详情
                    </Button>
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">0</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">完成番茄</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">专注分钟</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">1</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">连续天数</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">85%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">效率评分</div>
                  </div>
                </div>
              </div>

              {/* 快速操作 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  快速操作
                </h3>
                <div className="space-y-3">
                  <Button
                    onClick={() => start()}
                    className="w-full justify-start"
                    variant={isActive ? "secondary" : "default"}
                  >
                    {isActive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                    {isActive ? '暂停专注' : '开始专注'}
                  </Button>
                  <Button
                    onClick={() => reset()}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    重置计时器
                  </Button>
                  <Button
                    onClick={() => setActiveSection('stats')}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    查看统计
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'stats':
        return <Stats />;

      case 'world-clock':
        return <WorldClock />;

      default:
        return (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🚀</div>
            <h2 className="text-2xl font-bold mb-2">功能开发中</h2>
            <p className="text-gray-600 dark:text-gray-400">该功能正在开发中，敬请期待！</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* 导航栏 */}
      <Navbar />

      {/* 侧边栏 */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* 移动端菜单按钮 */}
      <div className="md:hidden fixed bottom-6 right-6 z-40">
        <Button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          size="lg"
          className="w-14 h-14 rounded-full shadow-lg"
        >
          <Menu className="w-6 h-6" />
        </Button>
      </div>

      {/* 主内容区 */}
      <main className="container mx-auto py-6 px-4">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {activeSection === 'timer' && '专注计时器'}
            {activeSection === 'stats' && '专注统计'}
            {activeSection === 'world-clock' && '世界时钟'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {activeSection === 'timer' && '使用番茄工作法提高您的专注力和工作效率'}
            {activeSection === 'stats' && '查看您的专注数据和效率趋势'}
            {activeSection === 'world-clock' && '查看世界各地的时间，与全球团队保持同步'}
          </p>
        </div>

        {/* 快速导航 */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex space-x-2 pb-2">
            <Button
              onClick={() => setActiveSection('timer')}
              variant={activeSection === 'timer' ? 'default' : 'outline'}
              className="flex-shrink-0"
            >
              <Timer className="w-4 h-4 mr-2" />
              计时器
            </Button>
            <Button
              onClick={() => setActiveSection('stats')}
              variant={activeSection === 'stats' ? 'default' : 'outline'}
              className="flex-shrink-0"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              统计
            </Button>
            <Button
              onClick={() => setActiveSection('world-clock')}
              variant={activeSection === 'world-clock' ? 'default' : 'outline'}
              className="flex-shrink-0"
            >
              <Globe className="w-4 h-4 mr-2" />
              世界时钟
            </Button>
          </div>
        </div>

        {/* 主要内容 */}
        {renderContent()}
      </main>

      {/* 功能卡片 */}
      <div className="container mx-auto py-6 px-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">探索更多功能</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            to="/settings"
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">设置</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">自定义您的专注体验</p>
            </div>
          </Link>

          <Link
            to="/performance"
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">性能优化</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">体验优化的性能表现</p>
            </div>
          </Link>

          <Link
            to="/achievements"
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">成就系统</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">解锁专注成就</p>
            </div>
          </Link>

          <Link
            to="/community"
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">社区</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">与其他用户交流经验</p>
            </div>
          </Link>

          <Link
            to="/enhanced"
            className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl shadow-lg border border-blue-200 dark:border-purple-900/30 p-6 hover:shadow-md transition-all hover:scale-[1.02]"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">增强版体验</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">全新设计的界面与功能</p>
              <span className="mt-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full">新功能</span>
            </div>
          </Link>
        </div>
      </div>

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

export default HomePage;
