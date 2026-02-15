import {
  ACCEPTABLE_TIME_OPTIONS,
  DIMENSION_ASSERTIONS,
  EXPERIENCE_OPTIONS,
  LIKERT_SCALE_LABELS,
  LIKERT_SCALE_OPTIONS,
  PREFERRED_SCALE_OPTIONS,
  PROFILE_ROLE_OPTIONS,
  RESEARCH_CONSENT_VERSION,
  RESEARCH_SURVEY_VERSION,
  SECTOR_OPTIONS,
  STAGE_OPTIONS,
  SUS_ITEMS,
  SURVEY_DIMENSIONS,
  TEAM_SIZE_OPTIONS,
  USAGE_CONTEXT_OPTIONS
} from "../data/researchSurvey";

function hashString(value: string): string {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function buildResearchSurveyEthicsFingerprint(): string {
  const payload = JSON.stringify({
    surveyVersion: RESEARCH_SURVEY_VERSION,
    consentVersion: RESEARCH_CONSENT_VERSION,
    likertOptions: LIKERT_SCALE_OPTIONS,
    likertLabels: LIKERT_SCALE_OPTIONS.map((option) => LIKERT_SCALE_LABELS[option]),
    dimensions: SURVEY_DIMENSIONS,
    assertions: DIMENSION_ASSERTIONS,
    profileRoleOptions: PROFILE_ROLE_OPTIONS,
    experienceOptions: EXPERIENCE_OPTIONS,
    sectorOptions: SECTOR_OPTIONS,
    stageOptions: STAGE_OPTIONS,
    teamSizeOptions: TEAM_SIZE_OPTIONS,
    preferredScaleOptions: PREFERRED_SCALE_OPTIONS,
    susItems: SUS_ITEMS,
    usageContextOptions: USAGE_CONTEXT_OPTIONS,
    acceptableTimeOptions: ACCEPTABLE_TIME_OPTIONS
  });

  return `ethics-${RESEARCH_SURVEY_VERSION}:${hashString(payload)}`;
}
