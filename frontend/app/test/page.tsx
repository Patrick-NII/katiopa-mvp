'use client'
import { apiGet } from '@/lib/api'
import { useState, useEffect } from 'react'
import NavBar from '@/components/NavBar'

export default function TestPage() {
  const [token, setToken] = useState<string | null>(null)
  const [activities, setActivities] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    setToken(storedToken)
  }, [])

  async function testAPI() {
    try {
      const response = await apiGet('/stats/activities')
      setActivities(response)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur API')
      setActivities(null)
    }
  }

  return (
    <>
      <NavBar />
      <div className="container-narrow">
        <div className="card">
          <h1 className="text-2xl font-semibold mb-4">Page de Test</h1>
          
          <div className="mb-4">
            <h3 className="font-medium mb-2">Token JWT</h3>
            <p className="text-sm text-gray-600 break-all">
              {token ? `✅ ${token.substring(0, 50)}...` : '❌ Aucun token trouvé'}
            </p>
          </div>

          <div className="mb-4">
            <button onClick={testAPI} className="btn btn-primary">
              Tester l'API /stats/activities
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
              Erreur: {error}
            </div>
          )}

          {activities && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700">
              <h4 className="font-medium">Réponse API:</h4>
              <pre className="text-sm mt-2 overflow-auto">
                {JSON.stringify(activities, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </>
  )
} 