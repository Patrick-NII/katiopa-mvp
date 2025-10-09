/**
 * 🎯 OPERATOR STRATEGIES - PHASE 2
 * 
 * Stratégies avancées pour chaque opérateur
 * Garantit la solvabilité et adapte la difficulté de manière intelligente
 */

import { OperatorStrategy, RNG, clamp } from './cubematch-config'

// ----------------------------
// Types pour les stratégies avancées
// ----------------------------

export interface OperatorConfig {
  minValue: number
  maxValue: number
  targetRange: { min: number; max: number }
  allowNegative: boolean
  allowDecimals: boolean
  preferredComplexity: 'simple' | 'medium' | 'complex'
}

export interface GenerationContext {
  difficulty: number // 0.8 à 3.5
  level: number
  age: number
  previousOperator?: string
  consecutiveErrors: number
  accuracy: number
}

// ----------------------------
// Stratégie d'addition avancée
// ----------------------------

export class AdvancedAddStrategy implements OperatorStrategy {
  /**
   * 🎯 Génère une addition intelligente selon la difficulté
   * 
   * Logique:
   * - Difficulté basse (0.8-1.2): petits nombres (1-10)
   * - Difficulté moyenne (1.2-2.0): nombres moyens (5-20)
   * - Difficulté haute (2.0-3.5): grands nombres (10-50+)
   */
  generate(difficulty: number, rng: RNG, context?: GenerationContext): { target: number; solution: [number, number] } {
    const age = context?.age || 6
    
    // Adapter la plage selon l'âge et la difficulté
    let minVal = 1
    let maxVal = 10
    
    if (age <= 5) {
      // Enfants de 5 ans: petits nombres
      maxVal = Math.floor(5 + difficulty * 3) // 5-15
    } else if (age === 6) {
      // Enfants de 6 ans: nombres moyens
      maxVal = Math.floor(8 + difficulty * 6) // 8-30
    } else {
      // 7+ ans: nombres plus grands
      maxVal = Math.floor(10 + difficulty * 12) // 10-50
    }
    
    // Si beaucoup d'erreurs, réduire la complexité
    if (context?.consecutiveErrors && context.consecutiveErrors > 2) {
      maxVal = Math.floor(maxVal * 0.7)
    }
    
    // Générer deux nombres
    const a = minVal + Math.floor(rng.next() * (maxVal - minVal + 1))
    const b = minVal + Math.floor(rng.next() * (maxVal - minVal + 1))
    
    const target = a + b
    
    return { target, solution: [a, b] }
  }

  eval(a: number, b: number): number {
    return a + b
  }

  isValid(a: number, b: number): boolean {
    return a > 0 && b > 0
  }

  /**
   * 🎯 Génère une décomposition longue pour l'addition
   */
  generateLongDecomposition(
    target: number, 
    count: number, 
    difficulty: number, 
    rng: RNG
  ): number[] {
    const numbers: number[] = []
    let remaining = target
    
    // Générer count-1 nombres
    for (let i = 0; i < count - 1; i++) {
      // S'assurer qu'il reste assez pour les nombres suivants
      const maxForThis = Math.floor(remaining - (count - i - 1))
      const minForThis = 1
      
      if (maxForThis > minForThis) {
        const num = minForThis + Math.floor(rng.next() * (maxForThis - minForThis))
        numbers.push(num)
        remaining -= num
      } else {
        numbers.push(1)
        remaining -= 1
      }
    }
    
    // Le dernier nombre est ce qui reste
    if (remaining > 0) {
      numbers.push(remaining)
    }
    
    // Mélanger pour que ce ne soit pas toujours dans l'ordre
    return this.shuffle(numbers, rng)
  }

  private shuffle(arr: number[], rng: RNG): number[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng.next() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }
}

// ----------------------------
// Stratégie de soustraction avancée
// ----------------------------

export class AdvancedSubStrategy implements OperatorStrategy {
  /**
   * 🎯 Génère une soustraction intelligente
   * 
   * Garantit toujours un résultat positif
   */
  generate(difficulty: number, rng: RNG, context?: GenerationContext): { target: number; solution: [number, number] } {
    const age = context?.age || 6
    
    // Adapter la plage selon l'âge
    let minResult = 1
    let maxResult = 10
    
    if (age <= 5) {
      maxResult = Math.floor(5 + difficulty * 2) // 5-10
    } else if (age === 6) {
      maxResult = Math.floor(8 + difficulty * 4) // 8-20
    } else {
      maxResult = Math.floor(10 + difficulty * 8) // 10-35
    }
    
    // Si beaucoup d'erreurs, simplifier
    if (context?.consecutiveErrors && context.consecutiveErrors > 2) {
      maxResult = Math.floor(maxResult * 0.6)
    }
    
    // Générer le résultat (target)
    const result = minResult + Math.floor(rng.next() * (maxResult - minResult + 1))
    
    // Générer b (nombre à soustraire)
    const maxB = Math.floor((maxResult - result) * (1 + difficulty * 0.3))
    const b = 1 + Math.floor(rng.next() * Math.max(1, maxB))
    
    // a = result + b
    const a = result + b
    
    return { target: result, solution: [a, b] }
  }

  eval(a: number, b: number): number {
    return a - b
  }

  isValid(a: number, b: number): boolean {
    return a >= b && b > 0 // Éviter les résultats négatifs
  }
}

// ----------------------------
// Stratégie de multiplication avancée
// ----------------------------

export class AdvancedMulStrategy implements OperatorStrategy {
  /**
   * 🎯 Génère une multiplication intelligente
   * 
   * Commence avec les tables simples, progresse vers des nombres plus complexes
   */
  generate(difficulty: number, rng: RNG, context?: GenerationContext): { target: number; solution: [number, number] } {
    const age = context?.age || 6
    
    // Tables de multiplication selon l'âge et la difficulté
    let minFactor = 2
    let maxFactor = 5
    
    if (age <= 5) {
      // Très jeunes: tables de 2 et 3
      maxFactor = Math.floor(2 + difficulty * 0.5) // 2-3
    } else if (age === 6) {
      // 6 ans: tables jusqu'à 5-7
      maxFactor = Math.floor(3 + difficulty * 1.5) // 3-7
    } else {
      // 7+ ans: tables jusqu'à 10+
      maxFactor = Math.floor(4 + difficulty * 2.5) // 4-12
    }
    
    // Si erreurs, revenir aux tables simples
    if (context?.consecutiveErrors && context.consecutiveErrors > 2) {
      maxFactor = Math.min(maxFactor, 4)
    }
    
    // Générer deux facteurs
    const a = minFactor + Math.floor(rng.next() * (maxFactor - minFactor + 1))
    const b = minFactor + Math.floor(rng.next() * (maxFactor - minFactor + 1))
    
    const target = a * b
    
    return { target, solution: [a, b] }
  }

  eval(a: number, b: number): number {
    return a * b
  }

  isValid(a: number, b: number): boolean {
    return a > 1 && b > 1 // Au moins 2x2
  }
}

// ----------------------------
// Stratégie de division avancée
// ----------------------------

export class AdvancedDivStrategy implements OperatorStrategy {
  /**
   * 🎯 Génère une division intelligente
   * 
   * Garantit toujours une division exacte (pas de décimales)
   */
  generate(difficulty: number, rng: RNG, context?: GenerationContext): { target: number; solution: [number, number] } {
    const age = context?.age || 6
    
    // Diviseurs selon l'âge et la difficulté
    let minDivisor = 2
    let maxDivisor = 4
    let maxQuotient = 5
    
    if (age <= 5) {
      // Très jeunes: divisions simples par 2
      maxDivisor = 2
      maxQuotient = Math.floor(3 + difficulty * 1) // 3-5
    } else if (age === 6) {
      // 6 ans: divisions par 2-5
      maxDivisor = Math.floor(3 + difficulty * 0.8) // 3-5
      maxQuotient = Math.floor(4 + difficulty * 2) // 4-10
    } else {
      // 7+ ans: divisions plus complexes
      maxDivisor = Math.floor(4 + difficulty * 1.5) // 4-9
      maxQuotient = Math.floor(5 + difficulty * 3) // 5-15
    }
    
    // Si erreurs, simplifier
    if (context?.consecutiveErrors && context.consecutiveErrors > 2) {
      maxDivisor = 3
      maxQuotient = 5
    }
    
    // Générer le diviseur (b) et le quotient (result)
    const b = minDivisor + Math.floor(rng.next() * (maxDivisor - minDivisor + 1))
    const result = 1 + Math.floor(rng.next() * maxQuotient)
    
    // a = b × result
    const a = b * result
    
    return { target: result, solution: [a, b] }
  }

  eval(a: number, b: number): number {
    return b !== 0 ? a / b : Number.NaN
  }

  isValid(a: number, b: number): boolean {
    return b > 0 && a % b === 0 // Division exacte uniquement
  }
}

// ----------------------------
// Stratégie mixte avancée pour décompositions longues
// ----------------------------

export class AdvancedMixedStrategy implements OperatorStrategy {
  private addStrategy: AdvancedAddStrategy

  constructor() {
    this.addStrategy = new AdvancedAddStrategy()
  }

  /**
   * 🎯 Génère une décomposition longue (addition de 3+ nombres)
   */
  generate(difficulty: number, rng: RNG, context?: GenerationContext): { target: number; solution: [number, number] } {
    const age = context?.age || 6
    
    // Nombre de termes selon la difficulté
    let termCount = 3
    if (difficulty > 2.0) {
      termCount = 3 + Math.floor(rng.next() * 2) // 3-4 termes
    }
    
    // Générer un target approprié
    const maxPerTerm = age <= 5 ? 5 : age === 6 ? 8 : 12
    const target = termCount * 2 + Math.floor(rng.next() * (maxPerTerm * termCount))
    
    // Générer la décomposition
    const decomposition = this.addStrategy.generateLongDecomposition(
      target,
      termCount,
      difficulty,
      rng
    )
    
    // Retourner les deux premiers comme "solution de base"
    return { 
      target, 
      solution: [decomposition[0], decomposition[1]] as [number, number]
    }
  }

  eval(a: number, b: number): number {
    return a + b
  }

  isValid(a: number, b: number): boolean {
    return a > 0 && b > 0
  }

  /**
   * 🎯 Vérifie si une liste de nombres forme une décomposition valide
   */
  validateDecomposition(numbers: number[], target: number): boolean {
    const sum = numbers.reduce((acc, n) => acc + n, 0)
    return Math.abs(sum - target) < 1e-6
  }
}

// ----------------------------
// Factory pour créer les stratégies
// ----------------------------

export class OperatorStrategyFactory {
  private static instances: Map<string, OperatorStrategy> = new Map()

  static getStrategy(operator: string): OperatorStrategy {
    if (!this.instances.has(operator)) {
      switch (operator) {
        case 'ADD':
          this.instances.set(operator, new AdvancedAddStrategy())
          break
        case 'SUB':
          this.instances.set(operator, new AdvancedSubStrategy())
          break
        case 'MUL':
          this.instances.set(operator, new AdvancedMulStrategy())
          break
        case 'DIV':
          this.instances.set(operator, new AdvancedDivStrategy())
          break
        case 'MIXED':
          this.instances.set(operator, new AdvancedMixedStrategy())
          break
        default:
          this.instances.set(operator, new AdvancedAddStrategy())
      }
    }
    
    return this.instances.get(operator)!
  }

  /**
   * 🎯 Génère une solution avec contexte complet
   */
  static generateWithContext(
    operator: string,
    difficulty: number,
    rng: RNG,
    context: GenerationContext
  ): { target: number; solution: [number, number] } {
    const strategy = this.getStrategy(operator) as {
      generate: (difficulty: number, rng: RNG, context?: GenerationContext) => { target: number; solution: [number, number] }
    }

    return strategy.generate(difficulty, rng, context)
  }
}

// ----------------------------
// Validateur de solvabilité
// ----------------------------

export class SolvabilityValidator {
  /**
   * 🎯 Vérifie si une grille contient la solution
   */
  static validateGrid(
    grid: number[],
    target: number,
    operator: string,
    allowLongDecompositions: boolean = true
  ): { solvable: boolean; solutions: number[][] } {
    const strategy = OperatorStrategyFactory.getStrategy(operator)
    const solutions: number[][] = []
    
    // Vérifier toutes les paires
    for (let i = 0; i < grid.length; i++) {
      for (let j = i + 1; j < grid.length; j++) {
        const a = grid[i]
        const b = grid[j]
        
        if (strategy.isValid(a, b)) {
          const result = strategy.eval(a, b)
          if (Math.abs(result - target) < 1e-6) {
            solutions.push([a, b])
          }
        }
        
        // Essayer aussi dans l'autre sens pour les opérations non commutatives
        if (operator === 'SUB' || operator === 'DIV') {
          if (strategy.isValid(b, a)) {
            const result = strategy.eval(b, a)
            if (Math.abs(result - target) < 1e-6) {
              solutions.push([b, a])
            }
          }
        }
      }
    }
    
    // Vérifier les décompositions longues si autorisées
    if (allowLongDecompositions && (operator === 'ADD' || operator === 'MIXED')) {
      this.findLongDecompositions(grid, target, solutions)
    }
    
    return {
      solvable: solutions.length > 0,
      solutions
    }
  }

  /**
   * 🎯 Trouve toutes les décompositions longues possibles
   */
  private static findLongDecompositions(
    grid: number[],
    target: number,
    solutions: number[][]
  ): void {
    // Vérifier les triplets
    for (let i = 0; i < grid.length; i++) {
      for (let j = i + 1; j < grid.length; j++) {
        for (let k = j + 1; k < grid.length; k++) {
          const sum = grid[i] + grid[j] + grid[k]
          if (Math.abs(sum - target) < 1e-6) {
            solutions.push([grid[i], grid[j], grid[k]])
          }
        }
      }
    }
    
    // Vérifier les quadruplets pour les très hauts niveaux
    if (grid.length >= 4) {
      for (let i = 0; i < grid.length; i++) {
        for (let j = i + 1; j < grid.length; j++) {
          for (let k = j + 1; k < grid.length; k++) {
            for (let l = k + 1; l < grid.length; l++) {
              const sum = grid[i] + grid[j] + grid[k] + grid[l]
              if (Math.abs(sum - target) < 1e-6) {
                solutions.push([grid[i], grid[j], grid[k], grid[l]])
              }
            }
          }
        }
      }
    }
  }

  /**
   * 🎯 Compte le nombre de solutions possibles
   */
  static countSolutions(
    grid: number[],
    target: number,
    operator: string,
    allowLongDecompositions: boolean = true
  ): number {
    const result = this.validateGrid(grid, target, operator, allowLongDecompositions)
    return result.solutions.length
  }

  /**
   * 🎯 Trouve la solution la plus simple
   */
  static findSimplestSolution(
    grid: number[],
    target: number,
    operator: string
  ): number[] | null {
    const result = this.validateGrid(grid, target, operator, true)
    
    if (result.solutions.length === 0) {
      return null
    }
    
    // Trier par nombre de termes (solutions plus courtes en premier)
    result.solutions.sort((a, b) => a.length - b.length)
    
    return result.solutions[0]
  }
}


