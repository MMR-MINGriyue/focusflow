import React, { useState } from 'react';
import { useTimerStore } from '../../stores/timerStore';
import { useTimer } from '../../hooks/useTimer';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/Dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/Tooltip';
import { Play, Pause, RotateCcw, Settings as SettingsIcon } from 'lucide-react';
import Settings from '../Settings/Settings';

interface TimerProps {
  onStateChange?: (state: 'focus' | 'break' | 'microBreak') => void;
}

const Timer: React.FC<TimerProps> = ({ onStateChange }) => {
  const [showSettings, setShowSettings] = useState(false);

  // 使用 Zustand store 和 timer hook
  const {
    startTimer,
    pauseTimer,
    resetTimer,
    updateSettings,
    settings
  } = useTimerStore();

  const {
    currentState,
    isActive,
    formattedTime,
    stateText,
    stateColor,
    progress
  } = useTimer();

  // 状态变化回调
  React.useEffect(() => {
    onStateChange?.(currentState);
  }, [currentState, onStateChange]);

  // 计时器控制函数
  const toggleTimer = () => {
    if (isActive) {
      pauseTimer();
    } else {
      startTimer();
    }
  };

  // 设置变化处理
  const handleSettingsChange = (newSettings: typeof settings) => {
    updateSettings(newSettings);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center space-y-6">
        <div className={`text-6xl font-bold timer-display ${stateColor}`}>
          {formattedTime}
        </div>
        <div className="flex items-center space-x-2">
          <div className={`status-indicator ${
            currentState === 'focus' ? 'status-focus' :
            currentState === 'break' ? 'status-break' :
            currentState === 'microBreak' ? 'status-micro' : 'status-paused'
          }`}></div>
          <div className={`text-xl font-medium ${stateColor}`}>
            {stateText}
          </div>
        </div>

        {/* 进度条 */}
        <div className="w-full max-w-md">
          <Progress
            value={progress}
            className="h-3"
            indicatorClassName={
              currentState === 'focus' ? 'bg-green-500' :
              currentState === 'break' ? 'bg-red-500' : 'bg-yellow-500'
            }
          />
          <div className="text-xs text-gray-500 mt-1 text-center">
            {Math.round(progress)}% 完成
          </div>
        </div>
        <div className="flex items-center space-x-3">
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
                onClick={resetTimer}
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

          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    variant="ghost"
                    className="flex items-center space-x-2"
                  >
                    <SettingsIcon className="h-5 w-5" />
                    <span>设置</span>
                  </Button>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>打开设置面板</p>
              </TooltipContent>
            </Tooltip>

            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>专注设置</DialogTitle>
              </DialogHeader>
              <Settings
                {...settings}
                onSettingsChange={handleSettingsChange}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {showSettings && (
        <Settings
          {...settings}
          onSettingsChange={handleSettingsChange}
        />
      )}
      </div>
    </TooltipProvider>
  );
};

export default Timer; 