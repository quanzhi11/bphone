/**
 * 认证屏幕 - 登录/注册/邮箱登录/找回密码
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
import { authApi, formatApiError } from "@/lib/_core/booxin-api";
import { validateEmail, validateEmailCode } from "@/lib/validation";
import { ScreenContainer } from "@/components/screen-container";
import { glassColors, glassInputStyle } from "@/lib/glass-theme";
import { GlassCard, GlassPressable } from "@/components/glassmorphism";
import * as Haptics from "expo-haptics";

type AuthMode = "login" | "signup" | "emailLogin" | "forgotPassword";

export default function AuthScreen() {
  const { state, signIn, signInWithEmail, signUp, resetPassword, clearError } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isBusy = state.isLoading || isSendingCode || isSubmitting;
  const error = state.error;

  const resetForm = useCallback(() => {
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setEmail("");
    setEmailCode("");
    clearError();
  }, [clearError]);

  const switchMode = useCallback(
    (next: AuthMode) => {
      setMode(next);
      resetForm();
    },
    [resetForm]
  );

  const handleSendCode = useCallback(async () => {
    const emailError = validateEmail(email);
    if (emailError) {
      Alert.alert("错误", emailError);
      return;
    }

    try {
      setIsSendingCode(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const trimmedEmail = email.trim();
      if (mode === "signup") {
        await authApi.sendRegisterCode(trimmedEmail);
      } else if (mode === "emailLogin") {
        await authApi.sendEmailLoginCode(trimmedEmail);
      } else {
        await authApi.sendPasswordResetCode(trimmedEmail);
      }
      Alert.alert("已发送", "验证码已发送到邮箱，10 分钟内有效");
    } catch (err: unknown) {
      Alert.alert("错误", formatApiError(err, "发送验证码失败"));
    } finally {
      setIsSendingCode(false);
    }
  }, [email, mode]);

  const handleSubmit = useCallback(async () => {
    if (isBusy) {
      return;
    }

    try {
      clearError();
      setIsSubmitting(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (mode === "login") {
        if (!username.trim() || !password.trim()) {
          Alert.alert("错误", "请输入用户名和密码");
          return;
        }
        await signIn(username.trim(), password);
        return;
      }

      if (mode === "emailLogin") {
        const emailError = validateEmail(email);
        const codeError = validateEmailCode(emailCode);
        if (emailError || codeError) {
          Alert.alert("错误", emailError ?? codeError ?? "输入无效");
          return;
        }
        await signInWithEmail(email.trim(), emailCode.trim());
        return;
      }

      if (mode === "signup") {
        if (!username.trim() || !password.trim()) {
          Alert.alert("错误", "请输入用户名和密码");
          return;
        }
        const emailError = validateEmail(email);
        const codeError = validateEmailCode(emailCode);
        if (emailError || codeError) {
          Alert.alert("错误", emailError ?? codeError ?? "输入无效");
          return;
        }
        if (password !== confirmPassword) {
          Alert.alert("错误", "两次输入的密码不一致");
          return;
        }
        await signUp(username.trim(), password, email.trim(), emailCode.trim());
        return;
      }

      const emailError = validateEmail(email);
      const codeError = validateEmailCode(emailCode);
      if (emailError || codeError) {
        Alert.alert("错误", emailError ?? codeError ?? "输入无效");
        return;
      }
      if (!password.trim() || password.length < 6) {
        Alert.alert("错误", "新密码至少需要 6 个字符");
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert("错误", "两次输入的新密码不一致");
        return;
      }
      await resetPassword(email.trim(), emailCode.trim(), password);
      Alert.alert("成功", "密码已重置，请使用新密码登录");
      switchMode("login");
    } catch (err: unknown) {
      console.error("Auth error:", err);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    mode,
    username,
    password,
    confirmPassword,
    email,
    emailCode,
    signIn,
    signInWithEmail,
    signUp,
    resetPassword,
    clearError,
    isBusy,
    switchMode,
  ]);

  const needsEmail = mode === "signup" || mode === "emailLogin" || mode === "forgotPassword";
  const needsUsername = mode === "login" || mode === "signup";
  const needsPassword = mode !== "emailLogin";
  const needsConfirm = mode === "signup" || mode === "forgotPassword";

  const submitLabel =
    mode === "login"
      ? "登录"
      : mode === "signup"
        ? "注册"
        : mode === "emailLogin"
          ? "邮箱登录"
          : "重置密码";

  return (
    <ScreenContainer style={{ flex: 1 }} edges={["top", "left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1 justify-center px-6">
        <View style={{ marginBottom: 28, alignItems: "center" }}>
          <Text style={{ color: glassColors.text, fontSize: 36, fontWeight: "800", marginBottom: 6 }}>
            Booxin
          </Text>
          <Text style={{ color: glassColors.textSecondary, fontSize: 15 }}>
            联机通知伴侣 · 与 PC 启动器共用账号
          </Text>
        </View>

        {mode !== "forgotPassword" && (
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
            {(["login", "signup", "emailLogin"] as const).map((item) => {
              const active = mode === item;
              const label = item === "login" ? "登录" : item === "signup" ? "注册" : "邮箱登录";
              return (
                <TouchableOpacity
                  key={item}
                  onPress={() => switchMode(item)}
                  disabled={isBusy}
                  style={{
                    flex: 1,
                    backgroundColor: active ? "rgba(85, 184, 232, 0.15)" : glassColors.cardBg,
                    borderRadius: 10,
                    paddingVertical: 8,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: active ? "rgba(85, 184, 232, 0.3)" : glassColors.cardBorder,
                  }}
                >
                  <Text
                    style={{
                      color: active ? glassColors.primary : glassColors.textSecondary,
                      fontWeight: "600",
                      fontSize: 13,
                    }}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <GlassCard style={{ padding: 24, marginBottom: 20 }}>
          {error ? (
            <View
              style={{
                backgroundColor: "rgba(248, 113, 113, 0.12)",
                borderRadius: 8,
                padding: 10,
                marginBottom: 16,
              }}
            >
              <Text style={{ color: glassColors.danger, textAlign: "center", fontSize: 13 }}>{error}</Text>
            </View>
          ) : null}

          {needsUsername ? (
            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: glassColors.textSecondary, fontSize: 12, marginBottom: 4, fontWeight: "500" }}>
                用户名
              </Text>
              <TextInput
                placeholder="输入用户名"
                placeholderTextColor={glassColors.textSecondary}
                value={username}
                onChangeText={setUsername}
                editable={!isBusy}
                style={glassInputStyle}
              />
            </View>
          ) : null}

          {needsEmail ? (
            <>
              <View style={{ marginBottom: 14 }}>
                <Text style={{ color: glassColors.textSecondary, fontSize: 12, marginBottom: 4, fontWeight: "500" }}>
                  邮箱
                </Text>
                <TextInput
                  placeholder="your@email.com"
                  placeholderTextColor={glassColors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  editable={!isBusy}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={glassInputStyle}
                />
              </View>

              <TouchableOpacity
                onPress={handleSendCode}
                disabled={isBusy}
                style={{
                  backgroundColor: "rgba(85, 184, 232, 0.15)",
                  borderRadius: 8,
                  paddingVertical: 10,
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                {isSendingCode ? (
                  <ActivityIndicator size="small" color={glassColors.primary} />
                ) : (
                  <Text style={{ color: glassColors.primary, fontWeight: "600" }}>发送验证码</Text>
                )}
              </TouchableOpacity>

              <View style={{ marginBottom: 14 }}>
                <Text style={{ color: glassColors.textSecondary, fontSize: 12, marginBottom: 4, fontWeight: "500" }}>
                  验证码
                </Text>
                <TextInput
                  placeholder="6 位数字"
                  placeholderTextColor={glassColors.textSecondary}
                  value={emailCode}
                  onChangeText={setEmailCode}
                  editable={!isBusy}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={glassInputStyle}
                />
              </View>
            </>
          ) : null}

          {needsPassword ? (
            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: glassColors.textSecondary, fontSize: 12, marginBottom: 4, fontWeight: "500" }}>
                {mode === "forgotPassword" ? "新密码" : "密码"}
              </Text>
              <TextInput
                placeholder={mode === "forgotPassword" ? "输入新密码" : "输入密码"}
                placeholderTextColor={glassColors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isBusy}
                style={glassInputStyle}
              />
            </View>
          ) : null}

          {needsConfirm ? (
            <View style={{ marginBottom: 18 }}>
              <Text style={{ color: glassColors.textSecondary, fontSize: 12, marginBottom: 4, fontWeight: "500" }}>
                {mode === "forgotPassword" ? "确认新密码" : "确认密码"}
              </Text>
              <TextInput
                placeholder="再次输入密码"
                placeholderTextColor={glassColors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!isBusy}
                style={glassInputStyle}
              />
            </View>
          ) : null}

          <GlassPressable onPress={handleSubmit} disabled={isBusy} variant="primary">
            {isBusy ? (
              <ActivityIndicator color={glassColors.text} />
            ) : (
              <Text style={{ color: glassColors.text, fontWeight: "700", fontSize: 15 }}>{submitLabel}</Text>
            )}
          </GlassPressable>

          {mode === "login" ? (
            <TouchableOpacity onPress={() => switchMode("forgotPassword")} disabled={isBusy} style={{ marginTop: 16 }}>
              <Text style={{ color: glassColors.primary, textAlign: "center", fontWeight: "600" }}>忘记密码？</Text>
            </TouchableOpacity>
          ) : null}

          {mode === "forgotPassword" ? (
            <TouchableOpacity onPress={() => switchMode("login")} disabled={isBusy} style={{ marginTop: 16 }}>
              <Text style={{ color: glassColors.textSecondary, textAlign: "center" }}>返回登录</Text>
            </TouchableOpacity>
          ) : null}
        </GlassCard>

        <Text style={{ color: glassColors.textSecondary, fontSize: 12, textAlign: "center" }}>
          {mode === "signup"
            ? "注册需验证邮箱，验证码将发送到您的邮箱"
            : mode === "emailLogin"
              ? "使用已绑定邮箱收取验证码登录"
              : mode === "forgotPassword"
                ? "通过已绑定邮箱重置密码"
                : "也可使用邮箱验证码登录"}
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}
