'use client'

import { useState, useEffect } from 'react'
import { useChildSessions } from './useChildSessions'

interface CompetenceData {
  competence: string
  score: number
  maxScore: number
  level: string
  progress: number
}

interface ChildProfile {
  id: string
  name: string
  color: string
  age?: number
  data: CompetenceData[]
}

interface UseRadarDataProps {
  userSessionId?: string
  isChild?: boolean
  userType?: 'CHILD' | 'PARENT'
}

export function useRadarData({ userSessionId, isChild = false, userType = 'CHILD' }: UseRadarDataProps) {
  const [profiles, setProfiles] = useState<ChildProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  
  // Récupérer les sessions enfants
  const { childSessions, currentSession, loading: sessionsLoading, error: sessionsError } = useChildSessions({ userType })

  useEffect(() => {
    if (!sessionsLoading) {
      if (childSessions.length > 0) {
        fetchRadarData()
      } else {
        // Pas de sessions, arrêter le chargement
        setLoading(false)
        setError('Aucune session trouvée')
        setProfiles([])
        console.log('⚠️ Aucune session trouvée dans useRadarData')
      }
    }
  }, [userSessionId, childSessions, sessionsLoading])

  const fetchRadarData = async () => {
    try {
      setLoading(true)
      setError('')

      // Déterminer quelle session utiliser (utiliser l'ID de base de données pour l'API)
      const targetSessionId = userSessionId || (isChild ? currentSession?.id : undefined)
      
      if (!targetSessionId) {
        throw new Error('Aucune session trouvée')
      }

      console.log('Récupération des données radar pour la session:', targetSessionId)

      console.log('🔍 Utilisation des routes de test pour les données radar')
      console.log('🔍 Target Session ID:', targetSessionId)
      console.log('🔍 URL appelée:', `/api/sessions-test/${targetSessionId}/competences`)
      
      const response = await fetch(`/api/sessions-test/${targetSessionId}/competences`, {
        credentials: 'include'
      })

      console.log('🔍 Response status:', response.status)
      console.log('🔍 Response ok:', response.ok)

      const data = await response.json()
      console.log('🔍 Data received:', data)
      
      if (data.success && data.data.radarData) {
        // Transformer les données pour le radar chart
        const sessionName = isChild 
          ? `${currentSession?.firstName || 'Enfant'} ${currentSession?.lastName || ''}`.trim()
          : childSessions.find(s => s.id === targetSessionId)?.firstName || 'Enfant'

        // Mapping des compétences API vers les clés radar
        const competenceMapping: Record<string, string> = {
          'mathematiques': 'mathematiques',
          'mathematics': 'mathematiques',
          'math': 'mathematiques',
          'programmation': 'programmation',
          'programming': 'programmation',
          'creativite': 'creativite',
          'creativity': 'creativite',
          'creative': 'creativite',
          'communication': 'communication',
          'concentration': 'concentration',
          'focus': 'concentration',
          'resolution_problemes': 'resolution_problemes',
          'problem_solving': 'resolution_problemes',
          'problemes': 'resolution_problemes',
          'connaissances_generales': 'connaissances_generales',
          'general_knowledge': 'connaissances_generales',
          'knowledge': 'connaissances_generales',
          'sens_critique': 'sens_critique',
          'critical_thinking': 'sens_critique',
          'critique': 'sens_critique'
        }

        const profile: ChildProfile = {
          id: currentSession?.sessionId || targetSessionId,
          name: sessionName,
          color: getColorForChild(targetSessionId),
          age: currentSession?.age || undefined,
          data: data.data.radarData.map((item: any) => {
            // Mapper la compétence vers la clé attendue
            const mappedCompetence = competenceMapping[item.competence.toLowerCase()] || item.competence.toLowerCase()
            return {
              competence: mappedCompetence,
              score: Number(item.score).toFixed(2),
              maxScore: item.maxScore,
              level: item.level,
              progress: item.progress
            }
          })
        }

        console.log('✅ Profile créé:', {
          id: profile.id,
          name: profile.name,
          dataLength: profile.data.length,
          competences: profile.data.map(d => ({ competence: d.competence, score: d.score }))
        })

        setProfiles([profile])
        console.log('✅ Données radar chargées depuis la BDD:', profile.name, profile.data.length, 'compétences')
      } else {
        throw new Error('Aucune donnée radar trouvée')
      }
      
    } catch (err) {
      console.error('Erreur lors du chargement des données radar:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      
      // Fallback avec des données de test
      const fallbackProfile: ChildProfile = {
        id: userSessionId || 'fallback',
        name: isChild ? 'Enfant' : 'Enfant Test',
        color: '#3B82F6',
        data: [
          { competence: 'mathematiques', score: 0, maxScore: 10, level: 'Débutant', progress: 0 },
          { competence: 'programmation', score: 0, maxScore: 10, level: 'Débutant', progress: 0 },
          { competence: 'creativite', score: 0, maxScore: 10, level: 'Débutant', progress: 0 },
          { competence: 'collaboration', score: 0, maxScore: 10, level: 'Débutant', progress: 0 },
          { competence: 'concentration', score: 0, maxScore: 10, level: 'Débutant', progress: 0 },
          { competence: 'resolution_problemes', score: 0, maxScore: 10, level: 'Débutant', progress: 0 },
          { competence: 'communication', score: 0, maxScore: 10, level: 'Débutant', progress: 0 },
          { competence: 'connaissances_generales', score: 0, maxScore: 10, level: 'Débutant', progress: 0 },
          { competence: 'sens_critique', score: 0, maxScore: 10, level: 'Débutant', progress: 0 },
          { competence: 'reflexion_logique', score: 0, maxScore: 10, level: 'Débutant', progress: 0 }
        ]
      }
      setProfiles([fallbackProfile])
    } finally {
      setLoading(false)
    }
  }

  const getColorForChild = (sessionId: string) => {
    const colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B']
    const index = childSessions.findIndex(s => s.id === sessionId)
    return colors[index % colors.length]
  }

  const refreshData = () => {
    fetchRadarData()
  }

  return {
    profiles,
    loading,
    error,
    refreshData
  }
}

// Hook pour récupérer les données de plusieurs enfants (pour les parents)
export function useMultiChildRadarData({ userType = 'PARENT' }: { userType?: 'CHILD' | 'PARENT' }) {
  const [profiles, setProfiles] = useState<ChildProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  // Récupérer les sessions enfants
  const { childSessions, loading: sessionsLoading, error: sessionsError } = useChildSessions({ userType })

  useEffect(() => {
    if (!sessionsLoading) {
      if (childSessions.length > 0) {
        fetchMultiChildData()
      } else {
        // Pas de sessions enfants, arrêter le chargement
        setLoading(false)
        setError('')
        setProfiles([])
        console.log('⚠️ Aucune session enfant trouvée')
      }
    }
  }, [childSessions, sessionsLoading])

  const fetchMultiChildData = async () => {
    try {
      setLoading(true)
      setError('')

      console.log('Récupération des vraies données multi-enfants depuis la BDD')
      console.log('🔍 Sessions enfants récupérées:', childSessions.map(s => ({ id: s.id, sessionId: s.sessionId, name: s.firstName })))

      const promises = childSessions.map(async (session) => {
        console.log(`🔍 Traitement de la session: ${session.firstName} (ID: ${session.id}, SessionID: ${session.sessionId})`)
        
        // Utiliser les routes de test qui fonctionnent
        console.log(`🔍 Utilisation des routes de test pour ${session.firstName}`)
        const response = await fetch(`/api/sessions-test/${session.id}/competences`, {
          credentials: 'include'
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`❌ Erreur HTTP ${response.status} pour ${session.firstName}:`, errorText)
          throw new Error(`Erreur pour la session ${session.firstName} (HTTP ${response.status})`)
        }

        const data = await response.json()
        console.log(`✅ Données récupérées pour ${session.firstName}:`, data)
        
        if (data.success && data.data.radarData) {
          // Mapping des compétences API vers les clés radar
          const competenceMapping: Record<string, string> = {
            'mathematiques': 'mathematiques',
            'mathematics': 'mathematiques',
            'math': 'mathematiques',
            'programmation': 'programmation',
            'programming': 'programmation',
            'creativite': 'creativite',
            'creativity': 'creativite',
            'creative': 'creativite',
            'communication': 'communication',
            'concentration': 'concentration',
            'focus': 'concentration',
            'resolution_problemes': 'resolution_problemes',
            'problem_solving': 'resolution_problemes',
            'problemes': 'resolution_problemes',
            'connaissances_generales': 'connaissances_generales',
            'general_knowledge': 'connaissances_generales',
            'knowledge': 'connaissances_generales',
            'sens_critique': 'sens_critique',
            'critical_thinking': 'sens_critique',
            'critique': 'sens_critique'
          }

          const profile = {
            id: session.sessionId,
            name: `${session.firstName} ${session.lastName}`.trim(),
            color: getColorForChild(session.id),
            age: session.age || undefined,
            data: data.data.radarData.map((item: any) => {
              // Mapper la compétence vers la clé attendue
              const mappedCompetence = competenceMapping[item.competence.toLowerCase()] || item.competence.toLowerCase()
              return {
                competence: mappedCompetence,
                score: Number(item.score).toFixed(2),
                maxScore: item.maxScore,
                level: item.level,
                progress: item.progress
              }
            })
          }
          console.log(`✅ Profil créé pour ${session.firstName}:`, profile)
          return profile
        }
        
        console.warn(`⚠️ Données invalides pour ${session.firstName}:`, data)
        return null
      })

      const results = await Promise.all(promises)
      const validProfiles = results.filter((profile): profile is ChildProfile => profile !== null)
      
      console.log(`✅ Résultats finaux: ${validProfiles.length} profils valides sur ${childSessions.length} sessions`)
      setProfiles(validProfiles)
      console.log('✅ Données multi-enfants chargées depuis la BDD:', validProfiles.length, 'profils')
      
    } catch (err) {
      console.error('❌ Erreur globale dans fetchMultiChildData:', err)
      console.error('❌ Stack trace:', err instanceof Error ? err.stack : 'Pas de stack trace')
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const getColorForChild = (sessionId: string) => {
    const colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B']
    const index = childSessions.findIndex(s => s.id === sessionId)
    return colors[index % colors.length]
  }

  const refreshData = () => {
    fetchMultiChildData()
  }

  return {
    profiles,
    loading: loading || sessionsLoading,
    error: error || sessionsError,
    refreshData,
    childSessions
  }
}
