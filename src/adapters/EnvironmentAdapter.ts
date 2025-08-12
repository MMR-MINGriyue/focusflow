/**
 * 环境适配器接口
 * 定义不同环境（Web和桌面）的通用操作接口
 */

export interface EnvironmentAdapter {
  /**
   * 获取环境名称
   */
  getName(): string;

  /**
   * 检查是否支持通知
   */
  supportsNotifications(): boolean;

  /**
   * 检查是否支持系统托盘
   */
  supportsSystemTray(): boolean;

  /**
   * 检查是否支持后台运行
   */
  supportsBackgroundOperation(): boolean;

  /**
   * 显示通知
   * @param title 通知标题
   * @param body 通知内容
   */
  showNotification(title: string, body: string): Promise<void>;

  /**
   * 最小化到系统托盘
   */
  minimizeToTray(): Promise<void>;

  /**
   * 从系统托盘恢复
   */
  restoreFromTray(): Promise<void>;

  /**
   * 获取平台特定信息
   */
  getPlatformInfo(): {
    isDesktop: boolean;
    isWeb: boolean;
    platform: string;
    version?: string;
  };
}
