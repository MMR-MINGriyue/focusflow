import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Database, Volume2, Wifi } from 'lucide-react';
import { errorHandler } from '../utils/errorHandler';
import { databaseService } from '../services/database';
import { soundService } from '../services/sound';
import LoadingSpinner from './ui/LoadingSpinner';

interface HealthStatus {
  database: 'healthy' | 'warning' | 'error' | 'checking';
  sound: 'healthy' | 'warning' | 'error' | 'checking';
  storage: 'healthy' | 'warning' | 'error' | 'checking';
  errors: 'healthy' | 'warning' | 'error' | 'checking';
}

interface HealthCheckProps {
  onHealthChange?: (isHealthy: boolean) => void;
  autoCheck?: boolean;
  interval?: number; // 检查间隔（毫秒）
}

const HealthCheck: React.FC<HealthCheckProps> = ({
  onHealthChange,
  autoCheck = true,
  interval = 30000, // 30秒
}) => {
  const [status, setStatus] = useState<HealthStatus>({
    database: 'checking',
    sound: 'checking',
    storage: 'checking',
    errors: 'checking',
  });
  const [isVisible, setIsVisible] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkDatabase = async (): Promise<'healthy' | 'warning' | 'error'> => {
    try {
      await databaseService.initialize();
      // 尝试一个简单的查询
      await databaseService.getDatabaseStats();
      return 'healthy';
    } catch (error) {
      console.error('Database health check failed:', error);
      return 'error';
    }
  };

  const checkSound = async (): Promise<'healthy' | 'warning' | 'error'> => {
    try {
      // 检查音频上下文是否可用
      if (!soundService) {
        return 'error';
      }
      
      // 这里可以添加更多音频系统检查
      return 'healthy';
    } catch (error) {
      console.error('Sound health check failed:', error);
      return 'warning';
    }
  };

  const checkStorage = async (): Promise<'healthy' | 'warning' | 'error'> => {
    try {
      // 测试 localStorage
      const testKey = 'focusflow-health-test';
      const testValue = Date.now().toString();
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      if (retrieved !== testValue) {
        return 'error';
      }
      
      return 'healthy';
    } catch (error) {
      console.error('Storage health check failed:', error);
      return 'error';
    }
  };

  const checkErrors = async (): Promise<'healthy' | 'warning' | 'error'> => {
    try {
      const stats = errorHandler.getErrorStats();
      
      if (stats.bySeverity.critical > 0) {
        return 'error';
      }
      
      if (stats.recent > 5) { // 最近1小时超过5个错误
        return 'warning';
      }
      
      return 'healthy';
    } catch (error) {
      console.error('Error stats check failed:', error);
      return 'warning';
    }
  };

  const runHealthCheck = async () => {
    setStatus({
      database: 'checking',
      sound: 'checking',
      storage: 'checking',
      errors: 'checking',
    });

    const [databaseStatus, soundStatus, storageStatus, errorsStatus] = await Promise.all([
      checkDatabase(),
      checkSound(),
      checkStorage(),
      checkErrors(),
    ]);

    const newStatus = {
      database: databaseStatus,
      sound: soundStatus,
      storage: storageStatus,
      errors: errorsStatus,
    };

    setStatus(newStatus);
    setLastCheck(new Date());

    // 通知健康状态变化
    const isHealthy = Object.values(newStatus).every(s => s === 'healthy');
    onHealthChange?.(isHealthy);
  };

  useEffect(() => {
    // 初始检查
    runHealthCheck();

    if (autoCheck) {
      const intervalId = setInterval(runHealthCheck, interval);
      return () => clearInterval(intervalId);
    }
  }, [autoCheck, interval]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'checking':
        return <LoadingSpinner size="sm" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy':
        return '正常';
      case 'warning':
        return '警告';
      case 'error':
        return '错误';
      case 'checking':
        return '检查中...';
      default:
        return '未知';
    }
  };

  const hasIssues = Object.values(status).some(s => s === 'warning' || s === 'error');

  if (!isVisible && !hasIssues) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full shadow-lg transition-colors z-40"
        title="系统健康状态"
      >
        <CheckCircle className="h-5 w-5 text-green-500" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border p-4 max-w-sm z-40">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">系统状态</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-4 w-4 text-gray-500" />
            <span className="text-sm">数据库</span>
          </div>
          <div className="flex items-center space-x-1">
            {getStatusIcon(status.database)}
            <span className="text-xs">{getStatusText(status.database)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Volume2 className="h-4 w-4 text-gray-500" />
            <span className="text-sm">音频</span>
          </div>
          <div className="flex items-center space-x-1">
            {getStatusIcon(status.sound)}
            <span className="text-xs">{getStatusText(status.sound)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Wifi className="h-4 w-4 text-gray-500" />
            <span className="text-sm">存储</span>
          </div>
          <div className="flex items-center space-x-1">
            {getStatusIcon(status.storage)}
            <span className="text-xs">{getStatusText(status.storage)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-gray-500" />
            <span className="text-sm">错误</span>
          </div>
          <div className="flex items-center space-x-1">
            {getStatusIcon(status.errors)}
            <span className="text-xs">{getStatusText(status.errors)}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>上次检查:</span>
          <span>{lastCheck ? lastCheck.toLocaleTimeString() : '未检查'}</span>
        </div>
        <button
          onClick={runHealthCheck}
          className="w-full mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
        >
          重新检查
        </button>
      </div>
    </div>
  );
};

export default HealthCheck;
