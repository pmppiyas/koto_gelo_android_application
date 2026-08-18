class PushNotificationService {
  async registerForPushNotifications(): Promise<string | null> {
    return null;
  }

  async handleForegroundNotification(notification: any): Promise<void> {}
}

export const pushNotificationService = new PushNotificationService();
