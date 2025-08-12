/**
 * 优化版统一计时器组件
 * 整合经典模式和智能模式的功能，使用优化后的组件和服务
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useUnifiedTimerStoreOptimized } from '../../stores/unifiedTimerStoreOptimized';
import { useTimerOptimized } from '../../hooks/useTimerOptimized';
import { TimerMode } from '../../types/unifiedTimer';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/Tooltip';
import { useConfirmDialog } from '../ui/ConfirmDialog';

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
  <div className={`p-6 pt-2 ${className}`}>
    {children}
  </div>
);

import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Settings as SettingsIcon,
  Brain,
  Timer as TimerIcon
} from 'lucide-react';
import ModeSelector from './ModeSelector';
import TimerDisplayOptimized from './TimerDisplayOptimized';
import EfficiencyRating from './EfficiencyRating';
import UnifiedSettings from '../Settings/UnifiedSettings';
import { wrapFunction } from '../../utils/errorHandler';

interface UnifiedTimerOptimizedProps {
  onStateChange?: (state: string) => void;
  className?: string;
}

const UnifiedTimerOptimized: React.FC<UnifiedTimerOptimizedProps> = ({
  onStateChange,
  className = ''
}) => {
  const [showSettings, setShowSettings] = useState(false);

  // 确认对话框Hook
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();

  // 使用优化后的计时器Hook
  const timerState = useTimerOptimized();

  // 使用优化后的统一计时器Store选择器
  const {
    currentMode,
    settings,
    todayStats,
    showRatingDialog,
    pendingRatingSession,
    continuousFocusTime,
    microBreakCount,
    recentEfficiencyScores,

    // 控制方法
    start,
    pause,
    reset,
    skipToNext,
    switchMode,
    updateSettings,
    submitEfficiencyRating,
    hideEfficiencyRating,
  } = useUnifiedTimerStoreOptimized();

  // 状态变化回调
  useEffect(() => {
    onStateChange?.(timerState.currentState);
  }, [timerState.currentState, onStateChange]);

  // 使用useMemo缓存计算值，避免重复计算
  const modeInfo = useMemo(() => {
    if (currentMode === TimerMode.SMART) {
      return {
        icon: <Brain className="h-5 w-5" />,
        color: '#3b82f6',
        features: [
          `连续专注: ${Math.round(continuousFocusTime)}分钟`,
          `微休息: ${microBreakCount}次`,
          `效率评分: ${recentEfficiencyScores.length > 0
            ? (recentEfficiencyScores.reduce((a, b) => a + b, 0) / recentEfficiencyScores.length).toFixed(1)
            : 'N/A'}`
        ]
      };
    } else {
      return {
        icon: <TimerIcon className="h-5 w-5" />,
        color: '#ef4444',
        features: [
          `今日专注: ${Math.round(todayStats.focusTime)}分钟`,
          `休息时间: ${Math.round(todayStats.breakTime)}分钟`,
          `微休息: ${todayStats.microBreaks}次`
        ]
      };
    }
  }, [currentMode, continuousFocusTime, microBreakCount, recentEfficiencyScores, todayStats]);

  // 使用useCallback缓存事件处理函数，避免重复创建
  const toggleTimer = useCallback(wrapFunction(() => {
    if (timerState.isActive) {
      pause();
    } else {
      start();
    }
  }, { component: 'UnifiedTimerOptimized', action: 'toggleTimer' }), [timerState.isActive, pause, start]);

  const handleReset = useCallback(wrapFunction(() => {
    // 如果计时器正在运行或有进度，显示确认对话框
    const currentSettings = settings.mode === 'classic' ? settings.classic : settings.smart;
    const totalTime = currentSettings.focusDuration * 60;
    if (timerState.isActive || timerState.timeLeft < totalTime) {
      const progressLost = totalTime - timerState.timeLeft;
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
      // 没有进度时直接重置
      reset();
    }
  }, { component: 'UnifiedTimerOptimized', action: 'resetTimer' }), [timerState.isActive, timerState.timeLeft, settings, reset, showConfirmDialog]);

  const handleSkip = useCallback(wrapFunction(() => {
    skipToNext();
  }, { component: 'UnifiedTimerOptimized', action: 'skipToNext' }), [skipToNext]);

  const handleModeChange = useCallback(wrapFunction((mode: TimerMode, options?: any) => {
    switchMode(mode, options);
  }, { component: 'UnifiedTimerOptimized', action: 'switchMode' }), [switchMode]);

  const handleSettingsChange = useCallback(wrapFunction((newSettings: any) => {
    updateSettings(newSettings);
  }, { component: 'UnifiedTimerOptimized', action: 'updateSettings' }), [updateSettings]);

  const handleOpenSettings = useCallback(() => setShowSettings(true), []);
  const handleCloseSettings = useCallback(() => setShowSettings(false), []);

  // 使用useCallback缓存效率评分提交函数
  const handleSubmitEfficiencyRating = useCallback((score: number) => {
    submitEfficiencyRating(score);
  }, [submitEfficiencyRating]);

  // 使用useCallback缓存效率评分关闭函数
  const handleHideEfficiencyRating = useCallback(() => {
    hideEfficiencyRating();
  }, [hideEfficiencyRating]);

  return (
    <TooltipProvider>
      <div className={`space-y-6 ${className}`}>
        {/* 主容器使用Card组件 */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">{timerState.stateText}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 模式选择器 */}
            {settings.showModeSelector && (
              <div className="flex justify-center">
                <ModeSelector
                  currentMode={currentMode}
                  isActive={timerState.isActive}
                  onModeChange={handleModeChange}
                  variant="tabs"
                  showDescription={false}
                />
              </div>
            )}

            {/* 主计时器显示区域 */}
            <div className="flex flex-col items-center justify-center space-y-6">
              <TimerDisplayOptimized
                time={timerState.timeLeft}
                formattedTime={timerState.formattedTime}
                currentState={timerState.currentState as 'focus' | 'break' | 'microBreak'}
                progress={timerState.progress}
                isActive={timerState.isActive}
                stateText={timerState.stateText}
                className="timer-main-display"
              />

              {/* 备用进度条 */}
              <div className="w-full max-w-md">
                <Progress
                  value={timerState.progress}
                  className="h-2 opacity-50"
                  indicatorClassName={
                    timerState.currentState === 'focus' ? 'bg-green-500' :
                    timerState.currentState === 'break' ? 'bg-red-500' :
                    timerState.currentState === 'microBreak' ? 'bg-yellow-500' : 'bg-red-600'
                  }
                />
              </div>

              {/* 控制按钮 */}
              <div className="flex items-center space-x-3" data-tour="timer-controls">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={toggleTimer}
                      size="lg"
                      variant={timerState.isActive ? "secondary" : "default"}
                      className="flex items-center space-x-2"
                    >
                      {timerState.isActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      <span>{timerState.isActive ? "暂停" : "开始"}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{timerState.isActive ? "暂停计时器" : "开始专注会话"}</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleReset}
                      size="lg"
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      <RotateCcw className="h-5 w-5" />
                      <span>重置</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>重置计时器到初始状态</p>
                  </TooltipContent>
                </Tooltip>

                {/* 智能模式特有的跳过按钮 */}
                {currentMode === TimerMode.SMART && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleSkip}
                        size="lg"
                        variant="outline"
                        className="flex items-center space-x-2"
                      >
                        <SkipForward className="h-5 w-5" />
                        <span>跳过</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>跳过当前阶段</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                <Dialog open={showSettings} onOpenChange={handleCloseSettings}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleOpenSettings}
                        size="lg"
                        variant="ghost"
                        className="flex items-center space-x-2"
                      >
                        <SettingsIcon className="h-5 w-5" />
                        <span>设置</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>打开计时器设置</p>
                    </TooltipContent>
                  </Tooltip>
                </Dialog>
              </div>
            </div>

            {/* 模式特定信息显示 */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                {modeInfo.icon}
                <span className="font-medium text-card-foreground">
                  {currentMode === TimerMode.SMART ? '智能模式状态' : '经典模式统计'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                {modeInfo.features.map((feature, index) => (
                  <div key={index} className="text-muted-foreground">
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            {/* 设置对话框 */}
            <Dialog open={showSettings} onOpenChange={handleCloseSettings}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>计时器设置</DialogTitle>
                </DialogHeader>
                <UnifiedSettings
                  settings={settings}
                  onSettingsChange={handleSettingsChange}
                />
              </DialogContent>
            </Dialog>

            {/* 效率评分对话框 */}
            {showRatingDialog && pendingRatingSession && (
              <EfficiencyRating
                isOpen={showRatingDialog}
                onClose={handleHideEfficiencyRating}
                onSubmit={handleSubmitEfficiencyRating}
                duration={pendingRatingSession.duration}
                type={pendingRatingSession.type}
              />
            )}

            {/* 确认对话框 */}
            <ConfirmDialog />
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default UnifiedTimerOptimized;
