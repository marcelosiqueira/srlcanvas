import { useEffect } from "react";
import { useDialogA11y } from "../hooks/useDialogA11y";

interface EditCanvasWarningModalProps {
  canvasTitle: string;
  onCancel: () => void;
  onCreateNew: () => void;
  onConfirmEdit: () => void;
}

/**
 * Aviso ao editar uma avaliação anterior: editar altera resultados já
 * registrados e prejudica comparações ao longo do tempo — o recomendado é
 * criar um novo SRL Canvas.
 */
export function EditCanvasWarningModal({
  canvasTitle,
  onCancel,
  onCreateNew,
  onConfirmEdit
}: EditCanvasWarningModalProps) {
  const { dialogRef, initialFocusRef } = useDialogA11y<HTMLButtonElement>(true);

  useEffect(() => {
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center overflow-y-auto px-4 py-[8vh]"
      style={{ background: "rgba(8,12,22,.5)", backdropFilter: "blur(3px)" }}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Editar avaliação anterior"
        className="animate-pop h-fit w-full max-w-[460px] overflow-hidden rounded-modal bg-surface shadow-lg"
      >
        <div className="flex items-center gap-3 px-5 pt-5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            <span className="material-symbols-outlined" aria-hidden="true">
              warning
            </span>
          </span>
          <h2 className="font-display text-[16px] font-bold text-ink">
            Editar uma avaliação anterior?
          </h2>
        </div>

        <div className="px-5 py-4 text-[14px] text-ink-2">
          <p>
            Editar <strong className="text-ink">{canvasTitle}</strong> altera os resultados já
            registrados e pode comprometer a comparação da evolução ao longo do tempo.
          </p>
          <p className="mt-2">
            O recomendado é <strong className="text-ink">criar um novo SRL Canvas</strong> e
            acompanhar a evolução pelo histórico.
          </p>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-stroke px-5 py-4">
          <button
            ref={initialFocusRef}
            type="button"
            onClick={onCancel}
            className="rounded-[10px] border border-stroke px-4 py-2 text-[13px] font-semibold text-ink-2 transition hover:bg-surface-2"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmEdit}
            className="rounded-[10px] border border-amber-300 px-4 py-2 text-[13px] font-semibold text-amber-700 transition hover:bg-amber-50 dark:border-amber-700/50 dark:text-amber-300 dark:hover:bg-amber-900/20"
          >
            Editar mesmo assim
          </button>
          <button
            type="button"
            onClick={onCreateNew}
            className="rounded-[10px] bg-brand px-4 py-2 text-[13px] font-semibold text-brand-fg transition hover:brightness-110"
          >
            Criar novo
          </button>
        </div>
      </div>
    </div>
  );
}
