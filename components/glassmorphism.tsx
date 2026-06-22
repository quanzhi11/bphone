/**
 * 液态玻璃（Glassmorphism）组件库
 * 
 * 提供半透明效果的卡片和容器（不依赖 expo-blur）
 */

import React from "react";
import { View, ViewProps } from "react-native";
import { cn } from "@/lib/utils";

/**
 * 液态玻璃卡片 - 半透明效果
 */
export function GlassCard({
  children,
  className,
  ...props
}: ViewProps) {
  return (
    <View
      className={cn(
        "rounded-2xl border overflow-hidden",
        className
      )}
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
      }}
      {...props}
    >
      {children}
    </View>
  );
}

/**
 * 液态玻璃背景容器
 */
export function GlassContainer({
  children,
  className,
  ...props
}: ViewProps) {
  return (
    <View
      className={cn("flex-1", className)}
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.05)",
      }}
      {...props}
    >
      {children}
    </View>
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
        "rounded-xl border px-4 py-3",
        className
      )}
      style={{
        borderColor: "rgba(255, 255, 255, 0.2)",
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
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
  ...props
}: ViewProps) {
  return (
    <View
      className={cn(
        "rounded-xl border px-6 py-3 items-center justify-center",
        className
      )}
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        borderColor: "rgba(255, 255, 255, 0.3)",
        borderWidth: 1,
      }}
      {...props}
    >
      {children}
    </View>
  );
}
