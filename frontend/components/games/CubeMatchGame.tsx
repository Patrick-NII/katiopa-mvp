'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { cubeMatchScoresAPI, type CubeMatchScore } from '@/lib/api/cubematch-scores'
import { cubeMatchSettingsAPI, type CubeMatchSettings } from '@/lib/api/cubematch-settings'
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
  ChevronRight
} from 'lucide-react'

// Types
interface GameConfig {
  gridSize: number
  operator: 'ADD' | 'SUB' | 'MUL' | 'DIV' | 'MIXED'
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  timeLimit: number
  unlimitedTime: boolean
  allowDiagonals: boolean
  soundEnabled: boolean
  hintsEnabled: boolean
  autoSubmit: boolean
  spawnRate: number
  maxNumbers: number
  infiniteCubes: boolean
  cleanCubes: boolean
}

interface GameStats {
  score: number
  level: number
  timeLeft: number
  combo: number
  bestCombo: number
  cellsCleared: number
  hintsUsed: number
  accuracy: number
  precision: number
  totalMoves: number
  successfulMoves: number
  timePlayedMs: number
}

interface Cell {
  value: number
  id: string
  row: number
  col: number
  isSelected: boolean
  isHighlighted: boolean
}

export default function CubeMatchGame() {
  // États du jeu
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameOver' | 'settings'>('menu')
  const [gameBoard, setGameBoard] = useState<Cell[][]>([])
  const [selectedCells, setSelectedCells] = useState<Cell[]>([])
  const [target, setTarget] = useState(10)
  const [isGameRunning, setIsGameRunning] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [hintCells, setHintCells] = useState<Cell[]>([])
  const [animations, setAnimations] = useState<Array<{type: string, x: number, y: number, id: string}>>([])
  const [confetti, setConfetti] = useState(false)
  
  // Configuration du jeu
  const [config, setConfig] = useState<GameConfig>({
    gridSize: 6,
    operator: 'ADD',
    difficulty: 'MEDIUM',
    timeLimit: 60,
    unlimitedTime: false,
    allowDiagonals: false,
    soundEnabled: true,
    hintsEnabled: true,
    autoSubmit: false,
    spawnRate: 2000,
    maxNumbers: 9,
    infiniteCubes: false,
    cleanCubes: false
  })

  // Statistiques du jeu
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    level: 1,
    timeLeft: 60,
    combo: 0,
    bestCombo: 0,
    cellsCleared: 0,
    hintsUsed: 0,
    accuracy: 100,
    precision: 100,
    totalMoves: 0,
    successfulMoves: 0,
    timePlayedMs: 0
  })

  // Refs
  const gameIntervalRef = useRef<NodeJS.Timeout>()
  const spawnIntervalRef = useRef<NodeJS.Timeout>()
  const audioRef = useRef<HTMLAudioElement>()
  const gameStartTimeRef = useRef<number>(0)
  const autoSaveRef = useRef<(() => void) | null>(null)
  
  // État de chargement et récupération
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [hasRecoveredGame, setHasRecoveredGame] = useState(false)

  // Sons du jeu améliorés
  const playSound = useCallback((sound: 'click' | 'success' | 'error' | 'levelup' | 'gameover' | 'validation' | 'combo') => {
    if (!config.soundEnabled) return
    
    const sounds = {
      click: '/sounds/click.mp3',
      success: '/sounds/success.mp3',
      error: '/sounds/error.mp3',
      levelup: '/sounds/levelup.mp3',
      gameover: '/sounds/gameover.mp3',
      validation: '/sounds/validation.mp3',
      combo: '/sounds/combo.mp3'
    }
    
    try {
      const audio = new Audio(sounds[sound])
      audio.volume = 0.4
      audio.play().catch(() => {}) // Ignore les erreurs de lecture
    } catch (error) {
      // Ignore les erreurs de son
    }
  }, [config.soundEnabled])

  // Fonctions d'animation
  const addAnimation = useCallback((type: string, x: number, y: number) => {
    const id = Math.random().toString(36).substr(2, 9)
    setAnimations(prev => [...prev, { type, x, y, id }])
    
    // Supprimer l'animation après 2 secondes
    setTimeout(() => {
      setAnimations(prev => prev.filter(anim => anim.id !== id))
    }, 2000)
  }, [])

  const triggerConfetti = useCallback(() => {
    setConfetti(true)
    setTimeout(() => setConfetti(false), 3000)
  }, [])

  // Fonction pour obtenir la couleur des cellules selon leur valeur
  const getCellColor = useCallback((value: number) => {
    if (value <= 2) return 'bg-gradient-to-br from-green-300 to-green-400 text-green-900 hover:from-green-400 hover:to-green-500'
    if (value <= 4) return 'bg-gradient-to-br from-blue-300 to-blue-400 text-blue-900 hover:from-blue-400 hover:to-blue-500'
    if (value <= 6) return 'bg-gradient-to-br from-purple-300 to-purple-400 text-purple-900 hover:from-purple-400 hover:to-purple-500'
    if (value <= 8) return 'bg-gradient-to-br from-orange-300 to-orange-400 text-orange-900 hover:from-orange-400 hover:to-orange-500'
    return 'bg-gradient-to-br from-red-300 to-red-400 text-red-900 hover:from-red-400 hover:to-red-500'
  }, [])

  // Initialiser le plateau de jeu
  const initializeGameBoard = useCallback(() => {
    const board: Cell[][] = []
    for (let i = 0; i < config.gridSize; i++) {
      const row: Cell[] = []
      for (let j = 0; j < config.gridSize; j++) {
        row.push({
          value: Math.floor(Math.random() * config.maxNumbers) + 1,
          id: `${i}-${j}`,
          row: i,
          col: j,
          isSelected: false,
          isHighlighted: false
        })
      }
      board.push(row)
    }
    setGameBoard(board)
    generateNewTarget()
  }, [config.gridSize, config.maxNumbers])

  // Générer une nouvelle cible
  const generateNewTarget = useCallback(() => {
    const minTarget = config.difficulty === 'EASY' ? 5 : config.difficulty === 'MEDIUM' ? 10 : 15
    const maxTarget = config.difficulty === 'EASY' ? 20 : config.difficulty === 'MEDIUM' ? 40 : 60
    setTarget(Math.floor(Math.random() * (maxTarget - minTarget + 1)) + minTarget)
  }, [config.difficulty])

  // Calculer le résultat selon l'opérateur
  const calculateResult = useCallback((cells: Cell[]) => {
    if (cells.length < 2) return 0
    
    const values = cells.map(cell => cell.value)
    
    switch (config.operator) {
      case 'ADD':
        return values.reduce((sum, val) => sum + val, 0)
      case 'SUB':
        return Math.abs(values.reduce((diff, val) => diff - val))
      case 'MUL':
        return values.reduce((prod, val) => prod * val, 1)
      case 'DIV':
        const sorted = values.sort((a, b) => b - a)
        return Math.floor(sorted[0] / sorted[1])
      case 'MIXED':
        // Opération aléatoire
        const ops = ['ADD', 'SUB', 'MUL', 'DIV']
        const randomOp = ops[Math.floor(Math.random() * ops.length)]
        // Appliquer l'opération aléatoire
        switch (randomOp) {
          case 'ADD': return values.reduce((sum, val) => sum + val, 0)
          case 'SUB': return Math.abs(values.reduce((diff, val) => diff - val))
          case 'MUL': return values.reduce((prod, val) => prod * val, 1)
          case 'DIV': return Math.floor(values[0] / values[1])
          default: return values.reduce((sum, val) => sum + val, 0)
        }
      default:
        return values.reduce((sum, val) => sum + val, 0)
    }
  }, [config.operator])

  // Vérifier si les cellules sont adjacentes
  const areAdjacent = useCallback((cell1: Cell, cell2: Cell) => {
    const rowDiff = Math.abs(cell1.row - cell2.row)
    const colDiff = Math.abs(cell1.col - cell2.col)
    
    if (config.allowDiagonals) {
      return rowDiff <= 1 && colDiff <= 1 && (rowDiff + colDiff) > 0
    } else {
      return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)
    }
  }, [config.allowDiagonals])

  // Gérer le clic sur une cellule
  const handleCellClick = useCallback((cell: Cell) => {
    if (gameState !== 'playing') return
    
    playSound('click')
    
    setGameBoard(prev => prev.map(row => 
      row.map(c => c.id === cell.id ? { ...c, isSelected: !c.isSelected } : c)
    ))
    
    setSelectedCells(prev => {
      const isSelected = prev.some(c => c.id === cell.id)
      if (isSelected) {
        return prev.filter(c => c.id !== cell.id)
      } else {
        // Vérifier l'adjacence
        if (prev.length === 0 || prev.some(c => areAdjacent(c, cell))) {
          return [...prev, { ...cell, isSelected: true }]
        }
        return prev
      }
    })
  }, [gameState, playSound, areAdjacent])

  // Soumettre la sélection avec animations et sons améliorés
  const submitSelection = useCallback(() => {
    if (selectedCells.length < 2) return
    
    playSound('validation')
    
    const result = calculateResult(selectedCells)
    const isCorrect = result === target
    
    setStats(prev => ({
      ...prev,
      totalMoves: prev.totalMoves + 1,
      successfulMoves: isCorrect ? prev.successfulMoves + 1 : prev.successfulMoves,
      accuracy: Math.round((prev.successfulMoves + (isCorrect ? 1 : 0)) / (prev.totalMoves + 1) * 100),
      precision: Math.round((prev.successfulMoves + (isCorrect ? 1 : 0)) / (prev.totalMoves + 1) * 100)
    }))
    
    if (isCorrect) {
      // Calculer le score avec bonus pour temps illimité
      let baseScore = selectedCells.length * 10
      let comboBonus = stats.combo * 5
      let timeBonus = config.unlimitedTime ? 0 : Math.max(0, stats.timeLeft * 2)
      
      // Réduire les bonus en mode temps illimité
      if (config.unlimitedTime) {
        baseScore = Math.floor(baseScore * 0.7)
        comboBonus = Math.floor(comboBonus * 0.5)
      }
      
      const totalScore = baseScore + comboBonus + timeBonus
      
      setStats(prev => ({
        ...prev,
        score: prev.score + totalScore,
        combo: prev.combo + 1,
        bestCombo: Math.max(prev.bestCombo, prev.combo + 1),
        cellsCleared: prev.cellsCleared + selectedCells.length
      }))
      
      // Sons et animations de succès
      playSound('success')
      if (stats.combo > 0) {
        playSound('combo')
        addAnimation('combo', 50, 50)
      }
      addAnimation('success', 50, 50)
      
      // Confettis pour les niveaux
      if (stats.combo > 0 && stats.combo % 5 === 0) {
        triggerConfetti()
        playSound('levelup')
      }
      
      // Effacer les cellules sélectionnées
      setGameBoard(prev => prev.map(row => 
        row.map(cell => 
          selectedCells.some(sc => sc.id === cell.id) 
            ? { 
                ...cell, 
                value: config.infiniteCubes ? cell.value : (config.cleanCubes ? 0 : Math.floor(Math.random() * config.maxNumbers) + 1), 
                isSelected: false 
              }
            : cell
        )
      ))
      
      setSelectedCells([])
      generateNewTarget()
      
      // Vérifier le niveau suivant
      if (stats.score + totalScore > stats.level * 100) {
        setStats(prev => ({
          ...prev,
          level: prev.level + 1,
          timeLeft: config.unlimitedTime ? prev.timeLeft : Math.min(prev.timeLeft + 10, 120)
        }))
        triggerConfetti()
        playSound('levelup')
      }
    } else {
      // Son et animation d'erreur
      playSound('error')
      addAnimation('error', 50, 50)
      
      setStats(prev => ({
        ...prev,
        combo: 0
      }))
      
      setSelectedCells([])
      setGameBoard(prev => prev.map(row => 
        row.map(cell => ({ ...cell, isSelected: false }))
      ))
    }
  }, [selectedCells, target, calculateResult, stats, config.unlimitedTime, config.maxNumbers, playSound, addAnimation, triggerConfetti, generateNewTarget])

  // Utiliser un indice
  const useHint = useCallback(() => {
    if (!config.hintsEnabled || stats.hintsUsed >= 3) return
    
    // Trouver une combinaison possible
    const possibleCombinations: Cell[][] = []
    
    for (let i = 0; i < config.gridSize; i++) {
      for (let j = 0; j < config.gridSize; j++) {
        const cell = gameBoard[i][j]
        if (cell.value === 0) continue
        
        const combinations = findCombinations(cell, [cell])
        possibleCombinations.push(...combinations)
      }
    }
    
    if (possibleCombinations.length > 0) {
      const randomCombination = possibleCombinations[Math.floor(Math.random() * possibleCombinations.length)]
      setHintCells(randomCombination)
      setShowHint(true)
      
      setStats(prev => ({
        ...prev,
        hintsUsed: prev.hintsUsed + 1
      }))
      
      // Masquer l'indice après 3 secondes
      setTimeout(() => {
        setShowHint(false)
        setHintCells([])
      }, 3000)
    }
  }, [config.hintsEnabled, stats.hintsUsed, gameBoard, config.gridSize])

  // Trouver les combinaisons possibles
  const findCombinations = useCallback((startCell: Cell, currentPath: Cell[]): Cell[][] => {
    const combinations: Cell[][] = []
    
    if (currentPath.length >= 2) {
      const result = calculateResult(currentPath)
      if (result === target) {
        combinations.push([...currentPath])
      }
    }
    
    if (currentPath.length >= 4) return combinations // Limiter la profondeur
    
    // Chercher les cellules adjacentes
    for (let i = 0; i < config.gridSize; i++) {
      for (let j = 0; j < config.gridSize; j++) {
        const cell = gameBoard[i][j]
        if (cell.value === 0 || currentPath.some(c => c.id === cell.id)) continue
        
        if (areAdjacent(startCell, cell)) {
          const newPath = [...currentPath, cell]
          combinations.push(...findCombinations(cell, newPath))
        }
      }
    }
    
    return combinations
  }, [calculateResult, target, config.gridSize, gameBoard, areAdjacent])

  // Démarrer le jeu
  const startGame = useCallback(() => {
    gameStartTimeRef.current = Date.now() // Capturer le temps de début
    setGameState('playing')
    setIsGameRunning(true)
    setStats(prev => ({
      ...prev,
      score: 0,
      level: 1,
      timeLeft: config.unlimitedTime ? 999 : config.timeLimit,
      combo: 0,
      cellsCleared: 0,
      hintsUsed: 0,
      totalMoves: 0,
      successfulMoves: 0,
      accuracy: 100,
      timePlayedMs: 0
    }))
    initializeGameBoard()
  }, [config.timeLimit, config.unlimitedTime, initializeGameBoard])

  // Pause/Reprendre
  const togglePause = useCallback(() => {
    if (gameState === 'playing') {
      setIsGameRunning(false)
      setGameState('paused')
    } else if (gameState === 'paused') {
      setIsGameRunning(true)
      setGameState('playing')
    }
  }, [gameState])

  // Réinitialiser le jeu
  const resetGame = useCallback(() => {
    setIsGameRunning(false)
    setGameState('menu')
    setSelectedCells([])
    setShowHint(false)
    setHintCells([])
  }, [])

  // Timer du jeu
  useEffect(() => {
    if (isGameRunning && !config.unlimitedTime && stats.timeLeft > 0) {
      gameIntervalRef.current = setInterval(() => {
        setStats(prev => {
          if (prev.timeLeft <= 1) {
            setIsGameRunning(false)
            setGameState('gameOver')
            playSound('gameover')
            return { ...prev, timeLeft: 0 }
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 }
        })
      }, 1000)
    }
    
    return () => {
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current)
      }
    }
  }, [isGameRunning, stats.timeLeft, config.unlimitedTime, playSound])

  // Auto-submit si activé
  useEffect(() => {
    if (config.autoSubmit && selectedCells.length >= 2) {
      const result = calculateResult(selectedCells)
      if (result === target) {
        setTimeout(() => {
          submitSelection()
        }, 500)
      }
    }
  }, [selectedCells, config.autoSubmit, calculateResult, target, submitSelection])

  // 🍎 SYSTÈME MAGIQUE DE CHARGEMENT INITIAL (Style Apple)
  useEffect(() => {
    const initializeGame = async () => {
      console.log('🍎 Initialisation magique CubeMatch...')
      setIsLoadingSettings(true)
      
      try {
        // Charger les paramètres utilisateur personnalisés
        const response = await cubeMatchSettingsAPI.loadSettings()
        
        if (response.success) {
          console.log('✨ Paramètres personnalisés chargés:', response.settings)
          setConfig(response.settings)
          
          // Récupérer une session de jeu interrompue ?
          if (response.settings.currentGameState?.isPlaying) {
            const recovered = response.settings.currentGameState
            console.log('🔄 Session de jeu détectée ! Récupération...')
            
            // Proposer la récupération à l'enfant
            const shouldRecover = window.confirm(
              `🎮 Hey ! Tu as une partie en cours avec ${recovered.score} points au niveau ${recovered.level}.\n\n✨ Veux-tu continuer où tu t'étais arrêté ?`
            )
            
            if (shouldRecover) {
              setStats(prev => ({
                ...prev,
                score: recovered.score,
                level: recovered.level,
                timeLeft: recovered.timeLeft,
                ...recovered.stats
              }))
              
              setTarget(recovered.target)
              if (recovered.gameBoard) {
                setGameBoard(recovered.gameBoard)
              }
              
              setGameState('playing')
              setIsGameRunning(true)
              setHasRecoveredGame(true)
              gameStartTimeRef.current = Date.now() - (recovered.stats?.timePlayedMs || 0)
              
              console.log('🎉 Session récupérée avec succès !')
            } else {
              // Nettoyer la session refusée
              await cubeMatchSettingsAPI.clearGameState()
            }
          }
        }
      } catch (error) {
        console.log('💾 Utilisation des paramètres par défaut')
      } finally {
        setIsLoadingSettings(false)
      }
    }
    
    initializeGame()
  }, [])

  // 🔄 Auto-sauvegarde magique en continu
  useEffect(() => {
    if (gameState === 'playing' && !autoSaveRef.current) {
      console.log('🔄 Démarrage de l\'auto-sauvegarde...')
      
      autoSaveRef.current = cubeMatchSettingsAPI.startAutoSave(() => ({
        isPlaying: gameState === 'playing',
        score: stats.score,
        level: stats.level,
        timeLeft: stats.timeLeft,
        target: target,
        gameBoard: gameBoard,
        stats: stats
      }), 8000) // Sauvegarde toutes les 8 secondes
    }
    
    if (gameState !== 'playing' && autoSaveRef.current) {
      autoSaveRef.current()
      autoSaveRef.current = null
    }
    
    return () => {
      if (autoSaveRef.current) {
        autoSaveRef.current()
        autoSaveRef.current = null
      }
    }
  }, [gameState, stats, target, gameBoard])

  // 💾 Sauvegarde des paramètres à chaque modification
  useEffect(() => {
    if (!isLoadingSettings) {
      console.log('💾 Auto-sauvegarde des paramètres...')
      cubeMatchSettingsAPI.saveSettings(config).catch(() => {
        // Silent fail pour ne pas perturber l'expérience
      })
    }
  }, [config, isLoadingSettings])

  // 🏆 Sauvegarde des scores et nettoyage de session
  useEffect(() => {
    if (gameState === 'gameOver') {
      // Sauvegarde locale
      const bestScore = localStorage.getItem('cubematch-best-score')
      if (!bestScore || stats.score > parseInt(bestScore)) {
        localStorage.setItem('cubematch-best-score', stats.score.toString())
      }

      // Nettoyer l'état de jeu sauvegardé (partie terminée)
      cubeMatchSettingsAPI.clearGameState().catch(() => {
        // Silent fail
      })

      // Sauvegarde vers l'API backend (uniquement si l'utilisateur est authentifié)
      const saveScoreToBackend = async () => {
        try {
          // Vérifier d'abord l'authentification
          console.log('🔐 Vérification de l\'authentification avant sauvegarde...');
          
          const authResponse = await fetch('/api/auth/status');
          const authData = await authResponse.json();
          
          if (!authData.authenticated) {
            console.log('⚠️ Utilisateur non authentifié - score non sauvegardé');
            console.log('💡 Pour sauvegarder vos scores, veuillez vous connecter');
            return;
          }
          
          console.log(`👤 Utilisateur authentifié: ${authData.user.firstName || authData.user.username}`);
          
          // Calculer le temps joué
          const timePlayedMs = gameStartTimeRef.current > 0 ? Date.now() - gameStartTimeRef.current : 0;
          
          console.log('💾 Sauvegarde du score pour utilisateur authentifié:', { ...stats, timePlayedMs });
          
          const scoreData: CubeMatchScore = {
            score: stats.score,
            level: stats.level,
            timePlayedMs: timePlayedMs,
            operator: config.operator,
            target: target,
            allowDiagonals: config.allowDiagonals,
            gridSize: config.gridSize,
            difficulty: config.difficulty,
            hintsUsed: stats.hintsUsed || 0,
            gameDurationSeconds: Math.floor(timePlayedMs / 1000),
            // Nouvelles données statistiques
            comboMax: stats.bestCombo || 0,
            cellsCleared: stats.cellsCleared || 0,
            totalMoves: stats.totalMoves || 0,
            successfulMoves: stats.successfulMoves || 0,
            accuracy: stats.accuracy || 100,
            precision: stats.precision || 100,
            soundEnabled: config.soundEnabled || true,
            hintsEnabled: config.hintsEnabled || true
          };

          await cubeMatchScoresAPI.saveScore(scoreData);
          console.log('✅ Score sauvegardé avec succès en base de données');
        } catch (error) {
          console.error('❌ Erreur lors de la sauvegarde du score:', error);
          
          if (error.message?.includes('AUTH_REQUIRED') || error.message?.includes('401')) {
            console.log('🔑 Authentification requise pour sauvegarder le score');
          }
        }
      };

      saveScoreToBackend();
    }
  }, [gameState, stats.score, stats.level, stats.timePlayedMs, stats.hintsUsed, config, target])

  // 🌟 Écran de chargement magique style Apple/Disney
  if (isLoadingSettings) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          {/* Logo CubeMatch animé */}
          <motion.div
            animate={{ 
              rotateY: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-xl"
          >
            <span className="text-3xl font-bold text-white">🧮</span>
          </motion.div>
          
          {/* Texte de chargement enfantin */}
          <motion.h2
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-2xl font-bold text-gray-700 mb-2"
          >
            ✨ Préparation de ta partie magique...
          </motion.h2>
          
          <p className="text-gray-500 text-lg">
            {hasRecoveredGame ? '🔄 Récupération de ta session...' : '🎮 Chargement de tes paramètres...'}
          </p>
          
          {/* Barre de progression style iOS */}
          <div className="w-48 h-2 bg-gray-200 rounded-full mt-6 mx-auto overflow-hidden">
            <motion.div
              animate={{ x: [-100, 200] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-20 h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
            />
          </div>
        </motion.div>
      </div>
    )
  }

  // Rendu du menu principal
  if (gameState === 'menu') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="mb-8">
            <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">CubeMatch</h1>
            <p className="text-gray-600">Le jeu de calcul le plus amusant !</p>
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Configuration actuelle</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Grille: {config.gridSize}x{config.gridSize}</div>
                <div>Opération: {config.operator}</div>
                <div>Difficulté: {config.difficulty}</div>
                <div>Temps: {config.timeLimit}s</div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={startGame}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Commencer le jeu
            </button>
            
            <button
              onClick={() => setGameState('settings')}
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <Settings className="w-5 h-5" />
              Paramètres
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Rendu des paramètres
  if (gameState === 'settings') {
    return (
      <div className="h-full flex items-center justify-center p-4 bg-gradient-to-br from-purple-100 via-blue-50 to-cyan-100">
        {/* Container centré avec largeur maximale pour éviter l'étirement */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* En-tête coloré et ludique */}
          <div className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Settings className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Paramètres du Jeu</h2>
                  <p className="text-blue-100 text-sm">Personnalise ton expérience CubeMatch !</p>
                </div>
              </div>
              <button
                onClick={() => setGameState('menu')}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200 group"
              >
                <X className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
          
          {/* Contenu des paramètres avec scroll */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Colonne 1 - Paramètres de base */}
              <div className="space-y-4">
                
                {/* Taille de grille */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-5 border border-orange-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-orange-800">Taille de la Grille</h3>
                      <p className="text-orange-600 text-sm">Plus c'est grand, plus c'est difficile !</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => setConfig(prev => ({ ...prev, gridSize: Math.max(4, prev.gridSize - 1) }))}
                      className="w-12 h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-xl flex items-center justify-center transition-all duration-200 transform hover:scale-105"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <div className="bg-white rounded-xl px-6 py-3 shadow-md">
                      <span className="text-2xl font-bold text-orange-800">{config.gridSize}×{config.gridSize}</span>
                    </div>
                    <button
                      onClick={() => setConfig(prev => ({ ...prev, gridSize: Math.min(14, prev.gridSize + 1) }))}
                      className="w-12 h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-xl flex items-center justify-center transition-all duration-200 transform hover:scale-105"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {/* Opérations */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-blue-800">Opération Mathématique</h3>
                      <p className="text-blue-600 text-sm">Quel calcul veux-tu faire ?</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'ADD', symbol: '+', name: 'Addition', color: 'from-green-400 to-green-500' },
                      { key: 'SUB', symbol: '−', name: 'Soustraction', color: 'from-red-400 to-red-500' },
                      { key: 'MUL', symbol: '×', name: 'Multiplication', color: 'from-purple-400 to-purple-500' },
                      { key: 'DIV', symbol: '÷', name: 'Division', color: 'from-yellow-400 to-yellow-500' },
                      { key: 'MIXED', symbol: (
                        <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M5 3v4h-.5c-.83 0-1.5.67-1.5 1.5v4c0 .83.67 1.5 1.5 1.5H5v4h4v-4h.5c.83 0 1.5-.67 1.5-1.5v-4c0-.83-.67-1.5-1.5-1.5H9V3H5zm10 0v4h-.5c-.83 0-1.5.67-1.5 1.5v4c0 .83.67 1.5 1.5 1.5h.5v4h4v-4h.5c.83 0 1.5-.67 1.5-1.5v-4c0-.83-.67-1.5-1.5-1.5H19V3h-4z"/>
                        </svg>
                      ), name: 'Mixte', color: 'from-pink-400 to-pink-500' }
                    ].map(op => (
                      <button
                        key={op.key}
                        onClick={() => setConfig(prev => ({ ...prev, operator: op.key as any }))}
                        className={`p-3 rounded-xl text-center transition-all duration-200 transform hover:scale-105 ${
                          config.operator === op.key
                            ? `bg-gradient-to-r ${op.color} text-white shadow-lg scale-105`
                            : 'bg-white hover:bg-gray-50 text-gray-700 shadow-md'
                        }`}
                      >
                        <div className="text-2xl mb-1">{typeof op.symbol === 'string' ? op.symbol : op.symbol}</div>
                        <div className="text-xs font-medium">{op.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Difficulté */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-green-800">Niveau de Difficulté</h3>
                      <p className="text-green-600 text-sm">À quel point es-tu fort ?</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'EASY', name: 'Facile', icon: (
                        <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      ), color: 'from-green-400 to-green-500' },
                      { key: 'MEDIUM', name: 'Moyen', icon: (
                        <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
                        </svg>
                      ), color: 'from-yellow-400 to-orange-500' },
                      { key: 'HARD', name: 'Difficile', icon: (
                        <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      ), color: 'from-red-400 to-red-500' }
                    ].map(diff => (
                      <button
                        key={diff.key}
                        onClick={() => setConfig(prev => ({ ...prev, difficulty: diff.key as any }))}
                        className={`p-3 rounded-xl text-center transition-all duration-200 transform hover:scale-105 ${
                          config.difficulty === diff.key
                            ? `bg-gradient-to-r ${diff.color} text-white shadow-lg scale-105`
                            : 'bg-white hover:bg-gray-50 text-gray-700 shadow-md'
                        }`}
                      >
                        <div className="mb-1">{diff.icon}</div>
                        <div className="text-xs font-medium">{diff.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Colonne 2 - Paramètres avancés */}
              <div className="space-y-4">
                
                {/* Temps */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12,1A11,11 0 0,0 1,12A11,11 0 0,0 12,23A11,11 0 0,0 23,12A11,11 0 0,0 12,1M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-purple-800">Gestion du Temps</h3>
                      <p className="text-purple-600 text-sm">Veux-tu jouer contre la montre ?</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <button
                      onClick={() => setConfig(prev => ({ ...prev, unlimitedTime: !prev.unlimitedTime }))}
                      className={`w-full p-3 rounded-xl text-center transition-all duration-200 transform hover:scale-105 ${
                        config.unlimitedTime
                          ? 'bg-gradient-to-r from-green-400 to-green-500 text-white shadow-lg'
                          : 'bg-white hover:bg-gray-50 text-gray-700 shadow-md'
                      }`}
                    >
                      <div className="mb-1">
                        <svg className="w-8 h-8 mx-auto text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.6 6.62c-1.44 0-2.8.56-3.77 1.53L12 10.66 8.17 8.15c-.97-.97-2.33-1.53-3.77-1.53C1.95 6.62 0 8.57 0 11.02s1.95 4.4 4.4 4.4c1.44 0 2.8-.56 3.77-1.53L12 11.38l3.83 2.51c.97.97 2.33 1.53 3.77 1.53 2.45 0 4.4-1.95 4.4-4.4s-1.95-4.4-4.4-4.4z"/>
                        </svg>
                      </div>
                      <div className="text-sm font-medium">Temps Illimité</div>
                    </button>
                    
                    {!config.unlimitedTime && (
                      <div className="bg-white rounded-xl p-4 shadow-md">
                        <div className="flex items-center justify-center gap-4">
                          <button
                            onClick={() => setConfig(prev => ({ ...prev, timeLimit: Math.max(30, prev.timeLimit - 15) }))}
                            className="w-10 h-10 bg-purple-500 hover:bg-purple-600 text-white rounded-lg flex items-center justify-center transition-all duration-200 transform hover:scale-105"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-800">{config.timeLimit}</div>
                            <div className="text-xs text-purple-600">secondes</div>
                          </div>
                          <button
                            onClick={() => setConfig(prev => ({ ...prev, timeLimit: Math.min(300, prev.timeLimit + 15) }))}
                            className="w-10 h-10 bg-purple-500 hover:bg-purple-600 text-white rounded-lg flex items-center justify-center transition-all duration-200 transform hover:scale-105"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Options ludiques */}
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-5 border border-cyan-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5.5 2c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2H7v-2H5.5V4H7V2H5.5zm13 0H17v2h1.5v16H17v2h1.5c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM12 7.5c2.5 0 4.5 2 4.5 4.5s-2 4.5-4.5 4.5S7.5 14.5 7.5 12 9.5 7.5 12 7.5z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-cyan-800">Options de Jeu</h3>
                      <p className="text-cyan-600 text-sm">Personnalise ton expérience !</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'allowDiagonals', label: 'Diagonales', icon: (
                        <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M1.5 3.5L20.5 22.5 22 21l-19-19L1.5 3.5zm17.83 9.83L22 10.66 20.66 9.33l-2.33 2.33 1 1zM12 6c3.31 0 6 2.69 6 6 0 1.31-.42 2.53-1.14 3.52l1.42 1.42C19.33 15.56 20 13.84 20 12c0-4.42-3.58-8-8-8-1.84 0-3.56.67-4.94 1.72l1.42 1.42C9.47 6.42 10.69 6 12 6z"/>
                        </svg>
                      ), enabled: config.allowDiagonals },
                      { key: 'soundEnabled', label: 'Sons', icon: (
                        <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                        </svg>
                      ), enabled: config.soundEnabled },
                      { key: 'hintsEnabled', label: 'Indices', icon: (
                        <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z"/>
                        </svg>
                      ), enabled: config.hintsEnabled },
                      { key: 'autoSubmit', label: 'Auto-valider', icon: (
                        <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z"/>
                        </svg>
                      ), enabled: config.autoSubmit }
                    ].map(option => (
                      <button
                        key={option.key}
                        onClick={() => setConfig(prev => ({ ...prev, [option.key]: !prev[option.key as keyof GameConfig] }))}
                        className={`p-3 rounded-xl text-center transition-all duration-200 transform hover:scale-105 ${
                          option.enabled
                            ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-white shadow-lg'
                            : 'bg-white hover:bg-gray-50 text-gray-700 shadow-md'
                        }`}
                      >
                        <div className="mb-1">{option.icon}</div>
                        <div className="text-xs font-medium">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Modes de jeu spéciaux */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-5 border border-yellow-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-yellow-800">Modes Spéciaux</h3>
                      <p className="text-yellow-600 text-sm">Des défis uniques !</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <button
                      onClick={() => setConfig(prev => ({ ...prev, infiniteCubes: !prev.infiniteCubes }))}
                      className={`w-full p-3 rounded-xl text-left transition-all duration-200 transform hover:scale-105 ${
                        config.infiniteCubes
                          ? 'bg-gradient-to-r from-purple-400 to-purple-500 text-white shadow-lg'
                          : 'bg-white hover:bg-gray-50 text-gray-700 shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.6 6.62c-1.44 0-2.8.56-3.77 1.53L12 10.66 8.17 8.15c-.97-.97-2.33-1.53-3.77-1.53C1.95 6.62 0 8.57 0 11.02s1.95 4.4 4.4 4.4c1.44 0 2.8-.56 3.77-1.53L12 11.38l3.83 2.51c.97.97 2.33 1.53 3.77 1.53 2.45 0 4.4-1.95 4.4-4.4s-1.95-4.4-4.4-4.4z"/>
                        </svg>
                        <div>
                          <div className="font-medium">Cubes Infinis</div>
                          <div className="text-xs opacity-75">Les cubes gardent leur valeur</div>
                        </div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setConfig(prev => ({ ...prev, cleanCubes: !prev.cleanCubes }))}
                      className={`w-full p-3 rounded-xl text-left transition-all duration-200 transform hover:scale-105 ${
                        config.cleanCubes
                          ? 'bg-gradient-to-r from-green-400 to-green-500 text-white shadow-lg'
                          : 'bg-white hover:bg-gray-50 text-gray-700 shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19.36 2.72L20.78 4.14l-1.06 1.06c.4.4.62.95.62 1.52V9h1a1 1 0 0 1 1 1v3c0 .55-.45 1-1 1h-1v2.28c0 .57-.22 1.12-.62 1.52L20.78 19.86 19.36 21.28 18 19.92l-1.41-1.41L5.51 7.43 4.1 6.02 5.51 4.6l1.42 1.42L8.34 7.43 19.36 2.72z"/>
                        </svg>
                        <div>
                          <div className="font-medium">Cubes Nettoyés</div>
                          <div className="text-xs opacity-75">Les cubes deviennent vides</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bouton de sauvegarde centré */}
            <div className="flex justify-center pt-6">
              <button
                onClick={() => setGameState('menu')}
                className="px-12 py-4 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 text-white rounded-2xl font-bold text-lg hover:from-green-600 hover:via-blue-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105 shadow-xl flex items-center gap-3"
              >
                <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Sauvegarder et Jouer !
                <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 2h16c1.1 0 2 .9 2 2v16c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm8 3l-6 8h4v4h4v-4h4l-6-8z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Rendu du jeu en pause
  if (gameState === 'paused') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Pause className="w-16 h-16 mx-auto mb-4 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Jeu en pause</h2>
          <p className="text-gray-600 mb-6">Score actuel: {stats.score}</p>
          
          <div className="space-y-3">
            <button
              onClick={togglePause}
              className="w-full bg-green-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Reprendre
            </button>
            
            <button
              onClick={resetGame}
              className="w-full bg-gray-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Recommencer
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Rendu de fin de jeu
  if (gameState === 'gameOver') {
    const bestScore = localStorage.getItem('cubematch-best-score')
    const isNewRecord = bestScore ? stats.score > parseInt(bestScore) : true
    
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Fin de partie !</h2>
          
          {isNewRecord && (
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 mb-4">
              <Star className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
              <p className="text-yellow-800 font-semibold">Nouveau record !</p>
            </div>
          )}
          
          <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Statistiques</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-600">Score final</div>
                <div className="font-semibold text-lg">{stats.score}</div>
              </div>
              <div>
                <div className="text-gray-600">Niveau atteint</div>
                <div className="font-semibold text-lg">{stats.level}</div>
              </div>
              <div>
                <div className="text-gray-600">Meilleur combo</div>
                <div className="font-semibold text-lg">{stats.bestCombo}</div>
              </div>
              <div>
                <div className="text-gray-600">Précision</div>
                <div className="font-semibold text-lg">{stats.accuracy}%</div>
              </div>
              <div>
                <div className="text-gray-600">Cases nettoyées</div>
                <div className="font-semibold text-lg">{stats.cellsCleared}</div>
              </div>
              <div>
                <div className="text-gray-600">Indices utilisés</div>
                <div className="font-semibold text-lg">{stats.hintsUsed}</div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={startGame}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Rejouer
            </button>
            
            <button
              onClick={resetGame}
              className="w-full bg-gray-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Menu principal
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Rendu du jeu principal
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header avec statistiques */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-gray-900">CubeMatch</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={togglePause}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Pause"
            >
              <Pause className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => setGameState('settings')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Paramètres"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-center">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-xl font-bold text-blue-600">{stats.score.toLocaleString()}</div>
            <div className="text-xs text-gray-600 font-medium">Score</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-xl font-bold text-green-600">{target}</div>
            <div className="text-xs text-gray-600 font-medium">Cible</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-xl font-bold text-purple-600">{stats.level}</div>
            <div className="text-xs text-gray-600 font-medium">Niveau</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="text-xl font-bold text-orange-600">{config.unlimitedTime ? '∞' : stats.timeLeft}</div>
            <div className="text-xs text-gray-600 font-medium">Temps</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3">
            <div className="text-xl font-bold text-red-600">{stats.combo}</div>
            <div className="text-xs text-gray-600 font-medium">Combo</div>
          </div>
          <div className="bg-indigo-50 rounded-lg p-3">
            <div className="text-xl font-bold text-indigo-600">{stats.precision}%</div>
            <div className="text-xs text-gray-600 font-medium">Précision</div>
          </div>
        </div>
      </div>
      
      {/* Plateau de jeu */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0 overflow-hidden">
        {/* WRAPPER VERTICAL => grille au-dessus, boutons en dessous */}
        <div className="flex flex-col items-center gap-6 max-w-full">
          {/* Grille */}
          <div className="bg-white rounded-xl shadow-lg p-4 max-w-full max-h-full flex items-center justify-center">
            <div
              className="grid gap-1 max-w-full max-h-full"
              style={{
                gridTemplateColumns: `repeat(${config.gridSize}, minmax(60px, 1fr))`,
                gridTemplateRows: `repeat(${config.gridSize}, minmax(60px, 1fr))`,
                maxWidth: '100%',
                maxHeight: '100%',
              }}
            >
              {gameBoard.map((row) =>
                row.map((cell) => {
                  const isSelected = selectedCells.some((sc) => sc.id === cell.id)
                  const isHinted = showHint && hintCells.some((hc) => hc.id === cell.id)
                  const isEmpty = cell.value === 0

                  return (
                    <button
                      key={cell.id}
                      onClick={() => !isEmpty && handleCellClick(cell)}
                      disabled={isEmpty}
                      className={`
                        w-full h-full min-w-[60px] min-h-[60px] max-w-[80px] max-h-[80px]
                        rounded-xl font-bold text-lg md:text-xl lg:text-2xl transition-all duration-200
                        shadow-md flex items-center justify-center
                        ${
                          isEmpty
                            ? 'bg-gray-100 cursor-not-allowed'
                            : isSelected
                              ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-yellow-900 shadow-xl scale-105 border-4 border-yellow-600 ring-2 ring-yellow-300'
                              : isHinted
                                ? 'bg-gradient-to-br from-yellow-200 to-yellow-300 text-yellow-800 border-2 border-yellow-500 shadow-lg'
                                : getCellColor(cell.value)
                        }
                      `}
                    >
                      {isEmpty ? '' : cell.value}
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Boutons d'action (désormais SOUS la grille) */}
          <div className="flex items-center justify-center gap-4">
            {config.hintsEnabled && (
              <button
                onClick={useHint}
                disabled={stats.hintsUsed >= 3}
                className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-xl font-semibold hover:from-yellow-500 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                <HelpCircle className="w-5 h-5" />
                Indice ({Math.max(0, 3 - stats.hintsUsed)})
              </button>
            )}

            <button
              onClick={submitSelection}
              disabled={selectedCells.length < 2}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <Target className="w-5 h-5" />
              Valider ({selectedCells.length >= 2 ? calculateResult(selectedCells) : 0})
            </button>
          </div>
        </div>
      </div>
      
      {/* Instructions */}
      <div className="bg-white/90 backdrop-blur-sm border-t border-gray-200 p-4">
        <div className="text-center text-sm text-gray-600">
          <p>
            Sélectionnez des cases adjacentes pour atteindre la cible de <span className="font-semibold text-green-600">{target}</span>
          </p>
          <p className="mt-1">
            Opération: <span className="font-semibold text-blue-600">
              {config.operator === 'ADD' ? 'Addition' : 
               config.operator === 'SUB' ? 'Soustraction' :
               config.operator === 'MUL' ? 'Multiplication' :
               config.operator === 'DIV' ? 'Division' : 'Mixte'}
            </span>
            {config.allowDiagonals && ' • Diagonales autorisées'}
          </p>
        </div>
      </div>
      
      {/* Animations de succès */}
      {animations.map(anim => (
        <motion.div
          key={anim.id}
          initial={{ opacity: 1, scale: 0, x: anim.x, y: anim.y }}
          animate={{ 
            opacity: 0, 
            scale: 1.5, 
            x: anim.x + (Math.random() - 0.5) * 100,
            y: anim.y - 50
          }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="fixed pointer-events-none z-50"
        >
          {anim.type === 'success' && (
            <div className="text-green-500 text-2xl font-bold">✓</div>
          )}
          {anim.type === 'combo' && (
            <div className="text-yellow-500 text-xl font-bold">COMBO!</div>
          )}
          {anim.type === 'error' && (
            <div className="text-red-500 text-2xl font-bold">✗</div>
          )}
        </motion.div>
      ))}
      
      {/* Confettis */}
      {confetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                x: Math.random() * window.innerWidth,
                y: -10,
                rotate: 0,
                opacity: 1
              }}
              animate={{ 
                y: window.innerHeight + 10,
                rotate: 360,
                opacity: 0
              }}
              transition={{ 
                duration: 3,
                delay: Math.random() * 2,
                ease: "easeOut"
              }}
              className="absolute w-2 h-2"
              style={{
                backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'][Math.floor(Math.random() * 6)]
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
