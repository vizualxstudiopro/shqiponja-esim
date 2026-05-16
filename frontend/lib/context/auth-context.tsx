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
  applyReferralCode as apiApplyReferralCode,
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
  register: (name: string, email: string, password: string, referralCode?: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithMicrosoft: (code: string, redirectUri: string) => Promise<void>;
  loginWithFacebook: (code: string, redirectUri: string) => Promise<void>;
  loginWithApple: (token: string) => Promise<void>;
  logout: () => void;
  setUser: (u: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function readStoredToken() {
  return sessionStorage.getItem("token") || localStorage.getItem("token");
}

function decodeJwtPayload(token: string) {
  const part = token.split(".")[1];
  if (!part) throw new Error("Missing JWT payload");
  const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function storeToken(token: string, rememberMe: boolean) {
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
  if (rememberMe) {
    localStorage.setItem("token", token);
  } else {
    sessionStorage.setItem("token", token);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const savedToken = readStoredToken();
    if (savedToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToken(savedToken);
    }
    setHydrated(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (token) {
      // Decode JWT immediately so user is never null while getMe is in-flight
      try {
        const payload = decodeJwtPayload(token);
        if (payload.exp * 1000 > Date.now()) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setUser((prev) => prev ?? ({ id: payload.id, email: payload.email, name: payload.name, role: payload.role, email_verified: 0, created_at: "" } as User));
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
  }, [token, hydrated]);

  async function login(email: string, password: string, totpCode?: string, smsCode?: string, rememberMe?: boolean): Promise<{ requires2FA?: boolean; requiresSms2FA?: boolean; maskedPhone?: string }> {
    const res = await apiLogin(email, password, totpCode, smsCode);
    if (res.requires2FA) {
      return { requires2FA: true };
    }
    if (res.requiresSms2FA) {
      return { requiresSms2FA: true, maskedPhone: res.maskedPhone };
    }
    storeToken(res.token, !!rememberMe);
    setToken(res.token);
    setUser(res.user);
    return {};
  }

  async function register(name: string, email: string, password: string, referralCode?: string) {
    const res = await apiRegister(name, email, password);

    if (referralCode?.trim()) {
      await apiApplyReferralCode(res.token, referralCode.trim().toUpperCase());
    }

    storeToken(res.token, true);
    setToken(res.token);
    setUser(res.user);
  }

  async function loginWithGoogle(idToken: string) {
    const res = await apiOauthGoogle(idToken);
    storeToken(res.token, true);
    setToken(res.token);
    setUser(res.user);
  }

  async function loginWithMicrosoft(code: string, redirectUri: string) {
    const res = await apiOauthMicrosoft(code, redirectUri);
    storeToken(res.token, true);
    setToken(res.token);
    setUser(res.user);
  }

  async function loginWithFacebook(code: string, redirectUri: string) {
    const res = await apiOauthFacebook(code, redirectUri);
    storeToken(res.token, true);
    setToken(res.token);
    setUser(res.user);
  }

  async function loginWithApple(jwtToken: string) {
    // Backend already validated with Apple — we just receive the JWT
    const u = await getMe(jwtToken);
    storeToken(jwtToken, true);
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
