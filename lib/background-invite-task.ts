/**
 * 后台轮询联机邀请（应用未打开时也能发系统通知）
 * 必须在应用入口 import，以便 TaskManager 注册任务。
 */

import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";

import {
  markInviteNotified,
  pollNewRoomInvites,
} from "@/lib/invite-notification-poller";
import { notificationManager } from "@/lib/notification-manager";
import { tokenManager } from "@/lib/_core/booxin-api";

export const BACKGROUND_INVITE_TASK = "booxin-background-invite-poll";

TaskManager.defineTask(BACKGROUND_INVITE_TASK, async () => {
  try {
    const settings = await notificationManager.getSettings();
    if (!settings.enabled || !settings.systemNotification) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const token = await tokenManager.getToken();
    if (!token || (await tokenManager.isTokenExpired())) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const newInvites = await pollNewRoomInvites();
    if (newInvites.length === 0) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    for (const invite of newInvites) {
      await markInviteNotified(invite.inviteId);
      await notificationManager.sendRoomInviteNotification(invite);
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error("[BackgroundInviteTask] failed:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundInvitePolling(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_INVITE_TASK);
  if (!isRegistered) {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_INVITE_TASK, {
      minimumInterval: 15 * 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  }
}

export async function unregisterBackgroundInvitePolling(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_INVITE_TASK);
  if (isRegistered) {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_INVITE_TASK);
  }
}
