/**
 * PC 端液态玻璃环境背景：深色渐变 + 彩色光晕球
 */

import React from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
  Circle,
} from "react-native-svg";

import { glassColors } from "@/lib/glass-theme";

export function LiquidGlassBackground({ style, ...props }: ViewProps) {
  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none" {...props}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="glassBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={glassColors.bgTop} />
            <Stop offset="40%" stopColor={glassColors.bgMid} />
            <Stop offset="100%" stopColor={glassColors.bgBottom} />
          </LinearGradient>
          <RadialGradient id="orbCyan" cx="15%" cy="20%" rx="65%" ry="65%">
            <Stop offset="0%" stopColor={glassColors.orbCyan} />
            <Stop offset="100%" stopColor="rgba(50, 130, 184, 0)" />
          </RadialGradient>
          <RadialGradient id="orbIndigo" cx="85%" cy="35%" rx="55%" ry="55%">
            <Stop offset="0%" stopColor={glassColors.orbIndigo} />
            <Stop offset="100%" stopColor="rgba(99, 102, 241, 0)" />
          </RadialGradient>
          <RadialGradient id="orbTeal" cx="30%" cy="90%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={glassColors.orbTeal} />
            <Stop offset="100%" stopColor="rgba(20, 184, 166, 0)" />
          </RadialGradient>
          <RadialGradient id="orbRose" cx="70%" cy="75%" rx="45%" ry="45%">
            <Stop offset="0%" stopColor={glassColors.orbRose} />
            <Stop offset="100%" stopColor="rgba(236, 72, 153, 0)" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#glassBg)" />
        <Circle cx="15%" cy="20%" r="42%" fill="url(#orbCyan)" />
        <Circle cx="85%" cy="35%" r="36%" fill="url(#orbIndigo)" />
        <Circle cx="30%" cy="90%" r="32%" fill="url(#orbTeal)" />
        <Circle cx="70%" cy="75%" r="30%" fill="url(#orbRose)" />
      </Svg>
    </View>
  );
}
