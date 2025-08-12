/**
 * 更新任务用例
 * 处理更新任务的业务逻辑
 */

import { TaskAggregate } from '../../domain/aggregates/TaskAggregate';
import { TaskAggregateRepository } from '../../domain/repositories/TaskAggregateRepository';
import { TaskId } from '../../domain/value-objects/TaskId';
import { TaskTitle } from '../../domain/value-objects/TaskTitle';
import { TaskDescription } from '../../domain/value-objects/TaskDescription';
import { TaskStatus } from '../../domain/value-objects/TaskStatus';
import { TaskPriority } from '../../domain/value-objects/TaskPriority';
import { DateTime } from '../../domain/value-objects/DateTime';
import { container } from '../../container/IoCContainer';

export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  status?: 'not-started' | 'in-progress' | 'completed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  estimatedPomodoros?: number;
  tags?: string[];
}

export interface UpdateTaskOutput {
  taskId: string;
  title: string;
  status: string;
  priority: string;
  updatedAt: Date;
}

export class UpdateTaskUseCase {
  private taskRepository: TaskAggregateRepository;

  constructor() {
    this.taskRepository = container.resolve<TaskAggregateRepository>('taskAggregateRepository');
  }

  async execute(input: UpdateTaskInput): Promise<UpdateTaskOutput> {
    // 验证输入
    if (!input.id) {
      throw new Error('Task ID is required');
    }

    // 查找任务
    const task = await this.taskRepository.findById(new TaskId(input.id));
    if (!task) {
      throw new Error(`Task with ID ${input.id} not found`);
    }

    // 更新任务属性
    if (input.title !== undefined) {
      if (input.title.trim() === '') {
        throw new Error('Task title cannot be empty');
      }
      task.updateTitle(new TaskTitle(input.title));
    }

    if (input.description !== undefined) {
      const description = input.description ? new TaskDescription(input.description) : undefined;
      task.updateDescription(description);
    }

    if (input.status !== undefined) {
      const status = new TaskStatus(input.status);

      // 根据状态执行相应操作
      if (input.status === 'completed' && !task.isCompleted) {
        task.complete();
      } else if (input.status === 'in-progress' && task.isCompleted) {
        task.reopen();
      } else if (input.status === 'in-progress' && task.status.value === 'not-started') {
        task.start();
      }
    }

    if (input.priority !== undefined) {
      task.updatePriority(new TaskPriority(input.priority));
    }

    if (input.dueDate !== undefined) {
      const dueDate = input.dueDate ? new DateTime(input.dueDate) : undefined;
      task.updateDueDate(dueDate);
    }

    if (input.estimatedPomodoros !== undefined) {
      task.updateEstimatedPomodoros(input.estimatedPomodoros);
    }

    if (input.tags !== undefined) {
      // 先移除所有标签，再添加新标签
      const currentTags = [...task.tags];
      for (const tag of currentTags) {
        task.removeTag(tag);
      }

      // 添加新标签
      for (const tag of input.tags) {
        task.addTag(tag);
      }
    }

    // 保存任务
    await this.taskRepository.save(task);

    // 返回结果
    return {
      taskId: task.id?.toString() || '',
      title: task.title.value,
      status: task.status.value,
      priority: task.priority.value,
      updatedAt: task.updatedAt?.value || new Date(),
    };
  }
}
