'use client'
import { useState, useEffect } from 'react'
import { useSession } from '../hooks/useSession'

interface UserProfileProps {
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
    createdAt: string
    phone?: string
    country?: string
    timezone?: string
    preferences?: {
      language: string
      theme: string
      notifications: boolean
    }
    subscriptionType?: 'free' | 'premium' | 'enterprise'
  }
  level: number
  experience: number
  totalTime: number
  subscription?: {
    plan: string
    status: string
    startDate: string
    endDate: string
    nextBilling: string
    amount: number
    currency: string
  }
  billing?: {
    invoices: Array<{
      id: string
      date: string
      amount: number
      status: string
    }>
    totalSpent: number
  }
}

export default function UserProfile({ user, level, experience, totalTime, subscription, billing }: UserProfileProps) {
  const { currentSessionTime } = useSession()
  const [avatarUrl, setAvatarUrl] = useState('')

  // Déterminer si c'est un compte gratuit
  const isFreeAccount = user.subscriptionType === 'free' || !subscription

  // Générer un avatar basé sur les initiales
  useEffect(() => {
    const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']
    const randomColor = colors[Math.floor(Math.random() * colors.length)]
    
    // Créer un avatar SVG avec les initiales
    const svg = `
      <svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <rect width="80" height="80" fill="${randomColor}" rx="40"/>
        <text x="40" y="50" font-family="Arial, sans-serif" font-size="32" font-weight="bold" 
              text-anchor="middle" fill="white">${initials}</text>
      </svg>
    `
    const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`
    setAvatarUrl(dataUrl)
  }, [user.firstName, user.lastName])

  // Formater le temps
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const formatTotalTime = (milliseconds: number) => {
    if (milliseconds === 0) return '0m'
    
    const hours = Math.floor(milliseconds / 3600000)
    const minutes = Math.floor((milliseconds % 3600000) / 60000)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  const formatRegistrationDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Date inconnue'
      }
      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    } catch (error) {
      return 'Date inconnue'
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Date invalide'
      }
      return date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      })
    } catch (error) {
      return 'Date invalide'
    }
  }

  // Calculer le niveau et l'expérience
  const experienceToNextLevel = 100 - (experience % 100)
  const progressPercentage = (experience % 100)

  // Calculer le temps total réel (session actuelle + temps cumulé)
  const effectiveTotalTime = totalTime + (currentSessionTime * 1000)

  // Calculer l'ancienneté
  const calculateMembershipDuration = () => {
    try {
      const memberSince = new Date(user.createdAt)
      if (isNaN(memberSince.getTime())) {
        return 'Durée inconnue'
      }
      
      const now = new Date()
      const yearsDiff = now.getFullYear() - memberSince.getFullYear()
      const monthsDiff = now.getMonth() - memberSince.getMonth()
      const daysDiff = now.getDate() - memberSince.getDate()
      
      if (yearsDiff > 0) {
        return `${yearsDiff} an${yearsDiff > 1 ? 's' : ''}`
      } else if (monthsDiff > 0) {
        return `${monthsDiff} mois`
      } else {
        return `${daysDiff} jour${daysDiff > 1 ? 's' : ''}`
      }
    } catch (error) {
      return 'Durée inconnue'
    }
  }

  const membershipDuration = calculateMembershipDuration()

  return (
    <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
      {/* Première ligne : Avatar et informations utilisateur */}
      <div className="flex items-start space-x-8 mb-8">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <img 
            src={avatarUrl} 
            alt={`Avatar de ${user.firstName} ${user.lastName}`}
            className="w-20 h-20 rounded-full border-2 border-gray-200"
          />
          {/* Indicateur de niveau */}
          <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
            {level}
          </div>
        </div>

        {/* Informations utilisateur */}
        <div className="flex-1 space-y-3">
          <h2 className="text-2xl font-bold text-gray-900">
            {user.firstName} {user.lastName}
          </h2>
          <p className="text-gray-600">{user.email}</p>
          <div className="flex flex-wrap gap-3">
            <span className="text-sm text-gray-500 capitalize bg-gray-100 px-3 py-1 rounded-full">
              Rôle: {user.role.toLowerCase()}
            </span>
            <span className="text-sm text-gray-500 bg-blue-50 px-3 py-1 rounded-full">
              Membre depuis le {formatRegistrationDate(user.createdAt)} ({membershipDuration})
            </span>
            <span className={`text-sm px-3 py-1 rounded-full ${
              isFreeAccount 
                ? 'text-orange-600 bg-orange-50' 
                : 'text-green-600 bg-green-50'
            }`}>
              {isFreeAccount ? '🆓 Compte Gratuit' : '⭐ Compte Premium'}
            </span>
            {user.phone && (
              <span className="text-sm text-gray-500 bg-green-50 px-3 py-1 rounded-full">
                📱 {user.phone}
              </span>
            )}
            {user.country && (
              <span className="text-sm text-gray-500 bg-purple-50 px-3 py-1 rounded-full">
                🌍 {user.country}
              </span>
            )}
          </div>
          {user.preferences && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                Langue: {user.preferences.language}
              </span>
              <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                Thème: {user.preferences.theme}
              </span>
              <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                Notifications: {user.preferences.notifications ? 'Activées' : 'Désactivées'}
              </span>
            </div>
          )}
        </div>

        {/* Informations de connexion détaillées */}
        <div className="flex-shrink-0 space-y-3">
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="text-sm text-green-600 font-medium mb-1">Session actuelle</div>
            <div className="text-lg font-mono font-bold text-green-700">
              {formatTime(currentSessionTime)}
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-600 font-medium mb-1">Temps total</div>
            <div className="text-lg font-mono font-bold text-blue-700">
              {formatTotalTime(effectiveTotalTime)}
            </div>
          </div>
        </div>
      </div>

      {/* Deuxième ligne : Barre de progression du niveau */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-base font-medium text-gray-700">
            Niveau {level} - {experience} XP
          </span>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {experienceToNextLevel} XP pour le niveau {level + 1}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Troisième ligne : Statistiques rapides sur toute la largeur */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-600 mb-1">{level}</div>
          <div className="text-xs text-blue-700 font-medium">Niveau</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600 mb-1">{experience}</div>
          <div className="text-xs text-green-700 font-medium">XP Total</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-2xl font-bold text-purple-600 mb-1">
            {Math.floor(effectiveTotalTime / 3600000)}h
          </div>
          <div className="text-xs text-purple-700 font-medium">Temps Total</div>
        </div>
        <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
          <div className="text-2xl font-bold text-orange-600 mb-1">
            {Math.floor(currentSessionTime / 60)}
          </div>
          <div className="text-xs text-orange-700 font-medium">Min Session</div>
        </div>
      </div>

      {/* Bloc d'abonnements et facturation - UNIQUEMENT pour les comptes premium */}
      {!isFreeAccount && subscription && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Abonnement et facturation</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-sm text-blue-600 font-medium mb-1">Plan actuel</div>
              <div className="text-lg font-bold text-blue-800">{subscription.plan}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-blue-600 font-medium mb-1">Statut</div>
              <div className={`text-lg font-bold px-2 py-1 rounded-full text-sm ${
                subscription.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {subscription.status === 'active' ? 'Actif' : 'Inactif'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-blue-600 font-medium mb-1">Prochaine facturation</div>
              <div className="text-lg font-bold text-blue-800">{formatDate(subscription.nextBilling)}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-blue-600 font-medium mb-1">Montant</div>
              <div className="text-lg font-bold text-blue-800">{subscription.amount} {subscription.currency}</div>
            </div>
          </div>
          
          {billing && billing.invoices.length > 0 && (
            <div className="mt-4">
              <h4 className="text-base font-medium text-blue-800 mb-3">Dernières factures</h4>
              <div className="space-y-2">
                {billing.invoices.slice(0, 3).map((invoice) => (
                  <div key={invoice.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-blue-100">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-blue-600">#{invoice.id}</span>
                      <span className="text-sm text-gray-600">{formatDate(invoice.date)}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-900">{invoice.amount} {subscription.currency}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {invoice.status === 'paid' ? 'Payée' : 'En attente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-right">
                <span className="text-sm text-blue-600">
                  Total dépensé: {billing.totalSpent} {subscription.currency}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bloc d'upgrade pour les comptes gratuits */}
      {isFreeAccount && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-orange-900 mb-4">🚀 Passez à la vitesse supérieure !</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm text-orange-700 font-medium">Statistiques avancées</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">📈</div>
              <div className="text-sm text-orange-700 font-medium">Graphiques détaillés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🎯</div>
              <div className="text-sm text-orange-700 font-medium">Exercices illimités</div>
            </div>
          </div>
          <div className="text-center">
            <button className="px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors">
              Découvrir les plans Premium
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 