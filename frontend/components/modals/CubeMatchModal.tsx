'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  X,
  Minimize2,
  Maximize2,
  Square
} from 'lucide-react'
import CubeMatchGame from '../games/CubeMatchGame'

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
        zIndex: zIndex + 1000
      }
    }
    
    if (isMaximized) {
      return {
        position: 'fixed' as const,
        top: '5%',
        left: '5%',
        width: '90vw',
        height: '90vh',
        zIndex: zIndex + 100
      }
    }

    // Mode mobile : prendre tout l'écran
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      return {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: zIndex
      }
    }

    return {
      position: 'fixed' as const,
      left: position.x,
      top: position.y,
      width: size.width,
      height: size.height,
      zIndex: zIndex
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden"
      style={getModalStyles()}
    >
      {/* Header avec contrôles */}
      <div className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-xs font-bold">CM</span>
          </div>
          <h2 className="text-lg font-bold">CubeMatch</h2>
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
          {/* Bouton fermer - toujours visible */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contenu du jeu */}
      <div className="h-full overflow-hidden">
        <CubeMatchGame />
      </div>
    </motion.div>
  )
}