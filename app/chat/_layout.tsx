import { Stack } from "expo-router";

import { glassColors } from "@/lib/glass-theme";

export default function ChatLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          flex: 1,
          backgroundColor: glassColors.bgPrimary,
        },
      }}
    />
  );
}
