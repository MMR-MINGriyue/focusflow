import { Howl } from 'howler';
import { safeConsole } from '../utils/environment';
import { CustomSound, VolumeSettings, SoundServiceOptimized } from './soundOptimized';

/**
 * 优化版音效服务 - 第二部分
 * 包含剩余的方法实现
 */

// 扩展SoundServiceOptimized类
Object.assign(SoundServiceOptimized.prototype, {
  /**
   * 加载音量设置
   */
  loadVolumeSettings(this: SoundServiceOptimized) {
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
  },

  /**
   * 保存音量设置
   */
  saveVolumeSettings(this: SoundServiceOptimized) {
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
  },

  /**
   * 设置主音量
   */
  setMasterVolume(this: SoundServiceOptimized, volume: number) {
    this.volumeSettings.master = Math.max(0, Math.min(1, volume));
    this.saveVolumeSettings();
  },

  /**
   * 设置分类音量
   */
  setCategoryVolume(this: SoundServiceOptimized, category: 'notification' | 'ambient', volume: number) {
    this.volumeSettings[category] = Math.max(0, Math.min(1, volume));
    this.saveVolumeSettings();
  },

  /**
   * 设置淡入淡出时长
   */
  setFadeDuration(this: SoundServiceOptimized, fadeIn: number, fadeOut: number) {
    this.volumeSettings.fadeInDuration = Math.max(0, fadeIn);
    this.volumeSettings.fadeOutDuration = Math.max(0, fadeOut);
    this.saveVolumeSettings();
  },

  /**
   * 静音/取消静音
   */
  setMuted(this: SoundServiceOptimized, muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      // 停止所有正在播放的音效
      Object.values(this.sounds).forEach(sound => {
        if (sound) sound.stop();
      });
    }
  },

  /**
   * 获取音量设置
   */
  getVolumeSettings(this: SoundServiceOptimized): VolumeSettings {
    return { ...this.volumeSettings };
  },

  /**
   * 获取静音状态
   */
  isMutedState(this: SoundServiceOptimized): boolean {
    return this.isMuted;
  },

  /**
   * 清理存储空间
   */
  cleanupStorage(this: SoundServiceOptimized) {
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
  },

  /**
   * 恢复数据从备份
   */
  restoreFromBackup(this: SoundServiceOptimized, key: string): any {
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
  },

  /**
   * 验证数据完整性
   */
  validateData(this: SoundServiceOptimized, data: any, type: 'sounds' | 'mappings' | 'volume'): boolean {
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
  },

  /**
   * 播放音效（使用映射）
   */
  playMapped(this: SoundServiceOptimized, eventType: string) {
    const soundId = this.soundMappings[eventType] || eventType;
    this.playWithVolumeControl(soundId, eventType);
  },

  /**
   * 带音量控制的播放
   */
  playWithVolumeControl(this: SoundServiceOptimized, soundId: string, eventType?: string) {
    if (this.isMuted) return;

    this.loadSound(soundId as keyof typeof this.sounds).then(sound => {
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
    }).catch(error => {
      console.error(`Failed to play sound with volume control ${soundId}:`, error);
    });
  },

  /**
   * 获取所有可用音效
   */
  getAllSounds(this: SoundServiceOptimized): CustomSound[] {
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
  },

  /**
   * 获取当前音效映射
   */
  getSoundMappings(this: SoundServiceOptimized) {
    return { ...this.soundMappings };
  },

  /**
   * 获取指定类别的音效
   */
  getSoundsByCategory(this: SoundServiceOptimized, category: CustomSound['category']): CustomSound[] {
    return this.getAllSounds().filter(sound => sound.category === category);
  },

  /**
   * 获取音效详细信息
   */
  getSoundInfo(this: SoundServiceOptimized, soundId: string): CustomSound | null {
    return this.getAllSounds().find(sound => sound.id === soundId) || null;
  },

  /**
   * 智能音效播放 - 根据计时器状态自动选择合适的音效
   */
  playSmartSound(this: SoundServiceOptimized, phase: 'focus' | 'break' | 'microBreak' | 'forcedBreak', action: 'start' | 'end' = 'start'): void {
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
          this.loadSound('whiteNoise').then(whiteNoise => {
            if (whiteNoise && whiteNoise.playing()) {
              const currentVolume = whiteNoise.volume();
              whiteNoise.fade(currentVolume, currentVolume * 0.3, 300);
            }
          });
          this.play('microBreak');
        } else {
          // 微休息结束，恢复白噪音音量
          this.loadSound('whiteNoise').then(whiteNoise => {
            if (whiteNoise && whiteNoise.playing()) {
              const targetVolume = this.getEffectiveVolume('whiteNoise' as keyof typeof this.sounds);
              whiteNoise.fade(whiteNoise.volume(), targetVolume, 300);
            }
          });
        }
        break;
    }
  },

  /**
   * 获取音效播放状态
   */
  getSoundStatus(this: SoundServiceOptimized): {
    whiteNoiseActive: boolean;
    currentVolume: number;
    isMuted: boolean;
    activeSounds: string[];
  } {
    const activeSounds: string[] = [];

    Object.entries(this.sounds).forEach(([name, sound]) => {
      if (sound && sound.playing()) {
        activeSounds.push(name);
      }
    });

    return {
      whiteNoiseActive: this.sounds.whiteNoise?.playing() || false,
      currentVolume: this.volumeSettings.master,
      isMuted: this.isMuted,
      activeSounds,
    };
  },

  /**
   * 紧急停止所有音效
   */
  emergencyStopAll(this: SoundServiceOptimized): void {
    Object.values(this.sounds).forEach(sound => {
      if (sound) sound.stop();
    });
  },

  /**
   * 获取存储健康状态
   */
  getStorageHealth(this: SoundServiceOptimized): { status: 'healthy' | 'warning' | 'error'; issues: string[] } {
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
  },

  /**
   * 获取存储使用情况
   */
  getStorageInfo(this: SoundServiceOptimized): { totalSounds: number; customSounds: number; totalSize: number } {
    const customSounds = this.customSounds.length;
    const totalSize = this.customSounds.reduce((sum, sound) => sum + (sound.size || 0), 0);

    return {
      totalSounds: this.getAllSounds().length,
      customSounds,
      totalSize
    };
  }
});

// 导出获取单例实例的函数
let soundServiceOptimizedInstance: SoundServiceOptimized | null = null;

export const getSoundServiceOptimized = (): SoundServiceOptimized => {
  if (!soundServiceOptimizedInstance) {
    soundServiceOptimizedInstance = new SoundServiceOptimized();
  }
  return soundServiceOptimizedInstance;
};

// 向后兼容
export const soundServiceOptimized = getSoundServiceOptimized();
