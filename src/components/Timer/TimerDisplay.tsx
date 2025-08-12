import React, { useMemo, useCallback } from 'react';
import { EnhancedProgress } from '../ui/EnhancedProgress';
import { StatusIndicator } from '../ui/StatusIndicator';

// 定义组件属性接口
interface TimerDisplayProps {
  time: number;
  formattedTime: string;
  currentState: 'focus' | 'break' | 'microBreak';
  progress: number;
  isActive?: boolean;
  stateText?: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
  animated?: boolean;
}

// 状态配置常量，避免每次渲染时重新创建
const STATE_CONFIG = {
  focus: {
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgColorClass: 'bg-blue-50 dark:bg-blue-900/20',
    progressColorClass: 'bg-blue-500',
    defaultText: '专注中',
    ariaLabel: '专注时间'
  },
  break: {
    colorClass: 'text-green-600 dark:text-green-400',
    bgColorClass: 'bg-green-50 dark:bg-green-900/20',
    progressColorClass: 'bg-green-500',
    defaultText: '休息中',
    ariaLabel: '休息时间'
  },
  microBreak: {
    colorClass: 'text-yellow-600 dark:text-yellow-400',
    bgColorClass: 'bg-yellow-50 dark:bg-yellow-900/20',
    progressColorClass: 'bg-yellow-500',
    defaultText: '微休息',
    ariaLabel: '微休息时间'
  }
} as const;

const SIZE_CONFIG = {
  small: {
    containerClass: 'w-32 h-32',
    timeClass: 'text-xl',
    stateClass: 'text-xs',
    progressClass: 'w-24'
  },
  medium: {
    containerClass: 'w-48 h-48',
    timeClass: 'text-3xl',
    stateClass: 'text-sm',
    progressClass: 'w-36'
  },
  large: {
    containerClass: 'w-64 h-64',
    timeClass: 'text-4xl',
    stateClass: 'text-sm',
    progressClass: 'w-48'
  }
} as const;

/**
 * 优化后的计时器显示组件
 * 显示当前时间、状态和进度，支持响应式设计和无障碍访问
 */
const TimerDisplay: React.FC<TimerDisplayProps> = React.memo(({ 
  formattedTime, 
  currentState, 
  progress,
  isActive = false,
  stateText,
  className = '',
  size = 'large',
  showProgress = true,
  animated = true
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

  return (
    <div 
      className={`
        relative rounded-full flex items-center justify-center
        ${sizeConfig.containerClass}
        ${stateConfig.bgColorClass}
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
      {/* 时间显示 */}
      <div className="text-center z-10">
        <div 
          className={`
            ${sizeConfig.timeClass} 
            font-bold 
            ${stateConfig.colorClass} 
            mb-2
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
            ${animated ? 'transition-colors duration-200' : ''}
          `}
          aria-label={`当前状态：${displayText}`}
        >
          {displayText}
        </div>
      </div>

      {/* 进度条 */}
      {showProgress && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <EnhancedProgress
            value={progress}
            variant="linear"
            size={size}
            color={currentState === 'focus' ? 'blue' : currentState === 'break' ? 'green' : 'yellow'}
            className={sizeConfig.progressClass}
            animated={animated}
            showPercentage={false}
            thickness="medium"
            rounded={true}
          />
          {/* 进度百分比文本（屏幕阅读器） */}
          <span className="sr-only">
            进度 {Math.round(progress)}%
          </span>
        </div>
      )}

      {/* 状态指示器（视觉辅助） */}
      <div className="absolute top-2 right-2">
        <StatusIndicator
          status={currentState}
          isActive={isActive}
          size="small"
          variant="dot"
          animated={animated}
        />
      </div>
    </div>
  );
});

// 设置显示名称以便于调试
TimerDisplay.displayName = 'TimerDisplay';

export default TimerDisplay;