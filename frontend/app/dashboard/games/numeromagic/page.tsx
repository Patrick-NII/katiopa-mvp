'use client'

/**
 * 🔢 NUMÉROMAGIC - JEU DE NOMBRES MAGIQUES
 * 
 * Un jeu de réflexion mathématique où le joueur doit atteindre un nombre cible
 * en utilisant des nombres donnés et des opérations mathématiques.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, 
  Star, 
  Clock, 
  Target,
  Plus,
  Minus,
  X as Multiply,
  Divide,
  RotateCcw,
  Lightbulb,
  Play,
  Pause,
  Home,
  TrendingUp,
  Zap
} from 'lucide-react'
import { numeroMagicAPI, NumeroMagicScoreData, NumeroMagicRound } from '@/lib/api/numeromagic'
import { useRouter } from 'next/navigation'

// ========================================
// Types
// ========================================

type Operation = 'ADD' | 'SUB' | 'MUL' | 'DIV';
type GameMode = 'CLASSIC' | 'TIMED' | 'CHALLENGE';
type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';

interface GameState {
  targetNumber: number;
  givenNumbers: number[];
  availableNumbers: number[];
  selectedNumbers: number[];
  currentResult: number | null;
  selectedOperation: Operation | null;
  roundNumber: number;
  score: number;
  level: number;
  streak: number;
  maxCombo: number;
  hintsUsed: number;
  timeElapsed: number;
  isPlaying: boolean;
  isPaused: boolean;
}

interface RoundHistory extends NumeroMagicRound {}

// ========================================
// Composant Principal
// ========================================

export default function NumeroMagicPage() {
  const router = useRouter()
  const [gameStarted, setGameStarted] = useState(false)
  const [gameMode, setGameMode] = useState<GameMode>('CLASSIC')
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('MEDIUM')
  
  // État du jeu
  const [gameState, setGameState] = useState<GameState>({
    targetNumber: 0,
    givenNumbers: [],
    availableNumbers: [],
    selectedNumbers: [],
    currentResult: null,
    selectedOperation: null,
    roundNumber: 0,
    score: 0,
    level: 1,
    streak: 0,
    maxCombo: 0,
    hintsUsed: 0,
    timeElapsed: 0,
    isPlaying: false,
    isPaused: false
  })

  // Historique des rounds
  const [roundsHistory, setRoundsHistory] = useState<RoundHistory[]>([])
  const [roundStartTime, setRoundStartTime] = useState<number>(0)
  const gameStartTimeRef = useRef<number>(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Statistiques du jeu
  const [stats, setStats] = useState({
    totalRounds: 0,
    successfulRounds: 0,
    failedRounds: 0,
    operationsUsed: {
      ADD: 0,
      SUB: 0,
      MUL: 0,
      DIV: 0
    },
    operationsSuccess: {
      ADD: 0,
      SUB: 0,
      MUL: 0,
      DIV: 0
    },
    solveTimes: [] as number[]
  })

  // ========================================
  // Génération de round
  // ========================================

  // Fonction pour calculer TOUS les résultats possibles avec les nombres donnés
  const calculateAllPossibleResults = useCallback((numbers: number[]): number[] => {
    const results = new Set<number>();
    
    // Ajouter les nombres eux-mêmes
    numbers.forEach(num => results.add(num));
    
    // Calculer toutes les combinaisons de 2 nombres
    for (let i = 0; i < numbers.length; i++) {
      for (let j = 0; j < numbers.length; j++) {
        if (i === j) continue;
        
        const a = numbers[i];
        const b = numbers[j];
        
        // Opérations de base
        results.add(a + b);
        results.add(a - b);
        results.add(b - a);
        results.add(a * b);
        
        // Divisions (seulement si résultat entier)
        if (b !== 0 && Number.isInteger(a / b)) results.add(a / b);
        if (a !== 0 && Number.isInteger(b / a)) results.add(b / a);
        
        // Combinaisons de 3 nombres
        const remainingNumbers = numbers.filter((_, idx) => idx !== i && idx !== j);
        for (const c of remainingNumbers) {
          // (a op b) op c
          results.add(a + b + c);
          results.add(a + b - c);
          results.add(a - b + c);
          results.add(a * b + c);
          results.add(a * b - c);
          results.add(a + b * c);
          results.add(a - b * c);
          
          // Divisions avec 3 nombres
          if (a + b !== 0 && Number.isInteger(c / (a + b))) results.add(c / (a + b));
          if (a * b !== 0 && Number.isInteger(c / (a * b))) results.add(c / (a * b));
          if (c !== 0 && Number.isInteger((a + b) / c)) results.add((a + b) / c);
          if (c !== 0 && Number.isInteger((a * b) / c)) results.add((a * b) / c);
        }
      }
    }
    
    // Filtrer les résultats positifs et raisonnables (éviter les nombres trop grands)
    return Array.from(results)
      .filter(result => result > 0 && result <= 1000 && Number.isInteger(result))
      .sort((a, b) => a - b);
  }, []);

  const generateRound = useCallback(() => {
    const maxNum = difficulty === 'EASY' ? 20 : difficulty === 'MEDIUM' ? 50 : difficulty === 'HARD' ? 100 : 200
    const numbersCount = difficulty === 'EASY' ? 3 : difficulty === 'MEDIUM' ? 4 : 5
    
    // Générer des nombres aléatoires
    const numbers: number[] = []
    for (let i = 0; i < numbersCount; i++) {
      numbers.push(Math.floor(Math.random() * maxNum) + 1)
    }
    
    // Calculer TOUS les résultats possibles
    const possibleResults = calculateAllPossibleResults(numbers);
    
    if (possibleResults.length === 0) {
      // Fallback : utiliser une combinaison simple
      const target = numbers[0] + numbers[1];
      console.log(`🎯 Fallback - Cible: ${target}, Nombres: [${numbers.join(', ')}]`);
      
      setGameState(prev => ({
        ...prev,
        targetNumber: target,
        givenNumbers: [...numbers],
        availableNumbers: [...numbers],
        selectedNumbers: [],
        currentResult: null,
        selectedOperation: null,
        roundNumber: prev.roundNumber + 1
      }));
    } else {
      // Choisir une cible parmi les résultats possibles
      // Éviter les cibles trop faciles (comme les nombres eux-mêmes)
      const challengingTargets = possibleResults.filter(result => 
        !numbers.includes(result) && result > Math.max(...numbers) / 2
      );
      
      const target = challengingTargets.length > 0 
        ? challengingTargets[Math.floor(Math.random() * challengingTargets.length)]
        : possibleResults[Math.floor(Math.random() * possibleResults.length)];
      
      console.log(`🎯 Round généré - Cible: ${target}, Nombres: [${numbers.join(', ')}]`);
      console.log(`📊 ${possibleResults.length} résultats possibles: [${possibleResults.slice(0, 10).join(', ')}${possibleResults.length > 10 ? '...' : ''}]`);
      
      setGameState(prev => ({
        ...prev,
        targetNumber: target,
        givenNumbers: [...numbers],
        availableNumbers: [...numbers],
        selectedNumbers: [],
        currentResult: null,
        selectedOperation: null,
        roundNumber: prev.roundNumber + 1
      }));
    }

    setRoundStartTime(Date.now())
  }, [difficulty, calculateAllPossibleResults])

  // ========================================
  // Démarrage du jeu
  // ========================================

  const startGame = () => {
    console.log('🎮 Démarrage NuméroMagic:', { gameMode, difficulty })
    
    setGameStarted(true)
    setGameState({
      targetNumber: 0,
      givenNumbers: [],
      availableNumbers: [],
      selectedNumbers: [],
      currentResult: null,
      selectedOperation: null,
      roundNumber: 0,
      score: 0,
      level: 1,
      streak: 0,
      maxCombo: 0,
      hintsUsed: 0,
      timeElapsed: 0,
      isPlaying: true,
      isPaused: false
    })
    setRoundsHistory([])
    setStats({
      totalRounds: 0,
      successfulRounds: 0,
      failedRounds: 0,
      operationsUsed: { ADD: 0, SUB: 0, MUL: 0, DIV: 0 },
      operationsSuccess: { ADD: 0, SUB: 0, MUL: 0, DIV: 0 },
      solveTimes: []
    })
    
    gameStartTimeRef.current = Date.now()
    generateRound()

    // Démarrer le timer
    timerRef.current = setInterval(() => {
      setGameState(prev => ({
        ...prev,
        timeElapsed: prev.timeElapsed + 1
      }))
    }, 1000)
  }

  // ========================================
  // Sélection de nombre
  // ========================================

  const handleNumberClick = (num: number, index: number) => {
    if (!gameState.isPlaying || gameState.isPaused) return

    if (gameState.selectedNumbers.length < 2) {
      setGameState(prev => ({
        ...prev,
        selectedNumbers: [...prev.selectedNumbers, num],
        availableNumbers: prev.availableNumbers.filter((_, i) => i !== index)
      }))
    }
  }

  // ========================================
  // Sélection d'opération
  // ========================================

  const handleOperationClick = (op: Operation) => {
    if (!gameState.isPlaying || gameState.isPaused) return
    if (gameState.selectedNumbers.length !== 2) return

    const [a, b] = gameState.selectedNumbers
    let result: number | null = null

    switch (op) {
      case 'ADD':
        result = a + b
        break
      case 'SUB':
        result = a - b
        break
      case 'MUL':
        result = a * b
        break
      case 'DIV':
        if (b !== 0 && a % b === 0) {
          result = a / b
        }
        break
    }

    if (result !== null) {
      setGameState(prev => ({
        ...prev,
        currentResult: result,
        selectedOperation: op,
        availableNumbers: [...prev.availableNumbers, result],
        selectedNumbers: []
      }))

      // Vérifier si on a atteint la cible
      if (result === gameState.targetNumber) {
        handleRoundComplete(true, op)
      }
    }
  }

  // ========================================
  // Complétion de round
  // ========================================

  const handleRoundComplete = (success: boolean, operation: Operation) => {
    const solveTime = Date.now() - roundStartTime
    const wasPerfect = success && gameState.hintsUsed === 0

    // Mise à jour des stats
    setStats(prev => ({
      ...prev,
      totalRounds: prev.totalRounds + 1,
      successfulRounds: success ? prev.successfulRounds + 1 : prev.successfulRounds,
      failedRounds: success ? prev.failedRounds : prev.failedRounds + 1,
      operationsUsed: {
        ...prev.operationsUsed,
        [operation]: prev.operationsUsed[operation] + 1
      },
      operationsSuccess: success ? {
        ...prev.operationsSuccess,
        [operation]: prev.operationsSuccess[operation] + 1
      } : prev.operationsSuccess,
      solveTimes: [...prev.solveTimes, solveTime]
    }))

    // Calculer le score
    const basePoints = success ? 100 : 0
    const timeBonus = success ? Math.max(0, 50 - Math.floor(solveTime / 1000)) : 0
    const streakBonus = success ? gameState.streak * 10 : 0
    const roundScore = basePoints + timeBonus + streakBonus

    // Sauvegarder le round
    const round: RoundHistory = {
      roundNumber: gameState.roundNumber,
      targetNumber: gameState.targetNumber,
      givenNumbers: gameState.givenNumbers,
      operationsAvailable: ['ADD', 'SUB', 'MUL', 'DIV'],
      isCorrect: success,
      solveTimeMs: solveTime,
      operationsUsed: [operation],
      wasPerfect,
      difficultyRating: difficulty === 'EASY' ? 2 : difficulty === 'MEDIUM' ? 5 : difficulty === 'HARD' ? 7 : 9
    }
    setRoundsHistory(prev => [...prev, round])

    // Mise à jour du game state
    setGameState(prev => ({
      ...prev,
      score: prev.score + roundScore,
      streak: success ? prev.streak + 1 : 0,
      maxCombo: success ? Math.max(prev.maxCombo, prev.streak + 1) : prev.maxCombo
    }))

    // Afficher un message et passer au round suivant
    setTimeout(() => {
      generateRound()
    }, 1500)
  }

  // ========================================
  // Fin du jeu
  // ========================================

  const endGame = async () => {
    console.log('🏁 Fin du jeu NuméroMagic')

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    const totalTime = Date.now() - gameStartTimeRef.current
    const avgSolveTime = stats.solveTimes.length > 0 
      ? stats.solveTimes.reduce((a, b) => a + b, 0) / stats.solveTimes.length 
      : 0

    const scoreData: NumeroMagicScoreData = {
      score: gameState.score,
      level: gameState.level,
      timePlayedMs: totalTime,
      gameMode,
      difficultyLevel: difficulty,
      maxNumber: difficulty === 'EASY' ? 20 : difficulty === 'MEDIUM' ? 50 : difficulty === 'HARD' ? 100 : 200,
      operationsAllowed: ['ADD', 'SUB', 'MUL', 'DIV'],
      totalRounds: stats.totalRounds,
      successfulRounds: stats.successfulRounds,
      failedRounds: stats.failedRounds,
      accuracyRate: stats.totalRounds > 0 ? (stats.successfulRounds / stats.totalRounds) * 100 : 0,
      averageSolveTimeMs: Math.floor(avgSolveTime),
      fastestSolveMs: stats.solveTimes.length > 0 ? Math.min(...stats.solveTimes) : undefined,
      slowestSolveMs: stats.solveTimes.length > 0 ? Math.max(...stats.solveTimes) : undefined,
      maxCombo: gameState.maxCombo,
      currentStreak: gameState.streak,
      bestStreak: gameState.maxCombo,
      additionsCount: stats.operationsUsed.ADD,
      subtractionsCount: stats.operationsUsed.SUB,
      multiplicationsCount: stats.operationsUsed.MUL,
      divisionsCount: stats.operationsUsed.DIV,
      additionsSuccess: stats.operationsSuccess.ADD,
      subtractionsSuccess: stats.operationsSuccess.SUB,
      multiplicationsSuccess: stats.operationsSuccess.MUL,
      divisionsSuccess: stats.operationsSuccess.DIV,
      hintsUsed: gameState.hintsUsed,
      perfectRounds: roundsHistory.filter(r => r.wasPerfect).length,
      engagementScore: Math.min(100, (stats.successfulRounds / Math.max(1, stats.totalRounds)) * 100),
      flowScore: Math.min(100, gameState.maxCombo * 10),
      rounds: roundsHistory
    }

    console.log('💾 Envoi des données à l\'API:', scoreData)

    try {
      const result = await numeroMagicAPI.saveScore(scoreData)
      console.log('✅ Score sauvegardé:', result)
      alert(`🎉 Partie terminée!\n\nScore: ${gameState.score}\nRounds réussis: ${stats.successfulRounds}/${stats.totalRounds}\n\nScore sauvegardé dans la base de données!`)
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error)
      alert('❌ Erreur lors de la sauvegarde du score. Vérifiez que le backend est démarré sur le port 4000.')
    }

    setGameState(prev => ({ ...prev, isPlaying: false }))
    setGameStarted(false)
  }

  // ========================================
  // Cleanup
  // ========================================

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // ========================================
  // Rendu - Écran de démarrage
  // ========================================

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-950 dark:via-green-950 dark:to-emerald-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center">
                <span className="text-5xl">🔢</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              NuméroMagic
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Atteins le nombre cible avec les nombres donnés !
            </p>
          </div>

          {/* Mode de jeu */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Mode de jeu
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['CLASSIC', 'TIMED', 'CHALLENGE'] as GameMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setGameMode(mode)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    gameMode === mode
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {mode === 'CLASSIC' ? 'Classique' : mode === 'TIMED' ? 'Chronométré' : 'Défi'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulté */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Difficulté
            </label>
            <div className="grid grid-cols-4 gap-3">
              {(['EASY', 'MEDIUM', 'HARD', 'EXPERT'] as DifficultyLevel[]).map(diff => (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    difficulty === diff
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {diff === 'EASY' ? 'Facile' : diff === 'MEDIUM' ? 'Moyen' : diff === 'HARD' ? 'Difficile' : 'Expert'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/dashboard/mathcube')}
              className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Retour
            </button>
            <button
              onClick={startGame}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 font-medium"
            >
              <Play className="w-5 h-5" />
              Commencer
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ========================================
  // Rendu - Interface de jeu
  // ========================================

  const operationIcons = {
    ADD: <Plus className="w-6 h-6" />,
    SUB: <Minus className="w-6 h-6" />,
    MUL: <Multiply className="w-6 h-6" />,
    DIV: <Divide className="w-6 h-6" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-950 dark:via-green-950 dark:to-emerald-950 p-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header avec stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-3">
            <Target className="w-8 h-8 text-green-500" />
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Cible</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{gameState.targetNumber}</div>
            </div>
          </div>
          
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Score</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{gameState.score}</div>
            </div>
          </div>
          
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-3">
            <Zap className="w-8 h-8 text-orange-500" />
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Série</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{gameState.streak}</div>
            </div>
          </div>
          
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-3">
            <Clock className="w-8 h-8 text-blue-500" />
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Temps</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.floor(gameState.timeElapsed / 60)}:{(gameState.timeElapsed % 60).toString().padStart(2, '0')}
              </div>
            </div>
          </div>
        </div>

        {/* Zone de jeu */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl p-8 mb-6">
          
          {/* Nombres disponibles */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
              Nombres disponibles
            </h3>
            <div className="flex flex-wrap gap-4 justify-center">
              {gameState.availableNumbers.map((num, index) => (
                <motion.button
                  key={`${num}-${index}`}
                  onClick={() => handleNumberClick(num, index)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl text-3xl font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  {num}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Nombres sélectionnés */}
          {gameState.selectedNumbers.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
                Nombres sélectionnés
              </h3>
              <div className="flex gap-4 justify-center">
                {gameState.selectedNumbers.map((num, index) => (
                  <div
                    key={index}
                    className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl text-3xl font-bold flex items-center justify-center shadow-lg"
                  >
                    {num}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Opérations */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
              Opérations
            </h3>
            <div className="flex gap-4 justify-center">
              {(['ADD', 'SUB', 'MUL', 'DIV'] as Operation[]).map(op => (
                <motion.button
                  key={op}
                  onClick={() => handleOperationClick(op)}
                  disabled={gameState.selectedNumbers.length !== 2}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-16 h-16 rounded-xl flex items-center justify-center text-white shadow-lg transition-all ${
                    gameState.selectedNumbers.length === 2
                      ? 'bg-gradient-to-br from-purple-500 to-pink-600 hover:shadow-xl'
                      : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed opacity-50'
                  }`}
                >
                  {operationIcons[op]}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Bouton terminer */}
        <button
          onClick={endGame}
          className="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-2xl hover:from-red-600 hover:to-pink-700 transition-all font-medium text-lg"
        >
          Terminer la partie
        </button>
      </div>
    </div>
  )
}
