'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Gamepad2, 
  Trophy, 
  Star, 
  Clock, 
  Target,
  Play,
  Pause,
  RotateCcw,
  Settings,
  X,
  Minimize2,
  Maximize2,
  Square
} from 'lucide-react'

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
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameOver'>('menu')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [level, setLevel] = useState(1)
  const [target, setTarget] = useState(10)
  const [gameBoard, setGameBoard] = useState<number[][]>([])
  const [selectedCells, setSelectedCells] = useState<{row: number, col: number}[]>([])
  const [isGameRunning, setIsGameRunning] = useState(false)

  // Initialiser le plateau de jeu
  useEffect(() => {
    if (gameState === 'playing') {
      initializeGameBoard()
    }
  }, [gameState, level])

  // Timer du jeu
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isGameRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState('gameOver')
            setIsGameRunning(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isGameRunning, timeLeft])

  const initializeGameBoard = () => {
    const board: number[][] = []
    for (let i = 0; i < 6; i++) {
      const row: number[] = []
      for (let j = 0; j < 6; j++) {
        row.push(Math.floor(Math.random() * 9) + 1)
      }
      board.push(row)
    }
    setGameBoard(board)
    setTarget(Math.floor(Math.random() * 20) + 5)
  }

  const startGame = () => {
    setGameState('playing')
    setScore(0)
    setTimeLeft(60)
    setLevel(1)
    setIsGameRunning(true)
    initializeGameBoard()
  }

  const pauseGame = () => {
    setIsGameRunning(false)
    setGameState('paused')
  }

  const resumeGame = () => {
    setIsGameRunning(true)
    setGameState('playing')
  }

  const resetGame = () => {
    setIsGameRunning(false)
    setGameState('menu')
    setScore(0)
    setTimeLeft(60)
    setLevel(1)
    setSelectedCells([])
  }

  const handleCellClick = (row: number, col: number) => {
    if (gameState !== 'playing') return

    const cellIndex = selectedCells.findIndex(cell => cell.row === row && cell.col === col)
    
    if (cellIndex >= 0) {
      // Désélectionner la cellule
      setSelectedCells(prev => prev.filter((_, index) => index !== cellIndex))
    } else {
      // Sélectionner la cellule
      setSelectedCells(prev => [...prev, { row, col }])
    }
  }

  const calculateSelectedSum = () => {
    return selectedCells.reduce((sum, cell) => sum + gameBoard[cell.row][cell.col], 0)
  }

  const submitSelection = () => {
    const sum = calculateSelectedSum()
    if (sum === target) {
      setScore(prev => prev + selectedCells.length * 10)
      setSelectedCells([])
      setTarget(Math.floor(Math.random() * 20) + 5)
      
      // Nouveau niveau si score élevé
      if (score > level * 100) {
        setLevel(prev => prev + 1)
        setTimeLeft(prev => prev + 10) // Bonus de temps
      }
    } else {
      // Pénalité pour mauvaise réponse
      setScore(prev => Math.max(0, prev - 5))
    }
  }

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
    if (window.innerWidth <= 768) {
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
      <div className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gamepad2 className="w-6 h-6" />
          <h2 className="text-xl font-bold">CubeMatch</h2>
          {gameState === 'playing' && (
            <div className="flex items-center gap-2 ml-4">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{timeLeft}s</span>
            </div>
          )}
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

      {/* Contenu principal */}
      <div className="h-full overflow-y-auto p-3 md:p-6">
        {gameState === 'menu' && (
          <div className="flex flex-col items-center justify-center h-full space-y-4 md:space-y-8">
            <div className="text-center">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 md:mb-4">
                Bienvenue dans CubeMatch ! 🎮
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-base md:text-lg max-w-md px-4">
                Sélectionnez des cases adjacentes pour atteindre la cible et marquer des points !
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-8">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-2 md:p-4 text-center">
                <Target className="w-6 h-6 md:w-8 md:h-8 text-blue-600 dark:text-blue-400 mx-auto mb-1 md:mb-2" />
                <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-white">Atteignez la cible</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-2 md:p-4 text-center">
                <Trophy className="w-6 h-6 md:w-8 md:h-8 text-green-600 dark:text-green-400 mx-auto mb-1 md:mb-2" />
                <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-white">Marquez des points</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-2 md:p-4 text-center">
                <Star className="w-6 h-6 md:w-8 md:h-8 text-purple-600 dark:text-purple-400 mx-auto mb-1 md:mb-2" />
                <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-white">Montez de niveau</p>
              </div>
            </div>
            
            <button
              onClick={startGame}
              className="px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-xl font-bold text-base md:text-lg hover:from-emerald-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105"
            >
              <Play className="w-5 h-5 md:w-6 md:h-6 inline mr-2" />
              Commencer le jeu
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="space-y-3 md:space-y-6">
            {/* Statistiques de jeu */}
            <div className="grid grid-cols-3 gap-2 md:gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-2 md:p-4 text-center">
                <div className="text-lg md:text-2xl font-bold text-blue-600 dark:text-blue-400">{score}</div>
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300">Score</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-2 md:p-4 text-center">
                <div className="text-lg md:text-2xl font-bold text-green-600 dark:text-green-400">{target}</div>
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300">Cible</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-2 md:p-4 text-center">
                <div className="text-lg md:text-2xl font-bold text-purple-600 dark:text-purple-400">{level}</div>
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300">Niveau</div>
              </div>
            </div>

            {/* Plateau de jeu */}
            <div className="flex justify-center">
              <div className="grid grid-cols-6 gap-1 md:gap-2 p-2 md:p-4 bg-gray-100 dark:bg-gray-700 rounded-xl">
                {gameBoard.map((row, rowIndex) =>
                  row.map((cell, colIndex) => {
                    const isSelected = selectedCells.some(cell => cell.row === rowIndex && cell.col === colIndex)
                    return (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        className={`w-8 h-8 md:w-12 md:h-12 rounded-lg font-bold text-sm md:text-lg transition-all duration-200 ${
                          isSelected
                            ? 'bg-yellow-400 text-yellow-900 transform scale-110'
                            : 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-500'
                        }`}
                      >
                        {cell}
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            {/* Contrôles de jeu */}
            <div className="flex flex-col md:flex-row justify-center gap-2 md:gap-4">
              <button
                onClick={submitSelection}
                disabled={selectedCells.length === 0}
                className="px-4 md:px-6 py-2 md:py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm md:text-base"
              >
                Valider ({calculateSelectedSum()})
              </button>
              <button
                onClick={pauseGame}
                className="px-4 md:px-6 py-2 md:py-3 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors text-sm md:text-base"
              >
                <Pause className="w-3 h-3 md:w-4 md:h-4 inline mr-1 md:mr-2" />
                Pause
              </button>
              <button
                onClick={resetGame}
                className="px-4 md:px-6 py-2 md:py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors text-sm md:text-base"
              >
                <RotateCcw className="w-3 h-3 md:w-4 md:h-4 inline mr-1 md:mr-2" />
                Recommencer
              </button>
            </div>
          </div>
        )}

        {gameState === 'paused' && (
          <div className="flex flex-col items-center justify-center h-full space-y-8">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Jeu en pause ⏸️
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                Score actuel : <span className="font-bold text-blue-600 dark:text-blue-400">{score}</span>
              </p>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={resumeGame}
                className="px-8 py-4 bg-green-500 text-white rounded-xl font-bold text-lg hover:bg-green-600 transition-all duration-300"
              >
                <Play className="w-6 h-6 inline mr-2" />
                Reprendre
              </button>
              <button
                onClick={resetGame}
                className="px-8 py-4 bg-red-500 text-white rounded-xl font-bold text-lg hover:bg-red-600 transition-all duration-300"
              >
                <RotateCcw className="w-6 h-6 inline mr-2" />
                Recommencer
              </button>
            </div>
          </div>
        )}

        {gameState === 'gameOver' && (
          <div className="flex flex-col items-center justify-center h-full space-y-8">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Temps écoulé ! ⏰
              </h3>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 mb-6">
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">{score}</div>
                <div className="text-lg text-gray-600 dark:text-gray-300">Points marqués</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">Niveau atteint : {level}</div>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={startGame}
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-xl font-bold text-lg hover:from-emerald-600 hover:to-blue-600 transition-all duration-300"
              >
                <Play className="w-6 h-6 inline mr-2" />
                Rejouer
              </button>
              <button
                onClick={resetGame}
                className="px-8 py-4 bg-gray-500 text-white rounded-xl font-bold text-lg hover:bg-gray-600 transition-all duration-300"
              >
                Retour au menu
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
