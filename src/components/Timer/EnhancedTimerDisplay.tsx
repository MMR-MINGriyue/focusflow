
/**
 * 增强版计时器显示组件
 * 应用现代化Web设计，提供更丰富的视觉效果和交互体验
 */

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { TimerState } from '../../types/unifiedTimer';
import { BaseComponentProps } from '../ui/base/BaseComponent';

interface EnhancedTimerDisplayProps extends BaseComponentProps {
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
  displayMode?: 'circular' | 'linear' | 'minimal' | 'enhanced';
  /**
   * 大小变体
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * 是否显示动画效果
   */
  enableAnimations?: boolean;
  /**
   * 自定义主题色
   */
  customTheme?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

/**
 * 增强版计时器显示组件
 */
export const EnhancedTimerDisplay: React.FC<EnhancedTimerDisplayProps> = ({
  className,
  time,
  formattedTime,
  currentState,
  progress,
  isActive = false,
  stateText,
  displayMode = 'enhanced',
  size = 'lg',
  enableAnimations = true,
  customTheme,
  testId,
  ...props
}) => {
  const [pulseAnimation, setPulseAnimation] = useState(false);
  const [glowEffect, setGlowEffect] = useState(false);

  // 根据状态获取颜色配置
  const stateConfig = useMemo(() => {
    if (customTheme) {
      return {
        bgColor: `bg-${customTheme.primary}/10 dark:bg-${customTheme.primary}/20`,
        textColor: `text-${customTheme.primary} dark:text-${customTheme.secondary}`,
        progressColor: `bg-gradient-to-r from-${customTheme.primary} to-${customTheme.secondary}`,
        ringColor: `ring-${customTheme.primary}`,
        icon: currentState === 'focus' ? '🧠' : currentState === 'break' ? '☕' : '🌿',
      };
    }

    switch (currentState) {
      case 'focus':
        return {
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          textColor: 'text-blue-600 dark:text-blue-400',
          progressColor: 'bg-gradient-to-r from-blue-500 to-indigo-500',
          ringColor: 'ring-blue-500',
          icon: '🧠',
        };
      case 'break':
        return {
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          textColor: 'text-green-600 dark:text-green-400',
          progressColor: 'bg-gradient-to-r from-green-500 to-emerald-500',
          ringColor: 'ring-green-500',
          icon: '☕',
        };
      case 'microBreak':
        return {
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          textColor: 'text-yellow-600 dark:text-yellow-400',
          progressColor: 'bg-gradient-to-r from-yellow-500 to-amber-500',
          ringColor: 'ring-yellow-500',
          icon: '🌿',
        };
      default:
        return {
          bgColor: 'bg-gray-50 dark:bg-gray-800',
          textColor: 'text-gray-800 dark:text-gray-200',
          progressColor: 'bg-gradient-to-r from-gray-500 to-slate-500',
          ringColor: 'ring-gray-500',
          icon: '⏱️',
        };
    }
  }, [currentState, customTheme]);

  // 根据大小获取尺寸配置
  const sizeConfig = useMemo(() => {
    switch (size) {
      case 'sm':
        return {
          containerSize: 'w-32 h-32',
          textSize: 'text-2xl',
          progressSize: 'h-1',
          iconSize: 'text-lg',
          strokeWidth: 4,
        };
      case 'md':
        return {
          containerSize: 'w-48 h-48',
          textSize: 'text-4xl',
          progressSize: 'h-2',
          iconSize: 'text-xl',
          strokeWidth: 6,
        };
      case 'lg':
        return {
          containerSize: 'w-64 h-64',
          textSize: 'text-6xl',
          progressSize: 'h-3',
          iconSize: 'text-2xl',
          strokeWidth: 8,
        };
      case 'xl':
        return {
          containerSize: 'w-80 h-80',
          textSize: 'text-8xl',
          progressSize: 'h-4',
          iconSize: 'text-3xl',
          strokeWidth: 10,
        };
      default:
        return {
          containerSize: 'w-48 h-48',
          textSize: 'text-4xl',
          progressSize: 'h-2',
          iconSize: 'text-xl',
          strokeWidth: 6,
        };
    }
  }, [size]);

  // 处理动画效果
  useEffect(() => {
    if (!enableAnimations) return;

    if (isActive) {
      setPulseAnimation(true);
      setGlowEffect(true);

      // 每10秒触发一次脉冲动画
      const pulseInterval = setInterval(() => {
        setPulseAnimation(false);
        setTimeout(() => setPulseAnimation(true), 10);
      }, 10000);

      return () => clearInterval(pulseInterval);
    } else {
      setPulseAnimation(false);
      setGlowEffect(false);
    }
  }, [isActive, enableAnimations]);

  // 渲染增强版计时器
  const renderEnhancedTimer = () => {
    // 计算圆形进度条的参数
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <div className={cn('relative flex flex-col items-center justify-center', className)}>
        <div
          className={cn(
            'rounded-full flex items-center justify-center transition-all duration-300 glass-effect',
            sizeConfig.containerSize,
            isActive && 'ring-4',
            isActive && stateConfig.ringColor,
            pulseAnimation && 'animate-pulse',
            glowEffect && 'shadow-lg'
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
          <svg className={sizeConfig.containerSize} viewBox="0 0 200 200">
            {/* 背景圆环 */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="rgba(229, 231, 235, 0.5)"
              strokeWidth={sizeConfig.strokeWidth}
            />
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="url(#gradient)"
              strokeWidth={sizeConfig.strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 100 100)"
              className="transition-all duration-1000 ease-out"
            />
            {/* 渐变定义 */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={currentState === 'focus' ? '#3b82f6' : currentState === 'break' ? '#10b981' : '#f59e0b'} />
                <stop offset="100%" stopColor={currentState === 'focus' ? '#8b5cf6' : currentState === 'break' ? '#059669' : '#d97706'} />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* 状态指示器 */}
        <div className={cn('absolute bottom-4 flex items-center justify-center', sizeConfig.iconSize)}>
          <div className={cn(
            'w-3 h-3 rounded-full mr-2',
            isActive && 'animate-pulse',
            currentState === 'focus' ? 'bg-blue-500' : currentState === 'break' ? 'bg-green-500' : 'bg-yellow-500'
          )} />
          <span className={cn('text-xs font-medium', stateConfig.textColor)}>
            {isActive ? '进行中' : '已暂停'}
          </span>
        </div>
      </div>
    );
  };

  // 渲染圆形计时器
  const renderCircularTimer = () => {
    // 计算圆形进度条的参数
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <div className={cn('relative flex flex-col items-center justify-center', className)}>
        <div
          className={cn(
            'rounded-full flex items-center justify-center transition-all duration-300',
            stateConfig.bgColor,
            sizeConfig.containerSize,
            isActive && 'ring-4',
            isActive && stateConfig.ringColor,
            pulseAnimation && 'animate-pulse',
            glowEffect && 'shadow-lg'
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
          <svg className={sizeConfig.containerSize} viewBox="0 0 200 200">
            {/* 背景圆环 */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="rgba(229, 231, 235, 0.5)"
              strokeWidth={sizeConfig.strokeWidth}
            />
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="url(#gradient)"
              strokeWidth={sizeConfig.strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 100 100)"
              className="transition-all duration-1000 ease-out"
            />
            {/* 渐变定义 */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={currentState === 'focus' ? '#3b82f6' : currentState === 'break' ? '#10b981' : '#f59e0b'} />
                <stop offset="100%" stopColor={currentState === 'focus' ? '#8b5cf6' : currentState === 'break' ? '#059669' : '#d97706'} />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    );
  };

  // 渲染线性计时器
  const renderLinearTimer = () => (
    <div className={cn('flex flex-col items-center w-full max-w-md', className)}>
      <div
        className={cn(
          'rounded-lg flex flex-col items-center justify-center p-8 w-full transition-all duration-300',
          stateConfig.bgColor,
          isActive && 'shadow-lg'
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
          <div className="modern-progress-bar">
            <div 
              className={cn('modern-progress-fill', stateConfig.progressColor)}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>{Math.round(progress)}%</span>
            <span>100%</span>
          </div>
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
        <div className={cn('font-mono font-bold', stateConfig.textColor, 'text-xl')}>
          {formattedTime}
        </div>
      </div>
      <div>
        <div className={cn('text-sm font-medium', stateConfig.textColor)}>
          {stateText || (currentState === 'focus' && '专注中') || (currentState === 'break' && '休息中') || (currentState === 'microBreak' && '微休息')}
        </div>
        <div className="w-32 mt-1">
          <div className="modern-progress-bar h-1">
            <div 
              className={cn('modern-progress-fill', stateConfig.progressColor)}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  // 根据显示模式渲染不同的计时器
  return (
    <div 
      className={cn(
        'transition-all duration-300',
        isActive && 'shadow-lg',
        className
      )}
      testId={testId}
      {...props}
    >
      <div className="flex flex-col items-center justify-center">
        {displayMode === 'enhanced' && renderEnhancedTimer()}
        {displayMode === 'circular' && renderCircularTimer()}
        {displayMode === 'linear' && renderLinearTimer()}
        {displayMode === 'minimal' && renderMinimalTimer()}

        {/* 状态图标 */}
        <div className={cn('mt-4 text-2xl', sizeConfig.iconSize)}>
          {stateConfig.icon}
        </div>
      </div>
    </div>
  );
};

EnhancedTimerDisplay.displayName = 'EnhancedTimerDisplay';
