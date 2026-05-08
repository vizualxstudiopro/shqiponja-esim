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
  oauthFacebook as apiOauthFacebook,
  getMe,
  ApiError,
  type User,
} from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, totpCode?: string, smsCode?: string, rememberMe?: boolean) => Promise<{ requires2FA?: boolean; requiresSms2FA?: boolean; maskedPhone?: string }>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithMicrosoft: (code: string, redirectUri: string) => Promise<void>;
  loginWithFacebook: (code: string, redirectUri: string) => Promise<void>;
  loginWithApple: (token: string) => Promise<void>;
  logout: () => void;
  setUser: (u: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (token) {
      // Decode JWT immediately so user is never null while getMe is in-flight
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.exp * 1000 > Date.now()) {
          setUser((prev) => prev ?? { id: payload.id, email: payload.email, name: payload.name, role: payload.role });
        } else {
          // Token expired locally
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
          setToken(null);
          setLoading(false);
          return;
        }
      } catch {
        // Malformed token
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        setToken(null);
        setLoading(false);
        return;
      }

      getMe(token)
        .then((u) => {
          setUser(u);
        })
        .catch((err: unknown) => {
          // Only logout on 401 (invalid/expired token), not on network errors
          if (err instanceof ApiError && err.status === 401) {
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");
            setToken(null);
            setUser(null);
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

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

  async function login(email: string, password: string, totpCode?: string, smsCode?: string, rememberMe?: boolean): Promise<{ requires2FA?: boolean; requiresSms2FA?: boolean; maskedPhone?: string }> {
    const res = await apiLogin(email, password, totpCode, smsCode);
    if (res.requires2FA) {
      return { requires2FA: true };
    }
    if (res.requiresSms2FA) {
      return { requiresSms2FA: true, maskedPhone: res.maskedPhone };
    }
    if (rememberMe) {
      localStorage.setItem("token", res.token);
    } else {
      sessionStorage.setItem("token", res.token);
    }
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

  async function loginWithFacebook(code: string, redirectUri: string) {
    const res = await apiOauthFacebook(code, redirectUri);
    localStorage.setItem("token", res.token);
    setToken(res.token);
    setUser(res.user);
  }

  async function loginWithApple(jwtToken: string) {
    // Backend already validated with Apple — we just receive the JWT
    const u = await getMe(jwtToken);
    localStorage.setItem("token", jwtToken);
    setToken(jwtToken);
    setUser(u);
  }

  return (
    <AuthContext value={{ user, token, loading, login, register, loginWithGoogle, loginWithMicrosoft, loginWithFacebook, loginWithApple, logout, setUser }}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
