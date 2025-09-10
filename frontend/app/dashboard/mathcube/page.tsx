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
  const [likes, setLikes] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [shares, setShares] = useState(0)
  const [views, setViews] = useState(0)
  const [gamesPlayed, setGamesPlayed] = useState(0)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
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
  
  // Fonction pour obtenir l'ID utilisateur actuel
  const getCurrentUserId = async () => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        return data.user?.id || data.sessionId
      }
    } catch (error) {
      console.error('Error getting current user:', error)
    }
    return null
  }

  // Fonction pour charger les données sociales
  const loadSocialData = async () => {
    try {
      const userId = await getCurrentUserId()
      if (!userId) return

      setCurrentUserId(userId)

      // Charger les statistiques générales
      const statsResponse = await fetch('/api/cubematch/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        if (statsData.success) {
          setLikes(statsData.data.likes)
          setShares(statsData.data.shares)
          setViews(statsData.data.views)
          setGamesPlayed(statsData.data.gamesPlayed)
        }
      }

      // Charger les likes de l'utilisateur
      const likesResponse = await fetch('/api/cubematch/likes')
      if (likesResponse.ok) {
        const likesData = await likesResponse.json()
        if (likesData.success) {
          const userLiked = likesData.data.likes.some((like: any) => like.userId === userId)
          setIsLiked(userLiked)
        }
      }

      // Charger les commentaires
      const commentsResponse = await fetch('/api/cubematch/comments')
      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json()
        if (commentsData.success) {
          setComments(commentsData.data)
        }
      }

      // Charger le classement
      const rankingResponse = await fetch('/api/cubematch/ranking')
      if (rankingResponse.ok) {
        const rankingData = await rankingResponse.json()
        if (rankingData.success) {
          setTop10Players(rankingData.data)
        }
      }

      // Enregistrer la vue
      await fetch('/api/cubematch/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'view' })
      })

    } catch (error) {
      console.error('Error loading social data:', error)
    }
  }

  // Fonctions pour les interactions sociales
  const handleLike = async () => {
    if (!currentUserId) return

    try {
      const response = await fetch('/api/cubematch/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setIsLiked(data.data.liked)
          setLikes(data.data.totalLikes)
        }
      }
    } catch (error) {
      console.error('Error handling like:', error)
    }
  }
  
  const handleShare = async () => {
    if (!currentUserId) return

    try {
      // Enregistrer le partage
      await fetch('/api/cubematch/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, action: 'share' })
      })

      setShares(prev => prev + 1)

      // Partager via l'API native si disponible
      if (navigator.share) {
        navigator.share({
          title: 'CubeMatch - Jeu de Calcul',
          text: 'Découvre ce super jeu de calcul mental !',
          url: window.location.href
        })
      } else {
        // Fallback: copier le lien
        navigator.clipboard.writeText(window.location.href)
        alert('Lien copié dans le presse-papiers !')
      }
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }
  
  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUserId) return

    try {
      const response = await fetch('/api/cubematch/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: currentUserId, 
          content: newComment.trim() 
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setComments(prev => [data.data, ...prev])
          setNewComment('')
        }
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }
  
  const handleCommentLike = async (commentId: string) => {
    if (!currentUserId) return

    try {
      const response = await fetch('/api/cubematch/comments/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: currentUserId, 
          commentId 
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setComments(prev => prev.map(comment => 
            comment.id === commentId 
              ? { ...comment, likes: data.data.liked ? comment.likes + 1 : comment.likes - 1 }
              : comment
          ))
        }
      }
    } catch (error) {
      console.error('Error liking comment:', error)
    }
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
        loadTop10(),
        loadSocialData()
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
              
              {/* Logo help */}
              <button
                onClick={() => setShowInstructionsModal(true)}
                className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                title="Mode d'emploi"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
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

      {/* Modal Mode d'emploi */}
      {showInstructionsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* En-tête du modal */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Mode d'emploi CubeMatch</h2>
                    <p className="text-blue-100">Règles et instructions du jeu</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInstructionsModal(false)}
                  className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contenu du modal */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                {/* Objectif du jeu */}
                <div className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-emerald-200 dark:border-emerald-700">
                  <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mb-3 flex items-center gap-2">
                    <Target className="w-6 h-6" />
                    Objectif du Jeu
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    CubeMatch est un jeu de calcul mental où tu dois résoudre des équations mathématiques en faisant correspondre des cubes colorés. 
                    L'objectif est d'obtenir le score le plus élevé possible en résolvant correctement le maximum d'équations dans le temps imparti.
                  </p>
                </div>

                {/* Comment jouer */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
                  <h3 className="text-xl font-bold text-blue-700 dark:text-blue-300 mb-4 flex items-center gap-2">
                    <Play className="w-6 h-6" />
                    Comment Jouer
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</div>
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Lance le jeu</h4>
                        <p className="text-gray-600 dark:text-gray-400">Clique sur le bouton play au centre de l'image pour commencer une partie</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</div>
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Résous les équations</h4>
                        <p className="text-gray-600 dark:text-gray-400">Des cubes avec des chiffres apparaissent. Clique sur les cubes pour former l'équation correcte</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</div>
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Valide ta réponse</h4>
                        <p className="text-gray-600 dark:text-gray-400">Appuie sur "Entrée" ou clique sur "Valider" pour confirmer ton calcul</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">4</div>
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Gagne des points</h4>
                        <p className="text-gray-600 dark:text-gray-400">Chaque bonne réponse te rapporte des points. Plus tu es rapide, plus tu gagnes de points bonus !</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Règles du jeu */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700">
                  <h3 className="text-xl font-bold text-purple-700 dark:text-purple-300 mb-4 flex items-center gap-2">
                    <BookOpen className="w-6 h-6" />
                    Règles du Jeu
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Temps limité par niveau</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Difficulté progressive</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Bonus de rapidité</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Vies limitées</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Multiplicateurs de score</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Power-ups spéciaux</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Système de points */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-700">
                  <h3 className="text-xl font-bold text-yellow-700 dark:text-yellow-300 mb-4 flex items-center gap-2">
                    <Star className="w-6 h-6" />
                    Système de Points
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">+10</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Réponse correcte</div>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">+5</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Bonus rapidité</div>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">×2</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Combo streak</div>
                    </div>
                  </div>
                </div>

                {/* Conseils */}
                <div className="bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-indigo-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-700">
                  <h3 className="text-xl font-bold text-indigo-700 dark:text-indigo-300 mb-4 flex items-center gap-2">
                    <Brain className="w-6 h-6" />
                    Conseils pour Bien Jouer
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Zap className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-700 dark:text-gray-300">Entraîne-toi régulièrement pour améliorer ta vitesse de calcul</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Target className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-700 dark:text-gray-300">Concentre-toi sur la précision avant la vitesse</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-700 dark:text-gray-300">Les niveaux deviennent plus difficiles, prépare-toi !</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Heart className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-700 dark:text-gray-300">Gère bien tes vies, elles sont précieuses</p>
                    </div>
                  </div>
                </div>

                {/* Bouton de fermeture */}
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => setShowInstructionsModal(false)}
                    className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    Commencer à Jouer !
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
