import { GROUP_BY_KEY, SRL_BLOCKS } from "../data/srlBlocks";
import type { CanvasBlockState } from "../types";

interface CanvasMuralViewProps {
  blockState: Record<number, CanvasBlockState>;
  onSelectBlock: (id: number) => void;
}

export function CanvasMuralView({ blockState, onSelectBlock }: CanvasMuralViewProps) {
  const blocks = [...SRL_BLOCKS].sort((a, b) => a.number - b.number);

  return (
    <div
      className="grid gap-[13px]"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}
    >
      {blocks.map((block) => {
        const group = GROUP_BY_KEY[block.group];
        const score = blockState[block.id]?.score ?? 0;

        return (
          <button
            key={block.id}
            type="button"
            onClick={() => onSelectBlock(block.id)}
            className="flex min-h-[148px] flex-col overflow-hidden rounded-card bg-surface p-0 text-left shadow"
          >
            <span
              className="flex items-center justify-between px-[14px] py-[11px]"
              style={{ backgroundColor: group.color, borderRadius: "14px 14px 0 0" }}
            >
              <span className="material-symbols-outlined text-xl text-white">{block.icon}</span>
              <span className="font-display text-[12px] font-bold text-white">P{block.number}</span>
            </span>

            <span className="flex flex-1 flex-col px-[15px] py-[13px]">
              <span className="font-display text-[14px] font-bold text-ink">{block.name}</span>
              <span className="mt-1 line-clamp-2 text-[11.5px] text-ink-3">{block.objective}</span>

              <span className="mt-auto flex items-center gap-2 pt-3">
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-inset">
                  <span
                    className="block h-full rounded-full transition-all"
                    style={{ width: `${(score / 9) * 100}%`, backgroundColor: group.color }}
                  />
                </span>
                <span className="font-mono text-[11.5px] text-ink-2">{score}/9</span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
