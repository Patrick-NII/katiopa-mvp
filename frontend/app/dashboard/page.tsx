'use client'
import { apiGet, apiPost } from '@/lib/api'
import { useEffect, useState } from 'react'
import NavBar from '@/components/NavBar'
import UserProfile from '@/components/UserProfile'
import UserStats from '@/components/UserStats'
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
        setUser(response.user)
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
        <div className="container-narrow">
          <div className="card">
            <div className="text-center py-8">
              <div className="spinner mx-auto mb-4"></div>
              <p>Chargement du profil utilisateur...</p>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <NavBar />
      <div className="container-narrow">
        {/* Profil utilisateur */}
        <UserProfile 
          user={user}
          level={Math.floor(activities.length * 10 / 100) + 1}
          experience={activities.length * 10}
          totalTime={activities.reduce((total, a) => total + a.durationMs, 0)}
        />

        {/* Statistiques détaillées */}
        <UserStats userId={user.id} />

        {/* Dashboard principal */}
        <div className="card mb-6">
          <h1 className="text-2xl font-semibold mb-4">Tableau de bord</h1>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
              Erreur: {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900">Activités récentes</h3>
              <p className="text-2xl font-bold text-blue-600">{activities.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-900">Moyenne générale</h3>
              <p className="text-2xl font-bold text-green-600">
                {summary.length > 0 
                  ? Math.round(summary.reduce((acc, s) => acc + s.avg, 0) / summary.length)
                  : 'N/A'
                }
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Évaluation LLM</h3>
            <div className="flex gap-3 mb-4">
              <select 
                value={focus} 
                onChange={(e) => setFocus(e.target.value)}
                className="input max-w-xs"
              >
                <option value="maths">Mathématiques</option>
                <option value="coding">Programmation</option>
              </select>
              <button 
                onClick={evaluateLLM} 
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Évaluation...' : 'Évaluer et proposer'}
              </button>
            </div>

            {llmResponse && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Bilan</h4>
                <p className="text-gray-700 mb-4">{llmResponse.assessment}</p>
                
                <h4 className="font-medium mb-2">Exercices recommandés</h4>
                <div className="space-y-2">
                  {llmResponse.exercises.map((exercise, index) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <h5 className="font-medium">{exercise.title}</h5>
                      <p className="text-sm text-gray-600">{exercise.description}</p>
                      <code className="text-xs text-blue-600 bg-blue-50 px-1 py-0.5 rounded">
                        {exercise.nodeKey}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Résumé par domaine</h3>
            <div className="space-y-2">
              {summary.map((s) => (
                <div key={s.domain} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="capitalize">{s.domain}</span>
                  <span className="font-medium">{Math.round(s.avg)}/100</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 