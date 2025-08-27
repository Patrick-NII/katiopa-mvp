'use client'
import { useState, useEffect } from 'react'

interface UserProfileProps {
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
  }
  level: number
  experience: number
  totalTime: number
}

export default function UserProfile({ user, level, experience, totalTime }: UserProfileProps) {
  const [connectionTime, setConnectionTime] = useState(0)
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

  // Calculer le temps de connexion en temps réel
  useEffect(() => {
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setConnectionTime(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

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

  // Calculer le niveau et l'expérience
  const experienceToNextLevel = 100 - (experience % 100)
  const progressPercentage = (experience % 100)

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex items-center space-x-4 mb-6">
        {/* Avatar */}
        <div className="relative">
          <img 
            src={avatarUrl} 
            alt={`Avatar de ${user.firstName} ${user.lastName}`}
            className="w-20 h-20 rounded-full border-4 border-blue-100"
          />
          {/* Indicateur de niveau */}
          <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center border-2 border-white">
            {level}
          </div>
        </div>

        {/* Informations utilisateur */}
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">
            {user.firstName} {user.lastName}
          </h2>
          <p className="text-gray-600">{user.email}</p>
          <p className="text-sm text-gray-500 capitalize">Rôle: {user.role.toLowerCase()}</p>
        </div>

        {/* Temps de connexion */}
        <div className="text-right">
          <div className="text-sm text-gray-500 mb-1">Temps de connexion</div>
          <div className="text-lg font-mono font-bold text-blue-600">
            {formatTime(connectionTime)}
          </div>
        </div>
      </div>

      {/* Barre de progression du niveau */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Niveau {level} - {experience} XP
          </span>
          <span className="text-sm text-gray-500">
            {experienceToNextLevel} XP pour le niveau {level + 1}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{level}</div>
          <div className="text-xs text-blue-600">Niveau</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{experience}</div>
          <div className="text-xs text-green-600">XP Total</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {Math.floor(totalTime / 3600000)}h
          </div>
          <div className="text-xs text-purple-600">Temps Total</div>
        </div>
      </div>
    </div>
  )
} 