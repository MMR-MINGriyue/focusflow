/**
 * 领域事件接口
 * 定义领域事件的基本结构
 */

/**
 * 领域事件接口
 */
export interface DomainEvent {
  /**
   * 事件名称
   */
  readonly eventName: string;

  /**
   * 事件发生时间戳
   */
  readonly timestamp: Date;

  /**
   * 事件ID
   */
  readonly eventId?: string;

  /**
   * 事件版本
   */
  readonly version?: number;

  /**
   * 事件来源
   */
  readonly source?: string;
}

/**
 * 领域事件处理器接口
 */
export interface DomainEventHandler<T extends DomainEvent> {
  /**
   * 处理领域事件
   * @param event 领域事件
   */
  handle(event: T): Promise<void>;
}

/**
 * 领域事件发布器接口
 */
export interface DomainEventPublisher {
  /**
   * 发布领域事件
   * @param event 领域事件
   */
  publish(event: DomainEvent): Promise<void>;
}

/**
 * 领域事件订阅器接口
 */
export interface DomainEventSubscriber {
  /**
   * 订阅领域事件
   * @param eventName 事件名称
   * @param handler 事件处理器
   */
  subscribe<T extends DomainEvent>(eventName: string, handler: DomainEventHandler<T>): void;

  /**
   * 取消订阅领域事件
   * @param eventName 事件名称
   * @param handler 事件处理器
   */
  unsubscribe<T extends DomainEvent>(eventName: string, handler: DomainEventHandler<T>): void;
}
