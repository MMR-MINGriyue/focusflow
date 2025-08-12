import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import timerWorker from './timerWorker';

// Mock worker environment
const mockPostMessage = vi.fn();
const mockSetInterval = vi.fn();
const mockClearInterval = vi.fn();
const mockDateNow = vi.fn();

// Mock worker self
global.self = {
  postMessage: mockPostMessage,
  onmessage: null,
  clearInterval,
} as unknown as Worker;

// Mock browser APIs
vi.stubGlobal('setInterval', mockSetInterval);
vi.stubGlobal('clearInterval', mockClearInterval);
vi.stubGlobal('Date', { now: mockDateNow });

describe('timerWorker', () => {
  let originalDateNow: () => number;
  let workerMessageHandler: (e: MessageEvent) => void;
  let currentTime = 1620000000000; // Base timestamp

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    currentTime = 1620000000000;
    mockDateNow.mockImplementation(() => currentTime);

    // Initialize worker
    timerWorker;

    // Get the message handler from the worker
    workerMessageHandler = global.self.onmessage as (e: MessageEvent) => void;

    // Mock setInterval to call callback immediately
    mockSetInterval.mockImplementation((callback: () => void) => {
      callback();
      return 1;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize and send ready message', () => {
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'ready'
    });
  });

  it('should handle setDuration command', () => {
    // Send setDuration command
    workerMessageHandler({
      data: {
        command: 'setDuration',
        duration: 30
      }
    } as MessageEvent);

    // Verify internal state was updated
    // Since we can't access worker's internal state directly,
    // we'll test through subsequent commands

    // Send start command
    workerMessageHandler({
      data: {
        command: 'start'
      }
    } as MessageEvent);

    // Should start with 30 minutes (1800 seconds)
    expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'update',
      timeLeft: 1800,
      formattedTime: '30:00',
      progress: 0
    }));
  });

  it('should handle start command', () => {
    // First set duration
    workerMessageHandler({
      data: {
        command: 'setDuration',
        duration: 25
      }
    } as MessageEvent);

    // Send start command
    workerMessageHandler({
      data: {
        command: 'start'
      }
    } as MessageEvent);

    // Verify timer started
    expect(mockSetInterval).toHaveBeenCalled();
    expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'update',
      timeLeft: 1500,
      formattedTime: '25:00',
      progress: 0
    }));
  });

  it('should handle pause command', () => {
    // First set duration and start
    workerMessageHandler({
      data: {
        command: 'setDuration',
        duration: 25
      }
    } as MessageEvent);

    workerMessageHandler({
      data: {
        command: 'start'
      }
    } as MessageEvent);

    // Send pause command
    workerMessageHandler({
      data: {
        command: 'pause'
      }
    } as MessageEvent);

    // Verify timer paused
    expect(mockClearInterval).toHaveBeenCalled();
  });

  it('should handle reset command', () => {
    // First set duration, start and pause
    workerMessageHandler({
      data: {
        command: 'setDuration',
        duration: 25
      }
    } as MessageEvent);

    workerMessageHandler({
      data: {
        command: 'start'
      }
    } as MessageEvent);

    workerMessageHandler({
      data: {
        command: 'pause'
      }
    } as MessageEvent);

    // Send reset command
    workerMessageHandler({
      data: {
        command: 'reset'
      }
    } as MessageEvent);

    // Verify timer reset
    expect(mockClearInterval).toHaveBeenCalled();
    expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'update',
      timeLeft: 1500,
      formattedTime: '25:00',
      progress: 0
    }));
  });

  it('should correctly calculate time left and progress', () => {
    // Mock setInterval to control time progression
    let intervalCallback: () => void;
    mockSetInterval.mockImplementation((callback: () => void) => {
      intervalCallback = callback;
      return 1;
    });

    // Set duration
    workerMessageHandler({
      data: {
        command: 'setDuration',
        duration: 2
      }
    } as MessageEvent);

    // Start timer
    workerMessageHandler({
      data: {
        command: 'start'
      }
    } as MessageEvent);

    // Simulate 30 seconds passing
    currentTime += 30000;
    intervalCallback();

    // Should have 90 seconds left (2 min - 30 sec)
    // Progress should be 25% (30 sec / 120 sec)
    expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'update',
      timeLeft: 90,
      formattedTime: '01:30',
      progress: 25
    }));

    // Simulate another 60 seconds passing
    currentTime += 60000;
    intervalCallback();

    // Should have 30 seconds left
    // Progress should be 75% (90 sec / 120 sec)
    expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'update',
      timeLeft: 30,
      formattedTime: '00:30',
      progress: 75
    }));

    // Simulate final 30 seconds passing
    currentTime += 30000;
    intervalCallback();

    // Should complete
    expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'complete'
    }));
    expect(mockClearInterval).toHaveBeenCalled();
  });

  it('should format time correctly', () => {
    // Mock setInterval to control time progression
    let intervalCallback: () => void;
    mockSetInterval.mockImplementation((callback: () => void) => {
      intervalCallback = callback;
      return 1;
    });

    // Set duration (5 minutes 30 seconds)
    workerMessageHandler({
      data: {
        command: 'setDuration',
        duration: 5.5
      }
    } as MessageEvent);

    // Start timer
    workerMessageHandler({
      data: {
        command: 'start'
      }
    } as MessageEvent);

    // Test various time formats
    // 5:30 -> 05:30
    expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({
      formattedTime: '05:30'
    }));

    // Simulate 3 minutes passing
    currentTime += 180000;
    intervalCallback();

    // 2:30 -> 02:30
    expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({
      formattedTime: '02:30'
    }));

    // Simulate 2 minutes passing
    currentTime += 120000;
    intervalCallback();

    // 0:30 -> 00:30
    expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({
      formattedTime: '00:30'
    }));

    // Simulate 25 seconds passing
    currentTime += 25000;
    intervalCallback();

    // 0:05 -> 00:05
    expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({
      formattedTime: '00:05'
    }));
  });

  it('should handle multiple commands in sequence', () => {
    // Mock setInterval to control time
    let intervalCallback: () => void;
    mockSetInterval.mockImplementation((callback: () => void) => {
      intervalCallback = callback;
      return 1;
    });

    // 1. Set duration
    workerMessageHandler({
      data: {
        command: 'setDuration',
        duration: 1
      }
    } as MessageEvent);

    // 2. Start
    workerMessageHandler({
      data: {
        command: 'start'
      }
    } as MessageEvent);
    expect(mockSetInterval).toHaveBeenCalled();

    // 3. Pause
    workerMessageHandler({
      data: {
        command: 'pause'
      }
    } as MessageEvent);
    expect(mockClearInterval).toHaveBeenCalled();

    // 4. Start again
    workerMessageHandler({
      data: {
        command: 'start'
      }
    } as MessageEvent);
    expect(mockSetInterval).toHaveBeenCalledTimes(2);

    // 5. Change duration while running
    workerMessageHandler({
      data: {
        command: 'setDuration',
        duration: 2
      }
    } as MessageEvent);

    // Simulate time passing
    currentTime += 30000;
    intervalCallback();

    // Should show new duration with 1.5 minutes left
    expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({
      timeLeft: 90,
      formattedTime: '01:30'
    }));

    // 6. Reset
    workerMessageHandler({
      data: {
        command: 'reset'
      }
    } as MessageEvent);
    expect(mockClearInterval).toHaveBeenCalledTimes(2);
    expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({
      timeLeft: 120,
      formattedTime: '02:00',
      progress: 0
    }));
  });

  it('should ignore unknown commands', () => {
    // Send unknown command
    workerMessageHandler({
      data: {
        command: 'unknownCommand',
        someParam: 'value'
      }
    } as MessageEvent);

    // Should not post any message in response
    const unknownCommandCalls = mockPostMessage.mock.calls.filter(call =>
      call[0].type === 'unknown_command'
    );
    expect(unknownCommandCalls.length).toBe(0);
  });
})