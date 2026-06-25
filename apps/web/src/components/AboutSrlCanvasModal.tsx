import { useEffect } from "react";
import { ABOUT_SRL_CANVAS } from "../data/aboutSrlCanvas";
import { useDialogA11y } from "../hooks/useDialogA11y";

interface AboutSrlCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutSrlCanvasModal({ isOpen, onClose }: AboutSrlCanvasModalProps) {
  const { dialogRef, initialFocusRef } = useDialogA11y<HTMLButtonElement>(isOpen);

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
      className="fixed inset-0 z-40 flex items-end justify-center p-4 md:items-center"
      style={{ background: "rgba(8,12,22,.5)", backdropFilter: "blur(3px)" }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Sobre o SRL Canvas"
        className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-modal bg-surface font-sans text-ink shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-stroke p-4">
          <h2 className="font-display text-lg font-bold text-ink">Sobre o SRL Canvas</h2>
          <button
            ref={initialFocusRef}
            type="button"
            className="flex size-9 items-center justify-center rounded-lg text-ink-2 hover:bg-surface-2"
            onClick={onClose}
            aria-label="Fechar"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        <div className="space-y-4 p-4 md:p-6">
          <h3 className="font-display text-base font-bold text-ink">{ABOUT_SRL_CANVAS.title}</h3>

          <p className="text-sm text-ink-2">{ABOUT_SRL_CANVAS.contextAndGap}</p>
          <p className="text-sm text-ink-2">{ABOUT_SRL_CANVAS.purpose}</p>

          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-ink">{ABOUT_SRL_CANVAS.whoShouldUseTitle}</h4>
            <p className="text-sm text-ink-2">{ABOUT_SRL_CANVAS.whoShouldUseIntro}</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-ink-2">
              {ABOUT_SRL_CANVAS.whoShouldUse.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-ink">{ABOUT_SRL_CANVAS.propositionTitle}</h4>
            <ul className="list-disc space-y-1 pl-5 text-sm text-ink-2">
              {ABOUT_SRL_CANVAS.propositionItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="text-sm text-ink-2">{ABOUT_SRL_CANVAS.propositionSummary}</p>
          </section>

          <section className="space-y-2 rounded-card border border-stroke bg-inset p-3">
            <h4 className="text-sm font-semibold text-ink">{ABOUT_SRL_CANVAS.notTitle}</h4>
            <p className="text-sm text-ink-2">{ABOUT_SRL_CANVAS.notDescription}</p>
          </section>
        </div>

        <div className="flex justify-end border-t border-stroke p-4">
          <button
            type="button"
            className="rounded-[10px] bg-brand px-4 py-2 text-sm font-semibold text-brand-fg transition hover:brightness-110"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
