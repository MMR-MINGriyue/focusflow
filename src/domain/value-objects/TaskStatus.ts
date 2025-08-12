/**
 * 任务状态值对象
 * 表示任务的状态，如待办、进行中、已完成等
 */

export enum TaskStatusEnum {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export class TaskStatus {
  private readonly _value: TaskStatusEnum;

  constructor(value: TaskStatusEnum) {
    this._value = value;
  }

  get value(): TaskStatusEnum {
    return this._value;
  }

  isTodo(): boolean {
    return this._value === TaskStatusEnum.TODO;
  }

  isInProgress(): boolean {
    return this._value === TaskStatusEnum.IN_PROGRESS;
  }

  isCompleted(): boolean {
    return this._value === TaskStatusEnum.COMPLETED;
  }

  isCancelled(): boolean {
    return this._value === TaskStatusEnum.CANCELLED;
  }

  equals(other: TaskStatus): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  static fromString(value: string): TaskStatus {
    switch (value) {
      case TaskStatusEnum.TODO:
        return new TaskStatus(TaskStatusEnum.TODO);
      case TaskStatusEnum.IN_PROGRESS:
        return new TaskStatus(TaskStatusEnum.IN_PROGRESS);
      case TaskStatusEnum.COMPLETED:
        return new TaskStatus(TaskStatusEnum.COMPLETED);
      case TaskStatusEnum.CANCELLED:
        return new TaskStatus(TaskStatusEnum.CANCELLED);
      default:
        throw new Error(`无效的任务状态: ${value}`);
    }
  }

  static todo(): TaskStatus {
    return new TaskStatus(TaskStatusEnum.TODO);
  }

  static inProgress(): TaskStatus {
    return new TaskStatus(TaskStatusEnum.IN_PROGRESS);
  }

  static completed(): TaskStatus {
    return new TaskStatus(TaskStatusEnum.COMPLETED);
  }

  static cancelled(): TaskStatus {
    return new TaskStatus(TaskStatusEnum.CANCELLED);
  }
}
