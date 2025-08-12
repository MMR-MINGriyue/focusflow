import React from 'react';
import UnifiedTimerFinal from '../components/Timer/UnifiedTimerFinal';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Timer } from 'lucide-react';

interface TimerPageProps {
  mode?: 'classic' | 'smart' | 'custom';
}

/**
 * 计时器页面组件
 */
const TimerPage: React.FC<TimerPageProps> = ({ mode = 'classic' }) => {
  const navigate = useNavigate();

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
      () => import('@tauri-apps/api/window').then(({ appWindow }) => 
        appWindow.setTitle(`FocusFlow - ${stateText}`)
      ),
      undefined,
      {
        silent: true, // 静默失败，避免重复错误日志
        logPrefix: 'Update taskbar'
      }
    );
  };

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
              <Timer className="w-6 h-6 mr-2" />
              {mode === 'classic' && '经典计时器'}
              {mode === 'smart' && '智能计时器'}
              {mode === 'custom' && '自定义计时器'}
            </h1>
          </div>
        </div>
      </div>

      {/* 主内容 */}
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <UnifiedTimerFinal
              onStateChange={(state: string) => {
                updateTaskbarState(state as any);
              }}
            />
          </div>

          {/* 模式说明 */}
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4">模式说明</h2>
            {mode === 'classic' && (
              <div className="space-y-4">
                <p className="text-gray-700 dark:text-gray-300">
                  经典番茄工作法是一种时间管理方法，由Francesco Cirillo在20世纪80年代末创立。
                  该方法使用一个计时器将工作分解为25分钟的工作间隔，中间有短休息。
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-700 dark:text-blue-300 mb-2">使用方法</h3>
                  <ol className="list-decimal list-inside space-y-1 text-blue-600 dark:text-blue-400">
                    <li>选择一个任务</li>
                    <li>将计时器设置为25分钟</li>
                    <li>专注于任务，直到计时器响起</li>
                    <li>短暂休息5分钟</li>
                    <li>每完成四个番茄钟，休息15-30分钟</li>
                  </ol>
                </div>
              </div>
            )}

            {mode === 'smart' && (
              <div className="space-y-4">
                <p className="text-gray-700 dark:text-gray-300">
                  智能计时器模式基于您的专注状态自动调整工作时长。它会根据您的输入和反馈，
                  动态调整专注时间和休息时间，以最大化您的工作效率。
                </p>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="font-medium text-green-700 dark:text-green-300 mb-2">智能特性</h3>
                  <ul className="list-disc list-inside space-y-1 text-green-600 dark:text-green-400">
                    <li>根据您的专注水平自动调整工作时长</li>
                    <li>检测分心行为并提供提醒</li>
                    <li>基于历史数据优化时间分配</li>
                    <li>适应您的工作习惯和节奏</li>
                  </ul>
                </div>
              </div>
            )}

            {mode === 'custom' && (
              <div className="space-y-4">
                <p className="text-gray-700 dark:text-gray-300">
                  自定义计时器模式允许您完全控制您的工作节奏。您可以设置任意长度的工作时间和休息时间，
                  以适应您的个人工作习惯和项目需求。
                </p>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <h3 className="font-medium text-purple-700 dark:text-purple-300 mb-2">自定义选项</h3>
                  <ul className="list-disc list-inside space-y-1 text-purple-600 dark:text-purple-400">
                    <li>设置任意长度的工作时间</li>
                    <li>自定义短休息和长休息时间</li>
                    <li>调整长休息间隔</li>
                    <li>配置自动开始选项</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TimerPage;
