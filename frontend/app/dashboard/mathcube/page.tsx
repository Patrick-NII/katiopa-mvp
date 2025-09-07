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
  Medal
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
      const response = await fetch('/api/cubematch/scores?limit=10', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const allScores = await response.json()
        
        // Grouper par utilisateur et calculer le meilleur score
        const userBestScores: Record<string, { score: number, username: string, userId: string }> = {}
        
        allScores.forEach((score: any) => {
          const userId = score.userId
          if (!userBestScores[userId] || score.score > userBestScores[userId].score) {
            userBestScores[userId] = {
              score: score.score,
              username: score.username,
              userId: userId
            }
          }
        })
        
        // Trier par score décroissant et prendre le top 10
        const top10 = Object.values(userBestScores)
          .sort((a, b) => b.score - a.score)
          .slice(0, 10)
          .map((player, index) => ({
            ...player,
            rank: index + 1
          }))
        
        setTop10Players(top10)
        
        // Calculer le rang de l'utilisateur actuel
        const currentUser = await fetch('/api/auth/verify', {
          credentials: 'include'
        })
        if (currentUser.ok) {
          const userData = await currentUser.json()
          const userScore = userBestScores[userData.user?.id]
          if (userScore) {
            const userRank = top10.findIndex(player => player.userId === userData.user?.id) + 1
            setUserRanking(userRank || null)
          }
        }
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Bande décorative en haut */}
      <div className="w-full h-4 bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-500 rounded-full mb-8 shadow-lg"></div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-3xl flex items-center justify-center shadow-xl">
              <Gamepad2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                CubeMatch
              </h1>
              <p className="text-gray-600 text-xl">Le jeu de calcul le plus amusant !</p>
            </div>
          </div>
        </div>

        {/* Section CubeMatch avec photo et classement */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/50 mb-8">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            
            {/* Photo du jeu et description */}
            <div className="space-y-6">
              <div className="relative">
                {/* Placeholder pour la photo du jeu */}
                <div className="w-full h-80 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-emerald-300">
                  <div className="text-center">
                    <Gamepad2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                    <p className="text-emerald-600 font-semibold text-lg">Capture d'écran du jeu</p>
                    <p className="text-emerald-500 text-sm">CubeMatch en action</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900">Comment jouer ?</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">1</span>
                    </div>
                    <p className="text-gray-700">Sélectionne des cases adjacentes pour former des calculs</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">2</span>
                    </div>
                    <p className="text-gray-700">Atteins la cible pour marquer des points</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">3</span>
                    </div>
                    <p className="text-gray-700">Plus tu vas vite, plus tu gagnes de points !</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tableau de classement */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="w-8 h-8 text-yellow-500" />
                <h3 className="text-2xl font-bold text-gray-900">Classement des joueurs</h3>
              </div>
              
              {/* En-tête du tableau */}
              <div className="bg-gray-100 rounded-xl p-4">
                <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-700">
                  <div className="col-span-2 text-center">Rang</div>
                  <div className="col-span-3 text-center">Score</div>
                  <div className="col-span-2 text-center">Niveau</div>
                  <div className="col-span-5 text-center">Session ID</div>
                </div>
              </div>
              
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl animate-pulse">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </div>
                  ))}
                </div>
              ) : top10Players.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {top10Players.map((player, index) => (
                    <div key={player.userId} className={`grid grid-cols-12 gap-4 items-center p-4 rounded-xl transition-all duration-200 ${
                      index < 3 
                        ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 shadow-lg' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}>
                      {/* Rang */}
                      <div className="col-span-2 text-center">
                        {index < 3 ? (
                          <div className="flex flex-col items-center gap-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900' :
                              index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-700' :
                              'bg-gradient-to-r from-orange-400 to-orange-500 text-orange-900'
                            }`}>
                              <Medal className="w-5 h-5" />
                            </div>
                            <div className={`text-xs font-bold ${
                              index === 0 ? 'text-yellow-600' :
                              index === 1 ? 'text-gray-600' :
                              'text-orange-600'
                            }`}>
                              {index === 0 ? 'OR' : index === 1 ? 'ARGENT' : 'BRONZE'}
                            </div>
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mx-auto bg-gray-200 text-gray-600">
                            {player.rank}
                          </div>
                        )}
                      </div>
                      
                      {/* Score */}
                      <div className="col-span-3 text-center">
                        <div className="font-bold text-lg text-gray-900">
                          {player.score.toLocaleString()}
                        </div>
                      </div>
                      
                      {/* Niveau */}
                      <div className="col-span-2 text-center">
                        <div className="text-sm font-semibold text-gray-700">
                          {Math.floor(player.score / 100) + 1}
                        </div>
                      </div>
                      
                      {/* Session ID */}
                      <div className="col-span-5 text-center">
                        <div className="text-sm text-gray-500 font-mono">
                          {player.userId}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl">
                  <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">Aucun joueur pour le moment</p>
                  <p className="text-sm">Soyez le premier à jouer !</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bouton de jeu principal */}
        <div className="text-center">
          <Link 
            href="/dashboard/mathcube/cubematch" 
            className="inline-flex items-center gap-3 px-12 py-6 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-2xl font-bold text-xl hover:from-emerald-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-xl"
          >
            <Play className="w-8 h-8" />
            Jouer maintenant
          </Link>
        </div>
      </div>
    </div>
  )
}
