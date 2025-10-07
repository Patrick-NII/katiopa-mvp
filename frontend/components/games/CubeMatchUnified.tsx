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
  userAge?: number
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
    autoSubmit: true,
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
  console.log(`🔍 Cellule [${cell.row},${cell.col}] = ${cell.value} (type: ${typeof cell.value})`)
  if (cell.value !== null && cell.value !== undefined) {
    console.log(`🔢 Cellule [${cell.row},${cell.col}] = ${cell.value} (visible)`)
  } else {
    console.log(`⚪ Cellule [${cell.row},${cell.col}] = ${cell.value} (vide)`)
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
  isFullPage = false,
  userAge = 10
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
  const [sessionBestScore, setSessionBestScore] = useState(0)
  const [maxLevel, setMaxLevel] = useState(1)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [showNewRecord, setShowNewRecord] = useState(false)
  
  // Refs
  const gameLoopRef = useRef<NodeJS.Timeout>()
  const spawnTimerRef = useRef<NodeJS.Timeout>()
  const timeTimerRef = useRef<NodeJS.Timeout>()
  
  // Charger les données sauvegardées
  useEffect(() => {
    const savedSessionScore = localStorage.getItem('cubematch-session-best')
    if (savedSessionScore) {
      setSessionBestScore(parseInt(savedSessionScore))
    }
    
    const savedMaxLevel = localStorage.getItem('cubematch-max-level')
    if (savedMaxLevel) {
      setMaxLevel(parseInt(savedMaxLevel))
    }
  }, [])
  
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
    return newGrid
  }, [config.gridSize])
  
  // Générer un nombre aléatoire qui peut aider à atteindre le target
  const generateRandomNumber = useCallback(() => {
    // Déterminer le palier de difficulté basé sur le niveau
    const difficultyTier = Math.floor((stats.level - 1) / 10) + 1 // Palier 1, 2, 3, etc.
    
    console.log(`🎲 Génération nombre - Niveau: ${stats.level}, Palier: ${difficultyTier}, Target actuel: ${target}`)
    
    if (difficultyTier === 1) {
      // Niveau FACILE - Nombres de 1 à 20, mais proches du target
      if (target <= 20) {
        // Si target petit, générer des nombres qui peuvent le faire
        const maxValue = Math.min(20, Math.max(1, target - 1))
        const result = Math.floor(Math.random() * maxValue) + 1
        console.log(`🎯 Palier FACILE (1-${maxValue}) - Target: ${target}, Résultat: ${result}`)
        return result
      } else {
        // Target plus grand, générer des nombres normaux
        const result = Math.floor(Math.random() * 20) + 1
        console.log(`🎯 Palier FACILE (1-20) - Résultat: ${result}`)
        return result
      }
    } else if (difficultyTier === 2) {
      // Niveau MOYEN - Nombres de 21 à 50, adaptés au target
      if (target >= 21 && target <= 50) {
        // Target dans la plage, générer des nombres qui peuvent l'atteindre
        const maxValue = Math.min(50, target)
        const minValue = Math.max(21, Math.floor(target / 3))
        const result = Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue
        console.log(`🎯 Palier MOYEN (${minValue}-${maxValue}) - Target: ${target}, Résultat: ${result}`)
        return result
      } else {
        // Target hors plage, générer des nombres normaux
        const result = Math.floor(Math.random() * 30) + 21
        console.log(`🎯 Palier MOYEN (21-50) - Résultat: ${result}`)
        return result
      }
    } else {
      // Niveau DIFFICILE - Nombres de 51+, adaptés au target
      if (target >= 51) {
        // Target élevé, générer des nombres qui peuvent l'atteindre
        const maxValue = Math.min(200, target)
        const minValue = Math.max(51, Math.floor(target / 4))
        const result = Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue
        console.log(`🎯 Palier DIFFICILE (${minValue}-${maxValue}) - Target: ${target}, Résultat: ${result}`)
        return result
      } else {
        // Target plus petit, générer des nombres normaux
        const result = Math.floor(Math.random() * 150) + 51
        console.log(`🎯 Palier DIFFICILE (51-200) - Résultat: ${result}`)
        return result
      }
    }
  }, [stats.level, target])
  
  // Générer des nombres complexes pour les niveaux élevés
  const generateComplexNumber = useCallback(() => {
    // Déterminer le palier de difficulté basé sur le niveau
    const difficultyTier = Math.floor((stats.level - 1) / 10) + 1 // Palier 1, 2, 3, etc.
    const levelInTier = ((stats.level - 1) % 10) + 1 // Niveau dans le palier (1-10)
    
    console.log(`🎲 Génération nombre complexe - Niveau: ${stats.level}, Palier: ${difficultyTier}`)
    
    if (difficultyTier === 1) {
      // Niveau FACILE - Nombres complexes dans la limite de 20
      const complexNumbers = [12, 15, 18, 20]
      const result = complexNumbers[Math.floor(Math.random() * complexNumbers.length)]
      console.log(`🎯 Complexe FACILE - Résultat: ${result}`)
      return result
    } else if (difficultyTier === 2) {
      // Niveau MOYEN - Nombres complexes de 21 à 50
      const result = Math.floor(Math.random() * 30) + 21
      console.log(`🎯 Complexe MOYEN - Résultat: ${result}`)
      return result
    } else {
      // Niveau DIFFICILE - Nombres complexes 51+
      const result = Math.floor(Math.random() * 150) + 51
      console.log(`🎯 Complexe DIFFICILE - Résultat: ${result}`)
      return result
    }
  }, [stats.level])
  
  // Initialiser la grille avec des nombres - VERSION SIMPLIFIÉE
  const initializeGridWithNumbers = useCallback(() => {
    console.log('🏗️ Création de la grille avec nombres...')
    
    // Créer la grille directement avec des nombres
    const newGrid: Cell[][] = []
    const totalCells = config.gridSize * config.gridSize
    const numbersToSpawn = Math.floor(totalCells * 0.7) // 70% de la grille pour commencer avec plus de nombres
    
    // Créer toutes les cellules
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
    
    // Ajouter des nombres aléatoirement
    const positions: {row: number, col: number}[] = []
    for (let row = 0; row < config.gridSize; row++) {
      for (let col = 0; col < config.gridSize; col++) {
        positions.push({ row, col })
      }
    }
    
    // Mélanger les positions
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]]
    }
    
    // Ajouter des nombres aux premières positions
    for (let i = 0; i < numbersToSpawn; i++) {
      const { row, col } = positions[i]
      // Utiliser des nombres complexes pour certains spawns (20% de chance)
      const useComplexNumber = Math.random() < 0.2 && stats.level >= 10
      const newValue = useComplexNumber ? generateComplexNumber() : generateRandomNumber()
      newGrid[row][col].value = newValue
      newGrid[row][col].bornAt = Date.now()
      console.log(`🎲 Nombre ${newValue} ajouté à [${row},${col}]`)
    }
    
    console.log(`✅ Grille créée avec ${numbersToSpawn} nombres sur ${totalCells} cellules`)
    setGrid(newGrid)
  }, [config.gridSize, generateRandomNumber, generateComplexNumber, stats.level])
  
  // Générer un nouveau target avec difficulté adaptative et l'âge
  const generateTarget = useCallback(() => {
    // Déterminer le palier de difficulté basé sur le niveau
    const difficultyTier = Math.floor((stats.level - 1) / 10) + 1 // Palier 1, 2, 3, etc.
    const levelInTier = ((stats.level - 1) % 10) + 1 // Niveau dans le palier (1-10)
    
    console.log(`🎯 Génération target - Niveau: ${stats.level}, Palier: ${difficultyTier}, Opérateur: ${config.operator}`)
    
    if (difficultyTier === 1) {
      // Niveau FACILE - Targets de 5 à 20 SEULEMENT
      let result = Math.floor(Math.random() * 16) + 5
      
      // Pour les multiplications, s'assurer que le target est atteignable
      if (config.operator === 'MUL') {
        // Générer un target qui peut être atteint par multiplication de petits nombres
        const multipliers = [2, 3, 4, 5, 6, 7, 8, 9, 10]
        const mult1 = multipliers[Math.floor(Math.random() * multipliers.length)]
        const mult2 = Math.floor(Math.random() * 10) + 1
        result = mult1 * mult2
        if (result > 20) result = 20 // Limiter à 20 pour le niveau facile
      }
      
      console.log(`🎯 Target FACILE (5-20) - Opérateur: ${config.operator}, Résultat: ${result}`)
      return result
    } else if (difficultyTier === 2) {
      // Niveau MOYEN - Targets de 21 à 50 SEULEMENT
      let result = Math.floor(Math.random() * 30) + 21
      
      // Pour les multiplications, s'assurer que le target est atteignable
      if (config.operator === 'MUL') {
        // Générer un target qui peut être atteint par multiplication de nombres moyens
        const multipliers = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        const mult1 = multipliers[Math.floor(Math.random() * multipliers.length)]
        const mult2 = Math.floor(Math.random() * 5) + 2
        result = mult1 * mult2
        if (result > 50) result = 50 // Limiter à 50 pour le niveau moyen
      }
      
      console.log(`🎯 Target MOYEN (21-50) - Opérateur: ${config.operator}, Résultat: ${result}`)
      return result
    } else {
      // Niveau DIFFICILE - Targets de 51+ SEULEMENT
      let result = Math.floor(Math.random() * 150) + 51
      
      // Pour les multiplications, s'assurer que le target est atteignable
      if (config.operator === 'MUL') {
        // Générer un target qui peut être atteint par multiplication de nombres élevés
        const multipliers = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
        const mult1 = multipliers[Math.floor(Math.random() * multipliers.length)]
        const mult2 = Math.floor(Math.random() * 10) + 3
        result = mult1 * mult2
        if (result < 51) result = 51 // Garantir minimum 51 pour niveau difficile
      }
      
      console.log(`🎯 Target DIFFICILE (51-200) - Opérateur: ${config.operator}, Résultat: ${result}`)
      return result
    }
  }, [stats.level, config.operator])
  
  // Calculer les points avec handicaps et bonus de difficulté
  const calculateAdvancedPoints = useCallback((cells: Cell[], isCorrect: boolean) => {
    if (!isCorrect) return 0
    
    const values = cells.map(cell => cell.value!).filter(v => v !== null)
    const numCells = cells.length
    const combo = stats.combo
    const level = stats.level
    const age = userAge
    
    // Points de base
    let basePoints = numCells * 10
    
    // Multiplicateur de combo
    const comboMultiplier = 1 + (combo * 0.2)
    
    // Multiplicateur de niveau basé sur les paliers (handicap progressif)
    const difficultyTier = Math.floor((level - 1) / 10) + 1 // Palier 1, 2, 3, etc.
    const levelInTier = ((level - 1) % 10) + 1 // Niveau dans le palier (1-10)
    
    // Multiplicateur progressif par palier
    let levelMultiplier = 1
    if (difficultyTier === 1) {
      levelMultiplier = 1 + (levelInTier * 0.1) // Niveau facile : 1.1 à 2.0
    } else if (difficultyTier === 2) {
      levelMultiplier = 2 + (levelInTier * 0.15) // Niveau moyen : 2.15 à 3.5
    } else {
      levelMultiplier = 3.5 + (levelInTier * 0.2) // Niveau difficile : 3.7 à 5.5
    }
    
    // Bonus de difficulté basé sur les valeurs
    const maxValue = Math.max(...values)
    const minValue = Math.min(...values)
    const valueRange = maxValue - minValue
    const difficultyBonus = 1 + (valueRange / 50) // Plus les nombres sont éloignés, plus c'est difficile
    
    // Bonus de complexité du calcul
    let complexityBonus = 1
    if (config.operator === 'MUL') {
      complexityBonus = 1.5 // Multiplication plus difficile
    } else if (config.operator === 'DIV') {
      complexityBonus = 1.8 // Division encore plus difficile
    } else if (config.operator === 'MIXED') {
      complexityBonus = 2.0 // Mixte le plus difficile
    }
    
    // Handicap d'âge (plus l'utilisateur est jeune, plus les points sont élevés)
    const ageHandicap = age < 8 ? 1.5 : age < 12 ? 1.2 : 1.0
    
    // Bonus de target basé sur les paliers de difficulté
    let targetDifficultyBonus = 1.0
    if (target > 50) {
      targetDifficultyBonus = 1.5 // Niveau difficile (50+)
    } else if (target > 20) {
      targetDifficultyBonus = 1.2 // Niveau moyen (20-50)
    } else {
      targetDifficultyBonus = 1.0 // Niveau facile (≤20)
    }
    
    // Calcul final
    const finalPoints = Math.round(
      basePoints * 
      comboMultiplier * 
      levelMultiplier * 
      difficultyBonus * 
      complexityBonus * 
      ageHandicap * 
      targetDifficultyBonus
    )
    
    console.log(`🎯 Calcul de points avancé:`, {
      niveau: level,
      palier: difficultyTier,
      niveauDansPalier: levelInTier,
      basePoints,
      comboMultiplier: comboMultiplier.toFixed(2),
      levelMultiplier: levelMultiplier.toFixed(2),
      difficultyBonus: difficultyBonus.toFixed(2),
      complexityBonus: complexityBonus.toFixed(2),
      ageHandicap: ageHandicap.toFixed(2),
      targetDifficultyBonus: targetDifficultyBonus.toFixed(2),
      finalPoints
    })
    
    return finalPoints
  }, [stats.combo, stats.level, userAge, config.operator, target])
  
  // Spawn de nouveaux nombres - VERSION SIMPLIFIÉE
  const spawnNumbers = useCallback(() => {
    if (gameState !== 'playing') return
    
    setGrid(prevGrid => {
      // Vérifier si la grille est initialisée
      if (!prevGrid || prevGrid.length === 0) {
        console.log('⚠️ Grille non initialisée, impossible de spawn')
        return prevGrid
      }
      
      // Trouver les cellules vides
      const emptyCells: {row: number, col: number}[] = []
      const allCells: {row: number, col: number}[] = []
      
      for (let row = 0; row < config.gridSize; row++) {
        for (let col = 0; col < config.gridSize; col++) {
          allCells.push({ row, col })
          if (prevGrid[row] && prevGrid[row][col] && prevGrid[row][col].value === null) {
            emptyCells.push({ row, col })
          }
        }
      }
      
      // Si pas de cellules vides, on remplace des cellules existantes
      const cellsToUse = emptyCells.length > 0 ? emptyCells : allCells
      
      // Spawn de 3-5 nombres pour garder la grille remplie
      const numbersToSpawn = Math.min(5, cellsToUse.length)
      const newGrid = prevGrid.map(row => [...row])
      
      // Créer une copie des cellules disponibles pour éviter les doublons
      const availableCells = [...cellsToUse]
      
      for (let i = 0; i < numbersToSpawn; i++) {
        if (availableCells.length === 0) break
        
        const randomIndex = Math.floor(Math.random() * availableCells.length)
        const { row, col } = availableCells.splice(randomIndex, 1)[0]
        
        // Utiliser des nombres complexes pour certains spawns (30% de chance)
        const useComplexNumber = Math.random() < 0.3 && stats.level >= 10
        const newValue = useComplexNumber ? generateComplexNumber() : generateRandomNumber()
        const oldValue = newGrid[row][col].value
        newGrid[row][col].value = newValue
        newGrid[row][col].bornAt = Date.now()
        
        if (oldValue !== null) {
          console.log(`🔄 Remplacement nombre ${oldValue} → ${newValue} à [${row},${col}]`)
        } else {
          console.log(`🎲 Spawn nombre ${newValue} à [${row},${col}]`)
        }
      }
      
      return newGrid
    })
  }, [gameState, config.gridSize, generateRandomNumber, generateComplexNumber, stats.level])
  
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
        // Vérifier que la multiplication donne un résultat entier et égal au target
        const product = values.reduce((prod, val) => prod * val, 1)
        return product === target && Number.isInteger(product)
      case 'DIV':
        // Vérifier que la division donne un résultat entier et égal au target
        if (values.length !== 2) return false
        const div1 = values[0] / values[1]
        const div2 = values[1] / values[0]
        return (Number.isInteger(div1) && div1 === target) || (Number.isInteger(div2) && div2 === target)
      case 'MIXED':
        // Essayer toutes les opérations
        const sum = values.reduce((s, v) => s + v, 0)
        const diff = values.length === 2 ? Math.abs(values[0] - values[1]) : 0
        const prod = values.reduce((p, v) => p * v, 1)
        
        // Division seulement si elle donne un entier
        let div = 0
        if (values.length === 2) {
          const div1 = values[0] / values[1]
          const div2 = values[1] / values[0]
          if (Number.isInteger(div1)) div = div1
          else if (Number.isInteger(div2)) div = div2
        }
        
        return sum === target || diff === target || prod === target || div === target
      default:
        return false
    }
  }, [config.operator, target])
  
  // Soumettre une solution - Optimisé
  const handleSubmit = useCallback((cells: Cell[] = selectedCells) => {
    if (gameState !== 'playing') return
    
    const isCorrectSolution = checkSolution(cells)
    
    if (isCorrectSolution) {
      // Solution correcte - Nouveau système de points avancé
      const points = calculateAdvancedPoints(cells, true)
      
      // Batch les mises à jour de stats pour éviter les re-renders multiples
      setStats(prev => {
        const newSuccessfulMoves = prev.successfulMoves + 1
        const newTotalMoves = prev.totalMoves + 1
        const newCombo = prev.combo + 1
        const newScore = prev.score + points
        const newLevel = Math.floor(newScore / 1000) + 1
        
        // Vérifier passage de niveau
        if (newLevel > prev.level) {
          setShowLevelUp(true)
          setTimeout(() => setShowLevelUp(false), 3000)
          
          // Sauvegarder le nouveau niveau max
          if (newLevel > maxLevel) {
            setMaxLevel(newLevel)
            localStorage.setItem('cubematch-max-level', newLevel.toString())
          }
        }
        
        // Vérifier nouveau record
        if (newScore > sessionBestScore) {
          setSessionBestScore(newScore)
          setShowNewRecord(true)
          setTimeout(() => setShowNewRecord(false), 3000)
          localStorage.setItem('cubematch-session-best', newScore.toString())
        }
        
        return {
          ...prev,
          score: newScore,
          level: newLevel,
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
  }, [gameState, selectedCells, checkSolution, calculateAdvancedPoints, config.soundEnabled, generateTarget, isTutorialMode, tutorialStep])
  
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
        
        // Vérifier automatiquement si c'est une solution (minimum 2 cellules)
        if (config.autoSubmit && newSelection.length >= 2 && checkSolution(newSelection)) {
          console.log('🎯 AUTO-VALIDATION: Solution détectée automatiquement!')
          setTimeout(() => handleSubmit(newSelection), 100)
        }
        
        return newSelection
      }
    })
  }, [gameState, config.autoSubmit, checkSolution, handleSubmit])
  
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
      timeLeft: config.unlimitedTime ? 999999 : config.timeLimit,
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
    
    console.log('🏗️ Initialisation de la grille avec nombres...')
    initializeGridWithNumbers()
    
    // Timer principal
    if (!config.unlimitedTime) {
      // Nettoyer l'ancien timer s'il existe
      if (timeTimerRef.current) clearInterval(timeTimerRef.current)
      
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
      // Nettoyer l'ancien timer s'il existe
      if (timeTimerRef.current) clearInterval(timeTimerRef.current)
      
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
  
  // Démarrer en mode infini
  const startInfiniteGame = useCallback(() => {
    console.log('🚀 Démarrage mode infini...')
    
    // Configurer le mode infini
    setConfig(prev => ({ ...prev, unlimitedTime: true }))
    
    // Démarrer le jeu normalement (il détectera le mode infini)
    startGame()
    
    console.log('✅ Mode infini activé - Pas de limite de temps')
  }, [startGame])
  
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
          
          {maxLevel > 1 && (
            <button
              onClick={() => {
                setStats(prev => ({ ...prev, level: maxLevel, score: sessionBestScore }))
                startGame()
              }}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl transform"
            >
              <span className="text-2xl mr-3">🎯</span>
              Continuer Niveau {maxLevel}
            </button>
          )}
          
          <button
            onClick={startInfiniteGame}
            className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white py-4 rounded-2xl font-bold text-lg hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl transform"
          >
            <span className="text-2xl mr-3">∞</span>
            Mode Infini
          </button>
          
          <button
            onClick={() => {
              console.log('🧪 TEST: Initialisation directe de la grille...')
              initializeGridWithNumbers()
            }}
            className="w-full bg-gradient-to-r from-red-400 to-pink-500 text-white py-4 rounded-2xl font-bold text-lg hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl transform"
          >
            <span className="text-2xl mr-3">🧪</span>
            Test Nombres
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
        className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
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
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* COLONNE GAUCHE */}
          <div className="space-y-4">
            {/* Section Jeu */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-lg">🎮</span>
                Configuration du Jeu
              </h3>
              
              <div className="space-y-4">
                {/* Difficulté */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Difficulté</label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['EASY', 'MEDIUM', 'HARD'] as Difficulty[]).map(diff => (
                      <button
                        key={diff}
                        onClick={() => setConfig(prev => ({ ...prev, difficulty: diff }))}
                        className={`py-2 px-2 rounded-lg text-xs font-medium transition-colors ${
                          config.difficulty === diff
                            ? `bg-gradient-to-r ${currentTheme.primary} text-white`
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        {diff === 'EASY' ? 'Facile' : diff === 'MEDIUM' ? 'Moyen' : 'Difficile'}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Opérateur */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Opération</label>
                  <div className="grid grid-cols-5 gap-1">
                    {(['ADD', 'SUB', 'MUL', 'DIV', 'MIXED'] as Operator[]).map(op => (
                      <button
                        key={op}
                        onClick={() => setConfig(prev => ({ ...prev, operator: op }))}
                        className={`py-2 px-1 rounded-lg text-xs font-medium transition-colors ${
                          config.operator === op
                            ? `bg-gradient-to-r ${currentTheme.primary} text-white`
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        {op === 'ADD' ? '+' : op === 'SUB' ? '-' : op === 'MUL' ? '×' : op === 'DIV' ? '÷' : 'Mix'}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Taille de grille */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Taille: {config.gridSize}×{config.gridSize}
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
              </div>
            </div>
            
            {/* Section Temps */}
            <div className="bg-green-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-lg">⏰</span>
                Gestion du Temps
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                  <span className="text-xs text-gray-700 font-medium">Temps limité</span>
                  <input
                    type="checkbox"
                    checked={!config.unlimitedTime}
                    onChange={(e) => setConfig(prev => ({ ...prev, unlimitedTime: !e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </div>
                
                {!config.unlimitedTime && (
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <label className="block text-xs text-gray-600 mb-2">
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
                      <span className="text-xs text-green-700 font-medium">Mode infini activé</span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">Points réduits de 50%</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* COLONNE DROITE */}
          <div className="space-y-4">
            {/* Section Spawn */}
            <div className="bg-blue-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-lg">⚡</span>
                Apparition des Nombres
              </h3>
            
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Fréquence: {config.spawnRate / 1000}s
                </label>
                <input
                  type="range"
                  min="1000"
                  max="10000"
                  step="500"
                  value={config.spawnRate}
                  onChange={(e) => setConfig(prev => ({ ...prev, spawnRate: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1s</span>
                  <span>10s</span>
                </div>
              </div>
            </div>
            
            {/* Section Options */}
            <div className="bg-purple-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-lg">⚙️</span>
                Options
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                  <span className="text-xs text-gray-700 font-medium">Son activé</span>
                  <input
                    type="checkbox"
                    checked={config.soundEnabled}
                    onChange={(e) => setConfig(prev => ({ ...prev, soundEnabled: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                  <span className="text-xs text-gray-700 font-medium">Indices activés</span>
                  <input
                    type="checkbox"
                    checked={config.hintsEnabled}
                    onChange={(e) => setConfig(prev => ({ ...prev, hintsEnabled: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                  <span className="text-xs text-gray-700 font-medium">Diagonales autorisées</span>
                  <input
                    type="checkbox"
                    checked={config.allowDiagonals}
                    onChange={(e) => setConfig(prev => ({ ...prev, allowDiagonals: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </div>
              </div>
            </div>
            
            {/* Section Thème */}
            <div className="bg-pink-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-lg">🎨</span>
                Thème Visuel
              </h3>
              
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(THEMES) as Array<keyof typeof THEMES>).map(theme => (
                  <button
                    key={theme}
                    onClick={() => setConfig(prev => ({ ...prev, theme }))}
                    className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors capitalize ${
                      config.theme === theme
                        ? `bg-gradient-to-r ${THEMES[theme].primary} text-white`
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
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
        </div>
      </motion.div>
    </div>
  )
  
  // Rendu du jeu
  const renderGame = () => {
    // Debug: log de l'état de la grille
    console.log(`🔍 ÉTAT GRILLE: ${grid.length} lignes, ${grid[0]?.length || 0} colonnes`)
    console.log(`🔍 NOMBRES DANS GRILLE:`, grid.flat().filter(cell => cell.value !== null).length)
    
    return (
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
        <div className="flex items-center justify-between gap-4 p-3 relative z-10 h-20">
          
          {/* Section Gauche - Stats */}
          <div className="flex items-center gap-4 h-full mt-16">
            {/* Card Score */}
            <div className="bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 border-2 border-yellow-500 rounded-2xl px-4 py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="text-xl text-white font-bold flex items-center gap-2 mb-1">
                <Trophy className="w-4 h-4" />
                Score
              </div>
              <div className="text-xl font-black text-white drop-shadow-lg">{stats.score.toLocaleString()}</div>
              {sessionBestScore > 0 && (
                <div className="text-xl text-yellow-100 font-semibold">Meilleur: {sessionBestScore.toLocaleString()}</div>
              )}
            </div>
            
            {/* Card Niveau */}
            <div className="bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-500 border-2 border-blue-500 rounded-2xl px-4 py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="text-xl text-white font-bold flex items-center gap-2 mb-1">
                <Star className="w-4 h-4" />
                Niveau
              </div>
              <div className="text-6xl font-black text-white drop-shadow-lg">{stats.level}</div>
            </div>
            
            {/* Card Temps/Mode Infini */}
            {!config.unlimitedTime ? (
              <div className="bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 border-2 border-green-500 rounded-2xl px-4 py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="text-xl text-white font-bold flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4" />
                  Temps
                </div>
                <div className="text-6xl font-black text-white drop-shadow-lg">{stats.timeLeft}s</div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-purple-400 via-pink-500 to-rose-500 border-2 border-purple-500 rounded-2xl px-4 py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="text-xl text-white font-bold flex items-center gap-2 mb-1">
                  <span className="text-xl">∞</span>
                  Mode Infini
                </div>
                <div className="text-6xl font-black text-white drop-shadow-lg">∞</div>
              </div>
            )}
        </div>
        
        {/* Section Centre - Objectif */}
        <div className="flex-1 flex justify-center items-center h-full">
          <div className={`inline-flex items-center gap-3 bg-gradient-to-r ${currentTheme.primary} text-white px-6 py-2 rounded-2xl shadow-lg transform -translate-x-32 mt-20`}>
            <Target className="w-5 h-5" />
            <span className="text-lg font-bold text-white">Trouve le chiffre ({target}) en utilisant une opération</span>
            <span className="text-lg font-bold text-white">
              {config.operator === 'ADD' ? 'Addition' : 
               config.operator === 'SUB' ? 'Soustraction' :
               config.operator === 'MUL' ? 'Multiplication' :
               config.operator === 'DIV' ? 'Division' : 'Mixte'}
            </span>
          </div>
        </div>
        
        {/* Section Droite - Actions et Contrôles */}
        <div className="flex items-center gap-3 h-full">
          <button
            onClick={pauseGame}
            className={`p-3 rounded-xl ${currentTheme.accent} text-white hover:scale-110 transition-all duration-300 shadow-lg`}
          >
            {gameState === 'paused' ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
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
        <div className="flex-1 flex flex-col items-center justify-start p-4 relative z-10 mt-20 pt-4">
        {/* Grille - Design Enfantin */}
        <div 
          className="grid gap-2 p-2 bg-gradient-to-br from-white via-blue-50 to-green-50 border-2 border-blue-200 rounded-3xl shadow-2xl"
          style={{ 
            gridTemplateColumns: `repeat(${config.gridSize}, minmax(0, 1fr))`,
            width: isFullPage 
              ? (isMobile ? '90vw' : '45vw') 
              : (isMobile ? '90vw' : '400px'),
            aspectRatio: '1'
          }}
        >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            // Debug: log de chaque cellule rendue
            if (cell.value !== null) {
              console.log(`🎨 RENDU: Cellule [${cell.row},${cell.col}] = ${cell.value}`)
            }
            return (
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
            )
          })
        )}
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
        
        {/* Zone d'événements - HORS DE LA GRILLE */}
        <div className="absolute top-32 right-4 z-40 space-y-2">
        {/* Animation Level Up */}
        <AnimatePresence>
          {showLevelUp && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, x: 100 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.5, x: 100 }}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-xl shadow-lg text-center min-w-[160px]"
            >
              <div className="text-4xl mb-1">🎉</div>
              <div className="text-4xl font-bold text-white">Tu as atteint le niveau {stats.level} !</div>
              <div className="text-4xl font-bold text-white">Félicitations !</div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Animation Nouveau Record */}
        <AnimatePresence>
          {showNewRecord && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, x: 100 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.5, x: 100 }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl shadow-lg text-center min-w-[160px]"
            >
              <div className="text-2xl mb-1">🏆</div>
              <div className="text-sm font-bold">NOUVEAU RECORD !</div>
              <div className="text-xs opacity-90">{stats.score.toLocaleString()} points</div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>

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
      </div>
    )
  }
  
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
