'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  Brain, 
  RotateCcw, 
  Clock, 
  Star,
  Trophy,
  Play,
  Pause,
  Settings
} from 'lucide-react'

interface Card {
  id: number
  value: number
  isFlipped: boolean
  isMatched: boolean
}

interface GameStats {
  score: number
  moves: number
  timeLeft: number
  matches: number
  accuracy: number
}

export default function MemoryGame() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameOver'>('menu')
  const [cards, setCards] = useState<Card[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [isGameRunning, setIsGameRunning] = useState(false)
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM')
  
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    moves: 0,
    timeLeft: 60,
    matches: 0,
    accuracy: 100
  })

  // Configuration selon la difficulté
  const getGameConfig = () => {
    switch (difficulty) {
      case 'EASY':
        return { pairs: 8, timeLimit: 90, gridSize: 4 }
      case 'MEDIUM':
        return { pairs: 12, timeLimit: 60, gridSize: 4 }
      case 'HARD':
        return { pairs: 16, timeLimit: 45, gridSize: 4 }
      default:
        return { pairs: 12, timeLimit: 60, gridSize: 4 }
    }
  }

  // Initialiser le jeu
  const initializeGame = useCallback(() => {
    const config = getGameConfig()
    const cardValues: number[] = []
    
    // Créer les paires de cartes
    for (let i = 1; i <= config.pairs; i++) {
      cardValues.push(i, i) // Chaque valeur apparaît deux fois
    }
    
    // Mélanger les cartes
    const shuffledValues = cardValues.sort(() => Math.random() - 0.5)
    
    const newCards: Card[] = shuffledValues.map((value, index) => ({
      id: index,
      value,
      isFlipped: false,
      isMatched: false
    }))
    
    setCards(newCards)
    setFlippedCards([])
    setStats(prev => ({
      ...prev,
      score: 0,
      moves: 0,
      timeLeft: config.timeLimit,
      matches: 0,
      accuracy: 100
    }))
  }, [difficulty])

  // Démarrer le jeu
  const startGame = useCallback(() => {
    setGameState('playing')
    setIsGameRunning(true)
    initializeGame()
  }, [initializeGame])

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
    setFlippedCards([])
  }, [])

  // Gérer le clic sur une carte
  const handleCardClick = useCallback((cardId: number) => {
    if (gameState !== 'playing' || flippedCards.length >= 2) return
    
    const card = cards.find(c => c.id === cardId)
    if (!card || card.isFlipped || card.isMatched) return
    
    const newFlippedCards = [...flippedCards, cardId]
    setFlippedCards(newFlippedCards)
    
    setCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    ))
    
    // Si deux cartes sont retournées, vérifier si elles correspondent
    if (newFlippedCards.length === 2) {
      const [firstId, secondId] = newFlippedCards
      const firstCard = cards.find(c => c.id === firstId)
      const secondCard = cards.find(c => c.id === secondId)
      
      setStats(prev => ({ ...prev, moves: prev.moves + 1 }))
      
      if (firstCard && secondCard && firstCard.value === secondCard.value) {
        // Match trouvé !
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.id === firstId || c.id === secondId 
              ? { ...c, isMatched: true }
              : c
          ))
          
          setStats(prev => ({
            ...prev,
            score: prev.score + 10,
            matches: prev.matches + 1,
            accuracy: Math.round((prev.matches + 1) / (prev.moves + 1) * 100)
          }))
          
          setFlippedCards([])
          
          // Vérifier si le jeu est terminé
          const remainingCards = cards.filter(c => !c.isMatched)
          if (remainingCards.length === 2) { // Il ne reste que les deux dernières cartes
            setTimeout(() => {
              setGameState('gameOver')
              setIsGameRunning(false)
            }, 500)
          }
        }, 500)
      } else {
        // Pas de match, retourner les cartes après un délai
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.id === firstId || c.id === secondId 
              ? { ...c, isFlipped: false }
              : c
          ))
          setFlippedCards([])
        }, 1000)
      }
    }
  }, [gameState, flippedCards, cards])

  // Timer du jeu
  useEffect(() => {
    if (isGameRunning && stats.timeLeft > 0) {
      const interval = setInterval(() => {
        setStats(prev => {
          if (prev.timeLeft <= 1) {
            setIsGameRunning(false)
            setGameState('gameOver')
            return { ...prev, timeLeft: 0 }
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 }
        })
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }, [isGameRunning, stats.timeLeft])

  // Rendu du menu principal
  if (gameState === 'menu') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-pink-100">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <div className="mb-6">
            <Brain className="w-12 h-12 mx-auto mb-3 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Memory Game</h1>
            <p className="text-gray-600 text-sm">Entraîne ta mémoire !</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Difficulté</h3>
            <div className="space-y-2">
              {['EASY', 'MEDIUM', 'HARD'].map(diff => (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff as any)}
                  className={`w-full p-2 rounded-lg text-sm font-medium transition-colors ${
                    difficulty === diff
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {diff === 'EASY' ? 'Facile (8 paires)' : 
                   diff === 'MEDIUM' ? 'Moyen (12 paires)' : 'Difficile (16 paires)'}
                </button>
              ))}
            </div>
          </div>
          
          <button
            onClick={startGame}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            Commencer
          </button>
        </motion.div>
      </div>
    )
  }

  // Rendu du jeu en pause
  if (gameState === 'paused') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-pink-100">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Pause className="w-12 h-12 mx-auto mb-4 text-purple-600" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Jeu en pause</h2>
          <p className="text-gray-600 mb-6">Score: {stats.score}</p>
          
          <div className="space-y-3">
            <button
              onClick={togglePause}
              className="w-full bg-green-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              Reprendre
            </button>
            
            <button
              onClick={resetGame}
              className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Recommencer
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Rendu de fin de jeu
  if (gameState === 'gameOver') {
    const config = getGameConfig()
    const isWin = stats.matches === config.pairs
    const bestScore = localStorage.getItem('memory-best-score')
    const isNewRecord = bestScore ? stats.score > parseInt(bestScore) : true
    
    if (isNewRecord) {
      localStorage.setItem('memory-best-score', stats.score.toString())
    }
    
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-pink-100">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          {isWin ? (
            <Trophy className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
          ) : (
            <Clock className="w-12 h-12 mx-auto mb-3 text-red-500" />
          )}
          
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {isWin ? 'Félicitations !' : 'Temps écoulé !'}
          </h2>
          
          {isNewRecord && (
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-2 mb-4">
              <Star className="w-4 h-4 text-yellow-600 mx-auto mb-1" />
              <p className="text-yellow-800 font-semibold text-sm">Nouveau record !</p>
            </div>
          )}
          
          <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Statistiques</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-600">Score</div>
                <div className="font-semibold text-lg">{stats.score}</div>
              </div>
              <div>
                <div className="text-gray-600">Mouvements</div>
                <div className="font-semibold text-lg">{stats.moves}</div>
              </div>
              <div>
                <div className="text-gray-600">Paires trouvées</div>
                <div className="font-semibold text-lg">{stats.matches}</div>
              </div>
              <div>
                <div className="text-gray-600">Précision</div>
                <div className="font-semibold text-lg">{stats.accuracy}%</div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={startGame}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              Rejouer
            </button>
            
            <button
              onClick={resetGame}
              className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Menu principal
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Rendu du jeu principal
  const config = getGameConfig()
  const gridCols = config.gridSize
  
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-purple-50 to-pink-100">
      {/* Header avec statistiques */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 p-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-gray-900">Memory Game</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={togglePause}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="Pause"
            >
              <Pause className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="bg-purple-50 rounded-lg p-1.5">
            <div className="font-bold text-purple-600">{stats.score}</div>
            <div className="text-gray-600">Score</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-1.5">
            <div className="font-bold text-blue-600">{stats.moves}</div>
            <div className="text-gray-600">Mouvements</div>
          </div>
          <div className="bg-green-50 rounded-lg p-1.5">
            <div className="font-bold text-green-600">{stats.matches}</div>
            <div className="text-gray-600">Paires</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-1.5">
            <div className="font-bold text-orange-600">{stats.timeLeft}</div>
            <div className="text-gray-600">Temps</div>
          </div>
        </div>
      </div>
      
      {/* Plateau de jeu */}
      <div className="flex-1 flex items-center justify-center p-3">
        <div className="bg-white rounded-xl shadow-lg p-3">
          <div 
            className="grid gap-1"
            style={{ 
              gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
              gridTemplateRows: `repeat(${Math.ceil(config.pairs * 2 / gridCols)}, 1fr)`
            }}
          >
            {cards.map((card) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                disabled={card.isMatched}
                className={`
                  w-8 h-8 md:w-12 md:h-12 rounded-lg font-bold text-xs md:text-sm transition-all duration-200
                  ${card.isMatched 
                    ? 'bg-green-200 text-green-800 cursor-not-allowed' 
                    : card.isFlipped
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-300 hover:bg-gray-400 active:bg-gray-500'
                  }
                `}
              >
                {card.isFlipped || card.isMatched ? card.value : '?'}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Instructions */}
      <div className="bg-white/90 backdrop-blur-sm border-t border-gray-200 p-3">
        <div className="text-center text-xs text-gray-600">
          <p>Retournez deux cartes identiques pour les faire disparaître</p>
          <p className="mt-1">Difficulté: <span className="font-semibold text-purple-600">{difficulty}</span> • {config.pairs} paires</p>
        </div>
      </div>
    </div>
  )
}
