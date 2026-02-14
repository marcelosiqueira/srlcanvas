import { useEffect } from "react";
import { ABOUT_SRL_CANVAS } from "../data/aboutSrlCanvas";

interface AboutSrlCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutSrlCanvasModal({ isOpen, onClose }: AboutSrlCanvasModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/55 p-4 md:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Sobre o SRL Canvas"
    >
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-card-light shadow-2xl dark:bg-card-dark">
        <div className="flex items-center justify-between border-b border-zinc-200/80 p-4 dark:border-zinc-800/80">
          <h2 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
            Sobre o SRL Canvas
          </h2>
          <button
            type="button"
            className="rounded-md p-2 text-text-light-secondary hover:bg-zinc-100 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
            onClick={onClose}
            aria-label="Fechar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-4 p-4 md:p-6">
          <h3 className="text-base font-semibold text-text-light-primary dark:text-text-dark-primary">
            {ABOUT_SRL_CANVAS.title}
          </h3>

          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            {ABOUT_SRL_CANVAS.terminologyNote}
          </p>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            {ABOUT_SRL_CANVAS.contextAndGap}
          </p>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            {ABOUT_SRL_CANVAS.purpose}
          </p>

          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
              {ABOUT_SRL_CANVAS.whoShouldUseTitle}
            </h4>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              {ABOUT_SRL_CANVAS.whoShouldUseIntro}
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              {ABOUT_SRL_CANVAS.whoShouldUse.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
              {ABOUT_SRL_CANVAS.propositionTitle}
            </h4>
            <ul className="list-disc space-y-1 pl-5 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              {ABOUT_SRL_CANVAS.propositionItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              {ABOUT_SRL_CANVAS.propositionSummary}
            </p>
          </section>

          <section className="space-y-2 rounded-lg border border-zinc-200/80 bg-zinc-50 p-3 dark:border-zinc-800/80 dark:bg-zinc-800/60">
            <h4 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
              {ABOUT_SRL_CANVAS.notTitle}
            </h4>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              {ABOUT_SRL_CANVAS.notDescription}
            </p>
          </section>
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
