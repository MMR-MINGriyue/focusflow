import React, { useState } from 'react';
import TimerDisplay from './TimerDisplay';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { WorldClock } from '../WorldClock/WorldClock';
import { Play, Pause, RotateCcw } from 'lucide-react';

const Phase1Demo: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(1500); // 25分钟
  const [isActive, setIsActive] = useState(false);
  const [currentState, setCurrentState] = useState<'focus' | 'break' | 'microBreak'>('focus');
  const [enableTheme, setEnableTheme] = useState(true);
  const [enableWorldClock, setEnableWorldClock] = useState(true);

  // 计时器控制
  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(1500);
  };

  const switchState = (state: 'focus' | 'break' | 'microBreak') => {
    setCurrentState(state);
    setIsActive(false);
    
    // 设置对应的时间
    switch (state) {
      case 'focus':
        setTimeLeft(1500); // 25分钟
        break;
      case 'break':
        setTimeLeft(300); // 5分钟
        break;
      case 'microBreak':
        setTimeLeft(60); // 1分钟
        break;
    }
  };

  // 格式化时间显示
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 计算总时间
  const totalTime = currentState === 'focus' ? 1500 : currentState === 'break' ? 300 : 60;
  
  // 计算进度百分比
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  // 模拟ThemeToggle组件
  const ThemeToggle = () => (
    <div className="flex items-center space-x-2">
      <span>主题切换</span>
      <Switch 
        checked={enableTheme} 
        onCheckedChange={setEnableTheme} 
      />
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">阶段1: 基础计时器实现</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">基础计时器</h2>
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
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">功能开关</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">主题切换</span>
              <Switch
                checked={enableTheme}
                onCheckedChange={setEnableTheme}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">世界时钟</span>
              <Switch
                checked={enableWorldClock}
                onCheckedChange={setEnableWorldClock}
              />
            </div>
            
            {enableTheme && (
              <div className="pt-4">
                <ThemeToggle />
              </div>
            )}
            
            {enableWorldClock && (
              <div className="pt-4">
                <WorldClock />
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">阶段说明</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>实现基础的计时器功能（开始、暂停、重置）</li>
          <li>支持三种状态：专注、休息、微休息</li>
          <li>可视化时间显示和进度条</li>
          <li>基础的主题切换功能</li>
          <li>集成世界时钟组件</li>
        </ul>
      </div>
    </div>
  );
};

export default Phase1Demo;