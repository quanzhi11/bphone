/**
 * 认证上下文
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import {
  authApi,
  tokenManager,
  User,
  AuthToken,
  getAuthApiRoot,
  setUnauthorizedHandler,
  formatApiError,
} from "@/lib/_core/booxin-api";
import { resetInviteNotificationState } from "@/lib/invite-notification-poller";

export interface AuthState {
  isLoading: boolean;
  isSignout: boolean;
  userToken: string | null;
  user: User | null;
  error: string | null;
  authApiRoot: string;
}

export type AuthAction =
  | { type: "RESTORE_TOKEN"; payload: string }
  | { type: "SIGN_IN"; payload: AuthToken }
  | { type: "SIGN_OUT" }
  | { type: "SIGN_UP"; payload: AuthToken }
  | { type: "SET_ERROR"; payload: string }
  | { type: "CLEAR_ERROR" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "UPDATE_USER"; payload: User };

const initialState: AuthState = {
  isLoading: true,
  isSignout: false,
  userToken: null,
  user: null,
  error: null,
  authApiRoot: getAuthApiRoot(),
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "RESTORE_TOKEN":
      return {
        ...state,
        isLoading: false,
        userToken: action.payload,
        isSignout: false,
        authApiRoot: getAuthApiRoot(),
      };
    case "SIGN_IN":
    case "SIGN_UP":
      return {
        ...state,
        isLoading: false,
        userToken: action.payload.accessToken,
        user: action.payload.user,
        isSignout: false,
        error: null,
        authApiRoot: getAuthApiRoot(),
      };
    case "SIGN_OUT":
      return {
        ...state,
        isLoading: false,
        userToken: null,
        user: null,
        isSignout: true,
        error: null,
        authApiRoot: getAuthApiRoot(),
      };
    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };
    case "UPDATE_USER":
      return {
        ...state,
        user: action.payload,
        authApiRoot: getAuthApiRoot(),
      };
    default:
      return state;
  }
};

export interface AuthContextType {
  state: AuthState;
  signIn: (username: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, code: string) => Promise<void>;
  signUp: (username: string, password: string, email: string, emailCode: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const signOutInternal = useCallback(async () => {
    await tokenManager.clearToken();
    await resetInviteNotificationState();
    dispatch({ type: "SIGN_OUT" });
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void signOutInternal();
    });
    return () => setUnauthorizedHandler(null);
  }, [signOutInternal]);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const token = await tokenManager.getToken();
        if (!token) {
          dispatch({ type: "SIGN_OUT" });
          return;
        }

        const isExpired = await tokenManager.isTokenExpired();
        if (isExpired) {
          await tokenManager.clearToken();
          dispatch({ type: "SIGN_OUT" });
          return;
        }

        const expiresAtUtc = (await tokenManager.getTokenExpiry()) ?? new Date().toISOString();

        try {
          const validation = await authApi.validate(token);
          if (!validation?.isValid) {
            await tokenManager.clearToken();
            dispatch({ type: "SIGN_OUT" });
            return;
          }

          const user = await authApi.getCurrentUser();
          dispatch({
            type: "SIGN_IN",
            payload: {
              accessToken: token,
              tokenType: "Bearer",
              expiresAtUtc,
              user,
            },
          });
        } catch {
          try {
            const user = await authApi.getCurrentUser();
            dispatch({
              type: "SIGN_IN",
              payload: {
                accessToken: token,
                tokenType: "Bearer",
                expiresAtUtc,
                user,
              },
            });
          } catch {
            await tokenManager.clearToken();
            dispatch({ type: "SIGN_OUT" });
          }
        }
      } catch (e) {
        console.error("Auth bootstrap error:", e);
        dispatch({ type: "SIGN_OUT" });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    void bootstrapAsync();
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const result = await authApi.login(username, password);
      await tokenManager.saveToken(result.accessToken, result.expiresAtUtc);
      dispatch({ type: "SIGN_IN", payload: result });
    } catch (error: unknown) {
      dispatch({ type: "SET_ERROR", payload: formatApiError(error, "登录失败，请重试") });
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  const signUp = useCallback(
    async (username: string, password: string, email: string, emailCode: string) => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });
        const result = await authApi.register(username, password, email, emailCode);
        await tokenManager.saveToken(result.accessToken, result.expiresAtUtc);
        dispatch({ type: "SIGN_UP", payload: result });
      } catch (error: unknown) {
        dispatch({ type: "SET_ERROR", payload: formatApiError(error, "注册失败，请重试") });
        throw error;
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    []
  );

  const signInWithEmail = useCallback(async (email: string, code: string) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const result = await authApi.loginWithEmail(email, code);
      await tokenManager.saveToken(result.accessToken, result.expiresAtUtc);
      dispatch({ type: "SIGN_IN", payload: result });
    } catch (error: unknown) {
      dispatch({ type: "SET_ERROR", payload: formatApiError(error, "登录失败，请重试") });
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  const resetPassword = useCallback(async (email: string, code: string, newPassword: string) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      await authApi.resetPassword(email, code, newPassword);
    } catch (error: unknown) {
      dispatch({ type: "SET_ERROR", payload: formatApiError(error, "重置密码失败，请重试") });
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  const signOut = signOutInternal;

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const refreshUser = useCallback(async () => {
    const user = await authApi.getCurrentUser();
    dispatch({ type: "UPDATE_USER", payload: user });
  }, []);

  const updateUser = useCallback((user: User) => {
    dispatch({ type: "UPDATE_USER", payload: user });
  }, []);

  const value: AuthContextType = {
    state,
    signIn,
    signInWithEmail,
    signUp,
    resetPassword,
    signOut,
    clearError,
    refreshUser,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
