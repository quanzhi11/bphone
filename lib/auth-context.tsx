/**
 * 认证上下文
 * 
 * 管理用户认证状态、Token、用户信息
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import { authApi, tokenManager, User, AuthToken } from "@/lib/_core/booxin-api";

export interface AuthState {
  isLoading: boolean;
  isSignout: boolean;
  userToken: string | null;
  user: User | null;
  error: string | null;
}

export type AuthAction =
  | { type: "RESTORE_TOKEN"; payload: string }
  | { type: "SIGN_IN"; payload: AuthToken }
  | { type: "SIGN_OUT" }
  | { type: "SIGN_UP"; payload: AuthToken }
  | { type: "SET_ERROR"; payload: string }
  | { type: "CLEAR_ERROR" }
  | { type: "SET_LOADING"; payload: boolean };

const initialState: AuthState = {
  isLoading: true,
  isSignout: false,
  userToken: null,
  user: null,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "RESTORE_TOKEN":
      return {
        ...state,
        isLoading: false,
        userToken: action.payload,
        isSignout: false,
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
      };
    case "SIGN_OUT":
      return {
        ...state,
        isLoading: false,
        userToken: null,
        user: null,
        isSignout: true,
        error: null,
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
    default:
      return state;
  }
};

export interface AuthContextType {
  state: AuthState;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 初始化：尝试恢复 Token
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const token = await tokenManager.getToken();
        if (token) {
          const isExpired = await tokenManager.isTokenExpired();
          if (!isExpired) {
            dispatch({ type: "RESTORE_TOKEN", payload: token });
          } else {
            // Token 已过期，清除
            await tokenManager.clearToken();
            dispatch({ type: "SIGN_OUT" });
          }
        } else {
          dispatch({ type: "SIGN_OUT" });
        }
      } catch (e) {
        dispatch({ type: "SIGN_OUT" });
      }
    };

    bootstrapAsync();
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const result = await authApi.login(username, password);
      await tokenManager.saveToken(result.accessToken, result.expiresAtUtc);
      dispatch({ type: "SIGN_IN", payload: result });
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "登录失败，请重试";
      dispatch({ type: "SET_ERROR", payload: message });
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  const signUp = useCallback(async (username: string, password: string) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const result = await authApi.register(username, password);
      await tokenManager.saveToken(result.accessToken, result.expiresAtUtc);
      dispatch({ type: "SIGN_UP", payload: result });
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "注册失败，请重试";
      dispatch({ type: "SET_ERROR", payload: message });
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await tokenManager.clearToken();
      dispatch({ type: "SIGN_OUT" });
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const value: AuthContextType = {
    state,
    signIn,
    signUp,
    signOut,
    clearError,
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
