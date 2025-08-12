import React, { useState, useCallback, useEffect } from 'react';
import { useUnifiedTimerStore } from '../../stores/unifiedTimerStore';
import { useTimer } from '../../hooks/useTimer';
import { Button } from '../ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/Tooltip';
import { useConfirmDialog } from '../ui/ConfirmDialog';
import { Play, Pause, RotateCcw, Settings as SettingsIcon } from 'lucide-react';
import Settings from '../Settings/Settings';
import EfficiencyRating from './EfficiencyRating';
import TimerDisplayOptimized from './TimerDisplayOptimized';
import { wrapFunction } from '../../utils/errorHandler';

interface TimerProps {
  onStateChange?: (state: 'focus' | 'break' | 'microBreak') => void;
}

/**
 * 优化版计时器组件
 * 使用React.memo、useMemo和useCallback优化性能，减少不必要的重渲染
 */
const TimerOptimized: React.FC<TimerProps> = React.memo(({ onStateChange }) => {
  const [showSettings, setShowSettings] = useState(false);

  // 确认对话框Hook
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();

  // 使用 Zustand store 和 timer hook
  const {
    start,
    pause,
    reset,
    updateSettings,
    settings,
    showRatingDialog,
    pendingRatingSession,
    hideEfficiencyRating,
    submitEfficiencyRating
  } = useUnifiedTimerStore();

  const {
    currentState,
    isActive,
    formattedTime,
    stateText,
    progress,
    timeLeft
  } = useTimer();

  // 状态变化回调
  useEffect(() => {
    onStateChange?.(currentState as 'focus' | 'break' | 'microBreak');
  }, [currentState, onStateChange]);

  // 使用useCallback缓存计时器控制函数，避免每次渲染都创建新函数
  const toggleTimer = useCallback(wrapFunction(() => {
    if (isActive) {
      pause();
    } else {
      start();
    }
  }, { component: 'TimerOptimized', action: 'toggleTimer' }), [isActive, pause, start]);

  // 使用useCallback缓存设置变化处理函数
  const handleSettingsChange = useCallback(wrapFunction((newSettings: Partial<typeof settings>) => {
    updateSettings(newSettings);
  }, { component: 'TimerOptimized', action: 'updateSettings' }), [updateSettings]);

  // 使用useCallback缓存重置计时器函数
  const handleReset = useCallback(wrapFunction(() => {
    // 如果计时器正在运行或有进度，显示确认对话框
    const currentSettings = settings.mode === 'classic' ? settings.classic : settings.smart;
    if (isActive || timeLeft < currentSettings.focusDuration * 60) {
      const totalSeconds = currentSettings.focusDuration * 60;
      const progressLost = totalSeconds - timeLeft;
      const progressMinutes = Math.floor(progressLost / 60);
      const progressText = progressMinutes > 0 ? `${progressMinutes}分钟` : '少量';

      showConfirmDialog(
        `确定要重置计时器吗？\n\n当前进度：${progressText}的专注时间将会丢失。\n此操作无法撤销。`,
        () => {
          reset();
        },
        {
          type: 'warning',
          confirmText: '重置',
          confirmDanger: true
        }
      );
    } else {
      reset();
    }
  }, { component: 'TimerOptimized', action: 'resetTimer' }), [isActive, settings, timeLeft, showConfirmDialog, reset]);

  // 使用useMemo缓存设置对话框的打开状态处理函数
  const handleOpenSettings = useCallback(() => setShowSettings(true), []);
  const handleCloseSettings = useCallback(() => setShowSettings(false), []);

  // 使用useMemo缓存效率评分提交函数
  const handleSubmitEfficiencyRating = useCallback((score: number) => {
    submitEfficiencyRating(score);
  }, [submitEfficiencyRating]);

  // 使用useMemo缓存效率评分关闭函数
  const handleHideEfficiencyRating = useCallback(() => {
    hideEfficiencyRating();
  }, [hideEfficiencyRating]);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      {/* 标题 */}
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        {stateText}
      </h2>

      {/* 计时器显示 - 使用优化版组件 */}
      <TimerDisplayOptimized
        time={timeLeft}
        formattedTime={formattedTime}
        currentState={currentState as 'focus' | 'break' | 'microBreak'}
        progress={progress}
      />

      {/* 控制按钮 */}
      <div className="flex items-center justify-center space-x-4 mt-8">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={toggleTimer}
                variant="primary"
                size="lg"
                className="flex items-center space-x-2"
              >
                {isActive ? (
                  <>
                    <Pause className="w-5 h-5" />
                    <span>暂停</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    <span>开始</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isActive ? '暂停计时器' : '开始计时器'}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleReset}
                variant="secondary"
                size="lg"
                className="flex items-center space-x-2"
              >
                <RotateCcw className="w-5 h-5" />
                <span>重置</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>重置计时器</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleOpenSettings}
                variant="ghost"
                size="lg"
                className="flex items-center space-x-2"
              >
                <SettingsIcon className="w-5 h-5" />
                <span>设置</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>计时器设置</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* 设置对话框 */}
      <Dialog open={showSettings} onOpenChange={handleCloseSettings}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>计时器设置</DialogTitle>
          </DialogHeader>
          <Settings
            settings={settings}
            onSettingsChange={handleSettingsChange}
          />
        </DialogContent>
      </Dialog>

      {/* 效率评分对话框 */}
      {showRatingDialog && pendingRatingSession && (
        <EfficiencyRating
          isOpen={showRatingDialog}
          duration={pendingRatingSession.duration}
          type={pendingRatingSession.type as 'focus' | 'break' | 'microBreak'}
          onSubmit={handleSubmitEfficiencyRating}
          onClose={handleHideEfficiencyRating}
        />
      )}

      {/* 确认对话框 */}
      <ConfirmDialog />
    </div>
  );
});

// 添加显示名称，便于调试
TimerOptimized.displayName = 'TimerOptimized';

export default TimerOptimized;
