/**
 * 通知上下文
 * 
 * 管理全局通知状态和事件
 */

import React, { createContext, useContext, useState, useCallback } from "react";
import { RoomInvite } from "@/lib/_core/booxin-api";

export interface NotificationContextType {
  pendingInvite: RoomInvite | null;
  showInviteNotification: (invite: RoomInvite) => void;
  dismissInviteNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [pendingInvite, setPendingInvite] = useState<RoomInvite | null>(null);

  const showInviteNotification = useCallback((invite: RoomInvite) => {
    setPendingInvite(invite);
  }, []);

  const dismissInviteNotification = useCallback(() => {
    setPendingInvite(null);
  }, []);

  const value: NotificationContextType = {
    pendingInvite,
    showInviteNotification,
    dismissInviteNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
}
