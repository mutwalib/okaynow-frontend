"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { AuthUser, UserRole, UserStatus } from "./types";
import { homePathForUser } from "./types";
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  getStoredAuthUser,
  setAuthSession,
} from "./auth-cookie";
import {
  ApiError,
  getMe,
  loginUser,
  registerUser,
  verifyEmail,
  type LoginPayload,
  type RegisterPayload,
  type RegisterResult,
} from "./api";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<RegisterResult>;
  completeEmailVerification: (email: string, code: string) => Promise<AuthUser>;
  refreshAccountStatus: () => Promise<AuthUser | null>;
  setAccountStatus: (status: UserStatus) => void;
  logout: () => void;
  goHome: (role?: UserRole) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toUser(data: {
  userId: string;
  email: string;
  role: UserRole;
  status?: UserStatus | null;
}): AuthUser {
  return {
    id: data.userId,
    email: data.email,
    role: data.role,
    status: data.status ?? undefined,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const persist = useCallback(
    (data: {
      userId: string;
      email: string;
      role: UserRole;
      status?: UserStatus | null;
      accessToken: string;
      refreshToken: string;
      expiresInSeconds: number;
    }) => {
      const next = toUser(data);
      setAuthSession(next, {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresInSeconds: data.expiresInSeconds,
      });
      setUser(next);
      return next;
    },
    [],
  );

  const refreshAccountStatus = useCallback(async () => {
    if (!getAccessToken()) return null;
    try {
      const me = await getMe();
      const next: AuthUser = {
        id: me.id,
        email: me.email,
        role: me.role,
        status: me.status,
      };
      const access = getAccessToken();
      const refresh = getRefreshToken();
      if (access && refresh) {
        setAuthSession(next, {
          accessToken: access,
          refreshToken: refresh,
          expiresInSeconds: 900,
        });
      }
      setUser(next);
      return next;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const stored = getStoredAuthUser();
    setUser(stored);
    setIsLoading(false);
    if (stored && getAccessToken()) {
      void refreshAccountStatus();
    }
  }, [refreshAccountStatus]);

  const setAccountStatus = useCallback((status: UserStatus) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, status };
      const access = getAccessToken();
      const refresh = getRefreshToken();
      if (access && refresh) {
        setAuthSession(next, {
          accessToken: access,
          refreshToken: refresh,
          expiresInSeconds: 900,
        });
      }
      return next;
    });
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const data = await loginUser(payload);
      if (data.requiresOtp) {
        throw new ApiError(
          "Platform owners sign in through the owner console.",
          403,
        );
      }
      if (!data.accessToken || !data.refreshToken || !data.userId || !data.role) {
        throw new ApiError(data.message || "Sign-in failed", 400);
      }
      if (data.role === "ADMIN") {
        clearAuthSession();
        const adminUrl =
          process.env.NEXT_PUBLIC_ADMIN_APP_URL ?? "http://localhost:3001";
        window.location.assign(`${adminUrl.replace(/\/$/, "")}/login`);
        throw new ApiError(
          "Platform owners sign in through the owner console.",
          403,
        );
      }
      return persist({
        userId: data.userId,
        email: data.email,
        role: data.role,
        status: data.status,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresInSeconds: data.expiresInSeconds ?? 900,
      });
    },
    [persist],
  );

  const register = useCallback(async (payload: RegisterPayload) => {
    return registerUser(payload);
  }, []);

  const completeEmailVerification = useCallback(
    async (email: string, code: string) => {
      const data = await verifyEmail(email, code);
      return persist({
        ...data,
        status: data.status,
      });
    },
    [persist],
  );

  const logout = useCallback(() => {
    clearAuthSession();
    setUser(null);
    router.push("/login");
  }, [router]);

  const goHome = useCallback(
    (role?: UserRole) => {
      if (user) {
        router.push(homePathForUser(role ? { ...user, role } : user));
        return;
      }
      if (!role) {
        router.push("/login");
        return;
      }
      router.push(homePathForUser({ role }));
    },
    [router, user],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        completeEmailVerification,
        refreshAccountStatus,
        setAccountStatus,
        logout,
        goHome,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export function formatAuthError(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}
