import React, { useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Settings as SettingsIcon } from 'lucide-react';

// 核心 hooks
import { useUnifiedTimerStore } from '../../stores/unifiedTimerStore';
import { useTimer } from '../../hooks/useTimer';
import { useConfirmDialog } from '../ui/ConfirmDialog';

// 组件导入
import { Button } from '../ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/Tooltip';
import Settings from '../Settings/Settings';
import EfficiencyRating from './EfficiencyRating';
import TimerDisplay from './TimerDisplay';

// 工具函数
import { wrapFunction } from '../../utils/errorHandler';
import { formatConfirmationMessage } from '../../utils/confirmationUtils';


interface TimerProps {
  onStateChange?: (state: 'focus' | 'break' | 'microBreak') => void;
}

const Timer: React.FC<TimerProps> = React.memo(({ onStateChange }) => {
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
    submitEfficiencyRating,
    showSettings,
    setShowSettings
  } = useUnifiedTimerStore();

  const {
    currentState,
    isActive,
    formattedTime,
    stateText,
    progress,
    timeLeft
  } = useTimer();

  // 确认对话框Hook
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();

  // 状态变化回调
  useEffect(() => {
    onStateChange?.(currentState as 'focus' | 'break' | 'microBreak');
  }, [currentState, onStateChange]);

  // 计时器控制函数（包装错误处理并记忆化）
  const toggleTimer = useCallback(wrapFunction(() => {
    if (isActive) {
      pause();
    } else {
      start();
    }
  }, { component: 'Timer', action: 'toggleTimer' }), [isActive, start, pause]);

  // 设置变化处理（包装错误处理并记忆化）
  const handleSettingsChange = useCallback(wrapFunction((newSettings: Partial<typeof settings>) => {
    updateSettings(newSettings);
  }, { component: 'Timer', action: 'updateSettings' }), [updateSettings]);

  // 重置计时器（包装错误处理并记忆化）
  const handleReset = useCallback(wrapFunction(() => {
    // 如果计时器正在运行或有进度，显示确认对话框
    const currentSettings = settings.mode === 'classic' ? settings.classic : settings.smart;
    if (isActive || timeLeft < currentSettings.focusDuration * 60) {
      const message = formatConfirmationMessage(currentSettings.focusDuration * 60, timeLeft);
      showConfirmDialog(
        message,
        () => reset(),
        {
          type: 'warning',
          confirmText: '重置',
          confirmDanger: true
        }
      );
    } else {
      reset();
    }
  }, { component: 'Timer', action: 'resetTimer' }), [isActive, timeLeft, settings, reset, showConfirmDialog]);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      {/* 标题 */}
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        {stateText}
      </h2>

      {/* 计时器显示 */}
      <TimerDisplay
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
                onClick={() => setShowSettings(true)}
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
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
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
          onSubmit={(score: number) => {
            submitEfficiencyRating(score);
          }}
          onClose={hideEfficiencyRating}
        />
      )}

      {/* 确认对话框 */}
      <ConfirmDialog />
    </div>
  );
});

export default Timer;