import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { confirm, showConfirmation } from './confirmationUtils';
import { useConfirmation } from '../hooks/useConfirmation';

// Mock the confirmation hook
vi.mock('../hooks/useConfirmation');

describe('confirmationUtils', () => {
  const mockShowConfirmation = vi.fn();
  const mockConfirm = vi.fn();

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock the useConfirmation hook
    (useConfirmation as jest.Mock).mockReturnValue({
      showConfirmation: mockShowConfirmation,
      confirm: mockConfirm,
    });
  });

  describe('showConfirmation', () => {
    it('should call the hook\'s showConfirmation with provided options', () => {
      const testOptions = {
        title: '测试标题',
        message: '测试消息',
        confirmText: '确认',
        cancelText: '取消',
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
      };

      // Call the utility function
      showConfirmation(testOptions);

      // Verify the hook was called with correct parameters
      expect(mockShowConfirmation).toHaveBeenCalledWith(testOptions);
    });

    it('should use default values when options are not provided', () => {
      // Call the utility function with minimal options
      showConfirmation({
        title: '测试标题',
        message: '测试消息',
      });

      // Verify the hook was called with default values for missing options
      expect(mockShowConfirmation).toHaveBeenCalledWith(expect.objectContaining({
        title: '测试标题',
        message: '测试消息',
        confirmText: expect.any(String),
        cancelText: expect.any(String),
      }));
    });
  });

  describe('confirm', () => {
    it('should call the hook\'s confirm with provided message and options', async () => {
      // Mock the confirm function to resolve
      mockConfirm.mockResolvedValue(true);

      const testMessage = '测试确认消息';
      const testOptions = {
        confirmText: '是',
        cancelText: '否',
      };

      // Call the utility function
      const result = await confirm(testMessage, testOptions);

      // Verify the hook was called with correct parameters
      expect(mockConfirm).toHaveBeenCalledWith(testMessage, testOptions);
      expect(result).toBe(true);
    });

    it('should return false when confirmation is cancelled', async () => {
      // Mock the confirm function to reject
      mockConfirm.mockResolvedValue(false);

      // Call the utility function
      const result = await confirm('测试取消消息');

      expect(result).toBe(false);
    });

    it('should use default message when only options are provided', async () => {
      // Call the utility function with only options
      await confirm(undefined, {
        title: '测试标题',
        message: '测试消息',
      });

      expect(mockConfirm).toHaveBeenCalledWith(undefined, expect.objectContaining({
        title: '测试标题',
        message: '测试消息',
      }));
    });
  });
})