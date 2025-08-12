/**
 * 时间格式化 Hook
 * 提供各种时间格式化功能，用于显示时间、日期和相对时间
 */

import { useState, useEffect } from 'react';

/**
 * 时间格式化 Hook 返回值类型
 */
interface TimeFormatReturn {
  // 格式化秒数为 MM:SS 格式
  formatTime: (seconds: number) => string;

  // 格式化分钟为人类可读的字符串
  formatMinutes: (minutes: number) => string;

  // 格式化相对时间（如 "1小时前"）
  formatRelativeTime: (date: string | Date) => string;

  // 格式化日期为 YYYY-MM-DD 格式
  formatDate: (date: string | Date) => string;

  // 格式化日期时间为 YYYY-MM-DD HH:mm 格式
  formatDateTime: (date: string | Date) => string;
}

/**
 * 时间格式化 Hook
 * @returns 时间格式化函数
 */
export function useTimeFormat(): TimeFormatReturn {
  // 状态：当前时间，用于实时更新相对时间
  const [now, setNow] = useState<Date>(new Date());

  // 每分钟更新一次当前时间，用于相对时间计算
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000); // 每分钟更新一次

    return () => clearInterval(interval);
  }, []);

  /**
   * 格式化秒数为 MM:SS 格式
   * @param seconds 秒数
   * @returns 格式化后的时间字符串
   */
  const formatTime = (seconds: number): string => {
    // 处理无效输入
    if (typeof seconds !== 'number' || isNaN(seconds)) {
      return '00:00';
    }

    // 确保非负数
    const totalSeconds = Math.max(0, seconds);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;

    // 如果有小时，显示 H:MM:SS 格式
    if (hours > 0) {
      return `${hours}:${padZero(minutes)}:${padZero(remainingSeconds)}`;
    }

    // 否则显示 M:SS 格式
    return `${minutes}:${padZero(remainingSeconds)}`;
  };

  /**
   * 格式化分钟为人类可读的字符串
   * @param minutes 分钟数
   * @returns 格式化后的时间字符串
   */
  const formatMinutes = (minutes: number): string => {
    // 处理无效输入
    if (typeof minutes !== 'number' || isNaN(minutes)) {
      return '0分钟';
    }

    // 确保非负数
    const totalMinutes = Math.max(0, minutes);

    const days = Math.floor(totalMinutes / 1440); // 1440分钟 = 1天
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const remainingMinutes = totalMinutes % 60;

    const parts: string[] = [];

    if (days > 0) {
      parts.push(`${days}天`);
    }

    if (hours > 0) {
      parts.push(`${hours}小时`);
    }

    if (remainingMinutes > 0 || parts.length === 0) {
      parts.push(`${remainingMinutes}分钟`);
    }

    return parts.join('');
  };

  /**
   * 格式化相对时间（如 "1小时前"）
   * @param date 日期字符串或 Date 对象
   * @returns 格式化后的相对时间字符串
   */
  const formatRelativeTime = (date: string | Date): string => {
    try {
      const targetDate = typeof date === 'string' ? new Date(date) : date;

      // 检查日期是否有效
      if (isNaN(targetDate.getTime())) {
        return '无效日期';
      }

      const diffInMs = now.getTime() - targetDate.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      const diffInWeeks = Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 7));
      const diffInMonths = Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 30));

      if (diffInMinutes < 1) {
        return '刚刚';
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes}分钟前`;
      } else if (diffInHours < 24) {
        return `${diffInHours}小时前`;
      } else if (diffInDays < 7) {
        return `${diffInDays}天前`;
      } else if (diffInWeeks < 4) {
        return `${diffInWeeks}周前`;
      } else {
        return `${diffInMonths}个月前`;
      }
    } catch (error) {
      return '无效日期';
    }
  };

  /**
   * 格式化日期为 YYYY-MM-DD 格式
   * @param date 日期字符串或 Date 对象
   * @returns 格式化后的日期字符串
   */
  const formatDate = (date: string | Date): string => {
    try {
      const targetDate = typeof date === 'string' ? new Date(date) : date;

      // 检查日期是否有效
      if (isNaN(targetDate.getTime())) {
        return '无效日期';
      }

      const year = targetDate.getFullYear();
      const month = padZero(targetDate.getMonth() + 1);
      const day = padZero(targetDate.getDate());

      return `${year}-${month}-${day}`;
    } catch (error) {
      return '无效日期';
    }
  };

  /**
   * 格式化日期时间为 YYYY-MM-DD HH:mm 格式
   * @param date 日期字符串或 Date 对象
   * @returns 格式化后的日期时间字符串
   */
  const formatDateTime = (date: string | Date): string => {
    try {
      const targetDate = typeof date === 'string' ? new Date(date) : date;

      // 检查日期是否有效
      if (isNaN(targetDate.getTime())) {
        return '无效日期';
      }

      const year = targetDate.getFullYear();
      const month = padZero(targetDate.getMonth() + 1);
      const day = padZero(targetDate.getDate());
      const hours = padZero(targetDate.getHours());
      const minutes = padZero(targetDate.getMinutes());

      return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch (error) {
      return '无效日期';
    }
  };

  /**
   * 将数字补零到两位数
   * @param num 数字
   * @returns 补零后的字符串
   */
  const padZero = (num: number): string => {
    return num.toString().padStart(2, '0');
  };

  return {
    formatTime,
    formatMinutes,
    formatRelativeTime,
    formatDate,
    formatDateTime
  };
}
