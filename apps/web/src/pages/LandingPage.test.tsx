import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { AuthProvider } from "../auth/AuthProvider";
import { LandingPage } from "./LandingPage";

afterEach(() => cleanup());

const renderLanding = () =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <LandingPage />
      </AuthProvider>
    </MemoryRouter>
  );

describe("LandingPage", () => {
  it("renderiza o hero e, em modo local, o atalho Abrir app", async () => {
    renderLanding();
    expect(
      await screen.findByRole("heading", { level: 1, name: /pronta para crescer/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abrir app" })).toHaveAttribute("href", "/canvas");
  });

  it("troca o cenário fictício do radar", async () => {
    const user = userEvent.setup();
    renderLanding();
    const market = await screen.findByRole("button", { name: /Tecnologia sem tração/ });
    await user.click(market);
    expect(market).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("heading", { name: /Demanda ainda pouco demonstrada/ })
    ).toBeInTheDocument();
  });

  it("mostra a pergunta da dimensão selecionada com o nome canônico do bloco", async () => {
    const user = userEvent.setup();
    renderLanding();
    await user.click(await screen.findByRole("button", { name: /P12\s*Governança e Compliance/ }));
    expect(
      screen.getByRole("heading", { level: 4, name: "Governança e Compliance" })
    ).toBeVisible();
    expect(screen.getByText(/estrutura jurídica e proteção/)).toBeInTheDocument();
  });

  it("exibe o vídeo de apresentação com legendas pt-BR, sem autoplay e com transcrição", async () => {
    const { container } = renderLanding();
    await screen.findByRole("heading", { level: 2, name: /uma direção melhor/i });
    const video = container.querySelector("video");
    expect(video).not.toBeNull();
    expect(video).toHaveAttribute("controls");
    expect(video).not.toHaveAttribute("autoplay");
    expect(video?.querySelector("source")).toHaveAttribute(
      "src",
      "/video/srl-canvas-apresentacao.mp4"
    );
    expect(video?.querySelector("track")).toHaveAttribute("srclang", "pt-BR");
    expect(screen.getByText("Ler a transcrição")).toBeInTheDocument();
    expect(screen.getByText(/Prefere aplicar no papel\?/)).toBeInTheDocument();
  });

  it("oferece o material de apoio para uso offline", async () => {
    renderLanding();
    expect(await screen.findByRole("link", { name: /Modelo do SRL Canvas/ })).toHaveAttribute(
      "href",
      "/downloads/srl-canvas-modelo-manual.pdf"
    );
  });
});
