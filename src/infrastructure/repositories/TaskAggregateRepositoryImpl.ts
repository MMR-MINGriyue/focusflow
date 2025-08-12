/**
 * 任务聚合仓储实现
 * 实现任务聚合的持久化操作
 */

import { TaskAggregate } from '../../domain/aggregates/TaskAggregate';
import { TaskAggregateRepository, TaskQueryParams, TaskStats } from '../../domain/repositories/TaskAggregateRepository';
import { TaskId } from '../../domain/value-objects/TaskId';
import { TaskStatus } from '../../domain/value-objects/TaskStatus';
import { TaskPriority } from '../../domain/value-objects/TaskPriority';
import { DateTime } from '../../domain/value-objects/DateTime';
import { UUID } from '../../domain/value-objects/UUID';
import { StorageService } from '../services/StorageService';
import { container } from '../../container/IoCContainer';
import { EventDispatcher } from '../events/EventDispatcher';

/**
 * 任务数据传输对象
 */
interface TaskDTO {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  estimatedPomodoros?: number;
  actualPomodoros?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  tags?: string[];
  sessions?: any[];
}

/**
 * 任务聚合仓储实现
 */
export class TaskAggregateRepositoryImpl implements TaskAggregateRepository {
  private storageService: StorageService;
  private eventDispatcher: EventDispatcher;
  private readonly STORAGE_KEY = 'focus-flow-tasks';

  constructor() {
    this.storageService = container.resolve<StorageService>('storageService');
    this.eventDispatcher = container.resolve<EventDispatcher>('eventDispatcher');
  }

  async save(task: TaskAggregate): Promise<void> {
    try {
      // 将聚合转换为DTO
      const dto = this.aggregateToDTO(task);

      // 获取现有任务
      const tasks = await this.getAllTasks();

      // 查找并更新或添加任务
      const index = tasks.findIndex(t => t.id === dto.id);
      if (index >= 0) {
        tasks[index] = dto;
      } else {
        tasks.push(dto);
      }

      // 保存到存储
      await this.storageService.setItem(this.STORAGE_KEY, tasks);

      // 分发领域事件
      for (const event of task.domainEvents) {
        await this.eventDispatcher.dispatch(event);
      }

      // 清除领域事件
      task.clearDomainEvents();
    } catch (error) {
      console.error('Failed to save task:', error);
      throw new Error(`Failed to save task: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findById(id: TaskId | string): Promise<TaskAggregate | null> {
    try {
      const taskId = id instanceof TaskId ? id : new TaskId(id);
      const tasks = await this.getAllTasks();
      const taskDTO = tasks.find(t => t.id === taskId.toString());

      if (!taskDTO) {
        return null;
      }

      return this.dtoToAggregate(taskDTO);
    } catch (error) {
      console.error('Failed to find task by ID:', error);
      throw new Error(`Failed to find task by ID: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findAll(params?: TaskQueryParams): Promise<TaskAggregate[]> {
    try {
      let tasks = await this.getAllTasks();

      // 应用查询参数
      if (params) {
        tasks = this.applyQueryParams(tasks, params);
      }

      // 转换为聚合
      return tasks.map(dto => this.dtoToAggregate(dto));
    } catch (error) {
      console.error('Failed to find all tasks:', error);
      throw new Error(`Failed to find all tasks: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async count(params?: TaskQueryParams): Promise<number> {
    try {
      let tasks = await this.getAllTasks();

      // 应用查询参数
      if (params) {
        tasks = this.applyQueryParams(tasks, params);
      }

      return tasks.length;
    } catch (error) {
      console.error('Failed to count tasks:', error);
      throw new Error(`Failed to count tasks: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async delete(task: TaskAggregate | TaskId | string): Promise<void> {
    try {
      let taskId: string;

      if (task instanceof TaskAggregate) {
        taskId = task.id?.toString() || '';
      } else if (task instanceof TaskId) {
        taskId = task.toString();
      } else {
        taskId = task;
      }

      if (!taskId) {
        throw new Error('Invalid task ID');
      }

      // 获取现有任务
      const tasks = await this.getAllTasks();

      // 过滤掉要删除的任务
      const filteredTasks = tasks.filter(t => t.id !== taskId);

      // 保存到存储
      await this.storageService.setItem(this.STORAGE_KEY, filteredTasks);
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw new Error(`Failed to delete task: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getStats(): Promise<TaskStats> {
    try {
      const tasks = await this.getAllTasks();
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      let total = tasks.length;
      let completed = 0;
      let inProgress = 0;
      let notStarted = 0;
      let overdue = 0;
      let dueToday = 0;
      let dueThisWeek = 0;
      let estimatedPomodoros = 0;
      let actualPomodoros = 0;

      for (const task of tasks) {
        // 统计状态
        if (task.status === 'completed') {
          completed++;
        } else if (task.status === 'in-progress') {
          inProgress++;
        } else {
          notStarted++;
        }

        // 统计番茄钟
        estimatedPomodoros += task.estimatedPomodoros || 0;
        actualPomodoros += task.actualPomodoros || 0;

        // 统计截止日期
        if (task.dueDate) {
          const dueDate = new Date(task.dueDate);

          if (dueDate < now && task.status !== 'completed') {
            overdue++;
          }

          if (dueDate.toDateString() === today.toDateString()) {
            dueToday++;
          }

          if (dueDate >= today && dueDate <= nextWeek) {
            dueThisWeek++;
          }
        }
      }

      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        total,
        completed,
        inProgress,
        notStarted,
        overdue,
        dueToday,
        dueThisWeek,
        estimatedPomodoros,
        actualPomodoros,
        completionRate
      };
    } catch (error) {
      console.error('Failed to get task stats:', error);
      throw new Error(`Failed to get task stats: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findByUserId(userId: UUID | string, params?: TaskQueryParams): Promise<TaskAggregate[]> {
    // 在实际实现中，这里会根据用户ID过滤任务
    // 当前实现简化处理，直接返回所有任务
    return this.findAll(params);
  }

  async findByTag(tag: string, params?: TaskQueryParams): Promise<TaskAggregate[]> {
    try {
      let tasks = await this.getAllTasks();

      // 过滤包含指定标签的任务
      tasks = tasks.filter(t => t.tags?.includes(tag));

      // 应用其他查询参数
      if (params) {
        tasks = this.applyQueryParams(tasks, params);
      }

      // 转换为聚合
      return tasks.map(dto => this.dtoToAggregate(dto));
    } catch (error) {
      console.error('Failed to find tasks by tag:', error);
      throw new Error(`Failed to find tasks by tag: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findOverdue(params?: TaskQueryParams): Promise<TaskAggregate[]> {
    try {
      const now = new Date();
      let tasks = await this.getAllTasks();

      // 过滤过期且未完成的任务
      tasks = tasks.filter(t => {
        if (!t.dueDate || t.status === 'completed') {
          return false;
        }
        return new Date(t.dueDate) < now;
      });

      // 应用其他查询参数
      if (params) {
        tasks = this.applyQueryParams(tasks, params);
      }

      // 转换为聚合
      return tasks.map(dto => this.dtoToAggregate(dto));
    } catch (error) {
      console.error('Failed to find overdue tasks:', error);
      throw new Error(`Failed to find overdue tasks: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findDueToday(params?: TaskQueryParams): Promise<TaskAggregate[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      let tasks = await this.getAllTasks();

      // 过滤今日到期的任务
      tasks = tasks.filter(t => {
        if (!t.dueDate) {
          return false;
        }
        const dueDate = new Date(t.dueDate);
        return dueDate >= today && dueDate < tomorrow;
      });

      // 应用其他查询参数
      if (params) {
        tasks = this.applyQueryParams(tasks, params);
      }

      // 转换为聚合
      return tasks.map(dto => this.dtoToAggregate(dto));
    } catch (error) {
      console.error('Failed to find tasks due today:', error);
      throw new Error(`Failed to find tasks due today: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findDueThisWeek(params?: TaskQueryParams): Promise<TaskAggregate[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      let tasks = await this.getAllTasks();

      // 过滤本周到期的任务
      tasks = tasks.filter(t => {
        if (!t.dueDate) {
          return false;
        }
        const dueDate = new Date(t.dueDate);
        return dueDate >= today && dueDate <= nextWeek;
      });

      // 应用其他查询参数
      if (params) {
        tasks = this.applyQueryParams(tasks, params);
      }

      // 转换为聚合
      return tasks.map(dto => this.dtoToAggregate(dto));
    } catch (error) {
      console.error('Failed to find tasks due this week:', error);
      throw new Error(`Failed to find tasks due this week: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取所有任务
   */
  private async getAllTasks(): Promise<TaskDTO[]> {
    try {
      const tasks = await this.storageService.getItem<TaskDTO[]>(this.STORAGE_KEY);
      return tasks || [];
    } catch (error) {
      console.error('Failed to get all tasks:', error);
      return [];
    }
  }

  /**
   * 应用查询参数
   */
  private applyQueryParams(tasks: TaskDTO[], params: TaskQueryParams): TaskDTO[] {
    let result = [...tasks];

    // 状态过滤
    if (params.status) {
      const status = params.status instanceof TaskStatus ? params.status.value : params.status;
      result = result.filter(t => t.status === status);
    }

    // 优先级过滤
    if (params.priority) {
      const priority = params.priority instanceof TaskPriority ? params.priority.value : params.priority;
      result = result.filter(t => t.priority === priority);
    }

    // 截止日期过滤
    if (params.dueBefore) {
      result = result.filter(t => {
        if (!t.dueDate) return false;
        return new Date(t.dueDate) <= params.dueBefore!.value;
      });
    }

    if (params.dueAfter) {
      result = result.filter(t => {
        if (!t.dueDate) return false;
        return new Date(t.dueDate) >= params.dueAfter!.value;
      });
    }

    // 标签过滤
    if (params.tags && params.tags.length > 0) {
      result = result.filter(t => 
        t.tags && params.tags!.some(tag => t.tags!.includes(tag))
      );
    }

    // 搜索过滤
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(searchLower) || 
        (t.description && t.description.toLowerCase().includes(searchLower))
      );
    }

    // 排序
    if (params.sortBy) {
      result.sort((a, b) => {
        let valueA: any, valueB: any;

        switch (params.sortBy) {
          case 'createdAt':
            valueA = new Date(a.createdAt).getTime();
            valueB = new Date(b.createdAt).getTime();
            break;
          case 'updatedAt':
            valueA = new Date(a.updatedAt).getTime();
            valueB = new Date(b.updatedAt).getTime();
            break;
          case 'dueDate':
            valueA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
            valueB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
            break;
          case 'priority':
            const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            valueA = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
            valueB = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
            break;
          case 'title':
            valueA = a.title.toLowerCase();
            valueB = b.title.toLowerCase();
            break;
          default:
            valueA = a.title.toLowerCase();
            valueB = b.title.toLowerCase();
        }

        if (valueA < valueB) return params.sortOrder === 'asc' ? -1 : 1;
        if (valueA > valueB) return params.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // 分页
    if (params.offset !== undefined) {
      result = result.slice(params.offset);
    }

    if (params.limit !== undefined) {
      result = result.slice(0, params.limit);
    }

    return result;
  }

  /**
   * 将聚合转换为DTO
   */
  private aggregateToDTO(aggregate: TaskAggregate): TaskDTO {
    return {
      id: aggregate.id?.toString() || '',
      title: aggregate.title.value,
      description: aggregate.description?.value,
      status: aggregate.status.value,
      priority: aggregate.priority.value,
      dueDate: aggregate.dueDate?.toISOString(),
      estimatedPomodoros: aggregate.estimatedPomodoros,
      actualPomodoros: aggregate.actualPomodoros,
      createdAt: aggregate.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: aggregate.updatedAt?.toISOString() || new Date().toISOString(),
      completedAt: aggregate.completedAt?.toISOString(),
      tags: aggregate.tags,
      sessions: aggregate.sessions.map(session => ({
        id: session.id?.toString(),
        startTime: session.startTime.toISOString(),
        endTime: session.endTime?.toISOString(),
        mode: session.mode,
        states: session.states.map(state => ({
          state: state.state,
          startTime: state.startTime.toISOString(),
          endTime: state.endTime?.toISOString(),
          duration: state.duration.inSeconds(),
          completed: state.completed
        })),
        efficiencyRating: session.efficiencyRating?.value,
        tags: session.tags,
        notes: session.notes
      }))
    };
  }

  /**
   * 将DTO转换为聚合
   */
  private dtoToAggregate(dto: TaskDTO): TaskAggregate {
    // 创建任务聚合
    const task = new TaskAggregate({
      id: new TaskId(dto.id),
      title: new TaskTitle(dto.title),
      description: dto.description ? new TaskDescription(dto.description) : undefined,
      status: new TaskStatus(dto.status),
      priority: new TaskPriority(dto.priority),
      dueDate: dto.dueDate ? DateTime.fromISOString(dto.dueDate) : undefined,
      estimatedPomodoros: dto.estimatedPomodoros,
      actualPomodoros: dto.actualPomodoros,
      createdAt: DateTime.fromISOString(dto.createdAt),
      updatedAt: DateTime.fromISOString(dto.updatedAt),
      completedAt: dto.completedAt ? DateTime.fromISOString(dto.completedAt) : undefined,
      tags: dto.tags
    });

    // 添加会话（简化处理）
    if (dto.sessions) {
      for (const sessionDTO of dto.sessions) {
        // 这里简化处理，实际应用中应该完整重建TimerSession对象
        // 由于TimerSession的构造较为复杂，这里只做示意
      }
    }

    return task;
  }
}
