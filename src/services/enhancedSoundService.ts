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
 * 增强版音效服务
 * 提供更完善的音效管理功能，包括音效上传、播放、音量控制等
 */
class EnhancedSoundService {
  private sounds: Map<string, CustomSound> = new Map();
  private soundMappings: Record<string, string> = {};
  private volumeSettings: VolumeSettings = {
    master: 80,
    notification: 80,
    ambient: 50,
    fadeInDuration: 0.5,
    fadeOutDuration: 0.5
  };
  private howls: Map<string, Howl> = new Map();
  private initialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * 初始化音效服务
   */
  private async initialize() {
    if (this.initialized) return;

    try {
      // 从本地存储加载音效设置
      this.loadSettingsFromStorage();

      // 加载默认音效
      await this.loadDefaultSounds();

      // 运行音频诊断
      this.runDiagnostics();

      this.initialized = true;
      safeConsole.log('音效服务初始化完成');
    } catch (error) {
      safeConsole.error('音效服务初始化失败:', error);
    }
  }

  /**
   * 从本地存储加载设置
   */
  private loadSettingsFromStorage() {
    try {
      const storedSounds = localStorage.getItem('customSounds');
      if (storedSounds) {
        const soundsArray = JSON.parse(storedSounds);
        soundsArray.forEach((sound: CustomSound) => {
          this.sounds.set(sound.id, sound);
        });
      }

      const storedMappings = localStorage.getItem('soundMappings');
      if (storedMappings) {
        this.soundMappings = JSON.parse(storedMappings);
      }

      const storedVolume = localStorage.getItem('volumeSettings');
      if (storedVolume) {
        this.volumeSettings = { ...this.volumeSettings, ...JSON.parse(storedVolume) };
      }
    } catch (error) {
      safeConsole.error('加载音效设置失败:', error);
    }
  }

  /**
   * 保存设置到本地存储
   */
  private saveSettingsToStorage() {
    try {
      const soundsArray = Array.from(this.sounds.values());
      localStorage.setItem('customSounds', JSON.stringify(soundsArray));
      localStorage.setItem('soundMappings', JSON.stringify(this.soundMappings));
      localStorage.setItem('volumeSettings', JSON.stringify(this.volumeSettings));
    } catch (error) {
      safeConsole.error('保存音效设置失败:', error);
    }
  }

  /**
   * 加载默认音效
   */
  private async loadDefaultSounds() {
    // 默认音效列表
    const defaultSounds = [
      {
        id: 'focus-start',
        name: '专注开始',
        file: '/sounds/focus-start.mp3',
        type: 'default' as const,
        category: 'notification' as const,
        description: '开始专注时播放的提示音'
      },
      {
        id: 'break-start',
        name: '休息开始',
        file: '/sounds/break-start.mp3',
        type: 'default' as const,
        category: 'notification' as const,
        description: '开始休息时播放的提示音'
      },
      {
        id: 'micro-break',
        name: '微休息',
        file: '/sounds/micro-break.mp3',
        type: 'default' as const,
        category: 'notification' as const,
        description: '微休息时播放的提示音'
      },
      {
        id: 'notification',
        name: '通知提示',
        file: '/sounds/notification.mp3',
        type: 'default' as const,
        category: 'notification' as const,
        description: '通用通知提示音'
      },
      {
        id: 'focus-end',
        name: '专注结束',
        file: '/sounds/focus-end.mp3',
        type: 'default' as const,
        category: 'notification' as const,
        description: '专注结束时播放的提示音'
      },
      {
        id: 'break-end',
        name: '休息结束',
        file: '/sounds/break-end.mp3',
        type: 'default' as const,
        category: 'notification' as const,
        description: '休息结束时播放的提示音'
      },
      {
        id: 'achievement',
        name: '成就解锁',
        file: '/sounds/achievement.mp3',
        type: 'default' as const,
        category: 'notification' as const,
        description: '解锁成就时播放的提示音'
      },
      {
        id: 'ambient',
        name: '环境音',
        file: '/sounds/ambient.mp3',
        type: 'default' as const,
        category: 'ambient' as const,
        description: '专注时播放的环境音'
      }
    ];

    // 添加默认音效
    defaultSounds.forEach(sound => {
      this.sounds.set(sound.id, sound);
    });

    // 设置默认音效映射
    if (Object.keys(this.soundMappings).length === 0) {
      this.soundMappings = {
        'focusStart': 'focus-start',
        'breakStart': 'break-start',
        'microBreak': 'micro-break',
        'notification': 'notification',
        'focusEnd': 'focus-end',
        'breakEnd': 'break-end',
        'achievement': 'achievement',
        'ambient': 'ambient'
      };
    }
  }

  /**
   * 运行音频诊断
   */
  private runDiagnostics() {
    try {
      runAudioDiagnostics().then(results => {
        if (!results.success) {
          safeConsole.warn('音频诊断发现问题:', results.issues);
        }
      });
    } catch (error) {
      safeConsole.error('运行音频诊断失败:', error);
    }
  }

  /**
   * 获取所有音效
   */
  getAllSounds(): CustomSound[] {
    return Array.from(this.sounds.values());
  }

  /**
   * 获取音效映射
   */
  getSoundMappings(): Record<string, string> {
    return { ...this.soundMappings };
  }

  /**
   * 获取音量设置
   */
  getVolumeSettings(): VolumeSettings {
    return { ...this.volumeSettings };
  }

  /**
   * 保存音量设置
   */
  saveVolumeSettings(settings: Partial<VolumeSettings>) {
    this.volumeSettings = { ...this.volumeSettings, ...settings };
    this.saveSettingsToStorage();

    // 更新所有正在播放的音效的音量
    this.howls.forEach((howl, soundId) => {
      const sound = this.sounds.get(soundId);
      if (sound) {
        const volume = this.calculateVolume(sound.category);
        howl.volume(volume);
      }
    });
  }

  /**
   * 计算音效音量
   */
  private calculateVolume(category: 'notification' | 'ambient'): number {
    const masterVolume = this.volumeSettings.master / 100;
    const categoryVolume = this.volumeSettings[category] / 100;
    return masterVolume * categoryVolume;
  }

  /**
   * 播放音效
   */
  play(soundId: string, onEnd?: () => void): void {
    const sound = this.sounds.get(soundId);
    if (!sound) {
      safeConsole.error(`音效不存在: ${soundId}`);
      return;
    }

    // 如果音效正在播放，先停止
    if (this.howls.has(soundId)) {
      this.howls.get(soundId)?.stop();
    }

    // 计算音量
    const volume = this.calculateVolume(sound.category);

    // 创建Howl实例
    const howl = new Howl({
      src: typeof sound.file === 'string' ? [sound.file] : [URL.createObjectURL(sound.file)],
      volume: volume,
      onend: () => {
        if (onEnd) onEnd();
        // 如果是环境音，不清理Howl实例，以便可以循环播放
        if (sound.category !== 'ambient') {
          this.howls.delete(soundId);
        }
      },
      onplayerror: () => {
        safeConsole.error(`播放音效失败: ${soundId}`);
        this.howls.delete(soundId);
      }
    });

    // 保存Howl实例
    this.howls.set(soundId, howl);

    // 播放音效
    howl.play();
  }

  /**
   * 停止播放音效
   */
  stop(soundId: string): void {
    const howl = this.howls.get(soundId);
    if (howl) {
      howl.stop();
      this.howls.delete(soundId);
    }
  }

  /**
   * 停止所有音效
   */
  stopAll(): void {
    this.howls.forEach((howl, soundId) => {
      howl.stop();
    });
    this.howls.clear();
  }

  /**
   * 上传音效
   */
  async uploadSound(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // 验证文件类型
        if (!file.type.startsWith('audio/')) {
          reject(new Error('请上传音频文件'));
          return;
        }

        // 验证文件大小（限制为10MB）
        if (file.size > 10 * 1024 * 1024) {
          reject(new Error('文件大小不能超过10MB'));
          return;
        }

        // 生成唯一ID
        const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // 获取音频时长
        const audio = new Audio();
        audio.src = URL.createObjectURL(file);

        audio.onloadedmetadata = () => {
          // 创建音效对象
          const sound: CustomSound = {
            id,
            name: file.name.replace(/\.[^/.]+$/, ''), // 移除文件扩展名
            file,
            type: 'custom',
            category: 'notification',
            duration: audio.duration,
            size: file.size,
            uploadDate: new Date().toISOString(),
            description: ''
          };

          // 保存音效
          this.sounds.set(id, sound);
          this.saveSettingsToStorage();

          resolve(id);
        };

        audio.onerror = () => {
          reject(new Error('无法读取音频文件'));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 删除音效
   */
  deleteSound(soundId: string): void {
    // 停止播放
    this.stop(soundId);

    // 从映射中移除
    Object.keys(this.soundMappings).forEach(event => {
      if (this.soundMappings[event] === soundId) {
        // 找到同类型的默认音效
        const sound = this.sounds.get(soundId);
        if (sound) {
          const defaultSound = Array.from(this.sounds.values()).find(
            s => s.type === 'default' && s.category === sound.category
          );
          if (defaultSound) {
            this.soundMappings[event] = defaultSound.id;
          }
        }
      }
    });

    // 删除音效
    this.sounds.delete(soundId);
    this.saveSettingsToStorage();
  }

  /**
   * 更新音效
   */
  updateSound(soundId: string, updates: Partial<CustomSound>): void {
    const sound = this.sounds.get(soundId);
    if (sound) {
      this.sounds.set(soundId, { ...sound, ...updates });
      this.saveSettingsToStorage();
    }
  }

  /**
   * 更新音效映射
   */
  updateSoundMapping(eventType: string, soundId: string): void {
    this.soundMappings[eventType] = soundId;
    this.saveSettingsToStorage();
  }

  /**
   * 下载音效
   */
  downloadSound(soundId: string): void {
    const sound = this.sounds.get(soundId);
    if (sound && typeof sound.file === 'object') {
      const url = URL.createObjectURL(sound.file);
      const a = document.createElement('a');
      a.href = url;
      a.download = sound.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  /**
   * 获取存储信息
   */
  getStorageInfo() {
    const sounds = this.getAllSounds();
    const customSounds = sounds.filter(s => s.type === 'custom');
    const totalSize = customSounds.reduce((sum, sound) => sum + (sound.size || 0), 0);

    return {
      usedSpace: this.formatFileSize(totalSize),
      freeSpace: this.formatFileSize(10 * 1024 * 1024 - totalSize), // 假设总限制为10MB
      maxFileSize: this.formatFileSize(10 * 1024 * 1024),
      soundCount: customSounds.length
    };
  }

  /**
   * 格式化文件大小
   */
  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  /**
   * 重置为默认设置
   */
  resetToDefaults(): void {
    // 停止所有音效
    this.stopAll();

    // 清空自定义音效
    const defaultSounds = Array.from(this.sounds.values()).filter(s => s.type === 'default');
    this.sounds.clear();
    defaultSounds.forEach(sound => {
      this.sounds.set(sound.id, sound);
    });

    // 重置音效映射
    this.soundMappings = {
      'focusStart': 'focus-start',
      'breakStart': 'break-start',
      'microBreak': 'micro-break',
      'notification': 'notification',
      'focusEnd': 'focus-end',
      'breakEnd': 'break-end',
      'achievement': 'achievement',
      'ambient': 'ambient'
    };

    // 重置音量设置
    this.volumeSettings = {
      master: 80,
      notification: 80,
      ambient: 50,
      fadeInDuration: 0.5,
      fadeOutDuration: 0.5
    };

    // 保存设置
    this.saveSettingsToStorage();
  }

  /**
   * 播放事件音效
   */
  playEventSound(eventType: string, onEnd?: () => void): void {
    const soundId = this.soundMappings[eventType];
    if (soundId) {
      this.play(soundId, onEnd);
    }
  }

  /**
   * 播放专注开始音效
   */
  playFocusStartSound(onEnd?: () => void): void {
    this.playEventSound('focusStart', onEnd);
  }

  /**
   * 播放休息开始音效
   */
  playBreakStartSound(onEnd?: () => void): void {
    this.playEventSound('breakStart', onEnd);
  }

  /**
   * 播放微休息音效
   */
  playMicroBreakSound(onEnd?: () => void): void {
    this.playEventSound('microBreak', onEnd);
  }

  /**
   * 播放通知音效
   */
  playNotificationSound(onEnd?: () => void): void {
    this.playEventSound('notification', onEnd);
  }

  /**
   * 播放专注结束音效
   */
  playFocusEndSound(onEnd?: () => void): void {
    this.playEventSound('focusEnd', onEnd);
  }

  /**
   * 播放休息结束音效
   */
  playBreakEndSound(onEnd?: () => void): void {
    this.playEventSound('breakEnd', onEnd);
  }

  /**
   * 播放成就解锁音效
   */
  playAchievementSound(onEnd?: () => void): void {
    this.playEventSound('achievement', onEnd);
  }

  /**
   * 播放环境音
   */
  playAmbientSound(loop = true): void {
    const soundId = this.soundMappings['ambient'];
    if (soundId) {
      const sound = this.sounds.get(soundId);
      if (sound) {
        // 如果音效正在播放，先停止
        if (this.howls.has(soundId)) {
          this.howls.get(soundId)?.stop();
        }

        // 计算音量
        const volume = this.calculateVolume(sound.category);

        // 创建Howl实例
        const howl = new Howl({
          src: typeof sound.file === 'string' ? [sound.file] : [URL.createObjectURL(sound.file)],
          volume: volume,
          loop: loop,
          onend: () => {
            // 环境音通常需要循环播放，所以不清理Howl实例
          },
          onplayerror: () => {
            safeConsole.error(`播放环境音失败: ${soundId}`);
            this.howls.delete(soundId);
          }
        });

        // 保存Howl实例
        this.howls.set(soundId, howl);

        // 播放音效
        howl.play();
      }
    }
  }

  /**
   * 停止环境音
   */
  stopAmbientSound(): void {
    const soundId = this.soundMappings['ambient'];
    if (soundId) {
      this.stop(soundId);
    }
  }
}

// 创建单例实例
export const enhancedSoundService = new EnhancedSoundService();

// 导出类型和默认实例
export { EnhancedSoundService as default, EnhancedSoundService };
