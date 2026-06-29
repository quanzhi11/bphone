import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { View } from "react-native";
import { colorScheme as nativewindColorScheme } from "nativewind";

import { SchemeColors, type ColorScheme } from "@/constants/theme";
import { glassColors } from "@/lib/glass-theme";

type ThemeContextValue = {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Booxin 手机版固定深色 UI，不跟随系统浅色模式。 */
const APP_COLOR_SCHEME: ColorScheme = "dark";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const applyScheme = useCallback((scheme: ColorScheme) => {
    nativewindColorScheme.set(scheme);
  }, []);

  useEffect(() => {
    applyScheme(APP_COLOR_SCHEME);
  }, [applyScheme]);

  const value = useMemo(
    () => ({
      colorScheme: APP_COLOR_SCHEME,
      setColorScheme: applyScheme,
    }),
    [applyScheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      <View style={{ flex: 1, backgroundColor: glassColors.bgPrimary }}>
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }
  return ctx;
}

export { SchemeColors };
