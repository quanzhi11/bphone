/**
 * 好友私聊
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { UserAvatar } from "@/components/user-avatar";
import { useAuth } from "@/lib/auth-context";
import {
  DirectMessageItem,
  formatApiError,
  messagesApi,
  normalizeDirectMessage,
} from "@/lib/_core/booxin-api";
import { glassColors, glassInputStyle } from "@/lib/glass-theme";
import { subscribeDirectMessages } from "@/lib/direct-message-hub";

const KAOMOJI = [
  "(^_^)", "(・∀・)", "(｡･ω･｡)", "(T_T)", "(⊙_⊙)", "orz", "233", "666",
  "👍", "❤", "好的", "收到", "哈哈", "牛逼", "冲鸭", "晚安",
];

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function formatTime(sentAtUtc: string): string {
  const date = new Date(sentAtUtc);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

export default function PrivateChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useAuth();
  const params = useLocalSearchParams<{
    peerUserId: string | string[];
    username?: string | string[];
    avatarUrl?: string | string[];
  }>();

  const peerUserId = firstParam(params.peerUserId);
  const peerName = firstParam(params.username) || "好友";
  const peerAvatar = firstParam(params.avatarUrl) || null;
  const apiRoot = state.authApiRoot;
  const selfUserId = state.user?.id ?? "";

  const [messages, setMessages] = useState<DirectMessageItem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const lastMessageIdRef = useRef(0);
  const listRef = useRef<FlatList<DirectMessageItem>>(null);

  const normalize = useCallback(
    (raw: Partial<DirectMessageItem> & Record<string, unknown>) =>
      normalizeDirectMessage(raw, selfUserId),
    [selfUserId]
  );

  const appendMessage = useCallback(
    (raw: Partial<DirectMessageItem> & Record<string, unknown>) => {
      const message = normalize(raw);
      if (!message.body) {
        return;
      }

      const otherId = message.isMine ? message.receiverId : message.senderId;
      if (otherId.toLowerCase() !== peerUserId.toLowerCase()) {
        return;
      }

      setMessages((prev) => {
        if (prev.some((item) => item.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });

      if (message.id > lastMessageIdRef.current) {
        lastMessageIdRef.current = message.id;
      }
    },
    [normalize, peerUserId]
  );

  const markReadIfNeeded = useCallback(async () => {
    if (lastMessageIdRef.current <= 0) {
      return;
    }
    try {
      await messagesApi.markRead(peerUserId, lastMessageIdRef.current);
    } catch {
      // best-effort
    }
  }, [peerUserId]);

  const scrollToBottom = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated });
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!peerUserId) {
        setStatus("无效的好友 ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const history = await messagesApi.getHistory(peerUserId);
        if (cancelled) {
          return;
        }

        const rawList =
          (history as { messages?: unknown[]; Messages?: unknown[] }).messages ??
          (history as { Messages?: unknown[] }).Messages ??
          [];

        const items = rawList
          .map((item) => normalize(item as Record<string, unknown>))
          .filter((item) => item.body.length > 0);

        setMessages(items);
        if (items.length > 0) {
          lastMessageIdRef.current = items[items.length - 1].id;
        }
        await markReadIfNeeded();
        setStatus(null);
        scrollToBottom(false);
      } catch (error) {
        if (!cancelled) {
          setStatus(formatApiError(error, "加载聊天记录失败"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [peerUserId, normalize, markReadIfNeeded, scrollToBottom]);

  useEffect(() => {
    return subscribeDirectMessages((message) => {
      appendMessage(message as unknown as Record<string, unknown>);
      void markReadIfNeeded();
      scrollToBottom();
    });
  }, [appendMessage, markReadIfNeeded, scrollToBottom]);

  const handleSend = async () => {
    const body = input.trim();
    if (!body || sending) {
      return;
    }
    if (body.length > 500) {
      Alert.alert("提示", "单条消息最多 500 字");
      return;
    }

    try {
      setSending(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const sent = await messagesApi.send(peerUserId, body);
      setInput("");
      appendMessage(sent as unknown as Record<string, unknown>);
      await markReadIfNeeded();
      scrollToBottom();
    } catch (error) {
      Alert.alert("发送失败", formatApiError(error, "无法发送消息"));
    } finally {
      setSending(false);
    }
  };

  const insertKaomoji = (kaomoji: string) => {
    if (input.length + kaomoji.length > 500) {
      Alert.alert("提示", "消息过长");
      return;
    }
    setInput((prev) => prev + kaomoji);
  };

  const renderMessage = useCallback(
    ({ item }: { item: DirectMessageItem }) => (
      <View
        style={[
          styles.messageRow,
          item.isMine ? styles.messageRowMine : styles.messageRowPeer,
        ]}
      >
        {!item.isMine ? (
          <UserAvatar avatarUrl={peerAvatar} apiRoot={apiRoot} size={32} />
        ) : null}
        <View
          style={[
            styles.bubble,
            item.isMine ? styles.bubbleMine : styles.bubblePeer,
          ]}
        >
          <Text style={styles.bubbleText}>{item.body}</Text>
          <Text style={styles.bubbleTime}>{formatTime(item.sentAtUtc)}</Text>
        </View>
      </View>
    ),
    [apiRoot, peerAvatar]
  );

  const listBottomPad = useMemo(
    () => Math.max(insets.bottom, 12) + 120,
    [insets.bottom]
  );

  return (
    <View style={styles.root}>
      <SafeAreaView edges={["top"]} style={styles.safeTop}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>返回</Text>
          </TouchableOpacity>
          <UserAvatar avatarUrl={peerAvatar} apiRoot={apiRoot} size={40} />
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {peerName}
            </Text>
            <Text style={styles.headerSubtitle}>私聊</Text>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.body}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={glassColors.primary} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderMessage}
            style={styles.list}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: listBottomPad },
              messages.length === 0 ? styles.listContentEmpty : null,
            ]}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => scrollToBottom(false)}
            ListEmptyComponent={
              <Text style={styles.emptyText}>暂无聊天记录，发一句打个招呼吧</Text>
            }
          />
        )}
      </View>

      {status ? <Text style={styles.statusText}>{status}</Text> : null}

      <View
        style={[
          styles.inputBar,
          { paddingBottom: Math.max(insets.bottom, Platform.OS === "android" ? 12 : 8) },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kaomojiRow}
          keyboardShouldPersistTaps="handled"
        >
          {KAOMOJI.map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => insertKaomoji(item)}
              style={styles.kaomojiChip}
            >
              <Text style={styles.kaomojiText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="输入消息..."
            placeholderTextColor={glassColors.textSecondary}
            style={styles.textInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={sending || !input.trim()}
            style={[
              styles.sendBtn,
              sending || !input.trim() ? styles.sendBtnDisabled : null,
            ]}
          >
            <Text style={styles.sendText}>发送</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: glassColors.bgPrimary,
  },
  safeTop: {
    backgroundColor: glassColors.bgPrimary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: glassColors.cardBorder,
    backgroundColor: glassColors.bgPrimary,
  },
  backBtn: {
    marginRight: 12,
    paddingVertical: 4,
    paddingRight: 4,
  },
  backText: {
    color: glassColors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    color: glassColors.text,
    fontSize: 17,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: glassColors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  body: {
    flex: 1,
    backgroundColor: glassColors.bgPrimary,
  },
  list: {
    flex: 1,
    backgroundColor: glassColors.bgPrimary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    flexGrow: 1,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: "center",
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: glassColors.textSecondary,
    textAlign: "center",
    fontSize: 14,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  messageRowMine: {
    justifyContent: "flex-end",
  },
  messageRowPeer: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "76%",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
  },
  bubbleMine: {
    backgroundColor: "rgba(85, 184, 232, 0.92)",
    marginLeft: 0,
  },
  bubblePeer: {
    backgroundColor: glassColors.cardBg,
    borderWidth: 1,
    borderColor: glassColors.cardBorder,
  },
  bubbleText: {
    color: "#F2F6FF",
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleTime: {
    color: "rgba(242, 246, 255, 0.55)",
    fontSize: 10,
    marginTop: 4,
    textAlign: "right",
  },
  statusText: {
    color: glassColors.warning,
    fontSize: 12,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  inputBar: {
    borderTopWidth: 1,
    borderTopColor: glassColors.cardBorder,
    backgroundColor: glassColors.tabBarBg,
    paddingTop: 8,
    paddingHorizontal: 12,
  },
  kaomojiRow: {
    paddingBottom: 8,
    alignItems: "center",
  },
  kaomojiChip: {
    backgroundColor: glassColors.cardBg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    borderWidth: 1,
    borderColor: glassColors.cardBorder,
  },
  kaomojiText: {
    color: glassColors.text,
    fontSize: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  textInput: {
    ...glassInputStyle,
    flex: 1,
    maxHeight: 100,
    marginRight: 8,
  },
  sendBtn: {
    backgroundColor: glassColors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 64,
    alignItems: "center",
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
  sendText: {
    color: "#0F1923",
    fontWeight: "700",
    fontSize: 15,
  },
});
