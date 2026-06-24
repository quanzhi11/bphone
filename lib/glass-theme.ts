/**
 * 与 PC 端 Themes/GlassStyles.xaml 对齐的液态玻璃色板
 */

export const glassColors = {
  text: "#F2F6FF",
  textSecondary: "#A0AEC8",
  primary: "rgba(102, 74, 157, 0.83)",
  accent: "rgba(85, 184, 232, 0.47)",
  border: "rgba(255, 255, 255, 0.4)",
  borderSubtle: "rgba(255, 255, 255, 0.2)",
  highlight: "rgba(255, 255, 255, 0.67)",
  hover: "rgba(50, 130, 184, 0.25)",
  bgTop: "#0A0C14",
  bgMid: "#12182A",
  bgBottom: "#1A1030",
  orbCyan: "rgba(50, 130, 184, 0.44)",
  orbIndigo: "rgba(99, 102, 241, 0.38)",
  orbTeal: "rgba(20, 184, 166, 0.27)",
  orbRose: "rgba(236, 72, 153, 0.21)",
  dispersionRed: "rgba(255, 107, 138, 0.42)",
  dispersionBlue: "rgba(107, 170, 255, 0.42)",
} as const;

export const glassShadow = {
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.22,
  shadowRadius: 10,
  elevation: 8,
} as const;

export const glassInputStyle = {
  color: glassColors.text,
  borderColor: glassColors.borderSubtle,
  backgroundColor: "rgba(255, 255, 255, 0.19)",
  borderWidth: 1,
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 12,
} as const;
