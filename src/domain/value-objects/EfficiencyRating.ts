/**
 * 效率评分值对象
 * 表示用户对专注会话的效率评分
 */

export class EfficiencyRating {
  private readonly _value: number;

  constructor(value: number) {
    if (value < 1 || value > 5) {
      throw new Error('Efficiency rating must be between 1 and 5');
    }
    this._value = value;
  }

  get value(): number {
    return this._value;
  }

  /**
   * 获取评级的文本描述
   */
  get description(): string {
    switch (this._value) {
      case 1:
        return '非常低效';
      case 2:
        return '低效';
      case 3:
        return '一般';
      case 4:
        return '高效';
      case 5:
        return '非常高效';
      default:
        return '未知';
    }
  }

  /**
   * 获取评级的表情符号
   */
  get emoji(): string {
    switch (this._value) {
      case 1:
        return '😫';
      case 2:
        return '😔';
      case 3:
        return '😐';
      case 4:
        return '😊';
      case 5:
        return '🤩';
      default:
        return '❓';
    }
  }

  /**
   * 获取评级的颜色
   */
  get color(): string {
    switch (this._value) {
      case 1:
        return '#ef4444'; // red-500
      case 2:
        return '#f97316'; // orange-500
      case 3:
        return '#eab308'; // yellow-500
      case 4:
        return '#22c55e'; // green-500
      case 5:
        return '#10b981'; // emerald-500
      default:
        return '#6b7280'; // gray-500
    }
  }

  /**
   * 比较两个效率评分是否相等
   */
  equals(other: EfficiencyRating): boolean {
    return this._value === other._value;
  }

  /**
   * 比较当前评分是否高于另一个
   */
  greaterThan(other: EfficiencyRating): boolean {
    return this._value > other._value;
  }

  /**
   * 比较当前评分是否低于另一个
   */
  lessThan(other: EfficiencyRating): boolean {
    return this._value < other._value;
  }

  /**
   * 创建效率评分
   */
  static create(value: number): EfficiencyRating {
    return new EfficiencyRating(value);
  }

  /**
   * 从文本描述创建效率评分
   */
  static fromDescription(description: string): EfficiencyRating {
    switch (description.toLowerCase()) {
      case '非常低效':
        return new EfficiencyRating(1);
      case '低效':
        return new EfficiencyRating(2);
      case '一般':
        return new EfficiencyRating(3);
      case '高效':
        return new EfficiencyRating(4);
      case '非常高效':
        return new EfficiencyRating(5);
      default:
        throw new Error(`Invalid efficiency rating description: ${description}`);
    }
  }

  /**
   * 获取所有可能的效率评分
   */
  static all(): EfficiencyRating[] {
    return [
      new EfficiencyRating(1),
      new EfficiencyRating(2),
      new EfficiencyRating(3),
      new EfficiencyRating(4),
      new EfficiencyRating(5)
    ];
  }
}
