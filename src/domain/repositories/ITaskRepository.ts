import { Task } from '../entities/Task';

export interface TaskData {
  id: string;
  title: string;
  description: string;
  priority: {
    level: 'low' | 'medium' | 'high' | 'urgent';
    order: number;
  };
  status: {
    state: 'todo' | 'in_progress' | 'completed' | 'cancelled';
    completedAt?: Date;
  };
  estimatedPomodoros: number;
  actualPomodoros: number;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  projectId?: string;
  userId: string;
}

export interface ITaskRepository {
  save(task: Task, userId: string): Promise<void>;
  findById(id: string): Promise<Task | null>;
  findByUserId(userId: string): Promise<Task[]>;
  findByProjectId(projectId: string): Promise<Task[]>;
  findByStatus(status: 'todo' | 'in_progress' | 'completed' | 'cancelled', userId: string): Promise<Task[]>;
  delete(id: string): Promise<void>;
  update(id: string, task: Task): Promise<void>;
  findActiveTasks(userId: string): Promise<Task[]>;
  findCompletedTasks(userId: string, limit?: number): Promise<Task[]>;
}