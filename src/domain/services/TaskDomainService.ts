/**
 * 任务领域服务
 * 封装任务相关的业务逻辑
 */

import { TaskAggregate } from '../aggregates/TaskAggregate';
import { TaskId } from '../value-objects/TaskId';
import { TaskTitle } from '../value-objects/TaskTitle';
import { TaskDescription } from '../value-objects/TaskDescription';
import { TaskStatus } from '../value-objects/TaskStatus';
import { TaskPriority } from '../value-objects/TaskPriority';
import { DateTime } from '../value-objects/DateTime';
import { DomainEvent } from '../events/DomainEvent';

/**
 * 任务分配事件
 */
export class TaskAssignedEvent implements DomainEvent {
  readonly timestamp: Date;
  readonly taskId: string;
  readonly userId: string;

  constructor(taskId: string, userId: string) {
    this.timestamp = new Date();
    this.taskId = taskId;
    this.userId = userId;
  }

  get eventName(): string {
    return 'task.assigned';
  }
}

/**
 * 任务优先级变更事件
 */
export class TaskPriorityChangedEvent implements DomainEvent {
  readonly timestamp: Date;
  readonly taskId: string;
  readonly oldPriority: string;
  readonly newPriority: string;

  constructor(taskId: string, oldPriority: string, newPriority: string) {
    this.timestamp = new Date();
    this.taskId = taskId;
    this.oldPriority = oldPriority;
    this.newPriority = newPriority;
  }

  get eventName(): string {
    return 'task.priority-changed';
  }
}

/**
 * 任务截止日期变更事件
 */
export class TaskDueDateChangedEvent implements DomainEvent {
  readonly timestamp: Date;
  readonly taskId: string;
  readonly oldDueDate?: Date;
  readonly newDueDate?: Date;

  constructor(taskId: string, oldDueDate?: Date, newDueDate?: Date) {
    this.timestamp = new Date();
    this.taskId = taskId;
    this.oldDueDate = oldDueDate;
    this.newDueDate = newDueDate;
  }

  get eventName(): string {
    return 'task.due-date-changed';
  }
}

/**
 * 任务标签添加事件
 */
export class TaskTagAddedEvent implements DomainEvent {
  readonly timestamp: Date;
  readonly taskId: string;
  readonly tag: string;

  constructor(taskId: string, tag: string) {
    this.timestamp = new Date();
    this.taskId = taskId;
    this.tag = tag;
  }

  get eventName(): string {
    return 'task.tag-added';
  }
}

/**
 * 任务标签移除事件
 */
export class TaskTagRemovedEvent implements DomainEvent {
  readonly timestamp: Date;
  readonly taskId: string;
  readonly tag: string;

  constructor(taskId: string, tag: string) {
    this.timestamp = new Date();
    this.taskId = taskId;
    this.tag = tag;
  }

  get eventName(): string {
    return 'task.tag-removed';
  }
}

/**
 * 任务领域服务
 */
export class TaskDomainService {
  /**
   * 创建任务
   */
  createTask(
    title: string,
    description?: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
    dueDate?: Date,
    estimatedPomodoros?: number,
    tags?: string[],
    userId?: string
  ): TaskAggregate {
    // 创建值对象
    const taskTitle = new TaskTitle(title);
    const taskDescription = description ? new TaskDescription(description) : undefined;
    const taskPriority = new TaskPriority(priority);
    const taskDueDate = dueDate ? new DateTime(dueDate) : undefined;

    // 创建任务聚合
    const task = TaskAggregate.create({
      title: taskTitle,
      description: taskDescription,
      status: new TaskStatus('not-started'),
      priority: taskPriority,
      dueDate: taskDueDate,
      estimatedPomodoros,
      tags,
    });

    // 如果指定了用户ID，添加任务分配事件
    if (userId) {
      task.addDomainEvent(
        new TaskAssignedEvent(
          task.id?.toString() || '',
          userId
        )
      );
    }

    return task;
  }

  /**
   * 更新任务优先级
   */
  updateTaskPriority(task: TaskAggregate, priority: 'low' | 'medium' | 'high' | 'urgent'): void {
    const oldPriority = task.priority.value;
    const newPriority = new TaskPriority(priority);

    if (!task.priority.equals(newPriority)) {
      task.updatePriority(newPriority);

      // 添加优先级变更事件
      task.addDomainEvent(
        new TaskPriorityChangedEvent(
          task.id?.toString() || '',
          oldPriority,
          priority
        )
      );
    }
  }

  /**
   * 更新任务截止日期
   */
  updateTaskDueDate(task: TaskAggregate, dueDate?: Date): void {
    const oldDueDate = task.dueDate?.value;
    const newDueDate = dueDate ? new DateTime(dueDate) : undefined;

    if (!task.dueDate?.equals(newDueDate)) {
      task.updateDueDate(newDueDate);

      // 添加截止日期变更事件
      task.addDomainEvent(
        new TaskDueDateChangedEvent(
          task.id?.toString() || '',
          oldDueDate,
          dueDate
        )
      );
    }
  }

  /**
   * 添加任务标签
   */
  addTaskTag(task: TaskAggregate, tag: string): void {
    if (!task.tags.includes(tag)) {
      task.addTag(tag);

      // 添加标签添加事件
      task.addDomainEvent(
        new TaskTagAddedEvent(
          task.id?.toString() || '',
          tag
        )
      );
    }
  }

  /**
   * 移除任务标签
   */
  removeTaskTag(task: TaskAggregate, tag: string): void {
    if (task.tags.includes(tag)) {
      task.removeTag(tag);

      // 添加标签移除事件
      task.addDomainEvent(
        new TaskTagRemovedEvent(
          task.id?.toString() || '',
          tag
        )
      );
    }
  }

  /**
   * 分配任务给用户
   */
  assignTask(task: TaskAggregate, userId: string): void {
    // 添加任务分配事件
    task.addDomainEvent(
      new TaskAssignedEvent(
        task.id?.toString() || '',
        userId
      )
    );
  }

  /**
   * 计算任务优先级分数
   * 用于任务排序和推荐
   */
  calculateTaskPriorityScore(task: TaskAggregate): number {
    let score = 0;

    // 基础优先级分数
    switch (task.priority.value) {
      case 'urgent':
        score += 100;
        break;
      case 'high':
        score += 75;
        break;
      case 'medium':
        score += 50;
        break;
      case 'low':
        score += 25;
        break;
    }

    // 状态影响
    switch (task.status.value) {
      case 'not-started':
        score += 20;
        break;
      case 'in-progress':
        score += 10;
        break;
      case 'completed':
        score -= 50;
        break;
    }

    // 截止日期影响
    if (task.dueDate) {
      const now = new Date();
      const dueDate = task.dueDate.value;
      const diffTime = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        // 已过期
        score += 80;
      } else if (diffDays === 0) {
        // 今天到期
        score += 60;
      } else if (diffDays <= 3) {
        // 3天内到期
        score += 40;
      } else if (diffDays <= 7) {
        // 一周内到期
        score += 20;
      }
    }

    // 进度影响
    if (task.estimatedPomodoros && task.estimatedPomodoros > 0) {
      const progress = task.progress;
      if (progress < 25) {
        score += 15; // 刚开始的任务
      } else if (progress > 75) {
        score += 10; // 接近完成的任务
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 检查任务是否可以开始
   */
  canStartTask(task: TaskAggregate): boolean {
    // 已完成的任务不能开始
    if (task.isCompleted) {
      return false;
    }

    // 已在进行的任务不能再次开始
    if (task.status.value === 'in-progress') {
      return false;
    }

    return true;
  }

  /**
   * 检查任务是否可以完成
   */
  canCompleteTask(task: TaskAggregate): boolean {
    // 已完成的任务不能再次完成
    if (task.isCompleted) {
      return false;
    }

    // 未开始的任务不能直接完成
    if (task.status.value === 'not-started') {
      return false;
    }

    return true;
  }

  /**
   * 检查任务是否过期
   */
  isTaskOverdue(task: TaskAggregate): boolean {
    if (!task.dueDate || task.isCompleted) {
      return false;
    }

    const now = new Date();
    return task.dueDate.value < now;
  }

  /**
   * 检查任务是否即将到期
   */
  isTaskDueSoon(task: TaskAggregate, days: number = 1): boolean {
    if (!task.dueDate || task.isCompleted) {
      return false;
    }

    const now = new Date();
    const dueDate = task.dueDate.value;
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays >= 0 && diffDays <= days;
  }

  /**
   * 获取任务状态转换历史
   */
  getTaskStatusHistory(task: TaskAggregate): Array<{
    status: string;
    timestamp: Date;
  }> {
    // 这里可以从任务的事件历史中提取状态变更信息
    // 实际实现可能需要从事件存储中获取
    return [
      {
        status: task.status.value,
        timestamp: task.updatedAt?.value || new Date(),
      },
      // 可以添加更多历史状态
    ];
  }
}
