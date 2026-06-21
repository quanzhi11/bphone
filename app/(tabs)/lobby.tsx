/**
 * 用户大厅屏幕
 * 
 * 浏览所有注册用户，加好友
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
  TextInput,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { authApi, friendsApi, LobbyUser } from "@/lib/_core/booxin-api";
import * as Haptics from "expo-haptics";

export default function LobbyScreen() {
  const colors = useColors();
  const [users, setUsers] = useState<LobbyUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);

  // 获取用户列表
  const fetchUsers = useCallback(
    async (pageNum: number = 1, isLoadMore: boolean = false) => {
      try {
        if (!isLoadMore) setError(null);
        if (isLoadMore) setIsLoadingMore(true);

        const data = await authApi.getLobbyUsers(
          pageNum,
          30,
          onlineOnly,
          searchQuery
        );

        if (isLoadMore) {
          setUsers((prev) => [...prev, ...(data.users || [])]);
        } else {
          setUsers(data.users || []);
        }

        setPage(pageNum);
        setTotalPages(data.totalPages || 1);
      } catch (err: any) {
        const message =
          err.response?.data?.message || err.message || "获取用户列表失败";
        setError(message);
        console.error("Fetch users error:", err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [onlineOnly, searchQuery]
  );

  // 初始加载
  useEffect(() => {
    setIsLoading(true);
    setPage(1);
    fetchUsers(1, false);
  }, [fetchUsers]);

  // 下拉刷新
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setPage(1);
    fetchUsers(1, false);
  }, [fetchUsers]);

  // 加载更多
  const handleLoadMore = useCallback(() => {
    if (page < totalPages && !isLoadingMore && !isLoading) {
      fetchUsers(page + 1, true);
    }
  }, [page, totalPages, isLoadingMore, isLoading, fetchUsers]);

  // 加好友
  const handleAddFriend = useCallback(
    async (userId: string, username: string) => {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await friendsApi.sendRequest(userId);
        Alert.alert("成功", `已向 ${username} 发送好友申请`);
        // 刷新列表以更新状态
        await fetchUsers(1, false);
      } catch (err: any) {
        const message =
          err.response?.data?.message || err.message || "发送好友申请失败";
        Alert.alert("错误", message);
      }
    },
    [fetchUsers]
  );

  // 用户卡片
  const UserCard = ({ user }: { user: LobbyUser }) => {
    const isFriend = user.isFriend;
    const hasPendingRequest = user.hasPendingOutgoingRequest;
    const hasIncomingRequest = user.hasPendingIncomingRequest;

    return (
      <View className="bg-surface border border-border rounded-lg p-4 mb-3">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className="text-base font-semibold text-foreground">
              {user.username}
            </Text>
            <View className="flex-row mt-1 gap-2">
              <View
                className="px-2 py-1 rounded"
                style={{
                  backgroundColor: user.isOnline ? colors.success : colors.error,
                  opacity: 0.1,
                }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{
                    color: user.isOnline ? colors.success : colors.error,
                  }}
                >
                  {user.isOnline ? "在线" : "离线"}
                </Text>
              </View>
              {user.isInRoom && (
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
                    在房间
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* 状态提示 */}
        {isFriend && (
          <View className="mb-2 bg-success/10 border border-success rounded px-2 py-1">
            <Text className="text-xs text-success font-semibold">已是好友</Text>
          </View>
        )}
        {hasPendingRequest && (
          <View className="mb-2 bg-warning/10 border border-warning rounded px-2 py-1">
            <Text className="text-xs text-warning font-semibold">
              已发送申请
            </Text>
          </View>
        )}
        {hasIncomingRequest && (
          <View className="mb-2 bg-warning/10 border border-warning rounded px-2 py-1">
            <Text className="text-xs text-warning font-semibold">
              待同意申请
            </Text>
          </View>
        )}

        {/* 加好友按钮 */}
        {!isFriend && !hasPendingRequest && (
          <TouchableOpacity
            onPress={() => handleAddFriend(user.id, user.username)}
            className="bg-primary rounded-lg py-2 items-center"
          >
            <Text className="text-background font-semibold">加好友</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <ScreenContainer className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (error && users.length === 0) {
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
    <ScreenContainer className="flex-1 p-4">
      {/* 搜索和筛选 */}
      <View className="mb-4 gap-2">
        <TextInput
          className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-foreground"
          placeholder="搜索用户名..."
          placeholderTextColor={colors.muted}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            setPage(1);
          }}
        />
        <TouchableOpacity
          onPress={() => {
            setOnlineOnly(!onlineOnly);
            setPage(1);
          }}
          className={`px-4 py-2 rounded-lg border ${
            onlineOnly
              ? "bg-primary border-primary"
              : "bg-surface border-border"
          }`}
        >
          <Text
            className={`font-semibold ${
              onlineOnly ? "text-background" : "text-foreground"
            }`}
          >
            {onlineOnly ? "仅显示在线" : "显示全部"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 用户列表 */}
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <UserCard user={item} />}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-8">
            <Text className="text-lg text-muted">暂无用户</Text>
          </View>
        }
        ListFooterComponent={
          isLoadingMore ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}
