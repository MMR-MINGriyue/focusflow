/**
 * 聚合根基类
 * 提供聚合根的基本功能
 */

import { DomainEvent } from '../events/DomainEvent';

/**
 * 聚合根基类
 */
export abstract class AggregateRoot<T> {
  private _domainEvents: DomainEvent[] = [];

  /**
   * 获取领域事件
   */
  get domainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  /**
   * 添加领域事件
   * @param event 领域事件
   */
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * 清除领域事件
   */
  public clearDomainEvents(): void {
    this._domainEvents = [];
  }

  /**
   * 获取聚合根ID
   */
  abstract get id(): any;

  /**
   * 检查两个聚合根是否相等
   * @param other 另一个聚合根
   */
  public equals(other: AggregateRoot<T>): boolean {
    if (other === null || other === undefined) {
      return false;
    }

    if (this === other) {
      return true;
    }

    return this.id === other.id;
  }
}
