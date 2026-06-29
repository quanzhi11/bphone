/**
 * 通知管理器 — 系统通知、权限、设置与点击回调
 */

import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import type { RoomInvite } from "@/lib/_core/booxin-api";

export const ROOM_INVITE_CHANNEL_ID = "room-invites";

const NOTIFICATION_SETTINGS_KEY = "notification_settings_v2";

export interface NotificationSettings {
  /** 总开关 */
  enabled: boolean;
  /** 系统通知栏（后台/锁屏也显示） */
  systemNotification: boolean;
  /** 应用在前台时弹出邀请界面 */
  foregroundPopup: boolean;
  /** 点击系统通知或从后台回到应用时自动打开邀请详情 */
  openInviteOnTap: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  systemNotification: true,
  foregroundPopup: true,
  openInviteOnTap: true,
};

export type InviteNotificationTapPayload = {
  inviteId: string;
  roomCode: string;
  senderUsername: string;
  senderUserId?: string;
  modpackGameVersion?: string;
  modpackLoader?: string;
};

type InviteTapListener = (payload: InviteNotificationTapPayload) => void;

const inviteTapListeners = new Set<InviteTapListener>();
let responseSubscription: Notifications.Subscription | null = null;
let initialized = false;

Notifications.setNotificationHandler({
  handleNotification: async () => {
    const settings = await notificationManager.getSettings();
    return {
      shouldShowAlert: settings.enabled && settings.systemNotification,
      shouldPlaySound: settings.enabled && settings.systemNotification,
      shouldSetBadge: settings.enabled,
      shouldShowBanner: settings.enabled && settings.systemNotification,
      shouldShowList: settings.enabled && settings.systemNotification,
    };
  },
});

function roomInviteToPayload(invite: RoomInvite): InviteNotificationTapPayload {
  return {
    inviteId: invite.inviteId,
    roomCode: invite.roomCode,
    senderUsername: invite.senderUsername,
    senderUserId: invite.senderUserId,
    modpackGameVersion: invite.modpackGameVersion,
    modpackLoader: invite.modpackLoader,
  };
}

function payloadToRoomInvite(payload: InviteNotificationTapPayload): RoomInvite {
  return {
    inviteId: payload.inviteId,
    roomCode: payload.roomCode,
    senderUsername: payload.senderUsername,
    senderUserId: payload.senderUserId ?? "",
    modpackGameVersion: payload.modpackGameVersion,
    modpackLoader: payload.modpackLoader,
    createdAtUtc: new Date().toISOString(),
  };
}

function parseInvitePayload(data: Record<string, unknown>): InviteNotificationTapPayload | null {
  if (data.type !== "room_invite" || typeof data.inviteId !== "string") {
    return null;
  }
  return {
    inviteId: data.inviteId,
    roomCode: String(data.roomCode ?? ""),
    senderUsername: String(data.senderUsername ?? "好友"),
    senderUserId: typeof data.senderUserId === "string" ? data.senderUserId : undefined,
    modpackGameVersion:
      typeof data.modpackGameVersion === "string" ? data.modpackGameVersion : undefined,
    modpackLoader: typeof data.modpackLoader === "string" ? data.modpackLoader : undefined,
  };
}

function emitInviteTap(payload: InviteNotificationTapPayload) {
  inviteTapListeners.forEach((listener) => listener(payload));
}

export const notificationManager = {
  payloadToRoomInvite,

  subscribeInviteTap(listener: InviteTapListener) {
    inviteTapListeners.add(listener);
    return () => inviteTapListeners.delete(listener);
  },

  async initialize() {
    if (initialized) {
      return;
    }
    initialized = true;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(ROOM_INVITE_CHANNEL_ID, {
        name: "联机邀请",
        description: "好友邀请你加入 Minecraft 联机房间",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#55B8E8",
        sound: "default",
        enableVibrate: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: false,
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing !== "granted") {
      await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
    }

    responseSubscription?.remove();
    responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      const payload = parseInvitePayload(data);
      if (!payload) {
        return;
      }
      void notificationManager.getSettings().then((settings) => {
        if (settings.enabled && settings.openInviteOnTap) {
          emitInviteTap(payload);
        }
      });
    });

    const lastResponse = Notifications.getLastNotificationResponse();
    if (lastResponse) {
      const data = lastResponse.notification.request.content.data as Record<string, unknown>;
      const payload = parseInvitePayload(data);
      if (payload) {
        const settings = await notificationManager.getSettings();
        if (settings.enabled && settings.openInviteOnTap) {
          emitInviteTap(payload);
        }
      }
    }
  },

  async getSettings(): Promise<NotificationSettings> {
    try {
      const raw = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (!raw) {
        return { ...DEFAULT_NOTIFICATION_SETTINGS };
      }
      const parsed = JSON.parse(raw) as Partial<NotificationSettings>;
      return { ...DEFAULT_NOTIFICATION_SETTINGS, ...parsed };
    } catch {
      return { ...DEFAULT_NOTIFICATION_SETTINGS };
    }
  },

  async setSettings(partial: Partial<NotificationSettings>) {
    const current = await notificationManager.getSettings();
    const next = { ...current, ...partial };
    await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(next));
    return next;
  },

  async getPermissionStatus(): Promise<Notifications.PermissionStatus> {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  },

  async requestPermission(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    return status === "granted";
  },

  async sendRoomInviteNotification(invite: RoomInvite) {
    const settings = await notificationManager.getSettings();
    if (!settings.enabled || !settings.systemNotification) {
      return;
    }

    const payload = roomInviteToPayload(invite);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "联机邀请",
        body: `${invite.senderUsername} 邀请你加入房间 ${invite.roomCode}`,
        data: {
          type: "room_invite",
          ...payload,
        },
        sound: true,
        badge: 1,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        ...(Platform.OS === "android"
          ? { channelId: ROOM_INVITE_CHANNEL_ID }
          : {}),
      },
      trigger: null,
    });
  },

  async clearAllNotifications() {
    await Notifications.dismissAllNotificationsAsync();
    await Notifications.setBadgeCountAsync(0);
  },
};

/** @deprecated 使用 getSettings/setSettings */
export type NotificationMode = "popup" | "background" | "disabled";

export async function migrateLegacyNotificationMode() {
  const legacy = await AsyncStorage.getItem("notification_mode");
  if (!legacy || (await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY))) {
    return;
  }
  if (legacy === "disabled") {
    await notificationManager.setSettings({
      enabled: false,
      systemNotification: false,
      foregroundPopup: false,
    });
  } else if (legacy === "background") {
    await notificationManager.setSettings({
      enabled: true,
      systemNotification: true,
      foregroundPopup: false,
      openInviteOnTap: true,
    });
  }
}
