import { GROUPS, SRL_BLOCKS } from "../data/srlBlocks";
import type { CanvasBlockState } from "../types";
import { withAlpha } from "../utils/color";

interface CanvasListViewProps {
  blockState: Record<number, CanvasBlockState>;
  onSelectBlock: (id: number) => void;
}

export function CanvasListView({ blockState, onSelectBlock }: CanvasListViewProps) {
  return (
    <div className="flex flex-col gap-6">
      {GROUPS.map((group) => {
        const blocks = SRL_BLOCKS.filter((block) => block.group === group.key).sort(
          (a, b) => a.number - b.number
        );

        return (
          <section key={group.key}>
            <div className="mb-3 flex items-center gap-3">
              <span
                className="block h-[34px] w-[5px] rounded-full"
                style={{ backgroundColor: group.color }}
              />
              <div>
                <h3 className="font-display text-[13.5px] font-bold" style={{ color: group.color }}>
                  {group.name}
                </h3>
                <p className="text-[11.5px] text-ink-3">{group.subtitle}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {blocks.map((block) => {
                const current = blockState[block.id];
                const hasScore = typeof current?.score === "number";

                return (
                  <button
                    key={block.id}
                    type="button"
                    onClick={() => onSelectBlock(block.id)}
                    className="flex w-full items-center gap-4 rounded-card border border-stroke bg-surface px-[17px] py-[15px] text-left shadow-sm transition hover:-translate-y-0.5"
                  >
                    <span
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: withAlpha(group.color, 0.12) }}
                    >
                      <span
                        className="material-symbols-outlined text-2xl"
                        style={{ color: group.color }}
                      >
                        {block.icon}
                      </span>
                    </span>

                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="font-display text-[14.5px] font-bold text-ink">
                        <span style={{ color: group.color }}>{block.number}.</span> {block.name}
                      </span>
                      <span className="truncate text-[12.5px] text-ink-2">{block.objective}</span>
                    </span>

                    <span
                      className="shrink-0 rounded-full px-3 py-1 text-[12px] font-semibold"
                      style={
                        hasScore
                          ? { backgroundColor: group.color, color: "#ffffff" }
                          : {
                              border: `1px solid ${withAlpha(group.color, 0.4)}`,
                              color: group.color
                            }
                      }
                    >
                      {hasScore ? `Nível ${current.score}` : "Pendente"}
                    </span>
                    <span className="material-symbols-outlined shrink-0 text-ink-3">
                      chevron_right
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
