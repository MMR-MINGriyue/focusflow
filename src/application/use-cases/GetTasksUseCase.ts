/**
 * 获取任务列表用例
 * 处理获取任务列表的业务逻辑
 */

import { TaskAggregate } from '../../domain/aggregates/TaskAggregate';
import { TaskAggregateRepository, TaskQueryParams } from '../../domain/repositories/TaskAggregateRepository';
import { TaskStatus } from '../../domain/value-objects/TaskStatus';
import { TaskPriority } from '../../domain/value-objects/TaskPriority';
import { DateTime } from '../../domain/value-objects/DateTime';
import { container } from '../../container/IoCContainer';

export interface GetTasksInput {
  status?: 'not-started' | 'in-progress' | 'completed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueBefore?: Date;
  dueAfter?: Date;
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: Date;
  estimatedPomodoros?: number;
  actualPomodoros?: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  tags?: string[];
  progress: number;
  timeSpent: number; // 以秒为单位
}

export interface GetTasksOutput {
  tasks: TaskItem[];
  total: number;
  limit?: number;
  offset?: number;
}

export class GetTasksUseCase {
  private taskRepository: TaskAggregateRepository;

  constructor() {
    this.taskRepository = container.resolve<TaskAggregateRepository>('taskAggregateRepository');
  }

  async execute(input: GetTasksInput): Promise<GetTasksOutput> {
    // 构建查询参数
    const queryParams: TaskQueryParams = {};

    if (input.status) {
      queryParams.status = new TaskStatus(input.status);
    }

    if (input.priority) {
      queryParams.priority = new TaskPriority(input.priority);
    }

    if (input.dueBefore) {
      queryParams.dueBefore = new DateTime(input.dueBefore);
    }

    if (input.dueAfter) {
      queryParams.dueAfter = new DateTime(input.dueAfter);
    }

    if (input.tags && input.tags.length > 0) {
      queryParams.tags = input.tags;
    }

    if (input.search) {
      queryParams.search = input.search;
    }

    if (input.limit) {
      queryParams.limit = input.limit;
    }

    if (input.offset) {
      queryParams.offset = input.offset;
    }

    if (input.sortBy) {
      queryParams.sortBy = input.sortBy;
    }

    if (input.sortOrder) {
      queryParams.sortOrder = input.sortOrder;
    }

    // 获取任务列表
    const tasks = await this.taskRepository.findAll(queryParams);

    // 获取总数
    const total = await this.taskRepository.count(queryParams);

    // 转换为输出格式
    const taskItems: TaskItem[] = tasks.map(task => ({
      id: task.id?.toString() || '',
      title: task.title.value,
      description: task.description?.value,
      status: task.status.value,
      priority: task.priority.value,
      dueDate: task.dueDate?.value,
      estimatedPomodoros: task.estimatedPomodoros,
      actualPomodoros: task.actualPomodoros,
      createdAt: task.createdAt?.value || new Date(),
      updatedAt: task.updatedAt?.value || new Date(),
      completedAt: task.completedAt?.value,
      tags: task.tags,
      progress: task.progress,
      timeSpent: task.timeSpent.inSeconds(),
    }));

    // 返回结果
    return {
      tasks: taskItems,
      total,
      limit: input.limit,
      offset: input.offset,
    };
  }
}
