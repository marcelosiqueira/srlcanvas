import { PRODUCT_METRICS_CONFIG } from "../config/productMetricsConfig";

export const PRODUCT_METRICS_STORAGE_KEY = "srl-product-metrics-v1";
const PRODUCT_METRICS_MAX_EVENTS = 2000;
const DEDUPE_WINDOW_MS = 1200;

export type ProductSurveyStepKey =
  | "triage"
  | "profile"
  | "dimensions_1_4"
  | "dimensions_5_8"
  | "dimensions_9_12"
  | "scale_and_sus"
  | "adoption_and_followup";

export type ProductMetricsEventName =
  | "canvas_started"
  | "canvas_completed"
  | "canvas_abandoned"
  | "survey_started"
  | "survey_step_viewed"
  | "survey_completed"
  | "survey_step_abandoned";

type CanvasAbandonStage = "metadata" | "early_blocks" | "mid_blocks" | "late_blocks";
type SurveyAbandonReason = "responder_depois" | "route_exit" | "page_unload";

interface BaseProductMetricsPayload {
  sessionId: string;
}

interface ProductMetricsPayloadMap {
  canvas_started: BaseProductMetricsPayload & {
    scopeType: "guest" | "authenticated";
    supabaseEnabled: boolean;
    advancedMode: boolean;
  };
  canvas_completed: BaseProductMetricsPayload & {
    filledBlocks: number;
    completionPercent: number;
    advancedMode: boolean;
  };
  canvas_abandoned: BaseProductMetricsPayload & {
    filledBlocks: number;
    stage: CanvasAbandonStage;
  };
  survey_started: BaseProductMetricsPayload & {
    startedWithDraft: boolean;
  };
  survey_step_viewed: BaseProductMetricsPayload & {
    stepKey: ProductSurveyStepKey;
    stepIndex: number;
    stepCount: number;
  };
  survey_completed: BaseProductMetricsPayload & {
    eligible: boolean;
    stepCount: number;
    completionSeconds: number | null;
    storage: "supabase" | "local";
  };
  survey_step_abandoned: BaseProductMetricsPayload & {
    stepKey: ProductSurveyStepKey;
    reason: SurveyAbandonReason;
  };
}

export interface ProductMetricsEvent<N extends ProductMetricsEventName = ProductMetricsEventName> {
  id: string;
  name: N;
  timestamp: string;
  payload: ProductMetricsPayloadMap[N];
}

export interface ProductMetricsReport {
  generatedAt: string;
  totalEvents: number;
  canvas: {
    started: number;
    completed: number;
    abandoned: number;
    completionRate: number;
  };
  survey: {
    started: number;
    completed: number;
    abandoned: number;
    completionRate: number;
    abandonedByStep: Record<ProductSurveyStepKey, number>;
  };
}

export const PRODUCT_METRICS_EVENT_DICTIONARY: Record<
  ProductMetricsEventName,
  {
    description: string;
    payloadFields: string[];
  }
> = {
  canvas_started: {
    description: "Inicio de sessao de avaliacao no canvas.",
    payloadFields: ["sessionId", "scopeType", "supabaseEnabled", "advancedMode"]
  },
  canvas_completed: {
    description: "Conclusao de avaliacao com 12 blocos pontuados.",
    payloadFields: ["sessionId", "filledBlocks", "completionPercent", "advancedMode"]
  },
  canvas_abandoned: {
    description: "Saida do canvas sem concluir 12 blocos.",
    payloadFields: ["sessionId", "filledBlocks", "stage"]
  },
  survey_started: {
    description: "Inicio de sessao da survey academica.",
    payloadFields: ["sessionId", "startedWithDraft"]
  },
  survey_step_viewed: {
    description: "Visualizacao de etapa da survey.",
    payloadFields: ["sessionId", "stepKey", "stepIndex", "stepCount"]
  },
  survey_completed: {
    description: "Envio concluido da survey academica.",
    payloadFields: ["sessionId", "eligible", "stepCount", "completionSeconds", "storage"]
  },
  survey_step_abandoned: {
    description: "Abandono da survey na etapa corrente.",
    payloadFields: ["sessionId", "stepKey", "reason"]
  }
};

export function createProductMetricsSessionId(prefix: "canvas" | "survey"): string {
  const randomPart =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 11);

  return `${prefix}_${randomPart}`;
}

function createMetricEventId(): string {
  const randomPart =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 11);
  return `evt_${randomPart}`;
}

export function getCanvasAbandonStage(filledBlocks: number): CanvasAbandonStage {
  if (filledBlocks <= 0) return "metadata";
  if (filledBlocks <= 4) return "early_blocks";
  if (filledBlocks <= 8) return "mid_blocks";
  return "late_blocks";
}

function parseStoredEvents(raw: string | null): ProductMetricsEvent[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is ProductMetricsEvent => {
      if (typeof item !== "object" || item === null) return false;
      const record = item as Record<string, unknown>;
      return (
        typeof record.id === "string" &&
        typeof record.name === "string" &&
        typeof record.timestamp === "string" &&
        typeof record.payload === "object" &&
        record.payload !== null
      );
    });
  } catch {
    return [];
  }
}

function readEvents(): ProductMetricsEvent[] {
  if (typeof window === "undefined") return [];
  return parseStoredEvents(window.localStorage.getItem(PRODUCT_METRICS_STORAGE_KEY));
}

function writeEvents(events: ProductMetricsEvent[]): void {
  if (typeof window === "undefined") return;
  const trimmed = events.slice(-PRODUCT_METRICS_MAX_EVENTS);
  window.localStorage.setItem(PRODUCT_METRICS_STORAGE_KEY, JSON.stringify(trimmed));
}

function hasDuplicateWithinWindow(
  existingEvents: ProductMetricsEvent[],
  candidate: ProductMetricsEvent
): boolean {
  const lastEvent = existingEvents[existingEvents.length - 1];
  if (!lastEvent) return false;
  if (lastEvent.name !== candidate.name) return false;

  const lastPayload = lastEvent.payload as BaseProductMetricsPayload;
  const candidatePayload = candidate.payload as BaseProductMetricsPayload;
  if (lastPayload.sessionId !== candidatePayload.sessionId) return false;
  if (JSON.stringify(lastEvent.payload) !== JSON.stringify(candidate.payload)) return false;

  const lastTime = new Date(lastEvent.timestamp).getTime();
  const candidateTime = new Date(candidate.timestamp).getTime();
  if (Number.isNaN(lastTime) || Number.isNaN(candidateTime)) return false;

  return candidateTime - lastTime <= DEDUPE_WINDOW_MS;
}

export function trackProductMetricEvent<N extends ProductMetricsEventName>(
  name: N,
  payload: ProductMetricsPayloadMap[N]
): void {
  if (!PRODUCT_METRICS_CONFIG.enabled) return;
  if (typeof window === "undefined") return;

  const nowIso = new Date().toISOString();
  const nextEvent: ProductMetricsEvent<N> = {
    id: createMetricEventId(),
    name,
    timestamp: nowIso,
    payload
  };

  const events = readEvents();
  if (hasDuplicateWithinWindow(events, nextEvent)) return;

  events.push(nextEvent);
  writeEvents(events);
}

export function getProductMetricEvents(): ProductMetricsEvent[] {
  return readEvents();
}

export function clearProductMetricEvents(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PRODUCT_METRICS_STORAGE_KEY);
}

function toCompletionRate(started: number, completed: number): number {
  if (started <= 0) return 0;
  return Number(((completed / started) * 100).toFixed(1));
}

function countUniqueSessionsByEventName(
  events: ProductMetricsEvent[],
  eventName: ProductMetricsEventName
): number {
  return new Set(
    events
      .filter((event) => event.name === eventName)
      .map((event) => (event.payload as BaseProductMetricsPayload).sessionId)
  ).size;
}

function makeEmptyAbandonedByStep(): Record<ProductSurveyStepKey, number> {
  return {
    triage: 0,
    profile: 0,
    dimensions_1_4: 0,
    dimensions_5_8: 0,
    dimensions_9_12: 0,
    scale_and_sus: 0,
    adoption_and_followup: 0
  };
}

export function buildProductMetricsReport(
  eventsInput: ProductMetricsEvent[] = getProductMetricEvents()
): ProductMetricsReport {
  const canvasStarted = countUniqueSessionsByEventName(eventsInput, "canvas_started");
  const canvasCompleted = countUniqueSessionsByEventName(eventsInput, "canvas_completed");
  const canvasAbandoned = countUniqueSessionsByEventName(eventsInput, "canvas_abandoned");

  const surveyStarted = countUniqueSessionsByEventName(eventsInput, "survey_started");
  const surveyCompleted = countUniqueSessionsByEventName(eventsInput, "survey_completed");
  const surveyAbandoned = countUniqueSessionsByEventName(eventsInput, "survey_step_abandoned");

  const abandonedByStep = makeEmptyAbandonedByStep();
  for (const event of eventsInput) {
    if (event.name !== "survey_step_abandoned") continue;
    const stepKey = (event.payload as ProductMetricsPayloadMap["survey_step_abandoned"]).stepKey;
    abandonedByStep[stepKey] += 1;
  }

  return {
    generatedAt: new Date().toISOString(),
    totalEvents: eventsInput.length,
    canvas: {
      started: canvasStarted,
      completed: canvasCompleted,
      abandoned: canvasAbandoned,
      completionRate: toCompletionRate(canvasStarted, canvasCompleted)
    },
    survey: {
      started: surveyStarted,
      completed: surveyCompleted,
      abandoned: surveyAbandoned,
      completionRate: toCompletionRate(surveyStarted, surveyCompleted),
      abandonedByStep
    }
  };
}
