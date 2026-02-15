import { useEffect } from "react";
import { useDialogA11y } from "../hooks/useDialogA11y";
import { ResearchOpinionPanel } from "./ResearchOpinionPanel";

interface ResearchOpinionModalProps {
  isOpen: boolean;
  nextPath: string;
  onClose: () => void;
}

export function ResearchOpinionModal({ isOpen, nextPath, onClose }: ResearchOpinionModalProps) {
  const { dialogRef, initialFocusRef } = useDialogA11y<HTMLButtonElement>(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Formulario de opiniao"
        className="w-full max-w-3xl rounded-2xl border border-zinc-200/80 bg-background-light p-4 shadow-2xl dark:border-zinc-800/80 dark:bg-background-dark"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-light-primary dark:text-text-dark-primary">
            Formulario de opiniao
          </h2>
          <button
            ref={initialFocusRef}
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-text-light-secondary hover:bg-zinc-100 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
            aria-label="Fechar"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <ResearchOpinionPanel
          as="div"
          nextPath={nextPath}
          onNavigate={onClose}
          className="rounded-xl border border-zinc-200/80 bg-card-light p-4 dark:border-zinc-800/80 dark:bg-card-dark"
        />
      </div>
    </div>
  );
}
