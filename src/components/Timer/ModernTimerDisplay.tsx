import React, { useMemo, useCallback } from 'react';
import { useUnifiedTimerStore } from '../../stores/unifiedTimerStore';
import { formatTime } from '../../utils/formatTime';
import { UnifiedTimerStateType } from '../../types/unifiedTimer';

interface ModernTimerDisplayProps {
  className?: string;
  showControls?: boolean;
  compact?: boolean;
}

// 状态配置常量，避免每次渲染时重新创建
const STATE_CONFIG: Record<UnifiedTimerStateType, { 
  title: string; 
  subtitle: string; 
  gradient: string; 
  bgGradient: string;
  ariaLabel: string;
}> = {
  focus: {
    title: '专注时间',
    subtitle: '保持专注，提高效率',
    gradient: 'from-green-400 to-blue-500',
    bgGradient: 'from-green-500/10 to-blue-500/10',
    ariaLabel: '专注模式'
  },
  break: {
    title: '休息时间',
    subtitle: '放松身心，恢复精力',
    gradient: 'from-orange-400 to-red-500',
    bgGradient: 'from-orange-500/10 to-red-500/10',
    ariaLabel: '休息模式'
  },
  microBreak: {
    title: '微休息',
    subtitle: '短暂放松，保持活力',
    gradient: 'from-purple-400 to-pink-500',
    bgGradient: 'from-purple-500/10 to-pink-500/10',
    ariaLabel: '微休息模式'
  },
  forcedBreak: {
    title: '强制休息',
    subtitle: '避免疲劳，保护健康',
    gradient: 'from-red-400 to-pink-500',
    bgGradient: 'from-red-500/10 to-pink-500/10',
    ariaLabel: '强制休息模式'
  },
};

export const ModernTimerDisplay: React.FC<ModernTimerDisplayProps> = React.memo(({
  className = '',
  showControls = true,
  compact = false,
}) => {
  const {
    timeLeft,
    currentState,
    isActive,
    totalTime,
    start,
    pause,
    reset,
    skipToNext,
  } = useUnifiedTimerStore();

  const progress = useMemo(() => {
    if (totalTime === 0) return 0;
    return ((totalTime - timeLeft) / totalTime) * 100;
  }, [timeLeft, totalTime]);

  const formattedTime = useMemo(() => formatTime(timeLeft), [timeLeft]);

  const config = useMemo(() => STATE_CONFIG[currentState], [currentState]);

  // 缓存按钮点击处理函数
  const handleStart = useCallback(() => start(), [start]);
  const handlePause = useCallback(() => pause(), [pause]);
  const handleReset = useCallback(() => reset(), [reset]);
  const handleSkip = useCallback(() => skipToNext(), [skipToNext]);

  return (
    <div 
      className={`${className} ${compact ? 'p-4' : 'p-8'} modern-card-glass`}
      role="timer"
      aria-label={`${config.ariaLabel}，剩余时间 ${formattedTime}`}
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Header */}
      {!compact && (
        <div className="text-center mb-6">
          <h2 
            className={`text-2xl font-bold bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent transition-all duration-300`}
            aria-level={2}
          >
            {config.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2 transition-colors duration-300">
            {config.subtitle}
          </p>
        </div>
      )}

      {/* Timer Display */}
      <div className={`text-center ${compact ? 'mb-4' : 'mb-8'}`}>
        <div
          className={`
            font-mono font-bold 
            ${compact ? 'text-4xl' : 'text-7xl md:text-8xl'} 
            text-gray-900 dark:text-white mb-4
            transition-all duration-300
            ${isActive ? 'animate-pulse-slow' : ''}
          `}
          aria-label={`时间显示：${formattedTime}`}
        >
          {formattedTime}
        </div>

        {/* Progress Bar */}
        <div 
          className="modern-progress mb-4"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`进度：${Math.round(progress)}%`}
        >
          <div
            className="modern-progress-bar transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Phase Info */}
        {!compact && (
          <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
            <span className="font-medium">{config.title}</span>
            <span className="mx-2" aria-hidden="true">•</span>
            <span>{Math.round(totalTime / 60)}分钟</span>
          </div>
        )}
      </div>

      {/* Controls */}
      {showControls && (
        <div className="flex justify-center space-x-3" role="group" aria-label="计时器控制按钮">
          {!isActive ? (
            <button
              onClick={handleStart}
              className="modern-button-primary px-8 py-3 transition-all duration-200 hover:scale-105 focus:scale-105"
              aria-label="开始计时器"
            >
              <span className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                <span>开始</span>
              </span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="modern-button-secondary px-8 py-3 transition-all duration-200 hover:scale-105 focus:scale-105"
              aria-label="暂停计时器"
            >
              <span className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>暂停</span>
              </span>
            </button>
          )}

          <button
            onClick={handleReset}
            className="modern-button-ghost px-6 py-3 transition-all duration-200 hover:scale-105 focus:scale-105"
            title="重置计时器"
            aria-label="重置计时器"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <button
            onClick={handleSkip}
            className="modern-button-ghost px-6 py-3 transition-all duration-200 hover:scale-105 focus:scale-105"
            title="跳过当前阶段"
            aria-label="跳过当前阶段"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
});

// 紧凑版本的计时器显示
export const CompactTimerDisplay: React.FC = React.memo(() => {
  const { timeLeft, currentState, isActive, start, pause } = useUnifiedTimerStore();
  const formattedTime = useMemo(() => formatTime(timeLeft), [timeLeft]);

  const stateColors: Record<UnifiedTimerStateType, string> = {
    focus: 'text-green-500',
    break: 'text-red-500',
    microBreak: 'text-purple-500',
    forcedBreak: 'text-orange-500',
  };

  const handleToggle = useCallback(() => {
    if (isActive) {
      pause();
    } else {
      start();
    }
  }, [isActive, pause, start]);

  const config = useMemo(() => STATE_CONFIG[currentState], [currentState]);

  return (
    <div 
      className="flex items-center space-x-3 px-4 py-2 modern-card transition-all duration-200"
      role="timer"
      aria-label={`${config.ariaLabel}，剩余时间 ${formattedTime}`}
    >
      <div 
        className={`font-mono font-bold text-lg ${stateColors[currentState]} transition-colors duration-200`}
        aria-label={`时间显示：${formattedTime}`}
      >
        {formattedTime}
      </div>
      <button
        onClick={handleToggle}
        className="modern-button-primary px-3 py-1 text-sm transition-all duration-200 hover:scale-105 focus:scale-105"
        aria-label={isActive ? '暂停计时器' : '开始计时器'}
      >
        {isActive ? '暂停' : '开始'}
      </button>
    </div>
  );
});

// 迷你版本的计时器显示（用于系统托盘等）
export const MiniTimerDisplay: React.FC = React.memo(() => {
  const { timeLeft, currentState } = useUnifiedTimerStore();
  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  const stateColors: Record<UnifiedTimerStateType, string> = {
    focus: 'text-green-400',
    break: 'text-red-400',
    microBreak: 'text-purple-400',
    forcedBreak: 'text-orange-400',
  };

  const config = useMemo(() => STATE_CONFIG[currentState], [currentState]);

  return (
    <div 
      className="flex items-center space-x-2 px-2 py-1"
      role="timer"
      aria-label={`${config.ariaLabel}，剩余时间 ${formattedTime}`}
    >
      <div 
        className={`font-mono text-sm ${stateColors[currentState]} transition-colors duration-200`}
        aria-label={`时间显示：${formattedTime}`}
      >
        {formattedTime}
      </div>
    </div>
  );
});

// 设置显示名称以便于调试
ModernTimerDisplay.displayName = 'ModernTimerDisplay';
CompactTimerDisplay.displayName = 'CompactTimerDisplay';
MiniTimerDisplay.displayName = 'MiniTimerDisplay';

export default ModernTimerDisplay;