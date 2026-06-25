/**
 * 应用入口：根据登录状态跳转到登录页或主界面
 */

import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/lib/auth-context";
import { glassColors } from "@/lib/glass-theme";

export default function Index() {
  const { state } = useAuth();

  if (state.isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: glassColors.bgPrimary,
        }}
      >
        <ActivityIndicator size="large" color={glassColors.primary} />
      </View>
    );
  }

  if (state.userToken) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/auth" />;
}
