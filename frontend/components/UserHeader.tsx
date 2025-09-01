'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { authAPI } from '@/lib/api'
import { useAvatar } from '@/contexts/AvatarContext'

interface UserHeaderProps {
  userType?: 'CHILD' | 'PARENT' | 'TEACHER' | 'ADMIN'
  subscriptionType?: string
}

interface UserInfo {
  sessionId: string
  firstName: string
  lastName: string
  userType: string
  subscriptionType: string
  avatarPath?: string
}

export default function UserHeader({ userType, subscriptionType }: UserHeaderProps) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { selectedAvatar } = useAvatar()

  // Charger les informations utilisateur
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const response = await authAPI.verify()
        if (response.success) {
          setUser(response.user)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des informations utilisateur:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserInfo()
  }, [])

  // Obtenir l'avatar par défaut basé sur le type d'utilisateur
  const getDefaultAvatar = (userType: string) => {
    const avatars = [
      '/avatar/DF43E25C-2338-4B0A-B541-F3C9C6749C70_1_105_c.jpeg',
      '/avatar/C680597F-C476-47A3-8AFD-5BF7480AB18F_1_105_c.jpeg',
      '/avatar/9032E0D4-24CB-43FF-A828-D73BACF6A2CB_1_105_c.jpeg',
      '/avatar/AFABF252-DC83-4CB8-96FD-F93E4848144F_1_105_c.jpeg',
      '/avatar/630F22-5A32-4B9D-89F2-BE41C6D06047_1_105_c.jpeg',
      '/avatar/B651627E-16E8-4B38-964C-52AC717EA8A6_1_105_c.jpeg',
      '/avatar/4585039E-FE54-402B-967A-49505261DCCA_1_105_c.jpeg',
      '/avatar/46634418-D597-4138-A12C-ED6DB610C8BD_1_105_c.jpeg',
      '/avatar/1643C2A2-D991-4327-878E-6A5B94E0C320_1_105_c.jpeg',
      '/avatar/17AF2653-1B7A-43F7-B376-0616FC6C0DBD_1_105_c.jpeg',
      '/avatar/45840AC6-AFFE-46E0-9668-51CFD4C9740B_1_105_c.jpeg',
      '/avatar/54E70A9E-8558-429D-87D6-52DECAAF983D_1_105_c.jpeg',
      '/avatar/4456CAC7-32C6-4419-967E-291D37C9B368_1_105_c.jpeg',
      '/avatar/358DF2B2-AE4E-4359-AB2E-DD45D240D78F_1_105_c.jpeg',
      '/avatar/013BDBD7-230C-4ECD-B292-2C66159ACCBC_1_105_c.jpeg',
      '/avatar/840CE97E-2237-41EE-9559-E3A152359D61_1_105_c.jpeg',
      '/avatar/01A68700-5E6F-4EA5-A6B6-2E954AD53A0D_1_105_c.jpeg'
    ]
    
    // Utiliser le hash du sessionId pour sélectionner un avatar de manière déterministe
    if (user?.sessionId) {
      const hash = user.sessionId.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0)
        return a & a
      }, 0)
      return avatars[Math.abs(hash) % avatars.length]
    }
    
    return avatars[0]
  }

  // Obtenir les couleurs selon l'abonnement
  const getSubscriptionColors = () => {
    const type = user?.subscriptionType?.toUpperCase() || 'FREE'
    
    switch (type) {
      case 'PRO':
        return {
          gradient: 'from-blue-500 to-indigo-600',
          text: 'text-blue-600'
        }
      case 'PREMIUM':
      case 'PRO_PLUS':
        return {
          gradient: 'from-fuchsia-500 to-violet-600',
          text: 'text-fuchsia-600'
        }
      case 'ENTERPRISE':
        return {
          gradient: 'from-purple-500 to-pink-600',
          text: 'text-purple-600'
        }
      default:
        return {
          gradient: 'from-blue-500 to-violet-600',
          text: 'text-blue-600'
        }
    }
  }

  if (isLoading || !user) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
    )
  }

  const colors = getSubscriptionColors()
  
  // Priorité : 1. Avatar sélectionné dans les réglages, 2. Avatar par défaut
  const avatarPath = selectedAvatar || user.avatarPath || getDefaultAvatar(user.userType)

  return (
    <div className="fixed top-4 right-4 z-50">
      <motion.div
        className="flex items-center space-x-3 p-3 rounded-2xl bg-white/90 backdrop-blur-sm shadow-lg border border-gray-200"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Avatar */}
        <div className="relative">
          <img
            src={avatarPath}
            alt={`Avatar de ${user.firstName}`}
            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
          />
          {/* Indicateur de statut en ligne */}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
        </div>

        {/* Informations utilisateur */}
        <div className="text-left">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-gray-900 text-sm">
              {user.firstName} {user.lastName}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">ID:</span>
            <span className={`text-xs font-mono ${colors.text} font-semibold multicolor-id`}>
              {user.sessionId}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  )
} 