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
class SoundService {
  private sounds: {
    [key: string]: Howl;
  } = {};

  private loadedSounds: Set<string> = new Set();
  private preloadedSounds: Set<string> = new Set();
  private soundCache: Map<string, Promise<Howl>> = new Map();

  private defaultVolumeSettings: VolumeSettings = {
    master: 0.8,
    notification: 0.8,
    ambient: 0.5,
    fadeInDuration: 500,
    fadeOutDuration: 300,
  };

  private volumeSettings: VolumeSettings = { ...this.defaultVolumeSettings };

  private defaultSounds = {
    'focus-start': '/sounds/focus-start.mp3',
    'break-start': '/sounds/break-start.mp3',
    'micro-break': '/sounds/micro-break.mp3',
    'notification': '/sounds/notification.mp3',
    'white-noise': '/sounds/white-noise.mp3',
  };

  private audioContext: AudioContext | null = null;
  private isAudioContextInitialized = false;

  /**
   * 初始化音频上下文
   */
  private initAudioContext(): void {
    if (!this.isAudioContextInitialized) {
      try {
        // 创建音频上下文
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.isAudioContextInitialized = true;

        // 恢复音频上下文（某些浏览器需要用户交互后才能恢复）
        document.addEventListener('click', () => {
          if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
          }
        }, { once: true });
      } catch (error) {
        safeConsole.error('Failed to initialize AudioContext:', error);
      }
    }
  }

  /**
   * 懒加载音效
   * @param soundId 音效ID
   * @returns Promise<Howl> Howl对象
   */
  private lazyLoadSound(soundId: string): Promise<Howl> {
    // 如果已经缓存了加载中的Promise，直接返回
    if (this.soundCache.has(soundId)) {
      return this.soundCache.get(soundId)!;
    }

    // 创建新的加载Promise
    const loadPromise = new Promise<Howl>((resolve, reject) => {
      const soundSrc = this.defaultSounds[soundId as keyof typeof this.defaultSounds];

      if (!soundSrc) {
        reject(new Error(`Sound with ID "${soundId}" not found`));
        return;
      }

      const sound = new Howl({
        src: [soundSrc],
        preload: false,
        html5: true, // 使用HTML5 Audio以支持流式播放
      });

      sound.once('load', () => {
        this.loadedSounds.add(soundId);
        resolve(sound);
      });

      sound.once('loaderror', (_, error) => {
        reject(new Error(`Failed to load sound "${soundId}": ${error}`));
      });

      // 开始加载
      sound.load();
    });

    // 缓存Promise
    this.soundCache.set(soundId, loadPromise);

    return loadPromise;
  }

  /**
   * 预加载音效
   * @param soundIds 要预加载的音效ID数组
   */
  async preloadSounds(soundIds: string[]): Promise<void> {
    this.initAudioContext();

    const loadPromises = soundIds.map(async (soundId) => {
      if (!this.preloadedSounds.has(soundId)) {
        try {
          await this.lazyLoadSound(soundId);
          this.preloadedSounds.add(soundId);
        } catch (error) {
          safeConsole.warn(`Failed to preload sound "${soundId}":`, error);
        }
      }
    });

    await Promise.all(loadPromises);
  }

  /**
   * 播放音效
   * @param soundId 音效ID
   * @param options 播放选项
   * @returns Promise<number> 音效ID
   */
  async playSound(
    soundId: string,
    options: {
      volume?: number;
      loop?: boolean;
      fadeIn?: boolean;
      fadeDuration?: number;
    } = {}
  ): Promise<number> {
    this.initAudioContext();

    try {
      // 获取或加载音效
      let sound: Howl;

      if (this.sounds[soundId]) {
        sound = this.sounds[soundId];
      } else {
        sound = await this.lazyLoadSound(soundId);
        this.sounds[soundId] = sound;
      }

      // 计算音量
      const volume = options.volume !== undefined 
        ? options.volume 
        : this.volumeSettings.master * (
            soundId.includes('notification') || soundId === 'micro-break'
              ? this.volumeSettings.notification
              : this.volumeSettings.ambient
          );

      // 设置音效选项
      sound.volume(0); // 初始音量为0，用于淡入
      sound.loop(options.loop || false);

      // 播放音效
      const id = sound.play();

      // 淡入效果
      if (options.fadeIn) {
        const fadeDuration = options.fadeDuration || this.volumeSettings.fadeInDuration;
        sound.fade(0, volume, fadeDuration, id);
      } else {
        sound.volume(volume, id);
      }

      return id;
    } catch (error) {
      safeConsole.error(`Failed to play sound "${soundId}":`, error);
      throw error;
    }
  }

  /**
   * 停止音效
   * @param soundId 音效ID
   * @param id Howl播放ID（可选）
   * @param options 停止选项
   */
  stopSound(
    soundId: string,
    id?: number,
    options: {
      fadeOut?: boolean;
      fadeDuration?: number;
    } = {}
  ): void {
    const sound = this.sounds[soundId];
    if (!sound) return;

    if (options.fadeOut) {
      const fadeDuration = options.fadeDuration || this.volumeSettings.fadeOutDuration;
      sound.fade(sound.volume(), 0, fadeDuration, id);

      // 淡出完成后停止
      setTimeout(() => {
        sound.stop(id);
      }, fadeDuration);
    } else {
      sound.stop(id);
    }
  }

  /**
   * 设置音量
   * @param settings 音量设置
   */
  setVolumeSettings(settings: Partial<VolumeSettings>): void {
    this.volumeSettings = {
      ...this.volumeSettings,
      ...settings,
    };

    // 更新所有正在播放的音效的音量
    Object.keys(this.sounds).forEach(soundId => {
      const sound = this.sounds[soundId];
      const isNotification = soundId.includes('notification') || soundId === 'micro-break';
      const volume = this.volumeSettings.master * (
        isNotification
          ? this.volumeSettings.notification
          : this.volumeSettings.ambient
      );

      sound.volume(volume);
    });
  }

  /**
   * 获取音量设置
   * @returns 当前音量设置
   */
  getVolumeSettings(): VolumeSettings {
    return { ...this.volumeSettings };
  }

  /**
   * 重置音量设置为默认值
   */
  resetVolumeSettings(): void {
    this.volumeSettings = { ...this.defaultVolumeSettings };
    this.setVolumeSettings({});
  }

  /**
   * 添加自定义音效
   * @param sound 自定义音效对象
   * @returns Promise<string> 音效ID
   */
  async addCustomSound(sound: CustomSound): Promise<string> {
    const soundId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      let src: string;

      if (typeof sound.file === 'string') {
        src = sound.file;
      } else {
        // 如果是File对象，创建URL
        src = URL.createObjectURL(sound.file);
      }

      const howl = new Howl({
        src: [src],
        preload: true,
      });

      // 等待加载完成
      await new Promise<void>((resolve, reject) => {
        howl.once('load', () => resolve());
        howl.once('loaderror', (_, error) => {
          reject(new Error(`Failed to load custom sound: ${error}`));
        });
      });

      this.sounds[soundId] = howl;
      this.loadedSounds.add(soundId);

      return soundId;
    } catch (error) {
      safeConsole.error('Failed to add custom sound:', error);
      throw error;
    }
  }

  /**
   * 移除音效
   * @param soundId 音效ID
   */
  removeSound(soundId: string): void {
    const sound = this.sounds[soundId];
    if (sound) {
      sound.unload();
      delete this.sounds[soundId];
      this.loadedSounds.delete(soundId);
      this.preloadedSounds.delete(soundId);
      this.soundCache.delete(soundId);
    }
  }

  /**
   * 卸载所有音效，释放内存
   */
  unloadAllSounds(): void {
    Object.keys(this.sounds).forEach(soundId => {
      this.sounds[soundId].unload();
    });

    this.sounds = {};
    this.loadedSounds.clear();
    this.preloadedSounds.clear();
    this.soundCache.clear();
  }

  /**
   * 运行音频诊断
   * @returns 诊断结果
   */
  async runDiagnostics(): Promise<{
    audioContextSupported: boolean;
    howlerSupported: boolean;
    canPlayAudio: boolean;
    soundsLoaded: string[];
    errors: string[];
  }> {
    return runAudioDiagnostics(this.loadedSounds);
  }

  /**
   * 获取已加载的音效列表
   * @returns 已加载的音效ID数组
   */
  getLoadedSounds(): string[] {
    return Array.from(this.loadedSounds);
  }

  /**
   * 检查音效是否已加载
   * @param soundId 音效ID
   * @returns 是否已加载
   */
  isSoundLoaded(soundId: string): boolean {
    return this.loadedSounds.has(soundId);
  }
}

// 创建单例实例
export const soundService = new SoundService();

// 导出服务类（用于测试）
export { SoundService };
