"use client";

import { useEffect, useState } from "react";

// Milliseconds until the deadline, or null when there is no deadline
export function useCountdown(phaseEndsAt: number | null): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 100);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  if (phaseEndsAt === null || now === null) return null;
  return Math.max(0, phaseEndsAt - now);
}
