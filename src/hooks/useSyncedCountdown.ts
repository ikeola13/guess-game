"use client";

import { useEffect, useState } from "react";

export function useSyncedCountdown(endsAt: number | null | undefined) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!endsAt) {
      setSecondsLeft(0);
      setIsExpired(false);
      return;
    }

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      setIsExpired(remaining <= 0);
    };

    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [endsAt]);

  return { secondsLeft, isExpired };
}
