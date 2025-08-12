/**
 * 基础图表组件
 * 提供图表的基础功能和通用逻辑
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { cn } from '../../utils/cn';
import { useTheme } from '../../theme/ThemeProvider';
import { useScreenSize } from '../../hooks/useScreenSize';
import { ChartProps, ChartConfig, ChartTheme, ChartPerformanceConfig } from '../../types/charts';

// 默认图表配置
const DEFAULT_CONFIG: Required<ChartConfig> = {
  width: 400,
  height: 300,
  margin: { top: 20, right: 20, bottom: 40, left: 40 },
  responsive: true,
  maintainAspectRatio: true,
  animation: {
    enabled: true,
    duration: 300,
    easing: 'ease-in-out'
  },
  theme: 'auto'
};

// 默认性能配置
const DEFAULT_PERFORMANCE_CONFIG: ChartPerformanceConfig = {
  virtualScrolling: false,
  dataThrottling: true,
  renderThrottling: true,
  maxDataPoints: 1000,
  updateStrategy: 'debounced',
  updateDelay: 100,
  enableWebGL: false,
  enableCanvas: true
};

// 图表容器属性
export interface BaseChartProps extends ChartProps {
  children: (props: {
    width: number;
    height: number;
    theme: ChartTheme;
    config: Required<ChartConfig>;
    containerRef: React.RefObject<HTMLDivElement>;
  }) => React.ReactNode;
  performanceConfig?: ChartPerformanceConfig;
}

/**
 * 基础图表组件
 */
export const BaseChart: React.FC<BaseChartProps> = ({
  data,
  config = {},
  loading = false,
  error,
  className,
  style,
  children,
  performanceConfig = {}
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isVisible, setIsVisible] = useState(false);
  
  const { theme: appTheme, isDark } = useTheme();
  const { width: screenWidth } = useScreenSize();

  // 合并配置
  const mergedConfig = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...config
  }), [config]);

  const mergedPerformanceConfig = useMemo(() => ({
    ...DEFAULT_PERFORMANCE_CONFIG,
    ...performanceConfig
  }), [performanceConfig]);

  // 创建图表主题
  const chartTheme = useMemo((): ChartTheme => {
    const themeMode = mergedConfig.theme === 'auto' ? (isDark ? 'dark' : 'light') : mergedConfig.theme;
    
    if (themeMode === 'dark') {
      return {
        backgroundColor: appTheme.colors.neutral[950],
        textColor: appTheme.colors.neutral[50],
        gridColor: appTheme.colors.neutral[800],
        axisColor: appTheme.colors.neutral[700],
        colors: [
          appTheme.colors.primary[500],
          appTheme.colors.secondary[500],
          appTheme.colors.success[500],
          appTheme.colors.warning[500],
          appTheme.colors.error[500],
          appTheme.colors.info[500]
        ],
        fontFamily: appTheme.typography.fontFamily.sans.join(', '),
        fontSize: 12
      };
    } else {
      return {
        backgroundColor: appTheme.colors.neutral[50],
        textColor: appTheme.colors.neutral[900],
        gridColor: appTheme.colors.neutral[200],
        axisColor: appTheme.colors.neutral[300],
        colors: [
          appTheme.colors.primary[600],
          appTheme.colors.secondary[600],
          appTheme.colors.success[600],
          appTheme.colors.warning[600],
          appTheme.colors.error[600],
          appTheme.colors.info[600]
        ],
        fontFamily: appTheme.typography.fontFamily.sans.join(', '),
        fontSize: 12
      };
    }
  }, [mergedConfig.theme, isDark, appTheme]);

  // 计算响应式尺寸
  const calculateDimensions = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    let width = mergedConfig.width;
    let height = mergedConfig.height;

    if (mergedConfig.responsive) {
      width = containerRect.width || screenWidth;
      
      if (mergedConfig.maintainAspectRatio) {
        const aspectRatio = mergedConfig.width / mergedConfig.height;
        height = width / aspectRatio;
      } else {
        height = containerRect.height || mergedConfig.height;
      }
    }

    setDimensions({ width, height });
  }, [mergedConfig, screenWidth]);

  // 监听容器尺寸变化
  useEffect(() => {
    if (!mergedConfig.responsive) {
      setDimensions({
        width: mergedConfig.width,
        height: mergedConfig.height
      });
      return;
    }

    calculateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      calculateDimensions();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [calculateDimensions, mergedConfig.responsive, mergedConfig.width, mergedConfig.height]);

  // 监听可见性变化（性能优化）
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // 数据预处理（性能优化）
  const processedData = useMemo(() => {
    if (!mergedPerformanceConfig.dataThrottling) return data;

    return data.map(series => {
      if (series.data.length <= mergedPerformanceConfig.maxDataPoints!) {
        return series;
      }

      // 数据抽样
      const step = Math.ceil(series.data.length / mergedPerformanceConfig.maxDataPoints!);
      const sampledData = series.data.filter((_, index) => index % step === 0);

      return {
        ...series,
        data: sampledData
      };
    });
  }, [data, mergedPerformanceConfig.dataThrottling, mergedPerformanceConfig.maxDataPoints]);

  // 加载状态
  if (loading) {
    return (
      <div
        ref={containerRef}
        className={cn(
          'flex items-center justify-center bg-card border border-border rounded-lg',
          className
        )}
        style={{
          width: mergedConfig.responsive ? '100%' : mergedConfig.width,
          height: mergedConfig.height,
          ...style
        }}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">加载图表数据...</span>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div
        ref={containerRef}
        className={cn(
          'flex items-center justify-center bg-card border border-destructive rounded-lg',
          className
        )}
        style={{
          width: mergedConfig.responsive ? '100%' : mergedConfig.width,
          height: mergedConfig.height,
          ...style
        }}
      >
        <div className="flex flex-col items-center gap-2 text-center p-4">
          <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-sm text-destructive font-medium">图表加载失败</span>
          <span className="text-xs text-muted-foreground">{error}</span>
        </div>
      </div>
    );
  }

  // 无数据状态
  if (!processedData || processedData.length === 0) {
    return (
      <div
        ref={containerRef}
        className={cn(
          'flex items-center justify-center bg-card border border-border rounded-lg',
          className
        )}
        style={{
          width: mergedConfig.responsive ? '100%' : mergedConfig.width,
          height: mergedConfig.height,
          ...style
        }}
      >
        <div className="flex flex-col items-center gap-2 text-center p-4">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-sm text-muted-foreground">暂无图表数据</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'bg-card border border-border rounded-lg overflow-hidden',
        className
      )}
      style={{
        width: mergedConfig.responsive ? '100%' : mergedConfig.width,
        height: mergedConfig.height,
        ...style
      }}
    >
      {isVisible && dimensions.width > 0 && dimensions.height > 0 && (
        children({
          width: dimensions.width,
          height: dimensions.height,
          theme: chartTheme,
          config: mergedConfig,
          containerRef
        })
      )}
    </div>
  );
};

// 图表工具函数
export const chartUtils = {
  // 格式化数值
  formatValue: (value: number, precision: number = 2): string => {
    if (Math.abs(value) >= 1e9) {
      return (value / 1e9).toFixed(precision) + 'B';
    } else if (Math.abs(value) >= 1e6) {
      return (value / 1e6).toFixed(precision) + 'M';
    } else if (Math.abs(value) >= 1e3) {
      return (value / 1e3).toFixed(precision) + 'K';
    }
    return value.toFixed(precision);
  },

  // 格式化时间
  formatTime: (date: Date | number | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  // 格式化持续时间
  formatDuration: (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  },

  // 生成颜色
  generateColors: (count: number, baseColors: string[]): string[] => {
    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
  },

  // 计算数据范围
  getDataRange: (data: number[]): [number, number] => {
    if (data.length === 0) return [0, 1];
    const min = Math.min(...data);
    const max = Math.max(...data);
    const padding = (max - min) * 0.1;
    return [min - padding, max + padding];
  },

  // 数据插值
  interpolateData: (data: number[], targetLength: number): number[] => {
    if (data.length >= targetLength) return data;
    
    const result: number[] = [];
    const step = (data.length - 1) / (targetLength - 1);
    
    for (let i = 0; i < targetLength; i++) {
      const index = i * step;
      const lowerIndex = Math.floor(index);
      const upperIndex = Math.ceil(index);
      
      if (lowerIndex === upperIndex) {
        result.push(data[lowerIndex]);
      } else {
        const t = index - lowerIndex;
        const interpolated = data[lowerIndex] * (1 - t) + data[upperIndex] * t;
        result.push(interpolated);
      }
    }
    
    return result;
  }
};

export default BaseChart;