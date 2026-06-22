/**
 * 账户屏幕 - 液态玻璃设计
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "@/components/screen-container";
import { GlassCard } from "@/components/glassmorphism";
import { useAuth } from "@/lib/auth-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AccountScreen() {
  const { state, signOut } = useAuth();
  const [showNotifications, setShowNotifications] = useState(true);
  const [notificationMode, setNotificationMode] = useState("popup");

  const handleToggleNotifications = async (value: boolean) => {
    setShowNotifications(value);
    await AsyncStorage.setItem("notification_enabled", JSON.stringify(value));
  };

  const handleChangeNotificationMode = async (mode: string) => {
    setNotificationMode(mode);
    await AsyncStorage.setItem("notification_mode", mode);
  };

  const handleLogout = async () => {
    Alert.alert("退出登录", "确定要退出登录吗？", [
      { text: "取消", style: "cancel" },
      {
        text: "退出",
        style: "destructive",
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  return (
    <LinearGradient
      colors={["rgba(59, 130, 246, 0.6)", "rgba(147, 51, 234, 0.6)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <ScreenContainer className="flex-1 px-4 pt-4">
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* 用户信息 */}
          <View className="mb-6">
            <Text className="text-white text-3xl font-bold">账户</Text>
            {state.user && (
              <Text className="text-white/60 text-sm mt-2">
                {state.user.username}
              </Text>
            )}
          </View>

          {/* 通知设置 */}
          <GlassCard className="mb-4 p-4">
            <Text className="text-white font-bold text-lg mb-4">通知设置</Text>

            {/* 启用通知 */}
            <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-white/10">
              <Text className="text-white">启用通知</Text>
              <Switch
                value={showNotifications}
                onValueChange={handleToggleNotifications}
                trackColor={{
                  false: "rgba(255,255,255,0.2)",
                  true: "rgba(59,130,246,0.5)",
                }}
                thumbColor={showNotifications ? "#60A5FA" : "#9CA3AF"}
              />
            </View>

            {/* 通知方式 */}
            {showNotifications && (
              <View>
                <Text className="text-white/80 text-sm mb-3">通知方式:</Text>
                {["popup", "background", "silent"].map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => handleChangeNotificationMode(mode)}
                    className={`flex-row items-center p-3 rounded-lg mb-2 ${
                      notificationMode === mode
                        ? "bg-blue-500/30 border border-blue-400"
                        : "bg-white/5 border border-white/10"
                    }`}
                  >
                    <View
                      className={`w-4 h-4 rounded-full mr-3 ${
                        notificationMode === mode
                          ? "bg-blue-400"
                          : "bg-white/30"
                      }`}
                    />
                    <Text className="text-white text-sm">
                      {mode === "popup"
                        ? "弹窗通知"
                        : mode === "background"
                          ? "后台通知"
                          : "静默通知"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </GlassCard>

          {/* 退出登录 */}
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-500/50 rounded-lg py-3 items-center mt-6"
          >
            <Text className="text-white font-bold text-base">退出登录</Text>
          </TouchableOpacity>

          <View className="h-8" />
        </ScrollView>
      </ScreenContainer>
    </LinearGradient>
  );
}
