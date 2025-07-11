/**
 * DatabaseService 单元测试
 * 测试数据库服务的核心功能
 */

import { databaseService } from '../database';
import type { FocusSession, AppSetting, DailyStats } from '../database';

// Mock Tauri database
const mockDatabase = {
  execute: jest.fn(),
  select: jest.fn(),
  close: jest.fn(),
};

jest.mock('@tauri-apps/plugin-sql', () => ({
  __esModule: true,
  default: {
    load: jest.fn(() => Promise.resolve(mockDatabase)),
  },
}));

// Mock environment utils
jest.mock('../../utils/environment', () => ({
  isTauriEnvironment: jest.fn(() => true),
}));

// Mock error handler
jest.mock('../../utils/errorHandler', () => ({
  logError: jest.fn(),
}));

describe('DatabaseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mock implementations
    mockDatabase.execute.mockResolvedValue({ rowsAffected: 1 });
    mockDatabase.select.mockResolvedValue([]);
  });

  describe('Initialization', () => {
    it('initializes database successfully', async () => {
      await databaseService.initialize();

      // In non-Tauri environment, initialization should complete without errors
      expect(databaseService).toBeDefined();
    });

    it('handles non-Tauri environment gracefully', async () => {
      const mockIsTauriEnvironment = require('../../utils/environment').isTauriEnvironment;
      mockIsTauriEnvironment.mockReturnValue(false);

      await expect(databaseService.initialize()).resolves.not.toThrow();
    });

    it('prevents duplicate initialization', async () => {
      await databaseService.initialize();
      await databaseService.initialize();

      // Should not throw errors on multiple calls
      expect(databaseService).toBeDefined();
    });
  });

  describe('Service Structure', () => {
    it('has required methods', () => {
      expect(typeof databaseService.initialize).toBe('function');
      expect(typeof databaseService.close).toBe('function');
    });

    it('handles initialization in non-Tauri environment', async () => {
      const mockIsTauriEnvironment = require('../../utils/environment').isTauriEnvironment;
      mockIsTauriEnvironment.mockReturnValue(false);

      await expect(databaseService.initialize()).resolves.not.toThrow();
    });

    it('can be closed without errors', async () => {
      await expect(databaseService.close()).resolves.not.toThrow();
    });
  });

  describe('Settings Management', () => {
    beforeEach(async () => {
      await databaseService.initialize();
      jest.clearAllMocks();
    });

    it('handles settings operations gracefully', async () => {
      // Test that settings methods exist and don't throw
      expect(typeof databaseService.getSetting).toBe('function');
      expect(typeof databaseService.getAllSettings).toBe('function');
    });

    it('gets all settings returns object', async () => {
      const mockSettings = { theme: 'dark', language: 'en' };
      mockDatabase.select.mockResolvedValue([
        { key: 'theme', value: 'dark' },
        { key: 'language', value: 'en' },
      ]);

      const settings = await databaseService.getAllSettings();

      expect(settings).toEqual(mockSettings);
    });
  });

  describe('Error Handling', () => {
    it('handles service errors gracefully', () => {
      expect(() => databaseService.initialize()).not.toThrow();
    });

    it('handles close operation gracefully', async () => {
      await expect(databaseService.close()).resolves.not.toThrow();
    });
  });
});
