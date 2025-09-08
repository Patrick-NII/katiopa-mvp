'use client'

import { useState, useCallback } from 'react'
import { ModalState, ModalProps } from './ModalSystem'

export interface UseModalsReturn {
  modals: ModalProps[]
  modalStates: Record<string, ModalState>
  openModal: (modal: ModalProps) => void
  closeModal: (id: string) => void
  updateModal: (id: string, updates: Partial<ModalState>) => void
  minimizeModal: (id: string) => void
  maximizeModal: (id: string) => void
  toggleModal: (id: string) => void
}

export const useModals = (): UseModalsReturn => {
  const [modals, setModals] = useState<ModalProps[]>([])
  const [modalStates, setModalStates] = useState<Record<string, ModalState>>({})

  const getDefaultSize = (size: string) => {
    switch (size) {
      case 'small': return { width: 400, height: 300 }
      case 'medium': return { width: 600, height: 400 }
      case 'large': return { width: 800, height: 600 }
      case 'fullscreen': return { width: window.innerWidth - 100, height: window.innerHeight - 100 }
      default: return { width: 600, height: 400 }
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
    closeModal,
    updateModal,
    minimizeModal,
    maximizeModal,
    toggleModal
  }
}
