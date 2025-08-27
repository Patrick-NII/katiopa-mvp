'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Mail, 
  Clock, 
  Calendar, 
  Power, 
  Crown, 
  Gift,
  LogOut,
  Settings
} from 'lucide-react'

interface UserHeaderProps {
  user: {
    name: string
    email: string
    subscriptionType: string
    createdAt: string
  }
  onLogout: () => void
}

export default function UserHeader({ user, onLogout }: UserHeaderProps) {
  const [sessionStartTime, setSessionStartTime] = useState<Date>(new Date())
  const [globalTime, setGlobalTime] = useState<Date>(new Date())
  const [sessionDuration, setSessionDuration] = useState<string>('00:00:00')

  // Mettre à jour le temps global et la durée de session
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setGlobalTime(now)
      
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
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getStatusColor = (subscriptionType: string) => {
    switch (subscriptionType) {
      case 'premium':
        return 'bg-gradient-to-r from-purple-500 to-blue-500'
      case 'enterprise':
        return 'bg-gradient-to-r from-blue-500 to-indigo-500'
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600'
    }
  }

  const getStatusIcon = (subscriptionType: string) => {
    switch (subscriptionType) {
      case 'premium':
        return <Crown size={16} className="text-yellow-300" />
      case 'enterprise':
        return <Crown size={16} className="text-blue-300" />
      default:
        return <Gift size={16} className="text-gray-300" />
    }
  }

  const getStatusText = (subscriptionType: string) => {
    switch (subscriptionType) {
      case 'premium':
        return 'Premium'
      case 'enterprise':
        return 'Entreprise'
      default:
        return 'Gratuit'
    }
  }

  return (
    <motion.div 
      className="bg-white border-b border-gray-200 px-6 py-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between">
        {/* Informations utilisateur */}
        <div className="flex items-center gap-6">
          {/* Avatar et nom */}
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {user.name.charAt(0).toUpperCase()}
            </motion.div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-gray-500" />
                <span className="text-sm text-gray-600">{user.email}</span>
              </div>
            </div>
          </div>

          {/* Statut du compte */}
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-white text-sm font-medium flex items-center gap-2 ${getStatusColor(user.subscriptionType)}`}>
              {getStatusIcon(user.subscriptionType)}
              {getStatusText(user.subscriptionType)}
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

          {/* Temps global */}
          <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
            <Calendar size={16} className="text-green-600" />
            <div className="text-center">
              <div className="text-xs text-green-600 font-medium">Temps global</div>
              <div className="text-sm font-mono font-bold text-green-800">{formatTime(globalTime)}</div>
            </div>
          </div>

          {/* Date actuelle */}
          <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-lg border border-purple-200">
            <Calendar size={16} className="text-purple-600" />
            <div className="text-center">
              <div className="text-xs text-purple-600 font-medium">Date</div>
              <div className="text-sm font-bold text-purple-800">{formatDate(globalTime)}</div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center gap-2">
            <motion.button
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Paramètres"
            >
              <Settings size={18} />
            </motion.button>
            
            <motion.button
              onClick={onLogout}
              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Déconnexion"
            >
              <LogOut size={18} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Barre de progression de la session */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Début de session: {sessionStartTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
          <span>Durée totale: {sessionDuration}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1">
          <motion.div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-1 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
        </div>
      </div>
    </motion.div>
  )
} 