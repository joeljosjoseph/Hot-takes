"use client";

import { useEffect, useState } from "react";

// Seconds until the deadline, or null when there is no deadline
export function useSecondsLeft(phaseEndsAt: number | null): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 250);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  if (phaseEndsAt === null || now === null) return null;
  return Math.max(0, Math.ceil((phaseEndsAt - now) / 1000));
}
