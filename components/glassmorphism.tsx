/**
 * 液态玻璃（Glassmorphism）组件库
 * 
 * 提供带有模糊背景、半透明效果的卡片和容器
 */

import React from "react";
import { View, ViewProps } from "react-native";
import { BlurView } from "expo-blur";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";

/**
 * 液态玻璃卡片 - 带模糊背景效果
 */
export function GlassCard({
  children,
  className,
  intensity = 90,
  ...props
}: ViewProps & { intensity?: number }) {
  const colors = useColors();

  return (
    <BlurView intensity={intensity}>
      <View
        className={cn(
          "rounded-2xl border border-white/20 overflow-hidden",
          className
        )}
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          borderColor: "rgba(255, 255, 255, 0.2)",
        }}
        {...props}
      >
        {children}
      </View>
    </BlurView>
  );
}

/**
 * 液态玻璃背景容器
 */
export function GlassContainer({
  children,
  className,
  intensity = 80,
  ...props
}: ViewProps & { intensity?: number }) {
  return (
    <BlurView intensity={intensity}>
      <View
        className={cn("flex-1", className)}
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.05)",
        }}
        {...props}
      >
        {children}
      </View>
    </BlurView>
  );
}

/**
 * 液态玻璃输入框
 */
export function GlassInput({
  className,
  ...props
}: React.ComponentProps<typeof View> & {
  placeholderTextColor?: string;
}) {
  return (
    <View
      className={cn(
        "rounded-xl border border-white/20 px-4 py-3 bg-white/10",
        className
      )}
      style={{
        borderColor: "rgba(255, 255, 255, 0.2)",
        backgroundColor: "rgba(255, 255, 255, 0.1)",
      }}
      {...props}
    />
  );
}

/**
 * 液态玻璃按钮
 */
export function GlassButton({
  children,
  className,
  intensity = 85,
  ...props
}: ViewProps & { intensity?: number }) {
  return (
    <BlurView intensity={intensity}>
      <View
        className={cn(
          "rounded-xl border border-white/30 px-6 py-3 items-center justify-center",
          className
        )}
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.15)",
          borderColor: "rgba(255, 255, 255, 0.3)",
        }}
        {...props}
      >
        {children}
      </View>
    </BlurView>
  );
}
