'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft,
  Home,
  RotateCcw,
  Settings,
  Trophy,
  Star,
  Clock,
  Target
} from 'lucide-react'
import { motion } from 'framer-motion'
import CubeMatchUnified from '@/components/games/CubeMatchUnified'
import { useAgeAdaptation } from '@/hooks/useAgeAdaptation'
import { authAPI } from '@/lib/api'

export default function CubeMatchPage() {
  const router = useRouter()
  const [userAge, setUserAge] = useState<number>(8)
  const [isClient, setIsClient] = useState(false)
  const [gameStats, setGameStats] = useState({
    gamesPlayed: 0,
    bestScore: 0,
    totalTime: 0,
    lastPlayed: null as Date | null
  })

  // Adaptation par âge
  const { adaptText, ui } = useAgeAdaptation({ age: userAge })

  // Chargement des données
  useEffect(() => {
    setIsClient(true)
    
    const loadData = async () => {
      try {
        // Charger l'âge de l'utilisateur
        const response = await authAPI.verify()
        if (response.success && (response.user as any)?.age) {
          setUserAge((response.user as any).age)
        }
        
        // Charger les statistiques du jeu
        const savedStats = localStorage.getItem('cubematch-progress')
        if (savedStats) {
          setGameStats(JSON.parse(savedStats))
        }
      } catch (error) {
        console.error('Erreur lors du chargement:', error)
      }
    }

    loadData()
  }, [])

  const handleGoBack = () => {
    router.push('/dashboard?tab=mathcube')
  }

  const handleGoHome = () => {
    router.push('/dashboard')
  }

  const handleRestart = () => {
    // La logique de restart sera gérée par le composant CubeMatchUnified
    window.location.reload()
  }

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-indigo-50/80 dark:from-gray-950/95 dark:via-slate-900/90 dark:to-indigo-950/95 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400"></div>
          <p className="text-blue-600 dark:text-blue-400 font-medium animate-pulse">Chargement de CubeMatch...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-indigo-50/80 dark:from-gray-950/95 dark:via-slate-900/90 dark:to-indigo-950/95">
      {/* Header de navigation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/30 sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Navigation gauche */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleGoBack}
                className="flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/70 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {adaptText({
                    simple: 'Retour',
                    intermediate: 'Retour aux jeux',
                    advanced: 'Retour à MathCube'
                  })}
                </span>
              </button>
              
              <button
                onClick={handleGoHome}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Accueil</span>
              </button>
            </div>

            {/* Titre central */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">CM</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {adaptText({
                  simple: 'CubeMatch',
                  intermediate: 'CubeMatch Pro',
                  advanced: 'CubeMatch Challenge'
                })}
              </h1>
            </div>

            {/* Actions droite */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRestart}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Redémarrer"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Restart</span>
              </button>
            </div>
          </div>

          {/* Stats rapides */}
          <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span>Meilleur: {gameStats.bestScore.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Target className="w-4 h-4 text-blue-500" />
              <span>Parties: {gameStats.gamesPlayed}</span>
            </div>
            {gameStats.totalTime > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4 text-green-500" />
                <span>Temps: {Math.round(gameStats.totalTime / 60)}min</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Contenu principal du jeu */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="h-[calc(100vh-120px)] overflow-hidden"
      >
        <CubeMatchUnified 
          onClose={handleGoBack}
          isFullPage={true}
        />
      </motion.div>
    </div>
  )
}

