/**
 * TimerStyleManager 组件简化测试
 * 
 * 专注于基本功能测试，避免复杂的DOM操作和错误处理
 * 采用AAA模式（Arrange-Act-Assert）
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { testUtils } from '../../../tests/utils/testUtils';
import TimerStyleManager from '../TimerStyleManager';
import { TimerStyleConfig, TimerStyleSettings } from '../../../types/timerStyle';

// ==================== MOCK CONFIGURATION ====================

// Mock timerStyle service
jest.mock('../../../services/timerStyle', () => ({
  timerStyleService: {
    getSettings: jest.fn(),
    getCurrentStyle: jest.fn(),
    getPreviewStyle: jest.fn(),
    getAllStyles: jest.fn(),
    getCustomStyles: jest.fn(),
    setCurrentStyle: jest.fn(),
    addCustomStyle: jest.fn(),
    updateCustomStyle: jest.fn(),
    removeCustomStyle: jest.fn(),
    duplicateStyle: jest.fn(),
    exportStyle: jest.fn(),
    importStyle: jest.fn(),
    previewStyle: jest.fn(),
    exitPreview: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    exportSettings: jest.fn(),
    importSettings: jest.fn(),
  },
}));

// Mock UI components
jest.mock('../../ui/Button', () => ({
  Button: ({ children, onClick, disabled, className, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={className}
      data-testid={props['data-testid'] || 'button'}
      {...props}
    >
      {children}
    </button>
  ),
}));

// ==================== TEST SETUP ====================

// Mock data
const mockDefaultSettings: TimerStyleSettings = {
  currentStyleId: 'digital-modern',
  customStyles: [],
  previewMode: false,
  autoSwitchByState: false,
};

const mockDefaultStyle: TimerStyleConfig = testUtils.generateTimerStyle({
  id: 'digital-modern',
  name: '现代数字',
  description: '简洁现代的数字显示风格',
  displayStyle: 'digital',
});

const mockCustomStyle: TimerStyleConfig = testUtils.generateTimerStyle({
  id: 'custom-style-1',
  name: '自定义样式',
  description: '用户自定义的样式',
  displayStyle: 'minimal',
});

const mockProps = {
  onStyleChange: jest.fn(),
};

// Helper function to render component with default setup
const renderComponent = (overrideProps = {}) => {
  const props = { ...mockProps, ...overrideProps };
  return testUtils.renderWithDefaults(<TimerStyleManager {...props} />);
};

// ==================== TEST SUITES ====================

describe('TimerStyleManager - Simplified Tests', () => {
  // Get mock service reference
  const mockTimerStyleService = require('../../../services/timerStyle').timerStyleService;

  // Setup and cleanup
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock returns
    mockTimerStyleService.getSettings.mockReturnValue(mockDefaultSettings);
    mockTimerStyleService.getCurrentStyle.mockReturnValue(mockDefaultStyle);
    mockTimerStyleService.getPreviewStyle.mockReturnValue(null);
    mockTimerStyleService.getAllStyles.mockReturnValue([mockDefaultStyle]);
    mockTimerStyleService.getCustomStyles.mockReturnValue([]);
    mockTimerStyleService.setCurrentStyle.mockReturnValue(true);
    mockTimerStyleService.addListener.mockReturnValue(undefined);
    mockTimerStyleService.removeListener.mockReturnValue(undefined);
  });

  // ==================== BASIC RENDERING TESTS ====================
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      // Arrange & Act
      renderComponent();

      // Assert
      expect(screen.getByText('计时器样式管理')).toBeInTheDocument();
    });

    it('displays current style name', () => {
      // Arrange & Act
      renderComponent();

      // Assert
      expect(screen.getByText('现代数字')).toBeInTheDocument();
    });

    it('displays current style description', () => {
      // Arrange & Act
      renderComponent();

      // Assert
      expect(screen.getByText(/简洁现代的数字显示风格/)).toBeInTheDocument();
    });

    it('renders import section', () => {
      // Arrange & Act
      renderComponent();

      // Assert
      expect(screen.getByText('导入样式')).toBeInTheDocument();
      expect(screen.getByLabelText('导入样式')).toBeInTheDocument();
    });

    it('shows custom styles section', () => {
      // Arrange & Act
      renderComponent();

      // Assert
      expect(screen.getByRole('heading', { name: /自定义样式/ })).toBeInTheDocument();
      expect(screen.getByText('还没有自定义样式')).toBeInTheDocument();
    });

    it('shows help text for empty custom styles', () => {
      // Arrange & Act
      renderComponent();

      // Assert
      expect(screen.getByText(/前往"样式编辑"创建您的第一个自定义样式/)).toBeInTheDocument();
    });
  });

  // ==================== SERVICE INTEGRATION TESTS ====================
  describe('Service Integration', () => {
    it('calls timerStyleService.getSettings on mount', () => {
      // Arrange & Act
      renderComponent();

      // Assert
      expect(mockTimerStyleService.getSettings).toHaveBeenCalledTimes(1);
    });

    it('calls timerStyleService.getCurrentStyle on mount', () => {
      // Arrange & Act
      renderComponent();

      // Assert
      expect(mockTimerStyleService.getCurrentStyle).toHaveBeenCalledTimes(1);
    });

    it('calls timerStyleService.getPreviewStyle on mount', () => {
      // Arrange & Act
      renderComponent();

      // Assert
      expect(mockTimerStyleService.getPreviewStyle).toHaveBeenCalledTimes(1);
    });

    it('calls timerStyleService.getCustomStyles on mount', () => {
      // Arrange & Act
      renderComponent();

      // Assert
      expect(mockTimerStyleService.getCustomStyles).toHaveBeenCalledTimes(1);
    });

    it('adds listener on mount', () => {
      // Arrange & Act
      renderComponent();

      // Assert
      expect(mockTimerStyleService.addListener).toHaveBeenCalledTimes(1);
      expect(mockTimerStyleService.addListener).toHaveBeenCalledWith(expect.any(Function));
    });

    it('removes listener on unmount', () => {
      // Arrange
      const { unmount } = renderComponent();

      // Act
      unmount();

      // Assert
      expect(mockTimerStyleService.removeListener).toHaveBeenCalledTimes(1);
    });
  });

  // ==================== CUSTOM STYLES TESTS ====================
  describe('Custom Styles Display', () => {
    it('shows custom style count when custom styles exist', () => {
      // Arrange
      mockTimerStyleService.getCustomStyles.mockReturnValue([mockCustomStyle]);
      
      // Act
      renderComponent();

      // Assert
      expect(screen.getByText(/自定义样式.*1/)).toBeInTheDocument();
    });

    it('displays custom style information', () => {
      // Arrange
      mockTimerStyleService.getCustomStyles.mockReturnValue([mockCustomStyle]);
      
      // Act
      renderComponent();

      // Assert
      expect(screen.getByText('自定义样式')).toBeInTheDocument();
      expect(screen.getByText('用户自定义的样式')).toBeInTheDocument();
    });

    it('shows apply button for non-current custom styles', () => {
      // Arrange
      mockTimerStyleService.getCustomStyles.mockReturnValue([mockCustomStyle]);
      
      // Act
      renderComponent();

      // Assert
      expect(screen.getByText('应用')).toBeInTheDocument();
    });

    it('shows multiple custom styles correctly', () => {
      // Arrange
      const customStyle2 = testUtils.generateTimerStyle({
        id: 'custom-style-2',
        name: '第二个样式',
        description: '另一个自定义样式',
      });
      
      mockTimerStyleService.getCustomStyles.mockReturnValue([mockCustomStyle, customStyle2]);
      
      // Act
      renderComponent();

      // Assert
      expect(screen.getByText(/自定义样式.*2/)).toBeInTheDocument();
      expect(screen.getByText('自定义样式')).toBeInTheDocument();
      expect(screen.getByText('第二个样式')).toBeInTheDocument();
    });
  });

  // ==================== PREVIEW MODE TESTS ====================
  describe('Preview Mode', () => {
    it('shows preview mode indicator when in preview', () => {
      // Arrange
      const previewStyle = testUtils.generateTimerStyle({
        id: 'preview-style',
        name: '预览样式',
      });
      
      mockTimerStyleService.getPreviewStyle.mockReturnValue(previewStyle);

      // Act
      renderComponent();

      // Assert
      expect(screen.getByText('预览模式')).toBeInTheDocument();
    });

    it('does not show preview mode indicator when not in preview', () => {
      // Arrange
      mockTimerStyleService.getPreviewStyle.mockReturnValue(null);

      // Act
      renderComponent();

      // Assert
      expect(screen.queryByText('预览模式')).not.toBeInTheDocument();
    });
  });

  // ==================== PROPS VALIDATION TESTS ====================
  describe('Props Validation', () => {
    it('handles missing onStyleChange prop gracefully', () => {
      // Arrange & Act
      const { container } = render(<TimerStyleManager />);

      // Assert
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with custom onStyleChange prop', () => {
      // Arrange
      const mockOnStyleChange = jest.fn();

      // Act
      renderComponent({ onStyleChange: mockOnStyleChange });

      // Assert
      expect(screen.getByText('计时器样式管理')).toBeInTheDocument();
    });
  });

  // ==================== ACCESSIBILITY TESTS ====================
  describe('Accessibility', () => {
    it('has proper labels for import functionality', () => {
      // Arrange & Act
      renderComponent();

      // Assert
      expect(screen.getByLabelText('导入样式')).toBeInTheDocument();
    });

    it('has proper heading structure', () => {
      // Arrange & Act
      renderComponent();

      // Assert
      expect(screen.getByRole('heading', { name: '计时器样式管理' })).toBeInTheDocument();
    });

    it('shows proper status indicators', () => {
      // Arrange
      mockTimerStyleService.getCustomStyles.mockReturnValue([mockCustomStyle]);
      
      // Act
      renderComponent();

      // Assert
      expect(screen.getByText(/自定义样式.*1/)).toBeInTheDocument();
    });

    it('has accessible file input', () => {
      // Arrange & Act
      renderComponent();

      // Assert
      const fileInput = screen.getByLabelText('导入样式');
      expect(fileInput).toHaveAttribute('type', 'file');
      expect(fileInput).toHaveAttribute('accept', '.json');
    });
  });
});
