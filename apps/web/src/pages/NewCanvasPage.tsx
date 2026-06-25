import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { AppShell } from "../components/AppShell";
import { RESEARCH_SURVEY_CONFIG } from "../config/researchSurveyConfig";
import { saveCanvas } from "../services/canvasApi";
import { formatToday, useCanvasStore } from "../store/useCanvasStore";
import { validateCanvasMeta } from "../utils/canvasMeta";

export function NewCanvasPage() {
  const navigate = useNavigate();
  const { user, isEnabled } = useAuth();
  const { resetCanvas, setMeta, setRemoteCanvasId } = useCanvasStore();
  const [startup, setStartup] = useState("");
  const [evaluator, setEvaluator] = useState("");
  const [date, setDate] = useState(formatToday());
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const metaValidation = validateCanvasMeta({ startup, evaluator, date });

  const createCanvas = async () => {
    setAttemptedSubmit(true);
    if (!metaValidation.isValid || isCreating) return;

    resetCanvas();
    setRemoteCanvasId(null);
    setMeta({
      startup: startup.trim(),
      evaluator: evaluator.trim(),
      date
    });

    // Criação explícita do registro remoto — só aqui (botão "Novo SRL Canvas").
    // O auto-save do canvas apenas ATUALIZA; nunca cria.
    if (isEnabled && user) {
      setIsCreating(true);
      try {
        const state = useCanvasStore.getState();
        const saved = await saveCanvas({
          userId: user.id,
          meta: state.meta,
          blocks: state.blocks
        });
        setRemoteCanvasId(saved.id);
      } catch {
        /* sem conexão/erro: segue em modo local, sem registro remoto */
      } finally {
        setIsCreating(false);
      }
    }

    navigate(RESEARCH_SURVEY_CONFIG.enabled ? "/survey/consent?next=/canvas" : "/canvas");
  };

  const inputClass =
    "mt-1 block w-full rounded-[10px] border border-stroke bg-inset px-3 py-2.5 text-[14px] text-ink outline-none transition focus:border-brand";

  return (
    <AppShell title="Novo SRL Canvas" size="narrow">
      <section className="rounded-card border border-stroke bg-surface p-5 shadow-sm">
        <h2 className="font-display text-[14.5px] font-bold text-ink">Novo SRL Canvas</h2>
        <p className="mt-1 text-sm text-ink-2">
          Crie um novo SRL Canvas para iniciar uma avaliação do zero.
        </p>

        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="text-[12px] font-semibold text-ink-2">Startup</span>
            <input
              className={inputClass}
              value={startup}
              onChange={(event) => setStartup(event.target.value)}
              aria-invalid={attemptedSubmit && !metaValidation.startupValid}
              type="text"
              placeholder="Nome da Startup"
            />
          </label>

          <label className="block">
            <span className="text-[12px] font-semibold text-ink-2">Avaliador</span>
            <input
              className={inputClass}
              value={evaluator}
              onChange={(event) => setEvaluator(event.target.value)}
              aria-invalid={attemptedSubmit && !metaValidation.evaluatorValid}
              type="text"
              placeholder="Nome do Avaliador"
            />
          </label>

          <label className="block">
            <span className="text-[12px] font-semibold text-ink-2">Data</span>
            <input
              className={inputClass}
              value={date}
              onChange={(event) => setDate(event.target.value)}
              aria-invalid={attemptedSubmit && !metaValidation.dateValid}
              type="date"
            />
          </label>
        </div>

        {attemptedSubmit && !metaValidation.isValid && (
          <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
            Preencha Startup, Avaliador e Data válida antes de criar o canvas.
          </p>
        )}

        <button
          className="mt-5 rounded-[10px] bg-brand px-4 py-2.5 text-[14px] font-semibold text-brand-fg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          onClick={createCanvas}
          disabled={isCreating}
          type="button"
        >
          {isCreating ? "Criando..." : "Criar Canvas"}
        </button>
      </section>
    </AppShell>
  );
}
