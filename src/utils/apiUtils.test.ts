import { describe, it, expect, beforeEach, afterEach, vi } from './testHelpers';
import { fetchData, postData, putData, deleteData, handleApiError, createApiClient, getAuthHeader } from '../apiUtils';

// Mock fetch
global.fetch = vi.fn() as any;

describe('API Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchData', () => {
    it('should fetch data successfully', async () => {
      const mockResponse = { data: { id: 1, name: 'Test' }, success: true };
      
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await fetchData('/test');
      expect(result).toEqual(mockResponse);
    });

    it('should handle fetch errors', async () => {
      const mockErrorResponse = { error: 'Not found', code: 404 };
      
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve(mockErrorResponse)
      });

      await expect(fetchData('/test')).rejects.toThrow();
    });
  });

  describe('createApiClient', () => {
    it('should create API client with default config', () => {
      const apiClient = createApiClient();
      
      expect(apiClient.baseURL).toBe('https://api.focusflow.app');
      expect(apiClient.timeout).toBe(10000);
      expect(apiClient.headers['Content-Type']).toBe('application/json');
    });

    it('should create API client with custom config', () => {
      const config = {
        baseURL: 'https://api.example.com',
        timeout: 5000
      };
      
      const apiClient = createApiClient(config);
      
      expect(apiClient.baseURL).toBe('https://api.example.com');
      expect(apiClient.timeout).toBe(5000);
    });
  });

  describe('getAuthHeader', () => {
    it('should return auth header when token exists', () => {
      vi.spyOn(localStorage, 'getItem').mockReturnValue('test-token');
      
      const header = getAuthHeader();
      expect(header).toBe('Bearer test-token');
    });

    it('should return null when no token exists', () => {
      vi.spyOn(localStorage, 'getItem').mockReturnValue(null);
      
      const header = getAuthHeader();
      expect(header).toBeNull();
    });
  });
});