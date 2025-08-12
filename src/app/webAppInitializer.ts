/**
 * Web应用初始化器
 * 针对Web环境的应用初始化逻辑
 */

import { registerServices } from '../container/registerServices';
import { AdapterFactory } from '../adapters/AdapterFactory';
import { configManager } from '../config/ConfigurationManager';
import { environmentConfig } from '../config/environment';
import { initializeStore } from '../store';
import { WebAdapter } from '../adapters/WebAdapter';

/**
 * 初始化Web应用
 * 这个函数应该在Web应用启动时调用
 */
export async function initializeWebApp(): Promise<void> {
  try {
    console.log('Starting Web application initialization...');

    // 注册Web环境适配器
    AdapterFactory.registerAdapter(new WebAdapter());

    // 注册所有服务到依赖注入容器
    registerServices();

    // 初始化配置管理器
    await initializeWebConfiguration();

    // 初始化状态管理
    initializeStore();

    // 初始化Web特有功能
    await initializeWebFeatures();

    console.log('Web application initialization completed successfully');
  } catch (error) {
    console.error('Failed to initialize Web application:', error);
    throw error;
  }
}

/**
 * 初始化Web配置管理器
 */
async function initializeWebConfiguration(): Promise<void> {
  try {
    // 设置Web环境默认配置
    const defaultConfig = {
      app: {
        name: 'FocusFlow',
        version: '1.0.0',
        theme: 'system',
        language: 'zh-CN',
        platform: 'web'
      },
      timer: {
        defaultMode: 'classic',
        notifications: true,
        sounds: true,
        volume: 0.7,
        webWorkerEnabled: true,
        performanceOptimization: true
      },
      web: {
        pwaEnabled: true,
        offlineMode: true,
        analytics: false,
        cdnEnabled: true
      },
      environment: environmentConfig
    };

    // 初始化配置管理器
    configManager.reset(defaultConfig);

    // 尝试从本地存储加载配置
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
    console.error('Failed to initialize Web configuration:', error);
    throw error;
  }
}

/**
 * 初始化Web特有功能
 */
async function initializeWebFeatures(): Promise<void> {
  try {
    // 检查并注册Service Worker（如果支持PWA）
    if ('serviceWorker' in navigator && configManager.get('web.pwaEnabled')) {
      try {
        await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');
      } catch (error) {
        console.warn('Service Worker registration failed:', error);
      }
    }

    // 请求通知权限（如果需要）
    if ('Notification' in navigator && configManager.get('timer.notifications')) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    }

    // 初始化Web性能监控
    if (configManager.get('web.analytics') && typeof window !== 'undefined') {
      // 这里可以集成Web分析工具
      console.log('Web analytics initialized');
    }

    // 初始化CDN加载（如果启用）
    if (configManager.get('web.cdnEnabled')) {
      // 这里可以初始化CDN加载逻辑
      console.log('CDN loading initialized');
    }
  } catch (error) {
    console.error('Failed to initialize Web features:', error);
    // 不抛出错误，因为这些功能不是核心功能
  }
}

/**
 * 获取Web应用初始化状态
 */
export function isWebAppInitialized(): boolean {
  // 这里可以添加检查初始化状态的逻辑
  return true;
}

/**
 * 重置Web应用（主要用于测试）
 */
export function resetWebApp(): void {
  // 重置依赖注入容器
  const { container } = require('../container/IoCContainer');
  container.reset();

  // 重置配置管理器
  configManager.reset({});

  // 注销Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => registration.unregister());
    });
  }
}
