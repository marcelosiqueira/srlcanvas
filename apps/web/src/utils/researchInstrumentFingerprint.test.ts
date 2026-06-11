import { describe, expect, it } from "vitest";
import { buildResearchSurveyEthicsFingerprint } from "./researchInstrumentFingerprint";

describe("research instrument ethics fingerprint", () => {
  it("matches the approved ethics-committee questionnaire", () => {
    expect(buildResearchSurveyEthicsFingerprint()).toMatchInlineSnapshot(
      `"ethics-questionario_quantitativo_srl_canvas_guia_v2_2026-06-11:a2233896"`
    );
  });
});
