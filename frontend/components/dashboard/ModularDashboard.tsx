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
import { SubscriptionTab } from '../SubscriptionTab'
import { BillingTab } from '../BillingTab'
import FamilyMembersTab from '../FamilyMembersTab'
import { authAPI, statsAPI } from '@/lib/api'
import DecorativeCubes from '../DecorativeCubes'
import { AvatarProvider } from '@/contexts/AvatarContext'

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
    
    if (!user) return null

    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardOverview 
            user={user}
            userType={user.userType as 'CHILD' | 'PARENT'}
            childSessions={childSessions}
            onNavigate={setActiveTab}
          />
        )
      
      case 'analytics':
        return <AnalyticsPage user={user} childSessions={childSessions} />
      
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
        return <MathCubePage />
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
        return (
          <BubixTab 
            user={user}
            childSessions={childSessions}
            userType={user.userType as 'CHILD' | 'PARENT'}
            subscriptionType={user.subscriptionType}
          />
        )
      case 'reglages':
        return <SettingsTab userType={user.userType as 'CHILD' | 'PARENT' | 'TEACHER' | 'ADMIN'} />
      case 'abonnements':
        return <SubscriptionTab user={user} />
      case 'family-members':
        return <FamilyMembersTab />
      case 'facturation':
        return <BillingTab user={user} />
      
      default:
        return (
          <DashboardOverview 
            user={user}
            userType={user.userType as 'CHILD' | 'PARENT'}
            childSessions={childSessions}
            onNavigate={setActiveTab}
          />
        )
    }
  }

  return (
    <AvatarProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
        <DecorativeCubes variant="default" />
        
        {/* Sidebar de navigation modulaire */}
        <ModularNavigation
          activeTab={activeTab as any}
          onTabChange={setActiveTab}
          userSubscriptionType={user?.subscriptionType || 'FREE'}
          userType={user?.userType as any}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />

        {/* Contenu principal */}
        <div className={`transition-all duration-300 ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}>
          <main className="p-2 md:p-4 lg:p-6">
            {ready ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {renderTabContent()}
              </motion.div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-300 text-sm md:text-base">Chargement...</span>
              </div>
            )}
          </main>
        </div>
      </div>
    </AvatarProvider>
  )
}
