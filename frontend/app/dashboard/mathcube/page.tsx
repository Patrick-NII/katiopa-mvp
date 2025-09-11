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
  Download,
  HelpCircle
} from 'lucide-react'
import { cubeMatchSocialAPI, type SocialStats, type Comment, type LeaderboardPlayer } from '@/lib/api/cubematch-social'
import { cubeMatchAPI, type LeaderboardEntry } from '@/lib/api/cubematch-v2'
import Link from 'next/link'
import { useModals } from '@/hooks/useModals'
import Image from 'next/image'

interface MathCubePageProps {
  onOpenCubeMatch?: () => void
}

export default function MathCubePage({ onOpenCubeMatch }: MathCubePageProps) {
  const [currentLevel, setCurrentLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [isClient, setIsClient] = useState(false)

  // États pour les vraies données de la base de données
  const [userStats, setUserStats] = useState<any>(null)
  const [globalStats, setGlobalStats] = useState<any>(null)
  const [top10Players, setTop10Players] = useState<LeaderboardEntry[]>([])
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
      // Ouvrir le modal CubeMatch
      openCubeMatchModal()
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

  // Test simple pour récupérer les données 
  const loadSocialData = async () => {
    try {
      console.log('🔄 Test de chargement des données...')
      setLoading(true)
      
      // Test direct de l'API
      const response = await fetch('/api/cubematch/social/stats/cubematch-main')
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Données reçues:', data)
        setLikes(data.likes || 0)
        setShares(data.shares || 0)
        setViews(data.views || 0)
        setGamesPlayed(data.gamesPlayed || 0)
      } else {
        console.error('❌ Erreur API:', response.status)
      }
      
      // Test commentaires
      const commentsResponse = await fetch('/api/cubematch/social/comments/cubematch-main')
      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json()
        console.log('💬 Commentaires:', commentsData)
        setComments(commentsData || [])
      }
      
      // Charger le vrai classement Top 10
      const realLeaderboard = await cubeMatchLeaderboardAPI.getTop10()
      console.log('🏆 Classement Top 10 réel:', realLeaderboard)
      setTop10Players(realLeaderboard || [])

    } catch (error) {
      console.error('❌ Erreur de test:', error)
      setLikes(0)
      setShares(0)
      setViews(0)
      setGamesPlayed(0)
      setComments([])
      setTop10Players([])
    } finally {
      setLoading(false)
      console.log('🏁 Test terminé')
    }
  }

  // Fonctions pour les interactions sociales avec la nouvelle API
  const handleLike = async () => {
    if (!currentUserId) return

    try {
      const result = await cubeMatchSocialAPI.toggleLike()
      setIsLiked(result.liked)
      
      // Recharger les statistiques sociales pour avoir le nombre exact
      const socialStats = await cubeMatchSocialAPI.getSocialStats()
      setLikes(socialStats.likes)
    } catch (error) {
      console.error('Erreur lors de la gestion du like:', error)
    }
  }
  
  const handleShare = async () => {
    if (!currentUserId) return

    try {
      await cubeMatchSocialAPI.recordShare('web')
      
      // Mettre à jour le compteur de partages
      const socialStats = await cubeMatchSocialAPI.getSocialStats()
      setShares(socialStats.shares)

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
      await cubeMatchSocialAPI.addComment(newComment.trim())
      
      // Recharger les commentaires pour avoir la liste mise à jour
      const updatedComments = await cubeMatchSocialAPI.getComments(20)
      setComments(updatedComments)
      setNewComment('')
    } catch (error) {
      console.error('Erreur lors de l\'ajout du commentaire:', error)
    }
  }
  
  const handleCommentLike = async (commentId: string) => {
    if (!currentUserId) return

    try {
      await cubeMatchSocialAPI.toggleCommentLike(commentId)
      
      // Recharger les commentaires pour avoir les likes mis à jour
      const updatedComments = await cubeMatchSocialAPI.getComments(20)
      setComments(updatedComments)
    } catch (error) {
      console.error('Error liking comment:', error)
    }
  }


  // Chargement des données
  useEffect(() => {
    setIsClient(true)
    
    const loadData = async () => {
      try {
        console.log('🔄 Chargement des données CubeMatch...')
        
        // Charger les données sociales
        const socialResponse = await fetch('/api/cubematch/social-data')
        if (socialResponse.ok) {
          const socialResult = await socialResponse.json()
          console.log('✅ Données sociales chargées:', socialResult)
          
          if (socialResult.success && socialResult.data) {
            const { socialStats, comments } = socialResult.data
            
            // Mettre à jour les états sociaux
            setLikes(socialStats.likes || 0)
            setShares(socialStats.shares || 0)
            setViews(socialStats.views || 0)
            setGamesPlayed(socialStats.gamesPlayed || 0)
            setComments(comments || [])
            
            console.log('📊 Stats sociales mises à jour:', { 
              likes: socialStats.likes, 
              shares: socialStats.shares, 
              views: socialStats.views 
            })
          }
        }
        
        // Charger le vrai classement Top 10 avec l'API v2
        console.log('🏆 Chargement du classement v2...')
        const leaderboard = await cubeMatchAPI.getTop10()
        console.log('✅ Classement v2 chargé:', leaderboard.length, 'entrées', leaderboard)
        setTop10Players(leaderboard || [])
        console.log('📊 État top10Players mis à jour avec:', leaderboard.length, 'joueurs')
        
      } catch (error) {
        console.error('❌ Erreur de chargement:', error)
      } finally {
        setLoading(false)
        console.log('🏁 Chargement terminé')
      }
    }

    loadData()
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

          {/* Section principale redesignée */}
          <div className="bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 rounded-3xl shadow-2xl border border-emerald-200/50 overflow-hidden mb-6 sm:mb-8">
            
            {/* En-tête coloré et moderne */}
            <div className="bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/>
                    </svg>
        </div>
                  <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white">
                      🧮 CubeMatch
                    </h2>
                    <p className="text-blue-100 text-lg">Le défi mathématique ultime !</p>
          </div>
        </div>

                {/* Badge niveau/difficulté */}
                <div className="hidden sm:flex items-center gap-2 bg-white/20 rounded-2xl px-4 py-2 backdrop-blur-sm">
                  <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span className="text-white font-medium">Niveau Expert</span>
          </div>
        </div>
      </div>

            {/* Container principal avec grid moderne */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Colonne 1 & 2 - Zone de jeu principale */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Carte de jeu avec design moderne */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
                    
                    {/* Header de la carte */}
                    <div className="bg-gradient-to-r from-emerald-400 to-blue-400 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/30 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
            </div>
            <div>
                            <h3 className="font-bold text-white text-lg">Zone de Jeu</h3>
                            <p className="text-emerald-100 text-sm">Prêt pour le défi ?</p>
            </div>
          </div>
                        
                        {/* Status badge */}
                        <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                          ● En ligne
                        </div>
          </div>
        </div>

                    {/* Image du jeu avec overlay moderne */}
                    <div className="relative">
                      <div className="aspect-video relative rounded-b-2xl overflow-hidden">
                        <Image
                          src="/cubematch/image1.png"
                          alt="CubeMatch Game Screenshot"
                          fill
                          className="object-cover"
                          priority
                        />
                        
                        {/* Overlay gradient moderne */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                        
                        {/* Bouton play redesigné */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <button
                            onClick={handleOpenCubeMatch}
                            className="group relative"
                          >
                            {/* Ring effect */}
                            <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping" />
                            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-pulse" />
                            
                            {/* Main button */}
                            <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-300 group-hover:shadow-emerald-500/25">
                              <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
            </div>
                            
                            {/* Tooltip */}
                            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-black/80 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap">
                                Jouer maintenant !
            </div>
          </div>
            </button>
                        </div>
                        
                        {/* Corner badges */}
                        <div className="absolute top-4 left-4">
                          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1 text-xs font-medium text-gray-700">
                            🎯 Mathématiques
          </div>
        </div>

                        <div className="absolute top-4 right-4">
                          <div className="bg-emerald-500/90 backdrop-blur-sm rounded-lg px-3 py-1 text-xs font-medium text-white">
                            ⚡ Nouveau
            </div>
          </div>
          </div>
        </div>
      </div>

                  {/* Section engagement moderne */}
                  <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50">
                    <div className="flex items-center justify-between">
                      
                      {/* Stats interactives style réseau social */}
                      <div className="flex items-center gap-4">
                        
                        {/* Like */}
                        <button
                          onClick={handleLike}
                          className={`group flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 ${
                            isLiked 
                              ? 'bg-red-50 text-red-600 border border-red-200' 
                              : 'hover:bg-gray-50 text-gray-600 hover:text-red-500'
                          }`}
                        >
                          <svg className={`w-5 h-5 transition-transform group-hover:scale-110 ${isLiked ? 'fill-current' : ''}`} fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                          </svg>
                          <span className="text-sm font-semibold">{likes}</span>
                        </button>
                        
                        {/* Share */}
                        <button
                          onClick={handleShare}
                          className="group flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-blue-50 text-gray-600 hover:text-blue-500 transition-all duration-200"
                        >
                          <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                          </svg>
                          <span className="text-sm font-semibold">{shares}</span>
                        </button>
                        
                        {/* Comments */}
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 text-gray-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span className="text-sm font-semibold">{comments.length}</span>
                        </div>
                        
                        {/* Views */}
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 text-gray-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span className="text-sm font-semibold">{views}</span>
              </div>
                        
                        {/* Games played */}
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M16 14h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm font-semibold">{gamesPlayed}</span>
              </div>
            </div>
            
                      {/* Bouton aide redesigné */}
                      <button
                        onClick={() => setShowInstructionsModal(true)}
                        className="group w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                        title="Mode d'emploi"
                      >
                        <svg className="w-5 h-5 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Colonne 3 - Stats et classement */}
                <div className="space-y-6 max-w-4xl mx-auto">
                  
                  {/* Carte de performance */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-400 to-pink-400 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/30 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-lg">Classement</h3>
                            <p className="text-purple-100 text-sm">Meilleur score de nos {top10Players.length} champions</p>
                          </div>
                        </div>
                        <button 
                          onClick={async () => {
                            console.log('🔄 Rechargement manuel du classement...')
                            setLoading(true)
                            try {
                              const data = await cubeMatchLeaderboardAPI.getTop10()
                              console.log('✅ Données rechargées:', data)
                              setTop10Players(data)
                            } catch (error) {
                              console.error('❌ Erreur rechargement:', error)
                            } finally {
                              setLoading(false)
                            }
                          }}
                          className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm text-white transition-colors"
                        >
                          🔄
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      {/* En-tête du tableau modernisé */}
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-3 mb-4">
                        <div className="grid grid-cols-12 gap-1 text-xs font-bold text-gray-700">
                          <div className="col-span-3 text-center">🏆 Rang</div>
                          <div className="col-span-5 text-center">👤 Joueur</div>
                          <div className="col-span-4 text-center">⚡ Score</div>
                        </div>
                      </div>
                      
                      {/* Corps du tableau avec design moderne */}
                      <div className="space-y-2">
                      {/* Debug info */}
                        {console.log('🔍 État du rendu:', { loading, top10PlayersLength: top10Players.length, top10Players })}
                        {loading ? (
                          Array.from({ length: 5 }).map((_, index) => (
                            <div key={index} className="grid grid-cols-12 gap-1 p-3 bg-gray-50 rounded-xl animate-pulse">
                              <div className="col-span-3 h-4 bg-gray-200 rounded-lg"></div>
                              <div className="col-span-5 h-3 bg-gray-200 rounded-lg"></div>
                              <div className="col-span-4 h-3 bg-gray-200 rounded-lg"></div>
                            </div>
                          ))
                        ) : top10Players.length > 0 ? (
                          top10Players.map((player: LeaderboardEntry, index: number) => {
                            // Extraire le nom d'affichage depuis le sessionId (ex: "aylon-session" -> "Aylon")
                            const displayName = player.username 
                              ? player.username.split('-')[0].charAt(0).toUpperCase() + player.username.split('-')[0].slice(1)
                              : 'Joueur';
                            
                            // Première lettre pour l'avatar
                            const avatarLetter = displayName.charAt(0).toUpperCase();
                            
                            // Couleur de gradient basée sur l'index
                            const avatarGradients = [
                              'from-blue-600 to-purple-600',
                              'from-emerald-600 to-teal-600', 
                              'from-pink-600 to-red-600',
                              'from-orange-600 to-yellow-600',
                              'from-indigo-600 to-blue-600'
                            ];
                            
                            return (
                              <div key={player.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.02] ${
                                index === 0 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' :
                                index === 1 ? 'bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200' :
                                index === 2 ? 'bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200' :
                                'bg-white border border-gray-100'
                              }`}>
                                
                                {/* Avatar avec première lettre */}
                                <div className={`w-10 h-10 bg-gradient-to-r ${avatarGradients[index % avatarGradients.length]} rounded-xl flex items-center justify-center text-white text-sm font-semibold shadow-lg`}>
                                  {avatarLetter}
                                </div>
                                
                                {/* Informations du joueur */}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                      {displayName}
                                    </p>
                                    {/* Badge de classement */}
                                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                      index === 1 ? 'bg-gray-100 text-gray-700' :
                                      index === 2 ? 'bg-orange-100 text-orange-700' :
                                      'bg-blue-100 text-blue-700'
                                    }`}>
                                      {index === 0 ? '🥇 CHAMPION' : 
                                       index === 1 ? '🥈 EXPERT' :
                                       index === 2 ? '🥉 PRO' :
                                       'MAÎTRE'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-300">
                                    <span className="font-medium">
                                      🏆 {player.score.toLocaleString()} pts
                                    </span>
                                    <span>
                                      ⚡ Niveau {player.level}
                                    </span>
                                    <span>
                                      ⏱️ {player.timePlayedFormatted}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Indicateur de position */}
                                <div className="text-right">
                                  <div className={`text-lg font-bold ${
                                    index === 0 ? 'text-yellow-600' :
                                    index === 1 ? 'text-gray-600' :
                                    index === 2 ? 'text-orange-600' :
                                    'text-gray-700'
                                  }`}>
                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl">
                            <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            <p className="text-sm">Aucun score pour le moment</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Section commentaires redesignée */}
              <div className="mt-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-400 to-cyan-400 p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/30 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg">Commentaires</h3>
                        <p className="text-blue-100 text-sm">Partagez vos impressions</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    {/* Zone d'ajout de commentaire modernisée */}
                    <div className="mb-6">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">U</span>
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Écrivez votre commentaire..."
                            className="w-full p-4 text-sm border border-blue-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50/30 transition-all"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                          />
                          <div className="flex justify-end mt-2">
                            <button
                              onClick={handleAddComment}
                              disabled={!newComment.trim()}
                              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                              Publier
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Liste des commentaires avec design moderne */}
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {comments.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <p className="text-sm">Aucun commentaire pour le moment</p>
                          <p className="text-xs text-gray-400 mt-1">Soyez le premier à partager votre avis !</p>
                        </div>
                      ) : (
                        comments.map((comment) => (
                          <div key={comment.id} className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-blue-100 hover:shadow-lg transition-all duration-200">
                            <div className="flex gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                                {comment.avatar}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-bold text-sm text-gray-900">{comment.author}</span>
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{comment.timestamp}</span>
                                </div>
                                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{comment.content}</p>
                                <button
                                  onClick={() => handleCommentLike(comment.id)}
                                  className="group flex items-center gap-2 text-xs text-gray-500 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
                                >
                                  <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                  </svg>
                                  <span className="font-medium">{comment.likes}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
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
