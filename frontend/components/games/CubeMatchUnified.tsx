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
  theme: 'classic' | 'ocean' | 'sunset' | 'forest'
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
  theme: 'classic'
}

// Thèmes visuels
const THEMES = {
  classic: {
    primary: 'from-blue-500 to-purple-500',
    secondary: 'from-blue-400 to-purple-400',
    accent: 'bg-blue-500',
    background: 'bg-gradient-to-br from-blue-50 to-purple-50',
    cell: 'bg-white border-blue-200',
    selectedCell: 'bg-blue-100 border-blue-400'
  },
  ocean: {
    primary: 'from-cyan-500 to-blue-500',
    secondary: 'from-cyan-400 to-blue-400',
    accent: 'bg-cyan-500',
    background: 'bg-gradient-to-br from-cyan-50 to-blue-50',
    cell: 'bg-white border-cyan-200',
    selectedCell: 'bg-cyan-100 border-cyan-400'
  },
  sunset: {
    primary: 'from-orange-500 to-red-500',
    secondary: 'from-orange-400 to-red-400',
    accent: 'bg-orange-500',
    background: 'bg-gradient-to-br from-orange-50 to-red-50',
    cell: 'bg-white border-orange-200',
    selectedCell: 'bg-orange-100 border-orange-400'
  },
  forest: {
    primary: 'from-green-500 to-emerald-500',
    secondary: 'from-green-400 to-emerald-400',
    accent: 'bg-green-500',
    background: 'bg-gradient-to-br from-green-50 to-emerald-50',
    cell: 'bg-white border-green-200',
    selectedCell: 'bg-green-100 border-green-400'
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
    const baseClasses = 'aspect-square rounded-xl font-bold text-lg transition-all duration-150'
    
    if (cell.value === null) {
      return `${baseClasses} bg-gray-100 border-2 border-gray-200 cursor-default`
    }
    
    const stateClasses = isSelected
      ? `${theme.selectedCell} border-2 shadow-lg`
      : `${theme.cell} border-2 hover:scale-105 hover:shadow-md cursor-pointer`
    
    const tutorialClasses = isTutorial ? 'animate-pulse ring-2 ring-yellow-400' : ''
    
    return `${baseClasses} ${stateClasses} ${tutorialClasses}`
  }, [cell.value, isSelected, theme.selectedCell, theme.cell, isTutorial])

  // Mémoriser les propriétés d'animation pour éviter les recalculs
  const animationProps = useMemo(() => ({
    whileHover: cell.value !== null ? { scale: 1.05 } : undefined,
    whileTap: cell.value !== null ? { scale: 0.95 } : undefined,
    animate: { opacity: 1, scale: isSelected ? 1.05 : 1 },
    transition: { 
      duration: 0.15 // Réduit pour plus de fluidité
    }
  }), [cell.value, isSelected])

  return (
    <motion.button
      onClick={handleClick}
      className={cellClasses}
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
  initialConfig = {} 
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
      const numbersToSpawn = Math.min(2, emptyCells.length)
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
    
    // Spawn initial
    setTimeout(() => {
      console.log('🎲 Premier spawn de nombres...')
      spawnNumbers()
    }, 1000)
    
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
    <div className={`min-h-screen ${currentTheme.background} flex items-center justify-center p-4`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-md w-full"
      >
        <div className="text-center mb-8">
          <div className={`w-20 h-20 bg-gradient-to-r ${currentTheme.primary} rounded-3xl flex items-center justify-center mx-auto mb-4`}>
            <Gamepad2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">CubeMatch</h1>
          <p className="text-gray-600">Défi mathématique ultime</p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={startGame}
            className={`w-full bg-gradient-to-r ${currentTheme.primary} text-white py-4 rounded-2xl font-semibold text-lg hover:scale-105 transition-transform shadow-lg`}
          >
            <Play className="w-6 h-6 inline-block mr-2" />
            Jouer
          </button>
          
          <button
            onClick={startTutorial}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 rounded-2xl font-medium hover:scale-105 transition-transform shadow-lg"
          >
            <Lightbulb className="w-5 h-5 inline-block mr-2" />
            Tutoriel
          </button>
          
          <button
            onClick={() => setGameState('settings')}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-2xl font-medium hover:bg-gray-200 transition-colors"
          >
            <Settings className="w-5 h-5 inline-block mr-2" />
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
                  {theme === 'classic' ? 'Classique' : 
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
    <div className={`min-h-screen ${currentTheme.background} p-4`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={pauseGame}
            className={`p-3 rounded-xl ${currentTheme.accent} text-white hover:scale-105 transition-transform`}
          >
            <Pause className="w-5 h-5" />
          </button>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2">
            <div className="text-sm text-gray-600">Score</div>
            <div className="text-xl font-bold text-gray-900">{stats.score.toLocaleString()}</div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2">
            <div className="text-sm text-gray-600">Niveau</div>
            <div className="text-xl font-bold text-gray-900">{stats.level}</div>
          </div>
          
          {!config.unlimitedTime && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2">
              <div className="text-sm text-gray-600">Temps</div>
              <div className="text-xl font-bold text-gray-900">{stats.timeLeft}s</div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {config.hintsEnabled && (
            <button
              onClick={useHint}
              disabled={stats.hintsUsed >= 3}
              className={`p-3 rounded-xl transition-all ${
                stats.hintsUsed >= 3 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-yellow-500 text-white hover:scale-105'
              }`}
            >
              <Lightbulb className="w-5 h-5" />
            </button>
          )}
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-3 rounded-xl bg-red-500 text-white hover:scale-105 transition-transform"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      
      {/* Target */}
      <div className="text-center mb-6">
        <div className={`inline-flex items-center gap-3 bg-gradient-to-r ${currentTheme.primary} text-white px-6 py-3 rounded-2xl shadow-lg`}>
          <Target className="w-6 h-6" />
          <span className="text-lg font-semibold">Objectif: {target}</span>
          <span className="text-sm opacity-80">
            ({config.operator === 'ADD' ? 'Addition' : 
              config.operator === 'SUB' ? 'Soustraction' :
              config.operator === 'MUL' ? 'Multiplication' :
              config.operator === 'DIV' ? 'Division' : 'Mixte'})
          </span>
        </div>
      </div>
      
      {/* Grille */}
      <div className="flex justify-center mb-6">
        <div 
          className="grid gap-2 p-4 bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg"
          style={{ 
            gridTemplateColumns: `repeat(${config.gridSize}, minmax(0, 1fr))`,
            maxWidth: isMobile ? '320px' : '400px'
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
      </div>
      
      {/* Actions */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => handleSubmit()}
          disabled={selectedCells.length < 2}
          className={`px-6 py-3 rounded-xl font-semibold transition-all ${
            selectedCells.length < 2
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : `bg-gradient-to-r ${currentTheme.primary} text-white hover:scale-105 shadow-lg`
          }`}
        >
          Valider ({selectedCells.length})
        </button>
        
        <button
          onClick={() => setSelectedCells([])}
          className="px-6 py-3 rounded-xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors"
        >
          Effacer
        </button>
      </div>
      
      {/* Stats */}
      <div className="flex justify-center mt-6">
        <div className="flex gap-4 bg-white/80 backdrop-blur-sm rounded-xl p-4">
          <div className="text-center">
            <div className="text-sm text-gray-600">Combo</div>
            <div className="text-lg font-bold text-gray-900">{stats.combo}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Vies</div>
            <div className="text-lg font-bold text-red-600">{'❤️'.repeat(stats.lives)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Précision</div>
            <div className="text-lg font-bold text-gray-900">{stats.accuracy}%</div>
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
