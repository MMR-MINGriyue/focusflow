import React, { useMemo } from 'react';
import { Progress } from '../ui/Progress';

// 定义组件属性接口
interface TimerDisplayProps {
  time: number;
  formattedTime: string;
  currentState: 'focus' | 'break' | 'microBreak' | 'forcedBreak';
  progress: number;
  isActive?: boolean;
  stateText?: string;
  className?: string;
}

/**
 * 计时器显示组件（优化版）
 * 显示当前时间、状态和进度
 * 使用React.memo和useMemo优化性能，减少不必要的重渲染
 */
const TimerDisplayOptimized: React.FC<TimerDisplayProps> = React.memo(({
  formattedTime,
  currentState,
  progress,
  isActive: _isActive, // 重命名为_isActive表示我们有意不使用它
  stateText,
  className = ''
}) => {
  // 使用useMemo缓存状态相关的样式类，避免每次渲染都重新计算
  const stateStyles = useMemo(() => {
    // 根据状态获取颜色类
    const textColor = {
      focus: 'text-blue-600 dark:text-blue-400',
      break: 'text-green-600 dark:text-green-400',
      microBreak: 'text-yellow-600 dark:text-yellow-400',
      forcedBreak: 'text-red-600 dark:text-red-400',
      default: 'text-gray-800 dark:text-gray-200'
    }[currentState] || 'text-gray-800 dark:text-gray-200';

    // 根据状态获取背景颜色类
    const bgColor = {
      focus: 'bg-blue-50 dark:bg-blue-900/20',
      break: 'bg-green-50 dark:bg-green-900/20',
      microBreak: 'bg-yellow-50 dark:bg-yellow-900/20',
      forcedBreak: 'bg-red-50 dark:bg-red-900/20',
      default: 'bg-gray-50 dark:bg-gray-800'
    }[currentState] || 'bg-gray-50 dark:bg-gray-800';

    // 根据状态获取进度条颜色类
    const progressColor = {
      focus: 'bg-blue-500',
      break: 'bg-green-500',
      microBreak: 'bg-yellow-500',
      forcedBreak: 'bg-red-500',
      default: 'bg-gray-500'
    }[currentState] || 'bg-gray-500';

    // 状态文本
    const stateDisplayText = stateText || {
      focus: '专注中',
      break: '休息中',
      microBreak: '微休息',
      forcedBreak: '强制休息'
    }[currentState] || '';

    return { textColor, bgColor, progressColor, stateDisplayText };
  }, [currentState, stateText]);

  // 使用useMemo缓存容器类名
  const containerClassName = useMemo(() => {
    return `relative rounded-full w-64 h-64 flex items-center justify-center ${stateStyles.bgColor} transition-colors duration-300 ${className}`;
  }, [stateStyles.bgColor, className]);

  // 使用useMemo缓存进度条类名
  const progressClassName = useMemo(() => {
    return "absolute bottom-4 left-1/2 transform -translate-x-1/2 w-48";
  }, []);

  return (
    <div className={containerClassName}>
      {/* 时间显示 */}
      <div className="text-center z-10">
        <div className={`text-4xl font-bold ${stateStyles.textColor} mb-2`}>
          {formattedTime}
        </div>
        <div className={`text-sm font-medium ${stateStyles.textColor}`}>
          {stateStyles.stateDisplayText}
        </div>
      </div>

      {/* 进度条 */}
      <Progress
        value={progress}
        className={progressClassName}
        indicatorClassName={stateStyles.progressColor}
      />
    </div>
  );
});

// 添加显示名称，便于调试
TimerDisplayOptimized.displayName = 'TimerDisplayOptimized';

export default TimerDisplayOptimized;
