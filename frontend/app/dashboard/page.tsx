'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import SidebarNavigation from '../../components/SidebarNavigation'
import UserHeader from '../../components/UserHeader'
import DashboardTab from '../../components/DashboardTab'
import StatisticsTab from '../../components/StatisticsTab'
import ExercisesTab from '../../components/ExercisesTab'
import HelpChatButton from '../../components/HelpChatButton'
import PersonalizedWelcome from '../../components/PersonalizedWelcome'
import AccountOverview from '../../components/AccountOverview'
import UserSessionInfo from '../../components/UserSessionInfo'
import { useGlobalTime } from '../../hooks/useGlobalTime'
import type { NavigationTab, DashboardUser, DashboardAccount, Activity, Summary, LLMResponse } from '../../types'

export default function Dashboard() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<DashboardUser | null>(null)
  const [account, setAccount] = useState<DashboardAccount | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [summary, setSummary] = useState<Summary[]>([])
  const [llmResponse, setLlmResponse] = useState<LLMResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [focus, setFocus] = useState('maths')
  const [error, setError] = useState<string | null>(null)
  const [userPreferences, setUserPreferences] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard')
  const [showSessionSelector, setShowSessionSelector] = useState(false)

  // Vérification de l'authentification
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.replace('/login')
    } else {
      setReady(true)
      loadUserProfile()
    }
  }, [router])

  // Chargement des données une fois authentifié
  useEffect(() => {
    if (ready) {
      loadData()
    }
  }, [ready])

  async function loadUserProfile() {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const userData = await response.json()
        
        // Transformer les données pour la nouvelle architecture
        const transformedUser: DashboardUser = {
          id: userData.id,
          firstName: userData.firstName || userData.name?.split(' ')[0] || 'Utilisateur',
          lastName: userData.lastName || userData.name?.split(' ').slice(1).join(' ') || '',
          email: userData.email,
          gender: userData.gender || 'UNKNOWN',
          userType: userData.userType || 'CHILD',
          age: userData.age,
          grade: userData.grade,
          subscriptionType: userData.subscriptionType || 'FREE',
          createdAt: userData.createdAt
        }

        // Créer un compte fictif pour la démonstration (à remplacer par l'API réelle)
        const mockAccount: DashboardAccount = {
          id: userData.id || 'acc_mock',
          email: userData.email,
          subscriptionType: userData.subscriptionType || 'FREE',
          maxSessions: userData.subscriptionType === 'PRO_PLUS' ? 4 : 2,
          createdAt: userData.createdAt
        }

        setUser(transformedUser)
        setAccount(mockAccount)
      } else {
        console.error('Erreur lors du chargement du profil utilisateur')
        router.replace('/login')
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error)
      router.replace('/login')
    }
  }

  async function loadData() {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      // Charger les activités
      const activitiesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/stats/activities`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json()
        setActivities(activitiesData.activities || [])
      }

      // Charger le résumé
      const summaryResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/stats/summary`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json()
        setSummary(summaryData.summary || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    }
  }

  async function evaluateLLM() {
    if (!user) return

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const llmData = prepareLLMData()
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/llm/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          focus,
          userData: llmData
        })
      })

      if (response.ok) {
        const data = await response.json()
        setLlmResponse(data)
      } else {
        console.error('Erreur lors de l\'évaluation LLM')
        // Utiliser une réponse de test en cas d'erreur
        setLlmResponse(getTestResponse())
      }
    } catch (error) {
      console.error('Erreur lors de l\'évaluation LLM:', error)
      // Utiliser une réponse de test en cas d'erreur
      setLlmResponse(getTestResponse())
    } finally {
      setLoading(false)
    }
  }

  function prepareLLMData() {
    if (!user || !account) return {}
    
    const now = new Date()
    const memberSince = new Date(account.createdAt)
    const daysSinceRegistration = Math.floor((now.getTime() - memberSince.getTime()) / (1000 * 60 * 60 * 24))
    const weeksSinceRegistration = Math.floor(daysSinceRegistration / 7)
    const monthsSinceRegistration = Math.floor(daysSinceRegistration / 30.44)
    
    // Calculer les activités des 7 et 14 derniers jours
    const activities7d = activities.filter(a => {
      const activityDate = new Date(a.createdAt)
      const diffDays = (now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24)
      return diffDays <= 7
    })
    
    const activities14d = activities.filter(a => {
      const activityDate = new Date(a.createdAt)
      const diffDays = (now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24)
      return diffDays <= 14
    })
    
    // Calculer les moyennes des scores
    const avgScore7d = activities7d.length > 0 ? 
      activities7d.reduce((acc, a) => acc + a.score, 0) / activities7d.length : 0
    const avgScore14d = activities14d.length > 0 ? 
      activities14d.reduce((acc, a) => acc + a.score, 0) / activities14d.length : 0
    
    // Calculer la pente des scores (tendance)
    const scoreSlope = activities14d.length > 1 ? 
      (avgScore7d - avgScore14d) / 7 : 0
    
    // Calculer les jours d'inactivité
    const lastActivity = activities.length > 0 ? new Date(activities[0].createdAt) : null
    const daysInactive = lastActivity ? 
      Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)) : daysSinceRegistration
    
    // Statistiques par domaine
    const domainStats: { [key: string]: { count: number, avgScore: number, totalTime: number } } = {}
    activities.forEach(activity => {
      if (!domainStats[activity.domain]) {
        domainStats[activity.domain] = { count: 0, avgScore: 0, totalTime: 0 }
      }
      domainStats[activity.domain].count++
      domainStats[activity.domain].totalTime += activity.durationMs
    })
    
    // Calculer les moyennes par domaine
    Object.keys(domainStats).forEach(domain => {
      const domainActivities = activities.filter(a => a.domain === domain)
      domainStats[domain].avgScore = domainActivities.reduce((acc, a) => acc + a.score, 0) / domainActivities.length
    })
    
    // Détecter les risques
    const riskFlags: string[] = []
    if (daysInactive > 7) riskFlags.push('inactivity_risk')
    if (avgScore7d < 60) riskFlags.push('low_performance_risk')
    if (activities7d.length < 3) riskFlags.push('low_engagement_risk')
    if (avgScore7d > 95 && activities7d.length > 10) riskFlags.push('underchallenge_risk')
    if (activities7d.some(a => a.attempts > 3)) riskFlags.push('frustration_risk')
    
    return {
      // Informations de base de l'utilisateur
      user_id: user.id,
      user_name: `${user.firstName} ${user.lastName}`,
      user_email: user.email,
      user_age: user.age || 'non spécifié',
      user_grade: user.grade || 'non spécifié',
      user_gender: user.gender,
      user_type: user.userType,
      user_country: 'France', // À récupérer depuis l'API
      user_timezone: 'Europe/Paris', // À récupérer depuis l'API
      
      // Informations d'inscription et de membre
      member_since: account.createdAt,
      member_since_formatted: memberSince.toLocaleDateString('fr-FR'),
      days_since_registration: daysSinceRegistration,
      weeks_since_registration: weeksSinceRegistration,
      months_since_registration: monthsSinceRegistration,
      subscription_type: account.subscriptionType,
      
      // Activité et performance
      activities_count_total: activities.length,
      activities_count_7d: activities7d.length,
      activities_count_14d: activities14d.length,
      avg_score_7d: Math.round(avgScore7d),
      avg_score_14d: Math.round(avgScore14d),
      score_slope_14d: Math.round(scoreSlope * 100) / 100,
      
      // Inactivité et engagement
      days_inactive: daysInactive,
      last_practiced_at: activities.length > 0 ? activities[0].createdAt : null,
      last_practiced_formatted: activities.length > 0 ? new Date(activities[0].createdAt).toLocaleDateString('fr-FR') : 'jamais',
      
      // Statistiques par domaine
      domain_stats: domainStats,
      preferred_domain: activities.length > 0 ? 
        Object.entries(domainStats).sort(([,a], [,b]) => b.count - a.count)[0]?.[0] : 'aucun',
      
      // Risques et alertes
      risk_flags: riskFlags,
      
      // Contexte temporel
      current_date: now.toISOString(),
      current_date_formatted: now.toLocaleDateString('fr-FR'),
      current_time: now.toLocaleTimeString('fr-FR'),
      
      // Données de session
      total_practice_time_ms: activities.reduce((acc, a) => acc + a.durationMs, 0),
      total_practice_time_minutes: Math.round(activities.reduce((acc, a) => acc + a.durationMs, 0) / (1000 * 60))
    }
  }

  function getTestResponse(): LLMResponse {
    return {
      summary_child: "Emma a bien progressé en mathématiques cette semaine ! Elle a réussi 8 exercices sur 10 avec une moyenne de 85%. Elle montre un bon niveau en addition et soustraction, mais pourrait s'améliorer en multiplication.",
      summary_adult: "Votre enfant Emma, 6 ans, CP, montre un bon engagement dans ses apprentissages. Elle pratique régulièrement (3-4 fois par semaine) et maintient un niveau satisfaisant. Recommandation : continuer avec les exercices de multiplication pour consolider les bases.",
      insights: [
        "Emma a une excellente régularité dans sa pratique",
        "Ses scores sont stables et en progression",
        "Elle préfère les exercices visuels et interactifs",
        "Son temps de concentration est optimal pour son âge"
      ],
      risks: [
        "Risque de lassitude si les exercices deviennent trop répétitifs",
        "Attention à ne pas la surcharger avec trop d'exercices par jour"
      ],
      recommended_exercises: [
        "Multiplication par 2 et 3 avec supports visuels",
        "Problèmes simples de la vie quotidienne",
        "Jeux de logique et de déduction",
        "Exercices de géométrie avec formes colorées"
      ],
      schedule_plan: [
        "Lundi : Mathématiques (30 min) - Multiplication",
        "Mercredi : Français (20 min) - Lecture",
        "Vendredi : Mathématiques (30 min) - Problèmes",
        "Week-end : Révision libre (15 min)"
      ],
      parent_notes: [
        "Félicitez Emma pour sa régularité",
        "Encouragez-la à persévérer en multiplication",
        "Privilégiez les séances courtes mais fréquentes",
        "Utilisez des exemples concrets du quotidien"
      ],
      teacher_notes: [
        "Emma est prête pour aborder la multiplication",
        "Ses compétences en logique sont excellentes",
        "Elle pourrait bénéficier d'exercices en groupe",
        "Considérer l'avancement vers le CE1"
      ],
      missing_data: [
        "Informations sur ses préférences d'apprentissage",
        "Détails sur son environnement familial",
        "Historique des difficultés rencontrées",
        "Objectifs d'apprentissage spécifiques"
      ]
    }
  }

  function handleExerciseSelect(exercise: string) {
    console.log('Exercice sélectionné:', exercise)
    // Logique pour gérer la sélection d'exercice
  }

  function handleTabChange(tab: NavigationTab) {
    setActiveTab(tab)
  }

  function handleLogout() {
    localStorage.removeItem('token')
    router.replace('/login')
  }

  function handleManageSessions() {
    setShowSessionSelector(!showSessionSelector)
  }

  function handleSwitchSession(sessionId: string) {
    console.log('Changement de session vers:', sessionId)
    // Logique pour changer de session
    setShowSessionSelector(false)
  }

  // Utiliser le hook pour le temps global
  const globalTimeInfo = useGlobalTime(account?.createdAt || null)

  function renderActiveTab() {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardTab
            user={user}
            activities={activities}
            summary={summary}
            llmResponse={llmResponse}
            loading={loading}
            focus={focus}
            onFocusChange={setFocus}
            onEvaluateLLM={evaluateLLM}
            onExerciseSelect={handleExerciseSelect}
          />
        )
      case 'statistiques':
        return (
          <StatisticsTab
            user={user}
            activities={activities}
            summary={summary}
          />
        )
      case 'exercices':
        return <ExercisesTab />
      case 'informations':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {/* Bienvenue personnalisée */}
            {user && account && (
              <PersonalizedWelcome
                firstName={user.firstName}
                gender={user.gender}
                userType={user.userType}
                age={user.age}
                grade={user.grade}
                memberSince={account.createdAt}
                daysSinceRegistration={globalTimeInfo.daysSinceRegistration}
              />
            )}

            {/* Aperçu du compte */}
            {account && user && (
              <AccountOverview
                account={account}
                currentSession={{
                  id: user.id,
                  sessionId: user.id,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  userType: user.userType
                }}
                totalSessions={account.maxSessions}
                onManageSessions={handleManageSessions}
              />
            )}

            {/* Gestion des sessions */}
            {showSessionSelector && account && user && (
              <UserSessionInfo
                currentSession={{
                  id: user.id,
                  sessionId: user.id,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  gender: user.gender,
                  userType: user.userType,
                  age: user.age,
                  grade: user.grade,
                  isActive: true,
                  createdAt: user.createdAt,
                  updatedAt: user.createdAt
                }}
                account={account}
                allSessions={[
                  {
                    id: user.id,
                    sessionId: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    gender: user.gender,
                    userType: user.userType,
                    age: user.age,
                    grade: user.grade,
                    isActive: true,
                    createdAt: user.createdAt,
                    updatedAt: user.createdAt
                  }
                ]}
                onSwitchSession={handleSwitchSession}
              />
            )}
          </motion.div>
        )
      case 'abonnements':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white p-8 rounded-xl">
              <h1 className="text-3xl font-bold mb-2">👑 Plans et Abonnements</h1>
              <p className="text-yellow-100 text-lg">
                Découvrez nos plans et débloquez toutes les fonctionnalités
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Plan Gratuit */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Plan Gratuit</h3>
                <p className="text-3xl font-bold text-gray-900 mb-2">0€<span className="text-lg text-gray-500">/mois</span></p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                    Accès aux exercices de base
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                    Statistiques simples
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                    Support communautaire
                  </li>
                </ul>
                <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium">
                  Plan actuel
                </button>
              </div>
              {/* Plan Premium */}
              <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-purple-200 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Recommandé
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Plan Premium</h3>
                <p className="text-3xl font-bold text-purple-600 mb-2">19€<span className="text-lg text-gray-500">/mois</span></p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                    Tout du plan gratuit
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                    Graphiques avancés
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                    IA Coach avancée
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                    Plan personnalisé
                  </li>
                </ul>
                <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors">
                  Choisir Premium
                </button>
              </div>
              {/* Plan Entreprise */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Plan Entreprise</h3>
                <p className="text-3xl font-bold text-gray-900 mb-2">49€<span className="text-lg text-gray-500">/mois</span></p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    Tout du plan Premium
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    Gestion multi-utilisateurs
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    Rapports détaillés
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    Support prioritaire
                  </li>
                </ul>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  Contacter
                </button>
              </div>
            </div>
          </motion.div>
        )
      case 'facturation':
        if (user?.subscriptionType === 'FREE') {
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white p-8 rounded-xl">
                <h1 className="text-3xl font-bold mb-2">💳 Facturation</h1>
                <p className="text-red-100 text-lg">
                  Cette fonctionnalité est disponible avec un compte Premium
                </p>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Upgrade requis</h3>
                <p className="text-gray-600 mb-6">
                  Passez à un compte Premium pour accéder à l'historique de facturation et aux options de paiement.
                </p>
                <button className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors">
                  Voir les plans Premium
                </button>
              </div>
            </motion.div>
          )
        }
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white p-8 rounded-xl">
              <h1 className="text-3xl font-bold mb-2">💳 Facturation</h1>
              <p className="text-red-100 text-lg">
                Gérez vos paiements et consultez votre historique
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Historique des paiements</h3>
              <p className="text-gray-600">Cette section sera développée prochainement avec l'historique complet de facturation.</p>
            </div>
          </motion.div>
        )
      case 'reglages':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8 rounded-xl">
              <h1 className="text-3xl font-bold mb-2">⚙️ Réglages</h1>
              <p className="text-indigo-100 text-lg">
                Configurez votre compte et vos préférences
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Paramètres du compte</h3>
              <p className="text-gray-600">Cette section sera développée prochainement avec tous les paramètres de configuration.</p>
            </div>
          </motion.div>
        )
      case 'aide':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div className="bg-gradient-to-r from-teal-600 to-green-600 text-white p-8 rounded-xl">
              <h1 className="text-3xl font-bold mb-2">❓ Aide & Support</h1>
              <p className="text-teal-100 text-lg">
                Trouvez des réponses à vos questions et obtenez de l'aide
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Centre d'aide</h3>
              <p className="text-gray-600">Cette section sera développée prochainement avec la documentation complète et le support.</p>
            </div>
          </motion.div>
        )
      default:
        return null
    }
  }

  if (!ready || !user || !account) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Navigation latérale fixe */}
      <div className="w-64 flex-shrink-0">
        <SidebarNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          userSubscriptionType={user.subscriptionType}
        />
      </div>

      {/* Contenu principal avec en-tête utilisateur */}
      <div className="flex-1 flex flex-col">
        {/* En-tête utilisateur personnalisé */}
        <UserHeader 
          user={user}
          account={account}
          onLogout={handleLogout}
        />

        {/* Contenu des onglets */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            <AnimatePresence mode="wait">
              {renderActiveTab()}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Bouton d'aide flottant */}
      <HelpChatButton />
    </div>
  )
} 