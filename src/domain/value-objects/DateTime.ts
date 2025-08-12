/**
 * 日期时间值对象
 * 提供日期时间的不可变表示和操作
 */

export class DateTime {
  private readonly _date: Date;

  constructor(date: Date = new Date()) {
    this._date = new Date(date);

    // 验证日期是否有效
    if (isNaN(this._date.getTime())) {
      throw new Error('Invalid date');
    }
  }

  get date(): Date {
    // 返回日期的副本，保持不可变性
    return new Date(this._date);
  }

  get timestamp(): number {
    return this._date.getTime();
  }

  get year(): number {
    return this._date.getFullYear();
  }

  get month(): number {
    return this._date.getMonth() + 1; // 月份从0开始，所以+1
  }

  get day(): number {
    return this._date.getDate();
  }

  get hours(): number {
    return this._date.getHours();
  }

  get minutes(): number {
    return this._date.getMinutes();
  }

  get seconds(): number {
    return this._date.getSeconds();
  }

  get milliseconds(): number {
    return this._date.getMilliseconds();
  }

  /**
   * 格式化日期为 ISO 8601 字符串
   */
  toISOString(): string {
    return this._date.toISOString();
  }

  /**
   * 格式化日期为本地字符串
   */
  toLocaleString(locale?: string, options?: Intl.DateTimeFormatOptions): string {
    return this._date.toLocaleString(locale, options);
  }

  /**
   * 格式化日期为本地日期字符串
   */
  toLocaleDateString(locale?: string, options?: Intl.DateTimeFormatOptions): string {
    return this._date.toLocaleDateString(locale, options);
  }

  /**
   * 格式化日期为本地时间字符串
   */
  toLocaleTimeString(locale?: string, options?: Intl.DateTimeFormatOptions): string {
    return this._date.toLocaleTimeString(locale, options);
  }

  /**
   * 添加指定的毫秒数
   */
  addMilliseconds(milliseconds: number): DateTime {
    const newDate = new Date(this._date);
    newDate.setMilliseconds(newDate.getMilliseconds() + milliseconds);
    return new DateTime(newDate);
  }

  /**
   * 添加指定的秒数
   */
  addSeconds(seconds: number): DateTime {
    return this.addMilliseconds(seconds * 1000);
  }

  /**
   * 添加指定的分钟数
   */
  addMinutes(minutes: number): DateTime {
    return this.addMilliseconds(minutes * 60 * 1000);
  }

  /**
   * 添加指定的小时数
   */
  addHours(hours: number): DateTime {
    return this.addMilliseconds(hours * 60 * 60 * 1000);
  }

  /**
   * 添加指定的天数
   */
  addDays(days: number): DateTime {
    return this.addMilliseconds(days * 24 * 60 * 60 * 1000);
  }

  /**
   * 减去另一个日期时间
   */
  subtract(other: DateTime): Duration {
    const diff = this.timestamp - other.timestamp;
    return new Duration(diff);
  }

  /**
   * 比较两个日期时间是否相等
   */
  equals(other: DateTime): boolean {
    return this.timestamp === other.timestamp;
  }

  /**
   * 比较当前日期时间是否大于另一个
   */
  greaterThan(other: DateTime): boolean {
    return this.timestamp > other.timestamp;
  }

  /**
   * 比较当前日期时间是否小于另一个
   */
  lessThan(other: DateTime): boolean {
    return this.timestamp < other.timestamp;
  }

  /**
   * 检查日期是否是今天
   */
  isToday(): boolean {
    const now = new DateTime();
    return this.isSameDay(now);
  }

  /**
   * 检查日期是否是昨天
   */
  isYesterday(): boolean {
    const yesterday = new DateTime().addDays(-1);
    return this.isSameDay(yesterday);
  }

  /**
   * 检查日期是否是明天
   */
  isTomorrow(): boolean {
    const tomorrow = new DateTime().addDays(1);
    return this.isSameDay(tomorrow);
  }

  /**
   * 检查两个日期是否是同一天
   */
  isSameDay(other: DateTime): boolean {
    return (
      this.year === other.year &&
      this.month === other.month &&
      this.day === other.day
    );
  }

  /**
   * 创建当前日期时间
   */
  static now(): DateTime {
    return new DateTime(new Date());
  }

  /**
   * 从时间戳创建日期时间
   */
  static fromTimestamp(timestamp: number): DateTime {
    return new DateTime(new Date(timestamp));
  }

  /**
   * 从ISO字符串创建日期时间
   */
  static fromISOString(isoString: string): DateTime {
    return new DateTime(new Date(isoString));
  }

  /**
   * 从日期部分创建日期时间
   */
  static fromParts(
    year: number,
    month: number, // 1-12
    day: number,
    hours: number = 0,
    minutes: number = 0,
    seconds: number = 0,
    milliseconds: number = 0
  ): DateTime {
    const date = new Date(year, month - 1, day, hours, minutes, seconds, milliseconds);
    return new DateTime(date);
  }
}
