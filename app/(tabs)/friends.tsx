/**
 * 好友列表屏幕
 * 
 * 显示好友、好友申请、房间邀请
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { NotificationModal } from "@/components/notification-modal";
import { useColors } from "@/hooks/use-colors";
import { useNotification } from "@/lib/notification-context";
import {
  friendsApi,
  Friend,
  FriendRequest,
  RoomInvite,
} from "@/lib/_core/booxin-api";
import * as Haptics from "expo-haptics";

type TabType = "friends" | "requests" | "invites";

export default function FriendsScreen() {
  const colors = useColors();
  const { pendingInvite, dismissInviteNotification } = useNotification();
  const [activeTab, setActiveTab] = useState<TabType>("friends");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [roomInvites, setRoomInvites] = useState<RoomInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取好友数据
  const fetchFriendsData = useCallback(async () => {
    try {
      setError(null);
      const data = await friendsApi.getDashboard();
      setFriends(data.friends || []);
      setIncomingRequests(data.incomingRequests || []);
      setOutgoingRequests(data.outgoingRequests || []);
      setRoomInvites(data.pendingRoomInvites || []);
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || "获取好友数据失败";
      setError(message);
      console.error("Fetch friends error:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    fetchFriendsData();

    // 定时刷新（30 秒）
    const interval = setInterval(fetchFriendsData, 30000);
    return () => clearInterval(interval);
  }, [fetchFriendsData]);

  // 下拉刷新
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchFriendsData();
  }, [fetchFriendsData]);

  // 同意好友申请
  const handleAcceptRequest = useCallback(
    async (requestId: string) => {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await friendsApi.acceptRequest(requestId);
        await fetchFriendsData();
      } catch (err) {
        Alert.alert("错误", "同意申请失败");
      }
    },
    [fetchFriendsData]
  );

  // 拒绝好友申请
  const handleRejectRequest = useCallback(
    async (requestId: string) => {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await friendsApi.rejectRequest(requestId);
        await fetchFriendsData();
      } catch (err) {
        Alert.alert("错误", "拒绝申请失败");
      }
    },
    [fetchFriendsData]
  );

  // 处理房间邀请
  const handleDismissInvite = useCallback(
    async (inviteId: string) => {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await friendsApi.dismissInvite(inviteId);
        await fetchFriendsData();
      } catch (err) {
        Alert.alert("错误", "处理邀请失败");
      }
    },
    [fetchFriendsData]
  );

  // 删除好友
  const handleRemoveFriend = useCallback(
    async (friendUserId: string, friendName: string) => {
      Alert.alert("删除好友", `确定要删除好友 ${friendName} 吗？`, [
        { text: "取消", style: "cancel" },
        {
          text: "删除",
          style: "destructive",
          onPress: async () => {
            try {
              await friendsApi.removeFriend(friendUserId);
              await fetchFriendsData();
            } catch (err) {
              Alert.alert("错误", "删除好友失败");
            }
          },
        },
      ]);
    },
    [fetchFriendsData]
  );

  // 好友卡片
  const FriendCard = ({ friend }: { friend: Friend }) => (
    <View className="bg-surface border border-border rounded-lg p-4 mb-3 flex-row justify-between items-center">
      <View className="flex-1">
        <Text className="text-base font-semibold text-foreground">
          {friend.username}
        </Text>
        <View className="flex-row mt-1 gap-2">
          <View
            className="px-2 py-1 rounded"
            style={{
              backgroundColor: friend.isOnline ? colors.success : colors.error,
              opacity: 0.1,
            }}
          >
            <Text
              className="text-xs font-semibold"
              style={{
                color: friend.isOnline ? colors.success : colors.error,
              }}
            >
              {friend.isOnline ? "在线" : "离线"}
            </Text>
          </View>
          {friend.isInRoom && (
            <View
              className="px-2 py-1 rounded"
              style={{
                backgroundColor: colors.primary,
                opacity: 0.1,
              }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: colors.primary }}
              >
                在房间: {friend.roomCode}
              </Text>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity
        onPress={() => handleRemoveFriend(friend.userId, friend.username)}
        className="ml-2 p-2"
      >
        <Text className="text-error font-semibold">删除</Text>
      </TouchableOpacity>
    </View>
  );

  // 好友申请卡片
  const RequestCard = ({ request }: { request: FriendRequest }) => (
    <View className="bg-surface border border-border rounded-lg p-4 mb-3">
      <Text className="text-base font-semibold text-foreground mb-2">
        {request.username}
      </Text>
      <Text className="text-xs text-muted mb-3">
        {new Date(request.createdAtUtc).toLocaleDateString()}
      </Text>
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={() => handleAcceptRequest(request.requestId)}
          className="flex-1 bg-success/10 border border-success rounded-lg py-2 items-center"
        >
          <Text className="text-success font-semibold">同意</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleRejectRequest(request.requestId)}
          className="flex-1 bg-error/10 border border-error rounded-lg py-2 items-center"
        >
          <Text className="text-error font-semibold">拒绝</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // 房间邀请卡片
  const InviteCard = ({ invite }: { invite: RoomInvite }) => (
    <View className="bg-surface border border-border rounded-lg p-4 mb-3">
      <View className="flex-row justify-between items-start mb-2">
        <View>
          <Text className="text-base font-semibold text-foreground">
            {invite.senderUsername}
          </Text>
          <Text className="text-sm text-muted">房间: {invite.roomCode}</Text>
        </View>
      </View>
      {invite.modpackGameVersion && (
        <Text className="text-xs text-muted mb-3">
          {invite.modpackGameVersion} • {invite.modpackLoader}
        </Text>
      )}
      <TouchableOpacity
        onPress={() => handleDismissInvite(invite.inviteId)}
        className="bg-error/10 border border-error rounded-lg py-2 items-center"
      >
        <Text className="text-error font-semibold">忽略</Text>
      </TouchableOpacity>
    </View>
  );

  // 标签页按钮
  const TabButton = ({ tab, label }: { tab: TabType; label: string }) => (
    <TouchableOpacity
      onPress={() => setActiveTab(tab)}
      className={`flex-1 py-3 items-center border-b-2 ${
        activeTab === tab ? "border-primary" : "border-border"
      }`}
    >
      <Text
        className={`font-semibold ${
          activeTab === tab ? "text-primary" : "text-muted"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <ScreenContainer className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (error && friends.length === 0) {
    return (
      <ScreenContainer className="flex-1 justify-center items-center p-6">
        <Text className="text-lg text-error text-center mb-4">{error}</Text>
        <TouchableOpacity
          onPress={handleRefresh}
          className="bg-primary px-6 py-2 rounded-lg"
        >
          <Text className="text-background font-semibold">重试</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <>
      <ScreenContainer className="flex-1 p-0">
        {/* 标签页 */}
        <View className="flex-row border-b border-border">
          <TabButton tab="friends" label={`好友 (${friends.length})`} />
          <TabButton
            tab="requests"
            label={`申请 (${incomingRequests.length})`}
          />
          <TabButton tab="invites" label={`邀请 (${roomInvites.length})`} />
        </View>

      {/* 内容 */}
      <View className="flex-1 px-4 pt-4">
        {activeTab === "friends" && (
          <FlatList
            data={friends}
            keyExtractor={(item) => item.userId}
            renderItem={({ item }) => <FriendCard friend={item} />}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center py-8">
                <Text className="text-lg text-muted">暂无好友</Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        {activeTab === "requests" && (
          <FlatList
            data={incomingRequests}
            keyExtractor={(item) => item.requestId}
            renderItem={({ item }) => <RequestCard request={item} />}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center py-8">
                <Text className="text-lg text-muted">暂无好友申请</Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        {activeTab === "invites" && (
          <FlatList
            data={roomInvites}
            keyExtractor={(item) => item.inviteId}
            renderItem={({ item }) => <InviteCard invite={item} />}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center py-8">
                <Text className="text-lg text-muted">暂无房间邀请</Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
      </ScreenContainer>

      {/* 通知弹窗 */}
      <NotificationModal
        visible={!!pendingInvite}
        invite={pendingInvite}
        onDismiss={dismissInviteNotification}
        onAccept={() => {
          // 刷新好友数据
          fetchFriendsData();
        }}
      />
    </>
  );
}
