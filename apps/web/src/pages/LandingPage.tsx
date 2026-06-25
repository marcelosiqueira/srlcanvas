import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { AboutSrlCanvasModal } from "../components/AboutSrlCanvasModal";
import { BrandLockup } from "../components/BrandLockup";
import { RESEARCH_SURVEY_CONFIG } from "../config/researchSurveyConfig";
import { useCanvasStore } from "../store/useCanvasStore";

const SRL_DOWNLOADS = [
  {
    label: "Baixar Guia de Aplicação",
    href: "/downloads/guia-aplicacao-srl-canvas.pdf"
  },
  {
    label: "Baixar SRL Canvas",
    href: "/downloads/srl-canvas-modelo-manual.pdf"
  },
  {
    label: "Baixar Gráfico Radar",
    href: "/downloads/grafico-radar-srl-canvas.pdf"
  }
] as const;

const SEO_TITLE =
  "SRL Canvas | Ferramenta Visual para Diagnóstico e Orientação Estratégica de Startups";
const SEO_DESCRIPTION =
  "Facilite a aplicação do SRL Canvas com 12 blocos, evidências, gráfico radar e scorecard comparável para startups.";

const upsertMetaTag = (selector: string, attrs: Record<string, string>, content: string) => {
  let node = document.head.querySelector<HTMLMetaElement>(selector);
  if (!node) {
    node = document.createElement("meta");
    for (const [key, value] of Object.entries(attrs)) {
      node.setAttribute(key, value);
    }
    document.head.appendChild(node);
  }
  node.setAttribute("content", content);
};

export function LandingPage() {
  const { user, loading, isEnabled } = useAuth();
  const { darkMode, toggleDarkMode } = useCanvasStore();
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const surveyEnabled = RESEARCH_SURVEY_CONFIG.enabled;

  useEffect(() => {
    const previousTitle = document.title;
    document.title = SEO_TITLE;

    const canonicalUrl = `${window.location.origin}/`;
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalUrl);

    upsertMetaTag('meta[name="description"]', { name: "description" }, SEO_DESCRIPTION);
    upsertMetaTag('meta[name="robots"]', { name: "robots" }, "index, follow");
    upsertMetaTag('meta[property="og:title"]', { property: "og:title" }, SEO_TITLE);
    upsertMetaTag(
      'meta[property="og:description"]',
      { property: "og:description" },
      SEO_DESCRIPTION
    );
    upsertMetaTag('meta[property="og:url"]', { property: "og:url" }, canonicalUrl);
    upsertMetaTag('meta[name="twitter:title"]', { name: "twitter:title" }, SEO_TITLE);
    upsertMetaTag(
      'meta[name="twitter:description"]',
      { name: "twitter:description" },
      SEO_DESCRIPTION
    );

    const existingJsonLd = document.getElementById("srl-canvas-jsonld");
    if (existingJsonLd) {
      existingJsonLd.remove();
    }

    const jsonLd = document.createElement("script");
    jsonLd.type = "application/ld+json";
    jsonLd.id = "srl-canvas-jsonld";
    jsonLd.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "SRL Canvas",
      description: SEO_DESCRIPTION,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: "pt-BR",
      url: canonicalUrl
    });
    document.head.appendChild(jsonLd);

    return () => {
      document.title = previousTitle;
      const scriptNode = document.getElementById("srl-canvas-jsonld");
      scriptNode?.remove();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app">
        <p className="text-sm text-ink-2">Carregando...</p>
      </div>
    );
  }

  if (isEnabled && user) {
    return <Navigate replace to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-app font-sans text-ink">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 pt-6">
        <BrandLockup />

        <button
          type="button"
          onClick={toggleDarkMode}
          className="flex size-[38px] items-center justify-center rounded-[10px] border border-stroke text-ink-2 transition hover:bg-surface-2"
          aria-label="Alternar tema"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            {darkMode ? "light_mode" : "dark_mode"}
          </span>
        </button>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-12 pt-10 md:pt-12">
        <section className="relative overflow-hidden rounded-hero bg-hero px-7 py-10 text-white md:px-10 md:py-14">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full blur-3xl"
            style={{ backgroundColor: "rgba(45, 199, 182, 0.18)" }}
          />
          <div className="relative max-w-3xl">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/60">
              Ferramenta Visual para Diagnóstico e Orientação Estratégica de Startups
            </p>
            <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight tracking-tight md:text-[52px]">
              Avalie os 12 blocos do SRL Canvas com evidências e score comparável.
            </h1>
            <p className="mt-5 max-w-2xl text-[15px] text-white/70 md:text-base">
              Esta plataforma foi criada para facilitar a aplicação do SRL Canvas na prática:
              organize a avaliação, visualize desequilíbrios no radar e gere um scorecard com
              consistência metodológica.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="rounded-[10px] bg-white px-5 py-2.5 text-sm font-semibold text-hero transition hover:brightness-95"
                to={isEnabled ? "/auth/login" : "/canvas"}
              >
                {isEnabled ? "Entrar" : "Abrir app"}
              </Link>
              {isEnabled && (
                <Link
                  className="rounded-[10px] border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                  to="/auth/signup"
                >
                  Criar conta
                </Link>
              )}
            </div>

            {!isEnabled && (
              <p className="mt-4 text-xs text-white/60">
                Modo local ativo. Autenticação e persistência remota estão desabilitadas nesta
                configuração.
              </p>
            )}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Escala guiada",
              body: "Aplique notas de 1 a 9 com registro de evidência por bloco para sustentar cada avaliação."
            },
            {
              title: "Análise visual",
              body: "Enxergue lacunas com radar de 12 dimensões e priorize os pontos de maior risco."
            },
            {
              title: "Exportação pronta",
              body: "Gere PNG e PDF para compartilhar resultados com equipe, mentores e comitês."
            }
          ].map((feature) => (
            <article
              key={feature.title}
              className="rounded-card border border-stroke bg-surface p-5 shadow-sm"
            >
              <h2 className="font-display text-[14.5px] font-bold text-ink">{feature.title}</h2>
              <p className="mt-2 text-sm text-ink-2">{feature.body}</p>
            </article>
          ))}
        </section>

        <section className="rounded-card border border-stroke bg-surface p-5 shadow-sm">
          <h2 className="font-display text-[14.5px] font-bold text-ink">Sobre o Projeto</h2>
          <p className="mt-2 text-sm text-ink-2">
            O nome oficial da ferramenta é{" "}
            <strong className="text-ink">SRL Canvas (Startup Readiness Level Canvas)</strong>. Aqui
            você encontra o contexto, propósito e público-alvo do framework.
          </p>
          <button
            type="button"
            onClick={() => setIsAboutOpen(true)}
            className="mt-3 rounded-[10px] border border-stroke px-4 py-2 text-sm font-semibold text-ink-2 transition hover:bg-surface-2"
          >
            Ler: Por que o SRL Canvas?
          </button>
        </section>

        <section className="rounded-card border border-stroke bg-surface p-5 shadow-sm">
          <h3 className="font-display text-[14.5px] font-bold text-ink">
            Material de Apoio (Uso Offline)
          </h3>
          <p className="mt-2 text-sm text-ink-2">
            Não é obrigatório usar esta plataforma para aplicar o SRL Canvas. O método foi desenhado
            para ser simples e ágil: você pode baixar o guia de aplicação, o modelo do SRL Canvas e
            o gráfico radar para preenchimento manual.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SRL_DOWNLOADS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                download
                target="_blank"
                rel="noreferrer"
                className="rounded-[10px] border border-stroke px-4 py-2 text-sm font-semibold text-ink-2 transition hover:bg-surface-2"
              >
                {item.label}
              </a>
            ))}
          </div>
        </section>

        {surveyEnabled && (
          <section className="rounded-card border border-stroke bg-surface p-5 shadow-sm">
            <h3 className="font-display text-[14.5px] font-bold text-ink">Pesquisa Acadêmica</h3>
            <p className="mt-2 text-sm text-ink-2">
              Este projeto faz parte de uma dissertação de mestrado. Sua opinião ajuda a validar o
              SRL Canvas — você pode responder mesmo{" "}
              <strong className="text-ink">sem usar a plataforma</strong> (≈10–12 min, anônimo).
            </p>
            <div className="mt-3">
              <Link
                to="/survey?next=/"
                className="inline-flex rounded-[10px] bg-brand px-4 py-2 text-sm font-semibold text-brand-fg transition hover:brightness-110"
              >
                Participar da pesquisa
              </Link>
            </div>
          </section>
        )}
      </main>

      <AboutSrlCanvasModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}
