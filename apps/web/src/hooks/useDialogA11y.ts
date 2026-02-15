import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])"
].join(", ");

const getFocusableElements = (container: HTMLElement): HTMLElement[] =>
  Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.hasAttribute("aria-hidden")
  );

export function useDialogA11y<T extends HTMLElement = HTMLElement>(isOpen: boolean) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<T>(null);

  useEffect(() => {
    if (!isOpen) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousFocusedElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusInitialElement = () => {
      const focusableElements = getFocusableElements(dialog);
      const preferredElement =
        initialFocusRef.current && dialog.contains(initialFocusRef.current)
          ? initialFocusRef.current
          : null;

      const target = preferredElement ?? focusableElements[0] ?? dialog;
      target.focus();
    };

    const frameId = window.requestAnimationFrame(focusInitialElement);

    const handleTabTrap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      const focusableElements = getFocusableElements(dialog);
      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;

      if (event.shiftKey) {
        if (activeElement === firstElement || !activeElement || !dialog.contains(activeElement)) {
          event.preventDefault();
          lastElement.focus();
        }
        return;
      }

      if (activeElement === lastElement || !activeElement || !dialog.contains(activeElement)) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleTabTrap);

    return () => {
      window.cancelAnimationFrame(frameId);
      document.removeEventListener("keydown", handleTabTrap);

      if (previousFocusedElement && previousFocusedElement.isConnected) {
        window.requestAnimationFrame(() => previousFocusedElement.focus());
      }
    };
  }, [isOpen]);

  return { dialogRef, initialFocusRef };
}
