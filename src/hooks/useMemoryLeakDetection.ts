/**
 * React Hook for Memory Leak Detection
 * 
 * 提供组件级别的内存泄漏检测和监控功能
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { memoryLeakDetector } from '../utils/memoryLeakDetector';

interface MemoryLeakReport {
  activeTimers: number;
  activeEventListeners: number;
  memoryUsage: number;
  memoryTrend: 'increasing' | 'stable' | 'decreasing';
  leakSuspects: string[];
  recommendations: string[];
  timestamp: number;
}

interface UseMemoryLeakDetectionOptions {
  /** 是否自动开始监控 */
  autoStart?: boolean;
  /** 监控间隔（毫秒） */
  reportInterval?: number;
  /** 是否在开发环境中启用 */
  enableInDevelopment?: boolean;
  /** 是否在生产环境中启用 */
  enableInProduction?: boolean;
  /** 内存泄漏阈值 */
  thresholds?: {
    maxTimers?: number;
    maxEventListeners?: number;
    maxMemoryIncrease?: number; // MB
  };
}

interface UseMemoryLeakDetectionReturn {
  /** 当前内存泄漏报告 */
  report: MemoryLeakReport | null;
  /** 是否正在监控 */
  isMonitoring: boolean;
  /** 开始监控 */
  startMonitoring: () => void;
  /** 停止监控 */
  stopMonitoring: () => void;
  /** 生成即时报告 */
  generateReport: () => MemoryLeakReport;
  /** 强制清理资源 */
  forceCleanup: () => void;
  /** 是否检测到潜在泄漏 */
  hasLeakSuspects: boolean;
  /** 获取详细的定时器信息 */
  getTimerDetails: () => any[];
  /** 获取详细的事件监听器信息 */
  getEventListenerDetails: () => any[];
}

const defaultOptions: Required<UseMemoryLeakDetectionOptions> = {
  autoStart: true,
  reportInterval: 10000, // 10秒
  enableInDevelopment: true,
  enableInProduction: false,
  thresholds: {
    maxTimers: 10,
    maxEventListeners: 50,
    maxMemoryIncrease: 10 // 10MB
  }
};

export function useMemoryLeakDetection(
  options: UseMemoryLeakDetectionOptions = {}
): UseMemoryLeakDetectionReturn {
  const opts = { ...defaultOptions, ...options };
  const [report, setReport] = useState<MemoryLeakReport | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const componentMountedRef = useRef(true);

  // 检查是否应该启用监控
  const shouldEnable = useCallback(() => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isProduction = process.env.NODE_ENV === 'production';
    
    return (isDevelopment && opts.enableInDevelopment) || 
           (isProduction && opts.enableInProduction);
  }, [opts.enableInDevelopment, opts.enableInProduction]);

  // 生成报告
  const generateReport = useCallback((): MemoryLeakReport => {
    return memoryLeakDetector.generateReport();
  }, []);

  // 开始监控
  const startMonitoring = useCallback(() => {
    if (!shouldEnable() || isMonitoring) return;

    memoryLeakDetector.startMonitoring();
    setIsMonitoring(true);

    // 定期生成报告
    intervalRef.current = window.setInterval(() => {
      if (componentMountedRef.current) {
        const newReport = generateReport();
        setReport(newReport);

        // 检查是否超过阈值
        if (newReport.activeTimers > (opts.thresholds?.maxTimers || 50)) {
          console.warn(`⚠️ Timer count (${newReport.activeTimers}) exceeds threshold (${opts.thresholds.maxTimers})`);
        }

        if (newReport.activeEventListeners > (opts.thresholds?.maxEventListeners || 100)) {
          console.warn(`⚠️ Event listener count (${newReport.activeEventListeners}) exceeds threshold (${opts.thresholds.maxEventListeners})`);
        }

        if (newReport.memoryTrend === 'increasing') {
          console.warn('⚠️ Memory usage is increasing - potential memory leak detected');
        }
      }
    }, opts.reportInterval);
  }, [shouldEnable, isMonitoring, generateReport, opts.reportInterval, opts.thresholds]);

  // 停止监控
  const stopMonitoring = useCallback(() => {
    if (!isMonitoring) return;

    memoryLeakDetector.stopMonitoring();
    setIsMonitoring(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isMonitoring]);

  // 强制清理
  const forceCleanup = useCallback(() => {
    memoryLeakDetector.forceCleanup();
    const newReport = generateReport();
    setReport(newReport);
  }, [generateReport]);

  // 获取详细信息
  const getTimerDetails = useCallback(() => {
    return memoryLeakDetector.getTimerDetails();
  }, []);

  const getEventListenerDetails = useCallback(() => {
    return memoryLeakDetector.getEventListenerDetails();
  }, []);

  // 计算是否有泄漏嫌疑
  const hasLeakSuspects = report ? report.leakSuspects.length > 0 : false;

  // 组件挂载时自动开始监控
  useEffect(() => {
    componentMountedRef.current = true;

    if (opts.autoStart) {
      startMonitoring();
    }

    return () => {
      componentMountedRef.current = false;
      stopMonitoring();
    };
  }, [opts.autoStart, startMonitoring, stopMonitoring]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    report,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    generateReport,
    forceCleanup,
    hasLeakSuspects,
    getTimerDetails,
    getEventListenerDetails
  };
}

/**
 * 简化版本的内存泄漏检测Hook
 * 只返回基本的监控状态和报告
 */
export function useSimpleMemoryLeakDetection() {
  const { report, hasLeakSuspects, isMonitoring } = useMemoryLeakDetection({
    autoStart: true,
    reportInterval: 15000, // 15秒
    enableInDevelopment: true,
    enableInProduction: false
  });

  return {
    report,
    hasLeakSuspects,
    isMonitoring
  };
}

/**
 * 开发环境专用的内存泄漏检测Hook
 * 提供更详细的调试信息
 */
export function useDevMemoryLeakDetection() {
  const detection = useMemoryLeakDetection({
    autoStart: true,
    reportInterval: 5000, // 5秒，更频繁的检测
    enableInDevelopment: true,
    enableInProduction: false,
    thresholds: {
      maxTimers: 5,
      maxEventListeners: 20,
      maxMemoryIncrease: 5
    }
  });

  // 在开发环境中输出详细日志
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && detection.report) {
      console.group('🔍 Memory Leak Detection Report');
      console.log('Active Timers:', detection.report.activeTimers);
      console.log('Active Event Listeners:', detection.report.activeEventListeners);
      console.log('Memory Usage:', `${detection.report.memoryUsage.toFixed(2)} MB`);
      console.log('Memory Trend:', detection.report.memoryTrend);
      
      if (detection.report.leakSuspects.length > 0) {
        console.warn('Leak Suspects:', detection.report.leakSuspects);
      }
      
      if (detection.report.recommendations.length > 0) {
        console.info('Recommendations:', detection.report.recommendations);
      }
      
      console.groupEnd();
    }
  }, [detection.report]);

  return detection;
}

/**
 * 生产环境专用的内存泄漏检测Hook
 * 只在检测到严重问题时报告
 */
export function useProdMemoryLeakDetection() {
  const detection = useMemoryLeakDetection({
    autoStart: true,
    reportInterval: 30000, // 30秒
    enableInDevelopment: false,
    enableInProduction: true,
    thresholds: {
      maxTimers: 20,
      maxEventListeners: 100,
      maxMemoryIncrease: 20
    }
  });

  // 只在检测到严重问题时报告
  useEffect(() => {
    if (detection.hasLeakSuspects && detection.report) {
      // 在生产环境中，可以发送到错误监控服务
      console.error('Memory leak detected in production:', {
        activeTimers: detection.report.activeTimers,
        activeEventListeners: detection.report.activeEventListeners,
        memoryTrend: detection.report.memoryTrend,
        leakSuspects: detection.report.leakSuspects
      });
    }
  }, [detection.hasLeakSuspects, detection.report]);

  return detection;
}
