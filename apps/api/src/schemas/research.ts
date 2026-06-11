import { z } from "zod";

const jsonRecord = z.record(z.string(), z.unknown());

export const createConsentSchema = z.object({
  consentVersion: z.string().min(1),
  surveyVersion: z.string().min(1),
  metadata: jsonRecord
});

export const createSurveyResponseSchema = z.object({
  // Resposta so e aceita com consentimento explicito.
  consentAccepted: z.literal(true),
  consentVersion: z.string().min(1),
  age18OrMore: z.boolean(),
  actedInEcosystem12m: z.boolean(),
  viewedSrlMaterial: z.boolean(),
  isEligible: z.boolean(),
  profile: jsonRecord,
  dimensionAnswers: jsonRecord,
  scaleFeedback: jsonRecord,
  susAnswers: jsonRecord,
  adoptionFeedback: jsonRecord,
  followUp: jsonRecord,
  metadata: jsonRecord
});

export type CreateConsentInput = z.infer<typeof createConsentSchema>;
export type CreateSurveyResponseInput = z.infer<typeof createSurveyResponseSchema>;
