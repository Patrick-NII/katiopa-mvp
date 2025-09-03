'use client'

import { useEffect } from 'react'
import { useSessionStatus } from '@/hooks/useSessionStatus'

interface SessionStatusManagerProps {
  sessionId: string
  onStatusChange?: (isOnline: boolean) => void
}

export default function SessionStatusManager({ sessionId, onStatusChange }: SessionStatusManagerProps) {
  const { status } = useSessionStatus({
    sessionId,
    onStatusChange: (newStatus) => {
      onStatusChange?.(newStatus.isOnline)
    }
  })

  // Ce composant est invisible et gère seulement les événements de statut
  return null
}
