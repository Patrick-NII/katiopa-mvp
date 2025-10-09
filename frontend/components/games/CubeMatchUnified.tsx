'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useScreenSize } from '@/hooks/useScreenSize'
import { type ScoreData, type GameSettings } from '@/lib/api/cubematch-v2'
import { cubeMatchService } from '@/lib/services/cubematch-service'
import { SeriesCollector } from '@/lib/services/cubematch-series-api'
// 🎯 Nouveau système de jeu modulaire
import { 
  createStandardConfig, 
  MetricsCollector,
  type Operator as NewOperator,
  GridGenerator,
  type GenerationContext,
  SolvabilityValidator,
  OperatorStrategyFactory,
  AdvancedDifficultyModel,
  AdvancedScoringModel,
  AdvancedTimerModel,
  AdaptiveModelsFactory
} from '@/lib/game-config'
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
       'from-cyan-400 to-rose-500',     // 10
       'from-emerald-400 to-cyan-500',  // 11
       'from-teal-400 to-emerald-500',  // 12
       'from-sky-400 to-teal-500',      // 13
       'from-violet-400 to-sky-500',    // 14
       'from-fuchsia-400 to-violet-500', // 15
       'from-amber-400 to-fuchsia-500', // 16
       'from-lime-400 to-amber-500',    // 17
       'from-slate-400 to-lime-500',    // 18
       'from-gray-400 to-slate-500',    // 19
       'from-zinc-400 to-gray-500'      // 20+
     ]
     
     // Pour les nombres > 20, utiliser des couleurs spéciales
     let cellColor: string
     if (cell.value <= 20) {
       const colorIndex = Math.min(cell.value - 1, valueColors.length - 1)
       cellColor = valueColors[colorIndex]
     } else if (cell.value <= 50) {
       // Nombres 21-50: couleurs dorées/orangées
       const goldColors = [
         'from-yellow-300 to-orange-400',
         'from-orange-300 to-red-400',
         'from-red-300 to-pink-400',
         'from-pink-300 to-rose-400',
         'from-rose-300 to-amber-400'
       ]
       cellColor = goldColors[(cell.value - 21) % goldColors.length]
     } else if (cell.value <= 100) {
       // Nombres 51-100: couleurs bleues/violettes
       const blueColors = [
         'from-blue-300 to-indigo-400',
         'from-indigo-300 to-purple-400',
         'from-purple-300 to-violet-400',
         'from-violet-300 to-fuchsia-400',
         'from-fuchsia-300 to-pink-400'
       ]
       cellColor = blueColors[(cell.value - 51) % blueColors.length]
     } else {
       // Nombres 101+: couleurs sombres et intenses
       const darkColors = [
         'from-gray-600 to-slate-700',
         'from-slate-600 to-gray-700',
         'from-zinc-600 to-gray-700',
         'from-neutral-600 to-zinc-700',
         'from-stone-600 to-neutral-700'
       ]
       cellColor = darkColors[(cell.value - 101) % darkColors.length]
     }
    
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
    timeLeft: 180,
    cellsCleared: 0,
    totalMoves: 0,
    successfulMoves: 0,
    hintsUsed: 0,
    accuracy: 0,
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
  const [consecutiveErrors, setConsecutiveErrors] = useState(0)
  const [currentSeries, setCurrentSeries] = useState<{
    attempts: number
    correct: number
    startTime: number
    timerId: NodeJS.Timeout | null
  }>({
    attempts: 0,
    correct: 0,
    startTime: 0,
    timerId: null
  })
  const [timeRemaining, setTimeRemaining] = useState(0)
  
  // 🎯 Collecteur de séries pour le tracking détaillé
  const seriesCollectorRef = useRef<SeriesCollector | null>(null)   // 🎯 Tracking des erreurs consécutives
  const [previousConfig, setPreviousConfig] = useState<GameConfig>(config) // 🔧 Pour détecter les changements
  
  // 🎯 NOUVEAU SYSTÈME - Refs et états pour le système modulaire
  const metricsCollectorRef = useRef<MetricsCollector | null>(null)
  const difficultyModelRef = useRef<AdvancedDifficultyModel | null>(null)
  const scoringModelRef = useRef<AdvancedScoringModel | null>(null)
  const timerModelRef = useRef<AdvancedTimerModel | null>(null)
  const [currentDifficulty, setCurrentDifficulty] = useState(1.0) // Difficulté continue du nouveau système
  
  // 🕐 Calculer le temps de validation selon niveau et difficulté
  const getValidationTime = useCallback(() => {
    const baseTime = 5000 // 5 secondes de base
    const levelMultiplier = Math.max(0.5, 1 - (stats.level - 1) * 0.1) // Réduit avec le niveau
    const difficultyMultiplier = {
      'EASY': 1.5,
      'MEDIUM': 1.0,
      'HARD': 0.7
    }[config.difficulty] || 1.0
    
    return Math.max(2000, baseTime * levelMultiplier * difficultyMultiplier) // Minimum 2 secondes
  }, [stats.level, config.difficulty])
  
  // 🎯 Démarrer une nouvelle série de calculs
  const startNewSeries = useCallback(() => {
    // Nettoyer l'ancien timer s'il existe
    if (currentSeries.timerId) {
      clearTimeout(currentSeries.timerId)
    }
    
    const validationTime = getValidationTime()
    setTimeRemaining(validationTime / 1000) // Temps en secondes pour l'affichage
    
    // Démarrer une nouvelle série dans le collecteur
    if (seriesCollectorRef.current) {
      seriesCollectorRef.current.startSeries(
        config.operator,
        target,
        config.difficulty,
        validationTime
      )
    }
    
    // Timer visuel qui se met à jour chaque seconde
    const visualTimer = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1
        if (newTime <= 0) {
          clearInterval(visualTimer)
          return 0
        }
        return newTime
      })
    }, 1000)
    
    setCurrentSeries({
      attempts: 0,
      correct: 0,
      startTime: Date.now(),
      timerId: setTimeout(() => {
        // Temps écoulé - pénalité de précision
        console.log(`⏰ Temps de validation écoulé (${validationTime}ms) - Pénalité de précision`)
        
        clearInterval(visualTimer)
        setTimeRemaining(0)
        
        // Enregistrer le timeout dans le collecteur
        if (seriesCollectorRef.current) {
          seriesCollectorRef.current.recordAttempt(
            [], // Pas de nombres sélectionnés pour un timeout
            target,
            config.operator,
            false,
            validationTime,
            'timeout',
            false
          )
        }
        
        setCurrentSeries(prev => ({
          ...prev,
          attempts: prev.attempts + 1,
          timerId: null
        }))
        
        // Calculer la nouvelle précision basée sur la série
        setStats(prev => {
          const newTotalMoves = prev.totalMoves + 1
          const seriesAccuracy = currentSeries.attempts > 0 
            ? (currentSeries.correct / (currentSeries.attempts + 1)) * 100 
            : 0
          const newAccuracy = Math.max(0, prev.accuracy - 5) // Pénalité de 5%
          
          return {
            ...prev,
            totalMoves: newTotalMoves,
            accuracy: newAccuracy
          }
        })
        
        // Nettoyer la sélection
        setSelectedCells([])
      }, validationTime)
    })
  }, [currentSeries, getValidationTime, config.operator, config.difficulty, target])
  
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
  
  // 🧮 Obtenir tous les facteurs d'un nombre (défini en premier)
  const getFactors = useCallback((num: number): number[] => {
    const factors = []
    for (let i = 1; i <= Math.sqrt(num); i++) {
      if (num % i === 0) {
        factors.push(i)
        if (i !== num / i) {
          factors.push(num / i)
        }
      }
    }
    return factors.sort((a, b) => a - b)
  }, [])

  // 🧮 Calculer tous les résultats possibles d'une grille (VERSION ROBUSTE)
  const calculateAllPossibleResults = useCallback((numbers: number[], operator: Operator): number[] => {
    const results = new Set<number>()
    
    console.log(`🧮 Calcul résultats possibles - Nombres: [${numbers.join(', ')}], Opérateur: ${operator}`)
    
    // Vérifier qu'on a au moins 2 nombres
    if (numbers.length < 2) {
      console.warn('⚠️ Pas assez de nombres pour calculer des résultats')
      return []
    }
    
    // Tester toutes les combinaisons de 2 nombres
    for (let i = 0; i < numbers.length; i++) {
      for (let j = i + 1; j < numbers.length; j++) {
        const num1 = numbers[i]
        const num2 = numbers[j]
        
        // Vérifier que les nombres sont valides
        if (typeof num1 !== 'number' || typeof num2 !== 'number' || isNaN(num1) || isNaN(num2)) {
          console.warn(`⚠️ Nombre invalide détecté: ${num1}, ${num2}`)
          continue
        }
        
        switch (operator) {
          case 'ADD':
            const sum = num1 + num2
            if (sum > 0 && Number.isInteger(sum)) {
              results.add(sum)
            }
            break
          
          case 'SUB':
            const diff1 = Math.abs(num1 - num2)
            const diff2 = Math.abs(num2 - num1)
            if (diff1 > 0 && Number.isInteger(diff1)) results.add(diff1)
            if (diff2 > 0 && Number.isInteger(diff2) && diff2 !== diff1) results.add(diff2)
            break
          
          case 'MUL':
            const product = num1 * num2
            if (product > 0 && Number.isInteger(product)) {
              results.add(product)
            }
            break
          
          case 'DIV':
            // Division dans les deux sens avec vérifications strictes
            if (num2 !== 0 && num1 % num2 === 0) {
              const div1 = num1 / num2
              if (div1 > 0 && Number.isInteger(div1)) {
                results.add(div1)
              }
            }
            if (num1 !== 0 && num2 % num1 === 0) {
              const div2 = num2 / num1
              if (div2 > 0 && Number.isInteger(div2)) {
                results.add(div2)
              }
            }
            break
          
          case 'MIXED':
            // Tester toutes les opérations avec vérifications
            const mixedSum = num1 + num2
            if (mixedSum > 0 && Number.isInteger(mixedSum)) results.add(mixedSum)
            
            const mixedDiff1 = Math.abs(num1 - num2)
            const mixedDiff2 = Math.abs(num2 - num1)
            if (mixedDiff1 > 0 && Number.isInteger(mixedDiff1)) results.add(mixedDiff1)
            if (mixedDiff2 > 0 && Number.isInteger(mixedDiff2) && mixedDiff2 !== mixedDiff1) results.add(mixedDiff2)
            
            const mixedProduct = num1 * num2
            if (mixedProduct > 0 && Number.isInteger(mixedProduct)) results.add(mixedProduct)
            
            if (num2 !== 0 && num1 % num2 === 0) {
              const mixedDiv1 = num1 / num2
              if (mixedDiv1 > 0 && Number.isInteger(mixedDiv1)) results.add(mixedDiv1)
            }
            if (num1 !== 0 && num2 % num1 === 0) {
              const mixedDiv2 = num2 / num1
              if (mixedDiv2 > 0 && Number.isInteger(mixedDiv2)) results.add(mixedDiv2)
            }
            break
        }
      }
    }
    
    const resultsArray = Array.from(results).filter(r => r > 0 && Number.isInteger(r) && !isNaN(r))
    console.log(`📊 Résultats possibles trouvés: [${resultsArray.join(', ')}] (${resultsArray.length} résultats)`)
    
    return resultsArray.sort((a, b) => a - b)
  }, [])

  // 🎯 Filtrer les résultats selon la difficulté
  const filterResultsByDifficulty = useCallback((results: number[], tier: number): number[] => {
    if (tier === 1) {
      // Niveau facile: résultats 1-20
      return results.filter(r => r >= 1 && r <= 20)
    } else if (tier === 2) {
      // Niveau moyen: résultats 1-50
      return results.filter(r => r >= 1 && r <= 50)
    } else {
      // Niveau difficile: résultats 1-200
      return results.filter(r => r >= 1 && r <= 200)
    }
  }, [])

  // 🧠 NOUVELLE LOGIQUE : Utiliser le GridGenerator modulaire
  const initializeGridWithNumbers = useCallback(() => {
    console.log('🏗️ Création de la grille avec SYSTÈME MODULAIRE INTELLIGENT...')
    
    // Créer le contexte de génération
    const context: GenerationContext = {
      difficulty: currentDifficulty,
      level: stats.level,
      age: userAge || 6,
      consecutiveErrors: consecutiveErrors,
      accuracy: stats.accuracy
    }
    
    // Créer le générateur avec RNG par défaut
    const rng = { next: () => Math.random() }
    const generator = new GridGenerator(rng, {
      size: config.gridSize,
      operator: config.operator as NewOperator,
      difficulty: currentDifficulty,
      context,
      allowLongDecompositions: true,
      minSolutions: 1,
      maxSolutions: 3,
      distractorStrategy: currentDifficulty > 2.0 ? 'misleading' : 
                          currentDifficulty > 1.5 ? 'similar' : 'random'
    })
    
    // Générer la grille
    const result = generator.generate()
    
    // Convertir la grille au format de l'interface
    const newGrid: Cell[][] = []
    for (let row = 0; row < config.gridSize; row++) {
      newGrid[row] = []
      for (let col = 0; col < config.gridSize; col++) {
        const generatedCell = result.grid[row][col]
        newGrid[row][col] = {
          id: `${row}-${col}`,
          row,
          col,
          value: generatedCell.value || null,
          bornAt: Date.now(),
          selected: false
        }
      }
    }
    
    console.log(`✅ Grille créée avec le système modulaire`)
    console.log(`🎯 Target: ${result.target}`)
    console.log(`📊 Solutions possibles: ${result.allSolutions.length}`)
    console.log(`🎲 Complexité: ${result.metadata.complexity}`)
    console.log(`🎲 Distracteurs: ${result.metadata.distractorCount}`)
    
    // Démarrer un nouveau round dans le collecteur de métriques
    console.log('🎯 Démarrage nouveau round dans MetricsCollector:', !!metricsCollectorRef.current)
    if (metricsCollectorRef.current) {
      metricsCollectorRef.current.startRound(
        config.operator as NewOperator,
        result.target,
        currentDifficulty
      )
      console.log('✅ Round démarré dans MetricsCollector:', config.operator, result.target, currentDifficulty)
    } else {
      console.warn('⚠️ MetricsCollector non disponible pour startRound')
    }
    
    // Mettre à jour la grille ET le target
    setGrid(newGrid)
    setTarget(result.target)
  }, [config.gridSize, config.operator, stats.level, stats.accuracy, consecutiveErrors, currentDifficulty, userAge])

  // 🧠 LOGIQUE DYNAMIQUE : Recalculer le target selon les nombres restants avec le nouveau système
  const updateTargetFromCurrentGrid = useCallback(() => {
    // 🧮 Extraire tous les nombres actuellement dans la grille
    const currentNumbers: number[] = []
    grid.forEach(row => {
      row.forEach(cell => {
        if (cell.value !== null) {
          currentNumbers.push(cell.value)
        }
      })
    })
    
    if (currentNumbers.length === 0) {
      console.log('🔄 Grille vide, génération d\'une nouvelle grille...')
      initializeGridWithNumbers()
      return
    }
    
    console.log(`🎯 Recalcul target dynamique - Nombres restants: [${currentNumbers.join(', ')}], Opérateur: ${config.operator}`)
    
    // Utiliser le SolvabilityValidator pour trouver les solutions possibles
    const validation = SolvabilityValidator.validateGrid(
      currentNumbers,
      target,
      config.operator as NewOperator,
      true // Autoriser les décompositions longues
    )
    
    // Si le target actuel n'est pas solvable, en trouver un nouveau
    if (!validation.solvable) {
      console.warn('⚠️ Target actuel non solvable, recherche d\'un nouveau target...')
      
      // Calculer tous les résultats possibles
      const possibleResults = calculateAllPossibleResults(currentNumbers, config.operator)
      
      if (possibleResults.length === 0) {
        console.warn('⚠️ Aucun résultat possible, génération nouvelle grille')
        initializeGridWithNumbers()
        return
      }
      
      // Choisir un nouveau target aléatoire
      const newTarget = possibleResults[Math.floor(Math.random() * possibleResults.length)]
      setTarget(newTarget)
      console.log(`✅ Nouveau target: ${newTarget} (parmi ${possibleResults.length} résultats possibles)`)
      
      // Démarrer un nouveau round dans le collecteur
      if (metricsCollectorRef.current) {
        metricsCollectorRef.current.startRound(
          config.operator as NewOperator,
          newTarget,
          currentDifficulty
        )
      }
    } else {
      console.log(`✅ Target actuel (${target}) toujours solvable avec ${validation.solutions.length} solution(s)`)
    }
  }, [grid, target, config.operator, currentDifficulty, calculateAllPossibleResults, initializeGridWithNumbers])

  // 🧠 GÉNÉRATION INITIALE : Grille → Résultats possibles → Target
  const generateTargetFromGrid = useCallback((gridNumbers: number[]): number => {
    const difficultyTier = Math.floor((stats.level - 1) / 10) + 1
    
    console.log(`🎯 Génération target initial - Nombres: [${gridNumbers.join(', ')}], Opérateur: ${config.operator}`)
    
    // 🧮 CALCULER tous les résultats possibles de la grille
    const possibleResults = calculateAllPossibleResults(gridNumbers, config.operator)
    
    if (possibleResults.length === 0) {
      console.warn('⚠️ Aucun résultat possible trouvé, utilisation target par défaut')
      return 10
    }
    
    // 🎯 FILTRER les résultats selon le niveau de difficulté
    const filteredResults = filterResultsByDifficulty(possibleResults, difficultyTier)
    
    if (filteredResults.length === 0) {
      console.warn('⚠️ Aucun résultat adapté au niveau, utilisation de tous les résultats')
      return possibleResults[Math.floor(Math.random() * possibleResults.length)]
    }
    
    // 🎲 CHOISIR un target aléatoire parmi les résultats possibles
    const selectedTarget = filteredResults[Math.floor(Math.random() * filteredResults.length)]
    
    console.log(`✅ Target initial sélectionné: ${selectedTarget} (parmi ${filteredResults.length} résultats possibles)`)
    return selectedTarget
  }, [stats.level, config.operator, calculateAllPossibleResults, filterResultsByDifficulty])

  // 🔍 VÉRIFICATION DE SOLVABILITÉ EN TEMPS RÉEL
  const checkCurrentSolvability = useCallback(() => {
    // 🧮 Extraire tous les nombres actuellement dans la grille
    const currentNumbers: number[] = []
    grid.forEach(row => {
      row.forEach(cell => {
        if (cell.value !== null) {
          currentNumbers.push(cell.value)
        }
      })
    })
    
    if (currentNumbers.length === 0) {
      return { isSolvable: false, reason: 'Grille vide' }
    }
    
    // 🧮 CALCULER tous les résultats possibles avec les nombres restants
    const possibleResults = calculateAllPossibleResults(currentNumbers, config.operator)
    
    if (possibleResults.length === 0) {
      return { isSolvable: false, reason: 'Aucun résultat possible' }
    }
    
    // 🎯 VÉRIFIER si le target actuel est atteignable
    const isCurrentTargetSolvable = possibleResults.includes(target)
    
    if (!isCurrentTargetSolvable) {
      console.warn(`⚠️ Target ${target} non atteignable avec les nombres restants: [${currentNumbers.join(', ')}]`)
      console.log(`📊 Résultats possibles: [${possibleResults.join(', ')}]`)
      return { 
        isSolvable: false, 
        reason: `Target ${target} non atteignable`,
        possibleResults,
        currentNumbers
      }
    }
    
    return { 
      isSolvable: true, 
      possibleResults, 
      currentNumbers,
      currentTarget: target
    }
  }, [grid, target, config.operator, calculateAllPossibleResults])

  // 🔍 SURVEILLANCE DE LA SOLVABILITÉ EN TEMPS RÉEL
  useEffect(() => {
    if (gameState === 'playing' && grid.length > 0) {
      const solvability = checkCurrentSolvability()
      
      if (!solvability.isSolvable && solvability.reason !== 'Grille vide') {
        console.warn(`🚨 PROBLÈME DE SOLVABILITÉ DÉTECTÉ: ${solvability.reason}`)
        // Corriger automatiquement le target
        updateTargetFromCurrentGrid()
      }
    }
  }, [grid, target, gameState, checkCurrentSolvability, updateTargetFromCurrentGrid])

  // 🔍 FONCTION DE DEBUG : Afficher l'état complet de la grille
  const debugGridState = useCallback(() => {
    const currentNumbers: number[] = []
    grid.forEach(row => {
      row.forEach(cell => {
        if (cell.value !== null) {
          currentNumbers.push(cell.value)
        }
      })
    })
    
    const possibleResults = calculateAllPossibleResults(currentNumbers, config.operator)
    const solvability = checkCurrentSolvability()
    
    console.log('🔍 ÉTAT COMPLET DE LA GRILLE:')
    console.log(`📊 Nombres dans la grille: [${currentNumbers.join(', ')}]`)
    console.log(`🎯 Target actuel: ${target}`)
    console.log(`🧮 Opérateur: ${config.operator}`)
    console.log(`📈 Résultats possibles: [${possibleResults.join(', ')}]`)
    console.log(`✅ Solvabilité: ${solvability.isSolvable ? 'OUI' : 'NON'} - ${solvability.reason || 'OK'}`)
    console.log(`🎮 Niveau: ${stats.level} (Tier ${Math.floor((stats.level - 1) / 10) + 1})`)
    console.log(`🎯 Précision: ${stats.accuracy}%`)
    console.log(`❌ Erreurs consécutives: ${consecutiveErrors}`)
    console.log(`🔥 Combo: ${stats.combo}`)
    console.log(`⭐ Score: ${stats.score}`)
    
    return {
      currentNumbers,
      target,
      operator: config.operator,
      possibleResults,
      solvability,
      level: stats.level,
      accuracy: stats.accuracy,
      consecutiveErrors,
      combo: stats.combo,
      score: stats.score
    }
  }, [grid, target, config.operator, stats.level, stats.accuracy, stats.combo, stats.score, consecutiveErrors, calculateAllPossibleResults, checkCurrentSolvability])

  // 🔧 DÉTECTER SI LES PARAMÈTRES AFFECTENT LE JEU
  const hasGameAffectingChanges = useCallback((newConfig: GameConfig, oldConfig: GameConfig): boolean => {
    // Paramètres qui affectent la génération de la grille
    const gameAffectingParams = ['operator', 'difficulty', 'gridSize']
    
    for (const param of gameAffectingParams) {
      if (newConfig[param as keyof GameConfig] !== oldConfig[param as keyof GameConfig]) {
        console.log(`🔄 Changement détecté: ${param} (${oldConfig[param as keyof GameConfig]} → ${newConfig[param as keyof GameConfig]})`)
        return true
      }
    }
    
    console.log('✅ Aucun changement affectant le jeu détecté')
    return false
  }, [])

  // 🔧 GESTION INTELLIGENTE DES CHANGEMENTS DE CONFIG
  const handleConfigChange = useCallback((newConfig: GameConfig) => {
    const hasChanges = hasGameAffectingChanges(newConfig, previousConfig)
    
    if (hasChanges && gameState === 'playing') {
      console.log('🔄 Paramètres affectant le jeu modifiés, regénération de la grille...')
      setConfig(newConfig)
      setPreviousConfig(newConfig)
      // Regénérer la grille seulement si nécessaire
      initializeGridWithNumbers()
    } else {
      console.log('✅ Paramètres non-affectants modifiés, pas de regénération')
      setConfig(newConfig)
      setPreviousConfig(newConfig)
    }
  }, [hasGameAffectingChanges, previousConfig, gameState, initializeGridWithNumbers])
  
  // 🧠 GÉNÉRATION INTELLIGENTE : Nombres qui permettent d'atteindre le target
  const generateRandomNumber = useCallback(() => {
    const difficultyTier = Math.floor((stats.level - 1) / 10) + 1
    
    console.log(`🎲 Génération INTELLIGENTE - Niveau: ${stats.level}, Opérateur: ${config.operator}, Target: ${target}`)
    
    // 🎯 LOGIQUE INTELLIGENTE par opérateur
    switch (config.operator) {
      case 'ADD':
        return generateNumberForAddition(target, difficultyTier)
      
      case 'SUB':
        return generateNumberForSubtraction(target, difficultyTier)
      
      case 'MUL':
        return generateNumberForMultiplication(target, difficultyTier)
      
      case 'DIV':
        return generateNumberForDivision(target, difficultyTier)
      
      case 'MIXED':
        // Pour MIXED, on génère des nombres qui peuvent servir à plusieurs opérations
        return generateNumberForMixed(target, difficultyTier)
      
      default:
        return Math.floor(Math.random() * 10) + 1
    }
  }, [stats.level, target, config.operator])


  // ➕ Génération pour ADDITION
  const generateNumberForAddition = (target: number, tier: number): number => {
    if (tier === 1) {
      // Facile: nombres 1-20, max = target-1
      const maxValue = Math.min(20, Math.max(1, target - 1))
      return Math.floor(Math.random() * maxValue) + 1
    } else if (tier === 2) {
      // Moyen: nombres 1-50, max = target-1
      const maxValue = Math.min(50, Math.max(1, target - 1))
      return Math.floor(Math.random() * maxValue) + 1
    } else {
      // Difficile: nombres 1-200, max = target-1
      const maxValue = Math.min(200, Math.max(1, target - 1))
      return Math.floor(Math.random() * maxValue) + 1
    }
  }

  // ➖ Génération pour SOUSTRACTION
  const generateNumberForSubtraction = (target: number, tier: number): number => {
    if (tier === 1) {
      // Facile: nombres 1-20, doit permettre |a-b| = target
      return Math.floor(Math.random() * 20) + 1
    } else if (tier === 2) {
      // Moyen: nombres 1-50
      return Math.floor(Math.random() * 50) + 1
    } else {
      // Difficile: nombres 1-200
      return Math.floor(Math.random() * 200) + 1
    }
  }

  // ✖️ Génération pour MULTIPLICATION
  const generateNumberForMultiplication = (target: number, tier: number): number => {
    // 🎯 CRUCIAL: Générer des facteurs qui peuvent faire le target
    const factors = getFactors(target)
    
    if (factors.length === 0) {
      // Target premier, générer des nombres qui peuvent s'additionner pour l'atteindre
      return generateNumberForAddition(target, tier)
    }
    
    // Choisir un facteur aléatoire
    const randomFactor = factors[Math.floor(Math.random() * factors.length)]
    
    // Ajuster selon le tier
    if (tier === 1 && randomFactor > 20) {
      return Math.floor(Math.random() * 20) + 1
    } else if (tier === 2 && randomFactor > 50) {
      return Math.floor(Math.random() * 50) + 1
    } else if (tier >= 3 && randomFactor > 200) {
      return Math.floor(Math.random() * 200) + 1
    }
    
    return randomFactor
  }

  // ➗ Génération pour DIVISION
  const generateNumberForDivision = (target: number, tier: number): number => {
    // 🎯 CRUCIAL: Générer des nombres qui peuvent diviser pour donner le target
    // Si target = 15, on peut avoir 30/2, 45/3, 60/4, etc.
    const possibleDivisors = []
    
    for (let i = 1; i <= 20; i++) {
      const dividend = target * i
      if (tier === 1 && dividend <= 100) possibleDivisors.push(i)
      else if (tier === 2 && dividend <= 500) possibleDivisors.push(i)
      else if (tier >= 3 && dividend <= 2000) possibleDivisors.push(i)
    }
    
    if (possibleDivisors.length > 0) {
      return possibleDivisors[Math.floor(Math.random() * possibleDivisors.length)]
    }
    
    // Fallback: nombre aléatoire dans la plage du tier
    if (tier === 1) return Math.floor(Math.random() * 20) + 1
    else if (tier === 2) return Math.floor(Math.random() * 50) + 1
    else return Math.floor(Math.random() * 200) + 1
  }

  // 🔀 Génération pour MIXED
  const generateNumberForMixed = (target: number, tier: number): number => {
    // Pour MIXED, on génère des nombres polyvalents
    const operations = ['ADD', 'MUL'] // Focus sur les plus courantes
    const randomOp = operations[Math.floor(Math.random() * operations.length)]
    
    if (randomOp === 'ADD') {
      return generateNumberForAddition(target, tier)
    } else {
      return generateNumberForMultiplication(target, tier)
    }
  }

  
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
  

  // 🎲 Générer des nombres aléatoires pour la grille selon le niveau
  const generateRandomGridNumbers = useCallback((tier: number, totalCells: number): number[] => {
    const numbers: number[] = []
    const numbersToGenerate = Math.floor(totalCells * 0.7) // 70% de la grille
    
    console.log(`🎲 Génération ${numbersToGenerate} nombres pour tier ${tier}`)
    
    for (let i = 0; i < numbersToGenerate; i++) {
      let randomNumber: number
      
      if (tier === 1) {
        // 🟢 FACILE: Principalement 1-10, quelques 11-15
        if (Math.random() < 0.8) {
          randomNumber = Math.floor(Math.random() * 10) + 1 // 80% chance: 1-10
        } else {
          randomNumber = Math.floor(Math.random() * 5) + 11 // 20% chance: 11-15
        }
      } else if (tier === 2) {
        // 🟡 MOYEN: Mélange 1-20 et 21-40
        if (Math.random() < 0.6) {
          randomNumber = Math.floor(Math.random() * 20) + 1 // 60% chance: 1-20
        } else {
          randomNumber = Math.floor(Math.random() * 20) + 21 // 40% chance: 21-40
        }
      } else {
        // 🔴 DIFFICILE: Principalement 20-100, quelques 101-200
        if (Math.random() < 0.7) {
          randomNumber = Math.floor(Math.random() * 81) + 20 // 70% chance: 20-100
        } else {
          randomNumber = Math.floor(Math.random() * 100) + 101 // 30% chance: 101-200
        }
      }
      
      numbers.push(randomNumber)
    }
    
    console.log(`🎲 Nombres générés (Tier ${tier}): [${numbers.join(', ')}]`)
    return numbers
  }, [])
  

  
  // 🎯 CALCULER LA PRÉCISION AVANCÉE avec tracking détaillé
  const calculateAdvancedAccuracy = useCallback((currentAccuracy: number, isCorrect: boolean, consecutiveErrors: number) => {
    // Précision de base
    let newAccuracy = currentAccuracy
    
    if (isCorrect) {
      // Bonus pour réussite après erreurs
      if (consecutiveErrors > 0) {
        const recoveryBonus = Math.min(consecutiveErrors * 2, 10) // Max +10% pour récupération
        newAccuracy = Math.min(newAccuracy + recoveryBonus, 100)
        console.log(`🔄 Bonus récupération: +${recoveryBonus}% après ${consecutiveErrors} erreurs`)
      }
    } else {
      // Pénalité pour erreur
      const errorPenalty = Math.min(5 + (consecutiveErrors * 2), 15) // Max -15% pour erreurs répétées
      newAccuracy = Math.max(newAccuracy - errorPenalty, 0)
      console.log(`❌ Pénalité erreur: -${errorPenalty}% (erreurs consécutives: ${consecutiveErrors})`)
    }
    
    return Math.round(newAccuracy)
  }, [])

  // 🎯 CALCULER LES POINTS AVEC PRÉCISION ET ÉVOLUTION
  const calculateAdvancedPoints = useCallback((cells: Cell[], isCorrect: boolean, moveTimeMs?: number) => {
    if (!isCorrect) return 0
    
    const values = cells.map(cell => cell.value!).filter(v => v !== null)
    const numCells = cells.length
    const combo = stats.combo
    const level = stats.level
    const age = userAge
    const currentAccuracy = stats.accuracy
    
    // Points de base
    let basePoints = numCells * 10
    
    // 🎯 BONUS DE PRÉCISION (nouveau!)
    let accuracyBonus = 1.0
    if (currentAccuracy >= 95) {
      accuracyBonus = 1.5 // Précision excellente
    } else if (currentAccuracy >= 85) {
      accuracyBonus = 1.3 // Précision très bonne
    } else if (currentAccuracy >= 75) {
      accuracyBonus = 1.1 // Précision bonne
    } else if (currentAccuracy < 50) {
      accuracyBonus = 0.7 // Précision faible = pénalité
    }
    
    // 🚀 BONUS DE VITESSE (nouveau!)
    let speedBonus = 1.0
    if (moveTimeMs !== undefined) {
      if (moveTimeMs < 1000) {
        speedBonus = 2.0 // Ultra rapide (< 1s)
      } else if (moveTimeMs < 2000) {
        speedBonus = 1.5 // Rapide (< 2s)
      } else if (moveTimeMs < 3000) {
        speedBonus = 1.2 // Moyen (< 3s)
      } else if (moveTimeMs < 5000) {
        speedBonus = 1.0 // Normal (< 5s)
      } else {
        speedBonus = 0.8 // Lent (> 5s)
      }
    }
    
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
    
    // 🎯 BONUS DE COMPLEXITÉ PAR OPÉRATION (révisé)
    let complexityBonus = 1
    switch (config.operator) {
      case 'ADD':
        complexityBonus = 1.0 // Addition la plus simple
        break
      case 'SUB':
        complexityBonus = 1.2 // Soustraction un peu plus difficile
        break
      case 'MUL':
        complexityBonus = 1.5 // Multiplication plus difficile
        break
      case 'DIV':
        complexityBonus = 2.0 // Division la plus difficile (résultats entiers)
        break
      case 'MIXED':
        complexityBonus = 1.8 // Mixte difficile mais pas autant que division
        break
      default:
        complexityBonus = 1.0
    }
    
    console.log(`🎯 Bonus complexité ${config.operator}: x${complexityBonus}`)
    
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
    
    // Calcul des multiplicateurs totaux
    const totalMultiplier = 
      comboMultiplier * 
      levelMultiplier * 
      difficultyBonus * 
      complexityBonus * 
      ageHandicap * 
      targetDifficultyBonus *
      speedBonus * // 🚀 Bonus de vitesse ajouté
      accuracyBonus // 🎯 Bonus de précision ajouté
    
    // 🎯 CAP DE BONUS : Limiter à 2.5x le basePoints maximum
    const MAX_BONUS_MULTIPLIER = 2.5
    const cappedMultiplier = Math.min(totalMultiplier, MAX_BONUS_MULTIPLIER)
    
    // Calcul final avec cap appliqué
    const finalPoints = Math.round(basePoints * cappedMultiplier)
    
    // Indicateur si le cap a été atteint
    const wasCapped = totalMultiplier > MAX_BONUS_MULTIPLIER
    
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
      speedBonus: speedBonus.toFixed(2),
      accuracyBonus: accuracyBonus.toFixed(2),
      totalMultiplier: totalMultiplier.toFixed(2),
      cappedMultiplier: cappedMultiplier.toFixed(2),
      wasCapped: wasCapped ? '⚠️ OUI (cap 2.5x appliqué)' : 'Non',
      finalPoints,
      moveTimeMs: moveTimeMs ? `${moveTimeMs}ms` : 'N/A',
      currentAccuracy: `${currentAccuracy}%`
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
  
  // Vérifier si une solution existe (avec décompositions longues)
  const checkSolution = useCallback((cells: Cell[]): boolean => {
    if (cells.length < 2) return false
    
    const values = cells.map(cell => cell.value!).filter(v => v !== null)
    if (values.length < 2) return false
    
    console.log(`🔍 Vérification solution avec ${values.length} nombres: [${values.join(', ')}] pour target ${target}`)
    
    switch (config.operator) {
      case 'ADD':
        // Addition: somme de tous les nombres
        const sum = values.reduce((s, v) => s + v, 0)
        const isAddValid = sum === target
        console.log(`➕ Addition: ${values.join(' + ')} = ${sum} (${isAddValid ? 'VALID' : 'INVALID'})`)
        return isAddValid
        
      case 'SUB':
        // Soustraction: seulement 2 nombres pour soustraction
        if (values.length !== 2) return false
        const diff = Math.abs(values[0] - values[1])
        const isSubValid = diff === target
        console.log(`➖ Soustraction: |${values[0]} - ${values[1]}| = ${diff} (${isSubValid ? 'VALID' : 'INVALID'})`)
        return isSubValid
        
      case 'MUL':
        // Multiplication: produit de tous les nombres
        const product = values.reduce((p, v) => p * v, 1)
        const isMulValid = product === target && Number.isInteger(product)
        console.log(`✖️ Multiplication: ${values.join(' × ')} = ${product} (${isMulValid ? 'VALID' : 'INVALID'})`)
        return isMulValid
        
      case 'DIV':
        // Division: seulement 2 nombres pour division
        if (values.length !== 2) return false
        
        // Éviter la division par zéro
        if (values[1] === 0 || values[0] === 0) return false
        
        const div1 = values[0] / values[1]
        const div2 = values[1] / values[0]
        
        // Vérifier que le résultat est un entier ET égal au target
        const isValidDiv1 = Number.isInteger(div1) && div1 === target && div1 > 0
        const isValidDiv2 = Number.isInteger(div2) && div2 === target && div2 > 0
        
        console.log(`➗ Division: ${values[0]} ÷ ${values[1]} = ${div1} (${isValidDiv1 ? 'VALID' : 'INVALID'})`)
        console.log(`➗ Division: ${values[1]} ÷ ${values[0]} = ${div2} (${isValidDiv2 ? 'VALID' : 'INVALID'})`)
        
        return isValidDiv1 || isValidDiv2
        
      case 'MIXED':
        // Mixte: essayer toutes les opérations possibles
        const mixedSum = values.reduce((s, v) => s + v, 0)
        const mixedDiff = values.length === 2 ? Math.abs(values[0] - values[1]) : 0
        const mixedProd = values.reduce((p, v) => p * v, 1)
        
        // Division seulement si elle donne un entier
        let mixedDiv = 0
        if (values.length === 2) {
          const div1 = values[0] / values[1]
          const div2 = values[1] / values[0]
          if (Number.isInteger(div1) && div1 > 0) mixedDiv = div1
          else if (Number.isInteger(div2) && div2 > 0) mixedDiv = div2
        }
        
        const isMixedValid = mixedSum === target || mixedDiff === target || mixedProd === target || mixedDiv === target
        
        console.log(`🔀 Mixte:`)
        console.log(`  ➕ Addition: ${values.join(' + ')} = ${mixedSum} (${mixedSum === target ? 'VALID' : 'INVALID'})`)
        if (values.length === 2) {
          console.log(`  ➖ Soustraction: |${values[0]} - ${values[1]}| = ${mixedDiff} (${mixedDiff === target ? 'VALID' : 'INVALID'})`)
          console.log(`  ➗ Division: ${mixedDiv} (${mixedDiv === target ? 'VALID' : 'INVALID'})`)
        }
        console.log(`  ✖️ Multiplication: ${values.join(' × ')} = ${mixedProd} (${mixedProd === target ? 'VALID' : 'INVALID'})`)
        console.log(`🔀 Résultat mixte: ${isMixedValid ? 'VALID' : 'INVALID'}`)
        
        return isMixedValid
        
      default:
        return false
    }
  }, [config.operator, target])
  
  // Soumettre une solution - Optimisé
  const handleSubmit = useCallback((cells: Cell[] = selectedCells) => {
    if (gameState !== 'playing') return
    
    // 🕐 Calculer le temps de mouvement
    const moveStartTime = cells.length > 0 ? Math.min(...cells.map(c => c.bornAt)) : Date.now()
    const moveTimeMs = Date.now() - moveStartTime
    
    const isCorrectSolution = checkSolution(cells)
    
    if (isCorrectSolution) {
      // 🎯 NOUVEAU SYSTÈME - Utiliser le modèle de scoring adaptatif
      let points: number
      const isLongDecomposition = cells.length >= 3
      
      if (scoringModelRef.current) {
        points = scoringModelRef.current.points({
          level: stats.level,
          difficulty: currentDifficulty,
          timeSinceRoundStartMs: moveTimeMs,
          currentCombo: stats.combo,
          accuracy: stats.accuracy,
          isLongDecomposition
        })
      } else {
        // Fallback au système existant
        points = calculateAdvancedPoints(cells, true, moveTimeMs)
      }
      
      // 🚀 GAIN DE TEMPS pour actions rapides
      let timeBonus = 0
      if (moveTimeMs < 2000) {
        timeBonus = 3 // +3 secondes pour actions < 2s
      } else if (moveTimeMs < 3000) {
        timeBonus = 2 // +2 secondes pour actions < 3s
      } else if (moveTimeMs < 5000) {
        timeBonus = 1 // +1 seconde pour actions < 5s
      }
      
      if (timeBonus > 0) {
        console.log(`🚀 Bonus de temps: +${timeBonus}s pour action rapide (${moveTimeMs}ms)`)
      }
      
      // 🎯 RÉINITIALISER les erreurs consécutives après succès
      setConsecutiveErrors(0)
      
      // 🎯 NOUVEAU SYSTÈME - Enregistrer le round dans le collecteur de métriques
      console.log('🎯 Enregistrement round réussi dans MetricsCollector:', !!metricsCollectorRef.current)
      if (metricsCollectorRef.current) {
        const selectedValues = cells.map(c => c.value!).filter(v => v !== null)
        metricsCollectorRef.current.endRound({
          wasSuccess: true,
          selectedNumbers: selectedValues,
          pointsEarned: points,
          combo: stats.combo + 1,
          accuracy: stats.accuracy
        })
        console.log('✅ Round enregistré:', selectedValues, '→', points, 'points')
        
        // Mettre à jour niveau et combo dans le collecteur
        metricsCollectorRef.current.updateLevelAndCombo(stats.level, stats.combo + 1)
      } else {
        console.warn('⚠️ MetricsCollector non disponible pour endRound (succès)')
      }
      
      // Batch les mises à jour de stats pour éviter les re-renders multiples
      setStats(prev => {
        const newSuccessfulMoves = prev.successfulMoves + 1
        const newTotalMoves = prev.totalMoves + 1
        const newCombo = prev.combo + 1
        const newScore = prev.score + points
        const newLevel = Math.floor(newScore / 1000) + 1
        
        // 🎯 CALCULER LA NOUVELLE PRÉCISION AVANCÉE
        const newAccuracy = calculateAdvancedAccuracy(prev.accuracy, true, consecutiveErrors)
        
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
        
        // 🎯 NOUVEAU SYSTÈME - Mettre à jour la difficulté adaptative
        if (difficultyModelRef.current) {
          const newDifficulty = difficultyModelRef.current.update({
            prev: currentDifficulty,
            level: newLevel,
            age: userAge || 6,
            wasSuccess: true,
            accuracyWindow: newAccuracy / 100,
            consecutiveErrors: 0
          })
          setCurrentDifficulty(newDifficulty)
          console.log(`📊 Difficulté mise à jour: ${currentDifficulty.toFixed(2)} → ${newDifficulty.toFixed(2)}`)
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
          accuracy: newAccuracy, // 🎯 Utiliser la précision avancée
          timeLeft: Math.min(prev.timeLeft + timeBonus, config.unlimitedTime ? 999999 : config.timeLimit) // 🚀 Ajouter le bonus de temps
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
      
      // 🎯 RECALCULER LE TARGET DYNAMIQUEMENT après chaque coup réussi
      requestAnimationFrame(() => {
        console.log('🔄 Recalcul dynamique du target après coup réussi...')
        updateTargetFromCurrentGrid()
      })
      
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
      // Solution incorrecte - Gestion avancée des erreurs
      const newConsecutiveErrors = consecutiveErrors + 1
      setConsecutiveErrors(newConsecutiveErrors)
      
      console.log(`❌ Erreur détectée! Erreurs consécutives: ${newConsecutiveErrors}`)
      
      // 🎯 NOUVEAU SYSTÈME - Enregistrer l'erreur dans le collecteur de métriques
      if (metricsCollectorRef.current) {
        const selectedValues = cells.map(c => c.value!).filter(v => v !== null)
        metricsCollectorRef.current.endRound({
          wasSuccess: false,
          selectedNumbers: selectedValues,
          pointsEarned: 0,
          combo: 0,
          accuracy: stats.accuracy
        })
      }
      
      // 🎯 BAISSER SEULEMENT LA PRÉCISION (pas de vies ni temps)
      setStats(prev => {
        const newTotalMoves = prev.totalMoves + 1
        
        // 🎯 CALCULER LA NOUVELLE PRÉCISION AVANCÉE avec pénalité
        const newAccuracy = calculateAdvancedAccuracy(prev.accuracy, false, newConsecutiveErrors)
        
        // 🎯 NOUVEAU SYSTÈME - Mettre à jour la difficulté adaptative (avec échec)
        if (difficultyModelRef.current) {
          const newDifficulty = difficultyModelRef.current.update({
            prev: currentDifficulty,
            level: prev.level,
            age: userAge || 6,
            wasSuccess: false,
            accuracyWindow: newAccuracy / 100,
            consecutiveErrors: newConsecutiveErrors
          })
          setCurrentDifficulty(newDifficulty)
          console.log(`📊 Difficulté ajustée après erreur: ${currentDifficulty.toFixed(2)} → ${newDifficulty.toFixed(2)}`)
        }
        
        return {
          ...prev,
          combo: 0, // Reset combo seulement
          totalMoves: newTotalMoves,
          accuracy: newAccuracy
          // PAS de modification des lives ni timeLeft
        }
      })
      
      // Jouer son d'erreur (non-bloquant)
      if (config.soundEnabled) {
        // TODO: Ajouter son d'erreur
      }
    }
    
    // Nettoyer la sélection
    setSelectedCells([])
  }, [gameState, selectedCells, checkSolution, calculateAdvancedPoints, config.soundEnabled, initializeGridWithNumbers, isTutorialMode, tutorialStep])
  
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
        
        // 🎯 NOUVEAU SYSTÈME DE VALIDATION AVEC TIMER
        if (newSelection.length === 1) {
          // Premier clic - démarrer une nouvelle série
          console.log('🎯 Premier clic - Démarrage d\'une nouvelle série de calculs')
          startNewSeries()
          return newSelection
        }
        
        if (newSelection.length >= 2) {
          // Vérifier si c'est une solution valide
          const isCorrect = checkSolution(newSelection)
          const values = newSelection.map(c => c.value!).filter(v => v !== null)
          
          if (isCorrect) {
            console.log(`✅ Solution correcte détectée: [${values.join(', ')}]`)
            
            // Arrêter le timer et valider
            if (currentSeries.timerId) {
              clearTimeout(currentSeries.timerId)
              setTimeRemaining(0) // Arrêter le timer visuel
            }
            
            // Enregistrer la tentative correcte dans le collecteur
            if (seriesCollectorRef.current) {
              const responseTime = Date.now() - currentSeries.startTime
              const isLongDecomposition = values.length >= 3
              
              seriesCollectorRef.current.recordAttempt(
                values,
                target,
                config.operator,
                true,
                responseTime,
                'correct',
                isLongDecomposition
              )
            }
            
            // Mettre à jour la série
            setCurrentSeries(prev => ({
              ...prev,
              attempts: prev.attempts + 1,
              correct: prev.correct + 1,
              timerId: null
            }))
            
            // Calculer la précision de la série
            const seriesAccuracy = ((currentSeries.correct + 1) / (currentSeries.attempts + 1)) * 100
            
            // Mettre à jour les stats avec la précision de la série
            setStats(prev => ({
              ...prev,
              accuracy: seriesAccuracy,
              totalMoves: prev.totalMoves + 1,
              successfulMoves: prev.successfulMoves + 1
            }))
            
            // Valider la solution
            setTimeout(() => handleSubmit(newSelection), 100)
          } else {
            // Solution incorrecte
            console.log(`❌ Solution incorrecte: [${values.join(', ')}]`)
            
            // Enregistrer la tentative incorrecte dans le collecteur
            if (seriesCollectorRef.current) {
              const responseTime = Date.now() - currentSeries.startTime
              const isLongDecomposition = values.length >= 3
              
              seriesCollectorRef.current.recordAttempt(
                values,
                target,
                config.operator,
                false,
                responseTime,
                'incorrect',
                isLongDecomposition
              )
            }
            
            // Mettre à jour la série
            setCurrentSeries(prev => ({
              ...prev,
              attempts: prev.attempts + 1
            }))
            
            // Calculer la nouvelle précision de la série
            const newSeriesAccuracy = (currentSeries.correct / (currentSeries.attempts + 1)) * 100
            
            // Mettre à jour les stats
            setStats(prev => ({
              ...prev,
              accuracy: newSeriesAccuracy,
              totalMoves: prev.totalMoves + 1
            }))
            
            // Nettoyer la sélection après l'erreur
            setTimeout(() => {
              setSelectedCells([])
            }, 500)
          }
        }
        
        return newSelection
      }
    })
  }, [gameState, checkSolution, handleSubmit, startNewSeries, currentSeries])
  
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
    const randomSuffix = Math.random().toString(36).substr(2, 9) // Ajout d'un ID unique
    
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: `particle-${timestamp}-${randomSuffix}-${i}`, // ID garantit unique
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
    
    // Initialiser le collecteur de séries
    const sessionId = `cubematch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    seriesCollectorRef.current = new SeriesCollector(sessionId)
    console.log('🎯 Collecteur de séries initialisé:', sessionId)
    
    // 🎯 NOUVEAU SYSTÈME - Initialiser les modèles adaptatifs
    const age = userAge || 6
    console.log('🎯 Initialisation MetricsCollector avec sessionId:', sessionId, 'age:', age)
    metricsCollectorRef.current = new MetricsCollector(sessionId, age, 1.0)
    difficultyModelRef.current = AdaptiveModelsFactory.createDifficultyModel(age)
    scoringModelRef.current = AdaptiveModelsFactory.createScoringModel(age)
    timerModelRef.current = AdaptiveModelsFactory.createTimerModel(age)
    setCurrentDifficulty(1.0)
    console.log('✅ Modèles adaptatifs initialisés:', {
      metricsCollector: !!metricsCollectorRef.current,
      difficultyModel: !!difficultyModelRef.current,
      scoringModel: !!scoringModelRef.current,
      timerModel: !!timerModelRef.current
    })
    
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
    
    console.log('🏗️ Initialisation de la grille avec NOUVELLE LOGIQUE...')
    // La nouvelle logique génère la grille ET le target en même temps
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
  }, [config, initializeGridWithNumbers, spawnNumbers])
  
  // Terminer le jeu
  const endGame = useCallback(async () => {
    setGameState('gameOver')
    
    // Nettoyer les timers
    if (timeTimerRef.current) clearInterval(timeTimerRef.current)
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current)
    
    // Calculer le temps joué
    const timePlayedMs = gameStartTime > 0 ? Date.now() - gameStartTime : 0
    
    // 🛡️ Protection: ne sauvegarder que si le jeu a vraiment été joué
    if (gameStartTime === 0) {
      console.warn('⚠️ Jeu non démarré correctement - pas de sauvegarde')
      return
    }

    if (stats.totalMoves === 0) {
      console.warn('⚠️ Aucun mouvement enregistré — sauvegarde quand même pour diagnostic')
    }
    
    // Sauvegarder le score
    try {
      // Calculer le temps moyen par move
      const averageMoveTimeMs = stats.totalMoves > 0 
        ? Math.round(timePlayedMs / stats.totalMoves) 
        : 0
      
      // 🎯 NOUVEAU SYSTÈME - Récupérer les métriques du collecteur
      let bubixMetrics: any = null
      let sessionMetrics: any = null
      
      console.log('🔍 Vérification metricsCollectorRef:', !!metricsCollectorRef.current)
      
      if (metricsCollectorRef.current) {
        try {
          console.log('📊 Finalisation des métriques de session...')
          sessionMetrics = metricsCollectorRef.current.finalizeSession(stats.score)
          console.log('✅ SessionMetrics finalisées:', {
            totalRounds: sessionMetrics.totalRounds,
            accuracy: sessionMetrics.accuracy,
            finalDifficulty: sessionMetrics.finalDifficulty
          })
          
          console.log('🧠 Génération des métriques BubiX...')
          bubixMetrics = metricsCollectorRef.current.generateBubiXMetrics()
          console.log('✅ BubiXMetrics générées:', {
            flowScore: bubixMetrics.flowScore,
            engagementScore: bubixMetrics.engagementScore,
            cognitivePatterns: bubixMetrics.cognitivePatterns
          })
        } catch (error) {
          console.error('❌ Erreur collecte métriques:', error)
        }
      } else {
        console.warn('⚠️ MetricsCollector non initialisé!')
      }
      
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
        averageMoveTimeMs: averageMoveTimeMs,
        soundEnabled: config.soundEnabled,
        hintsEnabled: config.hintsEnabled,
        // 🎯 NOUVELLES MÉTRIQUES du système modulaire
        initialDifficulty: 1.0,
        finalDifficulty: currentDifficulty,
        averageDifficulty: sessionMetrics?.averageDifficulty || currentDifficulty,
        difficultyProgression: sessionMetrics?.difficultyProgression || [],
        flowScore: bubixMetrics?.flowScore || 0,
        engagementScore: bubixMetrics?.engagementScore || 0,
        cognitiveProfile: bubixMetrics?.cognitivePatterns || {},
        operatorDistribution: sessionMetrics?.operatorDistribution || {},
        operatorAccuracy: sessionMetrics?.operatorAccuracy || {},
        bubixMetrics: bubixMetrics || {},
        recommendations: bubixMetrics?.recommendations || {},
        consecutiveErrors: consecutiveErrors,
        longDecompositionsCount: sessionMetrics?.longDecompositionsCount || 0
      }
      
      console.log('💾 Tentative de sauvegarde score:', scoreData)
      console.log('📊 SessionMetrics:', sessionMetrics)
      console.log('🧠 BubiXMetrics:', bubixMetrics)
      
      // Sauvegarder le score principal (service centralisé façon Bubix)
      const saveResult = await cubeMatchService.saveScore(scoreData)
      console.log('✅ Score sauvegardé avec succès, ID:', saveResult)
      
      // 🎯 Récupérer l'ID du score créé
      const scoreId = saveResult?.scoreId
      
      // Envoyer les données de séries détaillées (si le score a été créé)
      if (seriesCollectorRef.current && scoreId) {
        try {
          console.log('📊 Envoi des séries avec scoreId:', scoreId)
          const seriesResult = await seriesCollectorRef.current.saveSession({
            scoreId: scoreId, // 🎯 CORRECTION: Passer le scoreId pour éviter double insertion
            score: stats.score,
            level: stats.level,
            operator: config.operator,
            target: target,
            difficulty: config.difficulty,
            gridSize: config.gridSize,
            allowDiagonals: config.allowDiagonals,
            totalMoves: stats.totalMoves,
            successfulMoves: stats.successfulMoves,
            failedMoves: stats.totalMoves - stats.successfulMoves,
            accuracyRate: stats.accuracy,
            comboMax: stats.bestCombo,
            cellsCleared: stats.cellsCleared,
            hintsUsed: stats.hintsUsed,
            consecutiveErrors: consecutiveErrors,
            longDecompositionsCount: sessionMetrics?.longDecompositionsCount || 0,
            autoValidationEnabled: true
          })
          
          if (seriesResult.success) {
            console.log('✅ Données de séries enregistrées avec succès:', seriesResult.scoreId)
          } else {
            console.warn('⚠️ Erreur enregistrement séries:', seriesResult.message)
          }
        } catch (error) {
          console.error('❌ Erreur envoi données séries:', error)
        }
      }
      
      // Callback pour le parent
      if (onScoreSubmit) {
        onScoreSubmit(stats.score)
      }
      
    } catch (error) {
      console.error('❌ Erreur sauvegarde score:', error)
      
      // 🎯 CORRECTION: Afficher un message d'erreur à l'utilisateur
      alert('⚠️ Impossible de sauvegarder le score. Vérifie que le backend CubeMatch est accessible (BACKEND_URL).')
    }
  }, [gameStartTime, stats, config, target, onScoreSubmit, consecutiveErrors, currentDifficulty, userAge])
  
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
                        onClick={() => handleConfigChange({ ...config, difficulty: diff })}
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
                        onClick={() => handleConfigChange({ ...config, operator: op })}
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
                    onChange={(e) => handleConfigChange({ ...config, gridSize: parseInt(e.target.value) })}
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
                    onChange={(e) => handleConfigChange({ ...config, unlimitedTime: !e.target.checked })}
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
                      onChange={(e) => handleConfigChange({ ...config, timeLimit: parseInt(e.target.value) })}
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
                  onChange={(e) => handleConfigChange({ ...config, spawnRate: parseInt(e.target.value) })}
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
                    onChange={(e) => handleConfigChange({ ...config, soundEnabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                  <span className="text-xs text-gray-700 font-medium">Indices activés</span>
                  <input
                    type="checkbox"
                    checked={config.hintsEnabled}
                    onChange={(e) => handleConfigChange({ ...config, hintsEnabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                  <span className="text-xs text-gray-700 font-medium">Diagonales autorisées</span>
                  <input
                    type="checkbox"
                    checked={config.allowDiagonals}
                    onChange={(e) => handleConfigChange({ ...config, allowDiagonals: e.target.checked })}
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
                    onClick={() => handleConfigChange({ ...config, theme })}
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
            
            {/* Card Précision avec Timer */}
            <div className="bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 border-2 border-green-500 rounded-2xl px-4 py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="text-xl text-white font-bold flex items-center gap-2 mb-1">
                <Star className="w-4 h-4" />
                Précision
              </div>
              <div className="text-xl font-black text-white drop-shadow-lg">{stats.accuracy}%</div>
              <div className={`text-lg font-semibold ${consecutiveErrors > 0 ? 'text-red-100' : 'text-green-100'}`}>
                Erreurs: {consecutiveErrors}
              </div>
              {/* Timer et série en cours */}
              {currentSeries.timerId && (
                <div className="mt-2 pt-2 border-t border-green-300">
                  <div className="text-sm text-green-100">
                    Série: {currentSeries.correct}/{currentSeries.attempts}
                  </div>
                  <div className={`text-xs font-bold ${timeRemaining <= 2 ? 'text-red-200 animate-pulse' : 'text-green-200'}`}>
                    Timer: {timeRemaining.toFixed(1)}s
                  </div>
                </div>
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
                <div className={`inline-flex items-center gap-3 bg-gradient-to-r ${currentTheme.primary} text-white px-4 py-11 rounded-2xl shadow-lg transform -translate-x-32 mt-16 -ml-16`}>
                  <Target className="w-8 h-8" />
                  <span className="text-xl font-bold text-white">Trouve ({target}) avec une</span>
                  <span className="text-xl font-bold text-white">
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
      {/* 🔍 Bouton de debug (visible seulement en développement) */}
      {process.env.NODE_ENV === 'development' && gameState === 'playing' && (
        <button
          onClick={debugGridState}
          className="fixed bottom-4 right-4 "
        >
          
        </button>
      )}
      
      {gameState === 'menu' && renderMenu()}
      {gameState === 'settings' && renderSettings()}
      {gameState === 'playing' && renderGame()}
      {gameState === 'paused' && renderPaused()}
      {gameState === 'gameOver' && renderGameOver()}
    </div>
  )
}
