import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Settings, Volume2, VolumeX } from 'lucide-react';
import { Button } from '../ui/Button';
import { smartTimerService, SmartTimerState } from '../../services/smartTimer';
import { getSoundService } from '../../services/sound';

interface SmartTimerDisplayProps {
  className?: string;
}

const SmartTimerDisplay: React.FC<SmartTimerDisplayProps> = ({ className = '' }) => {
  const [timerState, setTimerState] = useState<SmartTimerState>(smartTimerService.getState());
  const [soundStatus, setSoundStatus] = useState(() => {
    const soundService = getSoundService();
    return soundService.getSoundStatus();
  });
  const [showSettings, setShowSettings] = useState(false);

  // 更新计时器状态
  useEffect(() => {
    const handleStateChange = (newState: SmartTimerState) => {
      setTimerState(newState);
    };

    smartTimerService.addListener(handleStateChange);
    return () => smartTimerService.removeListener(handleStateChange);
  }, []);

  // 定期更新音效状态
  useEffect(() => {
    const interval = setInterval(() => {
      const soundService = getSoundService();
      setSoundStatus(soundService.getSoundStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 格式化时间显示
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // 获取阶段显示信息
  const getPhaseInfo = useCallback(() => {
    const { currentPhase } = timerState;
    
    const phaseConfig = {
      focus: {
        name: '专注时间',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        icon: '🎯',
        description: '保持专注，避免干扰'
      },
      break: {
        name: '休息时间',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        icon: '☕',
        description: '放松身心，准备下一轮专注'
      },
      microBreak: {
        name: '微休息',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        icon: '🌸',
        description: '短暂休息，缓解疲劳'
      },
      forcedBreak: {
        name: '强制休息',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        icon: '⚠️',
        description: '您已连续专注很久，必须休息'
      }
    };

    return phaseConfig[currentPhase] || phaseConfig.focus;
  }, [timerState.currentPhase]);

  // 计算进度百分比
  const getProgress = useCallback((): number => {
    if (timerState.totalTime === 0) return 0;
    return ((timerState.totalTime - timerState.timeLeft) / timerState.totalTime) * 100;
  }, [timerState.timeLeft, timerState.totalTime]);

  // 控制按钮处理
  const handleStart = () => smartTimerService.start();
  const handlePause = () => smartTimerService.pause();
  const handleReset = () => smartTimerService.reset();
  const handleSkip = () => smartTimerService.skipToNext();
  
  const handleSoundToggle = () => {
    // TODO: 实现音效控制
    console.log('音效切换功能待实现');
  };

  const phaseInfo = getPhaseInfo();
  const progress = getProgress();
  const todayStats = smartTimerService.getTodayStats();

  return (
    <div className={`smart-timer-display ${className}`}>
      {/* 主计时器显示 */}
      <div className={`rounded-2xl p-8 shadow-lg ${phaseInfo.bgColor} transition-all duration-500`}>
        {/* 阶段信息 */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">{phaseInfo.icon}</div>
          <h2 className={`text-2xl font-bold ${phaseInfo.color} mb-1`}>
            {phaseInfo.name}
          </h2>
          <p className="text-gray-600 text-sm">{phaseInfo.description}</p>
        </div>

        {/* 时间显示 */}
        <div className="text-center mb-8">
          <div className="text-6xl font-mono font-bold text-gray-800 mb-4">
            {formatTime(timerState.timeLeft)}
          </div>
          
          {/* 进度条 */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className={`h-3 rounded-full transition-all duration-1000 ${
                timerState.currentPhase === 'focus' ? 'bg-blue-500' :
                timerState.currentPhase === 'break' ? 'bg-green-500' :
                timerState.currentPhase === 'microBreak' ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{
                '--progress-width': `${progress}%`,
                width: 'var(--progress-width)'
              } as React.CSSProperties}
            />
          </div>
          
          <div className="text-sm text-gray-500">
            {Math.round(progress)}% 完成
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="flex justify-center space-x-4 mb-6">
          {!timerState.isActive ? (
            <Button
              onClick={handleStart}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2"
            >
              <Play className="w-5 h-5" />
              <span>开始</span>
            </Button>
          ) : (
            <Button
              onClick={handlePause}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2"
            >
              <Pause className="w-5 h-5" />
              <span>暂停</span>
            </Button>
          )}
          
          <Button
            onClick={handleReset}
            variant="outline"
            className="px-6 py-3 rounded-lg flex items-center space-x-2"
          >
            <RotateCcw className="w-5 h-5" />
            <span>重置</span>
          </Button>
          
          <Button
            onClick={handleSkip}
            variant="outline"
            className="px-6 py-3 rounded-lg flex items-center space-x-2"
          >
            <SkipForward className="w-5 h-5" />
            <span>跳过</span>
          </Button>
        </div>

        {/* 音效和设置控制 */}
        <div className="flex justify-center space-x-4">
          <Button
            onClick={handleSoundToggle}
            variant="ghost"
            className="p-2 rounded-lg"
            title={soundStatus.isMuted ? '开启音效' : '关闭音效'}
          >
            {soundStatus.isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </Button>
          
          <Button
            onClick={() => setShowSettings(!showSettings)}
            variant="ghost"
            className="p-2 rounded-lg"
            title="设置"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* 今日统计 */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-blue-600">
            {Math.round(todayStats.totalFocusTime)}
          </div>
          <div className="text-sm text-gray-600">今日专注(分钟)</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-green-600">
            {todayStats.microBreakCount}
          </div>
          <div className="text-sm text-gray-600">微休息次数</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-purple-600">
            {Math.round(todayStats.continuousFocusTime)}
          </div>
          <div className="text-sm text-gray-600">连续专注(分钟)</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-orange-600">
            {todayStats.efficiency.toFixed(1)}
          </div>
          <div className="text-sm text-gray-600">效率评分</div>
        </div>
      </div>

      {/* 音效状态指示器 */}
      {soundStatus.whiteNoiseActive && (
        <div className="mt-4 bg-blue-100 border border-blue-300 rounded-lg p-3 text-center">
          <div className="text-blue-700 text-sm">
            🎵 白噪音播放中 - 有助于保持专注
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartTimerDisplay;
