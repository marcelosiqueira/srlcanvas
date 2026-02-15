import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppHeader } from "../components/AppHeader";
import { AboutSrlCanvasModal } from "../components/AboutSrlCanvasModal";
import { FooterNav } from "../components/FooterNav";
import { ResearchOpinionPanel } from "../components/ResearchOpinionPanel";
import { useAuth } from "../auth/AuthProvider";
import { useCanvasStore } from "../store/useCanvasStore";
import {
  buildProductMetricsReport,
  clearProductMetricEvents,
  PRODUCT_METRICS_EVENT_DICTIONARY
} from "../services/productMetrics";

export function AccountPage() {
  const { darkMode, toggleDarkMode } = useCanvasStore();
  const { user, isEnabled, signOut } = useAuth();
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [metricsReport, setMetricsReport] = useState(() => buildProductMetricsReport());
  const navigate = useNavigate();
  const metricsEventCount = Object.keys(PRODUCT_METRICS_EVENT_DICTIONARY).length;

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
            O nome oficial da ferramenta é{" "}
            <strong>SRL Canvas (Startup Readiness Level Canvas)</strong>. Aqui você encontra o
            contexto, propósito e público-alvo do framework.
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
          <h2 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
            Metricas de Produto (Local)
          </h2>
          <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
            Relatorio local para iteracao de produto (sem dados sensiveis). Eventos monitorados:{" "}
            <strong>{metricsEventCount}</strong>.
          </p>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-zinc-200/80 bg-zinc-50 p-3 dark:border-zinc-800/80 dark:bg-zinc-800/70">
              <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Canvas
              </p>
              <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Inicio: <strong>{metricsReport.canvas.started}</strong>
              </p>
              <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Conclusao: <strong>{metricsReport.canvas.completed}</strong>
              </p>
              <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Abandono: <strong>{metricsReport.canvas.abandoned}</strong>
              </p>
              <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Taxa de conclusao:{" "}
                <strong>{metricsReport.canvas.completionRate.toFixed(1)}%</strong>
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200/80 bg-zinc-50 p-3 dark:border-zinc-800/80 dark:bg-zinc-800/70">
              <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Survey Academica
              </p>
              <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Inicio: <strong>{metricsReport.survey.started}</strong>
              </p>
              <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Conclusao: <strong>{metricsReport.survey.completed}</strong>
              </p>
              <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Abandono: <strong>{metricsReport.survey.abandoned}</strong>
              </p>
              <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Taxa de conclusao:{" "}
                <strong>{metricsReport.survey.completionRate.toFixed(1)}%</strong>
              </p>
            </div>
          </div>

          <p className="mt-3 text-xs text-text-light-secondary dark:text-text-dark-secondary">
            Abandono por etapa (survey): triagem {metricsReport.survey.abandonedByStep.triage} |
            perfil {metricsReport.survey.abandonedByStep.profile} | blocos 1-4{" "}
            {metricsReport.survey.abandonedByStep.dimensions_1_4} | blocos 5-8{" "}
            {metricsReport.survey.abandonedByStep.dimensions_5_8} | blocos 9-12{" "}
            {metricsReport.survey.abandonedByStep.dimensions_9_12} | escala/SUS{" "}
            {metricsReport.survey.abandonedByStep.scale_and_sus} | adocao/follow-up{" "}
            {metricsReport.survey.abandonedByStep.adoption_and_followup}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMetricsReport(buildProductMetricsReport())}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-text-light-secondary hover:bg-zinc-100 dark:border-zinc-700 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
            >
              Atualizar relatorio
            </button>
            <button
              type="button"
              onClick={() => {
                clearProductMetricEvents();
                setMetricsReport(buildProductMetricsReport());
              }}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-text-light-secondary hover:bg-zinc-100 dark:border-zinc-700 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
            >
              Limpar metricas locais
            </button>
          </div>
        </section>

        <ResearchOpinionPanel nextPath="/account" />
      </main>

      <FooterNav />

      <AboutSrlCanvasModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}
