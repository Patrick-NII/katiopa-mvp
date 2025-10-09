/**
 * 🔢 NUMÉROMAGIC API ROUTER
 * 
 * Router principal pour toutes les routes NuméroMagic
 */

import { Router } from 'express';
import scoresRouter from './scores';
import statsRouter from './stats';
import leaderboardRouter from './leaderboard';
import bubixDataRouter from './bubix-data';

const router = Router();

// Monter les sous-routes
router.use('/scores', scoresRouter);
router.use('/stats', statsRouter);
router.use('/leaderboard', leaderboardRouter);
router.use('/', bubixDataRouter);

// Route de test
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    game: 'NuméroMagic',
    routes: [
      '/scores',
      '/stats',
      '/leaderboard',
      '/bubix-data/:userId',
      '/bubix-data/:userId/training-dataset',
      '/bubix-data/:userId/analytics'
    ]
  });
});

export default router;

