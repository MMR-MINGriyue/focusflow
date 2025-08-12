/**
 * 优化的计时器显示组件
 * 使用新的UI组件库，提供更好的视觉效果和交互体验
 */

import React, { useMemo } from 'react';
import { cn } from '../../utils/cn';
import { OptimizedProgress } from '../ui/OptimizedProgress';
import { OptimizedCard } from '../ui/OptimizedCard';
import { TimerState } from '../../types/unifiedTimer';
import { BaseComponentProps } from '../ui/base/BaseComponent';

interface OptimizedTimerDisplayProps extends BaseComponentProps {
  /**
   * 剩余时间（秒）
   */
  time: number;
  /**
   * 格式化的时间字符串
   */
  formattedTime: string;
  /**
   * 当前状态
   */
  currentState: 'focus' | 'break' | 'microBreak';
  /**
   * 进度百分比
   */
  progress: number;
  /**
   * 是否激活状态
   */
  isActive?: boolean;
  /**
   * 状态文本
   */
  stateText?: string;
  /**
   * 显示模式
   */
  displayMode?: 'circular' | 'linear' | 'minimal';
  /**
   * 显示控制按钮
   */
  showControls?: boolean;
  /**
   * 大小变体
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * 优化的计时器显示组件
 */
export const OptimizedTimerDisplay: React.FC<OptimizedTimerDisplayProps> = ({
  className,
  time,
  formattedTime,
  currentState,
  progress,
  isActive = false,
  stateText,
  displayMode = 'circular',
  showControls = false,
  size = 'md',
  testId,
  ...props
}) => {
  // 根据状态获取颜色配置
  const stateConfig = useMemo(() => {
    switch (currentState) {
      case 'focus':
        return {
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          textColor: 'text-blue-600 dark:text-blue-400',
          progressColor: 'bg-blue-500',
          ringColor: 'ring-blue-500',
          icon: '🧠',
        };
      case 'break':
        return {
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          textColor: 'text-green-600 dark:text-green-400',
          progressColor: 'bg-green-500',
          ringColor: 'ring-green-500',
          icon: '☕',
        };
      case 'microBreak':
        return {
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          textColor: 'text-yellow-600 dark:text-yellow-400',
          progressColor: 'bg-yellow-500',
          ringColor: 'ring-yellow-500',
          icon: '🌿',
        };
      default:
        return {
          bgColor: 'bg-gray-50 dark:bg-gray-800',
          textColor: 'text-gray-800 dark:text-gray-200',
          progressColor: 'bg-gray-500',
          ringColor: 'ring-gray-500',
          icon: '⏱️',
        };
    }
  }, [currentState]);

  // 根据大小获取尺寸配置
  const sizeConfig = useMemo(() => {
    switch (size) {
      case 'sm':
        return {
          containerSize: 'w-32 h-32',
          textSize: 'text-2xl',
          progressSize: 'h-1',
          iconSize: 'text-lg',
        };
      case 'md':
        return {
          containerSize: 'w-48 h-48',
          textSize: 'text-4xl',
          progressSize: 'h-2',
          iconSize: 'text-xl',
        };
      case 'lg':
        return {
          containerSize: 'w-64 h-64',
          textSize: 'text-6xl',
          progressSize: 'h-3',
          iconSize: 'text-2xl',
        };
      case 'xl':
        return {
          containerSize: 'w-80 h-80',
          textSize: 'text-8xl',
          progressSize: 'h-4',
          iconSize: 'text-3xl',
        };
      default:
        return {
          containerSize: 'w-48 h-48',
          textSize: 'text-4xl',
          progressSize: 'h-2',
          iconSize: 'text-xl',
        };
    }
  }, [size]);

  // 渲染圆形计时器
  const renderCircularTimer = () => (
    <div className={cn('relative flex flex-col items-center justify-center', className)}>
      <div
        className={cn(
          'rounded-full flex items-center justify-center transition-all duration-300',
          stateConfig.bgColor,
          sizeConfig.containerSize,
          isActive && 'ring-4',
          isActive && stateConfig.ringColor
        )}
      >
        <div className="text-center z-10">
          <div className={cn('font-mono font-bold', stateConfig.textColor, sizeConfig.textSize)}>
            {formattedTime}
          </div>
          <div className={cn('text-sm font-medium', stateConfig.textColor, 'mt-1')}>
            {stateText || (currentState === 'focus' && '专注中') || (currentState === 'break' && '休息中') || (currentState === 'microBreak' && '微休息')}
          </div>
        </div>
      </div>

      {/* 圆形进度条 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <OptimizedProgress
          value={progress}
          className="w-full h-full"
          indicatorClassName={stateConfig.progressColor}
          variant="default"
        />
      </div>
    </div>
  );

  // 渲染线性计时器
  const renderLinearTimer = () => (
    <div className={cn('flex flex-col items-center w-full max-w-md', className)}>
      <div
        className={cn(
          'rounded-lg flex flex-col items-center justify-center p-8 w-full transition-all duration-300',
          stateConfig.bgColor
        )}
      >
        <div className="text-center z-10 mb-6">
          <div className={cn('font-mono font-bold', stateConfig.textColor, sizeConfig.textSize)}>
            {formattedTime}
          </div>
          <div className={cn('text-sm font-medium', stateConfig.textColor, 'mt-1')}>
            {stateText || (currentState === 'focus' && '专注中') || (currentState === 'break' && '休息中') || (currentState === 'microBreak' && '微休息')}
          </div>
        </div>

        {/* 线性进度条 */}
        <div className="w-full">
          <OptimizedProgress
            value={progress}
            className={sizeConfig.progressSize}
            indicatorClassName={stateConfig.progressColor}
            variant="default"
            showValue
          />
        </div>
      </div>
    </div>
  );

  // 渲染极简计时器
  const renderMinimalTimer = () => (
    <div className={cn('flex items-center space-x-4', className)}>
      <div
        className={cn(
          'rounded-full flex items-center justify-center transition-all duration-300',
          stateConfig.bgColor,
          'w-16 h-16',
          isActive && 'ring-2',
          isActive && stateConfig.ringColor
        )}
      >
        <div className={cn('font-mono font-bold', stateConfig.textColor, sizeConfig.textSize)}>
          {formattedTime}
        </div>
      </div>
      <div>
        <div className={cn('text-sm font-medium', stateConfig.textColor)}>
          {stateText || (currentState === 'focus' && '专注中') || (currentState === 'break' && '休息中') || (currentState === 'microBreak' && '微休息')}
        </div>
        <div className="w-32 mt-1">
          <OptimizedProgress
            value={progress}
            className="h-1"
            indicatorClassName={stateConfig.progressColor}
            variant="default"
          />
        </div>
      </div>
    </div>
  );

  // 根据显示模式渲染不同的计时器
  return (
    <OptimizedCard
      variant="filled"
      className={cn(
        'transition-all duration-300',
        isActive && 'shadow-lg',
        className
      )}
      testId={testId}
      {...props}
    >
      <div className="flex flex-col items-center justify-center">
        {displayMode === 'circular' && renderCircularTimer()}
        {displayMode === 'linear' && renderLinearTimer()}
        {displayMode === 'minimal' && renderMinimalTimer()}

        {/* 状态图标 */}
        <div className={cn('mt-4 text-2xl', sizeConfig.iconSize)}>
          {stateConfig.icon}
        </div>
      </div>
    </OptimizedCard>
  );
};

OptimizedTimerDisplay.displayName = 'OptimizedTimerDisplay';
