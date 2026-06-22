/**
 * 好友列表屏幕 - 包含好友、申请、邀请三个标签
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "@/components/screen-container";
import { GlassCard } from "@/components/glassmorphism";
import { useAuth } from "@/lib/auth-context";
import { friendsApi, type FriendsDashboard, type FriendRequest, type RoomInvite } from "@/lib/_core/booxin-api";
import * as Haptics from "expo-haptics";

export default function FriendsScreen() {
  const { state } = useAuth();
  const [tab, setTab] = useState<"friends" | "requests" | "invites">("friends");
  const [data, setData] = useState<FriendsDashboard | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!state.userToken) return;
    try {
      setLoading(true);
      const result = await friendsApi.getFriendsDashboard();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch friends data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [state.userToken]);

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await friendsApi.acceptFriendRequest(requestId);
      Alert.alert("成功", "已接受好友申请");
      await fetchData();
    } catch (error) {
      Alert.alert("错误", "处理申请失败");
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await friendsApi.rejectFriendRequest(requestId);
      Alert.alert("成功", "已拒绝好友申请");
      await fetchData();
    } catch (error) {
      Alert.alert("错误", "处理申请失败");
    }
  };

  const handleDismissInvite = async (inviteId: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await friendsApi.dismissRoomInvite(inviteId);
      Alert.alert("成功", "已忽略邀请");
      await fetchData();
    } catch (error) {
      Alert.alert("错误", "处理邀请失败");
    }
  };

  const renderFriend = ({ item }: any) => (
    <GlassCard className="mb-3 p-4">
      <View className="flex-row justify-between items-center">
        <View className="flex-1">
          <Text className="text-white font-semibold">{item.username}</Text>
          <Text className="text-white/60 text-xs">
            {item.isOnline ? "🟢 在线" : "⚫ 离线"}
            {item.isInRoom && ` · 在房间`}
          </Text>
        </View>
      </View>
    </GlassCard>
  );

  const renderRequest = ({ item }: any) => (
    <GlassCard className="mb-3 p-4">
      <View className="mb-3">
        <Text className="text-white font-semibold">{item.senderUsername}</Text>
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

  const renderInvite = ({ item }: any) => (
    <GlassCard className="mb-3 p-4">
      <View className="mb-3">
        <Text className="text-white font-semibold">{item.senderUsername}</Text>
        <Text className="text-white/60 text-xs mb-2">邀请您加入房间</Text>
        <Text className="text-white text-sm">
          房间码: <Text className="font-mono">{item.roomCode}</Text>
        </Text>
        {item.modpackGameVersion && (
          <Text className="text-white/60 text-xs mt-1">
            {item.modpackGameVersion} • {item.modpackLoader}
          </Text>
        )}
      </View>
      <TouchableOpacity
        onPress={() => handleDismissInvite(item.inviteId)}
        className="bg-gray-500/30 rounded-lg py-2 items-center"
      >
        <Text className="text-gray-300 font-semibold text-sm">忽略</Text>
      </TouchableOpacity>
    </GlassCard>
  );

  const friends = data?.friends || [];
  const requests = data?.incomingRequests || [];
  const invites = data?.pendingRoomInvites || [];

  return (
    <LinearGradient
      colors={["rgba(59, 130, 246, 0.6)", "rgba(147, 51, 234, 0.6)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <ScreenContainer className="flex-1 px-4 pt-4">
        {/* 标签栏 */}
        <View className="flex-row gap-2 mb-6">
          {["friends", "requests", "invites"].map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t as any)}
              className={`flex-1 py-2 rounded-lg ${
                tab === t
                  ? "bg-white/30 border border-white"
                  : "bg-white/10 border border-white/20"
              }`}
            >
              <Text
                className={`text-center font-semibold text-sm ${
                  tab === t ? "text-white" : "text-white/60"
                }`}
              >
                {t === "friends"
                  ? `好友 (${friends.length})`
                  : t === "requests"
                    ? `申请 (${requests.length})`
                    : `邀请 (${invites.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 内容 */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="white" />
          </View>
        ) : (
          <FlatList
            data={
              tab === "friends"
                ? friends
                : tab === "requests"
                  ? requests
                  : invites
            }
            renderItem={
              tab === "friends"
                ? renderFriend
                : tab === "requests"
                  ? renderRequest
                  : renderInvite
            }
            keyExtractor={(item: any) =>
              tab === "friends"
                ? item.userId
                : tab === "requests"
                  ? (item as FriendRequest).requestId
                  : (item as RoomInvite).inviteId
            }
            ListEmptyComponent={
              <View className="items-center justify-center py-12">
                <Text className="text-white/60">
                  {tab === "friends"
                    ? "暂无好友"
                    : tab === "requests"
                      ? "暂无好友申请"
                      : "暂无邀请"}
                </Text>
              </View>
            }
          />
        )}
      </ScreenContainer>
    </LinearGradient>
  );
}
