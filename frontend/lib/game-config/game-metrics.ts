/**
 * 🎯 GAME METRICS - PHASE 4
 * 
 * Système de métriques avancées pour l'analyse des performances
 * Compatible avec BubiX et le stockage en base de données
 */

import { Operator } from './cubematch-config'

// ----------------------------
// Types de métriques
// ----------------------------

export interface RoundMetrics {
  roundNumber: number
  operator: Operator
  target: number
  difficulty: number
  startTime: number
  endTime: number
  duration: number
  wasSuccess: boolean
  selectedNumbers: number[]
  isLongDecomposition: boolean
  responseTimeMs: number
  pointsEarned: number
  comboAtTime: number
  accuracyAtTime: number
}

export interface SessionMetrics {
  sessionId: string
  userId?: string
  age: number
  startTime: number
  endTime?: number
  totalDuration: number
  
  // Statistiques globales
  totalRounds: number
  successfulRounds: number
  failedRounds: number
  accuracy: number
  
  // Score et progression
  finalScore: number
  maxLevel: number
  maxCombo: number
  totalPointsEarned: number
  
  // Difficulté
  initialDifficulty: number
  finalDifficulty: number
  averageDifficulty: number
  difficultyProgression: number[]
  
  // Performance
  averageResponseTime: number
  fastestResponseTime: number
  slowestResponseTime: number
  
  // Opérateurs
  operatorDistribution: Record<Operator, number>
  operatorAccuracy: Record<Operator, number>
  
  // Décompositions
  longDecompositionsCount: number
  longDecompositionsSuccess: number
  
  // Séries et patterns
  longestStreak: number
  consecutiveErrorsMax: number
  
  // Données détaillées
  rounds: RoundMetrics[]
}

export interface GameMetricsForBubiX {
  // Identifiants
  sessionId: string
  userId?: string
  timestamp: number
  
  // Performance globale
  accuracy: number
  avgResponseTime: number
  flowScore: number
  engagementScore: number
  
  // Progression
  difficultyEvolution: {
    start: number
    end: number
    progression: number
  }
  
  // Compétences
  strengths: Operator[]
  weaknesses: Operator[]
  
  // Patterns cognitifs
  cognitivePatterns: {
    speedVsAccuracy: 'speed-focused' | 'accuracy-focused' | 'balanced'
    errorRecovery: 'fast' | 'medium' | 'slow'
    adaptability: 'high' | 'medium' | 'low'
    persistence: number // 0-100
  }
  
  // Recommandations
  recommendations: {
    focusAreas: string[]
    suggestedDifficulty: number
    suggestedOperators: Operator[]
  }
}

// ----------------------------
// Collecteur de métriques
// ----------------------------

export class MetricsCollector {
  private sessionMetrics: SessionMetrics
  private currentRound: Partial<RoundMetrics> | null = null
  private difficultyHistory: number[] = []
  
  constructor(sessionId: string, age: number, initialDifficulty: number = 1.0) {
    this.sessionMetrics = {
      sessionId,
      age,
      startTime: Date.now(),
      totalDuration: 0,
      totalRounds: 0,
      successfulRounds: 0,
      failedRounds: 0,
      accuracy: 0,
      finalScore: 0,
      maxLevel: 1,
      maxCombo: 0,
      totalPointsEarned: 0,
      initialDifficulty,
      finalDifficulty: initialDifficulty,
      averageDifficulty: initialDifficulty,
      difficultyProgression: [initialDifficulty],
      averageResponseTime: 0,
      fastestResponseTime: Number.MAX_VALUE,
      slowestResponseTime: 0,
      operatorDistribution: {} as Record<Operator, number>,
      operatorAccuracy: {} as Record<Operator, number>,
      longDecompositionsCount: 0,
      longDecompositionsSuccess: 0,
      longestStreak: 0,
      consecutiveErrorsMax: 0,
      rounds: []
    }
    
    this.difficultyHistory.push(initialDifficulty)
  }

  /**
   * 🎯 Démarre un nouveau round
   */
  startRound(operator: Operator, target: number, difficulty: number): void {
    this.currentRound = {
      roundNumber: this.sessionMetrics.totalRounds + 1,
      operator,
      target,
      difficulty,
      startTime: Date.now()
    }
    
    this.difficultyHistory.push(difficulty)
  }

  /**
   * ✅ Termine le round actuel
   */
  endRound(params: {
    wasSuccess: boolean
    selectedNumbers: number[]
    pointsEarned: number
    combo: number
    accuracy: number
  }): void {
    if (!this.currentRound) return
    
    const { wasSuccess, selectedNumbers, pointsEarned, combo, accuracy } = params
    const endTime = Date.now()
    const responseTime = endTime - (this.currentRound.startTime || endTime)
    const isLongDecomposition = selectedNumbers.length >= 3
    
    // Compléter les métriques du round
    const roundMetrics: RoundMetrics = {
      ...this.currentRound,
      endTime,
      duration: responseTime,
      wasSuccess,
      selectedNumbers,
      isLongDecomposition,
      responseTimeMs: responseTime,
      pointsEarned,
      comboAtTime: combo,
      accuracyAtTime: accuracy
    } as RoundMetrics
    
    // Ajouter à l'historique
    this.sessionMetrics.rounds.push(roundMetrics)
    
    // Mettre à jour les statistiques
    this.updateStatistics(roundMetrics)
    
    // Reset du round actuel
    this.currentRound = null
  }

  /**
   * 📊 Met à jour les statistiques de session
   */
  private updateStatistics(round: RoundMetrics): void {
    // Compteurs de base
    this.sessionMetrics.totalRounds++
    if (round.wasSuccess) {
      this.sessionMetrics.successfulRounds++
    } else {
      this.sessionMetrics.failedRounds++
    }
    
    // Précision globale
    this.sessionMetrics.accuracy = 
      (this.sessionMetrics.successfulRounds / this.sessionMetrics.totalRounds) * 100
    
    // Points
    this.sessionMetrics.totalPointsEarned += round.pointsEarned
    
    // Temps de réponse
    if (round.responseTimeMs < this.sessionMetrics.fastestResponseTime) {
      this.sessionMetrics.fastestResponseTime = round.responseTimeMs
    }
    if (round.responseTimeMs > this.sessionMetrics.slowestResponseTime) {
      this.sessionMetrics.slowestResponseTime = round.responseTimeMs
    }
    
    // Calculer la moyenne des temps de réponse
    const totalResponseTime = this.sessionMetrics.rounds.reduce(
      (sum, r) => sum + r.responseTimeMs, 
      0
    )
    this.sessionMetrics.averageResponseTime = totalResponseTime / this.sessionMetrics.totalRounds
    
    // Distribution des opérateurs
    if (!this.sessionMetrics.operatorDistribution[round.operator]) {
      this.sessionMetrics.operatorDistribution[round.operator] = 0
    }
    this.sessionMetrics.operatorDistribution[round.operator]++
    
    // Précision par opérateur
    this.updateOperatorAccuracy(round.operator)
    
    // Décompositions longues
    if (round.isLongDecomposition) {
      this.sessionMetrics.longDecompositionsCount++
      if (round.wasSuccess) {
        this.sessionMetrics.longDecompositionsSuccess++
      }
    }
    
    // Difficulté
    this.sessionMetrics.finalDifficulty = round.difficulty
    this.sessionMetrics.averageDifficulty = 
      this.difficultyHistory.reduce((a, b) => a + b, 0) / this.difficultyHistory.length
    this.sessionMetrics.difficultyProgression = [...this.difficultyHistory]
  }

  /**
   * 🎯 Met à jour la précision par opérateur
   */
  private updateOperatorAccuracy(operator: Operator): void {
    const operatorRounds = this.sessionMetrics.rounds.filter(r => r.operator === operator)
    const successCount = operatorRounds.filter(r => r.wasSuccess).length
    
    this.sessionMetrics.operatorAccuracy[operator] = 
      operatorRounds.length > 0 ? (successCount / operatorRounds.length) * 100 : 0
  }

  /**
   * 📊 Met à jour les métriques de niveau et combo
   */
  updateLevelAndCombo(level: number, combo: number): void {
    if (level > this.sessionMetrics.maxLevel) {
      this.sessionMetrics.maxLevel = level
    }
    if (combo > this.sessionMetrics.maxCombo) {
      this.sessionMetrics.maxCombo = combo
    }
  }

  /**
   * 🏁 Finalise la session
   */
  finalizeSession(finalScore: number): SessionMetrics {
    this.sessionMetrics.endTime = Date.now()
    this.sessionMetrics.totalDuration = 
      this.sessionMetrics.endTime - this.sessionMetrics.startTime
    this.sessionMetrics.finalScore = finalScore
    
    return this.getSessionMetrics()
  }

  /**
   * 📊 Obtient les métriques de session
   */
  getSessionMetrics(): SessionMetrics {
    return { ...this.sessionMetrics }
  }

  /**
   * 🎯 Génère les métriques pour BubiX
   */
  generateBubiXMetrics(): GameMetricsForBubiX {
    const metrics = this.sessionMetrics
    
    // Calculer le flow score
    const flowScore = this.calculateFlowScore()
    
    // Calculer l'engagement
    const engagementScore = this.calculateEngagementScore()
    
    // Identifier les forces et faiblesses
    const { strengths, weaknesses } = this.identifyStrengthsWeaknesses()
    
    // Analyser les patterns cognitifs
    const cognitivePatterns = this.analyzeCognitivePatterns()
    
    // Générer des recommandations
    const recommendations = this.generateRecommendations()
    
    return {
      sessionId: metrics.sessionId,
      userId: metrics.userId,
      timestamp: metrics.startTime,
      accuracy: metrics.accuracy,
      avgResponseTime: metrics.averageResponseTime,
      flowScore,
      engagementScore,
      difficultyEvolution: {
        start: metrics.initialDifficulty,
        end: metrics.finalDifficulty,
        progression: metrics.finalDifficulty - metrics.initialDifficulty
      },
      strengths,
      weaknesses,
      cognitivePatterns,
      recommendations
    }
  }

  /**
   * 🌊 Calcule le score de flow
   */
  private calculateFlowScore(): number {
    const accuracy = this.sessionMetrics.accuracy
    const combo = this.sessionMetrics.maxCombo
    const avgResponseTime = this.sessionMetrics.averageResponseTime
    
    let score = 0
    
    // Précision idéale: 70-85%
    if (accuracy >= 70 && accuracy <= 85) {
      score += 40
    } else if (accuracy > 85) {
      score += 30 // Trop facile
    } else {
      score += 20 // Trop difficile
    }
    
    // Combo actif
    if (combo >= 5) score += 30
    else if (combo >= 3) score += 20
    else score += 10
    
    // Temps de réponse optimal: 3-6s
    if (avgResponseTime >= 3000 && avgResponseTime <= 6000) {
      score += 30
    } else if (avgResponseTime < 3000) {
      score += 25
    } else {
      score += 15
    }
    
    return Math.min(100, score)
  }

  /**
   * 🎯 Calcule le score d'engagement
   */
  private calculateEngagementScore(): number {
    const totalRounds = this.sessionMetrics.totalRounds
    const maxCombo = this.sessionMetrics.maxCombo
    const longDecompAttempts = this.sessionMetrics.longDecompositionsCount
    
    let score = 0
    
    // Nombre de rounds (persistance)
    if (totalRounds >= 20) score += 40
    else if (totalRounds >= 10) score += 30
    else if (totalRounds >= 5) score += 20
    else score += 10
    
    // Combo (maîtrise)
    if (maxCombo >= 10) score += 30
    else if (maxCombo >= 5) score += 20
    else score += 10
    
    // Exploration (décompositions longues)
    if (longDecompAttempts >= 5) score += 30
    else if (longDecompAttempts >= 2) score += 20
    else score += 10
    
    return Math.min(100, score)
  }

  /**
   * 💪 Identifie les forces et faiblesses
   */
  private identifyStrengthsWeaknesses(): { 
    strengths: Operator[]
    weaknesses: Operator[] 
  } {
    const operators = Object.keys(this.sessionMetrics.operatorAccuracy) as Operator[]
    const strengths: Operator[] = []
    const weaknesses: Operator[] = []
    
    operators.forEach(op => {
      const accuracy = this.sessionMetrics.operatorAccuracy[op]
      if (accuracy >= 75) {
        strengths.push(op)
      } else if (accuracy < 60) {
        weaknesses.push(op)
      }
    })
    
    return { strengths, weaknesses }
  }

  /**
   * 🧠 Analyse les patterns cognitifs
   */
  private analyzeCognitivePatterns(): GameMetricsForBubiX['cognitivePatterns'] {
    const accuracy = this.sessionMetrics.accuracy
    const avgResponseTime = this.sessionMetrics.averageResponseTime
    
    // Speed vs Accuracy
    let speedVsAccuracy: 'speed-focused' | 'accuracy-focused' | 'balanced' = 'balanced'
    if (avgResponseTime < 4000 && accuracy < 70) {
      speedVsAccuracy = 'speed-focused'
    } else if (avgResponseTime > 7000 && accuracy > 80) {
      speedVsAccuracy = 'accuracy-focused'
    }
    
    // Error Recovery (analyse des séquences d'erreurs)
    const errorRecovery = this.analyzeErrorRecovery()
    
    // Adaptability (basé sur la progression de difficulté)
    const adaptability = this.analyzeAdaptability()
    
    // Persistence (basé sur le nombre de rounds et l'engagement)
    const persistence = Math.min(100, (this.sessionMetrics.totalRounds / 30) * 100)
    
    return {
      speedVsAccuracy,
      errorRecovery,
      adaptability,
      persistence
    }
  }

  /**
   * 🔄 Analyse la récupération après erreur
   */
  private analyzeErrorRecovery(): 'fast' | 'medium' | 'slow' {
    // Analyser les séquences erreur → succès
    let totalRecoveryTime = 0
    let recoveryCount = 0
    
    for (let i = 1; i < this.sessionMetrics.rounds.length; i++) {
      if (!this.sessionMetrics.rounds[i - 1].wasSuccess && this.sessionMetrics.rounds[i].wasSuccess) {
        totalRecoveryTime += 1 // Nombre de rounds pour récupérer
        recoveryCount++
      }
    }
    
    if (recoveryCount === 0) return 'medium'
    
    const avgRecovery = totalRecoveryTime / recoveryCount
    if (avgRecovery <= 1) return 'fast'
    if (avgRecovery <= 2) return 'medium'
    return 'slow'
  }

  /**
   * 🎯 Analyse l'adaptabilité
   */
  private analyzeAdaptability(): 'high' | 'medium' | 'low' {
    const diffProgression = this.sessionMetrics.finalDifficulty - this.sessionMetrics.initialDifficulty
    const accuracy = this.sessionMetrics.accuracy
    
    // Haute adaptabilité: progression significative avec bonne précision
    if (diffProgression > 0.5 && accuracy >= 70) return 'high'
    
    // Basse adaptabilité: peu de progression ou mauvaise précision
    if (diffProgression < 0.2 || accuracy < 55) return 'low'
    
    return 'medium'
  }

  /**
   * 💡 Génère des recommandations
   */
  private generateRecommendations(): GameMetricsForBubiX['recommendations'] {
    const focusAreas: string[] = []
    const suggestedOperators: Operator[] = []
    let suggestedDifficulty = this.sessionMetrics.finalDifficulty
    
    // Identifier les zones à travailler
    const { weaknesses } = this.identifyStrengthsWeaknesses()
    
    if (weaknesses.length > 0) {
      weaknesses.forEach(op => {
        focusAreas.push(`Améliorer la maîtrise de ${this.getOperatorName(op)}`)
        suggestedOperators.push(op)
      })
    }
    
    // Ajuster la difficulté suggérée
    if (this.sessionMetrics.accuracy > 85) {
      focusAreas.push('Augmenter le niveau de défi')
      suggestedDifficulty += 0.3
    } else if (this.sessionMetrics.accuracy < 60) {
      focusAreas.push('Consolider les bases')
      suggestedDifficulty -= 0.3
    }
    
    // Temps de réponse
    if (this.sessionMetrics.averageResponseTime > 8000) {
      focusAreas.push('Travailler la rapidité de calcul')
    }
    
    return {
      focusAreas,
      suggestedDifficulty: Math.max(0.8, Math.min(3.5, suggestedDifficulty)),
      suggestedOperators
    }
  }

  /**
   * 📝 Nom de l'opérateur en français
   */
  private getOperatorName(operator: Operator): string {
    const names: Record<Operator, string> = {
      ADD: 'addition',
      SUB: 'soustraction',
      MUL: 'multiplication',
      DIV: 'division',
      MIXED: 'décompositions mixtes'
    }
    return names[operator] || operator
  }
}


