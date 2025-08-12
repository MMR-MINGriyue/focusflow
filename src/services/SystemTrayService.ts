import { appWindow, Tray } from '@tauri-apps/api/window';
import { Menu, MenuItem, PredefinedMenuItem, Submenu } from '@tauri-apps/api/menu';
import { emit, listen } from '@tauri-apps/api/event';

/**
 * 系统托盘服务
 * 管理桌面应用的系统托盘功能
 */
export class SystemTrayService {
  private tray: Tray | null = null;
  private isInitialized = false;

  /**
   * 初始化系统托盘
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // 创建菜单
      const menu = await Menu.new({
        items: [
          await MenuItem.new({
            id: 'show',
            text: '显示窗口',
            action: async () => {
              await appWindow.show();
              await appWindow.unminimize();
              await appWindow.setFocus();
            },
          }),
          await MenuItem.new({
            id: 'hide',
            text: '隐藏窗口',
            action: async () => {
              await appWindow.hide();
            },
          }),
          await PredefinedMenuItem.new({
            id: 'separator',
            item: 'Separator',
          }),
          await Submenu.new({
            id: 'timer',
            text: '计时器',
            items: [
              await MenuItem.new({
                id: 'start-focus',
                text: '开始专注',
                action: () => {
                  emit('tray-focus-mode');
                },
              }),
              await MenuItem.new({
                id: 'start-break',
                text: '开始休息',
                action: () => {
                  emit('tray-break-mode');
                },
              }),
              await MenuItem.new({
                id: 'pause-timer',
                text: '暂停计时器',
                action: () => {
                  emit('tray-pause-timer');
                },
              }),
            ],
          }),
          await Submenu.new({
            id: 'theme',
            text: '主题',
            items: [
              await MenuItem.new({
                id: 'theme-light',
                text: '浅色',
                action: () => {
                  emit('tray-theme-change', { theme: 'light' });
                },
              }),
              await MenuItem.new({
                id: 'theme-dark',
                text: '深色',
                action: () => {
                  emit('tray-theme-change', { theme: 'dark' });
                },
              }),
              await MenuItem.new({
                id: 'theme-system',
                text: '系统',
                action: () => {
                  emit('tray-theme-change', { theme: 'system' });
                },
              }),
            ],
          }),
          await PredefinedMenuItem.new({
            id: 'separator',
            item: 'Separator',
          }),
          await MenuItem.new({
            id: 'quit',
            text: '退出',
            action: () => {
              emit('tray-quit');
            },
          }),
        ],
      });

      // 创建托盘图标
      this.tray = await Tray.new({
        id: 'main-tray',
        icon: 'icons/icon.png',
        menu,
        tooltip: 'FocusFlow - 智能专注管理',
        menuOnLeftClick: false,
        title: 'FocusFlow',
      });

      // 监听窗口状态变化
      await listen('tauri://blur', async () => {
        // 可以在这里添加窗口失去焦点时的逻辑
      });

      await listen('tauri://focus', async () => {
        // 可以在这里添加窗口获得焦点时的逻辑
      });

      // 监听托盘事件
      await listen('tray-focus-mode', async () => {
        // 处理开始专注模式事件
        await appWindow.show();
        await appWindow.unminimize();
        await appWindow.setFocus();
      });

      await listen('tray-break-mode', async () => {
        // 处理开始休息模式事件
        await appWindow.show();
        await appWindow.unminimize();
        await appWindow.setFocus();
      });

      await listen('tray-pause-timer', async () => {
        // 处理暂停计时器事件
        await appWindow.show();
        await appWindow.unminimize();
        await appWindow.setFocus();
      });

      await listen('tray-theme-change', async (event) => {
        // 处理主题变更事件
        const { theme } = event.payload as { theme: string };
        // 保存主题设置到本地存储
        localStorage.setItem('theme', theme);
      });

      await listen('tray-quit', async () => {
        // 处理退出应用事件
        await appWindow.close();
      });

      this.isInitialized = true;
      console.log('System tray initialized successfully');
    } catch (error) {
      console.error('Failed to initialize system tray:', error);
    }
  }

  /**
   * 更新托盘提示文本
   */
  async updateTooltip(text: string): Promise<void> {
    if (!this.tray) {
      return;
    }

    try {
      await this.tray.setTooltip(text);
    } catch (error) {
      console.error('Failed to update tray tooltip:', error);
    }
  }

  /**
   * 更新托盘标题
   */
  async updateTitle(title: string): Promise<void> {
    if (!this.tray) {
      return;
    }

    try {
      await this.tray.setTitle(title);
    } catch (error) {
      console.error('Failed to update tray title:', error);
    }
  }

  /**
   * 显示托盘通知
   */
  async showNotification(title: string, body: string): Promise<void> {
    try {
      // 使用 Tauri 的通知 API
      emit('show-notification', { title, body });
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  /**
   * 销毁系统托盘
   */
  async destroy(): Promise<void> {
    if (!this.tray) {
      return;
    }

    try {
      await this.tray.destroy();
      this.tray = null;
      this.isInitialized = false;
      console.log('System tray destroyed successfully');
    } catch (error) {
      console.error('Failed to destroy system tray:', error);
    }
  }

  /**
   * 检查系统托盘是否已初始化
   */
  isTrayInitialized(): boolean {
    return this.isInitialized;
  }
}

// 导出单例实例
export const systemTrayService = new SystemTrayService();
