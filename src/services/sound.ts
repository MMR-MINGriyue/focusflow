import { Howl } from 'howler';

export interface CustomSound {
  id: string;
  name: string;
  file: File | string;
  type: 'default' | 'custom';
  category: 'focusStart' | 'breakStart' | 'microBreak' | 'notification' | 'whiteNoise';
}

class SoundService {
  private sounds: {
    [key: string]: Howl;
  } = {};

  private customSounds: CustomSound[] = [];
  private soundMappings: {
    [key: string]: string; // 事件类型 -> 音效ID的映射
  } = {};

  constructor() {
    this.initializeSounds();
    this.loadCustomSounds();
    this.initializeSoundMappings();
  }

  private initializeSounds() {
    this.sounds = {
      notification: new Howl({
        src: ['/sounds/notification.mp3'],
        volume: 0.5,
        onloaderror: () => console.warn('Failed to load notification sound'),
        onplayerror: () => console.warn('Failed to play notification sound')
      }),
      microBreak: new Howl({
        src: ['/sounds/micro-break.mp3'],
        volume: 0.3,
        onloaderror: () => console.warn('Failed to load micro-break sound'),
        onplayerror: () => console.warn('Failed to play micro-break sound')
      }),
      focusStart: new Howl({
        src: ['/sounds/focus-start.mp3'],
        volume: 0.4,
        onloaderror: () => console.warn('Failed to load focus-start sound'),
        onplayerror: () => console.warn('Failed to play focus-start sound')
      }),
      breakStart: new Howl({
        src: ['/sounds/break-start.mp3'],
        volume: 0.4,
        onloaderror: () => console.warn('Failed to load break-start sound'),
        onplayerror: () => console.warn('Failed to play break-start sound')
      }),
      whiteNoise: new Howl({
        src: ['/sounds/white-noise.mp3'],
        volume: 0.2,
        loop: true,
        onloaderror: () => console.warn('Failed to load white-noise sound'),
        onplayerror: () => console.warn('Failed to play white-noise sound')
      })
    };
  }

  play(soundName: keyof typeof this.sounds) {
    const sound = this.sounds[soundName];
    if (sound) {
      sound.play();
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

  fadeIn(soundName: keyof typeof this.sounds, duration: number = 500) {
    const sound = this.sounds[soundName];
    if (sound) {
      sound.fade(0, sound.volume(), duration);
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
    this.soundMappings = {
      focusStart: 'focusStart',
      breakStart: 'breakStart',
      microBreak: 'microBreak',
      notification: 'notification',
      whiteNoise: 'whiteNoise',
    };

    // 从本地存储加载自定义映射
    const savedMappings = localStorage.getItem('focusflow-sound-mappings');
    if (savedMappings) {
      try {
        this.soundMappings = { ...this.soundMappings, ...JSON.parse(savedMappings) };
      } catch (error) {
        console.warn('Failed to load sound mappings:', error);
      }
    }
  }

  /**
   * 加载自定义音效
   */
  private async loadCustomSounds() {
    try {
      const savedSounds = localStorage.getItem('focusflow-custom-sounds');
      if (savedSounds) {
        this.customSounds = JSON.parse(savedSounds);

        // 重新创建 Howl 实例
        for (const customSound of this.customSounds) {
          if (customSound.type === 'custom' && typeof customSound.file === 'string') {
            this.sounds[customSound.id] = new Howl({
              src: [customSound.file],
              volume: 0.5,
              onloaderror: () => console.warn(`Failed to load custom sound: ${customSound.name}`),
              onplayerror: () => console.warn(`Failed to play custom sound: ${customSound.name}`)
            });
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load custom sounds:', error);
    }
  }

  /**
   * 添加自定义音效
   */
  async addCustomSound(file: File, name: string, category: CustomSound['category']): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const audioData = e.target?.result as string;
          const soundId = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

          const customSound: CustomSound = {
            id: soundId,
            name,
            file: audioData,
            type: 'custom',
            category
          };

          // 创建 Howl 实例
          this.sounds[soundId] = new Howl({
            src: [audioData],
            volume: 0.5,
            onload: () => {
              // 保存到自定义音效列表
              this.customSounds.push(customSound);
              this.saveCustomSounds();
              resolve(soundId);
            },
            onloaderror: () => {
              reject(new Error('Failed to load audio file'));
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
      { id: 'focusStart', name: '专注开始', file: '/sounds/focus-start.mp3', type: 'default', category: 'focusStart' },
      { id: 'breakStart', name: '休息开始', file: '/sounds/break-start.mp3', type: 'default', category: 'breakStart' },
      { id: 'microBreak', name: '微休息', file: '/sounds/micro-break.mp3', type: 'default', category: 'microBreak' },
      { id: 'notification', name: '通知提示', file: '/sounds/notification.mp3', type: 'default', category: 'notification' },
      { id: 'whiteNoise', name: '白噪音', file: '/sounds/white-noise.mp3', type: 'default', category: 'whiteNoise' },
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
   * 保存自定义音效到本地存储
   */
  private saveCustomSounds() {
    try {
      localStorage.setItem('focusflow-custom-sounds', JSON.stringify(this.customSounds));
    } catch (error) {
      console.warn('Failed to save custom sounds:', error);
    }
  }

  /**
   * 保存音效映射到本地存储
   */
  private saveSoundMappings() {
    try {
      localStorage.setItem('focusflow-sound-mappings', JSON.stringify(this.soundMappings));
    } catch (error) {
      console.warn('Failed to save sound mappings:', error);
    }
  }

  /**
   * 播放音效（使用映射）
   */
  playMapped(eventType: string) {
    const soundId = this.soundMappings[eventType] || eventType;
    this.play(soundId as any);
  }
}

export const soundService = new SoundService(); 