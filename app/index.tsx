/**
 * 应用入口：根据登录状态跳转到登录页或主界面
 */

import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/lib/auth-context";

export default function Index() {
  const { state } = useAuth();

  if (state.isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0b1020",
        }}
      >
        <ActivityIndicator size="large" color="#55B8E8" />
      </View>
    );
  }

  if (state.userToken) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/auth" />;
}
