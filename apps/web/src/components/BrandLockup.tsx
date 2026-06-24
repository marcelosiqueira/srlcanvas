import { GROUPS } from "../data/srlBlocks";

export function BrandLockup() {
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
        <p className="font-display text-[20px] font-extrabold text-navy">SRL</p>
        <p className="font-display text-[10px] font-semibold tracking-[3.5px] text-teal">CANVAS</p>
      </div>
    </div>
  );
}
