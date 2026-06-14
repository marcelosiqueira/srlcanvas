const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

/**
 * Quando VITE_API_URL está vazio, o app opera em modo convidado/local
 * (localStorage), exatamente como o comportamento anterior sem backend.
 */
export const isApiConfigured = Boolean(API_URL);

const TOKEN_STORAGE_KEY = "srl-auth-token-v1";

export const AUTH_EXPIRED_EVENT = "srl:auth-expired";

export function getStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // Ambiente sem localStorage (SSR/teste): sessão fica apenas em memória.
  }
}

export function clearStoredToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Ambiente sem localStorage (SSR/teste): nada a limpar.
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiFetchOptions {
  method?: string;
  body?: unknown;
  /** Defina como false para requisições sem Bearer token (login/registro). */
  auth?: boolean;
}

function extractErrorMessage(payload: unknown): string {
  if (payload && typeof payload === "object") {
    const errorValue = (payload as Record<string, unknown>).error;
    if (typeof errorValue === "string" && errorValue) {
      return errorValue;
    }
  }
  return "request_failed";
}

export async function apiFetch<T>(path: string, opts: ApiFetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};

  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (opts.auth !== false) {
    const token = getStoredToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: opts.method ?? "GET",
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined
    });
  } catch {
    throw new ApiError(0, "network_error");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && opts.auth !== false) {
      clearStoredToken();
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    throw new ApiError(response.status, extractErrorMessage(payload));
  }

  return payload as T;
}
