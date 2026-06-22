/**
 * 账户屏幕 - 包含用户信息、修改密码、登出
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "@/components/screen-container";
import { GlassCard } from "@/components/glassmorphism";
import { useAuth } from "@/lib/auth-context";
import { authApi } from "@/lib/_core/booxin-api";
import * as Haptics from "expo-haptics";

export default function AccountScreen() {
  const { state, signOut } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      Alert.alert("错误", "请输入当前密码");
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert("错误", "请输入新密码");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("错误", "两次输入的新密码不一致");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("错误", "新密码至少需要 6 个字符");
      return;
    }

    try {
      setIsLoading(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await authApi.changePassword(currentPassword, newPassword);
      Alert.alert("成功", "密码已更新");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsChangingPassword(false);
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || "修改密码失败";
      Alert.alert("错误", message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("退出登录", "确定要退出登录吗？", [
      { text: "取消", style: "cancel" },
      {
        text: "退出",
        style: "destructive",
        onPress: async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

          {/* 用户详情卡片 */}
          <GlassCard className="mb-6 p-4">
            <View className="mb-4">
              <Text className="text-white/60 text-xs mb-1">用户 ID</Text>
              <Text className="text-white font-mono text-sm">
                {state.user?.id || "未知"}
              </Text>
            </View>
            <View>
              <Text className="text-white/60 text-xs mb-1">账户创建时间</Text>
              <Text className="text-white text-sm">
                {state.user?.createdAtUtc
                  ? new Date(state.user.createdAtUtc).toLocaleDateString()
                  : "未知"}
              </Text>
            </View>
          </GlassCard>

          {/* 修改密码 */}
          <GlassCard className="mb-6 p-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white font-bold text-lg">修改密码</Text>
              {!isChangingPassword && (
                <TouchableOpacity
                  onPress={() => setIsChangingPassword(true)}
                  className="bg-blue-500/50 rounded-lg px-3 py-1"
                >
                  <Text className="text-white text-sm font-semibold">修改</Text>
                </TouchableOpacity>
              )}
            </View>

            {isChangingPassword && (
              <>
                {/* 当前密码 */}
                <View className="mb-3">
                  <Text className="text-white/60 text-xs mb-1">当前密码</Text>
                  <TextInput
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                    placeholder="输入当前密码"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    editable={!isLoading}
                    secureTextEntry
                  />
                </View>

                {/* 新密码 */}
                <View className="mb-3">
                  <Text className="text-white/60 text-xs mb-1">新密码</Text>
                  <TextInput
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                    placeholder="输入新密码"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    editable={!isLoading}
                    secureTextEntry
                  />
                </View>

                {/* 确认新密码 */}
                <View className="mb-4">
                  <Text className="text-white/60 text-xs mb-1">确认新密码</Text>
                  <TextInput
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                    placeholder="再次输入新密码"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    editable={!isLoading}
                    secureTextEntry
                  />
                </View>

                {/* 按钮 */}
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => {
                      setIsChangingPassword(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    disabled={isLoading}
                    className="flex-1 bg-gray-500/30 rounded-lg py-2 items-center"
                  >
                    <Text className="text-gray-300 font-semibold">取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleChangePassword}
                    disabled={isLoading}
                    className="flex-1 bg-blue-500/50 rounded-lg py-2 items-center"
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="text-white font-semibold">保存</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </GlassCard>

          {/* 退出登录按钮 */}
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
