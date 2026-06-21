/**
 * 认证屏幕 - 登录/注册
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
} from "react-native";
import { useAuth } from "@/lib/auth-context";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
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
      // 错误已由 signIn/signUp 处理，这里只处理额外的验证
      console.error("Auth error:", err);
    }
  }, [username, password, confirmPassword, mode, signIn, signUp, clearError]);

  return (
    <ScreenContainer
      className="flex-1"
      containerClassName="bg-background"
      edges={["top", "left", "right", "bottom"]}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-center px-6 py-8">
          {/* 标题 */}
          <View className="mb-8 items-center">
            <Text className="text-4xl font-bold text-foreground mb-2">
              Booxin
            </Text>
            <Text className="text-base text-muted">
              {mode === "login" ? "登录您的账户" : "创建新账户"}
            </Text>
          </View>

          {/* 错误提示 */}
          {error && (
            <View className="mb-4 bg-error/10 border border-error rounded-lg p-3">
              <Text className="text-sm text-error">{error}</Text>
            </View>
          )}

          {/* 用户名输入 */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">
              用户名
            </Text>
            <TextInput
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              placeholder="3-32 字符"
              placeholderTextColor={colors.muted}
              value={username}
              onChangeText={setUsername}
              editable={!isLoading}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* 密码输入 */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">
              密码
            </Text>
            <TextInput
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              placeholder="6-128 字符"
              placeholderTextColor={colors.muted}
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
              secureTextEntry
            />
          </View>

          {/* 确认密码输入（仅注册） */}
          {mode === "signup" && (
            <View className="mb-6">
              <Text className="text-sm font-semibold text-foreground mb-2">
                确认密码
              </Text>
              <TextInput
                className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                placeholder="再次输入密码"
                placeholderTextColor={colors.muted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!isLoading}
                secureTextEntry
              />
            </View>
          )}

          {/* 提交按钮 */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            style={{
              transform: [{ scale: isLoading ? 1 : 1 }],
            }}
            activeOpacity={0.8}
          >
            <View className="w-full bg-primary rounded-lg py-3 items-center justify-center flex-row">
              {isLoading && (
                <ActivityIndicator
                  color={colors.background}
                  size="small"
                  style={{ marginRight: 8 }}
                />
              )}
              <Text className="text-base font-semibold text-background">
                {mode === "login" ? "登录" : "注册"}
              </Text>
            </View>
          </TouchableOpacity>

          {/* 切换模式 */}
          <View className="mt-6 flex-row justify-center items-center">
            <Text className="text-sm text-muted">
              {mode === "login" ? "还没有账户？" : "已有账户？"}
            </Text>
            <TouchableOpacity onPress={handleToggleMode} disabled={isLoading}>
              <Text className="text-sm font-semibold text-primary ml-2">
                {mode === "login" ? "注册" : "登录"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
