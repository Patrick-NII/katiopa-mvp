// Analyses prédictives basées sur les patterns comportementaux
export interface PredictiveAnalysis {
  childId: string
  analysisType: 'performance_trend' | 'engagement_prediction' | 'learning_style_evolution' | 'difficulty_progression'
  prediction: {
    trend: 'increasing' | 'decreasing' | 'stable'
    confidence: number // 0-1
    timeframe: string // '1_week' | '1_month' | '3_months'
    factors: string[]
    recommendations: string[]
  }
  historicalData: any[]
  createdAt: Date
}

export interface BehavioralPattern {
  type: string
  frequency: number
  intensity: number
  trend: 'increasing' | 'decreasing' | 'stable'
  correlation: number
}

export class PredictiveAnalytics {
  // Analyser les tendances de performance
  static analyzePerformanceTrend(childData: any): PredictiveAnalysis {
    const { performanceMetrics, learningSessions, activities } = childData
    
    // Analyser les métriques de performance sur les 30 derniers jours
    const recentMetrics = performanceMetrics
      .filter((m: any) => new Date(m.timestamp) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    
    if (recentMetrics.length < 3) {
      return this.generateDefaultPrediction(childData.sessionId, 'performance_trend')
    }
    
    // Calculer la tendance
    const values = recentMetrics.map((m: any) => m.value)
    const trend = this.calculateTrend(values)
    const confidence = this.calculateConfidence(values)
    
    // Identifier les facteurs influents
    const factors = this.identifyPerformanceFactors(childData)
    
    // Générer des recommandations
    const recommendations = this.generatePerformanceRecommendations(trend, factors)
    
    return {
      childId: childData.sessionId,
      analysisType: 'performance_trend',
      prediction: {
        trend,
        confidence,
        timeframe: '1_month',
        factors,
        recommendations
      },
      historicalData: recentMetrics,
      createdAt: new Date()
    }
  }
  
  // Prédire l'engagement futur
  static predictEngagement(childData: any): PredictiveAnalysis {
    const { conversationAnalysis, behavioralMetrics, learningSessions } = childData
    
    // Analyser l'engagement conversationnel
    const engagementHistory = behavioralMetrics
      .filter((m: any) => m.type === 'engagement')
      .map((m: any) => m.value)
    
    const conversationEngagement = conversationAnalysis.averageEngagement
    
    // Calculer la tendance d'engagement
    const trend = this.calculateEngagementTrend(engagementHistory, conversationEngagement)
    const confidence = this.calculateEngagementConfidence(engagementHistory)
    
    // Facteurs influents sur l'engagement
    const factors = this.identifyEngagementFactors(childData)
    
    // Recommandations pour maintenir/améliorer l'engagement
    const recommendations = this.generateEngagementRecommendations(trend, factors)
    
    return {
      childId: childData.sessionId,
      analysisType: 'engagement_prediction',
      prediction: {
        trend,
        confidence,
        timeframe: '2_weeks',
        factors,
        recommendations
      },
      historicalData: engagementHistory,
      createdAt: new Date()
    }
  }
  
  // Prédire l'évolution du style d'apprentissage
  static predictLearningStyleEvolution(childData: any): PredictiveAnalysis {
    const { profile, parentPreferences, learningSessions } = childData
    
    // Analyser les sessions d'apprentissage pour identifier les patterns
    const sessionPatterns = this.analyzeLearningSessionPatterns(learningSessions)
    
    // Comparer avec les préférences actuelles
    const currentStyle = profile?.learningStyle || parentPreferences?.learningStyle || 'Non spécifié'
    
    // Prédire l'évolution
    const evolution = this.predictStyleEvolution(sessionPatterns, currentStyle)
    
    return {
      childId: childData.sessionId,
      analysisType: 'learning_style_evolution',
      prediction: {
        trend: evolution.trend,
        confidence: evolution.confidence,
        timeframe: '3_months',
        factors: evolution.factors,
        recommendations: evolution.recommendations
      },
      historicalData: sessionPatterns,
      createdAt: new Date()
    }
  }
  
  // Prédire la progression de difficulté
  static predictDifficultyProgression(childData: any): PredictiveAnalysis {
    const { activities, childActivities, performanceMetrics } = childData
    
    // Analyser la progression des scores et difficultés
    const progressionData = this.analyzeDifficultyProgression(activities, childActivities, performanceMetrics)
    
    // Prédire la prochaine étape de difficulté
    const nextDifficulty = this.predictNextDifficultyLevel(progressionData)
    
    return {
      childId: childData.sessionId,
      analysisType: 'difficulty_progression',
      prediction: {
        trend: nextDifficulty.trend,
        confidence: nextDifficulty.confidence,
        timeframe: '1_month',
        factors: nextDifficulty.factors,
        recommendations: nextDifficulty.recommendations
      },
      historicalData: progressionData,
      createdAt: new Date()
    }
  }
  
  // Méthodes utilitaires
  private static calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable'
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2))
    const secondHalf = values.slice(Math.floor(values.length / 2))
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length
    
    const change = (secondAvg - firstAvg) / firstAvg
    
    if (change > 0.1) return 'increasing'
    if (change < -0.1) return 'decreasing'
    return 'stable'
  }
  
  private static calculateConfidence(values: number[]): number {
    if (values.length < 3) return 0.3
    
    // Calculer la variance pour déterminer la confiance
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)
    
    // Plus la variance est faible, plus la confiance est élevée
    return Math.max(0.1, Math.min(0.9, 1 - (stdDev / mean)))
  }
  
  private static identifyPerformanceFactors(childData: any): string[] {
    const factors: string[] = []
    
    if (childData.conversationAnalysis.averageEngagement > 2.5) {
      factors.push('Engagement conversationnel élevé')
    }
    
    if (childData.learningSessions.length > 5) {
      factors.push('Régularité des sessions d\'apprentissage')
    }
    
    if (childData.parentPreferences?.motivationFactors?.length > 0) {
      factors.push('Facteurs de motivation identifiés')
    }
    
    if (childData.cubeMatchStats?.totalGames > 10) {
      factors.push('Pratique régulière des jeux éducatifs')
    }
    
    return factors
  }
  
  private static generatePerformanceRecommendations(trend: string, factors: string[]): string[] {
    const recommendations: string[] = []
    
    if (trend === 'increasing') {
      recommendations.push('Maintenir les activités actuelles qui fonctionnent bien')
      recommendations.push('Augmenter progressivement la difficulté')
    } else if (trend === 'decreasing') {
      recommendations.push('Revoir les méthodes d\'apprentissage')
      recommendations.push('Réduire temporairement la difficulté')
    } else {
      recommendations.push('Introduire de nouvelles activités pour stimuler l\'intérêt')
    }
    
    if (factors.includes('Engagement conversationnel élevé')) {
      recommendations.push('Encourager davantage les interactions avec Bubix')
    }
    
    return recommendations
  }
  
  private static calculateEngagementTrend(history: number[], current: number): 'increasing' | 'decreasing' | 'stable' {
    if (history.length === 0) return 'stable'
    
    const recentAvg = history.slice(-5).reduce((sum, val) => sum + val, 0) / Math.min(5, history.length)
    const currentValue = current || recentAvg
    
    if (currentValue > recentAvg * 1.1) return 'increasing'
    if (currentValue < recentAvg * 0.9) return 'decreasing'
    return 'stable'
  }
  
  private static calculateEngagementConfidence(history: number[]): number {
    return this.calculateConfidence(history)
  }
  
  private static identifyEngagementFactors(childData: any): string[] {
    const factors: string[] = []
    
    if (childData.conversationAnalysis.totalConversations > 10) {
      factors.push('Fréquence élevée des conversations')
    }
    
    if (childData.learningSessions.some((s: any) => s.mood === 'motivé')) {
      factors.push('Humeur positive lors des sessions')
    }
    
    if (childData.rewardTracking.length > 0) {
      factors.push('Système de récompenses actif')
    }
    
    return factors
  }
  
  private static generateEngagementRecommendations(trend: string, factors: string[]): string[] {
    const recommendations: string[] = []
    
    if (trend === 'increasing') {
      recommendations.push('Maintenir les activités qui suscitent l\'engagement')
      recommendations.push('Introduire de nouveaux défis progressifs')
    } else if (trend === 'decreasing') {
      recommendations.push('Revoir les méthodes d\'apprentissage')
      recommendations.push('Augmenter les interactions avec Bubix')
    }
    
    if (factors.includes('Système de récompenses actif')) {
      recommendations.push('Continuer à utiliser les récompenses comme motivation')
    }
    
    return recommendations
  }
  
  private static analyzeLearningSessionPatterns(sessions: any[]): any[] {
    return sessions.map(session => ({
      duration: session.duration,
      completionRate: session.completionRate,
      mood: session.mood,
      breaks: session.breaks
    }))
  }
  
  private static predictStyleEvolution(patterns: any[], currentStyle: string): any {
    // Logique simplifiée pour prédire l'évolution du style
    const avgCompletionRate = patterns.reduce((sum, p) => sum + p.completionRate, 0) / patterns.length
    const avgBreaks = patterns.reduce((sum, p) => sum + p.breaks, 0) / patterns.length
    
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
    let confidence = 0.5
    const factors: string[] = []
    const recommendations: string[] = []
    
    if (avgCompletionRate > 80 && avgBreaks < 2) {
      trend = 'increasing'
      confidence = 0.8
      factors.push('Taux de completion élevé')
      factors.push('Faible nombre de pauses')
      recommendations.push('Maintenir le rythme d\'apprentissage actuel')
    }
    
    return { trend, confidence, factors, recommendations }
  }
  
  private static analyzeDifficultyProgression(activities: any[], childActivities: any[], metrics: any[]): any[] {
    // Combiner toutes les données d'activité
    const allActivities = [
      ...activities.map(a => ({ score: a.score, domain: a.domain, date: a.createdAt })),
      ...childActivities.map(a => ({ score: a.score, domain: a.type, date: a.completedAt }))
    ]
    
    return allActivities.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }
  
  private static predictNextDifficultyLevel(progressionData: any[]): any {
    if (progressionData.length < 5) {
      return {
        trend: 'stable' as const,
        confidence: 0.3,
        factors: ['Données insuffisantes'],
        recommendations: ['Continuer à collecter des données']
      }
    }
    
    const recentScores = progressionData.slice(-5).map(a => a.score)
    const avgScore = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length
    
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
    let confidence = 0.6
    const factors: string[] = []
    const recommendations: string[] = []
    
    if (avgScore > 80) {
      trend = 'increasing'
      confidence = 0.8
      factors.push('Scores élevés récents')
      recommendations.push('Augmenter progressivement la difficulté')
    } else if (avgScore < 60) {
      trend = 'decreasing'
      confidence = 0.7
      factors.push('Scores en baisse')
      recommendations.push('Réduire temporairement la difficulté')
    }
    
    return { trend, confidence, factors, recommendations }
  }
  
  private static generateDefaultPrediction(childId: string, type: string): PredictiveAnalysis {
    return {
      childId,
      analysisType: type as any,
      prediction: {
        trend: 'stable',
        confidence: 0.3,
        timeframe: '1_month',
        factors: ['Données insuffisantes'],
        recommendations: ['Continuer à collecter des données pour des prédictions plus précises']
      },
      historicalData: [],
      createdAt: new Date()
    }
  }
}
