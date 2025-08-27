'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { apiGet, apiPost } from '@/lib/api'

// Composants d'onglets
import SidebarNavigation, { NavigationTab } from '@/components/SidebarNavigation'
import DashboardTab from '@/components/DashboardTab'
import StatisticsTab from '@/components/StatisticsTab'
import DetailedUserInfo from '@/components/DetailedUserInfo'
import HelpChatButton from '@/components/HelpChatButton'
import UserHeader from '@/components/UserHeader'
import ExercisesTab from '@/components/ExercisesTab'

interface Activity {
  id: string
  domain: string
  nodeKey: string
  score: number
  attempts: number
  durationMs: number
  createdAt: string
}

interface Summary {
  domain: string
  avg: number
}

interface LLMResponse {
  data_sufficiency: 'low' | 'medium' | 'high'
  confidence: number
  summary_child: string
  summary_adult: string
  key_insights: Array<{
    title: string
    evidence: string[]
    impact: 'low' | 'medium' | 'high'
  }>
  risk_flags: string[]
  recommended_exercises: Array<{
    title: string
    nodeKey: string
    why_this: string
    target_minutes: number
    success_criteria: string
  }>
  schedule_plan: {
    next_48h: Array<{
      when_local: string
      duration_min: number
      focus: string
    }>
    spaced_practice: Array<{
      nodeKey: string
      review_on: string
      reason: string
    }>
  }
  parent_coaching: string[]
  teacher_notes: string[]
  dashboards_to_update: string[]
  missing_data: string[]
}

interface User {
  id: string
  name: string
  email: string
  age?: number
  grade?: string
  country?: string
  timezone?: string
  createdAt: string
  subscriptionType?: 'free' | 'premium' | 'enterprise'
}

interface Subscription {
  plan: string
  status: string
  startDate: string
  endDate: string
  nextBilling: string
  amount: number
  currency: string
}

interface Billing {
  invoices: Array<{
    id: string
    date: string
    amount: number
    status: string
  }>
  totalSpent: number
}

export default function Dashboard() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [summary, setSummary] = useState<Summary[]>([])
  const [llmResponse, setLlmResponse] = useState<LLMResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [focus, setFocus] = useState('maths')
  const [error, setError] = useState<string | null>(null)
  const [userPreferences, setUserPreferences] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard')

  // Déterminer le type de compte (par défaut gratuit pour les nouveaux utilisateurs)
  const [subscription] = useState<Subscription | null>(null) // null = compte gratuit
  const [billing] = useState<Billing | null>(null)

  // Définir les fonctionnalités selon le type de compte
  const currentFeatures = [
    'Accès aux exercices de base',
    'Statistiques simples',
    'Suivi de progression basique',
    'Évaluation LLM basique',
    'Support communautaire'
  ]

  const premiumFeatures = [
    'Graphiques de performance détaillés',
    'Statistiques avancées et analyses',
    'Historique complet des activités',
    'Comparaisons et tendances',
    'Export des données',
    'Support prioritaire',
    'Exercices premium exclusifs',
    'Personnalisation avancée',
    'Évaluation LLM avancée avec mémoire',
    'Plan de révision personnalisé',
    'Notes pour enseignants',
    'Suivi des risques et alertes'
  ]

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
      const response = await apiGet<{ user: User }>('/auth/me')
      if (response.user) {
        // S'assurer que le type de compte est défini
        const userWithType = {
          ...response.user,
          subscriptionType: response.user.subscriptionType || 'free'
        }
        setUser(userWithType)
      }
    } catch (err) {
      console.error('Failed to load user profile:', err)
    }
  }

  async function loadData() {
    try {
      const [activitiesRes, summaryRes] = await Promise.all([
        apiGet<{ activities: Activity[] }>('/stats/activities'),
        apiGet<{ summary: Summary[] }>('/stats/summary')
      ])
      setActivities(activitiesRes.activities)
      setSummary(summaryRes.summary)
    } catch (err) {
      console.error('Failed to load data:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données')
    }
  }

  const handlePreferencesUpdate = (preferences: any) => {
    setUserPreferences(preferences)
    // Ici vous pourriez sauvegarder les préférences via API
    console.log('Préférences mises à jour:', preferences)
  }

  // Préparer les données pour l'évaluation LLM avancée
  function prepareLLMData() {
    if (!user) return {}
    
    const now = new Date()
    const memberSince = new Date(user.createdAt)
    const daysSinceRegistration = Math.floor((now.getTime() - memberSince.getTime()) / (1000 * 60 * 60 * 24))
    const weeksSinceRegistration = Math.floor(daysSinceRegistration / 7)
    const monthsSinceRegistration = Math.floor(daysSinceRegistration / 30)
    
    // Calculer les jours d'inactivité
    const lastActivity = activities.length > 0 ? new Date(activities[0].createdAt) : null
    const daysInactive = lastActivity ? Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)) : daysSinceRegistration
    
    // Activités des 7 et 14 derniers jours
    const activities7d = activities.filter(a => {
      const activityDate = new Date(a.createdAt)
      const diffDays = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24))
      return diffDays <= 7
    })
    
    const activities14d = activities.filter(a => {
      const activityDate = new Date(a.createdAt)
      const diffDays = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24))
      return diffDays <= 14
    })
    
    const scores7d = activities7d.map(a => a.score)
    const scores14d = activities14d.map(a => a.score)
    const avgScore7d = scores7d.length > 0 ? scores7d.reduce((a, b) => a + b, 0) / scores7d.length : 0
    const avgScore14d = scores14d.length > 0 ? scores14d.reduce((a, b) => a + b, 0) / scores14d.length : 0
    
    // Calculer la pente des scores
    const scoreSlope = scores7d.length > 1 ? (scores7d[scores7d.length - 1] - scores7d[0]) / scores7d.length : 0
    
    // Analyser les domaines
    const domainStats = activities7d.reduce((acc, activity) => {
      if (!acc[activity.domain]) {
        acc[activity.domain] = { count: 0, totalScore: 0, totalTime: 0 }
      }
      acc[activity.domain].count++
      acc[activity.domain].totalScore += activity.score
      acc[activity.domain].totalTime += activity.durationMs
      return acc
    }, {} as Record<string, { count: number, totalScore: number, totalTime: number }>)
    
    // Calculer les risques
    const riskFlags = []
    if (activities7d.length === 0) riskFlags.push('inactivity_risk')
    if (scoreSlope < -5) riskFlags.push('frustration_risk')
    if (avgScore7d > 80 && activities7d.some(a => a.attempts > 1)) riskFlags.push('underchallenge_risk')
    if (activities7d.some(a => a.attempts > 3)) riskFlags.push('frustration_risk')
    
    return {
      // Informations de base de l'utilisateur
      user_id: user.id,
      user_name: user.name,
      user_email: user.email,
      user_age: user.age || 'non spécifié',
      user_grade: user.grade || 'non spécifié',
      user_country: user.country || 'non spécifié',
      user_timezone: user.timezone || 'non spécifié',
      
      // Informations d'inscription et de membre
      member_since: user.createdAt,
      member_since_formatted: memberSince.toLocaleDateString('fr-FR'),
      days_since_registration: daysSinceRegistration,
      weeks_since_registration: weeksSinceRegistration,
      months_since_registration: monthsSinceRegistration,
      subscription_type: user.subscriptionType || 'free',
      
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
      total_practice_time_minutes: Math.round(activities.reduce((acc, a) => acc + a.durationMs, 0) / (1000 * 60)),
      average_session_duration_minutes: activities.length > 0 ? 
        Math.round(activities.reduce((acc, a) => acc + a.durationMs, 0) / (activities.length * 1000 * 60)) : 0,
      
      // Tentatives et difficulté
      total_attempts: activities.reduce((acc, a) => acc + a.attempts, 0),
      average_attempts_per_activity: activities.length > 0 ? 
        Math.round(activities.reduce((acc, a) => acc + a.attempts, 0) / activities.length * 100) / 100 : 0,
      
      // Préférences et habitudes
      most_active_time: activities.length > 0 ? 
        activities.reduce((acc, a) => {
          const hour = new Date(a.createdAt).getHours()
          acc[hour] = (acc[hour] || 0) + 1
          return acc
        }, {} as Record<number, number>) : {},
      most_active_day: activities.length > 0 ? 
        activities.reduce((acc, a) => {
          const day = new Date(a.createdAt).getDay()
          acc[day] = (acc[day] || 0) + 1
          return acc
        }, {} as Record<number, number>) : {},
      
      // Préférences utilisateur (si disponibles)
      user_preferences: userPreferences || null
    }
  }

  async function evaluateLLM() {
    setLoading(true)
    try {
      const llmData = prepareLLMData()
      
      // Préparer le prompt selon le type de compte
      const prompt = user?.subscriptionType === 'premium' || user?.subscriptionType === 'enterprise'
        ? `You are Katiopa's Learning Coach LLM for children (age 5–15, MVP focus 5–7). Your job: produce a rigorous, data-driven assessment + personalized plan. Analyze this user data: ${JSON.stringify(llmData)}`
        : `Provide a basic assessment for free account: ${JSON.stringify(llmData)}`
      
      // Pour le développement, utiliser une réponse de test si l'API n'est pas disponible
      try {
        const response = await apiPost<LLMResponse>('/llm/evaluate', { 
          focus,
          prompt,
          subscriptionType: user?.subscriptionType || 'free',
          data: llmData
        })
        setLlmResponse(response)
      } catch (apiError) {
        console.log('API LLM non disponible, utilisation de la réponse de test')
        
        // Réponse de test pour le développement
        const testResponse: LLMResponse = {
          data_sufficiency: 'medium',
          confidence: 0.75,
          summary_child: "Salut petit(e) champion(ne) ! Tu as fait du bon travail en maths. Continue comme ça, tu progresses bien !",
          summary_adult: "• Performance moyenne de 75% sur les 7 derniers jours • Activité régulière avec 3 sessions cette semaine • Domaine mathématiques maîtrisé à 80%",
          key_insights: [
            {
              title: "Progression en mathématiques",
              evidence: ["score_moyen: 75%", "sessions_7j: 3", "tendance: stable"],
              impact: "medium"
            },
            {
              title: "Régularité d'apprentissage",
              evidence: ["fréquence: 3x/semaine", "durée_moyenne: 15min", "consistance: bonne"],
              impact: "high"
            }
          ],
          risk_flags: ["underchallenge_risk"],
          recommended_exercises: [
            {
              title: "Addition avec retenue",
              nodeKey: "maths_addition_retenue_01",
              why_this: "Pour renforcer la maîtrise des additions complexes",
              target_minutes: 10,
              success_criteria: "≥80% en 2 tentatives maximum"
            },
            {
              title: "Problèmes de logique",
              nodeKey: "maths_problemes_logique_02",
              why_this: "Développer le raisonnement mathématique",
              target_minutes: 15,
              success_criteria: "≥70% en 3 tentatives maximum"
            }
          ],
          schedule_plan: {
            next_48h: [
              {
                when_local: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                duration_min: 15,
                focus: "maths_addition_retenue_01"
              }
            ],
            spaced_practice: [
              {
                nodeKey: "maths_problemes_logique_02",
                review_on: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                reason: "renforcement_memoire"
              }
            ]
          },
          parent_coaching: [
            "Encouragez la pratique quotidienne, idéalement le matin quand l'enfant est plus concentré",
            "Célébrez les petites victoires pour maintenir la motivation"
          ],
          teacher_notes: [
            "L'élève montre une bonne compréhension des concepts de base. Suggérer des exercices plus complexes pour éviter l'ennui.",
            "Différenciation : proposer des défis supplémentaires pour les élèves avancés"
          ],
          dashboards_to_update: [
            "kpi: avg_score_7d, trend: +3%",
            "heatmap: time_of_day_productivity"
          ],
          missing_data: ["focus_blur_events", "hint_usage_patterns"]
        }
        
        setLlmResponse(testResponse)
      }
      
    } catch (err) {
      console.error('LLM evaluation failed:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'évaluation LLM')
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour changer d'onglet
  const handleTabChange = (tab: NavigationTab) => {
    setActiveTab(tab)
  }

  // Fonction pour gérer la sélection d'exercice
  const handleExerciseSelect = (nodeKey: string) => {
    console.log('Exercice sélectionné:', nodeKey)
    // Ici vous pourriez naviguer vers l'exercice ou l'ouvrir
  }

  // Fonction de déconnexion
  const handleLogout = () => {
    localStorage.removeItem('token')
    router.replace('/login')
  }

  // Fonction pour afficher le contenu de l'onglet actif
  const renderActiveTab = () => {
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
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-8 rounded-xl">
              <h1 className="text-3xl font-bold mb-2">👤 Profil & Préférences</h1>
              <p className="text-purple-100 text-lg">
                Gérez vos informations personnelles et vos objectifs d'apprentissage
              </p>
            </div>
            
            <DetailedUserInfo 
              user={user} 
              onPreferencesUpdate={handlePreferencesUpdate}
            />
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
        if (user?.subscriptionType === 'free') {
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

  if (!ready || !user) {
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