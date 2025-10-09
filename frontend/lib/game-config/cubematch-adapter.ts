/**
 * 🎯 CUBEMATCH ADAPTER
 * 
 * Adaptateur pour intégrer le nouveau moteur de jeu avec le système de séries existant
 * Maintient la compatibilité avec l'interface actuelle
 */

import { CubeMatchGameEngine, GameState, GameMetrics } from './cubematch-game-engine'
import { GameConfig as EngineGameConfig, Operator } from './cubematch-config'
import { SeriesCollector } from '../services/cubematch-series-api'

// ----------------------------
// Types pour la compatibilité
// ----------------------------

export interface Cell {
  id: string
  value: number
  selected: boolean
  row: number
  col: number
}

export interface GameStats {
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

export interface GameConfig {
  gridSize: number
  operator: Operator
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  timeLimit: number
  unlimitedTime: boolean
  allowDiagonals: boolean
  soundEnabled: boolean
  hintsEnabled: boolean
  autoSubmit: boolean
  spawnRate: number
  maxNumbers: number
  target: number
  theme: string
}

type SeriesState = {
  attempts: number
  correct: number
  startTime: number
  timerId: NodeJS.Timeout | null
}

// ----------------------------
// Adaptateur principal
// ----------------------------

export class CubeMatchAdapter {
  private engine: CubeMatchGameEngine
  private seriesCollector: SeriesCollector | null = null
  private currentSeries: SeriesState = {
    attempts: 0,
    correct: 0,
    startTime: 0,
    timerId: null
  }
  private timeRemaining: number = 0
  private gameStartTime: number = 0

  constructor(config: Partial<EngineGameConfig> = {}, age: number = 6) {
    this.engine = new CubeMatchGameEngine(config, age)
  }

  /**
   * 🚀 Démarrer le jeu
   */
  startGame(): void {
    this.gameStartTime = Date.now()
    
    // Initialiser le collecteur de séries
    const sessionId = `cubematch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.seriesCollector = new SeriesCollector(sessionId)
    
    // Démarrer le moteur
    this.engine.startGame()
    
    // Démarrer une nouvelle série
    this.startNewSeries()
  }

  /**
   * 🎯 Démarrer une nouvelle série
   */
  private startNewSeries(): void {
    // Nettoyer l'ancien timer
    if (this.currentSeries.timerId) {
      clearTimeout(this.currentSeries.timerId)
    }

    const state = this.engine.getState()
    const validationTime = this.getValidationTime()
    this.timeRemaining = validationTime / 1000

    // Démarrer une nouvelle série dans le collecteur
    if (this.seriesCollector) {
      this.seriesCollector.startSeries(
        state.operator,
        state.target,
        this.getDifficultyString(),
        validationTime
      )
    }

    // Timer visuel
    const visualTimer = setInterval(() => {
      this.timeRemaining = Math.max(0, this.timeRemaining - 1)
      if (this.timeRemaining <= 0) {
        clearInterval(visualTimer)
        this.handleTimeout()
      }
    }, 1000)

    this.currentSeries = {
      attempts: 0,
      correct: 0,
      startTime: Date.now(),
      timerId: setTimeout(() => {
        clearInterval(visualTimer)
        this.handleTimeout()
      }, validationTime)
    }
  }

  /**
   * ⏰ Gérer le timeout
   */
  private handleTimeout(): void {
    console.log('⏰ Temps de validation écoulé - Pénalité de précision')
    
    // Enregistrer le timeout dans le collecteur
    if (this.seriesCollector) {
      const state = this.engine.getState()
      this.seriesCollector.recordAttempt(
        [], // Pas de nombres sélectionnés pour un timeout
        state.target,
        state.operator,
        false,
        this.getValidationTime(),
        'timeout',
        false
      )
    }

    // Mettre à jour la série
    this.currentSeries.attempts += 1
    this.currentSeries.timerId = null
    this.timeRemaining = 0

    // Nettoyer la sélection
    this.clearSelection()
  }

  /**
   * 🎯 Gérer le clic sur une cellule
   */
  handleCellClick(cellId: string): void {
    const result = this.engine.selectCell(cellId)
    
    if (result.success && result.newRound) {
      // Succès - arrêter le timer et valider
      if (this.currentSeries.timerId) {
        clearTimeout(this.currentSeries.timerId)
        this.timeRemaining = 0
      }

      // Enregistrer la tentative correcte
      if (this.seriesCollector) {
        const state = this.engine.getState()
        const responseTime = Date.now() - this.currentSeries.startTime
        const selectedValues = this.getSelectedValues()
        const isLongDecomposition = selectedValues.length >= 3

        this.seriesCollector.recordAttempt(
          selectedValues,
          state.target,
          state.operator,
          true,
          responseTime,
          'correct',
          isLongDecomposition
        )
      }

      // Mettre à jour la série
      this.currentSeries.attempts += 1
      this.currentSeries.correct += 1
      this.currentSeries.timerId = null

      // Démarrer une nouvelle série
      this.startNewSeries()
    } else if (!result.success) {
      // Échec
      if (this.seriesCollector) {
        const state = this.engine.getState()
        const responseTime = Date.now() - this.currentSeries.startTime
        const selectedValues = this.getSelectedValues()
        const isLongDecomposition = selectedValues.length >= 3

        this.seriesCollector.recordAttempt(
          selectedValues,
          state.target,
          state.operator,
          false,
          responseTime,
          'incorrect',
          isLongDecomposition
        )
      }

      // Mettre à jour la série
      this.currentSeries.attempts += 1

      // Nettoyer la sélection après un délai
      setTimeout(() => {
        this.clearSelection()
      }, 500)
    }
  }

  /**
   * 📊 Obtenir l'état du jeu pour l'interface
   */
  getGameState(): {
    grid: Cell[][]
    target: number
    operator: Operator
    stats: GameStats
    selectedCells: Cell[]
    isPlaying: boolean
    timeRemaining: number
    currentSeries: SeriesState
  } {
    const engineState = this.engine.getState()
    const metrics = this.engine.getMetrics()

    return {
      grid: engineState.grid,
      target: engineState.target,
      operator: engineState.operator,
      stats: {
        score: metrics.score,
        level: metrics.level,
        combo: metrics.combo,
        bestCombo: Math.max(metrics.combo, 0), // TODO: tracker le meilleur combo
        lives: 3, // TODO: implémenter le système de vies
        timeLeft: engineState.timeLeft,
        cellsCleared: metrics.successfulMoves,
        totalMoves: metrics.totalMoves,
        successfulMoves: metrics.successfulMoves,
        hintsUsed: 0, // TODO: implémenter le système d'indices
        accuracy: metrics.accuracy,
        timePlayedMs: metrics.timePlayedMs
      },
      selectedCells: engineState.selectedCells,
      isPlaying: engineState.isPlaying,
      timeRemaining: this.timeRemaining,
      currentSeries: this.currentSeries
    }
  }

  /**
   * 💾 Sauvegarder les données de session
   */
  async saveSession(): Promise<{ success: boolean; scoreId?: string; message: string }> {
    if (!this.seriesCollector) {
      return { success: false, message: 'Aucun collecteur de séries' }
    }

    const metrics = this.engine.getMetrics()
    const state = this.engine.getState()

    return await this.seriesCollector.saveSession({
      score: metrics.score,
      level: metrics.level,
      operator: metrics.operator,
      target: metrics.target,
      difficulty: this.getDifficultyString(),
      gridSize: state.grid.length,
      allowDiagonals: false, // TODO: configurable
      totalMoves: metrics.totalMoves,
      successfulMoves: metrics.successfulMoves,
      failedMoves: metrics.totalMoves - metrics.successfulMoves,
      accuracyRate: metrics.accuracy,
      comboMax: metrics.combo,
      cellsCleared: metrics.successfulMoves,
      hintsUsed: 0, // TODO: implémenter
      consecutiveErrors: metrics.consecutiveErrors,
      longDecompositionsCount: 0, // TODO: compter depuis les séries
      autoValidationEnabled: true
    })
  }

  /**
   * ⏰ Mettre à jour le temps
   */
  tick(): void {
    this.engine.tick()
  }

  /**
   * 🔄 Redémarrer
   */
  restart(): void {
    this.engine.restart()
    this.startNewSeries()
  }

  /**
   * ⏸️ Mettre en pause
   */
  pause(): void {
    this.engine.pause()
  }

  /**
   * ▶️ Reprendre
   */
  resume(): void {
    this.engine.resume()
  }

  // ----------------------------
  // Méthodes utilitaires
  // ----------------------------

  private getValidationTime(): number {
    const state = this.engine.getState()
    // TODO: utiliser le TimerModel de la configuration
    return 5000 // Temps par défaut
  }

  private getDifficultyString(): 'EASY' | 'MEDIUM' | 'HARD' {
    const state = this.engine.getState()
    if (state.difficulty <= 1.2) return 'EASY'
    if (state.difficulty <= 2.0) return 'MEDIUM'
    return 'HARD'
  }

  private getSelectedValues(): number[] {
    const state = this.engine.getState()
    return state.selectedCells.map(cell => cell.value)
  }

  private clearSelection(): void {
    const state = this.engine.getState()
    state.selectedCells.forEach(cell => cell.selected = false)
    state.selectedCells = []
  }
}


