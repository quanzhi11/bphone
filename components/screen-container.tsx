import { View, type ViewProps } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { glassColors } from "@/lib/glass-theme";

export interface ScreenContainerProps extends ViewProps {
  edges?: Edge[];
}

export function ScreenContainer({
  children,
  edges = ["top", "left", "right"],
  style,
  ...props
}: ScreenContainerProps) {
  return (
    <View style={[{ flex: 1, backgroundColor: glassColors.bgPrimary }]}>
      <SafeAreaView
        edges={edges}
        style={{ flex: 1, backgroundColor: glassColors.bgPrimary }}
      >
        <View style={[{ flex: 1, backgroundColor: glassColors.bgPrimary }, style]}>
          {children}
        </View>
      </SafeAreaView>
    </View>
  );
}
