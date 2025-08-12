import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/Button';
import { Play, Pause, RotateCcw, SkipForward, Settings } from 'lucide-react';
import { useUnifiedTimerStore } from '../../stores/unifiedTimerStore';
import { wrapFunction } from '../../utils/errorHandler';
import { formatConfirmationMessage } from '../../utils/confirmationUtils';
import TimerDisplayUnified from './TimerDisplayUnified';

// 由于Card组件存在问题，这里使用HTML元素模拟
const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => (
  <div className={`p-6 pb-2 ${className}`}>
    {children}
  </div>
);

const CardTitle: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h3>
);

const CardContent: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

interface EnhancedTimerProps {
  className?: string;
  onStateChange?: (state: 'focus' | 'break' | 'microBreak') => void;
}

/**
 * 增强版计时器组件
 * 整合了更多功能和更好的用户体验
 */
const EnhancedTimer: React.FC<EnhancedTimerProps> = React.memo(({
  className = '',
  onStateChange
}) => {
  const [showSettings, setShowSettings] = useState(false);

  // 确认对话框Hook
  const { showConfirmDialog, ConfirmDialog } = useUnifiedTimerStore.getState();

  // 使用 Zustand store 和 timer hook
  const {
    start,
    pause,
    reset,
    skipToNext,
    timeLeft,
    isActive,
    settings
  } = useUnifiedTimerStore();

  // 处理开始/暂停
  const handleStartPause = useCallback(() => {
    if (isActive) {
      pause();
    } else {
      start();
    }
  }, [isActive, start, pause]);

  // 处理重置
  const handleReset = useCallback(() => {
    const totalSeconds = settings.classic.focusDuration * 60;
    const timeLeftSeconds = Math.floor(timeLeft / 1000);

    showConfirmDialog(
      formatConfirmationMessage(totalSeconds, timeLeftSeconds),
      () => {
        reset();
      },
      {
        title: '重置计时器',
        confirmText: '重置',
        cancelText: '取消'
      }
    );
  }, [reset, timeLeft, settings.classic.focusDuration, showConfirmDialog]);

  // 处理跳过
  const handleSkip = useCallback(() => {
    skipToNext();
  }, [skipToNext]);

  // 处理设置
  const handleSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  // 监听状态变化
  useEffect(() => {
    if (onStateChange) {
      // 这里需要根据当前状态确定sessionType
      const currentState = useUnifiedTimerStore.getState().currentState;
      // 过滤掉'onStateChange'不支持的'forcedBreak'状态
      if (currentState !== 'forcedBreak') {
        onStateChange(currentState);
      }
    }
  }, [onStateChange]);

  // 计算进度百分比
  const progressPercentage = React.useMemo(() => {
    let totalSeconds = 0;

    const currentState = useUnifiedTimerStore.getState().currentState;
    switch (currentState) {
      case 'focus':
        totalSeconds = settings.classic.focusDuration * 60;
        break;
      case 'break':
        totalSeconds = settings.classic.breakDuration * 60;
        break;
      case 'microBreak':
        totalSeconds = settings.classic.microBreakDuration * 60;
        break;
      default:
        totalSeconds = settings.classic.focusDuration * 60;
    }

    const timeLeftSeconds = Math.floor(timeLeft / 1000);
    return ((totalSeconds - timeLeftSeconds) / totalSeconds) * 100;
  }, [timeLeft, settings]);

  // 获取模式文本
  const modeText = React.useMemo(() => {
    switch (settings.mode) {
      case 'classic':
        return '经典模式';
      case 'smart':
        return '智能模式';
      default:
        return '经典模式';
    }
  }, [settings.mode]);

  // 获取按钮文本
  const buttonText = React.useMemo(() => {
    return isActive ? '暂停' : '开始';
  }, [isActive]);

  // 包装事件处理函数以进行错误处理
  const wrappedHandleStartPause = React.useMemo(
    () => wrapFunction(handleStartPause, { component: 'EnhancedTimer', action: 'startPause' }),
    [handleStartPause]
  );

  const wrappedHandleReset = React.useMemo(
    () => wrapFunction(handleReset, { component: 'EnhancedTimer', action: 'reset' }),
    [handleReset]
  );

  const wrappedHandleSkip = React.useMemo(
    () => wrapFunction(handleSkip, { component: 'EnhancedTimer', action: 'skip' }),
    [handleSkip]
  );

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>增强版专注计时器</CardTitle>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">{modeText}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* 计时器显示 */}
        <TimerDisplayUnified
          timeLeft={timeLeft}
          progressPercentage={progressPercentage}
          sessionType={(useUnifiedTimerStore.getState().currentState === 'forcedBreak' ? 'break' : useUnifiedTimerStore.getState().currentState) as 'focus' | 'break' | 'microBreak'}
        />

        {/* 控制按钮 */}
        <div className="flex justify-center space-x-4 mt-6">
          <Button
            onClick={wrappedHandleStartPause}
            variant={isActive ? "secondary" : "default"}
            size="lg"
            className="w-16 h-16 rounded-full"
          >
            {isActive ? <Pause size={24} /> : <Play size={24} />}
          </Button>

          <Button
            onClick={wrappedHandleSkip}
            variant="outline"
            size="lg"
            className="w-16 h-16 rounded-full"
          >
            <SkipForward size={24} />
          </Button>

          <Button
            onClick={wrappedHandleReset}
            variant="outline"
            size="lg"
            className="w-16 h-16 rounded-full"
          >
            <RotateCcw size={24} />
          </Button>

          <Button
            onClick={handleSettings}
            variant="outline"
            size="lg"
            className="w-16 h-16 rounded-full"
          >
            <Settings size={24} />
          </Button>
        </div>
      </CardContent>

      {/* 确认对话框 */}
      <ConfirmDialog />
    </Card>
  );
});

EnhancedTimer.displayName = 'EnhancedTimer';

export default EnhancedTimer;
