/**
 * 增强的测试工具库
 * 提供测试辅助函数、模拟对象和测试断言功能
 */

import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ReactElement } from 'react';

/**
 * 测试选项
 */
export interface TestOptions {
  /**
   * 是否启用严格模式
   */
  strict?: boolean;
  /**
   * 是否启用错误边界
   */
  errorBoundary?: boolean;
  /**
   * 路由配置
   */
  router?: any;
  /**
   * 状态管理配置
   */
  state?: any;
  /**
   * API配置
   */
  api?: any;
}

/**
 * 渲染组件并返回增强的测试结果
 */
export function renderWithProviders(
  ui: ReactElement,
  options: TestOptions = {},
  renderOptions: Omit<RenderOptions, 'wrapper'> = {}
): RenderResult & {
  /**
   * 获取容器
   */
  container: HTMLElement;
  /**
   * 获取基础元素
   */
  baseElement: HTMLElement;
  /**
   * 调试
   */
  debug: (element?: HTMLElement) => void;
  /**
   * 卸载
   */
  unmount: () => void;
  /**
   * 重新渲染
   */
  rerender: (ui: ReactElement) => void;
  /**
   * 获取文本内容
   */
  getTextContent: (selector?: string) => string;
  /**
   * 等待元素出现
   */
  waitForElement: (selector: string, options?: { timeout?: number }) => Promise<HTMLElement>;
  /**
   * 等待元素消失
   */
  waitForElementToBeRemoved: (selector: string, options?: { timeout?: number }) => Promise<void>;
  /**
   * 触发事件
   */
  fireEvent: (element: Element, event: string, options?: any) => void;
  /**
   * 模拟点击
   */
  click: (element: Element | string) => void;
  /**
   * 模拟输入
   */
  type: (element: Element | string, text: string) => void;
  /**
   * 模拟悬停
   */
  hover: (element: Element | string) => void;
  /**
   * 模拟离开
   */
  leave: (element: Element | string) => void;
  /**
   * 模拟焦点
   */
  focus: (element: Element | string) => void;
  /**
   * 模拟失焦
   */
  blur: (element: Element | string) => void;
} {
  // 渲染组件
  const result = render(ui, renderOptions);

  // 获取文本内容
  const getTextContent = (selector?: string): string => {
    const element = selector ? result.container.querySelector(selector) : result.container;
    return element ? element.textContent || '' : '';
  };

  // 等待元素出现
  const waitForElement = async (selector: string, options: { timeout?: number } = {}): Promise<HTMLElement> => {
    const { timeout = 5000 } = options;

    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const checkElement = () => {
        const element = result.container.querySelector(selector);
        if (element) {
          resolve(element as HTMLElement);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error(`Element "${selector}" not found within ${timeout}ms`));
        } else {
          setTimeout(checkElement, 100);
        }
      };

      checkElement();
    });
  };

  // 等待元素消失
  const waitForElementToBeRemoved = async (selector: string, options: { timeout?: number } = {}): Promise<void> => {
    const { timeout = 5000 } = options;

    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const checkElement = () => {
        const element = result.container.querySelector(selector);
        if (!element) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error(`Element "${selector}" still exists after ${timeout}ms`));
        } else {
          setTimeout(checkElement, 100);
        }
      };

      checkElement();
    });
  };

  // 触发事件
  const fireEvent = (element: Element, event: string, options?: any): void => {
    const eventObj = new Event(event, { bubbles: true, cancelable: true, ...options });
    element.dispatchEvent(eventObj);
  };

  // 模拟点击
  const click = (element: Element | string): void => {
    const target = typeof element === 'string' ? result.container.querySelector(element) : element;
    if (!target) {
      throw new Error(`Element not found: ${element}`);
    }
    fireEvent(target, 'click');
  };

  // 模拟输入
  const type = (element: Element | string, text: string): void => {
    const target = typeof element === 'string' ? result.container.querySelector(element) : element;
    if (!target) {
      throw new Error(`Element not found: ${element}`);
    }
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
      throw new Error(`Element is not an input or textarea: ${element}`);
    }

    target.value = text;
    fireEvent(target, 'input');
  };

  // 模拟悬停
  const hover = (element: Element | string): void => {
    const target = typeof element === 'string' ? result.container.querySelector(element) : element;
    if (!target) {
      throw new Error(`Element not found: ${element}`);
    }
    fireEvent(target, 'mouseover');
  };

  // 模拟离开
  const leave = (element: Element | string): void => {
    const target = typeof element === 'string' ? result.container.querySelector(element) : element;
    if (!target) {
      throw new Error(`Element not found: ${element}`);
    }
    fireEvent(target, 'mouseout');
  };

  // 模拟焦点
  const focus = (element: Element | string): void => {
    const target = typeof element === 'string' ? result.container.querySelector(element) : element;
    if (!target) {
      throw new Error(`Element not found: ${element}`);
    }
    fireEvent(target, 'focus');
  };

  // 模拟失焦
  const blur = (element: Element | string): void => {
    const target = typeof element === 'string' ? result.container.querySelector(element) : element;
    if (!target) {
      throw new Error(`Element not found: ${element}`);
    }
    fireEvent(target, 'blur');
  };

  return {
    ...result,
    getTextContent,
    waitForElement,
    waitForElementToBeRemoved,
    fireEvent,
    click,
    type,
    hover,
    leave,
    focus,
    blur,
  };
}

/**
 * 创建模拟函数
 */
export function createMockFunction<T extends (...args: any[]) => any>(
  implementation?: T
): jest.MockedFunction<T> {
  return jest.fn(implementation) as jest.MockedFunction<T>;
}

/**
 * 创建模拟对象
 */
export function createMockObject<T extends object>(template: Partial<T> = {}): T {
  const mock: any = {};

  for (const key in template) {
    if (template.hasOwnProperty(key)) {
      const value = template[key as keyof T];

      if (typeof value === 'function') {
        mock[key] = jest.fn(value);
      } else {
        mock[key] = value;
      }
    }
  }

  return mock as T;
}

/**
 * 创建模拟Promise
 */
export function createMockPromise<T>(
  result: T,
  shouldReject = false,
  delay = 0
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    setTimeout(() => {
      if (shouldReject) {
        reject(result);
      } else {
        resolve(result);
      }
    }, delay);
  });
}

/**
 * 创建模拟响应
 */
export function createMockResponse<T>(
  data: T,
  status = 200,
  statusText = 'OK'
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(JSON.stringify(data)),
    blob: jest.fn().mockResolvedValue(new Blob([JSON.stringify(data)])),
    arrayBuffer: jest.fn().mockResolvedValue(new TextEncoder().encode(JSON.stringify(data)).buffer),
    headers: new Headers(),
    redirected: false,
    type: 'basic',
    url: '',
    clone: jest.fn(),
    body: null,
    bodyUsed: false,
  } as Response;
}

/**
 * 创建模拟API客户端
 */
export function createMockApiClient() {
  return {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    head: jest.fn(),
    options: jest.fn(),
    request: jest.fn(),
    addRequestInterceptor: jest.fn(),
    addResponseInterceptor: jest.fn(),
    removeRequestInterceptor: jest.fn(),
    removeResponseInterceptor: jest.fn(),
    clearCache: jest.fn(),
  };
}

/**
 * 创建模拟路由
 */
export function createMockRouter() {
  return {
    getCurrentRoute: jest.fn(),
    navigateToPath: jest.fn(),
    navigateToName: jest.fn(),
    goBack: jest.fn(),
    goForward: jest.fn(),
    registerRoute: jest.fn(),
    unregisterRoute: jest.fn(),
    addGuard: jest.fn(),
    removeGuard: jest.fn(),
    addRouteListener: jest.fn(),
    removeRouteListener: jest.fn(),
    destroy: jest.fn(),
  };
}

/**
 * 创建模拟存储
 */
export function createMockStore() {
  return {
    createStore: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    sync: jest.fn(),
    destroy: jest.fn(),
  };
}

/**
 * 创建模拟模型
 */
export function createMockModel() {
  return {
    registerModel: jest.fn(),
    unregisterModel: jest.fn(),
    getModel: jest.fn(),
    createInstance: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    query: jest.fn(),
    transaction: jest.fn(),
    destroy: jest.fn(),
  };
}

/**
 * 等待条件满足
 */
export function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 5000, interval = 100 } = options;

  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkCondition = async () => {
      try {
        const result = await condition();
        if (result) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Condition not met within timeout'));
        } else {
          setTimeout(checkCondition, interval);
        }
      } catch (error) {
        reject(error);
      }
    };

    checkCondition();
  });
}

/**
 * 等待一段时间
 */
export function waitForDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 清除所有模拟
 */
export function clearAllMocks(): void {
  jest.clearAllMocks();
}

/**
 * 重置所有模拟
 */
export function resetAllMocks(): void {
  jest.resetAllMocks();
}

/**
 * 恢复所有模拟
 */
export function restoreAllMocks(): void {
  jest.restoreAllMocks();
}

/**
 * 设置模拟时间
 */
export function useFakeTimers(): () => void {
  jest.useFakeTimers();
  return () => jest.useRealTimers();
}

/**
 * 设置模拟系统时间
 */
export function setMockSystemTime(date: Date | string | number): void {
  jest.setSystemTime(date);
}

/**
 * 快进时间
 */
export function advanceTimersByTime(ms: number): void {
  jest.advanceTimersByTime(ms);
}

/**
 * 运行所有待处理的定时器
 */
export function runAllTimers(): void {
  jest.runAllTimers();
}

/**
 * 运行挂起的定时器
 */
export function runOnlyPendingTimers(): void {
  jest.runOnlyPendingTimers();
}

/**
 * 测试辅助函数集合
 */
export const TestUtils = {
  renderWithProviders,
  createMockFunction,
  createMockObject,
  createMockPromise,
  createMockResponse,
  createMockApiClient,
  createMockRouter,
  createMockStore,
  createMockModel,
  waitFor,
  waitForDelay,
  clearAllMocks,
  resetAllMocks,
  restoreAllMocks,
  useFakeTimers,
  setMockSystemTime,
  advanceTimersByTime,
  runAllTimers,
  runOnlyPendingTimers,
};

export default TestUtils;
