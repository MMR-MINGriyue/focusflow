/**
 * 计时器领域服务
 * 封装计时器相关的业务逻辑
 */

import { Timer } from '../entities/Timer';
import { TimerSession } from '../entities/TimerSession';
import { TimerMode, TimerState } from '../value-objects/TimerState';
import { Duration } from '../value-objects/Duration';
import { DateTime } from '../value-objects/DateTime';
import { UUID } from '../value-objects/UUID';
import { DomainEvent } from '../events/DomainEvent';

/**
 * 计时器开始事件
 */
export class TimerStartedEvent implements DomainEvent {
  readonly timestamp: Date;
  readonly timerId: string;
  readonly sessionId: string;
  readonly mode: TimerMode;
  readonly duration: number;

  constructor(timerId: string, sessionId: string, mode: TimerMode, duration: number) {
    this.timestamp = new Date();
    this.timerId = timerId;
    this.sessionId = sessionId;
    this.mode = mode;
    this.duration = duration;
  }

  get eventName(): string {
    return 'timer.started';
  }
}

/**
 * 计时器停止事件
 */
export class TimerStoppedEvent implements DomainEvent {
  readonly timestamp: Date;
  readonly timerId: string;
  readonly sessionId: string;
  readonly actualDuration: number;
  readonly completed: boolean;

  constructor(timerId: string, sessionId: string, actualDuration: number, completed: boolean) {
    this.timestamp = new Date();
    this.timerId = timerId;
    this.sessionId = sessionId;
    this.actualDuration = actualDuration;
    this.completed = completed;
  }

  get eventName(): string {
    return 'timer.stopped';
  }
}

/**
 * 计时器暂停事件
 */
export class TimerPausedEvent implements DomainEvent {
  readonly timestamp: Date;
  readonly timerId: string;
  readonly sessionId: string;
  readonly elapsed: number;

  constructor(timerId: string, sessionId: string, elapsed: number) {
    this.timestamp = new Date();
    this.timerId = timerId;
    this.sessionId = sessionId;
    this.elapsed = elapsed;
  }

  get eventName(): string {
    return 'timer.paused';
  }
}

/**
 * 计时器恢复事件
 */
export class TimerResumedEvent implements DomainEvent {
  readonly timestamp: Date;
  readonly timerId: string;
  readonly sessionId: string;

  constructor(timerId: string, sessionId: string) {
    this.timestamp = new Date();
    this.timerId = timerId;
    this.sessionId = sessionId;
  }

  get eventName(): string {
    return 'timer.resumed';
  }
}

/**
 * 计时器设置接口
 */
export interface TimerSettings {
  focusDuration: number; // 专注时长（秒）
  shortBreakDuration: number; // 短休息时长（秒）
  longBreakDuration: number; // 长休息时长（秒）
  longBreakInterval: number; // 长休息间隔
  autoStartBreak: boolean; // 自动开始休息
  autoStartFocus: boolean; // 自动开始专注
  soundEnabled: boolean; // 声音提醒
  volume: number; // 音量（0-1）
}

/**
 * 计时器领域服务
 */
export class TimerDomainService {
  private settings: TimerSettings;

  constructor(settings: TimerSettings) {
    this.settings = settings;
  }

  /**
   * 更新设置
   */
  updateSettings(settings: Partial<TimerSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  /**
   * 获取当前设置
   */
  getSettings(): TimerSettings {
    return { ...this.settings };
  }

  /**
   * 创建新的计时器
   */
  createTimer(mode: TimerMode, duration?: number): Timer {
    const actualDuration = duration || this.getDurationForMode(mode);
    const timerId = UUID.generate();
    const sessionId = UUID.generate();

    return new Timer({
      id: timerId,
      mode,
      duration: new Duration(actualDuration),
      sessionId,
      state: TimerState.IDLE,
      remainingTime: new Duration(actualDuration),
      startTime: null,
      endTime: null,
      isRunning: false,
      isPaused: false,
    });
  }

  /**
   * 开始计时器
   */
  startTimer(timer: Timer): TimerSession {
    if (timer.isRunning) {
      throw new Error('Timer is already running');
    }

    // 创建会话
    const session = TimerSession.create({
      startTime: DateTime.now(),
      mode: timer.mode,
    });

    // 开始计时器
    timer.start(session.id?.toString() || '');

    // 开始会话状态
    session.startState(timer.state, DateTime.now());

    // 添加事件
    timer.addDomainEvent(
      new TimerStartedEvent(
        timer.id.toString(),
        session.id?.toString() || '',
        timer.mode,
        timer.duration.inSeconds()
      )
    );

    return session;
  }

  /**
   * 停止计时器
   */
  stopTimer(timer: Timer, session: TimerSession): void {
    if (!timer.isRunning) {
      throw new Error('Timer is not running');
    }

    // 停止计时器
    timer.stop();

    // 结束会话状态
    session.endState(DateTime.now());

    // 检查是否完成
    const completed = timer.remainingTime.inSeconds() === 0;

    // 添加事件
    timer.addDomainEvent(
      new TimerStoppedEvent(
        timer.id.toString(),
        session.id?.toString() || '',
        timer.getActualDuration()?.inSeconds() || 0,
        completed
      )
    );

    // 如果完成，根据设置决定是否自动开始下一个计时器
    if (completed) {
      this.handleTimerCompletion(timer, session);
    }
  }

  /**
   * 暂停计时器
   */
  pauseTimer(timer: Timer, session: TimerSession): void {
    if (!timer.isRunning || timer.isPaused) {
      throw new Error('Timer is not running or already paused');
    }

    // 暂停计时器
    timer.pause();

    // 结束会话状态
    session.endState(DateTime.now());

    // 添加事件
    timer.addDomainEvent(
      new TimerPausedEvent(
        timer.id.toString(),
        session.id?.toString() || '',
        timer.getElapsedTime().inSeconds()
      )
    );
  }

  /**
   * 恢复计时器
   */
  resumeTimer(timer: Timer, session: TimerSession): void {
    if (!timer.isPaused) {
      throw new Error('Timer is not paused');
    }

    // 恢复计时器
    timer.resume();

    // 开始新的会话状态
    session.startState(timer.state, DateTime.now());

    // 添加事件
    timer.addDomainEvent(
      new TimerResumedEvent(
        timer.id.toString(),
        session.id?.toString() || ''
      )
    );
  }

  /**
   * 重置计时器
   */
  resetTimer(timer: Timer, session: TimerSession): void {
    // 重置计时器
    timer.reset();

    // 结束会话状态
    session.endState(DateTime.now());

    // 如果计时器正在运行，重新开始
    if (timer.isRunning) {
      session.startState(timer.state, DateTime.now());
    }
  }

  /**
   * 处理计时器完成
   */
  private handleTimerCompletion(timer: Timer, session: TimerSession): void {
    // 根据当前模式决定下一步
    switch (timer.mode) {
      case TimerMode.FOCUS:
        // 完成一个专注时段，可以开始休息
        if (this.settings.autoStartBreak) {
          // 这里可以触发开始休息的逻辑
          // 实际实现可能需要通过事件或其他机制
        }
        break;
      case TimerMode.BREAK:
      case TimerMode.MICRO_BREAK:
        // 完成休息，可以开始新的专注时段
        if (this.settings.autoStartFocus) {
          // 这里可以触发开始专注的逻辑
          // 实际实现可能需要通过事件或其他机制
        }
        break;
    }
  }

  /**
   * 根据模式获取时长
   */
  private getDurationForMode(mode: TimerMode): number {
    switch (mode) {
      case TimerMode.FOCUS:
        return this.settings.focusDuration;
      case TimerMode.BREAK:
        return this.settings.shortBreakDuration;
      case TimerMode.MICRO_BREAK:
        return this.settings.longBreakDuration;
      default:
        return this.settings.focusDuration;
    }
  }
}
