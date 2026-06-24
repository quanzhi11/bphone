/**
 * 根布局
 *
 * 注册全部路由，由 useAuthGuard 根据登录状态重定向
 */

import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { InviteNotificationHost } from "@/components/invite-notification-host";
import { ThemeProvider } from "@/lib/theme-provider";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { NotificationProvider } from "@/lib/notification-context";
import { useAuthGuard } from "@/lib/use-auth-guard";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// 保持 Splash Screen 显示直到资源加载完成
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { state } = useAuth();
  useAuthGuard();

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

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      {state.userToken != null ? <InviteNotificationHost /> : null}
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({});

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Fonts are optional, continue even if not loaded
  // if (!fontsLoaded) {
  //   return null;
  // }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <RootLayoutNav />
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
