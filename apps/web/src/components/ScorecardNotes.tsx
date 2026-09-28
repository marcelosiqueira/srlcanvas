import { NEGATIVE_SCORECARD_NOTE, SCORECARD_EXPERIMENTAL_NOTE } from "../utils/score";

interface ScorecardNotesProps {
  /** Scorecard consolidado; null quando a avaliação está incompleta. */
  riskScore: number | null;
  className?: string;
}

export function ScorecardNotes({
  riskScore,
  className = "text-xs text-ink-3"
}: ScorecardNotesProps) {
  if (riskScore === null) {
    return (
      <p className={className}>
        Total, média, desvio-padrão, CV e scorecard são calculados apenas quando os 12 blocos estão
        respondidos.
      </p>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      <p>{SCORECARD_EXPERIMENTAL_NOTE}</p>
      {riskScore < 0 && <p>{NEGATIVE_SCORECARD_NOTE}</p>}
    </div>
  );
}
