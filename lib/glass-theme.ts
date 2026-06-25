/**
 * 卡片式 UI 配色方案 — 纯色背景 + 简洁卡片
 */

export const glassColors = {
  text: "#F2F6FF",
  textSecondary: "#8B95A8",
  primary: "#55B8E8",
  accent: "#55B8E8",
  border: "rgba(255, 255, 255, 0.12)",
  borderSubtle: "rgba(255, 255, 255, 0.08)",
  highlight: "rgba(255, 255, 255, 0.67)",
  hover: "rgba(85, 184, 232, 0.15)",
  // 纯色背景
  bgPrimary: "#0F1923",
  // 卡片背景
  cardBg: "#1A2332",
  cardBgHover: "#1F2A3A",
  cardBorder: "rgba(255, 255, 255, 0.08)",
  // 底栏
  tabBarBg: "#0D1520",
  tabBarBorder: "rgba(255, 255, 255, 0.08)",
  // 状态色
  success: "#34D399",
  warning: "#FBBF24",
  danger: "#F87171",
  // 兼容旧引用
  bgTop: "#0F1923",
  bgMid: "#0F1923",
  bgBottom: "#0F1923",
  orbCyan: "transparent",
  orbIndigo: "transparent",
  orbTeal: "transparent",
  orbRose: "transparent",
  dispersionRed: "transparent",
  dispersionBlue: "transparent",
} as const;

export const glassShadow = {
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 4,
} as const;

export const glassInputStyle = {
  color: glassColors.text,
  borderColor: glassColors.border,
  backgroundColor: "rgba(255, 255, 255, 0.06)",
  borderWidth: 1,
  borderRadius: 10,
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontSize: 15,
} as const;
