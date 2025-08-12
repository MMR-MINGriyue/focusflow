/**
 * 日期和时间处理工具函数
 * 提供日期格式化、计算和比较等功能
 */

/**
 * 日期格式化选项
 */
export interface DateFormatOptions {
  /**
   * 日期格式
   */
  format?: 'short' | 'medium' | 'long' | 'full' | 'custom';
  /**
   * 自定义格式
   */
  customFormat?: string;
  /**
   * 是否包含时间
   */
  includeTime?: boolean;
  /**
   * 时区
   */
  timeZone?: string;
  /**
   * 语言环境
   */
  locale?: string;
}

/**
 * 时间单位
 */
export type TimeUnit = 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';

/**
 * 格式化日期
 * @param date 日期对象、时间戳或日期字符串
 * @param options 格式化选项
 * @returns 格式化后的日期字符串
 */
export function formatDate(
  date: Date | number | string,
  options: DateFormatOptions = {}
): string {
  const {
    format = 'medium',
    customFormat,
    includeTime = false,
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
    locale = navigator.language || 'zh-CN'
  } = options;

  const dateObj = typeof date === 'number' || typeof date === 'string'
    ? new Date(date)
    : date;

  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date');
  }

  // 如果是自定义格式，使用自定义格式化
  if (format === 'custom' && customFormat) {
    return formatCustomDate(dateObj, customFormat, locale);
  }

  // 根据格式选项创建格式化器
  const formatOptions: Intl.DateTimeFormatOptions = {
    timeZone,
  };

  switch (format) {
    case 'short':
      formatOptions.dateStyle = 'short';
      if (includeTime) formatOptions.timeStyle = 'short';
      break;
    case 'medium':
      formatOptions.dateStyle = 'medium';
      if (includeTime) formatOptions.timeStyle = 'medium';
      break;
    case 'long':
      formatOptions.dateStyle = 'long';
      if (includeTime) formatOptions.timeStyle = 'long';
      break;
    case 'full':
      formatOptions.dateStyle = 'full';
      if (includeTime) formatOptions.timeStyle = 'full';
      break;
  }

  return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
}

/**
 * 使用自定义格式格式化日期
 * @param date 日期对象
 * @param format 自定义格式
 * @param locale 语言环境
 * @returns 格式化后的日期字符串
 */
function formatCustomDate(date: Date, format: string, locale: string = 'zh-CN'): string {
  const tokens: { [key: string]: string } = {
    'YYYY': date.getFullYear().toString(),
    'YY': date.getFullYear().toString().slice(-2),
    'MM': (date.getMonth() + 1).toString().padStart(2, '0'),
    'M': (date.getMonth() + 1).toString(),
    'DD': date.getDate().toString().padStart(2, '0'),
    'D': date.getDate().toString(),
    'HH': date.getHours().toString().padStart(2, '0'),
    'H': date.getHours().toString(),
    'mm': date.getMinutes().toString().padStart(2, '0'),
    'm': date.getMinutes().toString(),
    'ss': date.getSeconds().toString().padStart(2, '0'),
    's': date.getSeconds().toString(),
  };

  // 处理中文月份
  if (locale.startsWith('zh')) {
    const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    tokens['MMMM'] = months[date.getMonth()];
    tokens['MMM'] = months[date.getMonth()].slice(0, 2);
  } else {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    tokens['MMMM'] = months[date.getMonth()];
    tokens['MMM'] = months[date.getMonth()].slice(0, 3);
  }

  // 处理星期
  if (locale.startsWith('zh')) {
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    tokens['dddd'] = days[date.getDay()];
    tokens['ddd'] = days[date.getDay()].slice(0, 2);
  } else {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    tokens['dddd'] = days[date.getDay()];
    tokens['ddd'] = days[date.getDay()].slice(0, 3);
  }

  // 替换格式中的标记
  let result = format;
  for (const [token, value] of Object.entries(tokens)) {
    result = result.replace(new RegExp(token, 'g'), value);
  }

  return result;
}

/**
 * 获取相对时间描述
 * @param date 日期对象、时间戳或日期字符串
 * @param referenceDate 参考日期，默认为当前日期
 * @param locale 语言环境
 * @returns 相对时间描述
 */
export function getRelativeTime(
  date: Date | number | string,
  referenceDate: Date | number | string = new Date(),
  locale: string = 'zh-CN'
): string {
  const dateObj = typeof date === 'number' || typeof date === 'string'
    ? new Date(date)
    : date;

  const referenceDateObj = typeof referenceDate === 'number' || typeof referenceDate === 'string'
    ? new Date(referenceDate)
    : referenceDate;

  if (isNaN(dateObj.getTime()) || isNaN(referenceDateObj.getTime())) {
    throw new Error('Invalid date');
  }

  const diffMs = dateObj.getTime() - referenceDateObj.getTime();
  const diffSeconds = Math.floor(Math.abs(diffMs) / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffSeconds < 60) {
    return rtf.format(-diffSeconds, 'second');
  } else if (diffMinutes < 60) {
    return rtf.format(-diffMinutes, 'minute');
  } else if (diffHours < 24) {
    return rtf.format(-diffHours, 'hour');
  } else if (diffDays < 7) {
    return rtf.format(-diffDays, 'day');
  } else if (diffWeeks < 4) {
    return rtf.format(-diffWeeks, 'week');
  } else if (diffMonths < 12) {
    return rtf.format(-diffMonths, 'month');
  } else {
    return rtf.format(-diffYears, 'year');
  }
}

/**
 * 添加时间单位
 * @param date 日期对象、时间戳或日期字符串
 * @param amount 数量
 * @param unit 时间单位
 * @returns 新的日期对象
 */
export function addTime(
  date: Date | number | string,
  amount: number,
  unit: TimeUnit
): Date {
  const dateObj = typeof date === 'number' || typeof date === 'string'
    ? new Date(date)
    : date;

  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date');
  }

  const result = new Date(dateObj);

  switch (unit) {
    case 'seconds':
      result.setSeconds(result.getSeconds() + amount);
      break;
    case 'minutes':
      result.setMinutes(result.getMinutes() + amount);
      break;
    case 'hours':
      result.setHours(result.getHours() + amount);
      break;
    case 'days':
      result.setDate(result.getDate() + amount);
      break;
    case 'weeks':
      result.setDate(result.getDate() + amount * 7);
      break;
    case 'months':
      result.setMonth(result.getMonth() + amount);
      break;
    case 'years':
      result.setFullYear(result.getFullYear() + amount);
      break;
  }

  return result;
}

/**
 * 计算两个日期之间的差异
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @param unit 时间单位
 * @returns 差异值
 */
export function getTimeDifference(
  startDate: Date | number | string,
  endDate: Date | number | string,
  unit: TimeUnit = 'days'
): number {
  const startDateObj = typeof startDate === 'number' || typeof startDate === 'string'
    ? new Date(startDate)
    : startDate;

  const endDateObj = typeof endDate === 'number' || typeof endDate === 'string'
    ? new Date(endDate)
    : endDate;

  if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
    throw new Error('Invalid date');
  }

  const diffMs = endDateObj.getTime() - startDateObj.getTime();

  switch (unit) {
    case 'seconds':
      return Math.floor(diffMs / 1000);
    case 'minutes':
      return Math.floor(diffMs / (1000 * 60));
    case 'hours':
      return Math.floor(diffMs / (1000 * 60 * 60));
    case 'days':
      return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    case 'weeks':
      return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
    case 'months':
      return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
    case 'years':
      return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365));
    default:
      return diffMs;
  }
}

/**
 * 检查日期是否在范围内
 * @param date 要检查的日期
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 是否在范围内
 */
export function isDateInRange(
  date: Date | number | string,
  startDate: Date | number | string,
  endDate: Date | number | string
): boolean {
  const dateObj = typeof date === 'number' || typeof date === 'string'
    ? new Date(date)
    : date;

  const startDateObj = typeof startDate === 'number' || typeof startDate === 'string'
    ? new Date(startDate)
    : startDate;

  const endDateObj = typeof endDate === 'number' || typeof endDate === 'string'
    ? new Date(endDate)
    : endDate;

  if (isNaN(dateObj.getTime()) || isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
    throw new Error('Invalid date');
  }

  return dateObj >= startDateObj && dateObj <= endDateObj;
}

/**
 * 获取日期是星期几
 * @param date 日期对象、时间戳或日期字符串
 * @param locale 语言环境
 * @returns 星期几的名称
 */
export function getDayOfWeek(
  date: Date | number | string,
  locale: string = 'zh-CN'
): string {
  const dateObj = typeof date === 'number' || typeof date === 'string'
    ? new Date(date)
    : date;

  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date');
  }

  return dateObj.toLocaleDateString(locale, { weekday: 'long' });
}

/**
 * 获取月份的天数
 * @param year 年份
 * @param month 月份（0-11）
 * @returns 天数
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * 获取月份的第一天
 * @param year 年份
 * @param month 月份（0-11）
 * @returns 月份的第一天
 */
export function getFirstDayOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

/**
 * 获取月份的最后一天
 * @param year 年份
 * @param month 月份（0-11）
 * @returns 月份的最后一天
 */
export function getLastDayOfMonth(year: number, month: number): Date {
  return new Date(year, month + 1, 0);
}

/**
 * 检查是否为同一天
 * @param date1 第一个日期
 * @param date2 第二个日期
 * @returns 是否为同一天
 */
export function isSameDay(
  date1: Date | number | string,
  date2: Date | number | string
): boolean {
  const date1Obj = typeof date1 === 'number' || typeof date1 === 'string'
    ? new Date(date1)
    : date1;

  const date2Obj = typeof date2 === 'number' || typeof date2 === 'string'
    ? new Date(date2)
    : date2;

  if (isNaN(date1Obj.getTime()) || isNaN(date2Obj.getTime())) {
    throw new Error('Invalid date');
  }

  return (
    date1Obj.getFullYear() === date2Obj.getFullYear() &&
    date1Obj.getMonth() === date2Obj.getMonth() &&
    date1Obj.getDate() === date2Obj.getDate()
  );
}

/**
 * 检查是否为今天
 * @param date 日期对象、时间戳或日期字符串
 * @returns 是否为今天
 */
export function isToday(date: Date | number | string): boolean {
  return isSameDay(date, new Date());
}

/**
 * 检查是否为昨天
 * @param date 日期对象、时间戳或日期字符串
 * @returns 是否为昨天
 */
export function isYesterday(date: Date | number | string): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
}

/**
 * 检查是否为明天
 * @param date 日期对象、时间戳或日期字符串
 * @returns 是否为明天
 */
export function isTomorrow(date: Date | number | string): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isSameDay(date, tomorrow);
}
