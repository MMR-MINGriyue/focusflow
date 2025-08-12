/**
 * 增强的服务注册模块
 * 将所有核心服务注册到依赖注入容器
 */

import { container } from './IoCContainer';
import { SoundService } from '../infrastructure/services/SoundService';
import { DatabaseService } from '../infrastructure/services/DatabaseService';
import { NotificationService } from '../infrastructure/services/NotificationService';
import { StorageService } from '../infrastructure/services/StorageService';
import { ThemeService } from '../infrastructure/services/ThemeService';
import { DataSecurityService } from '../infrastructure/services/DataSecurityService';
import { TimerSessionRepository } from '../infrastructure/repositories/TimerSessionRepository';
import { TimerApplicationService } from '../application/services/TimerApplicationService';
import { PerformanceMonitorService } from '../infrastructure/services/PerformanceMonitorService';

/**
 * 注册所有核心服务到容器
 */
export function registerServices(): void {
  // 注册基础设施服务（单例）
  container.register('soundService', () => new SoundService(), true);
  container.register('databaseService', () => new DatabaseService(), true);
  container.register('notificationService', () => new NotificationService(), true);
  container.register('storageService', () => new StorageService(), true);
  container.register('themeService', () => new ThemeService(), true);
  container.register('dataSecurityService', () => new DataSecurityService(), true);

  // 注册性能监控服务（单例）
  container.register('performanceMonitorService', () => {
    const service = new PerformanceMonitorService();
    // 在使用前初始化
    service.initialize().catch(error => {
      console.error('Failed to initialize performance monitor service:', error);
    });
    return service;
  }, true);

  // 注册存储库（延迟初始化）
  container.register('timerSessionRepository', () => {
    const repo = new TimerSessionRepository();
    // 在使用前初始化
    repo.initialize().catch(error => {
      console.error('Failed to initialize timer session repository:', error);
    });
    return repo;
  }, true);

  // 注册应用服务（延迟初始化）
  container.register('timerApplicationService', () => {
    const timerSessionRepository = container.resolve('timerSessionRepository');
    return new TimerApplicationService(timerSessionRepository);
  }, true);
}

/**
 * 获取服务实例的辅助函数
 * @param serviceName 服务名称
 * @returns 服务实例
 */
export function getService<T>(serviceName: string): T {
  return container.resolve<T>(serviceName);
}

/**
 * 获取计时器应用服务
 * @returns 计时器应用服务实例
 */
export function getTimerApplicationService(): TimerApplicationService {
  return getService<TimerApplicationService>('timerApplicationService');
}

/**
 * 获取计时器会话存储库
 * @returns 计时器会话存储库实例
 */
export function getTimerSessionRepository(): TimerSessionRepository {
  return getService<TimerSessionRepository>('timerSessionRepository');
}

/**
 * 获取性能监控服务
 * @returns 性能监控服务实例
 */
export function getPerformanceMonitorService(): PerformanceMonitorService {
  return getService<PerformanceMonitorService>('performanceMonitorService');
}
