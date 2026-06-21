/**
 * 通知管理器
 * 
 * 处理推送通知的注册、显示和点击事件
 */

import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type NotificationMode = "popup" | "background" | "disabled";

const NOTIFICATION_MODE_KEY = "notification_mode";

// 配置通知处理程序
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationManager = {
  /**
   * 初始化通知
   */
  async initialize() {
    try {
      // 请求通知权限
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        console.warn("Notification permissions not granted");
      }

      // 获取推送令牌
      const token = await Notifications.getExpoPushTokenAsync();
      console.log("Expo Push Token:", token.data);

      // 处理前台通知
      this.setupForegroundNotificationListener();

      // 处理后台通知点击
      this.setupBackgroundNotificationListener();
    } catch (err) {
      console.error("Initialize notifications error:", err);
    }
  },

  /**
   * 设置前台通知监听
   */
  setupForegroundNotificationListener() {
    const subscription = Notifications.addNotificationReceivedListener(
      async (notification) => {
        const mode = await this.getNotificationMode();

        if (mode === "disabled") {
          return;
        }

        // 前台通知已由 setNotificationHandler 处理
        console.log("Foreground notification received:", notification);
      }
    );

    return subscription;
  },

  /**
   * 设置后台通知监听
   */
  setupBackgroundNotificationListener() {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const mode = await this.getNotificationMode();

        if (mode === "disabled") {
          return;
        }

        const notification = response.notification;
        console.log("Notification response:", notification);

        // 处理通知数据
        const data = notification.request.content.data;
        if (data.type === "room_invite") {
          // TODO: 导航到好友列表的邀请标签页
          console.log("Room invite notification clicked:", data);
        }
      }
    );

    return subscription;
  },

  /**
   * 获取通知模式
   */
  async getNotificationMode(): Promise<NotificationMode> {
    try {
      const mode = await AsyncStorage.getItem(NOTIFICATION_MODE_KEY);
      return (mode as NotificationMode) || "popup";
    } catch (err) {
      console.error("Get notification mode error:", err);
      return "popup";
    }
  },

  /**
   * 设置通知模式
   */
  async setNotificationMode(mode: NotificationMode) {
    try {
      await AsyncStorage.setItem(NOTIFICATION_MODE_KEY, mode);
    } catch (err) {
      console.error("Set notification mode error:", err);
    }
  },

  /**
   * 发送本地通知（用于测试）
   */
  async sendLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: true,
          badge: 1,
        },
        trigger: { seconds: 1 } as any,
      });
    } catch (err) {
      console.error("Send local notification error:", err);
    }
  },

  /**
   * 显示前台弹窗通知
   */
  async showPopupNotification(
    title: string,
    body: string,
    onAccept?: () => void,
    onReject?: () => void
  ) {
    // 这个函数应该在 React 组件中调用，使用 Alert 或自定义模态框
    // 这里只是一个占位符
    console.log("Show popup notification:", title, body);
  },

  /**
   * 清除所有通知
   */
  async clearAllNotifications() {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (err) {
      console.error("Clear notifications error:", err);
    }
  },
};
