import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Settings, Coffee, Focus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Progress } from '../ui/Progress';
import { useUnifiedTimerStore } from '../../stores/unifiedTimerStore';
import { useEnhancedNotificationService } from '../../hooks/useEnhancedNotificationService';
import { useEnhancedSoundService } from '../../hooks/useEnhancedSoundService';
import { useConfirmDialog } from '../ui/ConfirmDialog';

interface SmartTimerProps {
  className?: string;
}

/**
 * 智能计时器组件
 * 实现文档中提到的90分钟专注+20分钟休息的基础循环，以及随机微休息功能
 */
const SmartTimer: React.FC<SmartTimerProps> = ({ className = '' }) => {
  // 状态管理
  const {
    mode,
    isActive,
    timeLeft,
    totalTime,
    currentSession,
    sessionsCompleted,
    settings,
    start,
    pause,
    reset,
    skip,
    updateSettings
  } = useUnifiedTimerStore();

  // 通知服务
  const notificationService = useEnhancedNotificationService();

  // 音效服务
  const soundService = useEnhancedSoundService();

  // 确认对话框
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();

  // 本地状态
  const [microBreakTimeLeft, setMicroBreakTimeLeft] = useState<number>(0);
  const [microBreakActive, setMicroBreakActive] = useState<boolean>(false);
  const [nextMicroBreakTime, setNextMicroBreakTime] = useState<number>(0);
  const [showMicroBreakModal, setShowMicroBreakModal] = useState<boolean>(false);
  const microBreakTimerRef = useRef<NodeJS.Timeout | null>(null);
  const microBreakCountdownRef = useRef<NodeJS.Timeout | null>(null);

  // 计算进度百分比
  const progressPercentage = (timeLeft / totalTime) * 100;

  // 格式化时间显示
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // 生成随机微休息间隔（10-30分钟）
  const generateRandomMicroBreakInterval = useCallback((): number => {
    // 使用Web Crypto API生成真随机数，防止伪随机导致规律可预测
    const randomValue = window.crypto.getRandomValues(new Uint32Array(1))[0] / (0xFFFFFFFF + 1);
    return Math.floor(10 + randomValue * 20); // 10-30分钟
  }, []);

  // 生成随机微休息时长（3-5分钟）
  const generateRandomMicroBreakDuration = useCallback((): number => {
    const randomValue = window.crypto.getRandomValues(new Uint32Array(1))[0] / (0xFFFFFFFF + 1);
    return Math.floor(3 + randomValue * 2); // 3-5分钟
  }, []);

  // 安排下一个微休息
  const scheduleNextMicroBreak = useCallback(() => {
    if (microBreakTimerRef.current) {
      clearTimeout(microBreakTimerRef.current);
    }

    const interval = generateRandomMicroBreakInterval() * 60; // 转换为秒
    setNextMicroBreakTime(interval);

    // 如果计时器正在运行且处于专注模式，安排微休息
    if (isActive && currentSession === 'focus') {
      microBreakTimerRef.current = setTimeout(() => {
        startMicroBreak();
      }, interval * 1000);
    }
  }, [isActive, currentSession, generateRandomMicroBreakInterval]);

  // 开始微休息
  const startMicroBreak = useCallback(() => {
    const duration = generateRandomMicroBreakDuration() * 60; // 转换为秒
    setMicroBreakTimeLeft(duration);
    setMicroBreakActive(true);
    setShowMicroBreakModal(true);

    // 播放微休息提示音
    soundService.play('micro-break');

    // 发送微休息通知
    notificationService.notifyMicroBreak({
      body: '站起来活动一下，喝杯水吧！',
      onClick: () => setShowMicroBreakModal(true)
    });

    // 开始微休息倒计时
    if (microBreakCountdownRef.current) {
      clearInterval(microBreakCountdownRef.current);
    }

    microBreakCountdownRef.current = setInterval(() => {
      setMicroBreakTimeLeft(prev => {
        if (prev <= 1) {
          if (microBreakCountdownRef.current) {
            clearInterval(microBreakCountdownRef.current);
          }
          endMicroBreak();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [generateRandomMicroBreakDuration, notificationService, soundService]);

  // 结束微休息
  const endMicroBreak = useCallback(() => {
    setMicroBreakActive(false);
    setShowMicroBreakModal(false);

    // 安排下一个微休息
    scheduleNextMicroBreak();
  }, [scheduleNextMicroBreak]);

  // 跳过微休息
  const skipMicroBreak = useCallback(() => {
    if (microBreakCountdownRef.current) {
      clearInterval(microBreakCountdownRef.current);
    }
    endMicroBreak();
  }, [endMicroBreak]);

  // 处理开始/暂停
  const handleToggleTimer = useCallback(() => {
    if (isActive) {
      pause();
    } else {
      start();

      // 如果是专注模式，安排微休息
      if (currentSession === 'focus') {
        scheduleNextMicroBreak();
      }
    }
  }, [isActive, start, pause, currentSession, scheduleNextMicroBreak]);

  // 处理重置
  const handleReset = useCallback(() => {
    showConfirmDialog(
      '确定要重置计时器吗？当前进度将会丢失。',
      () => {
        reset();

        // 清除微休息计时器
        if (microBreakTimerRef.current) {
          clearTimeout(microBreakTimerRef.current);
          microBreakTimerRef.current = null;
        }

        // 清除微休息倒计时
        if (microBreakCountdownRef.current) {
          clearInterval(microBreakCountdownRef.current);
          microBreakCountdownRef.current = null;
        }

        // 重置微休息状态
        setMicroBreakActive(false);
        setMicroBreakTimeLeft(0);
        setShowMicroBreakModal(false);
      },
      {
        title: '重置计时器',
        confirmText: '重置',
        cancelText: '取消'
      }
    );
  }, [reset, showConfirmDialog]);

  // 处理跳过
  const handleSkip = useCallback(() => {
    skip();

    // 清除微休息计时器
    if (microBreakTimerRef.current) {
      clearTimeout(microBreakTimerRef.current);
      microBreakTimerRef.current = null;
    }

    // 清除微休息倒计时
    if (microBreakCountdownRef.current) {
      clearInterval(microBreakCountdownRef.current);
      microBreakCountdownRef.current = null;
    }

    // 重置微休息状态
    setMicroBreakActive(false);
    setMicroBreakTimeLeft(0);
    setShowMicroBreakModal(false);
  }, [skip]);

  // 监听计时器状态变化
  useEffect(() => {
    // 如果计时器开始运行且处于专注模式，安排微休息
    if (isActive && currentSession === 'focus' && !microBreakActive) {
      scheduleNextMicroBreak();
    }

    // 如果计时器暂停或切换到休息模式，清除微休息计时器
    if (!isActive || currentSession !== 'focus') {
      if (microBreakTimerRef.current) {
        clearTimeout(microBreakTimerRef.current);
        microBreakTimerRef.current = null;
      }
    }
  }, [isActive, currentSession, microBreakActive, scheduleNextMicroBreak]);

  // 监听会话变化
  useEffect(() => {
    // 当会话变化时，发送相应的通知
    if (currentSession === 'focus') {
      notificationService.notifyFocusStart();
      soundService.play('focus-start');
    } else if (currentSession === 'break') {
      notificationService.notifyBreakStart();
      soundService.play('break-start');
    }
  }, [currentSession, notificationService, soundService]);

  // 组件卸载时清除计时器
  useEffect(() => {
    return () => {
      if (microBreakTimerRef.current) {
        clearTimeout(microBreakTimerRef.current);
      }

      if (microBreakCountdownRef.current) {
        clearInterval(microBreakCountdownRef.current);
      }
    };
  }, []);

  // 获取当前模式文本
  const modeText = currentSession === 'focus' ? '专注中' : '休息中';

  // 获取下一个微休息时间文本
  const nextMicroBreakText = nextMicroBreakTime > 0 
    ? `下次微休息: ${Math.floor(nextMicroBreakTime / 60)}分${nextMicroBreakTime % 60}秒`
    : '';

  return (
    <div className={className}>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            {currentSession === 'focus' ? (
              <Focus className="h-5 w-5 text-blue-500" />
            ) : (
              <Coffee className="h-5 w-5 text-green-500" />
            )}
            <span>{modeText}</span>
          </CardTitle>
          <CardDescription>
            {mode === 'smart' ? '智能模式' : '经典模式'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 时间显示 */}
          <div className="text-center">
            <div className="text-6xl font-bold tabular-nums">
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {nextMicroBreakText}
            </div>
          </div>

          {/* 进度条 */}
          <Progress value={progressPercentage} className="h-2" />

          {/* 控制按钮 */}
          <div className="flex justify-center space-x-4">
            <Button
              onClick={handleToggleTimer}
              size="lg"
              className="w-16 h-16 rounded-full"
            >
              {isActive ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </Button>
            <Button
              onClick={handleReset}
              size="lg"
              variant="outline"
              className="w-16 h-16 rounded-full"
            >
              <RotateCcw className="h-6 w-6" />
            </Button>
            <Button
              onClick={handleSkip}
              size="lg"
              variant="outline"
              className="w-16 h-16 rounded-full"
            >
              <SkipForward className="h-6 w-6" />
            </Button>
          </div>

          {/* 会话计数 */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            已完成 {sessionsCompleted} 个专注会话
          </div>
        </CardContent>
      </Card>

      {/* 微休息模态框 */}
      {showMicroBreakModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center space-x-2">
                <Coffee className="h-5 w-5 text-yellow-500" />
                <span>微休息时间</span>
              </CardTitle>
              <CardDescription>
                站起来活动一下，喝杯水，让眼睛休息一下
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 微休息倒计时 */}
              <div className="text-center">
                <div className="text-4xl font-bold tabular-nums">
                  {formatTime(microBreakTimeLeft)}
                </div>
              </div>

              {/* 微休息提示 */}
              <div className="text-center text-sm text-gray-600 dark:text-gray-300">
                <p>闭上眼睛，深呼吸，放松身心</p>
                <p className="mt-2">微休息有助于提高专注力和工作效率</p>
              </div>

              {/* 控制按钮 */}
              <div className="flex justify-center space-x-4">
                <Button
                  onClick={skipMicroBreak}
                  variant="outline"
                >
                  跳过
                </Button>
                <Button
                  onClick={endMicroBreak}
                >
                  结束休息
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 确认对话框 */}
      <ConfirmDialog />
    </div>
  );
};

export default SmartTimer;
