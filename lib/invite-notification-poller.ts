/**
 * 联机邀请轮询：手机版仅作通知伴侣，不加入房间。
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { friendsApi, type RoomInvite } from "@/lib/_core/booxin-api";

const SEEN_INVITES_KEY = "booxin_seen_invite_ids";
const POLL_BASELINE_KEY = "booxin_invite_poll_baseline";

export const INVITE_POLL_INTERVAL_MS = 45_000;

async function loadSeenInviteIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(SEEN_INVITES_KEY);
    if (!raw) {
      return new Set();
    }
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

async function saveSeenInviteIds(ids: Set<string>) {
  await AsyncStorage.setItem(SEEN_INVITES_KEY, JSON.stringify([...ids]));
}

export async function resetInviteNotificationState() {
  await AsyncStorage.multiRemove([SEEN_INVITES_KEY, POLL_BASELINE_KEY]);
}

export async function markInviteNotified(inviteId: string) {
  const seen = await loadSeenInviteIds();
  seen.add(inviteId);
  await saveSeenInviteIds(seen);
}

/**
 * 拉取好友面板，返回尚未通知过的新邀请。
 * 首次登录后的第一次轮询只建立基线，不弹历史邀请。
 */
export async function pollNewRoomInvites(): Promise<RoomInvite[]> {
  const dashboard = await friendsApi.getFriendsDashboard();
  const invites = dashboard.pendingRoomInvites ?? [];
  const inviteIds = invites.map((item) => item.inviteId);

  const hasBaseline = (await AsyncStorage.getItem(POLL_BASELINE_KEY)) === "1";
  if (!hasBaseline) {
    await saveSeenInviteIds(new Set(inviteIds));
    await AsyncStorage.setItem(POLL_BASELINE_KEY, "1");
    return [];
  }

  const seen = await loadSeenInviteIds();
  return invites.filter((invite) => !seen.has(invite.inviteId));
}
