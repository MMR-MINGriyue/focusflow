/**
 * 任务聚合仓储接口
 * 定义任务聚合的持久化操作
 */

import { TaskAggregate } from '../aggregates/TaskAggregate';
import { TaskId } from '../value-objects/TaskId';
import { TaskStatus } from '../value-objects/TaskStatus';
import { TaskPriority } from '../value-objects/TaskPriority';
import { DateTime } from '../value-objects/DateTime';
import { UUID } from '../value-objects/UUID';

/**
 * 任务查询参数
 */
export interface TaskQueryParams {
  status?: TaskStatus | string;
  priority?: TaskPriority | string;
  dueBefore?: DateTime;
  dueAfter?: DateTime;
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'title';
  sortOrder?: 'asc' | 'desc';
}

/**
 * 任务统计信息
 */
export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
  estimatedPomodoros: number;
  actualPomodoros: number;
  completionRate: number;
}

/**
 * 任务聚合仓储接口
 */
export interface TaskAggregateRepository {
  /**
   * 保存任务聚合
   */
  save(task: TaskAggregate): Promise<void>;

  /**
   * 根据ID查找任务聚合
   */
  findById(id: TaskId | string): Promise<TaskAggregate | null>;

  /**
   * 查找所有任务聚合
   */
  findAll(params?: TaskQueryParams): Promise<TaskAggregate[]>;

  /**
   * 查找任务聚合数量
   */
  count(params?: TaskQueryParams): Promise<number>;

  /**
   * 删除任务聚合
   */
  delete(task: TaskAggregate | TaskId | string): Promise<void>;

  /**
   * 获取任务统计信息
   */
  getStats(): Promise<TaskStats>;

  /**
   * 查找用户的任务聚合
   */
  findByUserId(userId: UUID | string, params?: TaskQueryParams): Promise<TaskAggregate[]>;

  /**
   * 查找特定标签的任务聚合
   */
  findByTag(tag: string, params?: TaskQueryParams): Promise<TaskAggregate[]>;

  /**
   * 查找过期的任务聚合
   */
  findOverdue(params?: TaskQueryParams): Promise<TaskAggregate[]>;

  /**
   * 查找今日到期的任务聚合
   */
  findDueToday(params?: TaskQueryParams): Promise<TaskAggregate[]>;

  /**
   * 查找本周到期的任务聚合
   */
  findDueThisWeek(params?: TaskQueryParams): Promise<TaskAggregate[]>;
}
