import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { AppHeader } from "../components/AppHeader";
import { RESEARCH_SURVEY_CONFIG } from "../config/researchSurveyConfig";
import { FooterNav } from "../components/FooterNav";
import {
  ACCEPTABLE_TIME_OPTIONS,
  DIMENSION_ASSERTIONS,
  EXPERIENCE_OPTIONS,
  LIKERT_SCALE_LABELS,
  LIKERT_SCALE_OPTIONS,
  PREFERRED_SCALE_OPTIONS,
  PROFILE_ROLE_OPTIONS,
  SECTOR_OPTIONS,
  STAGE_OPTIONS,
  SUS_ITEMS,
  SURVEY_DIMENSIONS,
  TEAM_SIZE_OPTIONS,
  USAGE_CONTEXT_OPTIONS
} from "../data/researchSurvey";
import {
  clearResearchSurveyDraft,
  loadResearchSurveyDraft,
  makeInitialResearchSurveyValues,
  saveResearchSurveyDraft,
  saveResearchSurveyResponse,
  type SaveResearchSurveyResult
} from "../services/researchSurveyApi";
import { getResearchConsentStatus } from "../services/researchConsentApi";
import { createProductMetricsSessionId, trackProductMetricEvent } from "../services/productMetrics";
import type { Likert5, ResearchSurveyFormValues, YesNoAnswer } from "../types/researchSurvey";

const YES_NO_OPTIONS: Array<{ value: Exclude<YesNoAnswer, "">; label: string }> = [
  { value: "sim", label: "Sim" },
  { value: "nao", label: "Nao" }
];

type SurveyStepKey =
  | "triage"
  | "profile"
  | "dimensions_1_4"
  | "dimensions_5_8"
  | "dimensions_9_12"
  | "scale_and_sus"
  | "adoption_and_followup";

type DimensionStepKey = "dimensions_1_4" | "dimensions_5_8" | "dimensions_9_12";

interface SurveyStepDefinition {
  key: SurveyStepKey;
  title: string;
  description: string;
}

const ELIGIBLE_SURVEY_STEPS: SurveyStepDefinition[] = [
  {
    key: "triage",
    title: "Etapa 1 - Triagem",
    description: "Confirme elegibilidade para a pesquisa."
  },
  {
    key: "profile",
    title: "Etapa 2 - Perfil",
    description: "Contexto profissional e experiencia."
  },
  {
    key: "dimensions_1_4",
    title: "Etapa 3 - Blocos 1 a 4",
    description: "Avalie clareza e relevancia dos primeiros blocos."
  },
  {
    key: "dimensions_5_8",
    title: "Etapa 4 - Blocos 5 a 8",
    description: "Continue a avaliacao dos blocos intermediarios."
  },
  {
    key: "dimensions_9_12",
    title: "Etapa 5 - Blocos 9 a 12",
    description: "Finalize a avaliacao das 12 dimensoes."
  },
  {
    key: "scale_and_sus",
    title: "Etapa 6 - Escala e Usabilidade",
    description: "Percepcao da escala 1-9 e SUS."
  },
  {
    key: "adoption_and_followup",
    title: "Etapa 7 - Adocao e Follow-up",
    description: "Contexto de uso, NPS e dados opcionais."
  }
];

const TRIAGE_ONLY_SURVEY_STEPS: SurveyStepDefinition[] = [ELIGIBLE_SURVEY_STEPS[0]];

const DIMENSION_STEP_CONFIG: Record<
  DimensionStepKey,
  {
    title: string;
    startQuestionNumber: number;
    dimensions: ReadonlyArray<(typeof SURVEY_DIMENSIONS)[number]>;
  }
> = {
  dimensions_1_4: {
    title: "5. Avaliacao por dimensao (blocos 1-4)",
    startQuestionNumber: 1,
    dimensions: SURVEY_DIMENSIONS.slice(0, 4)
  },
  dimensions_5_8: {
    title: "5. Avaliacao por dimensao (blocos 5-8)",
    startQuestionNumber: 5,
    dimensions: SURVEY_DIMENSIONS.slice(4, 8)
  },
  dimensions_9_12: {
    title: "5. Avaliacao por dimensao (blocos 9-12)",
    startQuestionNumber: 9,
    dimensions: SURVEY_DIMENSIONS.slice(8, 12)
  }
};

function isSurveyStepKey(value: string): value is SurveyStepKey {
  return ELIGIBLE_SURVEY_STEPS.some((step) => step.key === value);
}

function isDimensionStepKey(stepKey: SurveyStepKey): stepKey is DimensionStepKey {
  return (
    stepKey === "dimensions_1_4" || stepKey === "dimensions_5_8" || stepKey === "dimensions_9_12"
  );
}

function RadioGroup<T extends string | number>({
  legend,
  name,
  value,
  options,
  onChange,
  dense = false
}: {
  legend: string;
  name: string;
  value: T | "" | null;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  dense?: boolean;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
        {legend}
      </legend>
      <div className={`flex flex-wrap gap-2 ${dense ? "gap-1.5" : ""}`}>
        {options.map((option) => {
          const checked = value === option.value;

          return (
            <label
              key={String(option.value)}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                checked
                  ? "border-primary bg-primary/10 text-text-light-primary dark:text-text-dark-primary"
                  : "border-zinc-300 text-text-light-secondary hover:bg-zinc-100 dark:border-zinc-700 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
              }`}
            >
              <input
                className="sr-only"
                type="radio"
                name={name}
                checked={checked}
                onChange={() => onChange(option.value)}
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function LikertGroup({
  legend,
  name,
  value,
  onChange
}: {
  legend: string;
  name: string;
  value: Likert5 | null;
  onChange: (value: Likert5) => void;
}) {
  return (
    <RadioGroup
      legend={legend}
      name={name}
      value={value}
      options={LIKERT_SCALE_OPTIONS.map((item) => ({ value: item, label: String(item) }))}
      onChange={onChange}
      dense
    />
  );
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-zinc-200/80 bg-card-light p-4 dark:border-zinc-800/80 dark:bg-card-dark">
      <h2 className="text-base font-semibold text-text-light-primary dark:text-text-dark-primary">
        {title}
      </h2>
      <div className="mt-3 space-y-4">{children}</div>
    </section>
  );
}

export function ResearchSurveyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const nextPath = searchParams.get("next") || "/canvas";
  const surveyEnabled = RESEARCH_SURVEY_CONFIG.enabled;

  const [values, setValues] = useState<ResearchSurveyFormValues>(() =>
    makeInitialResearchSurveyValues()
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SaveResearchSurveyResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [consentLoading, setConsentLoading] = useState(true);
  const [hasConsent, setHasConsent] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [isDraftHydrated, setIsDraftHydrated] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [startedAtIso, setStartedAtIso] = useState<string>(() => new Date().toISOString());
  const [completedDurationLabel, setCompletedDurationLabel] = useState<string | null>(null);
  const [currentStepKey, setCurrentStepKey] = useState<SurveyStepKey>("triage");
  const surveySessionIdRef = useRef<string>(createProductMetricsSessionId("survey"));
  const surveyStartedTrackedRef = useRef(false);
  const surveyCompletedTrackedRef = useRef(false);
  const surveyAbandonedTrackedRef = useRef(false);
  const latestStepKeyRef = useRef<SurveyStepKey>("triage");
  const latestStepIndexRef = useRef(0);
  const latestStepCountRef = useRef(1);
  const lastStepMarkerRef = useRef<string | null>(null);

  const isEligible =
    values.age18OrMore === "sim" &&
    values.actedInEcosystem12Months === "sim" &&
    values.viewedSrlMaterial === "sim";

  const hasScreeningAnswers =
    values.age18OrMore !== "" &&
    values.actedInEcosystem12Months !== "" &&
    values.viewedSrlMaterial !== "";

  const isIneligible = hasScreeningAnswers && !isEligible;

  const surveySteps = useMemo(
    () => (isIneligible ? TRIAGE_ONLY_SURVEY_STEPS : ELIGIBLE_SURVEY_STEPS),
    [isIneligible]
  );

  useEffect(() => {
    if (!surveyEnabled) {
      setIsDraftHydrated(true);
      return;
    }

    const draft = loadResearchSurveyDraft(user?.id ?? null);

    if (draft) {
      setValues(draft.values);
      setDraftSavedAt(draft.updatedAt);
      if (draft.startedAtIso) {
        setStartedAtIso(draft.startedAtIso);
      }
      if (draft.currentStepKey && isSurveyStepKey(draft.currentStepKey)) {
        setCurrentStepKey(draft.currentStepKey);
      }
    }

    setIsDraftHydrated(true);
  }, [surveyEnabled, user?.id]);

  useEffect(() => {
    if (!surveyEnabled || !isDraftHydrated || result) return;

    saveResearchSurveyDraft({
      userId: user?.id ?? null,
      values,
      nextPath,
      startedAtIso,
      currentStepKey
    });
    setDraftSavedAt(new Date().toISOString());
  }, [
    currentStepKey,
    isDraftHydrated,
    nextPath,
    result,
    startedAtIso,
    surveyEnabled,
    user?.id,
    values
  ]);

  useEffect(() => {
    if (!surveyEnabled) {
      setConsentLoading(false);
      setHasConsent(false);
      setConsentError(null);
      return;
    }

    let alive = true;

    void getResearchConsentStatus(user?.id ?? null)
      .then((status) => {
        if (!alive) return;
        setHasConsent(status.accepted);
        setConsentError(null);
      })
      .catch((error) => {
        if (!alive) return;
        setConsentError(error instanceof Error ? error.message : "Falha ao validar consentimento.");
      })
      .finally(() => {
        if (!alive) return;
        setConsentLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [surveyEnabled, user?.id]);

  useEffect(() => {
    if (surveySteps.some((step) => step.key === currentStepKey)) return;
    setCurrentStepKey(surveySteps[0]?.key ?? "triage");
  }, [currentStepKey, surveySteps]);

  const currentStepIndex = Math.max(
    0,
    surveySteps.findIndex((step) => step.key === currentStepKey)
  );
  const currentStep = surveySteps[currentStepIndex] ?? surveySteps[0];
  const isLastStep = currentStepIndex === surveySteps.length - 1;
  const progressPercent = Math.round(((currentStepIndex + 1) / surveySteps.length) * 100);

  latestStepKeyRef.current = currentStepKey;
  latestStepIndexRef.current = currentStepIndex;
  latestStepCountRef.current = surveySteps.length;

  const likertHelp = useMemo(
    () =>
      LIKERT_SCALE_OPTIONS.map((option) => `${option} = ${LIKERT_SCALE_LABELS[option]}`).join(
        " | "
      ),
    []
  );

  const setField = <K extends keyof ResearchSurveyFormValues>(
    key: K,
    value: ResearchSurveyFormValues[K]
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const toggleUsageContext = (item: string) => {
    setValues((prev) => {
      const exists = prev.usageContexts.includes(item);
      const usageContexts = exists
        ? prev.usageContexts.filter((current) => current !== item)
        : [...prev.usageContexts, item];
      return { ...prev, usageContexts };
    });
  };

  const validateScreeningFields = (): string[] => {
    const nextErrors: string[] = [];

    if (values.age18OrMore === "") nextErrors.push("Responda se possui 18 anos ou mais.");
    if (values.actedInEcosystem12Months === "") {
      nextErrors.push("Responda se atua ou atuou no ecossistema nos ultimos 12 meses.");
    }
    if (values.viewedSrlMaterial === "") {
      nextErrors.push("Confirme se visualizou o SRL Canvas e o guia breve de aplicacao.");
    }

    return nextErrors;
  };

  const validateProfileFields = (): string[] => {
    const nextErrors: string[] = [];

    if (!values.primaryRole) nextErrors.push("Selecione seu papel principal.");
    if (!values.experienceYears) nextErrors.push("Selecione seu tempo de experiencia.");
    if (!values.sector) nextErrors.push("Selecione o setor predominante.");
    if (!values.startupStage) nextErrors.push("Selecione o estagio tipico das startups.");
    if (!values.locationCountry.trim()) nextErrors.push("Informe localidade/pais de atuacao.");
    if (!values.teamSize) nextErrors.push("Selecione o tamanho medio das equipes.");
    if (values.primaryRole === "outro" && !values.primaryRoleOther.trim()) {
      nextErrors.push("Descreva seu papel principal em 'Outro'.");
    }
    if (values.sector === "outro" && !values.sectorOther.trim()) {
      nextErrors.push("Descreva o setor em 'Outro'.");
    }

    return nextErrors;
  };

  const validateDimensionFields = (
    dimensions: ReadonlyArray<(typeof SURVEY_DIMENSIONS)[number]>
  ): string[] => {
    const nextErrors: string[] = [];

    for (const dimension of dimensions) {
      const answer = values.dimensionAnswers[dimension.key];
      for (const assertion of DIMENSION_ASSERTIONS) {
        if (answer.ratings[assertion.key] === null) {
          nextErrors.push(`Preencha todas as avaliacoes do bloco ${dimension.label}.`);
          break;
        }
      }
    }

    return nextErrors;
  };

  const validateScaleAndSusFields = (): string[] => {
    const nextErrors: string[] = [];

    if (values.scaleClarity === null) nextErrors.push("Responda a clareza da escala 1 a 9.");
    if (values.scaleUtility === null) nextErrors.push("Responda a utilidade da escala 1 a 9.");
    if (!values.preferredScale) nextErrors.push("Informe se preferiria outra escala.");
    if (values.preferredScale === "outro" && !values.preferredScaleOther.trim()) {
      nextErrors.push("Descreva a escala preferida em 'Outro'.");
    }
    if (values.preferredScale !== "nao" && !values.preferredScaleReason.trim()) {
      nextErrors.push("Explique por que prefere outra escala.");
    }

    for (const susItem of SUS_ITEMS) {
      if (values.susAnswers[susItem.key] === null) {
        nextErrors.push("Responda todos os itens de usabilidade (SUS).");
        break;
      }
    }

    return nextErrors;
  };

  const validateAdoptionAndFollowupFields = (): string[] => {
    const nextErrors: string[] = [];

    if (values.usageContexts.length === 0) {
      nextErrors.push("Selecione pelo menos um contexto de uso do SRL Canvas.");
    }
    if (values.usageContexts.includes("outro") && !values.usageContextOther.trim()) {
      nextErrors.push("Descreva o contexto em 'Outro'.");
    }
    if (values.npsScore === null) nextErrors.push("Informe a nota de recomendacao (NPS).");
    if (!values.acceptableTime) nextErrors.push("Selecione o tempo aceitavel de aplicacao.");
    if (values.acceptsInterview === "sim" && !values.preferredContact.trim()) {
      nextErrors.push("Informe contato preferido para follow-up.");
    }

    return nextErrors;
  };

  const validateStep = (stepKey: SurveyStepKey): string[] => {
    switch (stepKey) {
      case "triage":
        return validateScreeningFields();
      case "profile":
        return isEligible ? validateProfileFields() : [];
      case "dimensions_1_4":
      case "dimensions_5_8":
      case "dimensions_9_12":
        return isEligible ? validateDimensionFields(DIMENSION_STEP_CONFIG[stepKey].dimensions) : [];
      case "scale_and_sus":
        return isEligible ? validateScaleAndSusFields() : [];
      case "adoption_and_followup":
        return isEligible ? validateAdoptionAndFollowupFields() : [];
      default:
        return [];
    }
  };

  const validate = (): string[] => {
    const nextErrors: string[] = [];

    nextErrors.push(...validateScreeningFields());

    if (isEligible) {
      nextErrors.push(...validateProfileFields());
      nextErrors.push(...validateDimensionFields(DIMENSION_STEP_CONFIG.dimensions_1_4.dimensions));
      nextErrors.push(...validateDimensionFields(DIMENSION_STEP_CONFIG.dimensions_5_8.dimensions));
      nextErrors.push(...validateDimensionFields(DIMENSION_STEP_CONFIG.dimensions_9_12.dimensions));
      nextErrors.push(...validateScaleAndSusFields());
      nextErrors.push(...validateAdoptionAndFollowupFields());
    }

    return Array.from(new Set(nextErrors));
  };

  const goToPreviousStep = () => {
    if (currentStepIndex === 0) return;
    setSubmitError(null);
    setErrors([]);
    setCurrentStepKey(surveySteps[currentStepIndex - 1].key);
    scrollToTop();
  };

  const goToNextStep = () => {
    if (isLastStep) return;

    const stepErrors = validateStep(currentStep.key);
    if (stepErrors.length > 0) {
      setErrors(Array.from(new Set(stepErrors)));
      setSubmitError(null);
      return;
    }

    setSubmitError(null);
    setErrors([]);
    setCurrentStepKey(surveySteps[currentStepIndex + 1].key);
    scrollToTop();
  };

  const submitSurvey = async () => {
    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setSubmitError(null);
      const firstInvalidStep = surveySteps.find((step) => validateStep(step.key).length > 0);
      if (firstInvalidStep) {
        setCurrentStepKey(firstInvalidStep.key);
      }
      return;
    }

    setErrors([]);
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const saved = await saveResearchSurveyResponse({
        userId: user?.id ?? null,
        values,
        nextPath,
        startedAtIso
      });
      const completionSeconds = getDurationInSeconds(startedAtIso);
      trackProductMetricEvent("survey_completed", {
        sessionId: surveySessionIdRef.current,
        eligible: isEligible,
        stepCount: surveySteps.length,
        completionSeconds,
        storage: saved.storage
      });
      surveyCompletedTrackedRef.current = true;
      setCompletedDurationLabel(formatDurationLabel(startedAtIso));
      clearResearchSurveyDraft(user?.id ?? null);
      setDraftSavedAt(null);
      setResult(saved);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Falha ao enviar pesquisa.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitSurvey();
  };

  const trackSurveyAbandonment = (reason: "responder_depois" | "route_exit" | "page_unload") => {
    if (!surveyStartedTrackedRef.current) return;
    if (surveyCompletedTrackedRef.current || surveyAbandonedTrackedRef.current) return;

    trackProductMetricEvent("survey_step_abandoned", {
      sessionId: surveySessionIdRef.current,
      stepKey: latestStepKeyRef.current,
      reason
    });
    surveyAbandonedTrackedRef.current = true;
  };

  const handleAnswerLater = () => {
    trackSurveyAbandonment("responder_depois");
    navigate(nextPath);
  };

  useEffect(() => {
    if (!surveyEnabled) return;
    if (consentLoading || !hasConsent) return;
    if (!isDraftHydrated || result) return;
    if (surveyStartedTrackedRef.current) return;

    trackProductMetricEvent("survey_started", {
      sessionId: surveySessionIdRef.current,
      startedWithDraft: Boolean(draftSavedAt)
    });
    surveyStartedTrackedRef.current = true;
  }, [consentLoading, draftSavedAt, hasConsent, isDraftHydrated, result, surveyEnabled]);

  useEffect(() => {
    if (!surveyStartedTrackedRef.current || result) return;

    const marker = `${currentStepKey}:${currentStepIndex}:${surveySteps.length}`;
    if (lastStepMarkerRef.current === marker) return;
    lastStepMarkerRef.current = marker;

    trackProductMetricEvent("survey_step_viewed", {
      sessionId: surveySessionIdRef.current,
      stepKey: currentStepKey,
      stepIndex: currentStepIndex,
      stepCount: surveySteps.length
    });
  }, [currentStepIndex, currentStepKey, result, surveySteps.length]);

  useEffect(() => {
    const onBeforeUnload = () => {
      trackSurveyAbandonment("page_unload");
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      trackSurveyAbandonment("route_exit");
    };
  }, []);

  if (!surveyEnabled) {
    return <Navigate replace to={nextPath} />;
  }

  if (consentLoading) {
    return (
      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light font-display dark:bg-background-dark">
        <AppHeader title="Questionario Quantitativo SRL Canvas" backTo={nextPath} />

        <main className="flex-grow px-4 pb-28 pt-6">
          <section className="rounded-xl border border-zinc-200/80 bg-card-light p-4 text-sm text-text-light-secondary dark:border-zinc-800/80 dark:bg-card-dark dark:text-text-dark-secondary">
            Carregando status do consentimento (TCLE)...
          </section>
        </main>

        <FooterNav />
      </div>
    );
  }

  if (!hasConsent) {
    return (
      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light font-display dark:bg-background-dark">
        <AppHeader title="Questionario Quantitativo SRL Canvas" backTo={nextPath} />

        <main className="flex-grow space-y-4 px-4 pb-28 pt-6">
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-700/40 dark:bg-amber-900/20">
            <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Consentimento obrigatorio
            </h2>
            <p className="mt-2 text-sm text-amber-800 dark:text-amber-300">
              Para responder o questionario, voce precisa aceitar o TCLE antes.
            </p>
            {consentError && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-300">{consentError}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate(`/survey/consent?next=${encodeURIComponent(nextPath)}`)}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
              >
                Ler e aceitar TCLE
              </button>
              <button
                type="button"
                onClick={() => navigate(nextPath)}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-text-light-secondary hover:bg-zinc-100 dark:border-zinc-700 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
              >
                Responder depois
              </button>
            </div>
          </section>
        </main>

        <FooterNav />
      </div>
    );
  }

  if (result) {
    return (
      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light font-display dark:bg-background-dark">
        <AppHeader title="Pesquisa Academica" backTo={nextPath} />

        <main className="flex-grow px-4 pb-28 pt-6">
          <section className="rounded-xl border border-emerald-300/80 bg-emerald-50 p-4 dark:border-emerald-700/70 dark:bg-emerald-900/20">
            <h2 className="text-base font-semibold text-emerald-900 dark:text-emerald-200">
              Obrigado pela sua contribuicao
            </h2>
            <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-300">
              Resposta enviada com sucesso. Protocolo: <strong>{result.id}</strong>
            </p>
            {completedDurationLabel && (
              <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                Tempo aproximado de preenchimento: <strong>{completedDurationLabel}</strong>
              </p>
            )}
            <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
              Armazenamento:{" "}
              {result.storage === "supabase" ? "Supabase" : "localStorage (modo local)"}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate(nextPath)}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  clearResearchSurveyDraft(user?.id ?? null);
                  setResult(null);
                  setValues(makeInitialResearchSurveyValues());
                  setDraftSavedAt(null);
                  setCompletedDurationLabel(null);
                  setStartedAtIso(new Date().toISOString());
                  setCurrentStepKey("triage");
                  setErrors([]);
                  setSubmitError(null);
                }}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-text-light-secondary hover:bg-zinc-100 dark:border-zinc-700 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
              >
                Enviar nova resposta
              </button>
            </div>
          </section>
        </main>

        <FooterNav />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light font-display dark:bg-background-dark">
      <AppHeader title="Questionario Quantitativo SRL Canvas" backTo={nextPath} />

      <main className="flex-grow space-y-4 px-4 pb-28 pt-6">
        <section className="rounded-xl border border-zinc-200/80 bg-card-light p-4 dark:border-zinc-800/80 dark:bg-card-dark">
          <h2 className="text-base font-semibold text-text-light-primary dark:text-text-dark-primary">
            Antes de comecar
          </h2>
          <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
            Tempo estimado de resposta: <strong>10 a 12 minutos</strong>.
          </p>
          <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
            Sua participacao e essencial para esta pesquisa de mestrado e para validar
            cientificamente o SRL Canvas.
          </p>
          <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
            O questionario foi dividido em etapas curtas para facilitar a conclusao.
          </p>
          <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
            Versao ativa do instrumento: <strong>{RESEARCH_SURVEY_CONFIG.activeVersion}</strong>
          </p>
        </section>

        <section className="rounded-xl border border-zinc-200/80 bg-card-light p-4 dark:border-zinc-800/80 dark:bg-card-dark">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Etapa {currentStepIndex + 1} de {surveySteps.length}
            </p>
            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
              {progressPercent}% concluido
            </p>
          </div>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
            className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
            {currentStep.title}
          </h3>
          <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
            {currentStep.description}
          </p>
        </section>

        {currentStepKey === "triage" && (
          <SectionCard title="1. Triagem e elegibilidade">
            <RadioGroup
              legend="1.1 Voce possui 18 anos ou mais?"
              name="age18"
              value={values.age18OrMore}
              options={YES_NO_OPTIONS}
              onChange={(value) => setField("age18OrMore", value)}
            />
            <RadioGroup
              legend="1.2 Voce atua ou atuou no ecossistema de inovacao/startups nos ultimos 12 meses?"
              name="ecosystem12months"
              value={values.actedInEcosystem12Months}
              options={YES_NO_OPTIONS}
              onChange={(value) => setField("actedInEcosystem12Months", value)}
            />
            <RadioGroup
              legend="1.3 Antes de responder, voce visualizou o SRL Canvas e o guia breve de aplicacao?"
              name="viewedMaterial"
              value={values.viewedSrlMaterial}
              options={YES_NO_OPTIONS}
              onChange={(value) => setField("viewedSrlMaterial", value)}
            />

            {isIneligible && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300">
                Pelas respostas de triagem, voce nao se enquadra no perfil de elegibilidade
                completa. Se desejar, envie apenas a triagem e prossiga para o app.
              </p>
            )}
          </SectionCard>
        )}

        {isEligible && currentStepKey === "profile" && (
          <SectionCard title="3. Perfil do respondente">
            <RadioGroup
              legend="3.1 Qual o seu papel principal no ecossistema de inovacao?"
              name="primaryRole"
              value={values.primaryRole}
              options={PROFILE_ROLE_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label
              }))}
              onChange={(value) => setField("primaryRole", value)}
            />

            {values.primaryRole === "outro" && (
              <label className="block">
                <span className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
                  Especifique seu papel
                </span>
                <input
                  className="mt-1 block w-full rounded-md border-zinc-300 bg-zinc-50 p-2 text-sm text-text-light-primary shadow-sm focus:border-primary focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-text-dark-primary"
                  type="text"
                  value={values.primaryRoleOther}
                  onChange={(event) => setField("primaryRoleOther", event.target.value)}
                />
              </label>
            )}

            <RadioGroup
              legend="3.2 Qual o seu tempo de experiencia com startups?"
              name="experienceYears"
              value={values.experienceYears}
              options={EXPERIENCE_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label
              }))}
              onChange={(value) => setField("experienceYears", value)}
            />

            <RadioGroup
              legend="3.3 Qual o setor predominante de sua atuacao?"
              name="sector"
              value={values.sector}
              options={SECTOR_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label
              }))}
              onChange={(value) => setField("sector", value)}
            />

            {values.sector === "outro" && (
              <label className="block">
                <span className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
                  Especifique o setor
                </span>
                <input
                  className="mt-1 block w-full rounded-md border-zinc-300 bg-zinc-50 p-2 text-sm text-text-light-primary shadow-sm focus:border-primary focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-text-dark-primary"
                  type="text"
                  value={values.sectorOther}
                  onChange={(event) => setField("sectorOther", event.target.value)}
                />
              </label>
            )}

            <RadioGroup
              legend="3.4 Qual o estagio tipico das startups com as quais voce interage?"
              name="startupStage"
              value={values.startupStage}
              options={STAGE_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label
              }))}
              onChange={(value) => setField("startupStage", value)}
            />

            <label className="block">
              <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                3.5 Qual a sua localidade/pais de atuacao?
              </span>
              <input
                className="mt-1 block w-full rounded-md border-zinc-300 bg-zinc-50 p-2 text-sm text-text-light-primary shadow-sm focus:border-primary focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-text-dark-primary"
                type="text"
                value={values.locationCountry}
                onChange={(event) => setField("locationCountry", event.target.value)}
                placeholder="Ex.: Campo Grande, Brasil"
              />
            </label>

            <RadioGroup
              legend="3.6 Qual o tamanho medio das equipes que voce acompanha/avalia?"
              name="teamSize"
              value={values.teamSize}
              options={TEAM_SIZE_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label
              }))}
              onChange={(value) => setField("teamSize", value)}
            />
          </SectionCard>
        )}

        {isEligible && isDimensionStepKey(currentStepKey) && (
          <SectionCard title={DIMENSION_STEP_CONFIG[currentStepKey].title}>
            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
              Escala Likert: {likertHelp}
            </p>

            <div className="space-y-4">
              {DIMENSION_STEP_CONFIG[currentStepKey].dimensions.map((dimension, index) => {
                const answer = values.dimensionAnswers[dimension.key];
                const questionNumber =
                  DIMENSION_STEP_CONFIG[currentStepKey].startQuestionNumber + index;

                return (
                  <article
                    key={dimension.key}
                    className="rounded-xl border border-zinc-200/80 p-3 dark:border-zinc-800/80"
                  >
                    <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
                      5.{questionNumber}. {dimension.label}
                    </h3>

                    <div className="mt-3 space-y-3">
                      {DIMENSION_ASSERTIONS.map((assertion) => (
                        <LikertGroup
                          key={`${dimension.key}_${assertion.key}`}
                          legend={assertion.label}
                          name={`${dimension.key}_${assertion.key}`}
                          value={answer.ratings[assertion.key]}
                          onChange={(value) =>
                            setValues((prev) => ({
                              ...prev,
                              dimensionAnswers: {
                                ...prev.dimensionAnswers,
                                [dimension.key]: {
                                  ...prev.dimensionAnswers[dimension.key],
                                  ratings: {
                                    ...prev.dimensionAnswers[dimension.key].ratings,
                                    [assertion.key]: value
                                  }
                                }
                              }
                            }))
                          }
                        />
                      ))}

                      <label className="block">
                        <span className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
                          Comentario breve (opcional)
                        </span>
                        <textarea
                          className="mt-1 block min-h-20 w-full rounded-md border-zinc-300 bg-zinc-50 p-2 text-sm text-text-light-primary shadow-sm focus:border-primary focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-text-dark-primary"
                          value={answer.comment}
                          onChange={(event) =>
                            setValues((prev) => ({
                              ...prev,
                              dimensionAnswers: {
                                ...prev.dimensionAnswers,
                                [dimension.key]: {
                                  ...prev.dimensionAnswers[dimension.key],
                                  comment: event.target.value
                                }
                              }
                            }))
                          }
                        />
                      </label>
                    </div>
                  </article>
                );
              })}
            </div>
          </SectionCard>
        )}

        {isEligible && currentStepKey === "scale_and_sus" && (
          <>
            <SectionCard title="6. Escala de niveis (1 a 9) - clareza e utilidade">
              <LikertGroup
                legend="6.1 A escala de 1 a 9 e clara e com ancoras suficientes para diferenciar os niveis?"
                name="scaleClarity"
                value={values.scaleClarity}
                onChange={(value) => setField("scaleClarity", value)}
              />
              <LikertGroup
                legend="6.2 A escala de 1 a 9 e util para comparacoes entre startups?"
                name="scaleUtility"
                value={values.scaleUtility}
                onChange={(value) => setField("scaleUtility", value)}
              />
              <RadioGroup
                legend="6.3 Voce preferiria outra escala?"
                name="preferredScale"
                value={values.preferredScale}
                options={PREFERRED_SCALE_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label
                }))}
                onChange={(value) => setField("preferredScale", value)}
              />

              {values.preferredScale === "outro" && (
                <label className="block">
                  <span className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
                    Qual escala preferida?
                  </span>
                  <input
                    className="mt-1 block w-full rounded-md border-zinc-300 bg-zinc-50 p-2 text-sm text-text-light-primary shadow-sm focus:border-primary focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-text-dark-primary"
                    type="text"
                    value={values.preferredScaleOther}
                    onChange={(event) => setField("preferredScaleOther", event.target.value)}
                  />
                </label>
              )}

              {values.preferredScale !== "nao" && values.preferredScale !== "" && (
                <label className="block">
                  <span className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
                    Por que?
                  </span>
                  <textarea
                    className="mt-1 block min-h-20 w-full rounded-md border-zinc-300 bg-zinc-50 p-2 text-sm text-text-light-primary shadow-sm focus:border-primary focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-text-dark-primary"
                    value={values.preferredScaleReason}
                    onChange={(event) => setField("preferredScaleReason", event.target.value)}
                  />
                </label>
              )}
            </SectionCard>

            <SectionCard title="7. Usabilidade (SUS - System Usability Scale)">
              <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Escala Likert: {likertHelp}
              </p>
              <div className="space-y-3">
                {SUS_ITEMS.map((item) => (
                  <LikertGroup
                    key={`sus_${item.key}`}
                    legend={`7.${item.key} ${item.label}`}
                    name={`sus_${item.key}`}
                    value={values.susAnswers[item.key]}
                    onChange={(value) =>
                      setValues((prev) => ({
                        ...prev,
                        susAnswers: {
                          ...prev.susAnswers,
                          [item.key]: value
                        }
                      }))
                    }
                  />
                ))}
              </div>
            </SectionCard>
          </>
        )}

        {isEligible && currentStepKey === "adoption_and_followup" && (
          <>
            <SectionCard title="8. Aplicacao, utilidade e adocao">
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                  8.1 Em quais contextos voce usaria o SRL Canvas? (Marque todas as opcoes)
                </legend>
                <div className="flex flex-wrap gap-2">
                  {USAGE_CONTEXT_OPTIONS.map((option) => {
                    const checked = values.usageContexts.includes(option.value);
                    return (
                      <label
                        key={option.value}
                        className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                          checked
                            ? "border-primary bg-primary/10 text-text-light-primary dark:text-text-dark-primary"
                            : "border-zinc-300 text-text-light-secondary hover:bg-zinc-100 dark:border-zinc-700 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
                        }`}
                      >
                        <input
                          className="sr-only"
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleUsageContext(option.value)}
                        />
                        {option.label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {values.usageContexts.includes("outro") && (
                <label className="block">
                  <span className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
                    Especifique o contexto em "Outro"
                  </span>
                  <input
                    className="mt-1 block w-full rounded-md border-zinc-300 bg-zinc-50 p-2 text-sm text-text-light-primary shadow-sm focus:border-primary focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-text-dark-primary"
                    type="text"
                    value={values.usageContextOther}
                    onChange={(event) => setField("usageContextOther", event.target.value)}
                  />
                </label>
              )}

              <RadioGroup
                legend="8.2 Qual a probabilidade de voce recomendar o SRL Canvas? (NPS 0 a 10)"
                name="npsScore"
                value={values.npsScore}
                options={Array.from({ length: 11 }, (_, index) => ({
                  value: index,
                  label: String(index)
                }))}
                onChange={(value) => setField("npsScore", value)}
                dense
              />

              <RadioGroup
                legend="8.3 Qual seria o tempo aceitavel de aplicacao do SRL Canvas (por startup)?"
                name="acceptableTime"
                value={values.acceptableTime}
                options={ACCEPTABLE_TIME_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label
                }))}
                onChange={(value) => setField("acceptableTime", value)}
              />

              <label className="block">
                <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                  8.4 Quais barreiras de adocao voce enxerga para o SRL Canvas?
                </span>
                <textarea
                  className="mt-1 block min-h-24 w-full rounded-md border-zinc-300 bg-zinc-50 p-2 text-sm text-text-light-primary shadow-sm focus:border-primary focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-text-dark-primary"
                  value={values.adoptionBarriers}
                  onChange={(event) => setField("adoptionBarriers", event.target.value)}
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                  8.5 Quais as 1-3 principais melhorias que voce sugeriria para o SRL Canvas?
                </span>
                <textarea
                  className="mt-1 block min-h-24 w-full rounded-md border-zinc-300 bg-zinc-50 p-2 text-sm text-text-light-primary shadow-sm focus:border-primary focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-text-dark-primary"
                  value={values.suggestedImprovements}
                  onChange={(event) => setField("suggestedImprovements", event.target.value)}
                />
              </label>
            </SectionCard>

            <SectionCard title="9. Dados para follow-up (opcionais)">
              <RadioGroup
                legend="9.1 Deseja receber a versao final do SRL Canvas e/ou relatorio-sintese da pesquisa?"
                name="wantsFinalVersion"
                value={values.wantsFinalVersion}
                options={YES_NO_OPTIONS}
                onChange={(value) => setField("wantsFinalVersion", value)}
              />

              <RadioGroup
                legend="9.2 Aceita ser convidado(a) para entrevista de aprofundamento (20-30 minutos)?"
                name="acceptsInterview"
                value={values.acceptsInterview}
                options={YES_NO_OPTIONS}
                onChange={(value) => setField("acceptsInterview", value)}
              />

              {values.acceptsInterview === "sim" && (
                <label className="block">
                  <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                    9.3 Contato preferido (e-mail ou WhatsApp)
                  </span>
                  <input
                    className="mt-1 block w-full rounded-md border-zinc-300 bg-zinc-50 p-2 text-sm text-text-light-primary shadow-sm focus:border-primary focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-text-dark-primary"
                    type="text"
                    value={values.preferredContact}
                    onChange={(event) => setField("preferredContact", event.target.value)}
                  />
                </label>
              )}

              <RadioGroup
                legend="9.4 Autoriza citacao nao identificada de trechos das respostas em publicacoes academicas?"
                name="allowsAnonymousQuotes"
                value={values.allowsAnonymousQuotes}
                options={YES_NO_OPTIONS}
                onChange={(value) => setField("allowsAnonymousQuotes", value)}
              />
            </SectionCard>
          </>
        )}

        {(errors.length > 0 || submitError) && (
          <section className="rounded-xl border border-red-300/80 bg-red-50 p-4 dark:border-red-700/70 dark:bg-red-900/20">
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
              Revise os pontos abaixo
            </h3>
            {submitError && (
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">{submitError}</p>
            )}
            {errors.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700 dark:text-red-300">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            )}
          </section>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={goToPreviousStep}
                disabled={isSubmitting}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-text-light-secondary hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
              >
                Etapa anterior
              </button>
            )}

            {!isLastStep && (
              <button
                type="button"
                onClick={goToNextStep}
                disabled={isSubmitting}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Proxima etapa
              </button>
            )}

            {isLastStep && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Enviando..." : isIneligible ? "Enviar triagem" : "Enviar pesquisa"}
              </button>
            )}

            <button
              type="button"
              onClick={handleAnswerLater}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-text-light-secondary hover:bg-zinc-100 dark:border-zinc-700 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
            >
              Responder depois
            </button>
          </div>
          {draftSavedAt && (
            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
              Rascunho salvo automaticamente em {new Date(draftSavedAt).toLocaleString("pt-BR")}
            </p>
          )}
        </form>
      </main>

      <FooterNav />
    </div>
  );
}

function formatDurationLabel(startedAtIso: string): string | null {
  const totalSeconds = getDurationInSeconds(startedAtIso);
  if (totalSeconds === null) return null;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function getDurationInSeconds(startedAtIso: string): number | null {
  const start = new Date(startedAtIso);
  if (Number.isNaN(start.getTime())) return null;

  const diffMs = Date.now() - start.getTime();
  if (diffMs < 0) return null;

  return Math.round(diffMs / 1000);
}

function scrollToTop(): void {
  if (typeof window === "undefined") return;
  if (/jsdom/i.test(window.navigator.userAgent)) return;
  window.scrollTo({ top: 0, behavior: "smooth" });
}
