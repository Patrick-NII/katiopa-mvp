'use client'

import { useState, useCallback, useEffect } from 'react'
import { ModalState, ModalProps } from '../components/modals/ModalSystem'

export interface UseModalsReturn {
  modals: ModalProps[]
  modalStates: Record<string, ModalState>
  openModal: (modal: ModalProps) => void
  openBubixModal: () => void
  openCubeMatchModal: () => void
  openMemoryGameModal: () => void
  closeModal: (id: string) => void
  updateModal: (id: string, updates: Partial<ModalState>) => void
  minimizeModal: (id: string) => void
  maximizeModal: (id: string) => void
  toggleModal: (id: string) => void
}

export const useModals = (): UseModalsReturn => {
  const [modals, setModals] = useState<ModalProps[]>([])
  const [modalStates, setModalStates] = useState<Record<string, ModalState>>({})

  // Redimensionnement automatique lors du changement de taille d'écran
  useEffect(() => {
    const handleResize = () => {
      setModalStates(prev => {
        const updated = { ...prev }
        
        Object.keys(updated).forEach(modalId => {
          const modal = modals.find(m => m.id === modalId)
          if (modal && !updated[modalId].isFullscreen) {
            // Recalculer la taille et position pour maintenir l'ergonomie
            const newSize = getDefaultSize(modal.size || 'large')
            const newPosition = getDefaultPosition(newSize)
            
            updated[modalId] = {
              ...updated[modalId],
              size: newSize,
              position: newPosition,
              originalSize: newSize,
              originalPosition: newPosition
            }
          }
        })
        
        return updated
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [modals])

  const getDefaultSize = (size: string) => {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // Calculs adaptatifs pour une meilleure ergonomie
    const maxWidth = Math.min(viewportWidth * 0.9, 1200) // Max 90% de l'écran ou 1200px
    const maxHeight = Math.min(viewportHeight * 0.85, 800) // Max 85% de l'écran ou 800px
    
    switch (size) {
      case 'small': 
        return { 
          width: Math.min(400, maxWidth * 0.6), 
          height: Math.min(300, maxHeight * 0.6) 
        }
      case 'medium': 
        return { 
          width: Math.min(800, maxWidth * 0.8), 
          height: Math.min(600, maxHeight * 0.8) 
        }
      case 'large': 
        return { 
          width: maxWidth, 
          height: maxHeight 
        }
      case 'fullscreen': 
        return { 
          width: viewportWidth - 40, // Marge minimale de 20px de chaque côté
          height: viewportHeight - 40 
        }
      default: 
        return { 
          width: Math.min(800, maxWidth * 0.8), 
          height: Math.min(600, maxHeight * 0.8) 
        }
    }
  }

  const getDefaultPosition = (size: { width: number; height: number }) => {
    // Toujours centrer par rapport à l'écran
    const centerX = Math.max(0, (window.innerWidth - size.width) / 2)
    const centerY = Math.max(0, (window.innerHeight - size.height) / 2)
    
    return { x: centerX, y: centerY }
  }

  const openModal = useCallback((modal: ModalProps) => {
    setModals(prev => {
      const exists = prev.find(m => m.id === modal.id)
      if (exists) return prev
      return [...prev, modal]
    })

    const defaultSize = getDefaultSize(modal.size || 'medium')
    const centerPosition = getDefaultPosition(defaultSize)

    setModalStates(prev => ({
      ...prev,
      [modal.id]: {
        isOpen: true,
        isMinimized: false,
        isMaximized: false,
        isFullscreen: false,
        position: centerPosition,
        size: defaultSize,
        originalSize: defaultSize,
        originalPosition: centerPosition,
        zIndex: 1000 + Object.keys(prev).length
      }
    }))
  }, [])

  const openBubixModal = useCallback(() => {
    const bubixModal: ModalProps = {
      id: 'bubix',
      title: 'Bubix Assistant',
      children: null, // Will be handled by BubixModal component
      size: 'large'
    }
    
    setModals(prev => {
      const exists = prev.find(m => m.id === 'bubix')
      if (exists) return prev
      return [...prev, bubixModal]
    })

    // Calculer la taille pour prendre tout l'espace de la section
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const sidebarWidth = 224 // Largeur de la sidebar étendue
    
    const bubixSize = { 
      width: Math.min(viewportWidth - sidebarWidth - 100, 1000), // -100 pour padding
      height: Math.min(viewportHeight - 100, 800) // -100 pour padding
    }
    
    const centerPosition = {
      x: Math.max(50, (viewportWidth - bubixSize.width) / 2),
      y: Math.max(50, (viewportHeight - bubixSize.height) / 2)
    }

    setModalStates(prev => ({
      ...prev,
      bubix: {
        isOpen: true,
        isMinimized: false,
        isMaximized: false,
        isFullscreen: false,
        position: centerPosition,
        size: bubixSize,
        originalSize: bubixSize,
        originalPosition: centerPosition,
        zIndex: 1000 + Object.keys(prev).length
      }
    }))
  }, [])

  const openCubeMatchModal = useCallback(() => {
    console.log('🎮 useModals: Ouverture du modal CubeMatch en grand format...')
    
    setModals(prev => {
      const exists = prev.find(m => m.id === 'cubematch')
      if (exists) {
        console.log('⚠️ Modal CubeMatch existe déjà')
        return prev
      }
      console.log('✅ Ajout du modal CubeMatch à la liste')
      return [...prev, {
        id: 'cubematch',
        title: 'CubeMatch',
        size: 'large', // Changé de 'medium' à 'large' pour ouverture par défaut en grand
        children: null // Will be handled by CubeMatchModal component
      }]
    })

    // Utiliser la fonction getDefaultSize pour une taille optimale et cohérente
    const cubematchSize = getDefaultSize('large')
    const centerPosition = getDefaultPosition(cubematchSize)
    
    console.log('📐 Taille optimisée du modal:', cubematchSize)
    console.log('📍 Position centrée du modal:', centerPosition)

    setModalStates(prev => {
      const newState = {
        ...prev,
        cubematch: {
          isOpen: true,
          isMinimized: false,
          isMaximized: false,
          isFullscreen: false,
          position: centerPosition,
          size: cubematchSize,
          originalSize: cubematchSize,
          originalPosition: centerPosition,
          zIndex: 1000 + Object.keys(prev).length
        }
      }
      console.log('🔄 Nouveau état des modals (grand format):', newState)
      return newState
    })
  }, [])

  const openMemoryGameModal = useCallback(() => {
    setModals(prev => {
      const exists = prev.find(m => m.id === 'memorygame')
      if (exists) return prev
      return [...prev, {
        id: 'memorygame',
        title: 'Memory Game',
        size: 'medium',
        children: null // Will be handled by MemoryGameModal component
      }]
    })

    const memoryGameSize = { width: 600, height: 450 }
    const centerPosition = getDefaultPosition(memoryGameSize)

    setModalStates(prev => ({
      ...prev,
      memorygame: {
        isOpen: true,
        isMinimized: false,
        isMaximized: false,
        isFullscreen: false,
        position: centerPosition,
        size: memoryGameSize,
        originalSize: memoryGameSize,
        originalPosition: centerPosition,
        zIndex: 1000 + Object.keys(prev).length
      }
    }))
  }, [])

  const closeModal = useCallback((id: string) => {
    setModals(prev => prev.filter(m => m.id !== id))
    setModalStates(prev => {
      const newStates = { ...prev }
      delete newStates[id]
      return newStates
    })
  }, [])

  const updateModal = useCallback((id: string, updates: Partial<ModalState>) => {
    setModalStates(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...updates
      }
    }))
  }, [])

  const minimizeModal = useCallback((id: string) => {
    updateModal(id, { isMinimized: true, isMaximized: false })
  }, [updateModal])

  const maximizeModal = useCallback((id: string) => {
    updateModal(id, { isMaximized: true, isMinimized: false })
  }, [updateModal])

  const toggleModal = useCallback((id: string) => {
    const modal = modals.find(m => m.id === id)
    if (modal) {
      closeModal(id)
    } else {
      // Cette fonction nécessiterait le modal complet, donc on la laisse vide pour l'instant
    }
  }, [modals, closeModal])

  return {
    modals,
    modalStates,
    openModal,
    openBubixModal,
    openCubeMatchModal,
    openMemoryGameModal,
    closeModal,
    updateModal,
    minimizeModal,
    maximizeModal,
    toggleModal
  }
}
