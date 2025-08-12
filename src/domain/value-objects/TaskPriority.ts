/**
 * 任务优先级值对象
 * 表示任务的优先级，如低、中、高等
 */

export enum TaskPriorityEnum {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export class TaskPriority {
  private readonly _value: TaskPriorityEnum;

  constructor(value: TaskPriorityEnum) {
    this._value = value;
  }

  get value(): TaskPriorityEnum {
    return this._value;
  }

  isLow(): boolean {
    return this._value === TaskPriorityEnum.LOW;
  }

  isMedium(): boolean {
    return this._value === TaskPriorityEnum.MEDIUM;
  }

  isHigh(): boolean {
    return this._value === TaskPriorityEnum.HIGH;
  }

  isUrgent(): boolean {
    return this._value === TaskPriorityEnum.URGENT;
  }

  equals(other: TaskPriority): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  static fromString(value: string): TaskPriority {
    switch (value) {
      case TaskPriorityEnum.LOW:
        return new TaskPriority(TaskPriorityEnum.LOW);
      case TaskPriorityEnum.MEDIUM:
        return new TaskPriority(TaskPriorityEnum.MEDIUM);
      case TaskPriorityEnum.HIGH:
        return new TaskPriority(TaskPriorityEnum.HIGH);
      case TaskPriorityEnum.URGENT:
        return new TaskPriority(TaskPriorityEnum.URGENT);
      default:
        throw new Error(`无效的任务优先级: ${value}`);
    }
  }

  static low(): TaskPriority {
    return new TaskPriority(TaskPriorityEnum.LOW);
  }

  static medium(): TaskPriority {
    return new TaskPriority(TaskPriorityEnum.MEDIUM);
  }

  static high(): TaskPriority {
    return new TaskPriority(TaskPriorityEnum.HIGH);
  }

  static urgent(): TaskPriority {
    return new TaskPriority(TaskPriorityEnum.URGENT);
  }
}
