/**
 * 根布局
 * 
 * 根据认证状态显示认证栈或应用栈
 */

import { useEffect } from "react";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { InviteNotificationHost } from "@/components/invite-notification-host";
import { ThemeProvider } from "@/lib/theme-provider";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { NotificationProvider } from "@/lib/notification-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// 保持 Splash Screen 显示直到资源加载完成
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { state } = useAuth();

  // 仍在加载中，显示空屏幕
  if (state.isLoading) {
    return <Stack />;
  }

  return (
    <>
      <Stack>
        {state.userToken == null ? (
          <Stack.Screen
            name="auth/index"
            options={{
              headerShown: false,
            }}
          />
        ) : (
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
        )}
      </Stack>
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
