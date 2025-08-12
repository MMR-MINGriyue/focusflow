/**
 * 增强的路由保护组件
 * 提供路由守卫、权限控制和访问控制功能
 */

import React, { useEffect, useState } from 'react';
import { RouterManager, RouteRecord, NavigationGuardType } from '../../router';
import { OptimizedCard } from '../ui/OptimizedCard';
import { OptimizedButton } from '../ui/OptimizedButton';

/**
 * 用户权限类型
 */
export type UserPermission = string;

/**
 * 用户角色类型
 */
export type UserRole = string;

/**
 * 用户信息
 */
export interface UserInfo {
  /**
   * 用户ID
   */
  id: string;
  /**
   * 用户名
   */
  username: string;
  /**
   * 用户邮箱
   */
  email?: string;
  /**
   * 用户头像
   */
  avatar?: string;
  /**
   * 用户权限
   */
  permissions: UserPermission[];
  /**
   * 用户角色
   */
  roles: UserRole[];
  /**
   * 是否已认证
   */
  isAuthenticated: boolean;
  /**
   * 自定义数据
   */
  custom?: Record<string, any>;
}

/**
 * 路由保护组件属性
 */
export interface RouteGuardProps {
  /**
   * 路由管理器
   */
  router: RouterManager;
  /**
   * 用户信息
   */
  user: UserInfo;
  /**
   * 未认证时重定向的路径
   */
  unauthorizedRedirect?: string;
  /**
   * 无权限时重定向的路径
   */
  forbiddenRedirect?: string;
  /**
   * 加载组件
   */
  loadingComponent?: React.ComponentType;
  /**
   * 未认证组件
   */
  unauthorizedComponent?: React.ComponentType;
  /**
   * 无权限组件
   */
  forbiddenComponent?: React.ComponentType;
  /**
   * 404组件
   */
  notFoundComponent?: React.ComponentType;
  /**
   * 子组件
   */
  children: React.ReactNode;
}

/**
 * 默认加载组件
 */
const DefaultLoadingComponent: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);

/**
 * 默认未认证组件
 */
const DefaultUnauthorizedComponent: React.FC<{ onLogin?: () => void }> = ({ onLogin }) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <OptimizedCard className="w-full max-w-md p-8">
      <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">需要登录</h1>
      <p className="text-gray-600 text-center mb-6">请登录后访问此页面</p>
      <div className="flex justify-center">
        <OptimizedButton onClick={onLogin}>登录</OptimizedButton>
      </div>
    </OptimizedCard>
  </div>
);

/**
 * 默认无权限组件
 */
const DefaultForbiddenComponent: React.FC<{ onBack?: () => void }> = ({ onBack }) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <OptimizedCard className="w-full max-w-md p-8">
      <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">访问被拒绝</h1>
      <p className="text-gray-600 text-center mb-6">您没有权限访问此页面</p>
      <div className="flex justify-center">
        <OptimizedButton onClick={onBack}>返回</OptimizedButton>
      </div>
    </OptimizedCard>
  </div>
);

/**
 * 默认404组件
 */
const DefaultNotFoundComponent: React.FC<{ onBack?: () => void }> = ({ onBack }) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <OptimizedCard className="w-full max-w-md p-8">
      <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">页面不存在</h1>
      <p className="text-gray-600 text-center mb-6">您访问的页面不存在</p>
      <div className="flex justify-center">
        <OptimizedButton onClick={onBack}>返回</OptimizedButton>
      </div>
    </OptimizedCard>
  </div>
);

/**
 * 增强的路由保护组件
 */
export const RouteGuard: React.FC<RouteGuardProps> = ({
  router,
  user,
  unauthorizedRedirect = '/login',
  forbiddenRedirect = '/403',
  loadingComponent: LoadingComponent = DefaultLoadingComponent,
  unauthorizedComponent: UnauthorizedComponent = DefaultUnauthorizedComponent,
  forbiddenComponent: ForbiddenComponent = DefaultForbiddenComponent,
  notFoundComponent: NotFoundComponent = DefaultNotFoundComponent,
  children,
}) => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [hasPermission, setHasPermission] = useState(true);
  const [routeFound, setRouteFound] = useState(true);

  // 检查路由权限
  const checkRoutePermission = useCallback((route: RouteRecord): boolean => {
    // 检查是否需要认证
    if (route.meta?.requiresAuth && !user.isAuthenticated) {
      return false;
    }

    // 检查权限
    if (route.meta?.permissions && route.meta.permissions.length > 0) {
      const hasRequiredPermission = route.meta.permissions.some(permission =>
        user.permissions.includes(permission)
      );
      if (!hasRequiredPermission) {
        return false;
      }
    }

    // 检查角色
    if (route.meta?.roles && route.meta.roles.length > 0) {
      const hasRequiredRole = route.meta.roles.some(role =>
        user.roles.includes(role)
      );
      if (!hasRequiredRole) {
        return false;
      }
    }

    return true;
  }, [user]);

  // 设置路由守卫
  useEffect(() => {
    // 全局前置守卫
    const beforeGuard = router.addGuard(NavigationGuardType.BEFORE_EACH, async (to, from, next) => {
      setLoading(true);
      setAuthorized(true);
      setHasPermission(true);
      setRouteFound(true);

      // 检查路由是否存在
      if (!to) {
        setRouteFound(false);
        setLoading(false);
        next('/404');
        return;
      }

      // 检查权限
      const hasPermission = checkRoutePermission(to);
      if (!hasPermission) {
        if (to.meta?.requiresAuth && !user.isAuthenticated) {
          setAuthorized(false);
          setLoading(false);
          next(unauthorizedRedirect);
          return;
        } else {
          setHasPermission(false);
          setLoading(false);
          next(forbiddenRedirect);
          return;
        }
      }

      setLoading(false);
      next();
    });

    // 清理函数
    return () => {
      router.removeGuard(NavigationGuardType.BEFORE_EACH, beforeGuard);
    };
  }, [router, user, checkRoutePermission, unauthorizedRedirect, forbiddenRedirect]);

  // 监听路由变化
  useEffect(() => {
    const handleRouteChange = () => {
      const currentRoute = router.getCurrentRoute();
      if (currentRoute) {
        const hasPermission = checkRoutePermission(currentRoute);
        setHasPermission(hasPermission);

        if (currentRoute.meta?.requiresAuth && !user.isAuthenticated) {
          setAuthorized(false);
        } else {
          setAuthorized(true);
        }
      }
    };

    router.addRouteListener(RouterEventType.ROUTE_CHANGE_SUCCESS, handleRouteChange);

    return () => {
      router.removeRouteListener(RouterEventType.ROUTE_CHANGE_SUCCESS, handleRouteChange);
    };
  }, [router, user, checkRoutePermission]);

  // 处理登录
  const handleLogin = useCallback(() => {
    router.navigateToPath(unauthorizedRedirect);
  }, [router, unauthorizedRedirect]);

  // 处理返回
  const handleBack = useCallback(() => {
    router.goBack();
  }, [router]);

  // 渲染内容
  if (loading) {
    return <LoadingComponent />;
  }

  if (!routeFound) {
    return <notFoundComponent onBack={handleBack} />;
  }

  if (!authorized) {
    return <unauthorizedComponent onLogin={handleLogin} />;
  }

  if (!hasPermission) {
    return <forbiddenComponent onBack={handleBack} />;
  }

  return <>{children}</>;
};

/**
 * 权限检查Hook
 * @param user 用户信息
 * @param permissions 需要的权限
 * @returns 是否有权限
 */
export function usePermissionCheck(
  user: UserInfo,
  permissions: UserPermission | UserPermission[]
): boolean {
  const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];

  return requiredPermissions.some(permission =>
    user.permissions.includes(permission)
  );
}

/**
 * 角色检查Hook
 * @param user 用户信息
 * @param roles 需要的角色
 * @returns 是否有角色
 */
export function useRoleCheck(
  user: UserInfo,
  roles: UserRole | UserRole[]
): boolean {
  const requiredRoles = Array.isArray(roles) ? roles : [roles];

  return requiredRoles.some(role =>
    user.roles.includes(role)
  );
}

/**
 * 权限控制组件属性
 */
export interface PermissionControlProps {
  /**
   * 用户信息
   */
  user: UserInfo;
  /**
   * 需要的权限
   */
  permissions: UserPermission | UserPermission[];
  /**
   * 需要的角色
   */
  roles?: UserRole | UserRole[];
  /**
   * 无权限时显示的组件
   */
  fallback?: React.ReactNode;
  /**
   * 子组件
   */
  children: React.ReactNode;
}

/**
 * 权限控制组件
 */
export const PermissionControl: React.FC<PermissionControlProps> = ({
  user,
  permissions,
  roles,
  fallback = null,
  children,
}) => {
  const hasPermission = usePermissionCheck(user, permissions);
  const hasRole = roles ? useRoleCheck(user, roles) : true;

  if (hasPermission && hasRole) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

/**
 * 路由事件类型
 */
export enum RouterEventType {
  ROUTE_CHANGE_START = 'routeChangeStart',
  ROUTE_CHANGE_SUCCESS = 'routeChangeSuccess',
  ROUTE_CHANGE_ERROR = 'routeChangeError',
}
