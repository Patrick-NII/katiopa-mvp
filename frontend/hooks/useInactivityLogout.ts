"use client";

import { useCallback, useEffect, useRef } from "react";

type Options = {
  timeoutMs?: number;
  storageKey?: string;
  logoutKey?: string;
  onTimeout: () => void | Promise<void>;
};

const DEFAULT_TIMEOUT = 10 * 60 * 1000; // 10 minutes

export function useInactivityLogout({
  timeoutMs = DEFAULT_TIMEOUT,
  storageKey = "cubeai:lastActivity",
  logoutKey = "cubeai:logout",
  onTimeout,
}: Options) {
  const timerRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const setLastActivity = (ts: number) => {
    lastActivityRef.current = ts;
    try {
      localStorage.setItem(storageKey, String(ts));
    } catch {}
  };

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const scheduleTimer = useCallback(
    (delay?: number) => {
      clearTimer();
      const ms = typeof delay === "number" ? Math.max(0, delay) : timeoutMs;
      timerRef.current = window.setTimeout(async () => {
        try {
          // marqueur de logout cross‑onglets
          localStorage.setItem(logoutKey, String(Date.now()));
        } catch {}
        await onTimeout();
      }, ms) as unknown as number;
    },
    [onTimeout, timeoutMs, logoutKey]
  );

  const activity = useCallback(() => {
    const now = Date.now();
    setLastActivity(now);
    scheduleTimer();
  }, [scheduleTimer]);

  useEffect(() => {
    // Initialiser lastActivity si absent
    try {
      const stored = Number(localStorage.getItem(storageKey) || 0);
      const now = Date.now();
      if (!stored) {
        setLastActivity(now);
        scheduleTimer();
      } else {
        // si l'inactivité dépasse déjà le seuil, déclencher immédiatement
        const diff = now - stored;
        if (diff >= timeoutMs) {
          (async () => {
            try { localStorage.setItem(logoutKey, String(now)); } catch {}
            await onTimeout();
          })();
        } else {
          scheduleTimer(timeoutMs - diff);
        }
      }
    } catch {
      scheduleTimer();
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        // autre onglet a signalé de l'activité
        scheduleTimer();
      }
      if (e.key === logoutKey && e.newValue) {
        // autre onglet a déclenché le logout
        onTimeout();
      }
    };

    const onVis = () => activity();
    const onFocus = () => activity();

    const ev = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    ev.forEach((name) => document.addEventListener(name, activity, { passive: true }));
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("storage", onStorage);

    return () => {
      ev.forEach((name) => document.removeEventListener(name, activity));
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("storage", onStorage);
      clearTimer();
    };
  }, [activity, onTimeout, scheduleTimer, storageKey, timeoutMs, logoutKey]);
}

