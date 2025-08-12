/**
 * formatTime 工具函数扩展测试
 * 
 * 测试剩余的时间格式化功能
 */

import {
  formatTime,
  padZero,
  parseTimeString,
  formatDuration,
  formatTimeShort,
  getTimeDifference,
  isValidTimeFormat,
  getProgressPercentage,
  formatRemainingTime,
  timeUtils,
} from '../formatTime';

describe('getTimeDifference', () => {
  beforeEach(() => {
    // Mock Date.now for consistent testing
    jest.spyOn(Date, 'now').mockReturnValue(1000000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('calculates difference with end time provided', () => {
    const startTime = 995000; // 5 seconds before
    const endTime = 1000000;
    
    expect(getTimeDifference(startTime, endTime)).toBe(5);
  });

  it('calculates difference with current time when no end time', () => {
    const startTime = 995000; // 5 seconds before current time
    
    expect(getTimeDifference(startTime)).toBe(5);
  });

  it('handles same start and end time', () => {
    const time = 1000000;
    
    expect(getTimeDifference(time, time)).toBe(0);
  });

  it('handles future start time', () => {
    const startTime = 1005000; // 5 seconds in future
    const endTime = 1000000;
    
    expect(getTimeDifference(startTime, endTime)).toBe(-5);
  });

  it('floors decimal results', () => {
    const startTime = 999500; // 0.5 seconds before
    const endTime = 1000000;
    
    expect(getTimeDifference(startTime, endTime)).toBe(0);
  });
});

describe('isValidTimeFormat', () => {
  describe('Valid MM:SS format', () => {
    it('accepts valid minutes and seconds', () => {
      expect(isValidTimeFormat('25:00')).toBe(true);
      expect(isValidTimeFormat('5:30')).toBe(true);
      expect(isValidTimeFormat('0:45')).toBe(true);
      expect(isValidTimeFormat('59:59')).toBe(true);
    });

    it('accepts single digit minutes', () => {
      expect(isValidTimeFormat('1:05')).toBe(true);
      expect(isValidTimeFormat('9:59')).toBe(true);
    });
  });

  describe('Valid HH:MM:SS format', () => {
    it('accepts valid hours, minutes and seconds', () => {
      expect(isValidTimeFormat('1:30:45')).toBe(true);
      expect(isValidTimeFormat('23:59:59')).toBe(true);
      expect(isValidTimeFormat('0:05:30')).toBe(true);
    });

    it('accepts single digit hours', () => {
      expect(isValidTimeFormat('1:05:30')).toBe(true);
      expect(isValidTimeFormat('9:59:59')).toBe(true);
    });
  });

  describe('Invalid formats', () => {
    it('rejects invalid seconds (>59)', () => {
      expect(isValidTimeFormat('25:60')).toBe(false);
      expect(isValidTimeFormat('1:30:60')).toBe(false);
    });

    it('rejects invalid minutes (>59)', () => {
      expect(isValidTimeFormat('1:60:30')).toBe(false);
    });

    it('rejects wrong format', () => {
      expect(isValidTimeFormat('25')).toBe(false);
      expect(isValidTimeFormat('25:00:00:00')).toBe(false);
      expect(isValidTimeFormat('invalid')).toBe(false);
      expect(isValidTimeFormat('')).toBe(false);
    });

    it('rejects negative numbers', () => {
      expect(isValidTimeFormat('-1:30')).toBe(false);
      expect(isValidTimeFormat('1:-30')).toBe(false);
    });

    it('rejects decimal numbers', () => {
      expect(isValidTimeFormat('1.5:30')).toBe(false);
      expect(isValidTimeFormat('1:30.5')).toBe(false);
    });
  });
});

describe('getProgressPercentage', () => {
  it('calculates progress correctly', () => {
    expect(getProgressPercentage(25, 100)).toBe(25);
    expect(getProgressPercentage(50, 100)).toBe(50);
    expect(getProgressPercentage(75, 100)).toBe(75);
    expect(getProgressPercentage(100, 100)).toBe(100);
  });

  it('handles zero current seconds', () => {
    expect(getProgressPercentage(0, 100)).toBe(0);
  });

  it('handles zero total seconds', () => {
    expect(getProgressPercentage(50, 0)).toBe(0);
  });

  it('handles negative total seconds', () => {
    expect(getProgressPercentage(50, -100)).toBe(0);
  });

  it('clamps progress to 0-100 range', () => {
    expect(getProgressPercentage(-10, 100)).toBe(0);
    expect(getProgressPercentage(150, 100)).toBe(100);
  });

  it('rounds to two decimal places', () => {
    expect(getProgressPercentage(33, 100)).toBe(33);
    expect(getProgressPercentage(1, 3)).toBe(33.33);
    expect(getProgressPercentage(2, 3)).toBe(66.67);
  });

  it('handles decimal inputs', () => {
    expect(getProgressPercentage(25.5, 100)).toBe(25.5);
    expect(getProgressPercentage(25, 100.5)).toBe(24.88);
  });
});

describe('formatRemainingTime', () => {
  it('formats positive remaining time', () => {
    expect(formatRemainingTime(1500)).toBe('25:00');
    expect(formatRemainingTime(90)).toBe('1:30');
    expect(formatRemainingTime(30)).toBe('0:30');
  });

  it('handles zero remaining time', () => {
    expect(formatRemainingTime(0)).toBe('0:00');
  });

  it('handles negative remaining time', () => {
    expect(formatRemainingTime(-30)).toBe('0:00');
  });

  it('handles decimal remaining time', () => {
    expect(formatRemainingTime(90.7)).toBe('1:30');
  });
});

describe('timeUtils object', () => {
  it('exports all time utility functions', () => {
    expect(timeUtils.formatTime).toBeDefined();
    expect(timeUtils.padZero).toBeDefined();
    expect(timeUtils.parseTimeString).toBeDefined();
    expect(timeUtils.formatDuration).toBeDefined();
    expect(timeUtils.formatTimeShort).toBeDefined();
    expect(timeUtils.getTimeDifference).toBeDefined();
    expect(timeUtils.isValidTimeFormat).toBeDefined();
    expect(timeUtils.getProgressPercentage).toBeDefined();
    expect(timeUtils.formatRemainingTime).toBeDefined();
  });

  it('functions work correctly when called from timeUtils object', () => {
    expect(timeUtils.formatTime(1500)).toBe('25:00');
    expect(timeUtils.padZero(5)).toBe('05');
    expect(timeUtils.parseTimeString('25:00')).toBe(1500);
    expect(timeUtils.formatDuration(90)).toBe('1 minute 30 seconds');
    expect(timeUtils.formatTimeShort(90)).toBe('1m 30s');
    expect(timeUtils.isValidTimeFormat('25:00')).toBe(true);
    expect(timeUtils.getProgressPercentage(25, 100)).toBe(25);
    expect(timeUtils.formatRemainingTime(90)).toBe('1:30');
  });
});

// ==================== INTEGRATION TESTS ====================
describe('Time Utils Integration', () => {
  it('formatTime and parseTimeString are inverse operations', () => {
    const testCases = [
      { seconds: 30, timeString: '0:30' },
      { seconds: 300, timeString: '5:00' },
      { seconds: 1500, timeString: '25:00' },
      { seconds: 3661, timeString: '1:01:01' },
    ];

    testCases.forEach(({ seconds, timeString }) => {
      // formatTime -> parseTimeString should return original seconds
      expect(parseTimeString(formatTime(seconds))).toBe(seconds);
      
      // parseTimeString -> formatTime should return original string
      expect(formatTime(parseTimeString(timeString))).toBe(timeString);
    });
  });

  it('formatDuration and formatTimeShort provide different representations', () => {
    const seconds = 3661; // 1 hour 1 minute 1 second
    
    const duration = formatDuration(seconds);
    const shortFormat = formatTimeShort(seconds);
    const timeFormat = formatTime(seconds);
    
    expect(duration).toBe('1 hour 1 minute 1 second');
    expect(shortFormat).toBe('1h 1m 1s');
    expect(timeFormat).toBe('1:01:01');
    
    // All should represent the same duration
    expect(parseTimeString(timeFormat)).toBe(seconds);
  });

  it('progress calculation works with formatted time', () => {
    const totalSeconds = 1500; // 25:00
    const currentSeconds = 750; // 12:30
    
    const progress = getProgressPercentage(currentSeconds, totalSeconds);
    const remainingSeconds = totalSeconds - currentSeconds;
    const remainingTime = formatRemainingTime(remainingSeconds);
    
    expect(progress).toBe(50);
    expect(remainingTime).toBe('12:30');
  });
});

// ==================== PERFORMANCE TESTS ====================
describe('Time Utils Performance', () => {
  it('handles large number of operations efficiently', () => {
    const startTime = performance.now();

    for (let i = 0; i < 10000; i++) {
      formatTime(i);
      padZero(i % 60);
      getProgressPercentage(i, 10000);
      formatRemainingTime(i);
    }

    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(500); // Should complete in under 500ms (more lenient)
  });

  it('parseTimeString handles many operations efficiently', () => {
    const testStrings = ['0:30', '5:00', '25:00', '1:01:01'];
    const startTime = performance.now();
    
    for (let i = 0; i < 1000; i++) {
      testStrings.forEach(str => parseTimeString(str));
    }
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(50); // Should complete in under 50ms
  });
});

// ==================== ERROR HANDLING TESTS ====================
describe('Time Utils Error Handling', () => {
  it('handles edge cases gracefully', () => {
    // Very large numbers
    expect(() => formatTime(Number.MAX_SAFE_INTEGER)).not.toThrow();
    expect(() => getProgressPercentage(Number.MAX_SAFE_INTEGER, 100)).not.toThrow();
    
    // Very small numbers
    expect(() => formatTime(Number.MIN_SAFE_INTEGER)).not.toThrow();
    expect(() => getProgressPercentage(Number.MIN_SAFE_INTEGER, 100)).not.toThrow();
    
    // Infinity
    expect(() => formatTime(Infinity)).not.toThrow();
    expect(() => getProgressPercentage(Infinity, 100)).not.toThrow();
    
    // NaN
    expect(() => formatTime(NaN)).not.toThrow();
    expect(() => getProgressPercentage(NaN, 100)).not.toThrow();
  });

  it('provides meaningful error messages', () => {
    expect(() => parseTimeString('invalid')).toThrow('Invalid time format: invalid');
    expect(() => parseTimeString('25')).toThrow('Invalid time format: 25');
    expect(() => parseTimeString('25:00:00:00')).toThrow('Invalid time format: 25:00:00:00');
  });
});
