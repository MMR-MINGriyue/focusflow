import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { getOfflineService, OfflineConfig, SyncStatus } from '../../services/offlineService';
import { Button } from './Button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './Tooltip';

/**
 * 离线状态指示器组件
 * 显示应用的在线/离线状态和同步状态
 */
const OfflineIndicator: React.FC = () => {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    lastSyncTime: null,
    pendingSyncItems: 0,
    syncInProgress: false,
    syncError: null
  });

  const [config, setConfig] = useState<OfflineConfig>({
    enabled: true,
    autoSync: true,
    syncInterval: 15,
    maxOfflineData: 50
  });

  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const offlineService = getOfflineService();

    // 获取初始状态和配置
    setStatus(offlineService.getStatus());
    setConfig(offlineService.getConfig());

    // 添加状态监听器
    const removeListener = offlineService.addStatusListener((newStatus) => {
      setStatus(newStatus);
    });

    // 清理函数
    return () => {
      removeListener();
    };
  }, []);

  // 格式化时间
  const formatTime = (timestamp: number | null): string => {
    if (!timestamp) return '从未';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}小时前`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}天前`;
  };

  // 手动同步
  const handleSync = () => {
    const offlineService = getOfflineService();
    offlineService.syncData();
  };

  // 切换离线模式
  const toggleOfflineMode = () => {
    const offlineService = getOfflineService();
    offlineService.updateConfig({ enabled: !config.enabled });
  };

  // 切换自动同步
  const toggleAutoSync = () => {
    const offlineService = getOfflineService();
    offlineService.updateConfig({ autoSync: !config.autoSync });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={`flex items-center p-2 rounded-lg shadow-lg cursor-pointer transition-all ${
                status.isOnline 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200'
              }`}
              onClick={() => setShowDetails(!showDetails)}
            >
              {status.isOnline ? (
                <Wifi className="w-5 h-5" />
              ) : (
                <WifiOff className="w-5 h-5" />
              )}

              {status.pendingSyncItems > 0 && (
                <span className="ml-1 text-xs bg-white dark:bg-gray-800 rounded-full px-1.5 py-0.5">
                  {status.pendingSyncItems}
                </span>
              )}

              {status.syncInProgress && (
                <RefreshCw className="ml-1 w-4 h-4 animate-spin" />
              )}

              {status.syncError && (
                <AlertCircle className="ml-1 w-4 h-4 text-red-500" />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {status.isOnline ? '在线' : '离线'}
              {status.pendingSyncItems > 0 && ` · ${status.pendingSyncItems}项待同步`}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* 详细信息面板 */}
      {showDetails && (
        <div className="absolute bottom-14 right-0 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">离线模式</h3>
            <button 
              onClick={() => setShowDetails(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ×
            </button>
          </div>

          <div className="space-y-3">
            {/* 连接状态 */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">连接状态</span>
              <div className="flex items-center">
                {status.isOnline ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600 dark:text-green-400">在线</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-amber-500 mr-1" />
                    <span className="text-sm text-amber-600 dark:text-amber-400">离线</span>
                  </>
                )}
              </div>
            </div>

            {/* 最后同步时间 */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">最后同步</span>
              <span className="text-sm text-gray-900 dark:text-white">
                {formatTime(status.lastSyncTime)}
              </span>
            </div>

            {/* 待同步项目 */}
            {status.pendingSyncItems > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">待同步项目</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {status.pendingSyncItems}
                </span>
              </div>
            )}

            {/* 同步错误 */}
            {status.syncError && (
              <div className="flex items-start">
                <AlertCircle className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-red-600 dark:text-red-400">
                  {status.syncError}
                </span>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex space-x-2 pt-2">
              <Button
                onClick={handleSync}
                disabled={status.syncInProgress || !status.isOnline || status.pendingSyncItems === 0}
                size="sm"
                className="flex-1"
              >
                {status.syncInProgress ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                    同步中
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-1" />
                    立即同步
                  </>
                )}
              </Button>

              <Button
                onClick={toggleOfflineMode}
                variant={config.enabled ? "default" : "outline"}
                size="sm"
              >
                {config.enabled ? '禁用' : '启用'}
              </Button>
            </div>

            {/* 自动同步设置 */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm text-gray-600 dark:text-gray-300">自动同步</span>
              <Button
                onClick={toggleAutoSync}
                variant={config.autoSync ? "default" : "outline"}
                size="sm"
              >
                {config.autoSync ? '已开启' : '已关闭'}
              </Button>
            </div>

            {/* 同步间隔 */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">同步间隔</span>
              <span className="text-sm text-gray-900 dark:text-white">
                {config.syncInterval}分钟
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;
