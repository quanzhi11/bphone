/**
 * 通知弹窗组件 - 仅显示邀请通知，不自动加入
 * 
 * 用户可以同意或拒绝好友邀请，但不会自动加入房间
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
}

export function NotificationModal({
  visible,
  invite,
  onDismiss,
}: NotificationModalProps) {
  const handleAccept = useCallback(async () => {
    if (!invite) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // 仅记录接受，不自动加入房间
      Alert.alert("已接受", `已接受来自 ${invite.senderUsername} 的邀请`);
      onDismiss();
    } catch (err) {
      Alert.alert("错误", "处理邀请失败");
    }
  }, [invite, onDismiss]);

  const handleReject = useCallback(async () => {
    if (!invite) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await friendsApi.dismissRoomInvite(invite.inviteId);
      Alert.alert("已拒绝", `已拒绝来自 ${invite.senderUsername} 的邀请`);
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
          className="w-full bg-white rounded-2xl p-6 shadow-lg"
          style={{ maxWidth: 320 }}
        >
          {/* 标题 */}
          <Text className="text-xl font-bold text-gray-900 mb-2">
            好友邀请
          </Text>

          {/* 邀请信息 */}
          <View className="mb-4">
            <Text className="text-base text-gray-700 mb-3">
              <Text className="font-semibold">{invite.senderUsername}</Text>
              {" "}邀请您加入房间
            </Text>

            {/* 房间信息 */}
            <View className="bg-gray-100 rounded-lg p-3 mb-3">
              <Text className="text-sm font-semibold text-gray-900 mb-1">
                房间码: {invite.roomCode}
              </Text>
              {invite.modpackGameVersion && (
                <Text className="text-xs text-gray-600">
                  {invite.modpackGameVersion} • {invite.modpackLoader}
                </Text>
              )}
            </View>

            <Text className="text-xs text-gray-500">
              {new Date(invite.createdAtUtc).toLocaleString()}
            </Text>
          </View>

          {/* 按钮 */}
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={handleReject}
              className="flex-1 bg-gray-200 rounded-lg py-3 items-center"
            >
              <Text className="text-gray-700 font-semibold">拒绝</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAccept}
              className="flex-1 bg-blue-500 rounded-lg py-3 items-center"
            >
              <Text className="text-white font-semibold">同意</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
