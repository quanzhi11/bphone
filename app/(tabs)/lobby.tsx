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
  Switch,
} from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { GlassCard } from "@/components/glassmorphism";
import { UserAvatar } from "@/components/user-avatar";
import { useAuth } from "@/lib/auth-context";
import { authApi, friendsApi, formatApiError, type User } from "@/lib/_core/booxin-api";
import { glassColors, glassInputStyle, screenListStyle } from "@/lib/glass-theme";

const PAGE_SIZE = 30;

export default function LobbyScreen() {
  const { state } = useAuth();
  const apiRoot = state.authApiRoot;

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
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
      setStatusMessage(null);
      const data = await authApi.getLobbyUsers(page, PAGE_SIZE, onlineOnly, debouncedSearch);
      setUsers(data.users ?? []);
      setTotalPages(data.totalPages ?? 0);
      setTotalCount(data.totalCount ?? 0);
    } catch (error) {
      setUsers([]);
      setStatusMessage(formatApiError(error, "加载用户大厅失败"));
    } finally {
      setLoading(false);
    }
  }, [page, onlineOnly, debouncedSearch]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  }, [fetchUsers]);

  const handleAddFriend = async (userId: string, username: string) => {
    try {
      await friendsApi.sendFriendRequest(userId);
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, hasPendingOutgoingRequest: true } : user
        )
      );
      Alert.alert("已发送", `已向 ${username} 发送好友申请`);
    } catch (error) {
      Alert.alert("错误", formatApiError(error, "发送好友申请失败"));
    }
  };

  const handleAcceptRequest = async (user: User) => {
    if (!user.pendingIncomingRequestId) {
      return;
    }
    try {
      await friendsApi.acceptFriendRequest(user.pendingIncomingRequestId);
      Alert.alert("成功", `已与 ${user.username} 成为好友`);
      await fetchUsers();
    } catch (error) {
      Alert.alert("错误", formatApiError(error, "接受好友申请失败"));
    }
  };

  const renderUser = ({ item }: { item: User }) => {
    const requestSent = item.hasPendingOutgoingRequest;
    const canAccept = item.hasPendingIncomingRequest && item.pendingIncomingRequestId;

    return (
      <GlassCard className="mb-3 p-4">
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 12 }}>
            <UserAvatar avatarUrl={item.avatarUrl} apiRoot={apiRoot} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: glassColors.text, fontWeight: "600", fontSize: 15 }}>{item.username}</Text>
              <Text style={{ color: glassColors.textSecondary, fontSize: 12, marginTop: 2 }}>
                {item.isOnline ? "在线" : "离线"}
                {item.isInRoom ? " · 在房间" : ""}
              </Text>
            </View>
          </View>

          {item.isFriend ? (
            <View style={{ backgroundColor: "rgba(52, 211, 153, 0.12)", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ color: glassColors.success, fontSize: 12, fontWeight: "600" }}>已是好友</Text>
            </View>
          ) : canAccept ? (
            <TouchableOpacity
              onPress={() => handleAcceptRequest(item)}
              style={{ backgroundColor: "rgba(52, 211, 153, 0.12)", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
            >
              <Text style={{ color: glassColors.success, fontWeight: "600", fontSize: 13 }}>同意</Text>
            </TouchableOpacity>
          ) : requestSent ? (
            <View style={{ backgroundColor: "rgba(251, 191, 36, 0.12)", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ color: glassColors.warning, fontSize: 12, fontWeight: "600" }}>申请已发送</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => handleAddFriend(item.id, item.username)}
              style={{ backgroundColor: "rgba(85, 184, 232, 0.15)", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
            >
              <Text style={{ color: glassColors.primary, fontWeight: "600", fontSize: 13 }}>加好友</Text>
            </TouchableOpacity>
          )}
        </View>
      </GlassCard>
    );
  };

  const listHeader = (
    <View>
      <View style={{ marginBottom: 16 }}>
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
        style={[glassInputStyle, { marginBottom: 12 }]}
      />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
          paddingHorizontal: 4,
        }}
      >
        <Text style={{ color: glassColors.textSecondary, fontSize: 13 }}>仅显示在线用户</Text>
        <Switch
          value={onlineOnly}
          onValueChange={(value) => {
            setOnlineOnly(value);
            setPage(1);
          }}
          trackColor={{ false: glassColors.cardBorder, true: "rgba(85, 184, 232, 0.4)" }}
          thumbColor={onlineOnly ? glassColors.primary : "#f4f3f4"}
        />
      </View>

      {statusMessage ? (
        <Text style={{ color: glassColors.warning, fontSize: 12, marginBottom: 8 }}>{statusMessage}</Text>
      ) : null}
    </View>
  );

  const listFooter = totalPages > 1 ? (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        marginTop: 4,
      }}
    >
      <TouchableOpacity
        disabled={page <= 1}
        onPress={() => setPage((p) => Math.max(1, p - 1))}
        style={{
          opacity: page <= 1 ? 0.4 : 1,
          backgroundColor: glassColors.cardBg,
          borderRadius: 8,
          paddingHorizontal: 16,
          paddingVertical: 8,
        }}
      >
        <Text style={{ color: glassColors.text }}>上一页</Text>
      </TouchableOpacity>
      <Text style={{ color: glassColors.textSecondary, fontSize: 13 }}>
        {page} / {totalPages} · 共 {totalCount} 人
      </Text>
      <TouchableOpacity
        disabled={page >= totalPages}
        onPress={() => setPage((p) => p + 1)}
        style={{
          opacity: page >= totalPages ? 0.4 : 1,
          backgroundColor: glassColors.cardBg,
          borderRadius: 8,
          paddingHorizontal: 16,
          paddingVertical: 8,
        }}
      >
        <Text style={{ color: glassColors.text }}>下一页</Text>
      </TouchableOpacity>
    </View>
  ) : null;

  if (loading && !refreshing) {
    return (
      <ScreenContainer style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        {listHeader}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={glassColors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        style={screenListStyle}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={glassColors.primary} />
        }
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 48 }}>
            <Text style={{ color: glassColors.textSecondary }}>暂无用户</Text>
          </View>
        }
        ListFooterComponent={listFooter}
      />
    </ScreenContainer>
  );
}
