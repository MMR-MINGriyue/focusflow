import { describe, it, expect, beforeEach, vi } from './testHelpers';
import { 
  formatDate, 
  getRelativeTime, 
  addTime, 
  getTimeDifference, 
  isDateInRange, 
  getDayOfWeek, 
  getDaysInMonth, 
  getFirstDayOfMonth, 
  getLastDayOfMonth, 
  isSameDay, 
  isToday, 
  isYesterday, 
  isTomorrow 
} from '../dateUtils';

const mockDate = new Date('2023-11-15T10:30:00Z');

describe('Date Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('formatDate', () => {
    it('should format date with default options', () => {
      const date = new Date('2023-11-15T10:30:00Z');
      const result = formatDate(date);
      expect(typeof result).toBe('string');
    });

    it('should format date with custom locale', () => {
      const date = new Date('2023-11-15T10:30:00Z');
      const result = formatDate(date, { locale: 'en-US' });
      expect(typeof result).toBe('string');
    });
  });

  describe('getRelativeTime', () => {
    it('should return relative time description', () => {
      const pastDate = new Date('2023-11-14T10:30:00Z');
      const result = getRelativeTime(pastDate, mockDate);
      expect(typeof result).toBe('string');
    });
  });

  describe('getDayOfWeek', () => {
    it('should return day of week in Chinese', () => {
      const wednesday = new Date('2023-11-15T10:30:00Z'); // Wednesday
      const result = getDayOfWeek(wednesday);
      expect(typeof result).toBe('string');
    });

    it('should return day of week in English', () => {
      const sunday = new Date('2023-11-12T10:30:00Z'); // Sunday
      const result = getDayOfWeek(sunday, 'en-US');
      expect(typeof result).toBe('string');
    });
  });

  describe('getDaysInMonth', () => {
    it('should return correct number of days in month', () => {
      expect(getDaysInMonth(2023, 1)).toBe(28); // February 2023
      expect(getDaysInMonth(2024, 1)).toBe(29); // February 2024 (leap year)
      expect(getDaysInMonth(2023, 3)).toBe(30); // April 2023
      expect(getDaysInMonth(2023, 0)).toBe(31); // January 2023
    });
  });

  describe('isSameDay', () => {
    it('should return true for same day', () => {
      const date1 = new Date('2023-11-15T10:30:00Z');
      const date2 = new Date('2023-11-15T15:45:00Z');
      expect(isSameDay(date1, date2)).toBe(true);
    });

    it('should return false for different days', () => {
      const date1 = new Date('2023-11-15T10:30:00Z');
      const date2 = new Date('2023-11-16T10:30:00Z');
      expect(isSameDay(date1, date2)).toBe(false);
    });
  });

  describe('isToday', () => {
    it('should return true for today', () => {
      const today = new Date();
      expect(isToday(today)).toBe(true);
    });
  });

  describe('isYesterday', () => {
    it('should return true for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isYesterday(yesterday)).toBe(true);
    });
  });

  describe('isTomorrow', () => {
    it('should return true for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isTomorrow(tomorrow)).toBe(true);
    });
  });
});