/**
 * 事件分发器
 * 负责分发领域事件到相应的处理器
 */

import { DomainEvent } from '../../domain/events/DomainEvent';
import { EventHandler } from '../events/EventHandler';
import { container } from '../../container/IoCContainer';

export class EventDispatcher {
  private handlers: Map<string, EventHandler[]> = new Map();

  /**
   * 注册事件处理器
   * @param eventName 事件名称
   * @param handler 事件处理器
   */
  register(eventName: string, handler: EventHandler): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }

    this.handlers.get(eventName)!.push(handler);
  }

  /**
   * 取消注册事件处理器
   * @param eventName 事件名称
   * @param handler 事件处理器
   */
  unregister(eventName: string, handler: EventHandler): void {
    const eventHandlers = this.handlers.get(eventName);
    if (eventHandlers) {
      const index = eventHandlers.indexOf(handler);
      if (index !== -1) {
        eventHandlers.splice(index, 1);
      }

      if (eventHandlers.length === 0) {
        this.handlers.delete(eventName);
      }
    }
  }

  /**
   * 分发事件
   * @param event 领域事件
   */
  async dispatch(event: DomainEvent): Promise<void> {
    const eventName = event.eventName;
    const eventHandlers = this.handlers.get(eventName);

    if (eventHandlers && eventHandlers.length > 0) {
      // 依次调用所有处理器
      for (const handler of eventHandlers) {
        try {
          await handler.handle(event);
        } catch (error) {
          console.error(`Error handling event ${eventName}:`, error);
          // 可以选择继续执行其他处理器，或者停止执行
        }
      }
    }
  }

  /**
   * 清除所有事件处理器
   */
  clear(): void {
    this.handlers.clear();
  }

  /**
   * 获取已注册的事件名称列表
   */
  getRegisteredEvents(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * 获取特定事件的处理器数量
   * @param eventName 事件名称
   */
  getHandlerCount(eventName: string): number {
    const handlers = this.handlers.get(eventName);
    return handlers ? handlers.length : 0;
  }
}

// 创建全局事件分发器实例
export const eventDispatcher = new EventDispatcher();
