import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { AuthLayout } from "../components/AuthLayout";

export function SignupPage() {
  const navigate = useNavigate();
  const { signUp, user, isEnabled } = useAuth();
  const [name, setName] = useState("");
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
    if (!name.trim()) {
      setError("Informe seu nome para criar a conta.");
      return;
    }
    setLoading(true);
    setError(null);
    const result = await signUp(name, email, password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    navigate("/dashboard", { replace: true });
  };

  return (
    <AuthLayout>
      <form onSubmit={submit}>
        <h1 className="font-display text-[26px] font-extrabold text-ink">Criar conta</h1>
        <p className="mt-1 text-[14px] text-ink-2">
          Crie sua conta para salvar e acompanhar seus diagnósticos.
        </p>

        <label className="mt-6 block">
          <span className="text-[12px] font-semibold text-ink-2">Nome</span>
          <input
            className="mt-1 block w-full rounded-[10px] border border-stroke bg-inset px-3 py-2.5 text-[14px] text-ink outline-none transition focus:border-brand"
            value={name}
            onChange={(event) => setName(event.target.value)}
            type="text"
            required
          />
        </label>

        <label className="mt-4 block">
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
            minLength={6}
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
          {loading ? "Criando..." : "Criar conta"}
        </button>

        <p className="mt-6 text-[13px] text-ink-2">
          Já tem conta?{" "}
          <Link className="font-semibold text-brand" to="/auth/login">
            Entrar
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
