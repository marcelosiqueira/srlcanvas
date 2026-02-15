import {
  DIMENSION_ASSERTIONS,
  RESEARCH_CONSENT_VERSION,
  SUS_ITEMS,
  SURVEY_DIMENSIONS
} from "../data/researchSurvey";
import { RESEARCH_SURVEY_CONFIG } from "../config/researchSurveyConfig";
import { supabase } from "../lib/supabase";
import type { Likert5, ResearchSurveyFormValues, YesNoAnswer } from "../types/researchSurvey";

const LOCAL_SURVEY_STORAGE_KEY = "srl-research-survey-responses-v1";
const LOCAL_SURVEY_DRAFT_STORAGE_PREFIX = "srl-research-survey-draft-v1";

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
  storage: "supabase" | "local";
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

const makeSurveyDraftKey = (userId: string | null): string =>
  `${LOCAL_SURVEY_DRAFT_STORAGE_PREFIX}:${userId ?? "guest"}`;

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

export async function saveResearchSurveyResponse(
  input: SaveResearchSurveyInput
): Promise<SaveResearchSurveyResult> {
  const payload = buildPayload(input);

  if (!supabase || !input.userId) {
    return saveLocally(payload);
  }

  const { data, error } = await supabase
    .from("research_survey_responses")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    id: data.id as string,
    storage: "supabase"
  };
}
