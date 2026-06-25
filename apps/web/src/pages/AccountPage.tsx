import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { AboutSrlCanvasModal } from "../components/AboutSrlCanvasModal";
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
  const { user, isEnabled, signOut, updateProfile } = useAuth();
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [metricsReport, setMetricsReport] = useState(() => buildProductMetricsReport());
  const [profileName, setProfileName] = useState(() => user?.name ?? "");
  const [savedProfileName, setSavedProfileName] = useState(() => user?.name ?? "");
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const navigate = useNavigate();
  const metricsEventCount = Object.keys(PRODUCT_METRICS_EVENT_DICTIONARY).length;
  const accountName = user?.name ?? "";

  const logout = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate("/", { replace: true });
    }
  };

  useEffect(() => {
    let isActive = true;

    const syncProfileFromAccount = async () => {
      if (!isActive) return;
      setProfileName(accountName);
      setSavedProfileName(accountName);
    };

    void syncProfileFromAccount();

    return () => {
      isActive = false;
    };
  }, [accountName, user?.id]);

  const saveProfile = async () => {
    if (!isEnabled || !user) {
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

    const { error: profileError } = await updateProfile(normalizedName);

    setIsProfileSaving(false);

    if (profileError) {
      setProfileFeedback({
        type: "error",
        message: `Falha ao salvar nome da conta: ${profileError}`
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

  // Derive avatar initials from user name (up to 2 chars)
  const avatarInitials =
    accountName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("") || "?";

  return (
    <AppShell title="Minha Conta">
      <div className="flex flex-col gap-[18px]">
        {/* Card: Perfil */}
        <section className="rounded-card border border-stroke bg-surface p-5 shadow-sm">
          <h2 className="font-display text-[15px] font-bold text-ink">Perfil</h2>

          {!isEnabled && (
            <p className="mt-3 text-sm text-ink-2">O aplicativo está em modo local (sem conta).</p>
          )}

          {isEnabled && !user && (
            <div className="mt-3 space-y-3">
              <p className="text-sm text-ink-2">Faça login para editar seu perfil.</p>
              <div className="flex gap-2">
                <Link
                  className="rounded-[10px] bg-brand px-4 py-2 text-sm font-semibold text-brand-fg hover:brightness-110"
                  to="/auth/login"
                >
                  Entrar
                </Link>
                <Link
                  className="rounded-[10px] border border-stroke px-4 py-2 text-sm font-semibold text-ink-2 hover:bg-surface-2"
                  to="/auth/signup"
                >
                  Criar conta
                </Link>
              </div>
            </div>
          )}

          {isEnabled && user && (
            <div className="mt-4 space-y-4">
              {/* Avatar + identity */}
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-full bg-surface-2 font-display text-[15px] font-bold text-ink">
                  {avatarInitials}
                </span>
                <div className="leading-tight">
                  <p className="text-[14px] font-semibold text-ink">{user.name}</p>
                  <p className="text-[12px] text-ink-3">{user.email}</p>
                </div>
              </div>

              <label className="block">
                <span className="text-xs font-medium text-ink-2">Nome</span>
                <input
                  className="mt-1 block w-full rounded-[10px] border border-stroke bg-inset px-3 py-2 text-sm text-ink shadow-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal disabled:opacity-70"
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                  type="text"
                  disabled={isProfileSaving}
                  placeholder="Seu nome"
                />
              </label>

              <p className="text-xs text-ink-3">Este nome é usado na sua identificação de conta.</p>

              <label className="block">
                <span className="text-xs font-medium text-ink-2">Email</span>
                <input
                  className="mt-1 block w-full rounded-[10px] border border-stroke bg-inset px-3 py-2 text-sm text-ink shadow-sm disabled:opacity-60"
                  value={user.email ?? ""}
                  type="email"
                  disabled
                  readOnly
                />
              </label>

              <p className="text-xs text-ink-3">Email usado para acessar a plataforma.</p>

              {profileFeedback && (
                <p
                  className={`text-xs font-medium ${
                    profileFeedback.type === "error" ? "text-red-500" : "text-teal"
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
                  className="rounded-[10px] bg-brand px-4 py-2 text-sm font-semibold text-brand-fg hover:brightness-110 disabled:opacity-70"
                >
                  {isProfileSaving ? "Salvando..." : "Salvar"}
                </button>
                <button
                  className="rounded-[10px] border border-stroke px-4 py-2 text-sm font-semibold text-ink-2 hover:bg-surface-2"
                  onClick={logout}
                  type="button"
                >
                  Sair
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Card: Tema */}
        <section className="rounded-card border border-stroke bg-surface p-5 shadow-sm">
          <h2 className="font-display text-[15px] font-bold text-ink">Tema</h2>
          <button
            className="mt-3 rounded-[10px] border border-stroke px-4 py-2 text-sm font-semibold text-ink-2 hover:bg-surface-2"
            onClick={toggleDarkMode}
            type="button"
          >
            Alternar para modo {darkMode ? "claro" : "escuro"}
          </button>
        </section>

        {/* Card: Sobre o Projeto */}
        <section className="rounded-card border border-stroke bg-surface p-5 shadow-sm">
          <h2 className="font-display text-[15px] font-bold text-ink">Sobre o Projeto</h2>
          <p className="mt-2 text-sm text-ink-2">
            O nome oficial da ferramenta é{" "}
            <strong className="text-ink">SRL Canvas (Startup Readiness Level Canvas)</strong>. Aqui
            você encontra o contexto, propósito e público-alvo do framework.
          </p>
          <button
            type="button"
            onClick={() => setIsAboutOpen(true)}
            className="mt-3 rounded-[10px] border border-stroke px-4 py-2 text-sm font-semibold text-ink-2 hover:bg-surface-2"
          >
            Ler: Por que o SRL Canvas?
          </button>
        </section>

        {/* Card: Métricas de Produto (Local) */}
        <section className="rounded-card border border-stroke bg-surface p-5 shadow-sm">
          <h2 className="font-display text-[15px] font-bold text-ink">
            Métricas de Produto (Local)
          </h2>
          <p className="mt-2 text-sm text-ink-2">
            Relatório local para iteração de produto (sem dados sensíveis). Eventos monitorados:{" "}
            <strong className="text-ink">{metricsEventCount}</strong>.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-[10px] border border-stroke bg-surface-2 p-3">
              <p className="text-xs font-semibold text-ink">Canvas</p>
              <p className="mt-1 text-xs text-ink-2">
                Início: <strong className="text-ink">{metricsReport.canvas.started}</strong>
              </p>
              <p className="mt-1 text-xs text-ink-2">
                Conclusão: <strong className="text-ink">{metricsReport.canvas.completed}</strong>
              </p>
              <p className="mt-1 text-xs text-ink-2">
                Abandono: <strong className="text-ink">{metricsReport.canvas.abandoned}</strong>
              </p>
              <p className="mt-1 text-xs text-ink-2">
                Taxa de conclusão:{" "}
                <strong className="text-ink">
                  {metricsReport.canvas.completionRate.toFixed(1)}%
                </strong>
              </p>
            </div>

            <div className="rounded-[10px] border border-stroke bg-surface-2 p-3">
              <p className="text-xs font-semibold text-ink">Survey Acadêmica</p>
              <p className="mt-1 text-xs text-ink-2">
                Início: <strong className="text-ink">{metricsReport.survey.started}</strong>
              </p>
              <p className="mt-1 text-xs text-ink-2">
                Conclusão: <strong className="text-ink">{metricsReport.survey.completed}</strong>
              </p>
              <p className="mt-1 text-xs text-ink-2">
                Abandono: <strong className="text-ink">{metricsReport.survey.abandoned}</strong>
              </p>
              <p className="mt-1 text-xs text-ink-2">
                Taxa de conclusão:{" "}
                <strong className="text-ink">
                  {metricsReport.survey.completionRate.toFixed(1)}%
                </strong>
              </p>
            </div>
          </div>

          <p className="mt-3 text-xs text-ink-2">
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
              className="rounded-[10px] border border-stroke px-4 py-2 text-sm font-semibold text-ink-2 hover:bg-surface-2"
            >
              Atualizar relatório
            </button>
            <button
              type="button"
              onClick={() => {
                clearProductMetricEvents();
                setMetricsReport(buildProductMetricsReport());
              }}
              className="rounded-[10px] border border-stroke px-4 py-2 text-sm font-semibold text-ink-2 hover:bg-surface-2"
            >
              Limpar métricas locais
            </button>
          </div>
        </section>

        <ResearchOpinionPanel nextPath="/account" />
      </div>

      <AboutSrlCanvasModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </AppShell>
  );
}
