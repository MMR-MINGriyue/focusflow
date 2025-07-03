import { Howl } from 'howler';

class SoundService {
  private sounds: {
    [key: string]: Howl;
  } = {};

  constructor() {
    this.initializeSounds();
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
}

export const soundService = new SoundService(); 