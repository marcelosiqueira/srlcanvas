import { RESEARCH_SURVEY_CONFIG } from "../config/researchSurveyConfig";
import { RESEARCH_TCLE_VERSION } from "../data/researchConsent";
import { apiFetch, isApiConfigured } from "../lib/apiClient";

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
  storage: "remote" | "local" | "none";
  consentId: string | null;
}

export interface ResearchConsentResult {
  id: string;
  storage: "remote" | "local";
}

interface RemoteConsentStatus {
  accepted: boolean;
  acceptedAt: string | null;
  consentId: string | null;
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
  if (!isApiConfigured || !userId) {
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

  const data = await apiFetch<RemoteConsentStatus>("/research/consent");

  if (!data.accepted || !data.consentId) {
    return { accepted: false, acceptedAt: null, storage: "none", consentId: null };
  }

  return {
    accepted: true,
    acceptedAt: data.acceptedAt,
    storage: "remote",
    consentId: data.consentId
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
  if (!isApiConfigured || !input.userId) {
    return acceptLocally();
  }

  const data = await apiFetch<{ id: string }>("/research/consent", {
    method: "POST",
    body: {
      consentVersion: RESEARCH_TCLE_VERSION,
      surveyVersion: RESEARCH_SURVEY_CONFIG.activeVersion,
      metadata: {
        next_path: input.nextPath,
        accepted_at_client: new Date().toISOString(),
        source_route: "/survey/consent",
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown"
      }
    }
  });

  return {
    id: data.id,
    storage: "remote"
  };
}

export async function revokeResearchConsent(userId: string | null): Promise<void> {
  if (!isApiConfigured || !userId) {
    const local = readLocalConsent();
    if (!local) return;

    writeLocalConsent({
      ...local,
      revokedAt: new Date().toISOString()
    });
    return;
  }

  await apiFetch<void>("/research/consent/revoke", { method: "POST" });
}
