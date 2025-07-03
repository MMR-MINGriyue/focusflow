import React, { useState, useEffect } from 'react';
import { useTimerStore } from '../../stores/timerStore';
import { TestDataGenerator } from '../../utils/testDataGenerator';

interface DatabaseStatsData {
  totalSessions: number;
  totalFocusTime: number;
  totalBreakTime: number;
  totalMicroBreaks: number;
  averageEfficiency: number;
  firstSessionDate: string | null;
  lastSessionDate: string | null;
}

const DatabaseStats: React.FC = () => {
  const [stats, setStats] = useState<DatabaseStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);
  
  const { getDatabaseStats, recentSessions, loadRecentSessions } = useTimerStore();

  useEffect(() => {
    loadStats();
    loadRecentSessions(30); // 加载最近30天的数据
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getDatabaseStats();
      setStats(data);
    } catch (err) {
      setError('Failed to load database statistics');
      console.error('Error loading database stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  // 测试功能
  const runDatabaseTest = async () => {
    setTestResults(['🧪 开始数据库测试...']);

    try {
      // 插入测试数据
      setTestResults(prev => [...prev, '📝 插入测试数据...']);
      const insertResult = await TestDataGenerator.insertTestData({
        days: 7,
        sessionsPerDay: { min: 1, max: 3 }
      });

      if (insertResult.success) {
        setTestResults(prev => [...prev, `✅ 成功插入 ${insertResult.insertedCount} 条测试数据`]);
      } else {
        setTestResults(prev => [...prev, `❌ 插入失败: ${insertResult.error}`]);
      }

      // 验证数据
      setTestResults(prev => [...prev, '🔍 验证数据完整性...']);
      const validation = await TestDataGenerator.validateDatabaseData();

      if (validation.isValid) {
        setTestResults(prev => [...prev, '✅ 数据验证通过']);
      } else {
        setTestResults(prev => [...prev, `❌ 数据验证失败: ${validation.issues.join(', ')}`]);
      }

      // 刷新统计
      await loadStats();
      await loadRecentSessions();

      setTestResults(prev => [...prev, '🎉 数据库测试完成！']);
    } catch (error) {
      setTestResults(prev => [...prev, `❌ 测试失败: ${error}`]);
    }
  };

  const runPerformanceTest = async () => {
    setTestResults(['⚡ 开始性能测试...']);

    try {
      const result = await TestDataGenerator.performanceTest(100);

      if (result.success) {
        setTestResults(prev => [
          ...prev,
          `✅ 性能测试完成`,
          `📊 插入时间: ${result.insertTime.toFixed(2)}ms`,
          `📊 查询时间: ${result.queryTime.toFixed(2)}ms`,
          `📊 插入速度: ${result.recordsPerSecond} 记录/秒`
        ]);
      } else {
        setTestResults(prev => [...prev, `❌ 性能测试失败: ${result.error}`]);
      }
    } catch (error) {
      setTestResults(prev => [...prev, `❌ 性能测试失败: ${error}`]);
    }
  };

  if (isLoading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">数据库统计</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">加载中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">数据库统计</h3>
        <div className="text-red-600 text-center py-4">
          <p>{error}</p>
          <button
            type="button"
            onClick={loadStats}
            className="mt-2 btn-primary"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">数据库统计</h3>
        <p className="text-gray-600 text-center py-4">暂无数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 总体统计 */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">总体统计</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalSessions}</div>
            <div className="text-sm text-gray-600">总会话数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatTime(stats.totalFocusTime)}
            </div>
            <div className="text-sm text-gray-600">总专注时间</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {formatTime(stats.totalBreakTime)}
            </div>
            <div className="text-sm text-gray-600">总休息时间</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.totalMicroBreaks}</div>
            <div className="text-sm text-gray-600">总微休息次数</div>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-purple-600">
              {stats.averageEfficiency.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">平均效率</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-medium text-gray-700">
              {formatDate(stats.firstSessionDate)}
            </div>
            <div className="text-sm text-gray-600">首次使用</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-medium text-gray-700">
              {formatDate(stats.lastSessionDate)}
            </div>
            <div className="text-sm text-gray-600">最近使用</div>
          </div>
        </div>
      </div>

      {/* 最近会话 */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">最近会话</h3>
          <button
            type="button"
            onClick={() => loadRecentSessions(30)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            刷新
          </button>
        </div>
        
        {recentSessions.length === 0 ? (
          <p className="text-gray-600 text-center py-4">暂无最近会话数据</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentSessions.slice(0, 10).map((session, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <div className="font-medium">{formatDate(session.date)}</div>
                  <div className="text-sm text-gray-600">
                    {session.session_count} 个会话
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">
                    <span className="text-green-600">
                      {formatTime(session.total_focus_time)}
                    </span>
                    {' / '}
                    <span className="text-red-600">
                      {formatTime(session.total_break_time)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {session.total_micro_breaks} 次微休息
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">数据管理</h3>
        <div className="space-y-2">
          <button
            type="button"
            onClick={loadStats}
            className="w-full btn-primary"
          >
            刷新统计数据
          </button>
          <button
            type="button"
            onClick={() => loadRecentSessions(7)}
            className="w-full btn-secondary"
          >
            加载最近7天数据
          </button>
          <button
            type="button"
            onClick={() => loadRecentSessions(30)}
            className="w-full btn-secondary"
          >
            加载最近30天数据
          </button>
        </div>
      </div>

      {/* 测试功能 */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">🧪 数据库测试</h3>
        <div className="space-y-2">
          <button
            type="button"
            onClick={runDatabaseTest}
            className="w-full bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
          >
            运行数据库测试
          </button>
          <button
            type="button"
            onClick={runPerformanceTest}
            className="w-full bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            运行性能测试
          </button>
        </div>

        {testResults.length > 0 && (
          <div className="mt-4 p-3 bg-gray-100 rounded-lg max-h-40 overflow-y-auto">
            <h4 className="font-medium mb-2">测试结果:</h4>
            {testResults.map((result, index) => (
              <div key={index} className="text-sm text-gray-700 mb-1">
                {result}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseStats;
