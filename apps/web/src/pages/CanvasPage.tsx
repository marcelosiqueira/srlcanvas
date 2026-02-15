import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { BlockEditModal } from "../components/BlockEditModal";
import { FooterNav } from "../components/FooterNav";
import { GroupDetailsModal } from "../components/GroupDetailsModal";
import { ResearchOpinionModal } from "../components/ResearchOpinionModal";
import { ResultsModal } from "../components/ResultsModal";
import { GROUPS, GROUP_BY_KEY, SRL_BLOCKS, SRL_BLOCKS_BY_ID } from "../data/srlBlocks";
import { saveCanvas } from "../services/canvasApi";
import {
  GUEST_CANVAS_SCOPE,
  hasMeaningfulCanvasData,
  useCanvasStore
} from "../store/useCanvasStore";
import {
  createProductMetricsSessionId,
  getCanvasAbandonStage,
  trackProductMetricEvent
} from "../services/productMetrics";
import type { GroupKey } from "../types";
import { validateCanvasMeta } from "../utils/canvasMeta";
import { calculateScoreMetrics } from "../utils/score";

const MAX_SCORE = 108;
const ONBOARDING_STORAGE_KEY_PREFIX = "srl-canvas-onboarding-v1";
const ADVANCED_MODE_STORAGE_KEY = "srl-canvas-advanced-mode-v1";

const getOnboardingStorageKey = (scope: string): string =>
  `${ONBOARDING_STORAGE_KEY_PREFIX}:${scope}`;

type AdvancedBlockFilter = "all" | "pending" | "scored";

const readAdvancedModeEnabled = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ADVANCED_MODE_STORAGE_KEY) === "enabled";
};

const writeAdvancedModeEnabled = (enabled: boolean): void => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADVANCED_MODE_STORAGE_KEY, enabled ? "enabled" : "disabled");
};

const clampScore = (value: number): number => Math.min(9, Math.max(1, value));

const isTextInputTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
};

const readOnboardingCompleted = (scope: string): boolean => {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(getOnboardingStorageKey(scope)) === "done";
};

const writeOnboardingCompleted = (scope: string): void => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getOnboardingStorageKey(scope), "done");
};

export function CanvasPage() {
  const navigate = useNavigate();
  const { user, isEnabled } = useAuth();
  const {
    meta,
    blocks,
    setMeta,
    updateBlock,
    resetCanvas,
    darkMode,
    toggleDarkMode,
    remoteCanvasId,
    setRemoteCanvasId,
    storageScope
  } = useCanvasStore();
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);
  const [selectedGroupKey, setSelectedGroupKey] = useState<GroupKey | null>(null);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [isOpinionModalOpen, setIsOpinionModalOpen] = useState(false);
  const [onboardingDismissedScope, setOnboardingDismissedScope] = useState<string | null>(null);
  const [advancedModeEnabled, setAdvancedModeEnabled] = useState<boolean>(() =>
    readAdvancedModeEnabled()
  );
  const [advancedFilter, setAdvancedFilter] = useState<AdvancedBlockFilter>("all");
  const [remoteSyncState, setRemoteSyncState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [remoteSyncError, setRemoteSyncError] = useState<string | null>(null);
  const metricsSessionIdRef = useRef<string>(createProductMetricsSessionId("canvas"));
  const metricsStartTrackedRef = useRef(false);
  const metricsCompletionTrackedRef = useRef(false);
  const metricsAbandonTrackedRef = useRef(false);
  const latestScoredBlocksRef = useRef(0);
  const latestHasContentRef = useRef(false);
  const lastSyncedFingerprintRef = useRef<string | null>(null);
  const initialRemoteCreateInFlightRef = useRef(false);
  const startupInputRef = useRef<HTMLInputElement>(null);

  const scores = useMemo(() => SRL_BLOCKS.map((block) => blocks[block.id]?.score ?? 0), [blocks]);
  const metrics = useMemo(() => calculateScoreMetrics(scores), [scores]);
  const canvasFingerprint = useMemo(() => JSON.stringify({ meta, blocks }), [meta, blocks]);
  const userId = user?.id ?? null;

  const completionLabel = `[ ${metrics.total} / ${MAX_SCORE} ]`;
  const editingBlock = editingBlockId ? SRL_BLOCKS_BY_ID[editingBlockId] : null;
  const selectedGroup = selectedGroupKey ? GROUP_BY_KEY[selectedGroupKey] : null;
  const onboardingCompleted =
    onboardingDismissedScope === storageScope || readOnboardingCompleted(storageScope);
  const metaValidation = validateCanvasMeta(meta);
  const hasGuideMetadata = Boolean(
    meta.startup.trim() && meta.evaluator.trim() && meta.date.trim()
  );
  const hasGuideBlockOne = typeof blocks[1]?.score === "number";
  const guideStep = !hasGuideMetadata ? 1 : !hasGuideBlockOne ? 2 : 3;
  const pendingBlocks = useMemo(
    () => SRL_BLOCKS.filter((block) => typeof blocks[block.id]?.score !== "number"),
    [blocks]
  );
  const scoredBlocks = useMemo(
    () => SRL_BLOCKS.filter((block) => typeof blocks[block.id]?.score === "number"),
    [blocks]
  );
  const visibleBlocks = useMemo(() => {
    if (!advancedModeEnabled || advancedFilter === "all") return SRL_BLOCKS;
    return advancedFilter === "pending" ? pendingBlocks : scoredBlocks;
  }, [advancedFilter, advancedModeEnabled, pendingBlocks, scoredBlocks]);

  useEffect(() => {
    latestScoredBlocksRef.current = scoredBlocks.length;
    latestHasContentRef.current = hasMeaningfulCanvasData({ meta, blocks });
  }, [blocks, meta, scoredBlocks.length]);

  useEffect(() => {
    if (metricsStartTrackedRef.current) return;
    trackProductMetricEvent("canvas_started", {
      sessionId: metricsSessionIdRef.current,
      scopeType: storageScope === GUEST_CANVAS_SCOPE ? "guest" : "authenticated",
      supabaseEnabled: isEnabled,
      advancedMode: advancedModeEnabled
    });
    metricsStartTrackedRef.current = true;
  }, [advancedModeEnabled, isEnabled, storageScope]);

  useEffect(() => {
    if (metricsCompletionTrackedRef.current) return;
    if (scoredBlocks.length < SRL_BLOCKS.length) return;

    trackProductMetricEvent("canvas_completed", {
      sessionId: metricsSessionIdRef.current,
      filledBlocks: scoredBlocks.length,
      completionPercent: Math.round(metrics.completion),
      advancedMode: advancedModeEnabled
    });
    metricsCompletionTrackedRef.current = true;
  }, [advancedModeEnabled, metrics.completion, scoredBlocks.length]);

  useEffect(() => {
    const sessionId = metricsSessionIdRef.current;
    return () => {
      if (metricsCompletionTrackedRef.current || metricsAbandonTrackedRef.current) return;
      if (!latestHasContentRef.current) return;

      const filledBlocks = latestScoredBlocksRef.current;
      trackProductMetricEvent("canvas_abandoned", {
        sessionId,
        filledBlocks,
        stage: getCanvasAbandonStage(filledBlocks)
      });
      metricsAbandonTrackedRef.current = true;
    };
  }, []);

  useEffect(() => {
    if (!isEnabled || !userId) return;
    if (!hasMeaningfulCanvasData({ meta, blocks })) return;
    if (canvasFingerprint === lastSyncedFingerprintRef.current) return;
    if (!remoteCanvasId && initialRemoteCreateInFlightRef.current) return;

    let isActive = true;

    const timer = window.setTimeout(() => {
      const isCreatingRemoteRecord = !remoteCanvasId;
      if (isCreatingRemoteRecord) {
        initialRemoteCreateInFlightRef.current = true;
      }
      const requestFingerprint = canvasFingerprint;
      setRemoteSyncState("saving");
      setRemoteSyncError(null);
      void saveCanvas({
        id: remoteCanvasId ?? undefined,
        userId,
        meta,
        blocks
      })
        .then((savedCanvas) => {
          if (!isActive) return;
          if (savedCanvas.id !== remoteCanvasId) {
            setRemoteCanvasId(savedCanvas.id);
          }
          lastSyncedFingerprintRef.current = requestFingerprint;
          setRemoteSyncState("saved");
        })
        .catch((error) => {
          if (!isActive) return;
          setRemoteSyncState("error");
          setRemoteSyncError(
            error instanceof Error ? error.message : "Falha ao sincronizar com banco."
          );
        })
        .finally(() => {
          if (isCreatingRemoteRecord) {
            initialRemoteCreateInFlightRef.current = false;
          }
        });
    }, 800);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [blocks, canvasFingerprint, isEnabled, meta, remoteCanvasId, setRemoteCanvasId, userId]);

  const handleReset = () => {
    const confirmed = window.confirm("Tem certeza que deseja limpar todo o canvas atual?");
    if (!confirmed) return;
    resetCanvas();
  };

  const toggleAdvancedMode = () => {
    const nextEnabled = !advancedModeEnabled;
    setAdvancedModeEnabled(nextEnabled);
    setAdvancedFilter("all");
    writeAdvancedModeEnabled(nextEnabled);
  };

  const openOpinionForm = () => {
    setIsOpinionModalOpen(true);
  };

  const openResults = () => {
    if (!onboardingCompleted && hasGuideMetadata && hasGuideBlockOne) {
      writeOnboardingCompleted(storageScope);
      setOnboardingDismissedScope(storageScope);
    }
    setIsResultsOpen(true);
  };

  const openNextPendingBlock = () => {
    const pending = pendingBlocks[0];
    if (pending) {
      setEditingBlockId(pending.id);
      return;
    }
    openResults();
  };

  const adjustBlockScore = (blockId: number, delta: -1 | 1) => {
    const currentScore = blocks[blockId]?.score;
    const nextScore = clampScore((currentScore ?? (delta > 0 ? 0 : 2)) + delta);
    updateBlock(blockId, { score: nextScore });
  };

  const saveAndOpenNextBlock = (
    blockId: number,
    value: { score: number | null; notes: string; evidence: string }
  ) => {
    updateBlock(blockId, value);
    const currentIndex = SRL_BLOCKS.findIndex((item) => item.id === blockId);
    const nextBlock = currentIndex >= 0 ? SRL_BLOCKS[currentIndex + 1] : null;
    setEditingBlockId(nextBlock ? nextBlock.id : null);
  };

  const skipOnboarding = () => {
    writeOnboardingCompleted(storageScope);
    setOnboardingDismissedScope(storageScope);
  };

  useEffect(() => {
    if (!advancedModeEnabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTextInputTarget(event.target)) return;

      const key = event.key.toLowerCase();
      if (key === "n") {
        event.preventDefault();
        const nextPending = pendingBlocks[0];
        if (nextPending) {
          setEditingBlockId(nextPending.id);
          return;
        }

        if (!onboardingCompleted && hasGuideMetadata && hasGuideBlockOne) {
          writeOnboardingCompleted(storageScope);
          setOnboardingDismissedScope(storageScope);
        }
        setIsResultsOpen(true);
        return;
      }

      if (key === "r") {
        event.preventDefault();
        if (!onboardingCompleted && hasGuideMetadata && hasGuideBlockOne) {
          writeOnboardingCompleted(storageScope);
          setOnboardingDismissedScope(storageScope);
        }
        setIsResultsOpen(true);
        return;
      }

      if (key === "f") {
        event.preventDefault();
        setAdvancedFilter((current) => {
          if (current === "all") return "pending";
          if (current === "pending") return "scored";
          return "all";
        });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    advancedModeEnabled,
    hasGuideBlockOne,
    hasGuideMetadata,
    onboardingCompleted,
    pendingBlocks,
    storageScope
  ]);

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light font-display dark:bg-background-dark">
      <header className="sticky top-0 z-10 flex h-16 items-center border-b border-zinc-200/80 bg-background-light/85 px-4 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-background-dark/85">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="flex h-12 w-12 items-center justify-center text-text-light-primary dark:text-text-dark-primary"
          aria-label="Ir para dashboard"
        >
          <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
        </button>

        <h1 className="flex-1 text-center text-lg font-bold tracking-tight text-text-light-primary dark:text-text-dark-primary">
          Meu SRL Canvas
        </h1>

        <div className="flex items-center">
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
          <button
            type="button"
            onClick={openResults}
            className="flex h-12 w-12 items-center justify-center text-text-light-primary dark:text-text-dark-primary"
            aria-label="Compartilhar ou exportar"
          >
            <span className="material-symbols-outlined text-2xl">ios_share</span>
          </button>
        </div>
      </header>

      <main className="flex-grow px-4 pb-28 pt-6">
        <div className="mb-6 rounded-xl border border-zinc-200/80 bg-card-light p-4 dark:border-zinc-800/80 dark:bg-card-dark">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
              Informacoes Gerais
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`rounded-lg border px-3 py-1 text-xs font-semibold transition ${
                  advancedModeEnabled
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-zinc-300 text-text-light-secondary hover:bg-zinc-100 dark:border-zinc-700 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
                }`}
                onClick={toggleAdvancedMode}
                aria-pressed={advancedModeEnabled}
              >
                Modo avancado {advancedModeEnabled ? "ativo" : "inativo"}
              </button>
              <button
                type="button"
                className="rounded-lg border border-zinc-300 px-3 py-1 text-xs font-semibold text-text-light-secondary hover:bg-zinc-100 dark:border-zinc-700 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
                onClick={handleReset}
              >
                Resetar Canvas
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="col-span-1">
              <span className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
                Startup
              </span>
              <input
                ref={startupInputRef}
                className="mt-1 block w-full rounded-md border-zinc-300 bg-zinc-50 p-2 text-sm text-text-light-primary shadow-sm focus:border-primary focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-text-dark-primary"
                type="text"
                placeholder="Nome da Startup"
                value={meta.startup}
                aria-invalid={!metaValidation.startupValid}
                onChange={(event) => setMeta({ startup: event.target.value })}
              />
            </label>

            <label className="col-span-1">
              <span className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
                Avaliador
              </span>
              <input
                className="mt-1 block w-full rounded-md border-zinc-300 bg-zinc-50 p-2 text-sm text-text-light-primary shadow-sm focus:border-primary focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-text-dark-primary"
                type="text"
                placeholder="Nome do Avaliador"
                value={meta.evaluator}
                aria-invalid={!metaValidation.evaluatorValid}
                onChange={(event) => setMeta({ evaluator: event.target.value })}
              />
            </label>

            <label className="col-span-1">
              <span className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
                Data
              </span>
              <input
                className="mt-1 block w-full rounded-md border-zinc-300 bg-zinc-50 p-2 text-sm text-text-light-primary shadow-sm focus:border-primary focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-text-dark-primary"
                type="date"
                value={meta.date}
                aria-invalid={!metaValidation.dateValid}
                onChange={(event) => setMeta({ date: event.target.value })}
              />
            </label>

            <div className="col-span-1">
              <span className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
                Total
              </span>
              <div className="mt-1 flex h-9 items-center rounded-md border border-zinc-300 bg-zinc-50 px-2 py-1 text-sm text-text-light-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-text-dark-primary">
                <span className="whitespace-nowrap font-mono text-xs">{completionLabel}</span>
                <div className="ml-2 h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, metrics.completion)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {!metaValidation.isValid && (
            <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
              Metadados incompletos: preencha Startup, Avaliador e Data valida para manter
              consistencia do diagnostico.
            </p>
          )}

          {isEnabled && user && (
            <p className="mt-3 text-xs text-text-light-secondary dark:text-text-dark-secondary">
              {remoteSyncState === "saving" && "Sincronizando com banco..."}
              {remoteSyncState === "saved" && "Sincronizado com banco."}
              {remoteSyncState === "error" &&
                (remoteSyncError ?? "Falha ao sincronizar com banco.")}
            </p>
          )}

          {advancedModeEnabled && (
            <div className="mt-3 rounded-lg border border-zinc-200/80 bg-zinc-50 p-3 text-xs text-text-light-secondary dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:text-text-dark-secondary">
              <p>
                Modo avancado: use <strong>N</strong> (proximo pendente), <strong>R</strong>{" "}
                (resultados) e <strong>F</strong> (alternar filtro).
              </p>
              <p className="mt-1">
                Pendentes: <strong>{pendingBlocks.length}</strong> | Pontuados:{" "}
                <strong>{scoredBlocks.length}</strong>
              </p>
            </div>
          )}

          {!onboardingCompleted && (
            <section className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-3 dark:border-primary/40 dark:bg-primary/10">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Primeira avaliacao guiada
                </p>
                <button
                  type="button"
                  onClick={skipOnboarding}
                  className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-semibold text-text-light-secondary hover:bg-zinc-100 dark:border-zinc-700 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
                >
                  Pular guia
                </button>
              </div>

              <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                Passo {guideStep} de 3: {guideStep === 1 && "preencha os metadados da avaliacao."}
                {guideStep === 2 && "registre a primeira nota no bloco 1."}
                {guideStep === 3 && "abra os resultados para fechar a jornada inicial."}
              </p>

              <ol className="mt-3 space-y-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                <li className={hasGuideMetadata ? "font-semibold text-primary" : ""}>
                  1. Preencher Startup, Avaliador e Data
                </li>
                <li className={hasGuideBlockOne ? "font-semibold text-primary" : ""}>
                  2. Avaliar o bloco 1 (Problema/Oportunidade)
                </li>
                <li className={guideStep === 3 ? "font-semibold text-primary" : ""}>
                  3. Abrir Ver Resultados
                </li>
              </ol>

              <div className="mt-3">
                {guideStep === 1 && (
                  <button
                    type="button"
                    onClick={() => startupInputRef.current?.focus()}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110"
                  >
                    Ir para metadados
                  </button>
                )}
                {guideStep === 2 && (
                  <button
                    type="button"
                    onClick={() => setEditingBlockId(1)}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110"
                  >
                    Abrir bloco 1
                  </button>
                )}
                {guideStep === 3 && (
                  <button
                    type="button"
                    onClick={openResults}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110"
                  >
                    Abrir resultados
                  </button>
                )}
              </div>
            </section>
          )}
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {advancedModeEnabled ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={openNextPendingBlock}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold text-text-light-secondary hover:bg-zinc-100 dark:border-zinc-700 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
              >
                Proximo pendente
              </button>

              <div className="inline-flex rounded-lg border border-zinc-300 p-0.5 dark:border-zinc-700">
                {[
                  { key: "all", label: "Todos" },
                  { key: "pending", label: "Pendentes" },
                  { key: "scored", label: "Pontuados" }
                ].map((filterOption) => (
                  <button
                    key={filterOption.key}
                    type="button"
                    onClick={() => setAdvancedFilter(filterOption.key as AdvancedBlockFilter)}
                    className={`rounded-md px-2 py-1 text-xs font-semibold transition ${
                      advancedFilter === filterOption.key
                        ? "bg-primary text-white"
                        : "text-text-light-secondary hover:bg-zinc-100 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
                    }`}
                  >
                    {filterOption.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={openResults}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
          >
            Ver Resultados
          </button>
        </div>

        <section>
          <div className="flex flex-col gap-4">
            {visibleBlocks.map((block) => {
              const group = GROUP_BY_KEY[block.group];
              const current = blocks[block.id];
              const hasScore = typeof current?.score === "number";

              return (
                <div
                  key={block.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card-light p-4 shadow-sm ring-1 ring-zinc-200/80 transition hover:-translate-y-0.5 hover:ring-primary/40 dark:bg-card-dark dark:ring-zinc-800/80"
                >
                  <button
                    type="button"
                    onClick={() => setEditingBlockId(block.id)}
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-4 text-left"
                  >
                    <div
                      className={`flex size-12 shrink-0 items-center justify-center rounded-lg ${group.iconBgClass}`}
                    >
                      <span className={`material-symbols-outlined text-2xl ${group.iconTextClass}`}>
                        {block.icon}
                      </span>
                    </div>

                    <div className="flex min-w-0 flex-col justify-center">
                      <p className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                        <span className={`font-bold ${group.badgeClass}`}>{block.id}.</span>{" "}
                        {block.name}
                      </p>
                      <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                        {hasScore ? `Nota: ${current.score}/9` : "Pendente"}
                      </p>
                    </div>
                  </button>

                  {advancedModeEnabled ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => adjustBlockScore(block.id, -1)}
                        disabled={!hasScore}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-300 text-text-light-secondary hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
                        aria-label={`Diminuir nota do bloco ${block.id}`}
                      >
                        <span className="material-symbols-outlined text-base" aria-hidden="true">
                          remove
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustBlockScore(block.id, 1)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-300 text-text-light-secondary hover:bg-zinc-100 dark:border-zinc-700 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
                        aria-label={`Aumentar nota do bloco ${block.id}`}
                      >
                        <span className="material-symbols-outlined text-base" aria-hidden="true">
                          add
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingBlockId(block.id)}
                        className="inline-flex h-8 items-center gap-1 rounded-md border border-zinc-300 px-2 text-xs font-semibold text-text-light-secondary hover:bg-zinc-100 dark:border-zinc-700 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
                      >
                        Detalhes
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingBlockId(block.id)}
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-zinc-300 px-2 text-xs font-semibold text-text-light-secondary hover:bg-zinc-100 dark:border-zinc-700 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
                    >
                      Abrir
                    </button>
                  )}
                </div>
              );
            })}

            {visibleBlocks.length === 0 && (
              <div className="rounded-xl border border-dashed border-zinc-300 p-4 text-center text-sm text-text-light-secondary dark:border-zinc-700 dark:text-text-dark-secondary">
                Nenhum bloco encontrado para o filtro selecionado.
              </div>
            )}
          </div>
        </section>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 px-2 text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
          {GROUPS.map((group) => (
            <button
              key={group.key}
              type="button"
              onClick={() => setSelectedGroupKey(group.key)}
              className="flex items-center gap-2 rounded-full border border-transparent px-2 py-1 transition hover:border-zinc-300 hover:bg-zinc-100/70 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/70"
              aria-label={`Ver detalhes do agrupamento ${group.name}`}
              title={`Ver detalhes de ${group.detailTitle}`}
            >
              <div className={`size-3 rounded-full ${group.dotClass}`} />
              <span>{group.name}</span>
            </button>
          ))}
        </div>
      </main>

      <FooterNav />

      {editingBlock && (
        <BlockEditModal
          block={editingBlock}
          value={blocks[editingBlock.id]}
          onClose={() => setEditingBlockId(null)}
          onSave={(value) => {
            updateBlock(editingBlock.id, value);
            setEditingBlockId(null);
          }}
          showSaveAndNext={advancedModeEnabled}
          onSaveAndNext={
            advancedModeEnabled
              ? (value) => saveAndOpenNextBlock(editingBlock.id, value)
              : undefined
          }
        />
      )}

      {isResultsOpen && (
        <ResultsModal
          darkMode={darkMode}
          metrics={metrics}
          scores={scores}
          onClose={() => setIsResultsOpen(false)}
        />
      )}

      {selectedGroup && (
        <GroupDetailsModal group={selectedGroup} onClose={() => setSelectedGroupKey(null)} />
      )}

      <ResearchOpinionModal
        isOpen={isOpinionModalOpen}
        nextPath="/canvas"
        onClose={() => setIsOpinionModalOpen(false)}
      />
    </div>
  );
}
