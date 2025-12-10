import React, { createContext, useContext, useEffect, useState } from "react";

type AuthContextType = {
  token: string | null;
  expiresAt: number | null;
  login: (token: string, expiresInHours?: number) => void;
  logout: () => void;
  authFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_TOKEN_KEY = "app_token";
const STORAGE_EXP_KEY = "app_token_exp";

const apiBase =
  (import.meta.env.VITE_API_BASE as string | undefined) ||
  (import.meta.env.VITE_BACKEND_URL as string | undefined)?.replace(/\/auth\/login$|\/login$/, "") ||
  "http://localhost:8080/api";

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_TOKEN_KEY));
  const [expiresAt, setExpiresAt] = useState<number | null>(() => {
    const v = localStorage.getItem(STORAGE_EXP_KEY);
    return v ? Number(v) : null;
  });

  useEffect(() => {
    // if token expired in storage, clear it
    if (expiresAt && Date.now() > expiresAt) {
      setToken(null);
      setExpiresAt(null);
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      localStorage.removeItem(STORAGE_EXP_KEY);
    }
  }, []);

  const login = (tok: string, expiresInHours?: number) => {
    setToken(tok);
    let exp = null;
    if (expiresInHours && !isNaN(Number(expiresInHours))) {
      exp = Date.now() + Number(expiresInHours) * 3600 * 1000;
    }
    setExpiresAt(exp);
    localStorage.setItem(STORAGE_TOKEN_KEY, tok);
    if (exp) localStorage.setItem(STORAGE_EXP_KEY, String(exp));
  };

  const logout = () => {
    setToken(null);
    setExpiresAt(null);
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_EXP_KEY);
  };

  // wrapper around fetch that injects Authorization header
  async function authFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers || {});
    if (token) headers.set("Authorization", `Bearer ${token}`);
    // Accept JSON and send JSON by default
    if (!headers.has("Accept")) headers.set("Accept", "application/json");
    return fetch(input, { ...init, headers });
  }

  return (
    <AuthContext.Provider value={{ token, expiresAt, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
};

export { apiBase };
