import React, { useMemo, useCallback } from 'react';
import { EnhancedProgress } from '../ui/EnhancedProgress';
import { StatusIndicator } from '../ui/StatusIndicator';
import { UnifiedTimerStateType } from '../../types/unifiedTimer';

export interface ArcTimerDisplayProps {
  time: number;
  formattedTime: string;
  currentState: UnifiedTimerStateType;
  progress: number;
  isActive?: boolean;
  stateText?: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
  showPercentage?: boolean;
  animated?: boolean;
  startAngle?: number;
  endAngle?: number;
  radius?: number;
}

// 状态配置常量
const STATE_CONFIG = {
  focus: {
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgColorClass: 'bg-blue-50 dark:bg-blue-900/20',
    progressColor: 'blue' as const,
    defaultText: '专注中',
    ariaLabel: '专注时间'
  },
  break: {
    colorClass: 'text-green-600 dark:text-green-400',
    bgColorClass: 'bg-green-50 dark:bg-green-900/20',
    progressColor: 'green' as const,
    defaultText: '休息中',
    ariaLabel: '休息时间'
  },
  microBreak: {
    colorClass: 'text-yellow-600 dark:text-yellow-400',
    bgColorClass: 'bg-yellow-50 dark:bg-yellow-900/20',
    progressColor: 'yellow' as const,
    defaultText: '微休息',
    ariaLabel: '微休息时间'
  },
  forcedBreak: {
    colorClass: 'text-red-600 dark:text-red-400',
    bgColorClass: 'bg-red-50 dark:bg-red-900/20',
    progressColor: 'red' as const,
    defaultText: '强制休息',
    ariaLabel: '强制休息时间'
  }
} as const;

const SIZE_CONFIG = {
  small: {
    containerClass: 'w-40 h-24',
    timeClass: 'text-lg',
    stateClass: 'text-xs',
    radius: 60,
    padding: 'p-2'
  },
  medium: {
    containerClass: 'w-56 h-32',
    timeClass: 'text-2xl',
    stateClass: 'text-sm',
    radius: 80,
    padding: 'p-4'
  },
  large: {
    containerClass: 'w-72 h-40',
    timeClass: 'text-3xl',
    stateClass: 'text-base',
    radius: 100,
    padding: 'p-6'
  }
} as const;

/**
 * 弧形计时器显示组件
 * 使用弧形进度条显示计时器状态和进度，适合仪表盘风格的界面
 */
export const ArcTimerDisplay: React.FC<ArcTimerDisplayProps> = React.memo(({
  formattedTime,
  currentState,
  progress,
  isActive = false,
  stateText,
  className = '',
  size = 'large',
  showProgress = true,
  showPercentage = false,
  animated = true,
  startAngle = -120,
  endAngle = 120,
  radius
}) => {
  // 使用useMemo缓存状态配置，避免每次渲染时重新计算
  const stateConfig = useMemo(() => STATE_CONFIG[currentState], [currentState]);
  const sizeConfig = useMemo(() => SIZE_CONFIG[size], [size]);

  // 缓存显示文本
  const displayText = useMemo(() => 
    stateText || stateConfig.defaultText, 
    [stateText, stateConfig.defaultText]
  );

  // 缓存动画类名
  const animationClasses = useMemo(() => 
    animated ? 'transition-all duration-300 ease-in-out' : '', 
    [animated]
  );

  // 缓存脉冲动画类名（当计时器活跃时）
  const pulseClasses = useMemo(() => 
    isActive && animated ? 'animate-pulse-slow' : '', 
    [isActive, animated]
  );

  // 处理键盘事件的回调
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    // 为无障碍访问提供键盘导航支持
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      // 这里可以添加点击事件处理逻辑
    }
  }, []);

  const actualRadius = radius || sizeConfig.radius;

  return (
    <div 
      className={`
        relative flex flex-col items-center justify-center
        ${sizeConfig.containerClass}
        ${sizeConfig.padding}
        ${stateConfig.bgColorClass}
        rounded-2xl
        ${animationClasses}
        ${pulseClasses}
        ${className}
      `}
      role="timer"
      aria-label={`${stateConfig.ariaLabel}，剩余时间 ${formattedTime}`}
      aria-live="polite"
      aria-atomic="true"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* 弧形进度条 */}
      {showProgress && (
        <div className="relative flex items-center justify-center mb-2">
          <EnhancedProgress
            value={progress}
            variant="arc"
            size={size}
            color={stateConfig.progressColor}
            animated={animated}
            showPercentage={showPercentage}
            radius={actualRadius}
            thickness="medium"
            startAngle={startAngle}
            endAngle={endAngle}
          />
        </div>
      )}

      {/* 时间和状态显示 */}
      <div className="text-center">
        <div 
          className={`
            ${sizeConfig.timeClass} 
            font-bold 
            ${stateConfig.colorClass} 
            mb-1
            ${animated ? 'transition-colors duration-200' : ''}
          `}
          aria-label={`时间显示：${formattedTime}`}
        >
          {formattedTime}
        </div>
        <div 
          className={`
            ${sizeConfig.stateClass} 
            font-medium 
            ${stateConfig.colorClass}
            opacity-80
            ${animated ? 'transition-colors duration-200' : ''}
          `}
          aria-label={`当前状态：${displayText}`}
        >
          {displayText}
        </div>
      </div>

      {/* 状态指示器（右上角） */}
      <div className="absolute top-2 right-2">
        <StatusIndicator
          status={currentState}
          isActive={isActive}
          size="small"
          variant="pill"
          showText={false}
          animated={animated}
        />
      </div>

      {/* 进度百分比（左下角，可选） */}
      {showPercentage && (
        <div className={`absolute bottom-2 left-2 ${sizeConfig.stateClass} ${stateConfig.colorClass} font-medium`}>
          {Math.round(progress)}%
        </div>
      )}
    </div>
  );
});

// 设置显示名称以便于调试
ArcTimerDisplay.displayName = 'ArcTimerDisplay';

export default ArcTimerDisplay;