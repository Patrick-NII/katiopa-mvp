'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Minimize2, 
  Maximize2, 
  Square, 
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

export interface ModalState {
  isOpen: boolean
  isMinimized: boolean
  isMaximized: boolean
  isFullscreen: boolean
  position: { x: number; y: number }
  size: { width: number; height: number }
  originalSize: { width: number; height: number }
  originalPosition: { x: number; y: number }
  zIndex: number
}

export interface ModalProps {
  id: string
  title: string
  children: React.ReactNode
  size?: 'small' | 'medium' | 'large' | 'fullscreen'
  position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  closable?: boolean
  minimizable?: boolean
  maximizable?: boolean
  resizable?: boolean
  draggable?: boolean
  onClose?: () => void
  onMinimize?: () => void
  onMaximize?: () => void
  className?: string
}

interface ModalSystemProps {
  modals: ModalProps[]
  modalStates: Record<string, ModalState>
  onModalChange: (id: string, updates: Partial<ModalState>) => void
}

const ModalSystem: React.FC<ModalSystemProps> = ({ modals, modalStates, onModalChange }) => {
  const [draggedModal, setDraggedModal] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const getDefaultSize = (size: string) => {
    switch (size) {
      case 'small': return { width: 400, height: 300 }
      case 'medium': return { width: 600, height: 400 }
      case 'large': return { width: 800, height: 600 }
      case 'fullscreen': return { width: window.innerWidth - 100, height: window.innerHeight - 100 }
      default: return { width: 600, height: 400 }
    }
  }

  const getDefaultPosition = (position: string, size: { width: number; height: number }) => {
    // Toujours centrer par rapport à l'écran
    const centerX = Math.max(0, (window.innerWidth - size.width) / 2)
    const centerY = Math.max(0, (window.innerHeight - size.height) / 2)
    
    return { x: centerX, y: centerY }
  }

  const handleMouseDown = (e: React.MouseEvent, modalId: string) => {
    if (!modals.find(m => m.id === modalId)?.draggable) return
    
    e.preventDefault()
    setDraggedModal(modalId)
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggedModal) return
    
    const newX = e.clientX - dragOffset.x
    const newY = e.clientY - dragOffset.y
    
    onModalChange(draggedModal, {
      position: { x: Math.max(0, newX), y: Math.max(0, newY) }
    })
  }

  const handleMouseUp = () => {
    setDraggedModal(null)
  }

  const handleMinimize = (modalId: string) => {
    const modal = modals.find(m => m.id === modalId)
    if (!modal) return

    const currentState = modalStates[modalId]
    if (!currentState) return

    onModalChange(modalId, {
      isMinimized: true,
      isMaximized: false,
      isFullscreen: false,
      position: { x: window.innerWidth - 300, y: window.innerHeight - 80 },
      size: { width: 300, height: 60 }
    })

    modal.onMinimize?.()
  }

  const handleMaximize = (modalId: string) => {
    const modal = modals.find(m => m.id === modalId)
    if (!modal) return

    const currentState = modalStates[modalId]
    if (!currentState) return

    const originalSize = currentState.originalSize || getDefaultSize(modal.size || 'medium')
    const originalPosition = currentState.originalPosition || getDefaultPosition(modal.position || 'center', originalSize)

    if (currentState.isMaximized) {
      // Restaurer la taille originale
      onModalChange(modalId, {
        isMaximized: false,
        isMinimized: false,
        isFullscreen: false,
        size: originalSize,
        position: originalPosition
      })
    } else {
      // Sauvegarder la taille actuelle et maximiser
      onModalChange(modalId, {
        isMaximized: true,
        isMinimized: false,
        isFullscreen: false,
        originalSize: currentState.size,
        originalPosition: currentState.position,
        size: { width: window.innerWidth - 100, height: window.innerHeight - 100 },
        position: { x: 50, y: 50 }
      })
    }

    modal.onMaximize?.()
  }

  const handleFullscreen = (modalId: string) => {
    const modal = modals.find(m => m.id === modalId)
    if (!modal) return

    const currentState = modalStates[modalId]
    if (!currentState) return

    if (currentState.isFullscreen) {
      // Sortir du plein écran
      const originalSize = currentState.originalSize || getDefaultSize(modal.size || 'medium')
      const originalPosition = currentState.originalPosition || getDefaultPosition(modal.position || 'center', originalSize)
      
      onModalChange(modalId, {
        isFullscreen: false,
        isMinimized: false,
        isMaximized: false,
        size: originalSize,
        position: originalPosition
      })
    } else {
      // Entrer en plein écran
      onModalChange(modalId, {
        isFullscreen: true,
        isMinimized: false,
        isMaximized: false,
        originalSize: currentState.size,
        originalPosition: currentState.position,
        size: { width: window.innerWidth, height: window.innerHeight },
        position: { x: 0, y: 0 }
      })
    }
  }

  const handleReset = (modalId: string) => {
    const modal = modals.find(m => m.id === modalId)
    if (!modal) return

    const defaultSize = getDefaultSize(modal.size || 'medium')
    const centerPosition = getDefaultPosition('center', defaultSize)

    onModalChange(modalId, {
      isMinimized: false,
      isMaximized: false,
      isFullscreen: false,
      size: defaultSize,
      position: centerPosition,
      originalSize: defaultSize,
      originalPosition: centerPosition
    })
  }

  useEffect(() => {
    if (draggedModal) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [draggedModal, dragOffset])

  return (
    <>
      {/* Modals normaux */}
      <AnimatePresence>
        {modals.map((modal) => {
          const modalState = modalStates[modal.id]
          if (!modalState || modalState.isMinimized) return null

          const size = modalState.size
          const position = modalState.position

          return (
            <motion.div
              key={modal.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`fixed inset-0 z-50 flex items-center justify-center ${
                modalState.isFullscreen ? 'p-0' : 'p-4'
              }`}
              style={{ zIndex: 1000 + modals.indexOf(modal) }}
            >
              {/* Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => modal.closable !== false && modal.onClose?.()}
              />

              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className={`backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-2xl flex flex-col ${
                  modalState.isFullscreen ? 'w-full h-full rounded-none' : 'max-w-4xl max-h-[90vh]'
                } ${modal.className || ''}`}
                style={{
                  width: modalState.isFullscreen ? '100%' : size.width,
                  height: modalState.isFullscreen ? '100%' : size.height,
                  position: modalState.isFullscreen ? 'relative' : 'absolute',
                  left: modalState.isFullscreen ? 'auto' : position.x,
                  top: modalState.isFullscreen ? 'auto' : position.y,
                }}
              >
                {/* Header */}
                <div
                  className={`flex items-center justify-between p-4 border-b border-white/20 dark:border-gray-700/50 ${
                    modal.draggable !== false ? 'cursor-move' : ''
                  }`}
                  onMouseDown={(e) => handleMouseDown(e, modal.id)}
                >
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {modal.title}
                    </h3>
                    {modalState.isMinimized && (
                      <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                        Réduit
                      </span>
                    )}
                    {modalState.isMaximized && (
                      <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                        Agrandi
                      </span>
                    )}
                    {modalState.isFullscreen && (
                      <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
                        Plein écran
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Minimize */}
                    {modal.minimizable !== false && (
                      <button
                        onClick={() => handleMinimize(modal.id)}
                        className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Réduire"
                      >
                        <Minimize2 className="w-4 h-4" />
                      </button>
                    )}
                    
                    {/* Maximize */}
                    {modal.maximizable !== false && (
                      <button
                        onClick={() => handleMaximize(modal.id)}
                        className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title={modalState.isMaximized ? "Restaurer" : "Agrandir"}
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    )}
                    
                    {/* Fullscreen */}
                    <button
                      onClick={() => handleFullscreen(modal.id)}
                      className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title={modalState.isFullscreen ? "Sortir du plein écran" : "Plein écran"}
                    >
                      <Square className="w-4 h-4" />
                    </button>
                    
                    {/* Close */}
                    {modal.closable !== false && (
                      <button
                        onClick={() => modal.onClose?.()}
                        className="p-2 text-gray-600 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                        title="Fermer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  {modal.children}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-white/20 dark:border-gray-700/50">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReset(modal.id)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Réinitialiser"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Réinitialiser
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => modal.onClose?.()}
                      className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* Modals minimisés */}
      <AnimatePresence>
        {modals.map((modal) => {
          const modalState = modalStates[modal.id]
          if (!modalState || !modalState.isMinimized) return null

          return (
            <motion.div
              key={`minimized-${modal.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-4 right-4 z-50"
              style={{ zIndex: 1000 + modals.indexOf(modal) }}
            >
              <div
                className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 rounded-lg border border-white/20 dark:border-gray-700/50 shadow-xl p-3 cursor-pointer hover:shadow-2xl transition-all duration-200"
                onClick={() => {
                  // Restaurer le modal au centre
                  const defaultSize = getDefaultSize(modal.size || 'medium')
                  const centerPosition = getDefaultPosition('center', defaultSize)
                  
                  onModalChange(modal.id, {
                    isMinimized: false,
                    isMaximized: false,
                    isFullscreen: false,
                    size: defaultSize,
                    position: centerPosition
                  })
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    {modal.title.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {modal.title}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Cliquez pour restaurer
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      modal.onClose?.()
                    }}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </>
  )
}

export default ModalSystem