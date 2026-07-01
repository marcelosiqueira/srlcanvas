import {
  DIMENSION_ASSERTIONS,
  RESEARCH_CONSENT_VERSION,
  SUS_ITEMS,
  SURVEY_DIMENSIONS
} from "../data/researchSurvey";
import { RESEARCH_SURVEY_CONFIG } from "../config/researchSurveyConfig";
import { ApiError, apiFetch, isApiConfigured } from "../lib/apiClient";
import type { Likert5, ResearchSurveyFormValues, YesNoAnswer } from "../types/researchSurvey";

const LOCAL_SURVEY_STORAGE_KEY = "srl-research-survey-responses-v1";
const LOCAL_SURVEY_DRAFT_STORAGE_PREFIX = "srl-research-survey-draft-v1";
const LOCAL_SURVEY_SUBMISSION_PREFIX = "srl-research-survey-submission-v1";

interface StoredLocalResponse {
  id: string;
  createdAt: string;
  payload: Record<string, unknown>;
}

interface SaveResearchSurveyInput {
  userId: string | null;
  values: ResearchSurveyFormValues;
  nextPath: string;
  startedAtIso?: string | null;
}

export interface SaveResearchSurveyResult {
  id: string;
  storage: "remote" | "local";
}

export interface ExistingResearchSubmission {
  id: string;
  submittedAt: string;
  values: ResearchSurveyFormValues;
  storage: "remote" | "local";
}

interface StoredSubmissionPointer {
  id: string;
  submittedAt: string;
}

// Forma remota retornada por GET /research/survey-responses(/mine|/:id):
// topo em camelCase; objetos internos preservam o snake_case gravado.
interface RemoteSurveyResponse {
  id: string;
  createdAt: string;
  age18OrMore: boolean | null;
  actedInEcosystem12m: boolean | null;
  viewedSrlMaterial: boolean | null;
  profile: Record<string, unknown>;
  dimensionAnswers: unknown;
  scaleFeedback: Record<string, unknown>;
  susAnswers: unknown;
  adoptionFeedback: Record<string, unknown>;
  followUp: Record<string, unknown>;
}

// Forma comum consumida por mapStoredResponseToFormValues (remoto e local
// convergem para isto: triagem + objetos internos snake_case).
interface NormalizedStoredResponse {
  age18OrMore: boolean | null;
  actedInEcosystem12m: boolean | null;
  viewedSrlMaterial: boolean | null;
  profile: Record<string, unknown>;
  dimensionAnswers: unknown;
  scaleFeedback: Record<string, unknown>;
  susAnswers: unknown;
  adoptionFeedback: Record<string, unknown>;
  followUp: Record<string, unknown>;
}

interface StoredSurveyDraft {
  values: ResearchSurveyFormValues;
  nextPath: string;
  startedAtIso?: string;
  currentStepKey?: string;
  updatedAt: string;
}

const toBoolean = (value: YesNoAnswer): boolean | null => {
  if (value === "sim") return true;
  if (value === "nao") return false;
  return null;
};

const fromBoolean = (value: unknown): YesNoAnswer => {
  if (value === true) return "sim";
  if (value === false) return "nao";
  return "";
};

const asString = (value: unknown): string => (typeof value === "string" ? value : "");

const asNumber = (value: unknown): number | null =>
  typeof value === "number" && !Number.isNaN(value) ? value : null;

const asLikert = (value: unknown): Likert5 | null =>
  typeof value === "number" && value >= 1 && value <= 5 ? (value as Likert5) : null;

const makeSurveyDraftKey = (userId: string | null): string =>
  `${LOCAL_SURVEY_DRAFT_STORAGE_PREFIX}:${userId ?? "guest"}`;

const makeSubmissionKey = (userId: string | null): string =>
  `${LOCAL_SURVEY_SUBMISSION_PREFIX}:${userId ?? "guest"}`;

function rememberResearchSubmission(userId: string | null, id: string): void {
  const pointer: StoredSubmissionPointer = { id, submittedAt: new Date().toISOString() };
  window.localStorage.setItem(makeSubmissionKey(userId), JSON.stringify(pointer));
}

function readSubmissionPointer(userId: string | null): StoredSubmissionPointer | null {
  const raw = window.localStorage.getItem(makeSubmissionKey(userId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSubmissionPointer;
  } catch {
    window.localStorage.removeItem(makeSubmissionKey(userId));
    return null;
  }
}

export function clearResearchSurveySubmission(userId: string | null): void {
  window.localStorage.removeItem(makeSubmissionKey(userId));
}

const makeInitialDimensionRatings = (): Record<string, Likert5 | null> =>
  DIMENSION_ASSERTIONS.reduce<Record<string, Likert5 | null>>((acc, assertion) => {
    acc[assertion.key] = null;
    return acc;
  }, {});

export const makeInitialResearchSurveyValues = (): ResearchSurveyFormValues => {
  const dimensionAnswers = SURVEY_DIMENSIONS.reduce<ResearchSurveyFormValues["dimensionAnswers"]>(
    (acc, dimension) => {
      acc[dimension.key] = {
        ratings: makeInitialDimensionRatings(),
        comment: ""
      };
      return acc;
    },
    {} as ResearchSurveyFormValues["dimensionAnswers"]
  );

  const susAnswers = SUS_ITEMS.reduce<Record<number, Likert5 | null>>((acc, item) => {
    acc[item.key] = null;
    return acc;
  }, {});

  return {
    age18OrMore: "",
    actedInEcosystem12Months: "",
    viewedSrlMaterial: "",
    primaryRole: "",
    primaryRoleOther: "",
    experienceYears: "",
    sector: "",
    sectorOther: "",
    startupStage: "",
    locationCountry: "",
    teamSize: "",
    dimensionAnswers,
    scaleClarity: null,
    scaleUtility: null,
    preferredScale: "",
    preferredScaleOther: "",
    preferredScaleReason: "",
    susAnswers,
    usageContexts: [],
    usageContextOther: "",
    npsScore: null,
    acceptableTime: "",
    adoptionBarriers: "",
    suggestedImprovements: "",
    wantsFinalVersion: "",
    acceptsInterview: "",
    preferredContact: "",
    allowsAnonymousQuotes: ""
  };
};

export function loadResearchSurveyDraft(userId: string | null): StoredSurveyDraft | null {
  const raw = window.localStorage.getItem(makeSurveyDraftKey(userId));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredSurveyDraft;
  } catch {
    window.localStorage.removeItem(makeSurveyDraftKey(userId));
    return null;
  }
}

export function saveResearchSurveyDraft(input: {
  userId: string | null;
  values: ResearchSurveyFormValues;
  nextPath: string;
  startedAtIso?: string | null;
  currentStepKey?: string;
}): void {
  const payload: StoredSurveyDraft = {
    values: input.values,
    nextPath: input.nextPath,
    startedAtIso: input.startedAtIso ?? undefined,
    currentStepKey: input.currentStepKey,
    updatedAt: new Date().toISOString()
  };

  window.localStorage.setItem(makeSurveyDraftKey(input.userId), JSON.stringify(payload));
}

export function clearResearchSurveyDraft(userId: string | null): void {
  window.localStorage.removeItem(makeSurveyDraftKey(userId));
}

const buildPayload = ({ userId, values, nextPath, startedAtIso }: SaveResearchSurveyInput) => {
  const age18OrMore = toBoolean(values.age18OrMore);
  const actedInEcosystem12Months = toBoolean(values.actedInEcosystem12Months);
  const viewedSrlMaterial = toBoolean(values.viewedSrlMaterial);

  if (age18OrMore === null || actedInEcosystem12Months === null || viewedSrlMaterial === null) {
    throw new Error("Perguntas de triagem incompletas.");
  }

  const isEligible = age18OrMore && actedInEcosystem12Months && viewedSrlMaterial;
  const submittedAtClient = new Date();
  const startedAt = startedAtIso ? new Date(startedAtIso) : null;
  const completionSeconds =
    startedAt && !Number.isNaN(startedAt.getTime())
      ? Math.max(0, Math.round((submittedAtClient.getTime() - startedAt.getTime()) / 1000))
      : null;

  return {
    user_id: userId,
    consent_accepted: true,
    consent_version: RESEARCH_CONSENT_VERSION,
    age_18_or_more: age18OrMore,
    acted_in_ecosystem_12m: actedInEcosystem12Months,
    viewed_srl_material: viewedSrlMaterial,
    is_eligible: isEligible,
    profile: {
      primary_role: values.primaryRole,
      primary_role_other: values.primaryRoleOther.trim() || null,
      experience_years: values.experienceYears,
      sector: values.sector,
      sector_other: values.sectorOther.trim() || null,
      startup_stage: values.startupStage,
      location_country: values.locationCountry.trim(),
      team_size: values.teamSize
    },
    dimension_answers: values.dimensionAnswers,
    scale_feedback: {
      clarity_1_9: values.scaleClarity,
      utility_1_9: values.scaleUtility,
      preferred_scale: values.preferredScale,
      preferred_scale_other: values.preferredScaleOther.trim() || null,
      preferred_scale_reason: values.preferredScaleReason.trim() || null
    },
    sus_answers: values.susAnswers,
    adoption_feedback: {
      usage_contexts: values.usageContexts,
      usage_context_other: values.usageContextOther.trim() || null,
      nps_score: values.npsScore,
      acceptable_time: values.acceptableTime,
      adoption_barriers: values.adoptionBarriers.trim() || null,
      suggested_improvements: values.suggestedImprovements.trim() || null
    },
    follow_up: {
      wants_final_version: toBoolean(values.wantsFinalVersion),
      accepts_interview: toBoolean(values.acceptsInterview),
      preferred_contact: values.preferredContact.trim() || null,
      allows_anonymous_quotes: toBoolean(values.allowsAnonymousQuotes)
    },
    metadata: {
      survey_version: RESEARCH_SURVEY_CONFIG.activeVersion,
      submitted_from_route: "/survey",
      next_path: nextPath,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      estimated_duration_minutes: "10-12",
      started_at_client: startedAtIso ?? null,
      submitted_at_client: submittedAtClient.toISOString(),
      completion_seconds: completionSeconds,
      completion_minutes:
        completionSeconds === null ? null : Number((completionSeconds / 60).toFixed(2))
    }
  };
};

const saveLocally = (payload: Record<string, unknown>): SaveResearchSurveyResult => {
  const id = crypto.randomUUID();
  const current: StoredLocalResponse[] = JSON.parse(
    window.localStorage.getItem(LOCAL_SURVEY_STORAGE_KEY) ?? "[]"
  ) as StoredLocalResponse[];

  const nextEntry: StoredLocalResponse = {
    id,
    createdAt: new Date().toISOString(),
    payload
  };

  window.localStorage.setItem(LOCAL_SURVEY_STORAGE_KEY, JSON.stringify([nextEntry, ...current]));

  return { id, storage: "local" };
};

// A API usa camelCase no topo do contrato; os objetos internos (profile,
// dimension_answers etc.) são opacos e seguem como estão.
const toApiBody = (payload: ReturnType<typeof buildPayload>) => ({
  consentAccepted: payload.consent_accepted,
  consentVersion: payload.consent_version,
  age18OrMore: payload.age_18_or_more,
  actedInEcosystem12m: payload.acted_in_ecosystem_12m,
  viewedSrlMaterial: payload.viewed_srl_material,
  isEligible: payload.is_eligible,
  profile: payload.profile,
  dimensionAnswers: payload.dimension_answers,
  scaleFeedback: payload.scale_feedback,
  susAnswers: payload.sus_answers,
  adoptionFeedback: payload.adoption_feedback,
  followUp: payload.follow_up,
  metadata: payload.metadata
});

export async function saveResearchSurveyResponse(
  input: SaveResearchSurveyInput
): Promise<SaveResearchSurveyResult> {
  const payload = buildPayload(input);

  // Com API configurada, envia também respostas ANÔNIMAS (input.userId null);
  // o backend grava userId null. Só cai em local quando não há API.
  const result = !isApiConfigured
    ? saveLocally(payload)
    : await apiFetch<{ id: string }>("/research/survey-responses", {
        method: "POST",
        body: toApiBody(payload)
      }).then((data): SaveResearchSurveyResult => ({ id: data.id, storage: "remote" }));

  // Ponteiro local para reabrir/editar esta resposta depois (mesmo browser).
  rememberResearchSubmission(input.userId, result.id);
  return result;
}

const updateLocally = (id: string, payload: Record<string, unknown>): SaveResearchSurveyResult => {
  const current: StoredLocalResponse[] = JSON.parse(
    window.localStorage.getItem(LOCAL_SURVEY_STORAGE_KEY) ?? "[]"
  ) as StoredLocalResponse[];

  const index = current.findIndex((entry) => entry.id === id);
  if (index >= 0) {
    current[index] = { ...current[index], payload };
  } else {
    current.unshift({ id, createdAt: new Date().toISOString(), payload });
  }

  window.localStorage.setItem(LOCAL_SURVEY_STORAGE_KEY, JSON.stringify(current));
  return { id, storage: "local" };
};

export async function updateResearchSurveyResponse(
  id: string,
  input: SaveResearchSurveyInput
): Promise<SaveResearchSurveyResult> {
  const payload = buildPayload(input);

  const result = !isApiConfigured
    ? updateLocally(id, payload)
    : await apiFetch<{ id: string }>(`/research/survey-responses/${id}`, {
        method: "PUT",
        body: toApiBody(payload)
      }).then((data): SaveResearchSurveyResult => ({ id: data.id, storage: "remote" }));

  rememberResearchSubmission(input.userId, result.id);
  return result;
}

function mergeDimensionAnswers(
  base: ResearchSurveyFormValues["dimensionAnswers"],
  stored: unknown
): ResearchSurveyFormValues["dimensionAnswers"] {
  if (!stored || typeof stored !== "object") return base;
  const source = stored as Record<string, { ratings?: unknown; comment?: unknown }>;
  const result = { ...base };

  (Object.keys(base) as Array<keyof typeof base>).forEach((key) => {
    const entry = source[key as string];
    if (entry && typeof entry === "object") {
      result[key] = {
        ratings: { ...base[key].ratings, ...((entry.ratings as object) ?? {}) },
        comment: typeof entry.comment === "string" ? entry.comment : base[key].comment
      };
    }
  });

  return result;
}

function mergeSusAnswers(
  base: ResearchSurveyFormValues["susAnswers"],
  stored: unknown
): ResearchSurveyFormValues["susAnswers"] {
  if (!stored || typeof stored !== "object") return base;
  const source = stored as Record<string, unknown>;
  const result = { ...base };

  Object.keys(result).forEach((key) => {
    const value = asLikert(source[key]);
    if (value !== null) result[Number(key)] = value;
  });

  return result;
}

export function mapStoredResponseToFormValues(
  stored: NormalizedStoredResponse
): ResearchSurveyFormValues {
  const base = makeInitialResearchSurveyValues();
  const profile = (stored.profile ?? {}) as Record<string, unknown>;
  const scale = (stored.scaleFeedback ?? {}) as Record<string, unknown>;
  const adoption = (stored.adoptionFeedback ?? {}) as Record<string, unknown>;
  const follow = (stored.followUp ?? {}) as Record<string, unknown>;

  return {
    ...base,
    age18OrMore: fromBoolean(stored.age18OrMore),
    actedInEcosystem12Months: fromBoolean(stored.actedInEcosystem12m),
    viewedSrlMaterial: fromBoolean(stored.viewedSrlMaterial),
    primaryRole: asString(profile.primary_role),
    primaryRoleOther: asString(profile.primary_role_other),
    experienceYears: asString(profile.experience_years),
    sector: asString(profile.sector),
    sectorOther: asString(profile.sector_other),
    startupStage: asString(profile.startup_stage),
    locationCountry: asString(profile.location_country),
    teamSize: asString(profile.team_size),
    dimensionAnswers: mergeDimensionAnswers(base.dimensionAnswers, stored.dimensionAnswers),
    scaleClarity: asLikert(scale.clarity_1_9),
    scaleUtility: asLikert(scale.utility_1_9),
    preferredScale: asString(scale.preferred_scale),
    preferredScaleOther: asString(scale.preferred_scale_other),
    preferredScaleReason: asString(scale.preferred_scale_reason),
    susAnswers: mergeSusAnswers(base.susAnswers, stored.susAnswers),
    usageContexts: Array.isArray(adoption.usage_contexts)
      ? (adoption.usage_contexts as unknown[]).filter(
          (item): item is string => typeof item === "string"
        )
      : [],
    usageContextOther: asString(adoption.usage_context_other),
    npsScore: asNumber(adoption.nps_score),
    acceptableTime: asString(adoption.acceptable_time),
    adoptionBarriers: asString(adoption.adoption_barriers),
    suggestedImprovements: asString(adoption.suggested_improvements),
    wantsFinalVersion: fromBoolean(follow.wants_final_version),
    acceptsInterview: fromBoolean(follow.accepts_interview),
    preferredContact: asString(follow.preferred_contact),
    allowsAnonymousQuotes: fromBoolean(follow.allows_anonymous_quotes)
  };
}

const normalizeRemote = (data: RemoteSurveyResponse): NormalizedStoredResponse => ({
  age18OrMore: data.age18OrMore,
  actedInEcosystem12m: data.actedInEcosystem12m,
  viewedSrlMaterial: data.viewedSrlMaterial,
  profile: data.profile,
  dimensionAnswers: data.dimensionAnswers,
  scaleFeedback: data.scaleFeedback,
  susAnswers: data.susAnswers,
  adoptionFeedback: data.adoptionFeedback,
  followUp: data.followUp
});

// O payload local (buildPayload) usa snake_case no topo.
const normalizeLocal = (payload: Record<string, unknown>): NormalizedStoredResponse => ({
  age18OrMore: (payload.age_18_or_more as boolean | null) ?? null,
  actedInEcosystem12m: (payload.acted_in_ecosystem_12m as boolean | null) ?? null,
  viewedSrlMaterial: (payload.viewed_srl_material as boolean | null) ?? null,
  profile: (payload.profile as Record<string, unknown>) ?? {},
  dimensionAnswers: payload.dimension_answers,
  scaleFeedback: (payload.scale_feedback as Record<string, unknown>) ?? {},
  susAnswers: payload.sus_answers,
  adoptionFeedback: (payload.adoption_feedback as Record<string, unknown>) ?? {},
  followUp: (payload.follow_up as Record<string, unknown>) ?? {}
});

function loadLocalSubmission(userId: string | null): ExistingResearchSubmission | null {
  // O ponteiro é a fonte de verdade: sem ponteiro, nada a reabrir.
  const pointer = readSubmissionPointer(userId);
  if (!pointer) return null;

  const list: StoredLocalResponse[] = JSON.parse(
    window.localStorage.getItem(LOCAL_SURVEY_STORAGE_KEY) ?? "[]"
  ) as StoredLocalResponse[];

  const entry = list.find((item) => item.id === pointer.id);
  if (!entry) return null;

  return {
    id: entry.id,
    submittedAt: entry.createdAt,
    values: mapStoredResponseToFormValues(normalizeLocal(entry.payload)),
    storage: "local"
  };
}

/**
 * Resposta JÁ ENVIADA por este participante, para a tela de reabertura.
 * Logado+API → GET /mine. Anônimo+API → ponteiro local + GET /:id.
 * Sem API → localStorage. Retorna null quando não há resposta.
 */
export async function loadSubmittedResearchResponse(
  userId: string | null
): Promise<ExistingResearchSubmission | null> {
  if (!isApiConfigured) {
    return loadLocalSubmission(userId);
  }

  if (userId) {
    try {
      const data = await apiFetch<RemoteSurveyResponse>("/research/survey-responses/mine");
      return {
        id: data.id,
        submittedAt: data.createdAt,
        values: mapStoredResponseToFormValues(normalizeRemote(data)),
        storage: "remote"
      };
    } catch {
      // 404 = sem resposta; outras falhas tratamos como "nada a reabrir".
      return null;
    }
  }

  // Anônimo: depende do ponteiro guardado neste browser ao enviar.
  const pointer = readSubmissionPointer(userId);
  if (!pointer) return null;

  try {
    const data = await apiFetch<RemoteSurveyResponse>(`/research/survey-responses/${pointer.id}`);
    return {
      id: data.id,
      submittedAt: data.createdAt,
      values: mapStoredResponseToFormValues(normalizeRemote(data)),
      storage: "remote"
    };
  } catch (error) {
    // Registro sumiu no servidor: limpa o ponteiro obsoleto e segue como novo.
    if (error instanceof ApiError && error.status === 404) {
      clearResearchSurveySubmission(userId);
    }
    return null;
  }
}
