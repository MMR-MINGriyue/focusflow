/**
 * 时间格式化工具函数
 * 
 * 提供各种时间格式化功能，主要用于计时器显示
 */

/**
 * 将秒数格式化为可读的时间字符串
 * 
 * @param seconds - 要格式化的秒数
 * @returns 格式化后的时间字符串 (例如: "25:00", "1:30:45")
 * 
 * @example
 * formatTime(90)    // "1:30"
 * formatTime(3661)  // "1:01:01"
 * formatTime(30)    // "0:30"
 */
export const formatTime = (seconds: number): string => {
  // 处理负数和小数
  const totalSeconds = Math.max(0, Math.floor(seconds));
  
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
 * 将数字补零到两位数
 * 
 * @param num - 要补零的数字
 * @returns 补零后的字符串
 * 
 * @example
 * padZero(5)  // "05"
 * padZero(15) // "15"
 */
export const padZero = (num: number): string => {
  return num.toString().padStart(2, '0');
};

/**
 * 将时间字符串解析为秒数
 * 
 * @param timeString - 时间字符串 (例如: "25:00", "1:30:45")
 * @returns 对应的秒数
 * 
 * @example
 * parseTimeString("25:00")    // 1500
 * parseTimeString("1:30:45")  // 5445
 */
export const parseTimeString = (timeString: string): number => {
  const parts = timeString.split(':').map(part => parseInt(part, 10));
  
  if (parts.length === 2) {
    // MM:SS 格式
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  } else if (parts.length === 3) {
    // HH:MM:SS 格式
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }
  
  throw new Error(`Invalid time format: ${timeString}`);
};

/**
 * 格式化持续时间为人类可读的字符串
 * 
 * @param seconds - 持续时间（秒）
 * @returns 人类可读的持续时间字符串
 * 
 * @example
 * formatDuration(90)   // "1 minute 30 seconds"
 * formatDuration(3661) // "1 hour 1 minute 1 second"
 */
export const formatDuration = (seconds: number): string => {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;
  
  const parts: string[] = [];
  
  if (hours > 0) {
    parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  }
  
  if (minutes > 0) {
    parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  }
  
  if (remainingSeconds > 0 || parts.length === 0) {
    parts.push(`${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`);
  }
  
  return parts.join(' ');
};

/**
 * 格式化时间为简短格式
 * 
 * @param seconds - 要格式化的秒数
 * @returns 简短格式的时间字符串
 * 
 * @example
 * formatTimeShort(90)   // "1m 30s"
 * formatTimeShort(3661) // "1h 1m 1s"
 */
export const formatTimeShort = (seconds: number): string => {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;
  
  const parts: string[] = [];
  
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  
  if (remainingSeconds > 0 || parts.length === 0) {
    parts.push(`${remainingSeconds}s`);
  }
  
  return parts.join(' ');
};

/**
 * 计算两个时间戳之间的差值
 * 
 * @param startTime - 开始时间戳
 * @param endTime - 结束时间戳（可选，默认为当前时间）
 * @returns 时间差（秒）
 */
export const getTimeDifference = (startTime: number, endTime?: number): number => {
  const end = endTime || Date.now();
  return Math.floor((end - startTime) / 1000);
};

/**
 * 验证时间字符串格式是否正确
 * 
 * @param timeString - 要验证的时间字符串
 * @returns 是否为有效格式
 */
export const isValidTimeFormat = (timeString: string): boolean => {
  const timeRegex = /^(\d{1,2}):([0-5]\d)$|^(\d{1,2}):([0-5]\d):([0-5]\d)$/;
  return timeRegex.test(timeString);
};

/**
 * 将秒数转换为进度百分比
 * 
 * @param currentSeconds - 当前秒数
 * @param totalSeconds - 总秒数
 * @returns 进度百分比 (0-100)
 */
export const getProgressPercentage = (currentSeconds: number, totalSeconds: number): number => {
  if (totalSeconds <= 0) return 0;
  const progress = Math.max(0, Math.min(100, (currentSeconds / totalSeconds) * 100));
  return Math.round(progress * 100) / 100; // 保留两位小数
};

/**
 * 格式化剩余时间
 * 
 * @param remainingSeconds - 剩余秒数
 * @returns 格式化的剩余时间字符串
 */
export const formatRemainingTime = (remainingSeconds: number): string => {
  const seconds = Math.max(0, remainingSeconds);
  return formatTime(seconds);
};

// 导出所有时间相关的工具函数
export const timeUtils = {
  formatTime,
  padZero,
  parseTimeString,
  formatDuration,
  formatTimeShort,
  getTimeDifference,
  isValidTimeFormat,
  getProgressPercentage,
  formatRemainingTime,
};

export default timeUtils;
