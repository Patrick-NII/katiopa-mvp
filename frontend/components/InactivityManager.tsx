"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import { authAPI } from "@/lib/api";

export default function InactivityManager() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {}
    try {
      localStorage.setItem("cubeai:auth", "logged_out:" + Date.now());
    } catch {}
    router.push("/login");
  }, [router]);

  useEffect(() => {
    // Vérifie l'état d'auth et initialise le marqueur d'activité
    (async () => {
      try {
        const res = await authAPI.verify();
        if (res?.success) {
          localStorage.setItem("cubeai:auth", "logged_in:" + Date.now());
          localStorage.setItem("cubeai:lastActivity", String(Date.now()));
        }
      } catch {}
      setReady(true);
    })();
  }, []);

  useInactivityLogout({ timeoutMs: 10 * 60 * 1000, onTimeout: logout });

  // Composant invisible
  return null;
}

