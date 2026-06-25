/**
 * 好友列表 — 好友、申请、联机邀请
 * 卡片式设计
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { GlassCard } from "@/components/glassmorphism";
import { useAuth } from "@/lib/auth-context";
import {
  friendsApi,
  type FriendsDashboard,
  type FriendRequest,
  type RoomInvite,
  type Friend,
} from "@/lib/_core/booxin-api";
import { glassColors } from "@/lib/glass-theme";
import * as Haptics from "expo-haptics";

const TAB_CONFIG = [
  { key: "friends" as const, label: "好友" },
  { key: "requests" as const, label: "申请" },
  { key: "invites" as const, label: "邀请" },
] as const;

export default function FriendsScreen() {
  const { state } = useAuth();
  const [tab, setTab] = useState<"friends" | "requests" | "invites">("friends");
  const [data, setData] = useState<FriendsDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!state.userToken) {
      return;
    }
    try {
      setLoading(true);
      const result = await friendsApi.getFriendsDashboard();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch friends data:", error);
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
    }, [fetchData])
  );

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await friendsApi.acceptFriendRequest(requestId);
      Alert.alert("成功", "已接受好友申请");
      await fetchData();
    } catch {
      Alert.alert("错误", "处理申请失败");
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await friendsApi.rejectFriendRequest(requestId);
      Alert.alert("成功", "已拒绝好友申请");
      await fetchData();
    } catch {
      Alert.alert("错误", "处理申请失败");
    }
  };

  const handleDismissInvite = async (inviteId: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await friendsApi.dismissRoomInvite(inviteId);
      Alert.alert("成功", "已忽略邀请");
      await fetchData();
    } catch {
      Alert.alert("错误", "处理邀请失败");
    }
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <GlassCard className="mb-3 p-4">
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: glassColors.text, fontWeight: "600", fontSize: 15 }}>
            {item.username}
          </Text>
          <Text style={{ color: glassColors.textSecondary, fontSize: 12, marginTop: 2 }}>
            {item.isOnline ? "在线" : "离线"}
            {item.isInRoom ? " · 在房间" : ""}
          </Text>
        </View>
      </View>
    </GlassCard>
  );

  const renderRequest = ({ item }: { item: FriendRequest }) => (
    <GlassCard className="mb-3 p-4">
      <View style={{ marginBottom: 12 }}>
        <Text style={{ color: glassColors.text, fontWeight: "600", fontSize: 15 }}>
          {item.username}
        </Text>
        <Text style={{ color: glassColors.textSecondary, fontSize: 12, marginTop: 2 }}>
          请求添加您为好友
        </Text>
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
      <View style={{ marginBottom: 12 }}>
        <Text style={{ color: glassColors.text, fontWeight: "600", fontSize: 15 }}>
          {item.senderUsername}
        </Text>
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
        <Text style={{ color: glassColors.primary, fontSize: 12, marginTop: 6 }}>
          请在 PC 启动器输入房间码加入
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => handleDismissInvite(item.inviteId)}
        style={{ backgroundColor: "rgba(255, 255, 255, 0.06)", borderRadius: 8, paddingVertical: 8, alignItems: "center" }}
      >
        <Text style={{ color: glassColors.textSecondary, fontWeight: "600", fontSize: 13 }}>忽略</Text>
      </TouchableOpacity>
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

  return (
    <ScreenContainer className="flex-1 px-4 pt-4">
      {/* 页面标题 */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: glassColors.text, fontSize: 26, fontWeight: "800" }}>好友</Text>
      </View>

      {/* Tab 切换 */}
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

      {/* 列表 */}
      {loading && !refreshing ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={glassColors.primary} />
        </View>
      ) : tab === "friends" ? (
        <FlatList
          data={friends}
          renderItem={renderFriend}
          keyExtractor={(item) => item.userId}
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
