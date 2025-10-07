'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useScreenSize } from '@/hooks/useScreenSize'
import { cubeMatchAPI, type ScoreData, type GameSettings } from '@/lib/api/cubematch-v2'
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
  Plus,
  Minus,
  Zap,
  Award,
  TrendingUp,
  Volume2,
  VolumeX,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Lightbulb
} from 'lucide-react'

// Types unifiés
type Operator = 'ADD' | 'SUB' | 'MUL' | 'DIV' | 'MIXED'
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'
type GameState = 'menu' | 'playing' | 'paused' | 'gameOver' | 'settings'

interface Cell {
  id: string
  row: number
  col: number
  value: number | null
  bornAt: number
  selected?: boolean
}

interface GameConfig {
  gridSize: number
  operator: Operator
  difficulty: Difficulty
  timeLimit: number
  unlimitedTime: boolean
  allowDiagonals: boolean
  soundEnabled: boolean
  hintsEnabled: boolean
  autoSubmit: boolean
  spawnRate: number
  maxNumbers: number
  target: number
  theme: 'rainbow' | 'ocean' | 'sunset' | 'forest'
}

interface GameStats {
  score: number
  level: number
  combo: number
  bestCombo: number
  lives: number
  timeLeft: number
  cellsCleared: number
  totalMoves: number
  successfulMoves: number
  hintsUsed: number
  accuracy: number
  timePlayedMs: number
}

interface CubeMatchUnifiedProps {
  onClose?: () => void
  onScoreSubmit?: (score: number) => void
  initialConfig?: Partial<GameConfig>
  isFullPage?: boolean
}

// Configuration par défaut
const DEFAULT_CONFIG: GameConfig = {
  gridSize: 6,
  operator: 'ADD',
  difficulty: 'MEDIUM',
  timeLimit: 60,
  unlimitedTime: false,
  allowDiagonals: true,
  soundEnabled: true,
  hintsEnabled: true,
  autoSubmit: false,
  spawnRate: 2000,
  maxNumbers: 20,
  target: 10,
  theme: 'rainbow'
}

// Thèmes visuels - Design Enfantin Attrayant
const THEMES = {
  rainbow: {
    primary: 'from-blue-400 via-purple-500 to-indigo-500',
    secondary: 'from-yellow-400 via-red-500 to-pink-500',
    accent: 'bg-gradient-to-r from-pink-500 to-purple-500',
    background: 'bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100',
    cell: 'bg-white border-2 border-pink-200 shadow-lg hover:shadow-xl',
    selectedCell: 'bg-gradient-to-br from-pink-200 to-purple-200 border-2 border-pink-400 shadow-xl',
    text: 'text-gray-800',
    button: 'from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700'
  },
  ocean: {
    primary: 'from-cyan-400 via-blue-500 to-teal-500',
    secondary: 'from-blue-400 via-cyan-500 to-teal-400',
    accent: 'bg-gradient-to-r from-cyan-500 to-blue-500',
    background: 'bg-gradient-to-br from-cyan-100 via-blue-50 to-teal-100',
    cell: 'bg-white border-2 border-cyan-200 shadow-lg hover:shadow-xl',
    selectedCell: 'bg-gradient-to-br from-cyan-200 to-blue-200 border-2 border-cyan-400 shadow-xl',
    text: 'text-gray-800',
    button: 'from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700'
  },
  sunset: {
    primary: 'from-orange-400 via-red-500 to-pink-500',
    secondary: 'from-yellow-400 via-orange-500 to-red-400',
    accent: 'bg-gradient-to-r from-orange-500 to-red-500',
    background: 'bg-gradient-to-br from-orange-100 via-red-50 to-pink-100',
    cell: 'bg-white border-2 border-orange-200 shadow-lg hover:shadow-xl',
    selectedCell: 'bg-gradient-to-br from-orange-200 to-red-200 border-2 border-orange-400 shadow-xl',
    text: 'text-gray-800',
    button: 'from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700'
  },
  forest: {
    primary: 'from-green-400 via-emerald-500 to-teal-500',
    secondary: 'from-lime-400 via-green-500 to-emerald-400',
    accent: 'bg-gradient-to-r from-green-500 to-emerald-500',
    background: 'bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100',
    cell: 'bg-white border-2 border-green-200 shadow-lg hover:shadow-xl',
    selectedCell: 'bg-gradient-to-br from-green-200 to-emerald-200 border-2 border-green-400 shadow-xl',
    text: 'text-gray-800',
    button: 'from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
  }
}

// Composant Cell optimisé avec memo
const GameCell = memo(({ 
  cell, 
  isSelected, 
  onClick, 
  theme, 
  isTutorial = false 
}: { 
  cell: Cell
  isSelected: boolean
  onClick: (cell: Cell) => void
  theme: any
  isTutorial?: boolean
}) => {
  const handleClick = useCallback(() => {
    if (cell.value !== null) {
      onClick(cell)
    }
  }, [cell.value, cell.id, onClick])

  // Mémoriser les classes CSS pour éviter les recalculs
  const cellClasses = useMemo(() => {
    const baseClasses = 'aspect-square rounded-2xl font-bold transition-all duration-300 transform flex items-center justify-center'
    const sizeClasses = 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl'
    
    if (cell.value === null) {
      return `${baseClasses} ${sizeClasses} bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 cursor-default shadow-md text-gray-400`
    }
    
    // Couleurs vives selon la valeur du nombre
    const valueColors = [
      'from-red-400 to-pink-500',      // 1
      'from-orange-400 to-red-500',    // 2
      'from-yellow-400 to-orange-500', // 3
      'from-green-400 to-yellow-500',  // 4
      'from-blue-400 to-green-500',    // 5
      'from-indigo-400 to-blue-500',   // 6
      'from-purple-400 to-indigo-500', // 7
      'from-pink-400 to-purple-500',   // 8
      'from-rose-400 to-pink-500',     // 9
      'from-cyan-400 to-rose-500'      // 10+
    ]
    
    const colorIndex = Math.min(cell.value - 1, valueColors.length - 1)
    const cellColor = valueColors[colorIndex]
    
    const stateClasses = isSelected
      ? `bg-gradient-to-br ${cellColor} border-4 border-white shadow-2xl scale-110 ring-4 ring-yellow-300`
      : `bg-gradient-to-br ${cellColor} border-2 border-white shadow-xl hover:scale-110 hover:shadow-2xl cursor-pointer hover:ring-2 hover:ring-white`
    
    const tutorialClasses = isTutorial ? 'animate-bounce ring-4 ring-yellow-400' : ''
    
    return `${baseClasses} ${sizeClasses} ${stateClasses} ${tutorialClasses} text-white font-black`
  }, [cell.value, isSelected, isTutorial])

  // Mémoriser les propriétés d'animation pour éviter les recalculs
  const animationProps = useMemo(() => ({
    whileHover: cell.value !== null ? { scale: 1.05 } : undefined,
    whileTap: cell.value !== null ? { scale: 0.95 } : undefined,
    animate: { opacity: 1, scale: isSelected ? 1.05 : 1 },
    transition: { 
      duration: 0.15 // Réduit pour plus de fluidité
    }
  }), [cell.value, isSelected])

  // Debug: log pour voir les valeurs des cellules
  if (cell.value !== null) {
    console.log(`🔢 Cellule [${cell.row},${cell.col}] = ${cell.value} (visible)`)
  } else {
    console.log(`⚪ Cellule [${cell.row},${cell.col}] = null (vide)`)
  }

  return (
    <motion.button
      onClick={handleClick}
      className={cellClasses}
      style={{
        textShadow: cell.value !== null ? '2px 2px 4px rgba(0,0,0,0.5), -1px -1px 2px rgba(0,0,0,0.3)' : 'none'
      }}
      {...animationProps}
      initial={{ opacity: 0, scale: 0.8 }}
      disabled={cell.value === null}
      // Optimisation: éviter les re-renders inutiles
      layout={false}
    >
      {cell.value}
    </motion.button>
  )
})

GameCell.displayName = 'GameCell'

export default function CubeMatchUnified({ 
  onClose, 
  onScoreSubmit, 
  initialConfig = {},
  isFullPage = false 
}: CubeMatchUnifiedProps) {
  // Hooks
  const { isMobile, isTablet } = useScreenSize()
  
  // États principaux
  const [gameState, setGameState] = useState<GameState>('menu')
  const [config, setConfig] = useState<GameConfig>({ ...DEFAULT_CONFIG, ...initialConfig })
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    level: 1,
    combo: 0,
    bestCombo: 0,
    lives: 3,
    timeLeft: 60,
    cellsCleared: 0,
    totalMoves: 0,
    successfulMoves: 0,
    hintsUsed: 0,
    accuracy: 100,
    timePlayedMs: 0
  })
  
  // États du jeu
  const [grid, setGrid] = useState<Cell[][]>([])
  const [selectedCells, setSelectedCells] = useState<Cell[]>([])
  const [target, setTarget] = useState(10)
  const [showHint, setShowHint] = useState(false)
  const [gameStartTime, setGameStartTime] = useState(0)
  const [tutorialStep, setTutorialStep] = useState(0)
  const [isTutorialMode, setIsTutorialMode] = useState(false)
  const [particles, setParticles] = useState<Array<{id: string, x: number, y: number}>>([])
  const [streakMultiplier, setStreakMultiplier] = useState(1)
  
  // Refs
  const gameLoopRef = useRef<NodeJS.Timeout>()
  const spawnTimerRef = useRef<NodeJS.Timeout>()
  const timeTimerRef = useRef<NodeJS.Timeout>()
  
  // Thème actuel
  const currentTheme = THEMES[config.theme]
  
  // Initialiser la grille
  const initializeGrid = useCallback(() => {
    const newGrid: Cell[][] = []
    for (let row = 0; row < config.gridSize; row++) {
      newGrid[row] = []
      for (let col = 0; col < config.gridSize; col++) {
        newGrid[row][col] = {
          id: `${row}-${col}`,
          row,
          col,
          value: null,
          bornAt: Date.now()
        }
      }
    }
    setGrid(newGrid)
  }, [config.gridSize])
  
  // Générer un nombre aléatoire selon la difficulté
  const generateRandomNumber = useCallback(() => {
    const ranges = {
      EASY: [1, 5],
      MEDIUM: [1, 10],
      HARD: [1, 20]
    }
    const [min, max] = ranges[config.difficulty]
    return Math.floor(Math.random() * (max - min + 1)) + min
  }, [config.difficulty])
  
  // Générer un nouveau target
  const generateTarget = useCallback(() => {
    const ranges = {
      EASY: [5, 10],
      MEDIUM: [10, 20],
      HARD: [15, 30]
    }
    const [min, max] = ranges[config.difficulty]
    return Math.floor(Math.random() * (max - min + 1)) + min
  }, [config.difficulty])
  
  // Spawn de nouveaux nombres - Optimisé
  const spawnNumbers = useCallback(() => {
    if (gameState !== 'playing') return
    
    setGrid(prevGrid => {
      // Optimisation: éviter la copie complète de la grille si pas nécessaire
      const emptyCells: {row: number, col: number}[] = []
      
      // Trouver les cellules vides - optimisé avec une seule boucle
      for (let row = 0; row < config.gridSize; row++) {
        for (let col = 0; col < config.gridSize; col++) {
          if (prevGrid[row][col].value === null) {
            emptyCells.push({ row, col })
          }
        }
      }
      
      // Si pas de cellules vides, pas besoin de continuer
      if (emptyCells.length === 0) return prevGrid
      
      // Spawn de nouveaux nombres - optimisé
      const numbersToSpawn = Math.min(3, emptyCells.length) // Augmenté de 2 à 3
      if (numbersToSpawn === 0) return prevGrid
      
      // Créer une copie seulement si nécessaire
      const newGrid = prevGrid.map(row => [...row])
      const currentTime = Date.now()
      
      for (let i = 0; i < numbersToSpawn; i++) {
        const randomIndex = Math.floor(Math.random() * emptyCells.length)
        const { row, col } = emptyCells.splice(randomIndex, 1)[0]
        
        // Optimisation: modification directe sans spread
        newGrid[row][col].value = generateRandomNumber()
        newGrid[row][col].bornAt = currentTime
      }
      
      return newGrid
    })
  }, [gameState, config.gridSize, generateRandomNumber])
  
  // Vérifier si une solution existe
  const checkSolution = useCallback((cells: Cell[]): boolean => {
    if (cells.length < 2) return false
    
    const values = cells.map(cell => cell.value!).filter(v => v !== null)
    if (values.length < 2) return false
    
    switch (config.operator) {
      case 'ADD':
        return values.reduce((sum, val) => sum + val, 0) === target
      case 'SUB':
        return values.length === 2 && Math.abs(values[0] - values[1]) === target
      case 'MUL':
        return values.reduce((prod, val) => prod * val, 1) === target
      case 'DIV':
        return values.length === 2 && (values[0] / values[1] === target || values[1] / values[0] === target)
      case 'MIXED':
        // Essayer toutes les opérations
        const sum = values.reduce((s, v) => s + v, 0)
        const diff = values.length === 2 ? Math.abs(values[0] - values[1]) : 0
        const prod = values.reduce((p, v) => p * v, 1)
        const div = values.length === 2 ? (values[0] / values[1] === Math.floor(values[0] / values[1]) ? values[0] / values[1] : values[1] / values[0] === Math.floor(values[1] / values[0]) ? values[1] / values[0] : 0) : 0
        
        return sum === target || diff === target || prod === target || div === target
      default:
        return false
    }
  }, [config.operator, target])
  
  // Gérer la sélection de cellules
  const handleCellClick = useCallback((cell: Cell) => {
    if (gameState !== 'playing' || cell.value === null) return
    
    setSelectedCells(prev => {
      const isSelected = prev.some(c => c.id === cell.id)
      
      if (isSelected) {
        // Désélectionner
        return prev.filter(c => c.id !== cell.id)
      } else {
        // Sélectionner
        const newSelection = [...prev, cell]
        
        // Vérifier automatiquement si c'est une solution
        if (config.autoSubmit && checkSolution(newSelection)) {
          setTimeout(() => handleSubmit(newSelection), 100)
        }
        
        return newSelection
      }
    })
  }, [gameState, config.autoSubmit, checkSolution])
  
  // Soumettre une solution - Optimisé
  const handleSubmit = useCallback((cells: Cell[] = selectedCells) => {
    if (gameState !== 'playing') return
    
    const isCorrectSolution = checkSolution(cells)
    
    if (isCorrectSolution) {
      // Solution correcte - Calculs optimisés
      const multiplier = calculateStreakMultiplier(stats.combo)
      const points = Math.round(cells.length * 10 * (stats.combo + 1) * multiplier)
      
      // Batch les mises à jour de stats pour éviter les re-renders multiples
      setStats(prev => {
        const newSuccessfulMoves = prev.successfulMoves + 1
        const newTotalMoves = prev.totalMoves + 1
        const newCombo = prev.combo + 1
        
        return {
          ...prev,
          score: prev.score + points,
          combo: newCombo,
          bestCombo: Math.max(prev.bestCombo, newCombo),
          cellsCleared: prev.cellsCleared + cells.length,
          successfulMoves: newSuccessfulMoves,
          totalMoves: newTotalMoves,
          accuracy: Math.round((newSuccessfulMoves / newTotalMoves) * 100)
        }
      })
      
      // Créer des particules d'effet (non-bloquant)
      requestAnimationFrame(() => createParticles(400, 300))
      
      // Supprimer les cellules utilisées - Optimisé
      setGrid(prevGrid => {
        // Optimisation: créer la grille seulement si nécessaire
        if (cells.length === 0) return prevGrid
        
        const newGrid = prevGrid.map(row => [...row])
        cells.forEach(cell => {
          // Optimisation: modification directe
          newGrid[cell.row][cell.col].value = null
        })
        return newGrid
      })
      
      // Générer un nouveau target (non-bloquant)
      requestAnimationFrame(() => setTarget(generateTarget()))
      
      // Gestion du tutoriel
      if (isTutorialMode && tutorialStep === 0) {
        setTutorialStep(1)
        setTimeout(() => {
          setIsTutorialMode(false)
          setGameState('menu')
        }, 2000)
      }
      
      // Jouer son de succès (non-bloquant)
      if (config.soundEnabled) {
        // TODO: Ajouter son de succès
      }
      
    } else {
      // Solution incorrecte - Batch les mises à jour
      setStats(prev => {
        const newTotalMoves = prev.totalMoves + 1
        return {
          ...prev,
          combo: 0,
          lives: prev.lives - 1,
          totalMoves: newTotalMoves,
          accuracy: Math.round((prev.successfulMoves / newTotalMoves) * 100)
        }
      })
      
      // Jouer son d'erreur (non-bloquant)
      if (config.soundEnabled) {
        // TODO: Ajouter son d'erreur
      }
    }
    
    // Nettoyer la sélection
    setSelectedCells([])
  }, [gameState, selectedCells, checkSolution, stats.combo, config.soundEnabled, generateTarget, isTutorialMode, tutorialStep])
  
  // Utiliser un indice
  const useHint = useCallback(() => {
    if (!config.hintsEnabled || stats.hintsUsed >= 3) return
    
    setStats(prev => ({ ...prev, hintsUsed: prev.hintsUsed + 1 }))
    setShowHint(true)
    
    // Masquer l'indice après 3 secondes
    setTimeout(() => setShowHint(false), 3000)
  }, [config.hintsEnabled, stats.hintsUsed])
  
  // Démarrer le tutoriel
  const startTutorial = useCallback(() => {
    setIsTutorialMode(true)
    setTutorialStep(0)
    setGameState('playing')
    
    // Grille de tutoriel prédéfinie
    const tutorialGrid: Cell[][] = []
    for (let row = 0; row < 4; row++) {
      tutorialGrid[row] = []
      for (let col = 0; col < 4; col++) {
        tutorialGrid[row][col] = {
          id: `${row}-${col}`,
          row,
          col,
          value: row === 0 && col === 0 ? 3 : 
                 row === 0 && col === 1 ? 7 : 
                 row === 1 && col === 0 ? 2 : 
                 row === 1 && col === 1 ? 8 : null,
          bornAt: Date.now()
        }
      }
    }
    setGrid(tutorialGrid)
    setTarget(10)
    setStats({
      score: 0,
      level: 1,
      combo: 0,
      bestCombo: 0,
      lives: 3,
      timeLeft: 999,
      cellsCleared: 0,
      totalMoves: 0,
      successfulMoves: 0,
      hintsUsed: 0,
      accuracy: 100,
      timePlayedMs: 0
    })
  }, [])
  
  // Créer des particules d'effet - Optimisé
  const createParticles = useCallback((x: number, y: number) => {
    // Optimisation: réduire le nombre de particules pour de meilleures performances
    const particleCount = isMobile ? 3 : 5
    const timestamp = Date.now()
    
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: `particle-${timestamp}-${i}`,
      x: x + (Math.random() - 0.5) * (isMobile ? 60 : 100),
      y: y + (Math.random() - 0.5) * (isMobile ? 60 : 100)
    }))
    
    // Optimisation: limiter le nombre total de particules
    setParticles(prev => {
      const maxParticles = isMobile ? 10 : 15
      const allParticles = [...prev, ...newParticles]
      return allParticles.slice(-maxParticles) // Garder seulement les plus récentes
    })
    
    // Supprimer les particules après l'animation (optimisé avec requestAnimationFrame)
    const timeoutId = setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.some(np => np.id === p.id)))
    }, isMobile ? 800 : 1000) // Animation plus courte sur mobile
    
    // Nettoyage en cas de démontage du composant
    return () => clearTimeout(timeoutId)
  }, [isMobile])
  
  // Calculer le multiplicateur de série
  const calculateStreakMultiplier = useCallback((combo: number) => {
    if (combo >= 10) return 3
    if (combo >= 5) return 2
    if (combo >= 3) return 1.5
    return 1
  }, [])
  
  // Démarrer le jeu
  const startGame = useCallback(() => {
    console.log('🎮 Démarrage du jeu CubeMatch...')
    console.log('📊 Config actuelle:', config)
    
    setGameState('playing')
    setGameStartTime(Date.now())
    setStats({
      score: 0,
      level: 1,
      combo: 0,
      bestCombo: 0,
      lives: 3,
      timeLeft: config.timeLimit,
      cellsCleared: 0,
      totalMoves: 0,
      successfulMoves: 0,
      hintsUsed: 0,
      accuracy: 100,
      timePlayedMs: 0
    })
    
    const newTarget = generateTarget()
    console.log('🎯 Nouveau target généré:', newTarget)
    setTarget(newTarget)
    
    console.log('🏗️ Initialisation de la grille...')
    initializeGrid()
    
    // Spawn initial massif pour remplir la grille
    setTimeout(() => {
      console.log('🎲 Premier spawn de nombres (MASSIF)...')
      // Spawn multiple pour remplir environ 50% de la grille
      const halfGridSize = Math.floor((config.gridSize * config.gridSize) / 2)
      for (let i = 0; i < halfGridSize; i++) {
        setTimeout(() => spawnNumbers(), i * 50) // Petit délai pour l'animation
      }
    }, 100)
    
    // Timer principal
    if (!config.unlimitedTime) {
      timeTimerRef.current = setInterval(() => {
        setStats(prev => {
          if (prev.timeLeft <= 1) {
            endGame()
            return prev
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 }
        })
      }, 1000)
    }
    
    // Spawn timer
    spawnTimerRef.current = setInterval(() => {
      console.log('🎲 Spawn automatique de nombres...')
      spawnNumbers()
    }, config.spawnRate)
    
    console.log('✅ Jeu démarré avec succès!')
  }, [config, generateTarget, initializeGrid, spawnNumbers])
  
  // Terminer le jeu
  const endGame = useCallback(async () => {
    setGameState('gameOver')
    
    // Nettoyer les timers
    if (timeTimerRef.current) clearInterval(timeTimerRef.current)
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current)
    
    // Calculer le temps joué
    const timePlayedMs = gameStartTime > 0 ? Date.now() - gameStartTime : 0
    
    // Sauvegarder le score
    try {
      const scoreData: ScoreData = {
        score: stats.score,
        level: stats.level,
        timePlayedMs: timePlayedMs,
        operator: config.operator,
        target: target,
        allowDiagonals: config.allowDiagonals,
        gridSize: config.gridSize,
        difficulty: config.difficulty,
        hintsUsed: stats.hintsUsed,
        gameDurationSeconds: Math.floor(timePlayedMs / 1000),
        comboMax: stats.bestCombo,
        cellsCleared: stats.cellsCleared,
        totalMoves: stats.totalMoves,
        successfulMoves: stats.successfulMoves,
        accuracyRate: stats.accuracy,
        soundEnabled: config.soundEnabled,
        hintsEnabled: config.hintsEnabled
      }
      
      await cubeMatchAPI.saveScore(scoreData)
      console.log('✅ Score sauvegardé avec succès')
      
      // Callback pour le parent
      if (onScoreSubmit) {
        onScoreSubmit(stats.score)
      }
      
    } catch (error) {
      console.error('❌ Erreur sauvegarde score:', error)
    }
  }, [gameStartTime, stats, config, target, onScoreSubmit])
  
  // Mettre en pause
  const pauseGame = useCallback(() => {
    setGameState('paused')
    if (timeTimerRef.current) clearInterval(timeTimerRef.current)
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current)
  }, [])
  
  // Reprendre
  const resumeGame = useCallback(() => {
    setGameState('playing')
    
    if (!config.unlimitedTime) {
      timeTimerRef.current = setInterval(() => {
        setStats(prev => {
          if (prev.timeLeft <= 1) {
            endGame()
            return prev
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 }
        })
      }, 1000)
    }
    
    spawnTimerRef.current = setInterval(spawnNumbers, config.spawnRate)
  }, [config.unlimitedTime, config.spawnRate, spawnNumbers, endGame])
  
  // Démarrage automatique en mode pleine page
  useEffect(() => {
    if (isFullPage && gameState === 'menu') {
      console.log('🚀 Démarrage automatique du jeu en mode pleine page')
      startGame()
    }
  }, [isFullPage, gameState, startGame])
  
  // Redémarrer
  const restartGame = useCallback(() => {
    setGameState('menu')
    setSelectedCells([])
    setGrid([])
    if (timeTimerRef.current) clearInterval(timeTimerRef.current)
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current)
  }, [])
  
  // Nettoyage
  useEffect(() => {
    return () => {
      if (timeTimerRef.current) clearInterval(timeTimerRef.current)
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current)
    }
  }, [])
  
  // Vérifier game over
  useEffect(() => {
    if (gameState === 'playing' && stats.lives <= 0) {
      endGame()
    }
  }, [gameState, stats.lives, endGame])
  
  // Rendu du menu principal
  const renderMenu = () => (
    <div className={`min-h-screen ${currentTheme.background} flex items-center justify-center p-4 relative overflow-hidden`}>
      {/* Éléments décoratifs pour le menu */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-40 h-40 bg-pink-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-300/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-blue-300/20 rounded-full blur-2xl animate-pulse delay-2000"></div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-white via-blue-50 to-purple-50 border-4 border-green-200 rounded-3xl shadow-2xl p-8 max-w-md w-full relative z-10"
      >
        <div className="text-center mb-8">
          <div className={`w-24 h-24 bg-gradient-to-r ${currentTheme.primary} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
            <Gamepad2 className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-3">
            🎮 CubeMatch Kids
          </h1>
          <p className="text-gray-600 text-lg">Défi mathématique amusant !</p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={startGame}
            className={`w-full bg-gradient-to-r ${currentTheme.button} text-white py-5 rounded-2xl font-bold text-xl hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl transform`}
          >
            <Play className="w-7 h-7 inline-block mr-3" />
            Jouer Maintenant !
          </button>
          
          <button
            onClick={startTutorial}
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-4 rounded-2xl font-bold text-lg hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl transform"
          >
            <Lightbulb className="w-6 h-6 inline-block mr-3" />
            Apprendre à Jouer
          </button>
          
          <button
            onClick={() => setGameState('settings')}
            className="w-full bg-gradient-to-r from-gray-400 to-gray-600 text-white py-4 rounded-2xl font-bold text-lg hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl transform"
          >
            <Settings className="w-6 h-6 inline-block mr-3" />
            Paramètres
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              className="w-full bg-red-100 text-red-700 py-3 rounded-2xl font-medium hover:bg-red-200 transition-colors"
            >
              <X className="w-5 h-5 inline-block mr-2" />
              Fermer
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
  
  // Rendu des paramètres
  const renderSettings = () => (
    <div className={`min-h-screen ${currentTheme.background} flex items-center justify-center p-4`}>
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Paramètres</h2>
          <button
            onClick={() => setGameState('menu')}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Difficulté */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Difficulté</label>
            <div className="grid grid-cols-3 gap-2">
              {(['EASY', 'MEDIUM', 'HARD'] as Difficulty[]).map(diff => (
                <button
                  key={diff}
                  onClick={() => setConfig(prev => ({ ...prev, difficulty: diff }))}
                  className={`py-2 px-4 rounded-xl font-medium transition-colors ${
                    config.difficulty === diff
                      ? `bg-gradient-to-r ${currentTheme.primary} text-white`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {diff === 'EASY' ? 'Facile' : diff === 'MEDIUM' ? 'Moyen' : 'Difficile'}
                </button>
              ))}
            </div>
          </div>
          
          {/* Temps */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Temps de jeu</label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Temps limité</span>
                <input
                  type="checkbox"
                  checked={!config.unlimitedTime}
                  onChange={(e) => setConfig(prev => ({ ...prev, unlimitedTime: !e.target.checked }))}
                  className="rounded"
                />
              </div>
              
              {!config.unlimitedTime && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Durée: {config.timeLimit} secondes
                  </label>
                  <input
                    type="range"
                    min="30"
                    max="300"
                    step="30"
                    value={config.timeLimit}
                    onChange={(e) => setConfig(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>30s</span>
                    <span>5min</span>
                  </div>
                </div>
              )}
              
              {config.unlimitedTime && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">Mode infini activé</span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">Points réduits de 50%</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Opérateur */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Opération</label>
            <div className="grid grid-cols-3 gap-2">
              {(['ADD', 'SUB', 'MUL', 'DIV', 'MIXED'] as Operator[]).map(op => (
                <button
                  key={op}
                  onClick={() => setConfig(prev => ({ ...prev, operator: op }))}
                  className={`py-2 px-4 rounded-xl font-medium transition-colors ${
                    config.operator === op
                      ? `bg-gradient-to-r ${currentTheme.primary} text-white`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {op === 'ADD' ? '+' : op === 'SUB' ? '-' : op === 'MUL' ? '×' : op === 'DIV' ? '÷' : 'Mix'}
                </button>
              ))}
            </div>
          </div>
          
          {/* Taille de grille */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Taille de grille: {config.gridSize}×{config.gridSize}
            </label>
            <input
              type="range"
              min="4"
              max="8"
              value={config.gridSize}
              onChange={(e) => setConfig(prev => ({ ...prev, gridSize: parseInt(e.target.value) }))}
              className="w-full"
            />
          </div>
          
          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Son activé</span>
              <input
                type="checkbox"
                checked={config.soundEnabled}
                onChange={(e) => setConfig(prev => ({ ...prev, soundEnabled: e.target.checked }))}
                className="rounded"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Indices activés</span>
              <input
                type="checkbox"
                checked={config.hintsEnabled}
                onChange={(e) => setConfig(prev => ({ ...prev, hintsEnabled: e.target.checked }))}
                className="rounded"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Diagonales autorisées</span>
              <input
                type="checkbox"
                checked={config.allowDiagonals}
                onChange={(e) => setConfig(prev => ({ ...prev, allowDiagonals: e.target.checked }))}
                className="rounded"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Soumission automatique</span>
              <input
                type="checkbox"
                checked={config.autoSubmit}
                onChange={(e) => setConfig(prev => ({ ...prev, autoSubmit: e.target.checked }))}
                className="rounded"
              />
            </label>
          </div>
          
          {/* Thème */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Thème</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(THEMES) as Array<keyof typeof THEMES>).map(theme => (
                <button
                  key={theme}
                  onClick={() => setConfig(prev => ({ ...prev, theme }))}
                  className={`py-2 px-4 rounded-xl font-medium transition-colors capitalize ${
                    config.theme === theme
                      ? `bg-gradient-to-r ${THEMES[theme].primary} text-white`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {theme === 'rainbow' ? 'Arc-en-ciel' : 
                   theme === 'ocean' ? 'Océan' :
                   theme === 'sunset' ? 'Coucher' : 'Forêt'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
  
  // Rendu du jeu
  const renderGame = () => (
    <div className={`h-screen ${currentTheme.background} relative overflow-hidden flex flex-col`}>
      {/* Éléments décoratifs animés */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Cercles flottants colorés */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-pink-300/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-purple-300/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-blue-300/20 rounded-full blur-xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 right-1/3 w-16 h-16 bg-yellow-300/20 rounded-full blur-xl animate-pulse delay-3000"></div>
        
        {/* Étoiles scintillantes */}
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-yellow-400 rounded-full animate-ping delay-500"></div>
        <div className="absolute top-3/4 left-1/4 w-1 h-1 bg-pink-400 rounded-full animate-ping delay-1500"></div>
        <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-blue-400 rounded-full animate-ping delay-2500"></div>
      </div>
      {/* Barre de Contrôle Unique - Une Seule Ligne */}
      <div className="flex items-center justify-between gap-4 p-3 relative z-10 ">
        
        {/* Section Gauche - Contrôles et Stats */}
        <div className="flex items-center gap-4">
          <button
            onClick={pauseGame}
            className={`p-3 rounded-xl ${currentTheme.accent} text-white hover:scale-110 transition-all duration-300 shadow-lg`}
          >
            {gameState === 'paused' ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
          </button>
          
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-yellow-100 to-orange-100 border border-yellow-300 rounded-xl px-3 py-2">
              <div className="text-xs text-orange-600 font-semibold flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                Score
              </div>
              <div className="text-lg font-bold text-orange-700">{stats.score.toLocaleString()}</div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-300 rounded-xl px-3 py-2">
              <div className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                <Star className="w-3 h-3" />
                Niveau
              </div>
              <div className="text-lg font-bold text-blue-700">{stats.level}</div>
            </div>
            
            {!config.unlimitedTime && (
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 border border-green-300 rounded-xl px-3 py-2">
                <div className="text-xs text-green-600 font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Temps
                </div>
                <div className="text-lg font-bold text-green-700">{stats.timeLeft}s</div>
              </div>
            )}
          </div>
        </div>
        
        {/* Section Centre - Objectif */}
        <div className="flex-1 flex justify-center">
          <div className={`inline-flex items-center gap-3 bg-gradient-to-r ${currentTheme.primary} text-white px-6 py-3 rounded-2xl shadow-lg`}>
            <Target className="w-5 h-5" />
            <span className="text-lg font-bold">Objectif: {target}</span>
            <span className="text-sm opacity-90">
              {config.operator === 'ADD' ? '➕' : 
               config.operator === 'SUB' ? '➖' :
               config.operator === 'MUL' ? '✖️' :
               config.operator === 'DIV' ? '➗' : '🔀'}
            </span>
          </div>
        </div>
        
        {/* Section Droite - Actions et Contrôles */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSubmit()}
            disabled={selectedCells.length < 2}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg ${
              selectedCells.length < 2
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : `bg-gradient-to-r ${currentTheme.button} text-white hover:scale-110 transform`
            }`}
          >
            ✅ Valider ({selectedCells.length})
          </button>
          
          <button
            onClick={() => setSelectedCells([])}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-gray-400 to-gray-600 text-white font-bold text-sm hover:scale-110 transition-all duration-300 shadow-lg transform"
          >
            🗑️ Effacer
          </button>
          
          <button
            onClick={() => setGameState('settings')}
            className="p-3 rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 text-white hover:scale-110 transition-all duration-300 shadow-lg"
            title="Paramètres"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          {config.hintsEnabled && (
            <button
              onClick={useHint}
              disabled={stats.hintsUsed >= 3}
              className={`p-3 rounded-xl transition-all duration-300 shadow-lg ${
                stats.hintsUsed >= 3 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white hover:scale-110'
              }`}
            >
              <Lightbulb className="w-5 h-5" />
            </button>
          )}
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-3 rounded-xl bg-gradient-to-br from-red-400 to-red-600 text-white hover:scale-110 transition-all duration-300 shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      
      
      {/* Zone de Jeu Principale */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">
        {/* Grille - Design Enfantin */}
        <div 
          className="grid gap-4 p-6 bg-gradient-to-br from-white via-blue-50 to-green-50 border-2 border-blue-200 rounded-3xl shadow-2xl"
          style={{ 
            gridTemplateColumns: `repeat(${config.gridSize}, minmax(0, 1fr))`,
            width: isFullPage 
              ? (isMobile ? '90vw' : '45vw') 
              : (isMobile ? '90vw' : '400px'),
            aspectRatio: '1'
          }}
        >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <GameCell
              key={cell.id}
              cell={cell}
              isSelected={selectedCells.some(c => c.id === cell.id)}
              onClick={handleCellClick}
              theme={currentTheme}
              isTutorial={isTutorialMode && tutorialStep === 0 && (
                (cell.row === 0 && cell.col === 0) || 
                (cell.row === 0 && cell.col === 1)
              )}
            />
          ))
        )}
        </div>
        
        {/* Stats en bas - Combo, Vies, Précision */}
        <div className="flex justify-center mt-6">
          <div className="flex gap-6 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-4 shadow-lg">
            <div className="text-center">
              <div className="text-xs text-purple-600 font-semibold flex items-center gap-1 justify-center">
                <Zap className="w-3 h-3" />
                Combo
              </div>
              <div className="text-lg font-bold text-purple-700">{stats.combo}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-red-600 font-semibold flex items-center gap-1 justify-center">
                <span className="text-sm">💖</span>
                Vies
              </div>
              <div className="text-lg font-bold text-red-500">
                {'❤️'.repeat(stats.lives)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-green-600 font-semibold flex items-center gap-1 justify-center">
                <Award className="w-3 h-3" />
                Précision
              </div>
              <div className="text-lg font-bold text-green-700">{stats.accuracy}%</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Particules d'effet */}
      <AnimatePresence>
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            initial={{ opacity: 1, scale: 0, x: particle.x, y: particle.y }}
            animate={{ 
              opacity: 0, 
              scale: 1, 
              x: particle.x + (Math.random() - 0.5) * 200,
              y: particle.y - 100
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="fixed pointer-events-none z-50"
          >
            <div className="w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg" />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Messages de tutoriel */}
      <AnimatePresence>
        {isTutorialMode && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-4 rounded-xl shadow-lg max-w-md text-center"
          >
            {tutorialStep === 0 && (
              <div>
                <div className="text-lg font-bold mb-2">🎯 Tutoriel</div>
                <div>Sélectionnez les cubes qui font {target} quand on les additionne !</div>
                <div className="text-sm mt-2 opacity-90">Essayez 3 + 7 = 10</div>
              </div>
            )}
            {tutorialStep === 1 && (
              <div>
                <div className="text-lg font-bold mb-2">🎉 Bravo !</div>
                <div>Vous avez trouvé la bonne combinaison !</div>
                <div className="text-sm mt-2 opacity-90">Vous êtes maintenant prêt à jouer</div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint */}
      <AnimatePresence>
        {showHint && !isTutorialMode && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-6 py-3 rounded-xl shadow-lg"
          >
            💡 Cherchez des combinaisons qui donnent {target}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
  
  // Rendu pause
  const renderPaused = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 text-center"
      >
        <Pause className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Jeu en pause</h2>
        
        <div className="space-y-3">
          <button
            onClick={resumeGame}
            className={`w-full bg-gradient-to-r ${currentTheme.primary} text-white py-3 rounded-xl font-semibold hover:scale-105 transition-transform`}
          >
            Reprendre
          </button>
          
          <button
            onClick={restartGame}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            Recommencer
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              className="w-full bg-red-100 text-red-700 py-3 rounded-xl font-medium hover:bg-red-200 transition-colors"
            >
              Quitter
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
  
  // Rendu game over
  const renderGameOver = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 text-center"
      >
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Partie terminée!</h2>
        <p className="text-gray-600 mb-6">Félicitations pour votre performance</p>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.score.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Score final</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.level}</div>
            <div className="text-sm text-gray-600">Niveau atteint</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.bestCombo}</div>
            <div className="text-sm text-gray-600">Meilleur combo</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.accuracy}%</div>
            <div className="text-sm text-gray-600">Précision</div>
          </div>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={startGame}
            className={`w-full bg-gradient-to-r ${currentTheme.primary} text-white py-3 rounded-xl font-semibold hover:scale-105 transition-transform`}
          >
            Rejouer
          </button>
          
          <button
            onClick={restartGame}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            Menu principal
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              className="w-full bg-red-100 text-red-700 py-3 rounded-xl font-medium hover:bg-red-200 transition-colors"
            >
              Fermer
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
  
  // Rendu principal
  return (
    <div className="relative">
      {gameState === 'menu' && renderMenu()}
      {gameState === 'settings' && renderSettings()}
      {gameState === 'playing' && renderGame()}
      {gameState === 'paused' && renderPaused()}
      {gameState === 'gameOver' && renderGameOver()}
    </div>
  )
}
