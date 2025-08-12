/**
 * 性能监控面板
 * 用于开发环境中实时监控应用性能
 */

import React, { useState, useEffect } from 'react';
import { Activity, Cpu, MemoryStick, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { advancedPerformanceMonitor } from '../../utils/advancedPerformanceMonitor';
import { devicePerformanceOptimizer } from '../../utils/devicePerformanceOptimizer';
import { memoryOptimizer } from '../../utils/memoryOptimizer';

interface PerformanceMonitorPanelProps {
  isVisible?: boolean;
  onToggle?: () => void;
}

const PerformanceMonitorPanel: React.FC<PerformanceMonitorPanelProps> = ({
  isVisible = false,
  onToggle
}) => {
  const [performanceData, setPerformanceData] = useState({
    renderTime: 0,
    fps: 60,
    memoryUsage: 0,
    alerts: [] as string[]
  });

  const [deviceProfile, setDeviceProfile] = useState(devicePerformanceOptimizer.getCurrentProfile());
  const [memoryReport, setMemoryReport] = useState(memoryOptimizer.getMemoryReport());

  // 更新性能数据
  useEffect(() => {
    if (!isVisible) return;

    const updateInterval = setInterval(() => {
      // 获取TimerDisplay的性能报告
      const timerReport = advancedPerformanceMonitor.getPerformanceReport('TimerDisplay');
      const alerts = advancedPerformanceMonitor.getAlerts();
      const currentMemory = memoryOptimizer.getCurrentMemoryUsage();
      const newMemoryReport = memoryOptimizer.getMemoryReport();

      setPerformanceData({
        renderTime: timerReport.averageRenderTime,
        fps: timerReport.averageFPS,
        memoryUsage: currentMemory?.usedJSHeapSize || 0,
        alerts: alerts.slice(-5).map(alert => alert.message) // 最近5个警告
      });

      setMemoryReport(newMemoryReport);
    }, 1000);

    return () => clearInterval(updateInterval);
  }, [isVisible]);

  // 监听设备配置变化
  useEffect(() => {
    const handleProfileChange = (event: CustomEvent) => {
      setDeviceProfile(event.detail);
    };

    window.addEventListener('performanceProfileChanged', handleProfileChange as EventListener);

    return () => {
      window.removeEventListener('performanceProfileChanged', handleProfileChange as EventListener);
    };
  }, []);

  const formatMemory = (bytes: number): string => {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const getPerformanceStatus = () => {
    if (performanceData.renderTime > 16) return { status: 'error', color: 'text-red-500' };
    if (performanceData.renderTime > 12) return { status: 'warning', color: 'text-yellow-500' };
    return { status: 'good', color: 'text-green-500' };
  };

  const getFPSStatus = () => {
    if (performanceData.fps < 30) return { status: 'error', color: 'text-red-500' };
    if (performanceData.fps < 50) return { status: 'warning', color: 'text-yellow-500' };
    return { status: 'good', color: 'text-green-500' };
  };

  const getMemoryStatus = () => {
    const memoryMB = performanceData.memoryUsage / 1024 / 1024;
    if (memoryMB > 200) return { status: 'error', color: 'text-red-500' };
    if (memoryMB > 100) return { status: 'warning', color: 'text-yellow-500' };
    return { status: 'good', color: 'text-green-500' };
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors z-50"
        title="打开性能监控面板"
      >
        <Activity className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 w-80 z-50">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          性能监控
        </h3>
        <button
          onClick={onToggle}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ×
        </button>
      </div>

      {/* 性能指标 */}
      <div className="space-y-3">
        {/* 渲染时间 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Zap className="h-4 w-4 mr-2 text-blue-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">渲染时间</span>
          </div>
          <div className="flex items-center">
            <span className={`text-sm font-mono ${getPerformanceStatus().color}`}>
              {performanceData.renderTime.toFixed(2)}ms
            </span>
            {getPerformanceStatus().status === 'good' ? (
              <CheckCircle className="h-4 w-4 ml-1 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 ml-1 text-yellow-500" />
            )}
          </div>
        </div>

        {/* FPS */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Cpu className="h-4 w-4 mr-2 text-green-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">帧率</span>
          </div>
          <div className="flex items-center">
            <span className={`text-sm font-mono ${getFPSStatus().color}`}>
              {performanceData.fps} FPS
            </span>
            {getFPSStatus().status === 'good' ? (
              <CheckCircle className="h-4 w-4 ml-1 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 ml-1 text-yellow-500" />
            )}
          </div>
        </div>

        {/* 内存使用 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <MemoryStick className="h-4 w-4 mr-2 text-purple-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">内存</span>
          </div>
          <div className="flex items-center">
            <span className={`text-sm font-mono ${getMemoryStatus().color}`}>
              {formatMemory(performanceData.memoryUsage)}
            </span>
            {getMemoryStatus().status === 'good' ? (
              <CheckCircle className="h-4 w-4 ml-1 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 ml-1 text-yellow-500" />
            )}
          </div>
        </div>
      </div>

      {/* 设备配置 */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
          性能配置: <span className="font-medium">{deviceProfile.name}</span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {deviceProfile.description}
        </div>
      </div>

      {/* 内存趋势 */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
          内存趋势: <span className={`font-medium ${
            memoryReport.trend === 'increasing' ? 'text-red-500' :
            memoryReport.trend === 'decreasing' ? 'text-green-500' :
            'text-blue-500'
          }`}>
            {memoryReport.trend === 'increasing' ? '上升' :
             memoryReport.trend === 'decreasing' ? '下降' : '稳定'}
          </span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          平均: {formatMemory(memoryReport.average)} | 峰值: {formatMemory(memoryReport.peak)}
        </div>
      </div>

      {/* 性能警告 */}
      {performanceData.alerts.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-700 dark:text-gray-300 mb-2 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-1 text-yellow-500" />
            性能警告
          </div>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {performanceData.alerts.map((alert, index) => (
              <div key={index} className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-1 rounded">
                {alert}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex space-x-2">
        <button
          onClick={() => {
            memoryOptimizer.cleanup();
            advancedPerformanceMonitor.clearAlerts();
          }}
          className="flex-1 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
        >
          清理内存
        </button>
        <button
          onClick={() => {
            const report = advancedPerformanceMonitor.getPerformanceReport('TimerDisplay');
            console.log('性能报告:', report);
          }}
          className="flex-1 text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 transition-colors"
        >
          导出报告
        </button>
      </div>
    </div>
  );
};

export default PerformanceMonitorPanel;
