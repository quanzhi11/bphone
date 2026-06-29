import React from "react";
import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { resolveAvatarDisplayUrl } from "@/lib/avatar-url";
import { glassColors } from "@/lib/glass-theme";

interface UserAvatarProps {
  avatarUrl?: string | null;
  size?: number;
  apiRoot?: string;
}

export function UserAvatar({ avatarUrl, size = 40, apiRoot }: UserAvatarProps) {
  const displayUrl = resolveAvatarDisplayUrl(avatarUrl, apiRoot);
  const radius = size / 2;

  if (!displayUrl) {
    return (
      <View
        style={[
          styles.placeholder,
          {
            width: size,
            height: size,
            borderRadius: radius,
          },
        ]}
      >
        <Ionicons name="person" size={Math.round(size * 0.5)} color={glassColors.textSecondary} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: displayUrl }}
      recyclingKey={displayUrl}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: glassColors.cardBg,
      }}
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={150}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: glassColors.cardBorder,
  },
});
