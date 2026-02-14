import { RESEARCH_SURVEY_VERSION } from "../data/researchSurvey";
import { RESEARCH_TCLE_VERSION } from "../data/researchConsent";
import { supabase } from "../lib/supabase";

const LOCAL_RESEARCH_CONSENT_KEY = "srl-research-consent-v1";

interface LocalConsentState {
  consentVersion: string;
  acceptedAt: string;
  revokedAt: string | null;
}

interface AcceptResearchConsentInput {
  userId: string | null;
  nextPath: string;
}

export interface ResearchConsentStatus {
  accepted: boolean;
  acceptedAt: string | null;
  storage: "supabase" | "local" | "none";
  consentId: string | null;
}

export interface ResearchConsentResult {
  id: string;
  storage: "supabase" | "local";
}

function readLocalConsent(): LocalConsentState | null {
  const raw = window.localStorage.getItem(LOCAL_RESEARCH_CONSENT_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as LocalConsentState;
  } catch {
    return null;
  }
}

function writeLocalConsent(state: LocalConsentState): void {
  window.localStorage.setItem(LOCAL_RESEARCH_CONSENT_KEY, JSON.stringify(state));
}

export async function getResearchConsentStatus(
  userId: string | null
): Promise<ResearchConsentStatus> {
  if (!supabase || !userId) {
    const local = readLocalConsent();
    if (!local || local.revokedAt) {
      return { accepted: false, acceptedAt: null, storage: "none", consentId: null };
    }

    return {
      accepted: true,
      acceptedAt: local.acceptedAt,
      storage: "local",
      consentId: "local"
    };
  }

  const { data, error } = await supabase
    .from("research_consents")
    .select("id,accepted,revoked_at,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data || !data.accepted || data.revoked_at) {
    return { accepted: false, acceptedAt: null, storage: "none", consentId: null };
  }

  return {
    accepted: true,
    acceptedAt: data.created_at as string,
    storage: "supabase",
    consentId: data.id as string
  };
}

function acceptLocally(): ResearchConsentResult {
  const acceptedAt = new Date().toISOString();
  writeLocalConsent({
    consentVersion: RESEARCH_TCLE_VERSION,
    acceptedAt,
    revokedAt: null
  });

  return {
    id: acceptedAt,
    storage: "local"
  };
}

export async function acceptResearchConsent(
  input: AcceptResearchConsentInput
): Promise<ResearchConsentResult> {
  if (!supabase || !input.userId) {
    return acceptLocally();
  }

  const payload = {
    user_id: input.userId,
    accepted: true,
    consent_version: RESEARCH_TCLE_VERSION,
    survey_version: RESEARCH_SURVEY_VERSION,
    metadata: {
      next_path: input.nextPath,
      accepted_at_client: new Date().toISOString(),
      source_route: "/survey/consent",
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown"
    }
  };

  const { data, error } = await supabase
    .from("research_consents")
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

export async function revokeResearchConsent(userId: string | null): Promise<void> {
  if (!supabase || !userId) {
    const local = readLocalConsent();
    if (!local) return;

    writeLocalConsent({
      ...local,
      revokedAt: new Date().toISOString()
    });
    return;
  }

  const { data, error } = await supabase
    .from("research_consents")
    .select("id")
    .eq("user_id", userId)
    .eq("accepted", true)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return;

  const { error: updateError } = await supabase
    .from("research_consents")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", data.id as string)
    .eq("user_id", userId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}
