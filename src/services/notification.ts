import { sendNotification, requestPermission } from '@tauri-apps/api/notification';

class NotificationService {
  private async checkPermission(): Promise<boolean> {
    try {
      const permissionState = await requestPermission();
      return permissionState === 'granted';
    } catch (error) {
      console.error('Failed to check notification permission:', error);
      return false;
    }
  }

  async sendNotification(title: string, body: string, options: {
    icon?: string;
    sound?: string;
  } = {}) {
    try {
      const hasPermission = await this.checkPermission();

      if (hasPermission) {
        await sendNotification({
          title,
          body,
          icon: options.icon,
          sound: options.sound
        });
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  async scheduleNotification(
    title: string,
    body: string,
    delayInSeconds: number,
    options: {
      icon?: string;
      sound?: string;
    } = {}
  ) {
    setTimeout(
      () => this.sendNotification(title, body, options),
      delayInSeconds * 1000
    );
  }
}

export const notificationService = new NotificationService(); 