/**
 * 增强的应用配置管理器
 * 提供配置加载、验证、更新和持久化功能
 */

import { deepClone, deepMerge, debounce, generateId } from '../utils';

/**
 * 配置变更事件类型
 */
export type ConfigChangeEvent<T extends Record<string, any>> = {
  /**
   * 变更的键路径
   */
  path: string;
  /**
   * 旧值
   */
  oldValue: any;
  /**
   * 新值
   */
  newValue: any;
  /**
   * 完整的配置对象
   */
  config: T;
};

/**
 * 配置管理器选项
 */
export interface ConfigManagerOptions<T extends Record<string, any>> {
  /**
   * 默认配置
   */
  defaultConfig: T;
  /**
   * 配置验证函数
   */
  validator?: (config: T) => boolean;
  /**
   * 配置变更回调
   */
  onChange?: (event: ConfigChangeEvent<T>) => void;
  /**
   * 是否启用持久化
   */
  persist?: boolean;
  /**
   * 持久化键名
   */
  persistKey?: string;
  /**
   * 是否启用开发模式
   */
  devMode?: boolean;
}

/**
 * 增强的配置管理器
 */
export class ConfigManager<T extends Record<string, any>> {
  private config: T;
  private defaultConfig: T;
  private validator?: (config: T) => boolean;
  private listeners: Map<string, ((event: ConfigChangeEvent<T>) => void)[]> = new Map();
  private persist: boolean;
  private persistKey: string;
  private devMode: boolean;

  constructor(options: ConfigManagerOptions<T>) {
    this.defaultConfig = deepClone(options.defaultConfig);
    this.validator = options.validator;
    this.persist = options.persist ?? false;
    this.persistKey = options.persistKey ?? 'app-config';
    this.devMode = options.devMode ?? false;

    // 加载配置
    this.config = this.loadConfig();

    // 注册全局变更回调
    if (options.onChange) {
      this.subscribe('*', options.onChange);
    }
  }

  /**
   * 加载配置
   */
  private loadConfig(): T {
    // 从持久化存储加载
    if (this.persist) {
      try {
        const persistedConfig = localStorage.getItem(this.persistKey);
        if (persistedConfig) {
          const parsedConfig = JSON.parse(persistedConfig);
          // 与默认配置合并，确保所有配置项都存在
          const mergedConfig = deepMerge(this.defaultConfig, parsedConfig);

          // 验证配置
          if (this.validator && !this.validator(mergedConfig)) {
            console.warn('Invalid persisted config, using defaults');
            return this.defaultConfig;
          }

          return mergedConfig;
        }
      } catch (error) {
        console.error('Failed to load persisted config:', error);
      }
    }

    // 使用默认配置
    return this.defaultConfig;
  }

  /**
   * 保存配置
   */
  private saveConfig(): void {
    if (this.persist) {
      try {
        localStorage.setItem(this.persistKey, JSON.stringify(this.config));
      } catch (error) {
        console.error('Failed to save config:', error);
      }
    }
  }

  /**
   * 触发配置变更事件
   */
  private emitChangeEvent(path: string, oldValue: any, newValue: any): void {
    const event: ConfigChangeEvent<T> = {
      path,
      oldValue,
      newValue,
      config: this.config,
    };

    // 触发全局监听器
    const globalListeners = this.listeners.get('*') || [];
    globalListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in config change listener:', error);
      }
    });

    // 触发特定路径的监听器
    const pathListeners = this.listeners.get(path) || [];
    pathListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in config change listener:', error);
      }
    });

    // 触发父路径的监听器
    const pathParts = path.split('.');
    for (let i = pathParts.length - 1; i > 0; i--) {
      const parentPath = pathParts.slice(0, i).join('.');
      const parentListeners = this.listeners.get(parentPath) || [];
      parentListeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in config change listener:', error);
        }
      });
    }
  }

  /**
   * 获取配置值
   */
  get<K extends keyof T>(key?: K): K extends undefined ? T : T[K] {
    if (key === undefined) {
      return this.config as any;
    }
    return this.config[key];
  }

  /**
   * 获取嵌套配置值
   */
  getNestedValue(path: string): any {
    const pathParts = path.split('.');
    let value: any = this.config;

    for (const part of pathParts) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = value[part];
    }

    return value;
  }

  /**
   * 设置配置值
   */
  set<K extends keyof T>(key: K, value: T[K]): void {
    const oldValue = this.config[key];
    if (oldValue === value) return;

    this.config[key] = value;

    // 验证配置
    if (this.validator && !this.validator(this.config)) {
      this.config[key] = oldValue;
      throw new Error('Invalid config value');
    }

    // 保存配置
    this.saveConfig();

    // 触发变更事件
    this.emitChangeEvent(key as string, oldValue, value);
  }

  /**
   * 设置嵌套配置值
   */
  setNestedValue(path: string, value: any): void {
    const pathParts = path.split('.');
    const oldValue = this.getNestedValue(path);

    if (oldValue === value) return;

    // 更新嵌套值
    let current: any = this.config;
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (current[part] === undefined || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part];
    }

    const lastPart = pathParts[pathParts.length - 1];
    current[lastPart] = value;

    // 验证配置
    if (this.validator && !this.validator(this.config)) {
      // 恢复旧值
      current[lastPart] = oldValue;
      throw new Error('Invalid config value');
    }

    // 保存配置
    this.saveConfig();

    // 触发变更事件
    this.emitChangeEvent(path, oldValue, value);
  }

  /**
   * 更新配置
   */
  update(updates: Partial<T>): void {
    const oldConfig = deepClone(this.config);
    this.config = deepMerge(this.config, updates);

    // 验证配置
    if (this.validator && !this.validator(this.config)) {
      this.config = oldConfig;
      throw new Error('Invalid config updates');
    }

    // 保存配置
    this.saveConfig();

    // 触发变更事件
    // 这里简化处理，只触发全局变更事件
    this.emitChangeEvent('*', oldConfig, this.config);
  }

  /**
   * 重置配置
   */
  reset(path?: string): void {
    if (path) {
      // 重置特定路径
      const pathParts = path.split('.');
      let defaultValue: any = this.defaultConfig;
      let currentValue: any = this.config;

      for (const part of pathParts) {
        if (defaultValue === undefined || currentValue === undefined) {
          break;
        }
        defaultValue = defaultValue[part];
        currentValue = currentValue[part];
      }

      if (defaultValue !== undefined && currentValue !== undefined) {
        this.setNestedValue(path, defaultValue);
      }
    } else {
      // 重置所有配置
      const oldConfig = deepClone(this.config);
      this.config = deepClone(this.defaultConfig);

      // 保存配置
      this.saveConfig();

      // 触发变更事件
      this.emitChangeEvent('*', oldConfig, this.config);
    }
  }

  /**
   * 订阅配置变更
   */
  subscribe(path: string, callback: (event: ConfigChangeEvent<T>) => void): () => void {
    if (!this.listeners.has(path)) {
      this.listeners.set(path, []);
    }
    this.listeners.get(path)!.push(callback);

    // 返回取消订阅函数
    return () => {
      const pathListeners = this.listeners.get(path);
      if (pathListeners) {
        const index = pathListeners.indexOf(callback);
        if (index !== -1) {
          pathListeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * 获取所有配置
   */
  getAll(): T {
    return deepClone(this.config);
  }

  /**
   * 获取默认配置
   */
  getDefault(): T {
    return deepClone(this.defaultConfig);
  }

  /**
   * 获取配置差异
   */
  getDiff(): Partial<T> {
    const diff: Partial<T> = {};

    const compareValues = (defaultObj: any, currentObj: any, result: any, path: string = ''): void => {
      for (const key in defaultObj) {
        if (defaultObj.hasOwnProperty(key)) {
          const currentPath = path ? `${path}.${key}` : key;

          if (typeof defaultObj[key] === 'object' && defaultObj[key] !== null && !Array.isArray(defaultObj[key])) {
            if (!result[key]) {
              result[key] = {};
            }
            compareValues(defaultObj[key], currentObj[key], result[key], currentPath);
          } else if (defaultObj[key] !== currentObj[key]) {
            result[key] = currentObj[key];
          }
        }
      }
    };

    compareValues(this.defaultConfig, this.config, diff);

    return diff;
  }

  /**
   * 导出配置
   */
  export(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * 导入配置
   */
  import(configJson: string): void {
    try {
      const importedConfig = JSON.parse(configJson);

      // 验证配置
      if (this.validator && !this.validator(importedConfig)) {
        throw new Error('Invalid imported config');
      }

      const oldConfig = deepClone(this.config);
      this.config = importedConfig;

      // 保存配置
      this.saveConfig();

      // 触发变更事件
      this.emitChangeEvent('*', oldConfig, this.config);
    } catch (error) {
      console.error('Failed to import config:', error);
      throw error;
    }
  }

  /**
   * 销毁配置管理器
   */
  destroy(): void {
    this.listeners.clear();
  }
}

/**
 * 创建配置管理器
 */
export function createConfigManager<T extends Record<string, any>>(
  options: ConfigManagerOptions<T>
): ConfigManager<T> {
  return new ConfigManager<T>(options);
}
