/**
 * 事件处理器接口
 * 定义处理领域事件的接口
 */

import { DomainEvent } from '../../domain/events/DomainEvent';

/**
 * 事件处理器接口
 */
export interface EventHandler {
  /**
   * 处理领域事件
   * @param event 领域事件
   */
  handle(event: DomainEvent): Promise<void>;
}

/**
 * 事件处理器装饰器
 * 用于自动注册事件处理器
 * @param eventName 事件名称
 */
export function Handles(eventName: string) {
  return function <T extends { new(...args: any[]): EventHandler }>(constructor: T) {
    const handler = new constructor();

    // 注册到事件分发器
    const { eventDispatcher } = require('./EventDispatcher');
    eventDispatcher.register(eventName, handler);

    return constructor;
  };
}
