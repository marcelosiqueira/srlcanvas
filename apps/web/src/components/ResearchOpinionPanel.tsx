import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { RESEARCH_SURVEY_CONFIG } from "../config/researchSurveyConfig";
import { getResearchConsentStatus, revokeResearchConsent } from "../services/researchConsentApi";

interface ResearchOpinionPanelProps {
  as?: "section" | "div";
  className?: string;
  nextPath: string;
  onNavigate?: () => void;
}

export function ResearchOpinionPanel({
  as = "section",
  className,
  nextPath,
  onNavigate
}: ResearchOpinionPanelProps) {
  const Component = as;
  const navigate = useNavigate();
  const { user } = useAuth();
  const surveyEnabled = RESEARCH_SURVEY_CONFIG.enabled;

  const [consentActive, setConsentActive] = useState(false);
  const [consentLoading, setConsentLoading] = useState(true);
  const [consentMessage, setConsentMessage] = useState<string | null>(null);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  useEffect(() => {
    if (!surveyEnabled) {
      setConsentActive(false);
      setConsentLoading(false);
      setConsentError(null);
      return;
    }

    let alive = true;

    void getResearchConsentStatus(user?.id ?? null)
      .then((status) => {
        if (!alive) return;
        setConsentActive(status.accepted);
        setConsentError(null);
      })
      .catch((error) => {
        if (!alive) return;
        setConsentError(
          error instanceof Error ? error.message : "Falha ao carregar consentimento."
        );
      })
      .finally(() => {
        if (!alive) return;
        setConsentLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [surveyEnabled, user?.id]);

  const goToConsent = () => {
    onNavigate?.();
    navigate(`/survey/consent?next=${encodeURIComponent(nextPath)}`);
  };

  const goToSurvey = () => {
    onNavigate?.();
    navigate(`/survey?next=${encodeURIComponent(nextPath)}`);
  };

  const handleRevokeConsent = async () => {
    setIsRevoking(true);
    setConsentError(null);
    setConsentMessage(null);

    try {
      await revokeResearchConsent(user?.id ?? null);
      setConsentActive(false);
      setConsentMessage("Consentimento revogado com sucesso.");
    } catch (error) {
      setConsentError(error instanceof Error ? error.message : "Falha ao revogar consentimento.");
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <Component
      className={
        className ??
        "rounded-xl border border-zinc-200/80 bg-card-light p-4 dark:border-zinc-800/80 dark:bg-card-dark"
      }
    >
      <h2 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
        Pesquisa Academica
      </h2>
      <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
        Este projeto faz parte de uma dissertacao de mestrado. Sua opiniao e essencial para medir
        impacto, clareza e utilidade do SRL Canvas.
      </p>
      <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
        Tempo estimado de resposta: <strong>10 a 12 minutos</strong>. As respostas sao fundamentais
        para a validacao cientifica do trabalho.
      </p>
      <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
        Instrumento ativo: <strong>{RESEARCH_SURVEY_CONFIG.activeVersion}</strong>
      </p>

      {surveyEnabled ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={goToConsent}
            className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
          >
            Ler e aceitar TCLE
          </button>
          <button
            type="button"
            onClick={goToSurvey}
            className="inline-flex rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-text-light-secondary hover:bg-zinc-100 dark:border-zinc-700 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
          >
            Abrir questionario
          </button>
        </div>
      ) : (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300">
          Questionario temporariamente desativado por configuracao.
        </p>
      )}

      {surveyEnabled && (
        <div className="mt-3 space-y-1 text-xs">
          {consentLoading && (
            <p className="text-text-light-secondary dark:text-text-dark-secondary">
              Carregando status do TCLE...
            </p>
          )}
          {!consentLoading && (
            <p className="text-text-light-secondary dark:text-text-dark-secondary">
              Status do consentimento: <strong>{consentActive ? "ativo" : "nao ativo"}</strong>
            </p>
          )}
          {consentMessage && (
            <p className="text-emerald-700 dark:text-emerald-300">{consentMessage}</p>
          )}
          {consentError && <p className="text-red-600 dark:text-red-300">{consentError}</p>}
        </div>
      )}

      {surveyEnabled && consentActive && (
        <button
          type="button"
          onClick={handleRevokeConsent}
          disabled={isRevoking}
          className="mt-3 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-700/50 dark:text-red-300 dark:hover:bg-red-900/20"
        >
          {isRevoking ? "Revogando..." : "Revogar consentimento"}
        </button>
      )}
    </Component>
  );
}
