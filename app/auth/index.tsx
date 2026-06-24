/**
 * 认证屏幕 - 登录/注册
 * 采用液态玻璃（Glassmorphism）设计
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  ImageBackground,
} from "react-native";

import { useAuth } from "@/lib/auth-context";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { glassColors, glassInputStyle } from "@/lib/glass-theme";
import { GlassCard, GlassPressable } from "@/components/glassmorphism";
import * as Haptics from "expo-haptics";

type AuthMode = "login" | "signup";

export default function AuthScreen() {
  const colors = useColors();
  const { state, signIn, signUp, clearError } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const isLoading = state.isLoading;
  const error = state.error;

  const handleToggleMode = useCallback(() => {
    setMode(mode === "login" ? "signup" : "login");
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    clearError();
  }, [mode, clearError]);

  const handleSubmit = useCallback(async () => {
    try {
      clearError();

      // 验证输入
      if (!username.trim()) {
        Alert.alert("错误", "请输入用户名");
        return;
      }

      if (!password.trim()) {
        Alert.alert("错误", "请输入密码");
        return;
      }

      if (mode === "signup" && password !== confirmPassword) {
        Alert.alert("错误", "两次输入的密码不一致");
        return;
      }

      // 触发触觉反馈
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (mode === "login") {
        await signIn(username, password);
      } else {
        await signUp(username, password);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
    }
  }, [username, password, confirmPassword, mode, signIn, signUp, clearError]);

  return (
    <ScreenContainer
      className="flex-1"
      edges={["top", "left", "right", "bottom"]}
    >
      <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          className="flex-1 justify-center px-6"
        >
          {/* 标题 */}
          <View className="mb-12 items-center">
            <Text className="text-5xl font-bold mb-2" style={{ color: glassColors.text }}>
              Booxin
            </Text>
            <Text className="text-lg" style={{ color: "rgba(242,246,255,0.8)" }}>
              {mode === "login" ? "联机通知伴侣 · 欢迎回来" : "联机通知伴侣 · 加入我们"}
            </Text>
            <Text className="text-sm text-white/60 mt-2 text-center px-4">
              与 PC 启动器共用账号，接收联机邀请通知
            </Text>
          </View>

          {/* 液态玻璃卡片 */}
          <GlassCard className="p-8 mb-6">
            {/* 错误提示 */}
            {error && (
              <View className="bg-red-500/20 border border-red-400/50 rounded-lg p-3 mb-6">
                <Text className="text-red-200 text-center text-sm">{error}</Text>
              </View>
            )}

            {/* 用户名输入 */}
            <View className="mb-4">
              <Text className="text-white/80 text-sm font-medium mb-2">
                用户名
              </Text>
              <TextInput
                placeholder="输入用户名"
                placeholderTextColor="rgba(160, 174, 200, 0.8)"
                value={username}
                onChangeText={setUsername}
                editable={!isLoading}
                style={glassInputStyle}
              />
            </View>

            {/* 密码输入 */}
            <View className="mb-4">
              <Text className="text-white/80 text-sm font-medium mb-2">
                密码
              </Text>
              <TextInput
                placeholder="输入密码"
                placeholderTextColor="rgba(160, 174, 200, 0.8)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
                style={glassInputStyle}
              />
            </View>

            {/* 确认密码（注册模式） */}
            {mode === "signup" && (
              <View className="mb-6">
                <Text className="text-white/80 text-sm font-medium mb-2">
                  确认密码
                </Text>
                <TextInput
                  placeholder="再次输入密码"
                  placeholderTextColor="rgba(160, 174, 200, 0.8)"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  editable={!isLoading}
                  style={glassInputStyle}
                />
              </View>
            )}

            {/* 提交按钮 */}
            <GlassPressable
              onPress={handleSubmit}
              disabled={isLoading}
              variant="primary"
              className="mt-2"
            >
              {isLoading ? (
                <ActivityIndicator color={glassColors.text} />
              ) : (
                <Text style={{ color: glassColors.text, fontWeight: "700" }}>
                  {mode === "login" ? "登录" : "注册"}
                </Text>
              )}
            </GlassPressable>

            {/* 切换模式 */}
            <View className="flex-row items-center justify-center mt-6">
              <Text className="text-white/70 text-sm">
                {mode === "login" ? "没有账户？" : "已有账户？"}
              </Text>
              <TouchableOpacity onPress={handleToggleMode} disabled={isLoading}>
                <Text style={{ color: glassColors.accent, fontWeight: "600" }} className="text-sm ml-2">
                  {mode === "login" ? "立即注册" : "返回登录"}
                </Text>
              </TouchableOpacity>
            </View>
          </GlassCard>

          {/* 底部提示 */}
          <Text className="text-white/60 text-xs text-center">
            {mode === "login"
              ? "首次使用？注册新账户开始游戏"
              : "注册后即可加入联机大厅"}
          </Text>
        </ScrollView>
    </ScreenContainer>
  );
}
