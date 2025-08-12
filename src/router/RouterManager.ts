/**
 * 增强的路由管理器
 * 提供路由注册、导航、守卫和路由元数据管理功能
 */

import { generateId, debounce } from '../utils';

/**
 * 路由参数类型
 */
export type RouteParams = Record<string, string | number | boolean>;

/**
 * 查询参数类型
 */
export type QueryParams = Record<string, string | string[] | number | number[] | boolean>;

/**
 * 路由状态类型
 */
export type RouteState = any;

/**
 * 路由元数据
 */
export interface RouteMeta {
  /**
   * 路由标题
   */
  title?: string;
  /**
   * 路由描述
   */
  description?: string;
  /**
   * 路由图标
   */
  icon?: string;
  /**
   * 是否需要认证
   */
  requiresAuth?: boolean;
  /**
   * 所需权限
   */
  permissions?: string[];
  /**
   * 路由角色
   */
  roles?: string[];
  /**
   * 是否在菜单中显示
   */
  showInMenu?: boolean;
  /**
   * 是否在面包屑中显示
   */
  showInBreadcrumb?: boolean;
  /**
   * 布局组件
   */
  layout?: string;
  /**
   * 是否缓存路由
   */
  keepAlive?: boolean;
  /**
   * 自定义数据
   */
  custom?: Record<string, any>;
}

/**
 * 路由配置
 */
export interface RouteConfig {
  /**
   * 路由路径
   */
  path: string;
  /**
   * 路由名称
   */
  name: string;
  /**
   * 路由组件
   */
  component?: React.ComponentType<any>;
  /**
   * 路由元数据
   */
  meta?: RouteMeta;
  /**
   * 子路由
   */
  children?: RouteConfig[];
  /**
   * 重定向
   */
  redirect?: string;
  /**
   * 路由别名
   */
  alias?: string | string[];
}

/**
 * 路由记录
 */
export interface RouteRecord extends RouteConfig {
  /**
   * 路由ID
   */
  id: string;
  /**
   * 父路由ID
   */
  parentId?: string;
  /**
   * 是否精确匹配
   */
  exact?: boolean;
  /**
   * 完整路径
   */
  fullPath: string;
}

/**
 * 路由位置
 */
export interface Location {
  /**
   * 路径名
   */
  pathname: string;
  /**
   * 查询参数
   */
  query: QueryParams;
  /**
   * 状态
   */
  state?: RouteState;
  /**
   * 哈希
   */
  hash?: string;
}

/**
 * 导航选项
 */
export interface NavigationOptions {
  /**
   * 是否替换当前历史记录
   */
  replace?: boolean;
  /**
   * 状态
   */
  state?: RouteState;
  /**
   * 是否滚动到顶部
   */
  scroll?: boolean;
}

/**
 * 路由守卫函数
 */
export type RouteGuardFunction = (
  to: RouteRecord,
  from: RouteRecord | null,
  next: (path?: string) => void
) => void | boolean | Promise<void | boolean>;

/**
 * 导航守卫类型
 */
export enum NavigationGuardType {
  /**
   * 全局前置守卫
   */
  BEFORE_EACH = 'beforeEach',
  /**
   * 全局后置守卫
   */
  AFTER_EACH = 'afterEach',
  /**
   * 路由独享守卫
   */
  BEFORE_ENTER = 'beforeEnter',
}

/**
 * 路由事件类型
 */
export enum RouterEventType {
  /**
   * 路由变更开始
   */
  ROUTE_CHANGE_START = 'routeChangeStart',
  /**
   * 路由变更成功
   */
  ROUTE_CHANGE_SUCCESS = 'routeChangeSuccess',
  /**
   * 路由变更失败
   */
  ROUTE_CHANGE_ERROR = 'routeChangeError',
}

/**
 * 路由事件
 */
export interface RouterEvent {
  /**
   * 事件类型
   */
  type: RouterEventType;
  /**
   * 目标路由
   */
  to: RouteRecord;
  /**
   * 来源路由
   */
  from: RouteRecord | null;
  /**
   * 错误信息
   */
  error?: Error;
}

/**
 * 路由管理器选项
 */
export interface RouterManagerOptions {
  /**
   * 基础路径
   */
  basename?: string;
  /**
   * 默认路由
   */
  defaultRoute?: string;
  /**
   * 404路由
   */
  notFoundRoute?: string;
  /**
   * 路由模式
   */
  mode?: 'hash' | 'history';
  /**
   * 是否启用滚动行为
   */
  enableScrollBehavior?: boolean;
  /**
   * 是否启用路由缓存
   */
  enableRouteCache?: boolean;
  /**
   * 是否启用路由守卫
   */
  enableRouteGuards?: boolean;
}

/**
 * 增强的路由管理器
 */
export class RouterManager {
  private routes: Map<string, RouteRecord> = new Map();
  private routeMap: Map<string, string> = new Map(); // 路径到ID的映射
  private currentRoute: RouteRecord | null = null;
  private previousRoute: RouteRecord | null = null;
  private basename: string;
  private defaultRoute: string;
  private notFoundRoute: string;
  private mode: 'hash' | 'history';
  private enableScrollBehavior: boolean;
  private enableRouteCache: boolean;
  private enableRouteGuards: boolean;
  private routeCache: Map<string, any> = new Map();
  private guards: Map<NavigationGuardType, RouteGuardFunction[]> = new Map();
  private routeSpecificGuards: Map<string, RouteGuardFunction[]> = new Map();
  private listeners: Map<RouterEventType, ((event: RouterEvent) => void)[]> = new Map();
  private historyListeners: ((location: Location, action: 'PUSH' | 'REPLACE' | 'POP') => void)[] = [];

  constructor(options: RouterManagerOptions = {}) {
    this.basename = options.basename || '';
    this.defaultRoute = options.defaultRoute || '/';
    this.notFoundRoute = options.notFoundRoute || '/404';
    this.mode = options.mode || 'history';
    this.enableScrollBehavior = options.enableScrollBehavior ?? true;
    this.enableRouteCache = options.enableRouteCache ?? true;
    this.enableRouteGuards = options.enableRouteGuards ?? true;

    // 初始化路由守卫
    this.guards.set(NavigationGuardType.BEFORE_EACH, []);
    this.guards.set(NavigationGuardType.AFTER_EACH, []);

    // 初始化路由事件监听器
    this.listeners.set(RouterEventType.ROUTE_CHANGE_START, []);
    this.listeners.set(RouterEventType.ROUTE_CHANGE_SUCCESS, []);
    this.listeners.set(RouterEventType.ROUTE_CHANGE_ERROR, []);

    // 监听浏览器历史变化
    this.setupHistoryListener();
  }

  /**
   * 设置历史监听器
   */
  private setupHistoryListener(): void {
    const handlePopState = (event: PopStateEvent) => {
      // 获取当前路径
      let pathname;
      if (this.mode === 'hash') {
        pathname = window.location.hash.slice(1) || '/';
      } else {
        pathname = window.location.pathname;
      }

      // 移除基础路径
      if (this.basename && pathname.startsWith(this.basename)) {
        pathname = pathname.slice(this.basename.length);
      }

      // 导航到路径
      this.navigateToPath(pathname, { replace: true, state: event.state });
    };

    window.addEventListener('popstate', handlePopState);
  }

  /**
   * 触发路由事件
   */
  private emitRouterEvent(type: RouterEventType, to: RouteRecord, from: RouteRecord | null, error?: Error): void {
    const event: RouterEvent = {
      type,
      to,
      from,
      error,
    };

    // 触发所有监听器
    const listeners = this.listeners.get(type) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (err) {
        console.error(`Error in router event listener for "${type}":`, err);
      }
    });
  }

  /**
   * 触发历史监听器
   */
  private emitHistoryListeners(location: Location, action: 'PUSH' | 'REPLACE' | 'POP'): void {
    this.historyListeners.forEach(listener => {
      try {
        listener(location, action);
      } catch (err) {
        console.error('Error in history listener:', err);
      }
    });
  }

  /**
   * 执行路由守卫
   */
  private async executeGuards(
    type: NavigationGuardType,
    to: RouteRecord,
    from: RouteRecord | null
  ): Promise<boolean | string> {
    // 执行全局守卫
    const globalGuards = this.guards.get(type) || [];
    for (const guard of globalGuards) {
      const result = await new Promise<boolean | string>((resolve) => {
        const next = (path?: string) => {
          resolve(path || true);
        };
        const guardResult = guard(to, from, next);
        if (guardResult !== undefined) {
          resolve(guardResult);
        }
      });

      if (result !== true) {
        return result;
      }
    }

    // 执行路由独享守卫
    if (type === NavigationGuardType.BEFORE_ENTER) {
      const routeGuards = this.routeSpecificGuards.get(to.id) || [];
      for (const guard of routeGuards) {
        const result = await new Promise<boolean | string>((resolve) => {
          const next = (path?: string) => {
            resolve(path || true);
          };
          const guardResult = guard(to, from, next);
          if (guardResult !== undefined) {
            resolve(guardResult);
          }
        });

        if (result !== true) {
          return result;
        }
      }
    }

    return true;
  }

  /**
   * 滚动行为
   */
  private handleScrollBehavior(to: RouteRecord, from: RouteRecord | null): void {
    if (!this.enableScrollBehavior) return;

    // 如果是同一页面，不滚动
    if (from && to.fullPath === from.fullPath) return;

    // 滚动到顶部
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }

  /**
   * 更新浏览器URL
   */
  private updateBrowserURL(path: string, options: NavigationOptions = {}): void {
    const { replace = false, state } = options;
    const fullPath = this.basename ? `${this.basename}${path}` : path;
    const url = this.mode === 'hash' ? `#${fullPath}` : fullPath;

    if (replace) {
      window.history.replaceState(state, '', url);
      this.emitHistoryListeners(this.getCurrentLocation(), 'REPLACE');
    } else {
      window.history.pushState(state, '', url);
      this.emitHistoryListeners(this.getCurrentLocation(), 'PUSH');
    }
  }

  /**
   * 解析路径
   */
  private parsePath(path: string): {
    pathname: string;
    query: QueryParams;
    hash: string;
  } {
    // 移除基础路径
    if (this.basename && path.startsWith(this.basename)) {
      path = path.slice(this.basename.length);
    }

    // 处理哈希模式
    let pathname = path;
    let hash = '';

    if (this.mode === 'hash') {
      if (path.startsWith('#')) {
        pathname = path.slice(1);
      }

      const hashIndex = pathname.indexOf('#');
      if (hashIndex !== -1) {
        hash = pathname.slice(hashIndex);
        pathname = pathname.slice(0, hashIndex);
      }
    }

    // 解析查询参数
    const query: QueryParams = {};
    const queryIndex = pathname.indexOf('?');

    if (queryIndex !== -1) {
      const queryString = pathname.slice(queryIndex + 1);
      pathname = pathname.slice(0, queryIndex);

      const searchParams = new URLSearchParams(queryString);
      searchParams.forEach((value, key) => {
        if (query[key]) {
          if (Array.isArray(query[key])) {
            (query[key] as string[]).push(value);
          } else {
            query[key] = [query[key] as string, value];
          }
        } else {
          query[key] = value;
        }
      });
    }

    return { pathname, query, hash };
  }

  /**
   * 构建路径
   */
  private buildPath(pathname: string, query: QueryParams = {}, hash = ''): string {
    let path = pathname;

    // 添加查询参数
    const searchParams = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, String(v)));
      } else {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    if (queryString) {
      path += `?${queryString}`;
    }

    // 添加哈希
    if (hash) {
      path += `#${hash}`;
    }

    return path;
  }

  /**
   * 查找路由记录
   */
  private findRoute(path: string): RouteRecord | null {
    // 查找精确匹配
    const exactRouteId = this.routeMap.get(path);
    if (exactRouteId) {
      return this.routes.get(exactRouteId) || null;
    }

    // 查找动态路由
    for (const [id, route] of this.routes) {
      if (route.fullPath === path) {
        return route;
      }

      // 处理动态路由
      if (route.path.includes(':')) {
        const routeParts = route.path.split('/');
        const pathParts = path.split('/');

        if (routeParts.length === pathParts.length) {
          let isMatch = true;
          const params: RouteParams = {};

          for (let i = 0; i < routeParts.length; i++) {
            const routePart = routeParts[i];
            const pathPart = pathParts[i];

            if (routePart.startsWith(':')) {
              const paramName = routePart.slice(1);
              params[paramName] = pathPart;
            } else if (routePart !== pathPart) {
              isMatch = false;
              break;
            }
          }

          if (isMatch) {
            // 返回带有参数的路由记录
            return {
              ...route,
              fullPath: path,
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * 注册路由
   */
  registerRoute(route: RouteConfig, parentId?: string): string {
    const id = generateId();
    const fullPath = parentId 
      ? `${this.routes.get(parentId)?.fullPath || ''}${route.path.startsWith('/') ? route.path : `/${route.path}`}`
      : route.path;

    const routeRecord: RouteRecord = {
      ...route,
      id,
      parentId,
      fullPath,
    };

    // 添加路由记录
    this.routes.set(id, routeRecord);
    this.routeMap.set(fullPath, id);

    // 注册子路由
    if (route.children) {
      route.children.forEach(child => {
        this.registerRoute(child, id);
      });
    }

    return id;
  }

  /**
   * 注册路由配置
   */
  registerRoutes(routes: RouteConfig[]): void {
    routes.forEach(route => {
      this.registerRoute(route);
    });
  }

  /**
   * 添加路由守卫
   */
  addGuard(type: NavigationGuardType, guard: RouteGuardFunction): void {
    if (!this.guards.has(type)) {
      this.guards.set(type, []);
    }
    this.guards.get(type)!.push(guard);
  }

  /**
   * 添加路由独享守卫
   */
  addRouteGuard(routeName: string, guard: RouteGuardFunction): void {
    const route = Array.from(this.routes.values()).find(r => r.name === routeName);
    if (!route) {
      throw new Error(`Route "${routeName}" not found`);
    }

    if (!this.routeSpecificGuards.has(route.id)) {
      this.routeSpecificGuards.set(route.id, []);
    }
    this.routeSpecificGuards.get(route.id)!.push(guard);
  }

  /**
   * 移除路由守卫
   */
  removeGuard(type: NavigationGuardType, guard: RouteGuardFunction): void {
    const guards = this.guards.get(type);
    if (guards) {
      const index = guards.indexOf(guard);
      if (index !== -1) {
        guards.splice(index, 1);
      }
    }
  }

  /**
   * 移除路由独享守卫
   */
  removeRouteGuard(routeName: string, guard: RouteGuardFunction): void {
    const route = Array.from(this.routes.values()).find(r => r.name === routeName);
    if (!route) {
      throw new Error(`Route "${routeName}" not found`);
    }

    const guards = this.routeSpecificGuards.get(route.id);
    if (guards) {
      const index = guards.indexOf(guard);
      if (index !== -1) {
        guards.splice(index, 1);
      }
    }
  }

  /**
   * 添加路由事件监听器
   */
  addEventListener(type: RouterEventType, listener: (event: RouterEvent) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(listener);

    // 返回取消监听函数
    return () => {
      const listeners = this.listeners.get(type);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * 添加历史监听器
   */
  addHistoryListener(listener: (location: Location, action: 'PUSH' | 'REPLACE' | 'POP') => void): () => void {
    this.historyListeners.push(listener);

    // 返回取消监听函数
    return () => {
      const index = this.historyListeners.indexOf(listener);
      if (index !== -1) {
        this.historyListeners.splice(index, 1);
      }
    };
  }

  /**
   * 导航到路径
   */
  async navigateToPath(path: string, options: NavigationOptions = {}): Promise<void> {
    // 解析路径
    const { pathname, query, hash } = this.parsePath(path);

    // 查找路由记录
    const route = this.findRoute(pathname);
    if (!route) {
      // 如果没有找到路由，导航到404页面
      await this.navigateToPath(this.notFoundRoute, options);
      return;
    }

    // 触发路由变更开始事件
    this.emitRouterEvent(RouterEventType.ROUTE_CHANGE_START, route, this.currentRoute);

    try {
      // 执行全局前置守卫
      if (this.enableRouteGuards) {
        const guardResult = await this.executeGuards(
          NavigationGuardType.BEFORE_EACH,
          route,
          this.currentRoute
        );

        if (guardResult !== true) {
          if (typeof guardResult === 'string') {
            await this.navigateToPath(guardResult, options);
          }
          return;
        }

        // 执行路由独享守卫
        const routeGuardResult = await this.executeGuards(
          NavigationGuardType.BEFORE_ENTER,
          route,
          this.currentRoute
        );

        if (routeGuardResult !== true) {
          if (typeof routeGuardResult === 'string') {
            await this.navigateToPath(routeGuardResult, options);
          }
          return;
        }
      }

      // 更新当前路由
      this.previousRoute = this.currentRoute;
      this.currentRoute = route;

      // 更新浏览器URL
      this.updateBrowserURL(path, options);

      // 处理滚动行为
      if (options.scroll !== false) {
        this.handleScrollBehavior(route, this.previousRoute);
      }

      // 执行全局后置守卫
      if (this.enableRouteGuards) {
        await this.executeGuards(
          NavigationGuardType.AFTER_EACH,
          route,
          this.previousRoute
        );
      }

      // 触发路由变更成功事件
      this.emitRouterEvent(RouterEventType.ROUTE_CHANGE_SUCCESS, route, this.previousRoute);
    } catch (error) {
      // 触发路由变更失败事件
      this.emitRouterEvent(RouterEventType.ROUTE_CHANGE_ERROR, route, this.currentRoute, error as Error);
      throw error;
    }
  }

  /**
   * 导航到路由名称
   */
  async navigateToName(name: string, params?: RouteParams, query?: QueryParams, options: NavigationOptions = {}): Promise<void> {
    // 查找路由记录
    const route = Array.from(this.routes.values()).find(r => r.name === name);
    if (!route) {
      throw new Error(`Route "${name}" not found`);
    }

    // 构建路径
    let path = route.path;

    // 替换路径参数
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        path = path.replace(`:${key}`, String(value));
      });
    }

    // 添加查询参数
    if (query) {
      path = this.buildPath(path, query);
    }

    // 导航到路径
    await this.navigateToPath(path, options);
  }

  /**
   * 返回上一页
   */
  back(): void {
    window.history.back();
  }

  /**
   * 前进一页
   */
  forward(): void {
    window.history.forward();
  }

  /**
   * 刷新当前页
   */
  refresh(): void {
    window.location.reload();
  }

  /**
   * 获取当前路由
   */
  getCurrentRoute(): RouteRecord | null {
    return this.currentRoute;
  }

  /**
   * 获取上一路由
   */
  getPreviousRoute(): RouteRecord | null {
    return this.previousRoute;
  }

  /**
   * 获取所有路由
   */
  getRoutes(): RouteRecord[] {
    return Array.from(this.routes.values());
  }

  /**
   * 根据名称获取路由
   */
  getRouteByName(name: string): RouteRecord | null {
    return Array.from(this.routes.values()).find(r => r.name === name) || null;
  }

  /**
   * 获取当前路径
   */
  getCurrentPath(): string {
    if (this.mode === 'hash') {
      return window.location.hash.slice(1) || '/';
    }
    return window.location.pathname;
  }

  /**
   * 获取当前位置
   */
  getCurrentLocation(): Location {
    const path = this.getCurrentPath();
    const { pathname, query, hash } = this.parsePath(path);

    return {
      pathname,
      query,
      hash,
      state: window.history.state,
    };
  }

  /**
   * 获取路由参数
   */
  getRouteParams(): RouteParams {
    if (!this.currentRoute) return {};

    const currentPath = this.getCurrentPath();
    const routePath = this.currentRoute.path;

    const params: RouteParams = {};
    const routeParts = routePath.split('/');
    const pathParts = currentPath.split('/');

    for (let i = 0; i < routeParts.length; i++) {
      const routePart = routeParts[i];
      if (routePart.startsWith(':')) {
        const paramName = routePart.slice(1);
        params[paramName] = pathParts[i];
      }
    }

    return params;
  }

  /**
   * 获取查询参数
   */
  getQueryParams(): QueryParams {
    return this.getCurrentLocation().query;
  }

  /**
   * 获取路由缓存
   */
  getRouteCache(routeName: string): any {
    return this.routeCache.get(routeName);
  }

  /**
   * 设置路由缓存
   */
  setRouteCache(routeName: string, data: any): void {
    if (this.enableRouteCache) {
      this.routeCache.set(routeName, data);
    }
  }

  /**
   * 清除路由缓存
   */
  clearRouteCache(routeName?: string): void {
    if (routeName) {
      this.routeCache.delete(routeName);
    } else {
      this.routeCache.clear();
    }
  }

  /**
   * 销毁路由管理器
   */
  destroy(): void {
    // 清理路由记录
    this.routes.clear();
    this.routeMap.clear();

    // 清理路由缓存
    this.routeCache.clear();

    // 清理守卫
    this.guards.clear();
    this.routeSpecificGuards.clear();

    // 清理事件监听器
    this.listeners.clear();
    this.historyListeners = [];
  }
}

/**
 * 创建路由管理器
 */
export function createRouterManager(options: RouterManagerOptions = {}): RouterManager {
  return new RouterManager(options);
}
