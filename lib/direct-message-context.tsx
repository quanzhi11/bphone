import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Alert } from "react-native";
import { usePathname } from "expo-router";

import { DirectMessageItem } from "@/lib/_core/booxin-api";
import { useAuth } from "@/lib/auth-context";
import {
  ensureDirectMessageHubConnected,
  stopDirectMessageHub,
  subscribeDirectMessages,
} from "@/lib/direct-message-hub";

interface DirectMessageContextValue {
  lastIncomingPreview: string | null;
}

const DirectMessageContext = createContext<DirectMessageContextValue | undefined>(
  undefined
);

function getPeerIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/chat\/([^/]+)/);
  return match?.[1] ?? null;
}

export function DirectMessageProvider({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();
  const pathname = usePathname();
  const [lastIncomingPreview, setLastIncomingPreview] = useState<string | null>(null);

  const handleIncoming = useCallback(
    (message: DirectMessageItem) => {
      if (message.isMine) {
        return;
      }

      const activePeerId = getPeerIdFromPath(pathname);
      const peerId =
        message.senderId === state.user?.id ? message.receiverId : message.senderId;
      if (activePeerId === peerId) {
        return;
      }

      const preview =
        message.body.length > 40 ? `${message.body.slice(0, 40)}...` : message.body;
      setLastIncomingPreview(preview);
      Alert.alert("新私聊消息", preview);
    },
    [pathname, state.user?.id]
  );

  useEffect(() => {
    if (!state.userToken || !state.user?.id) {
      void stopDirectMessageHub();
      return;
    }

    void ensureDirectMessageHubConnected(state.user.id).catch(() => {
      // Hub is best-effort; REST still works.
    });

    return subscribeDirectMessages(handleIncoming);
  }, [state.userToken, state.user?.id, handleIncoming]);

  const value = useMemo(
    () => ({ lastIncomingPreview }),
    [lastIncomingPreview]
  );

  return (
    <DirectMessageContext.Provider value={value}>
      {children}
    </DirectMessageContext.Provider>
  );
}

export function useDirectMessages() {
  const context = useContext(DirectMessageContext);
  if (!context) {
    throw new Error("useDirectMessages must be used within DirectMessageProvider");
  }
  return context;
}
