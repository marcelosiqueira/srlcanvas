import { GROUPS } from "../data/srlBlocks";

interface BrandLockupProps {
  /** Usar sobre fundo escuro fixo (ex.: painel hero navy): "SRL" em branco e "CANVAS" em teal claro legível. */
  onDark?: boolean;
}

export function BrandLockup({ onDark = false }: BrandLockupProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-[34px] grid-cols-2 gap-[3px]">
        {GROUPS.map((group) => (
          <span
            key={group.key}
            className="rounded-[5px]"
            style={{ backgroundColor: group.color }}
          />
        ))}
      </div>
      <div className="leading-none">
        <p
          className={`font-display text-[20px] font-extrabold ${onDark ? "text-white" : "text-navy"}`}
        >
          SRL
        </p>
        <p
          className="font-display text-[10px] font-semibold tracking-[3.5px]"
          style={onDark ? { color: "#2DC7B6" } : undefined}
        >
          <span className={onDark ? undefined : "text-teal"}>CANVAS</span>
        </p>
      </div>
    </div>
  );
}
