import { Task } from '../../domain/entities/Task';
import { ITaskRepository } from '../../domain/repositories/ITaskRepository';
import { IndexedDBAdapter } from '../storage/IndexedDBAdapter';

export class IndexedDBTaskRepository implements ITaskRepository {
  private dbAdapter: IndexedDBAdapter;

  constructor(dbAdapter: IndexedDBAdapter) {
    this.dbAdapter = dbAdapter;
  }

  async save(task: Task, userId: string): Promise<void> {
    const status = task.getStatus();
    const taskData = {
      id: task.getId(),
      userId,
      title: task.getTitle(),
      description: task.getDescription(),
      priority: task.getPriority(),
      status: {
        ...status,
        completedAt: status.completedAt ? status.completedAt.toISOString() : undefined
      },
      estimatedPomodoros: task.getEstimatedPomodoros(),
      actualPomodoros: task.getActualPomodoros(),
      tags: task.getTags(),
      projectId: task.getProjectId(),
      createdAt: task.getCreatedAt().toISOString(),
      updatedAt: task.getUpdatedAt().toISOString()
    };

    await this.dbAdapter.save('tasks', taskData);
  }

  async findById(id: string): Promise<Task | null> {
    const data = await this.dbAdapter.get('tasks', id);
    if (!data) return null;

    const task = new Task(
      data.id,
      data.title,
      data.description,
      data.priority,
      data.estimatedPomodoros,
      data.projectId
    );

    // Restore state
    if (data.status.state === 'in_progress') {
      task.start();
    } else if (data.status.state === 'completed') {
      task.start();
      task.complete();
    } else if (data.status.state === 'cancelled') {
      task.cancel();
    }

    // Restore pomodoro count
    for (let i = 0; i < data.actualPomodoros; i++) {
      task.incrementPomodoro();
    }

    // Restore tags
    data.tags.forEach(tag => task.addTag(tag));

    return task;
  }

  async findByUserId(userId: string): Promise<Task[]> {
    const dataList = await this.dbAdapter.getAll('tasks', 'userId', userId);
    const tasks: Task[] = [];

    for (const data of dataList) {
      const task = await this.findById(data.id);
      if (task) tasks.push(task);
    }

    return tasks;
  }

  async findByProjectId(projectId: string): Promise<Task[]> {
    const dataList = await this.dbAdapter.getAll('tasks', 'projectId', projectId);
    const tasks: Task[] = [];

    for (const data of dataList) {
      const task = await this.findById(data.id);
      if (task) tasks.push(task);
    }

    return tasks;
  }

  async findByStatus(
    status: 'todo' | 'in_progress' | 'completed' | 'cancelled',
    userId: string
  ): Promise<Task[]> {
    const allTasks = await this.findByUserId(userId);
    return allTasks.filter(task => task.getStatus().state === status);
  }

  async delete(id: string): Promise<void> {
    await this.dbAdapter.delete('tasks', id);
  }

  async update(id: string, task: Task): Promise<void> {
    const status = task.getStatus();
    const updates = {
      title: task.getTitle(),
      description: task.getDescription(),
      priority: task.getPriority(),
      status: {
        ...status,
        completedAt: status.completedAt ? status.completedAt.toISOString() : undefined
      },
      estimatedPomodoros: task.getEstimatedPomodoros(),
      actualPomodoros: task.getActualPomodoros(),
      tags: task.getTags(),
      projectId: task.getProjectId()
    };

    await this.dbAdapter.update('tasks', id, updates);
  }

  async findActiveTasks(userId: string): Promise<Task[]> {
    return this.findByStatus('in_progress', userId);
  }

  async findCompletedTasks(userId: string, limit?: number): Promise<Task[]> {
    const tasks = await this.findByStatus('completed', userId);
    return limit ? tasks.slice(0, limit) : tasks;
  }
}