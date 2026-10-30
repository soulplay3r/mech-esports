import { PlugZap } from "lucide-react";

export function CoachOffline({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex gap-3 rounded-lg border border-warning/30 bg-warning/5 p-4 text-sm">
      <PlugZap className="mt-0.5 size-5 shrink-0 text-warning" />
      <div>
        <div className="font-semibold text-warning">Engineering Coach offline</div>
        <p className="mt-1 text-muted-foreground">
          Claude features are disabled because no Anthropic API key is configured on this server.
          {!compact && " Matches, scoring and answer review work fully without it."}
        </p>
      </div>
    </div>
  );
}
