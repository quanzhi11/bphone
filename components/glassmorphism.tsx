/**
 * 液态玻璃组件 — 对齐 PC 端 LiquidGlassPanel / GlassStyles
 */

import React, { useId } from "react";
import {
  View,
  type ViewProps,
  type StyleProp,
  type ViewStyle,
  Pressable,
  type PressableProps,
} from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

import { cn } from "@/lib/utils";
import { glassColors, glassShadow } from "@/lib/glass-theme";

export type LiquidGlassVariant = "card" | "shell" | "nav" | "dialog";

const CORNER_RADIUS: Record<LiquidGlassVariant, number> = {
  card: 16,
  shell: 20,
  nav: 14,
  dialog: 16,
};

function GlassChrome({
  variant,
  uid,
  radius,
}: {
  variant: LiquidGlassVariant;
  uid: string;
  radius: number;
}) {
  const bodyId = `${uid}-body`;
  const lensId = `${uid}-lens`;
  const specularId = `${uid}-specular`;
  const rimId = `${uid}-rim`;

  const bodyStops =
    variant === "shell"
      ? [
          { offset: "0%", color: "rgba(255,255,255,0.16)" },
          { offset: "100%", color: "rgba(255,255,255,0.055)" },
        ]
      : variant === "nav"
        ? [
            { offset: "0%", color: "rgba(255,255,255,0.13)" },
            { offset: "100%", color: "rgba(255,255,255,0.063)" },
          ]
        : variant === "dialog"
          ? [
              { offset: "0%", color: "rgba(255,255,255,0.33)" },
              { offset: "45%", color: "rgba(255,255,255,0.22)" },
              { offset: "100%", color: "rgba(255,255,255,0.16)" },
            ]
          : [
              { offset: "0%", color: "rgba(255,255,255,0.22)" },
              { offset: "45%", color: "rgba(255,255,255,0.094)" },
              { offset: "100%", color: "rgba(255,255,255,0.047)" },
            ];

  return (
    <>
      <Svg
        width="100%"
        height="100%"
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        pointerEvents="none"
      >
        <Defs>
          <LinearGradient id={bodyId} x1="0%" y1="0%" x2="100%" y2="100%">
            {bodyStops.map((stop) => (
              <Stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
            ))}
          </LinearGradient>
          <RadialGradient
            id={lensId}
            cx="38%"
            cy="28%"
            rx="95%"
            ry="95%"
          >
            <Stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <Stop offset="50%" stopColor="rgba(255,255,255,0.031)" />
            <Stop offset="82%" stopColor="rgba(255,255,255,0.157)" />
            <Stop offset="100%" stopColor="rgba(255,255,255,0.25)" />
          </RadialGradient>
          <LinearGradient id={specularId} x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="rgba(255,255,255,0.44)" />
            <Stop offset="35%" stopColor="rgba(255,255,255,0.094)" />
            <Stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </LinearGradient>
          <LinearGradient id={rimId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
            <Stop offset="35%" stopColor="rgba(255,255,255,0.27)" />
            <Stop offset="65%" stopColor="rgba(255,255,255,0.094)" />
            <Stop offset="100%" stopColor="rgba(255,255,255,0.4)" />
          </LinearGradient>
        </Defs>
        {variant === "dialog" ? (
          <Rect width="100%" height="100%" rx={radius} fill="rgba(14,20,32,0.8)" />
        ) : null}
        <Rect width="100%" height="100%" rx={radius} fill={`url(#${bodyId})`} />
        <Rect width="100%" height="100%" rx={radius} fill={`url(#${lensId})`} />
        <Rect
          width="100%"
          height={variant === "nav" ? 40 : 52}
          rx={radius}
          fill={`url(#${specularId})`}
        />
      </Svg>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: radius,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.35)",
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 1,
          left: 14,
          right: 14,
          height: 1,
          borderRadius: 0.5,
          backgroundColor: "rgba(255,255,255,0.55)",
          opacity: 0.55,
        }}
      />
    </>
  );
}

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
  showDispersion = true,
  style,
  ...props
}: GlassCardProps) {
  const uid = useId().replace(/:/g, "");
  const radius = CORNER_RADIUS[variant];

  return (
    <View
      className={cn("overflow-hidden", className)}
      style={[glassShadow, { borderRadius: radius }, style]}
      {...props}
    >
      {showDispersion ? (
        <>
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: -1,
              left: -2,
              right: 2,
              bottom: 1,
              borderRadius: radius,
              borderWidth: 1.4,
              borderColor: glassColors.dispersionRed,
              opacity: 0.42,
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: -1,
              left: 2,
              right: -2,
              bottom: 1,
              borderRadius: radius,
              borderWidth: 1.4,
              borderColor: glassColors.dispersionBlue,
              opacity: 0.42,
            }}
          />
        </>
      ) : null}
      <GlassChrome variant={variant} uid={uid} radius={radius} />
      <View className={cn(contentClassName)} style={{ zIndex: 1 }}>
        {children}
      </View>
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
          backgroundColor: "rgba(255, 255, 255, 0.19)",
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
        "rounded-xl border px-6 py-3 items-center justify-center",
        className
      )}
      style={[
        {
          backgroundColor: isPrimary
            ? glassColors.primary
            : "rgba(255, 255, 255, 0.094)",
          borderColor: isPrimary ? glassColors.border : glassColors.borderSubtle,
          borderWidth: 1,
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
          opacity: pressed ? 0.88 : 1,
        },
        style as StyleProp<ViewStyle>,
      ]}
      {...props}
    >
      <GlassButton variant={variant}>{children}</GlassButton>
    </Pressable>
  );
}
