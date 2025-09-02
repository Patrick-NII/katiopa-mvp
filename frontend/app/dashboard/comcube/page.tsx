'use client'

import React from 'react'
import ComCubeTab from '@/components/ComCubeTab'
import { authAPI } from '@/lib/api'

export default function ComCubePage() {
  // Récupérer les données utilisateur depuis le contexte ou les props
  // Pour l'instant, on utilise des valeurs par défaut
  const userType = 'PARENT' // Sera récupéré depuis le contexte
  const userSubscriptionType = 'FREE' // Sera récupéré depuis le contexte
  const firstName = 'Parent' // Sera récupéré depuis le contexte
  const lastName = 'Test' // Sera récupéré depuis le contexte

  return (
    <ComCubeTab
      userType={userType as 'CHILD' | 'PARENT'}
      userSubscriptionType={userSubscriptionType}
      firstName={firstName}
      lastName={lastName}
    />
  )
}
