import { expect, test, type Page } from "@playwright/test";

const hasRemoteAuthEnv = Boolean(
  process.env.VITE_SUPABASE_URL &&
  process.env.VITE_SUPABASE_ANON_KEY &&
  process.env.E2E_REMOTE_EMAIL &&
  process.env.E2E_REMOTE_PASSWORD
);

async function openCanvas(page: Page): Promise<void> {
  await page.goto("/");

  const openAppLink = page.getByRole("link", { name: "Abrir app" });
  if (await openAppLink.isVisible()) {
    await openAppLink.click();
  }

  await expect(page.getByLabel("Startup")).toBeVisible();
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

test("shows guided first-evaluation onboarding", async ({ page }) => {
  await openCanvas(page);

  await expect(page.getByText("Primeira avaliacao guiada")).toBeVisible();
  await expect(page.getByText(/Passo 1 de 3/i)).toBeVisible();

  await page.getByLabel("Startup").fill("Startup Onboarding");
  await page.getByLabel("Avaliador").fill("Equipe Produto");
  await expect(page.getByText(/Passo 2 de 3/i)).toBeVisible();

  await page.getByRole("button", { name: "Abrir bloco 1" }).click();
  await page.locator('input[type="range"]').fill("4");
  await page.getByLabel("Evidencias").fill("Entrevistas com clientes");
  await page.getByLabel("Notas do bloco").fill("Guia validado");
  await page.getByRole("button", { name: "Salvar" }).first().click();
  await expect(page.getByText(/Passo 3 de 3/i)).toBeVisible();

  await page.getByRole("button", { name: "Abrir resultados" }).click();
  await expect(page.getByRole("heading", { name: "Diagnostico SRL Canvas" })).toBeVisible();
  await page.getByLabel("Fechar").first().click();
  await expect(page.getByText("Primeira avaliacao guiada")).toBeHidden();
});

test("can evaluate one block and open results modal", async ({ page }) => {
  await openCanvas(page);

  await page.getByLabel("Startup").fill("Startup Demo");
  await page.getByLabel("Avaliador").fill("Equipe QA");

  await page.getByRole("button", { name: /1\. Problema \/ Oportunidade/ }).click();
  await page.getByLabel("Notas do bloco").fill("Validacao inicial com entrevistas");
  await page.locator('input[type="range"]').fill("4");
  await page.getByLabel("Evidencias").fill("Link para entrevistas e relatorio");
  await page.getByRole("button", { name: "Salvar" }).first().click();

  await expect(page.getByText("Nota: 4/9")).toBeVisible();

  await page.getByRole("button", { name: "Ver Resultados" }).click();
  await expect(page.getByRole("heading", { name: "Diagnostico SRL Canvas" })).toBeVisible();
  await expect(page.getByText("4 / 108", { exact: true })).toBeVisible();
});

test("persists canvas progress after reload", async ({ page }) => {
  await openCanvas(page);

  await page.getByLabel("Startup").fill("Startup Persist");
  await page.getByLabel("Avaliador").fill("Equipe Persist");
  await page.getByRole("button", { name: /1\. Problema \/ Oportunidade/ }).click();
  await page.locator('input[type="range"]').fill("6");
  await page.getByLabel("Evidencias").fill("Persistencia local validada");
  await page.getByLabel("Notas do bloco").fill("Primeiro bloco salvo");
  await page.getByRole("button", { name: "Salvar" }).first().click();
  await expect(page.getByText("Nota: 6/9")).toBeVisible();

  await page.reload();

  await expect(page.getByLabel("Startup")).toHaveValue("Startup Persist");
  await expect(page.getByLabel("Avaliador")).toHaveValue("Equipe Persist");
  await expect(page.getByText("Nota: 6/9")).toBeVisible();
});

test("exports results in PNG and PDF", async ({ page }) => {
  await openCanvas(page);

  await page.getByLabel("Startup").fill("Startup Export");
  await page.getByLabel("Avaliador").fill("Equipe Export");
  await page.getByRole("button", { name: /1\. Problema \/ Oportunidade/ }).click();
  await page.locator('input[type="range"]').fill("5");
  await page.getByLabel("Evidencias").fill("Evidencia para exportacao");
  await page.getByLabel("Notas do bloco").fill("Teste de exportacao");
  await page.getByRole("button", { name: "Salvar" }).first().click();

  await page.getByRole("button", { name: "Ver Resultados" }).click();
  await expect(page.getByRole("heading", { name: "Diagnostico SRL Canvas" })).toBeVisible();

  const pngDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar PNG" }).click();
  const pngDownload = await pngDownloadPromise;
  expect(pngDownload.suggestedFilename()).toContain(".png");

  const pdfDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar PDF" }).click();
  const pdfDownload = await pdfDownloadPromise;
  expect(pdfDownload.suggestedFilename()).toContain(".pdf");
});

test("traps focus inside block modal and restores trigger focus", async ({ page }) => {
  await openCanvas(page);

  const trigger = page.getByRole("button", { name: /1\. Problema \/ Oportunidade/ });
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: /Editar bloco Problema \/ Oportunidade/ });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Fechar" })).toBeFocused();

  for (let index = 0; index < 12; index += 1) {
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
  await page.getByRole("group", { name: /1\.2/ }).getByText("Nao").click();
  await page.getByRole("group", { name: /1\.3/ }).getByText("Sim").click();
  await expect(
    page.getByText(/nao se enquadra no perfil de elegibilidade completa/i)
  ).toBeVisible();
  await page.getByRole("button", { name: "Enviar triagem" }).click();

  await expect(page.getByText("Obrigado pela sua contribuicao")).toBeVisible();
  await expect(page.getByText(/Protocolo:/)).toBeVisible();
});

test("navigates survey by steps with progress", async ({ page }) => {
  await seedConsent(page);
  await page.goto("/survey?next=/canvas");

  await expect(page.getByText("Etapa 1 de 7")).toBeVisible();

  const ageGroup = page.getByRole("group", { name: "1.1 Voce possui 18 anos ou mais?" });
  await ageGroup.getByText("Sim").click();

  const ecosystemGroup = page.getByRole("group", {
    name: "1.2 Voce atua ou atuou no ecossistema de inovacao/startups nos ultimos 12 meses?"
  });
  await ecosystemGroup.getByText("Sim").click();

  const materialGroup = page.getByRole("group", {
    name: "1.3 Antes de responder, voce visualizou o SRL Canvas e o guia breve de aplicacao?"
  });
  await materialGroup.getByText("Sim").click();

  await page.getByRole("button", { name: "Proxima etapa" }).click();

  await expect(page.getByText("Etapa 2 de 7")).toBeVisible();
  await expect(page.getByText("3. Perfil do respondente")).toBeVisible();
});

test("uses advanced mode quick actions and shortcuts", async ({ page }) => {
  await openCanvas(page);

  await page.getByRole("button", { name: /Modo avancado inativo/i }).click();
  await expect(page.getByRole("button", { name: /Modo avancado ativo/i })).toBeVisible();

  await page.getByRole("button", { name: "Proximo pendente" }).click();
  await expect(
    page.getByRole("dialog", { name: /Editar bloco Problema \/ Oportunidade/ })
  ).toBeVisible();

  await page.keyboard.press("5");
  await page.keyboard.press("Control+Enter");

  await expect(page.getByText("Nota: 5/9")).toBeVisible();

  await page.getByRole("button", { name: "Pendentes" }).click();
  await expect(page.getByRole("button", { name: /1\. Problema \/ Oportunidade/ })).toBeHidden();
});

test("syncs canvas remotely for authenticated user when Supabase is configured", async ({
  page
}) => {
  test.skip(!hasRemoteAuthEnv, "requires Supabase URL/key and remote test account credentials");

  await page.goto("/auth/login");

  await page.getByLabel("Email").fill(process.env.E2E_REMOTE_EMAIL!);
  await page.getByLabel("Senha").fill(process.env.E2E_REMOTE_PASSWORD!);
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await page.getByRole("link", { name: "Abrir Meu SRL Canvas" }).click();
  await expect(page).toHaveURL(/\/canvas/);

  await page.getByLabel("Startup").fill(`Remote Persist ${Date.now()}`);
  await page.getByLabel("Avaliador").fill("Equipe E2E");
  await page.getByRole("button", { name: /1\. Problema \/ Oportunidade/ }).click();
  await page.locator('input[type="range"]').fill("6");
  await page.getByLabel("Evidencias").fill("E2E remote evidence");
  await page.getByLabel("Notas do bloco").fill("E2E remote persistence");
  await page.getByRole("button", { name: "Salvar" }).first().click();

  await expect(page.getByText("Sincronizado com banco.")).toBeVisible({ timeout: 15_000 });

  await page.reload();
  await expect(page.getByText("Nota: 6/9")).toBeVisible();
});
