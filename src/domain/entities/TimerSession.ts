/**
 * 计时器会话实体
 * 表示一个完整的专注-休息周期
 */

import { Entity } from './Entity';
import { TimerMode, TimerState } from '../value-objects/TimerState';
import { Duration } from '../value-objects/Duration';
import { EfficiencyRating } from '../value-objects/EfficiencyRating';
import { DateTime } from '../value-objects/DateTime';
import { UUID } from '../value-objects/UUID';

export interface TimerSessionProps {
  id?: UUID;
  userId?: UUID;
  startTime: DateTime;
  endTime?: DateTime;
  mode: TimerMode;
  states: TimerSessionState[];
  efficiencyRating?: EfficiencyRating;
  tags?: string[];
  notes?: string;
}

export interface TimerSessionState {
  state: TimerState;
  startTime: DateTime;
  endTime?: DateTime;
  duration: Duration;
  completed: boolean;
}

export class TimerSession extends Entity<TimerSessionProps> {
  get id(): UUID | undefined {
    return this.props.id;
  }

  get userId(): UUID | undefined {
    return this.props.userId;
  }

  get startTime(): DateTime {
    return this.props.startTime;
  }

  get endTime(): DateTime | undefined {
    return this.props.endTime;
  }

  get mode(): TimerMode {
    return this.props.mode;
  }

  get states(): TimerSessionState[] {
    return this.props.states;
  }

  get efficiencyRating(): EfficiencyRating | undefined {
    return this.props.efficiencyRating;
  }

  get tags(): string[] {
    return this.props.tags || [];
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get isActive(): boolean {
    return this.props.endTime === undefined;
  }

  get currentState(): TimerState | undefined {
    if (this.states.length === 0) return undefined;
    return this.states[this.states.length - 1].state;
  }

  get totalDuration(): Duration {
    return this.states.reduce((total, state) => {
      return total.add(state.duration);
    }, new Duration(0));
  }

  get focusDuration(): Duration {
    return this.states
      .filter(state => state.state === TimerState.FOCUS)
      .reduce((total, state) => total.add(state.duration), new Duration(0));
  }

  get breakDuration(): Duration {
    return this.states
      .filter(state => state.state === TimerState.BREAK || state.state === TimerState.MICRO_BREAK)
      .reduce((total, state) => total.add(state.duration), new Duration(0));
  }

  get microBreakCount(): number {
    return this.states.filter(state => state.state === TimerState.MICRO_BREAK).length;
  }

  /**
   * 开始一个新的会话状态
   */
  startState(state: TimerState, startTime: DateTime = DateTime.now()): void {
    // 如果当前有活跃状态，先结束它
    if (this.isActive && this.currentState) {
      this.endState(startTime);
    }

    this.props.states.push({
      state,
      startTime,
      duration: new Duration(0),
      completed: false
    });
  }

  /**
   * 结束当前会话状态
   */
  endState(endTime: DateTime = DateTime.now()): void {
    if (!this.isActive || this.states.length === 0) {
      return;
    }

    const currentState = this.states[this.states.length - 1];
    if (currentState.completed) {
      return;
    }

    currentState.endTime = endTime;
    currentState.duration = new Duration(endTime.getTime() - currentState.startTime.getTime());
    currentState.completed = true;
  }

  /**
   * 结束整个会话
   */
  end(endTime: DateTime = DateTime.now()): void {
    if (!this.isActive) {
      return;
    }

    // 结束当前状态
    this.endState(endTime);

    // 设置会话结束时间
    this.props.endTime = endTime;
  }

  /**
   * 设置效率评分
   */
  setEfficiencyRating(rating: EfficiencyRating): void {
    this.props.efficiencyRating = rating;
  }

  /**
   * 添加标签
   */
  addTag(tag: string): void {
    if (!this.props.tags) {
      this.props.tags = [];
    }

    if (!this.props.tags.includes(tag)) {
      this.props.tags.push(tag);
    }
  }

  /**
   * 移除标签
   */
  removeTag(tag: string): void {
    if (this.props.tags) {
      this.props.tags = this.props.tags.filter(t => t !== tag);
    }
  }

  /**
   * 更新笔记
   */
  updateNotes(notes: string): void {
    this.props.notes = notes;
  }

  /**
   * 创建新的计时器会话
   */
  static create(props: Omit<TimerSessionProps, 'id' | 'states'>): TimerSession {
    return new TimerSession({
      ...props,
      id: UUID.generate(),
      states: []
    });
  }
}
