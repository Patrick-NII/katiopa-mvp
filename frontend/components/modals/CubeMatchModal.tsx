'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  X,
  Minimize2,
  Maximize2,
  Square
} from 'lucide-react'
import CubeMatchUnified from '../games/CubeMatchUnified'

interface CubeMatchModalProps {
  isOpen: boolean
  onClose: () => void
  onMinimize: () => void
  onMaximize: () => void
  onFullscreen: () => void
  isMinimized: boolean
  isMaximized: boolean
  isFullscreen: boolean
  zIndex: number
  position: { x: number; y: number }
  size: { width: number; height: number }
}

export default function CubeMatchModal({
  isOpen,
  onClose,
  onMinimize,
  onMaximize,
  onFullscreen,
  isMinimized,
  isMaximized,
  isFullscreen,
  zIndex,
  position,
  size
}: CubeMatchModalProps) {
  const getModalStyles = () => {
    if (isFullscreen) {
      return {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: zIndex + 1000,
        borderRadius: 0
      }
    }
    
    if (isMaximized) {
      return {
        position: 'fixed' as const,
        top: '2.5%',
        left: '2.5%',
        width: '95vw',
        height: '95vh',
        zIndex: zIndex + 100,
        borderRadius: '1rem'
      }
    }

    // Mode mobile : optimisation pour écrans tactiles
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      return {
        position: 'fixed' as const,
        top: '2%',
        left: '2%',
        width: '96vw',
        height: '96vh',
        zIndex: zIndex,
        maxHeight: '96vh',
        overflow: 'hidden',
        borderRadius: '1rem'
      }
    }

    // Mode desktop : centrage parfait avec dimensions optimales
    return {
      position: 'fixed' as const,
      left: Math.max(20, position.x), // Marge minimale de 20px
      top: Math.max(20, position.y),  // Marge minimale de 20px
      width: Math.min(size.width, window.innerWidth - 40), // Respect des marges
      height: Math.min(size.height, window.innerHeight - 40),
      zIndex: zIndex,
      borderRadius: '1rem'
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay d'arrière-plan pour améliorer la visibilité */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-50"
        style={{ zIndex: zIndex - 1 }}
        onClick={onClose}
      />
      
      {/* Modal principal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30,
          duration: 0.4 
        }}
        className="bg-white/98 dark:bg-gray-900/98 backdrop-blur-xl shadow-2xl overflow-hidden border border-white/20 dark:border-gray-700/30"
        style={getModalStyles()}
        onClick={(e) => e.stopPropagation()}
      >
      {/* Header avec contrôles - MOBILE OPTIMISÉ */}
      <div className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white p-2 sm:p-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white/20 rounded-md sm:rounded-lg flex items-center justify-center">
            <span className="text-xs font-bold">CM</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold">CubeMatch</h2>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Boutons de contrôle - masqués sur mobile */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={onMinimize}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Réduire"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onMaximize}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Agrandir"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onFullscreen}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Plein écran"
            >
              <Square className="w-4 h-4" />
            </button>
          </div>
          {/* Bouton fermer - toujours visible, optimisé mobile */}
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-red-500/20 rounded-md sm:rounded-lg transition-colors"
            title="Fermer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Contenu du jeu - OPTIMISÉ MOBILE */}
      <div className="h-full overflow-hidden min-h-0">
        <CubeMatchUnified onClose={onClose} />
      </div>
      </motion.div>
    </>
  )
}