/**
 * 增强的插件管理器
 * 提供插件加载、注册、启用和禁用功能
 */

import { deepClone, generateId } from '../utils';

/**
 * 插件状态
 */
export enum PluginStatus {
  /**
   * 未加载
   */
  UNLOADED = 'unloaded',
  /**
   * 已加载
   */
  LOADED = 'loaded',
  /**
   * 已启用
   */
  ENABLED = 'enabled',
  /**
   * 已禁用
   */
  DISABLED = 'disabled',
  /**
   * 错误
   */
  ERROR = 'error',
}

/**
 * 插件元数据
 */
export interface PluginMetadata {
  /**
   * 插件名称
   */
  name: string;
  /**
   * 插件版本
   */
  version: string;
  /**
   * 插件描述
   */
  description?: string;
  /**
   * 插件作者
   */
  author?: string;
  /**
   * 插件主页
   */
  homepage?: string;
  /**
   * 插件图标
   */
  icon?: string;
  /**
   * 依赖的插件
   */
  dependencies?: string[];
  /**
   * 是否为必需插件
   */
  required?: boolean;
  /**
   * 最小应用版本
   */
  minAppVersion?: string;
  /**
   * 最大应用版本
   */
  maxAppVersion?: string;
}

/**
 * 插件API
 */
export interface PluginAPI {
  /**
   * 应用版本
   */
  appVersion: string;
  /**
   * 注册命令
   */
  registerCommand: (command: string, callback: (...args: any[]) => any) => void;
  /**
   * 注销命令
   */
  unregisterCommand: (command: string) => void;
  /**
   * 执行命令
   */
  executeCommand: (command: string, ...args: any[]) => any;
  /**
   * 注册事件监听器
   */
  on: (event: string, callback: (...args: any[]) => void) => void;
  /**
   * 注销事件监听器
   */
  off: (event: string, callback: (...args: any[]) => void) => void;
  /**
   * 触发事件
   */
  emit: (event: string, ...args: any[]) => void;
  /**
   * 获取配置
   */
  getConfig: (key?: string) => any;
  /**
   * 设置配置
   */
  setConfig: (key: string, value: any) => void;
  /**
   * 获取其他插件
   */
  getPlugin: (name: string) => Plugin | undefined;
  /**
   * 加载CSS
   */
  loadCSS: (css: string) => void;
  /**
   * 加载JS
   */
  loadJS: (js: string) => Promise<void>;
}

/**
 * 插件接口
 */
export interface Plugin {
  /**
   * 插件元数据
   */
  metadata: PluginMetadata;
  /**
   * 插件状态
   */
  status: PluginStatus;
  /**
   * 插件实例
   */
  instance?: any;
  /**
   * 插件错误
   */
  error?: string;
  /**
   * 插件启用
   */
  enable: (api: PluginAPI) => Promise<void>;
  /**
   * 插件禁用
   */
  disable: (api: PluginAPI) => Promise<void>;
  /**
   * 插件销毁
   */
  destroy: (api: PluginAPI) => Promise<void>;
}

/**
 * 插件管理器选项
 */
export interface PluginManagerOptions {
  /**
   * 应用版本
   */
  appVersion: string;
  /**
   * 插件配置
   */
  pluginConfig?: Record<string, any>;
  /**
   * 是否启用持久化
   */
  persist?: boolean;
  /**
   * 持久化键名
   */
  persistKey?: string;
  /**
   * 是否自动启用插件
   */
  autoEnable?: boolean;
}

/**
 * 插件状态变更事件类型
 */
export type PluginStatusChangeEvent = {
  /**
   * 插件名称
   */
  pluginName: string;
  /**
   * 旧状态
   */
  oldStatus: PluginStatus;
  /**
   * 新状态
   */
  newStatus: PluginStatus;
  /**
   * 错误信息
   */
  error?: string;
};

/**
 * 增强的插件管理器
 */
export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private commands: Map<string, { pluginName: string; callback: (...args: any[]) => any }> = new Map();
  private eventListeners: Map<string, Array<{ pluginName: string; callback: (...args: any[]) => void }>> = new Map();
  private pluginConfig: Record<string, any>;
  private appVersion: string;
  private persist: boolean;
  private persistKey: string;
  private autoEnable: boolean;
  private statusChangeListeners: ((event: PluginStatusChangeEvent) => void)[] = [];

  constructor(options: PluginManagerOptions) {
    this.appVersion = options.appVersion;
    this.pluginConfig = options.pluginConfig || {};
    this.persist = options.persist ?? false;
    this.persistKey = options.persistKey ?? 'app-plugins';
    this.autoEnable = options.autoEnable ?? true;

    // 加载插件状态
    this.loadPluginStates();
  }

  /**
   * 加载插件状态
   */
  private loadPluginStates(): void {
    if (this.persist) {
      try {
        const persistedStates = localStorage.getItem(this.persistKey);
        if (persistedStates) {
          const states = JSON.parse(persistedStates);

          // 更新插件配置
          this.pluginConfig = {
            ...this.pluginConfig,
            ...states,
          };
        }
      } catch (error) {
        console.error('Failed to load plugin states:', error);
      }
    }
  }

  /**
   * 保存插件状态
   */
  private savePluginStates(): void {
    if (this.persist) {
      try {
        // 只保存启用/禁用状态
        const states: Record<string, any> = {};

        this.plugins.forEach((plugin, name) => {
          if (plugin.status === PluginStatus.ENABLED || plugin.status === PluginStatus.DISABLED) {
            states[name] = {
              enabled: plugin.status === PluginStatus.ENABLED,
            };
          }
        });

        localStorage.setItem(this.persistKey, JSON.stringify(states));
      } catch (error) {
        console.error('Failed to save plugin states:', error);
      }
    }
  }

  /**
   * 触发插件状态变更事件
   */
  private emitStatusChangeEvent(
    pluginName: string,
    oldStatus: PluginStatus,
    newStatus: PluginStatus,
    error?: string
  ): void {
    const event: PluginStatusChangeEvent = {
      pluginName,
      oldStatus,
      newStatus,
      error,
    };

    // 触发所有监听器
    this.statusChangeListeners.forEach(listener => {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in plugin status change listener:', err);
      }
    });
  }

  /**
   * 验证插件依赖
   */
  private validateDependencies(plugin: Plugin): boolean {
    const { dependencies } = plugin.metadata;

    if (!dependencies) {
      return true;
    }

    for (const dependency of dependencies) {
      const dependencyPlugin = this.plugins.get(dependency);

      if (!dependencyPlugin) {
        console.error(`Plugin "${plugin.metadata.name}" depends on "${dependency}" which is not installed`);
        return false;
      }

      if (dependencyPlugin.status !== PluginStatus.ENABLED) {
        console.error(`Plugin "${plugin.metadata.name}" depends on "${dependency}" which is not enabled`);
        return false;
      }
    }

    return true;
  }

  /**
   * 验证应用版本兼容性
   */
  private validateVersionCompatibility(plugin: Plugin): boolean {
    const { minAppVersion, maxAppVersion } = plugin.metadata;

    if (minAppVersion && this.compareVersions(this.appVersion, minAppVersion) < 0) {
      console.error(`Plugin "${plugin.metadata.name}" requires minimum app version ${minAppVersion}, current version is ${this.appVersion}`);
      return false;
    }

    if (maxAppVersion && this.compareVersions(this.appVersion, maxAppVersion) > 0) {
      console.error(`Plugin "${plugin.metadata.name}" requires maximum app version ${maxAppVersion}, current version is ${this.appVersion}`);
      return false;
    }

    return true;
  }

  /**
   * 比较版本号
   */
  private compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;

      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }

    return 0;
  }

  /**
   * 创建插件API
   */
  private createPluginAPI(pluginName: string): PluginAPI {
    return {
      appVersion: this.appVersion,
      registerCommand: (command: string, callback: (...args: any[]) => any) => {
        this.commands.set(command, { pluginName, callback });
      },
      unregisterCommand: (command: string) => {
        if (this.commands.has(command)) {
          const cmd = this.commands.get(command);
          if (cmd && cmd.pluginName === pluginName) {
            this.commands.delete(command);
          }
        }
      },
      executeCommand: (command: string, ...args: any[]) => {
        const cmd = this.commands.get(command);
        if (!cmd) {
          throw new Error(`Command "${command}" not found`);
        }
        return cmd.callback(...args);
      },
      on: (event: string, callback: (...args: any[]) => void) => {
        if (!this.eventListeners.has(event)) {
          this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event)!.push({ pluginName, callback });
      },
      off: (event: string, callback: (...args: any[]) => void) => {
        if (this.eventListeners.has(event)) {
          const listeners = this.eventListeners.get(event)!;
          const index = listeners.findIndex(
            listener => listener.pluginName === pluginName && listener.callback === callback
          );
          if (index !== -1) {
            listeners.splice(index, 1);
          }
        }
      },
      emit: (event: string, ...args: any[]) => {
        if (this.eventListeners.has(event)) {
          const listeners = this.eventListeners.get(event)!;
          listeners.forEach(listener => {
            try {
              listener.callback(...args);
            } catch (err) {
              console.error(`Error in event listener for "${event}" in plugin "${listener.pluginName}":`, err);
            }
          });
        }
      },
      getConfig: (key?: string) => {
        const config = this.pluginConfig[pluginName] || {};
        return key ? config[key] : config;
      },
      setConfig: (key: string, value: any) => {
        if (!this.pluginConfig[pluginName]) {
          this.pluginConfig[pluginName] = {};
        }
        this.pluginConfig[pluginName][key] = value;
        this.savePluginStates();
      },
      getPlugin: (name: string) => {
        return this.plugins.get(name);
      },
      loadCSS: (css: string) => {
        const style = document.createElement('style');
        style.textContent = css;
        style.setAttribute('data-plugin', pluginName);
        document.head.appendChild(style);
      },
      loadJS: async (js: string) => {
        return new Promise<void>((resolve, reject) => {
          try {
            const script = document.createElement('script');
            script.textContent = js;
            script.setAttribute('data-plugin', pluginName);
            document.head.appendChild(script);
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      },
    };
  }

  /**
   * 注册插件
   */
  register(plugin: Plugin): void {
    const { name } = plugin.metadata;

    // 检查插件是否已注册
    if (this.plugins.has(name)) {
      throw new Error(`Plugin "${name}" is already registered`);
    }

    // 验证版本兼容性
    if (!this.validateVersionCompatibility(plugin)) {
      throw new Error(`Plugin "${name}" is not compatible with the current app version`);
    }

    // 设置初始状态
    plugin.status = PluginStatus.LOADED;

    // 添加插件
    this.plugins.set(name, plugin);

    // 触发状态变更事件
    this.emitStatusChangeEvent(name, PluginStatus.UNLOADED, PluginStatus.LOADED);

    // 自动启用插件
    if (this.autoEnable) {
      const pluginConfig = this.pluginConfig[name];
      if (!pluginConfig || pluginConfig.enabled !== false) {
        this.enable(name).catch(error => {
          console.error(`Failed to auto-enable plugin "${name}":`, error);
        });
      }
    }
  }

  /**
   * 注销插件
   */
  unregister(name: string): void {
    const plugin = this.plugins.get(name);

    if (!plugin) {
      throw new Error(`Plugin "${name}" is not registered`);
    }

    // 检查是否为必需插件
    if (plugin.metadata.required) {
      throw new Error(`Cannot unregister required plugin "${name}"`);
    }

    // 禁用插件
    if (plugin.status === PluginStatus.ENABLED) {
      this.disable(name).catch(error => {
        console.error(`Failed to disable plugin "${name}" during unregistration:`, error);
      });
    }

    // 销毁插件
    if (plugin.status !== PluginStatus.UNLOADED) {
      try {
        const api = this.createPluginAPI(name);
        plugin.destroy?.(api);
      } catch (error) {
        console.error(`Error destroying plugin "${name}":`, error);
      }
    }

    // 移除插件
    this.plugins.delete(name);

    // 移除命令
    for (const [command, cmd] of this.commands.entries()) {
      if (cmd.pluginName === name) {
        this.commands.delete(command);
      }
    }

    // 移除事件监听器
    for (const [event, listeners] of this.eventListeners.entries()) {
      this.eventListeners.set(
        event,
        listeners.filter(listener => listener.pluginName !== name)
      );
    }

    // 移除配置
    delete this.pluginConfig[name];
    this.savePluginStates();

    // 移除DOM元素
    document.querySelectorAll(`[data-plugin="${name}"]`).forEach(element => {
      element.remove();
    });

    // 触发状态变更事件
    this.emitStatusChangeEvent(name, plugin.status, PluginStatus.UNLOADED);
  }

  /**
   * 启用插件
   */
  async enable(name: string): Promise<void> {
    const plugin = this.plugins.get(name);

    if (!plugin) {
      throw new Error(`Plugin "${name}" is not registered`);
    }

    if (plugin.status === PluginStatus.ENABLED) {
      return; // 已经启用
    }

    // 验证依赖
    if (!this.validateDependencies(plugin)) {
      throw new Error(`Failed to enable plugin "${name}" due to unresolved dependencies`);
    }

    const oldStatus = plugin.status;

    try {
      // 调用插件启用方法
      const api = this.createPluginAPI(name);
      await plugin.enable(api);

      // 更新状态
      plugin.status = PluginStatus.ENABLED;
      plugin.error = undefined;

      // 更新配置
      if (!this.pluginConfig[name]) {
        this.pluginConfig[name] = {};
      }
      this.pluginConfig[name].enabled = true;
      this.savePluginStates();

      // 触发状态变更事件
      this.emitStatusChangeEvent(name, oldStatus, PluginStatus.ENABLED);
    } catch (error) {
      // 更新状态
      plugin.status = PluginStatus.ERROR;
      plugin.error = error instanceof Error ? error.message : String(error);

      // 触发状态变更事件
      this.emitStatusChangeEvent(name, oldStatus, PluginStatus.ERROR, plugin.error);

      throw error;
    }
  }

  /**
   * 禁用插件
   */
  async disable(name: string): Promise<void> {
    const plugin = this.plugins.get(name);

    if (!plugin) {
      throw new Error(`Plugin "${name}" is not registered`);
    }

    if (plugin.status === PluginStatus.DISABLED) {
      return; // 已经禁用
    }

    // 检查是否为必需插件
    if (plugin.metadata.required) {
      throw new Error(`Cannot disable required plugin "${name}"`);
    }

    // 检查是否有其他插件依赖此插件
    for (const [otherName, otherPlugin] of this.plugins.entries()) {
      if (otherName !== name && otherPlugin.status === PluginStatus.ENABLED) {
        const dependencies = otherPlugin.metadata.dependencies || [];
        if (dependencies.includes(name)) {
          throw new Error(`Cannot disable plugin "${name}" because plugin "${otherName}" depends on it`);
        }
      }
    }

    const oldStatus = plugin.status;

    try {
      // 调用插件禁用方法
      const api = this.createPluginAPI(name);
      await plugin.disable(api);

      // 更新状态
      plugin.status = PluginStatus.DISABLED;
      plugin.error = undefined;

      // 更新配置
      if (!this.pluginConfig[name]) {
        this.pluginConfig[name] = {};
      }
      this.pluginConfig[name].enabled = false;
      this.savePluginStates();

      // 触发状态变更事件
      this.emitStatusChangeEvent(name, oldStatus, PluginStatus.DISABLED);
    } catch (error) {
      // 更新状态
      plugin.status = PluginStatus.ERROR;
      plugin.error = error instanceof Error ? error.message : String(error);

      // 触发状态变更事件
      this.emitStatusChangeEvent(name, oldStatus, PluginStatus.ERROR, plugin.error);

      throw error;
    }
  }

  /**
   * 获取插件
   */
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * 获取所有插件
   */
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * 获取启用的插件
   */
  getEnabledPlugins(): Plugin[] {
    return Array.from(this.plugins.values()).filter(
      plugin => plugin.status === PluginStatus.ENABLED
    );
  }

  /**
   * 执行命令
   */
  executeCommand(command: string, ...args: any[]): any {
    const cmd = this.commands.get(command);
    if (!cmd) {
      throw new Error(`Command "${command}" not found`);
    }
    return cmd.callback(...args);
  }

  /**
   * 触发事件
   */
  emit(event: string, ...args: any[]): void {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event)!;
      listeners.forEach(listener => {
        try {
          listener.callback(...args);
        } catch (error) {
          console.error(`Error in event listener for "${event}" in plugin "${listener.pluginName}":`, error);
        }
      });
    }
  }

  /**
   * 订阅插件状态变更事件
   */
  onStatusChange(callback: (event: PluginStatusChangeEvent) => void): () => void {
    this.statusChangeListeners.push(callback);

    // 返回取消订阅函数
    return () => {
      const index = this.statusChangeListeners.indexOf(callback);
      if (index !== -1) {
        this.statusChangeListeners.splice(index, 1);
      }
    };
  }

  /**
   * 获取插件配置
   */
  getPluginConfig(pluginName: string): any {
    return this.pluginConfig[pluginName] || {};
  }

  /**
   * 设置插件配置
   */
  setPluginConfig(pluginName: string, config: any): void {
    this.pluginConfig[pluginName] = {
      ...this.pluginConfig[pluginName],
      ...config,
    };
    this.savePluginStates();
  }

  /**
   * 销毁插件管理器
   */
  destroy(): void {
    // 禁用所有插件
    for (const [name, plugin] of this.plugins.entries()) {
      if (plugin.status === PluginStatus.ENABLED) {
        this.disable(name).catch(error => {
          console.error(`Failed to disable plugin "${name}" during destruction:`, error);
        });
      }
    }

    // 清空数据
    this.plugins.clear();
    this.commands.clear();
    this.eventListeners.clear();
    this.statusChangeListeners = [];
  }
}

/**
 * 创建插件管理器
 */
export function createPluginManager(options: PluginManagerOptions): PluginManager {
  return new PluginManager(options);
}
