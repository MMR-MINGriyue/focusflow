import { Howl } from 'howler';
import { safeConsole } from '../utils/environment';
import { runAudioDiagnostics } from '../utils/audioTest';

export interface CustomSound {
  id: string;
  name: string;
  file: File | string;
  type: 'default' | 'custom';
  category: 'notification' | 'ambient';
  duration?: number; // 音频时长（秒）
  size?: number; // 文件大小（字节）
  uploadDate?: string; // 上传日期
  description?: string; // 音效描述
}

export interface VolumeSettings {
  master: number;
  notification: number;
  ambient: number;
  fadeInDuration: number;
  fadeOutDuration: number;
}

/**
 * 优化版音效服务
 * 实现音效资源的懒加载机制，提高应用启动性能
 */
class SoundServiceOptimized {
  private sounds: {
    [key: string]: Howl | null; // 允许为null，表示音效尚未加载
  } = {};

  private customSounds: CustomSound[] = [];
  private soundMappings: {
    [key: string]: string; // 事件类型 -> 音效ID的映射
  } = {};
  private volumeSettings: VolumeSettings = {
    master: 0.7,
    notification: 0.5,
    ambient: 0.3,
    fadeInDuration: 500,
    fadeOutDuration: 500
  };
  private isMuted: boolean = false;

  // 音效加载状态跟踪
  private loadingPromises: {
    [key: string]: Promise<Howl> | null;
  } = {};

  // 预加载队列
  private preloadQueue: string[] = [];
  private isPreloading: boolean = false;

  constructor() {
    // 延迟初始化，不在构造函数中立即加载音效
    this.initializeSoundMappings();
    this.loadVolumeSettings();

    // 在开发环境中运行音频诊断
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        runAudioDiagnostics().catch(error => {
          safeConsole.warn('Audio diagnostics failed:', error);
        });
      }, 2000); // 延迟2秒运行，确保页面完全加载
    }

    // 启动预加载队列处理
    this.startPreloadQueue();
  }

  /**
   * 启动预加载队列处理
   */
  private startPreloadQueue(): void {
    // 使用requestIdleCallback在浏览器空闲时预加载音效
    const processQueue = () => {
      if (this.isPreloading || this.preloadQueue.length === 0) {
        requestIdleCallback(processQueue, { timeout: 1000 });
        return;
      }

      this.isPreloading = true;
      const soundId = this.preloadQueue.shift()!;

      this.loadSound(soundId)
        .catch(error => {
          safeConsole.warn(`Failed to preload sound ${soundId}:`, error);
        })
        .finally(() => {
          this.isPreloading = false;
          requestIdleCallback(processQueue, { timeout: 1000 });
        });
    };

    requestIdleCallback(processQueue, { timeout: 1000 });
  }

  /**
   * 初始化音效（懒加载）
   */
  private initializeSounds(): void {
    safeConsole.log('🔊 Initializing audio system with lazy loading...');

    // 初始化音效对象，但不立即加载
    this.sounds = {
      notification: null,
      microBreak: null,
      focusStart: null,
      breakStart: null,
      whiteNoise: null
    };

    // 添加常用音效到预加载队列
    this.preloadQueue.push('notification', 'focusStart');

    safeConsole.log('✅ Audio system initialized with lazy loading');
  }

  /**
   * 加载单个音效
   */
  private loadSound(soundName: string): Promise<Howl> {
    // 如果音效已经加载，直接返回
    if (this.sounds[soundName]) {
      return Promise.resolve(this.sounds[soundName]!);
    }

    // 如果音效正在加载，返回现有的Promise
    if (this.loadingPromises[soundName]) {
      return this.loadingPromises[soundName]!;
    }

    // 创建新的加载Promise
    const loadPromise = new Promise<Howl>((resolve, reject) => {
      // 在开发环境中使用静默音效
      if (process.env.NODE_ENV === 'development') {
        const silentHowl = new Howl({
          src: ['data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'],
          volume: 0.1,
          onload: () => {
            safeConsole.debug(`Silent audio loaded for ${soundName}`);
            this.sounds[soundName] = silentHowl;
            resolve(silentHowl);
          },
          onloaderror: () => {
            safeConsole.debug(`Silent audio fallback for ${soundName}`);
            this.sounds[soundName] = silentHowl;
            resolve(silentHowl);
          }
        });
        return;
      }

      // 生产环境加载实际音效
      const soundSrc = this.getSoundSource(soundName);
      const howl = new Howl({
        src: [soundSrc],
        volume: 0.5,
        onload: () => {
          safeConsole.debug(`Sound loaded: ${soundName}`);
          this.sounds[soundName] = howl;
          resolve(howl);
        },
        onloaderror: (_, error) => {
          safeConsole.warn(`Failed to load sound ${soundName}:`, error);
          // 创建静默回退
          const fallbackHowl = new Howl({
            src: ['data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'],
            volume: 0.1
          });
          this.sounds[soundName] = fallbackHowl;
          resolve(fallbackHowl);
        }
      });
    });

    this.loadingPromises[soundName] = loadPromise;

    // 加载完成后清除Promise
    loadPromise.finally(() => {
      this.loadingPromises[soundName] = null;
    });

    return loadPromise;
  }

  /**
   * 获取音效源文件路径
   */
  private getSoundSource(soundName: string): string {
    const soundSources: Record<string, string> = {
      notification: '/sounds/notification.mp3',
      microBreak: '/sounds/micro-break.mp3',
      focusStart: '/sounds/focus-start.mp3',
      breakStart: '/sounds/break-start.mp3',
      whiteNoise: '/sounds/white-noise.mp3'
    };

    return soundSources[soundName] || soundSources.notification;
  }

  /**
   * 播放音效（带懒加载）
   */
  async play(soundName: keyof typeof this.sounds) {
    if (this.isMuted) return;

    try {
      // 确保音效已加载
      const sound = await this.loadSound(soundName);
      if (sound) {
        const effectiveVolume = this.getEffectiveVolume(soundName);
        sound.volume(effectiveVolume);
        sound.play();
      }
    } catch (error) {
      safeConsole.error(`Failed to play sound ${soundName}:`, error);
    }
  }

  /**
   * 预加载音效
   */
  async preloadSound(soundName: keyof typeof this.sounds): Promise<void> {
    if (!this.preloadQueue.includes(soundName)) {
      this.preloadQueue.push(soundName);
    }
  }

  /**
   * 预加载多个音效
   */
  async preloadSounds(soundNames: (keyof typeof this.sounds)[]): Promise<void> {
    soundNames.forEach(soundName => {
      if (!this.preloadQueue.includes(soundName)) {
        this.preloadQueue.push(soundName);
      }
    });
  }

  /**
   * 播放白噪音并淡入（专为专注模式设计）
   */
  async playWhiteNoiseWithFadeIn(duration: number = 500): Promise<void> {
    if (this.isMuted) return;

    try {
      const whiteNoise = await this.loadSound('whiteNoise');
      if (whiteNoise) {
        // 停止当前播放的白噪音
        whiteNoise.stop();

        // 设置初始音量为0
        whiteNoise.volume(0);

        // 开始播放
        whiteNoise.play();

        // 淡入到目标音量
        const targetVolume = this.getEffectiveVolume('whiteNoise');
        whiteNoise.fade(0, targetVolume, duration);
      }
    } catch (error) {
      safeConsole.error('Failed to play white noise:', error);
    }
  }

  /**
   * 停止白噪音并淡出
   */
  async stopWhiteNoiseWithFadeOut(duration: number = 500): Promise<void> {
    try {
      const whiteNoise = this.sounds.whiteNoise;
      if (whiteNoise) {
        const currentVolume = whiteNoise.volume();
        if (currentVolume > 0) {
          whiteNoise.fade(currentVolume, 0, duration);
          setTimeout(() => {
            whiteNoise.stop();
          }, duration);
        } else {
          whiteNoise.stop();
        }
      }
    } catch (error) {
      safeConsole.error('Failed to stop white noise:', error);
    }
  }

  stop(soundName: keyof typeof this.sounds) {
    const sound = this.sounds[soundName];
    if (sound) {
      sound.stop();
    }
  }

  setVolume(soundName: keyof typeof this.sounds, volume: number) {
    const sound = this.sounds[soundName];
    if (sound) {
      sound.volume(Math.max(0, Math.min(1, volume)));
    }
  }

  /**
   * 获取有效音量（考虑主音量和分类音量）
   */
  private getEffectiveVolume(soundName: keyof typeof this.sounds): number {
    if (this.isMuted) return 0;

    const sound = this.sounds[soundName];
    const baseVolume = sound?.volume() || 0.5;
    const masterVolume = this.volumeSettings.master;

    // 根据音效类型应用分类音量
    let categoryVolume = 1.0;
    if (soundName === 'whiteNoise') {
      categoryVolume = this.volumeSettings.ambient;
    } else {
      categoryVolume = this.volumeSettings.notification;
    }

    return baseVolume * masterVolume * categoryVolume;
  }

  fadeIn(soundName: keyof typeof this.sounds, duration: number = 500) {
    this.loadSound(soundName).then(sound => {
      if (sound && !this.isMuted) {
        const targetVolume = this.getEffectiveVolume(soundName);
        sound.volume(0);
        sound.play();
        sound.fade(0, targetVolume, duration);
      }
    }).catch(error => {
      safeConsole.error(`Failed to fade in sound ${soundName}:`, error);
    });
  }

  fadeOut(soundName: keyof typeof this.sounds, duration: number = 500) {
    const sound = this.sounds[soundName];
    if (sound) {
      const currentVolume = sound.volume();
      sound.fade(currentVolume, 0, duration);
      setTimeout(() => sound.stop(), duration);
    }
  }

  // 以下方法保持不变，与原服务相同...

  /**
   * 初始化音效映射
   */
  private initializeSoundMappings() {
    // 默认映射
    const defaultMappings = {
      focusStart: 'focusStart',
      breakStart: 'breakStart',
      microBreak: 'microBreak',
      notification: 'notification',
      whiteNoise: 'whiteNoise',
    };

    this.soundMappings = { ...defaultMappings };

    // 从本地存储加载自定义映射
    try {
      let mappingsData = localStorage.getItem('focusflow-sound-mappings');
      let parsedMappings = null;

      if (mappingsData) {
        try {
          parsedMappings = JSON.parse(mappingsData);
          if (!this.validateData(parsedMappings, 'mappings')) {
            throw new Error('Invalid mappings data structure');
          }
        } catch (parseError) {
          console.warn('Main mappings data corrupted, trying backup:', parseError);
          parsedMappings = this.restoreFromBackup('focusflow-sound-mappings');
        }
      }

      if (parsedMappings) {
        // 只保留有效的映射，无效的使用默认值
        Object.keys(defaultMappings).forEach(key => {
          if (parsedMappings[key]) {
            this.soundMappings[key] = parsedMappings[key];
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load sound mappings:', error);
      // 保持默认映射
    }
  }

  /**
   * 加载自定义音效
   */
  private async loadCustomSounds() {
    try {
      let soundsData = localStorage.getItem('focusflow-custom-sounds');
      let parsedSounds = null;

      // 尝试解析主数据
      if (soundsData) {
        try {
          parsedSounds = JSON.parse(soundsData);
          if (!this.validateData(parsedSounds, 'sounds')) {
            throw new Error('Invalid sounds data structure');
          }
        } catch (parseError) {
          console.warn('Main sounds data corrupted, trying backup:', parseError);
          parsedSounds = this.restoreFromBackup('focusflow-custom-sounds');
        }
      }

      if (parsedSounds) {
        this.customSounds = parsedSounds;

        // 重新创建 Howl 实例
        for (const customSound of this.customSounds) {
          if (customSound.type === 'custom' && typeof customSound.file === 'string') {
            try {
              this.sounds[customSound.id] = new Howl({
                src: [customSound.file],
                volume: 0.5,
                onloaderror: () => console.warn(`Failed to load custom sound: ${customSound.name}`),
                onplayerror: () => console.warn(`Failed to play custom sound: ${customSound.name}`)
              });
            } catch (howlError) {
              console.warn(`Failed to create Howl instance for ${customSound.name}:`, howlError);
              // 移除损坏的音效
              this.customSounds = this.customSounds.filter(s => s.id !== customSound.id);
            }
          }
        }

        // 如果有音效被移除，保存清理后的数据
        if (this.customSounds.length !== parsedSounds.length) {
          this.saveCustomSounds();
        }
      }
    } catch (error) {
      console.warn('Failed to load custom sounds:', error);
      // 重置为空数组以防止进一步错误
      this.customSounds = [];
    }
  }

  /**
   * 加载音量设置
   */
  private loadVolumeSettings() {
    try {
      let volumeData = localStorage.getItem('focusflow-volume-settings');
      let parsedVolume = null;

      if (volumeData) {
        try {
          parsedVolume = JSON.parse(volumeData);
          if (!this.validateData(parsedVolume, 'volume')) {
            throw new Error('Invalid volume data structure');
          }
        } catch (parseError) {
          console.warn('Main volume data corrupted, trying backup:', parseError);
          parsedVolume = this.restoreFromBackup('focusflow-volume-settings');
        }
      }

      if (parsedVolume) {
        // 验证数值范围
        const validatedSettings = {
          master: Math.max(0, Math.min(1, parsedVolume.master || 0.7)),
          notification: Math.max(0, Math.min(1, parsedVolume.notification || 0.5)),
          ambient: Math.max(0, Math.min(1, parsedVolume.ambient || 0.3)),
          fadeInDuration: Math.max(0, Math.min(5000, parsedVolume.fadeInDuration || 500)),
          fadeOutDuration: Math.max(0, Math.min(5000, parsedVolume.fadeOutDuration || 500))
        };

        this.volumeSettings = { ...this.volumeSettings, ...validatedSettings };
      }
    } catch (error) {
      console.warn('Failed to load volume settings:', error);
      // 保持默认设置
    }
  }

  /**
   * 验证数据完整性
   */
  private validateData(data: any, type: 'sounds' | 'mappings' | 'volume'): boolean {
    try {
      switch (type) {
        case 'sounds':
          return Array.isArray(data) && data.every(sound =>
            sound.id && sound.name && sound.type && sound.category
          );
        case 'mappings':
          return typeof data === 'object' && data !== null;
        case 'volume':
          return typeof data === 'object' && data !== null &&
                 typeof data.master === 'number' &&
                 typeof data.notification === 'number' &&
                 typeof data.ambient === 'number';
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * 恢复数据从备份
   */
  private restoreFromBackup(key: string): any {
    try {
      const backupKey = `${key}-backup`;
      const backupData = localStorage.getItem(backupKey);
      if (backupData) {
        const data = JSON.parse(backupData);
        localStorage.setItem(key, backupData);
        console.log(`Restored data from backup for ${key}`);
        return data;
      }
    } catch (error) {
      console.warn(`Failed to restore from backup for ${key}:`, error);
    }
    return null;
  }

  /**
   * 保存自定义音效到本地存储
   */
  private saveCustomSounds() {
    try {
      const data = JSON.stringify(this.customSounds);
      localStorage.setItem('focusflow-custom-sounds', data);

      // 创建备份
      localStorage.setItem('focusflow-custom-sounds-backup', data);
    } catch (error) {
      console.warn('Failed to save custom sounds:', error);

      // 尝试清理存储空间后重试
      this.cleanupStorage();
      try {
        localStorage.setItem('focusflow-custom-sounds', JSON.stringify(this.customSounds));
      } catch (retryError) {
        console.error('Failed to save custom sounds after cleanup:', retryError);
      }
    }
  }

  /**
   * 清理存储空间
   */
  private cleanupStorage() {
    try {
      // 删除旧的备份文件
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('focusflow-') && key.includes('-backup-')) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));

      console.log(`Cleaned up ${keysToRemove.length} old backup files`);
    } catch (error) {
      console.warn('Failed to cleanup storage:', error);
    }
  }

  // 其他方法保持与原服务相同...
}

let soundServiceOptimizedInstance: SoundServiceOptimized | null = null;

export const getSoundServiceOptimized = (): SoundServiceOptimized => {
  if (!soundServiceOptimizedInstance) {
    soundServiceOptimizedInstance = new SoundServiceOptimized();
  }
  return soundServiceOptimizedInstance;
};

// 向后兼容
export const soundServiceOptimized = getSoundServiceOptimized();
