import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { AppHeader } from "../components/AppHeader";
import { RESEARCH_SURVEY_CONFIG } from "../config/researchSurveyConfig";
import { FooterNav } from "../components/FooterNav";
import {
  RESEARCH_TCLE_META,
  RESEARCH_TCLE_SECTIONS,
  RESEARCH_TCLE_VERSION
} from "../data/researchConsent";
import {
  acceptResearchConsent,
  getResearchConsentStatus,
  type ResearchConsentResult,
  revokeResearchConsent
} from "../services/researchConsentApi";

function formatDateTime(value: string | null): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("pt-BR");
}

export function ResearchConsentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const nextPath = searchParams.get("next") || "/canvas";
  const surveyPath = useMemo(() => `/survey?next=${encodeURIComponent(nextPath)}`, [nextPath]);
  const surveyEnabled = RESEARCH_SURVEY_CONFIG.enabled;

  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [acceptedAt, setAcceptedAt] = useState<string | null>(null);
  const [consentResult, setConsentResult] = useState<ResearchConsentResult | null>(null);
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    if (!surveyEnabled) {
      setHasConsent(false);
      setAcceptedAt(null);
      setErrorMessage(null);
      setIsLoadingStatus(false);
      return;
    }

    let alive = true;

    void getResearchConsentStatus(user?.id ?? null)
      .then((status) => {
        if (!alive) return;
        setHasConsent(status.accepted);
        setAcceptedAt(status.acceptedAt);
        setErrorMessage(null);
      })
      .catch((error) => {
        if (!alive) return;
        setErrorMessage(
          error instanceof Error ? error.message : "Falha ao carregar status do TCLE."
        );
      })
      .finally(() => {
        if (!alive) return;
        setIsLoadingStatus(false);
      });

    return () => {
      alive = false;
    };
  }, [surveyEnabled, user?.id]);

  if (!surveyEnabled) {
    return <Navigate replace to={nextPath} />;
  }

  const handleAccept = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const result = await acceptResearchConsent({
        userId: user?.id ?? null,
        nextPath
      });

      setConsentResult(result);
      setHasConsent(true);
      setAcceptedAt(new Date().toISOString());
      setStatusMessage("Consentimento registrado com sucesso.");
      navigate(surveyPath);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Falha ao registrar consentimento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    setIsRevoking(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await revokeResearchConsent(user?.id ?? null);
      setHasConsent(false);
      setAcceptedAt(null);
      setConsentResult(null);
      setStatusMessage(
        "Consentimento revogado. A pesquisa nao podera ser enviada sem novo aceite."
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Falha ao revogar consentimento.");
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light font-display dark:bg-background-dark">
      <AppHeader title="TCLE - Pesquisa Academica" backTo={nextPath} />

      <main className="flex-grow space-y-4 px-4 pb-28 pt-6">
        <section className="rounded-xl border border-zinc-200/80 bg-card-light p-4 dark:border-zinc-800/80 dark:bg-card-dark">
          <h2 className="text-base font-semibold text-text-light-primary dark:text-text-dark-primary">
            Termo de Consentimento Livre e Esclarecido (TCLE)
          </h2>
          <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
            Versao de consentimento: <strong>{RESEARCH_TCLE_VERSION}</strong>
          </p>
          <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
            Versao do questionario: <strong>{RESEARCH_SURVEY_CONFIG.activeVersion}</strong>
          </p>
          <div className="mt-3 space-y-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
            <p>
              <strong>Titulo da pesquisa:</strong> {RESEARCH_TCLE_META.title}
            </p>
            <p>
              <strong>Pesquisador responsavel:</strong> {RESEARCH_TCLE_META.researcher}
            </p>
            <p>
              <strong>Contato do pesquisador:</strong> {RESEARCH_TCLE_META.researcherContact}
            </p>
            <p>
              <strong>Orientador:</strong> {RESEARCH_TCLE_META.advisor}
            </p>
            <p>
              <strong>Instituicao proponente:</strong> {RESEARCH_TCLE_META.institution}
            </p>
            <p>
              <strong>Programa:</strong> {RESEARCH_TCLE_META.program}
            </p>
          </div>
        </section>

        {RESEARCH_TCLE_SECTIONS.map((section) => (
          <section
            key={section.id}
            className="rounded-xl border border-zinc-200/80 bg-card-light p-4 dark:border-zinc-800/80 dark:bg-card-dark"
          >
            <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
              {section.id}. {section.title}
            </h3>
            <div className="mt-2 space-y-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              {section.paragraphs.map((paragraph, index) => (
                <p key={`${section.id}_${index}`}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}

        <section className="rounded-xl border border-zinc-200/80 bg-card-light p-4 dark:border-zinc-800/80 dark:bg-card-dark">
          <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
            Informacoes eticas e de protecao de dados
          </h3>
          <div className="mt-2 space-y-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
            <p>
              <strong>Comite de Etica:</strong> {RESEARCH_TCLE_META.ethicsCommittee.name}
            </p>
            <p>
              <strong>Contato CEP:</strong> {RESEARCH_TCLE_META.ethicsCommittee.contact}
            </p>
            <p>
              <strong>Endereco CEP:</strong> {RESEARCH_TCLE_META.ethicsCommittee.address}
            </p>
            <p>
              <strong>DPO/Encarregada IFMS:</strong> {RESEARCH_TCLE_META.dpo}
            </p>
            <p>
              Ao continuar, voce declara que leu e compreendeu o TCLE e concorda em participar da
              pesquisa de forma livre e voluntaria.
            </p>
          </div>
        </section>

        {isLoadingStatus && (
          <section className="rounded-xl border border-zinc-200/80 bg-card-light p-4 text-sm text-text-light-secondary dark:border-zinc-800/80 dark:bg-card-dark dark:text-text-dark-secondary">
            Carregando status do consentimento...
          </section>
        )}

        {!isLoadingStatus && (
          <section className="rounded-xl border border-zinc-200/80 bg-card-light p-4 dark:border-zinc-800/80 dark:bg-card-dark">
            <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
              Declaracao de aceite
            </h3>

            <div className="mt-2 space-y-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              <p>
                <strong>Status atual:</strong>{" "}
                {hasConsent ? "Consentimento ativo" : "Sem consentimento ativo"}
              </p>
              <p>
                <strong>Registrado em:</strong> {formatDateTime(acceptedAt)}
              </p>
              {consentResult && (
                <p>
                  <strong>Protocolo:</strong> {consentResult.id} ({consentResult.storage})
                </p>
              )}
            </div>

            {(statusMessage || errorMessage) && (
              <div className="mt-3 space-y-1">
                {statusMessage && (
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">{statusMessage}</p>
                )}
                {errorMessage && (
                  <p className="text-xs text-red-600 dark:text-red-300">{errorMessage}</p>
                )}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleAccept}
                disabled={isSubmitting}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Registrando..." : "Concordo e continuar para pesquisa"}
              </button>

              <button
                type="button"
                onClick={() => navigate(nextPath)}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-text-light-secondary hover:bg-zinc-100 dark:border-zinc-700 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
              >
                Nao concordo
              </button>

              {hasConsent && (
                <button
                  type="button"
                  onClick={handleRevoke}
                  disabled={isRevoking}
                  className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-700/50 dark:text-red-300 dark:hover:bg-red-900/20"
                >
                  {isRevoking ? "Revogando..." : "Revogar consentimento"}
                </button>
              )}
            </div>
          </section>
        )}
      </main>

      <FooterNav />
    </div>
  );
}
