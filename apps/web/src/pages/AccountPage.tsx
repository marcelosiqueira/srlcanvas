import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppHeader } from "../components/AppHeader";
import { AboutSrlCanvasModal } from "../components/AboutSrlCanvasModal";
import { FooterNav } from "../components/FooterNav";
import { ResearchOpinionPanel } from "../components/ResearchOpinionPanel";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../lib/supabase";
import { useCanvasStore } from "../store/useCanvasStore";
import {
  buildProductMetricsReport,
  clearProductMetricEvents,
  PRODUCT_METRICS_EVENT_DICTIONARY
} from "../services/productMetrics";

function getNameFromMetadata(metadata: unknown): string {
  if (!metadata || typeof metadata !== "object") {
    return "";
  }

  const metadataRecord = metadata as Record<string, unknown>;
  const rawName = metadataRecord.name;
  return typeof rawName === "string" ? rawName.trim() : "";
}

export function AccountPage() {
  const { darkMode, toggleDarkMode } = useCanvasStore();
  const { user, isEnabled, signOut } = useAuth();
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [metricsReport, setMetricsReport] = useState(() => buildProductMetricsReport());
  const [profileName, setProfileName] = useState(() => getNameFromMetadata(user?.user_metadata));
  const [savedProfileName, setSavedProfileName] = useState(() =>
    getNameFromMetadata(user?.user_metadata)
  );
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const navigate = useNavigate();
  const metricsEventCount = Object.keys(PRODUCT_METRICS_EVENT_DICTIONARY).length;
  const metadataName = getNameFromMetadata(user?.user_metadata);

  const logout = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate("/", { replace: true });
    }
  };

  useEffect(() => {
    let isActive = true;

    const syncProfileFromMetadata = async () => {
      if (!isActive) return;
      setProfileName(metadataName);
      setSavedProfileName(metadataName);
    };

    void syncProfileFromMetadata();

    return () => {
      isActive = false;
    };
  }, [metadataName, user?.id]);

  const saveProfile = async () => {
    const supabaseClient = supabase;
    if (!isEnabled || !user || !supabaseClient) {
      setProfileFeedback({
        type: "error",
        message: "Autenticação não disponível para atualizar perfil."
      });
      return;
    }

    const normalizedName = profileName.trim();

    if (!normalizedName) {
      setProfileFeedback({
        type: "error",
        message: "Informe seu nome para salvar o perfil."
      });
      return;
    }

    if (normalizedName === savedProfileName) {
      setProfileFeedback({
        type: "success",
        message: "Seu nome já está atualizado."
      });
      return;
    }

    setIsProfileSaving(true);
    setProfileFeedback(null);

    const metadataWithoutLegacyFullName = {
      ...((user.user_metadata ?? {}) as Record<string, unknown>)
    };
    delete metadataWithoutLegacyFullName.full_name;

    const { error: userError } = await supabaseClient.auth.updateUser({
      data: {
        ...metadataWithoutLegacyFullName,
        name: normalizedName
      }
    });

    setIsProfileSaving(false);

    if (userError) {
      setProfileFeedback({
        type: "error",
        message: `Falha ao salvar nome da conta: ${userError.message}`
      });
      return;
    }

    setSavedProfileName(normalizedName);
    setProfileName(normalizedName);
    setProfileFeedback({
      type: "success",
      message: "Nome atualizado com sucesso."
    });
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light font-display dark:bg-background-dark">
      <AppHeader title="Minha Conta" />

      <main className="flex-grow space-y-4 px-4 pb-28 pt-6">
        <section className="rounded-xl border border-zinc-200/80 bg-card-light p-4 dark:border-zinc-800/80 dark:bg-card-dark">
          <h2 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
            Perfil
          </h2>

          {!isEnabled && (
            <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Supabase não configurado. O app está em modo local/visitante.
            </p>
          )}

          {isEnabled && !user && (
            <div className="mt-2 space-y-3">
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                Faça login para editar seu perfil.
              </p>
              <div className="flex gap-2">
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
            </div>
          )}

          {isEnabled && user && (
            <div className="mt-2 space-y-3">
              <label className="block">
                <span className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
                  Nome
                </span>
                <input
                  className="mt-1 block w-full rounded-md border-zinc-300 bg-zinc-50 p-2 text-sm text-text-light-primary shadow-sm focus:border-primary focus:ring-primary disabled:opacity-70 dark:border-zinc-700 dark:bg-zinc-800 dark:text-text-dark-primary"
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                  type="text"
                  disabled={isProfileSaving}
                  placeholder="Seu nome"
                />
              </label>

              <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Este nome é usado na sua identificação de conta.
              </p>

              <label className="block">
                <span className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
                  Email
                </span>
                <input
                  className="mt-1 block w-full rounded-md border-zinc-300 bg-zinc-100 p-2 text-sm text-text-light-primary shadow-sm disabled:opacity-70 dark:border-zinc-700 dark:bg-zinc-900 dark:text-text-dark-primary"
                  value={user.email ?? ""}
                  type="email"
                  disabled
                />
              </label>

              <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Email usado para acessar a plataforma.
              </p>

              {profileFeedback && (
                <p
                  className={`text-xs ${
                    profileFeedback.type === "error" ? "text-red-500" : "text-emerald-600"
                  }`}
                >
                  {profileFeedback.message}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={isProfileSaving}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-70"
                >
                  {isProfileSaving ? "Salvando..." : "Salvar"}
                </button>
                <button
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-text-light-secondary hover:bg-zinc-100 dark:border-zinc-700 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
                  onClick={logout}
                  type="button"
                >
                  Sair
                </button>
              </div>
            </div>
          )}
        </section>

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
            Métricas de Produto (Local)
          </h2>
          <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
            Relatório local para iteração de produto (sem dados sensíveis). Eventos monitorados:{" "}
            <strong>{metricsEventCount}</strong>.
          </p>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-zinc-200/80 bg-zinc-50 p-3 dark:border-zinc-800/80 dark:bg-zinc-800/70">
              <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Canvas
              </p>
              <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Início: <strong>{metricsReport.canvas.started}</strong>
              </p>
              <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Conclusão: <strong>{metricsReport.canvas.completed}</strong>
              </p>
              <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Abandono: <strong>{metricsReport.canvas.abandoned}</strong>
              </p>
              <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Taxa de conclusão:{" "}
                <strong>{metricsReport.canvas.completionRate.toFixed(1)}%</strong>
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200/80 bg-zinc-50 p-3 dark:border-zinc-800/80 dark:bg-zinc-800/70">
              <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Survey Acadêmica
              </p>
              <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Início: <strong>{metricsReport.survey.started}</strong>
              </p>
              <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Conclusão: <strong>{metricsReport.survey.completed}</strong>
              </p>
              <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Abandono: <strong>{metricsReport.survey.abandoned}</strong>
              </p>
              <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Taxa de conclusão:{" "}
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
            {metricsReport.survey.abandonedByStep.scale_and_sus} | adoção/follow-up{" "}
            {metricsReport.survey.abandonedByStep.adoption_and_followup}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMetricsReport(buildProductMetricsReport())}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-text-light-secondary hover:bg-zinc-100 dark:border-zinc-700 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
            >
              Atualizar relatório
            </button>
            <button
              type="button"
              onClick={() => {
                clearProductMetricEvents();
                setMetricsReport(buildProductMetricsReport());
              }}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-text-light-secondary hover:bg-zinc-100 dark:border-zinc-700 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
            >
              Limpar métricas locais
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
