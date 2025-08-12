import React, { useState, useEffect } from 'react';
import { Database, HardDrive, FileText, BarChart, Settings, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

interface DatabaseStatsProps {
  className?: string;
}

// 数据库统计信息类型定义
interface DatabaseStatsData {
  size: number;
  sessionCount: number;
  efficiencyRatingCount: number;
  configCount: number;
  path: string;
  lastBackup?: string;
  healthStatus?: 'good' | 'warning' | 'critical';
}

// 格式化字节大小
const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// 获取健康状态颜色
const getHealthStatusColor = (status?: 'good' | 'warning' | 'critical') => {
  switch (status) {
    case 'good': return 'text-green-500';
    case 'warning': return 'text-yellow-500';
    case 'critical': return 'text-red-500';
    default: return 'text-gray-500';
  }
};

// 获取健康状态文本
const getHealthStatusText = (status?: 'good' | 'warning' | 'critical') => {
  switch (status) {
    case 'good': return '良好';
    case 'warning': return '警告';
    case 'critical': return '严重';
    default: return '未知';
  }
};

const DatabaseStats: React.FC<DatabaseStatsProps> = ({ className = '' }) => {
  const [stats, setStats] = useState<DatabaseStatsData | null>(null);
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
          path: '/path/to/database.db',
          lastBackup: '2023-06-15 14:30:22',
          healthStatus: 'good'
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

  // 重新加载数据
  const reloadData = () => {
    setLoading(true);
    setError(null);
    // 模拟重新加载
    setTimeout(() => {
      setStats({
        size: 1024000,
        sessionCount: 42,
        efficiencyRatingCount: 38,
        configCount: 15,
        path: '/path/to/database.db',
        lastBackup: '2023-06-15 14:30:22',
        healthStatus: 'good'
      });
      setLoading(false);
    }, 800);
  };

  if (loading) {
    return (
      <div className={`modern-card ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Database className="w-5 h-5 mr-2 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">数据库统计</h3>
          </div>
        </div>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`modern-card ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Database className="w-5 h-5 mr-2 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">数据库统计</h3>
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
          <div>
            <p className="text-red-700 dark:text-red-300 font-medium">加载数据库统计信息失败</p>
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>
          </div>
        </div>
        <Button 
          onClick={reloadData}
          className="w-full"
          variant="outline"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          重试
        </Button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`modern-card ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Database className="w-5 h-5 mr-2 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">数据库统计</h3>
          </div>
        </div>
        <div className="text-center py-8">
          <Database className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">暂无数据库数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`modern-card ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Database className="w-5 h-5 mr-2 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">数据库统计</h3>
        </div>
        <Button 
          onClick={reloadData}
          size="sm"
          variant="ghost"
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* 数据库状态卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-900/30">
          <div className="flex items-center mb-2">
            <HardDrive className="w-5 h-5 text-blue-500 mr-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">数据库大小</p>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{formatBytes(stats.size)}</p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-100 dark:border-green-900/30">
          <div className="flex items-center mb-2">
            <FileText className="w-5 h-5 text-green-500 mr-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">会话记录数</p>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.sessionCount}</p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-100 dark:border-purple-900/30">
          <div className="flex items-center mb-2">
            <BarChart className="w-5 h-5 text-purple-500 mr-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">效率评分记录数</p>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.efficiencyRatingCount}</p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-100 dark:border-yellow-900/30">
          <div className="flex items-center mb-2">
            <Settings className="w-5 h-5 text-yellow-500 mr-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">配置项数</p>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.configCount}</p>
        </div>
      </div>

      {/* 数据库详细信息 */}
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">数据库路径</p>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 font-mono text-sm break-all">
            {stats.path}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">上次备份时间</p>
            <p className="font-medium text-gray-900 dark:text-white">{stats.lastBackup || '无备份记录'}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">健康状态</p>
            <p className={`font-medium ${getHealthStatusColor(stats.healthStatus)}`}>
              {getHealthStatusText(stats.healthStatus)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseStats;