import { BaseDirectory, createDir, exists, readTextFile, writeTextFile } from '@tauri-apps/api/fs';

export interface FocusStats {
  date: string;
  focusTime: number;
  breakTime: number;
  microBreaks: number;
  efficiency: number;
}

export interface AppSettings {
  focusDuration: number;
  breakDuration: number;
  microBreakMinInterval: number;
  microBreakMaxInterval: number;
  microBreakDuration: number;
  soundEnabled: boolean;
  notificationEnabled: boolean;
  volume: number;
}

class StorageService {
  private readonly STATS_FILE = 'focus_stats.json';
  private readonly SETTINGS_FILE = 'app_settings.json';

  private async ensureDataDir(): Promise<void> {
    try {
      const dataExists = await exists('', { dir: BaseDirectory.AppData });
      if (!dataExists) {
        await createDir('', { dir: BaseDirectory.AppData, recursive: true });
      }
    } catch (error) {
      console.error('Failed to ensure data directory:', error);
    }
  }

  async saveStats(stats: FocusStats[]): Promise<void> {
    try {
      await this.ensureDataDir();
      await writeTextFile(this.STATS_FILE, JSON.stringify(stats, null, 2), {
        dir: BaseDirectory.AppData
      });
    } catch (error) {
      console.error('Failed to save stats:', error);
    }
  }

  async getStats(): Promise<FocusStats[]> {
    try {
      await this.ensureDataDir();
      const fileExists = await exists(this.STATS_FILE, { dir: BaseDirectory.AppData });
      if (!fileExists) {
        return [];
      }

      const content = await readTextFile(this.STATS_FILE, { dir: BaseDirectory.AppData });
      return JSON.parse(content) as FocusStats[];
    } catch (error) {
      console.error('Failed to get stats:', error);
      return [];
    }
  }

  async updateEfficiency(date: string, efficiency: number): Promise<void> {
    try {
      const stats = await this.getStats();
      const updatedStats = stats.map(stat =>
        stat.date === date ? { ...stat, efficiency } : stat
      );
      await this.saveStats(updatedStats);
    } catch (error) {
      console.error('Failed to update efficiency:', error);
    }
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await this.ensureDataDir();
      await writeTextFile(this.SETTINGS_FILE, JSON.stringify(settings, null, 2), {
        dir: BaseDirectory.AppData
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  async getSettings(): Promise<AppSettings> {
    try {
      await this.ensureDataDir();
      const fileExists = await exists(this.SETTINGS_FILE, { dir: BaseDirectory.AppData });
      if (!fileExists) {
        return this.getDefaultSettings();
      }

      const content = await readTextFile(this.SETTINGS_FILE, { dir: BaseDirectory.AppData });
      return { ...this.getDefaultSettings(), ...JSON.parse(content) };
    } catch (error) {
      console.error('Failed to get settings:', error);
      return this.getDefaultSettings();
    }
  }

  private getDefaultSettings(): AppSettings {
    return {
      focusDuration: 90,
      breakDuration: 20,
      microBreakMinInterval: 10,
      microBreakMaxInterval: 30,
      microBreakDuration: 3,
      soundEnabled: true,
      notificationEnabled: true,
      volume: 0.5
    };
  }

  async clearStats(): Promise<void> {
    try {
      await this.saveStats([]);
    } catch (error) {
      console.error('Failed to clear stats:', error);
    }
  }
}

export const storageService = new StorageService(); 