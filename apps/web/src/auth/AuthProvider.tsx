import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import {
  ApiError,
  AUTH_EXPIRED_EVENT,
  apiFetch,
  clearStoredToken,
  getStoredToken,
  isApiConfigured,
  setStoredToken
} from "../lib/apiClient";
import { syncCanvasScopeForSession } from "../services/canvasSessionManager";

export interface AppUser {
  id: string;
  email: string;
  name: string;
}

interface AuthResult {
  error: string | null;
}

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  isEnabled: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (name: string, email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
  updateProfile: (name: string) => Promise<AuthResult>;
}

interface AuthPayload {
  token: string;
  user: AppUser;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toFriendlyError(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.message) {
      case "invalid_credentials":
        return "Email ou senha inválidos.";
      case "email_already_registered":
        return "Este email já está cadastrado.";
      case "validation_error":
        return "Dados inválidos.";
      case "network_error":
        return "Falha de conexão.";
      default:
        return error.message;
    }
  }

  return error instanceof Error ? error.message : "Erro inesperado.";
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(() => isApiConfigured && Boolean(getStoredToken()));

  useEffect(() => {
    if (!isApiConfigured || !getStoredToken()) {
      return;
    }

    let isActive = true;

    void apiFetch<{ user: AppUser }>("/me")
      .then((data) => {
        if (isActive) setUser(data.user);
      })
      .catch(() => {
        // Em 401 o token já foi limpo pelo apiClient; demais erros mantêm modo deslogado.
        if (isActive) setUser(null);
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => setUser(null);
    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
  }, []);

  useEffect(() => {
    if (loading) return;

    void syncCanvasScopeForSession({
      userId: user?.id ?? null,
      isAuthEnabled: isApiConfigured
    });
  }, [loading, user?.id]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isEnabled: isApiConfigured,
      signIn: async (email, password) => {
        if (!isApiConfigured) return { error: "Autenticação não configurada." };
        try {
          const data = await apiFetch<AuthPayload>("/auth/login", {
            method: "POST",
            body: { email, password },
            auth: false
          });
          setStoredToken(data.token);
          setUser(data.user);
          return { error: null };
        } catch (error) {
          return { error: toFriendlyError(error) };
        }
      },
      signUp: async (name, email, password) => {
        if (!isApiConfigured) return { error: "Autenticação não configurada." };
        try {
          const data = await apiFetch<AuthPayload>("/auth/register", {
            method: "POST",
            body: { name: name.trim(), email, password },
            auth: false
          });
          setStoredToken(data.token);
          setUser(data.user);
          return { error: null };
        } catch (error) {
          return { error: toFriendlyError(error) };
        }
      },
      signOut: async () => {
        clearStoredToken();
        setUser(null);
        return { error: null };
      },
      updateProfile: async (name) => {
        if (!isApiConfigured) return { error: "Autenticação não configurada." };
        try {
          const data = await apiFetch<{ user: AppUser }>("/me", {
            method: "PATCH",
            body: { name: name.trim() }
          });
          setUser(data.user);
          return { error: null };
        } catch (error) {
          return { error: toFriendlyError(error) };
        }
      }
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
}
