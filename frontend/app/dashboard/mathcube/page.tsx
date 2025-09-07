'use client'

import React, { useState, useEffect } from 'react'
import { 
  BookOpen, 
  Calculator, 
  Target, 
  Trophy, 
  Star, 
  Clock, 
  TrendingUp,
  Brain,
  Zap,
  Heart,
  Gamepad2,
  Play,
  Award,
  BarChart3,
  Medal,
  User
} from 'lucide-react'
import Link from 'next/link'

export default function MathCubePage() {
  const [currentLevel, setCurrentLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  
  // États pour les vraies données de la base de données
  const [userStats, setUserStats] = useState<any>(null)
  const [globalStats, setGlobalStats] = useState<any>(null)
  const [top10Players, setTop10Players] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userRanking, setUserRanking] = useState<number | null>(null)

  // Fonction pour charger les statistiques utilisateur
  const loadUserStats = async () => {
    try {
      const response = await fetch('/api/cubematch/user-stats', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setUserStats(data)
      }
    } catch (error) {
      console.error('Erreur chargement stats utilisateur:', error)
    }
  }

  // Fonction pour charger les statistiques globales
  const loadGlobalStats = async () => {
    try {
      const response = await fetch('/api/cubematch/stats', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setGlobalStats(data.data?.stats || null)
      }
    } catch (error) {
      console.error('Erreur chargement stats globales:', error)
    }
  }

  // Fonction pour charger le top 10
  const loadTop10 = async () => {
    try {
      const response = await fetch('/api/cubematch/global-leaderboard?limit=10', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const responseData = await response.json()
        
        if (responseData.success && responseData.data.leaderboard) {
          const top10 = responseData.data.leaderboard
          setTop10Players(top10)
          
          // Calculer le rang de l'utilisateur actuel
          const currentUser = await fetch('/api/auth/verify', {
            credentials: 'include'
          })
          if (currentUser.ok) {
            const userData = await currentUser.json()
            const userRank = top10.findIndex((player: any) => player.userId === userData.user?.id) + 1
            setUserRanking(userRank || null)
          }
        }
      } else {
        console.error('Erreur chargement leaderboard:', response.status)
      }
    } catch (error) {
      console.error('Erreur chargement top 10:', error)
    }
  }

  // Charger toutes les données au montage du composant
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true)
      await Promise.all([
        loadUserStats(),
        loadGlobalStats(),
        loadTop10()
      ])
      setLoading(false)
    }
    
    loadAllData()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6 lg:p-8">
      {/* Bande décorative en haut */}
      <div className="w-full h-2 sm:h-3 md:h-4 bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-500 rounded-full mb-4 sm:mb-6 md:mb-8 shadow-lg"></div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <div className="inline-flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xl">
              <Gamepad2 className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                CubeMatch
              </h1>
              <p className="text-gray-600 text-sm sm:text-base md:text-lg lg:text-xl">Le jeu de calcul le plus amusant !</p>
            </div>
          </div>
        </div>

        {/* Section CubeMatch avec photo et classement */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl border border-white/50 mb-6 sm:mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
            
            {/* Photo du jeu et description */}
            <div className="space-y-4 sm:space-y-6">
              <div className="relative">
                {/* Placeholder pour la photo du jeu */}
                <div className="w-full h-48 sm:h-64 md:h-80 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-xl sm:rounded-2xl flex items-center justify-center border-2 border-dashed border-emerald-300">
                  <div className="text-center p-4">
                    <Gamepad2 className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-emerald-500 mx-auto mb-3 sm:mb-4" />
                    <p className="text-emerald-600 font-semibold text-base sm:text-lg">Capture d'écran du jeu</p>
                    <p className="text-emerald-500 text-xs sm:text-sm">CubeMatch en action</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Comment jouer ?</h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs sm:text-sm font-bold">1</span>
                    </div>
                    <p className="text-gray-700 text-sm sm:text-base">Sélectionne des cases adjacentes pour former des calculs</p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs sm:text-sm font-bold">2</span>
                    </div>
                    <p className="text-gray-700 text-sm sm:text-base">Atteins la cible pour marquer des points</p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs sm:text-sm font-bold">3</span>
                    </div>
                    <p className="text-gray-700 text-sm sm:text-base">Plus tu vas vite, plus tu gagnes de points !</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tableau de classement */}
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 text-center">
                Classement Global
              </h3>
              
              {/* En-tête du tableau épuré */}
              <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                <div className="grid grid-cols-12 gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-gray-600">
                  <div className="col-span-2 text-center">Rang</div>
                  <div className="col-span-3 text-center">Pseudo</div>
                  <div className="col-span-4 text-center">Score</div>
                  <div className="col-span-3 text-center">Niveau</div>
                </div>
              </div>
              
              {loading ? (
                <div className="space-y-1">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="grid grid-cols-12 gap-1 sm:gap-2 p-2 bg-gray-50 rounded-lg animate-pulse">
                      <div className="col-span-2 h-4 sm:h-5 bg-gray-200 rounded"></div>
                      <div className="col-span-3 h-3 sm:h-4 bg-gray-200 rounded"></div>
                      <div className="col-span-4 h-3 sm:h-4 bg-gray-200 rounded"></div>
                      <div className="col-span-3 h-3 sm:h-4 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : top10Players.length > 0 ? (
                <div className="space-y-1">
                  {top10Players.slice(0, 10).map((player, index) => (
                    <div key={player.userId} className={`grid grid-cols-12 gap-1 sm:gap-2 items-center p-2 rounded-lg ${
                      index < 3 
                        ? 'bg-gray-100 border-l-4 border-yellow-400' 
                        : 'bg-white hover:bg-gray-50'
                    }`}>
                      {/* Rang simple */}
                      <div className="col-span-2 text-center">
                        {index < 3 ? (
                          <div className="text-xs sm:text-sm font-bold text-yellow-600">
                            {index === 0 ? '1er' : index === 1 ? '2ème' : '3ème'}
                          </div>
                        ) : (
                          <div className="text-xs sm:text-sm font-medium text-gray-600">
                            {player.rank}
                          </div>
                        )}
                      </div>
                      
                      {/* Session ID simple */}
                      <div className="col-span-3 text-center">
                        <div className="text-xs sm:text-sm font-medium text-gray-900 font-mono">
                          {player.sessionId || player.userId.slice(-6)}
                        </div>
                      </div>

                      {/* Score simple */}
                      <div className="col-span-4 text-center">
                        <div className="text-xs sm:text-sm font-semibold text-gray-900">
                          {player.score.toLocaleString()}
                        </div>
                      </div>
                      
                      {/* Niveau simple */}
                      <div className="col-span-3 text-center">
                        <div className="text-xs sm:text-sm font-medium text-gray-700">
                          {player.level || 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <Trophy className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mx-auto mb-2 sm:mb-3 text-gray-300" />
                  <p className="text-xs sm:text-sm">Aucun joueur pour le moment</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bouton de jeu principal */}
        <div className="text-center">
          <Link 
            href="/dashboard/mathcube/cubematch" 
            className="inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 md:px-10 lg:px-12 py-4 sm:py-5 md:py-6 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-xl sm:rounded-2xl font-bold text-lg sm:text-xl hover:from-emerald-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-xl"
          >
            <Play className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
            <span className="text-sm sm:text-base md:text-lg lg:text-xl">Jouer maintenant</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
