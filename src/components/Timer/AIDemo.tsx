import React, { useState, useEffect } from 'react';
import { AIRecommendations } from '../AIRecommendations';
import { aiSuggestions } from '../../utils/aiSuggestions';

interface AIDemoProps {
  className?: string;
  onClose?: () => void;
}

export const AIDemo: React.FC<AIDemoProps> = ({ className = '' }) => {
  const [usageStats, setUsageStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeDemo();
  }, []);

  const initializeDemo = async () => {
    try {
      setIsLoading(true);
      await aiSuggestions.initialize();
      
      // 模拟一些使用数据来展示AI功能
      await simulateUsageData();
      
      const stats = await aiSuggestions.getUsageStats();
      setUsageStats(stats);
    } catch (error) {
      console.error('AI demo initialization failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const simulateUsageData = async () => {
    // 模拟一周的使用数据
    const mockData = [
      { type: 'focus', duration: 25, timestamp: Date.now() - 86400000 * 7 },
      { type: 'break', duration: 5, timestamp: Date.now() - 86400000 * 7 + 1500000 },
      { type: 'focus', duration: 25, timestamp: Date.now() - 86400000 * 6 },
      { type: 'break', duration: 5, timestamp: Date.now() - 86400000 * 6 + 1500000 },
      { type: 'focus', duration: 30, timestamp: Date.now() - 86400000 * 5 },
      { type: 'focus', duration: 20, timestamp: Date.now() - 86400000 * 4 },
      { type: 'break', duration: 10, timestamp: Date.now() - 86400000 * 4 + 1200000 },
      { type: 'focus', duration: 45, timestamp: Date.now() - 86400000 * 3 },
      { type: 'focus', duration: 25, timestamp: Date.now() - 86400000 * 2 },
      { type: 'break', duration: 5, timestamp: Date.now() - 86400000 * 2 + 1500000 },
    ];

    for (const session of mockData) {
      await aiSuggestions.recordSession(session.duration, session.type as 'focus' | 'break' | 'longBreak');
    }
  };

  const resetDemoData = async () => {
    try {
      setIsLoading(true);
      // 清除现有数据
      await aiSuggestions.clearData();
      
      // 重新初始化
      await initializeDemo();
    } catch (error) {
      console.error('Failed to reset demo data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 py-8 ${className}`}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">正在加载AI智能建议...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 py-8 ${className}`}>
      <div className="max-w-6xl mx-auto px-4">
        {/* 头部 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            🤖 AI智能建议演示
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            体验FocusFlow的AI驱动个性化建议系统，基于您的使用模式提供智能优化建议
          </p>
        </div>

        {/* 使用统计卡片 */}
        {usageStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <div className="text-2xl font-bold text-blue-600">
                {usageStats.totalSessions}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">总会话数</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(usageStats.averageFocusDuration)}分钟
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">平均专注时长</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(usageStats.productivityScore)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">生产力评分</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <div className="text-2xl font-bold text-orange-600">
                {usageStats.peakHourStart}:00-{usageStats.peakHourEnd}:00
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">高效时段</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* AI建议面板 */}
          <div className="lg:col-span-2">
            <AIRecommendations />
          </div>

          {/* 控制面板 */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                演示控制
              </h3>
              <div className="space-y-3">
                <button
                  onClick={resetDemoData}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  重置演示数据
                </button>
                <button
                  onClick={async () => {
                    await simulateUsageData();
                    const stats = await aiSuggestions.getUsageStats();
                    setUsageStats(stats);
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  添加更多数据
                </button>
              </div>
            </div>

            {/* 功能说明 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                功能特色
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• 个性化使用模式分析</li>
                <li>• 基于数据的智能建议</li>
                <li>• 实时生产力评分</li>
                <li>• 高效时段识别</li>
                <li>• 健康工作习惯提醒</li>
                <li>• 渐进式优化建议</li>
              </ul>
            </div>

            {/* 技术细节 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                技术实现
              </h3>
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>• 本地数据存储保护隐私</p>
                <p>• 机器学习算法优化</p>
                <p>• 实时性能监控</p>
                <p>• 渐进式建议生成</p>
              </div>
            </div>
          </div>
        </div>

        {/* 底部说明 */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            这些建议基于您的实际使用模式生成，随着使用时间增加，建议会越来越准确
          </p>
        </div>
      </div>
    </div>
  );
};