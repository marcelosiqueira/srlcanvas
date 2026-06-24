import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { AuthLayout } from "../components/AuthLayout";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, user, isEnabled } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: { pathname?: string } } | undefined)?.from?.pathname;

  if (!isEnabled) {
    return <Navigate replace to="/account" />;
  }

  if (user) {
    return <Navigate replace to={from || "/dashboard"} />;
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const result = await signIn(email, password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    navigate(from || "/dashboard", { replace: true });
  };

  return (
    <AuthLayout>
      <form onSubmit={submit}>
        <h1 className="font-display text-[26px] font-extrabold text-ink">Entrar</h1>
        <p className="mt-1 text-[14px] text-ink-2">
          Acesse sua conta para continuar o diagnóstico.
        </p>

        <label className="mt-6 block">
          <span className="text-[12px] font-semibold text-ink-2">Email</span>
          <input
            className="mt-1 block w-full rounded-[10px] border border-stroke bg-inset px-3 py-2.5 text-[14px] text-ink outline-none transition focus:border-brand"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            required
          />
        </label>

        <label className="mt-4 block">
          <span className="text-[12px] font-semibold text-ink-2">Senha</span>
          <input
            className="mt-1 block w-full rounded-[10px] border border-stroke bg-inset px-3 py-2.5 text-[14px] text-ink outline-none transition focus:border-brand"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            required
          />
        </label>

        {error && <p className="mt-4 text-[13px] text-red-500">{error}</p>}

        <button
          className="mt-6 w-full rounded-[10px] bg-brand px-4 py-2.5 text-[14px] font-semibold text-brand-fg transition hover:brightness-110 disabled:opacity-70"
          disabled={loading}
          type="submit"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <p className="mt-6 text-[13px] text-ink-2">
          Não tem conta?{" "}
          <Link className="font-semibold text-brand" to="/auth/signup">
            Criar conta
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
