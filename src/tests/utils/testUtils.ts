/**
 * 测试工具函数库
 * 
 * 提供通用的测试辅助函数，简化测试代码编写
 * 包含组件渲染、事件模拟、数据生成、断言辅助等功能
 */

import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from '@testing-library/react';

// ==================== TYPE DEFINITIONS ====================

export interface TestUser {
  click: (element: Element) => Promise<void>;
  type: (element: Element, text: string) => Promise<void>;
  keyboard: (keys: string) => Promise<void>;
  tab: () => Promise<void>;
  clear: (element: Element) => Promise<void>;
  selectOptions: (element: Element, values: string | string[]) => Promise<void>;
  upload: (element: Element, files: File | File[]) => Promise<void>;
}

export interface MockTimerControls {
  advanceTime: (ms: number) => void;
  runAllTimers: () => void;
  runOnlyPendingTimers: () => void;
  clearAllTimers: () => void;
}

export interface TestDataOptions {
  count?: number;
  prefix?: string;
  includeTimestamp?: boolean;
  includeId?: boolean;
}

// ==================== COMPONENT RENDERING UTILITIES ====================

/**
 * 创建用户事件处理器，配置了合适的默认选项
 */
export const createTestUser = (): TestUser => {
  const user = userEvent.setup({ 
    advanceTimers: jest.advanceTimersByTime,
    delay: null // 禁用默认延迟以加快测试速度
  });

  return {
    click: async (element: Element) => {
      await user.click(element);
    },
    type: async (element: Element, text: string) => {
      await user.type(element, text);
    },
    keyboard: async (keys: string) => {
      await user.keyboard(keys);
    },
    tab: async () => {
      await user.tab();
    },
    clear: async (element: Element) => {
      await user.clear(element);
    },
    selectOptions: async (element: Element, values: string | string[]) => {
      await user.selectOptions(element, values);
    },
    upload: async (element: Element, files: File | File[]) => {
      await user.upload(element, files);
    },
  };
};

/**
 * 渲染组件的增强版本，包含常用的测试配置
 */
export const renderWithDefaults = (
  ui: React.ReactElement,
  options: RenderOptions = {}
): RenderResult & { user: TestUser } => {
  const user = createTestUser();
  const result = render(ui, {
    // 可以在这里添加通用的 wrapper，如 Provider
    ...options,
  });

  return {
    ...result,
    user,
  };
};

/**
 * 渲染组件并等待异步操作完成
 */
export const renderAndWait = async (
  ui: React.ReactElement,
  options: RenderOptions = {}
): Promise<RenderResult & { user: TestUser }> => {
  let result: RenderResult & { user: TestUser };
  
  await act(async () => {
    result = renderWithDefaults(ui, options);
  });

  return result!;
};

// ==================== TIMER UTILITIES ====================

/**
 * 创建模拟计时器控制器
 */
export const createMockTimers = (): MockTimerControls => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  return {
    advanceTime: (ms: number) => {
      act(() => {
        jest.advanceTimersByTime(ms);
      });
    },
    runAllTimers: () => {
      act(() => {
        jest.runAllTimers();
      });
    },
    runOnlyPendingTimers: () => {
      act(() => {
        jest.runOnlyPendingTimers();
      });
    },
    clearAllTimers: () => {
      jest.clearAllTimers();
    },
  };
};

// ==================== DATA GENERATION UTILITIES ====================

/**
 * 生成测试用的计时器设置数据
 */
export const generateTimerSettings = (overrides = {}) => ({
  focusDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
  enableNotifications: true,
  enableSounds: true,
  autoStartBreaks: false,
  autoStartFocus: false,
  volume: 0.5,
  ...overrides,
});

/**
 * 生成测试用的计时器样式数据
 */
export const generateTimerStyle = (overrides = {}) => ({
  id: 'test-style',
  name: 'Test Style',
  description: 'Test style description',
  displayStyle: 'digital' as const,
  colors: {
    primary: '#3b82f6',
    secondary: '#64748b',
    background: '#ffffff',
    text: '#1e293b',
  },
  layout: {
    alignment: 'center' as const,
    spacing: 'normal' as const,
  },
  animations: {
    enabled: true,
    transitionDuration: 300,
  },
  ...overrides,
});

/**
 * 生成测试用的用户数据
 */
export const generateUserData = (overrides = {}) => ({
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  preferences: generateTimerSettings(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

/**
 * 生成测试用的会话数据
 */
export const generateSessionData = (overrides = {}) => ({
  id: 'test-session-id',
  type: 'focus' as const,
  duration: 1500, // 25 minutes in seconds
  startTime: Date.now(),
  endTime: Date.now() + 1500000,
  completed: true,
  rating: 4,
  ...overrides,
});

/**
 * 生成批量测试数据
 */
export const generateTestDataArray = <T>(
  generator: (index: number) => T,
  options: TestDataOptions = {}
): T[] => {
  const { count = 5 } = options;
  return Array.from({ length: count }, (_, index) => generator(index));
};

// ==================== MOCK UTILITIES ====================

/**
 * 创建模拟的 localStorage
 */
export const createMockLocalStorage = () => {
  const store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    },
  };
};

/**
 * 创建模拟的文件对象
 */
export const createMockFile = (
  name: string,
  content: string,
  type = 'text/plain'
): File => {
  const blob = new Blob([content], { type });
  return new File([blob], name, { type });
};

/**
 * 创建模拟的音频服务
 */
export const createMockAudioService = () => ({
  play: jest.fn(),
  pause: jest.fn(),
  stop: jest.fn(),
  setVolume: jest.fn(),
  loadSound: jest.fn(),
  isPlaying: jest.fn(() => false),
  getDuration: jest.fn(() => 0),
  getCurrentTime: jest.fn(() => 0),
});

/**
 * 创建模拟的通知服务
 */
export const createMockNotificationService = () => ({
  show: jest.fn(),
  requestPermission: jest.fn(() => Promise.resolve('granted')),
  isSupported: jest.fn(() => true),
  getPermission: jest.fn(() => 'granted'),
});

// ==================== ASSERTION UTILITIES ====================

/**
 * 检查元素是否具有正确的可访问性属性
 */
export const expectAccessibleElement = (element: Element) => {
  expect(element).toBeInTheDocument();
  expect(element).toBeVisible();
  
  // 检查是否有适当的 ARIA 标签
  if (element.tagName === 'BUTTON') {
    expect(element).toHaveAttribute('type');
  }
  
  if (element.getAttribute('role')) {
    expect(element).toHaveAttribute('aria-label');
  }
};

/**
 * 检查表单元素的验证状态
 */
export const expectFormValidation = (
  element: Element,
  isValid: boolean,
  errorMessage?: string
) => {
  if (isValid) {
    expect(element).toBeValid();
    expect(element).not.toHaveAttribute('aria-invalid', 'true');
  } else {
    expect(element).toBeInvalid();
    expect(element).toHaveAttribute('aria-invalid', 'true');
    
    if (errorMessage) {
      expect(element).toHaveAccessibleDescription(errorMessage);
    }
  }
};

/**
 * 检查加载状态的正确显示
 */
export const expectLoadingState = (container: Element, isLoading: boolean) => {
  if (isLoading) {
    expect(container.querySelector('[data-testid="loading"]')).toBeInTheDocument();
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  } else {
    expect(container.querySelector('[data-testid="loading"]')).not.toBeInTheDocument();
    expect(container.querySelector('[aria-busy="true"]')).not.toBeInTheDocument();
  }
};

// ==================== ASYNC UTILITIES ====================

/**
 * 等待异步操作完成
 */
export const waitForAsyncOperation = async (
  operation: () => Promise<any>,
  timeout = 5000
): Promise<void> => {
  await act(async () => {
    await Promise.race([
      operation(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Operation timeout')), timeout)
      ),
    ]);
  });
};

/**
 * 等待元素出现
 */
export const waitForElement = async (
  getElement: () => Element | null,
  timeout = 5000
): Promise<Element> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const element = getElement();
    if (element) {
      return element;
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  throw new Error('Element not found within timeout');
};

/**
 * 模拟网络延迟
 */
export const simulateNetworkDelay = (ms = 100): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// ==================== CLEANUP UTILITIES ====================

/**
 * 清理测试环境
 */
export const cleanupTest = () => {
  jest.clearAllMocks();
  jest.clearAllTimers();
  
  // 清理 DOM
  document.body.innerHTML = '';
  
  // 重置模拟的 localStorage
  if (global.localStorage) {
    global.localStorage.clear();
  }
};

/**
 * 设置测试环境
 */
export const setupTest = () => {
  // 设置模拟的 localStorage
  Object.defineProperty(global, 'localStorage', {
    value: createMockLocalStorage(),
    writable: true,
  });
  
  // 设置模拟的 matchMedia
  Object.defineProperty(global, 'matchMedia', {
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
    writable: true,
  });
};

// ==================== EXPORT ALL UTILITIES ====================

export const testUtils = {
  // Rendering
  createTestUser,
  renderWithDefaults,
  renderAndWait,
  
  // Timers
  createMockTimers,
  
  // Data generation
  generateTimerSettings,
  generateTimerStyle,
  generateUserData,
  generateSessionData,
  generateTestDataArray,
  
  // Mocks
  createMockLocalStorage,
  createMockFile,
  createMockAudioService,
  createMockNotificationService,
  
  // Assertions
  expectAccessibleElement,
  expectFormValidation,
  expectLoadingState,
  
  // Async
  waitForAsyncOperation,
  waitForElement,
  simulateNetworkDelay,
  
  // Cleanup
  cleanupTest,
  setupTest,
};

export default testUtils;

// ==================== CUSTOM JEST MATCHERS ====================

/**
 * 扩展 Jest 匹配器
 */
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveCorrectTimerFormat(): R;
      toBeValidTimerState(): R;
      toHaveAccessibleStructure(): R;
    }
  }
}

// 自定义匹配器：检查计时器格式
expect.extend({
  toHaveCorrectTimerFormat(received: string) {
    const timerRegex = /^\d{1,2}:\d{2}$/;
    const pass = timerRegex.test(received);

    return {
      message: () =>
        pass
          ? `expected ${received} not to have correct timer format`
          : `expected ${received} to have correct timer format (MM:SS)`,
      pass,
    };
  },

  toBeValidTimerState(received: string) {
    const validStates = ['focus', 'break', 'longBreak', 'idle'];
    const pass = validStates.includes(received);

    return {
      message: () =>
        pass
          ? `expected ${received} not to be a valid timer state`
          : `expected ${received} to be one of: ${validStates.join(', ')}`,
      pass,
    };
  },

  toHaveAccessibleStructure(received: Element) {
    const hasRole = received.hasAttribute('role') || received.tagName.toLowerCase() in ['button', 'input', 'select', 'textarea'];
    const hasLabel = received.hasAttribute('aria-label') || received.hasAttribute('aria-labelledby') || received.querySelector('label');

    const pass = hasRole && hasLabel;

    return {
      message: () =>
        pass
          ? `expected element not to have accessible structure`
          : `expected element to have proper role and label attributes`,
      pass,
    };
  },
});
