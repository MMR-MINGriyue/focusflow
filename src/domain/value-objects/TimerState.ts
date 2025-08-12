/**
 * 计时器状态值对象
 * 表示计时器的不同状态
 */

export enum TimerState {
  FOCUS = 'focus',
  BREAK = 'break',
  MICRO_BREAK = 'microBreak',
  FORCED_BREAK = 'forcedBreak'
}

/**
 * 计时器模式值对象
 */
export enum TimerMode {
  CLASSIC = 'classic',
  SMART = 'smart'
}

/**
 * 计时器状态转换值对象
 */
export class TimerStateTransition {
  private readonly _from: TimerState;
  private readonly _to: TimerState;
  private readonly _timestamp: Date;

  constructor(from: TimerState, to: TimerState, timestamp: Date = new Date()) {
    this._from = from;
    this._to = to;
    this._timestamp = timestamp;
  }

  get from(): TimerState {
    return this._from;
  }

  get to(): TimerState {
    return this._to;
  }

  get timestamp(): Date {
    return this._timestamp;
  }

  /**
   * 检查状态转换是否有效
   */
  isValid(): boolean {
    // 定义有效的状态转换规则
    const validTransitions: Record<TimerState, TimerState[]> = {
      [TimerState.FOCUS]: [TimerState.BREAK, TimerState.MICRO_BREAK, TimerState.FORCED_BREAK],
      [TimerState.BREAK]: [TimerState.FOCUS],
      [TimerState.MICRO_BREAK]: [TimerState.FOCUS],
      [TimerState.FORCED_BREAK]: [TimerState.FOCUS]
    };

    return validTransitions[this._from]?.includes(this._to) || false;
  }

  /**
   * 创建状态转换
   */
  static create(from: TimerState, to: TimerState, timestamp?: Date): TimerStateTransition {
    const transition = new TimerStateTransition(from, to, timestamp);

    if (!transition.isValid()) {
      throw new Error(`Invalid state transition from ${from} to ${to}`);
    }

    return transition;
  }
}
