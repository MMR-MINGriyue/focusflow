/**
 * 创建任务用例
 * 处理创建任务的业务逻辑
 */

import { TaskAggregate } from '../../domain/aggregates/TaskAggregate';
import { TaskAggregateRepository } from '../../domain/repositories/TaskAggregateRepository';
import { TaskTitle } from '../../domain/value-objects/TaskTitle';
import { TaskDescription } from '../../domain/value-objects/TaskDescription';
import { TaskStatus } from '../../domain/value-objects/TaskStatus';
import { TaskPriority } from '../../domain/value-objects/TaskPriority';
import { DateTime } from '../../domain/value-objects/DateTime';
import { container } from '../../container/IoCContainer';

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  estimatedPomodoros?: number;
  tags?: string[];
  userId?: string;
}

export interface CreateTaskOutput {
  taskId: string;
  title: string;
  status: string;
  priority: string;
  createdAt: Date;
}

export class CreateTaskUseCase {
  private taskRepository: TaskAggregateRepository;

  constructor() {
    this.taskRepository = container.resolve<TaskAggregateRepository>('taskAggregateRepository');
  }

  async execute(input: CreateTaskInput): Promise<CreateTaskOutput> {
    // 验证输入
    if (!input.title || input.title.trim() === '') {
      throw new Error('Task title is required');
    }

    // 创建值对象
    const title = new TaskTitle(input.title);
    const description = input.description ? new TaskDescription(input.description) : undefined;
    const priority = input.priority ? new TaskPriority(input.priority) : new TaskPriority('medium');
    const dueDate = input.dueDate ? new DateTime(input.dueDate) : undefined;

    // 创建任务聚合
    const task = TaskAggregate.create({
      title,
      description,
      status: new TaskStatus('not-started'),
      priority,
      dueDate,
      estimatedPomodoros: input.estimatedPomodoros,
      tags: input.tags,
    });

    // 保存任务
    await this.taskRepository.save(task);

    // 返回结果
    return {
      taskId: task.id?.toString() || '',
      title: task.title.value,
      status: task.status.value,
      priority: task.priority.value,
      createdAt: task.createdAt?.value || new Date(),
    };
  }
}
