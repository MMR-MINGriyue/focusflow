/**
 * 任务标题值对象
 * 表示任务的标题，具有验证和格式化功能
 */

export class TaskTitle {
  private readonly _value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('任务标题不能为空');
    }

    if (value.length > 100) {
      throw new Error('任务标题不能超过100个字符');
    }

    this._value = value.trim();
  }

  get value(): string {
    return this._value;
  }

  equals(other: TaskTitle): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
