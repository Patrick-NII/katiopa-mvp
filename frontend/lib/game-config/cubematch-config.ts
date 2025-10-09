/**
 * 🎯 CUBEMATCH GAME CONFIGURATION
 * 
 * Configuration centralisée pour le jeu CubeMatch
 * Intègre les concepts de la refonte proposée dans le système existant
 */

// ----------------------------
// Types & contrats
// ----------------------------

export type Operator = 'ADD' | 'SUB' | 'MUL' | 'DIV' | 'MIXED'

export interface RNG {
  next(): number // 0..1
}

export interface OperatorStrategy {
  // Reçoit une difficulté continue et renvoie un couple solvable et un target
  generate(difficulty: number, rng: RNG): { target: number; solution: [number, number] }
  // Évalue l'opération a (op) b
  eval(a: number, b: number): number
  // Vérifie si une opération est valide (pour les décompositions longues)
  isValid(a: number, b: number): boolean
}

export interface DifficultyModel {
  // Recalcule la difficulté continue après un essai
  update(params: {
    prev: number
    level: number
    age: number
    wasSuccess: boolean
    accuracyWindow: number // 0..1 (sur fenêtre courte)
    consecutiveErrors: number
  }): number
}

export interface ScoringModel {
  // Calcule les points ajoutés pour une réussite instantanée
  points(params: {
    level: number
    difficulty: number
    timeSinceRoundStartMs: number
    currentCombo: number
    accuracy: number
    isLongDecomposition: boolean
  }): number
}

export interface GridModel {
  size: number // N x N
  distractorRange(difficulty: number): { min: number; max: number }
  // Nombre de distracteurs à générer
  distractorCount(difficulty: number): number
}

export interface SelectionRules {
  maxCells: number // typiquement 2 pour a (op) b, mais peut être plus pour les décompositions longues
  allowLongDecompositions: boolean
  longDecompositionMinCells: number
}

export interface TimerModel {
  // Temps de validation selon niveau et difficulté
  getValidationTime(params: {
    level: number
    difficulty: number
    age: number
  }): number
}

export interface GameConfig {
  // Configuration de base
  gameDurationSec: number
  allowedOperators: Operator[]
  operatorWeights: Partial<Record<Operator, number>> // pondération de tirage
  
  // Modèles configurables
  operators: Record<Operator, OperatorStrategy>
  difficultyModel: DifficultyModel
  scoring: ScoringModel
  grid: GridModel
  selection: SelectionRules
  timer: TimerModel
  
  // Factories
  rngFactory?: () => RNG
}

// ----------------------------
// RNG par défaut (non déterministe) & helpers
// ----------------------------

class DefaultRNG implements RNG {
  next() {
    return Math.random()
  }
}

export function pickWeighted<T>(items: T[], weights: number[], rng: RNG): T {
  const sum = weights.reduce((a, b) => a + b, 0)
  let r = rng.next() * sum
  for (let i = 0; i < items.length; i++) {
    if ((r -= weights[i]) <= 0) return items[i]
  }
  return items[items.length - 1]
}

export function shuffle<T>(arr: T[], rng: RNG): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

// ----------------------------
// Stratégies opérateurs (paramétriques)
// ----------------------------

const AddStrategy: OperatorStrategy = {
  generate(d, rng) {
    // bornes croissent avec d, sans valeurs en dur
    const span = 8 + d * 10
    const a = 1 + Math.floor(rng.next() * span)
    const b = 1 + Math.floor(rng.next() * span)
    return { target: a + b, solution: [a, b] }
  },
  eval(a, b) {
    return a + b
  },
  isValid(a, b) {
    return true // L'addition est toujours valide
  }
}

const SubStrategy: OperatorStrategy = {
  generate(d, rng) {
    const base = 6 + d * 12
    const a = 2 + Math.floor(rng.next() * (base + 4))
    const b = 1 + Math.floor(rng.next() * Math.max(1, a - 1))
    return { target: a - b, solution: [a, b] }
  },
  eval(a, b) {
    return a - b
  },
  isValid(a, b) {
    return a >= b // Éviter les résultats négatifs
  }
}

const MulStrategy: OperatorStrategy = {
  generate(d, rng) {
    // multiplicandes augmentent avec d, mais restent raisonnables pour 5–7 ans
    const hi = 3 + d * 3 // à d≈1 → 6, d≈2 → 9
    const a = 2 + Math.floor(rng.next() * hi)
    const b = 2 + Math.floor(rng.next() * hi)
    return { target: a * b, solution: [a, b] }
  },
  eval(a, b) {
    return a * b
  },
  isValid(a, b) {
    return a > 0 && b > 0 // Éviter la multiplication par zéro
  }
}

const DivStrategy: OperatorStrategy = {
  generate(d, rng) {
    const hi = 3 + d * 3
    const b = 2 + Math.floor(rng.next() * hi)
    const a = b * (2 + Math.floor(rng.next() * hi))
    return { target: a / b, solution: [a, b] }
  },
  eval(a, b) {
    return b !== 0 ? a / b : Number.NaN
  },
  isValid(a, b) {
    return b !== 0 && a % b === 0 // Division exacte uniquement
  }
}

// Stratégie mixte pour les décompositions longues
const MixedStrategy: OperatorStrategy = {
  generate(d, rng) {
    // Pour les décompositions longues, on génère plusieurs nombres qui s'additionnent
    const count = 2 + Math.floor(rng.next() * 2) // 2 ou 3 nombres
    const numbers: number[] = []
    let sum = 0
    
    for (let i = 0; i < count; i++) {
      const num = 1 + Math.floor(rng.next() * (5 + d * 3))
      numbers.push(num)
      sum += num
    }
    
    return { target: sum, solution: [numbers[0], numbers[1]] }
  },
  eval(a, b) {
    return a + b // Par défaut, addition pour les décompositions longues
  },
  isValid(a, b) {
    return true
  }
}

// ----------------------------
// Modèles adaptatifs & scoring (paramétriques)
// ----------------------------
// NOTE: Les modèles par défaut sont définis dans adaptive-models.ts
// Ces implémentations simples sont conservées pour la rétrocompatibilité

const DefaultDifficultyModel: DifficultyModel = {
  update({ prev, level, age, wasSuccess, accuracyWindow, consecutiveErrors }) {
    const ageFactor = age <= 5 ? 0.5 : age === 6 ? 0.75 : 1
    const momentum = wasSuccess ? 0.15 : -0.1
    const accuracyBoost = (accuracyWindow - 0.8) * 0.2 // >80% pousse un peu
    const levelTrend = level > 1 ? 0.05 : 0
    const errorPenalty = consecutiveErrors > 0 ? -0.05 * consecutiveErrors : 0
    
    const next = prev + (momentum + accuracyBoost + levelTrend + errorPenalty) * ageFactor
    return clamp(next, 0.8, 3.5) // bornes souples et configurables
  }
}

const DefaultScoringModel: ScoringModel = {
  points({ level, difficulty, timeSinceRoundStartMs, currentCombo, accuracy, isLongDecomposition }) {
    const base = 50 + level * 5
    const diffBonus = 1 + (difficulty - 1) * 0.2
    const timeS = Math.max(0.5, timeSinceRoundStartMs / 1000)
    const speed = clamp(1.6 - timeS * 0.06, 1.0, 1.6) // plus vite → multiplicateur
    const combo = 1 + Math.min(0.02 * currentCombo, 0.6)
    const accuracyBonus = accuracy > 80 ? 1.1 : accuracy > 60 ? 1.05 : 1.0
    const longDecompBonus = isLongDecomposition ? 1.3 : 1.0 // Bonus pour les décompositions longues
    
    return Math.round(base * diffBonus * speed * combo * accuracyBonus * longDecompBonus)
  }
}

const DefaultGridModel: GridModel = {
  size: 6,
  distractorRange(d) {
    const span = 10 + d * 35 // valeurs distractives plus larges quand d ↑
    return { min: 1, max: Math.floor(span) }
  },
  distractorCount(d) {
    // Plus de distracteurs avec la difficulté, mais pas trop
    return Math.min(8, 4 + Math.floor(d))
  }
}

const DefaultSelection: SelectionRules = { 
  maxCells: 2,
  allowLongDecompositions: true,
  longDecompositionMinCells: 3
}

const DefaultTimer: TimerModel = {
  getValidationTime({ level, difficulty, age }) {
    const baseTime = 5000 // 5 secondes de base
    const levelMultiplier = Math.max(0.5, 1 - (level - 1) * 0.1) // Réduit avec le niveau
    const difficultyMultiplier = {
      'EASY': 1.5,
      'MEDIUM': 1.0,
      'HARD': 0.7
    }[difficulty >= 2 ? 'HARD' : difficulty >= 1.5 ? 'MEDIUM' : 'EASY'] || 1.0
    const ageMultiplier = age <= 5 ? 1.3 : age === 6 ? 1.1 : 1.0
    
    return Math.max(2000, baseTime * levelMultiplier * difficultyMultiplier * ageMultiplier)
  }
}

// ----------------------------
// Configuration par défaut
// ----------------------------

export const DefaultConfig: GameConfig = {
  gameDurationSec: 60,
  allowedOperators: ['ADD', 'SUB', 'MUL', 'DIV', 'MIXED'],
  operatorWeights: { 
    ADD: 1, 
    SUB: 1, 
    MUL: 0.8, // Un peu moins de multiplication pour les jeunes
    DIV: 0.6, // Encore moins de division
    MIXED: 0.3 // Décompositions longues occasionnelles
  },
  operators: { 
    ADD: AddStrategy, 
    SUB: SubStrategy, 
    MUL: MulStrategy, 
    DIV: DivStrategy,
    MIXED: MixedStrategy
  },
  difficultyModel: DefaultDifficultyModel,
  scoring: DefaultScoringModel,
  grid: DefaultGridModel,
  selection: DefaultSelection,
  timer: DefaultTimer,
  rngFactory: () => new DefaultRNG()
}

// ----------------------------
// Helpers de configuration
// ----------------------------

export function mergeConfig(base: GameConfig, override: Partial<GameConfig>): GameConfig {
  return {
    ...base,
    ...override,
    operators: { ...base.operators, ...(override.operators ?? {}) },
    operatorWeights: { ...base.operatorWeights, ...(override.operatorWeights ?? {}) },
    grid: { ...base.grid, ...(override.grid ?? {}) },
    selection: { ...base.selection, ...(override.selection ?? {}) },
    timer: { ...base.timer, ...(override.timer ?? {}) },
    rngFactory: override.rngFactory ?? base.rngFactory
  }
}

export function createAgeSpecificConfig(age: number): Partial<GameConfig> {
  if (age <= 5) {
    return {
      operatorWeights: { ADD: 1.5, SUB: 0.8, MUL: 0.3, DIV: 0.1, MIXED: 0.2 },
      grid: { ...DefaultConfig.grid, size: 5 }, // Grille plus petite
      selection: { ...DefaultConfig.selection, maxCells: 2, allowLongDecompositions: false }
    }
  } else if (age === 6) {
    return {
      operatorWeights: { ADD: 1.2, SUB: 1, MUL: 0.6, DIV: 0.4, MIXED: 0.3 },
      grid: { ...DefaultConfig.grid, size: 6 },
      selection: { ...DefaultConfig.selection, maxCells: 2, allowLongDecompositions: true }
    }
  } else {
    return {
      operatorWeights: { ADD: 1, SUB: 1, MUL: 0.8, DIV: 0.6, MIXED: 0.4 },
      grid: { ...DefaultConfig.grid, size: 6 },
      selection: { ...DefaultConfig.selection, maxCells: 3, allowLongDecompositions: true }
    }
  }
}


