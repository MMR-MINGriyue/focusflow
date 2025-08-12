import { describe, it, expect } from './testHelpers';
import { validateTimerSettings, validateSessionData, validateUserInput, isValidTimeFormat, validateColorHex, validatePositiveNumber, validatePercentage, validateTimeRange } from './validationUtils';

// Mock any dependencies if needed
vi.mock('../types/app.types', () => ({
  TimerMode: {
    CLASSIC: 'classic',
    SMART: 'smart'
  }
}));

describe('validationUtils', () => {
  describe('validateTimerSettings', () => {
    it('should validate valid timer settings', () => {
      const validSettings = {
        mode: 'classic',
        workDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        longBreakInterval: 4,
        autoStartBreaks: true,
        autoStartPomodoros: false
      };

      const result = validateTimerSettings(validSettings);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should return errors for invalid timer settings', () => {
      const invalidSettings = {
        mode: 'invalid' as any,
        workDuration: -5,
        shortBreakDuration: 0,
        longBreakDuration: 61,
        longBreakInterval: 0,
        autoStartBreaks: 'yes', // Wrong type
        autoStartPomodoros: 'no' // Wrong type
      };

      const result = validateTimerSettings(invalidSettings);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveProperty('mode');
      expect(result.errors).toHaveProperty('workDuration');
      expect(result.errors).toHaveProperty('shortBreakDuration');
      expect(result.errors).toHaveProperty('longBreakDuration');
      expect(result.errors).toHaveProperty('longBreakInterval');
      expect(result.errors).toHaveProperty('autoStartBreaks');
      expect(result.errors).toHaveProperty('autoStartPomodoros');
    });

    it('should validate smart mode settings', () => {
      const smartSettings = {
        mode: 'smart',
        focusFactor: 0.75,
        difficulty: 'medium',
        adaptiveness: 'high'
      };

      const result = validateTimerSettings(smartSettings);
      expect(result.isValid).toBe(true);
    });

    it('should validate custom mode settings', () => {
      const customSettings = {
        mode: 'custom' as any,
        workDuration: 30,
        shortBreakDuration: 10,
        longBreakDuration: 20,
        longBreakInterval: 3
      };

      const result = validateTimerSettings(customSettings);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateSessionData', () => {
    it('should validate valid session data', () => {
      const validSession = {
        id: 'session-123',
        type: 'focus' as 'focus',
        startTime: new Date().toISOString(),
        duration: 1500,
        completed: true,
        tags: ['work', 'coding']
      };

      const result = validateSessionData(validSession);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should return errors for invalid session data', () => {
      const invalidSession = {
        id: '123' as any, // Wrong type
        type: 'invalid-type',
        startTime: 'not-a-date',
        duration: '1500', // Wrong type
        completed: 'yes', // Wrong type
        tags: 'work' // Wrong type
      };

      const result = validateSessionData(invalidSession);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveProperty('id');
      expect(result.errors).toHaveProperty('type');
      expect(result.errors).toHaveProperty('startTime');
      expect(result.errors).toHaveProperty('duration');
      expect(result.errors).toHaveProperty('completed');
      expect(result.errors).toHaveProperty('tags');
    });
  });

  describe('validateUserInput', () => {
    it('should validate required string input', () => {
      expect(validateUserInput('test', { required: true })).toBe(true);
      expect(validateUserInput('', { required: true })).toBe(false);
      expect(validateUserInput(null, { required: true })).toBe(false);
    });

    it('should validate string length', () => {
      expect(validateUserInput('test', { minLength: 2, maxLength: 10 })).toBe(true);
      expect(validateUserInput('a', { minLength: 2 })).toBe(false);
      expect(validateUserInput('too long string', { maxLength: 10 })).toBe(false);
    });

    it('should validate email format', () => {
      expect(validateUserInput('test@example.com', { type: 'email' })).toBe(true);
      expect(validateUserInput('invalid-email', { type: 'email' })).toBe(false);
      expect(validateUserInput('missing@domain', { type: 'email' })).toBe(false);
    });

    it('should validate pattern matching', () => {
      const alphanumericPattern = /^[a-zA-Z0-9]+$/;
      expect(validateUserInput('test123', { pattern: alphanumericPattern })).toBe(true);
      expect(validateUserInput('test 123', { pattern: alphanumericPattern })).toBe(false);
      expect(validateUserInput('test@123', { pattern: alphanumericPattern })).toBe(false);
    });
  });

  describe('isValidTimeFormat', () => {
    it('should validate valid time formats', () => {
      expect(isValidTimeFormat('00:00')).toBe(true);
      expect(isValidTimeFormat('01:30')).toBe(true);
      expect(isValidTimeFormat('25:00')).toBe(true);
      expect(isValidTimeFormat('123:45')).toBe(true);
    });

    it('should invalidate invalid time formats', () => {
      expect(isValidTimeFormat('0:00')).toBe(false);
      expect(isValidTimeFormat('00:0')).toBe(false);
      expect(isValidTimeFormat('00:60')).toBe(false);
      expect(isValidTimeFormat('abc')).toBe(false);
      expect(isValidTimeFormat('12:34:56')).toBe(false);
    });
  });

  describe('validateColorHex', () => {
    it('should validate valid hex color codes', () => {
      expect(validateColorHex('#FFFFFF')).toBe(true);
      expect(validateColorHex('#fff')).toBe(true);
      expect(validateColorHex('#1A2B3C')).toBe(true);
      expect(validateColorHex('#1a2b3c')).toBe(true);
    });

    it('should invalidate invalid hex color codes', () => {
      expect(validateColorHex('#GGGGGG')).toBe(false);
      expect(validateColorHex('FFFFFF')).toBe(false);
      expect(validateColorHex('#FFF')).toBe(true);
      expect(validateColorHex('#1234')).toBe(false);
      expect(validateColorHex('')).toBe(false);
    });
  });

  describe('validatePositiveNumber', () => {
    it('should validate positive numbers', () => {
      expect(validatePositiveNumber(10)).toBe(true);
      expect(validatePositiveNumber(0.5)).toBe(true);
      expect(validatePositiveNumber('10', { isString: true })).toBe(true);
    });

    it('should invalidate non-positive numbers', () => {
      expect(validatePositiveNumber(0)).toBe(false);
      expect(validatePositiveNumber(-5)).toBe(false);
      expect(validatePositiveNumber('not-a-number', { isString: true })).toBe(false);
      expect(validatePositiveNumber('-10', { isString: true })).toBe(false);
    });

    it('should validate numbers within range', () => {
      expect(validatePositiveNumber(5, { min: 1, max: 10 })).toBe(true);
      expect(validatePositiveNumber(0, { min: 1 })).toBe(false);
      expect(validatePositiveNumber(11, { max: 10 })).toBe(false);
      expect(validatePositiveNumber(5, { min: 5, max: 5 })).toBe(true);
    });
  });

  describe('validatePercentage', () => {
    it('should validate valid percentages', () => {
      expect(validatePercentage(0)).toBe(true);
      expect(validatePercentage(50)).toBe(true);
      expect(validatePercentage(100)).toBe(true);
      expect(validatePercentage(0.5)).toBe(true);
      expect(validatePercentage('75', { isString: true })).toBe(true);
    });

    it('should invalidate invalid percentages', () => {
      expect(validatePercentage(-10)).toBe(false);
      expect(validatePercentage(110)).toBe(false);
      expect(validatePercentage('150%', { isString: true })).toBe(false);
      expect(validatePercentage('not-a-number', { isString: true })).toBe(false);
    });
  });

  describe('validateTimeRange', () => {
    it('should validate valid time ranges', () => {
      expect(validateTimeRange(10, 20)).toBe(true);
      expect(validateTimeRange(0, 0)).toBe(true);
      expect(validateTimeRange(5, 5)).toBe(true);
    });

    it('should invalidate invalid time ranges', () => {
      expect(validateTimeRange(20, 10)).toBe(false);
      expect(validateTimeRange(-5, 10)).toBe(false);
      expect(validateTimeRange(10, -5)).toBe(false);
      expect(validateTimeRange(10, 20)).toBe(false);
    });
  });
})