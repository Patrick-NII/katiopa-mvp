/**
 * 🤖 CUBEMATCH BUBIX DATA API
 * 
 * Extraction et formatage des données spécifiquement pour l'IA BubiX
 * Patterns comportementaux, données d'entraînement, insights pédagogiques
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * 🧠 GET /api/cubematch/bubix-data/training-dataset/:userId
 * 
 * Dataset complet pour entraîner BubiX sur un utilisateur spécifique
 */
router.get('/training-dataset/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const includeAnonymized = req.query.includeAnonymized === 'true';
    
    // Vérifier l'autorisation (ou si admin/système)
    if (req.user!.userId !== userId && req.user!.userType !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    console.log('🤖 Génération dataset BubiX pour utilisateur:', userId);
    
    // 📊 SECTION 1: Données de performance brutes
    const performanceData = await prisma.cubeMatchScore.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'asc' },
      select: {
        // Identifiants et timestamps
        id: true,
        created_at: true,
        
        // Performance core
        score: true,
        level: true,
        time_played_ms: true,
        
        // Configuration de jeu
        operator: true,
        target: true,
        difficulty_level: true,
        grid_size_rows: true,
        grid_size_cols: true,
        allow_diagonals: true,
        
        // Métriques comportementales
        total_moves: true,
        successful_moves: true,
        failed_moves: true,
        accuracy_rate: true,
        average_move_time_ms: true,
        fastest_move_time_ms: true,
        slowest_move_time_ms: true,
        
        // Patterns avancés
        combo_max: true,
        max_consecutive_hits: true,
        max_consecutive_misses: true,
        longest_combo_chain: true,
        hints_used: true,
        cells_cleared: true,
        grid_completion_rate: true,
        
        // Distribution par opérateur
        additions_count: true,
        subtractions_count: true,
        multiplications_count: true,
        divisions_count: true,
        additions_score: true,
        subtractions_score: true,
        multiplications_score: true,
        divisions_score: true,
        
        // Temps par opérateur
        time_spent_on_additions_ms: true,
        time_spent_on_subtractions_ms: true,
        time_spent_on_multiplications_ms: true,
        time_spent_on_divisions_ms: true,
        
        // Context de session
        session_start_time: true,
        session_end_time: true,
        breaks_taken: true,
        total_break_time_ms: true,
        
        // Métriques UX
        engagement_score: true,
        focus_time_percentage: true,
        difficulty_adjustments: true,
        
        // Préférences
        theme_used: true,
        sound_enabled: true,
        assist_enabled: true,
        hints_enabled: true,
        
        // Données séquentielles (JSON)
        target_numbers_used: true,
        operator_sequence: true
      }
    });
    
    // 📈 SECTION 2: Patterns d'apprentissage calculés
    const learningPatterns = calculateLearningPatterns(performanceData);
    
    // 🎯 SECTION 3: Préférences et comportements
    const behavioralProfile = calculateBehavioralProfile(performanceData);
    
    // ⚡ SECTION 4: Progression temporelle
    const progressionMetrics = calculateProgressionMetrics(performanceData);
    
    // 🔍 SECTION 5: Zones de difficulté
    const difficultyZones = identifyDifficultyZones(performanceData);
    
    // 🎪 SECTION 6: Patterns d'erreurs
    const errorPatterns = analyzeErrorPatterns(performanceData);
    
    // 📚 SECTION 7: Recommandations pédagogiques
    const pedagogicalInsights = generatePedagogicalInsights(
      learningPatterns,
      behavioralProfile,
      progressionMetrics,
      difficultyZones,
      errorPatterns
    );
    
    // 🔬 SECTION 8: Métadonnées pour l'IA
    const aiMetadata = {
      dataQuality: assessDataQuality(performanceData),
      learningStyle: determineLearningStyle(behavioralProfile),
      cognitiveProfile: buildCognitiveProfile(performanceData),
      adaptationSuggestions: generateAdaptationSuggestions(learningPatterns)
    };
    
    // Format final pour BubiX
    const bubixDataset = {
      userId: includeAnonymized ? hashUserId(userId) : userId,
      generatedAt: new Date().toISOString(),
      dataPoints: performanceData.length,
      timeSpan: {
        firstGame: performanceData[0]?.created_at || null,
        lastGame: performanceData[performanceData.length - 1]?.created_at || null
      },
      
      // Données brutes pour ML
      rawPerformanceData: includeAnonymized ? 
        anonymizePerformanceData(performanceData) : performanceData,
      
      // Patterns extraits
      learningPatterns,
      behavioralProfile,
      progressionMetrics,
      difficultyZones,
      errorPatterns,
      pedagogicalInsights,
      aiMetadata,
      
      // Formats spécialisés pour différents modèles
      tensorFlowFormat: formatForTensorFlow(performanceData),
      timeSeriesFormat: formatForTimeSeries(performanceData),
      classificationFormat: formatForClassification(performanceData)
    };
    
    console.log(`✅ Dataset BubiX généré: ${performanceData.length} points de données`);
    
    res.json({
      success: true,
      dataset: bubixDataset,
      exportFormat: 'bubix-v2.0',
      compression: 'none',
      size: JSON.stringify(bubixDataset).length
    });
    
  } catch (error) {
    console.error('❌ Erreur génération dataset BubiX:', error);
    res.status(500).json({
      error: 'Erreur lors de la génération du dataset'
    });
  }
});

/**
 * 📊 GET /api/cubematch/bubix-data/global-patterns
 * 
 * Patterns globaux anonymisés pour améliorer BubiX
 */
router.get('/global-patterns', requireAuth, async (req, res) => {
  try {
    // Vérifier que c'est un admin ou le système BubiX
    if (req.user!.userType !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès administrateur requis' });
    }
    
    console.log('🌍 Génération patterns globaux pour BubiX...');
    
    // Statistiques globales anonymisées
    const globalStats = await prisma.cubeMatchScore.aggregate({
      _count: { _all: true },
      _avg: {
        score: true,
        accuracy_rate: true,
        time_played_ms: true,
        average_move_time_ms: true,
        engagement_score: true,
        combo_max: true
      },
      _max: {
        score: true,
        level: true,
        combo_max: true
      },
      _min: {
        score: true,
        time_played_ms: true
      }
    });
    
    // Distribution par opérateur
    const operatorDistribution = await prisma.cubeMatchScore.groupBy({
      by: ['operator'],
      _count: { _all: true },
      _avg: {
        score: true,
        accuracy_rate: true,
        time_played_ms: true
      }
    });
    
    // Distribution par difficulté
    const difficultyDistribution = await prisma.cubeMatchScore.groupBy({
      by: ['difficulty_level'],
      _count: { _all: true },
      _avg: {
        score: true,
        accuracy_rate: true,
        engagement_score: true
      }
    });
    
    // Patterns temporels (par heure)
    const temporalPatterns = await analyzeGlobalTemporalPatterns();
    
    // Courbes d'apprentissage types
    const learningCurves = await identifyTypicalLearningCurves();
    
    // Segmentation des joueurs
    const playerSegments = await segmentPlayerProfiles();
    
    res.json({
      success: true,
      globalInsights: {
        totalGames: globalStats._count._all,
        averagePerformance: {
          score: Math.round(globalStats._avg.score || 0),
          accuracy: Math.round(globalStats._avg.accuracy_rate || 0),
          playTimeMs: Math.round(globalStats._avg.time_played_ms || 0),
          moveSpeed: Math.round(globalStats._avg.average_move_time_ms || 0),
          engagement: Math.round(globalStats._avg.engagement_score || 0)
        },
        distributions: {
          operators: operatorDistribution,
          difficulties: difficultyDistribution
        },
        temporalPatterns,
        learningCurves,
        playerSegments
      },
      generatedAt: new Date().toISOString(),
      anonymized: true
    });
    
  } catch (error) {
    console.error('❌ Erreur patterns globaux:', error);
    res.status(500).json({
      error: 'Erreur lors de la génération des patterns globaux'
    });
  }
});

/**
 * 🎯 POST /api/cubematch/bubix-data/feedback
 * 
 * Feedback loop pour améliorer les prédictions BubiX
 */
router.post('/feedback', requireAuth, async (req, res) => {
  try {
    const {
      userId,
      predictionId,
      actualOutcome,
      predictedOutcome,
      feedbackType,
      accuracy,
      userSatisfaction,
      comments
    } = req.body;
    
    // Validation
    if (!userId || !predictionId || !actualOutcome || !predictedOutcome) {
      return res.status(400).json({
        error: 'Données manquantes pour le feedback'
      });
    }
    
    // Vérifier l'autorisation
    if (req.user!.userId !== userId && req.user!.userType !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    // Enregistrer le feedback (table dédiée à créer si nécessaire)
    const feedback = {
      userId,
      predictionId,
      actualOutcome,
      predictedOutcome,
      feedbackType,
      accuracy: parseFloat(accuracy) || 0,
      userSatisfaction: parseInt(userSatisfaction) || 0,
      comments: comments || '',
      createdAt: new Date(),
      
      // Calculer l'erreur de prédiction
      predictionError: calculatePredictionError(actualOutcome, predictedOutcome),
      
      // Contexte pour améliorer le modèle
      context: {
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString()
      }
    };
    
    // TODO: Sauvegarder dans une table BubixFeedback
    console.log('📝 Feedback BubiX enregistré:', feedback);
    
    // Analyser et ajuster les modèles en temps réel si nécessaire
    if (feedback.accuracy < 0.5) {
      console.log('⚠️ Faible précision détectée, révision du modèle recommandée');
    }
    
    res.json({
      success: true,
      message: 'Feedback enregistré avec succès',
      feedbackId: `fb_${Date.now()}`,
      modelUpdateRequired: feedback.accuracy < 0.5
    });
    
  } catch (error) {
    console.error('❌ Erreur enregistrement feedback:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'enregistrement du feedback'
    });
  }
});

// 🔧 Fonctions utilitaires pour BubiX

function calculateLearningPatterns(data: any[]) {
  if (data.length < 5) return { insufficient_data: true };
  
  // Vitesse d'apprentissage
  const learningSpeed = calculateLearningSpeed(data);
  
  // Consistance
  const consistency = calculateConsistency(data.map(d => d.score));
  
  // Adaptation à la difficulté
  const difficultyAdaptation = analyzeDifficultyAdaptation(data);
  
  // Préférences d'opérateurs
  const operatorPreferences = analyzeOperatorPreferences(data);
  
  return {
    learningSpeed,
    consistency,
    difficultyAdaptation,
    operatorPreferences,
    progressionStage: determineLearningStage(data)
  };
}

function calculateBehavioralProfile(data: any[]) {
  const profile = {
    playStyle: determinePlayStyle(data),
    riskTolerance: calculateRiskTolerance(data),
    persistance: calculatePersistance(data),
    adaptability: calculateAdaptability(data),
    preferredSessionLength: calculatePreferredSessionLength(data),
    optimalChallengeLevel: determineOptimalChallenge(data)
  };
  
  return profile;
}

function calculateProgressionMetrics(data: any[]) {
  if (data.length < 3) return { insufficient_data: true };
  
  const scores = data.map(d => d.score);
  const timestamps = data.map(d => new Date(d.created_at).getTime());
  
  // Calcul de la pente de progression
  const progression = calculateLinearRegression(timestamps, scores);
  
  // Plateaux et accélérations
  const plateaus = identifyPlateaus(scores);
  const accelerations = identifyAccelerations(scores);
  
  // Prédiction de performance future
  const nextScorePrediction = predictNextScore(data);
  
  return {
    overallTrend: progression.slope > 0 ? 'improving' : progression.slope < 0 ? 'declining' : 'stable',
    progressionRate: progression.slope,
    r_squared: progression.r_squared,
    plateaus,
    accelerations,
    nextScorePrediction,
    improvementPotential: calculateImprovementPotential(data)
  };
}

function identifyDifficultyZones(data: any[]) {
  const zones = {
    comfort: [], // Scores élevés, faible stress
    challenge: [], // Progression active
    frustration: [], // Scores bas, tentatives multiples
    mastery: [] // Scores élevés, vitesse élevée
  };
  
  data.forEach(game => {
    const score = game.score;
    const accuracy = game.accuracy_rate || 0;
    const engagement = game.engagement_score || 0;
    const speed = game.average_move_time_ms || 0;
    
    if (score > 800 && accuracy > 85 && speed < 1500) {
      zones.mastery.push(game);
    } else if (score > 600 && engagement > 70) {
      zones.challenge.push(game);
    } else if (score < 300 || accuracy < 50) {
      zones.frustration.push(game);
    } else {
      zones.comfort.push(game);
    }
  });
  
  return zones;
}

function analyzeErrorPatterns(data: any[]) {
  const patterns = {
    speedVsAccuracy: analyzeSpeedAccuracyTradeoff(data),
    operatorWeaknesses: identifyOperatorWeaknesses(data),
    difficultyThresholds: identifyDifficultyThresholds(data),
    timeOfDayEffects: analyzeTimeOfDayEffects(data),
    sessionFatiguePatterns: analyzeSessionFatigue(data)
  };
  
  return patterns;
}

function generatePedagogicalInsights(
  learningPatterns: any,
  behavioralProfile: any,
  progressionMetrics: any,
  difficultyZones: any,
  errorPatterns: any
) {
  const insights = {
    recommendedDifficulty: determineOptimalDifficulty(difficultyZones),
    suggestedOperatorFocus: suggestOperatorFocus(errorPatterns.operatorWeaknesses),
    idealSessionStructure: designIdealSession(behavioralProfile),
    motivationStrategy: determineMotivationStrategy(learningPatterns, behavioralProfile),
    adaptiveHints: generateAdaptiveHints(errorPatterns),
    progressionPlan: createProgressionPlan(progressionMetrics, learningPatterns)
  };
  
  return insights;
}

// Fonctions de calcul simplifiées (à développer selon les besoins)
function calculateLearningSpeed(data: any[]): number {
  // Calculer la vitesse d'apprentissage basée sur l'amélioration des scores
  if (data.length < 5) return 0;
  
  const firstFive = data.slice(0, 5).map(d => d.score);
  const lastFive = data.slice(-5).map(d => d.score);
  
  const firstAvg = firstFive.reduce((a, b) => a + b, 0) / firstFive.length;
  const lastAvg = lastFive.reduce((a, b) => a + b, 0) / lastFive.length;
  
  return (lastAvg - firstAvg) / data.length; // Points par jeu
}

function calculateConsistency(scores: number[]): number {
  if (scores.length < 2) return 100;
  
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  
  const coefficientOfVariation = stdDev / mean;
  return Math.max(0, 100 - (coefficientOfVariation * 100));
}

function hashUserId(userId: string): string {
  // Hash simple pour anonymisation (utiliser crypto en production)
  return `user_${userId.slice(-8)}`;
}

function anonymizePerformanceData(data: any[]): any[] {
  return data.map(d => ({
    ...d,
    id: `anon_${d.id.slice(-8)}`,
    user_id: undefined, // Supprimé pour anonymisation
    username: undefined // Supprimé pour anonymisation
  }));
}

function formatForTensorFlow(data: any[]) {
  // Format pour TensorFlow.js
  return {
    features: data.map(d => [
      d.score,
      d.level,
      Number(d.time_played_ms),
      d.accuracy_rate || 0,
      d.average_move_time_ms || 0,
      d.combo_max || 0
    ]),
    labels: data.map(d => d.difficulty_level === 'EASY' ? 0 : d.difficulty_level === 'MEDIUM' ? 1 : 2)
  };
}

function formatForTimeSeries(data: any[]) {
  // Format pour analyse temporelle
  return data.map(d => ({
    timestamp: new Date(d.created_at).getTime(),
    score: d.score,
    level: d.level,
    accuracy: d.accuracy_rate || 0,
    engagement: d.engagement_score || 0
  }));
}

function formatForClassification(data: any[]) {
  // Format pour classification des joueurs
  return data.map(d => ({
    features: {
      avgSpeed: d.average_move_time_ms || 0,
      accuracy: d.accuracy_rate || 0,
      hintsUsed: d.hints_used || 0,
      operator: d.operator,
      difficulty: d.difficulty_level
    },
    performance: d.score > 600 ? 'high' : d.score > 300 ? 'medium' : 'low'
  }));
}

function assessDataQuality(data: any[]) {
  return {
    completeness: calculateCompleteness(data),
    consistency: calculateDataConsistency(data),
    accuracy: assessDataAccuracy(data),
    freshness: calculateDataFreshness(data),
    volume: data.length,
    recommendation: data.length > 50 ? 'sufficient' : data.length > 20 ? 'moderate' : 'insufficient'
  };
}

// Stubs pour les autres fonctions (à implémenter selon les besoins)
function analyzeDifficultyAdaptation(data: any[]) { return {}; }
function analyzeOperatorPreferences(data: any[]) { return {}; }
function determineLearningStage(data: any[]) { return 'intermediate'; }
function determinePlayStyle(data: any[]) { return 'balanced'; }
function calculateRiskTolerance(data: any[]) { return 0.5; }
function calculatePersistance(data: any[]) { return 0.7; }
function calculateAdaptability(data: any[]) { return 0.6; }
function calculatePreferredSessionLength(data: any[]) { return 300000; } // 5 min en ms
function determineOptimalChallenge(data: any[]) { return 'medium'; }
function calculateLinearRegression(x: number[], y: number[]) { return { slope: 0.1, r_squared: 0.8 }; }
function identifyPlateaus(scores: number[]) { return []; }
function identifyAccelerations(scores: number[]) { return []; }
function predictNextScore(data: any[]) { return data[data.length - 1]?.score || 0; }
function calculateImprovementPotential(data: any[]) { return 0.8; }
function analyzeSpeedAccuracyTradeoff(data: any[]) { return {}; }
function identifyOperatorWeaknesses(data: any[]) { return {}; }
function identifyDifficultyThresholds(data: any[]) { return {}; }
function analyzeTimeOfDayEffects(data: any[]) { return {}; }
function analyzeSessionFatigue(data: any[]) { return {}; }
function determineOptimalDifficulty(zones: any) { return 'medium'; }
function suggestOperatorFocus(weaknesses: any) { return 'ADD'; }
function designIdealSession(profile: any) { return {}; }
function determineMotivationStrategy(learning: any, behavior: any) { return 'gamification'; }
function generateAdaptiveHints(patterns: any) { return []; }
function createProgressionPlan(metrics: any, patterns: any) { return {}; }
function calculateCompleteness(data: any[]) { return 0.9; }
function calculateDataConsistency(data: any[]) { return 0.85; }
function assessDataAccuracy(data: any[]) { return 0.95; }
function calculateDataFreshness(data: any[]) { return 0.8; }
function determineLearningStyle(profile: any) { return 'visual'; }
function buildCognitiveProfile(data: any[]) { return {}; }
function generateAdaptationSuggestions(patterns: any) { return []; }
function calculatePredictionError(actual: any, predicted: any) { return Math.abs(actual - predicted); }
function analyzeGlobalTemporalPatterns() { return {}; }
function identifyTypicalLearningCurves() { return []; }
function segmentPlayerProfiles() { return {}; }

export default router;
