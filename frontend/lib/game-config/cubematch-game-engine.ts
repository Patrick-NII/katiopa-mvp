/**
 * 🎯 CUBEMATCH GAME ENGINE
 * 
 * Moteur de jeu qui utilise la configuration centralisée
 * Intègre avec le système de séries existant
 */

import { 
  GameConfig, 
  Operator, 
  RNG, 
  pickWeighted, 
  shuffle, 
  clamp,
  DefaultConfig,
  mergeConfig,
  createAgeSpecificConfig
} from './cubematch-config'
import { GridGenerator } from './grid-generator'
import { GenerationContext } from './operator-strategies'

// ----------------------------
// Types pour l'intégration
// ----------------------------

export interface Cell {
  id: string
  value: number
  selected: boolean
  row: number
  col: number
}

export interface GameState {
  grid: Cell[][]
  target: number
  operator: Operator
  score: number
  level: number
  difficulty: number
  selectedCells: Cell[]
  isPlaying: boolean
  timeLeft: number
  combo: number
  accuracy: number
  totalMoves: number
  successfulMoves: number
  consecutiveErrors: number
}

export interface GameMetrics {
  score: number
  level: number
  difficulty: number
  accuracy: number
  totalMoves: number
  successfulMoves: number
  timePlayedMs: number
  operator: Operator
  target: number
  combo: number
  consecutiveErrors: number
}

// ----------------------------
// Moteur de jeu
// ----------------------------

export class CubeMatchGameEngine {
  private config: GameConfig
  private rng: RNG
  private state: GameState
  private gameStartTime: number = 0
  private age: number

  constructor(config: Partial<GameConfig> = {}, age: number = 6) {
    this.age = age
    // Fusionner la configuration avec les paramètres spécifiques à l'âge
    const ageConfig = createAgeSpecificConfig(age)
    this.config = mergeConfig(DefaultConfig, { ...ageConfig, ...config })
    this.rng = this.config.rngFactory!()
    
    // État initial
    this.state = this.createInitialState()
  }

  private createInitialState(): GameState {
    return {
      grid: [],
      target: 0,
      operator: 'ADD',
      score: 0,
      level: 1,
      difficulty: 1.0,
      selectedCells: [],
      isPlaying: false,
      timeLeft: this.config.gameDurationSec,
      combo: 0,
      accuracy: 100,
      totalMoves: 0,
      successfulMoves: 0,
      consecutiveErrors: 0
    }
  }

  /**
   * 🚀 Démarrer une nouvelle partie
   */
  startGame(): void {
    this.gameStartTime = Date.now()
    this.state = this.createInitialState()
    this.state.isPlaying = true
    this.generateNewRound()
  }

  /**
   * 🎯 Générer un nouveau round avec garantie de solvabilité
   */
  private generateNewRound(): void {
    // Choisir un opérateur selon les poids
    const opList = this.config.allowedOperators
    const weights = opList.map(op => this.config.operatorWeights[op] ?? 1)
    const operator = pickWeighted(opList, weights, this.rng)
    
    // Créer le contexte de génération
    const context: GenerationContext = {
      difficulty: this.state.difficulty,
      level: this.state.level,
      age: this.age,
      consecutiveErrors: this.state.consecutiveErrors,
      accuracy: this.state.accuracy
    }
    
    // Utiliser le nouveau générateur de grille
    const generator = new GridGenerator(this.rng, {
      size: this.config.grid.size,
      operator,
      difficulty: this.state.difficulty,
      context,
      allowLongDecompositions: this.config.selection.allowLongDecompositions,
      minSolutions: 1,
      maxSolutions: 3,
      distractorStrategy: this.state.difficulty > 2.0 ? 'misleading' : 
                          this.state.difficulty > 1.5 ? 'similar' : 'random'
    })
    
    const result = generator.generate()
    
    // Mettre à jour l'état en convertissant la grille générée
    this.state.grid = result.grid.map(row =>
      row.map(cell => ({
        id: cell.id,
        row: cell.row,
        col: cell.col,
        value: cell.value,
        selected: false
      }))
    )
    this.state.target = result.target
    this.state.operator = operator
    this.state.selectedCells = []
    
    console.log(`🎯 Nouveau round: target=${result.target}, operator=${operator}, solutions=${result.allSolutions.length}, complexity=${result.metadata.complexity}`)
  }


  /**
   * 🎯 Sélectionner une cellule
   */
  selectCell(cellId: string): { success: boolean; newRound?: boolean; error?: string } {
    if (!this.state.isPlaying) {
      return { success: false, error: 'Jeu non actif' }
    }

    // Trouver la cellule
    const cell = this.findCellById(cellId)
    if (!cell) {
      return { success: false, error: 'Cellule non trouvée' }
    }

    // Toggle la sélection
    if (cell.selected) {
      this.state.selectedCells = this.state.selectedCells.filter(c => c.id !== cellId)
      cell.selected = false
    } else {
      // Vérifier la limite de sélection
      if (this.state.selectedCells.length >= this.config.selection.maxCells) {
        // Si on a atteint la limite, remplacer la sélection
        this.state.selectedCells.forEach(c => c.selected = false)
        this.state.selectedCells = [cell]
        cell.selected = true
      } else {
        this.state.selectedCells.push(cell)
        cell.selected = true
      }
    }

    // Vérifier si on a une solution complète
    if (this.state.selectedCells.length >= 2) {
      return this.validateSolution()
    }

    return { success: true }
  }

  /**
   * ✅ Valider la solution sélectionnée
   */
  private validateSolution(): { success: boolean; newRound?: boolean; error?: string } {
    const selectedValues = this.state.selectedCells.map(c => c.value)
    const isLongDecomposition = selectedValues.length >= this.config.selection.longDecompositionMinCells
    
    // Vérifier si c'est une décomposition longue autorisée
    if (isLongDecomposition && !this.config.selection.allowLongDecompositions) {
      return { success: false, error: 'Décompositions longues non autorisées' }
    }

    // Calculer le résultat
    let result: number
    if (isLongDecomposition) {
      // Pour les décompositions longues, on additionne tous les nombres
      result = selectedValues.reduce((sum, val) => sum + val, 0)
    } else {
      // Pour les sélections de 2 nombres, utiliser l'opérateur
      const [a, b] = selectedValues
      const strategy = this.config.operators[this.state.operator]
      result = strategy.eval(a, b)
    }

    // Vérifier si c'est correct
    const isCorrect = Math.abs(result - this.state.target) < 1e-6

    if (isCorrect) {
      return this.handleSuccess(isLongDecomposition)
    } else {
      return this.handleFailure()
    }
  }

  /**
   * 🎉 Gérer le succès
   */
  private handleSuccess(isLongDecomposition: boolean): { success: boolean; newRound: boolean } {
    // Calculer les points
    const timeSinceRoundStart = Date.now() - this.gameStartTime
    const points = this.config.scoring.points({
      level: this.state.level,
      difficulty: this.state.difficulty,
      timeSinceRoundStartMs: timeSinceRoundStart,
      currentCombo: this.state.combo,
      accuracy: this.state.accuracy,
      isLongDecomposition
    })

    // Mettre à jour l'état
    this.state.score += points
    this.state.level += 1
    this.state.combo += 1
    this.state.successfulMoves += 1
    this.state.totalMoves += 1
    this.state.consecutiveErrors = 0

    // Recalculer la précision
    this.state.accuracy = (this.state.successfulMoves / this.state.totalMoves) * 100

    // Mettre à jour la difficulté
    const accuracyWindow = this.state.accuracy / 100
    this.state.difficulty = this.config.difficultyModel.update({
      prev: this.state.difficulty,
      level: this.state.level,
      age: 6, // TODO: passer l'âge en paramètre
      wasSuccess: true,
      accuracyWindow,
      consecutiveErrors: this.state.consecutiveErrors
    })

    // Générer un nouveau round
    this.generateNewRound()

    return { success: true, newRound: true }
  }

  /**
   * ❌ Gérer l'échec
   */
  private handleFailure(): { success: boolean; newRound: boolean } {
    // Mettre à jour l'état
    this.state.totalMoves += 1
    this.state.consecutiveErrors += 1
    this.state.combo = 0

    // Recalculer la précision
    this.state.accuracy = (this.state.successfulMoves / this.state.totalMoves) * 100

    // Mettre à jour la difficulté
    const accuracyWindow = this.state.accuracy / 100
    this.state.difficulty = this.config.difficultyModel.update({
      prev: this.state.difficulty,
      level: this.state.level,
      age: 6, // TODO: passer l'âge en paramètre
      wasSuccess: false,
      accuracyWindow,
      consecutiveErrors: this.state.consecutiveErrors
    })

    // Nettoyer la sélection
    this.state.selectedCells.forEach(c => c.selected = false)
    this.state.selectedCells = []

    return { success: false, newRound: false }
  }

  /**
   * 🔍 Trouver une cellule par ID
   */
  private findCellById(cellId: string): Cell | null {
    for (let row = 0; row < this.state.grid.length; row++) {
      for (let col = 0; col < this.state.grid[row].length; col++) {
        if (this.state.grid[row][col].id === cellId) {
          return this.state.grid[row][col]
        }
      }
    }
    return null
  }

  /**
   * ⏰ Mettre à jour le temps
   */
  tick(): void {
    if (this.state.isPlaying && this.state.timeLeft > 0) {
      this.state.timeLeft -= 1
      if (this.state.timeLeft <= 0) {
        this.state.isPlaying = false
      }
    }
  }

  /**
   * 📊 Obtenir les métriques de jeu
   */
  getMetrics(): GameMetrics {
    return {
      score: this.state.score,
      level: this.state.level,
      difficulty: this.state.difficulty,
      accuracy: this.state.accuracy,
      totalMoves: this.state.totalMoves,
      successfulMoves: this.state.successfulMoves,
      timePlayedMs: Date.now() - this.gameStartTime,
      operator: this.state.operator,
      target: this.state.target,
      combo: this.state.combo,
      consecutiveErrors: this.state.consecutiveErrors
    }
  }

  /**
   * 📋 Obtenir l'état actuel
   */
  getState(): GameState {
    return { ...this.state }
  }

  /**
   * 🔄 Redémarrer le jeu
   */
  restart(): void {
    this.startGame()
  }

  /**
   * ⏸️ Mettre en pause
   */
  pause(): void {
    this.state.isPlaying = false
  }

  /**
   * ▶️ Reprendre
   */
  resume(): void {
    if (this.state.timeLeft > 0) {
      this.state.isPlaying = true
    }
  }
}
