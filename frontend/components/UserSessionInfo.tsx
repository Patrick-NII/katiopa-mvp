import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Users, Mail, Key, Calendar, Crown, Gift, Zap } from 'lucide-react'

interface UserSession {
  id: string
  sessionId: string
  firstName: string
  lastName: string
  gender: 'MALE' | 'FEMALE' | 'UNKNOWN'
  userType: 'CHILD' | 'PARENT' | 'TEACHER' | 'ADMIN'
  age?: number
  grade?: string
  isActive: boolean
  lastLoginAt?: string
}

interface Account {
  id: string
  email: string
  subscriptionType: 'FREE' | 'PRO' | 'PRO_PLUS' | 'ENTERPRISE'
  maxSessions: number
  createdAt: string
}

interface UserSessionInfoProps {
  currentSession: UserSession
  account: Account
  allSessions: UserSession[]
  onSwitchSession: (sessionId: string) => void
}

export default function UserSessionInfo({
  currentSession,
  account,
  allSessions,
  onSwitchSession
}: UserSessionInfoProps) {
  const [showSessionSelector, setShowSessionSelector] = useState(false)

  const getGenderDisplay = (gender: string) => {
    switch (gender) {
      case 'MALE': return 'Garçon'
      case 'FEMALE': return 'Fille'
      default: return 'Non spécifié'
    }
  }

  const getUserTypeDisplay = (userType: string) => {
    switch (userType) {
      case 'CHILD': return 'Enfant'
      case 'PARENT': return 'Parent'
      case 'TEACHER': return 'Enseignant'
      case 'ADMIN': return 'Administrateur'
      default: return 'Utilisateur'
    }
  }

  const getSubscriptionDisplay = (type: string) => {
    switch (type) {
      case 'FREE': return 'Découverte'
      case 'PRO': return 'Explorateur'
      case 'PRO_PLUS': return 'Maître'
      case 'ENTERPRISE': return 'Entreprise'
      default: return 'Inconnu'
    }
  }

  const getSubscriptionIcon = (type: string) => {
    switch (type) {
      case 'FREE': return <Gift size={16} />
      case 'PRO': return <Crown size={16} />
      case 'PRO_PLUS': return <Zap size={16} />
      case 'ENTERPRISE': return <Crown size={16} />
      default: return <Gift size={16} />
    }
  }

  const getSubscriptionColor = (type: string) => {
    switch (type) {
      case 'FREE': return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'PRO': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'PRO_PLUS': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'ENTERPRISE': return 'bg-indigo-100 text-indigo-700 border-indigo-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return 'Date invalide'
    }
  }

  return (
    <motion.div
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* En-tête avec informations du compte */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <Users size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Informations de session</h3>
            <p className="text-sm text-gray-600">Gérez vos sessions et votre compte</p>
          </div>
        </div>
        
        <div className={`px-4 py-2 rounded-full text-sm font-medium border ${getSubscriptionColor(account.subscriptionType)} flex items-center gap-2`}>
          {getSubscriptionIcon(account.subscriptionType)}
          {getSubscriptionDisplay(account.subscriptionType)}
        </div>
      </div>

      {/* Informations du compte */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Mail size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-600">Email du compte</span>
          </div>
          <p className="text-gray-900 font-medium">{account.email}</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Key size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-600">ID Compte</span>
          </div>
          <p className="text-gray-900 font-mono text-sm">{account.id}</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-600">Membre depuis</span>
          </div>
          <p className="text-gray-900 font-medium">{formatDate(account.createdAt)}</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-600">Sessions max</span>
          </div>
          <p className="text-gray-900 font-medium">{account.maxSessions} session{account.maxSessions > 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Session actuelle */}
      <div className="border-t border-gray-200 pt-6 mb-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User size={18} className="text-blue-600" />
          Session actuelle
        </h4>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-blue-900">
                {currentSession.firstName} {currentSession.lastName}
              </p>
              <div className="flex items-center gap-4 text-sm text-blue-700 mt-1">
                <span>{getGenderDisplay(currentSession.gender)}</span>
                <span>•</span>
                <span>{getUserTypeDisplay(currentSession.userType)}</span>
                {currentSession.age && (
                  <>
                    <span>•</span>
                    <span>{currentSession.age} ans</span>
                  </>
                )}
                {currentSession.grade && (
                  <>
                    <span>•</span>
                    <span>{currentSession.grade}</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-xs text-blue-600 font-medium">ID Session</p>
              <p className="text-sm font-mono text-blue-900">{currentSession.sessionId}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sélecteur de session */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
            <Users size={18} className="text-green-600" />
            Changer de session
          </h4>
          
          <button
            onClick={() => setShowSessionSelector(!showSessionSelector)}
            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
          >
            {showSessionSelector ? 'Masquer' : 'Afficher'}
          </button>
        </div>
        
        {showSessionSelector && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-2"
          >
            {allSessions.map((session) => (
              <div
                key={session.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  session.id === currentSession.id
                    ? 'bg-blue-100 border-blue-300'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
                onClick={() => onSwitchSession(session.sessionId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      session.id === currentSession.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-300 text-gray-700'
                    }`}>
                      {session.firstName.charAt(0)}{session.lastName.charAt(0)}
                    </div>
                    <div>
                      <p className={`font-medium ${
                        session.id === currentSession.id ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {session.firstName} {session.lastName}
                      </p>
                      <p className="text-xs text-gray-600">
                        {getUserTypeDisplay(session.userType)} • {getGenderDisplay(session.gender)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xs text-gray-500">ID</p>
                    <p className="text-sm font-mono text-gray-700">{session.sessionId}</p>
                  </div>
                </div>
                
                {session.id === currentSession.id && (
                  <div className="mt-2 text-xs text-blue-600 font-medium">
                    ✓ Session active
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
} 
