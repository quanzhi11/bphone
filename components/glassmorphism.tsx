/**
 * 简洁卡片组件 — 替代液态玻璃效果，纯色背景 + 圆角卡片
 */

import React from "react";
import {
  View,
  type ViewProps,
  type StyleProp,
  type ViewStyle,
  Pressable,
  type PressableProps,
} from "react-native";

import { cn } from "@/lib/utils";
import { glassColors, glassShadow } from "@/lib/glass-theme";

export type LiquidGlassVariant = "card" | "shell" | "nav" | "dialog";

const CORNER_RADIUS: Record<LiquidGlassVariant, number> = {
  card: 12,
  shell: 16,
  nav: 10,
  dialog: 14,
};

export interface GlassCardProps extends ViewProps {
  variant?: LiquidGlassVariant;
  showDispersion?: boolean;
  contentClassName?: string;
}

export function GlassCard({
  children,
  className,
  contentClassName,
  variant = "card",
  style,
  ...props
}: GlassCardProps) {
  const radius = CORNER_RADIUS[variant];

  return (
    <View
      className={cn(className)}
      style={[
        {
          borderRadius: radius,
          backgroundColor: glassColors.cardBg,
          borderWidth: 1,
          borderColor: glassColors.cardBorder,
        },
        glassShadow,
        style,
      ]}
      {...props}
    >
      <View className={cn(contentClassName)}>{children}</View>
    </View>
  );
}

export function GlassContainer({
  children,
  className,
  ...props
}: ViewProps) {
  return (
    <GlassCard
      variant="shell"
      showDispersion={false}
      className={cn("flex-1", className)}
      {...props}
    >
      {children}
    </GlassCard>
  );
}

export function GlassInput({ className, style, ...props }: ViewProps) {
  return (
    <View
      className={cn("rounded-xl border px-4 py-3", className)}
      style={[
        {
          borderColor: glassColors.borderSubtle,
          backgroundColor: "rgba(255, 255, 255, 0.06)",
          borderWidth: 1,
        },
        style,
      ]}
      {...props}
    />
  );
}

export function GlassButton({
  children,
  className,
  variant = "secondary",
  style,
  ...props
}: ViewProps & { variant?: "primary" | "secondary" }) {
  const isPrimary = variant === "primary";
  return (
    <View
      className={cn(
        "rounded-xl px-6 py-3 items-center justify-center",
        className
      )}
      style={[
        {
          backgroundColor: isPrimary
            ? glassColors.primary
            : glassColors.cardBg,
          borderWidth: 1,
          borderColor: isPrimary ? glassColors.primary : glassColors.cardBorder,
        },
        isPrimary ? glassShadow : null,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

export function GlassPressable({
  children,
  className,
  variant = "secondary",
  style,
  ...props
}: Omit<PressableProps, "children"> & {
  className?: string;
  variant?: "primary" | "secondary";
  children: React.ReactNode;
}) {
  return (
    <Pressable
      className={className}
      style={({ pressed }) => [
        {
          borderRadius: 12,
          overflow: "hidden",
          opacity: pressed ? 0.85 : 1,
        },
        style as StyleProp<ViewStyle>,
      ]}
      {...props}
    >
      <GlassButton variant={variant}>{children}</GlassButton>
    </Pressable>
  );
}
