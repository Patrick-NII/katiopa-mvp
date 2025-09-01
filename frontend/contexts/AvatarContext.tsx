'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AvatarContextType {
  selectedAvatar: string
  setSelectedAvatar: (avatar: string) => void
  updateAvatarFromSettings: (avatar: string) => void
}

const AvatarContext = createContext<AvatarContextType | undefined>(undefined)

export function AvatarProvider({ children }: { children: ReactNode }) {
  const [selectedAvatar, setSelectedAvatar] = useState<string>('')

  // Charger l'avatar depuis les réglages au démarrage
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        if (parsed.avatarPath) {
          setSelectedAvatar(parsed.avatarPath)
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'avatar:', error)
      }
    }
  }, [])

  // Mettre à jour l'avatar depuis les réglages
  const updateAvatarFromSettings = (avatar: string) => {
    setSelectedAvatar(avatar)
  }

  return (
    <AvatarContext.Provider value={{ 
      selectedAvatar, 
      setSelectedAvatar, 
      updateAvatarFromSettings 
    }}>
      {children}
    </AvatarContext.Provider>
  )
}

export function useAvatar() {
  const context = useContext(AvatarContext)
  if (context === undefined) {
    throw new Error('useAvatar must be used within an AvatarProvider')
  }
  return context
}
