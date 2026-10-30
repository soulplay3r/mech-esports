import type { BotProfile } from "@/types/bot";
import { cn } from "@/lib/utils/cn";

export function BotAvatar({ bot, size = "md", className }: { bot: BotProfile; size?: "sm" | "md" | "lg"; className?: string }) {
  const sizes = { sm: "size-8 text-xs", md: "size-11 text-sm", lg: "size-16 text-lg" };
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-lg bg-gradient-to-br font-display font-bold text-white ring-1 ring-white/15",
        bot.accent,
        sizes[size],
        className,
      )}
      aria-hidden
    >
      {bot.initials}
    </span>
  );
}

export function StudentAvatar({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizes = { sm: "size-8 text-xs", md: "size-11 text-sm", lg: "size-16 text-lg" };
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary to-blue-800 font-display font-bold text-white ring-2 ring-primary/60",
        sizes[size],
        className,
      )}
      aria-hidden
    >
      YOU
    </span>
  );
}
