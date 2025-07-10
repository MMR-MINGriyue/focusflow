import '@testing-library/jest-dom';

// Ensure React is available globally
import React from 'react';
(global as any).React = React;

// Mock Tauri API
const mockTauri = {
  invoke: jest.fn(),
  listen: jest.fn(),
  emit: jest.fn(),
  fs: {
    readTextFile: jest.fn(),
    writeTextFile: jest.fn(),
    exists: jest.fn(),
    createDir: jest.fn(),
    readDir: jest.fn(),
  },
  notification: {
    sendNotification: jest.fn(),
    requestPermission: jest.fn(),
  },
  window: {
    getCurrent: jest.fn(() => ({
      setTitle: jest.fn(),
      minimize: jest.fn(),
      maximize: jest.fn(),
      close: jest.fn(),
    })),
  },
  path: {
    appDataDir: jest.fn(() => Promise.resolve('/mock/app/data')),
  },
};

// Mock Tauri modules
jest.mock('@tauri-apps/api/tauri', () => mockTauri);
jest.mock('@tauri-apps/api/fs', () => mockTauri.fs);
jest.mock('@tauri-apps/api/notification', () => mockTauri.notification);
jest.mock('@tauri-apps/api/window', () => mockTauri.window);
jest.mock('@tauri-apps/api/path', () => mockTauri.path);

// Mock Howler.js
jest.mock('howler', () => ({
  Howl: jest.fn().mockImplementation(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    stop: jest.fn(),
    volume: jest.fn(),
    fade: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  })),
  Howler: {
    volume: jest.fn(),
    mute: jest.fn(),
  },
}));

// Mock Radix UI
jest.mock('@radix-ui/react-slot', () => ({
  Slot: 'div',
}));

// Mock Web APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
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
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
global.sessionStorage = localStorageMock;

// Mock crypto for random number generation
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: jest.fn().mockImplementation((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
  },
});

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => []),
  },
});

// Setup console spy for testing
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
