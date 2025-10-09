/**
 * 🤖 NUMÉROMAGIC BUBIX DATA API
 * 
 * Routes pour exposer les données NuméroMagic à BubiX pour l'analyse IA
 * Similaire aux routes CubeMatch mais adapté pour NuméroMagic
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../../middleware/auth';
import { getNumeroMagicData, getNumeroMagicTrainingDataset } from '../../services/numeromagic-ai-integration';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/numeromagic/bubix-data/:userId
 * Récupérer les données NuméroMagic pour l'analyse BubiX
 */
router.get('/bubix-data/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`🤖 Récupération données NuméroMagic BubiX pour utilisateur: ${userId}`);

    const numeroMagicData = await getNumeroMagicData(userId);

    if (!numeroMagicData) {
      return res.json({
        success: true,
        hasData: false,
        message: 'Aucune donnée NuméroMagic disponible',
        data: null
      });
    }

    res.json({
      success: true,
      hasData: true,
      message: `Données NuméroMagic récupérées: ${numeroMagicData.totalGames} parties`,
      data: numeroMagicData
    });

  } catch (error) {
    console.error('❌ Erreur récupération données NuméroMagic BubiX:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des données NuméroMagic'
    });
  }
});

/**
 * GET /api/numeromagic/bubix-data/:userId/training-dataset
 * Générer un dataset d'entraînement pour BubiX basé sur NuméroMagic
 */
router.get('/bubix-data/:userId/training-dataset', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`🤖 Génération dataset NuméroMagic BubiX pour utilisateur: ${userId}`);

    const trainingDataset = await getNumeroMagicTrainingDataset(userId);

    res.json({
      success: true,
      hasData: trainingDataset.hasData,
      message: trainingDataset.hasData 
        ? `Dataset NuméroMagic généré: ${trainingDataset.totalGames} parties analysées`
        : trainingDataset.message || 'Aucune donnée NuméroMagic disponible',
      data: trainingDataset
    });

  } catch (error) {
    console.error('❌ Erreur génération dataset NuméroMagic BubiX:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération du dataset NuméroMagic'
    });
  }
});

/**
 * GET /api/numeromagic/bubix-data/:userId/analytics
 * Récupérer les analytics NuméroMagic pour BubiX
 */
router.get('/bubix-data/:userId/analytics', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`📊 Analytics NuméroMagic BubiX pour utilisateur: ${userId}`);

    // Récupérer les données de base
    const numeroMagicData = await getNumeroMagicData(userId);

    if (!numeroMagicData) {
      return res.json({
        success: true,
        hasData: false,
        message: 'Aucune donnée NuméroMagic disponible pour l\'analyse',
        analytics: null
      });
    }

    // Calculer les analytics avancées
    const analytics = {
      performance: {
        totalGames: numeroMagicData.totalGames,
        totalScore: numeroMagicData.totalScore,
        bestScore: numeroMagicData.bestScore,
        averageScore: numeroMagicData.averageScore,
        currentLevel: numeroMagicData.currentLevel,
        totalTimeMs: numeroMagicData.totalTimeMs,
        averageTimePerGame: numeroMagicData.averageTimePerGame
      },
      preferences: {
        favoriteMode: numeroMagicData.favoriteMode,
        preferredDifficulty: numeroMagicData.preferredDifficulty
      },
      trends: {
        // Progression des 5 dernières parties
        recentGames: numeroMagicData.scores.slice(0, 5).map((score: any) => ({
          date: score.createdAt,
          score: score.score,
          accuracy: score.accuracyRate,
          gameMode: score.gameMode,
          difficulty: score.difficultyLevel
        })),
        // Performance par mode
        modePerformance: Object.entries(numeroMagicData.operationStats).map(([mode, stats]: [string, any]) => ({
          mode,
          games: stats.games,
          averageScore: stats.averageScore,
          averageAccuracy: stats.averageAccuracy
        }))
      },
      insights: {
        strengths: [],
        improvements: [],
        recommendations: []
      }
    };

    // Générer des insights basiques
    if (numeroMagicData.averageScore > 200) {
      analytics.insights.strengths.push('Excellent niveau de score moyen');
    }
    if (numeroMagicData.favoriteMode === 'TIMED') {
      analytics.insights.strengths.push('Bon en mode chronométré (vitesse)');
    }
    if (numeroMagicData.preferredDifficulty === 'HARD' || numeroMagicData.preferredDifficulty === 'EXPERT') {
      analytics.insights.strengths.push('Affectionne les défis difficiles');
    }

    if (numeroMagicData.averageScore < 100) {
      analytics.insights.improvements.push('Travailler sur les stratégies de scoring');
    }
    if (numeroMagicData.currentLevel < 3) {
      analytics.insights.improvements.push('Progresser vers des niveaux plus élevés');
    }

    if (numeroMagicData.favoriteMode === 'CLASSIC') {
      analytics.insights.recommendations.push('Essayer le mode TIMED pour développer la rapidité');
    }
    if (numeroMagicData.preferredDifficulty === 'EASY') {
      analytics.insights.recommendations.push('Tenter la difficulté MEDIUM pour plus de challenge');
    }

    res.json({
      success: true,
      hasData: true,
      message: `Analytics NuméroMagic générées pour ${numeroMagicData.totalGames} parties`,
      analytics
    });

  } catch (error) {
    console.error('❌ Erreur analytics NuméroMagic BubiX:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération des analytics NuméroMagic'
    });
  }
});

export default router;
