import { describe, expect, it } from "vitest";
import { withAlpha } from "./color";

describe("withAlpha", () => {
  it("converte hex de 6 dígitos em rgba", () => {
    expect(withAlpha("#1E5BC6", 0.12)).toBe("rgba(30, 91, 198, 0.12)");
  });

  it("aceita hex sem # e clampa alpha", () => {
    expect(withAlpha("2C9B46", 2)).toBe("rgba(44, 155, 70, 1)");
    expect(withAlpha("#EA8520", -1)).toBe("rgba(234, 133, 32, 0)");
  });
});
