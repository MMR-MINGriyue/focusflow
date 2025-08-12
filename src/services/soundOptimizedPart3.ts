import { CustomSound, SoundServiceOptimized } from './soundOptimized';

/**
 * 优化版音效服务 - 第三部分
 * 包含剩余的方法实现
 */

// 扩展SoundServiceOptimized类
Object.assign(SoundServiceOptimized.prototype, {
  /**
   * 获取存储健康状态（续）
   */
  getStorageHealth(this: SoundServiceOptimized): { status: 'healthy' | 'warning' | 'error'; issues: string[] } {
    const issues: string[] = [];

    // 前面的检查代码...

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
  },

  /**
   * 添加自定义音效
   */
  async addCustomSound(this: SoundServiceOptimized, file: File, name: string, category: CustomSound['category'], description?: string): Promise<string> {
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
  },

  /**
   * 删除自定义音效
   */
  removeCustomSound(this: SoundServiceOptimized, soundId: string) {
    // 从 sounds 中删除
    if (this.sounds[soundId]) {
      this.sounds[soundId]?.unload();
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
  },

  /**
   * 设置事件音效映射
   */
  setSoundMapping(this: SoundServiceOptimized, event: string, soundId: string) {
    this.soundMappings[event] = soundId;
    this.saveSoundMappings();
  },

  /**
   * 重命名自定义音效
   */
  renameCustomSound(this: SoundServiceOptimized, soundId: string, newName: string): boolean {
    const soundIndex = this.customSounds.findIndex(sound => sound.id === soundId);
    if (soundIndex !== -1) {
      this.customSounds[soundIndex].name = newName;
      this.saveCustomSounds();
      return true;
    }
    return false;
  },

  /**
   * 更新自定义音效描述
   */
  updateSoundDescription(this: SoundServiceOptimized, soundId: string, description: string): boolean {
    const soundIndex = this.customSounds.findIndex(sound => sound.id === soundId);
    if (soundIndex !== -1) {
      this.customSounds[soundIndex].description = description;
      this.saveCustomSounds();
      return true;
    }
    return false;
  },

  /**
   * 保存自定义音效到本地存储
   */
  saveCustomSounds(this: SoundServiceOptimized) {
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
  },

  /**
   * 保存音效映射到本地存储
   */
  saveSoundMappings(this: SoundServiceOptimized) {
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
  },

  /**
   * 导出音效配置
   */
  exportSoundConfig(this: SoundServiceOptimized): string {
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
});

// 导出获取服务实例的函数
let soundServiceOptimizedInstance: SoundServiceOptimized | null = null;

export const getSoundServiceOptimized = (): SoundServiceOptimized => {
  if (!soundServiceOptimizedInstance) {
    soundServiceOptimizedInstance = new SoundServiceOptimized();
  }
  return soundServiceOptimizedInstance;
};

// 向后兼容
export const soundServiceOptimized = getSoundServiceOptimized();
