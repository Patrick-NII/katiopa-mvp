'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Users, LogIn, RefreshCw } from 'lucide-react'

interface SessionInfo {
  sessionId: string
  firstName: string
  lastName: string
  userType: 'CHILD' | 'PARENT'
  age?: number
  grade?: string
}

interface SessionSelectorProps {
  onSessionSelect: (sessionId: string, userType: 'CHILD' | 'PARENT') => void
  className?: string
}

export default function SessionSelector({ onSessionSelect, className = '' }: SessionSelectorProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const testSessions: SessionInfo[] = [
    {
      sessionId: 'parent-session',
      firstName: 'Parent',
      lastName: 'Test',
      userType: 'PARENT'
    },
    {
      sessionId: 'milan-session',
      firstName: 'Milan',
      lastName: 'Test',
      userType: 'CHILD',
      age: 8,
      grade: 'CE2'
    },
    {
      sessionId: 'aylon-session',
      firstName: 'Aylon',
      lastName: 'Test',
      userType: 'CHILD',
      age: 10,
      grade: 'CM1'
    }
  ]

  const handleSessionLogin = async (sessionId: string, userType: 'CHILD' | 'PARENT') => {
    try {
      setLoading(true)
      setError('')

      // Simuler une connexion (dans un vrai système, ceci ferait un appel API)
      console.log(`Connexion à la session: ${sessionId} (${userType})`)
      
      // Stocker la session dans localStorage pour la simulation
      localStorage.setItem('currentSessionId', sessionId)
      localStorage.setItem('currentUserType', userType)
      
      // Appeler la fonction de callback
      onSessionSelect(sessionId, userType)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const getSessionIcon = (userType: 'CHILD' | 'PARENT') => {
    return userType === 'PARENT' ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />
  }

  const getSessionColor = (userType: 'CHILD' | 'PARENT') => {
    return userType === 'PARENT' 
      ? 'bg-purple-100 text-purple-700 border-purple-200' 
      : 'bg-blue-100 text-blue-700 border-blue-200'
  }

  return (
    <div className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl p-6 ${className}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <LogIn className="w-8 h-8 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sélection de Session
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          Choisissez une session pour tester le système
        </p>
      </motion.div>

      {/* Erreur */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <div className="w-5 h-5">⚠️</div>
            <p>{error}</p>
          </div>
        </motion.div>
      )}

      {/* Sessions disponibles */}
      <div className="space-y-4">
        {testSessions.map((session, index) => (
          <motion.div
            key={session.sessionId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-xl border-2 transition-all hover:shadow-lg ${getSessionColor(session.userType)}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getSessionIcon(session.userType)}
                <div>
                  <h3 className="font-semibold">
                    {session.firstName} {session.lastName}
                  </h3>
                  <div className="text-sm opacity-75">
                    {session.userType === 'CHILD' ? (
                      <>
                        {session.age} ans • {session.grade}
                      </>
                    ) : (
                      'Compte Parent'
                    )}
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSessionLogin(session.sessionId, session.userType)}
                disabled={loading}
                className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                Se connecter
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
      >
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Instructions :
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• <strong>Parent :</strong> Accès au dashboard avec radar comparatif des enfants</li>
          <li>• <strong>Enfant :</strong> Accès aux exercices et radar personnel</li>
          <li>• <strong>Mot de passe :</strong> test123 (pour toutes les sessions)</li>
        </ul>
      </motion.div>
    </div>
  )
}

