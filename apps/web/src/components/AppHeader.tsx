import { useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ResearchOpinionModal } from "./ResearchOpinionModal";
import { useAuth } from "../auth/AuthProvider";
import { useCanvasStore } from "../store/useCanvasStore";

interface AppHeaderProps {
  title: string;
  backTo?: string;
  backAriaLabel?: string;
  rightSlot?: ReactNode;
}

export function AppHeader({
  title,
  backTo = "/canvas",
  backAriaLabel = "Voltar",
  rightSlot
}: AppHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isEnabled, signOut } = useAuth();
  const { darkMode, toggleDarkMode } = useCanvasStore();
  const [isOpinionModalOpen, setIsOpinionModalOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(backTo);
  };

  const openOpinionForm = () => {
    setIsOpinionModalOpen(true);
  };

  const currentPath = `${location.pathname}${location.search}`;
  const canSignOut = isEnabled && Boolean(user);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    const { error } = await signOut();
    setIsSigningOut(false);

    if (!error) {
      navigate("/", { replace: true });
    }
  };

  return (
    <>
      <header className="sticky top-0 z-10 flex h-16 items-center border-b border-zinc-200/80 bg-background-light/85 px-4 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-background-dark/85">
        <div className="flex w-36 items-center">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-12 w-12 items-center justify-center text-text-light-primary dark:text-text-dark-primary"
            aria-label={backAriaLabel}
          >
            <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
          </button>
          <div className="h-12 w-12" aria-hidden="true" />
          <div className="h-12 w-12" aria-hidden="true" />
        </div>

        <h1 className="flex-1 text-center text-lg font-bold tracking-tight text-text-light-primary dark:text-text-dark-primary">
          {title}
        </h1>

        <div className="flex w-36 items-center justify-end">
          <button
            type="button"
            onClick={openOpinionForm}
            className="flex h-12 w-12 items-center justify-center text-text-light-primary dark:text-text-dark-primary"
            aria-label="Abrir formulario de opiniao"
          >
            <span className="material-symbols-outlined text-2xl">rate_review</span>
          </button>
          <button
            type="button"
            onClick={toggleDarkMode}
            className="flex h-12 w-12 items-center justify-center text-text-light-primary dark:text-text-dark-primary"
            aria-label="Alternar tema"
          >
            <span className="material-symbols-outlined text-2xl">
              {darkMode ? "light_mode" : "dark_mode"}
            </span>
          </button>
          {canSignOut && (
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="flex h-12 w-12 items-center justify-center text-text-light-primary disabled:opacity-60 dark:text-text-dark-primary"
              aria-label="Sair da conta"
            >
              <span className="material-symbols-outlined text-2xl">logout</span>
            </button>
          )}
          {rightSlot}
        </div>
      </header>

      <ResearchOpinionModal
        isOpen={isOpinionModalOpen}
        nextPath={currentPath}
        onClose={() => setIsOpinionModalOpen(false)}
      />
    </>
  );
}
