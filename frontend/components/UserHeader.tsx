'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, Calendar, Settings, LogOut, Mail, Crown, Gift, Zap } from 'lucide-react'
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
  const [sessionStartTime, setSessionStartTime] = useState<Date>(new Date())
  const [sessionDuration, setSessionDuration] = useState<string>('00:00:00')
  
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

  // Mettre à jour la durée de session
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      
      // Calculer la durée de session
      const diff = now.getTime() - sessionStartTime.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      
      setSessionDuration(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      )
    }, 1000)

    return () => clearInterval(timer)
  }, [sessionStartTime])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (subscriptionType: string) => {
    switch (subscriptionType) {
      case 'FREE': return 'bg-gray-500 text-white border-gray-600'
      case 'PRO': return 'bg-purple-500 text-white border-purple-600'
      case 'PRO_PLUS': return 'bg-blue-500 text-white border-blue-600'
      case 'ENTERPRISE': return 'bg-indigo-500 text-white border-indigo-600'
      default: return 'bg-gray-500 text-white border-gray-600'
    }
  }

  const getStatusIcon = (subscriptionType: string) => {
    switch (subscriptionType) {
      case 'FREE': return <Gift size={16} />
      case 'PRO': return <Crown size={16} />
      case 'PRO_PLUS': return <Zap size={16} />
      case 'ENTERPRISE': return <Crown size={16} />
      default: return <Gift size={16} />
    }
  }

  const getStatusText = (subscriptionType: string) => {
    switch (subscriptionType) {
      case 'FREE': return 'Gratuit'
      case 'PRO': return 'Pro'
      case 'PRO_PLUS': return 'Pro Plus'
      case 'ENTERPRISE': return 'Entreprise'
      default: return 'Inconnu'
    }
  }

  const getGenderGreeting = (gender: string, firstName: string) => {
    switch (gender) {
      case 'MALE': return `Bonjour ${firstName} ! 👋`
      case 'FEMALE': return `Bonjour ${firstName} ! 👋`
      default: return `Bonjour ${firstName} ! 👋`
    }
  }

  return (
    <motion.div 
      className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-4">
        {/* Avatar et nom */}
        <div className="flex items-center gap-3">
          <motion.div 
            className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg"
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {userInitial}
          </motion.div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user.firstName} {user.lastName}</h2>
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-gray-500" />
              <span className="text-sm text-gray-600">{account.email}</span>
            </div>
            {/* Informations d'identification */}
            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
              <span>ID Session: <code className="bg-gray-100 px-1 rounded">{user.id}</code></span>
              <span>ID Compte: <code className="bg-gray-100 px-1 rounded">{account.id}</code></span>
            </div>
          </div>
        </div>

        {/* Statut du compte */}
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-full text-white text-sm font-medium flex items-center gap-2 ${getStatusColor(user.subscriptionType || 'FREE')}`}>
            {getStatusIcon(user.subscriptionType || 'FREE')}
            {getStatusText(user.subscriptionType || 'FREE')}
          </div>
        </div>
      </div>

      {/* Temps et contrôles */}
      <div className="flex items-center gap-6">
        {/* Temps de session */}
        <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
          <Clock size={16} className="text-blue-600" />
          <div className="text-center">
            <div className="text-xs text-blue-600 font-medium">Session</div>
            <div className="text-sm font-mono font-bold text-blue-800">{sessionDuration}</div>
          </div>
        </div>

        {/* Date actuelle */}
        <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-lg border border-purple-200">
          <Calendar size={16} className="text-purple-600" />
          <div className="text-center">
            <div className="text-xs text-purple-600 font-medium">Date</div>
            <div className="text-sm font-bold text-purple-800">{formatDate(new Date())}</div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center gap-2">
          {/* Sélecteur de session */}
          <SessionSwitcher
            currentSessionId={user.id}
            accountId={account.id}
            onSwitchSession={onSwitchSession}
            onLogout={onLogout}
          />
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings size={20} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
} 