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

class SoundService {
  private sounds: {
    [key: string]: Howl;
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

  constructor() {
    this.initializeSounds();
    this.loadCustomSounds();
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
  }

  private initializeSounds() {
    safeConsole.log('🔊 Initializing audio system (development mode - audio disabled)...');

    // 在开发环境中暂时禁用音频，避免加载损坏的文件
    // 创建静默的Howl实例作为占位符

    // 创建静默的音频实例，避免错误
    const createSilentHowl = (volume: number = 0.1) => new Howl({
      src: ['data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'],
        volume: volume,
      onload: () => safeConsole.debug('Silent audio loaded'),
      onloaderror: () => safeConsole.debug('Silent audio fallback'),
      onplayerror: () => safeConsole.debug('Silent audio play (no-op)')
    });

    this.sounds = {
      notification: createSilentHowl(0.5),
      microBreak: createSilentHowl(0.3),
      focusStart: createSilentHowl(0.4),
      breakStart: createSilentHowl(0.4),
      whiteNoise: createSilentHowl(0.0) // 完全静音的白噪音
    };

    safeConsole.log('✅ Audio system initialized with silent fallbacks');
  }

  play(soundName: keyof typeof this.sounds) {
    const sound = this.sounds[soundName];
    if (sound && !this.isMuted) {
      const effectiveVolume = this.getEffectiveVolume(soundName);
      sound.volume(effectiveVolume);
      sound.play();
    }
  }

  /**
   * 播放白噪音并淡入（专为专注模式设计）
   */
  playWhiteNoiseWithFadeIn(duration: number = 500): void {
    const whiteNoise = this.sounds.whiteNoise;
    if (whiteNoise && !this.isMuted) {
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
  }

  /**
   * 停止白噪音并淡出
   */
  stopWhiteNoiseWithFadeOut(duration: number = 500): void {
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

    const baseVolume = this.sounds[soundName]?.volume() || 0.5;
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
    const sound = this.sounds[soundName];
    if (sound && !this.isMuted) {
      const targetVolume = this.getEffectiveVolume(soundName);
      sound.volume(0);
      sound.play();
      sound.fade(0, targetVolume, duration);
    }
  }

  fadeOut(soundName: keyof typeof this.sounds, duration: number = 500) {
    const sound = this.sounds[soundName];
    if (sound) {
      const currentVolume = sound.volume();
      sound.fade(currentVolume, 0, duration);
      setTimeout(() => sound.stop(), duration);
    }
  }

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
   * 添加自定义音效
   */
  async addCustomSound(file: File, name: string, category: CustomSound['category'], description?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // 验证文件类型
      if (!file.type.startsWith('audio/')) {
        reject(new Error('Invalid file type. Please select an audio file.'));
        return;
      }

      // 验证文件大小 (最大 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        reject(new Error('File size too large. Maximum size is 10MB.'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const audioData = e.target?.result as string;
          const soundId = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

          const customSound: CustomSound = {
            id: soundId,
            name: name || file.name,
            file: audioData,
            type: 'custom',
            category,
            size: file.size,
            uploadDate: new Date().toISOString(),
            description: description || `自定义${category === 'notification' ? '通知' : '环境'}音效`
          };

          // 创建 Howl 实例来验证音频文件
          const tempHowl = new Howl({
            src: [audioData],
            volume: 0.5,
            onload: () => {
              // 获取音频时长
              customSound.duration = tempHowl.duration();

              // 保存到音效库
              this.sounds[soundId] = tempHowl;
              this.customSounds.push(customSound);
              this.saveCustomSounds();
              resolve(soundId);
            },
            onloaderror: (_id, error) => {
              console.error('Failed to load audio file:', error);
              reject(new Error('Invalid audio file or unsupported format.'));
            }
          });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * 删除自定义音效
   */
  removeCustomSound(soundId: string) {
    // 从 sounds 中删除
    if (this.sounds[soundId]) {
      this.sounds[soundId].unload();
      delete this.sounds[soundId];
    }

    // 从自定义音效列表中删除
    this.customSounds = this.customSounds.filter(sound => sound.id !== soundId);
    this.saveCustomSounds();

    // 如果有映射使用了这个音效，重置为默认
    for (const [event, mappedSoundId] of Object.entries(this.soundMappings)) {
      if (mappedSoundId === soundId) {
        this.soundMappings[event] = event; // 重置为默认
      }
    }
    this.saveSoundMappings();
  }

  /**
   * 设置事件音效映射
   */
  setSoundMapping(event: string, soundId: string) {
    this.soundMappings[event] = soundId;
    this.saveSoundMappings();
  }

  /**
   * 获取所有可用音效
   */
  getAllSounds(): CustomSound[] {
    const defaultSounds: CustomSound[] = [
      {
        id: 'focusStart',
        name: '专注开始',
        file: '/sounds/focus-start.mp3',
        type: 'default',
        category: 'notification',
        description: '开始专注时播放的提示音'
      },
      {
        id: 'breakStart',
        name: '休息开始',
        file: '/sounds/break-start.mp3',
        type: 'default',
        category: 'notification',
        description: '开始休息时播放的提示音'
      },
      {
        id: 'microBreak',
        name: '微休息',
        file: '/sounds/micro-break.mp3',
        type: 'default',
        category: 'notification',
        description: '微休息时播放的提示音'
      },
      {
        id: 'notification',
        name: '通知提示',
        file: '/sounds/notification.mp3',
        type: 'default',
        category: 'notification',
        description: '通用通知提示音'
      },
      {
        id: 'whiteNoise',
        name: '白噪音',
        file: '/sounds/white-noise.mp3',
        type: 'default',
        category: 'ambient',
        description: '背景环境音，可循环播放'
      },
    ];

    return [...defaultSounds, ...this.customSounds];
  }

  /**
   * 获取当前音效映射
   */
  getSoundMappings() {
    return { ...this.soundMappings };
  }

  /**
   * 获取指定类别的音效
   */
  getSoundsByCategory(category: CustomSound['category']): CustomSound[] {
    return this.getAllSounds().filter(sound => sound.category === category);
  }

  /**
   * 获取音效详细信息
   */
  getSoundInfo(soundId: string): CustomSound | null {
    return this.getAllSounds().find(sound => sound.id === soundId) || null;
  }

  /**
   * 重命名自定义音效
   */
  renameCustomSound(soundId: string, newName: string): boolean {
    const soundIndex = this.customSounds.findIndex(sound => sound.id === soundId);
    if (soundIndex !== -1) {
      this.customSounds[soundIndex].name = newName;
      this.saveCustomSounds();
      return true;
    }
    return false;
  }

  /**
   * 更新自定义音效描述
   */
  updateSoundDescription(soundId: string, description: string): boolean {
    const soundIndex = this.customSounds.findIndex(sound => sound.id === soundId);
    if (soundIndex !== -1) {
      this.customSounds[soundIndex].description = description;
      this.saveCustomSounds();
      return true;
    }
    return false;
  }

  /**
   * 获取存储使用情况
   */
  getStorageInfo(): { totalSounds: number; customSounds: number; totalSize: number } {
    const customSounds = this.customSounds.length;
    const totalSize = this.customSounds.reduce((sum, sound) => sum + (sound.size || 0), 0);

    return {
      totalSounds: this.getAllSounds().length,
      customSounds,
      totalSize
    };
  }

  /**
   * 导出音效配置
   */
  exportSoundConfig(): string {
    const config = {
      customSounds: this.customSounds.map(sound => ({
        ...sound,
        file: sound.type === 'custom' ? '[AUDIO_DATA]' : sound.file // 不导出实际音频数据
      })),
      soundMappings: this.soundMappings,
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(config, null, 2);
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
   * 保存音效映射到本地存储
   */
  private saveSoundMappings() {
    try {
      const data = JSON.stringify(this.soundMappings);
      localStorage.setItem('focusflow-sound-mappings', data);

      // 创建备份
      localStorage.setItem('focusflow-sound-mappings-backup', data);
    } catch (error) {
      console.warn('Failed to save sound mappings:', error);

      // 尝试清理存储空间后重试
      this.cleanupStorage();
      try {
        localStorage.setItem('focusflow-sound-mappings', JSON.stringify(this.soundMappings));
      } catch (retryError) {
        console.error('Failed to save sound mappings after cleanup:', retryError);
      }
    }
  }

  /**
   * 播放音效（使用映射）
   */
  playMapped(eventType: string) {
    const soundId = this.soundMappings[eventType] || eventType;
    this.playWithVolumeControl(soundId, eventType);
  }

  /**
   * 带音量控制的播放
   */
  private playWithVolumeControl(soundId: string, eventType?: string) {
    if (this.isMuted) return;

    const sound = this.sounds[soundId];
    if (!sound) return;

    // 计算最终音量
    let categoryVolume = 0.5; // 默认音量
    if (eventType) {
      const soundInfo = this.getSoundInfo(soundId);
      if (soundInfo?.category === 'ambient') {
        categoryVolume = this.volumeSettings.ambient;
      } else {
        categoryVolume = this.volumeSettings.notification;
      }
    }

    const finalVolume = this.volumeSettings.master * categoryVolume;
    sound.volume(finalVolume);

    // 播放音效
    sound.play();

    // 如果设置了淡入效果
    if (this.volumeSettings.fadeInDuration > 0) {
      sound.fade(0, finalVolume, this.volumeSettings.fadeInDuration);
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
   * 保存音量设置
   */
  private saveVolumeSettings() {
    try {
      const data = JSON.stringify(this.volumeSettings);
      localStorage.setItem('focusflow-volume-settings', data);

      // 创建备份
      localStorage.setItem('focusflow-volume-settings-backup', data);
    } catch (error) {
      console.warn('Failed to save volume settings:', error);

      // 尝试清理存储空间后重试
      this.cleanupStorage();
      try {
        localStorage.setItem('focusflow-volume-settings', JSON.stringify(this.volumeSettings));
      } catch (retryError) {
        console.error('Failed to save volume settings after cleanup:', retryError);
      }
    }
  }

  /**
   * 设置主音量
   */
  setMasterVolume(volume: number) {
    this.volumeSettings.master = Math.max(0, Math.min(1, volume));
    this.saveVolumeSettings();
  }

  /**
   * 设置分类音量
   */
  setCategoryVolume(category: 'notification' | 'ambient', volume: number) {
    this.volumeSettings[category] = Math.max(0, Math.min(1, volume));
    this.saveVolumeSettings();
  }

  /**
   * 设置淡入淡出时长
   */
  setFadeDuration(fadeIn: number, fadeOut: number) {
    this.volumeSettings.fadeInDuration = Math.max(0, fadeIn);
    this.volumeSettings.fadeOutDuration = Math.max(0, fadeOut);
    this.saveVolumeSettings();
  }

  /**
   * 静音/取消静音
   */
  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      // 停止所有正在播放的音效
      Object.values(this.sounds).forEach(sound => sound.stop());
    }
  }

  /**
   * 获取音量设置
   */
  getVolumeSettings(): VolumeSettings {
    return { ...this.volumeSettings };
  }

  /**
   * 获取静音状态
   */
  isMutedState(): boolean {
    return this.isMuted;
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
   * 智能音效播放 - 根据计时器状态自动选择合适的音效
   */
  playSmartSound(phase: 'focus' | 'break' | 'microBreak' | 'forcedBreak', action: 'start' | 'end' = 'start'): void {
    if (this.isMuted) return;

    switch (phase) {
      case 'focus':
        if (action === 'start') {
          this.play('focusStart');
          // 0.5秒后开始播放白噪音
          setTimeout(() => {
            this.playWhiteNoiseWithFadeIn(500);
          }, 500);
        } else {
          this.stopWhiteNoiseWithFadeOut(300);
        }
        break;

      case 'break':
      case 'forcedBreak':
        if (action === 'start') {
          this.stopWhiteNoiseWithFadeOut(200);
          setTimeout(() => {
            this.play('breakStart');
          }, 200);
        }
        break;

      case 'microBreak':
        if (action === 'start') {
          // 微休息时暂时降低白噪音音量而不停止
          const whiteNoise = this.sounds.whiteNoise;
          if (whiteNoise && whiteNoise.playing()) {
            const currentVolume = whiteNoise.volume();
            whiteNoise.fade(currentVolume, currentVolume * 0.3, 300);
          }
          this.play('microBreak');
        } else {
          // 微休息结束，恢复白噪音音量
          const whiteNoise = this.sounds.whiteNoise;
          if (whiteNoise && whiteNoise.playing()) {
            const targetVolume = this.getEffectiveVolume('whiteNoise');
            whiteNoise.fade(whiteNoise.volume(), targetVolume, 300);
          }
        }
        break;
    }
  }

  /**
   * 获取音效播放状态
   */
  getSoundStatus(): {
    whiteNoiseActive: boolean;
    currentVolume: number;
    isMuted: boolean;
    activeSounds: string[];
  } {
    const activeSounds: string[] = [];

    Object.entries(this.sounds).forEach(([name, sound]) => {
      if (sound.playing()) {
        activeSounds.push(name);
      }
    });

    return {
      whiteNoiseActive: this.sounds.whiteNoise?.playing() || false,
      currentVolume: this.volumeSettings.master,
      isMuted: this.isMuted,
      activeSounds,
    };
  }

  /**
   * 紧急停止所有音效
   */
  emergencyStopAll(): void {
    Object.values(this.sounds).forEach(sound => {
      sound.stop();
    });
  }

  /**
   * 获取存储健康状态
   */
  getStorageHealth(): { status: 'healthy' | 'warning' | 'error'; issues: string[] } {
    const issues: string[] = [];

    try {
      // 检查本地存储可用性
      const testKey = 'focusflow-health-test';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
    } catch (error) {
      issues.push('本地存储不可用');
    }

    // 检查数据完整性
    try {
      const soundsData = localStorage.getItem('focusflow-custom-sounds');
      if (soundsData && !this.validateData(JSON.parse(soundsData), 'sounds')) {
        issues.push('自定义音效数据损坏');
      }
    } catch (error) {
      issues.push('无法读取音效数据');
    }

    try {
      const mappingsData = localStorage.getItem('focusflow-sound-mappings');
      if (mappingsData && !this.validateData(JSON.parse(mappingsData), 'mappings')) {
        issues.push('音效映射数据损坏');
      }
    } catch (error) {
      issues.push('无法读取映射数据');
    }

    try {
      const volumeData = localStorage.getItem('focusflow-volume-settings');
      if (volumeData && !this.validateData(JSON.parse(volumeData), 'volume')) {
        issues.push('音量设置数据损坏');
      }
    } catch (error) {
      issues.push('无法读取音量数据');
    }

    // 检查存储空间使用
    try {
      const storageInfo = this.getStorageInfo();
      if (storageInfo.totalSize > 50 * 1024 * 1024) { // 50MB
        issues.push('存储空间使用过多');
      }
    } catch (error) {
      issues.push('无法检查存储使用情况');
    }

    let status: 'healthy' | 'warning' | 'error' = 'healthy';
    if (issues.length > 0) {
      status = issues.some(issue => issue.includes('不可用') || issue.includes('损坏')) ? 'error' : 'warning';
    }

    return { status, issues };
  }
}

let soundServiceInstance: SoundService | null = null;

export const getSoundService = (): SoundService => {
  if (!soundServiceInstance) {
    soundServiceInstance = new SoundService();
  }
  return soundServiceInstance;
};

// 向后兼容
export const soundService = getSoundService();