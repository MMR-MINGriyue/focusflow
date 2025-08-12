/**
 * 应用初始化模块
 * 负责在应用启动时初始化所有必要的服务和配置
 */

import { container } from '../container/IoCContainer';
import { registerServices } from '../container/registerServices';
import { AdapterFactory } from '../adapters/AdapterFactory';
import { configManager } from '../config/ConfigurationManager';
import { environmentConfig } from '../config/environment';

/**
 * 应用初始化类
 */
export class AppInitializer {
  private initialized = false;

  /**
   * 初始化应用
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('App already initialized');
      return;
    }

    try {
      console.log('Initializing application...');

      // 注册所有服务到依赖注入容器
      this.registerServices();

      // 初始化环境适配器
      this.initializeEnvironmentAdapter();

      // 初始化配置管理器
      await this.initializeConfiguration();

      // 初始化核心服务
      await this.initializeCoreServices();

      this.initialized = true;
      console.log('Application initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      throw error;
    }
  }

  /**
   * 注册所有服务
   */
  private registerServices(): void {
    console.log('Registering services...');
    registerServices();
  }

  /**
   * 初始化环境适配器
   */
  private initializeEnvironmentAdapter(): void {
    console.log('Initializing environment adapter...');
    AdapterFactory.registerEnvironmentAdapter();

    const adapter = AdapterFactory.getEnvironmentAdapter();
    console.log(`Running in ${adapter.getName()} environment`);
  }

  /**
   * 初始化配置管理器
   */
  private async initializeConfiguration(): Promise<void> {
    console.log('Initializing configuration...');

    try {
      // 加载保存的配置
      await configManager.loadFromStorage();

      // 设置环境配置
      configManager.set('environment', environmentConfig);

      // 验证配置
      const validation = configManager.validate();
      if (!validation.isValid) {
        console.warn('Configuration validation failed:', validation.errors);
      }
    } catch (error) {
      console.warn('Failed to load saved configuration, using defaults:', error);
      // 使用默认配置继续初始化
    }
  }

  /**
   * 初始化核心服务
   */
  private async initializeCoreServices(): Promise<void> {
    console.log('Initializing core services...');

    try {
      // 初始化数据库服务
      const databaseService = container.resolve('databaseService');
      await databaseService.initialize();

      // 初始化主题服务
      const themeService = container.resolve('themeService');
      await themeService.initialize();

      // 初始化数据安全服务
      const dataSecurityService = container.resolve('dataSecurityService');
      await dataSecurityService.initialize();

      // 初始化声音服务
      const soundService = container.resolve('soundService');
      await soundService.initialize();

      // 初始化通知服务
      const notificationService = container.resolve('notificationService');
      await notificationService.initialize();

      console.log('Core services initialized successfully');
    } catch (error) {
      console.error('Failed to initialize core services:', error);
      throw error;
    }
  }

  /**
   * 检查应用是否已初始化
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// 创建全局应用初始化器实例
export const appInitializer = new AppInitializer();
