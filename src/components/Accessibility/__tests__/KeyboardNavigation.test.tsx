/**
 * 键盘导航组件测试
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  KeyboardNavigationProvider,
  useKeyboardNavigation,
  useKeyboardShortcut,
  useFocusTrap,
  AccessibleButton,
  SkipLink
} from '../KeyboardNavigation';

// Test component using keyboard navigation
const TestKeyboardComponent: React.FC = () => {
  const { showHelp, focusNext, focusPrevious } = useKeyboardNavigation();
  
  return (
    <div>
      <button onClick={showHelp}>Show Help</button>
      <button onClick={focusNext}>Focus Next</button>
      <button onClick={focusPrevious}>Focus Previous</button>
    </div>
  );
};

// Test component with shortcut
const TestShortcutComponent: React.FC = () => {
  const [triggered, setTriggered] = React.useState(false);
  
  useKeyboardShortcut({
    id: 'test-shortcut',
    name: 'Test Shortcut',
    description: 'Test keyboard shortcut',
    keys: ['Ctrl', 'T'],
    category: 'Test',
    handler: () => setTriggered(true)
  });
  
  return <div data-testid="shortcut-status">{triggered ? 'triggered' : 'not-triggered'}</div>;
};

// Test component with focus trap
const TestFocusTrapComponent: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  const containerRef = useFocusTrap(enabled);
  
  return (
    <div ref={containerRef} data-testid="focus-trap-container">
      <button>First Button</button>
      <button>Second Button</button>
      <button>Third Button</button>
    </div>
  );
};

describe('KeyboardNavigation', () => {
  const user = userEvent.setup();

  describe('KeyboardNavigationProvider', () => {
    it('should provide keyboard navigation context', () => {
      render(
        <KeyboardNavigationProvider>
          <TestKeyboardComponent />
        </KeyboardNavigationProvider>
      );
      
      expect(screen.getByText('Show Help')).toBeInTheDocument();
      expect(screen.getByText('Focus Next')).toBeInTheDocument();
      expect(screen.getByText('Focus Previous')).toBeInTheDocument();
    });

    it('should show help dialog when F1 is pressed', async () => {
      render(
        <KeyboardNavigationProvider>
          <TestKeyboardComponent />
        </KeyboardNavigationProvider>
      );
      
      // Press F1
      fireEvent.keyDown(document, { key: 'F1' });
      
      await waitFor(() => {
        expect(screen.getByText('键盘快捷键')).toBeInTheDocument();
      });
    });

    it('should close help dialog when Escape is pressed', async () => {
      render(
        <KeyboardNavigationProvider>
          <TestKeyboardComponent />
        </KeyboardNavigationProvider>
      );
      
      // Open help dialog
      fireEvent.keyDown(document, { key: 'F1' });
      
      await waitFor(() => {
        expect(screen.getByText('键盘快捷键')).toBeInTheDocument();
      });
      
      // Press Escape
      fireEvent.keyDown(document, { key: 'Escape' });
      
      await waitFor(() => {
        expect(screen.queryByText('键盘快捷键')).not.toBeInTheDocument();
      });
    });

    it('should handle focus navigation', async () => {
      render(
        <KeyboardNavigationProvider>
          <div>
            <button>Button 1</button>
            <button>Button 2</button>
            <button>Button 3</button>
          </div>
        </KeyboardNavigationProvider>
      );
      
      const buttons = screen.getAllByRole('button');
      
      // Focus first button
      buttons[0].focus();
      expect(document.activeElement).toBe(buttons[0]);
      
      // Press Tab to move to next
      fireEvent.keyDown(document, { key: 'Tab' });
      
      // Should move to next focusable element
      expect(document.activeElement).toBe(buttons[1]);
    });
  });

  describe('useKeyboardShortcut hook', () => {
    it('should register and trigger keyboard shortcuts', async () => {
      render(
        <KeyboardNavigationProvider>
          <TestShortcutComponent />
        </KeyboardNavigationProvider>
      );
      
      expect(screen.getByTestId('shortcut-status')).toHaveTextContent('not-triggered');
      
      // Trigger shortcut
      fireEvent.keyDown(document, { key: 't', ctrlKey: true });
      
      await waitFor(() => {
        expect(screen.getByTestId('shortcut-status')).toHaveTextContent('triggered');
      });
    });

    it('should handle multiple key combinations', async () => {
      const TestMultiKeyComponent: React.FC = () => {
        const [triggered, setTriggered] = React.useState(false);
        
        useKeyboardShortcut({
          id: 'multi-key-shortcut',
          name: 'Multi Key Shortcut',
          description: 'Test multi-key shortcut',
          keys: ['Ctrl', 'Shift', 'K'],
          category: 'Test',
          handler: () => setTriggered(true)
        });
        
        return <div data-testid="multi-key-status">{triggered ? 'triggered' : 'not-triggered'}</div>;
      };

      render(
        <KeyboardNavigationProvider>
          <TestMultiKeyComponent />
        </KeyboardNavigationProvider>
      );
      
      // Trigger multi-key shortcut
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true, shiftKey: true });
      
      await waitFor(() => {
        expect(screen.getByTestId('multi-key-status')).toHaveTextContent('triggered');
      });
    });

    it('should not trigger disabled shortcuts', async () => {
      const TestDisabledShortcutComponent: React.FC = () => {
        const [triggered, setTriggered] = React.useState(false);
        const { disableShortcut } = useKeyboardNavigation();
        
        useKeyboardShortcut({
          id: 'disabled-shortcut',
          name: 'Disabled Shortcut',
          description: 'Test disabled shortcut',
          keys: ['Ctrl', 'D'],
          category: 'Test',
          handler: () => setTriggered(true)
        });
        
        React.useEffect(() => {
          disableShortcut('disabled-shortcut');
        }, [disableShortcut]);
        
        return <div data-testid="disabled-status">{triggered ? 'triggered' : 'not-triggered'}</div>;
      };

      render(
        <KeyboardNavigationProvider>
          <TestDisabledShortcutComponent />
        </KeyboardNavigationProvider>
      );
      
      // Try to trigger disabled shortcut
      fireEvent.keyDown(document, { key: 'd', ctrlKey: true });
      
      // Should not trigger
      expect(screen.getByTestId('disabled-status')).toHaveTextContent('not-triggered');
    });
  });

  describe('useFocusTrap hook', () => {
    it('should trap focus within container when enabled', async () => {
      render(
        <KeyboardNavigationProvider>
          <TestFocusTrapComponent enabled={true} />
        </KeyboardNavigationProvider>
      );
      
      const buttons = screen.getAllByRole('button');
      const firstButton = buttons[0];
      const lastButton = buttons[buttons.length - 1];
      
      // Focus last button
      lastButton.focus();
      expect(document.activeElement).toBe(lastButton);
      
      // Press Tab (should wrap to first button)
      fireEvent.keyDown(lastButton, { key: 'Tab' });
      
      await waitFor(() => {
        expect(document.activeElement).toBe(firstButton);
      });
    });

    it('should handle Shift+Tab for reverse navigation', async () => {
      render(
        <KeyboardNavigationProvider>
          <TestFocusTrapComponent enabled={true} />
        </KeyboardNavigationProvider>
      );
      
      const buttons = screen.getAllByRole('button');
      const firstButton = buttons[0];
      const lastButton = buttons[buttons.length - 1];
      
      // Focus first button
      firstButton.focus();
      expect(document.activeElement).toBe(firstButton);
      
      // Press Shift+Tab (should wrap to last button)
      fireEvent.keyDown(firstButton, { key: 'Tab', shiftKey: true });
      
      await waitFor(() => {
        expect(document.activeElement).toBe(lastButton);
      });
    });

    it('should not trap focus when disabled', () => {
      render(
        <KeyboardNavigationProvider>
          <TestFocusTrapComponent enabled={false} />
        </KeyboardNavigationProvider>
      );
      
      const buttons = screen.getAllByRole('button');
      const lastButton = buttons[buttons.length - 1];
      
      // Focus last button
      lastButton.focus();
      expect(document.activeElement).toBe(lastButton);
      
      // Press Tab (should not wrap)
      fireEvent.keyDown(lastButton, { key: 'Tab' });
      
      // Focus should move naturally (not trapped)
      expect(document.activeElement).not.toBe(buttons[0]);
    });
  });

  describe('AccessibleButton component', () => {
    it('should render with proper accessibility attributes', () => {
      const handleClick = jest.fn();
      
      render(
        <KeyboardNavigationProvider>
          <AccessibleButton
            onClick={handleClick}
            ariaLabel="Test Button"
            ariaDescribedBy="test-description"
          >
            Click Me
          </AccessibleButton>
        </KeyboardNavigationProvider>
      );
      
      const button = screen.getByRole('button', { name: 'Test Button' });
      expect(button).toHaveAttribute('aria-label', 'Test Button');
      expect(button).toHaveAttribute('aria-describedby', 'test-description');
    });

    it('should display keyboard shortcut hint', () => {
      render(
        <KeyboardNavigationProvider>
          <AccessibleButton shortcut={['Ctrl', 'S']}>
            Save
          </AccessibleButton>
        </KeyboardNavigationProvider>
      );
      
      expect(screen.getByText('(Ctrl+S)')).toBeInTheDocument();
    });

    it('should trigger onClick when shortcut is pressed', async () => {
      const handleClick = jest.fn();
      
      render(
        <KeyboardNavigationProvider>
          <AccessibleButton
            onClick={handleClick}
            shortcut={['Ctrl', 'S']}
            ariaLabel="Save Button"
          >
            Save
          </AccessibleButton>
        </KeyboardNavigationProvider>
      );
      
      // Trigger shortcut
      fireEvent.keyDown(document, { key: 's', ctrlKey: true });
      
      await waitFor(() => {
        expect(handleClick).toHaveBeenCalled();
      });
    });

    it('should not trigger when disabled', async () => {
      const handleClick = jest.fn();
      
      render(
        <KeyboardNavigationProvider>
          <AccessibleButton
            onClick={handleClick}
            disabled={true}
            shortcut={['Ctrl', 'S']}
          >
            Save
          </AccessibleButton>
        </KeyboardNavigationProvider>
      );
      
      // Try to trigger shortcut
      fireEvent.keyDown(document, { key: 's', ctrlKey: true });
      
      // Should not be called
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('SkipLink component', () => {
    it('should render skip link with proper attributes', () => {
      render(
        <SkipLink href="#main-content">
          Skip to main content
        </SkipLink>
      );
      
      const link = screen.getByRole('link', { name: 'Skip to main content' });
      expect(link).toHaveAttribute('href', '#main-content');
      expect(link).toHaveClass('sr-only');
    });

    it('should become visible when focused', async () => {
      render(
        <SkipLink href="#main-content">
          Skip to main content
        </SkipLink>
      );
      
      const link = screen.getByRole('link');
      
      // Focus the link
      await user.tab();
      expect(document.activeElement).toBe(link);
      
      // Should have focus styles
      expect(link).toHaveClass('focus:not-sr-only');
    });
  });

  describe('Keyboard help dialog', () => {
    it('should display all registered shortcuts', async () => {
      render(
        <KeyboardNavigationProvider>
          <TestShortcutComponent />
        </KeyboardNavigationProvider>
      );
      
      // Open help dialog
      fireEvent.keyDown(document, { key: 'F1' });
      
      await waitFor(() => {
        expect(screen.getByText('键盘快捷键')).toBeInTheDocument();
        expect(screen.getByText('Test Shortcut')).toBeInTheDocument();
        expect(screen.getByText('Test keyboard shortcut')).toBeInTheDocument();
      });
    });

    it('should group shortcuts by category', async () => {
      render(
        <KeyboardNavigationProvider>
          <TestShortcutComponent />
        </KeyboardNavigationProvider>
      );
      
      // Open help dialog
      fireEvent.keyDown(document, { key: 'F1' });
      
      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument(); // Category
        expect(screen.getByText('通用')).toBeInTheDocument(); // Default category
      });
    });

    it('should format key combinations correctly', async () => {
      render(
        <KeyboardNavigationProvider>
          <TestShortcutComponent />
        </KeyboardNavigationProvider>
      );
      
      // Open help dialog
      fireEvent.keyDown(document, { key: 'F1' });
      
      await waitFor(() => {
        // Should show formatted keys
        expect(screen.getByText('⌘')).toBeInTheDocument(); // Ctrl key
        expect(screen.getByText('T')).toBeInTheDocument(); // T key
      });
    });
  });

  describe('Error handling', () => {
    it('should handle missing context gracefully', () => {
      // Test component outside provider
      expect(() => {
        render(<TestKeyboardComponent />);
      }).toThrow('useKeyboardNavigation must be used within KeyboardNavigationProvider');
    });

    it('should handle invalid key combinations', () => {
      const TestInvalidKeysComponent: React.FC = () => {
        useKeyboardShortcut({
          id: 'invalid-shortcut',
          name: 'Invalid Shortcut',
          description: 'Test invalid shortcut',
          keys: [], // Empty keys array
          category: 'Test',
          handler: () => {}
        });
        
        return <div>Test</div>;
      };

      expect(() => {
        render(
          <KeyboardNavigationProvider>
            <TestInvalidKeysComponent />
          </KeyboardNavigationProvider>
        );
      }).not.toThrow();
    });
  });
});