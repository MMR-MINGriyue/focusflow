/**
 * 路由和导航系统索引文件
 * 统一导出所有路由和导航功能，方便使用
 */

// 路由管理器
export {
  RouterManager,
  createRouterManager,
  type RouteParams,
  type QueryParams,
  type RouteState,
  type RouteMeta,
  type RouteConfig,
  type RouteRecord,
  type Location,
  type NavigationOptions,
  type RouteGuardFunction,
  type NavigationGuardType,
  type RouterEventType,
  type RouterEvent,
  type RouterManagerOptions,
} from './RouterManager';

// 导航组件
export {
  EnhancedNavigation,
  type BreadcrumbItem,
  type MenuItem,
  type RouteTab,
  type EnhancedNavigationProps,
} from '../components/Navigation/EnhancedNavigation';

// 路由保护组件
export {
  RouteGuard,
  PermissionControl,
  usePermissionCheck,
  useRoleCheck,
  type UserInfo,
  type UserPermission,
  type UserRole,
  type RouteGuardProps,
  type PermissionControlProps,
} from '../components/Router/RouteGuard';

// 预定义路由
export const predefinedRoutes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../pages/Home').then(m => m.Home),
    meta: {
      title: '首页',
      icon: '🏠',
      showInMenu: true,
      showInBreadcrumb: true,
    },
  },
  {
    path: '/timer',
    name: 'timer',
    component: () => import('../pages/Timer').then(m => m.Timer),
    meta: {
      title: '计时器',
      icon: '⏱️',
      showInMenu: true,
      showInBreadcrumb: true,
      requiresAuth: true,
    },
  },
  {
    path: '/statistics',
    name: 'statistics',
    component: () => import('../pages/Statistics').then(m => m.Statistics),
    meta: {
      title: '统计',
      icon: '📊',
      showInMenu: true,
      showInBreadcrumb: true,
      requiresAuth: true,
    },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../pages/Settings').then(m => m.Settings),
    meta: {
      title: '设置',
      icon: '⚙️',
      showInMenu: true,
      showInBreadcrumb: true,
      requiresAuth: true,
    },
    children: [
      {
        path: '/settings/general',
        name: 'settings-general',
        component: () => import('../pages/settings/General').then(m => m.General),
        meta: {
          title: '通用设置',
          showInMenu: true,
          showInBreadcrumb: true,
        },
      },
      {
        path: '/settings/theme',
        name: 'settings-theme',
        component: () => import('../pages/settings/Theme').then(m => m.Theme),
        meta: {
          title: '主题设置',
          showInMenu: true,
          showInBreadcrumb: true,
        },
      },
      {
        path: '/settings/notifications',
        name: 'settings-notifications',
        component: () => import('../pages/settings/Notifications').then(m => m.Notifications),
        meta: {
          title: '通知设置',
          showInMenu: true,
          showInBreadcrumb: true,
        },
      },
    ],
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../pages/Profile').then(m => m.Profile),
    meta: {
      title: '个人资料',
      icon: '👤',
      showInMenu: true,
      showInBreadcrumb: true,
      requiresAuth: true,
    },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../pages/Login').then(m => m.Login),
    meta: {
      title: '登录',
      showInMenu: false,
      showInBreadcrumb: false,
    },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../pages/Register').then(m => m.Register),
    meta: {
      title: '注册',
      showInMenu: false,
      showInBreadcrumb: false,
    },
  },
  {
    path: '/404',
    name: 'not-found',
    component: () => import('../pages/NotFound').then(m => m.NotFound),
    meta: {
      title: '页面不存在',
      showInMenu: false,
      showInBreadcrumb: false,
    },
  },
];

// 预定义菜单
export const predefinedMenu = [
  {
    path: '/',
    title: '首页',
    icon: '🏠',
  },
  {
    path: '/timer',
    title: '计时器',
    icon: '⏱️',
  },
  {
    path: '/statistics',
    title: '统计',
    icon: '📊',
  },
  {
    path: '/settings',
    title: '设置',
    icon: '⚙️',
    children: [
      {
        path: '/settings/general',
        title: '通用设置',
      },
      {
        path: '/settings/theme',
        title: '主题设置',
      },
      {
        path: '/settings/notifications',
        title: '通知设置',
      },
    ],
  },
  {
    path: '/profile',
    title: '个人资料',
    icon: '👤',
  },
];

// 创建路由管理器
export const createAppRouter = () => {
  return new RouterManager({
    basename: '/',
    defaultRoute: '/',
    notFoundRoute: '/404',
    mode: 'history',
    enableScrollBehavior: true,
    enableRouteCache: true,
    enableRouteGuards: true,
  });
};

// 路由上下文
export interface RouterContext {
  /**
   * 路由管理器
   */
  router: RouterManager;
  /**
   * 初始化路由
   */
  initialize: () => Promise<void>;
  /**
   * 销毁路由
   */
  destroy: () => void;
}

// 创建路由上下文
export const createRouterContext = (): RouterContext => {
  const router = createAppRouter();

  return {
    router,
    initialize: async () => {
      // 注册路由
      predefinedRoutes.forEach(route => {
        router.registerRoute(route);
      });

      // 初始化路由
      console.log('Initializing router...');

      // 这里可以添加其他初始化逻辑
    },
    destroy: () => {
      // 销毁路由
      console.log('Destroying router...');

      // 销毁路由管理器
      router.destroy();
    },
  };
};
