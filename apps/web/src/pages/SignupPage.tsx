import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export function SignupPage() {
  const navigate = useNavigate();
  const { signUp, user, isEnabled } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isEnabled) {
    return <Navigate replace to="/account" />;
  }

  if (user) {
    return <Navigate replace to="/dashboard" />;
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const result = await signUp(email, password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-light px-4 font-display dark:bg-background-dark">
      <form
        className="w-full max-w-md rounded-xl border border-zinc-200/80 bg-card-light p-6 dark:border-zinc-800/80 dark:bg-card-dark"
        onSubmit={submit}
      >
        <h1 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">
          Criar conta
        </h1>

        <label className="mt-4 block">
          <span className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
            Email
          </span>
          <input
            className="mt-1 block w-full rounded-md border-zinc-300 bg-zinc-50 p-2 text-sm text-text-light-primary shadow-sm focus:border-primary focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-text-dark-primary"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            required
          />
        </label>

        <label className="mt-3 block">
          <span className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
            Senha
          </span>
          <input
            className="mt-1 block w-full rounded-md border-zinc-300 bg-zinc-50 p-2 text-sm text-text-light-primary shadow-sm focus:border-primary focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-text-dark-primary"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            type="password"
            required
          />
        </label>

        {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

        <button
          className="mt-4 w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-70"
          disabled={loading}
          type="submit"
        >
          {loading ? "Criando..." : "Criar conta"}
        </button>

        <p className="mt-4 text-xs text-text-light-secondary dark:text-text-dark-secondary">
          Ja tem conta?{" "}
          <Link className="font-semibold text-primary" to="/auth/login">
            Entrar
          </Link>
        </p>
      </form>
    </div>
  );
}
