/**
 * 任务ID值对象
 * 提供任务唯一标识符的不可变表示
 */

export class TaskId {
  private readonly _value: string;

  constructor(value: string) {
    if (!TaskId.isValid(value)) {
      throw new Error(`Invalid TaskId: ${value}`);
    }
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  /**
   * 比较两个TaskId是否相等
   */
  equals(other: TaskId): boolean {
    return this._value === other._value;
  }

  /**
   * 转换为字符串
   */
  toString(): string {
    return this._value;
  }

  /**
   * 验证TaskId格式是否有效
   */
  static isValid(id: string): boolean {
    // 简单验证，确保非空且是字符串
    return typeof id === 'string' && id.trim().length > 0;
  }

  /**
   * 生成随机TaskId
   */
  static generate(): TaskId {
    return new TaskId(TaskId.generateIdString());
  }

  /**
   * 生成Id字符串
   */
  private static generateIdString(): string {
    // 使用时间戳和随机数生成唯一ID
    return 'task_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 从字符串创建TaskId
   */
  static fromString(value: string): TaskId {
    return new TaskId(value);
  }
}
