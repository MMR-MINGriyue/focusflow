/**
 * 环境检测工具
 * 用于检测应用运行环境并提供相应的适配功能
 */

/**
 * 检查是否在Tauri环境中运行
 */
export function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' &&
         '__TAURI__' in window &&
         '__TAURI_IPC__' in window;
}

/**
 * 检查是否在浏览器环境中运行
 */
export function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined' && !isTauriEnvironment();
}

/**
 * 检查是否在开发环境中运行
 */
export function isDevelopmentEnvironment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * 检查是否在生产环境中运行
 */
export function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * 安全地调用Tauri API
 * 在浏览器环境中会返回默认值或跳过操作
 */
export async function safeTauriCall<T>(
  tauriFunction: () => Promise<T>,
  fallbackValue?: T,
  options: {
    silent?: boolean; // 是否静默失败（不输出错误日志）
    logPrefix?: string; // 错误日志前缀
  } = {}
): Promise<T | undefined> {
  if (!isTauriEnvironment()) {
    if (!options.silent && isDevelopmentEnvironment()) {
      console.warn(`${options.logPrefix || 'Tauri API'} called in browser environment, using fallback`);
    }
    return fallbackValue;
  }

  try {
    return await tauriFunction();
  } catch (error) {
    if (!options.silent) {
      console.error(`${options.logPrefix || 'Tauri API'} failed:`, error);
    }
    return fallbackValue;
  }
}

/**
 * 安全地调用Tauri同步API
 */
export function safeTauriCallSync<T>(
  tauriFunction: () => T,
  fallbackValue?: T,
  options: {
    silent?: boolean;
    logPrefix?: string;
  } = {}
): T | undefined {
  if (!isTauriEnvironment()) {
    if (!options.silent && isDevelopmentEnvironment()) {
      console.warn(`${options.logPrefix || 'Tauri API'} called in browser environment, using fallback`);
    }
    return fallbackValue;
  }

  try {
    return tauriFunction();
  } catch (error) {
    if (!options.silent) {
      console.error(`${options.logPrefix || 'Tauri API'} failed:`, error);
    }
    return fallbackValue;
  }
}

/**
 * 获取环境信息
 */
export function getEnvironmentInfo() {
  return {
    isTauri: isTauriEnvironment(),
    isBrowser: isBrowserEnvironment(),
    isDevelopment: isDevelopmentEnvironment(),
    isProduction: isProductionEnvironment(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    platform: typeof navigator !== 'undefined' ? navigator.platform : 'Unknown',
  };
}

/**
 * 环境适配的localStorage包装器
 * 在某些环境中localStorage可能不可用
 */
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('localStorage.getItem failed:', error);
      return null;
    }
  },

  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn('localStorage.setItem failed:', error);
      return false;
    }
  },

  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('localStorage.removeItem failed:', error);
      return false;
    }
  },

  clear: (): boolean => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn('localStorage.clear failed:', error);
      return false;
    }
  }
};

/**
 * 环境适配的console包装器
 * 在生产环境中可以控制日志输出
 */
export const safeConsole = {
  log: (...args: any[]) => {
    if (isDevelopmentEnvironment()) {
      console.log(...args);
    }
  },

  warn: (...args: any[]) => {
    console.warn(...args);
  },

  error: (...args: any[]) => {
    console.error(...args);
  },

  debug: (...args: any[]) => {
    if (isDevelopmentEnvironment()) {
      console.debug(...args);
    }
  }
};
