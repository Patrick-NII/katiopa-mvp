'use client'

/**
 * 🎯 Page de test pour CubeMatch New
 * 
 * Permet de tester la nouvelle version intégrée
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CubeMatchNew from '@/components/games/CubeMatchNew'

export default function CubeMatchNewPage() {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleClose = () => {
    router.push('/dashboard/mathcube')
  }

  const handleScoreSubmit = (score: number) => {
    console.log('Score final:', score)
  }

  // Rendu serveur
  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <div className="text-white text-2xl">Chargement...</div>
      </div>
    )
  }

  return (
    <CubeMatchNew
      onClose={handleClose}
      onScoreSubmit={handleScoreSubmit}
      userAge={6}
      preset="intermediate"
      isFullPage={true}
    />
  )
}
