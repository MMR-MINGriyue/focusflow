import React, { useState, useEffect } from 'react';
import TimerDisplay from './TimerDisplay';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';

const Phase2Demo: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [currentState, setCurrentState] = useState<'focus' | 'break' | 'microBreak'>('focus');
  const [showSettings, setShowSettings] = useState(false);
  const [enableTheme, setEnableTheme] = useState(true);
  const [enableGestures, setEnableGestures] = useState(true);

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

  // 模拟计时器运行
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // 时间到，自动切换状态
      if (currentState === 'focus') {
        switchState('break');
      } else {
        switchState('focus');
      }
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, currentState]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">阶段2: 增强功能实现</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">增强计时器</h2>
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
              
              <Button onClick={() => setShowSettings(true)} variant="outline" className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>设置</span>
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
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">增强功能</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">主题切换</span>
              <Switch
                checked={enableTheme}
                onCheckedChange={(checked: boolean) => setEnableTheme(checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">手势控制</span>
              <Switch
                checked={enableGestures}
                onCheckedChange={(checked: boolean) => setEnableGestures(checked)}
              />
            </div>
            
            <div className="pt-4">
              <h3 className="font-medium mb-2">设置预览</h3>
              <div className="text-sm space-y-1 text-gray-600 dark:text-gray-300">
                <p>专注时长: 25分钟</p>
                <p>休息时长: 5分钟</p>
                <p>微休息间隔: 10-15分钟</p>
                <p>音效: 开启</p>
                <p>通知: 开启</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">阶段说明</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>实现完整的计时器逻辑（自动状态切换）</li>
          <li>添加设置功能，可自定义计时器参数</li>
          <li>增强主题切换功能</li>
          <li>添加手势控制支持</li>
          <li>优化用户界面和交互体验</li>
        </ul>
      </div>
      
      {/* 模拟设置模态框 */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">计时器设置</h3>
            <p>这是设置模态框的占位符。</p>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setShowSettings(false)}>关闭</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Phase2Demo;
