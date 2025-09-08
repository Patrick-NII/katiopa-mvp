'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import ModularNavigation from '../navigation/ModularNavigation'
import DashboardOverview from './DashboardOverview'
import AnalyticsPage from '../../app/dashboard/analytics/page'
import ExperiencesPage from '../../app/dashboard/experiences/page'
import FamilyPage from '../../app/dashboard/family/page'
import BubixAssistantPage from '../../app/dashboard/bubix-assistant/page'
import BubixTab from '../BubixTab'
import SettingsTab from '../SettingsTab'
import SettingsTabNoScroll from '../settings/SettingsTabNoScroll'
import AnalyticsPageNoScroll from '../analytics/AnalyticsPageNoScroll'
import SubscriptionBillingPage from '../subscription/SubscriptionBillingPage'
import FamilyMembersTab from '../FamilyMembersTab'
import { authAPI, statsAPI } from '@/lib/api'
import DecorativeCubes from '../DecorativeCubes'
import { AvatarProvider } from '@/contexts/AvatarContext'
import { useModals } from '@/hooks/useModals'
import ModalSystem from '../modals/ModalSystem'
import BubixDedicatedWindow from '../bubix/BubixDedicatedWindow'
import BubixChildWindow from '../bubix/BubixChildWindow'
import CubeMatchModal from '../modals/CubeMatchModal'

// Import des pages des cubes existantes
import MathCubePage from '../../app/dashboard/mathcube/page'
import CodeCubePage from '../../app/dashboard/codecube/page'
import PlayCubePage from '../../app/dashboard/playcube/page'
import ScienceCubePage from '../../app/dashboard/sciencecube/page'
import DreamCubePage from '../../app/dashboard/dreamcube/page'
import ComCubePage from '../../app/dashboard/comcube/page'

interface User {
  id: string
  sessionId: string
  firstName: string
  lastName: string
  userType: string
  subscriptionType: string
}

interface Summary {
  totalTime: number
  averageScore: number
  totalActivities: number
  domains: Array<{
    name: string
    count: number
    averageScore: number
    activities: any[]
  }>
}

export default function ModularDashboard() {
  const [activeTab, setActiveTab] = useState<string>('dashboard')
  const [user, setUser] = useState<User | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [ready, setReady] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [childSessions, setChildSessions] = useState<any[]>([])
  const [isMobile, setIsMobile] = useState(false)
  
  // Hook pour les modals
  const { modals, modalStates, closeModal, minimizeModal, maximizeModal, updateModal, openCubeMatchModal } = useModals()

  // Fonction pour gérer les changements d'onglets
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
  }

  // Chargement des données
  const loadData = async () => {
    console.log('🔄 Chargement des données...')
    try {
      // Récupération de l'utilisateur connecté
      const userResponse = await authAPI.verify()
      console.log('👤 Réponse utilisateur:', userResponse)
      if (userResponse.success && userResponse.user) {
        setUser(userResponse.user)
        if (userResponse.user.userType === 'CHILD') {
          setActiveTab('experiences')
        }
      }

      // Récupération des statistiques
      try {
        const summaryData = await statsAPI.getSummary()
        setSummary(summaryData)
      } catch (error) {
        console.warn('⚠️ Impossible de charger les statistiques:', error)
        // Utiliser des données par défaut au lieu de null
        setSummary({
          totalTime: 0,
          averageScore: 0,
          totalActivities: 0,
          domains: []
        })
      }

      // Récupération des sessions enfants pour les parents
      if (userResponse.user && userResponse.user.userType === 'PARENT') {
        try {
          const sessionsResponse = await fetch('/api/sessions/children', {
            credentials: 'include'
          })
          if (sessionsResponse.ok) {
            const sessionsData = await sessionsResponse.json()
            setChildSessions(sessionsData)
          }
        } catch (error) {
          console.warn('⚠️ Impossible de charger les sessions enfants:', error)
          setChildSessions([])
        }
      }

      console.log('✅ Données chargées avec succès')
      setReady(true)
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error)
      setReady(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      // Sur mobile, la sidebar est fermée par défaut
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <p className="text-gray-600">Utilisateur non connecté</p>
        </div>
      </div>
    )
  }

  // Fonction pour rendre le contenu des onglets
  const renderTabContent = () => {
    console.log('🎯 Rendu du contenu pour l\'onglet:', activeTab)
    console.log('👤 Utilisateur:', user)
        console.log('👶 Sessions enfants:', childSessions)
        console.log('👶 Détail première session:', childSessions?.[0])
        console.log('👶 Détail deuxième session:', childSessions?.[1])
    
    if (!user) return null

    switch (activeTab) {
      case 'dashboard':
        console.log('🎯 Retour du composant DashboardOverview')
        return (
          <DashboardOverview 
            user={user}
            userType={user.userType as 'CHILD' | 'PARENT'}
            childSessions={childSessions}
            onNavigate={handleTabChange}
          />
        )
      
      case 'analytics':
        return <AnalyticsPageNoScroll user={user} childSessions={childSessions} />
      
      case 'experiences':
        return (
          <ExperiencesPage 
            user={user}
            userType={user.userType as 'CHILD' | 'PARENT'}
          />
        )
      
      case 'family':
        return <FamilyPage user={user} childSessions={childSessions} />
      
      case 'bubix-assistant':
        return (
          <BubixAssistantPage 
            user={user}
            userType={user.userType as 'CHILD' | 'PARENT'}
            childSessions={childSessions}
          />
        )
      
      // Pages des cubes d'apprentissage
      case 'mathcube':
        return <MathCubePage onOpenCubeMatch={openCubeMatchModal} />
      case 'codecube':
        return <CodeCubePage />
      case 'playcube':
        return <PlayCubePage />
      case 'sciencecube':
        return <ScienceCubePage />
      case 'dreamcube':
        return <DreamCubePage />
      case 'comcube':
        return <ComCubePage />
      
      // Pages de gestion (parents uniquement)
      case 'bubix':
        return user.userType === 'CHILD' ? (
          <BubixChildWindow 
            user={user}
            userType={user.userType as 'CHILD' | 'PARENT'}
          />
        ) : (
          <BubixDedicatedWindow 
            user={user}
            userType={user.userType as 'CHILD' | 'PARENT'}
          />
        )
      case 'reglages':
        return <SettingsTabNoScroll userType={user.userType as 'CHILD' | 'PARENT' | 'TEACHER' | 'ADMIN'} />
      case 'abonnements':
        return <SubscriptionBillingPage user={user} />
      
      default:
        return (
          <DashboardOverview 
            user={user}
            userType={user.userType as 'CHILD' | 'PARENT'}
            childSessions={childSessions}
            onNavigate={handleTabChange}
          />
        )
    }
  }

  return (
    <AvatarProvider>
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
        <DecorativeCubes variant="glassmorphism" />
        
        {/* Sidebar de navigation modulaire */}
        <ModularNavigation
          activeTab={activeTab as any}
          onTabChange={handleTabChange}
          userSubscriptionType={user?.subscriptionType || 'FREE'}
          userType={user?.userType as any}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />

        {/* Contenu principal avec glassmorphisme optimisé */}
        <motion.div 
          animate={{ marginLeft: sidebarCollapsed ? 64 : 224 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="h-screen"
        >
          <main className="w-full h-full p-3 md:p-4 lg:p-5">
            {ready ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl p-4 md:p-5 lg:p-6 h-full flex flex-col w-full overflow-y-auto"
              >
                {(() => {
                  const content = renderTabContent()
                  console.log('🎭 Contenu rendu:', content)
                  return content
                })()}
              </motion.div>
            ) : (
              <div className="flex items-center justify-center h-full backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl w-full">
                <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
                <span className="ml-3 text-gray-200 dark:text-gray-300 text-sm md:text-base">Chargement...</span>
              </div>
            )}
          </main>
        </motion.div>
        
        {/* Système de modals */}
        <ModalSystem
          modals={modals}
          modalStates={modalStates}
          onModalChange={(id, updates) => updateModal(id, updates)}
        />
        
        {/* CubeMatch Modal */}
        {modalStates.cubematch && (
          <CubeMatchModal
            isOpen={modalStates.cubematch.isOpen}
            onClose={() => closeModal('cubematch')}
            onMinimize={() => minimizeModal('cubematch')}
            onMaximize={() => maximizeModal('cubematch')}
            onFullscreen={() => updateModal('cubematch', { isFullscreen: true, isMaximized: false })}
            isMinimized={modalStates.cubematch.isMinimized}
            isMaximized={modalStates.cubematch.isMaximized}
            isFullscreen={modalStates.cubematch.isFullscreen}
            zIndex={modalStates.cubematch.zIndex}
            position={modalStates.cubematch.position}
            size={modalStates.cubematch.size}
          />
        )}
      </div>
    </AvatarProvider>
  )
}
