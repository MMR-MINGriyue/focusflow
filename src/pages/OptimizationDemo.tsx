import React, { useState } from 'react';
import TimerDisplay from '../components/Timer/TimerDisplay';
import { Button } from '../components/ui/Button';
import { Play, Pause, RotateCcw } from 'lucide-react';

const OptimizationDemo: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [currentState, setCurrentState] = useState<'focus' | 'break' | 'microBreak'>('focus');

  // 模拟进度计算
  const totalTime = currentState === 'focus' ? 25 * 60 : 
                  currentState === 'break' ? 5 * 60 : 1 * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  // 格式化时间显示
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 计时器控制
  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(25 * 60);
  };

  const switchState = (state: 'focus' | 'break' | 'microBreak') => {
    setCurrentState(state);
    setIsActive(false);
    
    // 设置对应的时间
    switch (state) {
      case 'focus':
        setTimeLeft(25 * 60);
        break;
      case 'break':
        setTimeLeft(5 * 60);
        break;
      case 'microBreak':
        setTimeLeft(1 * 60);
        break;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">性能优化演示</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">计时器组件</h2>
        <div className="flex flex-col items-center">
          <TimerDisplay 
            time={timeLeft}
            formattedTime={formatTime(timeLeft)}
            currentState={currentState}
            progress={progress}
          />
          
          <div className="flex space-x-4 mt-6">
            <Button onClick={toggleTimer} className="flex items-center space-x-2">
              {isActive ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>暂停</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>开始</span>
                </>
              )}
            </Button>
            
            <Button onClick={resetTimer} variant="secondary" className="flex items-center space-x-2">
              <RotateCcw className="w-4 h-4" />
              <span>重置</span>
            </Button>
          </div>
          
          <div className="flex space-x-2 mt-4">
            <Button 
              variant={currentState === 'focus' ? 'default' : 'outline'} 
              onClick={() => switchState('focus')}
            >
              专注
            </Button>
            <Button 
              variant={currentState === 'break' ? 'default' : 'outline'} 
              onClick={() => switchState('break')}
            >
              休息
            </Button>
            <Button 
              variant={currentState === 'microBreak' ? 'default' : 'outline'} 
              onClick={() => switchState('microBreak')}
            >
              微休息
            </Button>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">优化说明</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>使用 React.memo 优化组件重渲染</li>
          <li>使用 useMemo 和 useCallback 优化计算和回调函数</li>
          <li>使用虚拟滚动优化长列表渲染</li>
          <li>代码分割和懒加载减少初始包大小</li>
          <li>使用 Web Workers 处理复杂计算</li>
          <li>使用 CSS containment 隔离重绘区域</li>
        </ul>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">性能基准测试</h2>
        <Button>运行基准测试</Button>
      </div>
    </div>
  );
};

export default OptimizationDemo;