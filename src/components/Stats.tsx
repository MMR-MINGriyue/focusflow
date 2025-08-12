import React from 'react';
import { useStatsStore } from '../stores/statsStore';
import StatsComponent from './Stats/Stats';
import { formatTimeShort } from '../utils/formatTime';

/**
 * 统计页面组件
 * 显示用户的专注统计数据和图表
 */
const Stats: React.FC = () => {
  const { stats, isLoading, error, loadStats } = useStatsStore();

  React.useEffect(() => {
    if (!stats) {
      loadStats();
    }
  }, [loadStats, stats]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg">
        <h2 className="text-xl font-bold text-red-700 mb-2">加载统计数据时出错</h2>
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadStats}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // 准备图表数据
  const chartData = stats.sessionHistory.map(session => ({
    date: session.date,
    focusTime: session.focusTime,
    breakTime: 0, // 暂时设为0，因为没有休息时间数据
    efficiency: session.efficiencyScore || 0,
  }));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">专注统计</h1>
        <p className="text-gray-600">查看您的专注习惯和效率趋势</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium mb-1">总专注时间</h3>
          <p className="text-2xl font-bold">{formatTimeShort(stats.allTime.totalFocusTime * 60)}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium mb-1">完成会话</h3>
          <p className="text-2xl font-bold">{stats.allTime.completedSessions}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium mb-1">当前连续天数</h3>
          <p className="text-2xl font-bold">{stats.focusStreak} 天</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium mb-1">效率评分</h3>
          <p className="text-2xl font-bold">{stats.allTime.efficiencyScore}/100</p>
        </div>
      </div>

      {/* 图表组件 */}
      <StatsComponent dailyStats={chartData} />
    </div>
  );
};

export default Stats;