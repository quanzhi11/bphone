/**
 * 登录后轮询联机邀请，弹出应用内通知 + 本地推送。
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
import { notificationManager } from "@/lib/notification-manager";
import type { RoomInvite } from "@/lib/_core/booxin-api";

export function InviteNotificationHost() {
  const { state } = useAuth();
  const { pendingInvite, showInviteNotification, dismissInviteNotification } =
    useNotification();
  const router = useRouter();
  const queueRef = useRef<RoomInvite[]>([]);
  const showingRef = useRef(false);
  const pollingRef = useRef(false);

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

  const enqueueInvites = useCallback(
    async (invites: RoomInvite[]) => {
      if (invites.length === 0) {
        return;
      }

      for (const invite of invites) {
        await markInviteNotified(invite.inviteId);
        queueRef.current.push(invite);

        const mode = await notificationManager.getNotificationMode();
        if (mode !== "disabled") {
          await notificationManager.sendLocalNotification(
            "联机邀请",
            `${invite.senderUsername} 邀请你加入房间 ${invite.roomCode}`,
            {
              type: "room_invite",
              inviteId: invite.inviteId,
              roomCode: invite.roomCode,
            }
          );
        }
      }

      if (!showingRef.current && !pendingInvite) {
        presentNextInvite();
      }
    },
    [pendingInvite, presentNextInvite]
  );

  const runPoll = useCallback(async () => {
    if (!state.userToken || pollingRef.current) {
      return;
    }

    pollingRef.current = true;
    try {
      const newInvites = await pollNewRoomInvites();
      await enqueueInvites(newInvites);
    } catch (error) {
      console.error("[InvitePoll] failed:", error);
    } finally {
      pollingRef.current = false;
    }
  }, [enqueueInvites, state.userToken]);

  useEffect(() => {
    if (!state.userToken) {
      queueRef.current = [];
      showingRef.current = false;
      dismissInviteNotification();
      return;
    }

    void notificationManager.initialize();
    void runPoll();

    const interval = setInterval(runPoll, INVITE_POLL_INTERVAL_MS);
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (nextState === "active") {
          void runPoll();
        }
      }
    );

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [dismissInviteNotification, runPoll, state.userToken]);

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
