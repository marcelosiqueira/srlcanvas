import { beforeEach, describe, expect, it } from "vitest";
import {
  buildProductMetricsReport,
  clearProductMetricEvents,
  getCanvasAbandonStage,
  getProductMetricEvents,
  trackProductMetricEvent
} from "./productMetrics";

describe("productMetrics service", () => {
  beforeEach(() => {
    clearProductMetricEvents();
  });

  it("tracks events and builds completion report", () => {
    trackProductMetricEvent("canvas_started", {
      sessionId: "canvas-session-1",
      scopeType: "guest",
      supabaseEnabled: false,
      advancedMode: false
    });
    trackProductMetricEvent("canvas_completed", {
      sessionId: "canvas-session-1",
      filledBlocks: 12,
      completionPercent: 100,
      advancedMode: false
    });

    trackProductMetricEvent("survey_started", {
      sessionId: "survey-session-1",
      startedWithDraft: false
    });
    trackProductMetricEvent("survey_step_abandoned", {
      sessionId: "survey-session-1",
      stepKey: "dimensions_1_4",
      reason: "route_exit"
    });

    const report = buildProductMetricsReport();

    expect(report.canvas.started).toBe(1);
    expect(report.canvas.completed).toBe(1);
    expect(report.canvas.completionRate).toBe(100);
    expect(report.survey.started).toBe(1);
    expect(report.survey.abandoned).toBe(1);
    expect(report.survey.abandonedByStep.dimensions_1_4).toBe(1);
  });

  it("deduplicates repeated events in short window", () => {
    trackProductMetricEvent("survey_started", {
      sessionId: "survey-session-2",
      startedWithDraft: true
    });
    trackProductMetricEvent("survey_started", {
      sessionId: "survey-session-2",
      startedWithDraft: true
    });

    const events = getProductMetricEvents();
    expect(events).toHaveLength(1);
  });

  it("classifies canvas abandon stage by filled blocks", () => {
    expect(getCanvasAbandonStage(0)).toBe("metadata");
    expect(getCanvasAbandonStage(3)).toBe("early_blocks");
    expect(getCanvasAbandonStage(7)).toBe("mid_blocks");
    expect(getCanvasAbandonStage(10)).toBe("late_blocks");
  });
});
