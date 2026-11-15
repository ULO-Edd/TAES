export class WebNotificationManager {
  private static instance: WebNotificationManager;
  private hasPermission = false;

  private constructor() {
    this.checkPermission();
  }

  static getInstance(): WebNotificationManager {
    if (!WebNotificationManager.instance) {
      WebNotificationManager.instance = new WebNotificationManager();
    }
    return WebNotificationManager.instance;
  }

  private checkPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }
    this.hasPermission = Notification.permission === "granted";
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.warn("Web Notifications API not available");
      return false;
    }

    if (Notification.permission === "granted") {
      this.hasPermission = true;
      return true;
    }

    if (Notification.permission === "denied") {
      console.warn("Notification permission denied by user");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.hasPermission = permission === "granted";
      return this.hasPermission;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }

  async showNotification(
    title: string,
    options?: {
      body?: string;
      icon?: string;
      badge?: string;
      tag?: string;
      data?: any;
      requireInteraction?: boolean;
    },
  ): Promise<Notification | null> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return null;
    }

    if (!this.hasPermission) {
      const granted = await this.requestPermission();
      if (!granted) {
        return null;
      }
    }

    try {
      const notification = new Notification(title, {
        icon: options?.icon || "/favicon.png",
        badge: options?.badge,
        body: options?.body,
        tag: options?.tag,
        data: options?.data,
        requireInteraction: options?.requireInteraction || false,
      });
      return notification;
    } catch (error) {
      console.error("Error showing notification:", error);
      return null;
    }
  }
}
