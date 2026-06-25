/**
 * 用户大厅 — 浏览全站用户、发送好友申请
 * 卡片式设计
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
import { glassColors, glassInputStyle } from "@/lib/glass-theme";

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

          {item.isFriend ? (
            <View style={{ backgroundColor: "rgba(52, 211, 153, 0.12)", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ color: glassColors.success, fontSize: 12, fontWeight: "600" }}>
                已是好友
              </Text>
            </View>
          ) : requestSent ? (
            <View style={{ backgroundColor: "rgba(251, 191, 36, 0.12)", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ color: glassColors.warning, fontSize: 12, fontWeight: "600" }}>
                申请已发送
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => handleAddFriend(item.id, item.username)}
              style={{ backgroundColor: "rgba(85, 184, 232, 0.15)", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
            >
              <Text style={{ color: glassColors.primary, fontWeight: "600", fontSize: 13 }}>
                加好友
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </GlassCard>
    );
  };

  return (
    <ScreenContainer className="flex-1 px-4 pt-4">
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: glassColors.text, fontSize: 26, fontWeight: "800" }}>用户大厅</Text>
        <Text style={{ color: glassColors.textSecondary, fontSize: 13, marginTop: 4 }}>
          浏览全站用户并发送好友申请
        </Text>
      </View>

      <TextInput
        placeholder="搜索用户..."
        placeholderTextColor={glassColors.textSecondary}
        value={search}
        onChangeText={setSearch}
        style={[glassInputStyle, { marginBottom: 16 }]}
      />

      {loading && !refreshing ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={glassColors.primary} />
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
              tintColor={glassColors.primary}
            />
          }
          ListEmptyComponent={
            <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 48 }}>
              <Text style={{ color: glassColors.textSecondary }}>暂无用户</Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}
