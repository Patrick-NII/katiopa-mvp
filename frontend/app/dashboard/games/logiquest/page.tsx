'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Home, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

export default function LogiQuestPage() {
  const router = useRouter()

  const handleGoBack = () => {
    router.push('/dashboard?tab=mathcube')
  }

  const handleGoHome = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/80 via-red-50/60 to-pink-50/80 dark:from-gray-950/95 dark:via-orange-900/90 dark:to-red-950/95">
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
                className="flex items-center gap-2 px-3 py-2 bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/70 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Retour aux jeux</span>
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
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">LQ</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">LogiQuest</h1>
            </div>

            <div className="w-20"></div> {/* Spacer pour centrer le titre */}
          </div>
        </div>
      </motion.div>

      {/* Contenu principal */}
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-white/20 dark:border-gray-700/30">
            <div className="w-24 h-24 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-8">
              <span className="text-6xl">🧩</span>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              LogiQuest
            </h2>
            
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Développez votre logique et votre raisonnement ! 
              Résolvez des énigmes captivantes et des puzzles mathématiques stimulants.
            </p>
            
            <div className="flex items-center justify-center gap-2 text-orange-600 dark:text-orange-400 mb-8">
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">En développement</span>
              <Sparkles className="w-5 h-5" />
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Fonctionnalités prévues :
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• Énigmes de logique progressive</li>
                <li>• Puzzles de séquences et patterns</li>
                <li>• Défis de raisonnement déductif</li>
                <li>• Analyse des stratégies avec Bubix</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

