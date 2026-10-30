import { Cog } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2 font-display text-lg font-bold uppercase tracking-[0.18em]", className)}>
      <span className="grid size-7 place-items-center rounded-md bg-gradient-to-br from-primary to-accent text-background shadow-[0_0_18px_-2px_rgb(34_211_238/0.7)]">
        <Cog className="size-4" strokeWidth={2.5} />
      </span>
      <span>
        Mech <span className="text-accent">E-Sports</span>
      </span>
    </span>
  );
}
