import { View, type ViewProps } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { LiquidGlassBackground } from "@/components/liquid-glass-background";
import { cn } from "@/lib/utils";

export interface ScreenContainerProps extends ViewProps {
  edges?: Edge[];
  className?: string;
  containerClassName?: string;
  safeAreaClassName?: string;
  /** 使用 PC 端同款深色液态玻璃环境背景 */
  glass?: boolean;
}

export function ScreenContainer({
  children,
  edges = ["top", "left", "right"],
  className,
  containerClassName,
  safeAreaClassName,
  glass = true,
  style,
  ...props
}: ScreenContainerProps) {
  return (
    <View className={cn("flex-1", containerClassName)} {...props}>
      {glass ? <LiquidGlassBackground /> : null}
      <SafeAreaView
        edges={edges}
        className={cn("flex-1", safeAreaClassName)}
        style={style}
      >
        <View className={cn("flex-1", className)}>{children}</View>
      </SafeAreaView>
    </View>
  );
}
