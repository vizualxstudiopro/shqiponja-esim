import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { getMe, type User } from "./api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  setAuth: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("shqiponja_desktop_token");
    if (saved) {
      getMe(saved)
        .then((u) => {
          if (u.role === "admin") {
            setUser(u);
            setToken(saved);
          } else {
            localStorage.removeItem("shqiponja_desktop_token");
          }
        })
        .catch(() => localStorage.removeItem("shqiponja_desktop_token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const setAuth = useCallback((t: string, u: User) => {
    localStorage.setItem("shqiponja_desktop_token", t);
    setToken(t);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("shqiponja_desktop_token");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
