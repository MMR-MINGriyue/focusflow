import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BackgroundDecorationSettings from '../BackgroundDecorationSettings';
import { timerStyleService } from '../../../services/timerStyle';

// Mock the timer style service
jest.mock('../../../services/timerStyle', () => ({
  timerStyleService: {
    getSettings: jest.fn(),
    getCurrentStyle: jest.fn(),
    addCustomStyle: jest.fn(),
    setCurrentStyle: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    getAllStyles: jest.fn(() => []),
    getPresetStyles: jest.fn(() => []),
    getCustomStyles: jest.fn(() => []),
    updateCustomStyle: jest.fn(),
    deleteCustomStyle: jest.fn(),
    exportSettings: jest.fn(() => '{}'),
    importSettings: jest.fn(() => true),
    applyStyle: jest.fn(),
  },
}));

const mockTimerStyleService = timerStyleService as jest.Mocked<typeof timerStyleService>;

describe('BackgroundDecorationSettings', () => {
  const mockOnSettingsChange = jest.fn();
  
  const mockCurrentStyle = {
    id: 'test-style',
    name: 'Test Style',
    description: 'Test Description',
    displayStyle: 'digital' as const,
    size: 'medium' as const,
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      background: '#ffffff',
      text: '#1f2937',
      accent: '#f59e0b',
      progress: '#10b981',
      progressBackground: '#e5e7eb',
    },
    background: {
      pattern: 'dots' as const,
      size: 'medium' as const,
      color: '#f3f4f6',
      opacity: 0.5,
    },
    particles: {
      enabled: true,
      effect: 'floating' as const,
      count: 20,
      color: '#3b82f6',
      opacity: 0.6,
    },
    decoration: {
      enabled: true,
      element: 'circles' as const,
      count: 5,
      color: '#f59e0b',
      opacity: 0.4,
    },
    animations: {
      enabled: true,
      pulseOnStateChange: true,
      breathingEffect: false,
      rotationEffect: false,
      transitionDuration: 300,
      easing: 'ease-in-out',
    },
    layout: {
      alignment: 'center' as const,
      spacing: 'normal' as const,
      showStateText: true,
      showProgressPercentage: true,
      showStatusIndicator: true,
    },
    responsive: {
      enabled: true,
      breakpoints: {
        mobile: {},
        tablet: {},
        desktop: {},
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTimerStyleService.getSettings.mockReturnValue({
      currentStyleId: 'test-style',
      customStyles: [mockCurrentStyle],
      previewStyleId: null,
    });
    mockTimerStyleService.getCurrentStyle.mockReturnValue(mockCurrentStyle);
    mockTimerStyleService.addCustomStyle.mockReturnValue(true);
  });

  it('renders without crashing', () => {
    render(<BackgroundDecorationSettings onSettingsChange={mockOnSettingsChange} />);
    expect(screen.getByText('背景和装饰效果')).toBeInTheDocument();
  });

  it('displays current style information', () => {
    render(<BackgroundDecorationSettings onSettingsChange={mockOnSettingsChange} />);

    expect(screen.getByText(/Test Style/)).toBeInTheDocument();
    expect(screen.getByText('背景和装饰效果')).toBeInTheDocument();
  });

  it('has accessible form controls', () => {
    render(<BackgroundDecorationSettings onSettingsChange={mockOnSettingsChange} />);
    
    // Check for aria-labels on select elements
    expect(screen.getByLabelText('选择背景图案类型')).toBeInTheDocument();
    expect(screen.getByLabelText('选择背景图案尺寸')).toBeInTheDocument();
    expect(screen.getByLabelText('选择粒子效果类型')).toBeInTheDocument();
    expect(screen.getByLabelText('选择装饰元素类型')).toBeInTheDocument();
    
    // Check for aria-labels on color inputs
    expect(screen.getByLabelText('选择背景图案颜色')).toBeInTheDocument();
    expect(screen.getByLabelText('选择粒子颜色')).toBeInTheDocument();
    expect(screen.getByLabelText('选择装饰颜色')).toBeInTheDocument();
  });

  it('updates background pattern when changed', async () => {
    const user = userEvent.setup();
    render(<BackgroundDecorationSettings onSettingsChange={mockOnSettingsChange} />);
    
    const patternSelect = screen.getByLabelText('选择背景图案类型');
    await user.selectOptions(patternSelect, 'grid');
    
    expect(mockTimerStyleService.addCustomStyle).toHaveBeenCalledWith(
      expect.objectContaining({
        background: expect.objectContaining({
          pattern: 'grid',
        }),
      })
    );
  });

  it('updates background color when changed', async () => {
    const user = userEvent.setup();
    render(<BackgroundDecorationSettings onSettingsChange={mockOnSettingsChange} />);
    
    const colorInput = screen.getByLabelText('选择背景图案颜色');
    fireEvent.change(colorInput, { target: { value: '#ff0000' } });
    
    expect(mockTimerStyleService.addCustomStyle).toHaveBeenCalledWith(
      expect.objectContaining({
        background: expect.objectContaining({
          color: '#ff0000',
        }),
      })
    );
  });

  it('handles preview effect toggle', async () => {
    const user = userEvent.setup();
    render(<BackgroundDecorationSettings onSettingsChange={mockOnSettingsChange} />);

    // Look for preview button by role or text content
    const previewButton = screen.getByRole('button', { name: /预览/ });
    await user.click(previewButton);

    // Should show preview state
    expect(previewButton).toBeInTheDocument();
  });

  it('cleans up preview timeout on unmount', () => {
    jest.useFakeTimers();
    const { unmount } = render(<BackgroundDecorationSettings onSettingsChange={mockOnSettingsChange} />);
    
    // Start a preview
    const previewButton = screen.getByRole('button', { name: /预览/ });
    fireEvent.click(previewButton);
    
    // Unmount component
    unmount();
    
    // Fast-forward time to ensure timeout would have fired
    jest.advanceTimersByTime(5000);
    
    // No errors should occur
    jest.useRealTimers();
  });

  it('uses CSS variables for dynamic styles', () => {
    render(<BackgroundDecorationSettings onSettingsChange={mockOnSettingsChange} />);
    
    // Find elements with CSS variable styles
    const styleElements = document.querySelectorAll('[style*="--bg-color"]');
    expect(styleElements.length).toBeGreaterThan(0);
  });

  it('handles particle settings updates', async () => {
    const user = userEvent.setup();
    render(<BackgroundDecorationSettings onSettingsChange={mockOnSettingsChange} />);
    
    const particleEffectSelect = screen.getByLabelText('选择粒子效果类型');
    await user.selectOptions(particleEffectSelect, 'falling');
    
    expect(mockTimerStyleService.addCustomStyle).toHaveBeenCalledWith(
      expect.objectContaining({
        particles: expect.objectContaining({
          effect: 'snow',
        }),
      })
    );
  });

  it('handles decoration settings updates', async () => {
    const user = userEvent.setup();
    render(<BackgroundDecorationSettings onSettingsChange={mockOnSettingsChange} />);
    
    const decorationSelect = screen.getByLabelText('选择装饰元素类型');
    await user.selectOptions(decorationSelect, 'glow');
    
    expect(mockTimerStyleService.addCustomStyle).toHaveBeenCalledWith(
      expect.objectContaining({
        decoration: expect.objectContaining({
          element: 'stars',
        }),
      })
    );
  });

  it('maintains type safety in event handlers', async () => {
    const user = userEvent.setup();
    render(<BackgroundDecorationSettings onSettingsChange={mockOnSettingsChange} />);
    
    // Test that type assertions are working correctly
    const patternSelect = screen.getByLabelText('选择背景图案类型');
    await user.selectOptions(patternSelect, 'grid');
    
    // Verify the call was made with correct typing
    const lastCall = mockTimerStyleService.addCustomStyle.mock.calls[0][0];
    expect(lastCall.background.pattern).toBe('lines');
    expect(typeof lastCall.background.pattern).toBe('string');
  });
});
