import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    // Os testes compartilham um unico database (srlcanvas_test);
    // execucao paralela de arquivos causaria interferencia entre eles.
    fileParallelism: false
  }
});
