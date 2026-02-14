import { useEffect, useMemo, useState } from "react";
import type { CanvasBlockDefinition, CanvasBlockState } from "../types";

interface BlockEditModalProps {
  block: CanvasBlockDefinition;
  value: CanvasBlockState;
  onClose: () => void;
  onSave: (value: CanvasBlockState) => void;
}

export function BlockEditModal({ block, value, onClose, onSave }: BlockEditModalProps) {
  const [notes, setNotes] = useState(value.notes);
  const [evidence, setEvidence] = useState(value.evidence);
  const [score, setScore] = useState<number>(value.score ?? 1);

  useEffect(() => {
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  const selectedLevel = useMemo(
    () => block.levels.find((item) => item.level === score),
    [block.levels, score]
  );

  const save = () => {
    onSave({
      score,
      notes: notes.trim(),
      evidence: evidence.trim()
    });
  };

  const missingEvidenceForAdvancedScore = score > 3 && evidence.trim().length === 0;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/55 p-4 md:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Editar bloco ${block.name}`}
    >
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-card-light shadow-2xl dark:bg-card-dark">
        <div className="flex items-center justify-between border-b border-zinc-200/80 p-4 dark:border-zinc-800/80">
          <h2 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
            {block.id}. {block.name}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110"
              onClick={save}
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">
                save
              </span>
              Salvar
            </button>
            <button
              type="button"
              className="rounded-md p-2 text-text-light-secondary hover:bg-zinc-100 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
              onClick={onClose}
              aria-label="Fechar"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <div className="space-y-5 p-4 md:p-6">
          <section>
            <p className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
              Objetivo
            </p>
            <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              {block.objective}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              {block.questions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
                Nivel de maturidade
              </span>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:bg-primary/20">
                Nivel {score}/9
              </span>
            </div>

            <input
              type="range"
              min={1}
              max={9}
              step={1}
              value={score}
              onChange={(event) => setScore(Number(event.target.value))}
              className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-200 dark:bg-zinc-700"
            />

            <div className="mt-3 grid grid-cols-9 gap-1">
              {Array.from({ length: 9 }, (_, index) => index + 1).map((valueOption) => (
                <button
                  key={valueOption}
                  type="button"
                  className={`rounded-md border px-2 py-1 text-xs font-semibold transition ${
                    score === valueOption
                      ? "border-primary bg-primary text-white"
                      : "border-zinc-300 text-text-light-secondary hover:border-primary dark:border-zinc-700 dark:text-text-dark-secondary"
                  }`}
                  onClick={() => setScore(valueOption)}
                >
                  {valueOption}
                </button>
              ))}
            </div>

            {selectedLevel && (
              <div className="mt-4 rounded-lg border border-primary/25 bg-primary/5 p-4 dark:border-primary/35 dark:bg-primary/10">
                <p className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
                  Descricao do nivel {selectedLevel.level}
                </p>
                <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                  {selectedLevel.description}
                </p>
                <p className="mt-3 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                  <strong>Evidencia sugerida:</strong> {selectedLevel.evidence}
                </p>
              </div>
            )}

            {missingEvidenceForAdvancedScore && (
              <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300">
                Regra pratica do guia: evite notas acima de 3 sem registrar evidencia minima.
              </p>
            )}
          </section>

          {block.exampleTips && block.exampleTips.length > 0 && (
            <section className="rounded-lg border border-zinc-200/80 bg-zinc-50 p-4 dark:border-zinc-800/80 dark:bg-zinc-800/60">
              <p className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
                Dicas de Exemplos:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                {block.exampleTips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </section>
          )}

          <label className="block">
            <span className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
              Evidencias
            </span>
            <textarea
              value={evidence}
              onChange={(event) => setEvidence(event.target.value)}
              rows={4}
              placeholder="Inclua links, metricas, entrevistas ou documentos que sustentem a nota."
              className="mt-2 w-full rounded-lg border-zinc-300 bg-zinc-50 p-3 text-sm text-text-light-primary focus:border-primary focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-text-dark-primary"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
              Notas do bloco
            </span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              placeholder="Descreva a situacao atual deste bloco..."
              className="mt-2 w-full rounded-lg border-zinc-300 bg-zinc-50 p-3 text-sm text-text-light-primary focus:border-primary focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-text-dark-primary"
            />
          </label>

        </div>

        <div className="flex justify-end gap-3 border-t border-zinc-200/80 p-4 dark:border-zinc-800/80">
          <button
            type="button"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-text-light-secondary hover:bg-zinc-100 dark:border-zinc-700 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
            onClick={save}
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">
              save
            </span>
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
