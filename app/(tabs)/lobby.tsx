/**
 * 用户大厅屏幕 - 液态玻璃设计
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "@/components/screen-container";
import { GlassCard } from "@/components/glassmorphism";
import { authApi, friendsApi, type User } from "@/lib/_core/booxin-api";

export default function LobbyScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await authApi.getLobbyUsers(1, 50, false, search);
        setUsers(data.users || []);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [search]);

  const handleAddFriend = async (userId: string, username: string) => {
    try {
      await friendsApi.sendFriendRequest(userId);
      alert(`已向 ${username} 发送好友申请`);
    } catch (error) {
      alert("发送好友申请失败");
    }
  };

  const renderUser = ({ item }: { item: User }) => (
    <GlassCard className="mb-3 p-4">
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-1">
          <Text className="text-white font-semibold">{item.username}</Text>
          <Text className="text-white/60 text-xs">
            {item.isOnline ? "🟢 在线" : "⚫ 离线"}
            {item.isInRoom && " · 在房间"}
          </Text>
        </View>
      </View>

      {item.isFriend ? (
        <View className="bg-green-500/20 rounded-lg px-3 py-2">
          <Text className="text-green-300 text-xs font-semibold">已是好友</Text>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => handleAddFriend(item.id, item.username)}
          className="bg-blue-500/50 rounded-lg px-3 py-2"
        >
          <Text className="text-white font-semibold text-sm text-center">
            加好友
          </Text>
        </TouchableOpacity>
      )}
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
          <Text className="text-white text-3xl font-bold">用户大厅</Text>
          <Text className="text-white/60 text-sm">发现并添加新好友</Text>
        </View>

        {/* 搜索框 */}
        <TextInput
          placeholder="搜索用户..."
          placeholderTextColor="rgba(255, 255, 255, 0.4)"
          value={search}
          onChangeText={setSearch}
          className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white mb-6"
          style={{
            color: "white",
            borderColor: "rgba(255, 255, 255, 0.2)",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
          }}
        />

        {/* 用户列表 */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="white" />
          </View>
        ) : (
          <FlatList
            data={users}
            renderItem={renderUser}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <View className="items-center justify-center py-12">
                <Text className="text-white/60">暂无用户</Text>
              </View>
            }
          />
        )}
      </ScreenContainer>
    </LinearGradient>
  );
}
