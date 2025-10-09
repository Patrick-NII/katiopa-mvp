/**
 * 🎯 GRID GENERATOR - PHASE 2
 * 
 * Génération intelligente de grilles avec garantie de solvabilité
 * Intègre les stratégies d'opérateurs avancées
 */

import { RNG } from './cubematch-config'
import { 
  OperatorStrategyFactory, 
  SolvabilityValidator,
  GenerationContext 
} from './operator-strategies'

// ----------------------------
// Types
// ----------------------------

export interface GridCell {
  id: string
  value: number
  row: number
  col: number
  isSolution: boolean
  isDistractor: boolean
}

export interface GridGenerationResult {
  grid: GridCell[][]
  target: number
  operator: string
  solution: number[]
  allSolutions: number[][]
  difficulty: number
  metadata: {
    distractorCount: number
    solutionCount: number
    avgDistractorDistance: number
    complexity: 'simple' | 'medium' | 'complex'
  }
}

export interface GridGeneratorConfig {
  size: number
  operator: string
  difficulty: number
  context: GenerationContext
  allowLongDecompositions: boolean
  minSolutions: number // Au moins 1 solution garantie
  maxSolutions: number // Limite pour éviter trop de facilité
  distractorStrategy: 'random' | 'similar' | 'misleading'
}

// ----------------------------
// Générateur de grille principal
// ----------------------------

export class GridGenerator {
  private rng: RNG
  private config: GridGeneratorConfig

  constructor(rng: RNG, config: GridGeneratorConfig) {
    this.rng = rng
    this.config = config
  }

  /**
   * 🎯 Génère une grille complète avec garantie de solvabilité
   */
  generate(): GridGenerationResult {
    let attempts = 0
    const maxAttempts = 50
    
    while (attempts < maxAttempts) {
      const result = this.attemptGeneration()
      
      if (result && this.validateGeneration(result)) {
        return result
      }
      
      attempts++
    }
    
    // Fallback: génération simple garantie
    console.warn('🔄 Fallback vers génération simple après', maxAttempts, 'tentatives')
    return this.generateSimpleFallback()
  }

  /**
   * 🎯 Tente de générer une grille
   */
  private attemptGeneration(): GridGenerationResult | null {
    // 1. Générer la solution avec contexte
    const { target, solution } = OperatorStrategyFactory.generateWithContext(
      this.config.operator,
      this.config.difficulty,
      this.rng,
      this.config.context
    )
    
    // 2. Créer la grille vide
    const grid: GridCell[][] = this.createEmptyGrid()
    
    // 3. Placer la solution garantie
    const solutionCells = this.placeSolution(grid, solution)
    
    // 4. Ajouter des distracteurs intelligents
    this.addDistractors(grid, target, solution)
    
    // 5. Vérifier la solvabilité
    const flatGrid = this.flattenGrid(grid)
    const validation = SolvabilityValidator.validateGrid(
      flatGrid.map(c => c.value),
      target,
      this.config.operator,
      this.config.allowLongDecompositions
    )
    
    if (!validation.solvable) {
      return null
    }
    
    // 6. Calculer les métadonnées
    const metadata = this.calculateMetadata(grid, validation.solutions)
    
    return {
      grid,
      target,
      operator: this.config.operator,
      solution,
      allSolutions: validation.solutions,
      difficulty: this.config.difficulty,
      metadata
    }
  }

  /**
   * 🏗️ Crée une grille vide
   */
  private createEmptyGrid(): GridCell[][] {
    const grid: GridCell[][] = []
    
    for (let row = 0; row < this.config.size; row++) {
      grid[row] = []
      for (let col = 0; col < this.config.size; col++) {
        grid[row][col] = {
          id: `${row}-${col}`,
          value: 0,
          row,
          col,
          isSolution: false,
          isDistractor: false
        }
      }
    }
    
    return grid
  }

  /**
   * 🎯 Place la solution dans la grille
   */
  private placeSolution(grid: GridCell[][], solution: [number, number]): GridCell[] {
    const positions = this.getRandomPositions(solution.length)
    const solutionCells: GridCell[] = []
    
    for (let i = 0; i < solution.length; i++) {
      const { row, col } = positions[i]
      grid[row][col].value = solution[i]
      grid[row][col].isSolution = true
      solutionCells.push(grid[row][col])
    }
    
    return solutionCells
  }

  /**
   * 🎲 Obtient des positions aléatoires dans la grille
   */
  private getRandomPositions(count: number): Array<{ row: number; col: number }> {
    const positions: Array<{ row: number; col: number }> = []
    const used = new Set<string>()
    
    while (positions.length < count) {
      const row = Math.floor(this.rng.next() * this.config.size)
      const col = Math.floor(this.rng.next() * this.config.size)
      const key = `${row}-${col}`
      
      if (!used.has(key)) {
        positions.push({ row, col })
        used.add(key)
      }
    }
    
    return positions
  }

  /**
   * 🎲 Ajoute des distracteurs intelligents
   */
  private addDistractors(grid: GridCell[][], target: number, solution: [number, number]): void {
    const emptyCells = this.getEmptyCells(grid)
    const distractorCount = Math.min(
      emptyCells.length,
      this.calculateDistractorCount()
    )
    
    const distractors = this.generateDistractors(
      target,
      solution,
      distractorCount
    )
    
    // Placer les distracteurs dans les cellules vides
    const shuffledCells = this.shuffleArray(emptyCells)
    for (let i = 0; i < Math.min(distractors.length, shuffledCells.length); i++) {
      const cell = shuffledCells[i]
      cell.value = distractors[i]
      cell.isDistractor = true
    }
  }

  /**
   * 🎲 Génère des distracteurs selon la stratégie
   */
  private generateDistractors(
    target: number,
    solution: [number, number],
    count: number
  ): number[] {
    const distractors: number[] = []
    
    switch (this.config.distractorStrategy) {
      case 'similar':
        // Distracteurs similaires aux nombres de la solution
        distractors.push(...this.generateSimilarDistractors(solution, count))
        break
        
      case 'misleading':
        // Distracteurs qui pourraient tromper l'utilisateur
        distractors.push(...this.generateMisleadingDistractors(target, solution, count))
        break
        
      case 'random':
      default:
        // Distracteurs aléatoires dans une plage appropriée
        distractors.push(...this.generateRandomDistractors(target, count))
        break
    }
    
    return distractors.slice(0, count)
  }

  /**
   * 🎲 Génère des distracteurs similaires
   */
  private generateSimilarDistractors(solution: [number, number], count: number): number[] {
    const distractors: number[] = []
    const maxVal = Math.max(...solution)
    const minVal = Math.min(...solution)
    
    for (let i = 0; i < count; i++) {
      // Générer des nombres proches de la solution
      const base = solution[i % solution.length]
      const offset = Math.floor(this.rng.next() * 6) - 3 // -3 à +3
      const value = Math.max(1, base + offset)
      
      // Éviter les doublons avec la solution
      if (!solution.includes(value)) {
        distractors.push(value)
      }
    }
    
    return distractors
  }

  /**
   * 🎲 Génère des distracteurs trompeurs
   */
  private generateMisleadingDistractors(
    target: number,
    solution: [number, number],
    count: number
  ): number[] {
    const distractors: number[] = []
    
    for (let i = 0; i < count; i++) {
      let value: number
      
      if (this.config.operator === 'ADD') {
        // Pour l'addition, générer des nombres qui pourraient sembler corrects
        // mais ne donnent pas le bon résultat
        value = Math.floor(target * (0.3 + this.rng.next() * 0.4))
      } else if (this.config.operator === 'SUB') {
        // Pour la soustraction, des nombres proches du target ou du premier opérande
        value = Math.floor(solution[0] * (0.5 + this.rng.next() * 0.5))
      } else if (this.config.operator === 'MUL') {
        // Pour la multiplication, des facteurs proches mais incorrects
        value = 2 + Math.floor(this.rng.next() * (Math.max(...solution) + 2))
      } else if (this.config.operator === 'DIV') {
        // Pour la division, des diviseurs ou quotients alternatifs
        value = 2 + Math.floor(this.rng.next() * target)
      } else {
        // Mixte: comme l'addition
        value = Math.floor(target * (0.2 + this.rng.next() * 0.5))
      }
      
      // Éviter les doublons avec la solution
      if (!solution.includes(value) && value > 0) {
        distractors.push(value)
      }
    }
    
    return distractors
  }

  /**
   * 🎲 Génère des distracteurs aléatoires
   */
  private generateRandomDistractors(target: number, count: number): number[] {
    const distractors: number[] = []
    const age = this.config.context.age
    
    // Déterminer la plage selon l'âge et la difficulté
    let minVal = 1
    let maxVal = Math.max(10, Math.floor(target * 1.5))
    
    if (age <= 5) {
      maxVal = Math.min(maxVal, 15)
    } else if (age === 6) {
      maxVal = Math.min(maxVal, 30)
    }
    
    for (let i = 0; i < count; i++) {
      const value = minVal + Math.floor(this.rng.next() * (maxVal - minVal + 1))
      distractors.push(value)
    }
    
    return distractors
  }

  /**
   * 🎯 Calcule le nombre de distracteurs à générer
   */
  private calculateDistractorCount(): number {
    const totalCells = this.config.size * this.config.size
    const solutionCells = 2 // Minimum pour une paire
    const availableCells = totalCells - solutionCells
    
    // Plus de distracteurs avec la difficulté
    const difficultyFactor = 0.5 + (this.config.difficulty - 0.8) * 0.2
    const count = Math.floor(availableCells * difficultyFactor)
    
    return Math.max(4, Math.min(count, availableCells))
  }

  /**
   * 🔍 Obtient les cellules vides
   */
  private getEmptyCells(grid: GridCell[][]): GridCell[] {
    const cells: GridCell[] = []
    
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        if (grid[row][col].value === 0) {
          cells.push(grid[row][col])
        }
      }
    }
    
    return cells
  }

  /**
   * 🔄 Mélange un tableau
   */
  private shuffleArray<T>(arr: T[]): T[] {
    const result = [...arr]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng.next() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  }

  /**
   * 📊 Calcule les métadonnées de la grille
   */
  private calculateMetadata(grid: GridCell[][], solutions: number[][]): GridGenerationResult['metadata'] {
    const solutionCount = solutions.length
    const distractorCount = this.flattenGrid(grid).filter(c => c.isDistractor).length
    
    // Calculer la distance moyenne entre les nombres de la solution
    let avgDistance = 0
    const solutionCells = this.flattenGrid(grid).filter(c => c.isSolution)
    if (solutionCells.length >= 2) {
      for (let i = 0; i < solutionCells.length; i++) {
        for (let j = i + 1; j < solutionCells.length; j++) {
          const dx = solutionCells[i].row - solutionCells[j].row
          const dy = solutionCells[i].col - solutionCells[j].col
          avgDistance += Math.sqrt(dx * dx + dy * dy)
        }
      }
      const pairs = (solutionCells.length * (solutionCells.length - 1)) / 2
      avgDistance /= pairs
    }
    
    // Déterminer la complexité
    let complexity: 'simple' | 'medium' | 'complex' = 'simple'
    if (solutionCount === 1 && avgDistance > 3) {
      complexity = 'complex'
    } else if (solutionCount <= 2 || avgDistance > 2) {
      complexity = 'medium'
    }
    
    return {
      distractorCount,
      solutionCount,
      avgDistractorDistance: avgDistance,
      complexity
    }
  }

  /**
   * 🔍 Aplatit la grille en un tableau
   */
  private flattenGrid(grid: GridCell[][]): GridCell[] {
    const result: GridCell[] = []
    for (const row of grid) {
      result.push(...row)
    }
    return result
  }

  /**
   * ✅ Valide la génération
   */
  private validateGeneration(result: GridGenerationResult): boolean {
    // Vérifier qu'il y a au moins le nombre minimum de solutions
    if (result.allSolutions.length < this.config.minSolutions) {
      return false
    }
    
    // Vérifier qu'il n'y a pas trop de solutions (trop facile)
    if (result.allSolutions.length > this.config.maxSolutions) {
      return false
    }
    
    // Vérifier que tous les nombres sont positifs
    const flatGrid = this.flattenGrid(result.grid)
    if (flatGrid.some(c => c.value < 0)) {
      return false
    }
    
    return true
  }

  /**
   * 🔄 Génération simple de secours
   */
  private generateSimpleFallback(): GridGenerationResult {
    console.log('🔄 Génération de secours activée')
    
    // Générer une solution simple
    const { target, solution } = OperatorStrategyFactory.generateWithContext(
      this.config.operator,
      1.0, // Difficulté réduite
      this.rng,
      this.config.context
    )
    
    const grid = this.createEmptyGrid()
    
    // Placer la solution au hasard
    this.placeSolution(grid, solution)
    
    // Ajouter quelques distracteurs simples
    const emptyCells = this.getEmptyCells(grid)
    const distractorCount = Math.min(6, emptyCells.length)
    const distractors = this.generateRandomDistractors(target, distractorCount)
    
    for (let i = 0; i < distractors.length; i++) {
      emptyCells[i].value = distractors[i]
      emptyCells[i].isDistractor = true
    }
    
    return {
      grid,
      target,
      operator: this.config.operator,
      solution,
      allSolutions: [solution],
      difficulty: 1.0,
      metadata: {
        distractorCount,
        solutionCount: 1,
        avgDistractorDistance: 2,
        complexity: 'simple'
      }
    }
  }
}

