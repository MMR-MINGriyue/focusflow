/**
 * 配置和插件管理索引文件
 * 统一导出所有配置和插件管理功能，方便使用
 */

// 配置管理器
export {
  ConfigManager,
  createConfigManager,
  type ConfigChangeEvent,
  type ConfigManagerOptions,
} from './ConfigManager';

// 主题管理器
export {
  ThemeManager,
  createThemeManager,
  type ThemeConfig,
  type ThemeColors,
  type ThemeChangeEvent,
  type ThemeManagerOptions,
  predefinedThemes,
} from './ThemeManager';

// 插件管理器
export {
  PluginManager,
  createPluginManager,
  type Plugin,
  type PluginMetadata,
  type PluginAPI,
  type PluginStatus,
  type PluginStatusChangeEvent,
  type PluginManagerOptions,
} from './PluginManager';

// 应用配置
export interface AppConfig {
  /**
   * 应用名称
   */
  appName: string;
  /**
   * 应用版本
   */
  appVersion: string;
  /**
   * 应用描述
   */
  appDescription?: string;
  /**
   * 应用图标
   */
  appIcon?: string;
  /**
   * 语言
   */
  language: string;
  /**
   * 主题
   */
  theme: string;
  /**
   * 是否启用深色模式
   */
  darkMode: boolean;
  /**
   * 是否启用调试模式
   */
  debugMode: boolean;
  /**
   * 是否启用性能监控
   */
  enablePerformanceMonitor: boolean;
  /**
   * 是否启用错误报告
   */
  enableErrorReporting: boolean;
  /**
   * 是否启用自动更新
   */
  enableAutoUpdate: boolean;
  /**
   * 是否启用插件
   */
  enablePlugins: boolean;
  /**
   * 插件配置
   */
  plugins?: Record<string, any>;
  /**
   * 用户设置
   */
  userSettings?: {
    /**
     * 用户名
     */
    username?: string;
    /**
     * 用户邮箱
     */
    email?: string;
    /**
     * 用户头像
     */
    avatar?: string;
    /**
     * 用户偏好
     */
    preferences?: {
      /**
       * 通知设置
       */
      notifications?: {
        /**
         * 是否启用通知
         */
        enabled: boolean;
        /**
         * 通知类型
         */
        types: string[];
      };
      /**
       * 隐私设置
       */
      privacy?: {
        /**
         * 是否启用隐私模式
         */
        enabled: boolean;
        /**
         * 数据收集设置
         */
        dataCollection: boolean;
      };
    };
  };
}

// 默认应用配置
export const defaultAppConfig: AppConfig = {
  appName: '专注计时器',
  appVersion: '1.0.0',
  appDescription: '高效管理您的专注时间',
  language: 'zh-CN',
  theme: 'light',
  darkMode: false,
  debugMode: false,
  enablePerformanceMonitor: true,
  enableErrorReporting: true,
  enableAutoUpdate: true,
  enablePlugins: true,
  userSettings: {
    preferences: {
      notifications: {
        enabled: true,
        types: ['timer', 'break', 'achievement'],
      },
      privacy: {
        enabled: false,
        dataCollection: true,
      },
    },
  },
};

// 创建应用配置管理器
export const createAppConfigManager = () => {
  return createConfigManager<AppConfig>({
    defaultConfig: defaultAppConfig,
    persist: true,
    persistKey: 'app-config',
    validator: (config) => {
      // 简单验证配置
      return !!config.appName && !!config.appVersion;
    },
  });
};

// 创建主题管理器
export const createAppThemeManager = () => {
  return createThemeManager({
    defaultTheme: predefinedThemes.light,
    availableThemes: [
      predefinedThemes.light,
      predefinedThemes.dark,
      predefinedThemes.blue,
      predefinedThemes.green,
      predefinedThemes.red,
      predefinedThemes.purple,
    ],
    persist: true,
    persistKey: 'app-theme',
  });
};

// 创建插件管理器
export const createAppPluginManager = (appVersion: string) => {
  return createPluginManager({
    appVersion,
    persist: true,
    persistKey: 'app-plugins',
    autoEnable: true,
  });
};

// 应用上下文
export interface AppContext {
  /**
   * 配置管理器
   */
  config: ConfigManager<AppConfig>;
  /**
   * 主题管理器
   */
  theme: ThemeManager;
  /**
   * 插件管理器
   */
  plugins: PluginManager;
  /**
   * 初始化应用
   */
  initialize: () => Promise<void>;
  /**
   * 销毁应用
   */
  destroy: () => void;
}

// 创建应用上下文
export const createAppContext = (): AppContext => {
  const config = createAppConfigManager();
  const theme = createAppThemeManager();
  const plugins = createAppPluginManager(config.get().appVersion);

  // 主题变更时更新配置
  theme.subscribe((event) => {
    config.set('theme', event.newTheme.name);
    config.set('darkMode', event.newTheme.dark);
  });

  // 配置变更时更新主题
  config.subscribe('theme', (event) => {
    if (event.newValue !== theme.getCurrentTheme().name) {
      theme.setTheme(event.newValue);
    }
  });

  config.subscribe('darkMode', (event) => {
    if (event.newValue !== theme.getCurrentTheme().dark) {
      theme.toggleDarkMode();
    }
  });

  return {
    config,
    theme,
    plugins,
    initialize: async () => {
      // 初始化应用
      console.log('Initializing app...');

      // 这里可以添加其他初始化逻辑
    },
    destroy: () => {
      // 销毁应用
      console.log('Destroying app...');

      // 销毁管理器
      config.destroy();
      theme.destroy();
      plugins.destroy();
    },
  };
};
