import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AuthProvider } from "../auth/AuthProvider";
import { ResearchSurveyPage } from "./ResearchSurveyPage";

describe("ResearchSurveyPage", () => {
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
});
