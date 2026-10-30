import Link from "next/link";
import { Bot, Swords } from "lucide-react";
import { Logo } from "./logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Mech E-Sports home">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium">
          <Link href="/arena" className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground">
            <Swords className="size-4" /> Arena
          </Link>
          <Link href="/coach" className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground">
            <Bot className="size-4" /> Coach
          </Link>
        </nav>
      </div>
    </header>
  );
}
