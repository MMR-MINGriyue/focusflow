/**
 * 服务注册模块
 * 将所有核心服务注册到依赖注入容器
 */

import { container } from './IoCContainer';
import { SoundService } from '../infrastructure/services/SoundService';
import { DatabaseService } from '../infrastructure/services/DatabaseService';
import { NotificationService } from '../infrastructure/services/NotificationService';
import { StorageService, LocalStorageService, MemoryStorageService } from '../infrastructure/services/StorageService';
import { ThemeService } from '../infrastructure/services/ThemeService';
import { DataSecurityService } from '../infrastructure/services/DataSecurityService';
import { TimerSessionRepository } from '../infrastructure/repositories/TimerSessionRepository';
import { TimerApplicationService } from '../application/services/TimerApplicationService';
import { AnalyticsServiceImpl } from '../infrastructure/services/AnalyticsService';
import { AchievementServiceImpl } from '../infrastructure/services/AchievementService';
import { CacheServiceImpl } from '../infrastructure/services/CacheService';
import { PerformanceMonitoringServiceImpl } from '../infrastructure/services/PerformanceMonitoringService';
import { ErrorHandlerServiceImpl } from '../infrastructure/services/ErrorHandlerService';
import { TaskAggregateRepositoryImpl } from '../infrastructure/repositories/TaskAggregateRepositoryImpl';
import { EventDispatcher } from '../infrastructure/events/EventDispatcher';
import { TimerDomainService } from '../domain/services/TimerDomainService';
import { TaskDomainService } from '../domain/services/TaskDomainService';

/**
 * 注册所有核心服务到容器
 */
export function registerServices(): void {
  // 注册存储服务（单例）
  if (typeof localStorage !== 'undefined') {
    container.register('storageService', () => new LocalStorageService(), true);
  } else {
    // 在不支持localStorage的环境（如某些测试环境）使用内存存储
    container.register('storageService', () => new MemoryStorageService(), true);
  }

  // 注册声音服务（单例）
  container.register('soundService', () => new SoundService(), true);

  // 注册数据库服务（单例）
  container.register('databaseService', () => new DatabaseService(), true);

  // 注册通知服务（单例）
  container.register('notificationService', () => new NotificationService(), true);

  // 注册主题服务（单例）
  container.register('themeService', () => new ThemeService(), true);

  // 注册数据安全服务（单例）
  container.register('dataSecurityService', () => new DataSecurityService(), true);

  // 注册分析服务（单例）
  container.register('analyticsService', () => new AnalyticsServiceImpl(), true);

  // 注册成就服务（单例）
  container.register('achievementService', () => new AchievementServiceImpl(), true);

  // 注册缓存服务（单例）
  container.register('cacheService', () => new CacheServiceImpl(), true);

  // 注册性能监控服务（单例）
  container.register('performanceMonitoringService', () => new PerformanceMonitoringServiceImpl(), true);

  // 注册错误处理服务（单例）
  container.register('errorHandlerService', () => new ErrorHandlerServiceImpl(), true);

  // 注册任务聚合仓储（单例）
  container.register('taskAggregateRepository', () => new TaskAggregateRepositoryImpl(), true);

  // 注册事件分发器（单例）
  container.register('eventDispatcher', () => new EventDispatcher(), true);

  // 注册领域服务
  const defaultTimerSettings = {
    focusDuration: 25 * 60, // 25分钟
    shortBreakDuration: 5 * 60, // 5分钟
    longBreakDuration: 15 * 60, // 15分钟
    longBreakInterval: 4, // 4个专注时段后长休息
    autoStartBreak: false,
    autoStartFocus: false,
    soundEnabled: true,
    volume: 0.7,
  };

  container.register('timerDomainService', () => new TimerDomainService(defaultTimerSettings), true);

  container.register('taskDomainService', () => new TaskDomainService(), true);

  console.log('All services registered successfully');
}

/**
 * 获取服务实例的辅助函数
 * @param serviceName 服务名称
 * @returns 服务实例
 */
export function getService<T>(serviceName: string): T {
  return container.resolve<T>(serviceName);
}
