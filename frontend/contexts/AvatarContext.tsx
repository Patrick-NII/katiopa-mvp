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
        if (parsed.avatarPath && parsed.avatarPath.trim() !== '') {
          setSelectedAvatar(parsed.avatarPath)
          return
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'avatar:', error)
      }
    }
    
    // Si aucun avatar sauvegardé, utiliser le premier par défaut
    const defaultAvatars = [
      '/avatar/DF43E25C-2338-4B0A-B541-F3C9C6749C70_1_105_c.jpeg',
      '/avatar/C680597F-C476-47A3-8AFD-5BF7480AB18F_1_105_c.jpeg',
      '/avatar/9032E0D4-24CB-43FF-A828-D73BACF6A2CB_1_105_c.jpeg',
      '/avatar/AFABF252-DC83-4CB8-96FD-F93E4848144F_1_105_c.jpeg',
      '/avatar/630F3A22-5A32-4B9D-89F2-BE41C6D06047_1_105_c.jpeg',
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
    
    // Utiliser le premier avatar par défaut
    setSelectedAvatar(defaultAvatars[0])
  }, [])

  // Mettre à jour l'avatar depuis les réglages
  const updateAvatarFromSettings = (avatar: string) => {
    if (avatar && avatar.trim() !== '') {
      setSelectedAvatar(avatar)
      // Sauvegarder immédiatement dans localStorage
      const savedSettings = localStorage.getItem('userSettings')
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings)
          parsed.avatarPath = avatar
          localStorage.setItem('userSettings', JSON.stringify(parsed))
        } catch (error) {
          console.error('Erreur lors de la sauvegarde de l\'avatar:', error)
        }
      }
    }
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
