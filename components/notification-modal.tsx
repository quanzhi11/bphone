/**
 * 通知弹窗组件
 * 
 * 显示房间邀请通知
 */

import React, { useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import { friendsApi, RoomInvite } from "@/lib/_core/booxin-api";
import * as Haptics from "expo-haptics";

export interface NotificationModalProps {
  visible: boolean;
  invite: RoomInvite | null;
  onDismiss: () => void;
  onAccept?: () => void;
}

export function NotificationModal({
  visible,
  invite,
  onDismiss,
  onAccept,
}: NotificationModalProps) {
  const colors = useColors();

  const handleAccept = useCallback(async () => {
    if (!invite) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // 这里可以添加接受邀请的逻辑
      onAccept?.();
      onDismiss();
    } catch (err) {
      Alert.alert("错误", "处理邀请失败");
    }
  }, [invite, onAccept, onDismiss]);

  const handleReject = useCallback(async () => {
    if (!invite) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await friendsApi.dismissInvite(invite.inviteId);
      onDismiss();
    } catch (err) {
      Alert.alert("错误", "拒绝邀请失败");
    }
  }, [invite, onDismiss]);

  if (!invite) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      {/* 半透明背景 */}
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "center",
          alignItems: "center",
          padding: 16,
        }}
      >
        {/* 通知卡片 */}
        <View
          className="w-full bg-surface border border-border rounded-2xl p-6"
          style={{ maxWidth: 320 }}
        >
          {/* 标题 */}
          <Text className="text-xl font-bold text-foreground mb-2">
            房间邀请
          </Text>

          {/* 邀请信息 */}
          <View className="mb-4">
            <Text className="text-base text-foreground mb-2">
              <Text className="font-semibold">{invite.senderUsername}</Text>
              {" "}邀请您加入房间
            </Text>

            <View className="bg-background rounded-lg p-3 mb-2">
              <Text className="text-sm font-semibold text-foreground mb-1">
                房间码: {invite.roomCode}
              </Text>
              {invite.modpackGameVersion && (
                <Text className="text-xs text-muted">
                  {invite.modpackGameVersion} • {invite.modpackLoader}
                </Text>
              )}
            </View>

            <Text className="text-xs text-muted">
              {new Date(invite.createdAtUtc).toLocaleString()}
            </Text>
          </View>

          {/* 按钮 */}
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={handleReject}
              className="flex-1 bg-error/10 border border-error rounded-lg py-3 items-center"
            >
              <Text className="text-error font-semibold">拒绝</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAccept}
              className="flex-1 bg-success rounded-lg py-3 items-center"
            >
              <Text className="text-background font-semibold">接受</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
