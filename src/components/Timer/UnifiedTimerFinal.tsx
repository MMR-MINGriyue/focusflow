/**
 * 最终版统一计时器组件
 * 整合经典模式和智能模式的功能，使用优化后的组件和服务
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useUnifiedTimerStore } from '../../stores/unifiedTimerStore';
import { Button } from '../ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/Tooltip';
import { useConfirmDialog } from '../ui/ConfirmDialog';
import { Play, Pause, RotateCcw, Settings, SkipForward, Zap } from 'lucide-react';
import { wrapFunction } from '../../utils/errorHandler';
import { formatConfirmationMessage } from '../../utils/confirmationUtils';
import TimerDisplayUnified from './TimerDisplayUnified';
import { Settings as SettingsComponent } from '../Settings/Settings';

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

interface UnifiedTimerProps {
  className?: string;
  onStateChange?: (state: 'focus' | 'break' | 'microBreak') => void;
}

/**
 * 最终版统一计时器组件
 * 整合经典模式和智能模式的功能，使用优化后的组件和服务
 */
const UnifiedTimerFinal: React.FC<UnifiedTimerProps> = React.memo(({
  className = '',
  onStateChange
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);

  // 确认对话框Hook
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();

  // 使用 Zustand store 和 timer hook
  const {
    start,
    pause,
    reset,
    skipToNext,
    timeLeft,
    isActive,
    settings,
    switchMode
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

  // 处理模式选择
  const handleModeSelect = useCallback(() => {
    setShowModeSelector(true);
  }, []);

  // 切换到经典模式
  const switchToClassicMode = useCallback(() => {
    switchMode('classic', {
      preserveCurrentTime: false,
      pauseBeforeSwitch: true,
      showConfirmDialog: false,
      resetOnSwitch: true
    });
    setShowModeSelector(false);
  }, [switchMode]);

  // 切换到智能模式
  const switchToSmartMode = useCallback(() => {
    switchMode('smart', {
      preserveCurrentTime: false,
      pauseBeforeSwitch: true,
      showConfirmDialog: false,
      resetOnSwitch: true
    });
    setShowModeSelector(false);
  }, [switchMode]);

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
  const progressPercentage = useMemo(() => {
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
  const modeText = useMemo(() => {
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
  const buttonText = useMemo(() => {
    return isActive ? '暂停' : '开始';
  }, [isActive]);

  // 包装事件处理函数以进行错误处理
  const wrappedHandleStartPause = useMemo(
    () => wrapFunction(handleStartPause, { component: 'UnifiedTimer', action: 'startPause' }),
    [handleStartPause]
  );

  const wrappedHandleReset = useMemo(
    () => wrapFunction(handleReset, { component: 'UnifiedTimer', action: 'reset' }),
    [handleReset]
  );

  const wrappedHandleSkip = useMemo(
    () => wrapFunction(handleSkip, { component: 'UnifiedTimer', action: 'skip' }),
    [handleSkip]
  );

  return (
    <TooltipProvider>
      <Card className={className}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>专注计时器</CardTitle>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">{modeText}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleModeSelect}
                className="h-8 w-8 p-0"
              >
                <Settings className="h-4 w-4" />
              </Button>
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
                  <SkipForward size={24} />
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
                  <Settings size={24} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>设置</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* 模式信息 */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center">
              <Zap className="h-5 w-5 text-yellow-500 mr-2" />
              <span className="font-medium">{modeText}</span>
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {settings.mode === 'classic'
                ? '经典番茄工作法：25分钟专注，5分钟休息'
                : '智能模式：根据您的专注状态自动调整时长'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 确认对话框 */}
      <ConfirmDialog />

      {/* 设置对话框 */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>设置</DialogTitle>
          </DialogHeader>
          <SettingsComponent 
            settings={settings} 
            onSettingsChange={(newSettings) => {
              const { updateSettings } = useUnifiedTimerStore.getState();
              updateSettings(newSettings);
            }} 
          />
        </DialogContent>
      </Dialog>

      {/* 模式选择对话框 */}
      <Dialog open={showModeSelector} onOpenChange={setShowModeSelector}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>选择模式</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={settings.mode === 'classic' ? 'default' : 'outline'}
              onClick={switchToClassicMode}
              className="h-24 flex flex-col"
            >
              <span className="font-medium">经典模式</span>
              <span className="text-xs mt-1">25分钟专注</span>
            </Button>
            <Button
              variant={settings.mode === 'smart' ? 'default' : 'outline'}
              onClick={switchToSmartMode}
              className="h-24 flex flex-col"
            >
              <span className="font-medium">智能模式</span>
              <span className="text-xs mt-1">自适应时长</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
});

UnifiedTimerFinal.displayName = 'UnifiedTimerFinal';

export default UnifiedTimerFinal;
