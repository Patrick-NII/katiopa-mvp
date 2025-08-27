'use client'
import { apiGet, apiPost } from '@/lib/api'
import { useEffect, useState } from 'react'
import NavBar from '@/components/NavBar'
import UserProfile from '@/components/UserProfile'
import UserStats from '@/components/UserStats'
import PerformanceCharts from '@/components/PerformanceCharts'
import FreeAccountLimitations from '@/components/FreeAccountLimitations'
import AnimatedLLMButton from '@/components/AnimatedLLMButton'
import AdvancedLLMResults from '@/components/AdvancedLLMResults'
import { useRouter } from 'next/navigation'

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
  firstName: string
  lastName: string
  email: string
  role: string
  createdAt: string
  phone?: string
  country?: string
  timezone?: string
  preferences?: {
    language: string
    theme: string
    notifications: boolean
  }
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

  // Préparer les données pour l'évaluation LLM avancée
  const prepareLLMData = () => {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    
    // Activités des 7 derniers jours
    const activities7d = activities.filter(a => new Date(a.createdAt) >= sevenDaysAgo)
    const activities14d = activities.filter(a => new Date(a.createdAt) >= fourteenDaysAgo)
    
    // Calculer les tendances
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
      activities_count_7d: activities7d.length,
      activities_count_14d: activities14d.length,
      avg_score_7d: avgScore7d,
      avg_score_14d: avgScore14d,
      score_slope_14d: scoreSlope,
      time_on_task_slope_14d: 0, // À calculer si nécessaire
      days_inactive_7d: 0, // À calculer si nécessaire
      domain_stats: domainStats,
      risk_flags: riskFlags,
      last_practiced_at: activities.length > 0 ? activities[0].createdAt : null,
      member_since: user?.createdAt,
      subscription_type: user?.subscriptionType || 'free'
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

  // Gérer la sélection d'un exercice
  const handleExerciseSelect = (nodeKey: string) => {
    console.log('Exercice sélectionné:', nodeKey)
    // Ici vous pouvez rediriger vers l'exercice ou l'ajouter à une liste
  }

  // Affichage du chargement pendant la vérification
  if (!ready || !user) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen bg-gray-50">
          <div className="w-full px-6 py-8">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="text-center py-12">
                <div className="spinner mx-auto mb-6 w-12 h-12"></div>
                <p className="text-lg text-gray-600">Chargement du profil utilisateur...</p>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  const isFreeAccount = user.subscriptionType === 'free'

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-gray-50">
        <div className="w-full px-6 py-8">
          {/* Profil utilisateur enrichi */}
          <UserProfile 
            user={user}
            level={Math.floor(activities.length * 10 / 100) + 1}
            experience={activities.length * 10}
            totalTime={activities.reduce((total, a) => total + a.durationMs, 0)}
            subscription={subscription}
            billing={billing}
          />

          {/* Statistiques détaillées cohérentes */}
          <UserStats 
            userId={user.id}
            activities={activities}
            memberSince={user.createdAt}
          />

          {/* Graphiques de performance - UNIQUEMENT pour les comptes premium */}
          {!isFreeAccount && (
            <PerformanceCharts 
              userId={user.id}
              memberSince={user.createdAt}
              activities={activities}
            />
          )}

          {/* Limitations du compte gratuit */}
          {isFreeAccount && (
            <FreeAccountLimitations 
              currentFeatures={currentFeatures}
              premiumFeatures={premiumFeatures}
            />
          )}

          {/* Dashboard principal */}
          <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Tableau de bord</h1>
            
            {error && (
              <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
                Erreur: {error}
              </div>
            )}
            
            {/* Statistiques principales sur toute la largeur */}
            <div className="grid grid-cols-4 gap-6 mb-8">
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-900 text-base mb-2">Activités récentes</h3>
                <p className="text-3xl font-bold text-blue-600">{activities.length}</p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <h3 className="font-medium text-green-900 text-base mb-2">Moyenne générale</h3>
                <p className="text-3xl font-bold text-green-600">
                  {summary.length > 0 
                    ? Math.round(summary.reduce((acc, s) => acc + s.avg, 0) / summary.length)
                    : 'N/A'
                  }
                </p>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                <h3 className="font-medium text-purple-900 text-base mb-2">Domaines actifs</h3>
                <p className="text-3xl font-bold text-purple-600">{summary.length}</p>
              </div>
              <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                <h3 className="font-medium text-orange-900 text-base mb-2">Score moyen</h3>
                <p className="text-3xl font-bold text-orange-600">
                  {summary.length > 0 
                    ? Math.round(summary.reduce((acc, s) => acc + s.avg, 0) / summary.length)
                    : '0'
                  }
                </p>
              </div>
            </div>

            {/* Section LLM avec bouton animé */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Évaluation IA Katiopa</h3>
              <div className="mb-6">
                <select 
                  value={focus} 
                  onChange={(e) => setFocus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px] mb-4"
                >
                  <option value="maths">Mathématiques</option>
                  <option value="coding">Programmation</option>
                  <option value="reading">Lecture</option>
                  <option value="science">Sciences</option>
                  <option value="ai">IA</option>
                </select>
                
                {/* Bouton LLM animé */}
                <AnimatedLLMButton 
                  onClick={evaluateLLM}
                  loading={loading}
                  disabled={loading}
                  subscriptionType={user.subscriptionType}
                  focus={focus}
                  className="max-w-md"
                />
              </div>

              {/* Résultats LLM avancés */}
              {llmResponse && (
                <AdvancedLLMResults 
                  result={llmResponse}
                  subscriptionType={user.subscriptionType}
                  onExerciseSelect={handleExerciseSelect}
                />
              )}
            </div>

            {/* Résumé par domaine sur toute la largeur */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Résumé par domaine</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {summary.map((s) => (
                  <div key={s.domain} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="capitalize font-medium text-gray-700">{s.domain}</span>
                    <span className="font-bold text-lg text-gray-900">{Math.round(s.avg)}/100</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 