/**
 * 环境特定配置
 * 定义不同环境（开发、生产等）的配置
 */

interface EnvironmentConfig {
  apiBaseUrl: string;
  enableDebugTools: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableAnalytics: boolean;
  enableErrorReporting: boolean;
  enableFeatureFlags: boolean;
  updateCheckInterval: number; // 更新检查间隔（毫秒）
}

// 开发环境配置
const developmentConfig: EnvironmentConfig = {
  apiBaseUrl: 'http://localhost:3000',
  enableDebugTools: true,
  logLevel: 'debug',
  enableAnalytics: false,
  enableErrorReporting: false,
  enableFeatureFlags: true,
  updateCheckInterval: 0, // 开发环境不检查更新
};

// 生产环境配置
const productionConfig: EnvironmentConfig = {
  apiBaseUrl: 'https://api.focusflow.app',
  enableDebugTools: false,
  logLevel: 'warn',
  enableAnalytics: true,
  enableErrorReporting: true,
  enableFeatureFlags: false,
  updateCheckInterval: 86400000, // 24小时检查一次更新
};

// 测试环境配置
const testConfig: EnvironmentConfig = {
  apiBaseUrl: 'http://test-api.focusflow.app',
  enableDebugTools: true,
  logLevel: 'debug',
  enableAnalytics: false,
  enableErrorReporting: false,
  enableFeatureFlags: true,
  updateCheckInterval: 0,
};

// 根据构建环境变量选择适当的配置
const getEnvironmentConfig = (): EnvironmentConfig => {
  // 优先使用环境变量
  if (process.env.NODE_ENV === 'production') {
    return productionConfig;
  } else if (process.env.NODE_ENV === 'test') {
    return testConfig;
  }

  // 默认返回开发环境配置
  return developmentConfig;
};

// 导出当前环境的配置
export const environmentConfig = getEnvironmentConfig();

// 导出所有环境配置（用于测试或特殊场景）
export const environments = {
  development: developmentConfig,
  production: productionConfig,
  test: testConfig,
};
