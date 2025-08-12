/**
 * UUID值对象
 * 提供唯一标识符的不可变表示
 */

export class UUID {
  private readonly _value: string;

  constructor(value: string) {
    if (!UUID.isValid(value)) {
      throw new Error(`Invalid UUID: ${value}`);
    }
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  /**
   * 比较两个UUID是否相等
   */
  equals(other: UUID): boolean {
    return this._value === other._value;
  }

  /**
   * 转换为字符串
   */
  toString(): string {
    return this._value;
  }

  /**
   * 验证UUID格式是否有效
   */
  static isValid(uuid: string): boolean {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
  }

  /**
   * 生成随机UUID
   */
  static generate(): UUID {
    return new UUID(UUID.generateUUIDString());
  }

  /**
   * 生成UUID字符串
   */
  private static generateUUIDString(): string {
    // 使用crypto API如果可用
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    // 回退实现
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * 从字符串创建UUID
   */
  static fromString(value: string): UUID {
    return new UUID(value);
  }

  /**
   * 创建空的UUID（全零）
   */
  static empty(): UUID {
    return new UUID('00000000-0000-0000-0000-000000000000');
  }
}
