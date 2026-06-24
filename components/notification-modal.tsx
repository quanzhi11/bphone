/**
 * 联机邀请弹窗 — PC 端液态玻璃对话框风格
 */

import React, { useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { friendsApi, type RoomInvite } from "@/lib/_core/booxin-api";
import { GlassCard } from "@/components/glassmorphism";
import { glassColors } from "@/lib/glass-theme";
import * as Haptics from "expo-haptics";

export interface NotificationModalProps {
  visible: boolean;
  invite: RoomInvite | null;
  onDismiss: () => void;
  onViewInvites?: () => void;
}

export function NotificationModal({
  visible,
  invite,
  onDismiss,
  onViewInvites,
}: NotificationModalProps) {
  const handleAcknowledge = useCallback(async () => {
    if (!invite) {
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onDismiss();
    } catch {
      Alert.alert("错误", "处理邀请失败");
    }
  }, [invite, onDismiss]);

  const handleDismissInvite = useCallback(async () => {
    if (!invite) {
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await friendsApi.dismissRoomInvite(invite.inviteId);
      onDismiss();
    } catch {
      Alert.alert("错误", "忽略邀请失败");
    }
  }, [invite, onDismiss]);

  if (!invite) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.55)",
          justifyContent: "center",
          alignItems: "center",
          padding: 16,
        }}
      >
        <GlassCard
          variant="dialog"
          className="w-full p-6"
          style={{ maxWidth: 320 }}
        >
          <Text
            className="text-xl font-bold mb-2"
            style={{ color: glassColors.text }}
          >
            联机邀请
          </Text>

          <View className="mb-4">
            <Text className="text-base mb-3" style={{ color: glassColors.text }}>
              <Text style={{ fontWeight: "600" }}>{invite.senderUsername}</Text>
              {" "}邀请你加入房间
            </Text>

            <GlassCard variant="nav" showDispersion={false} className="p-3 mb-3">
              <Text
                className="text-sm font-semibold mb-1"
                style={{ color: glassColors.text }}
              >
                房间码: {invite.roomCode}
              </Text>
              {invite.modpackGameVersion ? (
                <Text className="text-xs" style={{ color: glassColors.textSecondary }}>
                  {invite.modpackGameVersion} • {invite.modpackLoader}
                </Text>
              ) : null}
            </GlassCard>

            <Text className="text-xs mb-2" style={{ color: glassColors.textSecondary }}>
              {new Date(invite.createdAtUtc).toLocaleString()}
            </Text>
            <Text className="text-xs" style={{ color: "#55B8E8" }}>
              请在 PC 版 Booxin 启动器输入房间码加入，手机版不提供进房功能。
            </Text>
          </View>

          {onViewInvites ? (
            <TouchableOpacity
              onPress={onViewInvites}
              className="rounded-lg py-2.5 items-center mb-3"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.094)",
                borderWidth: 1,
                borderColor: glassColors.borderSubtle,
              }}
            >
              <Text style={{ color: glassColors.text, fontWeight: "600" }}>
                查看全部邀请
              </Text>
            </TouchableOpacity>
          ) : null}

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={handleDismissInvite}
              className="flex-1 rounded-lg py-3 items-center"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.094)",
                borderWidth: 1,
                borderColor: glassColors.borderSubtle,
              }}
            >
              <Text style={{ color: glassColors.text, fontWeight: "600" }}>
                忽略
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAcknowledge}
              className="flex-1 rounded-lg py-3 items-center"
              style={{
                backgroundColor: glassColors.primary,
                borderWidth: 1,
                borderColor: glassColors.border,
              }}
            >
              <Text style={{ color: glassColors.text, fontWeight: "600" }}>
                知道了
              </Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </View>
    </Modal>
  );
}
