import express from 'express';
import authRoutes from './auth';
import chatRoutes from './chat';
import activityRoutes from './activity';
import statsRoutes from './stats';
import sessionsRoutes from './sessions';
import trackingRoutes from './tracking';

const router = express.Router();

// Routes d'authentification
router.use('/auth', authRoutes);

// Routes de chat
router.use('/chat', chatRoutes);

// Routes d'activités
router.use('/activities', activityRoutes);

// Routes de statistiques
router.use('/stats', statsRoutes);

// Routes de sessions
router.use('/sessions', sessionsRoutes);

// Routes de tracking
router.use('/tracking', trackingRoutes);

// Route de test de l'API
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API Katiopa fonctionnelle',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    endpoints: {
      auth: '/api/auth',
      chat: '/api/chat',
      activities: '/api/activities',
      stats: '/api/stats',
      sessions: '/api/sessions',
      tracking: '/api/tracking'
    }
  });
});

export default router;
