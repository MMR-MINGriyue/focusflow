/**
 * Environment Utils 测试
 * 
 * 测试环境检测工具函数的所有功能
 */

import {
  isTauriEnvironment,
  isBrowserEnvironment,
  isDevelopmentEnvironment,
  isProductionEnvironment,
  safeTauriCall,
  safeTauriCallSync,
  getEnvironmentInfo,
  safeLocalStorage,
  safeConsole,
} from '../environment';

// Mock console methods
const mockConsole = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

describe('Environment Utils', () => {
  const originalConsole = global.console;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset console mock
    global.console = mockConsole as any;
  });

  afterEach(() => {
    // Restore original console
    global.console = originalConsole;

    // Clean up any window modifications
    if (typeof window !== 'undefined') {
      delete (window as any).__TAURI__;
      delete (window as any).__TAURI_IPC__;
    }
  });

  // ==================== 环境检测测试 ====================
  describe('Environment Detection', () => {
    describe('isTauriEnvironment', () => {
      it('returns true when Tauri APIs are available', () => {
        // Mock Tauri APIs on window object
        (window as any).__TAURI__ = {};
        (window as any).__TAURI_IPC__ = {};

        expect(isTauriEnvironment()).toBe(true);
      });

      it('returns false when Tauri APIs are missing', () => {
        // Ensure Tauri APIs are not present
        delete (window as any).__TAURI__;
        delete (window as any).__TAURI_IPC__;

        expect(isTauriEnvironment()).toBe(false);
      });

      it('returns false when only __TAURI__ is available', () => {
        (window as any).__TAURI__ = {};
        delete (window as any).__TAURI_IPC__;

        expect(isTauriEnvironment()).toBe(false);
      });

      it('returns false when only __TAURI_IPC__ is available', () => {
        delete (window as any).__TAURI__;
        (window as any).__TAURI_IPC__ = {};

        expect(isTauriEnvironment()).toBe(false);
      });
    });

    describe('isBrowserEnvironment', () => {
      it('returns true when window exists but Tauri APIs are missing', () => {
        delete (window as any).__TAURI__;
        delete (window as any).__TAURI_IPC__;

        expect(isBrowserEnvironment()).toBe(true);
      });

      it('returns false when in Tauri environment', () => {
        (window as any).__TAURI__ = {};
        (window as any).__TAURI_IPC__ = {};

        expect(isBrowserEnvironment()).toBe(false);
      });
    });

    describe('isDevelopmentEnvironment', () => {
      it('returns true when NODE_ENV is development', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';

        expect(isDevelopmentEnvironment()).toBe(true);

        process.env.NODE_ENV = originalEnv;
      });

      it('returns false when NODE_ENV is production', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        expect(isDevelopmentEnvironment()).toBe(false);

        process.env.NODE_ENV = originalEnv;
      });

      it('returns false when NODE_ENV is test', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'test';

        expect(isDevelopmentEnvironment()).toBe(false);

        process.env.NODE_ENV = originalEnv;
      });
    });

    describe('isProductionEnvironment', () => {
      it('returns true when NODE_ENV is production', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        expect(isProductionEnvironment()).toBe(true);

        process.env.NODE_ENV = originalEnv;
      });

      it('returns false when NODE_ENV is development', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';

        expect(isProductionEnvironment()).toBe(false);

        process.env.NODE_ENV = originalEnv;
      });
    });
  });

  // ==================== Tauri API 安全调用测试 ====================
  describe('Safe Tauri API Calls', () => {
    describe('safeTauriCall', () => {
      it('executes function in Tauri environment', async () => {
        // Setup Tauri environment
        (window as any).__TAURI__ = {};
        (window as any).__TAURI_IPC__ = {};

        const mockFunction = jest.fn().mockResolvedValue('success');
        const result = await safeTauriCall(mockFunction, 'fallback');

        expect(mockFunction).toHaveBeenCalled();
        expect(result).toBe('success');
      });

      it('returns fallback value in browser environment', async () => {
        // Setup browser environment
        delete (window as any).__TAURI__;
        delete (window as any).__TAURI_IPC__;

        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';

        const mockFunction = jest.fn();
        const result = await safeTauriCall(mockFunction, 'fallback');

        expect(mockFunction).not.toHaveBeenCalled();
        expect(result).toBe('fallback');
        expect(mockConsole.warn).toHaveBeenCalledWith(
          'Tauri API called in browser environment, using fallback'
        );

        process.env.NODE_ENV = originalEnv;
      });

      it('handles function errors gracefully', async () => {
        // Setup Tauri environment
        (window as any).__TAURI__ = {};
        (window as any).__TAURI_IPC__ = {};

        const error = new Error('API failed');
        const mockFunction = jest.fn().mockRejectedValue(error);
        const result = await safeTauriCall(mockFunction, 'fallback');

        expect(result).toBe('fallback');
        expect(mockConsole.error).toHaveBeenCalledWith('Tauri API failed:', error);
      });

      it('respects silent option', async () => {
        delete (window as any).__TAURI__;
        delete (window as any).__TAURI_IPC__;

        const mockFunction = jest.fn();
        await safeTauriCall(mockFunction, 'fallback', { silent: true });

        expect(mockConsole.warn).not.toHaveBeenCalled();
      });

      it('uses custom log prefix', async () => {
        delete (window as any).__TAURI__;
        delete (window as any).__TAURI_IPC__;

        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';

        const mockFunction = jest.fn();
        await safeTauriCall(mockFunction, 'fallback', { logPrefix: 'Custom API' });

        expect(mockConsole.warn).toHaveBeenCalledWith(
          'Custom API called in browser environment, using fallback'
        );

        process.env.NODE_ENV = originalEnv;
      });
    });

    describe('safeTauriCallSync', () => {
      it('executes function in Tauri environment', () => {
        (window as any).__TAURI__ = {};
        (window as any).__TAURI_IPC__ = {};

        const mockFunction = jest.fn().mockReturnValue('success');
        const result = safeTauriCallSync(mockFunction, 'fallback');

        expect(mockFunction).toHaveBeenCalled();
        expect(result).toBe('success');
      });

      it('returns fallback value in browser environment', () => {
        delete (window as any).__TAURI__;
        delete (window as any).__TAURI_IPC__;

        const mockFunction = jest.fn();
        const result = safeTauriCallSync(mockFunction, 'fallback');

        expect(mockFunction).not.toHaveBeenCalled();
        expect(result).toBe('fallback');
      });

      it('handles function errors gracefully', () => {
        (window as any).__TAURI__ = {};
        (window as any).__TAURI_IPC__ = {};

        const error = new Error('Sync API failed');
        const mockFunction = jest.fn().mockImplementation(() => {
          throw error;
        });
        const result = safeTauriCallSync(mockFunction, 'fallback');

        expect(result).toBe('fallback');
        expect(mockConsole.error).toHaveBeenCalledWith('Tauri API failed:', error);
      });
    });
  });

  // ==================== 环境信息获取测试 ====================
  describe('getEnvironmentInfo', () => {
    it('returns environment information', () => {
      delete (window as any).__TAURI__;
      delete (window as any).__TAURI_IPC__;

      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const info = getEnvironmentInfo();

      expect(info.isTauri).toBe(false);
      expect(info.isBrowser).toBe(true);
      expect(info.isDevelopment).toBe(true);
      expect(info.isProduction).toBe(false);
      expect(typeof info.userAgent).toBe('string');
      expect(typeof info.platform).toBe('string');

      process.env.NODE_ENV = originalEnv;
    });
  });

  // ==================== 基本功能测试 ====================
  describe('Basic Functionality', () => {
    it('safeLocalStorage functions exist and are callable', () => {
      expect(typeof safeLocalStorage.getItem).toBe('function');
      expect(typeof safeLocalStorage.setItem).toBe('function');
      expect(typeof safeLocalStorage.removeItem).toBe('function');
      expect(typeof safeLocalStorage.clear).toBe('function');
    });

    it('safeConsole functions exist and are callable', () => {
      expect(typeof safeConsole.log).toBe('function');
      expect(typeof safeConsole.warn).toBe('function');
      expect(typeof safeConsole.error).toBe('function');
      expect(typeof safeConsole.debug).toBe('function');
    });

    it('safeConsole respects environment settings', () => {
      const originalEnv = process.env.NODE_ENV;

      // Test development environment
      process.env.NODE_ENV = 'development';
      expect(() => safeConsole.log('test')).not.toThrow();
      expect(() => safeConsole.debug('test')).not.toThrow();

      // Test production environment
      process.env.NODE_ENV = 'production';
      expect(() => safeConsole.warn('test')).not.toThrow();
      expect(() => safeConsole.error('test')).not.toThrow();

      process.env.NODE_ENV = originalEnv;
    });
  });
});
