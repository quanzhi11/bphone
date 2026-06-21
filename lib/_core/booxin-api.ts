/**
 * Booxin API 客户端
 * 
 * 提供对 Booxin 服务器的 HTTP 请求封装
 * - BooxinMultiplayerAuthApi (端口 5005): 认证、好友、用户管理
 * - BooxinApi (端口 5000): 房间列表、Relay 节点
 */

import axios, { AxiosInstance, AxiosError } from "axios";
import * as SecureStore from "expo-secure-store";

// API 基础 URL（支持直连和 HTTPS 反代）
const AUTH_API_BASE = "https://175.178.174.103/bbx";
const ROOM_API_BASE = "http://175.178.174.103:5000";

// Token 存储 key
const TOKEN_STORAGE_KEY = "booxin_access_token";
const TOKEN_EXPIRY_KEY = "booxin_token_expiry";

// API 响应类型
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  isValid?: boolean;
  status?: string;
  timestamp?: string;
  version?: string;
  results?: T[];
  users?: T[];
  friends?: T[];
  incomingRequests?: T[];
  outgoingRequests?: T[];
  pendingRoomInvites?: T[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}

// 用户相关类型
export interface User {
  id: string;
  username: string;
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

// 房间相关类型
export interface Room {
  id: string;
  roomCode: string;
  hostName: string;
  motd: string;
  remark: string;
  port: number;
  maxPlayers: number;
  currentPlayers: number;
  isPublic: boolean;
  version: string;
  modpackUrl: string;
  modpackGameVersion: string;
  modpackLoader: string;
  createdAt: string;
  status: "Active" | "Inactive";
}

// 好友相关类型
export interface Friend {
  userId: string;
  username: string;
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
  createdAtUtc: string;
}

export interface RoomInvite {
  inviteId: string;
  senderUserId: string;
  senderUsername: string;
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

export interface LobbyUser extends User {
  lastLoginAtUtc: string;
  isOnline: boolean;
  isInRoom: boolean;
  isFriend: boolean;
  hasPendingOutgoingRequest: boolean;
  hasPendingIncomingRequest: boolean;
  pendingIncomingRequestId: string | null;
}

export interface LobbyResponse {
  users: LobbyUser[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// 创建 Axios 实例
const createAuthApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: AUTH_API_BASE,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // 请求拦截器：自动注入 Token
  client.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // 响应拦截器：处理错误
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        // Token 过期或无效，清除本地存储
        SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
        SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY);
      }
      return Promise.reject(error);
    }
  );

  return client;
};

const createRoomApiClient = (): AxiosInstance => {
  return axios.create({
    baseURL: ROOM_API_BASE,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

// 创建客户端实例
const authClient = createAuthApiClient();
const roomClient = createRoomApiClient();

// ============ 认证 API ============

export const authApi = {
  /**
   * 获取 JWT 验签公钥
   */
  async getPublicKey() {
    const response = await authClient.get("/api/auth/public-key");
    return response.data;
  },

  /**
   * 注册
   */
  async register(username: string, password: string) {
    const response = await authClient.post<AuthToken>("/api/auth/register", {
      username,
      password,
    });
    return response.data;
  },

  /**
   * 登录
   */
  async login(username: string, password: string) {
    const response = await authClient.post<AuthToken>("/api/auth/login", {
      username,
      password,
    });
    return response.data;
  },

  /**
   * 验证 Token
   */
  async validate(accessToken: string) {
    const response = await authClient.post("/api/auth/validate", {
      accessToken,
    });
    return response.data;
  },

  /**
   * 获取当前用户信息
   */
  async getCurrentUser() {
    const response = await authClient.get<User>("/api/auth/me");
    return response.data;
  },

  /**
   * 修改密码
   */
  async changePassword(currentPassword: string, newPassword: string) {
    const response = await authClient.post("/api/auth/change-password", {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  /**
   * 搜索用户（加好友用）
   */
  async searchUsers(query: string, limit: number = 10) {
    const response = await authClient.get<{ results: User[] }>(
      "/api/auth/users/search",
      {
        params: { query, limit },
      }
    );
    return response.data;
  },

  /**
   * 获取用户大厅（分页）
   */
  async getLobbyUsers(
    page: number = 1,
    pageSize: number = 30,
    onlineOnly: boolean = false,
    query: string = ""
  ) {
    const response = await authClient.get<LobbyResponse>(
      "/api/auth/users/lobby",
      {
        params: { page, pageSize, onlineOnly, query },
      }
    );
    return response.data;
  },
};

// ============ 好友 API ============

export const friendsApi = {
  /**
   * 获取好友面板（好友/申请/邀请）
   */
  async getDashboard() {
    const response = await authClient.get<FriendsDashboard>("/api/friends");
    return response.data;
  },

  /**
   * 发送好友申请
   */
  async sendRequest(targetUserIdOrUsername: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        targetUserIdOrUsername
      );

    const payload = isUuid
      ? { targetUserId: targetUserIdOrUsername }
      : { username: targetUserIdOrUsername };

    const response = await authClient.post("/api/friends/request", payload);
    return response.data;
  },

  /**
   * 同意好友申请
   */
  async acceptRequest(requestId: string) {
    const response = await authClient.post(
      `/api/friends/requests/${requestId}/accept`
    );
    return response.data;
  },

  /**
   * 拒绝好友申请
   */
  async rejectRequest(requestId: string) {
    const response = await authClient.post(
      `/api/friends/requests/${requestId}/reject`
    );
    return response.data;
  },

  /**
   * 删除好友
   */
  async removeFriend(friendUserId: string) {
    const response = await authClient.delete(`/api/friends/${friendUserId}`);
    return response.data;
  },

  /**
   * 上报在线/在房状态
   */
  async updatePresence(
    roomCode: string | null,
    isInRoom: boolean,
    modpackUrl?: string,
    modpackGameVersion?: string,
    modpackLoader?: string
  ) {
    const payload: any = {
      roomCode,
      isInRoom,
    };

    if (modpackUrl) payload.modpackUrl = modpackUrl;
    if (modpackGameVersion) payload.modpackGameVersion = modpackGameVersion;
    if (modpackLoader) payload.modpackLoader = modpackLoader;

    const response = await authClient.post("/api/friends/presence", payload);
    return response.data;
  },

  /**
   * 查房间整合包信息
   */
  async getRoomModpack(roomCode: string) {
    const response = await authClient.get("/api/friends/room-modpack", {
      params: { roomCode },
    });
    return response.data;
  },

  /**
   * 邀请好友进房
   */
  async inviteToRoom(friendUserId: string) {
    const response = await authClient.post("/api/friends/invites", {
      friendUserId,
    });
    return response.data;
  },

  /**
   * 处理（忽略）房间邀请
   */
  async dismissInvite(inviteId: string) {
    const response = await authClient.post(
      `/api/friends/invites/${inviteId}/dismiss`
    );
    return response.data;
  },
};

// ============ 房间 API ============

export const roomsApi = {
  /**
   * 获取公共房间列表
   */
  async getPublicRooms() {
    const response = await roomClient.get<Room[]>("/api/rooms", {
      params: { isPublic: true },
    });
    return response.data;
  },

  /**
   * 获取单个房间详情
   */
  async getRoomDetail(roomCode: string) {
    const response = await roomClient.get<Room>(`/api/rooms/${roomCode}`);
    return response.data;
  },

  /**
   * 创建/更新房间（房主发布）
   */
  async createOrUpdateRoom(roomData: {
    roomCode: string;
    hostId: string;
    hostName: string;
    motd: string;
    remark: string;
    port: number;
    maxPlayers: number;
    isPublic: boolean;
    version: string;
    modpackUrl: string;
    modpackGameVersion: string;
    modpackLoader: string;
  }) {
    const response = await roomClient.post("/api/rooms", roomData);
    return response.data;
  },

  /**
   * 解散房间
   */
  async deleteRoom(roomCode: string) {
    const response = await roomClient.delete(`/api/rooms/${roomCode}`);
    return response.data;
  },

  /**
   * 加入房间
   */
  async joinRoom(roomCode: string, playerId: string, playerName: string) {
    const response = await roomClient.post(`/api/rooms/${roomCode}/join`, {
      roomCode,
      playerId,
      playerName,
      vendor: "BooxinLauncher",
    });
    return response.data;
  },

  /**
   * 离开房间
   */
  async leaveRoom(roomCode: string, playerId: string) {
    const response = await roomClient.post(`/api/rooms/${roomCode}/leave`, playerId);
    return response.data;
  },

  /**
   * Ping 房间（保活）
   */
  async pingRoom(roomCode: string) {
    const response = await roomClient.post(`/api/rooms/${roomCode}/ping`);
    return response.data;
  },
};

// ============ Relay API ============

export const relayApi = {
  /**
   * 获取官方 Relay 列表
   */
  async getRelayList() {
    const response = await roomClient.get("/api/relay");
    return response.data;
  },
};

// ============ Token 管理 ============

export const tokenManager = {
  /**
   * 保存 Token
   */
  async saveToken(token: string, expiresAtUtc: string) {
    await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token);
    await SecureStore.setItemAsync(TOKEN_EXPIRY_KEY, expiresAtUtc);
  },

  /**
   * 获取 Token
   */
  async getToken() {
    return await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
  },

  /**
   * 清除 Token
   */
  async clearToken() {
    await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
    await SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY);
  },

  /**
   * 检查 Token 是否过期
   */
  async isTokenExpired() {
    const expiryStr = await SecureStore.getItemAsync(TOKEN_EXPIRY_KEY);
    if (!expiryStr) return true;

    const expiryTime = new Date(expiryStr).getTime();
    const now = new Date().getTime();
    return now > expiryTime;
  },

  /**
   * 获取 Token 剩余时间（毫秒）
   */
  async getTokenRemainingTime() {
    const expiryStr = await SecureStore.getItemAsync(TOKEN_EXPIRY_KEY);
    if (!expiryStr) return 0;

    const expiryTime = new Date(expiryStr).getTime();
    const now = new Date().getTime();
    return Math.max(0, expiryTime - now);
  },
};
