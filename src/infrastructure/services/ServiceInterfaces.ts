/**
 * 基础设施层服务接口
 * 定义核心服务的接口，便于实现依赖注入和模拟测试
 */

// 声音服务接口
export interface ISoundService {
  initialize(): Promise<void>;
  play(soundName: string): Promise<void>;
  playMapped(soundKey: string): Promise<void>;
  stop(): Promise<void>;
  setVolume(volume: number): Promise<void>;
  getVolume(): number;
  preloadSounds(soundNames: string[]): Promise<void>;
}

// 数据库服务接口
export interface IDatabaseService {
  initialize(): Promise<void>;
  saveSession(session: any): Promise<number>;
  loadSessions(days?: number): Promise<any[]>;
  updateSessionEfficiency(sessionId: number, efficiency: number): Promise<void>;
  getStats(): Promise<any>;
  clearAllData(): Promise<void>;
  exportData(): Promise<string>;
  importData(data: string): Promise<void>;
}

// 通知服务接口
export interface INotificationService {
  initialize(): Promise<void>;
  sendNotification(title: string, body: string): Promise<void>;
  requestPermission(): Promise<boolean>;
  hasPermission(): boolean;
  scheduleNotification(title: string, body: string, delayMs: number): Promise<void>;
  cancelAllNotifications(): Promise<void>;
}

// 存储服务接口
export interface IStorageService {
  initialize(): Promise<void>;
  setItem(key: string, value: any): Promise<void>;
  getItem<T>(key: string): Promise<T | null>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  getAllKeys(): Promise<string[]>;
}

// 主题服务接口
export interface IThemeService {
  initialize(): Promise<void>;
  setTheme(theme: string): Promise<void>;
  getTheme(): string;
  getAvailableThemes(): string[];
  setCustomTheme(theme: any): Promise<void>;
  exportTheme(): Promise<string>;
  importTheme(themeData: string): Promise<void>;
}

// 数据安全服务接口
export interface IDataSecurityService {
  initialize(): Promise<void>;
  encrypt(data: string): Promise<string>;
  decrypt(encryptedData: string): Promise<string>;
  hash(data: string): Promise<string>;
  generateSecureToken(): Promise<string>;
  validateSecureToken(token: string): Promise<boolean>;
}
