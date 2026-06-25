import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useCanvasStore } from "../store/useCanvasStore";
import { BrandLockup } from "./BrandLockup";

interface AppShellProps {
  title: string;
  children: ReactNode;
}

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: "grid_view" },
  { to: "/canvas", label: "Meu Canvas", icon: "view_week" },
  { to: "/results", label: "Resultados", icon: "radar" },
  { to: "/account", label: "Minha Conta", icon: "person" }
];

function getInitials(name?: string, email?: string): string {
  const trimmedName = name?.trim();
  if (trimmedName) {
    const parts = trimmedName.split(/\s+/);
    const initials = `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`;
    if (initials) return initials.toUpperCase();
  }
  const trimmedEmail = email?.trim();
  if (trimmedEmail) return trimmedEmail.slice(0, 2).toUpperCase();
  return "?";
}

export function AppShell({ title, children }: AppShellProps) {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const darkMode = useCanvasStore((state) => state.darkMode);
  const toggleDarkMode = useCanvasStore((state) => state.toggleDarkMode);

  const accountName = user?.name?.trim() || user?.email || "Convidado";
  const accountSubtitle = user?.email ?? "Modo local";
  const accountInitials = getInitials(user?.name, user?.email);

  const handleLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  const sidebarLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-semibold transition ${
      isActive ? "bg-surface-2 text-ink dark:bg-inset" : "text-ink-2 hover:bg-surface-2"
    }`;

  return (
    <div className="min-h-screen bg-app font-sans text-ink">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-stroke bg-surface px-4 py-5 lg:flex">
        <BrandLockup />
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.label} to={item.to} className={sidebarLinkClass} end>
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
          <NavLink
            to="/canvas/new"
            className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-[14px] font-semibold text-brand-fg"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            Novo SRL Canvas
          </NavLink>
        </nav>
        <div className="mt-auto border-t border-stroke pt-4">
          <NavLink
            to="/account"
            aria-label="Abrir Minha Conta"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg p-2 transition ${
                isActive ? "bg-surface-2" : "hover:bg-surface-2"
              }`
            }
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-2 font-display text-[13px] font-bold text-ink">
              {accountInitials}
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[13px] font-semibold text-ink">{accountName}</p>
              <p className="truncate text-[11px] text-ink-3">{accountSubtitle}</p>
            </div>
          </NavLink>
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="lg:pl-64">
        <header
          className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-stroke px-4"
          style={{
            backgroundColor: "color-mix(in srgb, var(--surface) 86%, transparent)",
            backdropFilter: "blur(10px)"
          }}
        >
          <h1 className="font-display text-[17px] font-bold text-ink">{title}</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label="Alternar tema"
              className="flex size-[38px] items-center justify-center rounded-[10px] border border-stroke text-ink-2"
            >
              <span className="material-symbols-outlined">
                {darkMode ? "light_mode" : "dark_mode"}
              </span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Sair"
              className="flex size-[38px] items-center justify-center rounded-[10px] border border-stroke text-ink-2"
            >
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </header>

        <main className="px-4 pb-28 pt-6 lg:pb-10">{children}</main>
      </div>

      {/* Bottom nav mobile */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-stroke lg:hidden"
        style={{
          backgroundColor: "color-mix(in srgb, var(--surface) 80%, transparent)",
          backdropFilter: "blur(12px)"
        }}
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-3 text-[10.5px] font-medium ${
                isActive ? "text-brand" : "text-ink-3"
              }`
            }
          >
            <span className="material-symbols-outlined text-2xl">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
