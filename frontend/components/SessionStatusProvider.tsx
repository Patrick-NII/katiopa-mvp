'use client'

import { useEffect } from 'react'
import { useSessionStatus } from '@/hooks/useSessionStatus'

interface SessionStatusProviderProps {
  sessionId: string
  children: React.ReactNode
}

export default function SessionStatusProvider({ sessionId, children }: SessionStatusProviderProps) {
  const { signalDisconnect } = useSessionStatus({
    sessionId,
    onStatusChange: (newStatus) => {
      console.log(`Statut de la session ${sessionId} changé:`, newStatus.isOnline ? 'en ligne' : 'hors ligne')
    }
  })

  // Gérer les événements de déconnexion globaux
  useEffect(() => {
    const handleBeforeUnload = () => {
      signalDisconnect()
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        signalDisconnect()
      }
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cubeai:auth' && e.newValue?.includes('logged_out')) {
        signalDisconnect()
      }
    }

    // Écouter les événements de déconnexion
    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [signalDisconnect])

  return <>{children}</>
}
