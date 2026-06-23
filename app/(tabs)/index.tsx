/**
 * 首页 - 公共房间列表
 * 采用液态玻璃设计
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
import { GlassCard } from "@/components/glassmorphism";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/lib/auth-context";
import { roomsApi, type Room } from "@/lib/_core/booxin-api";

export default function HomeScreen() {
  const colors = useColors();
  const { state } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const data = await roomsApi.getPublicRooms();
      setRooms(data);
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRooms();
    setRefreshing(false);
  }, [fetchRooms]);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 30000); // 每 30 秒刷新
    return () => clearInterval(interval);
  }, [fetchRooms]);

  const renderRoomCard = ({ item }: { item: Room }) => (
    <GlassCard className="mb-4 p-4">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-white font-bold text-lg">{item.roomCode}</Text>
          <Text className="text-white/70 text-sm">房主: {item.hostName}</Text>
        </View>
        <View className="bg-blue-500/40 rounded-full px-3 py-1">
          <Text className="text-white text-xs font-semibold">
            {item.currentPlayers}/{item.maxPlayers}
          </Text>
        </View>
      </View>

      <Text className="text-white/90 text-sm mb-2">{item.motd}</Text>
      {item.remark && (
        <Text className="text-white/60 text-xs italic mb-3">{item.remark}</Text>
      )}

      <View className="flex-row justify-between items-center">
        <View>
          <Text className="text-white/70 text-xs">版本: {item.version}</Text>
          {item.modpackUrl && (
            <Text className="text-blue-300 text-xs">有整合包</Text>
          )}
        </View>
        <View className="bg-white/15 rounded-lg px-3 py-2">
          <Text className="text-white/80 font-medium text-xs">PC 启动器加入</Text>
        </View>
      </View>
    </GlassCard>
  );

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center py-12">
      <Text className="text-white/60 text-lg mb-2">暂无房间</Text>
      <Text className="text-white/40 text-sm">下拉刷新或稍后重试</Text>
    </View>
  );

  return (
    <ScreenContainer 
      className="flex-1 px-4 pt-4" 
      containerClassName="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-400"
    >
      {/* 标题 */}
      <View className="mb-6">
        <Text className="text-white text-3xl font-bold">公共房间</Text>
        <Text className="text-white/60 text-sm">只读浏览，请在 PC 启动器加入房间</Text>
      </View>

      {/* 房间列表 */}
      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="white" />
        </View>
      ) : (
        <FlatList
          data={rooms}
          renderItem={renderRoomCard}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="white"
            />
          }
          scrollEnabled={true}
          nestedScrollEnabled={true}
        />
      )}
    </ScreenContainer>
  );
}
