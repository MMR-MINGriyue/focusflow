/**
 * 环境适配器工厂
 * 根据当前运行环境创建适当的适配器实例
 */

import { EnvironmentAdapter } from './EnvironmentAdapter';
import { WebAdapter } from './WebAdapter';
import { DesktopAdapter } from './DesktopAdapter';
import { container } from '../container/IoCContainer';

export class AdapterFactory {
  private static _adapterType: 'web' | 'desktop' | null = null;

  /**
   * 创建适合当前环境的环境适配器
   * @returns 环境适配器实例
   */
  static createEnvironmentAdapter(): EnvironmentAdapter {
    // 检测当前运行环境
    const isDesktop = !!(window as any).__TAURI__;
    this._adapterType = isDesktop ? 'desktop' : 'web';

    if (isDesktop) {
      return new DesktopAdapter();
    } else {
      return new WebAdapter();
    }
  }

  /**
   * 注册环境适配器到依赖注入容器
   */
  static registerEnvironmentAdapter(): void {
    container.register('environmentAdapter', () => AdapterFactory.createEnvironmentAdapter(), true);
  }

  /**
   * 获取当前环境适配器实例
   * @returns 环境适配器实例
   */
  static getEnvironmentAdapter(): EnvironmentAdapter {
    // 如果尚未注册，先注册
    if (!container.isRegistered('environmentAdapter')) {
      AdapterFactory.registerEnvironmentAdapter();
    }

    return container.resolve<EnvironmentAdapter>('environmentAdapter');
  }

  /**
   * 获取当前环境类型
   * @returns 环境类型
   */
  static getEnvironmentType(): 'web' | 'desktop' {
    if (!this._adapterType) {
      // 如果尚未初始化，先初始化
      this.createEnvironmentAdapter();
    }
    return this._adapterType!;
  }

  /**
   * 检查是否为桌面环境
   * @returns 是否为桌面环境
   */
  static isDesktop(): boolean {
    return AdapterFactory.getEnvironmentType() === 'desktop';
  }

  /**
   * 检查是否为Web环境
   * @returns 是否为Web环境
   */
  static isWeb(): boolean {
    return AdapterFactory.getEnvironmentType() === 'web';
  }

  /**
   * 重置适配器（主要用于测试）
   */
  static reset(): void {
    this._adapterType = null;
    container.unregister('environmentAdapter');
  }
}
