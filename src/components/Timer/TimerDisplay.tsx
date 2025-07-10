import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { TimerStyleConfig } from '../../types/timerStyle';
import { timerStyleService } from '../../services/timerStyle';
import BackgroundEffects from './BackgroundEffects';
import { usePerformanceMonitor, getAdaptivePerformanceConfig } from '../../utils/performance';

// 响应式断点
const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024
};

interface TimerDisplayProps {
  time: number;
  formattedTime: string;
  currentState: 'focus' | 'break' | 'microBreak';
  progress: number;
  isActive: boolean;
  stateText: string;
  className?: string;
}

const TimerDisplay: React.FC<TimerDisplayProps> = React.memo(({
  time,
  formattedTime,
  currentState,
  progress,
  isActive,
  stateText,
  className = ''
}) => {
  const [currentStyle, setCurrentStyle] = useState<TimerStyleConfig>(timerStyleService.getCurrentStyle());
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  // 性能监控
  const { recordUpdate } = usePerformanceMonitor('TimerDisplay');

  // 自适应性能配置
  const performanceConfig = useMemo(() => getAdaptivePerformanceConfig(), []);

  // 获取当前屏幕尺寸
  const getScreenSize = (): 'mobile' | 'tablet' | 'desktop' => {
    const width = window.innerWidth;
    if (width < BREAKPOINTS.mobile) return 'mobile';
    if (width < BREAKPOINTS.tablet) return 'tablet';
    return 'desktop';
  };

  // 获取响应式样式配置（使用useCallback优化）
  const getResponsiveStyle = useCallback((baseStyle: TimerStyleConfig): TimerStyleConfig => {
    if (!baseStyle.responsive.enabled) return baseStyle;

    const breakpointConfig = baseStyle.responsive.breakpoints[screenSize];
    if (!breakpointConfig) return baseStyle;

    // 合并基础样式和断点配置，并应用性能优化
    const optimizedStyle = {
      ...baseStyle,
      ...breakpointConfig,
      layout: {
        ...baseStyle.layout,
        ...breakpointConfig.layout
      },
      animations: {
        ...baseStyle.animations,
        ...breakpointConfig.animations,
        // 在低性能设备上禁用动画
        enabled: baseStyle.animations.enabled && performanceConfig.enableAnimations
      },
      particles: {
        ...baseStyle.particles,
        // 在低性能设备上减少粒子数量
        count: Math.min(baseStyle.particles.count, performanceConfig.particleCount)
      },
      background: {
        ...baseStyle.background,
        // 在低性能设备上禁用背景效果
        pattern: performanceConfig.enableBackgroundEffects ? baseStyle.background.pattern : 'none'
      }
    };

    return optimizedStyle;
  }, [screenSize, performanceConfig]);

  useEffect(() => {
    const handleStyleChange = () => {
      recordUpdate(); // 记录组件更新

      // 根据状态获取样式
      const style = timerStyleService.getStyleForState(currentState);
      const responsiveStyle = getResponsiveStyle(style);
      setCurrentStyle(responsiveStyle);
    };

    const handleResize = () => {
      const newScreenSize = getScreenSize();
      if (newScreenSize !== screenSize) {
        setScreenSize(newScreenSize);
        handleStyleChange();
      }
    };

    timerStyleService.addListener(handleStyleChange);
    window.addEventListener('resize', handleResize);

    // 初始化
    setScreenSize(getScreenSize());
    handleStyleChange();

    return () => {
      timerStyleService.removeListener(handleStyleChange);
      window.removeEventListener('resize', handleResize);
    };
  }, [currentState, screenSize, getResponsiveStyle, recordUpdate]);

  // 根据样式类型渲染不同的显示组件
  const renderDisplay = () => {
    switch (currentStyle.displayStyle) {
      case 'digital':
        return <DigitalDisplay {...{ formattedTime, currentState, progress, isActive, stateText, style: currentStyle }} />;
      case 'analog':
        return <AnalogDisplay {...{ time, currentState, progress, isActive, stateText, style: currentStyle }} />;
      case 'progress':
        return <ProgressDisplay {...{ formattedTime, currentState, progress, isActive, stateText, style: currentStyle }} />;
      case 'minimal':
        return <MinimalDisplay {...{ formattedTime, currentState, progress, isActive, stateText, style: currentStyle }} />;
      case 'card':
        return <CardDisplay {...{ formattedTime, currentState, progress, isActive, stateText, style: currentStyle }} />;
      case 'neon':
        return <NeonDisplay {...{ formattedTime, currentState, progress, isActive, stateText, style: currentStyle }} />;
      default:
        return <DigitalDisplay {...{ formattedTime, currentState, progress, isActive, stateText, style: currentStyle }} />;
    }
  };

  // 获取状态颜色
  const getStateColor = () => {
    switch (currentState) {
      case 'focus': return currentStyle.colors.primary;
      case 'break': return '#ef4444';
      case 'microBreak': return '#f59e0b';
      default: return currentStyle.colors.text;
    }
  };

  // 获取动画类名
  const getAnimationClasses = () => {
    if (!currentStyle.animations.enabled) return '';

    const classes = [];

    if (currentStyle.animations.pulseOnStateChange && isActive) {
      classes.push('timer-pulse');
    }

    if (currentStyle.animations.breathingEffect) {
      classes.push('timer-breathing');
    }

    if (currentStyle.animations.rotationEffect && currentStyle.displayStyle === 'analog') {
      classes.push('timer-rotation');
    }

    if (currentStyle.displayStyle === 'neon') {
      classes.push('timer-neon');
    }

    return classes.join(' ');
  };

  return (
    <div
      className={`timer-display-container relative ${className} ${getAnimationClasses()}`}
      data-style={currentStyle.displayStyle}
      style={{
        '--timer-animation-duration': `${currentStyle.animations.transitionDuration}ms`,
        '--timer-animation-easing': currentStyle.animations.easing,
        '--timer-state-color': getStateColor(),
        '--timer-primary-color': currentStyle.colors.primary,
        '--timer-secondary-color': currentStyle.colors.secondary,
        '--timer-background-color': currentStyle.colors.background,
        '--timer-text-color': currentStyle.colors.text,
        '--timer-progress-bg': currentStyle.colors.progressBackground,
        '--timer-font-size': currentStyle.fontSize || '3rem',
        '--timer-font-weight': currentStyle.fontWeight || '600',
        '--timer-font-family': currentStyle.fontFamily || 'inherit'
      } as React.CSSProperties}
    >
      {/* 背景效果层 */}
      <BackgroundEffects
        style={currentStyle}
        isActive={isActive}
        className="rounded-lg"
      />

      {/* 计时器内容层 */}
      <div className="relative z-10">
        {renderDisplay()}
      </div>
    </div>
  );
});

TimerDisplay.displayName = 'TimerDisplay';

// 数字显示组件
const DigitalDisplay: React.FC<{
  formattedTime: string;
  currentState: string;
  progress: number;
  isActive: boolean;
  stateText: string;
  style: TimerStyleConfig;
}> = ({ formattedTime, currentState: _currentState, progress, isActive, stateText, style }) => {
  return (
    <div className="digital-timer-display flex flex-col items-center space-y-4">
      <div
        className={`timer-time ${style.animations.enabled ? 'transition-all' : ''} ${
          style.animations.pulseOnStateChange && isActive ? 'timer-pulse' : ''
        } ${style.animations.breathingEffect ? 'timer-breathing' : ''}`}
        style={{
          fontSize: 'var(--timer-font-size)',
          fontWeight: 'var(--timer-font-weight)',
          fontFamily: 'var(--timer-font-family)',
          color: 'var(--timer-state-color)',
          textShadow: style.displayStyle === 'neon' ? '0 0 10px var(--timer-state-color)' : 'none',
          transitionDuration: style.animations.enabled ? 'var(--timer-animation-duration)' : '0ms'
        } as React.CSSProperties}
      >
        {formattedTime}
      </div>

      {style.layout.showStateText && (
        <div
          className="timer-state-text text-lg font-medium"
          style={{ color: 'var(--timer-secondary-color)' } as React.CSSProperties}
        >
          {stateText}
        </div>
      )}

      {style.layout.showStatusIndicator && (
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${isActive ? 'animate-pulse' : ''}`}
            style={{ backgroundColor: 'var(--timer-state-color)' } as React.CSSProperties}
          />
          {style.layout.showProgressPercentage && (
            <span className="text-sm" style={{ color: 'var(--timer-secondary-color)' } as React.CSSProperties}>
              {Math.round(progress)}% 完成
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// 模拟时钟显示组件
const AnalogDisplay: React.FC<{
  time: number;
  currentState: string;
  progress: number;
  isActive: boolean;
  stateText: string;
  style: TimerStyleConfig;
}> = ({ time, currentState: _currentState, progress, stateText, style }) => {
  const radius = 80;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="analog-timer-display flex flex-col items-center space-y-4">
      <div className="relative">
        <svg width="200" height="200" className="transform -rotate-90">
          {/* 背景圆环 */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="var(--timer-progress-bg)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* 进度圆环 */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="var(--timer-state-color)"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={style.animations.enabled ? 'transition-all duration-500 ease-out' : ''}
            style={{
              filter: style.displayStyle === 'neon' ? 'drop-shadow(0 0 5px var(--timer-state-color))' : 'none'
            } as React.CSSProperties}
          />
        </svg>

        {/* 中心时间显示 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            className="text-2xl font-bold"
            style={{
              color: 'var(--timer-state-color)',
              fontFamily: 'var(--timer-font-family)'
            } as React.CSSProperties}
          >
            {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
          </div>
          {style.layout.showProgressPercentage && (
            <div className="text-sm" style={{ color: 'var(--timer-secondary-color)' } as React.CSSProperties}>
              {Math.round(progress)}%
            </div>
          )}
        </div>
      </div>

      {style.layout.showStateText && (
        <div
          className="timer-state-text text-lg font-medium"
          style={{ color: 'var(--timer-secondary-color)' } as React.CSSProperties}
        >
          {stateText}
        </div>
      )}
    </div>
  );
};

// 进度环显示组件
const ProgressDisplay: React.FC<{
  formattedTime: string;
  currentState: string;
  progress: number;
  isActive: boolean;
  stateText: string;
  style: TimerStyleConfig;
}> = ({ formattedTime, currentState: _currentState, progress, stateText, style }) => {
  return (
    <div className="progress-timer-display flex flex-col items-center space-y-6">
      <div className="relative w-48 h-48">
        {/* 外层进度环 */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="var(--timer-progress-bg)"
            strokeWidth="4"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="var(--timer-state-color)"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={`${progress * 2.83} 283`}
            strokeLinecap="round"
            className={`${style.animations.enabled ? 'transition-all duration-300' : ''} ${
              style.animations.breathingEffect ? 'animate-pulse' : ''
            }`}
            style={{
              filter: style.displayStyle === 'neon' ? 'drop-shadow(0 0 3px var(--timer-state-color))' : 'none'
            } as React.CSSProperties}
          />
        </svg>

        {/* 中心内容 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            className="text-3xl font-bold mb-2"
            style={{
              color: 'var(--timer-state-color)',
              fontFamily: 'var(--timer-font-family)'
            } as React.CSSProperties}
          >
            {formattedTime}
          </div>
          {style.layout.showProgressPercentage && (
            <div className="text-lg" style={{ color: 'var(--timer-secondary-color)' } as React.CSSProperties}>
              {Math.round(progress)}%
            </div>
          )}
        </div>
      </div>

      {style.layout.showStateText && (
        <div
          className="timer-state-text text-xl font-medium"
          style={{ color: 'var(--timer-secondary-color)' } as React.CSSProperties}
        >
          {stateText}
        </div>
      )}
    </div>
  );
};

// 极简显示组件
const MinimalDisplay: React.FC<{
  formattedTime: string;
  currentState: string;
  progress: number;
  isActive: boolean;
  stateText: string;
  style: TimerStyleConfig;
}> = ({ formattedTime, currentState: _currentState, progress, style }) => {
  return (
    <div className="minimal-timer-display flex flex-col items-center space-y-3">
      <div
        className={`timer-time ${style.animations.enabled ? 'transition-all duration-300' : ''}`}
        style={{
          fontSize: 'var(--timer-font-size)',
          fontWeight: '200',
          fontFamily: 'var(--timer-font-family)',
          color: 'var(--timer-state-color)',
          letterSpacing: '0.1em'
        } as React.CSSProperties}
      >
        {formattedTime}
      </div>

      {style.progressStyle === 'linear' && (
        <div className="w-64 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${style.animations.enabled ? 'transition-all duration-300' : ''}`}
            style={{
              width: `${progress}%`,
              backgroundColor: 'var(--timer-state-color)'
            } as React.CSSProperties}
          />
        </div>
      )}

      {style.layout.showProgressPercentage && (
        <div className="text-sm font-light" style={{ color: 'var(--timer-secondary-color)' } as React.CSSProperties}>
          {Math.round(progress)}%
        </div>
      )}
    </div>
  );
};

// 卡片显示组件
const CardDisplay: React.FC<{
  formattedTime: string;
  currentState: string;
  progress: number;
  isActive: boolean;
  stateText: string;
  style: TimerStyleConfig;
}> = ({ formattedTime, currentState: _currentState, progress, stateText, style }) => {
  return (
    <div
      className="card-timer-display p-8 rounded-2xl shadow-lg border"
      style={{
        backgroundColor: 'var(--timer-background-color)',
        borderColor: 'var(--timer-progress-bg)'
      } as React.CSSProperties}
    >
      <div className="flex flex-col items-center space-y-4">
        {style.layout.showStateText && (
          <div
            className="text-sm font-medium uppercase tracking-wider"
            style={{ color: 'var(--timer-secondary-color)' } as React.CSSProperties}
          >
            {stateText}
          </div>
        )}

        <div
          className="timer-time"
          style={{
            fontSize: 'var(--timer-font-size)',
            fontWeight: 'var(--timer-font-weight)',
            fontFamily: 'var(--timer-font-family)',
            color: 'var(--timer-state-color)'
          } as React.CSSProperties}
        >
          {formattedTime}
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${style.animations.enabled ? 'transition-all duration-300' : ''}`}
            style={{
              width: `${progress}%`,
              backgroundColor: 'var(--timer-state-color)'
            } as React.CSSProperties}
          />
        </div>

        {style.layout.showProgressPercentage && (
          <div className="text-sm" style={{ color: 'var(--timer-secondary-color)' } as React.CSSProperties}>
            {Math.round(progress)}% 完成
          </div>
        )}
      </div>
    </div>
  );
};

// 霓虹灯显示组件
const NeonDisplay: React.FC<{
  formattedTime: string;
  currentState: string;
  progress: number;
  isActive: boolean;
  stateText: string;
  style: TimerStyleConfig;
}> = ({ formattedTime, currentState, progress, stateText, style }) => {
  // 获取霓虹灯专用颜色
  const getNeonColor = () => {
    switch (currentState) {
      case 'focus': return style.colors.primary;
      case 'break': return '#ff006e';
      case 'microBreak': return '#ffbe0b';
      default: return style.colors.text;
    }
  };

  const neonColor = getNeonColor();

  return (
    <div
      className="neon-timer-display p-8 rounded-lg"
      style={{
        backgroundColor: 'var(--timer-background-color)',
        '--neon-color': neonColor
      } as React.CSSProperties}
    >
      <div className="flex flex-col items-center space-y-6">
        <div
          className={`timer-time ${style.animations.enabled ? 'transition-all duration-300' : ''} ${
            style.animations.breathingEffect ? 'animate-pulse' : ''
          }`}
          style={{
            fontSize: 'var(--timer-font-size)',
            fontWeight: '700',
            fontFamily: '"Courier New", monospace',
            color: neonColor,
            textShadow: `
              0 0 5px ${neonColor},
              0 0 10px ${neonColor},
              0 0 15px ${neonColor},
              0 0 20px ${neonColor}
            `,
            filter: 'brightness(1.2) contrast(1.1)'
          } as React.CSSProperties}
        >
          {formattedTime}
        </div>

        {style.layout.showStateText && (
          <div
            className="text-lg font-medium uppercase tracking-widest"
            style={{
              color: neonColor,
              textShadow: `0 0 5px ${neonColor}`
            } as React.CSSProperties}
          >
            {stateText}
          </div>
        )}

        <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${style.animations.enabled ? 'transition-all duration-300' : ''}`}
            style={{
              width: `${progress}%`,
              backgroundColor: neonColor,
              boxShadow: `0 0 10px ${neonColor}`
            } as React.CSSProperties}
          />
        </div>

        {style.layout.showProgressPercentage && (
          <div
            className="text-sm font-mono"
            style={{
              color: neonColor,
              textShadow: `0 0 3px ${neonColor}`
            } as React.CSSProperties}
          >
            {Math.round(progress).toString().padStart(3, '0')}%
          </div>
        )}
      </div>
    </div>
  );
};

export default TimerDisplay;
