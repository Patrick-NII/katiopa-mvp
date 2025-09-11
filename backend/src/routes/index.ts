import express from 'express';
import authRoutes from './auth';
import chatRoutes from './chat';
import activityRoutes from './activity';
import statsRoutes from './stats';
import sessionsRoutes from './sessions';
import trackingRoutes from './tracking';
import experiencesRoutes from './experiences';
import cubematchRoutes from './cubematch';
import cubematchSettingsRoutes from './cubematch-settings';
import emailRoutes from './emails';
import reportRoutes from './reports';
import transactionalEmailRoutes from './transactional-emails';
import competencesRoutes from './competences';
import bubixRoutes from './bubix';
import exercisesRoutes from './exercises';
import testRoutes from './test';
import sessionsTestRoutes from './sessions-test';
import learningCyclesRoutes from './learning-cycles';

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

// Nouvelles routes d'expériences CubeAI
router.use('/experiences', experiencesRoutes);

// Routes CubeMatch
router.use('/cubematch', cubematchRoutes);
router.use('/cubematch', cubematchSettingsRoutes);

// Routes d'emails
router.use('/emails', emailRoutes);

// Routes de rapports quotidiens
router.use('/reports', reportRoutes);

// Routes d'emails transactionnels
router.use('/transactional-emails', transactionalEmailRoutes);

// Routes des compétences et exercices
router.use('/competences', competencesRoutes);

// Routes Bubix
router.use('/bubix', bubixRoutes);

// Routes des sessions utilisateur (pour les données radar)
router.use('/user-sessions', competencesRoutes);

// Routes des exercices
router.use('/exercises', exercisesRoutes);

// Routes de test (temporaires)
router.use('/test', testRoutes);

// Routes de test des sessions (avec auth temporaire)
router.use('/sessions-test', sessionsTestRoutes);

// Routes des cycles d'apprentissage (temporaire)
router.use('/learning-cycles', learningCyclesRoutes);

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
      tracking: '/api/tracking',
      experiences: '/api/experiences',
      cubematch: '/api/cubematch',
      emails: '/api/emails',
      reports: '/api/reports',
      transactionalEmails: '/api/transactional-emails'
    }
  });
});

export default router;
