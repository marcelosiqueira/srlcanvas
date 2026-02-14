import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { AboutSrlCanvasModal } from "../components/AboutSrlCanvasModal";
import { useCanvasStore } from "../store/useCanvasStore";

const SRL_DOWNLOADS = [
  {
    label: "Baixar Guia de Aplicacao",
    href: "/downloads/guia-aplicacao-srl-canvas.pdf"
  },
  {
    label: "Baixar SRL Canvas",
    href: "/downloads/srl-canvas-modelo-manual.pdf"
  },
  {
    label: "Baixar Grafico Radar",
    href: "/downloads/grafico-radar-srl-canvas.pdf"
  }
] as const;

export function LandingPage() {
  const { user, loading, isEnabled } = useAuth();
  const { darkMode, toggleDarkMode } = useCanvasStore();
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">Carregando...</p>
      </div>
    );
  }

  if (isEnabled && user) {
    return <Navigate replace to="/dashboard" />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background-light font-display dark:bg-background-dark">
      <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl dark:bg-primary/25" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-500/20" />

      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-4 pt-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-300/80 bg-card-light px-3 py-1 text-xs font-semibold text-text-light-secondary dark:border-zinc-700/80 dark:bg-card-dark dark:text-text-dark-secondary">
          <span className="material-symbols-outlined text-base">analytics</span>
          SRL Canvas
        </div>

        <button
          type="button"
          onClick={toggleDarkMode}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-300/80 bg-card-light px-3 py-1 text-xs font-medium text-text-light-secondary transition hover:bg-zinc-100 dark:border-zinc-700/80 dark:bg-card-dark dark:text-text-dark-secondary dark:hover:bg-zinc-800"
          aria-label="Alternar tema"
        >
          <span className="material-symbols-outlined text-base">
            {darkMode ? "light_mode" : "dark_mode"}
          </span>
          Tema
        </button>
      </header>

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pt-12 pb-12 md:pt-20">
        <section className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Diagnostico de maturidade para startups
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-text-light-primary dark:text-text-dark-primary md:text-6xl">
            Avalie os 12 blocos do SRL Canvas com evidencias e score comparavel.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-text-light-secondary dark:text-text-dark-secondary md:text-lg">
            Esta plataforma foi criada para facilitar a aplicacao do SRL Canvas na pratica: organize a
            avaliacao, visualize desequilibrios no radar e gere um scorecard com consistencia metodologica.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
              to={isEnabled ? "/auth/login" : "/canvas"}
            >
              {isEnabled ? "Entrar" : "Abrir app"}
            </Link>
            {isEnabled && (
              <Link
                className="rounded-lg border border-zinc-300 bg-card-light px-5 py-2.5 text-sm font-semibold text-text-light-primary transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-card-dark dark:text-text-dark-primary dark:hover:bg-zinc-800"
                to="/auth/signup"
              >
                Criar conta
              </Link>
            )}
          </div>

          {!isEnabled && (
            <p className="mt-4 text-xs text-text-light-secondary dark:text-text-dark-secondary">
              Modo local ativo. Configure o Supabase para habilitar autenticacao e persistencia remota.
            </p>
          )}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-zinc-200/80 bg-card-light p-5 dark:border-zinc-800/80 dark:bg-card-dark">
            <h2 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
              Escala guiada
            </h2>
            <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Aplique notas de 1 a 9 com registro de evidencia por bloco para sustentar cada avaliacao.
            </p>
          </article>
          <article className="rounded-2xl border border-zinc-200/80 bg-card-light p-5 dark:border-zinc-800/80 dark:bg-card-dark">
            <h2 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
              Analise visual
            </h2>
            <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Enxergue lacunas com radar de 12 dimensoes e priorize os pontos de maior risco.
            </p>
          </article>
          <article className="rounded-2xl border border-zinc-200/80 bg-card-light p-5 dark:border-zinc-800/80 dark:bg-card-dark">
            <h2 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
              Exportacao pronta
            </h2>
            <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Gere PNG e PDF para compartilhar resultados com equipe, mentores e comites.
            </p>
          </article>
        </section>

        <section className="rounded-xl border border-zinc-200/80 bg-card-light p-4 dark:border-zinc-800/80 dark:bg-card-dark">
          <h2 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
            Sobre o Projeto
          </h2>
          <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
            O nome oficial da ferramenta e <strong>SRL Canvas (Startup Readiness Level Canvas)</strong>.
            Aqui voce encontra o contexto, proposito e publico-alvo do framework.
          </p>
          <button
            type="button"
            onClick={() => setIsAboutOpen(true)}
            className="mt-3 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-text-light-secondary hover:bg-zinc-100 dark:border-zinc-700 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
          >
            Ler: Por que o SRL Canvas?
          </button>
        </section>

        <section className="rounded-xl border border-zinc-200/80 bg-card-light p-4 dark:border-zinc-800/80 dark:bg-card-dark">
          <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
            Material de Apoio (Uso Offline)
          </h3>
          <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
            Nao e obrigatorio usar esta plataforma para aplicar o SRL Canvas. O metodo foi desenhado para
            ser simples e agil: voce pode baixar o guia de aplicacao, o modelo do SRL Canvas e o grafico
            radar para preenchimento manual.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SRL_DOWNLOADS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                download
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-text-light-secondary hover:bg-zinc-100 dark:border-zinc-700 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
              >
                {item.label}
              </a>
            ))}
          </div>
        </section>
      </main>

      <AboutSrlCanvasModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}
