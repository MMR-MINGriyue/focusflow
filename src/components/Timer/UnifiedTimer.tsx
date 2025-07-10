/**
 * 统一计时器组件
 * 整合经典模式和智能模式的功能
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useUnifiedTimerStore } from '../../stores/unifiedTimerStore';
import { TimerMode } from '../../types/unifiedTimer';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/Tooltip';
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
import TimerDisplay from './TimerDisplay';
import EfficiencyRating from './EfficiencyRating';
import UnifiedSettings from '../Settings/UnifiedSettings';
import { wrapFunction } from '../../utils/errorHandler';
import { useUnifiedTimer } from '../../hooks/useUnifiedTimer';

interface UnifiedTimerProps {
  onStateChange?: (state: string) => void;
  className?: string;
}

const UnifiedTimer: React.FC<UnifiedTimerProps> = ({ 
  onStateChange, 
  className = '' 
}) => {
  const [showSettings, setShowSettings] = useState(false);

  // 启动计时器逻辑Hook
  useUnifiedTimer();

  // 使用统一的计时器Store
  const {
    currentState,
    currentMode,
    timeLeft,
    totalTime,
    isActive,
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
  } = useUnifiedTimerStore();

  // 状态变化回调
  useEffect(() => {
    onStateChange?.(currentState);
  }, [currentState, onStateChange]);

  // 格式化时间显示
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // 获取状态显示文本
  const getStateText = useCallback((): string => {
    switch (currentState) {
      case 'focus':
        return '专注中';
      case 'break':
        return '休息中';
      case 'microBreak':
        return '微休息';
      case 'forcedBreak':
        return '强制休息';
      default:
        return '';
    }
  }, [currentState]);

  // 计算进度百分比
  const getProgress = useCallback((): number => {
    if (totalTime === 0) return 0;
    return ((totalTime - timeLeft) / totalTime) * 100;
  }, [timeLeft, totalTime]);



  // 计时器控制函数（包装错误处理）
  const toggleTimer = wrapFunction(() => {
    if (isActive) {
      pause();
    } else {
      start();
    }
  }, { component: 'UnifiedTimer', action: 'toggleTimer' });

  const handleReset = wrapFunction(() => {
    reset();
  }, { component: 'UnifiedTimer', action: 'resetTimer' });

  const handleSkip = wrapFunction(() => {
    skipToNext();
  }, { component: 'UnifiedTimer', action: 'skipToNext' });

  const handleModeChange = wrapFunction((mode: TimerMode, options?: any) => {
    switchMode(mode, options);
  }, { component: 'UnifiedTimer', action: 'switchMode' });

  const handleSettingsChange = wrapFunction((newSettings: any) => {
    updateSettings(newSettings);
  }, { component: 'UnifiedTimer', action: 'updateSettings' });

  // 获取当前模式的特定信息
  const getModeSpecificInfo = () => {
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
  };

  const modeInfo = getModeSpecificInfo();
  const progress = getProgress();
  const formattedTime = formatTime(timeLeft);
  const stateText = getStateText();

  return (
    <TooltipProvider>
      <div className={`space-y-6 ${className}`}>
        {/* 模式选择器 */}
        {settings.showModeSelector && (
          <div className="flex justify-center">
            <ModeSelector
              currentMode={currentMode}
              isActive={isActive}
              onModeChange={handleModeChange}
              variant="tabs"
              showDescription={false}
            />
          </div>
        )}

        {/* 主计时器显示区域 */}
        <div className="flex flex-col items-center justify-center space-y-6">
          <TimerDisplay
            time={timeLeft}
            formattedTime={formattedTime}
            currentState={currentState as any}
            progress={progress}
            isActive={isActive}
            stateText={stateText}
            className="timer-main-display"
          />

          {/* 备用进度条 */}
          <div className="w-full max-w-md">
            <Progress
              value={progress}
              className="h-2 opacity-50"
              indicatorClassName={
                currentState === 'focus' ? 'bg-green-500' :
                currentState === 'break' ? 'bg-red-500' : 
                currentState === 'microBreak' ? 'bg-yellow-500' : 'bg-red-600'
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
                  variant={isActive ? "secondary" : "default"}
                  className="flex items-center space-x-2"
                >
                  {isActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  <span>{isActive ? "暂停" : "开始"}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isActive ? "暂停计时器" : "开始专注会话"}</p>
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

            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setShowSettings(true)}
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
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
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
            onClose={hideEfficiencyRating}
            onSubmit={submitEfficiencyRating}
            duration={pendingRatingSession.duration}
            type={pendingRatingSession.type}
          />
        )}
      </div>
    </TooltipProvider>
  );
};

export default UnifiedTimer;
