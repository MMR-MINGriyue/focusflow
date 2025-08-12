import { useEffect, useRef, useState, useCallback } from 'react';
import { useUnifiedTimerStore } from '../stores/unifiedTimerStore';
import { Timer } from '../domain/entities/Timer';
import { IndexedDBAdapter } from '../infrastructure/storage/IndexedDBAdapter';
import { IndexedDBTimerRepository } from '../infrastructure/repositories/IndexedDBTimerRepository';
import { IndexedDBUserRepository } from '../infrastructure/repositories/IndexedDBUserRepository';
import { StartTimerUseCase } from '../application/use-cases/StartTimerUseCase';

// 向后兼容的计时器Hook
export const useTimerMigration = () => {
  const {
    currentState,
    timeLeft,
    isActive,
    settings,
    transitionTo,
    updateTimeLeft,
  } = useUnifiedTimerStore();

  const [isMigrating, setIsMigrating] = useState(false);
  const [newTimer, setNewTimer] = useState<Timer | null>(null);
  const intervalRef = useRef<number | null>(null);
  const dbAdapterRef = useRef<IndexedDBAdapter | null>(null);
  const timerRepositoryRef = useRef<IndexedDBTimerRepository | null>(null);
  const userRepositoryRef = useRef<IndexedDBUserRepository | null>(null);

  // 初始化新架构
  const initializeNewArchitecture = useCallback(async () => {
    if (!dbAdapterRef.current) {
      try {
        dbAdapterRef.current = new IndexedDBAdapter();
        await dbAdapterRef.current.initialize();
        
        timerRepositoryRef.current = new IndexedDBTimerRepository(dbAdapterRef.current);
        userRepositoryRef.current = new IndexedDBUserRepository(dbAdapterRef.current);
        
        // 创建默认用户
        const userId = 'default-user';
        const userRepository = userRepositoryRef.current;
        const existingUser = await userRepository.findById(userId);
        
        if (!existingUser) {
          const { User } = await import('../domain/entities/User');
          const defaultUser = new User(userId, 'Default User', 'user@example.com');
          await userRepository.save(defaultUser);
        }
        
        setIsMigrating(true);
      } catch (error) {
        console.error('Failed to initialize new architecture:', error);
      }
    }
  }, []);

  // 将旧设置转换为新配置
  const convertSettingsToConfig = useCallback(() => {
    return {
      duration: settings.classic.focusDuration * 60 * 1000,
      shortBreakDuration: settings.classic.breakDuration * 60 * 1000,
      longBreakDuration: settings.classic.breakDuration * 60 * 1000 * 2, // 长休息时间为短休息的2倍
      longBreakInterval: 4
    };
  }, [settings]);

  // 将旧状态转换为新模式 (已移除未使用的函数)

  // 创建新计时器实例
  const createNewTimer = useCallback(async () => {
    if (!timerRepositoryRef.current || !userRepositoryRef.current) return null;

    try {
      const useCase = new StartTimerUseCase(
        timerRepositoryRef.current,
        userRepositoryRef.current
      );

      const response = await useCase.execute({
        userId: 'default-user',
        ...convertSettingsToConfig()
      });

      return response.timer;
    } catch (error) {
      console.error('Failed to create new timer:', error);
      return null;
    }
  }, [convertSettingsToConfig]);

  // 同步新旧状态 (已移除未使用的函数)

  // 主计时器逻辑（向后兼容）
  useEffect(() => {
    initializeNewArchitecture();

    if (isActive && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        const newTimeLeft = useUnifiedTimerStore.getState().timeLeft - 1;
        updateTimeLeft(newTimeLeft);
        
        // 同步到新架构
        if (newTimer && isMigrating) {
          newTimer.updateTime(1000);
        }
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimeUp();
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, timeLeft, updateTimeLeft, newTimer, isMigrating, initializeNewArchitecture]);

  // 处理时间到的情况
  const handleTimeUp = useCallback(async () => {
    const state = useUnifiedTimerStore.getState();
    
    // 使用新架构处理完成
    if (newTimer && isMigrating) {
      newTimer.updateTime(newTimer.getConfig().duration);
      
      // 保存到数据库
      if (timerRepositoryRef.current) {
        await timerRepositoryRef.current.save(newTimer, 'default-user');
      }
    }
    
    // 保持旧的状态转换逻辑
    switch (state.currentState) {
      case 'focus':
        transitionTo('break');
        break;
      case 'break':
        transitionTo('focus');
        break;
      case 'microBreak':
        transitionTo('focus');
        break;
    }
  }, [newTimer, isMigrating, transitionTo]);

  // 新架构的方法
  const startNewTimer = useCallback(async () => {
    if (!isMigrating) return;
    
    const timer = await createNewTimer();
    if (timer) {
      setNewTimer(timer);
      updateTimeLeft(Math.floor(timer.getState().remainingTime / 1000));
    }
  }, [createNewTimer, isMigrating, updateTimeLeft]);

  const pauseNewTimer = useCallback(async () => {
    if (!newTimer || !isMigrating) return;
    
    newTimer.pause();
    if (timerRepositoryRef.current) {
      await timerRepositoryRef.current.save(newTimer, 'default-user');
    }
  }, [newTimer, isMigrating]);

  const resumeNewTimer = useCallback(async () => {
    if (!newTimer || !isMigrating) return;
    
    newTimer.resume();
    if (timerRepositoryRef.current) {
      await timerRepositoryRef.current.save(newTimer, 'default-user');
    }
  }, [newTimer, isMigrating]);

  const resetNewTimer = useCallback(async () => {
    if (!newTimer || !isMigrating) return;
    
    newTimer.reset();
    if (timerRepositoryRef.current) {
      await timerRepositoryRef.current.save(newTimer, 'default-user');
    }
  }, [newTimer, isMigrating]);

  // 格式化时间显示（向后兼容）
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 获取状态显示文本（向后兼容）
  const getStateText = (): string => {
    switch (currentState) {
      case 'focus':
        return '专注中';
      case 'break':
        return '休息中';
      case 'microBreak':
        return '微休息';
      default:
        return '';
    }
  };

  // 获取状态颜色（向后兼容）
  const getStateColor = (): string => {
    switch (currentState) {
      case 'focus':
        return 'text-green-600';
      case 'break':
        return 'text-red-600';
      case 'microBreak':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  // 获取进度百分比（向后兼容）
  const getProgress = (): number => {
    let totalTime: number;
    switch (currentState) {
      case 'focus':
        totalTime = settings.classic.focusDuration * 60;
        break;
      case 'break':
        totalTime = settings.classic.breakDuration * 60;
        break;
      case 'microBreak':
        totalTime = settings.classic.microBreakDuration * 60;
        break;
      default:
        totalTime = 1;
    }
    
    return Math.max(0, Math.min(100, ((totalTime - timeLeft) / totalTime) * 100));
  };

  return {
    // 向后兼容的属性
    currentState,
    timeLeft,
    isActive,
    settings,
    formattedTime: formatTime(timeLeft),
    stateText: getStateText(),
    stateColor: getStateColor(),
    progress: getProgress(),
    formatTime,
    
    // 新架构的方法
    isMigrating,
    newTimer,
    startNewTimer,
    pauseNewTimer,
    resumeNewTimer,
    resetNewTimer,
    
    // 迁移方法
    initializeNewArchitecture
  };
};