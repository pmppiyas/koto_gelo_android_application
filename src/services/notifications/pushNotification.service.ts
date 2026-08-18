class PushNotificationService {
  async registerForPushNotifications(): Promise<string | null> {
    // FCM / APNS token registration logic
    return null;
  }

  async handleForegroundNotification(notification: any): Promise<void> {
    // Handle foreground incoming push notification
  }
}

export const pushNotificationService = new PushNotificationService();
