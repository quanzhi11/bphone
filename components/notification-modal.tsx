/**
 * 联机邀请弹窗 — 手机版仅作通知，不加入房间。
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
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "center",
          alignItems: "center",
          padding: 16,
        }}
      >
        <View
          className="w-full bg-white rounded-2xl p-6 shadow-lg"
          style={{ maxWidth: 320 }}
        >
          <Text className="text-xl font-bold text-gray-900 mb-2">
            联机邀请
          </Text>

          <View className="mb-4">
            <Text className="text-base text-gray-700 mb-3">
              <Text className="font-semibold">{invite.senderUsername}</Text>
              {" "}邀请你加入房间
            </Text>

            <View className="bg-gray-100 rounded-lg p-3 mb-3">
              <Text className="text-sm font-semibold text-gray-900 mb-1">
                房间码: {invite.roomCode}
              </Text>
              {invite.modpackGameVersion ? (
                <Text className="text-xs text-gray-600">
                  {invite.modpackGameVersion} • {invite.modpackLoader}
                </Text>
              ) : null}
            </View>

            <Text className="text-xs text-gray-500 mb-2">
              {new Date(invite.createdAtUtc).toLocaleString()}
            </Text>
            <Text className="text-xs text-blue-600">
              请在 PC 版 Booxin 启动器输入房间码加入，手机版不提供进房功能。
            </Text>
          </View>

          {onViewInvites ? (
            <TouchableOpacity
              onPress={onViewInvites}
              className="bg-gray-100 rounded-lg py-2.5 items-center mb-3"
            >
              <Text className="text-gray-700 font-semibold text-sm">
                查看全部邀请
              </Text>
            </TouchableOpacity>
          ) : null}

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={handleDismissInvite}
              className="flex-1 bg-gray-200 rounded-lg py-3 items-center"
            >
              <Text className="text-gray-700 font-semibold">忽略</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAcknowledge}
              className="flex-1 bg-blue-500 rounded-lg py-3 items-center"
            >
              <Text className="text-white font-semibold">知道了</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
