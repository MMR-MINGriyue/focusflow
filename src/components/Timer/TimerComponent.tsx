import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useUnifiedTimerStore } from '../../stores/unifiedTimerStore';
import { Button } from '../ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/Tooltip';
import { useConfirmDialog } from '../ui/ConfirmDialog';
import { Play, Pause, RotateCcw, Settings as SettingsIcon } from 'lucide-react';
import Settings from '../Settings/Settings';
import EfficiencyRating from './EfficiencyRating';
import TimerDisplayOptimized from './TimerDisplayOptimized';
import { wrapFunction } from '../../utils/errorHandler';
import { formatConfirmationMessage } from '../../utils/confirmationUtils';
import { formatTime } from '../../utils/formatTime';
import { UnifiedTimerSettings } from '../../types/unifiedTimer';

interface TimerProps {
  onStateChange?: (state: 'focus' | 'break' | 'microBreak') => void;
}

/**
 * 优化版计时器组件
 * 使用React.memo、useMemo和useCallback优化性能，减少不必要的重渲染
 */
const TimerComponent: React.FC<TimerProps> = React.memo(({ onStateChange }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showEfficiencyRating, setShowEfficiencyRating] = useState(false);
  const [lastSessionDuration, setLastSessionDuration] = useState(0);
  const [lastSessionType, setLastSessionType] = useState<'focus' | 'break' | 'microBreak'>('focus');

  // 确认对话框Hook
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();

  // 使用 Zustand store
  const {
    start,
    pause,
    reset,
    skipToNext,
    timeLeft,
    isActive,
    currentState,
    settings,
    updateSettings
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
    const currentSettings = settings.mode === 'classic' ? settings.classic : settings.smart;
    const totalSeconds = currentSettings.focusDuration * 60;
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
  }, [reset, timeLeft, showConfirmDialog]);

  // 处理跳过
  const handleSkip = useCallback(() => {
    skipToNext();
  }, [skipToNext]);

  // 处理设置
  const handleSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  // 处理效率评分提交
  const handleEfficiencySubmit = useCallback((score: number) => {
    // 这里可以添加保存评分的逻辑
    console.log(`Efficiency score: ${score}`);
    setShowEfficiencyRating(false);
  }, []);

  // 更新设置
  const handleUpdateSettings = useCallback((newSettings: Partial<UnifiedTimerSettings>) => {
    // 使用store中的updateSettings方法
    updateSettings(newSettings);
  }, [updateSettings]);

  // 监听状态变化
  useEffect(() => {
    if (onStateChange && currentState !== 'forcedBreak') {
      onStateChange(currentState);
    }
  }, [currentState, onStateChange]);

  // 监听会话结束
  useEffect(() => {
    if (!isActive && timeLeft === 0) {
      // 会话结束，显示效率评分
      const currentSettings = settings.mode === 'classic' ? settings.classic : settings.smart;
      setLastSessionDuration(currentSettings.focusDuration * 60 - Math.floor(timeLeft / 1000));
      if (currentState !== 'forcedBreak') {
        setLastSessionType(currentState);
      }
      setShowEfficiencyRating(true);
    }
  }, [isActive, timeLeft, currentState, settings]);

  // 计算进度百分比
  const progressPercentage = useMemo(() => {
    let totalSeconds = 0;
    const currentSettings = settings.mode === 'classic' ? settings.classic : settings.smart;

    switch (currentState) {
      case 'focus':
        totalSeconds = currentSettings.focusDuration * 60;
        break;
      case 'break':
        totalSeconds = currentSettings.breakDuration * 60;
        break;
      case 'microBreak':
        totalSeconds = settings.mode === 'classic' 
          ? (currentSettings as any).microBreakDuration * 60
          : 5 * 60; // 5分钟微休息
        break;
      default:
        totalSeconds = currentSettings.focusDuration * 60;
    }

    const timeLeftSeconds = Math.floor(timeLeft / 1000);
    return ((totalSeconds - timeLeftSeconds) / totalSeconds) * 100;
  }, [timeLeft, currentState, settings]);

  // 获取当前状态文本
  const stateText = useMemo(() => {
    switch (currentState) {
      case 'focus':
        return '专注中';
      case 'break':
        return '休息中';
      case 'microBreak':
        return '微休息';
      default:
        return '准备';
    }
  }, [currentState]);

  // 获取按钮文本
  const buttonText = useMemo(() => {
    return isActive ? '暂停' : '开始';
  }, [isActive]);

  // 包装事件处理函数以进行错误处理
  const wrappedHandleStartPause = useMemo(
    () => wrapFunction(handleStartPause, { component: 'Timer', action: 'startPause' }),
    [handleStartPause]
  );

  const wrappedHandleReset = useMemo(
    () => wrapFunction(handleReset, { component: 'Timer', action: 'reset' }),
    [handleReset]
  );

  const wrappedHandleSkip = useMemo(
    () => wrapFunction(handleSkip, { component: 'Timer', action: 'skip' }),
    [handleSkip]
  );

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-lg">
        {/* 状态文本 */}
        <div className="text-xl font-semibold mb-2 text-gray-700">
          {stateText}
        </div>

        {/* 计时器显示 */}
        <TimerDisplayOptimized 
          time={timeLeft}
          formattedTime={formatTime(timeLeft)} 
          progress={progressPercentage}
          currentState={currentState}
          isActive={isActive}
          stateText={stateText}
        />

        {/* 控制按钮 */}
        <div className="flex space-x-4 mt-6">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={wrappedHandleStartPause}
                variant={isActive ? "secondary" : "default"}
                size="lg"
                className="w-16 h-16 rounded-full"
              >
                {isActive ? <Pause size={24} /> : <Play size={24} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{buttonText}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={wrappedHandleSkip}
                variant="outline"
                size="lg"
                className="w-16 h-16 rounded-full"
              >
                <RotateCcw size={24} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>跳过</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={wrappedHandleReset}
                variant="outline"
                size="lg"
                className="w-16 h-16 rounded-full"
              >
                <RotateCcw size={24} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>重置</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleSettings}
                variant="outline"
                size="lg"
                className="w-16 h-16 rounded-full"
              >
                <SettingsIcon size={24} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>设置</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* 确认对话框 */}
        <ConfirmDialog />

        {/* 设置对话框 */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>设置</DialogTitle>
            </DialogHeader>
            <Settings 
              settings={settings} 
              onSettingsChange={handleUpdateSettings} 
            />
          </DialogContent>
        </Dialog>

        {/* 效率评分对话框 */}
        {showEfficiencyRating && (
          <EfficiencyRating
            isOpen={showEfficiencyRating}
            duration={lastSessionDuration}
            type={lastSessionType}
            onSubmit={handleEfficiencySubmit}
            onClose={() => setShowEfficiencyRating(false)}
          />
        )}
      </div>
    </TooltipProvider>
  );
});

TimerComponent.displayName = 'TimerComponent';

export default TimerComponent;
