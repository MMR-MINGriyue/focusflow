/**
 * 最终优化的计时器组件
 * 整合所有优化，提供最佳用户体验
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useOptimizedTimer } from '../../hooks/useOptimizedTimer';
import { TimerMode } from '../../types/unifiedTimer';
import { OptimizedButton } from '../ui/OptimizedButton';
import { OptimizedCard } from '../ui/OptimizedCard';
import { OptimizedProgress } from '../ui/OptimizedProgress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/OptimizedDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/OptimizedTooltip';
import { useConfirmDialog } from '../ui/OptimizedConfirmDialog';
import { OptimizedTimerDisplay } from './OptimizedTimerDisplay';
import { ModeSelector } from './ModeSelector';
import { EfficiencyRating } from './EfficiencyRating';
import { UnifiedSettings } from '../Settings/UnifiedSettings';

// 图标导入
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Settings as SettingsIcon,
  Brain,
  Timer as TimerIcon,
  Activity,
  BarChart3,
  Target,
  Zap,
  X
} from 'lucide-react';

interface FinalTimerProps {
  onStateChange?: (state: string) => void;
  className?: string;
  /**
   * 显示模式
   */
  displayMode?: 'default' | 'compact' | 'minimal';
  /**
   * 是否显示统计信息
   */
  showStats?: boolean;
  /**
   * 是否显示高级控制
   */
  showAdvancedControls?: boolean;
}

const FinalTimer: React.FC<FinalTimerProps> = ({
  onStateChange,
  className = '',
  displayMode = 'default',
  showStats = true,
  showAdvancedControls = true
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(false);

  // 确认对话框Hook
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();

  // 使用优化的计时器Hook
  const timer = useOptimizedTimer();

  // 状态变化回调
  useEffect(() => {
    onStateChange?.(timer.currentState);
  }, [timer.currentState, onStateChange]);

  // 初始化计时器
  useEffect(() => {
    if (!timer.isInitialized && !timer.initializationError) {
      timer.initialize();
    }
  }, [timer.isInitialized, timer.initializationError, timer.initialize]);

  // 计时器控制函数（包装错误处理）
  const toggleTimer = useCallback(async () => {
    if (timer.isActive) {
      timer.pause();
    } else {
      await timer.start();
    }
  }, [timer.isActive, timer.start, timer.pause]);

  const handleReset = useCallback(async () => {
    // 如果计时器正在运行或有进度，显示确认对话框
    if (timer.isActive || timer.timeLeft < timer.totalTime) {
      const progressLost = timer.totalTime - timer.timeLeft;
      const progressMinutes = Math.floor(progressLost / 60);
      const progressText = progressMinutes > 0 ? `${progressMinutes}分钟` : '少量';

      showConfirmDialog(
        `确定要重置计时器吗？\n\n当前进度：${progressText}的专注时间将会丢失。\n此操作无法撤销。`,
        async () => {
          await timer.reset();
        },
        {
          type: 'warning',
          confirmText: '重置',
          confirmDanger: true
        }
      );
    } else {
      // 没有进度时直接重置
      await timer.reset();
    }
  }, [timer.isActive, timer.timeLeft, timer.totalTime, timer.reset, showConfirmDialog]);

  const handleSkip = useCallback(async () => {
    await timer.skipToNext();
  }, [timer.skipToNext]);

  const handleModeChange = useCallback(async (mode: TimerMode, options?: any) => {
    await timer.switchMode(mode, options);
  }, [timer.switchMode]);

  const handleSettingsChange = useCallback((newSettings: any) => {
    timer.updateSettings(newSettings);
  }, [timer.updateSettings]);

  // 获取当前模式的特定信息
  const getModeSpecificInfo = () => {
    if (timer.currentMode === TimerMode.SMART) {
      return {
        icon: <Brain className="h-5 w-5" />,
        color: '#3b82f6',
        features: [
          `连续专注: ${Math.round(timer.continuousFocusTime / 60)}分钟`,
          `微休息: ${timer.microBreakCount}次`,
          `效率评分: ${timer.recentEfficiencyScores.length > 0
            ? (timer.recentEfficiencyScores.reduce((a, b) => a + b, 0) / timer.recentEfficiencyScores.length).toFixed(1)
            : 'N/A'}`
        ]
      };
    } else {
      return {
        icon: <TimerIcon className="h-5 w-5" />,
        color: '#ef4444',
        features: [
          `今日专注: ${Math.round(timer.todayStats.focusTime / 60)}分钟`,
          `休息时间: ${Math.round(timer.todayStats.breakTime / 60)}分钟`,
          `微休息: ${timer.todayStats.microBreaks}次`
        ]
      };
    }
  };

  const modeInfo = getModeSpecificInfo();

  // 处理初始化错误
  if (timer.initializationError) {
    return (
      <OptimizedCard variant="outlined" className={`bg-red-50 border-red-200 ${className}`}>
        <div className="text-center p-6">
          <h3 className="text-lg font-medium text-red-800 mb-2">计时器初始化失败</h3>
          <p className="text-red-600 mb-4">{timer.initializationError}</p>
          <OptimizedButton 
            onClick={timer.initialize}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            重试
          </OptimizedButton>
        </div>
      </OptimizedCard>
    );
  }

  // 处理未初始化状态
  if (!timer.isInitialized) {
    return (
      <OptimizedCard variant="outlined" className={`bg-gray-50 border-gray-200 ${className}`}>
        <div className="text-center p-6">
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
          <p className="text-gray-600">正在初始化计时器...</p>
        </div>
      </OptimizedCard>
    );
  }

  // 渲染默认模式
  if (displayMode === 'default') {
    return (
      <TooltipProvider>
        <div className={`space-y-6 ${className}`}>
          {/* 主容器使用Card组件 */}
          <OptimizedCard 
            variant="elevated" 
            className="w-full max-w-md mx-auto"
            interactive={false}
          >
            <div className="p-6 pb-2">
              <h3 className="text-lg font-semibold leading-none tracking-tight text-center">
                {timer.stateText}
              </h3>
            </div>
            <div className="p-6 pt-2 space-y-6">
              {/* 模式选择器 */}
              {timer.settings.showModeSelector && (
                <div className="flex justify-center">
                  <ModeSelector
                    currentMode={timer.currentMode}
                    isActive={timer.isActive}
                    onModeChange={handleModeChange}
                    variant="tabs"
                    showDescription={false}
                  />
                </div>
              )}

              {/* 主计时器显示区域 */}
              <div className="flex flex-col items-center justify-center space-y-6">
                <OptimizedTimerDisplay
                  time={timer.timeLeft}
                  formattedTime={timer.formattedTime}
                  currentState={timer.currentState as 'focus' | 'break' | 'microBreak'}
                  progress={timer.progress}
                  isActive={timer.isActive}
                  stateText={timer.stateText}
                  displayMode="circular"
                  size="lg"
                />

                {/* 控制按钮 */}
                <div className="flex items-center space-x-3" data-tour="timer-controls">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <OptimizedButton
                        onClick={toggleTimer}
                        size="lg"
                        variant={timer.isActive ? "secondary" : "default"}
                        icon={timer.isActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      >
                        {timer.isActive ? "暂停" : "开始"}
                      </OptimizedButton>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{timer.isActive ? "暂停计时器" : "开始专注会话"}</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <OptimizedButton
                        onClick={handleReset}
                        size="lg"
                        variant="outline"
                        icon={<RotateCcw className="h-5 w-5" />}
                      >
                        重置
                      </OptimizedButton>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>重置计时器到初始状态</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* 智能模式特有的跳过按钮 */}
                  {timer.currentMode === TimerMode.SMART && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <OptimizedButton
                          onClick={handleSkip}
                          size="lg"
                          variant="outline"
                          icon={<SkipForward className="h-5 w-5" />}
                        >
                          跳过
                        </OptimizedButton>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>跳过当前阶段</p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  <Dialog open={showSettings} onOpenChange={setShowSettings}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <OptimizedButton
                          onClick={() => setShowSettings(true)}
                          size="lg"
                          variant="ghost"
                          icon={<SettingsIcon className="h-5 w-5" />}
                        >
                          设置
                        </OptimizedButton>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>打开计时器设置</p>
                      </TooltipContent>
                    </Tooltip>
                  </Dialog>

                  {/* 高级控制按钮 */}
                  {showAdvancedControls && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <OptimizedButton
                          onClick={() => setShowPerformanceMetrics(!showPerformanceMetrics)}
                          size="lg"
                          variant="ghost"
                          icon={<Activity className="h-5 w-5" />}
                        >
                          性能
                        </OptimizedButton>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>显示性能指标</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>

              {/* 性能指标面板 */}
              {showPerformanceMetrics && (
                <OptimizedCard variant="filled" className="bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-5 w-5 text-blue-500" />
                      <span className="font-medium text-blue-800 dark:text-blue-200">
                        性能指标
                      </span>
                    </div>
                    <OptimizedButton
                      variant="ghost"
                      size="icon"
                      icon={<X className="h-4 w-4" />}
                      onClick={() => setShowPerformanceMetrics(false)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span className="text-muted-foreground">渲染时间:</span>
                      <span className="font-medium">
                        {timer.performanceMetrics.renderTime.toFixed(2)}ms
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4 text-green-500" />
                      <span className="text-muted-foreground">状态更新:</span>
                      <span className="font-medium">
                        {new Date(timer.performanceMetrics.lastUpdateTime).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </OptimizedCard>
              )}

              {/* 模式特定信息显示 */}
              {showStats && (
                <OptimizedCard variant="filled" className="bg-card border-border">
                  <div className="flex items-center space-x-2 mb-3">
                    {modeInfo.icon}
                    <span className="font-medium text-card-foreground">
                      {timer.currentMode === TimerMode.SMART ? '智能模式状态' : '经典模式统计'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                    {modeInfo.features.map((feature, index) => (
                      <div key={index} className="text-muted-foreground">
                        {feature}
                      </div>
                    ))}
                  </div>
                </OptimizedCard>
              )}

              {/* 设置对话框 */}
              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>计时器设置</DialogTitle>
                  </DialogHeader>
                  <UnifiedSettings
                    settings={timer.settings}
                    onSettingsChange={handleSettingsChange}
                  />
                </DialogContent>
              </Dialog>

              {/* 效率评分对话框 */}
              {timer.showRatingDialog && timer.pendingRatingSession && (
                <EfficiencyRating
                  isOpen={timer.showRatingDialog}
                  onClose={timer.hideEfficiencyRating}
                  onSubmit={timer.submitEfficiencyRating}
                  duration={timer.pendingRatingSession.duration}
                  type={timer.pendingRatingSession.type}
                />
              )}

              {/* 确认对话框 */}
              <ConfirmDialog />
            </div>
          </OptimizedCard>
        </div>
      </TooltipProvider>
    );
  }

  // 渲染紧凑模式
  if (displayMode === 'compact') {
    return (
      <TooltipProvider>
        <OptimizedCard variant="elevated" className={`w-full max-w-md mx-auto ${className}`}>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <OptimizedTimerDisplay
                  time={timer.timeLeft}
                  formattedTime={timer.formattedTime}
                  currentState={timer.currentState as 'focus' | 'break' | 'microBreak'}
                  progress={timer.progress}
                  isActive={timer.isActive}
                  stateText={timer.stateText}
                  displayMode="minimal"
                  size="md"
                />
                <div>
                  <div className="font-medium">{timer.stateText}</div>
                  {timer.settings.showModeSelector && (
                    <div className="text-xs text-muted-foreground">
                      {timer.currentMode === TimerMode.SMART ? '智能模式' : '经典模式'}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <OptimizedButton
                  onClick={toggleTimer}
                  size="icon"
                  variant={timer.isActive ? "secondary" : "default"}
                  icon={timer.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                />
                <OptimizedButton
                  onClick={handleSkip}
                  size="icon"
                  variant="outline"
                  icon={<SkipForward className="h-4 w-4" />}
                />
                <OptimizedButton
                  onClick={handleReset}
                  size="icon"
                  variant="outline"
                  icon={<RotateCcw className="h-4 w-4" />}
                />
              </div>
            </div>
          </div>
        </OptimizedCard>
      </TooltipProvider>
    );
  }

  // 渲染极简模式
  return (
    <TooltipProvider>
      <div className={className}>
        <OptimizedTimerDisplay
          time={timer.timeLeft}
          formattedTime={timer.formattedTime}
          currentState={timer.currentState as 'focus' | 'break' | 'microBreak'}
          progress={timer.progress}
          isActive={timer.isActive}
          stateText={timer.stateText}
          displayMode="minimal"
          size="md"
        />
      </div>
    </TooltipProvider>
  );
};

export default FinalTimer;
