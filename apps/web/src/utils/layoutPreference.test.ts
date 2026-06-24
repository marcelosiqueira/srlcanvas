import { afterEach, describe, expect, it } from "vitest";
import {
  LAYOUT_STORAGE_KEY,
  readLayoutPreference,
  writeLayoutPreference
} from "./layoutPreference";

afterEach(() => {
  window.localStorage.clear();
});

describe("layoutPreference", () => {
  it("retorna 'lista' por padrão", () => {
    expect(readLayoutPreference()).toBe("lista");
  });

  it("persiste e lê 'mural'", () => {
    writeLayoutPreference("mural");
    expect(window.localStorage.getItem(LAYOUT_STORAGE_KEY)).toBe("mural");
    expect(readLayoutPreference()).toBe("mural");
  });

  it("ignora valor inválido e cai no default", () => {
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, "xpto");
    expect(readLayoutPreference()).toBe("lista");
  });
});
