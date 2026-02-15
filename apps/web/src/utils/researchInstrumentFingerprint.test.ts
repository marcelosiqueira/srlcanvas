import { describe, expect, it } from "vitest";
import { buildResearchSurveyEthicsFingerprint } from "./researchInstrumentFingerprint";

describe("research instrument ethics fingerprint", () => {
  it("matches the approved ethics-committee questionnaire", () => {
    expect(buildResearchSurveyEthicsFingerprint()).toMatchInlineSnapshot(
      `"ethics-questionario_quantitativo_srl_canvas_revisado_2025-11-28:0caed5bb"`
    );
  });
});
