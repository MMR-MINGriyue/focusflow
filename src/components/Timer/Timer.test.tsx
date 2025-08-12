import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Timer from './Timer';
import { useUnifiedTimerStore } from '../../stores/unifiedTimerStore';

// Mock the store
vi.mock('../../stores/unifiedTimerStore');

describe('Timer Component', () => {
  const mockStore = {
    currentState: 'focus',
    isActive: false,
    settings: {
      mode: 'classic',
      classic: {
        focusDuration: 25,
        breakDuration: 5,
        microBreakDuration: 2,
      },
      smart: {
        focusMinDuration: 20,
        focusMaxDuration: 30,
        breakMinDuration: 3,
        breakMaxDuration: 7,
        microBreakMinDuration: 1,
        microBreakMaxDuration: 3,
      },
    },
    transitionTo: vi.fn(),
    checkMicroBreakTrigger: vi.fn(),
    triggerMicroBreak: vi.fn(),
    setShowSettings: vi.fn(),
    showSettings: false,
  };

  beforeEach(() => {
    (useUnifiedTimerStore as jest.Mock).mockReturnValue({
      ...mockStore,
      // Reset mocks before each test
      transitionTo: vi.fn(),
      setShowSettings: vi.fn(),
    });
  });

  test('renders timer with correct initial state', () => {
    render(<Timer />);

    // Check if timer displays initial time
    expect(screen.getByText('25:00')).toBeInTheDocument();
    // Check if focus state is displayed
    expect(screen.getByText('专注中')).toBeInTheDocument();
    // Check if start button exists
    expect(screen.getByRole('button', { name: /开始/i })).toBeInTheDocument();
  });

  test('starts timer when start button is clicked', async () => {
    render(<Timer />);

    // Click start button
    fireEvent.click(screen.getByRole('button', { name: /开始/i }));

    // Check if timer starts counting down
    await waitFor(() => {
      expect(screen.getByText(/24:59/)).toBeInTheDocument();
    }, { timeout: 1500 });
  });

  test('pauses timer when pause button is clicked', async () => {
    render(<Timer />);

    // Start timer
    fireEvent.click(screen.getByRole('button', { name: /开始/i }));
    // Wait for timer to start
    await waitFor(() => {
      expect(screen.getByText(/24:59/)).toBeInTheDocument();
    }, { timeout: 1500 });

    // Pause timer
    fireEvent.click(screen.getByRole('button', { name: /暂停/i }));
    const currentTime = screen.getByText(/24:59/).textContent;

    // Check if timer remains at the same value after pause
    await new Promise(resolve => setTimeout(resolve, 1000));
    expect(screen.getByText(currentTime!)).toBeInTheDocument();
  });

  test('resets timer when reset button is clicked', async () => {
    render(<Timer />);

    // Start timer
    fireEvent.click(screen.getByRole('button', { name: /开始/i }));
    // Wait for timer to start
    await waitFor(() => {
      expect(screen.getByText(/24:59/)).toBeInTheDocument();
    }, { timeout: 1500 });

    // Click reset button
    fireEvent.click(screen.getByRole('button', { name: /重置/i }));
    // Confirm reset
    fireEvent.click(screen.getByRole('button', { name: /确认/i }));

    // Check if timer resets to initial value
    expect(screen.getByText('25:00')).toBeInTheDocument();
  });

  test('opens settings when settings button is clicked', () => {
    render(<Timer />);
    const mockSetShowSettings = vi.fn();
    (useUnifiedTimerStore as jest.Mock).mockReturnValue({
      ...mockStore,
      setShowSettings: mockSetShowSettings,
    });

    // Click settings button
    fireEvent.click(screen.getByRole('button', { name: /设置/i }));

    // Check if settings dialog is opened
    expect(mockSetShowSettings).toHaveBeenCalledWith(true);
  });

  test('transitions to break after focus time completes', async () => {
    // Mock the store with 1 second remaining
    const mockTransitionTo = vi.fn();
    (useUnifiedTimerStore as jest.Mock).mockReturnValue({
      ...mockStore,
      timeLeft: 1,
      isActive: true,
      transitionTo: mockTransitionTo,
    });

    render(<Timer />);

    // Wait for timer to complete
    await waitFor(() => {
      expect(mockTransitionTo).toHaveBeenCalledWith('break');
    }, { timeout: 1500 });
  });
});