/**
 * Booxin API 客户端
 * 
 * 提供对 Booxin 服务器的 HTTP 请求封装
 * - BooxinMultiplayerAuthApi (端口 5005): 认证、好友、用户管理
 * - BooxinApi (端口 5000): 房间列表、Relay 节点
 */

import axios, { AxiosInstance, AxiosError } from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// API 基础 URL
// 支持多个候选地址，按顺序尝试
// 优先使用 HTTPS 反代地址（有效证书），备用 HTTP 直连
const AUTH_API_URLS = [
  "https://boonix.art/bbx",
  "https://175.178.174.103/bbx",
  "http://175.178.174.103:5005",
];

const ROOM_API_URLS = [
  "http://175.178.174.103:5000",  // 房间 API 没有 HTTPS 反代，使用 HTTP 直连
];

// 当前使用的 URL（默认使用第一个）
let currentAuthUrl = AUTH_API_URLS[0];
let currentRoomUrl = ROOM_API_URLS[0];

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export const getAuthApiRoot = () => currentAuthUrl;

export function formatApiError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
    if (!error.response) {
      if (error.code === "ECONNABORTED") {
        return "请求超时，请稍后重试";
      }
      return "无法连接联机服务器，请检查网络";
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

async function withAuthFailover<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  const tried = new Set<string>();

  while (tried.size < AUTH_API_URLS.length) {
    tried.add(currentAuthUrl);
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const canRetry =
        axios.isAxiosError(error) &&
        !error.response &&
        switchAuthUrl() &&
        !tried.has(currentAuthUrl);
      if (!canRetry) {
        throw error;
      }
    }
  }

  throw lastError;
}

// URL 切换函数（如果某个 URL 失败，自动尝试下一个）
export const switchAuthUrl = () => {
  const currentIndex = AUTH_API_URLS.indexOf(currentAuthUrl);
  if (currentIndex < AUTH_API_URLS.length - 1) {
    currentAuthUrl = AUTH_API_URLS[currentIndex + 1];
    console.log(`[API] Switched Auth URL to: ${currentAuthUrl}`);
    return true;
  }
  return false;
};

export const switchRoomUrl = () => {
  const currentIndex = ROOM_API_URLS.indexOf(currentRoomUrl);
  if (currentIndex < ROOM_API_URLS.length - 1) {
    currentRoomUrl = ROOM_API_URLS[currentIndex + 1];
    console.log(`[API] Switched Room URL to: ${currentRoomUrl}`);
    return true;
  }
  return false;
};

// Token 存储 key
const TOKEN_STORAGE_KEY = "booxin_access_token";
const TOKEN_EXPIRY_KEY = "booxin_token_expiry";

// ============ 类型定义 ============

export interface User {
  id: string;
  username: string;
  avatarUrl?: string | null;
  email?: string | null;
  isEmailVerified?: boolean;
  createdAtUtc: string;
  lastLoginAtUtc?: string;
  isOnline?: boolean;
  isInRoom?: boolean;
  isFriend?: boolean;
  hasPendingOutgoingRequest?: boolean;
  hasPendingIncomingRequest?: boolean;
  pendingIncomingRequestId?: string | null;
}

export interface AuthToken {
  accessToken: string;
  tokenType: string;
  expiresAtUtc: string;
  user: User;
}

export interface Room {
  id: string;
  roomCode: string;
  hostName: string;
  motd: string;
  remark?: string;
  port: number;
  maxPlayers: number;
  currentPlayers: number;
  isPublic: boolean;
  version: string;
  modpackUrl?: string;
  modpackGameVersion?: string;
  modpackLoader?: string;
  createdAt: string;
  status: string;
}

export interface Friend {
  userId: string;
  username: string;
  avatarUrl?: string | null;
  isOnline: boolean;
  isInRoom: boolean;
  roomCode?: string;
  modpackUrl?: string;
  modpackGameVersion?: string;
  modpackLoader?: string;
  presenceUpdatedAtUtc: string;
}

export interface FriendRequest {
  requestId: string;
  userId: string;
  username: string;
  avatarUrl?: string | null;
  createdAtUtc: string;
}

export interface RoomInvite {
  inviteId: string;
  senderUserId: string;
  senderUsername: string;
  senderAvatarUrl?: string | null;
  roomCode: string;
  modpackUrl?: string;
  modpackGameVersion?: string;
  modpackLoader?: string;
  createdAtUtc: string;
}

export interface FriendsDashboard {
  friends: Friend[];
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
  pendingRoomInvites: RoomInvite[];
}

export interface DirectMessageItem {
  id: number;
  senderId: string;
  receiverId: string;
  body: string;
  sentAtUtc: string;
  isMine: boolean;
}

export function normalizeDirectMessage(
  raw: Partial<DirectMessageItem> & Record<string, unknown>,
  selfUserId: string
): DirectMessageItem {
  const senderId = String(raw.senderId ?? raw.SenderId ?? "");
  const receiverId = String(raw.receiverId ?? raw.ReceiverId ?? "");
  const body = String(raw.body ?? raw.Body ?? "").trim();
  const sentAtUtc = String(raw.sentAtUtc ?? raw.SentAtUtc ?? "");
  const id = Number(raw.id ?? raw.Id ?? 0);
  const isMine =
    Boolean(raw.isMine ?? raw.IsMine) ||
    (selfUserId.length > 0 &&
      senderId.toLowerCase() === selfUserId.toLowerCase());

  return { id, senderId, receiverId, body, sentAtUtc, isMine };
}

export interface DirectMessageHistory {
  messages: DirectMessageItem[];
}

export interface DirectMessageConversation {
  peerUserId: string;
  peerUsername: string;
  peerAvatarUrl?: string | null;
  lastMessageBody: string;
  lastMessageAtUtc: string;
  unreadCount: number;
}

export interface DirectMessageConversations {
  conversations: DirectMessageConversation[];
}

export interface RoomModpack {
  roomCode: string;
  modpackUrl?: string;
  modpackGameVersion?: string;
  modpackLoader?: string;
}

export interface RelayNode {
  address: string;
  region: string;
  priority: number;
  status: string;
}

export interface PaginatedResponse<T> {
  results?: T[];
  users?: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// ============ Token 管理 ============

export const tokenManager = {
  async saveToken(token: string, expiresAtUtc: string) {
    try {
      if (Platform.OS === "web") {
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
        await AsyncStorage.setItem(TOKEN_EXPIRY_KEY, expiresAtUtc);
      } else {
        await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token);
        await SecureStore.setItemAsync(TOKEN_EXPIRY_KEY, expiresAtUtc);
      }
    } catch (error) {
      console.error("Failed to save token:", error);
    }
  },

  async getToken(): Promise<string | null> {
    try {
      if (Platform.OS === "web") {
        return await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      } else {
        return await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
      }
    } catch (error) {
      console.error("Failed to get token:", error);
      return null;
    }
  },

  async clearToken() {
    try {
      if (Platform.OS === "web") {
        await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
        await AsyncStorage.removeItem(TOKEN_EXPIRY_KEY);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
        await SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY);
      }
    } catch (error) {
      console.error("Failed to clear token:", error);
    }
  },

  async getTokenExpiry(): Promise<string | null> {
    try {
      if (Platform.OS === "web") {
        return await AsyncStorage.getItem(TOKEN_EXPIRY_KEY);
      }
      return await SecureStore.getItemAsync(TOKEN_EXPIRY_KEY);
    } catch (error) {
      console.error("Failed to get token expiry:", error);
      return null;
    }
  },

  async isTokenExpired(): Promise<boolean> {
    try {
      const expiryStr = await tokenManager.getTokenExpiry();
      if (!expiryStr) return true;
      return new Date(expiryStr) <= new Date();
    } catch (error) {
      console.error("Failed to check token expiry:", error);
      return true;
    }
  },
};

// ============ API 实例工厂 ============

const createAxiosInstance = (baseURL: string): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // 请求拦截器：自动添加 Authorization header
  instance.interceptors.request.use(
    async (config) => {
      const token = await tokenManager.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // 响应拦截器：处理错误
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        void tokenManager.clearToken();
        unauthorizedHandler?.();
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

async function authRequest<T>(call: (instance: AxiosInstance) => Promise<T>): Promise<T> {
  return withAuthFailover(() => call(createAxiosInstance(currentAuthUrl)));
}

// ============ BooxinMultiplayerAuthApi (端口 5005) ============

export const authApi = {
  async getPublicKey() {
    const response = await authRequest((instance) => instance.get("/api/auth/public-key"));
    return response.data;
  },

  async register(username: string, password: string, email: string, emailCode: string): Promise<AuthToken> {
    const response = await authRequest((instance) =>
      instance.post("/api/auth/register", { username, password, email, emailCode })
    );
    return response.data;
  },

  async sendRegisterCode(email: string): Promise<{ message: string }> {
    const response = await authRequest((instance) =>
      instance.post("/api/auth/register/send-code", { email })
    );
    return response.data;
  },

  async sendEmailLoginCode(email: string): Promise<{ message: string }> {
    const response = await authRequest((instance) =>
      instance.post("/api/auth/email/login/send-code", { email })
    );
    return response.data;
  },

  async loginWithEmail(email: string, code: string): Promise<AuthToken> {
    const response = await authRequest((instance) =>
      instance.post("/api/auth/email/login", { email, code })
    );
    return response.data;
  },

  async sendPasswordResetCode(email: string): Promise<{ message: string }> {
    const response = await authRequest((instance) =>
      instance.post("/api/auth/password/forgot/send-code", { email })
    );
    return response.data;
  },

  async resetPassword(email: string, code: string, newPassword: string): Promise<{ message: string }> {
    const response = await authRequest((instance) =>
      instance.post("/api/auth/password/reset", { email, code, newPassword })
    );
    return response.data;
  },

  async login(username: string, password: string): Promise<AuthToken> {
    const response = await authRequest((instance) =>
      instance.post("/api/auth/login", { username, password })
    );
    return response.data;
  },

  async validate(accessToken: string) {
    const response = await authRequest((instance) =>
      instance.post("/api/auth/validate", { accessToken })
    );
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await authRequest((instance) => instance.get("/api/auth/me"));
    return response.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await authRequest((instance) =>
      instance.post("/api/auth/change-password", { currentPassword, newPassword })
    );
    return response.data;
  },

  async searchUsers(query: string, limit: number = 10): Promise<PaginatedResponse<User>> {
    const response = await authRequest((instance) =>
      instance.get("/api/auth/users/search", { params: { query, limit } })
    );
    return response.data;
  },

  async getLobbyUsers(
    page: number = 1,
    pageSize: number = 30,
    onlineOnly: boolean = false,
    query: string = ""
  ): Promise<PaginatedResponse<User>> {
    const response = await authRequest((instance) =>
      instance.get("/api/auth/users/lobby", { params: { page, pageSize, onlineOnly, query } })
    );
    return response.data;
  },

  async uploadAvatar(uri: string, mimeType: string, fileName: string): Promise<User> {
    return withAuthFailover(async () => {
      const token = await tokenManager.getToken();
      const formData = new FormData();
      formData.append("file", {
        uri,
        type: mimeType,
        name: fileName,
      } as unknown as Blob);

      const response = await axios.post<User>(`${currentAuthUrl}/api/auth/avatar`, formData, {
        timeout: 30000,
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        transformRequest: (data) => data,
      });
      return response.data;
    });
  },

  async deleteAvatar(): Promise<void> {
    await authRequest((instance) => instance.delete("/api/auth/avatar"));
  },

  async sendEmailBindCode(email: string): Promise<{ message: string }> {
    const response = await authRequest((instance) =>
      instance.post("/api/auth/email/send-code", { email })
    );
    return response.data;
  },

  async verifyEmailBind(email: string, code: string): Promise<User> {
    const response = await authRequest((instance) =>
      instance.post("/api/auth/email/verify", { email, code })
    );
    return response.data;
  },

  async unbindEmail(): Promise<User> {
    const response = await authRequest((instance) => instance.delete("/api/auth/email"));
    return response.data;
  },
};

async function friendsRequest<T>(call: (instance: AxiosInstance) => Promise<T>): Promise<T> {
  return withAuthFailover(() => call(createAxiosInstance(currentAuthUrl)));
}

// ============ Friends API (端口 5005) ============

export const friendsApi = {
  async getFriendsDashboard(): Promise<FriendsDashboard> {
    const response = await friendsRequest((instance) => instance.get("/api/friends"));
    return response.data;
  },

  async sendFriendRequest(targetUserId?: string, username?: string): Promise<{ message: string }> {
    const payload = targetUserId ? { targetUserId } : { username };
    const response = await friendsRequest((instance) =>
      instance.post("/api/friends/request", payload)
    );
    return response.data;
  },

  async acceptFriendRequest(requestId: string): Promise<{ message: string }> {
    const response = await friendsRequest((instance) =>
      instance.post(`/api/friends/requests/${requestId}/accept`)
    );
    return response.data;
  },

  async rejectFriendRequest(requestId: string): Promise<{ message: string }> {
    const response = await friendsRequest((instance) =>
      instance.post(`/api/friends/requests/${requestId}/reject`)
    );
    return response.data;
  },

  async deleteFriend(friendUserId: string): Promise<{ message: string }> {
    const response = await friendsRequest((instance) =>
      instance.delete(`/api/friends/${friendUserId}`)
    );
    return response.data;
  },

  async updatePresence(
    roomCode: string | null,
    isInRoom: boolean,
    modpackUrl?: string,
    modpackGameVersion?: string,
    modpackLoader?: string
  ): Promise<{ message: string }> {
    const payload: Record<string, unknown> = { roomCode, isInRoom };
    if (modpackUrl) payload.modpackUrl = modpackUrl;
    if (modpackGameVersion) payload.modpackGameVersion = modpackGameVersion;
    if (modpackLoader) payload.modpackLoader = modpackLoader;

    const response = await friendsRequest((instance) =>
      instance.post("/api/friends/presence", payload)
    );
    return response.data;
  },

  async getRoomModpack(roomCode: string): Promise<RoomModpack> {
    const response = await friendsRequest((instance) =>
      instance.get("/api/friends/room-modpack", { params: { roomCode } })
    );
    return response.data;
  },

  async inviteFriend(friendUserId: string): Promise<{ message: string }> {
    const response = await friendsRequest((instance) =>
      instance.post("/api/friends/invites", { friendUserId })
    );
    return response.data;
  },

  async dismissRoomInvite(inviteId: string): Promise<{ message: string }> {
    const response = await friendsRequest((instance) =>
      instance.post(`/api/friends/invites/${inviteId}/dismiss`)
    );
    return response.data;
  },
};

async function messagesRequest<T>(call: (instance: AxiosInstance) => Promise<T>): Promise<T> {
  return withAuthFailover(() => call(createAxiosInstance(currentAuthUrl)));
}

export const messagesApi = {
  async send(receiverId: string, body: string): Promise<DirectMessageItem> {
    const response = await messagesRequest((instance) =>
      instance.post("/api/messages", { receiverId, body })
    );
    return response.data;
  },

  async getHistory(peerUserId: string, afterId: number = 0): Promise<DirectMessageHistory> {
    const response = await messagesRequest((instance) =>
      instance.get(`/api/messages/with/${peerUserId}`, { params: { afterId } })
    );
    return response.data;
  },

  async markRead(peerUserId: string, upToMessageId: number): Promise<void> {
    await messagesRequest((instance) =>
      instance.post("/api/messages/read", { peerUserId, upToMessageId })
    );
  },

  async getConversations(): Promise<DirectMessageConversations> {
    const response = await messagesRequest((instance) =>
      instance.get("/api/messages/conversations")
    );
    return response.data;
  },
};

// ============ BooxinApi (端口 5000) ============

export const roomsApi = {
  async getPublicRooms(): Promise<Room[]> {
    const instance = createAxiosInstance(currentRoomUrl);
    const response = await instance.get("/api/rooms", {
      params: { isPublic: true },
    });
    return response.data;
  },

  async getRoomDetails(roomCode: string): Promise<Room> {
    const instance = createAxiosInstance(currentRoomUrl);
    const response = await instance.get(`/api/rooms/${roomCode}`);
    return response.data;
  },

  async createOrUpdateRoom(roomData: {
    roomCode: string;
    hostId: string;
    hostName: string;
    motd: string;
    remark?: string;
    port: number;
    maxPlayers: number;
    isPublic: boolean;
    version: string;
    modpackUrl?: string;
    modpackGameVersion?: string;
    modpackLoader?: string;
  }): Promise<Room> {
    const instance = createAxiosInstance(currentRoomUrl);
    const response = await instance.post("/api/rooms", roomData);
    return response.data;
  },

  async deleteRoom(roomCode: string): Promise<{ message: string }> {
    const instance = createAxiosInstance(currentRoomUrl);
    const response = await instance.delete(`/api/rooms/${roomCode}`);
    return response.data;
  },

  async joinRoom(
    roomCode: string,
    playerId: string,
    playerName: string,
    vendor: string = "BooxinLauncher"
  ): Promise<{ message: string }> {
    const instance = createAxiosInstance(currentRoomUrl);
    const response = await instance.post(`/api/rooms/${roomCode}/join`, {
      roomCode,
      playerId,
      playerName,
      vendor,
    });
    return response.data;
  },

  async leaveRoom(roomCode: string, playerId: string): Promise<{ message: string }> {
    const instance = createAxiosInstance(currentRoomUrl);
    const response = await instance.post(`/api/rooms/${roomCode}/leave`, playerId);
    return response.data;
  },

  async pingRoom(roomCode: string): Promise<{ message: string }> {
    const instance = createAxiosInstance(currentRoomUrl);
    const response = await instance.post(`/api/rooms/${roomCode}/ping`);
    return response.data;
  },
};

// ============ Relay API (端口 5000) ============

export const relayApi = {
  async getRelayNodes(): Promise<RelayNode[]> {
    const instance = createAxiosInstance(currentRoomUrl);
    const response = await instance.get("/api/relay");
    return response.data;
  },
};

// ============ Health Check ============

export const healthApi = {
  async checkAuthHealth() {
    const instance = createAxiosInstance(currentAuthUrl);
    const response = await instance.get("/api/health");
    return response.data;
  },

  async checkRoomHealth() {
    const instance = createAxiosInstance(currentRoomUrl);
    const response = await instance.get("/api/health");
    return response.data;
  },
};
