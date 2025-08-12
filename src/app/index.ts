/**
 * 应用入口模块
 * 负责初始化应用和注册所有服务
 */

import { appInitializer } from './AppInitializer';
import { registerServices } from '../container/registerServices';
import { AdapterFactory } from '../adapters/AdapterFactory';
import { configManager } from '../config/ConfigurationManager';
import { environmentConfig } from '../config/environment';
import { initializeStore } from '../store';

/**
 * 初始化应用
 * 这个函数应该在应用启动时调用
 */
export async function initializeApp(): Promise<void> {
  try {
    console.log('Starting application initialization...');

    // 注册所有服务到依赖注入容器
    registerServices();

    // 注册环境适配器
    AdapterFactory.registerEnvironmentAdapter();

    // 初始化配置管理器
    await initializeConfiguration();

    // 初始化状态管理
    initializeStore();

    // 初始化应用
    await appInitializer.initialize();

    console.log('Application initialization completed successfully');
  } catch (error) {
    console.error('Failed to initialize application:', error);
    throw error;
  }
}

/**
 * 初始化配置管理器
 */
async function initializeConfiguration(): Promise<void> {
  try {
    // 设置默认配置
    const defaultConfig = {
      app: {
        name: 'FocusFlow',
        version: '1.0.0',
        theme: 'system',
        language: 'zh-CN'
      },
      timer: {
        defaultMode: 'classic',
        notifications: true,
        sounds: true,
        volume: 0.7
      },
      environment: environmentConfig
    };

    // 初始化配置管理器
    configManager.reset(defaultConfig);

    // 尝试加载保存的配置
    try {
      await configManager.loadFromStorage();
    } catch (error) {
      console.warn('Failed to load saved configuration, using defaults');
    }

    // 验证配置
    const validation = configManager.validate();
    if (!validation.isValid) {
      console.warn('Configuration validation failed:', validation.errors);
    }
  } catch (error) {
    console.error('Failed to initialize configuration:', error);
    throw error;
  }
}

/**
 * 获取应用初始化状态
 */
export function isAppInitialized(): boolean {
  return appInitializer.isInitialized();
}

/**
 * 重置应用（主要用于测试）
 */
export function resetApp(): void {
  // 重置依赖注入容器
  const { container } = require('../container/IoCContainer');
  container.reset();

  // 重置配置管理器
  configManager.reset({});
}
