/**
 * 账户屏幕 - 用户信息、修改密码、登出
 * 卡片式设计
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

import { ScreenContainer } from "@/components/screen-container";
import { GlassCard } from "@/components/glassmorphism";
import { useAuth } from "@/lib/auth-context";
import { authApi } from "@/lib/_core/booxin-api";
import { glassColors, glassInputStyle } from "@/lib/glass-theme";
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
    <ScreenContainer className="flex-1 px-4 pt-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 页面标题 */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ color: glassColors.text, fontSize: 26, fontWeight: "800" }}>账户</Text>
          {state.user ? (
            <Text style={{ color: glassColors.textSecondary, fontSize: 13, marginTop: 4 }}>
              {state.user.username} · 联机通知伴侣
            </Text>
          ) : null}
        </View>

        {/* 用户信息卡片 */}
        <GlassCard className="mb-4 p-4">
          <View style={{ marginBottom: 12 }}>
            <Text style={{ color: glassColors.textSecondary, fontSize: 11, marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 }}>
              用户 ID
            </Text>
            <Text style={{ color: glassColors.text, fontFamily: "monospace", fontSize: 13 }}>
              {state.user?.id || "未知"}
            </Text>
          </View>
          <View>
            <Text style={{ color: glassColors.textSecondary, fontSize: 11, marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 }}>
              创建时间
            </Text>
            <Text style={{ color: glassColors.text, fontSize: 13 }}>
              {state.user?.createdAtUtc
                ? new Date(state.user.createdAtUtc).toLocaleDateString()
                : "未知"}
            </Text>
          </View>
        </GlassCard>

        {/* 修改密码卡片 */}
        <GlassCard className="mb-4 p-4">
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: isChangingPassword ? 16 : 0 }}>
            <Text style={{ color: glassColors.text, fontWeight: "700", fontSize: 17 }}>
              修改密码
            </Text>
            {!isChangingPassword && (
              <TouchableOpacity
                onPress={() => setIsChangingPassword(true)}
                style={{ backgroundColor: "rgba(85, 184, 232, 0.15)", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 }}
              >
                <Text style={{ color: glassColors.primary, fontSize: 13, fontWeight: "600" }}>修改</Text>
              </TouchableOpacity>
            )}
          </View>

          {isChangingPassword && (
            <>
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: glassColors.textSecondary, fontSize: 12, marginBottom: 4 }}>当前密码</Text>
                <TextInput
                  style={glassInputStyle}
                  placeholder="输入当前密码"
                  placeholderTextColor={glassColors.textSecondary}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  editable={!isLoading}
                  secureTextEntry
                />
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: glassColors.textSecondary, fontSize: 12, marginBottom: 4 }}>新密码</Text>
                <TextInput
                  style={glassInputStyle}
                  placeholder="输入新密码"
                  placeholderTextColor={glassColors.textSecondary}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  editable={!isLoading}
                  secureTextEntry
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: glassColors.textSecondary, fontSize: 12, marginBottom: 4 }}>确认新密码</Text>
                <TextInput
                  style={glassInputStyle}
                  placeholder="再次输入新密码"
                  placeholderTextColor={glassColors.textSecondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!isLoading}
                  secureTextEntry
                />
              </View>

              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  onPress={() => {
                    setIsChangingPassword(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  disabled={isLoading}
                  style={{ flex: 1, backgroundColor: "rgba(255, 255, 255, 0.06)", borderRadius: 8, paddingVertical: 10, alignItems: "center" }}
                >
                  <Text style={{ color: glassColors.textSecondary, fontWeight: "600" }}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleChangePassword}
                  disabled={isLoading}
                  style={{ flex: 1, backgroundColor: "rgba(85, 184, 232, 0.15)", borderRadius: 8, paddingVertical: 10, alignItems: "center" }}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={glassColors.primary} />
                  ) : (
                    <Text style={{ color: glassColors.primary, fontWeight: "600" }}>保存</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </GlassCard>

        {/* 退出登录 */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{ backgroundColor: "rgba(248, 113, 113, 0.12)", borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 8 }}
        >
          <Text style={{ color: glassColors.danger, fontWeight: "700", fontSize: 15 }}>退出登录</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenContainer>
  );
}
