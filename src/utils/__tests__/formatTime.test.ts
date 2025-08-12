/**
 * formatTime 工具函数测试
 * 
 * 测试时间格式化功能的各种场景
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

describe('formatTime', () => {
  // ==================== BASIC FUNCTIONALITY TESTS ====================
  describe('Basic Functionality', () => {
    it('formats seconds correctly', () => {
      // Arrange
      const seconds = 30;

      // Act
      const result = formatTime(seconds);

      // Assert
      expect(result).toBe('0:30');
    });

    it('formats minutes correctly', () => {
      // Arrange
      const seconds = 300; // 5 minutes

      // Act
      const result = formatTime(seconds);

      // Assert
      expect(result).toBe('5:00');
    });

    it('formats minutes and seconds correctly', () => {
      // Arrange
      const seconds = 1545; // 25 minutes 45 seconds

      // Act
      const result = formatTime(seconds);

      // Assert
      expect(result).toBe('25:45');
    });

    it('formats hours correctly', () => {
      // Arrange
      const seconds = 3661; // 1 hour 1 minute 1 second

      // Act
      const result = formatTime(seconds);

      // Assert
      expect(result).toBe('1:01:01');
    });
  });

  // ==================== EDGE CASES TESTS ====================
  describe('Edge Cases', () => {
    it('handles zero seconds', () => {
      // Arrange
      const seconds = 0;

      // Act
      const result = formatTime(seconds);

      // Assert
      expect(result).toBe('0:00');
    });

    it('handles negative numbers', () => {
      // Arrange
      const seconds = -30;

      // Act
      const result = formatTime(seconds);

      // Assert
      expect(result).toBe('0:00');
    });

    it('handles decimal numbers', () => {
      // Arrange
      const seconds = 90.7;

      // Act
      const result = formatTime(seconds);

      // Assert
      expect(result).toBe('1:30'); // Should floor the decimal
    });

    it('handles very large numbers', () => {
      // Arrange
      const seconds = 359999; // 99:59:59

      // Act
      const result = formatTime(seconds);

      // Assert
      expect(result).toBe('99:59:59');
    });
  });

  // ==================== PADDING TESTS ====================
  describe('Padding', () => {
    it('pads single digit seconds with zero', () => {
      // Arrange
      const seconds = 65; // 1:05

      // Act
      const result = formatTime(seconds);

      // Assert
      expect(result).toBe('1:05');
    });

    it('pads single digit minutes with zero when hours present', () => {
      // Arrange
      const seconds = 3665; // 1:01:05

      // Act
      const result = formatTime(seconds);

      // Assert
      expect(result).toBe('1:01:05');
    });

    it('does not pad single digit minutes when no hours', () => {
      // Arrange
      const seconds = 65; // 1:05

      // Act
      const result = formatTime(seconds);

      // Assert
      expect(result).toBe('1:05');
      expect(result).not.toBe('01:05');
    });
  });

  // ==================== COMMON USE CASES TESTS ====================
  describe('Common Use Cases', () => {
    it('formats pomodoro focus time (25 minutes)', () => {
      // Arrange
      const seconds = 1500;

      // Act
      const result = formatTime(seconds);

      // Assert
      expect(result).toBe('25:00');
    });

    it('formats pomodoro break time (5 minutes)', () => {
      // Arrange
      const seconds = 300;

      // Act
      const result = formatTime(seconds);

      // Assert
      expect(result).toBe('5:00');
    });

    it('formats long break time (15 minutes)', () => {
      // Arrange
      const seconds = 900;

      // Act
      const result = formatTime(seconds);

      // Assert
      expect(result).toBe('15:00');
    });

    it('formats one second remaining', () => {
      // Arrange
      const seconds = 1;

      // Act
      const result = formatTime(seconds);

      // Assert
      expect(result).toBe('0:01');
    });
  });

  // ==================== PERFORMANCE TESTS ====================
  describe('Performance', () => {
    it('handles multiple calls efficiently', () => {
      // Arrange
      const testValues = [0, 30, 60, 300, 1500, 3600];
      const startTime = performance.now();

      // Act
      for (let i = 0; i < 1000; i++) {
        testValues.forEach(value => formatTime(value));
      }
      const endTime = performance.now();

      // Assert
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });
  });
});

// ==================== HELPER FUNCTION TESTS ====================
describe('padZero', () => {
  it('pads single digit numbers with zero', () => {
    expect(padZero(5)).toBe('05');
    expect(padZero(0)).toBe('00');
    expect(padZero(9)).toBe('09');
  });

  it('does not pad double digit numbers', () => {
    expect(padZero(10)).toBe('10');
    expect(padZero(25)).toBe('25');
    expect(padZero(59)).toBe('59');
  });

  it('handles large numbers correctly', () => {
    expect(padZero(100)).toBe('100');
    expect(padZero(999)).toBe('999');
  });

  it('handles negative numbers', () => {
    expect(padZero(-5)).toBe('-5');
    expect(padZero(-10)).toBe('-10');
  });
});

describe('parseTimeString', () => {
  describe('MM:SS format', () => {
    it('parses minutes and seconds correctly', () => {
      expect(parseTimeString('25:00')).toBe(1500);
      expect(parseTimeString('5:30')).toBe(330);
      expect(parseTimeString('0:45')).toBe(45);
    });

    it('handles single digit values', () => {
      expect(parseTimeString('1:05')).toBe(65);
      expect(parseTimeString('0:01')).toBe(1);
    });
  });

  describe('HH:MM:SS format', () => {
    it('parses hours, minutes and seconds correctly', () => {
      expect(parseTimeString('1:30:45')).toBe(5445);
      expect(parseTimeString('2:00:00')).toBe(7200);
      expect(parseTimeString('0:05:30')).toBe(330);
    });
  });

  describe('Error handling', () => {
    it('throws error for invalid format', () => {
      expect(() => parseTimeString('invalid')).toThrow('Invalid time format: invalid');
      expect(() => parseTimeString('25')).toThrow('Invalid time format: 25');
      expect(() => parseTimeString('25:00:00:00')).toThrow('Invalid time format: 25:00:00:00');
    });

    it('throws error for empty string', () => {
      expect(() => parseTimeString('')).toThrow('Invalid time format: ');
    });
  });
});

describe('formatDuration', () => {
  it('formats seconds only', () => {
    expect(formatDuration(30)).toBe('30 seconds');
    expect(formatDuration(1)).toBe('1 second');
    expect(formatDuration(0)).toBe('0 seconds');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(90)).toBe('1 minute 30 seconds');
    expect(formatDuration(120)).toBe('2 minutes');
    expect(formatDuration(61)).toBe('1 minute 1 second');
  });

  it('formats hours, minutes and seconds', () => {
    expect(formatDuration(3661)).toBe('1 hour 1 minute 1 second');
    expect(formatDuration(7200)).toBe('2 hours');
    expect(formatDuration(3600)).toBe('1 hour');
    expect(formatDuration(3720)).toBe('1 hour 2 minutes');
  });

  it('handles negative numbers', () => {
    expect(formatDuration(-30)).toBe('0 seconds');
  });

  it('handles decimal numbers', () => {
    expect(formatDuration(90.7)).toBe('1 minute 30 seconds');
  });

  it('uses correct singular/plural forms', () => {
    expect(formatDuration(1)).toBe('1 second');
    expect(formatDuration(2)).toBe('2 seconds');
    expect(formatDuration(60)).toBe('1 minute');
    expect(formatDuration(120)).toBe('2 minutes');
    expect(formatDuration(3600)).toBe('1 hour');
    expect(formatDuration(7200)).toBe('2 hours');
  });
});

describe('formatTimeShort', () => {
  it('formats seconds only', () => {
    expect(formatTimeShort(30)).toBe('30s');
    expect(formatTimeShort(1)).toBe('1s');
    expect(formatTimeShort(0)).toBe('0s');
  });

  it('formats minutes and seconds', () => {
    expect(formatTimeShort(90)).toBe('1m 30s');
    expect(formatTimeShort(120)).toBe('2m');
    expect(formatTimeShort(61)).toBe('1m 1s');
  });

  it('formats hours, minutes and seconds', () => {
    expect(formatTimeShort(3661)).toBe('1h 1m 1s');
    expect(formatTimeShort(7200)).toBe('2h');
    expect(formatTimeShort(3600)).toBe('1h');
    expect(formatTimeShort(3720)).toBe('1h 2m');
  });

  it('handles negative numbers', () => {
    expect(formatTimeShort(-30)).toBe('0s');
  });

  it('handles decimal numbers', () => {
    expect(formatTimeShort(90.7)).toBe('1m 30s');
  });
});
