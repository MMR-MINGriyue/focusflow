/**
 * 配置管理模块
 * 提供集中式的配置管理机制
 */

import { container } from '../container/IoCContainer';

export class ConfigurationManager {
  private config: any;
  private configSchema: any;

  /**
   * 构造函数
   * @param initialConfig 初始配置
   * @param configSchema 配置模式（用于验证）
   */
  constructor(initialConfig: any, configSchema?: any) {
    this.config = { ...initialConfig };
    this.configSchema = configSchema;
  }

  /**
   * 获取配置值
   * @param key 配置键（支持嵌套，如 'app.theme.mode'）
   * @returns 配置值
   */
  get<T>(key: string): T {
    return this.getNestedValue(this.config, key);
  }

  /**
   * 设置配置值
   * @param key 配置键（支持嵌套，如 'app.theme.mode'）
   * @param value 配置值
   */
  set<T>(key: string, value: T): void {
    this.setNestedValue(this.config, key, value);
  }

  /**
   * 获取所有配置
   * @returns 完整配置对象
   */
  getAll(): any {
    return { ...this.config };
  }

  /**
   * 重置配置为默认值
   * @param defaultConfig 默认配置
   */
  reset(defaultConfig: any): void {
    this.config = { ...defaultConfig };
  }

  /**
   * 合并配置
   * @param newConfig 新配置
   */
  merge(newConfig: any): void {
    this.config = this.deepMerge(this.config, newConfig);
  }

  /**
   * 验证配置
   * @returns 验证结果
   */
  validate(): { isValid: boolean; errors: string[] } {
    if (!this.configSchema) {
      return { isValid: true, errors: [] };
    }

    // 这里应该使用适当的验证库（如zod、joi等）
    // 简化实现，实际项目中应替换为真正的验证逻辑
    try {
      // 模拟验证过程
      this.validateConfig(this.config, this.configSchema);
      return { isValid: true, errors: [] };
    } catch (error) {
      return { 
        isValid: false, 
        errors: [error instanceof Error ? error.message : 'Unknown validation error'] 
      };
    }
  }

  /**
   * 保存配置到存储
   */
  async saveToStorage(): Promise<void> {
    try {
      const storageService = container.resolve('storageService');
      await storageService.setItem('appConfig', this.config);
    } catch (error) {
      console.error('Failed to save config to storage:', error);
      throw error;
    }
  }

  /**
   * 从存储加载配置
   */
  async loadFromStorage(): Promise<void> {
    try {
      const storageService = container.resolve('storageService');
      const savedConfig = await storageService.getItem('appConfig');

      if (savedConfig) {
        this.config = this.deepMerge(this.config, savedConfig);
      }
    } catch (error) {
      console.error('Failed to load config from storage:', error);
      throw error;
    }
  }

  /**
   * 获取嵌套配置值
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * 设置嵌套配置值
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!(key in current)) {
        current[key] = {};
      }
      return current[key];
    }, obj);

    if (lastKey) {
      target[lastKey] = value;
    }
  }

  /**
   * 深度合并对象
   */
  private deepMerge(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  /**
   * 配置验证（简化实现）
   */
  private validateConfig(config: any, schema: any): void {
    // 实际项目中应使用适当的验证库
    // 这里只是模拟验证过程
    if (typeof config !== 'object' || config === null) {
      throw new Error('Config must be an object');
    }
  }
}

// 创建全局配置管理器实例
export const configManager = new ConfigurationManager({});
