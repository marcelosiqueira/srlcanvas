import { describe, expect, it } from "vitest";
import { isIsoDate, normalizeCanvasDate, validateCanvasMeta } from "./canvasMeta";

describe("canvasMeta", () => {
  it("normalizes Brazilian date format into ISO format", () => {
    expect(normalizeCanvasDate("14/02/2026")).toBe("2026-02-14");
  });

  it("keeps ISO date format when valid", () => {
    expect(normalizeCanvasDate("2026-02-14")).toBe("2026-02-14");
    expect(isIsoDate("2026-02-14")).toBe(true);
  });

  it("rejects invalid dates", () => {
    expect(normalizeCanvasDate("31/02/2026")).toBeNull();
    expect(isIsoDate("2026-02-31")).toBe(false);
  });

  it("validates metadata completeness", () => {
    expect(
      validateCanvasMeta({
        startup: "Startup X",
        evaluator: "Equipe Y",
        date: "2026-02-14"
      }).isValid
    ).toBe(true);

    expect(
      validateCanvasMeta({
        startup: "",
        evaluator: "Equipe Y",
        date: "2026-02-14"
      }).isValid
    ).toBe(false);
  });
});
