/**
 * 示例组件测试
 * 
 * 这个文件展示了如何使用测试模板和工具函数
 * 基于 ComponentTestTemplate.tsx 创建的实际测试示例
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { testUtils } from '../../tests/utils/testUtils';

// 示例组件（简单的计数器组件）
interface ExampleComponentProps {
  initialCount?: number;
  onCountChange?: (count: number) => void;
  disabled?: boolean;
  className?: string;
}

const ExampleComponent: React.FC<ExampleComponentProps> = ({
  initialCount = 0,
  onCountChange,
  disabled = false,
  className = '',
}) => {
  const [count, setCount] = React.useState(initialCount);

  const handleIncrement = () => {
    if (!disabled) {
      const newCount = count + 1;
      setCount(newCount);
      onCountChange?.(newCount);
    }
  };

  const handleDecrement = () => {
    if (!disabled) {
      const newCount = count - 1;
      setCount(newCount);
      onCountChange?.(newCount);
    }
  };

  const handleReset = () => {
    if (!disabled) {
      setCount(initialCount);
      onCountChange?.(initialCount);
    }
  };

  return (
    <div 
      className={`counter ${className}`}
      data-testid="example-component"
      role="group"
      aria-label="Counter controls"
    >
      <div 
        data-testid="count-display"
        aria-live="polite"
        aria-label={`Current count: ${count}`}
      >
        Count: {count}
      </div>
      
      <div className="controls">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled}
          aria-label="Decrease count"
          data-testid="decrement-button"
        >
          -
        </button>
        
        <button
          type="button"
          onClick={handleReset}
          disabled={disabled}
          aria-label="Reset count"
          data-testid="reset-button"
        >
          Reset
        </button>
        
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled}
          aria-label="Increase count"
          data-testid="increment-button"
        >
          +
        </button>
      </div>
    </div>
  );
};

// ==================== TEST SETUP ====================

const mockProps: ExampleComponentProps = {
  initialCount: 0,
  onCountChange: jest.fn(),
  disabled: false,
  className: 'test-class',
};

const renderComponent = (overrideProps = {}) => {
  const props = { ...mockProps, ...overrideProps };
  return testUtils.renderWithDefaults(<ExampleComponent {...props} />);
};

// ==================== TEST SUITES ====================

describe('ExampleComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== BASIC RENDERING TESTS ====================
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      // Arrange & Act
      renderComponent();

      // Assert
      expect(screen.getByTestId('example-component')).toBeInTheDocument();
    });

    it('displays initial count correctly', () => {
      // Arrange
      const initialCount = 5;

      // Act
      renderComponent({ initialCount });

      // Assert
      expect(screen.getByTestId('count-display')).toHaveTextContent('Count: 5');
    });

    it('applies custom className correctly', () => {
      // Arrange
      const customClass = 'custom-counter';

      // Act
      renderComponent({ className: customClass });

      // Assert
      expect(screen.getByTestId('example-component')).toHaveClass(customClass);
    });

    it('renders all control buttons', () => {
      // Arrange & Act
      renderComponent();

      // Assert
      expect(screen.getByTestId('increment-button')).toBeInTheDocument();
      expect(screen.getByTestId('decrement-button')).toBeInTheDocument();
      expect(screen.getByTestId('reset-button')).toBeInTheDocument();
    });
  });

  // ==================== USER INTERACTION TESTS ====================
  describe('User Interactions', () => {
    it('increments count when increment button is clicked', async () => {
      // Arrange
      const { user } = renderComponent();
      const incrementButton = screen.getByTestId('increment-button');

      // Act
      await user.click(incrementButton);

      // Assert
      expect(screen.getByTestId('count-display')).toHaveTextContent('Count: 1');
    });

    it('decrements count when decrement button is clicked', async () => {
      // Arrange
      const { user } = renderComponent({ initialCount: 5 });
      const decrementButton = screen.getByTestId('decrement-button');

      // Act
      await user.click(decrementButton);

      // Assert
      expect(screen.getByTestId('count-display')).toHaveTextContent('Count: 4');
    });

    it('resets count when reset button is clicked', async () => {
      // Arrange
      const { user } = renderComponent({ initialCount: 3 });
      const incrementButton = screen.getByTestId('increment-button');
      const resetButton = screen.getByTestId('reset-button');

      // Act
      await user.click(incrementButton); // Count becomes 4
      await user.click(resetButton);     // Should reset to 3

      // Assert
      expect(screen.getByTestId('count-display')).toHaveTextContent('Count: 3');
    });

    it('calls onCountChange callback when count changes', async () => {
      // Arrange
      const mockOnCountChange = jest.fn();
      const { user } = renderComponent({ onCountChange: mockOnCountChange });
      const incrementButton = screen.getByTestId('increment-button');

      // Act
      await user.click(incrementButton);

      // Assert
      expect(mockOnCountChange).toHaveBeenCalledTimes(1);
      expect(mockOnCountChange).toHaveBeenCalledWith(1);
    });
  });

  // ==================== STATE MANAGEMENT TESTS ====================
  describe('State Management', () => {
    it('maintains count state correctly through multiple operations', async () => {
      // Arrange
      const { user } = renderComponent({ initialCount: 0 });
      const incrementButton = screen.getByTestId('increment-button');
      const decrementButton = screen.getByTestId('decrement-button');

      // Act
      await user.click(incrementButton); // 1
      await user.click(incrementButton); // 2
      await user.click(decrementButton); // 1

      // Assert
      expect(screen.getByTestId('count-display')).toHaveTextContent('Count: 1');
    });

    it('allows negative counts', async () => {
      // Arrange
      const { user } = renderComponent({ initialCount: 0 });
      const decrementButton = screen.getByTestId('decrement-button');

      // Act
      await user.click(decrementButton);

      // Assert
      expect(screen.getByTestId('count-display')).toHaveTextContent('Count: -1');
    });
  });

  // ==================== PROPS VALIDATION TESTS ====================
  describe('Props Validation', () => {
    it('handles missing optional props gracefully', () => {
      // Arrange & Act
      const { container } = render(<ExampleComponent />);

      // Assert
      expect(container.firstChild).toBeInTheDocument();
      expect(screen.getByTestId('count-display')).toHaveTextContent('Count: 0');
    });

    it('disables all buttons when disabled prop is true', () => {
      // Arrange & Act
      renderComponent({ disabled: true });

      // Assert
      expect(screen.getByTestId('increment-button')).toBeDisabled();
      expect(screen.getByTestId('decrement-button')).toBeDisabled();
      expect(screen.getByTestId('reset-button')).toBeDisabled();
    });

    it('does not change count when buttons are disabled', async () => {
      // Arrange
      const { user } = renderComponent({ disabled: true, initialCount: 5 });
      const incrementButton = screen.getByTestId('increment-button');

      // Act
      await user.click(incrementButton);

      // Assert
      expect(screen.getByTestId('count-display')).toHaveTextContent('Count: 5');
    });
  });

  // ==================== ACCESSIBILITY TESTS ====================
  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      // Arrange & Act
      renderComponent();

      // Assert
      expect(screen.getByRole('group')).toHaveAttribute('aria-label', 'Counter controls');
      expect(screen.getByTestId('increment-button')).toHaveAttribute('aria-label', 'Increase count');
      expect(screen.getByTestId('decrement-button')).toHaveAttribute('aria-label', 'Decrease count');
      expect(screen.getByTestId('reset-button')).toHaveAttribute('aria-label', 'Reset count');
    });

    it('announces count changes to screen readers', () => {
      // Arrange & Act
      renderComponent({ initialCount: 3 });

      // Assert
      const countDisplay = screen.getByTestId('count-display');
      expect(countDisplay).toHaveAttribute('aria-live', 'polite');
      expect(countDisplay).toHaveAttribute('aria-label', 'Current count: 3');
    });

    it('supports keyboard navigation', async () => {
      // Arrange
      const { user } = renderComponent();

      // Act
      await user.tab(); // Should focus first button (decrement)
      expect(screen.getByTestId('decrement-button')).toHaveFocus();

      await user.tab(); // Should focus reset button
      expect(screen.getByTestId('reset-button')).toHaveFocus();

      await user.tab(); // Should focus increment button
      expect(screen.getByTestId('increment-button')).toHaveFocus();
    });
  });

  // ==================== PERFORMANCE TESTS ====================
  describe('Performance', () => {
    it('does not cause unnecessary re-renders', () => {
      // Arrange
      const renderSpy = jest.fn();
      const TestWrapper = React.memo(() => {
        renderSpy();
        return <ExampleComponent {...mockProps} />;
      });

      // Act
      const { rerender } = render(<TestWrapper />);
      rerender(<TestWrapper />);

      // Assert
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    it('handles rapid clicks efficiently', async () => {
      // Arrange
      const mockOnCountChange = jest.fn();
      const { user } = renderComponent({ onCountChange: mockOnCountChange });
      const incrementButton = screen.getByTestId('increment-button');

      // Act
      for (let i = 0; i < 10; i++) {
        await user.click(incrementButton);
      }

      // Assert
      expect(mockOnCountChange).toHaveBeenCalledTimes(10);
      expect(screen.getByTestId('count-display')).toHaveTextContent('Count: 10');
    });
  });
});

// ==================== INTEGRATION TESTS ====================
describe('ExampleComponent Integration', () => {
  it('works correctly in a form context', async () => {
    // Arrange
    const mockOnSubmit = jest.fn();
    const FormWrapper = () => {
      const [count, setCount] = React.useState(0);
      
      return (
        <form onSubmit={(e) => { e.preventDefault(); mockOnSubmit(count); }}>
          <ExampleComponent onCountChange={setCount} />
          <button type="submit">Submit</button>
        </form>
      );
    };

    const { user } = testUtils.renderWithDefaults(<FormWrapper />);

    // Act
    await user.click(screen.getByTestId('increment-button'));
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    // Assert
    expect(mockOnSubmit).toHaveBeenCalledWith(1);
  });
});
