/**
 * 好友列表 — 好友、申请、联机邀请
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
      <View className="flex-row justify-between items-center">
        <View className="flex-1">
          <Text className="text-white font-semibold">{item.username}</Text>
          <Text className="text-white/60 text-xs">
            {item.isOnline ? "🟢 在线" : "⚫ 离线"}
            {item.isInRoom ? " · 在房间" : ""}
          </Text>
        </View>
      </View>
    </GlassCard>
  );

  const renderRequest = ({ item }: { item: FriendRequest }) => (
    <GlassCard className="mb-3 p-4">
      <View className="mb-3">
        <Text className="text-white font-semibold">{item.username}</Text>
        <Text className="text-white/60 text-xs">请求添加您为好友</Text>
      </View>
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={() => handleRejectRequest(item.requestId)}
          className="flex-1 bg-red-500/30 rounded-lg py-2 items-center"
        >
          <Text className="text-red-300 font-semibold text-sm">拒绝</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleAcceptRequest(item.requestId)}
          className="flex-1 bg-green-500/30 rounded-lg py-2 items-center"
        >
          <Text className="text-green-300 font-semibold text-sm">同意</Text>
        </TouchableOpacity>
      </View>
    </GlassCard>
  );

  const renderInvite = ({ item }: { item: RoomInvite }) => (
    <GlassCard className="mb-3 p-4">
      <View className="mb-3">
        <Text className="text-white font-semibold">{item.senderUsername}</Text>
        <Text className="text-white/60 text-xs mb-2">邀请您加入房间</Text>
        <Text className="text-white text-sm">
          房间码: <Text className="font-mono">{item.roomCode}</Text>
        </Text>
        {item.modpackGameVersion ? (
          <Text className="text-white/60 text-xs mt-1">
            {item.modpackGameVersion} • {item.modpackLoader}
          </Text>
        ) : null}
        <Text className="text-blue-200 text-xs mt-2">
          请在 PC 启动器输入房间码加入
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => handleDismissInvite(item.inviteId)}
        className="bg-gray-500/30 rounded-lg py-2 items-center"
      >
        <Text className="text-gray-300 font-semibold text-sm">忽略</Text>
      </TouchableOpacity>
    </GlassCard>
  );

  const friends = data?.friends ?? [];
  const requests = data?.incomingRequests ?? [];
  const invites = data?.pendingRoomInvites ?? [];

  return (
    <ScreenContainer className="flex-1 px-4 pt-4">
      <View className="flex-row gap-2 mb-6">
        {(["friends", "requests", "invites"] as const).map((t) => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} className="flex-1">
            <GlassCard
              variant="nav"
              showDispersion={false}
              className="py-2"
              style={{
                opacity: tab === t ? 1 : 0.72,
                borderColor: tab === t ? glassColors.border : glassColors.borderSubtle,
              }}
            >
              <Text
                className="text-center font-semibold text-sm"
                style={{
                  color: tab === t ? glassColors.text : glassColors.textSecondary,
                }}
              >
              {t === "friends"
                ? `好友 (${friends.length})`
                : t === "requests"
                  ? `申请 (${requests.length})`
                  : `邀请 (${invites.length})`}
            </Text>
            </GlassCard>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="white" />
        </View>
      ) : tab === "friends" ? (
        <FlatList
          data={friends}
          renderItem={renderFriend}
          keyExtractor={(item) => item.userId}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="white"
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-white/60">暂无好友</Text>
            </View>
          }
        />
      ) : tab === "requests" ? (
        <FlatList
          data={requests}
          renderItem={renderRequest}
          keyExtractor={(item) => item.requestId}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="white"
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-white/60">暂无好友申请</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={invites}
          renderItem={renderInvite}
          keyExtractor={(item) => item.inviteId}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="white"
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-white/60">暂无邀请</Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}
