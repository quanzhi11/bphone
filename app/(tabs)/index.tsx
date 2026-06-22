/**
 * 首页 - 公共房间列表
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/lib/auth-context";
import { roomsApi, Room } from "@/lib/_core/booxin-api";

export default function HomeScreen() {
  const { state: authState } = useAuth();
  const colors = useColors();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取房间列表
  const fetchRooms = useCallback(async () => {
    try {
      setError(null);
      const data = await roomsApi.getPublicRooms();
      setRooms(data || []);
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || "获取房间列表失败";
      setError(message);
      console.error("Fetch rooms error:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // 初始加载（仅在已登录时）
  useEffect(() => {
    if (authState.userToken) {
      fetchRooms();

      // 定时刷新（30 秒）
      const interval = setInterval(fetchRooms, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchRooms, authState.userToken]);

  // 下拉刷新
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchRooms();
  }, [fetchRooms]);

  // 房间卡片组件
  const RoomCard = ({ room }: { room: Room }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => {
        // TODO: 导航到房间详情
      }}
    >
      <View className="bg-surface border border-border rounded-lg p-4 mb-3">
        {/* 房间码和房主 */}
        <View className="flex-row justify-between items-start mb-2">
          <View>
            <Text className="text-lg font-bold text-foreground">
              {room.roomCode}
            </Text>
            <Text className="text-sm text-muted">房主: {room.hostName}</Text>
          </View>
          <View
            className="bg-success/10 px-2 py-1 rounded"
            style={{ borderColor: colors.success, borderWidth: 1 }}
          >
            <Text className="text-xs font-semibold text-success">
              {room.status}
            </Text>
          </View>
        </View>

        {/* 房间名 */}
        <Text className="text-base font-semibold text-foreground mb-2">
          {room.motd}
        </Text>

        {/* 房间描述 */}
        {room.remark && (
          <Text className="text-sm text-muted mb-3">{room.remark}</Text>
        )}

        {/* 玩家数和版本 */}
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-sm text-muted">
            玩家: {room.currentPlayers}/{room.maxPlayers}
          </Text>
          <Text className="text-sm text-muted">版本: {room.version}</Text>
        </View>

        {/* 模组信息 */}
        <View className="flex-row items-center">
          <Text className="text-xs text-muted">
            {room.modpackLoader} • {room.modpackGameVersion}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // 空状态
  if (!isLoading && rooms.length === 0 && !error) {
    return (
      <ScreenContainer className="flex-1 justify-center items-center p-6">
        <Text className="text-lg text-muted text-center">
          暂无公共房间
        </Text>
        <TouchableOpacity
          onPress={handleRefresh}
          className="mt-4 bg-primary px-6 py-2 rounded-lg"
        >
          <Text className="text-background font-semibold">刷新</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  // 错误状态
  if (error && rooms.length === 0) {
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
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RoomCard room={item} />}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center py-8">
              <Text className="text-lg text-muted">暂无公共房间</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}
