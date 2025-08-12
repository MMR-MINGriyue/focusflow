/**
 * 任务描述值对象
 * 表示任务的描述，具有验证和格式化功能
 */

export class TaskDescription {
  private readonly _value: string;

  constructor(value: string = '') {
    // 描述可以为空，但不能超过500个字符
    if (value && value.length > 500) {
      throw new Error('任务描述不能超过500个字符');
    }

    this._value = value ? value.trim() : '';
  }

  get value(): string {
    return this._value;
  }

  get isEmpty(): boolean {
    return this._value.length === 0;
  }

  equals(other: TaskDescription): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
