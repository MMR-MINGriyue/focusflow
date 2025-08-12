export interface TaskPriority {
  level: 'low' | 'medium' | 'high' | 'urgent';
  order: number;
}

export interface TaskStatus {
  state: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  completedAt?: Date;
}

export class Task {
  private id: string;
  private title: string;
  private description: string;
  private priority: TaskPriority;
  private status: TaskStatus;
  private estimatedPomodoros: number;
  private actualPomodoros: number;
  private createdAt: Date;
  private updatedAt: Date;
  private tags: string[];
  private projectId?: string;

  constructor(
    id: string,
    title: string,
    description: string = '',
    priority: TaskPriority = { level: 'medium', order: 2 },
    estimatedPomodoros: number = 1,
    projectId?: string
  ) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.priority = priority;
    this.status = { state: 'todo' };
    this.estimatedPomodoros = estimatedPomodoros;
    this.actualPomodoros = 0;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.tags = [];
    this.projectId = projectId;
  }

  start(): void {
    if (this.status.state !== 'todo') {
      throw new Error('Task is not in todo state');
    }
    this.status.state = 'in_progress';
    this.updatedAt = new Date();
  }

  complete(): void {
    if (this.status.state !== 'in_progress') {
      throw new Error('Task is not in progress');
    }
    this.status.state = 'completed';
    this.status.completedAt = new Date();
    this.updatedAt = new Date();
  }

  cancel(): void {
    if (this.status.state === 'completed') {
      throw new Error('Cannot cancel completed task');
    }
    this.status.state = 'cancelled';
    this.updatedAt = new Date();
  }

  incrementPomodoro(): void {
    this.actualPomodoros++;
    this.updatedAt = new Date();
  }

  updatePriority(priority: TaskPriority): void {
    this.priority = priority;
    this.updatedAt = new Date();
  }

  updateTitle(title: string): void {
    this.title = title;
    this.updatedAt = new Date();
  }

  updateDescription(description: string): void {
    this.description = description;
    this.updatedAt = new Date();
  }

  updateEstimatedPomodoros(estimated: number): void {
    this.estimatedPomodoros = estimated;
    this.updatedAt = new Date();
  }

  addTag(tag: string): void {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      this.updatedAt = new Date();
    }
  }

  removeTag(tag: string): void {
    this.tags = this.tags.filter(t => t !== tag);
    this.updatedAt = new Date();
  }

  getId(): string {
    return this.id;
  }

  getTitle(): string {
    return this.title;
  }

  getDescription(): string {
    return this.description;
  }

  getPriority(): TaskPriority {
    return this.priority;
  }

  getStatus(): TaskStatus {
    return this.status;
  }

  getEstimatedPomodoros(): number {
    return this.estimatedPomodoros;
  }

  getActualPomodoros(): number {
    return this.actualPomodoros;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getTags(): string[] {
    return [...this.tags];
  }

  getProjectId(): string | undefined {
    return this.projectId;
  }

  isCompleted(): boolean {
    return this.status.state === 'completed';
  }

  isInProgress(): boolean {
    return this.status.state === 'in_progress';
  }

  getCompletionRate(): number {
    if (this.estimatedPomodoros === 0) return 0;
    return Math.min(this.actualPomodoros / this.estimatedPomodoros, 1);
  }
}