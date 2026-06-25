/**
 * 首页 - 公共房间列表
 * 卡片式设计 + 纯色背景
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
import { glassColors } from "@/lib/glass-theme";

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
    const interval = setInterval(fetchRooms, 30000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  const renderRoomCard = ({ item }: { item: Room }) => (
    <GlassCard className="mb-3 p-4">
      {/* 房间码 + 人数 */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <Text style={{ color: glassColors.text, fontWeight: "700", fontSize: 17 }}>
          {item.roomCode}
        </Text>
        <View style={{ backgroundColor: "rgba(85, 184, 232, 0.15)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
          <Text style={{ color: glassColors.primary, fontSize: 12, fontWeight: "600" }}>
            {item.currentPlayers}/{item.maxPlayers}
          </Text>
        </View>
      </View>

      {/* 房主 */}
      <Text style={{ color: glassColors.textSecondary, fontSize: 13, marginBottom: 4 }}>
        房主: {item.hostName}
      </Text>

      {/* Motd */}
      {item.motd ? (
        <Text style={{ color: glassColors.text, fontSize: 14, marginBottom: 4 }} numberOfLines={2}>
          {item.motd}
        </Text>
      ) : null}

      {/* 备注 */}
      {item.remark ? (
        <Text style={{ color: glassColors.textSecondary, fontSize: 12, fontStyle: "italic", marginBottom: 8 }} numberOfLines={1}>
          {item.remark}
        </Text>
      ) : null}

      {/* 底部信息栏 */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
        <Text style={{ color: glassColors.textSecondary, fontSize: 12 }}>
          版本: {item.version}
        </Text>
        <View style={{ backgroundColor: "rgba(255, 255, 255, 0.06)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
          <Text style={{ color: glassColors.textSecondary, fontSize: 12 }}>
            PC 启动器加入
          </Text>
        </View>
      </View>
    </GlassCard>
  );

  const renderEmptyState = () => (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 48 }}>
      <Text style={{ color: glassColors.textSecondary, fontSize: 16, marginBottom: 6 }}>暂无房间</Text>
      <Text style={{ color: glassColors.textSecondary, fontSize: 13, opacity: 0.7 }}>下拉刷新或稍后重试</Text>
    </View>
  );

  return (
    <ScreenContainer className="flex-1 px-4 pt-4">
      {/* 页面标题 */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: glassColors.text, fontSize: 26, fontWeight: "800" }}>公共房间</Text>
        <Text style={{ color: glassColors.textSecondary, fontSize: 13, marginTop: 4 }}>
          只读浏览，请在 PC 启动器加入房间
        </Text>
      </View>

      {/* 房间列表 */}
      {loading && !refreshing ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={glassColors.primary} />
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
              tintColor={glassColors.primary}
            />
          }
          scrollEnabled={true}
          nestedScrollEnabled={true}
        />
      )}
    </ScreenContainer>
  );
}
