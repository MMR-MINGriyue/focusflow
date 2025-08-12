import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import useTimer from './useTimer';
import { useUnifiedTimerStore } from '../stores/unifiedTimerStore';

// Mock the store and worker
vi.mock('../stores/unifiedTimerStore');

// Mock Worker
class MockWorker {
  constructor(public scriptUrl: string) {
    setTimeout(() => {
      this.onmessage?.({
        data: { type: 'ready' }
      });
    }, 0);
  }

  postMessage = vi.fn();
  terminate = vi.fn();
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: ((e: ErrorEvent) => void) | null = null;
}

vi.stubGlobal('Worker', MockWorker);

describe('useTimer hook', () => {
  const mockStore = {
    state: 'idle',
    settings: {
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      mode: 'classic',
    },
    setTimerState: vi.fn(),
    setTimeLeft: vi.fn(),
    setProgress: vi.fn(),
    setShowMicroBreak: vi.fn(),
    showSettings: false,
    setShowSettings: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useUnifiedTimerStore as jest.Mock).mockReturnValue(mockStore);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize the worker and set up event listeners', () => {
    const { result } = renderHook(() => useTimer());

    expect(Worker).toHaveBeenCalledWith('/src/workers/timerWorker.ts');
    expect(result.current.formattedTime).toBe('25:00');
    expect(result.current.progress).toBe(0);
  });

  it('should send start command to worker when timer starts', () => {
    const { result } = renderHook(() => useTimer());
    const workerInstance = (Worker as jest.Mock).mock.instances[0] as MockWorker;

    act(() => {
      result.current.startTimer();
    });

    expect(workerInstance.postMessage).toHaveBeenCalledWith({
      command: 'start'
    });
    expect(mockStore.setTimerState).toHaveBeenCalledWith('running');
  });

  it('should send pause command to worker when timer pauses', () => {
    const { result } = renderHook(() => useTimer());
    const workerInstance = (Worker as jest.Mock).mock.instances[0] as MockWorker;

    // First start the timer
    act(() => {
      result.current.startTimer();
    });

    // Then pause it
    act(() => {
      result.current.pauseTimer();
    });

    expect(workerInstance.postMessage).toHaveBeenCalledWith({
      command: 'pause'
    });
    expect(mockStore.setTimerState).toHaveBeenCalledWith('paused');
  });

  it('should send reset command to worker when timer resets', () => {
    const { result } = renderHook(() => useTimer());
    const workerInstance = (Worker as jest.Mock).mock.instances[0] as MockWorker;

    act(() => {
      result.current.resetTimer();
    });

    expect(workerInstance.postMessage).toHaveBeenCalledWith({
      command: 'reset'
    });
    expect(mockStore.setTimerState).toHaveBeenCalledWith('idle');
  });

  it('should handle timer updates from worker', () => {
    const { result } = renderHook(() => useTimer());
    const workerInstance = (Worker as jest.Mock).mock.instances[0] as MockWorker;

    // Simulate a timer update from the worker
    act(() => {
      workerInstance.onmessage?.({
        data: {
          type: 'update',
          formattedTime: '24:30',
          timeLeft: 1470,
          progress: 2
        }
      });
    });

    expect(result.current.formattedTime).toBe('24:30');
    expect(result.current.progress).toBe(2);
    expect(mockStore.setTimeLeft).toHaveBeenCalledWith(1470);
    expect(mockStore.setProgress).toHaveBeenCalledWith(2);
  });

  it('should handle timer completion from worker', () => {
    const { result } = renderHook(() => useTimer());
    const workerInstance = (Worker as jest.Mock).mock.instances[0] as MockWorker;

    // Simulate timer completion
    act(() => {
      workerInstance.onmessage?.({ data: { type: 'complete' } });
    });

    expect(mockStore.setTimerState).toHaveBeenCalledWith('completed');
  });

  it('should handle worker errors', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useTimer());
    const workerInstance = (Worker as jest.Mock).mock.instances[0] as MockWorker;

    // Simulate a worker error
    act(() => {
      workerInstance.onerror?.({ message: 'Worker error' } as ErrorEvent);
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Timer worker error:', 'Worker error');
    consoleErrorSpy.mockRestore();
  });

  it('should terminate worker when component unmounts', () => {
    const { unmount } = renderHook(() => useTimer());
    const workerInstance = (Worker as jest.Mock).mock.instances[0] as MockWorker;

    unmount();

    expect(workerInstance.terminate).toHaveBeenCalled();
  });

  it('should send setDuration command when settings change', () => {
    const { rerender } = renderHook(() => useTimer());
    const workerInstance = (Worker as jest.Mock).mock.instances[0] as MockWorker;

    // Change the settings
    (useUnifiedTimerStore as jest.Mock).mockReturnValue({
      ...mockStore,
      settings: {
        ...mockStore.settings,
        workDuration: 30
      }
    });

    // Rerender the hook with new settings
    rerender();

    expect(workerInstance.postMessage).toHaveBeenCalledWith({
      command: 'setDuration',
      duration: 30
    });
  });

  it('should check for micro breaks at appropriate times', () => {
    const { result } = renderHook(() => useTimer());
    const workerInstance = (Worker as jest.Mock).mock.instances[0] as MockWorker;

    // Simulate being in a focus session
    (useUnifiedTimerStore as jest.Mock).mockReturnValue({
      ...mockStore,
      state: 'running',
      settings: {
        ...mockStore.settings,
        mode: 'classic'
      }
    });

    // Simulate a timer update at 15 minutes
    act(() => {
      workerInstance.onmessage?.({
        data: {
          type: 'update',
          formattedTime: '15:00',
          timeLeft: 900,
          progress: 40
        }
      });
    });

    // Should not show micro break yet
    expect(mockStore.setShowMicroBreak).not.toHaveBeenCalled();

    // Simulate a timer update at 20 minutes
    act(() => {
      workerInstance.onmessage?.({
        data: {
          type: 'update',
          formattedTime: '05:00',
          timeLeft: 300,
          progress: 80
        }
      });
    });

    // Should show micro break
    expect(mockStore.setShowMicroBreak).toHaveBeenCalledWith(true);
  });
});