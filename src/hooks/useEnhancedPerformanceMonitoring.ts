/**
 * 增强性能监控Hook
 * 集成高级性能监控和设备优化功能
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { advancedPerformanceMonitor } from '../utils/advancedPerformanceMonitor';
import { devicePerformanceOptimizer } from '../utils/devicePerformanceOptimizer';

interface PerformanceMetrics {
  renderTime: number;
  fps: number;
  memoryUsage: number;
  isOptimal: boolean;
}

interface PerformanceHookOptions {
  enableAutoOptimization?: boolean;
  performanceThreshold?: number;
  memoryThreshold?: number;
  reportInterval?: number;
}

export function useEnhancedPerformanceMonitoring(
  componentName: string,
  options: PerformanceHookOptions = {}
) {
  const {
    enableAutoOptimization = true,
    performanceThreshold = 16, // 16ms for 60fps
    memoryThreshold = 100, // 100MB
    reportInterval = 5000 // 5 seconds
  } = options;

  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    fps: 60,
    memoryUsage: 0,
    isOptimal: true
  });

  const [performanceAlerts, setPerformanceAlerts] = useState<string[]>([]);
  const renderStartTime = useRef<number>(0);
  const frameCount = useRef<number>(0);
  const lastFrameTime = useRef<number>(performance.now());
  const reportIntervalRef = useRef<number | null>(null);

  // 开始渲染计时
  const startRenderMeasurement = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  // 结束渲染计时并记录
  const endRenderMeasurement = useCallback((
    propsChanged: string[] = [],
    stateChanged = false,
    childrenCount = 0
  ) => {
    const renderTime = performance.now() - renderStartTime.current;
    
    // 记录到高级性能监控器
    advancedPerformanceMonitor.recordRender(
      componentName,
      renderTime,
      propsChanged,
      stateChanged,
      childrenCount,
      0 // DOM操作数量，可以根据需要计算
    );

    // 计算FPS
    const now = performance.now();
    const timeDiff = now - lastFrameTime.current;
    const fps = timeDiff > 0 ? 1000 / timeDiff : 0;
    lastFrameTime.current = now;
    frameCount.current++;

    // 记录到设备性能优化器
    devicePerformanceOptimizer.recordPerformance(fps);

    // 更新当前指标
    const memoryUsage = getMemoryUsage();
    const isOptimal = renderTime <= performanceThreshold && fps >= 30 && memoryUsage <= memoryThreshold;

    setCurrentMetrics({
      renderTime,
      fps,
      memoryUsage,
      isOptimal
    });

    return { renderTime, fps, memoryUsage, isOptimal };
  }, [componentName, performanceThreshold, memoryThreshold]);

  // 获取内存使用情况
  const getMemoryUsage = useCallback((): number => {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }, []);

  // 获取性能报告
  const getPerformanceReport = useCallback(() => {
    return advancedPerformanceMonitor.getPerformanceReport(componentName);
  }, [componentName]);

  // 获取设备优化建议
  const getOptimizationRecommendations = useCallback(() => {
    return devicePerformanceOptimizer.getPerformanceRecommendations();
  }, []);

  // 手动触发性能优化
  const optimizePerformance = useCallback(() => {
    const report = getPerformanceReport();
    const recommendations = getOptimizationRecommendations();
    
    // 如果性能不佳，自动调整设备配置
    if (report.averageRenderTime > performanceThreshold) {
      const currentProfile = devicePerformanceOptimizer.getCurrentProfile();
      
      if (currentProfile.name !== 'Performance Mode' && currentProfile.name !== 'Battery Saver') {
        devicePerformanceOptimizer.setProfile('low');
        setPerformanceAlerts(prev => [...prev, '性能优化：已切换到性能模式']);
      }
    }

    return { report, recommendations };
  }, [componentName, performanceThreshold]);

  // 清除性能警告
  const clearAlerts = useCallback(() => {
    setPerformanceAlerts([]);
    advancedPerformanceMonitor.clearAlerts();
  }, []);

  // 监听性能警告
  useEffect(() => {
    const handleAlert = (alert: any) => {
      setPerformanceAlerts(prev => [...prev, alert.message]);
    };

    advancedPerformanceMonitor.addAlertObserver(handleAlert);

    return () => {
      advancedPerformanceMonitor.removeAlertObserver(handleAlert);
    };
  }, []);

  // 监听设备性能配置变化
  useEffect(() => {
    const handleProfileChange = (event: CustomEvent) => {
      const profile = event.detail;
      setPerformanceAlerts(prev => [...prev, `性能配置已更改为: ${profile.name}`]);
    };

    window.addEventListener('performanceProfileChanged', handleProfileChange as EventListener);

    return () => {
      window.removeEventListener('performanceProfileChanged', handleProfileChange as EventListener);
    };
  }, []);

  // 启动性能监控
  useEffect(() => {
    advancedPerformanceMonitor.startMonitoring(componentName);

    if (enableAutoOptimization) {
      devicePerformanceOptimizer.startAutoOptimization();
    }

    // 定期生成性能报告
    reportIntervalRef.current = window.setInterval(() => {
      const report = getPerformanceReport();

      // 如果性能持续不佳，发出警告
      if (report.averageRenderTime > performanceThreshold * 1.5) {
        setPerformanceAlerts(prev => [
          ...prev,
          `${componentName} 平均渲染时间过长: ${report.averageRenderTime.toFixed(2)}ms`
        ]);
      }

      // 如果FPS过低，发出警告
      if (report.averageFPS < 30) {
        setPerformanceAlerts(prev => [
          ...prev,
          `${componentName} 平均FPS过低: ${report.averageFPS}`
        ]);
      }
    }, reportInterval);

    return () => {
      advancedPerformanceMonitor.stopMonitoring();

      if (reportIntervalRef.current) {
        clearInterval(reportIntervalRef.current);
      }
    };
  }, [componentName, enableAutoOptimization, performanceThreshold, reportInterval]);

  // 性能测量装饰器
  const withPerformanceMeasurement = useCallback(<T extends any[]>(
    fn: (...args: T) => any,
    operationName: string
  ) => {
    return (...args: T) => {
      const start = performance.now();
      const result = fn(...args);
      const duration = performance.now() - start;

      if (duration > 5) { // 只记录超过5ms的操作
        console.debug(`${componentName}.${operationName}: ${duration.toFixed(2)}ms`);
      }

      return result;
    };
  }, [componentName]);

  // 获取当前设备性能配置
  const getCurrentDeviceProfile = useCallback(() => {
    return devicePerformanceOptimizer.getCurrentProfile();
  }, []);

  // 获取设备能力信息
  const getDeviceCapabilities = useCallback(() => {
    return devicePerformanceOptimizer.getDeviceCapabilities();
  }, []);

  return {
    // 性能测量
    startRenderMeasurement,
    endRenderMeasurement,
    withPerformanceMeasurement,
    
    // 当前指标
    currentMetrics,
    performanceAlerts,
    
    // 报告和优化
    getPerformanceReport,
    getOptimizationRecommendations,
    optimizePerformance,
    clearAlerts,
    
    // 设备信息
    getCurrentDeviceProfile,
    getDeviceCapabilities,
    
    // 实用工具
    isPerformanceOptimal: currentMetrics.isOptimal,
    shouldReduceEffects: currentMetrics.renderTime > performanceThreshold || currentMetrics.fps < 30,
    memoryPressure: currentMetrics.memoryUsage > memoryThreshold
  };
}

export default useEnhancedPerformanceMonitoring;
