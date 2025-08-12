/**
 * 任务聚合根
 * 封装任务及其相关行为
 */

import { Entity } from '../entities/Entity';
import { TaskId } from '../value-objects/TaskId';
import { TaskTitle } from '../value-objects/TaskTitle';
import { TaskDescription } from '../value-objects/TaskDescription';
import { TaskStatus } from '../value-objects/TaskStatus';
import { TaskPriority } from '../value-objects/TaskPriority';
import { DateTime } from '../value-objects/DateTime';
import { Duration } from '../value-objects/Duration';
import { TimerSession } from '../entities/TimerSession';
import { UUID } from '../value-objects/UUID';
import { DomainEvent } from '../events/DomainEvent';

/**
 * 任务创建事件
 */
export class TaskCreatedEvent implements DomainEvent {
  readonly timestamp: Date;
  readonly taskId: string;
  readonly title: string;

  constructor(taskId: string, title: string) {
    this.timestamp = new Date();
    this.taskId = taskId;
    this.title = title;
  }

  get eventName(): string {
    return 'task.created';
  }
}

/**
 * 任务状态变更事件
 */
export class TaskStatusChangedEvent implements DomainEvent {
  readonly timestamp: Date;
  readonly taskId: string;
  readonly oldStatus: string;
  readonly newStatus: string;

  constructor(taskId: string, oldStatus: string, newStatus: string) {
    this.timestamp = new Date();
    this.taskId = taskId;
    this.oldStatus = oldStatus;
    this.newStatus = newStatus;
  }

  get eventName(): string {
    return 'task.status-changed';
  }
}

/**
 * 任务完成事件
 */
export class TaskCompletedEvent implements DomainEvent {
  readonly timestamp: Date;
  readonly taskId: string;
  readonly completedAt: Date;
  readonly timeSpent: number; // 以秒为单位

  constructor(taskId: string, completedAt: Date, timeSpent: number) {
    this.timestamp = new Date();
    this.taskId = taskId;
    this.completedAt = completedAt;
    this.timeSpent = timeSpent;
  }

  get eventName(): string {
    return 'task.completed';
  }
}

export interface TaskProps {
  id?: TaskId;
  title: TaskTitle;
  description?: TaskDescription;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: DateTime;
  estimatedPomodoros?: number;
  actualPomodoros?: number;
  createdAt?: DateTime;
  updatedAt?: DateTime;
  completedAt?: DateTime;
  tags?: string[];
  sessions?: TimerSession[];
}

export class TaskAggregate extends Entity<TaskProps> {
  private _domainEvents: DomainEvent[] = [];

  get id(): TaskId | undefined {
    return this.props.id;
  }

  /**
   * 获取领域事件
   */
  get domainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  /**
   * 添加领域事件
   * @param event 领域事件
   */
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * 清除领域事件
   */
  public clearDomainEvents(): void {
    this._domainEvents = [];
  }

  /**
   * 获取实体ID
   */
  getId(): any {
    return this.props.id?.toString();
  }

  get title(): TaskTitle {
    return this.props.title;
  }

  get description(): TaskDescription | undefined {
    return this.props.description;
  }

  get status(): TaskStatus {
    return this.props.status;
  }

  get priority(): TaskPriority {
    return this.props.priority;
  }

  get dueDate(): DateTime | undefined {
    return this.props.dueDate;
  }

  get estimatedPomodoros(): number | undefined {
    return this.props.estimatedPomodoros;
  }

  get actualPomodoros(): number | undefined {
    return this.props.actualPomodoros;
  }

  get createdAt(): DateTime | undefined {
    return this.props.createdAt;
  }

  get updatedAt(): DateTime | undefined {
    return this.props.updatedAt;
  }

  get completedAt(): DateTime | undefined {
    return this.props.completedAt;
  }

  get tags(): string[] {
    return this.props.tags || [];
  }

  get sessions(): TimerSession[] {
    return this.props.sessions || [];
  }

  get isCompleted(): boolean {
    return this.props.status.value === 'completed';
  }

  get progress(): number {
    if (!this.props.estimatedPomodoros || this.props.estimatedPomodoros === 0) {
      return 0;
    }

    const actual = this.props.actualPomodoros || 0;
    return Math.min(100, Math.round((actual / this.props.estimatedPomodoros) * 100));
  }

  get timeSpent(): Duration {
    const totalSeconds = this.sessions.reduce((total, session) => {
      const duration = session.getActualDuration();
      return total + (duration ? duration.inSeconds() : 0);
    }, 0);

    return new Duration(totalSeconds);
  }

  /**
   * 更新任务标题
   */
  updateTitle(title: TaskTitle): void {
    if (!this.props.title.equals(title)) {
      this.props.title = title;
      this.updateTimestamp();
    }
  }

  /**
   * 更新任务描述
   */
  updateDescription(description: TaskDescription | undefined): void {
    if (!this.props.description?.equals(description)) {
      this.props.description = description;
      this.updateTimestamp();
    }
  }

  /**
   * 更新任务优先级
   */
  updatePriority(priority: TaskPriority): void {
    if (!this.props.priority.equals(priority)) {
      this.props.priority = priority;
      this.updateTimestamp();
    }
  }

  /**
   * 更新任务截止日期
   */
  updateDueDate(dueDate: DateTime | undefined): void {
    if (this.props.dueDate?.equals(dueDate)) {
      this.props.dueDate = dueDate;
      this.updateTimestamp();
    }
  }

  /**
   * 更新预估番茄钟数
   */
  updateEstimatedPomodoros(estimatedPomodoros: number): void {
    if (this.props.estimatedPomodoros !== estimatedPomodoros) {
      this.props.estimatedPomodoros = estimatedPomodoros;
      this.updateTimestamp();
    }
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
      this.updateTimestamp();
    }
  }

  /**
   * 移除标签
   */
  removeTag(tag: string): void {
    if (this.props.tags) {
      this.props.tags = this.props.tags.filter(t => t !== tag);
      this.updateTimestamp();
    }
  }

  /**
   * 开始任务
   */
  start(): void {
    if (this.props.status.value === 'not-started') {
      const oldStatus = this.props.status.value;
      this.props.status = new TaskStatus('in-progress');
      this.updateTimestamp();

      // 发布任务状态变更事件
      this.addDomainEvent(
        new TaskStatusChangedEvent(
          this.props.id?.toString() || '',
          oldStatus,
          this.props.status.value
        )
      );
    }
  }

  /**
   * 完成任务
   */
  complete(): void {
    if (!this.isCompleted) {
      const oldStatus = this.props.status.value;
      this.props.status = new TaskStatus('completed');
      this.props.completedAt = DateTime.now();
      this.updateTimestamp();

      // 发布任务状态变更事件
      this.addDomainEvent(
        new TaskStatusChangedEvent(
          this.props.id?.toString() || '',
          oldStatus,
          this.props.status.value
        )
      );

      // 发布任务完成事件
      this.addDomainEvent(
        new TaskCompletedEvent(
          this.props.id?.toString() || '',
          this.props.completedAt.value,
          this.timeSpent.inSeconds()
        )
      );
    }
  }

  /**
   * 重新打开任务
   */
  reopen(): void {
    if (this.isCompleted) {
      const oldStatus = this.props.status.value;
      this.props.status = new TaskStatus('in-progress');
      this.props.completedAt = undefined;
      this.updateTimestamp();

      // 发布任务状态变更事件
      this.addDomainEvent(
        new TaskStatusChangedEvent(
          this.props.id?.toString() || '',
          oldStatus,
          this.props.status.value
        )
      );
    }
  }

  /**
   * 添加计时器会话
   */
  addSession(session: TimerSession): void {
    if (!this.props.sessions) {
      this.props.sessions = [];
    }

    this.props.sessions.push(session);
    this.props.actualPomodoros = (this.props.actualPomodoros || 0) + 1;
    this.updateTimestamp();
  }

  /**
   * 移除计时器会话
   */
  removeSession(sessionId: string): void {
    if (this.props.sessions) {
      const index = this.props.sessions.findIndex(s => s.id?.toString() === sessionId);
      if (index >= 0) {
        this.props.sessions.splice(index, 1);
        this.props.actualPomodoros = Math.max(0, (this.props.actualPomodoros || 0) - 1);
        this.updateTimestamp();
      }
    }
  }

  /**
   * 更新时间戳
   */
  private updateTimestamp(): void {
    this.props.updatedAt = DateTime.now();
  }

  /**
   * 创建新任务
   */
  static create(props: Omit<TaskProps, 'id' | 'status' | 'createdAt' | 'updatedAt'>): TaskAggregate {
    const now = DateTime.now();
    const task = new TaskAggregate({
      ...props,
      id: new TaskId(UUID.generate().toString()),
      status: new TaskStatus('not-started'),
      createdAt: now,
      updatedAt: now,
    });

    // 发布任务创建事件
    task.addDomainEvent(
      new TaskCreatedEvent(
        task.props.id?.toString() || '',
        task.props.title.value
      )
    );

    return task;
  }
}
