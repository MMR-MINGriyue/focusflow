import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Slider } from '../ui/Slider';
import { 
  Play, 
  Pause, 
  RotateCcw, 
 
  X,
  Minimize2,
  Maximize2,
  Volume2,
  VolumeX,


  Coffee,
  Target,
  Zap,


} from 'lucide-react';
import FocusMusicPlayer from '../Music/FocusMusicPlayer';
import { useUnifiedTimerStore } from '../../stores/unifiedTimerStore';
import { TimerMode } from '../../types/unifiedTimer';

interface FocusModeProps {
  className?: string;
  onExit?: () => void;
  autoStart?: boolean;
}

/**
 * 专注模式组件
 * 帮助用户进入深度专注状态
 */
const FocusMode: React.FC<FocusModeProps> = ({ 
  className = '',
  onExit,
  autoStart = false
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [distractionCount, setDistractionCount] = useState(0);
  const [focusLevel, setFocusLevel] = useState(0); // 0-100
  const [breakReminder, setBreakReminder] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.3);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const focusIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { 
    start, 
    pause, 
    reset, 
 
    timeLeft, 
    isActive, 
    currentState,
    settings,
    transitionTo 
  } = useUnifiedTimerStore();

  // 格式化时间
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // 计算进度百分比
  const calculateProgress = () => {
    let totalSeconds = 0;
    switch (currentState) {
      case 'focus':
        totalSeconds = settings[settings.mode === TimerMode.CLASSIC ? "classic" : "smart"].focusDuration * 60;
        break;
      case 'break':
        totalSeconds = settings[settings.mode === TimerMode.CLASSIC ? "classic" : "smart"].breakDuration * 60;
        break;
      case 'microBreak':
        totalSeconds = 5 * 60; // 5分钟
        break;
      default:
        totalSeconds = settings[settings.mode === TimerMode.CLASSIC ? "classic" : "smart"].focusDuration * 60;
    }

    const timeLeftSeconds = Math.floor(timeLeft / 1000);
    return ((totalSeconds - timeLeftSeconds) / totalSeconds) * 100;
  };

  // 获取会话类型文本
  const getSessionTypeText = () => {
    switch (currentState) {
      case 'focus':
        return '专注中';
      case 'break':
        return '休息中';
      case 'microBreak':
        return '微休息';
      default:
        return '准备';
    }
  };

  // 获取会话类型颜色
  const getSessionTypeColor = () => {
    switch (currentState) {
      case 'focus':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'break':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'microBreak':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  // 显示控制
  const showControlsTemporarily = () => {
    setShowControls(true);

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    controlsTimeoutRef.current = setTimeout(() => {
      if (isActive) {
        setShowControls(false);
      }
    }, 3000);
  };

  // 处理鼠标移动
  const handleMouseMove = () => {
    if (isActive) {
      showControlsTemporarily();
    }
  };

  // 切换全屏
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`全屏请求失败: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // 处理开始/暂停
  const handleStartPause = () => {
    if (isActive) {
      pause();
      setShowControls(true);
    } else {
      start();
      showControlsTemporarily();
    }
  };

  // 处理重置
  const handleReset = () => {
    reset();
    setShowControls(true);
  };

  // 处理跳过
  const handleSkip = () => {
    // 根据当前状态决定下一个状态
    const nextState = currentState === 'focus' ? 'break' : 'focus';
    transitionTo(nextState);
    setShowControls(true);
  };

  // 处理退出
  const handleExit = () => {
    pause();
    if (onExit) {
      onExit();
    }
  };

  // 记录分心
  const recordDistraction = () => {
    setDistractionCount(prev => prev + 1);
    // 降低专注度
    setFocusLevel(prev => Math.max(0, prev - 10));
    showControlsTemporarily();
  };

  // 切换静音
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // 更新音量
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  // 自动开始
  useEffect(() => {
    if (autoStart && !isActive) {
      start();
    }
  }, [autoStart, isActive, start]);

  // 专注度模拟
  useEffect(() => {
    if (isActive) {
      focusIntervalRef.current = setInterval(() => {
        // 随时间增加专注度，但受分心次数影响
        setFocusLevel(prev => {
          const increment = Math.random() * 2;
          const decrement = distractionCount > 0 ? distractionCount * 0.5 : 0;
          return Math.min(100, Math.max(0, prev + increment - decrement));
        });
      }, 5000);
    } else if (focusIntervalRef.current) {
      clearInterval(focusIntervalRef.current);
    }

    return () => {
      if (focusIntervalRef.current) {
        clearInterval(focusIntervalRef.current);
      }
    };
  }, [isActive, distractionCount]);

  // 重置分心计数
  useEffect(() => {
    if (!isActive) {
      setDistractionCount(0);
    }
  }, [isActive]);

  // 检查是否需要休息提醒
  useEffect(() => {
    if (isActive && currentState === 'focus' && focusLevel > 80) {
      const duration = settings[settings.mode === TimerMode.CLASSIC ? "classic" : "smart"].focusDuration * 60 * 1000; // 转换为毫秒
      const elapsed = duration - timeLeft;

      // 如果已经专注了超过设定时间的80%，提醒休息
      if (elapsed > duration * 0.8) {
        setBreakReminder(true);
      }
    } else {
      setBreakReminder(false);
    }
  }, [isActive, currentState, focusLevel, timeLeft, settings]);

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div 
      className={`min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col items-center justify-center relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onClick={handleMouseMove}
    >
      {/* 背景动画 */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white bg-opacity-5"
            style={{
              width: `${Math.random() * 100 + 20}px`,
              height: `${Math.random() * 100 + 20}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 20 + 10}s infinite linear`,
              animationDelay: `${Math.random() * 5}s`
            }}
          ></div>
        ))}
      </div>

      {/* 控制层 */}
      <div className={`z-10 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* 顶部控制栏 */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center">
          <div className={`text-lg font-medium px-3 py-1 rounded-full ${getSessionTypeColor()}`}>
            {getSessionTypeText()}
          </div>

          <div className="flex space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMusicPlayer(!showMusicPlayer)}
              className="text-white hover:text-gray-300"
            >
              <Volume2 className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowStats(!showStats)}
              className="text-white hover:text-gray-300"
            >
              <Target className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-white hover:text-gray-300"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleExit}
              className="text-white hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* 中央计时器 */}
        <div className="flex flex-col items-center justify-center space-y-8">
          <div className="text-8xl font-bold tracking-tighter">
            {formatTime(timeLeft)}
          </div>

          <div className="w-full max-w-md">
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
                style={{ width: `${calculateProgress()}%` }}
              ></div>
            </div>
          </div>

          <div className="flex space-x-6">
            <Button
              variant="ghost"
              size="lg"
              onClick={handleReset}
              className="text-white hover:text-gray-300"
            >
              <RotateCcw className="w-6 h-6" />
            </Button>

            <Button
              onClick={handleStartPause}
              size="lg"
              className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700"
            >
              {isActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
            </Button>

            <Button
              variant="ghost"
              size="lg"
              onClick={handleSkip}
              className="text-white hover:text-gray-300"
            >
              <Coffee className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* 底部信息栏 */}
        <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={recordDistraction}
              className="text-white hover:text-gray-300"
            >
              <Zap className="w-5 h-5 mr-1" />
              分心 ({distractionCount})
            </Button>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">专注度</span>
              <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-1000"
                  style={{ width: `${focusLevel}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-400">{Math.round(focusLevel)}%</span>
            </div>
          </div>

          <div className="text-sm text-gray-400">
            {showControls ? '移动鼠标显示控制' : '移动鼠标显示控制'}
          </div>
        </div>
      </div>

      {/* 音乐播放器 */}
      {showMusicPlayer && (
        <div className="absolute bottom-20 right-6 z-20 w-80">
          <Card className="bg-gray-800 bg-opacity-80 backdrop-blur-sm border-gray-700">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-medium">专注音乐</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMusicPlayer(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="mb-4">
                <FocusMusicPlayer volume={volume} autoPlay={false} />
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="text-gray-400 hover:text-white"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>

                <div className="flex-1">
                  <Slider
                    value={[volume]}
                    onValueChange={handleVolumeChange}
                    max={1}
                    step={0.05}
                    className="w-full"
                  />
                </div>

                <span className="text-xs text-gray-400 w-10">
                  {Math.round(volume * 100)}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 统计信息 */}
      {showStats && (
        <div className="absolute bottom-20 left-6 z-20 w-80">
          <Card className="bg-gray-800 bg-opacity-80 backdrop-blur-sm border-gray-700">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-medium">专注统计</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowStats(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">专注时长</span>
                  <span className="text-white">
                    {Math.floor((settings[settings.mode === TimerMode.CLASSIC ? "classic" : "smart"].focusDuration * 60 * 1000 - timeLeft) / 60000)}分钟
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">分心次数</span>
                  <span className="text-white">{distractionCount}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">专注度</span>
                  <span className="text-white">{Math.round(focusLevel)}%</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">预计完成</span>
                  <span className="text-white">
                    {new Date(Date.now() + timeLeft).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 休息提醒 */}
      {breakReminder && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 w-80">
          <Card className="bg-yellow-500 bg-opacity-90 backdrop-blur-sm border-yellow-600">
            <CardContent className="p-6 text-center">
              <Coffee className="w-12 h-12 text-white mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">休息提醒</h3>
              <p className="text-white mb-4">
                您已经专注了很长时间，建议休息一下
              </p>
              <div className="flex space-x-3">
                <Button
                  onClick={() => {
                    setBreakReminder(false);
                    // 根据当前状态决定下一个状态
                    const nextState = currentState === 'focus' ? 'break' : 'focus';
                    transitionTo(nextState);
                  }}
                  className="bg-white text-yellow-600 hover:bg-gray-100"
                >
                  立即休息
                </Button>
                <Button
                  onClick={() => setBreakReminder(false)}
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:bg-opacity-20"
                >
                  继续专注
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 样式 */}
      <style>{`
        @keyframes float {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 0.05;
          }
          50% {
            transform: translateY(-20px) translateX(10px) rotate(10deg);
            opacity: 0.1;
          }
          100% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 0.05;
          }
        }
      `}</style>
    </div>
  );
};

export default FocusMode;
