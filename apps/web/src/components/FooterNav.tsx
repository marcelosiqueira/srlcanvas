import { NavLink } from "react-router-dom";

const linkBaseClass =
  "flex flex-col items-center justify-center gap-1 text-center text-xs font-medium transition";

const getLinkClass = ({ isActive }: { isActive: boolean }) =>
  `${linkBaseClass} ${
    isActive ? "text-primary" : "text-text-light-secondary dark:text-text-dark-secondary"
  }`;

export function FooterNav() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-10 grid h-24 grid-cols-4 items-center border-t border-zinc-200/80 bg-background-light/95 px-2 pb-6 pt-2 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-background-dark/95">
      <NavLink className={getLinkClass} to="/dashboard">
        <span className="material-symbols-outlined text-2xl">grid_view</span>
        <span>Dashboard</span>
      </NavLink>

      <NavLink className={getLinkClass} to="/canvas">
        <span className="material-symbols-outlined text-2xl">style</span>
        <span>Meu SRL Canvas</span>
      </NavLink>

      <NavLink className={getLinkClass} to="/canvas/new">
        <span className="material-symbols-outlined text-2xl">add_circle</span>
        <span>Novo SRL Canvas</span>
      </NavLink>

      <NavLink className={getLinkClass} to="/account">
        <span className="material-symbols-outlined text-2xl">account_circle</span>
        <span>Minha Conta</span>
      </NavLink>
    </footer>
  );
}
