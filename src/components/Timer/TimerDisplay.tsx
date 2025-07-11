import React, { useEffect, useState, useMemo } from 'react';
import { TimerStyleConfig } from '../../types/timerStyle';
import { timerStyleService } from '../../services/timerStyle';
import BackgroundEffects from './BackgroundEffects';
import { usePerformanceMonitor, getAdaptivePerformanceConfig, throttle } from '../../utils/performance';

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

  // 缓存默认配置（避免每次重新创建）
  const defaultConfigs = useMemo(() => ({
    particles: {
      effect: 'none' as const,
      count: 0,
      size: 2,
      speed: 1,
      color: '#ffffff',
      opacity: 0.5
    },
    background: {
      pattern: 'none' as const,
      opacity: 0.1,
      color: '#000000',
      size: 'medium' as const,
      animation: false
    }
  }), []);

  // 优化的响应式样式计算（减少计算复杂度）
  const responsiveStyle = useMemo(() => {
    const baseStyle = timerStyleService.getStyleForState(currentState);

    // 快速路径：如果不需要响应式，直接返回
    if (!baseStyle.responsive?.enabled) {
      return baseStyle;
    }

    const breakpointConfig = baseStyle.responsive.breakpoints?.[screenSize];
    if (!breakpointConfig) {
      return baseStyle;
    }

    // 只合并必要的属性，避免深度合并
    const safeParticles = baseStyle.particles || defaultConfigs.particles;
    const safeBackground = baseStyle.background || defaultConfigs.background;

    // 使用浅合并，提高性能
    return {
      ...baseStyle,
      ...breakpointConfig,
      layout: breakpointConfig.layout ? { ...baseStyle.layout, ...breakpointConfig.layout } : baseStyle.layout,
      animations: {
        ...baseStyle.animations,
        ...(breakpointConfig.animations || {}),
        enabled: baseStyle.animations.enabled && performanceConfig.enableAnimations
      },
      particles: {
        ...safeParticles,
        count: Math.min(safeParticles.count || 0, performanceConfig.particleCount)
      },
      background: {
        ...safeBackground,
        pattern: performanceConfig.enableBackgroundEffects ? (safeBackground.pattern || 'none') : 'none'
      }
    };
  }, [currentState, screenSize, performanceConfig, defaultConfigs]);

  // 优化的样式更新逻辑（使用浅比较，避免JSON.stringify）
  useEffect(() => {
    // 使用引用比较，更高效
    if (currentStyle !== responsiveStyle) {
      setCurrentStyle(responsiveStyle);
      recordUpdate(); // 记录组件更新
    }
  }, [responsiveStyle, currentStyle, recordUpdate]);

  // 优化的resize监听器（使用节流和防抖）
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;

    const handleResize = throttle(() => {
      // 清除之前的超时
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }

      // 延迟执行，避免频繁更新
      resizeTimeout = setTimeout(() => {
        const newScreenSize = getScreenSize();
        if (newScreenSize !== screenSize) {
          setScreenSize(newScreenSize);
        }
      }, 50);
    }, 200); // 200ms节流

    window.addEventListener('resize', handleResize);

    // 初始化屏幕尺寸（只执行一次）
    if (screenSize === 'desktop') {
      setScreenSize(getScreenSize());
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
    };
  }, []); // 移除screenSize依赖，避免循环

  // 样式服务监听器（独立的effect，使用防抖）
  useEffect(() => {
    let styleChangeTimeout: NodeJS.Timeout;

    const handleStyleChange = () => {
      // 清除之前的超时
      if (styleChangeTimeout) {
        clearTimeout(styleChangeTimeout);
      }

      // 延迟执行，避免频繁更新
      styleChangeTimeout = setTimeout(() => {
        // 强制重新计算样式
        const newStyle = timerStyleService.getStyleForState(currentState);
        setCurrentStyle(newStyle);
      }, 100);
    };

    timerStyleService.addListener(handleStyleChange);
    return () => {
      timerStyleService.removeListener(handleStyleChange);
      if (styleChangeTimeout) {
        clearTimeout(styleChangeTimeout);
      }
    };
  }, [currentState]);

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

  // 缓存状态颜色计算（避免每次渲染重新计算）
  const stateColor = useMemo(() => {
    switch (currentState) {
      case 'focus': return currentStyle.colors.primary;
      case 'break': return '#ef4444';
      case 'microBreak': return '#f59e0b';
      default: return currentStyle.colors.text;
    }
  }, [currentState, currentStyle.colors]);

  // 缓存动画类名计算（避免每次渲染重新计算）
  const animationClasses = useMemo(() => {
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
  }, [currentStyle.animations, currentStyle.displayStyle, isActive]);

  return (
    <div
      className={`timer-display-container relative ${className} ${animationClasses}`}
      data-style={currentStyle.displayStyle}
      style={{
        '--timer-animation-duration': `${currentStyle.animations.transitionDuration}ms`,
        '--timer-animation-easing': currentStyle.animations.easing,
        '--timer-state-color': stateColor,
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
