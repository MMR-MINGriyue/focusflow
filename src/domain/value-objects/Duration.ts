/**
 * 持续时间值对象
 * 表示时间段的长度
 */

export class Duration {
  private readonly _milliseconds: number;

  constructor(milliseconds: number) {
    if (milliseconds < 0) {
      throw new Error('Duration cannot be negative');
    }
    this._milliseconds = milliseconds;
  }

  get milliseconds(): number {
    return this._milliseconds;
  }

  get seconds(): number {
    return Math.floor(this._milliseconds / 1000);
  }

  get minutes(): number {
    return Math.floor(this._milliseconds / (1000 * 60));
  }

  get hours(): number {
    return Math.floor(this._milliseconds / (1000 * 60 * 60));
  }

  get days(): number {
    return Math.floor(this._milliseconds / (1000 * 60 * 60 * 24));
  }

  /**
   * 格式化持续时间为 MM:SS 格式
   */
  toMinutesSeconds(): string {
    const totalSeconds = this.seconds;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * 格式化持续时间为 HH:MM:SS 格式
   */
  toHoursMinutesSeconds(): string {
    const totalSeconds = this.seconds;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * 添加另一个持续时间
   */
  add(other: Duration): Duration {
    return new Duration(this._milliseconds + other._milliseconds);
  }

  /**
   * 减去另一个持续时间
   */
  subtract(other: Duration): Duration {
    const result = this._milliseconds - other._milliseconds;
    if (result < 0) {
      throw new Error('Duration cannot be negative');
    }
    return new Duration(result);
  }

  /**
   * 乘以一个系数
   */
  multiply(factor: number): Duration {
    if (factor < 0) {
      throw new Error('Multiplication factor cannot be negative');
    }
    return new Duration(this._milliseconds * factor);
  }

  /**
   * 除以一个系数
   */
  divide(divisor: number): Duration {
    if (divisor <= 0) {
      throw new Error('Divisor must be positive');
    }
    return new Duration(this._milliseconds / divisor);
  }

  /**
   * 比较两个持续时间是否相等
   */
  equals(other: Duration): boolean {
    return this._milliseconds === other._milliseconds;
  }

  /**
   * 比较当前持续时间是否大于另一个
   */
  greaterThan(other: Duration): boolean {
    return this._milliseconds > other._milliseconds;
  }

  /**
   * 比较当前持续时间是否小于另一个
   */
  lessThan(other: Duration): boolean {
    return this._milliseconds < other._milliseconds;
  }

  /**
   * 从秒数创建持续时间
   */
  static fromSeconds(seconds: number): Duration {
    return new Duration(seconds * 1000);
  }

  /**
   * 从分钟数创建持续时间
   */
  static fromMinutes(minutes: number): Duration {
    return new Duration(minutes * 1000 * 60);
  }

  /**
   * 从小时数创建持续时间
   */
  static fromHours(hours: number): Duration {
    return new Duration(hours * 1000 * 60 * 60);
  }

  /**
   * 从天创建持续时间
   */
  static fromDays(days: number): Duration {
    return new Duration(days * 1000 * 60 * 60 * 24);
  }

  /**
   * 创建零持续时间
   */
  static zero(): Duration {
    return new Duration(0);
  }
}
