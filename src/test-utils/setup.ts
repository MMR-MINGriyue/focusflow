/**
 * 测试环境设置
 * 配置Jest和测试工具
 */

import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { TextEncoder, TextDecoder } from 'util';

// 配置Testing Library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
  computedStyleSupportsPseudoElements: true
});

// 全局测试环境设置
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.options = options;
  }
  
  callback: IntersectionObserverCallback;
  options?: IntersectionObserverInit;
  
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  
  callback: ResizeObserverCallback;
  
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
};

// Mock MutationObserver
global.MutationObserver = class MutationObserver {
  constructor(callback: MutationCallback) {
    this.callback = callback;
  }
  
  callback: MutationCallback;
  
  observe = jest.fn();
  disconnect = jest.fn();
  takeRecords = jest.fn(() => []);
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock
});

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(() => 'mock-url'),
});

Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: jest.fn(),
});

// Mock performance API
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024,
    totalJSHeapSize: 100 * 1024 * 1024,
    jsHeapSizeLimit: 2 * 1024 * 1024 * 1024
  }
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true
});

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// Mock requestIdleCallback
global.requestIdleCallback = jest.fn(cb => setTimeout(cb, 0));
global.cancelIdleCallback = jest.fn(id => clearTimeout(id));

// Mock Notification API
global.Notification = class Notification {
  constructor(title: string, options?: NotificationOptions) {
    this.title = title;
    this.body = options?.body || '';
    this.icon = options?.icon || '';
  }
  
  title: string;
  body: string;
  icon: string;
  onclick: ((this: Notification, ev: Event) => any) | null = null;
  onclose: ((this: Notification, ev: Event) => any) | null = null;
  onerror: ((this: Notification, ev: Event) => any) | null = null;
  onshow: ((this: Notification, ev: Event) => any) | null = null;
  
  close = jest.fn();
  
  static permission: NotificationPermission = 'granted';
  static requestPermission = jest.fn(() => Promise.resolve('granted' as NotificationPermission));
};

// Mock AudioContext
global.AudioContext = class AudioContext {
  constructor() {
    this.state = 'running';
    this.sampleRate = 44100;
    this.currentTime = 0;
  }
  
  state: AudioContextState = 'running';
  sampleRate: number;
  currentTime: number;
  
  createOscillator = jest.fn();
  createGain = jest.fn();
  createAnalyser = jest.fn();
  createBuffer = jest.fn();
  createBufferSource = jest.fn();
  decodeAudioData = jest.fn();
  suspend = jest.fn();
  resume = jest.fn();
  close = jest.fn();
};

// Mock Web Audio API
global.webkitAudioContext = global.AudioContext;

// Mock console methods for cleaner test output
const originalError = console.error;
const originalWarn = console.warn;

beforeEach(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  console.error = originalError;
  console.warn = originalWarn;
  jest.clearAllMocks();
});

// Global test helpers
export const mockTimers = () => {
  jest.useFakeTimers();
  return () => jest.useRealTimers();
};

export const mockDate = (date: string | Date) => {
  const mockDate = new Date(date);
  const originalDate = Date;
  
  global.Date = class extends Date {
    constructor(...args: any[]) {
      if (args.length === 0) {
        return mockDate;
      }
      return new originalDate(...args);
    }
    
    static now() {
      return mockDate.getTime();
    }
  } as any;
  
  return () => {
    global.Date = originalDate;
  };
};

export const mockWindowSize = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  
  // Trigger resize event
  window.dispatchEvent(new Event('resize'));
};

export const mockUserAgent = (userAgent: string) => {
  Object.defineProperty(navigator, 'userAgent', {
    writable: true,
    value: userAgent,
  });
};

// Cleanup after all tests
afterAll(() => {
  jest.restoreAllMocks();
});