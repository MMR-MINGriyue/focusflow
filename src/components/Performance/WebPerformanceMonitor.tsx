/**
 * Web版本性能监控组件
 * 监控和优化Web应用的性能指标
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { BarChart3, Zap, Activity, RefreshCw } from 'lucide-react';

interface PerformanceMetrics {
  fps: number;
  memory: number;
  renderTime: number;
  loadTime: number;
  bundleSize: number;
}

interface WebPerformanceMonitorProps {
  className?: string;
  showDetails?: boolean;
}

/**
 * Web版本性能监控组件
 */
export const WebPerformanceMonitor: React.FC<WebPerformanceMonitorProps> = ({
  className = '',
  showDetails = false
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memory: 0,
    renderTime: 0,
    loadTime: 0,
    bundleSize: 0
  });

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [fpsHistory, setFpsHistory] = useState<number[]>([]);
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  // 计算FPS
  const calculateFps = useCallback(() => {
    frameCountRef.current++;
    const now = performance.now();

    // 每秒更新一次FPS
    if (now >= lastFpsUpdateRef.current + 1000) {
      const fps = Math.round((frameCountRef.current * 1000) / (now - lastFpsUpdateRef.current));

      setMetrics(prev => {
        const newMetrics = { ...prev, fps };

        // 更新FPS历史记录
        setFpsHistory(prevHistory => {
          const newHistory = [...prevHistory, fps];
          // 只保留最近60秒的数据
          return newHistory.slice(-60);
        });

        return newMetrics;
      });

      frameCountRef.current = 0;
      lastFpsUpdateRef.current = now;
    }

    if (isMonitoring) {
      animationFrameRef.current = requestAnimationFrame(calculateFps);
    }
  }, [isMonitoring]);

  // 获取内存使用情况
  const getMemoryUsage = useCallback(() => {
    if ('memory' in (performance as any)) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1048576), // 转换为MB
        total: Math.round(memory.totalJSHeapSize / 1048576),
        limit: Math.round(memory.jsHeapSizeLimit / 1048576)
      };
    }
    return { used: 0, total: 0, limit: 0 };
  }, []);

  // 获取页面加载时间
  const getPageLoadTime = useCallback(() => {
    if (performance.getEntriesByType) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        return Math.round(navigation.loadEventEnd - navigation.fetchStart);
      }
    }
    return 0;
  }, []);

  // 获取Bundle大小
  const getBundleSize = useCallback(() => {
    if (performance.getEntriesByType) {
      const resources = performance.getEntriesByType('resource');
      const jsResources = resources.filter(resource => 
        resource.name.includes('.js') && !resource.name.includes('node_modules')
      );

      const totalSize = jsResources.reduce((total, resource) => {
        return total + (resource.transferSize || 0);
      }, 0);

      return Math.round(totalSize / 1024); // 转换为KB
    }
    return 0;
  }, []);

  // 更新性能指标
  const updateMetrics = useCallback(() => {
    const memory = getMemoryUsage();
    const loadTime = getPageLoadTime();
    const bundleSize = getBundleSize();

    setMetrics(prev => ({
      ...prev,
      memory: memory.used,
      loadTime,
      bundleSize
    }));
  }, [getMemoryUsage, getPageLoadTime, getBundleSize]);

  // 开始/停止监控
  const toggleMonitoring = useCallback(() => {
    setIsMonitoring(prev => !prev);
  }, []);

  // 刷新指标
  const refreshMetrics = useCallback(() => {
    updateMetrics();
  }, [updateMetrics]);

  // 监控状态变化
  useEffect(() => {
    if (isMonitoring) {
      lastFpsUpdateRef.current = performance.now();
      frameCountRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(calculateFps);
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isMonitoring, calculateFps]);

  // 初始化时获取一次指标
  useEffect(() => {
    updateMetrics();

    // 定期更新非FPS指标
    const interval = setInterval(() => {
      if (!isMonitoring) {
        updateMetrics();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [updateMetrics, isMonitoring]);

  // 获取性能评级
  const getPerformanceRating = useCallback(() => {
    const { fps, memory, renderTime, loadTime } = metrics;

    // 简单的性能评级算法
    let score = 0;

    // FPS评分 (0-30分)
    if (fps >= 55) score += 30;
    else if (fps >= 45) score += 20;
    else if (fps >= 30) score += 10;

    // 内存评分 (0-25分)
    if (memory < 50) score += 25;
    else if (memory < 100) score += 15;
    else if (memory < 200) score += 5;

    // 加载时间评分 (0-25分)
    if (loadTime < 1000) score += 25;
    else if (loadTime < 3000) score += 15;
    else if (loadTime < 5000) score += 5;

    // Bundle大小评分 (0-20分)
    if (bundleSize < 100) score += 20;
    else if (bundleSize < 300) score += 10;
    else if (bundleSize < 500) score += 5;

    // 确定评级
    if (score >= 80) return { grade: 'A', color: 'text-green-500', description: '优秀' };
    if (score >= 60) return { grade: 'B', color: 'text-blue-500', description: '良好' };
    if (score >= 40) return { grade: 'C', color: 'text-yellow-500', description: '一般' };
    return { grade: 'D', color: 'text-red-500', description: '需优化' };
  }, [metrics, bundleSize]);

  const rating = getPerformanceRating();

  return (
    <Card className={`${className} bg-white dark:bg-gray-800`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>性能监控</span>
          <div className="ml-auto flex space-x-2">
            <Button
              onClick={toggleMonitoring}
              size="sm"
              variant={isMonitoring ? "default" : "outline"}
              className="flex items-center space-x-1"
            >
              <Zap className="h-4 w-4" />
              <span>{isMonitoring ? '停止监控' : '开始监控'}</span>
            </Button>
            <Button
              onClick={refreshMetrics}
              size="sm"
              variant="outline"
              className="flex items-center space-x-1"
            >
              <RefreshCw className="h-4 w-4" />
              <span>刷新</span>
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 性能评级 */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">性能评级</div>
            <div className={`text-2xl font-bold ${rating.color}`}>{rating.grade}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400">状态</div>
            <div className="text-sm font-medium">{rating.description}</div>
          </div>
        </div>

        {/* 性能指标 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">FPS</span>
            </div>
            <div className="text-xl font-bold mt-1">{metrics.fps}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {metrics.fps >= 55 ? '流畅' : metrics.fps >= 30 ? '一般' : '卡顿'}
            </div>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-green-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">内存</span>
            </div>
            <div className="text-xl font-bold mt-1">{metrics.memory}MB</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {metrics.memory < 50 ? '优秀' : metrics.memory < 100 ? '良好' : '偏高'}
            </div>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">加载时间</span>
            </div>
            <div className="text-xl font-bold mt-1">{metrics.loadTime}ms</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {metrics.loadTime < 1000 ? '优秀' : metrics.loadTime < 3000 ? '良好' : '较慢'}
            </div>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Bundle大小</span>
            </div>
            <div className="text-xl font-bold mt-1">{metrics.bundleSize}KB</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {metrics.bundleSize < 100 ? '优秀' : metrics.bundleSize < 300 ? '良好' : '较大'}
            </div>
          </div>
        </div>

        {/* FPS历史图表 */}
        {showDetails && fpsHistory.length > 0 && (
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">FPS历史</div>
            <div className="h-20 flex items-end space-x-px">
              {fpsHistory.map((fps, index) => {
                const height = Math.min(100, (fps / 60) * 100);
                const color = fps >= 55 ? 'bg-green-500' : fps >= 30 ? 'bg-yellow-500' : 'bg-red-500';

                return (
                  <div
                    key={index}
                    className={`flex-1 ${color} rounded-t`}
                    style={{ height: `${height}%` }}
                    title={`FPS: ${fps}`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* 性能建议 */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">优化建议</div>
          <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
            {metrics.fps < 55 && (
              <li>• 考虑减少动画效果或使用CSS transform代替位置变化</li>
            )}
            {metrics.memory > 100 && (
              <li>• 检查内存泄漏，避免不必要的全局变量</li>
            )}
            {metrics.loadTime > 3000 && (
              <li>• 优化资源加载，考虑使用代码分割和懒加载</li>
            )}
            {metrics.bundleSize > 300 && (
              <li>• 使用Tree Shaking减少Bundle大小，压缩静态资源</li>
            )}
            {metrics.fps >= 55 && metrics.memory < 50 && metrics.loadTime < 1000 && metrics.bundleSize < 100 && (
              <li>• 性能表现优秀，继续保持！</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default WebPerformanceMonitor;
