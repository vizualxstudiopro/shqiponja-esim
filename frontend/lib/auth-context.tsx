"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  login as apiLogin,
  register as apiRegister,
  oauthGoogle as apiOauthGoogle,
  oauthMicrosoft as apiOauthMicrosoft,
  oauthApple as apiOauthApple,
  getMe,
  type User,
} from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, totpCode?: string) => Promise<{ requires2FA?: boolean }>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithMicrosoft: (code: string, redirectUri: string) => Promise<void>;
  loginWithApple: (idToken: string, code: string, user?: { name?: { firstName?: string; lastName?: string } }) => Promise<void>;
  logout: () => void;
  setUser: (u: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("token");
    if (saved) {
      getMe(saved)
        .then((u) => {
          setUser(u);
          setToken(saved);
        })
        .catch(() => {
          localStorage.removeItem("token");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Auto-logout on 401 responses (expired JWT)
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const res = await originalFetch(...args);
      if (res.status === 401 && token) {
        logout();
      }
      return res;
    };
    return () => { window.fetch = originalFetch; };
  }, [token, logout]);

  async function login(email: string, password: string, totpCode?: string): Promise<{ requires2FA?: boolean }> {
    const res = await apiLogin(email, password, totpCode);
    if (res.requires2FA) {
      return { requires2FA: true };
    }
    localStorage.setItem("token", res.token);
    setToken(res.token);
    setUser(res.user);
    return {};
  }

  async function register(name: string, email: string, password: string) {
    const res = await apiRegister(name, email, password);
    localStorage.setItem("token", res.token);
    setToken(res.token);
    setUser(res.user);
  }

  async function loginWithGoogle(idToken: string) {
    const res = await apiOauthGoogle(idToken);
    localStorage.setItem("token", res.token);
    setToken(res.token);
    setUser(res.user);
  }

  async function loginWithMicrosoft(code: string, redirectUri: string) {
    const res = await apiOauthMicrosoft(code, redirectUri);
    localStorage.setItem("token", res.token);
    setToken(res.token);
    setUser(res.user);
  }

  async function loginWithApple(idToken: string, code: string, user?: { name?: { firstName?: string; lastName?: string } }) {
    const res = await apiOauthApple(idToken, code, user);
    localStorage.setItem("token", res.token);
    setToken(res.token);
    setUser(res.user);
  }

  return (
    <AuthContext value={{ user, token, loading, login, register, loginWithGoogle, loginWithMicrosoft, loginWithApple, logout, setUser }}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
