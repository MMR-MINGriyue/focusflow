import React, { useState, useEffect } from 'react';

interface DatabaseStatsProps {
  className?: string;
}

// 格式化字节大小
const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const DatabaseStats: React.FC<DatabaseStatsProps> = ({ className = '' }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 模拟加载数据库统计信息
    const loadStats = async () => {
      try {
        setLoading(true);
        // 模拟异步加载
        await new Promise(resolve => setTimeout(resolve, 1000));
        setStats({
          size: 1024000,
          sessionCount: 42,
          efficiencyRatingCount: 38,
          configCount: 15,
          path: '/path/to/database.db'
        });
        setError(null);
      } catch (err) {
        console.error('加载数据库统计信息失败:', err);
        setError('加载数据库统计信息失败');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className={className}>
        <h3 className="text-lg font-semibold">数据库统计</h3>
        <p>加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <h3 className="text-lg font-semibold">数据库统计</h3>
        <p className="text-red-500">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          重试
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={className}>
        <h3 className="text-lg font-semibold">数据库统计</h3>
        <p>暂无数据</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-4">数据库统计</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">数据库大小</p>
          <p className="text-lg font-semibold">{formatBytes(stats.size)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">会话记录数</p>
          <p className="text-lg font-semibold">{stats.sessionCount}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">效率评分记录数</p>
          <p className="text-lg font-semibold">{stats.efficiencyRatingCount}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">配置项数</p>
          <p className="text-lg font-semibold">{stats.configCount}</p>
        </div>
      </div>
      
      <div className="mt-4">
        <p className="text-sm text-gray-500">数据库路径</p>
        <p className="text-sm font-mono break-all">{stats.path}</p>
      </div>
    </div>
  );
};

export default DatabaseStats;