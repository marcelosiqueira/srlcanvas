import { expect, test } from "@playwright/test";

test("can evaluate one block and open results modal", async ({ page }) => {
  await page.goto("/");

  const openAppLink = page.getByRole("link", { name: "Abrir app" });
  if (await openAppLink.isVisible()) {
    await openAppLink.click();
  }

  await expect(page.getByLabel("Startup")).toBeVisible();
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
