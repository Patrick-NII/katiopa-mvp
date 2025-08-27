'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, ChevronDown, LogOut, User, Baby, Crown } from 'lucide-react'

interface Session {
  id: string
  sessionId: string
  firstName: string
  lastName: string
  gender: 'MALE' | 'FEMALE' | 'UNKNOWN'
  userType: 'CHILD' | 'PARENT' | 'TEACHER' | 'ADMIN'
  age?: number
  grade?: string
  isActive: boolean
  createdAt: string
}

interface SessionSwitcherProps {
  currentSessionId: string
  accountId: string
  onSwitchSession: (sessionId: string) => void
  onLogout: () => void
}

export default function SessionSwitcher({ 
  currentSessionId, 
  accountId, 
  onSwitchSession, 
  onLogout 
}: SessionSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Charger les sessions du compte
  useEffect(() => {
    if (isOpen && accountId) {
      loadSessions()
    }
  }, [isOpen, accountId])

  const loadSessions = async () => {
    setLoading(true)
    setError('')
    
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/auth/sessions/${accountId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions)
      } else {
        setError('Erreur lors du chargement des sessions')
      }
    } catch (error) {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  const handleSwitchSession = async (sessionId: string) => {
    if (sessionId === currentSessionId) {
      setIsOpen(false)
      return
    }

    try {
      // Ici, vous devriez implémenter la logique de changement de session
      // Cela pourrait impliquer de se déconnecter et de se reconnecter avec la nouvelle session
      // Pour l'instant, nous allons simuler le changement
      
      // Stocker la session cible
      localStorage.setItem('targetSessionId', sessionId)
      
      // Fermer le sélecteur
      setIsOpen(false)
      
      // Appeler le callback
      onSwitchSession(sessionId)
      
    } catch (error) {
      setError('Erreur lors du changement de session')
    }
  }

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'MALE': return '👦'
      case 'FEMALE': return '👧'
      default: return '👤'
    }
  }

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'CHILD': return <Baby size={16} />
      case 'PARENT': return <User size={16} />
      case 'TEACHER': return <Crown size={16} />
      default: return <User size={16} />
    }
  }

  const getUserTypeLabel = (userType: string) => {
    switch (userType) {
      case 'CHILD': return 'Enfant'
      case 'PARENT': return 'Parent'
      case 'TEACHER': return 'Enseignant'
      case 'ADMIN': return 'Administrateur'
      default: return 'Utilisateur'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className="relative">
      {/* Bouton principal */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-all"
      >
        <Users size={16} />
        <span className="text-sm font-medium">Changer de session</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={16} />
        </motion.div>
      </motion.button>

      {/* Menu déroulant */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Sessions disponibles</h3>
              <p className="text-sm text-gray-600">Choisissez une session pour vous connecter</p>
            </div>

            {/* Liste des sessions */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">Chargement des sessions...</p>
                </div>
              ) : error ? (
                <div className="p-4 text-center text-red-600">
                  <p className="text-sm">{error}</p>
                  <button
                    onClick={loadSessions}
                    className="mt-2 text-blue-600 hover:text-blue-700 text-sm underline"
                  >
                    Réessayer
                  </button>
                </div>
              ) : sessions.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <p className="text-sm">Aucune session trouvée</p>
                </div>
              ) : (
                <div className="p-2">
                  {sessions.map((session) => (
                    <motion.button
                      key={session.id}
                      onClick={() => handleSwitchSession(session.sessionId)}
                      className={`w-full p-3 rounded-lg text-left transition-all ${
                        session.sessionId === currentSessionId
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          {session.firstName.charAt(0).toUpperCase()}
                        </div>
                        
                        {/* Informations */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 truncate">
                              {session.firstName} {session.lastName}
                            </span>
                            {session.sessionId === currentSessionId && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                Actuel
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              {getGenderIcon(session.gender)}
                              {getUserTypeIcon(session.userType)}
                              {getUserTypeLabel(session.userType)}
                            </span>
                            {session.age && (
                              <span>• {session.age} ans</span>
                            )}
                            {session.grade && (
                              <span>• {session.grade}</span>
                            )}
                          </div>
                          
                          <div className="text-xs text-gray-500 mt-1">
                            ID: {session.sessionId} • Créé le {formatDate(session.createdAt)}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {sessions.length} session{sessions.length > 1 ? 's' : ''} disponible{sessions.length > 1 ? 's' : ''}
                </span>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                >
                  <LogOut size={16} />
                  <span className="text-sm">Déconnexion</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay pour fermer le menu */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
} 