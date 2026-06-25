import type { ReactNode } from "react";
import { useAuth } from "../auth/AuthProvider";
import { AppShell } from "./AppShell";
import { PublicShell } from "./PublicShell";

interface ResearchShellProps {
  title: string;
  children: ReactNode;
}

/**
 * Shell das telas de pesquisa (TCLE/Questionário), que são públicas:
 * - usuário logado → AppShell (mantém o menu do app);
 * - visitante anônimo → PublicShell (mínimo, sem o menu).
 */
export function ResearchShell({ title, children }: ResearchShellProps) {
  const { isEnabled, user } = useAuth();
  const Shell = isEnabled && user ? AppShell : PublicShell;
  return <Shell title={title}>{children}</Shell>;
}
