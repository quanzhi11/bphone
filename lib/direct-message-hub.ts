import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import {
  DirectMessageItem,
  getAuthApiRoot,
  normalizeDirectMessage,
  tokenManager,
} from "@/lib/_core/booxin-api";

type MessageHandler = (message: DirectMessageItem) => void;

let connection: HubConnection | null = null;
let handlers = new Set<MessageHandler>();
let connecting: Promise<void> | null = null;

function mapPayload(payload: Record<string, unknown>, selfUserId: string): DirectMessageItem {
  return normalizeDirectMessage(payload, selfUserId);
}

export function subscribeDirectMessages(handler: MessageHandler): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

function notifyHandlers(message: DirectMessageItem) {
  for (const handler of handlers) {
    handler(message);
  }
}

export async function ensureDirectMessageHubConnected(selfUserId: string): Promise<void> {
  if (connection?.state === HubConnectionState.Connected) {
    return;
  }

  if (connecting) {
    await connecting;
    return;
  }

  connecting = (async () => {
    await stopDirectMessageHub();

    const token = await tokenManager.getToken();
    if (!token) {
      return;
    }

    const hubUrl = `${getAuthApiRoot().replace(/\/$/, "")}/hubs/chat`;
    connection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: async () => (await tokenManager.getToken()) ?? "",
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on("ReceiveMessage", (payload: Record<string, unknown>) => {
      notifyHandlers(mapPayload(payload, selfUserId));
    });
    connection.on("MessageSent", (payload: Record<string, unknown>) => {
      notifyHandlers(mapPayload(payload, selfUserId));
    });
    connection.on("PendingMessages", (payloads: Record<string, unknown>[]) => {
      for (const payload of payloads) {
        notifyHandlers(mapPayload(payload, selfUserId));
      }
    });

    await connection.start();
  })();

  try {
    await connecting;
  } finally {
    connecting = null;
  }
}

export async function stopDirectMessageHub(): Promise<void> {
  if (!connection) {
    return;
  }

  try {
    await connection.stop();
  } catch {
    // ignore
  } finally {
    connection = null;
  }
}

export function isDirectMessageHubConnected(): boolean {
  return connection?.state === HubConnectionState.Connected;
}
