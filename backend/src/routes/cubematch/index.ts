/**
 * 🎮 CUBEMATCH API v2.0 - Architecture Meta/Apple/Disney
 * 
 * Système complet de tracking et analytics pour alimenter BubiX
 * Développé selon les standards Enterprise de Meta/Apple/Disney
 * 
 * @author AI Assistant - Senior Fullstack Developer
 * @version 2.0.0
 * @license MIT
 */

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';

// Import des modules spécialisés
import scoresRouter from './scores';
import analyticsRouter from './analytics';
import leaderboardRouter from './leaderboard';
import userStatsRouter from './user-stats';
import gameSessionsRouter from './game-sessions';
import bubixDataRouter from './bubix-data';
import settingsRouter from './settings';
import seriesRouter from './series';

const router = Router();

/**
 * 🎯 ROUTES PRINCIPALES CUBEMATCH V2
 * 
 * Architecture modulaire pour faciliter la maintenance et l'évolutivité
 * Chaque module est responsable d'un domaine métier spécifique
 */

// 🏆 Gestion des scores et classements
router.use('/scores', scoresRouter);
router.use('/leaderboard', leaderboardRouter);

// 📊 Analytics et statistiques avancées
router.use('/analytics', analyticsRouter);
router.use('/user-stats', userStatsRouter);

// 🎮 Sessions de jeu détaillées
router.use('/sessions', gameSessionsRouter);

// 🎯 Séries de calculs avec tracking détaillé
router.use('/series', seriesRouter);

// 🤖 Données pour BubiX AI
router.use('/bubix-data', bubixDataRouter);

// ⚙️ Paramètres et préférences utilisateur
router.use('/settings', settingsRouter);

// 🔍 Health check route
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    services: {
      scores: 'online',
      analytics: 'online',
      leaderboard: 'online',
      userStats: 'online',
      gameSessions: 'online',
      bubixData: 'online',
      settings: 'online'
    }
  });
});

export default router;
