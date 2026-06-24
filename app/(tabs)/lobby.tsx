/**
 * 用户大厅 — 浏览全站用户、发送好友申请
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { GlassCard } from "@/components/glassmorphism";
import { authApi, friendsApi, type User } from "@/lib/_core/booxin-api";
import { glassInputStyle } from "@/lib/glass-theme";

export default function LobbyScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pendingUserIds, setPendingUserIds] = useState<Set<string>>(new Set());
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [search]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await authApi.getLobbyUsers(1, 50, false, debouncedSearch);
      setUsers(data.users ?? []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  }, [fetchUsers]);

  const handleAddFriend = async (userId: string, username: string) => {
    if (pendingUserIds.has(userId)) {
      return;
    }

    try {
      setPendingUserIds((prev) => new Set(prev).add(userId));
      await friendsApi.sendFriendRequest(userId);
      Alert.alert("已发送", `已向 ${username} 发送好友申请`);
    } catch (error: unknown) {
      setPendingUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      Alert.alert("错误", "发送好友申请失败");
    }
  };

  const renderUser = ({ item }: { item: User }) => {
    const requestSent = pendingUserIds.has(item.id);

    return (
      <GlassCard className="mb-3 p-4">
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-1">
            <Text className="text-white font-semibold">{item.username}</Text>
            <Text className="text-white/60 text-xs">
              {item.isOnline ? "🟢 在线" : "⚫ 离线"}
              {item.isInRoom ? " · 在房间" : ""}
            </Text>
          </View>
        </View>

        {item.isFriend ? (
          <View className="bg-green-500/20 rounded-lg px-3 py-2">
            <Text className="text-green-300 text-xs font-semibold text-center">
              已是好友
            </Text>
          </View>
        ) : requestSent ? (
          <View className="bg-yellow-500/20 rounded-lg px-3 py-2">
            <Text className="text-yellow-200 text-xs font-semibold text-center">
              申请已发送
            </Text>
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
  };

  return (
    <ScreenContainer className="flex-1 px-4 pt-4">
      <View className="mb-6">
        <Text className="text-white text-3xl font-bold">用户大厅</Text>
        <Text className="text-white/60 text-sm">浏览全站用户并发送好友申请</Text>
      </View>

      <TextInput
        placeholder="搜索用户..."
        placeholderTextColor="rgba(160, 174, 200, 0.8)"
        value={search}
        onChangeText={setSearch}
        className="mb-6"
        style={glassInputStyle}
      />

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="white" />
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="white"
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-white/60">暂无用户</Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}
