import React, { useMemo } from 'react';
import { Progress } from '../ui/Progress';

// 定义组件属性接口
interface TimerDisplayProps {
  timeLeft: number;         // 剩余时间（毫秒）
  progressPercentage: number; // 进度百分比（0-100）
  sessionType: 'focus' | 'break' | 'microBreak'; // 会话类型
  className?: string;
}

/**
 * 计时器显示组件（整合优化版）
 * 显示当前时间、状态和进度
 * 使用React.memo和useMemo优化性能，减少不必要的重渲染
 */
const TimerDisplayUnified: React.FC<TimerDisplayProps> = React.memo(({
  timeLeft,
  progressPercentage,
  sessionType,
  className = ''
}) => {
  // 格式化时间
  const formattedTime = useMemo(() => {
    const totalSeconds = Math.ceil(timeLeft / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  // 使用useMemo缓存状态相关的样式类，避免每次渲染都重新计算
  const stateStyles = useMemo(() => {
    switch (sessionType) {
      case 'focus':
        return {
          textColor: 'text-blue-600',
          bgColor: 'bg-blue-100',
          progressColor: 'bg-blue-500',
          ringColor: 'ring-blue-300',
        };
      case 'break':
        return {
          textColor: 'text-green-600',
          bgColor: 'bg-green-100',
          progressColor: 'bg-green-500',
          ringColor: 'ring-green-300',
        };
      case 'microBreak':
        return {
          textColor: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          progressColor: 'bg-yellow-500',
          ringColor: 'ring-yellow-300',
        };
      default:
        return {
          textColor: 'text-gray-600',
          bgColor: 'bg-gray-100',
          progressColor: 'bg-gray-500',
          ringColor: 'ring-gray-300',
        };
    }
  }, [sessionType]);

  // 获取状态文本
  const stateText = useMemo(() => {
    switch (sessionType) {
      case 'focus':
        return '专注中';
      case 'break':
        return '休息中';
      case 'microBreak':
        return '微休息';
      default:
        return '准备';
    }
  }, [sessionType]);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* 状态文本 */}
      <div className={`text-lg font-medium mb-2 ${stateStyles.textColor}`}>
        {stateText}
      </div>

      {/* 时间显示 */}
      <div className={`relative w-64 h-64 rounded-full ${stateStyles.bgColor} flex items-center justify-center mb-6 shadow-lg ${stateStyles.ringColor} ring-4`}>
        {/* 进度环 */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div 
            className={`absolute bottom-0 left-0 right-0 ${stateStyles.progressColor} transition-all duration-1000 ease-linear`}
            style={{ height: `${progressPercentage}%` }}
          />
        </div>

        {/* 时间文本 */}
        <div className="relative z-10 text-5xl font-bold text-gray-800">
          {formattedTime}
        </div>
      </div>

      {/* 进度条 */}
      <div className="w-full max-w-md">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>进度</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <Progress 
          value={progressPercentage} 
          className="h-2" 
        />
      </div>
    </div>
  );
});

TimerDisplayUnified.displayName = 'TimerDisplayUnified';

export default TimerDisplayUnified;
