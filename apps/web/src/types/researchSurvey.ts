import type { DimensionAssertionKey, SurveyDimensionKey } from "../data/researchSurvey";

export type Likert5 = 1 | 2 | 3 | 4 | 5;

export interface ResearchSurveyDimensionAnswer {
  ratings: Record<DimensionAssertionKey, Likert5 | null>;
  comment: string;
}

export type ResearchSurveyDimensionAnswers = Record<
  SurveyDimensionKey,
  ResearchSurveyDimensionAnswer
>;

export type YesNoAnswer = "" | "sim" | "nao";

export interface ResearchSurveyFormValues {
  age18OrMore: YesNoAnswer;
  actedInEcosystem12Months: YesNoAnswer;
  viewedSrlMaterial: YesNoAnswer;

  primaryRole: string;
  primaryRoleOther: string;
  experienceYears: string;
  sector: string;
  sectorOther: string;
  startupStage: string;
  locationCountry: string;
  teamSize: string;

  dimensionAnswers: ResearchSurveyDimensionAnswers;

  scaleClarity: Likert5 | null;
  scaleUtility: Likert5 | null;
  preferredScale: string;
  preferredScaleOther: string;
  preferredScaleReason: string;

  susAnswers: Record<number, Likert5 | null>;

  usageContexts: string[];
  usageContextOther: string;
  npsScore: number | null;
  acceptableTime: string;
  adoptionBarriers: string;
  suggestedImprovements: string;

  wantsFinalVersion: YesNoAnswer;
  acceptsInterview: YesNoAnswer;
  preferredContact: string;
  allowsAnonymousQuotes: YesNoAnswer;
}
