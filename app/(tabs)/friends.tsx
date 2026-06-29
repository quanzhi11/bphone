/**
 * 好友列表 — 好友、申请、联机邀请
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";

import { ScreenContainer } from "@/components/screen-container";
import { GlassCard } from "@/components/glassmorphism";
import { UserAvatar } from "@/components/user-avatar";
import { useAuth } from "@/lib/auth-context";
import {
  authApi,
  friendsApi,
  formatApiError,
  type FriendsDashboard,
  type FriendRequest,
  type RoomInvite,
  type Friend,
  type User,
} from "@/lib/_core/booxin-api";
import { glassColors, glassInputStyle, screenListStyle } from "@/lib/glass-theme";
import * as Haptics from "expo-haptics";

const TAB_CONFIG = [
  { key: "friends" as const, label: "好友" },
  { key: "requests" as const, label: "申请" },
  { key: "invites" as const, label: "邀请" },
] as const;

const POLL_INTERVAL_MS = 15000;

function friendStatusText(friend: Friend): string {
  const parts: string[] = [];
  parts.push(friend.isOnline ? "在线" : "离线");
  if (friend.isInRoom) {
    parts.push("在房间");
    if (friend.roomCode) {
      parts.push(`房间码 ${friend.roomCode}`);
    }
  }
  if (friend.modpackGameVersion) {
    parts.push(`${friend.modpackGameVersion} · ${friend.modpackLoader ?? ""}`.trim());
  }
  return parts.join(" · ");
}

export default function FriendsScreen() {
  const router = useRouter();
  const { state } = useAuth();
  const apiRoot = state.authApiRoot;

  const [tab, setTab] = useState<"friends" | "requests" | "invites">("friends");
  const [data, setData] = useState<FriendsDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async () => {
    if (!state.userToken) {
      return;
    }
    try {
      setLoading(true);
      setStatusMessage(null);
      const result = await friendsApi.getFriendsDashboard();
      setData(result);
    } catch (error) {
      setStatusMessage(formatApiError(error, "加载好友数据失败"));
    } finally {
      setLoading(false);
    }
  }, [state.userToken]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      void fetchData();
      const timer = setInterval(() => {
        void fetchData();
      }, POLL_INTERVAL_MS);
      return () => clearInterval(timer);
    }, [fetchData])
  );

  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    searchTimerRef.current = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const result = await authApi.searchUsers(query, 15);
        setSearchResults(result.users ?? result.results ?? []);
      } catch (error) {
        setSearchResults([]);
        setStatusMessage(formatApiError(error, "搜索用户失败"));
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [searchQuery]);

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await friendsApi.acceptFriendRequest(requestId);
      Alert.alert("成功", "已接受好友申请");
      await fetchData();
    } catch (error) {
      Alert.alert("错误", formatApiError(error, "处理申请失败"));
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await friendsApi.rejectFriendRequest(requestId);
      Alert.alert("成功", "已拒绝好友申请");
      await fetchData();
    } catch (error) {
      Alert.alert("错误", formatApiError(error, "处理申请失败"));
    }
  };

  const handleDeleteFriend = (friend: Friend) => {
    Alert.alert("移除好友", `确定移除 ${friend.username} 吗？`, [
      { text: "取消", style: "cancel" },
      {
        text: "移除",
        style: "destructive",
        onPress: async () => {
          try {
            await friendsApi.deleteFriend(friend.userId);
            await fetchData();
          } catch (error) {
            Alert.alert("错误", formatApiError(error, "移除好友失败"));
          }
        },
      },
    ]);
  };

  const handleAddSearchResult = async (user: User) => {
    if (user.isFriend || user.hasPendingOutgoingRequest) {
      return;
    }
    try {
      await friendsApi.sendFriendRequest(user.id);
      Alert.alert("已发送", `已向 ${user.username} 发送好友申请`);
      setSearchResults((prev) =>
        prev.map((item) =>
          item.id === user.id ? { ...item, hasPendingOutgoingRequest: true } : item
        )
      );
    } catch (error) {
      Alert.alert("错误", formatApiError(error, "发送好友申请失败"));
    }
  };

  const handleCopyRoomCode = async (roomCode: string) => {
    await Clipboard.setStringAsync(roomCode);
    Alert.alert("已复制", `房间码 ${roomCode} 已复制，请在 PC 启动器加入`);
  };

  const handleDismissInvite = async (inviteId: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await friendsApi.dismissRoomInvite(inviteId);
      await fetchData();
    } catch (error) {
      Alert.alert("错误", formatApiError(error, "处理邀请失败"));
    }
  };

  const handleOpenChat = (friend: Friend) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const query = new URLSearchParams({
      username: friend.username,
      avatarUrl: friend.avatarUrl ?? "",
    });
    router.push(`/chat/${friend.userId}?${query.toString()}`);
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <GlassCard className="mb-3 p-4">
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 12 }}>
          <UserAvatar avatarUrl={item.avatarUrl} apiRoot={apiRoot} size={44} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: glassColors.text, fontWeight: "600", fontSize: 15 }}>{item.username}</Text>
            <Text style={{ color: glassColors.textSecondary, fontSize: 12, marginTop: 2 }}>{friendStatusText(item)}</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            onPress={() => handleOpenChat(item)}
            style={{ backgroundColor: "rgba(85, 184, 232, 0.15)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
          >
            <Text style={{ color: glassColors.primary, fontSize: 12, fontWeight: "600" }}>私聊</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteFriend(item)}
            style={{ backgroundColor: "rgba(248, 113, 113, 0.12)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
          >
            <Text style={{ color: glassColors.danger, fontSize: 12, fontWeight: "600" }}>移除</Text>
          </TouchableOpacity>
        </View>
      </View>
    </GlassCard>
  );

  const renderRequest = ({ item }: { item: FriendRequest }) => (
    <GlassCard className="mb-3 p-4">
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <UserAvatar avatarUrl={item.avatarUrl} apiRoot={apiRoot} size={44} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: glassColors.text, fontWeight: "600", fontSize: 15 }}>{item.username}</Text>
          <Text style={{ color: glassColors.textSecondary, fontSize: 12, marginTop: 2 }}>请求添加您为好友</Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <TouchableOpacity
          onPress={() => handleRejectRequest(item.requestId)}
          style={{ flex: 1, backgroundColor: "rgba(248, 113, 113, 0.12)", borderRadius: 8, paddingVertical: 8, alignItems: "center" }}
        >
          <Text style={{ color: glassColors.danger, fontWeight: "600", fontSize: 13 }}>拒绝</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleAcceptRequest(item.requestId)}
          style={{ flex: 1, backgroundColor: "rgba(52, 211, 153, 0.12)", borderRadius: 8, paddingVertical: 8, alignItems: "center" }}
        >
          <Text style={{ color: glassColors.success, fontWeight: "600", fontSize: 13 }}>同意</Text>
        </TouchableOpacity>
      </View>
    </GlassCard>
  );

  const renderInvite = ({ item }: { item: RoomInvite }) => (
    <GlassCard className="mb-3 p-4">
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
        <UserAvatar avatarUrl={item.senderAvatarUrl} apiRoot={apiRoot} size={44} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: glassColors.text, fontWeight: "600", fontSize: 15 }}>{item.senderUsername}</Text>
          <Text style={{ color: glassColors.textSecondary, fontSize: 12, marginTop: 2, marginBottom: 6 }}>
            邀请您加入房间
          </Text>
          <Text style={{ color: glassColors.text, fontSize: 14 }}>
            房间码: <Text style={{ fontFamily: "monospace" }}>{item.roomCode}</Text>
          </Text>
          {item.modpackGameVersion ? (
            <Text style={{ color: glassColors.textSecondary, fontSize: 12, marginTop: 4 }}>
              {item.modpackGameVersion} · {item.modpackLoader}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <TouchableOpacity
          onPress={() => handleCopyRoomCode(item.roomCode)}
          style={{ flex: 1, backgroundColor: "rgba(85, 184, 232, 0.15)", borderRadius: 8, paddingVertical: 8, alignItems: "center" }}
        >
          <Text style={{ color: glassColors.primary, fontWeight: "600", fontSize: 13 }}>复制房间码</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDismissInvite(item.inviteId)}
          style={{ flex: 1, backgroundColor: "rgba(255, 255, 255, 0.06)", borderRadius: 8, paddingVertical: 8, alignItems: "center" }}
        >
          <Text style={{ color: glassColors.textSecondary, fontWeight: "600", fontSize: 13 }}>忽略</Text>
        </TouchableOpacity>
      </View>
    </GlassCard>
  );

  const renderSearchResult = ({ item }: { item: User }) => (
    <GlassCard className="mb-3 p-4">
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 12 }}>
          <UserAvatar avatarUrl={item.avatarUrl} apiRoot={apiRoot} size={44} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: glassColors.text, fontWeight: "600", fontSize: 15 }}>{item.username}</Text>
            <Text style={{ color: glassColors.textSecondary, fontSize: 12, marginTop: 2 }}>
              {item.isOnline ? "在线" : "离线"}
            </Text>
          </View>
        </View>
        {item.isFriend ? (
          <Text style={{ color: glassColors.success, fontSize: 12, fontWeight: "600" }}>已是好友</Text>
        ) : item.hasPendingOutgoingRequest ? (
          <Text style={{ color: glassColors.warning, fontSize: 12, fontWeight: "600" }}>已申请</Text>
        ) : (
          <TouchableOpacity
            onPress={() => handleAddSearchResult(item)}
            style={{ backgroundColor: "rgba(85, 184, 232, 0.15)", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
          >
            <Text style={{ color: glassColors.primary, fontWeight: "600", fontSize: 13 }}>加好友</Text>
          </TouchableOpacity>
        )}
      </View>
    </GlassCard>
  );

  const friends = data?.friends ?? [];
  const requests = data?.incomingRequests ?? [];
  const invites = data?.pendingRoomInvites ?? [];

  const tabCounts = {
    friends: friends.length,
    requests: requests.length,
    invites: invites.length,
  };

  const showSearchResults = searchQuery.trim().length >= 2;

  return (
    <ScreenContainer style={{ paddingHorizontal: 16, paddingTop: 16 }}>
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: glassColors.text, fontSize: 26, fontWeight: "800" }}>好友</Text>
        <Text style={{ color: glassColors.textSecondary, fontSize: 13, marginTop: 4 }}>
          搜索账号、管理好友与联机邀请
        </Text>
      </View>

      <TextInput
        placeholder="搜索用户（至少 2 个字符）..."
        placeholderTextColor={glassColors.textSecondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={[glassInputStyle, { marginBottom: 12 }]}
      />

      {statusMessage ? (
        <Text style={{ color: glassColors.warning, fontSize: 12, marginBottom: 8 }}>{statusMessage}</Text>
      ) : null}

      {showSearchResults ? (
        searchLoading ? (
          <ActivityIndicator size="small" color={glassColors.primary} style={{ marginBottom: 12 }} />
        ) : (
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => `search-${item.id}`}
            ListEmptyComponent={
              <Text style={{ color: glassColors.textSecondary, textAlign: "center", paddingVertical: 24 }}>
                未找到匹配用户
              </Text>
            }
            style={{ maxHeight: 280, marginBottom: 12, backgroundColor: glassColors.bgPrimary }}
          />
        )
      ) : null}

      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
        {TAB_CONFIG.map((t) => {
          const isActive = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              style={{
                flex: 1,
                backgroundColor: isActive ? "rgba(85, 184, 232, 0.15)" : glassColors.cardBg,
                borderRadius: 10,
                paddingVertical: 8,
                alignItems: "center",
                borderWidth: 1,
                borderColor: isActive ? "rgba(85, 184, 232, 0.3)" : glassColors.cardBorder,
              }}
            >
              <Text
                style={{
                  color: isActive ? glassColors.primary : glassColors.textSecondary,
                  fontWeight: "600",
                  fontSize: 13,
                }}
              >
                {t.label} ({tabCounts[t.key]})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading && !refreshing ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={glassColors.primary} />
        </View>
      ) : tab === "friends" ? (
        <FlatList
          data={friends}
          renderItem={renderFriend}
          keyExtractor={(item) => item.userId}
          style={screenListStyle}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={glassColors.primary} />
          }
          ListEmptyComponent={
            <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 48 }}>
              <Text style={{ color: glassColors.textSecondary }}>暂无好友</Text>
            </View>
          }
        />
      ) : tab === "requests" ? (
        <FlatList
          data={requests}
          renderItem={renderRequest}
          keyExtractor={(item) => item.requestId}
          style={screenListStyle}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={glassColors.primary} />
          }
          ListEmptyComponent={
            <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 48 }}>
              <Text style={{ color: glassColors.textSecondary }}>暂无好友申请</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={invites}
          renderItem={renderInvite}
          keyExtractor={(item) => item.inviteId}
          style={screenListStyle}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={glassColors.primary} />
          }
          ListEmptyComponent={
            <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 48 }}>
              <Text style={{ color: glassColors.textSecondary }}>暂无邀请</Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}
