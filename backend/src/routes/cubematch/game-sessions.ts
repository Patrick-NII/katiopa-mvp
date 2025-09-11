/**
 * 🎮 CUBEMATCH GAME SESSIONS API
 * 
 * Gestion des sessions de jeu détaillées pour analytics avancées
 * Tracking en temps réel des comportements pour BubiX
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../../middleware/auth';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Schema de validation pour les sessions
const GameSessionSchema = z.object({
  sessionId: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  totalDurationMs: z.number().min(0).optional(),
  gamesPlayed: z.number().min(0).default(0),
  totalScore: z.number().min(0).default(0),
  averageScore: z.number().min(0).default(0),
  bestScore: z.number().min(0).default(0),
  
  // Patterns comportementaux
  pausesTaken: z.number().min(0).default(0),
  totalPauseTimeMs: z.number().min(0).default(0),
  averageGameDurationMs: z.number().min(0).default(0),
  
  // Analytics de performance
  improvementTrend: z.enum(['improving', 'stable', 'declining']).default('stable'),
  consistencyScore: z.number().min(0).max(100).default(0),
  focusScore: z.number().min(0).max(100).default(0),
  
  // Contexte de la session
  deviceType: z.string().optional(),
  screenResolution: z.string().optional(),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night']).optional(),
  dayOfWeek: z.string().optional(),
  
  // Métadonnées additionnelles
  metadata: z.record(z.any()).optional()
});

/**
 * 🎯 POST /api/cubematch/sessions/start - Démarrer une nouvelle session
 */
router.post('/start', requireAuth, async (req, res) => {
  try {
    const {
      deviceType,
      screenResolution,
      timeZone,
      metadata = {}
    } = req.body;
    
    const userId = req.user!.userId;
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🎮 Nouvelle session CubeMatch pour ${req.user!.sessionId}: ${sessionId}`);
    
    // Terminer toute session en cours
    await terminateActiveSessions(userId);
    
    // Déterminer le moment de la journée
    const hour = new Date().getHours();
    const timeOfDay = hour < 6 ? 'night' : 
                     hour < 12 ? 'morning' : 
                     hour < 18 ? 'afternoon' : 'evening';
    
    // Créer la nouvelle session
    const session = {
      sessionId,
      userId,
      username: req.user!.sessionId,
      startTime: new Date(),
      endTime: null,
      status: 'active',
      
      // Contexte
      deviceType: deviceType || 'unknown',
      screenResolution: screenResolution || 'unknown',
      timeOfDay,
      dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      timeZone: timeZone || 'UTC',
      
      // Métriques initiales
      gamesPlayed: 0,
      totalScore: 0,
      averageScore: 0,
      bestScore: 0,
      pausesTaken: 0,
      totalPauseTimeMs: 0,
      
      // Métadonnées
      metadata: JSON.stringify({
        ...metadata,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        createdAt: new Date().toISOString()
      })
    };
    
    // TODO: Sauvegarder dans une table GameSessions (à créer)
    console.log('📝 Session enregistrée:', session);
    
    res.status(201).json({
      success: true,
      sessionId,
      message: 'Session démarrée avec succès',
      startTime: session.startTime.toISOString(),
      context: {
        timeOfDay,
        dayOfWeek: session.dayOfWeek,
        deviceType: session.deviceType
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur démarrage session:', error);
    res.status(500).json({
      error: 'Erreur lors du démarrage de la session'
    });
  }
});

/**
 * ⏸️ POST /api/cubematch/sessions/:sessionId/pause - Mettre en pause
 */
router.post('/:sessionId/pause', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user!.userId;
    
    console.log(`⏸️ Pause session ${sessionId} pour ${req.user!.sessionId}`);
    
    // TODO: Mettre à jour la session avec le timestamp de pause
    const pauseData = {
      sessionId,
      userId,
      pausedAt: new Date(),
      pauseReason: req.body.reason || 'user_initiated'
    };
    
    console.log('⏸️ Pause enregistrée:', pauseData);
    
    res.json({
      success: true,
      message: 'Session mise en pause',
      pausedAt: pauseData.pausedAt.toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur pause session:', error);
    res.status(500).json({
      error: 'Erreur lors de la mise en pause'
    });
  }
});

/**
 * ▶️ POST /api/cubematch/sessions/:sessionId/resume - Reprendre
 */
router.post('/:sessionId/resume', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user!.userId;
    
    console.log(`▶️ Reprise session ${sessionId} pour ${req.user!.sessionId}`);
    
    // TODO: Calculer le temps de pause et mettre à jour
    const resumeData = {
      sessionId,
      userId,
      resumedAt: new Date(),
      pauseDurationMs: req.body.pauseDurationMs || 0
    };
    
    console.log('▶️ Reprise enregistrée:', resumeData);
    
    res.json({
      success: true,
      message: 'Session reprise',
      resumedAt: resumeData.resumedAt.toISOString(),
      totalPauseTime: resumeData.pauseDurationMs
    });
    
  } catch (error) {
    console.error('❌ Erreur reprise session:', error);
    res.status(500).json({
      error: 'Erreur lors de la reprise'
    });
  }
});

/**
 * 🎯 POST /api/cubematch/sessions/:sessionId/game-completed - Jeu terminé
 */
router.post('/:sessionId/game-completed', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user!.userId;
    const {
      score,
      level,
      duration,
      accuracy,
      operator,
      difficulty
    } = req.body;
    
    console.log(`🎯 Jeu terminé dans session ${sessionId}: ${score} points`);
    
    // TODO: Mettre à jour les statistiques de session
    const gameData = {
      sessionId,
      userId,
      score,
      level,
      duration,
      accuracy,
      operator,
      difficulty,
      completedAt: new Date()
    };
    
    console.log('🎯 Jeu enregistré dans session:', gameData);
    
    res.json({
      success: true,
      message: 'Jeu enregistré dans la session',
      sessionStats: {
        gamesPlayed: 1, // TODO: Calculer depuis la base
        sessionScore: score,
        sessionAverage: score // TODO: Calculer moyenne réelle
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur enregistrement jeu:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'enregistrement du jeu'
    });
  }
});

/**
 * 🏁 POST /api/cubematch/sessions/:sessionId/end - Terminer la session
 */
router.post('/:sessionId/end', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user!.userId;
    const {
      totalDurationMs,
      gamesPlayed,
      totalScore,
      reason = 'user_ended'
    } = req.body;
    
    console.log(`🏁 Fin session ${sessionId} pour ${req.user!.sessionId}`);
    
    // Calculer les statistiques finales
    const endTime = new Date();
    const sessionSummary = {
      sessionId,
      userId,
      endTime,
      totalDurationMs: totalDurationMs || 0,
      gamesPlayed: gamesPlayed || 0,
      totalScore: totalScore || 0,
      averageScore: gamesPlayed > 0 ? Math.round(totalScore / gamesPlayed) : 0,
      reason,
      
      // Analytics de performance
      sessionEfficiency: calculateSessionEfficiency(totalScore, totalDurationMs),
      engagementScore: calculateEngagementScore(gamesPlayed, totalDurationMs),
      improvementTrend: req.body.improvementTrend || 'stable'
    };
    
    // TODO: Finaliser la session dans la base de données
    console.log('🏁 Session terminée:', sessionSummary);
    
    // Générer des insights pour BubiX
    const sessionInsights = generateSessionInsights(sessionSummary);
    
    res.json({
      success: true,
      message: 'Session terminée avec succès',
      summary: sessionSummary,
      insights: sessionInsights,
      nextRecommendation: generateNextSessionRecommendation(sessionSummary)
    });
    
  } catch (error) {
    console.error('❌ Erreur fin session:', error);
    res.status(500).json({
      error: 'Erreur lors de la fin de session'
    });
  }
});

/**
 * 📊 GET /api/cubematch/sessions/:userId/history - Historique des sessions
 */
router.get('/:userId/history', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    
    // Vérifier l'autorisation
    if (req.user!.userId !== userId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    // TODO: Récupérer depuis la table GameSessions
    const mockSessions = generateMockSessionHistory(userId, limit, offset);
    
    // Analyser les patterns de sessions
    const sessionPatterns = analyzeSessionPatterns(mockSessions);
    
    res.json({
      success: true,
      data: {
        sessions: mockSessions,
        patterns: sessionPatterns,
        pagination: {
          limit,
          offset,
          total: mockSessions.length
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur historique sessions:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération de l\'historique'
    });
  }
});

/**
 * 📈 GET /api/cubematch/sessions/:userId/analytics - Analytics des sessions
 */
router.get('/:userId/analytics', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const timeRange = req.query.timeRange as string || '30d';
    
    if (req.user!.userId !== userId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    // TODO: Calculer depuis les vraies données
    const analytics = {
      totalSessions: 15,
      averageSessionDuration: 420000, // 7 minutes
      averageGamesPerSession: 3.2,
      bestSessionScore: 2500,
      
      // Patterns temporels
      peakHours: ['14:00', '16:00', '20:00'],
      preferredDays: ['Mercredi', 'Samedi', 'Dimanche'],
      
      // Performance
      sessionEfficiencyTrend: 'improving',
      engagementTrend: 'stable',
      consistencyScore: 78,
      
      // Comportements
      averagePausesPerSession: 1.2,
      sessionEndReasons: {
        completed: 60,
        timeout: 25,
        user_ended: 15
      },
      
      // Recommandations
      optimalSessionLength: 360000, // 6 minutes
      recommendedBreakFrequency: 180000, // 3 minutes
      suggestedImprovements: [
        'Essayer des sessions plus courtes pour maintenir la concentration',
        'Prendre des pauses plus fréquentes pour éviter la fatigue',
        'Jouer plus souvent en fin d\'après-midi pour de meilleures performances'
      ]
    };
    
    res.json({
      success: true,
      userId,
      timeRange,
      analytics,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur analytics sessions:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'analyse des sessions'
    });
  }
});

// 🔧 Fonctions utilitaires

async function terminateActiveSessions(userId: string) {
  // TODO: Marquer toutes les sessions actives comme terminées
  console.log(`🔄 Fermeture des sessions actives pour ${userId}`);
}

function calculateSessionEfficiency(totalScore: number, durationMs: number): number {
  if (durationMs === 0) return 0;
  
  const scorePerMinute = totalScore / (durationMs / 60000);
  
  // Normaliser sur une échelle de 0-100
  return Math.min(100, Math.round(scorePerMinute / 10));
}

function calculateEngagementScore(gamesPlayed: number, durationMs: number): number {
  if (durationMs === 0) return 0;
  
  const gamesPerMinute = gamesPlayed / (durationMs / 60000);
  const idealGamesPerMinute = 0.5; // 1 jeu toutes les 2 minutes
  
  const engagement = (gamesPerMinute / idealGamesPerMinute) * 100;
  return Math.min(100, Math.round(engagement));
}

function generateSessionInsights(summary: any) {
  const insights = [];
  
  if (summary.averageScore > 500) {
    insights.push({
      type: 'positive',
      message: 'Excellente performance dans cette session !',
      icon: '🌟'
    });
  }
  
  if (summary.sessionEfficiency > 70) {
    insights.push({
      type: 'positive',
      message: 'Très efficace - bon ratio score/temps',
      icon: '⚡'
    });
  }
  
  if (summary.gamesPlayed > 5) {
    insights.push({
      type: 'warning',
      message: 'Session longue - pensez à prendre des pauses',
      icon: '⏰'
    });
  }
  
  return insights;
}

function generateNextSessionRecommendation(summary: any) {
  if (summary.averageScore < 300) {
    return {
      type: 'difficulty',
      message: 'Essayez un niveau de difficulté plus facile pour la prochaine session',
      action: 'reduce_difficulty'
    };
  }
  
  if (summary.sessionEfficiency < 30) {
    return {
      type: 'focus',
      message: 'Prenez une courte pause avant la prochaine session',
      action: 'take_break'
    };
  }
  
  return {
    type: 'continue',
    message: 'Bonne performance ! Continuez sur cette lancée',
    action: 'continue_current_settings'
  };
}

function generateMockSessionHistory(userId: string, limit: number, offset: number) {
  // TODO: Remplacer par de vraies données
  return Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
    sessionId: `session_${Date.now() - i * 86400000}_mock`,
    startTime: new Date(Date.now() - i * 86400000).toISOString(),
    endTime: new Date(Date.now() - i * 86400000 + 360000).toISOString(),
    duration: 360000 + Math.random() * 300000,
    gamesPlayed: Math.floor(Math.random() * 5) + 1,
    totalScore: Math.floor(Math.random() * 1000) + 200,
    averageScore: Math.floor(Math.random() * 400) + 200,
    bestScore: Math.floor(Math.random() * 600) + 400,
    deviceType: Math.random() > 0.5 ? 'desktop' : 'mobile',
    timeOfDay: ['morning', 'afternoon', 'evening'][Math.floor(Math.random() * 3)]
  }));
}

function analyzeSessionPatterns(sessions: any[]) {
  return {
    preferredTimeOfDay: 'afternoon',
    averageSessionLength: 420000,
    mostProductiveDay: 'Wednesday',
    devicePreference: 'desktop',
    sessionFrequency: 'daily',
    engagementTrend: 'stable'
  };
}

export default router;
