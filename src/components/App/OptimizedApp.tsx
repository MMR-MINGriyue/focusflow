/**
 * 优化的应用入口组件
 * 整合所有优化，提供最佳用户体验
 */

import React, { useEffect, useState } from 'react';
import { FinalTimer } from '../Timer/FinalTimer';
import { registerServicesEnhanced } from '../../container/registerServicesEnhanced';
import { ThemeProvider } from '../ui/base/ThemeProvider';
import { cn } from '../../utils/cn';
import { PerformanceMonitorService } from '../../infrastructure/services/PerformanceMonitorService';
import { container } from '../../container/IoCContainer';

interface OptimizedAppProps {
  /**
   * 应用标题
   */
  title?: string;
  /**
   * 应用描述
   */
  description?: string;
  /**
   * 是否显示性能监控
   */
  showPerformanceMonitor?: boolean;
  /**
   * 是否显示调试信息
   */
  showDebugInfo?: boolean;
  /**
   * 自定义样式
   */
  className?: string;
}

/**
 * 优化的应用入口组件
 */
export const OptimizedApp: React.FC<OptimizedAppProps> = ({
  title = '专注计时器',
  description = '高效管理您的专注时间',
  showPerformanceMonitor = false,
  showDebugInfo = false,
  className
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);

  // 初始化应用
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 注册所有服务
        registerServicesEnhanced();

        // 初始化性能监控服务
        if (showPerformanceMonitor) {
          try {
            const performanceMonitor = container.resolve('performanceMonitorService');
            await performanceMonitor.initialize();

            // 添加性能指标观察者
            performanceMonitor.addObserver((metric) => {
              if (showDebugInfo) {
                console.log('Performance metric:', metric);
              }
            });

            // 定期更新性能指标
            const updateMetrics = () => {
              const report = performanceMonitor.getReport();
              setPerformanceMetrics(report.summary);
            };

            // 立即更新一次
            updateMetrics();

            // 每5秒更新一次
            const intervalId = setInterval(updateMetrics, 5000);

            // 清理函数
            return () => {
              clearInterval(intervalId);
              performanceMonitor.destroy();
            };
          } catch (error) {
            console.warn('Failed to initialize performance monitor:', error);
          }
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setInitializationError(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    initializeApp();
  }, [showPerformanceMonitor, showDebugInfo]);

  // 处理初始化错误
  if (initializationError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">应用初始化失败</h1>
          <p className="text-gray-700 mb-6">{initializationError}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  // 处理未初始化状态
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{title}</h1>
            <p className="text-gray-600">正在初始化应用...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className={cn('min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800', className)}>
        {/* 应用头部 */}
        <header className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
                <p className="mt-1 text-gray-500 dark:text-gray-400">{description}</p>
              </div>
              {showDebugInfo && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <div>版本: 1.0.0</div>
                  <div>环境: {process.env.NODE_ENV}</div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 主内容区 */}
        <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* 计时器区域 */}
            <div className="flex-1">
              <FinalTimer
                onStateChange={(state) => {
                  if (showDebugInfo) {
                    console.log('Timer state changed:', state);
                  }
                }}
                displayMode="default"
                showStats={true}
                showAdvancedControls={true}
              />
            </div>

            {/* 侧边栏 */}
            <div className="w-full lg:w-80">
              {/* 性能监控面板 */}
              {showPerformanceMonitor && performanceMetrics && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">性能监控</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">平均加载时间</span>
                      <span className="font-medium">{performanceMetrics.averageLoadTime.toFixed(2)} ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">平均响应时间</span>
                      <span className="font-medium">{performanceMetrics.averageResponseTime.toFixed(2)} ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">内存使用</span>
                      <span className="font-medium">{(performanceMetrics.memoryUsage / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">帧率</span>
                      <span className="font-medium">{performanceMetrics.fps} FPS</span>
                    </div>
                    {performanceMetrics.issues.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">性能问题</h3>
                        <ul className="text-sm text-red-500 dark:text-red-300 space-y-1">
                          {performanceMetrics.issues.map((issue: string, index: number) => (
                            <li key={index}>• {issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 统计信息面板 */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">使用统计</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">今日专注</span>
                    <span className="font-medium">2小时15分钟</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">今日休息</span>
                    <span className="font-medium">30分钟</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">完成会话</span>
                    <span className="font-medium">5次</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">平均效率</span>
                    <span className="font-medium">85%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* 应用页脚 */}
        <footer className="bg-white dark:bg-gray-800 shadow-sm mt-12">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                © {new Date().getFullYear()} {title}. 保留所有权利。
              </p>
              <div className="mt-4 md:mt-0 flex space-x-6">
                <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm">
                  隐私政策
                </a>
                <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm">
                  使用条款
                </a>
                <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm">
                  帮助中心
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
};
