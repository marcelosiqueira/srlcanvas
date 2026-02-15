import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "../components/AppHeader";
import { FooterNav } from "../components/FooterNav";
import { RESEARCH_SURVEY_CONFIG } from "../config/researchSurveyConfig";
import { formatToday, useCanvasStore } from "../store/useCanvasStore";
import { validateCanvasMeta } from "../utils/canvasMeta";

export function NewCanvasPage() {
  const navigate = useNavigate();
  const { resetCanvas, setMeta, setRemoteCanvasId } = useCanvasStore();
  const [startup, setStartup] = useState("");
  const [evaluator, setEvaluator] = useState("");
  const [date, setDate] = useState(formatToday());
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const metaValidation = validateCanvasMeta({ startup, evaluator, date });

  const createCanvas = () => {
    setAttemptedSubmit(true);
    if (!metaValidation.isValid) return;

    resetCanvas();
    setRemoteCanvasId(null);
    setMeta({
      startup: startup.trim(),
      evaluator: evaluator.trim(),
      date
    });
    navigate(RESEARCH_SURVEY_CONFIG.enabled ? "/survey/consent?next=/canvas" : "/canvas");
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light font-display dark:bg-background-dark">
      <AppHeader title="Novo SRL Canvas" />

      <main className="flex-grow space-y-4 px-4 pb-28 pt-6">
        <section className="rounded-xl border border-zinc-200/80 bg-card-light p-4 dark:border-zinc-800/80 dark:bg-card-dark">
          <p className="mb-4 text-sm text-text-light-secondary dark:text-text-dark-secondary">
            Crie um novo SRL Canvas para iniciar uma avaliacao do zero.
          </p>

          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
                Startup
              </span>
              <input
                className="mt-1 block w-full rounded-md border-zinc-300 bg-zinc-50 p-2 text-sm text-text-light-primary shadow-sm focus:border-primary focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-text-dark-primary"
                value={startup}
                onChange={(event) => setStartup(event.target.value)}
                aria-invalid={attemptedSubmit && !metaValidation.startupValid}
                type="text"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
                Avaliador
              </span>
              <input
                className="mt-1 block w-full rounded-md border-zinc-300 bg-zinc-50 p-2 text-sm text-text-light-primary shadow-sm focus:border-primary focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-text-dark-primary"
                value={evaluator}
                onChange={(event) => setEvaluator(event.target.value)}
                aria-invalid={attemptedSubmit && !metaValidation.evaluatorValid}
                type="text"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
                Data
              </span>
              <input
                className="mt-1 block w-full rounded-md border-zinc-300 bg-zinc-50 p-2 text-sm text-text-light-primary shadow-sm focus:border-primary focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-text-dark-primary"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                aria-invalid={attemptedSubmit && !metaValidation.dateValid}
                type="date"
              />
            </label>
          </div>

          {attemptedSubmit && !metaValidation.isValid && (
            <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
              Preencha Startup, Avaliador e Data valida antes de criar o canvas.
            </p>
          )}

          <button
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
            onClick={createCanvas}
            type="button"
          >
            Criar Canvas
          </button>
        </section>
      </main>

      <FooterNav />
    </div>
  );
}
