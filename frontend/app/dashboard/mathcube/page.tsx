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
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  Classement Global
                </h3>
                <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  Top {top10Players.length} joueurs
                </div>
              </div>
              
              {/* En-tête du tableau avec design amélioré */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 shadow-sm">
                <div className="grid grid-cols-12 gap-2 text-sm font-bold text-gray-800">
                  <div className="col-span-2 text-center flex items-center justify-center gap-1">
                    <Award className="w-4 h-4 text-yellow-600" />
                    Rang
                  </div>
                  <div className="col-span-3 text-center flex items-center justify-center gap-1">
                    <User className="w-4 h-4 text-blue-600" />
                    Session
                  </div>
                  <div className="col-span-4 text-center flex items-center justify-center gap-1">
                    <Target className="w-4 h-4 text-green-600" />
                    Score
                  </div>
                  <div className="col-span-3 text-center flex items-center justify-center gap-1">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    Niveau
                  </div>
                </div>
              </div>
              
              {loading ? (
                <div className="space-y-1">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 p-2 bg-gray-50 rounded-lg animate-pulse">
                      <div className="col-span-2 h-5 bg-gray-200 rounded"></div>
                      <div className="col-span-3 h-4 bg-gray-200 rounded"></div>
                      <div className="col-span-4 h-4 bg-gray-200 rounded"></div>
                      <div className="col-span-3 h-4 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : top10Players.length > 0 ? (
                <div className="space-y-2">
                  {top10Players.slice(0, 10).map((player, index) => (
                    <div key={player.userId} className={`group grid grid-cols-12 gap-2 items-center p-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-sm ${
                      index < 3 
                        ? index === 0 
                          ? 'bg-gradient-to-r from-yellow-50 via-yellow-100 to-orange-50 border-2 border-yellow-300 shadow-lg' 
                          : index === 1
                          ? 'bg-gradient-to-r from-gray-50 via-gray-100 to-slate-50 border-2 border-gray-300 shadow-md'
                          : 'bg-gradient-to-r from-orange-50 via-orange-100 to-red-50 border-2 border-orange-300 shadow-md'
                        : 'bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 hover:shadow-md'
                    }`}>
                      {/* Rang avec design amélioré */}
                      <div className="col-span-2 text-center">
                        {index < 3 ? (
                          <div className="flex flex-col items-center gap-1">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shadow-lg ${
                              index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900' :
                              index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-700' :
                              'bg-gradient-to-r from-orange-400 to-orange-500 text-orange-900'
                            }`}>
                              <Medal className="w-4 h-4" />
                            </div>
                            <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              index === 0 ? 'bg-yellow-200 text-yellow-800' :
                              index === 1 ? 'bg-gray-200 text-gray-700' :
                              'bg-orange-200 text-orange-800'
                            }`}>
                              {index === 0 ? '🥇 OR' : index === 1 ? '🥈 ARGENT' : '🥉 BRONZE'}
                            </div>
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mx-auto bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-2 border-blue-200 shadow-sm">
                            {player.rank}
                          </div>
                        )}
                      </div>
                      
                      {/* Session ID avec style amélioré */}
                      <div className="col-span-3 text-center">
                        <div className="text-sm font-bold text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded-lg border">
                          {player.sessionId || player.userId.slice(-6)}
                        </div>
                      </div>
                      
                      {/* Score avec effet visuel */}
                      <div className="col-span-4 text-center">
                        <div className="font-bold text-lg bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          {player.score.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">points</div>
                      </div>
                      
                      {/* Niveau avec badge */}
                      <div className="col-span-3 text-center">
                        <div className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-bold border border-purple-200">
                          <TrendingUp className="w-3 h-3" />
                          Niv. {player.level || 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Aucun joueur pour le moment</p>
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
