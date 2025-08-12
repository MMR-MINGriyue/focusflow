import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { useTimeFormat } from './useTimeFormat';

describe('useTimeFormat hook', () => {
  it('should format seconds into MM:SS format', () => {
    const { result } = renderHook(() => useTimeFormat());

    // Test various cases
    expect(result.current.formatTime(0)).toBe('00:00');
    expect(result.current.formatTime(5)).toBe('00:05');
    expect(result.current.formatTime(60)).toBe('01:00');
    expect(result.current.formatTime(125)).toBe('02:05');
    expect(result.current.formatTime(3600)).toBe('60:00');
    expect(result.current.formatTime(3665)).toBe('61:05');
  });

  it('should format minutes into human-readable string', () => {
    const { result } = renderHook(() => useTimeFormat());

    // Test various cases
    expect(result.current.formatMinutes(0)).toBe('0分钟');
    expect(result.current.formatMinutes(1)).toBe('1分钟');
    expect(result.current.formatMinutes(5)).toBe('5分钟');
    expect(result.current.formatMinutes(60)).toBe('1小时');
    expect(result.current.formatMinutes(65)).toBe('1小时5分钟');
    expect(result.current.formatMinutes(120)).toBe('2小时');
    expect(result.current.formatMinutes(150)).toBe('2小时30分钟');
    expect(result.current.formatMinutes(1440)).toBe('1天');
    expect(result.current.formatMinutes(1500)).toBe('1天1小时');
  });

  it('should format dates into relative time strings', () => {
    const { result } = renderHook(() => useTimeFormat());
    const now = Date.now();
    const oneHourAgo = new Date(now - 3600000).toISOString();
    const twoDaysAgo = new Date(now - 2 * 86400000).toISOString();
    const oneWeekAgo = new Date(now - 7 * 86400000).toISOString();
    const oneMonthAgo = new Date(now - 30 * 86400000).toISOString();

    // Test various cases
    expect(result.current.formatRelativeTime(new Date().toISOString())).toBe('刚刚');
    expect(result.current.formatRelativeTime(oneHourAgo)).toBe('1小时前');
    expect(result.current.formatRelativeTime(twoDaysAgo)).toBe('2天前');
    expect(result.current.formatRelativeTime(oneWeekAgo)).toBe('1周前');
    expect(result.current.formatRelativeTime(oneMonthAgo)).toBe('1个月前');
  });

  it('should format dates into standard format', () => {
    const { result } = renderHook(() => useTimeFormat());
    const testDate = '2023-10-05T14:30:00Z';

    expect(result.current.formatDate(testDate)).toBe('2023-10-05');
    expect(result.current.formatDateTime(testDate)).toBe('2023-10-05 14:30');
  });

  it('should handle invalid inputs gracefully', () => {
    const { result } = renderHook(() => useTimeFormat());

    // @ts-ignore - Testing invalid inputs
    expect(result.current.formatTime('invalid')).toBe('00:00');
    // @ts-ignore - Testing invalid inputs
    expect(result.current.formatMinutes('invalid')).toBe('0分钟');
    expect(result.current.formatRelativeTime('invalid-date')).toBe('无效日期');
    expect(result.current.formatDate('invalid-date')).toBe('无效日期');
  });
})