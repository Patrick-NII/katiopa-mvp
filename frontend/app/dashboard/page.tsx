'use client'
import { apiGet, apiPost } from '@/lib/api'
import { useEffect, useState } from 'react'
import NavBar from '@/components/NavBar'
import UserProfile from '@/components/UserProfile'
import UserStats from '@/components/UserStats'
import PerformanceCharts from '@/components/PerformanceCharts'
import FreeAccountLimitations from '@/components/FreeAccountLimitations'
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
  assessment: string
  exercises: Array<{
    title: string
    nodeKey: string
    description: string
  }>
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
    'Évaluation LLM',
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
    'Personnalisation avancée'
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

  async function evaluateLLM() {
    setLoading(true)
    try {
      const response = await apiPost<LLMResponse>('/llm/evaluate', { focus })
      setLlmResponse(response)
    } catch (err) {
      console.error('LLM evaluation failed:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'évaluation LLM')
    } finally {
      setLoading(false)
    }
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

            {/* Section LLM */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Évaluation LLM</h3>
              <div className="flex items-center gap-6 mb-6">
                <select 
                  value={focus} 
                  onChange={(e) => setFocus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px]"
                >
                  <option value="maths">Mathématiques</option>
                  <option value="coding">Programmation</option>
                </select>
                <button 
                  onClick={evaluateLLM} 
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Évaluation...' : 'Évaluer et proposer'}
                </button>
              </div>

              {llmResponse && (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 text-base mb-3">Bilan</h4>
                  <p className="text-gray-700 mb-6">{llmResponse.assessment}</p>
                  
                  <h4 className="font-medium text-gray-900 text-base mb-3">Exercices recommandés</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {llmResponse.exercises.map((exercise, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                        <h5 className="font-medium text-gray-900 mb-2">{exercise.title}</h5>
                        <p className="text-gray-600 mb-3 text-sm">{exercise.description}</p>
                        <code className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded border">
                          {exercise.nodeKey}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
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