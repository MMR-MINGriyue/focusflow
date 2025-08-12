/**
 * 依赖注入容器实现
 * 提供统一的服务注册和解析机制
 */

// 服务工厂类型
type ServiceFactory<T = any> = () => T;

// 服务描述符接口
interface ServiceDescriptor {
  factory: ServiceFactory;
  isSingleton: boolean;
  dependencies?: string[];
  instance?: any;
  resolved?: boolean;
}

export class IoCContainer {
  private services: Map<string, ServiceDescriptor> = new Map();
  private singletons: Map<string, any> = new Map();
  private resolving: Set<string> = new Set(); // 用于检测循环依赖

  /**
   * 注册服务到容器
   * @param key 服务标识符
   * @param factory 服务工厂函数
   * @param isSingleton 是否为单例服务
   * @param dependencies 依赖的服务列表
   */
  register<T>(
    key: string, 
    factory: ServiceFactory<T>, 
    isSingleton = false,
    dependencies?: string[]
  ): void {
    this.services.set(key, { 
      factory, 
      isSingleton,
      dependencies 
    });
  }

  /**
   * 从容器解析服务
   * @param key 服务标识符
   * @returns 服务实例
   */
  resolve<T>(key: string): T {
    // 检查服务是否已注册
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`Service '${key}' not registered`);
    }

    // 检查循环依赖
    if (this.resolving.has(key)) {
      throw new Error(`Circular dependency detected: ${Array.from(this.resolving).join(' -> ')} -> ${key}`);
    }

    // 如果是单例且已创建，直接返回
    if (service.isSingleton && this.singletons.has(key)) {
      return this.singletons.get(key);
    }

    // 添加到解析队列
    this.resolving.add(key);

    try {
      // 解析依赖
      let instance: T;
      if (service.dependencies && service.dependencies.length > 0) {
        // 创建一个代理函数，在调用时解析依赖
        const proxyFactory = () => {
          const resolvedDeps: Record<string, any> = {};
          for (const depKey of service.dependencies!) {
            resolvedDeps[depKey] = this.resolve(depKey);
          }
          return service.factory(resolvedDeps);
        };

        instance = proxyFactory();
      } else {
        instance = service.factory();
      }

      // 如果是单例，缓存实例
      if (service.isSingleton) {
        this.singletons.set(key, instance);
      }

      return instance;
    } finally {
      // 从解析队列中移除
      this.resolving.delete(key);
    }
  }

  /**
   * 检查服务是否已注册
   * @param key 服务标识符
   * @returns 是否已注册
   */
  isRegistered(key: string): boolean {
    return this.services.has(key);
  }

  /**
   * 从容器中移除服务
   * @param key 服务标识符
   */
  unregister(key: string): boolean {
    const removed = this.services.delete(key);
    if (removed) {
      this.singletons.delete(key);
    }
    return removed;
  }

  /**
   * 清除所有单例实例（主要用于测试）
   */
  clearSingletons(): void {
    this.singletons.clear();
  }

  /**
   * 重置容器（主要用于测试）
   */
  reset(): void {
    this.services.clear();
    this.singletons.clear();
    this.resolving.clear();
  }

  /**
   * 获取所有已注册的服务键
   */
  getRegisteredKeys(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * 检查是否存在循环依赖
   */
  hasCircularDependency(): boolean {
    try {
      // 尝试解析所有服务来检测循环依赖
      for (const key of this.services.keys()) {
        this.resolve(key);
      }
      return false;
    } catch (error) {
      return error instanceof Error && error.message.includes('Circular dependency');
    }
  }
}

// 创建全局容器实例
export const container = new IoCContainer();

/**
 * 装饰器：自动注册类到容器
 * @param key 服务标识符，默认为类名
 * @param isSingleton 是否为单例服务
 */
export function Injectable(key?: string, isSingleton = true) {
  return function <T extends { new(...args: any[]): any }>(constructor: T) {
    const serviceKey = key || constructor.name;

    // 创建工厂函数
    const factory = () => new constructor();

    // 注册到容器
    container.register(serviceKey, factory, isSingleton);

    return constructor;
  };
}

/**
 * 装饰器：标记需要注入的属性
 * @param key 服务标识符，默认为属性名
 */
export function Inject(key?: string) {
  return function (target: any, propertyKey: string) {
    const serviceKey = key || propertyKey;

    // 使用getter实现延迟注入
    Object.defineProperty(target, propertyKey, {
      get() {
        return container.resolve(serviceKey);
      },
      enumerable: true,
      configurable: true,
    });
  };
}
