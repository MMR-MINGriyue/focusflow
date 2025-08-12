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
  createSlot: jest.fn(() => ({
    Slot: 'div',
    Slottable: 'div'
  }))
}));

// Mock other Radix UI components
jest.mock('@radix-ui/react-primitive', () => ({
  Primitive: {
    div: 'div',
    button: 'button',
    span: 'span'
  }
}));

jest.mock('@radix-ui/react-switch', () => ({
  Root: 'div',
  Thumb: 'div'
}));

jest.mock('@radix-ui/react-slider', () => ({
  Root: 'div',
  Track: 'div',
  Range: 'div',
  Thumb: 'div'
}));

jest.mock('@radix-ui/react-progress', () => ({
  Root: 'div',
  Indicator: 'div'
}));

jest.mock('@radix-ui/react-tabs', () => ({
  Root: 'div',
  List: 'div',
  Trigger: 'button',
  Content: 'div'
}));

jest.mock('@radix-ui/react-dialog', () => ({
  Root: 'div',
  Portal: ({ children }: any) => children,
  Overlay: 'div',
  Content: 'div',
  Title: 'h2',
  Description: 'p',
  Close: 'button',
  Trigger: 'button'
}));

jest.mock('@radix-ui/react-alert-dialog', () => ({
  Root: 'div',
  Portal: ({ children }: any) => children,
  Overlay: 'div',
  Content: 'div',
  Title: 'h2',
  Description: 'p',
  Cancel: 'button',
  Action: 'button',
  Trigger: 'button'
}));

jest.mock('@radix-ui/react-dropdown-menu', () => ({
  Root: 'div',
  Trigger: 'button',
  Portal: ({ children }: any) => children,
  Content: 'div',
  Item: 'div',
  Separator: 'div',
  Label: 'div',
  Group: 'div'
}));

jest.mock('@radix-ui/react-tooltip', () => ({
  Provider: ({ children }: any) => children,
  Root: 'div',
  Trigger: 'div',
  Portal: ({ children }: any) => children,
  Content: 'div',
  Arrow: 'div'
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
  writable: true,
  configurable: true,
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => []),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
    clearResourceTimings: jest.fn(),
    getEntries: jest.fn(() => []),
    setResourceTimingBufferSize: jest.fn(),
    toJSON: jest.fn(() => ({})),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  },
});

// Setup console spy for testing
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
};

// Mock timer style service - using absolute path from src
const mockTimerStyleService = {
  getCurrentStyle: jest.fn(() => ({
    id: 'digital-modern',
    name: 'Digital Modern',
    displayStyle: 'digital',
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      background: '#ffffff',
      text: '#1e293b'
    },
    layout: {
      alignment: 'center',
      spacing: 'normal'
    },
    animations: {
      enabled: true,
      transitionDuration: 300
    }
  })),
  getStyleForState: jest.fn((state) => ({
    id: `${state}-style`,
    name: `${state} Style`,
    displayStyle: 'digital',
    colors: {
      primary: state === 'focus' ? '#22c55e' : state === 'break' ? '#ef4444' : '#f59e0b',
      secondary: '#64748b',
      background: '#ffffff',
      text: '#1e293b'
    }
  })),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  setCurrentStyle: jest.fn(),
  getAllStyles: jest.fn(() => []),
  getPresetStyles: jest.fn(() => []),
  getCustomStyles: jest.fn(() => []),
  addCustomStyle: jest.fn(),
  updateCustomStyle: jest.fn(),
  deleteCustomStyle: jest.fn(),
  exportSettings: jest.fn(() => '{}'),
  importSettings: jest.fn(() => true),
  applyStyle: jest.fn()
};

// Note: timerStyle service mocks are defined in individual test files
// due to path resolution issues in the global setup

// Setup DOM container for testing (only for React component tests)
beforeEach(() => {
  // Only setup DOM for React component tests that need it
  if (typeof document !== 'undefined' && document.createElement && document.body) {
    try {
      // Create a div element to serve as the container for React components
      const div = document.createElement('div');
      if (div && typeof div.setAttribute === 'function') {
        div.setAttribute('id', 'root');
        document.body.appendChild(div);
      }
    } catch (error) {
      // Silently ignore DOM setup errors for non-React tests
    }
  }
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  // Clean up DOM (only if document is available)
  if (typeof document !== 'undefined' && document.body && typeof document.body.innerHTML !== 'undefined') {
    try {
      document.body.innerHTML = '';
    } catch (error) {
      // Silently ignore cleanup errors
    }
  }
});
