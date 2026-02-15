import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { AuthProvider } from "../auth/AuthProvider";
import { ResearchSurveyPage } from "./ResearchSurveyPage";

describe("ResearchSurveyPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("requires TCLE before questionnaire submission", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <ResearchSurveyPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText("Questionario Quantitativo SRL Canvas")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Ler e aceitar TCLE" })).toBeInTheDocument();
  });

  it("shows step progress and advances after valid triage", async () => {
    window.localStorage.setItem(
      "srl-research-consent-v1",
      JSON.stringify({
        consentVersion: "tcle_v1_2025-11-28",
        acceptedAt: new Date().toISOString(),
        revokedAt: null
      })
    );

    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AuthProvider>
          <ResearchSurveyPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText("Etapa 1 de 7")).toBeInTheDocument();

    const ageGroup = screen.getByRole("group", { name: "1.1 Voce possui 18 anos ou mais?" });
    await user.click(within(ageGroup).getByRole("radio", { name: "Sim" }));

    const ecosystemGroup = screen.getByRole("group", {
      name: "1.2 Voce atua ou atuou no ecossistema de inovacao/startups nos ultimos 12 meses?"
    });
    await user.click(within(ecosystemGroup).getByRole("radio", { name: "Sim" }));

    const materialGroup = screen.getByRole("group", {
      name: "1.3 Antes de responder, voce visualizou o SRL Canvas e o guia breve de aplicacao?"
    });
    await user.click(within(materialGroup).getByRole("radio", { name: "Sim" }));

    await user.click(screen.getByRole("button", { name: "Proxima etapa" }));

    expect(await screen.findByText("Etapa 2 de 7")).toBeInTheDocument();
    expect(screen.getByText("3. Perfil do respondente")).toBeInTheDocument();

    await waitFor(() => {
      const raw = window.localStorage.getItem("srl-research-survey-draft-v1:guest");
      expect(raw).not.toBeNull();
      const payload = JSON.parse(raw ?? "{}") as { currentStepKey?: string };
      expect(payload.currentStepKey).toBe("profile");
    });
  });
});
