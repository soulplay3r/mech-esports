"use client";

import { useEffect, useState } from "react";

/** null while loading, then whether the server has an Anthropic key configured. */
export function useCoachAvailable(): boolean | null {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/ai/status")
      .then((r) => r.json())
      .then((j: { enabled: boolean }) => !cancelled && setEnabled(Boolean(j.enabled)))
      .catch(() => !cancelled && setEnabled(false));
    return () => {
      cancelled = true;
    };
  }, []);
  return enabled;
}

export type CoachResponse<T> = { ok: true; data: T } | { ok: false; message: string };

/** POSTs to a coach route and normalises errors into a displayable message. */
export async function postCoach<T>(path: string, body: unknown): Promise<CoachResponse<T>> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return { ok: false, message: json?.error?.message ?? "The Engineering Coach is unavailable right now." };
    }
    return { ok: true, data: json as T };
  } catch {
    return { ok: false, message: "Couldn't reach the Engineering Coach. Check your connection and try again." };
  }
}
