/**
 * 工具函数索引文件
 * 统一导出所有工具函数，方便使用
 */

// 通用工具函数
export {
  debounce,
  throttle,
  deepClone,
  generateId,
  formatFileSize,
  formatTimeDuration,
  isEmpty,
  getNestedValue,
  setNestedValue,
  sleep,
  retry,
  batchProcess,
  memoize,
  limitConcurrency,
} from './commonUtils';

// 日期和时间工具函数
export {
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
  isTomorrow,
  type DateFormatOptions,
  type TimeUnit,
} from './dateUtils';

// 验证工具函数
export {
  validateTimerSettings,
  validateSessionData,
  validateUserInput,
  isValidTimeFormat,
  validateColorHex,
  validatePositiveNumber,
  validatePercentage,
  validateTimeRange,
} from './validationUtils';

// 错误处理工具函数
export {
  AppError,
  ErrorType,
  ConsoleErrorHandler,
  UserNotificationErrorHandler,
  ConsoleErrorReportingService,
  ErrorManager,
  globalErrorManager,
  ErrorBoundary,
  withErrorHandling,
  withAsyncErrorHandling,
  withPromiseErrorHandling,
  type ErrorHandler,
  type ErrorReportingService,
  type ErrorBoundaryProps,
  type ErrorBoundaryState,
} from './errorUtils';

// 性能优化工具函数
export {
  PerformanceMonitor,
  PerformanceProfiler,
  globalProfiler,
  measurePerformance,
  lazyLoad,
  debounce as perfDebounce,
  throttle as perfThrottle,
  memoize as perfMemoize,
  batch,
  useOptimizedEffect,
  useComponentPerformance,
  usePerformanceMonitor,
  type PerformanceMetrics,
  type PerformanceMonitorOptions,
} from './performanceUtils';

// 类名合并工具函数
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// 格式化时间工具函数
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 格式化日期工具函数
export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  });
}

// 格式化百分比工具函数
export function formatPercentage(value: number, total: number, decimals: number = 1): string {
  if (total === 0) return '0%';
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
}

// 截断文本工具函数
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

// 首字母大写工具函数
export function capitalizeFirstLetter(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// 驼峰转连字符工具函数
export function camelToKebab(text: string): string {
  return text.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

// 连字符转驼峰工具函数
export function kebabToCamel(text: string): string {
  return text.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

// 深度合并对象工具函数
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (
        typeof sourceValue === 'object' &&
        sourceValue !== null &&
        !Array.isArray(sourceValue) &&
        typeof targetValue === 'object' &&
        targetValue !== null &&
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMerge(targetValue, sourceValue);
      } else {
        result[key] = sourceValue as any;
      }
    }
  }

  return result;
}

// 生成随机颜色工具函数
export function generateRandomColor(): string {
  return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
}

// 生成随机数工具函数
export function generateRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 检查是否为移动设备工具函数
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 检查是否为触摸设备工具函数
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// 复制到剪贴板工具函数
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

// 下载文件工具函数
export function downloadFile(content: string, filename: string, contentType: string = 'text/plain'): void {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 获取文件扩展名工具函数
export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

// 检查文件类型工具函数
export function isImageFile(filename: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
  const extension = getFileExtension(filename).toLowerCase();
  return imageExtensions.includes(extension);
}

export function isVideoFile(filename: string): boolean {
  const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'flv', 'mkv'];
  const extension = getFileExtension(filename).toLowerCase();
  return videoExtensions.includes(extension);
}

export function isAudioFile(filename: string): boolean {
  const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'flac'];
  const extension = getFileExtension(filename).toLowerCase();
  return audioExtensions.includes(extension);
}

// 获取文件大小工具函数
export function getFileSize(file: File): string {
  const size = file.size;
  if (size < 1024) {
    return `${size} B`;
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`;
  } else if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  } else {
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
}
