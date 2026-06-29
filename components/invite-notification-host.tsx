/**
 * 登录后轮询联机邀请：前台弹窗 + 系统通知 + 后台任务
 */

import { useCallback, useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useRouter } from "expo-router";

import { NotificationModal } from "@/components/notification-modal";
import { useAuth } from "@/lib/auth-context";
import { useNotification } from "@/lib/notification-context";
import {
  INVITE_POLL_INTERVAL_MS,
  markInviteNotified,
  pollNewRoomInvites,
  resetInviteNotificationState,
} from "@/lib/invite-notification-poller";
import {
  notificationManager,
  type InviteNotificationTapPayload,
} from "@/lib/notification-manager";
import {
  registerBackgroundInvitePolling,
  unregisterBackgroundInvitePolling,
} from "@/lib/background-invite-task";
import type { RoomInvite } from "@/lib/_core/booxin-api";

export function InviteNotificationHost() {
  const { state } = useAuth();
  const { pendingInvite, showInviteNotification, dismissInviteNotification } = useNotification();
  const router = useRouter();
  const queueRef = useRef<RoomInvite[]>([]);
  const showingRef = useRef(false);
  const pollingRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const presentNextInvite = useCallback(() => {
    if (showingRef.current || queueRef.current.length === 0) {
      return;
    }

    const next = queueRef.current.shift();
    if (!next) {
      return;
    }

    showingRef.current = true;
    showInviteNotification(next);
  }, [showInviteNotification]);

  const maybeShowForegroundPopup = useCallback(
    async (invite: RoomInvite) => {
      const settings = await notificationManager.getSettings();
      if (!settings.enabled || !settings.foregroundPopup) {
        return;
      }
      if (appStateRef.current !== "active") {
        return;
      }
      queueRef.current.push(invite);
      if (!showingRef.current && !pendingInvite) {
        presentNextInvite();
      }
    },
    [pendingInvite, presentNextInvite]
  );

  const handleIncomingInvites = useCallback(
    async (invites: RoomInvite[]) => {
      if (invites.length === 0) {
        return;
      }

      const settings = await notificationManager.getSettings();
      if (!settings.enabled) {
        return;
      }

      for (const invite of invites) {
        await markInviteNotified(invite.inviteId);

        if (settings.systemNotification) {
          await notificationManager.sendRoomInviteNotification(invite);
        }

        await maybeShowForegroundPopup(invite);
      }
    },
    [maybeShowForegroundPopup]
  );

  const runPoll = useCallback(async () => {
    if (!state.userToken || pollingRef.current) {
      return;
    }

    pollingRef.current = true;
    try {
      const newInvites = await pollNewRoomInvites();
      await handleIncomingInvites(newInvites);
    } catch (error) {
      console.error("[InvitePoll] failed:", error);
    } finally {
      pollingRef.current = false;
    }
  }, [handleIncomingInvites, state.userToken]);

  const openInviteFromPayload = useCallback(
    (payload: InviteNotificationTapPayload) => {
      const invite = notificationManager.payloadToRoomInvite(payload);
      showingRef.current = true;
      showInviteNotification(invite);
      router.push("/(tabs)/friends");
    },
    [router, showInviteNotification]
  );

  useEffect(() => {
    if (!state.userToken) {
      queueRef.current = [];
      showingRef.current = false;
      dismissInviteNotification();
      void unregisterBackgroundInvitePolling();
      return;
    }

    void notificationManager.initialize();
    void registerBackgroundInvitePolling();
    void runPoll();

    const interval = setInterval(runPoll, INVITE_POLL_INTERVAL_MS);
    const appStateSub = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      appStateRef.current = nextState;
      if (nextState === "active") {
        void runPoll();
      }
    });

    const tapUnsub = notificationManager.subscribeInviteTap((payload) => {
      openInviteFromPayload(payload);
    });

    return () => {
      clearInterval(interval);
      appStateSub.remove();
      tapUnsub();
    };
  }, [dismissInviteNotification, openInviteFromPayload, runPoll, state.userToken]);

  useEffect(() => {
    if (!state.userToken) {
      void resetInviteNotificationState();
    }
  }, [state.userToken]);

  const handleDismissModal = useCallback(() => {
    dismissInviteNotification();
    showingRef.current = false;
    presentNextInvite();
  }, [dismissInviteNotification, presentNextInvite]);

  const handleViewInvites = useCallback(() => {
    dismissInviteNotification();
    showingRef.current = false;
    router.push("/(tabs)/friends");
    presentNextInvite();
  }, [dismissInviteNotification, presentNextInvite, router]);

  return (
    <NotificationModal
      visible={pendingInvite != null}
      invite={pendingInvite}
      onDismiss={handleDismissModal}
      onViewInvites={handleViewInvites}
    />
  );
}
