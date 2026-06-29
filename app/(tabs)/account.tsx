/**
 * 个人设置 — 与 PC 启动器联机个人设置对齐
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { GlassCard } from "@/components/glassmorphism";
import { UserAvatar } from "@/components/user-avatar";
import { useAuth } from "@/lib/auth-context";
import { authApi, formatApiError } from "@/lib/_core/booxin-api";
import { validateEmail, validateEmailCode } from "@/lib/validation";
import { glassColors, glassInputStyle, screenListStyle } from "@/lib/glass-theme";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  migrateLegacyNotificationMode,
  notificationManager,
  type NotificationSettings,
} from "@/lib/notification-manager";
import {
  registerBackgroundInvitePolling,
  unregisterBackgroundInvitePolling,
} from "@/lib/background-invite-task";
import * as Haptics from "expo-haptics";

const MAX_AVATAR_BYTES = 512 * 1024;

type Panel = null | "password" | "email";

function SettingsRow({
  label,
  subtitle,
  onPress,
  danger,
}: {
  label: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: glassColors.cardBorder,
      }}
    >
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={{ color: danger ? glassColors.danger : glassColors.text, fontWeight: "600", fontSize: 15 }}>
          {label}
        </Text>
        {subtitle ? (
          <Text style={{ color: glassColors.textSecondary, fontSize: 12, marginTop: 3 }}>{subtitle}</Text>
        ) : null}
      </View>
      <Text style={{ color: glassColors.textSecondary, fontSize: 18 }}>›</Text>
    </TouchableOpacity>
  );
}

function SettingsSwitchRow({
  label,
  subtitle,
  value,
  onValueChange,
  disabled,
}: {
  label: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: glassColors.cardBorder,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={{ color: glassColors.text, fontWeight: "600", fontSize: 15 }}>{label}</Text>
        {subtitle ? (
          <Text style={{ color: glassColors.textSecondary, fontSize: 12, marginTop: 3 }}>{subtitle}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: glassColors.cardBorder, true: "rgba(85, 184, 232, 0.4)" }}
        thumbColor={value ? glassColors.primary : "#f4f3f4"}
      />
    </View>
  );
}

export default function AccountScreen() {
  const { state, signOut, updateUser, refreshUser } = useAuth();
  const apiRoot = state.authApiRoot;

  const [activePanel, setActivePanel] = useState<Panel>(null);
  const [bindEmail, setBindEmail] = useState("");
  const [bindEmailCode, setBindEmailCode] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(
    DEFAULT_NOTIFICATION_SETTINGS
  );
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState(true);

  const loadNotificationSettings = useCallback(async () => {
    await migrateLegacyNotificationMode();
    await notificationManager.initialize();
    const settings = await notificationManager.getSettings();
    setNotificationSettings(settings);
    const status = await notificationManager.getPermissionStatus();
    setNotificationPermissionGranted(status === "granted");
  }, []);

  useEffect(() => {
    void loadNotificationSettings();
  }, [loadNotificationSettings]);

  const updateNotificationSettings = useCallback(
    async (partial: Partial<NotificationSettings>) => {
      const next = await notificationManager.setSettings(partial);
      setNotificationSettings(next);

      if (next.enabled && next.systemNotification) {
        await registerBackgroundInvitePolling();
      } else {
        await unregisterBackgroundInvitePolling();
      }
    },
    []
  );

  const handleRequestNotificationPermission = async () => {
    const granted = await notificationManager.requestPermission();
    setNotificationPermissionGranted(granted);
    if (!granted) {
      Alert.alert(
        "需要通知权限",
        "请在系统设置中允许 Booxin 发送通知，否则后台无法收到联机邀请。"
      );
    }
  };

  useFocusEffect(
    useCallback(() => {
      void refreshUser().catch(() => undefined);
      void loadNotificationSettings();
    }, [loadNotificationSettings, refreshUser])
  );

  const openEmailPanel = async () => {
    setActivePanel("email");
    setBindEmail("");
    setBindEmailCode("");
    try {
      await refreshUser();
    } catch {
      // ignore
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert("错误", "请填写当前密码和新密码");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("错误", "新密码至少需要 6 个字符");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("错误", "两次输入的新密码不一致");
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
      setActivePanel(null);
    } catch (err: unknown) {
      Alert.alert("错误", formatApiError(err, "修改密码失败"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmailCode = async () => {
    const emailError = validateEmail(bindEmail);
    if (emailError) {
      Alert.alert("错误", emailError);
      return;
    }

    try {
      setIsLoading(true);
      await authApi.sendEmailBindCode(bindEmail.trim());
      Alert.alert("已发送", "验证码已发送到邮箱，10 分钟内有效");
    } catch (err: unknown) {
      Alert.alert("错误", formatApiError(err, "发送验证码失败"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    const emailError = validateEmail(bindEmail);
    if (emailError) {
      Alert.alert("错误", emailError);
      return;
    }
    const codeError = validateEmailCode(bindEmailCode);
    if (codeError) {
      Alert.alert("错误", codeError);
      return;
    }

    try {
      setIsLoading(true);
      const profile = await authApi.verifyEmailBind(bindEmail.trim(), bindEmailCode.trim());
      updateUser(profile);
      setActivePanel(null);
      Alert.alert("成功", "邮箱绑定成功");
    } catch (err: unknown) {
      Alert.alert("错误", formatApiError(err, "邮箱绑定失败"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnbindEmail = () => {
    Alert.alert("解绑邮箱", "确定要解绑当前邮箱吗？", [
      { text: "取消", style: "cancel" },
      {
        text: "解绑",
        style: "destructive",
        onPress: async () => {
          try {
            setIsLoading(true);
            const profile = await authApi.unbindEmail();
            updateUser(profile);
            Alert.alert("成功", "邮箱已解绑");
          } catch (err: unknown) {
            Alert.alert("错误", formatApiError(err, "解绑失败"));
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  const handlePickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("权限不足", "需要相册权限才能选择头像");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > MAX_AVATAR_BYTES) {
        Alert.alert("错误", "头像文件不能超过 512 KB");
        return;
      }

      setIsAvatarLoading(true);
      const mimeType = asset.mimeType ?? "image/jpeg";
      const fileName = asset.fileName ?? `avatar.${mimeType.split("/")[1] ?? "jpg"}`;
      const profile = await authApi.uploadAvatar(asset.uri, mimeType, fileName);
      updateUser(profile);
      await Image.clearDiskCache();
      Alert.alert("成功", "头像已更新");
    } catch (err: unknown) {
      Alert.alert("错误", formatApiError(err, "上传头像失败"));
    } finally {
      setIsAvatarLoading(false);
    }
  };

  const handleDeleteAvatar = () => {
    if (!state.user?.avatarUrl) {
      return;
    }

    Alert.alert("删除头像", "确定要删除当前头像吗？", [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: async () => {
          try {
            setIsAvatarLoading(true);
            await authApi.deleteAvatar();
            if (state.user) {
              updateUser({ ...state.user, avatarUrl: null });
            }
            await Image.clearDiskCache();
            Alert.alert("成功", "头像已删除");
          } catch (err: unknown) {
            Alert.alert("错误", formatApiError(err, "删除头像失败"));
          } finally {
            setIsAvatarLoading(false);
          }
        },
      },
    ]);
  };

  const handleLogout = () => {
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

  const emailLabel =
    state.user?.isEmailVerified && state.user.email ? state.user.email : "未绑定";

  return (
    <ScreenContainer style={{ paddingHorizontal: 16, paddingTop: 16 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={screenListStyle}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View style={{ marginBottom: 20 }}>
          <Text style={{ color: glassColors.text, fontSize: 26, fontWeight: "800" }}>个人设置</Text>
          <Text style={{ color: glassColors.textSecondary, fontSize: 13, marginTop: 4 }}>
            与 PC 启动器共用联机账号
          </Text>
        </View>

        <GlassCard className="mb-4 p-4">
          <View style={{ alignItems: "center", marginBottom: 8 }}>
            <UserAvatar avatarUrl={state.user?.avatarUrl} apiRoot={apiRoot} size={80} />
            <Text style={{ color: glassColors.text, fontWeight: "700", fontSize: 18, marginTop: 12 }}>
              {state.user?.username ?? "未知用户"}
            </Text>
            <Text style={{ color: glassColors.textSecondary, fontSize: 13, marginTop: 4 }}>{emailLabel}</Text>
          </View>
        </GlassCard>

        <GlassCard className="mb-4 px-4 pt-2 pb-1">
          <SettingsRow
            label="更换头像"
            subtitle={isAvatarLoading ? "处理中..." : "支持 PNG / JPG / WEBP，最大 512KB"}
            onPress={handlePickAvatar}
          />
          {state.user?.avatarUrl ? (
            <SettingsRow label="删除头像" onPress={handleDeleteAvatar} danger />
          ) : null}
          <SettingsRow
            label="修改密码"
            subtitle="需要输入当前密码"
            onPress={() => setActivePanel(activePanel === "password" ? null : "password")}
          />
          <SettingsRow
            label={state.user?.isEmailVerified ? "邮箱管理" : "绑定邮箱"}
            subtitle={emailLabel}
            onPress={() => void openEmailPanel()}
          />
          <SettingsRow label="退出登录" onPress={handleLogout} danger />
        </GlassCard>

        <GlassCard className="mb-4 px-4 pt-2 pb-1">
          <Text style={{ color: glassColors.text, fontWeight: "700", fontSize: 17, paddingVertical: 10 }}>
            联机通知
          </Text>
          {!notificationPermissionGranted ? (
            <TouchableOpacity
              onPress={handleRequestNotificationPermission}
              style={{
                backgroundColor: "rgba(251, 191, 36, 0.12)",
                borderRadius: 8,
                padding: 12,
                marginBottom: 8,
              }}
            >
              <Text style={{ color: glassColors.warning, fontWeight: "600", textAlign: "center" }}>
                通知权限未开启，点击授权
              </Text>
            </TouchableOpacity>
          ) : null}
          <SettingsSwitchRow
            label="启用联机邀请通知"
            subtitle="关闭后不再轮询邀请"
            value={notificationSettings.enabled}
            onValueChange={(value) => void updateNotificationSettings({ enabled: value })}
          />
          <SettingsSwitchRow
            label="系统通知"
            subtitle="应用在后台或锁屏时也显示通知栏消息"
            value={notificationSettings.systemNotification}
            disabled={!notificationSettings.enabled}
            onValueChange={(value) => void updateNotificationSettings({ systemNotification: value })}
          />
          <SettingsSwitchRow
            label="前台弹窗"
            subtitle="应用打开时在界面内弹出邀请详情"
            value={notificationSettings.foregroundPopup}
            disabled={!notificationSettings.enabled}
            onValueChange={(value) => void updateNotificationSettings({ foregroundPopup: value })}
          />
          <SettingsSwitchRow
            label="点击通知打开详情"
            subtitle="从后台点通知或回到应用时自动打开邀请界面"
            value={notificationSettings.openInviteOnTap}
            disabled={!notificationSettings.enabled}
            onValueChange={(value) => void updateNotificationSettings({ openInviteOnTap: value })}
          />
          <Text style={{ color: glassColors.textSecondary, fontSize: 11, paddingVertical: 10 }}>
            后台通知依赖系统调度，通常每 15 分钟左右检查一次。若收不到通知，请在系统设置中将 Booxin 设为「不受电池优化限制」。
          </Text>
        </GlassCard>

        {activePanel === "password" ? (
          <GlassCard className="mb-4 p-4">
            <Text style={{ color: glassColors.text, fontWeight: "700", fontSize: 17, marginBottom: 16 }}>
              修改密码
            </Text>
            {(["当前密码", "新密码", "确认新密码"] as const).map((label, index) => (
              <View key={label} style={{ marginBottom: 12 }}>
                <Text style={{ color: glassColors.textSecondary, fontSize: 12, marginBottom: 4 }}>{label}</Text>
                <TextInput
                  style={glassInputStyle}
                  placeholder={`输入${label}`}
                  placeholderTextColor={glassColors.textSecondary}
                  value={index === 0 ? currentPassword : index === 1 ? newPassword : confirmPassword}
                  onChangeText={index === 0 ? setCurrentPassword : index === 1 ? setNewPassword : setConfirmPassword}
                  editable={!isLoading}
                  secureTextEntry
                />
              </View>
            ))}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={() => setActivePanel(null)}
                style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 8, paddingVertical: 10, alignItems: "center" }}
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
          </GlassCard>
        ) : null}

        {activePanel === "email" ? (
          <GlassCard className="mb-4 p-4">
            <Text style={{ color: glassColors.text, fontWeight: "700", fontSize: 17, marginBottom: 8 }}>
              {state.user?.isEmailVerified ? "邮箱管理" : "绑定邮箱"}
            </Text>
            {state.user?.isEmailVerified && state.user.email ? (
              <>
                <Text style={{ color: glassColors.textSecondary, fontSize: 13, marginBottom: 16 }}>
                  已绑定：{state.user.email}
                </Text>
                <TouchableOpacity
                  onPress={handleUnbindEmail}
                  disabled={isLoading}
                  style={{ backgroundColor: "rgba(248, 113, 113, 0.12)", borderRadius: 8, paddingVertical: 10, alignItems: "center" }}
                >
                  <Text style={{ color: glassColors.danger, fontWeight: "600" }}>解绑邮箱</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={{ color: glassColors.textSecondary, fontSize: 13, marginBottom: 16 }}>
                  绑定邮箱后可使用邮箱登录与找回密码
                </Text>
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: glassColors.textSecondary, fontSize: 12, marginBottom: 4 }}>邮箱地址</Text>
                  <TextInput
                    style={glassInputStyle}
                    placeholder="your@email.com"
                    placeholderTextColor={glassColors.textSecondary}
                    value={bindEmail}
                    onChangeText={setBindEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
                <TouchableOpacity
                  onPress={handleSendEmailCode}
                  disabled={isLoading}
                  style={{ backgroundColor: "rgba(85, 184, 232, 0.15)", borderRadius: 8, paddingVertical: 10, alignItems: "center", marginBottom: 12 }}
                >
                  <Text style={{ color: glassColors.primary, fontWeight: "600" }}>发送验证码</Text>
                </TouchableOpacity>
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: glassColors.textSecondary, fontSize: 12, marginBottom: 4 }}>验证码</Text>
                  <TextInput
                    style={glassInputStyle}
                    placeholder="6 位数字"
                    placeholderTextColor={glassColors.textSecondary}
                    value={bindEmailCode}
                    onChangeText={setBindEmailCode}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleVerifyEmail}
                  disabled={isLoading}
                  style={{ backgroundColor: "rgba(85, 184, 232, 0.15)", borderRadius: 8, paddingVertical: 10, alignItems: "center" }}
                >
                  <Text style={{ color: glassColors.primary, fontWeight: "600" }}>确认绑定</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity onPress={() => setActivePanel(null)} style={{ marginTop: 12, alignItems: "center" }}>
              <Text style={{ color: glassColors.textSecondary }}>关闭</Text>
            </TouchableOpacity>
          </GlassCard>
        ) : null}

        <GlassCard className="mb-4 p-4">
          <Text style={{ color: glassColors.textSecondary, fontSize: 11, marginBottom: 3, textTransform: "uppercase" }}>
            用户 ID
          </Text>
          <Text style={{ color: glassColors.text, fontFamily: "monospace", fontSize: 13, marginBottom: 12 }}>
            {state.user?.id ?? "未知"}
          </Text>
          <Text style={{ color: glassColors.textSecondary, fontSize: 11, marginBottom: 3, textTransform: "uppercase" }}>
            创建时间
          </Text>
          <Text style={{ color: glassColors.text, fontSize: 13 }}>
            {state.user?.createdAtUtc ? new Date(state.user.createdAtUtc).toLocaleDateString() : "未知"}
          </Text>
        </GlassCard>

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenContainer>
  );
}
