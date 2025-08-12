import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ArrowLeft, BarChart3, Calendar, TrendingUp, Award, Clock } from 'lucide-react';
import Stats from '../components/Stats';
import { useStatsStore } from '../stores/statsStore';

interface StatsPageProps {
  view?: 'daily' | 'weekly' | 'monthly';
}

/**
 * 统计页面组件
 */
const StatsPage: React.FC<StatsPageProps> = ({ view = 'daily' }) => {
  const navigate = useNavigate();
  const { stats, isLoading, error, loadStats } = useStatsStore();
  const [activeView, setActiveView] = useState<'daily' | 'weekly' | 'monthly'>(view);

  useEffect(() => {
    if (!stats) {
      loadStats();
    }
  }, [loadStats, stats]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* 顶部导航 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="mr-4"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <BarChart3 className="w-6 h-6 mr-2" />
                专注统计
              </h1>
            </div>

            {/* 视图切换 */}
            <div className="flex space-x-2">
              <Button
                variant={activeView === 'daily' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveView('daily')}
              >
                每日
              </Button>
              <Button
                variant={activeView === 'weekly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveView('weekly')}
              >
                每周
              </Button>
              <Button
                variant={activeView === 'monthly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveView('monthly')}
              >
                每月
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容 */}
      <main className="container mx-auto py-8 px-4">
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-red-700 dark:text-red-300 mb-2">加载统计数据时出错</h2>
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button 
              onClick={loadStats}
              variant="outline"
            >
              重试
            </Button>
          </div>
        )}

        {stats && !isLoading && !error && (
          <div className="space-y-8">
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                    <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">总专注时间</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {Math.floor(stats.allTime.totalFocusTime / 60)}小时{stats.allTime.totalFocusTime % 60}分钟
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mr-3">
                    <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">完成会话</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.allTime.completedSessions}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-3">
                    <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">当前连续天数</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.focusStreak}天
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg mr-3">
                    <BarChart3 className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">效率评分</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.allTime.efficiencyScore}/100
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 统计图表 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {activeView === 'daily' && '每日专注统计'}
                  {activeView === 'weekly' && '每周专注统计'}
                  {activeView === 'monthly' && '每月专注统计'}
                </h2>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>
                    {activeView === 'daily' && '最近7天'}
                    {activeView === 'weekly' && '最近4周'}
                    {activeView === 'monthly' && '最近6个月'}
                  </span>
                </div>
              </div>

              <Stats />
            </div>

            {/* 成就徽章 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">成就徽章</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-lg border-2 ${
                  stats.focusStreak >= 7 
                    ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' 
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                }`}>
                  <div className="text-center">
                    <div className="text-3xl mb-2">🥉</div>
                    <h3 className="font-medium mb-1">新芽勋章</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">连续7天专注</p>
                    {stats.focusStreak >= 7 && (
                      <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400 font-medium">已获得</div>
                    )}
                  </div>
                </div>

                <div className={`p-4 rounded-lg border-2 ${
                  stats.focusStreak >= 14 
                    ? 'border-gray-400 bg-gray-100 dark:bg-gray-800/50' 
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                }`}>
                  <div className="text-center">
                    <div className="text-3xl mb-2">🥈</div>
                    <h3 className="font-medium mb-1">心流入门</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">连续14天专注</p>
                    {stats.focusStreak >= 14 && (
                      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-medium">已获得</div>
                    )}
                  </div>
                </div>

                <div className={`p-4 rounded-lg border-2 ${
                  stats.focusStreak >= 30 
                    ? 'border-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' 
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                }`}>
                  <div className="text-center">
                    <div className="text-3xl mb-2">🥇</div>
                    <h3 className="font-medium mb-1">深度专注者</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">连续30天专注</p>
                    {stats.focusStreak >= 30 && (
                      <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400 font-medium">已获得</div>
                    )}
                  </div>
                </div>

                <div className={`p-4 rounded-lg border-2 ${
                  stats.allTime.completedSessions >= 100 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                }`}>
                  <div className="text-center">
                    <div className="text-3xl mb-2">🏆</div>
                    <h3 className="font-medium mb-1">番茄大师</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">完成100个番茄</p>
                    {stats.allTime.completedSessions >= 100 && (
                      <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium">已获得</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StatsPage;
