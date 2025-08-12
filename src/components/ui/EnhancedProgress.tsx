import React, { useMemo, useCallback } from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';

export interface EnhancedProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number;
  className?: string;
  indicatorClassName?: string;
  variant?: 'linear' | 'circular' | 'arc';
  size?: 'small' | 'medium' | 'large';
  showPercentage?: boolean;
  animated?: boolean;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  thickness?: 'thin' | 'medium' | 'thick';
  rounded?: boolean;
  striped?: boolean;
  pulsing?: boolean;
}

// 颜色配置
const COLOR_CONFIG = {
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/20',
    indicator: 'bg-blue-500 dark:bg-blue-400',
    text: 'text-blue-600 dark:text-blue-400'
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900/20',
    indicator: 'bg-green-500 dark:bg-green-400',
    text: 'text-green-600 dark:text-green-400'
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/20',
    indicator: 'bg-red-500 dark:bg-red-400',
    text: 'text-red-600 dark:text-red-400'
  },
  yellow: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/20',
    indicator: 'bg-yellow-500 dark:bg-yellow-400',
    text: 'text-yellow-600 dark:text-yellow-400'
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/20',
    indicator: 'bg-purple-500 dark:bg-purple-400',
    text: 'text-purple-600 dark:text-purple-400'
  }
} as const;

// 尺寸配置
const SIZE_CONFIG = {
  small: {
    height: 'h-2',
    text: 'text-xs',
    padding: 'p-1'
  },
  medium: {
    height: 'h-4',
    text: 'text-sm',
    padding: 'p-2'
  },
  large: {
    height: 'h-6',
    text: 'text-base',
    padding: 'p-3'
  }
} as const;

// 厚度配置
const THICKNESS_CONFIG = {
  thin: 'h-1',
  medium: 'h-2',
  thick: 'h-4'
} as const;

/**
 * 线性进度条组件
 */
const LinearProgress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  EnhancedProgressProps
>(({ 
  className, 
  value = 0, 
  indicatorClassName, 
  size = 'medium',
  showPercentage = false,
  animated = true,
  color = 'blue',
  thickness = 'medium',
  rounded = true,
  striped = false,
  pulsing = false,
  ...props 
}, ref) => {
  const colorConfig = useMemo(() => COLOR_CONFIG[color], [color]);
  const sizeConfig = useMemo(() => SIZE_CONFIG[size], [size]);
  const thicknessClass = useMemo(() => THICKNESS_CONFIG[thickness], [thickness]);

  const progressValue = useMemo(() => Math.min(Math.max(value, 0), 100), [value]);

  const containerClasses = useMemo(() => [
    'relative w-full overflow-hidden',
    thicknessClass,
    rounded ? 'rounded-full' : 'rounded-none',
    colorConfig.bg,
    animated ? 'transition-all duration-300' : '',
    className
  ].filter(Boolean).join(' '), [thicknessClass, rounded, colorConfig.bg, animated, className]);

  const indicatorClasses = useMemo(() => [
    'h-full flex-1 transition-all duration-500 ease-out',
    colorConfig.indicator,
    striped ? 'bg-stripes' : '',
    pulsing ? 'animate-pulse' : '',
    indicatorClassName
  ].filter(Boolean).join(' '), [colorConfig.indicator, striped, pulsing, indicatorClassName]);

  return (
    <div className="relative">
      <ProgressPrimitive.Root
        ref={ref}
        className={containerClasses}
        value={progressValue}
        max={100}
        aria-label={`进度：${Math.round(progressValue)}%`}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={indicatorClasses}
          style={{ transform: `translateX(-${100 - progressValue}%)` }}
        />
      </ProgressPrimitive.Root>
      
      {showPercentage && (
        <div className={`absolute inset-0 flex items-center justify-center ${sizeConfig.text} font-medium ${colorConfig.text}`}>
          {Math.round(progressValue)}%
        </div>
      )}
    </div>
  );
});

/**
 * 圆形进度条组件
 */
const CircularProgress = React.forwardRef<
  SVGSVGElement,
  Omit<EnhancedProgressProps, 'variant'> & { radius?: number }
>(({ 
  value = 0, 
  size = 'medium',
  color = 'blue',
  showPercentage = true,
  animated = true,
  className,
  radius = 45,
  thickness = 'medium',
  ...props 
}, ref) => {
  const colorConfig = useMemo(() => COLOR_CONFIG[color], [color]);
  const sizeConfig = useMemo(() => SIZE_CONFIG[size], [size]);
  
  const progressValue = useMemo(() => Math.min(Math.max(value, 0), 100), [value]);
  
  const strokeWidth = useMemo(() => {
    switch (thickness) {
      case 'thin': return 4;
      case 'thick': return 12;
      default: return 8;
    }
  }, [thickness]);

  const normalizedRadius = useMemo(() => radius - strokeWidth * 2, [radius, strokeWidth]);
  const circumference = useMemo(() => normalizedRadius * 2 * Math.PI, [normalizedRadius]);
  const strokeDasharray = useMemo(() => `${circumference} ${circumference}`, [circumference]);
  const strokeDashoffset = useMemo(() => circumference - (progressValue / 100) * circumference, [circumference, progressValue]);

  const svgSize = useMemo(() => {
    switch (size) {
      case 'small': return 80;
      case 'large': return 160;
      default: return 120;
    }
  }, [size]);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        ref={ref}
        height={svgSize}
        width={svgSize}
        className={animated ? 'transition-all duration-300' : ''}
        {...props}
      >
        {/* 背景圆环 */}
        <circle
          stroke="currentColor"
          className={colorConfig.bg.replace('bg-', 'text-')}
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={svgSize / 2}
          cy={svgSize / 2}
        />
        {/* 进度圆环 */}
        <circle
          stroke="currentColor"
          className={colorConfig.indicator.replace('bg-', 'text-')}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={svgSize / 2}
          cy={svgSize / 2}
          style={{
            transition: animated ? 'stroke-dashoffset 0.5s ease-in-out' : 'none',
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%'
          }}
        />
      </svg>
      
      {showPercentage && (
        <div className={`absolute inset-0 flex items-center justify-center ${sizeConfig.text} font-bold ${colorConfig.text}`}>
          {Math.round(progressValue)}%
        </div>
      )}
    </div>
  );
});

/**
 * 弧形进度条组件
 */
const ArcProgress = React.forwardRef<
  SVGSVGElement,
  Omit<EnhancedProgressProps, 'variant'> & { radius?: number; startAngle?: number; endAngle?: number }
>(({ 
  value = 0, 
  size = 'medium',
  color = 'blue',
  showPercentage = true,
  animated = true,
  className,
  radius = 60,
  thickness = 'medium',
  startAngle = -90,
  endAngle = 90,
  ...props 
}, ref) => {
  const colorConfig = useMemo(() => COLOR_CONFIG[color], [color]);
  const sizeConfig = useMemo(() => SIZE_CONFIG[size], [size]);
  
  const progressValue = useMemo(() => Math.min(Math.max(value, 0), 100), [value]);
  
  const strokeWidth = useMemo(() => {
    switch (thickness) {
      case 'thin': return 4;
      case 'thick': return 12;
      default: return 8;
    }
  }, [thickness]);

  const svgSize = useMemo(() => (radius + strokeWidth) * 2, [radius, strokeWidth]);
  const center = useMemo(() => svgSize / 2, [svgSize]);

  const createArcPath = useCallback((startAngle: number, endAngle: number, radius: number) => {
    const start = polarToCartesian(center, center, radius, endAngle);
    const end = polarToCartesian(center, center, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return [
      "M", start.x, start.y, 
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
  }, [center]);

  const backgroundPath = useMemo(() => 
    createArcPath(startAngle, endAngle, radius), 
    [createArcPath, startAngle, endAngle, radius]
  );

  const progressPath = useMemo(() => {
    const progressEndAngle = startAngle + (endAngle - startAngle) * (progressValue / 100);
    return createArcPath(startAngle, progressEndAngle, radius);
  }, [createArcPath, startAngle, endAngle, progressValue, radius]);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        ref={ref}
        height={svgSize}
        width={svgSize}
        className={animated ? 'transition-all duration-300' : ''}
        {...props}
      >
        {/* 背景弧 */}
        <path
          d={backgroundPath}
          stroke="currentColor"
          className={colorConfig.bg.replace('bg-', 'text-')}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />
        {/* 进度弧 */}
        <path
          d={progressPath}
          stroke="currentColor"
          className={colorConfig.indicator.replace('bg-', 'text-')}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          style={{
            transition: animated ? 'all 0.5s ease-in-out' : 'none'
          }}
        />
      </svg>
      
      {showPercentage && (
        <div className={`absolute inset-0 flex items-center justify-center ${sizeConfig.text} font-bold ${colorConfig.text}`}>
          {Math.round(progressValue)}%
        </div>
      )}
    </div>
  );
});

// 辅助函数：极坐标转笛卡尔坐标
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

/**
 * 增强的进度组件
 */
export const EnhancedProgress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root> | SVGSVGElement,
  EnhancedProgressProps
>(({ variant = 'linear', ...props }, ref) => {
  switch (variant) {
    case 'circular':
      return <CircularProgress ref={ref as React.ForwardedRef<SVGSVGElement>} {...props} />;
    case 'arc':
      return <ArcProgress ref={ref as React.ForwardedRef<SVGSVGElement>} {...props} />;
    default:
      return <LinearProgress ref={ref as React.ForwardedRef<React.ElementRef<typeof ProgressPrimitive.Root>>} {...props} />;
  }
});

// 设置显示名称
LinearProgress.displayName = 'LinearProgress';
CircularProgress.displayName = 'CircularProgress';
ArcProgress.displayName = 'ArcProgress';
EnhancedProgress.displayName = 'EnhancedProgress';

export { LinearProgress, CircularProgress, ArcProgress };
export default EnhancedProgress;