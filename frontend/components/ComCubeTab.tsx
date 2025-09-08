'use client'

import React, { useState, useEffect } from 'react'
import { 
  Users, 
  MessageCircle, 
  Heart, 
  Star, 
  TrendingUp,
  Calendar,
  Award,
  Globe,
  Share2,
  UserPlus,
  Settings,
  Bell,
  HelpCircle
} from 'lucide-react'

interface ComCubeTabProps {
  userType: 'CHILD' | 'PARENT'
  userSubscriptionType: string
  firstName: string
  lastName: string
}

export default function ComCubeTab({ 
  userType, 
  userSubscriptionType, 
  firstName, 
  lastName 
}: ComCubeTabProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [communityStats, setCommunityStats] = useState<any>(null)
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [topMembers, setTopMembers] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      
      // Données par défaut pour la communauté
      const defaultStats = {
        totalMembers: 1247,
        activeToday: 89,
        totalPosts: 3456,
        totalLikes: 12890,
        userRank: 'Membre Actif',
        userPoints: 1250,
        userLevel: 'Bronze'
      }

      const defaultActivities = [
        {
          id: '1',
          type: 'POST',
          user: 'Marie D.',
          content: 'Mon fils a terminé son premier exercice de programmation !',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          likes: 12,
          comments: 3
        },
        {
          id: '2',
          type: 'ACHIEVEMENT',
          user: 'Thomas L.',
          content: 'A obtenu le badge "Mathématicien en herbe"',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          likes: 8,
          comments: 2
        },
        {
          id: '3',
          type: 'QUESTION',
          user: 'Sophie M.',
          content: 'Quel est le meilleur moment pour faire les exercices ?',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          likes: 5,
          comments: 7
        }
      ]

      const defaultTopMembers = [
        {
          id: '1',
          name: 'Emma R.',
          points: 2850,
          level: 'Diamant',
          avatar: '👩‍👧',
          achievements: 15
        },
        {
          id: '2',
          name: 'Lucas M.',
          points: 2340,
          level: 'Or',
          avatar: '👨‍👦',
          achievements: 12
        },
        {
          id: '3',
          name: 'Noah P.',
          points: 1980,
          level: 'Argent',
          avatar: '👩‍👦',
          achievements: 10
        }
      ]

      setCommunityStats(defaultStats)
      setRecentActivities(defaultActivities)
      setTopMembers(defaultTopMembers)
    } catch (error) {
      console.error('Erreur lors du chargement des données de communauté:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden">
      <div className="h-full overflow-y-auto p-4 md:p-5 lg:p-6">
        <div className="space-y-6">
          {/* En-tête de la communauté */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Communauté CubeAI</h1>
                <p className="text-gray-600 dark:text-gray-300">Connectez-vous avec d'autres parents et partagez vos expériences</p>
              </div>
            </div>
            
            {/* Statistiques de la communauté */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{communityStats?.totalMembers}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Membres</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{communityStats?.activeToday}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Actifs aujourd'hui</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{communityStats?.totalPosts}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Publications</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">{communityStats?.totalLikes}</div>
            <div className="text-sm text-gray-600">J'aime</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profil utilisateur */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Votre profil</h2>
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-xl font-bold">{firstName?.[0]}{lastName?.[0]}</span>
              </div>
              <h3 className="font-semibold text-gray-900">{firstName} {lastName}</h3>
              <p className="text-sm text-gray-600">{communityStats?.userRank}</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Points</span>
                <span className="font-semibold text-blue-600">{communityStats?.userPoints}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Niveau</span>
                <span className="font-semibold text-purple-600">{communityStats?.userLevel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Activités récentes */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Activités récentes</h2>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {activity.type === 'POST' && <MessageCircle className="w-5 h-5 text-blue-600" />}
                    {activity.type === 'ACHIEVEMENT' && <Award className="w-5 h-5 text-yellow-600" />}
                    {activity.type === 'QUESTION' && <HelpCircle className="w-5 h-5 text-green-600" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{activity.user}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleDateString('fr-FR', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{activity.content}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {activity.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        {activity.comments}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Membres les plus actifs */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Membres les plus actifs</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topMembers.map((member, index) => (
            <div key={member.id} className="flex items-center gap-3 p-4 rounded-lg bg-gray-50">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-lg">
                  {member.avatar}
                </div>
                {index < 3 && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{index + 1}</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{member.name}</h3>
                <p className="text-sm text-gray-600">{member.level} • {member.points} pts</p>
                <p className="text-xs text-gray-500">{member.achievements} succès</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-blue-50 transition-colors">
            <MessageCircle className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-medium">Nouveau post</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-green-50 transition-colors">
            <UserPlus className="w-6 h-6 text-green-600" />
            <span className="text-sm font-medium">Inviter ami</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-purple-50 transition-colors">
            <Share2 className="w-6 h-6 text-purple-600" />
            <span className="text-sm font-medium">Partager</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-orange-50 transition-colors">
            <Bell className="w-6 h-6 text-orange-600" />
            <span className="text-sm font-medium">Notifications</span>
          </button>
        </div>
      </div>
        </div>
      </div>
    </div>
  )
}
