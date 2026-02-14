import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppHeader } from "../components/AppHeader";
import { AboutSrlCanvasModal } from "../components/AboutSrlCanvasModal";
import { FooterNav } from "../components/FooterNav";
import { ResearchOpinionPanel } from "../components/ResearchOpinionPanel";
import { useAuth } from "../auth/AuthProvider";
import { useCanvasStore } from "../store/useCanvasStore";

export function AccountPage() {
  const { darkMode, toggleDarkMode } = useCanvasStore();
  const { user, isEnabled, signOut } = useAuth();
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const navigate = useNavigate();

  const logout = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light font-display dark:bg-background-dark">
      <AppHeader title="Minha Conta" />

      <main className="flex-grow space-y-4 px-4 pb-28 pt-6">
        <section className="rounded-xl border border-zinc-200/80 bg-card-light p-4 dark:border-zinc-800/80 dark:bg-card-dark">
          <h2 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
            Tema
          </h2>
          <button
            className="mt-3 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-text-light-secondary hover:bg-zinc-100 dark:border-zinc-700 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
            onClick={toggleDarkMode}
            type="button"
          >
            Alternar para modo {darkMode ? "claro" : "escuro"}
          </button>
        </section>

        <section className="rounded-xl border border-zinc-200/80 bg-card-light p-4 dark:border-zinc-800/80 dark:bg-card-dark">
          <h2 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
            Autenticacao
          </h2>

          {!isEnabled && (
            <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Supabase nao configurado. O app esta em modo local/visitante.
            </p>
          )}

          {isEnabled && user && (
            <div className="mt-2 space-y-3">
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                Logado como <strong>{user.email}</strong>
              </p>
              <button
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
                onClick={logout}
                type="button"
              >
                Sair
              </button>
            </div>
          )}

          {isEnabled && !user && (
            <div className="mt-2 flex gap-2">
              <Link
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
                to="/auth/login"
              >
                Entrar
              </Link>
              <Link
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-text-light-secondary hover:bg-zinc-100 dark:border-zinc-700 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
                to="/auth/signup"
              >
                Criar conta
              </Link>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-zinc-200/80 bg-card-light p-4 dark:border-zinc-800/80 dark:bg-card-dark">
          <h2 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
            Sobre o Projeto
          </h2>
          <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
            O nome oficial da ferramenta é <strong>SRL Canvas (Startup Readiness Level Canvas)</strong>.
            Aqui você encontra o contexto, propósito e público-alvo do framework.
          </p>
          <button
            type="button"
            onClick={() => setIsAboutOpen(true)}
            className="mt-3 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-text-light-secondary hover:bg-zinc-100 dark:border-zinc-700 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
          >
            Ler: Por que o SRL Canvas?
          </button>
        </section>

        <ResearchOpinionPanel nextPath="/account" />
      </main>

      <FooterNav />

      <AboutSrlCanvasModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}
