class NotificationService {
  async getNotifications() {
    return [];
  }

  async markAsRead(id: string) {
    return true;
  }
}

export const notificationService = new NotificationService();
