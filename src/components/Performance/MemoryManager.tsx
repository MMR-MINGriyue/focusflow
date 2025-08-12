/**
 * 内存管理器
 * 提供内存泄漏检测、内存使用监控和优化建议
 */

import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MemoryStick,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Trash2,
  Eye,
  Activity,
  Zap,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

// 内存信息接口
interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: number;
}

// 内存泄漏检测项
interface MemoryLeak {
  id: string;
  component: string;
  type: 'event-listener' | 'timer' | 'observer' | 'reference' | 'closure';
  description: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
  suggestion: string;
}

// 内存使用统计
interface MemoryStats {
  current: number;
  peak: number;
  average: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  leakCount: number;
  gcCount: number;
}

// 内存管理器上下文
interface MemoryManagerContext {
  memoryInfo: MemoryInfo | null;
  memoryHistory: MemoryInfo[];
  memoryLeaks: MemoryLeak[];
  stats: MemoryStats;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  forceGC: () => void;
  reportLeak: (leak: Omit<MemoryLeak, 'id' | 'timestamp'>) => void;
  clearLeaks: () => void;
}

const MemoryContext = createContext<MemoryManagerContext | null>(null);

// 内存管理器Provider
export const MemoryManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);
  const [memoryHistory, setMemoryHistory] = useState<MemoryInfo[]>([]);
  const [memoryLeaks, setMemoryLeaks] = useState<MemoryLeak[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();
  const gcCountRef = useRef(0);

  // 获取内存信息
  const getMemoryInfo = useCallback((): MemoryInfo | null => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        timestamp: Date.now()
      };
    }
    return null;
  }, []);

  // 开始监控
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;
    
    setIsMonitoring(true);
    
    const monitor = () => {
      const info = getMemoryInfo();
      if (info) {
        setMemoryInfo(info);
        setMemoryHistory(prev => {
          const newHistory = [...prev, info];
          // 保留最近100个记录
          return newHistory.slice(-100);
        });
        
        // 检测内存泄漏
        detectMemoryLeaks(info);
      }
    };
    
    monitor(); // 立即执行一次
    intervalRef.current = setInterval(monitor, 1000);
  }, [isMonitoring, getMemoryInfo]);

  // 停止监控
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  // 强制垃圾回收
  const forceGC = useCallback(() => {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
      gcCountRef.current += 1;
    } else {
      console.warn('Garbage collection is not available. Run Chrome with --js-flags="--expose-gc"');
    }
  }, []);

  // 报告内存泄漏
  const reportLeak = useCallback((leak: Omit<MemoryLeak, 'id' | 'timestamp'>) => {
    const newLeak: MemoryLeak = {
      ...leak,
      id: `leak-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    
    setMemoryLeaks(prev => [...prev, newLeak]);
  }, []);

  // 清除泄漏记录
  const clearLeaks = useCallback(() => {
    setMemoryLeaks([]);
  }, []);

  // 检测内存泄漏
  const detectMemoryLeaks = useCallback((currentInfo: MemoryInfo) => {
    if (memoryHistory.length < 10) return;
    
    const recentHistory = memoryHistory.slice(-10);
    const memoryGrowth = currentInfo.usedJSHeapSize - recentHistory[0].usedJSHeapSize;
    const timeSpan = currentInfo.timestamp - recentHistory[0].timestamp;
    const growthRate = memoryGrowth / timeSpan; // bytes per ms
    
    // 如果内存增长率过高，可能存在泄漏
    if (growthRate > 1000) { // 1MB per second
      reportLeak({
        component: 'Global',
        type: 'reference',
        description: `内存增长过快: ${(growthRate * 1000 / 1024 / 1024).toFixed(2)}MB/s`,
        severity: 'high',
        suggestion: '检查是否有未清理的引用或事件监听器'
      });
    }
    
    // 检查内存使用率
    const usageRatio = currentInfo.usedJSHeapSize / currentInfo.jsHeapSizeLimit;
    if (usageRatio > 0.8) {
      reportLeak({
        component: 'Global',
        type: 'reference',
        description: `内存使用率过高: ${(usageRatio * 100).toFixed(1)}%`,
        severity: 'medium',
        suggestion: '考虑释放不必要的对象或执行垃圾回收'
      });
    }
  }, [memoryHistory, reportLeak]);

  // 计算统计信息
  const stats: MemoryStats = React.useMemo(() => {
    if (memoryHistory.length === 0) {
      return {
        current: 0,
        peak: 0,
        average: 0,
        trend: 'stable',
        leakCount: memoryLeaks.length,
        gcCount: gcCountRef.current
      };
    }
    
    const current = memoryInfo?.usedJSHeapSize || 0;
    const peak = Math.max(...memoryHistory.map(info => info.usedJSHeapSize));
    const average = memoryHistory.reduce((sum, info) => sum + info.usedJSHeapSize, 0) / memoryHistory.length;
    
    // 计算趋势
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (memoryHistory.length >= 5) {
      const recent = memoryHistory.slice(-5);
      const oldAvg = recent.slice(0, 2).reduce((sum, info) => sum + info.usedJSHeapSize, 0) / 2;
      const newAvg = recent.slice(-2).reduce((sum, info) => sum + info.usedJSHeapSize, 0) / 2;
      const change = (newAvg - oldAvg) / oldAvg;
      
      if (change > 0.1) trend = 'increasing';
      else if (change < -0.1) trend = 'decreasing';
    }
    
    return {
      current,
      peak,
      average,
      trend,
      leakCount: memoryLeaks.length,
      gcCount: gcCountRef.current
    };
  }, [memoryInfo, memoryHistory, memoryLeaks]);

  // 自动开始监控
  useEffect(() => {
    startMonitoring();
    return () => stopMonitoring();
  }, [startMonitoring, stopMonitoring]);

  const contextValue: MemoryManagerContext = {
    memoryInfo,
    memoryHistory,
    memoryLeaks,
    stats,
    startMonitoring,
    stopMonitoring,
    forceGC,
    reportLeak,
    clearLeaks
  };

  return (
    <MemoryContext.Provider value={contextValue}>
      {children}
    </MemoryContext.Provider>
  );
};

// 使用内存管理器Hook
export const useMemoryManager = () => {
  const context = useContext(MemoryContext);
  if (!context) {
    throw new Error('useMemoryManager must be used within MemoryManagerProvider');
  }
  return context;
};

// 内存泄漏检测Hook
export const useMemoryLeakDetection = (componentName: string) => {
  const { reportLeak } = useMemoryManager();
  const timersRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const intervalsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const listenersRef = useRef<Array<{
    element: EventTarget;
    event: string;
    handler: EventListener;
  }>>([]);
  const observersRef = useRef<Set<IntersectionObserver | MutationObserver | ResizeObserver>>(new Set());

  // 安全的setTimeout
  const safeSetTimeout = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      timersRef.current.delete(timer);
      callback();
    }, delay);
    timersRef.current.add(timer);
    return timer;
  }, []);

  // 安全的setInterval
  const safeSetInterval = useCallback((callback: () => void, delay: number) => {
    const interval = setInterval(callback, delay);
    intervalsRef.current.add(interval);
    return interval;
  }, []);

  // 安全的addEventListener
  const safeAddEventListener = useCallback((
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ) => {
    element.addEventListener(event, handler, options);
    listenersRef.current.push({ element, event, handler });
  }, []);

  // 安全的Observer
  const safeCreateObserver = useCallback(<T extends IntersectionObserver | MutationObserver | ResizeObserver>(
    observer: T
  ): T => {
    observersRef.current.add(observer);
    return observer;
  }, []);

  // 清理函数
  useEffect(() => {
    return () => {
      // 清理定时器
      timersRef.current.forEach(timer => clearTimeout(timer));
      intervalsRef.current.forEach(interval => clearInterval(interval));
      
      // 清理事件监听器
      listenersRef.current.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
      
      // 清理观察器
      observersRef.current.forEach(observer => {
        observer.disconnect();
      });

      // 检查是否有未清理的资源
      const hasLeaks = 
        timersRef.current.size > 0 ||
        intervalsRef.current.size > 0 ||
        listenersRef.current.length > 0 ||
        observersRef.current.size > 0;

      if (hasLeaks) {
        reportLeak({
          component: componentName,
          type: 'reference',
          description: '组件卸载时发现未清理的资源',
          severity: 'medium',
          suggestion: '确保在useEffect的清理函数中清理所有资源'
        });
      }
    };
  }, [componentName, reportLeak]);

  return {
    safeSetTimeout,
    safeSetInterval,
    safeAddEventListener,
    safeCreateObserver
  };
};

// 内存监控面板
export const MemoryMonitorPanel: React.FC<{ className?: string }> = ({ className }) => {
  const { memoryInfo, memoryHistory, memoryLeaks, stats, forceGC, clearLeaks } = useMemoryManager();
  const [showDetails, setShowDetails] = useState(false);

  // 格式化内存大小
  const formatMemorySize = useCallback((bytes: number) => {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(1)}MB`;
  }, []);

  // 获取趋势图标
  const getTrendIcon = useCallback(() => {
    switch (stats.trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  }, [stats.trend]);

  if (!memoryInfo) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <MemoryStick className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">内存监控不可用</p>
          <p className="text-xs text-muted-foreground mt-1">
            需要在Chrome中启用 --js-flags="--expose-gc"
          </p>
        </CardContent>
      </Card>
    );
  }

  const usagePercentage = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MemoryStick className="h-5 w-5" />
            内存监控
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={forceGC}>
              <Trash2 className="h-4 w-4 mr-1" />
              GC
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              <Eye className="h-4 w-4 mr-1" />
              {showDetails ? '隐藏' : '详情'}
            </Button>
          </div>
        </div>
        <CardDescription>
          实时内存使用情况和泄漏检测
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 内存使用概览 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <MemoryStick className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">当前使用</span>
            </div>
            <div className="text-lg font-bold">{formatMemorySize(stats.current)}</div>
            <div className="text-xs text-muted-foreground">
              {usagePercentage.toFixed(1)}%
            </div>
          </div>

          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">峰值</span>
            </div>
            <div className="text-lg font-bold">{formatMemorySize(stats.peak)}</div>
            <div className="text-xs text-muted-foreground">历史最高</div>
          </div>

          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              {getTrendIcon()}
              <span className="text-sm font-medium">趋势</span>
            </div>
            <div className="text-lg font-bold">{formatMemorySize(stats.average)}</div>
            <div className="text-xs text-muted-foreground">
              {stats.trend === 'increasing' && '上升'}
              {stats.trend === 'decreasing' && '下降'}
              {stats.trend === 'stable' && '稳定'}
            </div>
          </div>

          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">泄漏</span>
            </div>
            <div className="text-lg font-bold">{stats.leakCount}</div>
            <div className="text-xs text-muted-foreground">检测到</div>
          </div>
        </div>

        {/* 内存使用进度条 */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>内存使用率</span>
            <span>{usagePercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                usagePercentage > 80 ? 'bg-red-500' :
                usagePercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
              )}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* 内存泄漏警告 */}
        {memoryLeaks.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                内存泄漏警告
              </h4>
              <Button variant="outline" size="sm" onClick={clearLeaks}>
                清除
              </Button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {memoryLeaks.slice(-5).map(leak => (
                <div
                  key={leak.id}
                  className={cn(
                    'p-2 rounded text-xs',
                    leak.severity === 'high' && 'bg-red-50 text-red-700 border border-red-200',
                    leak.severity === 'medium' && 'bg-yellow-50 text-yellow-700 border border-yellow-200',
                    leak.severity === 'low' && 'bg-blue-50 text-blue-700 border border-blue-200'
                  )}
                >
                  <div className="font-medium">{leak.component}: {leak.description}</div>
                  <div className="text-xs opacity-75 mt-1">{leak.suggestion}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 详细信息 */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-4 pt-4 border-t">
                {/* 内存历史图表 */}
                <div>
                  <h4 className="text-sm font-medium mb-2">内存使用历史</h4>
                  <div className="h-20 bg-muted/30 rounded-lg p-2">
                    <svg width="100%" height="100%" viewBox="0 0 400 60">
                      {memoryHistory.length > 1 && (
                        <polyline
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          points={memoryHistory
                            .slice(-50)
                            .map((info, index) => {
                              const x = (index / (memoryHistory.slice(-50).length - 1)) * 400;
                              const y = 60 - ((info.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 60);
                              return `${x},${y}`;
                            })
                            .join(' ')}
                          className="text-primary"
                        />
                      )}
                    </svg>
                  </div>
                </div>

                {/* 详细统计 */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">总堆大小:</span>
                    <span className="ml-2 font-medium">
                      {formatMemorySize(memoryInfo.totalJSHeapSize)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">堆限制:</span>
                    <span className="ml-2 font-medium">
                      {formatMemorySize(memoryInfo.jsHeapSizeLimit)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">GC次数:</span>
                    <span className="ml-2 font-medium">{stats.gcCount}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">监控时长:</span>
                    <span className="ml-2 font-medium">
                      {memoryHistory.length > 0 
                        ? `${Math.floor((Date.now() - memoryHistory[0].timestamp) / 1000)}s`
                        : '0s'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default {
  MemoryManagerProvider,
  useMemoryManager,
  useMemoryLeakDetection,
  MemoryMonitorPanel
};