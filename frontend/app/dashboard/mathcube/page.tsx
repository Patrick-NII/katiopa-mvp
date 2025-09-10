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
  User,
  ThumbsUp,
  Share2,
  MessageCircle,
  Send,
  Eye,
  Download
} from 'lucide-react'
import Link from 'next/link'
import { useModals } from '@/hooks/useModals'
import Image from 'next/image'

interface MathCubePageProps {
  onOpenCubeMatch?: () => void
}

export default function MathCubePage({ onOpenCubeMatch }: MathCubePageProps = {}) {
  const [currentLevel, setCurrentLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  
  // États pour les vraies données de la base de données
  const [userStats, setUserStats] = useState<any>(null)
  const [globalStats, setGlobalStats] = useState<any>(null)
  const [top10Players, setTop10Players] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userRanking, setUserRanking] = useState<number | null>(null)
  
  // États pour les fonctionnalités sociales
  const [likes, setLikes] = useState(42)
  const [isLiked, setIsLiked] = useState(false)
  const [shares, setShares] = useState(8)
  const [views, setViews] = useState(156)
  const [gamesPlayed, setGamesPlayed] = useState(23)
  const [comments, setComments] = useState([
    {
      id: 1,
      author: "Milan",
      avatar: "M",
      content: "Super jeu ! J'adore les défis mathématiques 🎮",
      timestamp: "2h",
      likes: 3
    },
    {
      id: 2,
      author: "Sophie",
      avatar: "S", 
      content: "Parfait pour entraîner le calcul mental avec mes élèves",
      timestamp: "5h",
      likes: 1
    }
  ])
  const [newComment, setNewComment] = useState("")
  const [showInstructionsModal, setShowInstructionsModal] = useState(false)

  // Hook pour les modals (fallback si pas de props)
  const { openCubeMatchModal, openMemoryGameModal } = useModals()
  
  // Fonction pour ouvrir CubeMatch (props ou fallback)
  const handleOpenCubeMatch = () => {
    if (onOpenCubeMatch) {
      onOpenCubeMatch()
    } else {
      // Rediriger vers la page CubeMatch directe
      window.location.href = '/dashboard/mathcube/cubematch'
    }
  }
  
  // Fonction pour ouvrir Memory Game
  const handleOpenMemoryGame = () => {
    openMemoryGameModal()
  }
  
  // Fonctions pour les interactions sociales
  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikes(prev => isLiked ? prev - 1 : prev + 1)
  }
  
  const handleShare = () => {
    setShares(prev => prev + 1)
    // Ici on pourrait ajouter la logique de partage réel
    if (navigator.share) {
      navigator.share({
        title: 'CubeMatch - Jeu de Calcul',
        text: 'Découvre ce super jeu de calcul mental !',
        url: window.location.href
      })
    } else {
      // Fallback : copier le lien
      navigator.clipboard.writeText(window.location.href)
    }
  }
  
  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment = {
        id: comments.length + 1,
        author: "Vous",
        avatar: "V",
        content: newComment.trim(),
        timestamp: "maintenant",
        likes: 0
      }
      setComments(prev => [comment, ...prev])
      setNewComment("")
    }
  }
  
  const handleCommentLike = (commentId: number) => {
    setComments(prev => prev.map(comment => 
      comment.id === commentId 
        ? { ...comment, likes: comment.likes + 1 }
        : comment
    ))
  }

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
    <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden">
      <div className="h-full overflow-y-auto p-4 md:p-5 lg:p-6">
        
        {/* Contenu principal */}
        <div className="max-w-7xl mx-auto">
          {/* En-tête MathCube */}
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <div className="inline-flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xl">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  MathCube
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base md:text-lg lg:text-xl">Mathématiques rigoureuses</p>
              </div>
            </div>
          </div>

          {/* Section principale avec image et bouton play */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl border border-white/50 dark:border-gray-700/50 mb-6 sm:mb-8">
            {/* Titre du jeu */}
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                CubeMatch
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base md:text-lg mt-2">
                Le jeu de calcul le plus amusant !
              </p>
            </div>
            
            {/* Image du jeu avec bouton play centré */}
            <div className="relative mb-4">
              <div className="w-full h-64 sm:h-80 md:h-96 relative rounded-xl overflow-hidden">
                <Image
                  src="/cubematch/image1.png"
                  alt="CubeMatch Game Screenshot"
                  fill
                  className="object-cover"
                  priority
                />
                {/* Bouton play centré sur l'image */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={handleOpenCubeMatch}
                    className="w-16 h-16 sm:w-20 sm:h-20 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-300 backdrop-blur-sm"
                  >
                    <Play className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600 dark:text-emerald-400" fill="currentColor" />
                  </button>
                </div>
              </div>
            </div>

            {/* Engagements sur une seule ligne - Style réseaux sociaux */}
            <div className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-4">
              <div className="flex items-center gap-6">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 transition-all duration-200 ${
                    isLiked 
                      ? 'text-red-500 dark:text-red-400' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400'
                  }`}
                >
                  <ThumbsUp className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} />
                  <span className="text-sm font-medium">{likes}</span>
                </button>
                
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  <span className="text-sm font-medium">{shares}</span>
                </button>
                
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">{comments.length}</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Eye className="w-5 h-5" />
                  <span className="text-sm font-medium">{views}</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Gamepad2 className="w-5 h-5" />
                  <span className="text-sm font-medium">{gamesPlayed}</span>
                </div>
              </div>
              
              {/* Bouton mode d'emploi */}
              <button
                onClick={() => setShowInstructionsModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">Mode d'emploi</span>
              </button>
            </div>

            {/* Layout principal avec commentaires et classement */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Commentaires - Colonne principale */}
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Commentaires</h4>
                  
                  {/* Ajouter un commentaire */}
                  <div className="mb-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Ajouter un commentaire..."
                        className="flex-1 p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                      />
                      <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                        className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Liste des commentaires */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {comment.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-gray-900 dark:text-white">{comment.author}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{comment.timestamp}</span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{comment.content}</p>
                          <button
                            onClick={() => handleCommentLike(comment.id)}
                            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <ThumbsUp className="w-3 h-3" />
                            <span>{comment.likes}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Classement - Colonne droite */}
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Classement</h3>
                  
                  {/* En-tête du tableau */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 mb-3">
                    <div className="grid grid-cols-12 gap-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                      <div className="col-span-3 text-center">Rang</div>
                      <div className="col-span-5 text-center">Pseudo</div>
                      <div className="col-span-4 text-center">Score</div>
                    </div>
                  </div>
                  
                  {/* Corps du tableau */}
                  <div className="space-y-1">
                    {loading ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="grid grid-cols-12 gap-1 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg animate-pulse">
                          <div className="col-span-3 h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                          <div className="col-span-5 h-3 bg-gray-200 dark:bg-gray-600 rounded"></div>
                          <div className="col-span-4 h-3 bg-gray-200 dark:bg-gray-600 rounded"></div>
                        </div>
                      ))
                    ) : top10Players.length > 0 ? (
                      top10Players.slice(0, 5).map((player: any, index: number) => (
                        <div key={player.userId} className="grid grid-cols-12 gap-1 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                          <div className="col-span-3 text-center">
                            <div className="text-xs font-bold text-gray-700 dark:text-gray-300">
                              {index + 1}
                            </div>
                          </div>
                          <div className="col-span-5 text-center">
                            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                              {player.sessionId || player.userId.slice(-6)}
                            </div>
                          </div>
                          <div className="col-span-4 text-center">
                            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              {player.score?.toLocaleString() || 'N/A'}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <Trophy className="w-6 h-6 mx-auto mb-2 text-gray-300 dark:text-gray-500" />
                        <p className="text-xs">Aucun joueur</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
