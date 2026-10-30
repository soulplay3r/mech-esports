import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function OptionGroup<T extends string | number | boolean>({
  label,
  icon: Icon,
  value,
  options,
  onChange,
}: {
  label: string;
  icon: LucideIcon;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label}>
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </div>
      <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg border bg-surface-2 p-1">
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            onClick={() => onChange(o.value)}
            className={cn(
              "cursor-pointer rounded-md px-2 py-1.5 text-sm font-semibold transition",
              o.value === value ? "bg-primary text-white shadow-[0_0_16px_-4px_rgb(47_123_255/0.9)]" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
