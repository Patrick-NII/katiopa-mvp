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
    createdAt?: string
  }
  level: number
  experience: number
  totalTime: number
}

export default function UserProfile({ user, level, experience, totalTime }: UserProfileProps) {
  const { currentSessionTime } = useSession()
  const [avatarUrl, setAvatarUrl] = useState('')

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

  const formatRegistrationDate = (dateString?: string) => {
    if (!dateString) return 'Date inconnue'
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  // Calculer le niveau et l'expérience
  const experienceToNextLevel = 100 - (experience % 100)
  const progressPercentage = (experience % 100)

  // Calculer le temps total réel (session actuelle + temps cumulé)
  const effectiveTotalTime = totalTime + (currentSessionTime * 1000)

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
      {/* Première ligne : Avatar et informations utilisateur */}
      <div className="flex items-start space-x-8 mb-8">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <img 
            src={avatarUrl} 
            alt={`Avatar de ${user.firstName} ${user.lastName}`}
            className="w-24 h-24 rounded-full border-4 border-blue-100 shadow-lg"
          />
          {/* Indicateur de niveau */}
          <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold rounded-full w-10 h-10 flex items-center justify-center border-4 border-white shadow-lg">
            {level}
          </div>
        </div>

        {/* Informations utilisateur */}
        <div className="flex-1 space-y-3">
          <h2 className="text-3xl font-bold text-gray-900">
            {user.firstName} {user.lastName}
          </h2>
          <p className="text-lg text-gray-600">{user.email}</p>
          <div className="flex flex-wrap gap-3">
            <span className="text-sm text-gray-500 capitalize bg-gray-100 px-3 py-1 rounded-full">
              Rôle: {user.role.toLowerCase()}
            </span>
            <span className="text-sm text-gray-500 bg-blue-50 px-3 py-1 rounded-full">
              Membre depuis le {formatRegistrationDate(user.createdAt)}
            </span>
          </div>
        </div>

        {/* Informations de connexion détaillées */}
        <div className="flex-shrink-0 space-y-4">
          <div className="bg-green-50 p-4 rounded-xl border border-green-200">
            <div className="text-sm text-green-600 font-medium mb-1">Session actuelle</div>
            <div className="text-xl font-mono font-bold text-green-700">
              {formatTime(currentSessionTime)}
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
            <div className="text-sm text-blue-600 font-medium mb-1">Temps total</div>
            <div className="text-xl font-mono font-bold text-blue-700">
              {formatTotalTime(effectiveTotalTime)}
            </div>
          </div>
        </div>
      </div>

      {/* Deuxième ligne : Barre de progression du niveau */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <span className="text-lg font-semibold text-gray-800">
            Niveau {level} - {experience} XP
          </span>
          <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            {experienceToNextLevel} XP pour le niveau {level + 1}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Troisième ligne : Statistiques rapides sur toute la largeur */}
      <div className="grid grid-cols-4 gap-6">
        <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
          <div className="text-3xl font-bold text-blue-600 mb-2">{level}</div>
          <div className="text-sm text-blue-700 font-medium">Niveau</div>
        </div>
        <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
          <div className="text-3xl font-bold text-green-600 mb-2">{experience}</div>
          <div className="text-sm text-green-700 font-medium">XP Total</div>
        </div>
        <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {Math.floor(effectiveTotalTime / 3600000)}h
          </div>
          <div className="text-sm text-purple-700 font-medium">Temps Total</div>
        </div>
        <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
          <div className="text-3xl font-bold text-orange-600 mb-2">
            {Math.floor(currentSessionTime / 60)}
          </div>
          <div className="text-sm text-orange-700 font-medium">Min Session</div>
        </div>
      </div>
    </div>
  )
} 