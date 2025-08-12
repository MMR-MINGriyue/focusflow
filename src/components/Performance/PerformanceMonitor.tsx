/**
 * 性能监控组件
 * 提供组件级别的性能监控和优化建议
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Zap,
  Clock,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Monitor,
  Cpu,
  MemoryStick,
  Eye,
  EyeOff,
  Settings,
  RefreshCw,
  Download
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

// 性能指标接口
interface PerformanceMetrics {
  renderTime: number; // 渲染时间 (ms)
  renderCount: number; // 渲染次数
  memoryUsage: number; // 内存使用 (MB)
  componentCount: number; // 组件数量
  reRenderCount: number; // 重渲染次数
  lastUpdate: number; // 最后更新时间
}

// 性能警告类型
interface PerformanceWarning {
  id: string;
  type: 'error' | 'warning' | 'info';
  component: string;
  message: string;
  suggestion: string;
  timestamp: number;
}

// 组件性能数据
interface ComponentPerformance {
  name: string;
  renderTime: number;
  renderCount: number;
  memoryUsage: number;
  lastRender: number;
  warnings: PerformanceWarning[];
}

// 性能监控Hook
export const usePerformanceMonitor = (componentName: string) => {
  const renderCountRef = useRef(0);
  const renderTimeRef = useRef(0);
  const lastRenderRef = useRef(Date.now());
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    renderCount: 0,
    memoryUsage: 0,
    componentCount: 1,
    reRenderCount: 0,
    lastUpdate: Date.now()
  });

  // 记录渲染开始
  const startRender = useCallback(() => {
    renderTimeRef.current = performance.now();
  }, []);

  // 记录渲染结束
  const endRender = useCallback(() => {
    const renderTime = performance.now() - renderTimeRef.current;
    renderCountRef.current += 1;
    lastRenderRef.current = Date.now();

    setMetrics(prev => ({
      ...prev,
      renderTime,
      renderCount: renderCountRef.current,
      lastUpdate: Date.now()
    }));

    // 性能警告检查
    if (renderTime > 16) { // 超过一帧时间
      console.warn(`[Performance] ${componentName} render took ${renderTime.toFixed(2)}ms`);
    }
  }, [componentName]);

  // 更新内存使用情况
  const updateMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
      setMetrics(prev => ({ ...prev, memoryUsage }));
    }
  }, []);

  useEffect(() => {
    startRender();
    return () => {
      endRender();
      updateMemoryUsage();
    };
  });

  return { metrics, startRender, endRender };
};

// 性能优化的React.memo包装器
export const withPerformanceOptimization = <P extends object>(
  Component: React.ComponentType<P>,
  displayName?: string
) => {
  const OptimizedComponent = React.memo(Component, (prevProps, nextProps) => {
    // 深度比较props
    return JSON.stringify(prevProps) === JSON.stringify(nextProps);
  });

  OptimizedComponent.displayName = displayName || Component.displayName || Component.name;
  return OptimizedComponent;
};

// 性能监控面板属性
export interface PerformanceMonitorProps {
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}

/**
 * 性能监控面板组件
 */
export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = false,
  position = 'bottom-right',
  className
}) => {
  const [isVisible, setIsVisible] = useState(enabled);
  const [isExpanded, setIsExpanded] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    renderCount: 0,
    memoryUsage: 0,
    componentCount: 0,
    reRenderCount: 0,
    lastUpdate: Date.now()
  });
  const [warnings, setWarnings] = useState<PerformanceWarning[]>([]);
  const [componentPerformance, setComponentPerformance] = useState<ComponentPerformance[]>([]);
  const intervalRef = useRef<NodeJS.Timeout>();

  // 位置样式
  const positionClasses = {
    'top-left': 'fixed top-4 left-4',
    'top-right': 'fixed top-4 right-4',
    'bottom-left': 'fixed bottom-4 left-4',
    'bottom-right': 'fixed bottom-4 right-4'
  };

  // 更新性能指标
  const updateMetrics = useCallback(() => {
    const now = Date.now();
    
    // 获取内存使用情况
    let memoryUsage = 0;
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
    }

    // 获取组件数量（模拟）
    const componentCount = document.querySelectorAll('[data-component]').length;

    setMetrics(prev => ({
      ...prev,
      memoryUsage,
      componentCount,
      lastUpdate: now
    }));

    // 检查性能警告
    if (memoryUsage > 100) { // 内存使用超过100MB
      const warning: PerformanceWarning = {
        id: `memory-${now}`,
        type: 'warning',
        component: 'Global',
        message: `内存使用过高: ${memoryUsage.toFixed(1)}MB`,
        suggestion: '考虑清理未使用的组件或数据',
        timestamp: now
      };
      setWarnings(prev => [...prev.slice(-9), warning]); // 保留最近10条
    }
  }, []);

  // 启动监控
  useEffect(() => {
    if (isVisible) {
      updateMetrics();
      intervalRef.current = setInterval(updateMetrics, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isVisible, updateMetrics]);

  // 性能评分
  const performanceScore = useMemo(() => {
    let score = 100;
    
    // 渲染时间评分
    if (metrics.renderTime > 16) score -= 20;
    else if (metrics.renderTime > 8) score -= 10;
    
    // 内存使用评分
    if (metrics.memoryUsage > 200) score -= 30;
    else if (metrics.memoryUsage > 100) score -= 15;
    
    // 重渲染次数评分
    if (metrics.reRenderCount > 100) score -= 20;
    else if (metrics.reRenderCount > 50) score -= 10;
    
    return Math.max(0, score);
  }, [metrics]);

  // 获取性能状态
  const getPerformanceStatus = useCallback(() => {
    if (performanceScore >= 80) return { status: 'good', color: 'text-green-500', icon: CheckCircle };
    if (performanceScore >= 60) return { status: 'warning', color: 'text-yellow-500', icon: AlertTriangle };
    return { status: 'poor', color: 'text-red-500', icon: AlertTriangle };
  }, [performanceScore]);

  // 导出性能报告
  const exportReport = useCallback(() => {
    const report = {
      timestamp: new Date().toISOString(),
      metrics,
      warnings,
      componentPerformance,
      performanceScore,
      recommendations: [
        '使用React.memo包装纯组件',
        '使用useCallback和useMemo优化计算',
        '避免在render中创建新对象',
        '使用虚拟滚动处理大列表',
        '延迟加载非关键组件'
      ]
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [metrics, warnings, componentPerformance, performanceScore]);

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className={cn(positionClasses[position], 'z-50', className)}
      >
        <Activity className="h-4 w-4" />
      </Button>
    );
  }

  const { status, color, icon: StatusIcon } = getPerformanceStatus();

  return (
    <div className={cn(positionClasses[position], 'z-50', className)}>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-background border rounded-lg shadow-lg"
        >
          {/* 紧凑视图 */}
          {!isExpanded && (
            <div className="p-3 flex items-center gap-3 min-w-[200px]">
              <StatusIcon className={cn('h-5 w-5', color)} />
              <div className="flex-1">
                <div className="text-sm font-medium">性能: {performanceScore}分</div>
                <div className="text-xs text-muted-foreground">
                  {metrics.renderTime.toFixed(1)}ms • {metrics.memoryUsage.toFixed(1)}MB
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(true)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsVisible(false)}
                >
                  <EyeOff className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* 详细视图 */}
          {isExpanded && (
            <Card className="w-80">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    性能监控
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={exportReport}
                      title="导出报告"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsExpanded(false)}
                    >
                      <EyeOff className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  实时性能指标和优化建议
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* 性能评分 */}
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <StatusIcon className={cn('h-5 w-5', color)} />
                    <span className="font-medium">性能评分</span>
                  </div>
                  <div className="text-right">
                    <div className={cn('text-lg font-bold', color)}>{performanceScore}</div>
                    <div className="text-xs text-muted-foreground">
                      {status === 'good' && '优秀'}
                      {status === 'warning' && '一般'}
                      {status === 'poor' && '需优化'}
                    </div>
                  </div>
                </div>

                {/* 关键指标 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">渲染时间</span>
                    </div>
                    <div className="text-lg font-bold">{metrics.renderTime.toFixed(1)}ms</div>
                    <div className="text-xs text-muted-foreground">
                      {metrics.renderTime < 8 ? '优秀' : metrics.renderTime < 16 ? '良好' : '需优化'}
                    </div>
                  </div>

                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <MemoryStick className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">内存使用</span>
                    </div>
                    <div className="text-lg font-bold">{metrics.memoryUsage.toFixed(1)}MB</div>
                    <div className="text-xs text-muted-foreground">
                      {metrics.memoryUsage < 50 ? '优秀' : metrics.memoryUsage < 100 ? '良好' : '需优化'}
                    </div>
                  </div>

                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Cpu className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">组件数量</span>
                    </div>
                    <div className="text-lg font-bold">{metrics.componentCount}</div>
                    <div className="text-xs text-muted-foreground">活跃组件</div>
                  </div>

                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <RefreshCw className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium">重渲染</span>
                    </div>
                    <div className="text-lg font-bold">{metrics.reRenderCount}</div>
                    <div className="text-xs text-muted-foreground">
                      {metrics.reRenderCount < 20 ? '优秀' : metrics.reRenderCount < 50 ? '良好' : '需优化'}
                    </div>
                  </div>
                </div>

                {/* 性能警告 */}
                {warnings.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      性能警告
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {warnings.slice(-3).map(warning => (
                        <div
                          key={warning.id}
                          className={cn(
                            'p-2 rounded text-xs',
                            warning.type === 'error' && 'bg-red-50 text-red-700 border border-red-200',
                            warning.type === 'warning' && 'bg-yellow-50 text-yellow-700 border border-yellow-200',
                            warning.type === 'info' && 'bg-blue-50 text-blue-700 border border-blue-200'
                          )}
                        >
                          <div className="font-medium">{warning.message}</div>
                          <div className="text-xs opacity-75 mt-1">{warning.suggestion}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 优化建议 */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-500" />
                    优化建议
                  </h4>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {performanceScore < 80 && (
                      <>
                        <div>• 使用React.memo包装纯组件</div>
                        <div>• 使用useCallback优化事件处理器</div>
                        <div>• 避免在render中创建新对象</div>
                      </>
                    )}
                    {metrics.memoryUsage > 100 && (
                      <div>• 清理未使用的组件和数据</div>
                    )}
                    {metrics.renderTime > 16 && (
                      <div>• 优化复杂计算，使用useMemo</div>
                    )}
                  </div>
                </div>

                {/* 最后更新时间 */}
                <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                  最后更新: {new Date(metrics.lastUpdate).toLocaleTimeString()}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default PerformanceMonitor;