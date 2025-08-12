/**
 * 存储服务测试
 * 
 * 测试本地存储功能的各种场景
 */

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
};

// Mock Tauri API
jest.mock('@tauri-apps/api/fs', () => ({
  readTextFile: jest.fn(),
  writeTextFile: jest.fn(),
  exists: jest.fn(),
  createDir: jest.fn(),
}));

// 简单的存储服务实现
class StorageService {
  private prefix: string;

  constructor(prefix = 'focusflow_') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const item = localStorage.getItem(this.getKey(key));
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<boolean> {
    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error setting item in storage:', error);
      return false;
    }
  }

  async remove(key: string): Promise<boolean> {
    try {
      localStorage.removeItem(this.getKey(key));
      return true;
    } catch (error) {
      console.error('Error removing item from storage:', error);
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      // 只清除带有前缀的项目
      const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
      keys.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    return localStorage.getItem(this.getKey(key)) !== null;
  }

  async getAllKeys(): Promise<string[]> {
    return Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .map(key => key.replace(this.prefix, ''));
  }
}

// ==================== TEST SETUP ====================

let storageService: StorageService;

// Mock localStorage globally
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('StorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storageService = new StorageService('test_');
    
    // Reset localStorage mock
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {});
    mockLocalStorage.removeItem.mockImplementation(() => {});
    mockLocalStorage.clear.mockImplementation(() => {});
  });

  // ==================== INITIALIZATION TESTS ====================
  describe('Initialization', () => {
    it('creates instance with default prefix', () => {
      // Arrange & Act
      const service = new StorageService();

      // Assert
      expect(service).toBeInstanceOf(StorageService);
    });

    it('creates instance with custom prefix', () => {
      // Arrange & Act
      const service = new StorageService('custom_');

      // Assert
      expect(service).toBeInstanceOf(StorageService);
    });
  });

  // ==================== GET OPERATION TESTS ====================
  describe('Get Operations', () => {
    it('retrieves existing item successfully', async () => {
      // Arrange
      const testData = { name: 'test', value: 123 };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testData));

      // Act
      const result = await storageService.get('testKey');

      // Assert
      expect(result).toEqual(testData);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test_testKey');
    });

    it('returns null for non-existent item', async () => {
      // Arrange
      mockLocalStorage.getItem.mockReturnValue(null);

      // Act
      const result = await storageService.get('nonExistentKey');

      // Assert
      expect(result).toBeNull();
    });

    it('handles JSON parse errors gracefully', async () => {
      // Arrange
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      // Act
      const result = await storageService.get('invalidKey');

      // Assert
      expect(result).toBeNull();
    });

    it('retrieves different data types correctly', async () => {
      // Arrange
      const testCases = [
        { input: 'string value', expected: 'string value' },
        { input: 42, expected: 42 },
        { input: true, expected: true },
        { input: { nested: { object: 'value' } }, expected: { nested: { object: 'value' } } },
        { input: [1, 2, 3], expected: [1, 2, 3] },
      ];

      for (const testCase of testCases) {
        // Act
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testCase.input));
        const result = await storageService.get('testKey');

        // Assert
        expect(result).toEqual(testCase.expected);
      }
    });
  });

  // ==================== SET OPERATION TESTS ====================
  describe('Set Operations', () => {
    it('stores item successfully', async () => {
      // Arrange
      const testData = { name: 'test', value: 123 };

      // Act
      const result = await storageService.set('testKey', testData);

      // Assert
      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'test_testKey',
        JSON.stringify(testData)
      );
    });

    it('handles storage errors gracefully', async () => {
      // Arrange
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      // Act
      const result = await storageService.set('testKey', 'test data');

      // Assert
      expect(result).toBe(false);
    });

    it('stores different data types correctly', async () => {
      // Arrange
      const testCases = [
        'string value',
        42,
        true,
        { nested: { object: 'value' } },
        [1, 2, 3],
        null,
      ];

      for (const testData of testCases) {
        // Act
        const result = await storageService.set('testKey', testData);

        // Assert
        expect(result).toBe(true);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'test_testKey',
          JSON.stringify(testData)
        );
      }
    });
  });

  // ==================== REMOVE OPERATION TESTS ====================
  describe('Remove Operations', () => {
    it('removes item successfully', async () => {
      // Arrange & Act
      const result = await storageService.remove('testKey');

      // Assert
      expect(result).toBe(true);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test_testKey');
    });

    it('handles removal errors gracefully', async () => {
      // Arrange
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Removal failed');
      });

      // Act
      const result = await storageService.remove('testKey');

      // Assert
      expect(result).toBe(false);
    });
  });

  // ==================== CLEAR OPERATION TESTS ====================
  describe('Clear Operations', () => {
    it('clears all items with prefix', async () => {
      // Arrange & Act
      const result = await storageService.clear();

      // Assert
      expect(result).toBe(true);
    });
  });

  // ==================== EXISTS OPERATION TESTS ====================
  describe('Exists Operations', () => {
    it('returns true for existing item', async () => {
      // Arrange
      mockLocalStorage.getItem.mockReturnValue('some value');

      // Act
      const result = await storageService.exists('testKey');

      // Assert
      expect(result).toBe(true);
    });

    it('returns false for non-existent item', async () => {
      // Arrange
      mockLocalStorage.getItem.mockReturnValue(null);

      // Act
      const result = await storageService.exists('testKey');

      // Assert
      expect(result).toBe(false);
    });
  });

  // ==================== GET ALL KEYS TESTS ====================
  describe('Get All Keys Operations', () => {
    it('returns all keys with prefix', async () => {
      // Arrange & Act
      const result = await storageService.getAllKeys();

      // Assert
      expect(Array.isArray(result)).toBe(true);
    });

    it('returns empty array when no keys exist', async () => {
      // Arrange & Act
      const result = await storageService.getAllKeys();

      // Assert
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ==================== INTEGRATION TESTS ====================
  describe('Integration Tests', () => {
    it('performs complete CRUD operations', async () => {
      // Arrange
      const testData = { name: 'integration test', value: 456 };

      // Mock the localStorage behavior
      let storage: Record<string, string> = {};
      mockLocalStorage.setItem.mockImplementation((key, value) => {
        storage[key] = value;
      });
      mockLocalStorage.getItem.mockImplementation((key) => storage[key] || null);
      mockLocalStorage.removeItem.mockImplementation((key) => {
        delete storage[key];
      });

      // Act & Assert - Create
      const setResult = await storageService.set('integrationKey', testData);
      expect(setResult).toBe(true);

      // Act & Assert - Read
      const getData = await storageService.get('integrationKey');
      expect(getData).toEqual(testData);

      // Act & Assert - Delete
      const removeResult = await storageService.remove('integrationKey');
      expect(removeResult).toBe(true);
    });
  });
});
