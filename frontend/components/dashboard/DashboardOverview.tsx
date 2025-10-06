'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Target, 
  Calendar, 
  Zap,
  ArrowRight,
  Users,
  Brain,
  BarChart3,
  Sparkles,
  FileText,
  MessageSquare,
  ClipboardList,
  Award,
  Clock,
  CheckCircle
} from 'lucide-react'
import RadarChart from '../charts/RadarChart'
import { useRadarData, useMultiChildRadarData } from '../../hooks/useRadarData'

interface DashboardOverviewProps {
  user: any
  userType: 'CHILD' | 'PARENT'
  childSessions?: any[]
  onNavigate: (tab: string) => void
}

export default function DashboardOverview({ 
  user, 
  userType, 
  childSessions = [],
  onNavigate 
}: DashboardOverviewProps) {
  console.log('🎨 DashboardOverview rendu avec:', { user, userType, childSessions })
  const [quickStats, setQuickStats] = useState({
    todayProgress: 0,
    weeklyGoal: 5,
    streak: 0,
    totalTime: 0
  })

  const isChild = userType === 'CHILD'

  // Utiliser les vraies données de l'API au lieu du hardcoding
  const { profiles: singleProfiles, loading: singleLoading, error: singleError } = useRadarData({ 
    userSessionId: user?.sessionId || '', 
    isChild,
    userType
  })
  
  const { profiles: multiProfiles, loading: multiLoading, error: multiError } = useMultiChildRadarData({
    userType: 'PARENT'
  })

  // Déterminer quelles données utiliser selon le contexte
  const profiles = isChild ? singleProfiles : (childSessions?.length > 1 ? multiProfiles : singleProfiles)
  const loading = isChild ? singleLoading : (childSessions?.length > 1 ? multiLoading : singleLoading)
  const error = isChild ? singleError : (childSessions?.length > 1 ? multiError : singleError)

  // Données rapides pour la vue d'ensemble (supprimées selon demande utilisateur)
  const quickActions: any[] = []

  return (
    <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden">
      <div className="h-full overflow-y-auto p-4 md:p-5 lg:p-6">
        <div className="space-y-6">
          {/* En-tête de bienvenue avec genre si pas de genre, on affiche Bonjour  et firstname uniquement. {user?.gender === 'FEMALE' ? 'Madame' : 'Monsieur'} */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Bonjour {user?.firstName} ! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {isChild 
                ? "Prêt(e) pour une nouvelle aventure d'apprentissage ?" 
                : "Suivez la progression de vos enfants"
              }
            </p>
          </motion.div>


          

          

          {/* Radar Chart avec gestion des états de chargement */}
          {loading ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 mb-8"
            >
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            </motion.div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 mb-8"
            >
              <div className="flex items-center justify-center h-64 text-red-600">
                <div className="text-center">
                  <div className="text-2xl mb-2">⚠️</div>
                  <p>Erreur lors du chargement des données</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <RadarChart 
                childrenProfiles={profiles}
                userSessionId={user?.sessionId}
                isChild={isChild}
                userType={userType}
                className="mb-8"
                compareModeDefault={!isChild && profiles.length > 1}
              />
            </motion.div>
          )}



          
        </div>
      </div>
    </div>
  )
}
