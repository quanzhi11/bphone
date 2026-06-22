/**
 * 好友列表屏幕 - 液态玻璃设计
 */

import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "@/components/screen-container";
import { GlassCard } from "@/components/glassmorphism";
import { useAuth } from "@/lib/auth-context";
import { friendsApi, type Friend } from "@/lib/_core/booxin-api";

export default function FriendsScreen() {
  const { state } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFriends = async () => {
      if (!state.userToken) return;
      try {
        setLoading(true);
        const data = await friendsApi.getFriendsDashboard();
        setFriends((data as any).friends || []);
      } catch (error) {
        console.error("Failed to fetch friends:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [state.userToken]);

  const renderFriend = ({ item }: { item: Friend }) => (
    <GlassCard className="mb-3 p-4">
      <View className="flex-row justify-between items-center">
        <View className="flex-1">
          <Text className="text-white font-semibold">{item.username}</Text>
          <Text className="text-white/60 text-xs">
            {item.isOnline ? "在线" : "离线"}
            {item.isInRoom && ` · 在房间 ${item.roomCode}`}
          </Text>
        </View>
        <View
          className={`w-3 h-3 rounded-full ${
            item.isOnline ? "bg-green-400" : "bg-gray-400"
          }`}
        />
      </View>
    </GlassCard>
  );

  return (
    <LinearGradient
      colors={["rgba(59, 130, 246, 0.6)", "rgba(147, 51, 234, 0.6)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <ScreenContainer className="flex-1 px-4 pt-4">
        <View className="mb-6">
          <Text className="text-white text-3xl font-bold">好友</Text>
          <Text className="text-white/60 text-sm">{friends.length} 位好友</Text>
        </View>

        <FlatList
          data={friends}
          renderItem={renderFriend}
          keyExtractor={(item) => item.userId}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-white/60">暂无好友</Text>
            </View>
          }
        />
      </ScreenContainer>
    </LinearGradient>
  );
}
