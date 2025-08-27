import { motion } from 'framer-motion'
import { Users, Mail, Calendar, Crown, Gift, Zap, Shield, Clock } from 'lucide-react'

interface AccountOverviewProps {
  account: {
    id: string
    email: string
    subscriptionType: 'FREE' | 'PRO' | 'PRO_PLUS' | 'ENTERPRISE'
    maxSessions: number
    createdAt: string
  }
  currentSession: {
    id: string
    sessionId: string
    firstName: string
    lastName: string
    userType: 'CHILD' | 'PARENT' | 'TEACHER' | 'ADMIN'
  }
  totalSessions: number
  onManageSessions: () => void
}

export default function AccountOverview({
  account,
  currentSession,
  totalSessions,
  onManageSessions
}: AccountOverviewProps) {
  const getSubscriptionInfo = (type: string) => {
    switch (type) {
      case 'FREE':
        return {
          name: 'Plan Gratuit',
          icon: <Gift size={20} className="text-gray-600" />,
          color: 'bg-gray-100 text-gray-700 border-gray-200',
          features: ['2 sessions max', 'Fonctionnalités de base', 'Support communautaire']
        }
      case 'PRO':
        return {
          name: 'Plan Pro',
          icon: <Crown size={20} className="text-purple-600" />,
          color: 'bg-purple-100 text-purple-700 border-purple-200',
          features: ['2 sessions max', 'Fonctionnalités premium', 'Support prioritaire']
        }
      case 'PRO_PLUS':
        return {
          name: 'Plan Pro Plus',
          icon: <Zap size={20} className="text-blue-600" />,
          color: 'bg-blue-100 text-blue-700 border-blue-200',
          features: ['4 sessions max', 'Toutes fonctionnalités', 'Support dédié']
        }
      case 'ENTERPRISE':
        return {
          name: 'Plan Entreprise',
          icon: <Shield size={20} className="text-indigo-600" />,
          color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
          features: ['Sessions illimitées', 'Fonctionnalités avancées', 'Support entreprise']
        }
      default:
        return {
          name: 'Plan Inconnu',
          icon: <Gift size={20} className="text-gray-600" />,
          color: 'bg-gray-100 text-gray-700 border-gray-200',
          features: ['Fonctionnalités de base']
        }
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

  const getUserTypeDisplay = (userType: string) => {
    switch (userType) {
      case 'CHILD': return 'Enfant'
      case 'PARENT': return 'Parent'
      case 'TEACHER': return 'Enseignant'
      case 'ADMIN': return 'Administrateur'
      default: return 'Utilisateur'
    }
  }

  const subscriptionInfo = getSubscriptionInfo(account.subscriptionType)

  return (
    <motion.div
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* En-tête du compte */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <Users size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Aperçu du compte</h3>
            <p className="text-sm text-gray-600">Informations essentielles de votre compte</p>
          </div>
        </div>
        
        <div className={`px-4 py-2 rounded-full text-sm font-medium border ${subscriptionInfo.color} flex items-center gap-2`}>
          {subscriptionInfo.icon}
          {subscriptionInfo.name}
        </div>
      </div>

      {/* Informations principales du compte */}
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
            <Calendar size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-600">Membre depuis</span>
          </div>
          <p className="text-gray-900 font-medium">{formatDate(account.createdAt)}</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-600">Sessions utilisées</span>
          </div>
          <p className="text-gray-900 font-medium">
            {totalSessions} / {account.maxSessions} session{account.maxSessions > 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-600">Statut du compte</span>
          </div>
          <p className="text-gray-900 font-medium">Actif</p>
        </div>
      </div>

      {/* Session actuelle */}
      <div className="border-t border-gray-200 pt-6 mb-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users size={18} className="text-blue-600" />
          Session actuellement active
        </h4>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-blue-900">
                {currentSession.firstName} {currentSession.lastName}
              </p>
              <p className="text-sm text-blue-700">
                {getUserTypeDisplay(currentSession.userType)} • ID: {currentSession.sessionId}
              </p>
            </div>
            
            <div className="text-right">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Session active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Fonctionnalités du plan */}
      <div className="border-t border-gray-200 pt-6 mb-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
          {subscriptionInfo.icon}
          Fonctionnalités incluses
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {subscriptionInfo.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onManageSessions}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Users size={16} />
            Gérer les sessions
          </button>
          
          <div className="text-sm text-gray-600">
            <span className="font-medium">Besoin d'aide ?</span>
            <span className="ml-2">Contactez notre support</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
} 