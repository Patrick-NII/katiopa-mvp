'use client'

import React from 'react'
import { motion } from 'framer-motion'
import SessionSelector from '../../components/auth/SessionSelector'
import RadarChart from '../../components/charts/RadarChart'
import CompetencesExercises from '../../components/exercises/CompetencesExercises'
import { useCurrentSession } from '../../hooks/useCurrentSession'
import { useRadarData } from '../../hooks/useRadarData'
import { useChildSessions } from '../../hooks/useChildSessions'
import { Shield, Users, User, ArrowLeft } from 'lucide-react'

export default function TestPage() {
  const { currentSession, login, logout, isLoggedIn } = useCurrentSession()
  const { childSessions } = useChildSessions({ userType: currentSession?.userType || 'CHILD' })

  const handleSessionSelect = (sessionId: string, userType: 'CHILD' | 'PARENT') => {
    login(sessionId, userType)
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <SessionSelector onSessionSelect={handleSessionSelect} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {currentSession?.userType === 'PARENT' ? (
                <Users className="w-8 h-8 text-purple-600" />
              ) : (
                <User className="w-8 h-8 text-blue-600" />
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Dashboard {currentSession?.userType === 'PARENT' ? 'Parent' : 'Enfant'}
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Session: {currentSession?.sessionId}
                </p>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Changer de session
            </button>
          </div>
        </motion.div>

        {/* Contenu selon le type d'utilisateur */}
        {currentSession?.userType === 'PARENT' ? (
          <div className="space-y-8">
            {/* Sessions enfants disponibles */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-6 h-6 text-purple-600" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Sessions Enfants Disponibles
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {childSessions.map((child, index) => (
                    <div key={child.id} className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                        {child.firstName} {child.lastName}
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {child.age} ans • {child.grade}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        ID: {child.id}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Radar Chart Parent */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <RadarChart 
                userType="PARENT"
                isChild={false}
                compareModeDefault={true}
                className="mb-8"
              />
            </motion.div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Exercices pour enfants */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <CompetencesExercises 
                userSessionId={currentSession.sessionId}
                className="mb-8"
              />
            </motion.div>

            {/* Radar Chart Enfant */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <RadarChart 
                isChild={true}
                userType="CHILD"
                className="mb-8"
              />
            </motion.div>
          </div>
        )}

        {/* Informations de debug */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Informations de Debug :
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <p>Session ID: {currentSession?.sessionId}</p>
            <p>Type: {currentSession?.userType}</p>
            <p>Sessions enfants trouvées: {childSessions.length}</p>
            <p>Backend: http://localhost:4000</p>
            <p>Frontend: http://localhost:3000</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}