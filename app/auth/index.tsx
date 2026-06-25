/**
 * 认证屏幕 - 登录/注册
 * 卡片式设计 + 纯色背景
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
import { glassColors, glassInputStyle } from "@/lib/glass-theme";
import { GlassCard, GlassPressable } from "@/components/glassmorphism";
import * as Haptics from "expo-haptics";

type AuthMode = "login" | "signup";

export default function AuthScreen() {
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
        <View style={{ marginBottom: 36, alignItems: "center" }}>
          <Text style={{ color: glassColors.text, fontSize: 36, fontWeight: "800", marginBottom: 6 }}>
            Booxin
          </Text>
          <Text style={{ color: glassColors.textSecondary, fontSize: 15 }}>
            {mode === "login" ? "联机通知伴侣 · 欢迎回来" : "联机通知伴侣 · 加入我们"}
          </Text>
          <Text style={{ color: glassColors.textSecondary, fontSize: 12, marginTop: 6, textAlign: "center", paddingHorizontal: 16 }}>
            与 PC 启动器共用账号，接收联机邀请通知
          </Text>
        </View>

        {/* 登录/注册卡片 */}
        <GlassCard style={{ padding: 24, marginBottom: 20 }}>
          {/* 错误提示 */}
          {error && (
            <View style={{ backgroundColor: "rgba(248, 113, 113, 0.12)", borderRadius: 8, padding: 10, marginBottom: 16 }}>
              <Text style={{ color: glassColors.danger, textAlign: "center", fontSize: 13 }}>{error}</Text>
            </View>
          )}

          {/* 用户名 */}
          <View style={{ marginBottom: 14 }}>
            <Text style={{ color: glassColors.textSecondary, fontSize: 12, marginBottom: 4, fontWeight: "500" }}>
              用户名
            </Text>
            <TextInput
              placeholder="输入用户名"
              placeholderTextColor={glassColors.textSecondary}
              value={username}
              onChangeText={setUsername}
              editable={!isLoading}
              style={glassInputStyle}
            />
          </View>

          {/* 密码 */}
          <View style={{ marginBottom: 14 }}>
            <Text style={{ color: glassColors.textSecondary, fontSize: 12, marginBottom: 4, fontWeight: "500" }}>
              密码
            </Text>
            <TextInput
              placeholder="输入密码"
              placeholderTextColor={glassColors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
              style={glassInputStyle}
            />
          </View>

          {/* 确认密码（注册模式） */}
          {mode === "signup" && (
            <View style={{ marginBottom: 18 }}>
              <Text style={{ color: glassColors.textSecondary, fontSize: 12, marginBottom: 4, fontWeight: "500" }}>
                确认密码
              </Text>
              <TextInput
                placeholder="再次输入密码"
                placeholderTextColor={glassColors.textSecondary}
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
          >
            {isLoading ? (
              <ActivityIndicator color={glassColors.text} />
            ) : (
              <Text style={{ color: glassColors.text, fontWeight: "700", fontSize: 15 }}>
                {mode === "login" ? "登录" : "注册"}
              </Text>
            )}
          </GlassPressable>

          {/* 切换模式 */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 18 }}>
            <Text style={{ color: glassColors.textSecondary, fontSize: 13 }}>
              {mode === "login" ? "没有账户？" : "已有账户？"}
            </Text>
            <TouchableOpacity onPress={handleToggleMode} disabled={isLoading}>
              <Text style={{ color: glassColors.primary, fontWeight: "600", fontSize: 13, marginLeft: 6 }}>
                {mode === "login" ? "立即注册" : "返回登录"}
              </Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* 底部提示 */}
        <Text style={{ color: glassColors.textSecondary, fontSize: 12, textAlign: "center" }}>
          {mode === "login"
            ? "首次使用？注册新账户开始游戏"
            : "注册后即可加入联机大厅"}
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}
