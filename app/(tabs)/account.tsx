/**
 * 账户屏幕
 * 
 * 用户信息、修改密码、通知设置、登出
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Switch,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/lib/auth-context";
import { authApi } from "@/lib/_core/booxin-api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

type NotificationMode = "popup" | "background" | "disabled";

export default function AccountScreen() {
  const colors = useColors();
  const { state, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notificationMode, setNotificationMode] = useState<NotificationMode>(
    "popup"
  );
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // 加载通知设置
  useEffect(() => {
    const loadNotificationSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem("notification_mode");
        if (saved) {
          setNotificationMode(saved as NotificationMode);
        }
      } catch (err) {
        console.error("Load notification settings error:", err);
      }
    };

    loadNotificationSettings();
  }, []);

  // 保存通知设置
  const saveNotificationSettings = useCallback(
    async (mode: NotificationMode) => {
      try {
        await AsyncStorage.setItem("notification_mode", mode);
        setNotificationMode(mode);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (err) {
        Alert.alert("错误", "保存设置失败");
      }
    },
    []
  );

  // 修改密码
  const handleChangePassword = useCallback(async () => {
    try {
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

      setIsLoading(true);
      await authApi.changePassword(currentPassword, newPassword);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
  }, [currentPassword, newPassword, confirmPassword]);

  // 登出
  const handleSignOut = useCallback(() => {
    Alert.alert("登出", "确定要登出吗？", [
      { text: "取消", style: "cancel" },
      {
        text: "登出",
        style: "destructive",
        onPress: async () => {
          try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await signOut();
          } catch (err) {
            Alert.alert("错误", "登出失败");
          }
        },
      },
    ]);
  }, [signOut]);

  return (
    <ScreenContainer className="flex-1 p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 用户信息 */}
        <View className="bg-surface border border-border rounded-lg p-4 mb-6">
          <Text className="text-lg font-bold text-foreground mb-4">
            账户信息
          </Text>
          <View className="mb-3">
            <Text className="text-sm text-muted mb-1">用户名</Text>
            <Text className="text-base font-semibold text-foreground">
              {state.user?.username || "未知"}
            </Text>
          </View>
          <View className="mb-3">
            <Text className="text-sm text-muted mb-1">账户创建时间</Text>
            <Text className="text-base text-foreground">
              {state.user?.createdAtUtc
                ? new Date(state.user.createdAtUtc).toLocaleDateString()
                : "未知"}
            </Text>
          </View>
          <View>
            <Text className="text-sm text-muted mb-1">用户 ID</Text>
            <Text className="text-xs text-muted font-mono">
              {state.user?.id || "未知"}
            </Text>
          </View>
        </View>

        {/* 修改密码 */}
        <View className="bg-surface border border-border rounded-lg p-4 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-foreground">
              修改密码
            </Text>
            {!isChangingPassword && (
              <TouchableOpacity
                onPress={() => setIsChangingPassword(true)}
                className="px-3 py-1 bg-primary rounded"
              >
                <Text className="text-sm font-semibold text-background">
                  修改
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {isChangingPassword && (
            <>
              <View className="mb-3">
                <Text className="text-sm text-muted mb-1">当前密码</Text>
                <TextInput
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                  placeholder="输入当前密码"
                  placeholderTextColor={colors.muted}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  editable={!isLoading}
                  secureTextEntry
                />
              </View>

              <View className="mb-3">
                <Text className="text-sm text-muted mb-1">新密码</Text>
                <TextInput
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                  placeholder="输入新密码"
                  placeholderTextColor={colors.muted}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  editable={!isLoading}
                  secureTextEntry
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm text-muted mb-1">确认新密码</Text>
                <TextInput
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                  placeholder="再次输入新密码"
                  placeholderTextColor={colors.muted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!isLoading}
                  secureTextEntry
                />
              </View>

              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => {
                    setIsChangingPassword(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  disabled={isLoading}
                  className="flex-1 bg-muted/10 border border-muted rounded-lg py-2 items-center"
                >
                  <Text className="text-muted font-semibold">取消</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleChangePassword}
                  disabled={isLoading}
                  className="flex-1 bg-primary rounded-lg py-2 items-center"
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={colors.background} />
                  ) : (
                    <Text className="text-background font-semibold">
                      保存
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* 通知设置 */}
        <View className="bg-surface border border-border rounded-lg p-4 mb-6">
          <Text className="text-lg font-bold text-foreground mb-4">
            通知设置
          </Text>

          <View className="mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-base font-semibold text-foreground">
                弹窗提醒
              </Text>
              <Switch
                value={notificationMode === "popup"}
                onValueChange={() =>
                  saveNotificationSettings(
                    notificationMode === "popup" ? "disabled" : "popup"
                  )
                }
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.background}
              />
            </View>
            <Text className="text-sm text-muted">
              在 App 前台时显示邀请通知
            </Text>
          </View>

          <View className="mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-base font-semibold text-foreground">
                后台弹出
              </Text>
              <Switch
                value={notificationMode === "background"}
                onValueChange={() =>
                  saveNotificationSettings(
                    notificationMode === "background" ? "disabled" : "background"
                  )
                }
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.background}
              />
            </View>
            <Text className="text-sm text-muted">
              在系统通知栏显示邀请通知
            </Text>
          </View>

          <View>
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-base font-semibold text-foreground">
                关闭通知
              </Text>
              <Switch
                value={notificationMode === "disabled"}
                onValueChange={() =>
                  saveNotificationSettings(
                    notificationMode === "disabled" ? "popup" : "disabled"
                  )
                }
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.background}
              />
            </View>
            <Text className="text-sm text-muted">
              禁用所有邀请通知
            </Text>
          </View>
        </View>

        {/* 登出按钮 */}
        <TouchableOpacity
          onPress={handleSignOut}
          className="bg-error/10 border border-error rounded-lg py-3 items-center mb-8"
        >
          <Text className="text-error font-semibold">登出</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
