"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import { useSessionStatus } from "@/hooks/useSessionStatus";
import { authAPI } from "@/lib/api";

export default function InactivityManager() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const logout = useCallback(async () => {
    try {
      // Signaler la déconnexion avant de se déconnecter
      if (currentSessionId) {
        try {
          await fetch('/api/sessions/status', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              sessionId: currentSessionId,
              isOnline: false
            })
          })
        } catch (error) {
          console.warn('Erreur lors de la mise à jour du statut de déconnexion:', error)
        }
      }
      
      await authAPI.logout();
    } catch {}
    try {
      localStorage.setItem("cubeai:auth", "logged_out:" + Date.now());
    } catch {}
    router.push("/login");
  }, [router, currentSessionId]);

  useEffect(() => {
    // Vérifie l'état d'auth et initialise le marqueur d'activité
    (async () => {
      try {
        const res = await authAPI.verify();
        if (res?.success && res.user) {
          setCurrentSessionId(res.user.sessionId);
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

