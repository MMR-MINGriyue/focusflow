/**
 * 测试辅助工具
 * 提供统一的测试工具和Mock函数
 */

import { jest } from '@jest/globals';

// 创建Jest兼容的vi对象，用于替换vitest的vi
export const vi = {
  fn: jest.fn,
  spyOn: jest.spyOn,
  mock: jest.mock,
  clearAllMocks: jest.clearAllMocks,
  restoreAllMocks: jest.restoreAllMocks,
  useFakeTimers: () => jest.useFakeTimers(),
  useRealTimers: () => jest.useRealTimers(),
  setSystemTime: (time: Date) => jest.setSystemTime(time),
  stubGlobal: (name: string, value: any) => {
    (global as any)[name] = value;
  }
};

// 导出常用的测试工具
export { jest };
export { describe, it, expect, beforeEach, afterEach } from '@jest/globals';