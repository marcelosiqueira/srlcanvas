import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useCanvasStore } from "../store/useCanvasStore";
import { BrandLockup } from "./BrandLockup";

interface AuthLayoutProps {
  children: ReactNode;
}

/**
 * Layout das telas públicas de autenticação (Entrar / Criar conta):
 * painel da marca (navy --hero) à esquerda no desktop, formulário à direita.
 * Em telas < lg vira coluna única (marca compacta no topo do formulário).
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  const darkMode = useCanvasStore((state) => state.darkMode);
  const toggleDarkMode = useCanvasStore((state) => state.toggleDarkMode);

  return (
    <div className="grid min-h-screen bg-app font-sans text-ink lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-hero p-10 text-white lg:flex">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl"
          style={{ backgroundColor: "rgba(45, 199, 182, 0.18)" }}
        />
        <Link to="/" className="relative w-fit" aria-label="Página inicial do SRL Canvas">
          <BrandLockup onDark />
        </Link>

        <div className="relative">
          <h2 className="font-display text-[30px] font-extrabold leading-tight">
            Diagnóstico de maturidade da sua startup em 12 blocos.
          </h2>
          <p className="mt-4 max-w-md text-[15px] text-white/70">
            Avalie com evidências, visualize lacunas no radar e acompanhe a evolução com um score
            comparável.
          </p>
        </div>

        <p className="relative text-[12px] text-white/50">SRL Canvas — Startup Readiness Level</p>
      </aside>

      <main className="flex flex-col px-4 py-6 sm:px-10">
        <div className="flex items-center">
          <Link to="/" className="lg:hidden" aria-label="Página inicial do SRL Canvas">
            <BrandLockup />
          </Link>
          <button
            type="button"
            onClick={toggleDarkMode}
            aria-label="Alternar tema"
            className="ml-auto flex size-[38px] items-center justify-center rounded-[10px] border border-stroke text-ink-2"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              {darkMode ? "light_mode" : "dark_mode"}
            </span>
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}
