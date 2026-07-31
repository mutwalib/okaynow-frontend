"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { AuthUser, UserRole } from "./types";
import { ROLE_HOME } from "./types";
import {
  clearAuthSession,
  getStoredAuthUser,
  setAuthSession,
} from "./auth-cookie";
import {
  ApiError,
  loginUser,
  registerUser,
  type LoginPayload,
  type RegisterPayload,
} from "./api";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => void;
  goHome: (role?: UserRole) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toUser(data: {
  userId: string;
  email: string;
  role: UserRole;
}): AuthUser {
  return { id: data.userId, email: data.email, role: data.role };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(getStoredAuthUser());
    setIsLoading(false);
  }, []);

  const persist = useCallback(
    (data: {
      userId: string;
      email: string;
      role: UserRole;
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

  const login = useCallback(
    async (payload: LoginPayload) => {
      const data = await loginUser(payload);
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
      return persist(data);
    },
    [persist],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const data = await registerUser(payload);
      return persist(data);
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
      const r = role ?? user?.role;
      if (!r) {
        router.push("/login");
        return;
      }
      router.push(ROLE_HOME[r]);
    },
    [router, user?.role],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
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
