import { afterEach, describe, expect, it } from "vitest";

import {
  clearResearchSurveySubmission,
  loadSubmittedResearchResponse,
  makeInitialResearchSurveyValues,
  saveResearchSurveyResponse,
  updateResearchSurveyResponse
} from "./researchSurveyApi";
import type { ResearchSurveyFormValues } from "../types/researchSurvey";

// Sem VITE_API_URL nos testes, o serviço opera em modo localStorage.

function filledValues(): ResearchSurveyFormValues {
  const values = makeInitialResearchSurveyValues();
  values.age18OrMore = "sim";
  values.actedInEcosystem12Months = "sim";
  values.viewedSrlMaterial = "nao";
  values.primaryRole = "founder";
  values.experienceYears = "3-5";
  values.sector = "tech";
  values.startupStage = "seed";
  values.locationCountry = "Brasil";
  values.teamSize = "2-5";
  values.scaleClarity = 4;
  values.scaleUtility = 5;
  values.preferredScale = "1-5";
  values.preferredScaleReason = "mais simples";
  values.usageContexts = ["mentoria", "diagnostico"];
  values.npsScore = 9;
  values.acceptableTime = "10-15";
  values.adoptionBarriers = "tempo";
  values.suggestedImprovements = "exportar pdf";
  values.wantsFinalVersion = "sim";
  values.acceptsInterview = "nao";
  values.allowsAnonymousQuotes = "sim";

  // Algumas dimensões e itens SUS preenchidos.
  const firstDimension = Object.keys(
    values.dimensionAnswers
  )[0] as keyof typeof values.dimensionAnswers;
  const dimension = values.dimensionAnswers[firstDimension];
  const firstAssertion = Object.keys(dimension.ratings)[0] as keyof typeof dimension.ratings;
  dimension.ratings[firstAssertion] = 5;
  dimension.comment = "comentário";

  const firstSusKey = Object.keys(values.susAnswers)[0];
  values.susAnswers[Number(firstSusKey)] = 3;

  return values;
}

afterEach(() => {
  window.localStorage.clear();
});

describe("loadSubmittedResearchResponse (local)", () => {
  it("retorna null quando nada foi enviado", async () => {
    expect(await loadSubmittedResearchResponse(null)).toBeNull();
  });

  it("após salvar, reabre a resposta com os mesmos valores", async () => {
    const values = filledValues();
    const saved = await saveResearchSurveyResponse({
      userId: null,
      values,
      nextPath: "/"
    });
    expect(saved.storage).toBe("local");

    const loaded = await loadSubmittedResearchResponse(null);
    expect(loaded).not.toBeNull();
    expect(loaded?.id).toBe(saved.id);
    expect(loaded?.values).toEqual(values);
  });

  it("update sobrescreve o mesmo registro (sem criar novo)", async () => {
    const values = filledValues();
    const saved = await saveResearchSurveyResponse({ userId: null, values, nextPath: "/" });

    const edited = { ...values, suggestedImprovements: "novo texto" };
    const updated = await updateResearchSurveyResponse(saved.id, {
      userId: null,
      values: edited,
      nextPath: "/"
    });
    expect(updated.id).toBe(saved.id);

    const list = JSON.parse(
      window.localStorage.getItem("srl-research-survey-responses-v1") ?? "[]"
    ) as unknown[];
    expect(list).toHaveLength(1);

    const loaded = await loadSubmittedResearchResponse(null);
    expect(loaded?.values.suggestedImprovements).toBe("novo texto");
  });

  it("ponteiro limpo => não reabre mais", async () => {
    const values = filledValues();
    await saveResearchSurveyResponse({ userId: null, values, nextPath: "/" });
    clearResearchSurveySubmission(null);
    expect(await loadSubmittedResearchResponse(null)).toBeNull();
  });
});
