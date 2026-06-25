/**
 * 纯色背景 — 替代液态玻璃渐变背景
 */

import React from "react";
import { StyleSheet, View, type ViewProps } from "react-native";

import { glassColors } from "@/lib/glass-theme";

export function LiquidGlassBackground({ style, ...props }: ViewProps) {
  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: glassColors.bgPrimary }, style]}
      pointerEvents="none"
      {...props}
    />
  );
}
