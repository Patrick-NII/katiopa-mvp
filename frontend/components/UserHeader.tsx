'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, Calendar, Settings, LogOut, Mail, Crown } from 'lucide-react'
import { useTotalConnectionTime } from '../hooks/useTotalConnectionTime'
import SessionSwitcher from './SessionSwitcher'

interface UserHeaderProps {
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    gender: 'MALE' | 'FEMALE' | 'UNKNOWN'
    userType: 'CHILD' | 'PARENT' | 'TEACHER' | 'ADMIN'
    age?: number
    grade?: string
    subscriptionType: 'FREE' | 'PRO' | 'PRO_PLUS' | 'ENTERPRISE'
    createdAt: string
  }
  account: {
    id: string
    email: string
    subscriptionType: 'FREE' | 'PRO' | 'PRO_PLUS' | 'ENTERPRISE'
    maxSessions: number
    createdAt: string
  }
  onLogout: () => void
  onSwitchSession: (sessionId: string) => void
}

export default function UserHeader({ user, account, onLogout, onSwitchSession }: UserHeaderProps) {
  const [sessionStartTime, setSessionStartTime] = useState<Date>(() => {
    // Récupérer le temps de session depuis localStorage ou créer une nouvelle session
    const savedSessionStart = localStorage.getItem(`session_start_${user.id}`)
    const savedSessionDuration = localStorage.getItem(`session_duration_${user.id}`)
    
    if (savedSessionStart && savedSessionDuration) {
      // Reprendre la session existante
      const startTime = new Date(parseInt(savedSessionStart))
      const duration = parseInt(savedSessionDuration)
      const now = new Date()
      
      // Vérifier si la session n'est pas trop ancienne (plus de 24h)
      if (now.getTime() - startTime.getTime() < 24 * 60 * 60 * 1000) {
        return startTime
      }
    }
    
    // Nouvelle session
    const newStartTime = new Date()
    localStorage.setItem(`session_start_${user.id}`, newStartTime.getTime().toString())
    localStorage.setItem(`session_duration_${user.id}`, '0')
    return newStartTime
  })
  
  const [sessionDuration, setSessionDuration] = useState<string>('00:00:00')
  const [isSessionPaused, setIsSessionPaused] = useState<boolean>(false)
  const [lastActivityTime, setLastActivityTime] = useState<Date>(new Date())
  
  // Utiliser le hook pour le temps total de connexion depuis l'inscription
  const totalConnectionTime = useTotalConnectionTime(account.createdAt)

  // Vérification de sécurité - si pas d'utilisateur, afficher un loader
  if (!user || !account) {
    return (
      <motion.div 
        className="bg-white border-b border-gray-200 px-6 py-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Chargement des informations utilisateur...</span>
        </div>
      </motion.div>
    )
  }

  // Vérification de sécurité pour le nom
  const userName = `${user.firstName} ${user.lastName}` || 'Utilisateur'
  const userInitial = user.firstName?.charAt(0)?.toUpperCase() || 'U'

  // Détecter l'activité utilisateur
  useEffect(() => {
    const handleUserActivity = () => {
      setLastActivityTime(new Date())
      
      // Réactiver la session si elle était en pause
      if (isSessionPaused) {
        setIsSessionPaused(false)
        console.log('🔄 Session réactivée après activité utilisateur')
      }
    }

    // Événements à surveiller pour détecter l'activité
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity)
      })
    }
  }, [isSessionPaused])

  // Mettre à jour la durée de session et gérer la pause
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      
      // Vérifier l'inactivité (5 minutes)
      const inactivityThreshold = 5 * 60 * 1000 // 5 minutes
      const timeSinceLastActivity = now.getTime() - lastActivityTime.getTime()
      
      if (timeSinceLastActivity > inactivityThreshold && !isSessionPaused) {
        setIsSessionPaused(true)
        console.log('⏸️ Session mise en pause (inactivité > 5 min)')
      }
      
      // Calculer la durée de session seulement si elle n'est pas en pause
      if (!isSessionPaused) {
        const diff = now.getTime() - sessionStartTime.getTime()
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        
        const durationString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        setSessionDuration(durationString)
        
        // Sauvegarder la durée dans localStorage
        localStorage.setItem(`session_duration_${user.id}`, diff.toString())
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [sessionStartTime, isSessionPaused, lastActivityTime, user.id])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  // Fonction pour réinitialiser la session (appelée lors de la déconnexion)
  const resetSession = () => {
    localStorage.removeItem(`session_start_${user.id}`)
    localStorage.removeItem(`session_duration_${user.id}`)
    console.log('🔄 Session réinitialisée')
  }

  // Fonction pour réactiver manuellement la session
  const reactivateSession = () => {
    if (isSessionPaused) {
      setIsSessionPaused(false)
      setLastActivityTime(new Date())
      console.log('🔄 Session réactivée manuellement')
    }
  }



  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'CHILD': return <Crown size={14} className="text-purple-600" />
      case 'PARENT': return <Crown size={14} className="text-blue-600" />
      case 'TEACHER': return <Crown size={14} className="text-indigo-600" />
      case 'ADMIN': return <Crown size={14} className="text-red-600" />
      default: return <Crown size={14} className="text-gray-600" />
    }
  }

  return (
    <motion.div 
      className="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-8 py-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Section gauche : Informations utilisateur */}
          <div className="flex items-center gap-6">
            {/* Avatar et nom */}
            <div className="flex items-center gap-4">
              <motion.div 
                className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {userInitial}
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{userName}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-gray-400" />
                    <span className="font-medium">{account.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getUserTypeIcon(user.userType)}
                    <span className="font-medium">
                      {user.userType === 'CHILD' ? 'Enfant' : 'Parent'}
                    </span>
                    {user.age && <span>• {user.age} ans</span>}
                    {user.grade && <span>• {user.grade}</span>}
                  </div>
                </div>
              </div>
            </div>


          </div>

          {/* Section droite : Informations de session et contrôles */}
          <div className="flex items-center gap-6">
            {/* Temps de session - affiché selon le type d'utilisateur et le plan */}
            {user.userType === 'PARENT' && account.subscriptionType !== 'FREE' ? (
              // Session Parent : Temps total du compte
              <motion.div 
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <Clock size={18} className="text-white" />
                </div>
                <div>
                  <div className="text-xs font-medium text-blue-600">
                    Temps total compte
                  </div>
                  <div className="text-lg font-mono font-bold text-blue-800">
                    {totalConnectionTime.totalTimeFormatted}
                  </div>
                </div>
              </motion.div>
            ) : user.userType === 'CHILD' && account.subscriptionType !== 'FREE' ? (
              // Session Enfant : Temps de session individuel
              <motion.div 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer ${
                  isSessionPaused 
                    ? 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300' 
                    : 'bg-gradient-to-r from-purple-0 to-pink-50'
                }`}
                onClick={isSessionPaused ? reactivateSession : undefined}
                whileHover={isSessionPaused ? { scale: 1.02 } : {}}
                whileTap={isSessionPaused ? { scale: 0.98 } : {}}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isSessionPaused ? 'bg-gray-500' : 'bg-blue-500'
                }`}>
                  <Clock size={18} className="text-white" />
                </div>
                <div>
                  <div className={`text-xs font-medium transition-all duration-300 ${
                    isSessionPaused ? 'text-gray-600' : 'text-blue-600'
                  }`}>
                    {isSessionPaused ? 'Session en pause' : 'Ma session'}
                  </div>
                  <div className={`text-lg font-mono font-bold transition-all duration-300 ${
                    isSessionPaused ? 'text-gray-700' : 'text-blue-800'
                  }`}>
                    {sessionDuration}
                  </div>
                  {isSessionPaused && (
                    <div className="text-xs text-gray-500 mt-1">
                      Cliquez pour réactiver
                    </div>
                  )}
                </div>
              </motion.div>
            ) : null}

            {/* Date actuelle - design épuré */}
            <div className="flex items-center gap-3 bg-gradient-to-r from-purple-0 to-pink-50 px-4 py-3 rounded-xl">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <Calendar size={18} className="text-white" />
              </div>
              <div>
                <div className="text-xs text-purple-600 font-medium">Date</div>
                <div className="text-sm font-semibold text-purple-800">{formatDate(new Date())}</div>
              </div>
            </div>

            {/* Boutons d'action - design moderne */}
            <div className="flex items-center gap-3 bg-gradient-to-r from-purple-0 to-pink-50 px-4 py-3 rounded-xl">
              {/* Sélecteur de session */}
              <SessionSwitcher
                currentSessionId={user.id}
                accountId={account.id}
                onSwitchSession={onSwitchSession}
                onLogout={() => {
                  resetSession() // Réinitialiser la session avant la déconnexion
                  onLogout()
                }}
              />
              
              
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
} 