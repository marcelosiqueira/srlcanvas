import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent, ReactNode, RefObject } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { AboutSrlCanvasModal } from "../components/AboutSrlCanvasModal";
import { RESEARCH_SURVEY_CONFIG } from "../config/researchSurveyConfig";
import {
  LANDING_DIMENSIONS,
  LANDING_PREPARATION,
  LANDING_SCENARIOS,
  LANDING_VIDEO,
  LANDING_VIDEO_TRANSCRIPT,
  type LandingScenarioKey
} from "../data/landingContent";
import "./LandingPage.css";

const DOWNLOADS = {
  guide: "/downloads/guia-aplicacao-srl-canvas.pdf",
  canvas: "/downloads/srl-canvas-modelo-manual.pdf",
  radar: "/downloads/grafico-radar-srl-canvas.pdf"
} as const;

const SEO_TITLE = "SRL Canvas — Clareza para o próximo passo da sua startup";
const SEO_DESCRIPTION =
  "Enxergue os desequilíbrios da sua startup. Conheça o SRL Canvas: 12 dimensões de maturidade, evidências e mais clareza para decidir os próximos passos.";

const SCENARIO_KEYS = Object.keys(LANDING_SCENARIOS) as LandingScenarioKey[];

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

function useLandingSeo() {
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

    document.getElementById("srl-canvas-jsonld")?.remove();

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
      document.getElementById("srl-canvas-jsonld")?.remove();
    };
  }, []);
}

/** Radar SVG ilustrativo (12 eixos, escala 1–9) com descrição textual das notas. */
function LandingRadar({ values, id }: { values: number[]; id: string }) {
  const cx = 240;
  const cy = 175;
  const radius = 111;
  const labelRadius = 151;
  const point = (i: number, r: number) => {
    const angle = ((i * 30 - 90) * Math.PI) / 180;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r] as const;
  };
  const polygon = (radiusFor: (i: number) => number) =>
    LANDING_DIMENSIONS.map((_, i) =>
      point(i, radiusFor(i))
        .map((n) => n.toFixed(2))
        .join(",")
    ).join(" ");
  const description = LANDING_DIMENSIONS.map((d, i) => `${d.name}: ${values[i]} de 9`).join("; ");

  return (
    <svg viewBox="0 0 480 350" role="img" aria-labelledby={`radar-${id}-title radar-${id}-desc`}>
      <title id={`radar-${id}-title`}>Radar ilustrativo de maturidade em 12 dimensões</title>
      <desc id={`radar-${id}-desc`}>
        Startup fictícia. {description}. Não é uma avaliação real.
      </desc>
      {[1, 3, 5, 7, 9].map((level) => (
        <polygon key={level} points={polygon(() => (radius * level) / 9)} className="radar-grid" />
      ))}
      {LANDING_DIMENSIONS.map((d, i) => {
        const [x, y] = point(i, radius);
        return <line key={d.name} x1={cx} y1={cy} x2={x} y2={y} className="radar-axis" />;
      })}
      <polygon points={polygon((i) => (radius * values[i]) / 9)} className="radar-area" />
      {values.map((value, i) => {
        const [x, y] = point(i, (radius * value) / 9);
        return (
          <circle
            key={LANDING_DIMENSIONS[i].name}
            cx={x}
            cy={y}
            r={3.5}
            className={`radar-point ${value <= 3 ? "radar-point-low" : ""}`}
          />
        );
      })}
      {[3, 6, 9].map((level) => (
        <text key={level} x={244} y={cy - (radius * level) / 9 - 3} className="radar-tick">
          {level}
        </text>
      ))}
      {LANDING_DIMENSIONS.map((d, i) => {
        const [x, y] = point(i, labelRadius);
        const anchor = x > cx + 15 ? "start" : x < cx - 15 ? "end" : "middle";
        return (
          <text key={d.name} x={x} y={y - 3} textAnchor={anchor} className="radar-label">
            <tspan x={x}>P{i + 1}</tspan>
            <tspan x={x} dy={13}>
              {d.short}
            </tspan>
          </text>
        );
      })}
    </svg>
  );
}

function BrandMark() {
  return (
    <>
      <span className="brand-symbol" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span>
        SRL<span className="brand-sub">CANVAS</span>
      </span>
    </>
  );
}

function ExternalPdfLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="text-link" href={href} target="_blank" rel="noopener">
      {children} <span aria-hidden="true">↗</span>
      <span className="sr-only"> (PDF, abre em nova aba)</span>
    </a>
  );
}

interface LandingDialogProps {
  dialogRef: RefObject<HTMLDialogElement>;
  id: string;
  labelledBy: string;
  eyebrow: string;
  closeLabel: string;
  children: ReactNode;
}

/** Diálogo nativo com retenção de foco (Tab/Shift+Tab) e fechamento no backdrop. */
function LandingDialog({
  dialogRef,
  id,
  labelledBy,
  eyebrow,
  closeLabel,
  children
}: LandingDialogProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== "Tab") return;
    const dialog = event.currentTarget;
    const focusable = [
      ...dialog.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])'
      )
    ].filter((element) => element.getClientRects().length > 0);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  const handleClick = (event: MouseEvent<HTMLDialogElement>) => {
    const dialog = event.currentTarget;
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    ) {
      dialog.close();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      id={id}
      aria-labelledby={labelledBy}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      onClose={() => {
        document.body.style.removeProperty("overflow");
      }}
    >
      <div className="dialog-top">
        <span className="eyebrow">{eyebrow}</span>
        <button
          className="close-dialog"
          type="button"
          aria-label={closeLabel}
          onClick={() => dialogRef.current?.close()}
        >
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}

const openDialog = (dialog: HTMLDialogElement | null) => {
  if (!dialog || typeof dialog.showModal !== "function") return false;
  dialog.showModal();
  document.body.style.overflow = "hidden";
  return true;
};

export function LandingPage() {
  const { user, loading, isEnabled } = useAuth();
  const surveyEnabled = RESEARCH_SURVEY_CONFIG.enabled;
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scenarioKey, setScenarioKey] = useState<LandingScenarioKey>("governance");
  const [dimensionIndex, setDimensionIndex] = useState(2);
  const [preparationStep, setPreparationStep] = useState(0);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const onboardingRef = useRef<HTMLDialogElement>(null);
  const onboardingTitleRef = useRef<HTMLHeadingElement>(null);
  const stepChangedRef = useRef(false);

  useLandingSeo();

  useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    if (stepChangedRef.current) {
      onboardingTitleRef.current?.focus();
      stepChangedRef.current = false;
    }
  }, [preparationStep]);

  useEffect(
    () => () => {
      document.body.style.removeProperty("overflow");
    },
    []
  );

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

  // Sem autenticação (modo local), os CTAs abrem o app direto, sem cadastro.
  const startHref = isEnabled ? "/auth/signup" : "/canvas";
  const scenario = LANDING_SCENARIOS[scenarioKey];
  const dimension = LANDING_DIMENSIONS[dimensionIndex];
  const step = LANDING_PREPARATION[preparationStep];
  const isLastStep = preparationStep === LANDING_PREPARATION.length - 1;

  // O link continua navegando ao cadastro quando o diálogo não está disponível
  // ou quando o usuário abre em nova aba (teclas modificadoras).
  const handleStartClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!isEnabled || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    setPreparationStep(0);
    setMenuOpen(false);
    if (openDialog(onboardingRef.current)) {
      event.preventDefault();
    }
  };

  const goToStep = (next: number) => {
    stepChangedRef.current = true;
    setPreparationStep(next);
  };

  const startLink = (label: string, className: string) => (
    <Link className={className} to={startHref} onClick={handleStartClick}>
      {label} <span aria-hidden="true">↗</span>
    </Link>
  );

  return (
    <>
      <div className="lp">
        <a className="skip-link" href="#conteudo">
          Pular para o conteúdo
        </a>
        <header className="site-header">
          <div className="container header-inner">
            <a className="brand" href="#inicio" aria-label="SRL Canvas, início">
              <BrandMark />
            </a>
            <button
              ref={menuButtonRef}
              className="menu-toggle"
              type="button"
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
              aria-controls="navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span />
              <span />
            </button>
            <nav
              id="navigation"
              aria-label="Navegação principal"
              className={menuOpen ? "is-open" : undefined}
              onClick={(event) => {
                if ((event.target as HTMLElement).closest("a")) setMenuOpen(false);
              }}
            >
              <a href="#como-funciona">Como funciona</a>
              <a href="#demonstracao">Explore o radar</a>
              <a href="#metodologia">A metodologia</a>
              {isEnabled ? (
                <Link className="login" to="/auth/login">
                  Entrar <span aria-hidden="true">↗</span>
                </Link>
              ) : (
                <Link className="login" to="/canvas">
                  Abrir app
                </Link>
              )}
              {startLink("Iniciar diagnóstico", "button button-small")}
            </nav>
          </div>
        </header>

        <main id="conteudo">
          <section className="hero container" id="inicio" aria-labelledby="hero-title">
            <div className="hero-copy">
              <p className="eyebrow">
                <span className="status-dot" /> MENOS ACHISMO. MAIS DIREÇÃO.
              </p>
              <h1 id="hero-title">
                Sua startup está realmente pronta para{" "}
                <span className="word-growth">
                  crescer?
                  <svg viewBox="0 0 345 17" aria-hidden="true">
                    <path d="M4 12Q168-3 338 8" />
                  </svg>
                </span>
              </h1>
              <p className="hero-description">
                Um bom produto é só parte da história. Descubra os desequilíbrios do seu negócio e
                onde concentrar seus próximos esforços.
              </p>
              <div className="hero-actions">
                {startLink("Iniciar meu diagnóstico", "button")}
                <a className="text-link" href="#demonstracao">
                  Explorar um exemplo <span aria-hidden="true">↓</span>
                </a>
              </div>
              <p className="microcopy">
                Avaliação baseada em evidências. Decisões com mais clareza.
              </p>
              {!isEnabled && (
                <p className="microcopy">
                  Modo local ativo. Autenticação e persistência remota estão desabilitadas nesta
                  configuração.
                </p>
              )}
              <div className="hero-proof">
                <span className="proof-lines" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <p>
                  Da pesquisa à prática.
                  <br />
                  <strong>Desenvolvido no PROFNIT / IFMS.</strong>
                </p>
              </div>
            </div>
            <div
              className="hero-visual"
              aria-label="Exemplo ilustrativo de desequilíbrio de maturidade"
            >
              <div className="visual-top">
                <span className="mini-brand">SRL / VISÃO DO NEGÓCIO</span>
                <span className="pill">EXEMPLO FICTÍCIO</span>
              </div>
              <div className="visual-heading">
                <h2>Veja além do produto.</h2>
                <p>12 dimensões. Uma visão integrada.</p>
              </div>
              <div className="hero-radar radar-holder">
                <LandingRadar values={LANDING_SCENARIOS.governance.values} id="hero" />
              </div>
              <div className="chart-key">
                <span>
                  <i />
                  Perfil de maturidade
                </span>
                <span>Escala de 1 a 9</span>
              </div>
              <div className="insight-card">
                <span className="insight-icon" aria-hidden="true">
                  ↳
                </span>
                <div>
                  <span className="eyebrow">O GARGALO PODE ESTAR EM OUTRO LUGAR</span>
                  <p>
                    Produto <strong>7/9</strong>
                    <span className="vs"> / </span>Governança{" "}
                    <strong className="orange">2/9</strong>
                  </p>
                  <small>Avançar no produto não resolve uma lacuna societária.</small>
                </div>
              </div>
              <span className="visual-corner" aria-hidden="true">
                +
              </span>
            </div>
          </section>

          <div className="method-strip">
            <div className="container">
              <p>Uma nova forma de olhar para o seu negócio.</p>
              <div>
                <strong>12</strong>
                <span>dimensões</span>
              </div>
              <div>
                <strong>9</strong>
                <span>níveis de prontidão</span>
              </div>
              <div>
                <strong>1</strong>
                <span>regra: evidência antes da nota</span>
              </div>
            </div>
          </div>

          <section className="section container pain" aria-labelledby="pain-title">
            <div className="section-intro">
              <p className="eyebrow">O PROBLEMA</p>
              <h2 id="pain-title">
                Sua startup não
                <br />
                amadurece por igual.
              </h2>
            </div>
            <div className="pain-content">
              <p className="lead">
                O pitch destaca o produto. A planilha mostra a receita. Mas quem está olhando para o
                todo?
              </p>
              <p>
                Você pode ter clientes e ainda não ter previsibilidade de caixa. Pode ter tecnologia
                e ainda não ter validado a dor do mercado. Com informações espalhadas, fica difícil
                saber o que priorizar.
              </p>
              <div className="pain-bottom">
                <span className="line-arrow" aria-hidden="true">
                  ↗
                </span>
                <p>
                  O SRL Canvas reúne essas perspectivas para revelar{" "}
                  <strong>onde faltam evidências e quais lacunas investigar primeiro.</strong>
                </p>
              </div>
            </div>
          </section>

          <section className="demo-section" id="demonstracao" aria-labelledby="demo-title">
            <div className="container">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">EXPLORE ANTES DE COMEÇAR</p>
                  <h2 id="demo-title">
                    Um radar.
                    <br />
                    Muitas respostas melhores.
                  </h2>
                </div>
                <p>
                  Escolha um cenário e veja como ler o perfil.
                  <br />
                  <strong>Dados e interpretações são ilustrativos.</strong>
                </p>
              </div>
              <div
                className="scenario-switch"
                role="group"
                aria-label="Selecionar cenário fictício"
              >
                {SCENARIO_KEYS.map((key, index) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={scenarioKey === key}
                    onClick={() => setScenarioKey(key)}
                  >
                    {String(index + 1).padStart(2, "0")} <span>{LANDING_SCENARIOS[key].label}</span>
                  </button>
                ))}
              </div>
              <div className="demo-layout">
                <div className="demo-chart">
                  <div className="demo-chart-label">
                    <span className="pill">STARTUP FICTÍCIA</span>
                    <span className="small-muted">12 dimensões · 1 a 9</span>
                  </div>
                  <div className="radar-holder" id="demo-radar">
                    <LandingRadar values={scenario.values} id="demo" />
                  </div>
                  <p className="chart-caption">
                    O formato do radar revela desequilíbrios.
                    <br />
                    Uma soma isolada pode escondê-los.
                  </p>
                  <details className="score-table-disclosure">
                    <summary>Ver as 12 notas em texto</summary>
                    <table className="score-table">
                      <caption>Notas do cenário fictício selecionado</caption>
                      <thead>
                        <tr>
                          <th scope="col">Dimensão</th>
                          <th scope="col">Nível</th>
                        </tr>
                      </thead>
                      <tbody>
                        {LANDING_DIMENSIONS.map((d, i) => (
                          <tr key={d.name}>
                            <th scope="row">
                              P{i + 1} · {d.name}
                            </th>
                            <td>{scenario.values[i]}/9</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </details>
                </div>
                <div className="demo-reading" aria-live="polite" aria-atomic="true">
                  <div className="reading-label">
                    <span className="status-dot" /> UMA LEITURA POSSÍVEL
                  </div>
                  <h3>{scenario.title}</h3>
                  <p>{scenario.description}</p>
                  <div className="score-pair">
                    {scenario.scores.map((score) => (
                      <div key={score.label}>
                        <strong style={score.value > 3 ? { color: "var(--blue)" } : undefined}>
                          {score.value}
                          <small style={{ fontSize: 14 }}>/9</small>
                        </strong>
                        <span>{score.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="next-question">
                    <span className="eyebrow">UMA PERGUNTA PARA O PRÓXIMO PASSO</span>
                    <p>{scenario.question}</p>
                  </div>
                  <p className="small-muted">
                    Interpretação educativa deste exemplo. Não é uma recomendação automática da
                    plataforma.
                  </p>
                </div>
              </div>
              <div className="dimension-explorer">
                <div className="dimension-header">
                  <h3>O que cada dimensão observa?</h3>
                  <p>Selecione uma dimensão para entender a pergunta e o tipo de evidência.</p>
                </div>
                <div className="dimension-layout">
                  <div
                    className="dimension-buttons"
                    role="group"
                    aria-label="Dimensões do SRL Canvas"
                  >
                    {LANDING_DIMENSIONS.map((d, i) => (
                      <button
                        key={d.name}
                        type="button"
                        aria-pressed={dimensionIndex === i}
                        aria-controls="dimension-detail"
                        onClick={() => setDimensionIndex(i)}
                      >
                        <span>P{i + 1}</span>
                        {d.name}
                      </button>
                    ))}
                  </div>
                  <div
                    className="dimension-detail"
                    id="dimension-detail"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    <p className="eyebrow">
                      P{dimensionIndex + 1} · {dimension.group}
                    </p>
                    <h4>{dimension.name}</h4>
                    <p>{dimension.question}</p>
                    <p>
                      <strong>Exemplos de evidência:</strong> {dimension.evidence}
                    </p>
                    <p className="small-muted">
                      Exemplos introdutórios. A nota depende dos critérios do nível no guia oficial.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            className="section container steps-section"
            id="como-funciona"
            aria-labelledby="steps-title"
          >
            <div className="section-heading">
              <div>
                <p className="eyebrow">DA PERCEPÇÃO À EVIDÊNCIA</p>
                <h2 id="steps-title">Clareza em três passos.</h2>
              </div>
              <ExternalPdfLink href={DOWNLOADS.guide}>Consultar o guia oficial</ExternalPdfLink>
            </div>
            <div className="steps-grid">
              <article className="step">
                <span className="step-number">01</span>
                <div className="step-drawing drawing-one" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <b>12</b>
                </div>
                <h3>Olhe para o negócio inteiro.</h3>
                <p>
                  Percorra as 12 dimensões, do problema do cliente à governança. Use os critérios do
                  guia para situar cada uma.
                </p>
              </article>
              <article className="step">
                <span className="step-number">02</span>
                <div className="step-drawing drawing-two" aria-hidden="true">
                  <span>AFIRMAÇÃO</span>
                  <i>↔</i>
                  <span>EVIDÊNCIA</span>
                </div>
                <h3>Sustente cada avaliação.</h3>
                <p>
                  Registre o que comprova a nota: entrevistas, métricas, contratos. Pela regra do
                  método, notas acima de 3 exigem evidência registrada.
                </p>
              </article>
              <article className="step">
                <span className="step-number">03</span>
                <div className="step-drawing drawing-three" aria-hidden="true">
                  <span>1</span>
                  <i />
                  <span>2</span>
                  <i />
                  <span>3</span>
                </div>
                <h3>Escolha o próximo marco.</h3>
                <p>
                  Leia o radar, discuta as lacunas com sua equipe ou mentor e defina dois ou três
                  testes. O plano de ação é uma decisão sua.
                </p>
              </article>
            </div>
            <div className="availability">
              <span className="availability-mark" aria-hidden="true">
                ✓
              </span>
              <p>
                <strong>Na plataforma atual:</strong> avaliação com notas e evidências, critérios
                por nível, radar, resumo interpretativo por bloco e exportação em PDF/PNG.{" "}
                <strong>Ainda não disponível:</strong> geração integrada de planos de ação.
              </p>
            </div>
            <div className="support-materials" aria-labelledby="support-title">
              <div>
                <h3 id="support-title">Material de apoio (uso offline)</h3>
                <p>
                  Não é obrigatório usar a plataforma: baixe o guia, o modelo do Canvas e o radar
                  para preenchimento manual.
                </p>
              </div>
              <div className="support-links">
                <ExternalPdfLink href={DOWNLOADS.guide}>Guia de aplicação</ExternalPdfLink>
                <ExternalPdfLink href={DOWNLOADS.canvas}>Modelo do SRL Canvas</ExternalPdfLink>
                <ExternalPdfLink href={DOWNLOADS.radar}>Gráfico radar</ExternalPdfLink>
              </div>
            </div>
          </section>

          <section className="video-section container" aria-labelledby="video-title">
            <div className="video-frame">
              {/* Sem autoplay: o visitante decide quando assistir. Legendas pt-BR via <track>. */}
              <video
                controls
                playsInline
                preload="metadata"
                width={1920}
                height={1080}
                poster={LANDING_VIDEO.poster}
                aria-describedby="video-description"
              >
                <source src={LANDING_VIDEO.src} type="video/mp4" />
                <track
                  kind="captions"
                  src={LANDING_VIDEO.captions}
                  srcLang="pt-BR"
                  label="Português (Brasil)"
                />
                Seu navegador não reproduz vídeos. Leia a transcrição ao lado.
              </video>
            </div>
            <div className="video-copy">
              <p className="eyebrow">ENTENDA A PROPOSTA</p>
              <h2 id="video-title">
                Antes de mais esforço,
                <br />
                uma direção melhor.
              </h2>
              <p id="video-description">
                Em {LANDING_VIDEO.duration}: por que a startup não amadurece por igual, como o
                método funciona na plataforma e no papel, e o que ele não promete.
              </p>
              <p className="small-muted">
                Com narração e legendas em português. Startup e dados do vídeo são fictícios.
              </p>
              <details className="video-transcript">
                <summary>Ler a transcrição</summary>
                {LANDING_VIDEO_TRANSCRIPT.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </details>
            </div>
          </section>

          <section className="section container audiences" aria-labelledby="audience-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">UMA LINGUAGEM EM COMUM</p>
                <h2 id="audience-title">
                  Diferentes olhares.
                  <br />
                  As mesmas evidências.
                </h2>
              </div>
              <p>
                Aplicações da metodologia para quem constrói,
                <br />
                orienta e apoia negócios inovadores.
              </p>
            </div>
            <div className="audience-grid">
              <article>
                <span className="audience-icon" aria-hidden="true">
                  ↗
                </span>
                <h3>Fundadores e equipes</h3>
                <p>
                  Chegue à próxima conversa com clareza sobre as lacunas e perguntas que merecem
                  atenção.
                </p>
                <span className="audience-tag">PRIORIZE MELHOR</span>
              </article>
              <article>
                <span className="audience-icon" aria-hidden="true">
                  ◎
                </span>
                <h3>Mentores e consultores</h3>
                <p>
                  Organize a sessão a partir de um perfil compartilhado, com evidências para
                  discutir cada percepção.
                </p>
                <span className="audience-tag">APROFUNDE A CONVERSA</span>
              </article>
              <article>
                <span className="audience-icon" aria-hidden="true">
                  ⊞
                </span>
                <h3>Incubadoras e aceleradoras</h3>
                <p>
                  Use o método para estruturar diagnósticos e reaplicações ao longo do programa de
                  apoio.
                </p>
                <span className="audience-tag">ESTRUTURE O ACOMPANHAMENTO</span>
              </article>
              <article>
                <span className="audience-icon" aria-hidden="true">
                  ⌁
                </span>
                <h3>Investidores, NITs e universidades</h3>
                <p>
                  Organize perguntas para a diligência ou complemente a leitura da prontidão
                  tecnológica.
                </p>
                <span className="audience-tag">AMPLIE A ANÁLISE</span>
              </article>
            </div>
            <p className="audience-note">
              São usos do método. Painéis institucionais, gestão de portfólio e decisões automáticas
              não são recursos anunciados aqui.
            </p>
          </section>

          <section className="science-section" id="metodologia" aria-labelledby="science-title">
            <div className="container science-layout">
              <div className="science-copy">
                <p className="eyebrow">RIGOR PARA FAZER PERGUNTAS MELHORES</p>
                <h2 id="science-title">
                  A prática tem
                  <br />
                  base científica.
                </h2>
                <p>
                  O SRL Canvas foi desenvolvido por <strong>Marcelo Siqueira</strong> em pesquisa de
                  mestrado no <strong>PROFNIT, ponto focal IFMS</strong>, sob orientação do Prof.
                  Dr. Jiyan Yari.
                </p>
                <p>
                  A estrutura e o conteúdo foram refinados em duas rodadas do método Delphi com{" "}
                  <strong>15 especialistas</strong>: fundadores, investidores e gestores de
                  aceleração.
                </p>
                <button
                  type="button"
                  className="text-link science-about"
                  onClick={() => setIsAboutOpen(true)}
                >
                  Sobre o projeto: por que o SRL Canvas? <span aria-hidden="true">↗</span>
                </button>
                <div className="science-signature">
                  <span>PROFNIT / IFMS</span>
                  <span>Pesquisa aplicada · 2026</span>
                </div>
              </div>
              <div className="science-evidence">
                <span className="quote-mark" aria-hidden="true">
                  “
                </span>
                <blockquote>
                  Nota é uma afirmação.
                  <br />
                  Evidência é o que
                  <br />a sustenta.
                </blockquote>
                <p className="quote-source">Marcelo Siqueira · Metodologia SRL Canvas</p>
                <div className="science-limit">
                  <span className="eyebrow">O QUE FOI VALIDADO</span>
                  <p>
                    Validação de conteúdo por consenso de especialistas. Isso não demonstra
                    capacidade de prever resultados empresariais. A validação empírica em campo
                    ainda não está demonstrada nesta pesquisa.
                  </p>
                </div>
                <ExternalPdfLink href={DOWNLOADS.guide}>
                  Conhecer o guia de aplicação
                </ExternalPdfLink>
              </div>
            </div>
          </section>

          <section className="section container faq-section" aria-labelledby="faq-title">
            <div>
              <p className="eyebrow">SEM CAIXA-PRETA</p>
              <h2 id="faq-title">
                O que vale
                <br />
                saber antes.
              </h2>
              <p>
                Um diagnóstico é um ponto de partida.
                <br />A decisão continua com você.
              </p>
            </div>
            <div className="faq-list">
              <details>
                <summary>Isso prevê o sucesso ou o valor da minha startup?</summary>
                <p>
                  Não. O SRL Canvas organiza evidências e lacunas em um retrato de maturidade. Não
                  prevê sucesso ou sobrevivência, não calcula valuation e não substitui due
                  diligence. Também não decide seleção, investimento, permanência em programas ou
                  desembolso.
                </p>
              </details>
              <details>
                <summary>Preciso conhecer a metodologia para começar?</summary>
                <p>
                  Você pode começar pelos exemplos desta página e pelo guia oficial. A avaliação
                  exige compreender os critérios e reunir evidências. Se os conceitos forem novos,
                  vale preencher com o apoio de um mentor. A ajuda nesta landing page é introdutória
                  e não substitui o protocolo completo.
                </p>
              </details>
              <details>
                <summary>E se eu ainda não tiver evidências?</summary>
                <p>
                  Reconhecer uma lacuna já ajuda a orientar o próximo teste. Não invente dados nem
                  atribua uma nota alta por expectativa. Pela regra do método, qualquer nota acima
                  de 3 precisa de uma evidência registrada ao lado. Consulte os descritores
                  específicos de cada nível no guia.
                </p>
              </details>
              <details>
                <summary>Posso aplicar sem usar a plataforma?</summary>
                <p>
                  Sim. Disponibilizamos gratuitamente o{" "}
                  <a href={DOWNLOADS.guide} target="_blank" rel="noopener">
                    guia de aplicação (PDF, nova aba)
                  </a>
                  , o{" "}
                  <a href={DOWNLOADS.canvas} target="_blank" rel="noopener">
                    modelo do Canvas (PDF, nova aba)
                  </a>{" "}
                  e o{" "}
                  <a href={DOWNLOADS.radar} target="_blank" rel="noopener">
                    radar para preenchimento manual (PDF, nova aba)
                  </a>
                  .
                </p>
              </details>
              <details>
                <summary>As interpretações dos exemplos já existem na plataforma?</summary>
                <p>
                  Os cenários, as leituras e as perguntas desta página são uma demonstração
                  educativa criada para explicar o método. Não são resultados de startups reais. A
                  plataforma já apresenta resumo interpretativo por bloco, foco estratégico e
                  evidências sugeridas conforme as notas. Geração integrada de planos de ação ainda
                  não está disponível.
                </p>
              </details>
            </div>
          </section>

          <section className="final-cta container" aria-labelledby="cta-title">
            <div>
              <p className="eyebrow">SEU PRÓXIMO PASSO, COM MAIS CLAREZA</p>
              <h2 id="cta-title">
                Antes de acelerar,
                <br />
                entenda onde você está.
              </h2>
              <p>Comece olhando para o que as evidências dizem.</p>
              {startLink("Iniciar meu diagnóstico", "button button-light")}
              <span className="cta-note">
                {isEnabled
                  ? "Você será encaminhado ao cadastro no SRL Canvas."
                  : "Você será encaminhado ao app em modo local."}
              </span>
            </div>
            <div className="cta-art" aria-hidden="true">
              <div />
              <div />
              <div />
              <div />
              <span>↗</span>
            </div>
          </section>
        </main>

        <footer className="container">
          <div className="footer-top">
            <a className="brand" href="#inicio" aria-label="SRL Canvas, voltar ao início">
              <BrandMark />
            </a>
            <p>
              Startup Readiness Level Canvas
              <br />
              Clareza para evoluir. Evidências para decidir.
            </p>
            {surveyEnabled && (
              <Link className="text-link" to="/survey?next=/">
                Participar da pesquisa <span aria-hidden="true">↗</span>
              </Link>
            )}
          </div>
          <div className="footer-bottom">
            <span>© 2026 SRL Canvas · Metodologia de Marcelo Siqueira.</span>
            <span>Diagnóstico de maturidade. Sem previsão de sucesso ou valuation.</span>
          </div>
        </footer>

        <LandingDialog
          dialogRef={onboardingRef}
          id="onboarding"
          labelledBy="onboarding-title"
          eyebrow="ANTES DO DIAGNÓSTICO"
          closeLabel="Fechar preparação"
        >
          <div>
            <div className="onboarding-progress" aria-hidden="true">
              {LANDING_PREPARATION.map((item, i) => (
                <span key={item.title} className={i <= preparationStep ? "current" : undefined} />
              ))}
            </div>
            <p className="onboarding-step">
              PASSO {preparationStep + 1} DE {LANDING_PREPARATION.length}
            </p>
            <h2 id="onboarding-title" tabIndex={-1} ref={onboardingTitleRef}>
              {step.title}
            </h2>
            <p>{step.text}</p>
            <ul className="onboarding-list">
              {step.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {isLastStep && (
              <Link className="text-link" to="/auth/login">
                Já tenho conta: entrar ↗
              </Link>
            )}
          </div>
          <div className="dialog-actions">
            {preparationStep > 0 && (
              <button
                className="text-link"
                type="button"
                onClick={() => goToStep(preparationStep - 1)}
              >
                Voltar
              </button>
            )}
            {isLastStep ? (
              <Link className="button" to="/auth/signup">
                Criar conta e começar <span aria-hidden="true">↗</span>
              </Link>
            ) : (
              <button
                className="button"
                type="button"
                onClick={() => goToStep(preparationStep + 1)}
              >
                Próximo <span aria-hidden="true">→</span>
              </button>
            )}
          </div>
          <p className="dialog-footnote">
            Esta preparação acontece só nesta página. Nenhum dado é solicitado ou enviado.
          </p>
        </LandingDialog>
      </div>
      {/* Fora de .lp para manter a tipografia padrão do app no modal. */}
      <AboutSrlCanvasModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </>
  );
}
