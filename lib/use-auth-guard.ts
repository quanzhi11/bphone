/**
 * 路由认证守卫：未登录时强制进入登录页，已登录时离开登录页
 */

import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

import { useAuth } from "@/lib/auth-context";

const PUBLIC_SEGMENTS = new Set(["auth", "oauth"]);

export function useAuthGuard() {
  const { state } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (state.isLoading) {
      return;
    }

    const rootSegment = segments[0];
    const inPublicRoute =
      rootSegment != null && PUBLIC_SEGMENTS.has(rootSegment);

    if (!state.userToken && !inPublicRoute) {
      router.replace("/auth");
      return;
    }

    if (state.userToken && rootSegment === "auth") {
      router.replace("/(tabs)");
    }
  }, [state.userToken, state.isLoading, segments, router]);
}
