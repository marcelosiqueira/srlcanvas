import { useEffect, useMemo, useState } from "react";
import { GROUP_BY_KEY } from "../data/srlBlocks";
import { useDialogA11y } from "../hooks/useDialogA11y";
import type { CanvasBlockDefinition, CanvasBlockState } from "../types";
import { withAlpha } from "../utils/color";

interface BlockEditModalProps {
  block: CanvasBlockDefinition;
  value: CanvasBlockState;
  onClose: () => void;
  onSave: (value: CanvasBlockState) => void;
}

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function BlockEditModal({ block, value, onClose, onSave }: BlockEditModalProps) {
  const group = GROUP_BY_KEY[block.group];
  const [score, setScore] = useState<number | null>(value.score);
  const [evidence, setEvidence] = useState(value.evidence);
  const { dialogRef, initialFocusRef } = useDialogA11y<HTMLButtonElement>(true);

  useEffect(() => {
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  const selectedDescription = useMemo(
    () => (score ? block.levels[score - 1]?.description : null),
    [block.levels, score]
  );
  const nextDescription = score && score < 9 ? block.levels[score]?.description : null;

  const applyLevel = (level: number) => {
    setScore(level);
    // aplica imediatamente, preservando notes/evidence atuais
    onSave({ score: level, notes: value.notes, evidence });
  };

  const save = () => {
    onSave({ score, notes: value.notes, evidence: evidence.trim() });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center overflow-y-auto px-4 py-[5vh]"
      style={{ background: "rgba(8,12,22,.5)", backdropFilter: "blur(3px)" }}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Avaliar ${block.name}`}
        className="animate-pop h-fit w-full max-w-[620px] overflow-hidden rounded-modal bg-surface shadow-lg"
      >
        <header
          className="flex items-start justify-between gap-3 px-5 py-4"
          style={{ backgroundColor: group.color, borderRadius: "18px 18px 0 0" }}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex size-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: "rgba(255,255,255,.18)" }}
            >
              <span className="material-symbols-outlined text-white">{block.icon}</span>
            </span>
            <div>
              <p className="font-display text-[17px] font-extrabold text-white">
                P{block.number} · {block.name}
              </p>
              <p className="text-[11.5px] text-white/80">{group.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex size-9 items-center justify-center rounded-lg text-white/90 hover:bg-white/15"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="max-h-[64vh] overflow-y-auto px-5 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">Objetivo</p>
          <p className="mt-1 text-[13.5px] text-ink">{block.objective}</p>

          <ul className="mt-4 space-y-2">
            {block.questions.map((question) => (
              <li key={question} className="flex gap-2 text-[13px] text-ink-2">
                <span className="material-symbols-outlined text-base text-ink-3">help</span>
                {question}
              </li>
            ))}
          </ul>

          <div className="mt-5 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-ink">Nível de maturidade</p>
            <span
              className="rounded-full px-3 py-1 text-[12px] font-semibold text-white"
              style={{ backgroundColor: group.color }}
            >
              Nível {score ?? 0}/9
            </span>
          </div>

          <div className="mt-3 grid grid-cols-9 gap-2">
            {LEVELS.map((level) => {
              const isSelected = score === level;
              const isAchieved = score !== null && level <= score;
              const buttonStyle = isSelected
                ? { backgroundColor: group.color, color: "#ffffff" }
                : isAchieved
                  ? { backgroundColor: withAlpha(group.color, 0.12), color: group.color }
                  : undefined;

              return (
                <button
                  key={level}
                  ref={level === 1 ? initialFocusRef : undefined}
                  type="button"
                  aria-label={`Selecionar nível ${level}`}
                  aria-pressed={isSelected}
                  onClick={() => applyLevel(level)}
                  className={`flex h-10 items-center justify-center rounded-lg font-display text-[14px] font-bold ${
                    buttonStyle ? "" : "border border-stroke bg-inset text-ink-2"
                  }`}
                  style={buttonStyle}
                >
                  {level}
                </button>
              );
            })}
          </div>

          {selectedDescription && (
            <div
              className="mt-4 rounded-xl p-3 text-[13px] text-ink"
              style={{
                backgroundColor: withAlpha(group.color, 0.09),
                border: `1px solid ${withAlpha(group.color, 0.18)}`
              }}
            >
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-3">
                Descrição do nível {score}
              </p>
              {selectedDescription}
            </div>
          )}

          {nextDescription && (
            <div className="mt-3 rounded-xl border border-dashed border-stroke p-3 text-[13px] text-ink-2">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-3">
                Para avançar ao nível {(score ?? 0) + 1}
              </p>
              {nextDescription}
            </div>
          )}

          <label className="mt-5 block">
            <span className="block text-[12px] font-semibold text-ink-2">Evidências</span>
            <textarea
              className="mt-1 min-h-[90px] w-full rounded-lg border border-stroke bg-inset p-3 text-[13px] text-ink"
              value={evidence}
              onChange={(event) => setEvidence(event.target.value)}
              placeholder="Links, documentos, métricas que comprovam o nível."
            />
          </label>
        </div>

        <footer className="flex justify-end gap-2 border-t border-stroke px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stroke px-4 py-2 text-[13px] font-semibold text-ink-2"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={save}
            className="flex items-center gap-1 rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-brand-fg"
          >
            <span className="material-symbols-outlined text-base">check</span>
            Salvar
          </button>
        </footer>
      </div>
    </div>
  );
}
