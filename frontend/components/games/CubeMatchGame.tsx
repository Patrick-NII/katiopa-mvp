'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
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
  allowDiagonals: boolean
  soundEnabled: boolean
  hintsEnabled: boolean
  autoSubmit: boolean
  spawnRate: number
  maxNumbers: number
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
  totalMoves: number
  successfulMoves: number
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
  
  // Configuration du jeu
  const [config, setConfig] = useState<GameConfig>({
    gridSize: 6,
    operator: 'ADD',
    difficulty: 'MEDIUM',
    timeLimit: 60,
    allowDiagonals: false,
    soundEnabled: true,
    hintsEnabled: true,
    autoSubmit: false,
    spawnRate: 2000,
    maxNumbers: 9
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
    totalMoves: 0,
    successfulMoves: 0
  })

  // Refs
  const gameIntervalRef = useRef<NodeJS.Timeout>()
  const spawnIntervalRef = useRef<NodeJS.Timeout>()
  const audioRef = useRef<HTMLAudioElement>()

  // Sons du jeu
  const playSound = useCallback((sound: 'click' | 'success' | 'error' | 'levelup' | 'gameover') => {
    if (!config.soundEnabled) return
    
    const sounds = {
      click: '/sounds/click.mp3',
      success: '/sounds/success.mp3',
      error: '/sounds/error.mp3',
      levelup: '/sounds/levelup.mp3',
      gameover: '/sounds/gameover.mp3'
    }
    
    try {
      const audio = new Audio(sounds[sound])
      audio.volume = 0.3
      audio.play().catch(() => {}) // Ignore les erreurs de lecture
    } catch (error) {
      // Ignore les erreurs de son
    }
  }, [config.soundEnabled])

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

  // Soumettre la sélection
  const submitSelection = useCallback(() => {
    if (selectedCells.length < 2) return
    
    const result = calculateResult(selectedCells)
    const isCorrect = result === target
    
    setStats(prev => ({
      ...prev,
      totalMoves: prev.totalMoves + 1,
      successfulMoves: isCorrect ? prev.successfulMoves + 1 : prev.successfulMoves,
      accuracy: Math.round((prev.successfulMoves + (isCorrect ? 1 : 0)) / (prev.totalMoves + 1) * 100)
    }))
    
    if (isCorrect) {
      playSound('success')
      
      // Calculer les points
      const basePoints = selectedCells.length * 10
      const comboMultiplier = 1 + (stats.combo * 0.1)
      const points = Math.floor(basePoints * comboMultiplier)
      
      setStats(prev => ({
        ...prev,
        score: prev.score + points,
        combo: prev.combo + 1,
        bestCombo: Math.max(prev.bestCombo, prev.combo + 1),
        cellsCleared: prev.cellsCleared + selectedCells.length
      }))
      
      // Supprimer les cellules sélectionnées
      setGameBoard(prev => prev.map(row => 
        row.map(cell => 
          selectedCells.some(sc => sc.id === cell.id) 
            ? { ...cell, value: 0, isSelected: false }
            : cell
        )
      ))
      
      // Générer une nouvelle cible
      generateNewTarget()
      
      // Vérifier le niveau suivant
      if (stats.score + points > stats.level * 100) {
        setStats(prev => ({
          ...prev,
          level: prev.level + 1,
          timeLeft: Math.min(prev.timeLeft + 10, 120) // Bonus de temps
        }))
        playSound('levelup')
      }
    } else {
      playSound('error')
      setStats(prev => ({
        ...prev,
        combo: 0,
        score: Math.max(0, prev.score - 5)
      }))
    }
    
    // Réinitialiser la sélection
    setSelectedCells([])
    setGameBoard(prev => prev.map(row => 
      row.map(cell => ({ ...cell, isSelected: false }))
    ))
  }, [selectedCells, target, calculateResult, playSound, stats, generateNewTarget])

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
    setGameState('playing')
    setIsGameRunning(true)
    setStats(prev => ({
      ...prev,
      score: 0,
      level: 1,
      timeLeft: config.timeLimit,
      combo: 0,
      cellsCleared: 0,
      hintsUsed: 0,
      totalMoves: 0,
      successfulMoves: 0,
      accuracy: 100
    }))
    initializeGameBoard()
  }, [config.timeLimit, initializeGameBoard])

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
    if (isGameRunning && stats.timeLeft > 0) {
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
  }, [isGameRunning, stats.timeLeft, playSound])

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

  // Sauvegarder les meilleurs scores
  useEffect(() => {
    if (gameState === 'gameOver') {
      const bestScore = localStorage.getItem('cubematch-best-score')
      if (!bestScore || stats.score > parseInt(bestScore)) {
        localStorage.setItem('cubematch-best-score', stats.score.toString())
      }
    }
  }, [gameState, stats.score])

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
      <div className="h-full flex flex-col p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Paramètres</h2>
          <button
            onClick={() => setGameState('menu')}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-6 overflow-y-auto">
          {/* Taille de grille */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">Taille de grille</h3>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setConfig(prev => ({ ...prev, gridSize: Math.max(4, prev.gridSize - 1) }))}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-lg font-medium">{config.gridSize}x{config.gridSize}</span>
              <button
                onClick={() => setConfig(prev => ({ ...prev, gridSize: Math.min(8, prev.gridSize + 1) }))}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Opération */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">Opération</h3>
            <div className="grid grid-cols-2 gap-2">
              {['ADD', 'SUB', 'MUL', 'DIV', 'MIXED'].map(op => (
                <button
                  key={op}
                  onClick={() => setConfig(prev => ({ ...prev, operator: op as any }))}
                  className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                    config.operator === op
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {op === 'ADD' ? 'Addition' : 
                   op === 'SUB' ? 'Soustraction' :
                   op === 'MUL' ? 'Multiplication' :
                   op === 'DIV' ? 'Division' : 'Mixte'}
                </button>
              ))}
            </div>
          </div>
          
          {/* Difficulté */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">Difficulté</h3>
            <div className="space-y-2">
              {['EASY', 'MEDIUM', 'HARD'].map(diff => (
                <button
                  key={diff}
                  onClick={() => setConfig(prev => ({ ...prev, difficulty: diff as any }))}
                  className={`w-full p-2 rounded-lg text-sm font-medium transition-colors ${
                    config.difficulty === diff
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {diff === 'EASY' ? 'Facile' : 
                   diff === 'MEDIUM' ? 'Moyen' : 'Difficile'}
                </button>
              ))}
            </div>
          </div>
          
          {/* Temps limite */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">Temps limite</h3>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setConfig(prev => ({ ...prev, timeLimit: Math.max(30, prev.timeLimit - 15) }))}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-lg font-medium">{config.timeLimit}s</span>
              <button
                onClick={() => setConfig(prev => ({ ...prev, timeLimit: Math.min(180, prev.timeLimit + 15) }))}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Options avancées */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">Options</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Diagonales autorisées</span>
                <input
                  type="checkbox"
                  checked={config.allowDiagonals}
                  onChange={(e) => setConfig(prev => ({ ...prev, allowDiagonals: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>
              
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Sons activés</span>
                <input
                  type="checkbox"
                  checked={config.soundEnabled}
                  onChange={(e) => setConfig(prev => ({ ...prev, soundEnabled: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>
              
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Indices activés</span>
                <input
                  type="checkbox"
                  checked={config.hintsEnabled}
                  onChange={(e) => setConfig(prev => ({ ...prev, hintsEnabled: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>
              
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Soumission automatique</span>
                <input
                  type="checkbox"
                  checked={config.autoSubmit}
                  onChange={(e) => setConfig(prev => ({ ...prev, autoSubmit: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>
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
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-blue-50 rounded-lg p-2">
            <div className="text-lg font-bold text-blue-600">{stats.score}</div>
            <div className="text-xs text-gray-600">Score</div>
          </div>
          <div className="bg-green-50 rounded-lg p-2">
            <div className="text-lg font-bold text-green-600">{target}</div>
            <div className="text-xs text-gray-600">Cible</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-2">
            <div className="text-lg font-bold text-purple-600">{stats.level}</div>
            <div className="text-xs text-gray-600">Niveau</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-2">
            <div className="text-lg font-bold text-orange-600">{stats.timeLeft}</div>
            <div className="text-xs text-gray-600">Temps</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div>Combo: <span className="font-semibold text-blue-600">{stats.combo}</span></div>
            <div>Précision: <span className="font-semibold text-green-600">{stats.accuracy}%</span></div>
          </div>
          
          <div className="flex items-center gap-2">
            {config.hintsEnabled && (
              <button
                onClick={useHint}
                disabled={stats.hintsUsed >= 3}
                className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <HelpCircle className="w-4 h-4" />
                Indice ({3 - stats.hintsUsed})
              </button>
            )}
            
            <button
              onClick={submitSelection}
              disabled={selectedCells.length < 2}
              className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Valider ({calculateResult(selectedCells)})
            </button>
          </div>
        </div>
      </div>
      
      {/* Plateau de jeu */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div 
            className="grid gap-1"
            style={{ 
              gridTemplateColumns: `repeat(${config.gridSize}, 1fr)`,
              gridTemplateRows: `repeat(${config.gridSize}, 1fr)`
            }}
          >
            {gameBoard.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const isSelected = selectedCells.some(sc => sc.id === cell.id)
                const isHinted = showHint && hintCells.some(hc => hc.id === cell.id)
                const isEmpty = cell.value === 0
                
                return (
                  <button
                    key={cell.id}
                    onClick={() => !isEmpty && handleCellClick(cell)}
                    disabled={isEmpty}
                    className={`
                      w-12 h-12 md:w-16 md:h-16 rounded-lg font-bold text-sm md:text-lg transition-all duration-200
                      ${isEmpty 
                        ? 'bg-gray-100 cursor-not-allowed' 
                        : isSelected
                          ? 'bg-blue-500 text-white shadow-lg scale-105'
                          : isHinted
                            ? 'bg-yellow-300 text-yellow-900 shadow-lg'
                            : 'bg-gray-200 hover:bg-gray-300 active:bg-gray-400'
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
    </div>
  )
}
