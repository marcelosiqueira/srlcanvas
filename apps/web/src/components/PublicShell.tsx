import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useCanvasStore } from "../store/useCanvasStore";
import { BrandLockup } from "./BrandLockup";

interface PublicShellProps {
  title: string;
  children: ReactNode;
}

/**
 * Layout público mínimo (marca + toggle de tema, sem o menu do app). Usado em
 * fluxos abertos a quem não tem conta — ex.: a pesquisa acadêmica anônima.
 */
export function PublicShell({ title, children }: PublicShellProps) {
  const darkMode = useCanvasStore((state) => state.darkMode);
  const toggleDarkMode = useCanvasStore((state) => state.toggleDarkMode);

  return (
    <div className="min-h-screen bg-app font-sans text-ink">
      <header
        className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-stroke px-4"
        style={{
          backgroundColor: "color-mix(in srgb, var(--surface) 86%, transparent)",
          backdropFilter: "blur(10px)"
        }}
      >
        <Link to="/" aria-label="Página inicial do SRL Canvas">
          <BrandLockup />
        </Link>
        <button
          type="button"
          onClick={toggleDarkMode}
          aria-label="Alternar tema"
          className="flex size-[38px] items-center justify-center rounded-[10px] border border-stroke text-ink-2"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            {darkMode ? "light_mode" : "dark_mode"}
          </span>
        </button>
      </header>

      <main className="px-4 pb-16 pt-6">
        <div className="mx-auto w-full max-w-[1120px]">
          <h1 className="mb-4 font-display text-[20px] font-bold text-ink">{title}</h1>
          {children}
        </div>
      </main>
    </div>
  );
}
