/**
 * 🎯 ADAPTIVE MODELS - PHASE 3
 * 
 * Modèles adaptatifs avancés pour la difficulté, le scoring et le timer
 * S'ajustent intelligemment selon les performances de l'utilisateur
 */

import { DifficultyModel, ScoringModel, TimerModel, clamp } from './cubematch-config'

// ----------------------------
// Types pour les modèles adaptatifs
// ----------------------------

export interface PerformanceWindow {
  recentAttempts: number
  recentSuccesses: number
  averageResponseTime: number
  longestStreak: number
  currentStreak: number
}

export interface AdaptationConfig {
  // Vitesse d'adaptation
  adaptationSpeed: 'slow' | 'medium' | 'fast'
  
  // Limites
  minDifficulty: number
  maxDifficulty: number
  
  // Seuils
  successThreshold: number // % de succès pour augmenter
  failureThreshold: number // % d'échec pour diminuer
  
  // Facteurs d'ajustement
  ageFactor: number
  levelFactor: number
  streakBonus: boolean
}

// ----------------------------
// Modèle de difficulté adaptatif avancé
// ----------------------------

export class AdvancedDifficultyModel implements DifficultyModel {
  private config: AdaptationConfig
  private performanceHistory: PerformanceWindow[]
  
  constructor(config: Partial<AdaptationConfig> = {}) {
    this.config = {
      adaptationSpeed: 'medium',
      minDifficulty: 0.8,
      maxDifficulty: 3.5,
      successThreshold: 0.75,
      failureThreshold: 0.50,
      ageFactor: 1.0,
      levelFactor: 1.0,
      streakBonus: true,
      ...config
    }
    
    this.performanceHistory = []
  }

  /**
   * 🎯 Met à jour la difficulté selon les performances
   */
  update(params: {
    prev: number
    level: number
    age: number
    wasSuccess: boolean
    accuracyWindow: number
    consecutiveErrors: number
  }): number {
    const { prev, level, age, wasSuccess, accuracyWindow, consecutiveErrors } = params
    
    // Calculer le facteur d'âge (plus jeune = progression plus lente)
    const ageFactor = this.calculateAgeFactor(age)
    
    // Calculer le momentum selon le résultat
    const momentum = this.calculateMomentum(wasSuccess, accuracyWindow, consecutiveErrors)
    
    // Ajustement basé sur la précision récente
    const accuracyAdjustment = this.calculateAccuracyAdjustment(accuracyWindow)
    
    // Bonus/pénalité selon le niveau
    const levelTrend = this.calculateLevelTrend(level, prev)
    
    // Pénalité pour erreurs consécutives (réduit la difficulté plus rapidement)
    const errorPenalty = this.calculateErrorPenalty(consecutiveErrors)
    
    // Bonus de streak si activé
    const streakBonus = this.config.streakBonus && wasSuccess ? 0.02 : 0
    
    // Vitesse d'adaptation
    const speedMultiplier = this.getSpeedMultiplier()
    
    // Calculer la nouvelle difficulté
    const rawDifficulty = prev + (
      momentum + 
      accuracyAdjustment + 
      levelTrend + 
      errorPenalty + 
      streakBonus
    ) * ageFactor * speedMultiplier
    
    // Appliquer les limites
    const newDifficulty = clamp(rawDifficulty, this.config.minDifficulty, this.config.maxDifficulty)
    
    // Logger pour débogage
    console.log(`📊 Difficulté: ${prev.toFixed(2)} → ${newDifficulty.toFixed(2)} | Précision: ${(accuracyWindow * 100).toFixed(0)}% | Erreurs: ${consecutiveErrors}`)
    
    return newDifficulty
  }

  /**
   * 🎯 Calcule le facteur d'âge
   */
  private calculateAgeFactor(age: number): number {
    if (age <= 5) return 0.5 // Très jeunes: progression lente
    if (age === 6) return 0.75 // 6 ans: progression modérée
    if (age === 7) return 1.0 // 7 ans: progression normale
    return 1.2 // 8+ ans: progression plus rapide
  }

  /**
   * 🎯 Calcule le momentum
   */
  private calculateMomentum(wasSuccess: boolean, accuracyWindow: number, consecutiveErrors: number): number {
    if (wasSuccess) {
      // Succès: augmenter progressivement
      if (accuracyWindow > 0.85) return 0.20 // Excellent
      if (accuracyWindow > 0.75) return 0.15 // Très bien
      return 0.10 // Bien
    } else {
      // Échec: diminuer selon la sévérité
      if (consecutiveErrors > 3) return -0.25 // Beaucoup d'erreurs
      if (consecutiveErrors > 1) return -0.15 // Quelques erreurs
      return -0.10 // Première erreur
    }
  }

  /**
   * 🎯 Calcule l'ajustement basé sur la précision
   */
  private calculateAccuracyAdjustment(accuracyWindow: number): number {
    // Bonus si très précis, pénalité si imprécis
    if (accuracyWindow > 0.90) return 0.10 // Excellence
    if (accuracyWindow > 0.80) return 0.05 // Très bien
    if (accuracyWindow > 0.70) return 0.00 // Neutre
    if (accuracyWindow > 0.60) return -0.05 // Un peu difficile
    if (accuracyWindow > 0.50) return -0.10 // Difficile
    return -0.15 // Très difficile
  }

  /**
   * 🎯 Calcule la tendance du niveau
   */
  private calculateLevelTrend(level: number, currentDifficulty: number): number {
    // Augmentation progressive avec le niveau, mais ralentit si déjà difficile
    if (level <= 5) return 0.02
    if (level <= 10) return currentDifficulty < 2.0 ? 0.03 : 0.01
    if (level <= 20) return currentDifficulty < 2.5 ? 0.04 : 0.02
    return currentDifficulty < 3.0 ? 0.05 : 0.01
  }

  /**
   * 🎯 Calcule la pénalité d'erreur
   */
  private calculateErrorPenalty(consecutiveErrors: number): number {
    if (consecutiveErrors === 0) return 0
    if (consecutiveErrors === 1) return -0.05
    if (consecutiveErrors === 2) return -0.10
    if (consecutiveErrors === 3) return -0.15
    return -0.20 // 4+ erreurs consécutives
  }

  /**
   * 🎯 Obtient le multiplicateur de vitesse
   */
  private getSpeedMultiplier(): number {
    switch (this.config.adaptationSpeed) {
      case 'slow': return 0.5
      case 'fast': return 1.5
      case 'medium':
      default: return 1.0
    }
  }

  /**
   * 📊 Obtient le niveau de difficulté en texte
   */
  getDifficultyLabel(difficulty: number): string {
    if (difficulty < 1.0) return 'Très Facile'
    if (difficulty < 1.3) return 'Facile'
    if (difficulty < 1.7) return 'Moyen'
    if (difficulty < 2.2) return 'Difficile'
    if (difficulty < 2.8) return 'Très Difficile'
    return 'Expert'
  }
}

// ----------------------------
// Modèle de scoring adaptatif avancé
// ----------------------------

export class AdvancedScoringModel implements ScoringModel {
  private basePoints: number
  private maxMultiplier: number
  
  constructor(basePoints: number = 50, maxMultiplier: number = 5.0) {
    this.basePoints = basePoints
    this.maxMultiplier = maxMultiplier
  }

  /**
   * 🎯 Calcule les points avec multiplicateurs avancés
   */
  points(params: {
    level: number
    difficulty: number
    timeSinceRoundStartMs: number
    currentCombo: number
    accuracy: number
    isLongDecomposition: boolean
  }): number {
    const { level, difficulty, timeSinceRoundStartMs, currentCombo, accuracy, isLongDecomposition } = params
    
    // Points de base (augmentent avec le niveau)
    const base = this.basePoints + (level * 5)
    
    // Bonus de difficulté (exponentiel)
    const difficultyBonus = this.calculateDifficultyBonus(difficulty)
    
    // Bonus de vitesse (inversement proportionnel au temps)
    const speedBonus = this.calculateSpeedBonus(timeSinceRoundStartMs)
    
    // Bonus de combo (exponentiel avec cap)
    const comboBonus = this.calculateComboBonus(currentCombo)
    
    // Bonus de précision
    const accuracyBonus = this.calculateAccuracyBonus(accuracy)
    
    // Bonus de décomposition longue
    const longDecompBonus = isLongDecomposition ? 1.5 : 1.0
    
    // Multiplicateur total (avec cap)
    const totalMultiplier = Math.min(
      difficultyBonus * speedBonus * comboBonus * accuracyBonus * longDecompBonus,
      this.maxMultiplier
    )
    
    // Calculer les points finaux
    const finalPoints = Math.round(base * totalMultiplier)
    
    // Logger pour débogage
    console.log(`💰 Points: ${finalPoints} | Base: ${base} | Mult: ${totalMultiplier.toFixed(2)} (Diff: ${difficultyBonus.toFixed(2)}, Speed: ${speedBonus.toFixed(2)}, Combo: ${comboBonus.toFixed(2)}, Acc: ${accuracyBonus.toFixed(2)})`)
    
    return finalPoints
  }

  /**
   * 🎯 Calcule le bonus de difficulté
   */
  private calculateDifficultyBonus(difficulty: number): number {
    // Exponentiel mais progressif
    // Difficulté 1.0 = 1.0x
    // Difficulté 2.0 = 1.5x
    // Difficulté 3.0 = 2.0x
    return 1.0 + (difficulty - 1.0) * 0.4
  }

  /**
   * 🎯 Calcule le bonus de vitesse
   */
  private calculateSpeedBonus(timeMs: number): number {
    const timeS = timeMs / 1000
    
    // Très rapide (< 2s) = 1.8x
    // Rapide (< 4s) = 1.5x
    // Normal (< 6s) = 1.3x
    // Lent (< 8s) = 1.1x
    // Très lent (> 8s) = 1.0x
    
    if (timeS < 2) return 1.8
    if (timeS < 4) return 1.5
    if (timeS < 6) return 1.3
    if (timeS < 8) return 1.1
    return 1.0
  }

  /**
   * 🎯 Calcule le bonus de combo
   */
  private calculateComboBonus(combo: number): number {
    // Bonus exponentiel avec cap
    // Combo 0-2: 1.0x
    // Combo 3-5: 1.1-1.3x
    // Combo 6-10: 1.4-1.8x
    // Combo 11+: cap à 2.0x
    
    if (combo <= 2) return 1.0
    if (combo <= 5) return 1.0 + (combo - 2) * 0.1
    if (combo <= 10) return 1.3 + (combo - 5) * 0.1
    return Math.min(1.8 + (combo - 10) * 0.05, 2.0)
  }

  /**
   * 🎯 Calcule le bonus de précision
   */
  private calculateAccuracyBonus(accuracy: number): number {
    // Bonus pour haute précision
    if (accuracy >= 95) return 1.3
    if (accuracy >= 90) return 1.2
    if (accuracy >= 85) return 1.15
    if (accuracy >= 80) return 1.1
    if (accuracy >= 75) return 1.05
    return 1.0
  }

  /**
   * 📊 Calcule les points de pénalité pour une erreur
   */
  calculateErrorPenalty(params: {
    level: number
    consecutiveErrors: number
  }): number {
    const { level, consecutiveErrors } = params
    
    // Pénalité progressive
    const basePenalty = level * 2
    const multiplier = 1 + (consecutiveErrors * 0.5)
    
    return Math.round(basePenalty * multiplier)
  }
}

// ----------------------------
// Modèle de timer adaptatif avancé
// ----------------------------

export class AdvancedTimerModel implements TimerModel {
  private baseTime: number
  private minTime: number
  private maxTime: number
  
  constructor(baseTime: number = 5000, minTime: number = 2000, maxTime: number = 15000) {
    this.baseTime = baseTime
    this.minTime = minTime
    this.maxTime = maxTime
  }

  /**
   * ⏰ Calcule le temps de validation adaptatif
   */
  getValidationTime(params: {
    level: number
    difficulty: number
    age: number
  }): number {
    const { level, difficulty, age } = params
    
    // Facteur d'âge
    const ageFactor = this.calculateAgeTimeFactor(age)
    
    // Facteur de niveau (plus de temps au début, moins après)
    const levelFactor = this.calculateLevelTimeFactor(level)
    
    // Facteur de difficulté
    const difficultyFactor = this.calculateDifficultyTimeFactor(difficulty)
    
    // Calculer le temps
    const rawTime = this.baseTime * ageFactor * levelFactor * difficultyFactor
    
    // Appliquer les limites
    const validationTime = clamp(rawTime, this.minTime, this.maxTime)
    
    console.log(`⏰ Temps validation: ${(validationTime / 1000).toFixed(1)}s | Niveau: ${level} | Difficulté: ${difficulty.toFixed(1)} | Âge: ${age}`)
    
    return validationTime
  }

  /**
   * 🎯 Calcule le facteur de temps selon l'âge
   */
  private calculateAgeTimeFactor(age: number): number {
    if (age <= 5) return 1.5 // Plus jeunes: plus de temps
    if (age === 6) return 1.3
    if (age === 7) return 1.1
    return 1.0 // 8+ ans: temps standard
  }

  /**
   * 🎯 Calcule le facteur de temps selon le niveau
   */
  private calculateLevelTimeFactor(level: number): number {
    // Plus de temps au début, diminue progressivement
    if (level <= 3) return 1.4
    if (level <= 7) return 1.2
    if (level <= 15) return 1.0
    if (level <= 25) return 0.9
    return 0.8 // Niveaux élevés: moins de temps
  }

  /**
   * 🎯 Calcule le facteur de temps selon la difficulté
   */
  private calculateDifficultyTimeFactor(difficulty: number): number {
    // Plus difficile = plus de temps (mais modéré)
    if (difficulty < 1.0) return 0.8
    if (difficulty < 1.5) return 1.0
    if (difficulty < 2.0) return 1.1
    if (difficulty < 2.5) return 1.2
    return 1.3 // Très difficile: un peu plus de temps
  }

  /**
   * ⏰ Calcule le temps pour le timer de jeu global
   */
  getGameDuration(params: {
    age: number
    difficulty: number
  }): number {
    const { age, difficulty } = params
    
    // Durée de base: 60 secondes
    let baseDuration = 60
    
    // Ajuster selon l'âge
    if (age <= 5) baseDuration = 45
    else if (age === 6) baseDuration = 60
    else baseDuration = 75
    
    // Ajuster selon la difficulté (plus facile = moins de temps)
    if (difficulty < 1.0) baseDuration *= 0.8
    else if (difficulty > 2.0) baseDuration *= 1.2
    
    return baseDuration
  }
}

// ----------------------------
// Factory pour créer les modèles adaptatifs
// ----------------------------

export class AdaptiveModelsFactory {
  /**
   * 🎯 Crée un modèle de difficulté personnalisé
   */
  static createDifficultyModel(age: number, config?: Partial<AdaptationConfig>): AdvancedDifficultyModel {
    const defaultConfig: Partial<AdaptationConfig> = {}
    
    // Adapter selon l'âge
    if (age <= 5) {
      defaultConfig.adaptationSpeed = 'slow'
      defaultConfig.maxDifficulty = 2.5
    } else if (age === 6) {
      defaultConfig.adaptationSpeed = 'medium'
      defaultConfig.maxDifficulty = 3.0
    } else {
      defaultConfig.adaptationSpeed = 'medium'
      defaultConfig.maxDifficulty = 3.5
    }
    
    return new AdvancedDifficultyModel({ ...defaultConfig, ...config })
  }

  /**
   * 🎯 Crée un modèle de scoring personnalisé
   */
  static createScoringModel(age: number): AdvancedScoringModel {
    // Points de base selon l'âge
    const basePoints = age <= 5 ? 30 : age === 6 ? 50 : 75
    const maxMultiplier = age <= 5 ? 3.0 : age === 6 ? 4.0 : 5.0
    
    return new AdvancedScoringModel(basePoints, maxMultiplier)
  }

  /**
   * ⏰ Crée un modèle de timer personnalisé
   */
  static createTimerModel(age: number): AdvancedTimerModel {
    const baseTime = age <= 5 ? 7000 : age === 6 ? 5000 : 4000
    const minTime = age <= 5 ? 3000 : 2000
    const maxTime = age <= 5 ? 20000 : 15000
    
    return new AdvancedTimerModel(baseTime, minTime, maxTime)
  }
}

// ----------------------------
// Analyseur de performance
// ----------------------------

export class PerformanceAnalyzer {
  /**
   * 📊 Analyse les performances et recommande des ajustements
   */
  static analyzePerformance(params: {
    accuracy: number
    averageResponseTime: number
    currentDifficulty: number
    level: number
    consecutiveErrors: number
  }): {
    recommendation: 'increase' | 'decrease' | 'maintain'
    reason: string
    suggestedAdjustment: number
  } {
    const { accuracy, averageResponseTime, currentDifficulty, level, consecutiveErrors } = params
    
    // Analyser la précision
    if (accuracy > 90 && consecutiveErrors === 0) {
      return {
        recommendation: 'increase',
        reason: 'Excellente précision - augmenter le défi',
        suggestedAdjustment: 0.2
      }
    }
    
    if (accuracy < 60 || consecutiveErrors > 3) {
      return {
        recommendation: 'decrease',
        reason: 'Difficulté trop élevée - réduire pour maintenir l\'engagement',
        suggestedAdjustment: -0.3
      }
    }
    
    if (accuracy > 75 && accuracy < 85 && averageResponseTime < 4000) {
      return {
        recommendation: 'increase',
        reason: 'Bonnes performances et réponses rapides',
        suggestedAdjustment: 0.1
      }
    }
    
    if (accuracy >= 70 && accuracy <= 85) {
      return {
        recommendation: 'maintain',
        reason: 'Zone de défi optimale',
        suggestedAdjustment: 0
      }
    }
    
    return {
      recommendation: 'maintain',
      reason: 'Performances stables',
      suggestedAdjustment: 0
    }
  }

  /**
   * 🎯 Détecte le niveau de flow (zone optimale)
   */
  static detectFlowState(params: {
    accuracy: number
    combo: number
    averageResponseTime: number
  }): {
    inFlow: boolean
    flowScore: number
    tips: string[]
  } {
    const { accuracy, combo, averageResponseTime } = params
    
    const tips: string[] = []
    let flowScore = 0
    
    // Précision idéale: 70-85%
    if (accuracy >= 70 && accuracy <= 85) {
      flowScore += 30
    } else if (accuracy > 85) {
      tips.push('Peut-être trop facile - augmenter la difficulté')
    } else {
      tips.push('Trop difficile - réduire la difficulté')
    }
    
    // Combo actif
    if (combo >= 3) {
      flowScore += 30
    } else {
      tips.push('Construire un combo pour plus de points')
    }
    
    // Temps de réponse optimal: 3-6 secondes
    if (averageResponseTime >= 3000 && averageResponseTime <= 6000) {
      flowScore += 40
    } else if (averageResponseTime < 3000) {
      tips.push('Excellent temps de réponse!')
    } else {
      tips.push('Prendre moins de temps si possible')
    }
    
    return {
      inFlow: flowScore >= 70,
      flowScore,
      tips
    }
  }
}


