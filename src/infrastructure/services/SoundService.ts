/**
 * 声音服务实现
 * 处理应用中的所有声音相关功能
 */

import { ISoundService } from './ServiceInterfaces';

// 声音映射配置
const SOUND_MAP: Record<string, string> = {
  focusStart: 'focus-start.mp3',
  breakStart: 'break-start.mp3',
  microBreak: 'micro-break.mp3',
  notification: 'notification.mp3',
  whiteNoise: 'white-noise.mp3',
};

export class SoundService implements ISoundService {
  private audioContext: AudioContext | null = null;
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private currentVolume = 0.5;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // 创建音频上下文
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // 预加载基本声音
      await this.preloadSounds(Object.values(SOUND_MAP));

      this.initialized = true;
      console.log('Sound service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize sound service:', error);
      throw error;
    }
  }

  async play(soundName: string): Promise<void> {
    if (!this.initialized || !this.audioContext) {
      console.warn('Sound service not initialized');
      return;
    }

    try {
      const audioBuffer = this.audioBuffers.get(soundName);
      if (!audioBuffer) {
        console.warn(`Sound not found: ${soundName}`);
        return;
      }

      // 创建音频源
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;

      // 创建增益节点控制音量
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = this.currentVolume;

      // 连接节点
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // 播放声音
      source.start(0);
    } catch (error) {
      console.error(`Failed to play sound ${soundName}:`, error);
    }
  }

  async playMapped(soundKey: string): Promise<void> {
    const soundName = SOUND_MAP[soundKey];
    if (soundName) {
      await this.play(soundName);
    } else {
      console.warn(`No sound mapped for key: ${soundKey}`);
    }
  }

  async stop(): Promise<void> {
    // 在Web Audio API中，无法直接停止所有声音
    // 实际实现中可能需要跟踪所有活动音频源并单独停止
    console.log('Stopping all sounds');
  }

  async setVolume(volume: number): Promise<void> {
    // 确保音量在0-1范围内
    this.currentVolume = Math.max(0, Math.min(1, volume));
  }

  getVolume(): number {
    return this.currentVolume;
  }

  async preloadSounds(soundNames: string[]): Promise<void> {
    if (!this.audioContext) {
      return;
    }

    try {
      const loadPromises = soundNames.map(async (soundName) => {
        try {
          // 加载音频文件
          const response = await fetch(`/sounds/${soundName}`);
          if (!response.ok) {
            throw new Error(`Failed to load sound: ${soundName}`);
          }

          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);

          // 缓存音频缓冲区
          this.audioBuffers.set(soundName, audioBuffer);
        } catch (error) {
          console.error(`Failed to preload sound ${soundName}:`, error);
        }
      });

      await Promise.all(loadPromises);
      console.log(`Preloaded ${soundNames.length} sounds`);
    } catch (error) {
      console.error('Failed to preload sounds:', error);
    }
  }
}
