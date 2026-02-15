import { useEffect } from "react";
import type { GroupMeta } from "../data/srlBlocks";
import { useDialogA11y } from "../hooks/useDialogA11y";

interface GroupDetailsModalProps {
  group: GroupMeta;
  onClose: () => void;
}

export function GroupDetailsModal({ group, onClose }: GroupDetailsModalProps) {
  const { dialogRef, initialFocusRef } = useDialogA11y<HTMLButtonElement>(true);

  useEffect(() => {
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/55 p-4 md:items-center">
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Detalhamento do agrupamento ${group.name}`}
        className="w-full max-w-2xl rounded-xl bg-card-light shadow-2xl dark:bg-card-dark"
      >
        <div className="flex items-center justify-between border-b border-zinc-200/80 p-4 dark:border-zinc-800/80">
          <h2 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
            Detalhamento do Agrupamento
          </h2>
          <button
            ref={initialFocusRef}
            type="button"
            className="rounded-md p-2 text-text-light-secondary hover:bg-zinc-100 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
            onClick={onClose}
            aria-label="Fechar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-4 p-4 md:p-6">
          <p className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
            {group.detailTitle}
          </p>

          <div className="space-y-3 rounded-lg border border-zinc-200/80 bg-zinc-50 p-4 dark:border-zinc-800/80 dark:bg-zinc-800/60">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-light-secondary dark:text-text-dark-secondary">
                Agrupamento
              </p>
              <p className="mt-1 text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
                {group.detailTitle}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-light-secondary dark:text-text-dark-secondary">
                Foco Conceitual
              </p>
              <p className="mt-1 text-sm text-text-light-primary dark:text-text-dark-primary">
                {group.conceptualFocus}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-light-secondary dark:text-text-dark-secondary">
                Blocos Incluídos
              </p>
              <p className="mt-1 text-sm text-text-light-primary dark:text-text-dark-primary">
                {group.includedBlocks}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-zinc-200/80 p-4 dark:border-zinc-800/80">
          <button
            type="button"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
