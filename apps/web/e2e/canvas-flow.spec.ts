import { expect, test, type Page } from "@playwright/test";

const hasRemoteAuthEnv = Boolean(
  process.env.VITE_API_URL && process.env.E2E_REMOTE_EMAIL && process.env.E2E_REMOTE_PASSWORD
);

async function openCanvas(page: Page): Promise<void> {
  await page.goto("/");

  const openAppLink = page.getByRole("link", { name: "Abrir app" });
  if (await openAppLink.isVisible()) {
    await openAppLink.click();
  }

  await expect(page.getByLabel("Startup")).toBeVisible();
}

const blockOneTrigger = (page: Page) =>
  page.getByRole("button", { name: /1\. Problema \/ Oportunidade/ });

const blockDialog = (page: Page) =>
  page.getByRole("dialog", { name: /Avaliar Problema \/ Oportunidade/ });

/**
 * Avalia o bloco 1 pelo novo modal (grid de 9 níveis, sem slider/notas) e fecha em Salvar.
 */
async function evaluateFirstBlock(page: Page, level: number): Promise<void> {
  await blockOneTrigger(page).click();

  const dialog = blockDialog(page);
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: `Selecionar nível ${level}` }).click();
  await dialog.getByLabel("Evidências").fill("Evidência E2E");
  await dialog.getByRole("button", { name: /Salvar/ }).click();

  await expect(dialog).toBeHidden();
}

async function seedConsent(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "srl-research-consent-v1",
      JSON.stringify({
        consentVersion: "tcle_v1_2025-11-28",
        acceptedAt: new Date().toISOString(),
        revokedAt: null
      })
    );
  });
}

test("can evaluate one block and open the results screen", async ({ page }) => {
  await openCanvas(page);

  await page.getByLabel("Startup").fill("Startup Demo");
  await page.getByLabel("Avaliador").fill("Equipe QA");

  await evaluateFirstBlock(page, 4);
  await expect(page.getByText("Nível 4")).toBeVisible();

  await page.getByRole("button", { name: /Ver Resultados/ }).click();
  await expect(page).toHaveURL(/\/results/);
  await expect(page.getByRole("heading", { name: "Resultados" })).toBeVisible();
  await expect(page.getByText("4 / 108")).toBeVisible();
});

test("persists canvas progress after reload", async ({ page }) => {
  await openCanvas(page);

  await page.getByLabel("Startup").fill("Startup Persist");
  await page.getByLabel("Avaliador").fill("Equipe Persist");

  await evaluateFirstBlock(page, 6);
  await expect(page.getByText("Nível 6")).toBeVisible();

  await page.reload();

  await expect(page.getByLabel("Startup")).toHaveValue("Startup Persist");
  await expect(page.getByLabel("Avaliador")).toHaveValue("Equipe Persist");
  await expect(page.getByText("Nível 6")).toBeVisible();
});

test("exports results in PNG and PDF from the results screen", async ({ page }) => {
  await openCanvas(page);

  await page.getByLabel("Startup").fill("Startup Export");
  await page.getByLabel("Avaliador").fill("Equipe Export");

  await evaluateFirstBlock(page, 5);

  await page.getByRole("button", { name: /Ver Resultados/ }).click();
  await expect(page).toHaveURL(/\/results/);
  await expect(page.getByRole("heading", { name: "Resultados" })).toBeVisible();

  const pngDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Exportar PNG/ }).click();
  const pngDownload = await pngDownloadPromise;
  expect(pngDownload.suggestedFilename()).toContain(".png");

  const pdfDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Exportar PDF/ }).click();
  const pdfDownload = await pdfDownloadPromise;
  expect(pdfDownload.suggestedFilename()).toContain(".pdf");
});

test("traps focus inside block modal and restores trigger focus", async ({ page }) => {
  await openCanvas(page);

  const trigger = blockOneTrigger(page);
  await trigger.click();

  const dialog = blockDialog(page);
  await expect(dialog).toBeVisible();
  // O foco inicial vai para o primeiro botão de nível.
  await expect(dialog.getByRole("button", { name: "Selecionar nível 1" })).toBeFocused();

  for (let index = 0; index < 14; index += 1) {
    await page.keyboard.press("Tab");
  }

  const isFocusInsideDialog = await dialog.evaluate((node) =>
    node.contains(document.activeElement)
  );
  expect(isFocusInsideDialog).toBeTruthy();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("submits academic survey with TCLE consent (triage completion path)", async ({ page }) => {
  await seedConsent(page);
  await page.goto("/survey?next=/canvas");

  await expect(page.getByText("Etapa 1 de 7")).toBeVisible();
  await page.getByRole("group", { name: /1\.1/ }).getByText("Sim").click();
  await page.getByRole("group", { name: /1\.2/ }).getByText("Não").click();
  await page.getByRole("group", { name: /1\.3/ }).getByText("Sim").click();
  await expect(
    page.getByText(/não se enquadra no perfil de elegibilidade completa/i)
  ).toBeVisible();
  await page.getByRole("button", { name: "Enviar triagem" }).click();

  await expect(page.getByText("Obrigado pela sua contribuição")).toBeVisible();
  await expect(page.getByText(/Protocolo:/)).toBeVisible();
});

test("navigates survey by steps with progress", async ({ page }) => {
  await seedConsent(page);
  await page.goto("/survey?next=/canvas");

  await expect(page.getByText("Etapa 1 de 7")).toBeVisible();

  const ageGroup = page.getByRole("group", { name: "1.1 Você possui 18 anos ou mais?" });
  await ageGroup.getByText("Sim").click();

  const ecosystemGroup = page.getByRole("group", {
    name: "1.2 Você atua ou atuou no ecossistema de inovação/startups nos últimos 12 meses?"
  });
  await ecosystemGroup.getByText("Sim").click();

  const materialGroup = page.getByRole("group", {
    name: "1.3 Antes de responder, você visualizou o SRL Canvas e o guia breve de aplicação?"
  });
  await materialGroup.getByText("Sim").click();

  await page.getByRole("button", { name: "Próxima etapa" }).click();

  await expect(page.getByText("Etapa 2 de 7")).toBeVisible();
  await expect(page.getByText("3. Perfil do respondente")).toBeVisible();
});

test("syncs canvas remotely for authenticated user when the API is configured", async ({
  page
}) => {
  test.skip(!hasRemoteAuthEnv, "requires VITE_API_URL and remote test account credentials");

  await page.goto("/auth/login");

  await page.getByLabel("Email").fill(process.env.E2E_REMOTE_EMAIL!);
  await page.getByLabel("Senha").fill(process.env.E2E_REMOTE_PASSWORD!);
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await page.getByRole("link", { name: "Abrir Meu SRL Canvas" }).click();
  await expect(page).toHaveURL(/\/canvas/);

  await page.getByLabel("Startup").fill(`Remote Persist ${Date.now()}`);
  await page.getByLabel("Avaliador").fill("Equipe E2E");

  await evaluateFirstBlock(page, 6);
  await expect(page.getByText("Nível 6")).toBeVisible();

  // A gravação remota é silenciosa (sem UI de status); valida-se a persistência via reload.
  await page.reload();
  await expect(page.getByText("Nível 6")).toBeVisible();
});
