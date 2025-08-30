import express from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { prisma } from '../prisma';

const router = express.Router();

// Route pour enregistrer une interaction utilisateur
router.post("/interaction", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const accountId = req.user?.accountId;
    
    if (!userId || !accountId) {
      return res.status(401).json({
        error: 'Utilisateur non authentifié',
        code: 'UNAUTHORIZED'
      });
    }

    const {
      interactionType,
      elementType,
      elementId,
      elementName,
      elementValue,
      pageUrl,
      pageTitle,
      metadata,
      sessionDuration
    } = req.body;

    // Validation des données requises
    if (!interactionType || !elementType) {
      return res.status(400).json({
        error: 'Type d\'interaction et type d\'élément requis',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Enregistrer l'interaction
    const interaction = await prisma.userInteraction.create({
      data: {
        userSessionId: userId,
        accountId: accountId,
        interactionType,
        elementType,
        elementId,
        elementName,
        elementValue,
        pageUrl,
        pageTitle,
        metadata,
        sessionDuration,
        timestamp: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Interaction enregistrée avec succès',
      data: interaction
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'enregistrement de l\'interaction:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Route pour enregistrer un prompt utilisateur
router.post("/prompt", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const accountId = req.user?.accountId;
    
    if (!userId || !accountId) {
      return res.status(401).json({
        error: 'Utilisateur non authentifié',
        code: 'UNAUTHORIZED'
      });
    }

    const {
      promptType,
      content,
      context,
      response,
      responseTime,
      tokensUsed,
      modelUsed,
      success,
      errorMessage
    } = req.body;

    // Validation des données requises
    if (!promptType || !content) {
      return res.status(400).json({
        error: 'Type de prompt et contenu requis',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Enregistrer le prompt
    const prompt = await prisma.userPrompt.create({
      data: {
        userSessionId: userId,
        accountId: accountId,
        promptType,
        content,
        context,
        response,
        responseTime,
        tokensUsed,
        modelUsed,
        success: success ?? true,
        errorMessage,
        timestamp: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Prompt enregistré avec succès',
      data: prompt
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'enregistrement du prompt:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Route pour démarrer une session de navigation
router.post("/navigation/start", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const accountId = req.user?.accountId;
    
    if (!userId || !accountId) {
      return res.status(401).json({
        error: 'Utilisateur non authentifié',
        code: 'UNAUTHORIZED'
      });
    }

    const { initialPage, sessionData } = req.body;

    // Créer une nouvelle session de navigation
    const navigationSession = await prisma.navigationSession.create({
      data: {
        userSessionId: userId,
        accountId: accountId,
        startTime: new Date(),
        pagesVisited: initialPage ? [initialPage] : [],
        sessionData
      }
    });

    res.json({
      success: true,
      message: 'Session de navigation démarrée',
      data: navigationSession
    });

  } catch (error) {
    console.error('❌ Erreur lors du démarrage de la session de navigation:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Route pour mettre à jour une session de navigation
router.put("/navigation/:sessionId", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.params;
    const { pageUrl, actionPerformed, sessionData } = req.body;

    // Vérifier que la session appartient à l'utilisateur
    const session = await prisma.navigationSession.findFirst({
      where: {
        id: sessionId,
        userSessionId: userId
      }
    });

    if (!session) {
      return res.status(404).json({
        error: 'Session de navigation non trouvée',
        code: 'SESSION_NOT_FOUND'
      });
    }

    // Mettre à jour la session
    const updatedSession = await prisma.navigationSession.update({
      where: { id: sessionId },
      data: {
        pagesVisited: pageUrl ? [...session.pagesVisited, pageUrl] : session.pagesVisited,
        actionsPerformed: {
          increment: actionPerformed ? 1 : 0
        },
        sessionData: sessionData || session.sessionData
      }
    });

    res.json({
      success: true,
      message: 'Session de navigation mise à jour',
      data: updatedSession
    });

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de la session de navigation:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Route pour terminer une session de navigation
router.put("/navigation/:sessionId/end", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.params;

    // Vérifier que la session appartient à l'utilisateur
    const session = await prisma.navigationSession.findFirst({
      where: {
        id: sessionId,
        userSessionId: userId
      }
    });

    if (!session) {
      return res.status(404).json({
        error: 'Session de navigation non trouvée',
        code: 'SESSION_NOT_FOUND'
      });
    }

    const endTime = new Date();
    const duration = endTime.getTime() - session.startTime.getTime();

    // Terminer la session
    const endedSession = await prisma.navigationSession.update({
      where: { id: sessionId },
      data: {
        endTime,
        duration
      }
    });

    res.json({
      success: true,
      message: 'Session de navigation terminée',
      data: endedSession
    });

  } catch (error) {
    console.error('❌ Erreur lors de la terminaison de la session de navigation:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Route pour enregistrer une métrique de performance
router.post("/metric", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const accountId = req.user?.accountId;
    
    if (!userId || !accountId) {
      return res.status(401).json({
        error: 'Utilisateur non authentifié',
        code: 'UNAUTHORIZED'
      });
    }

    const {
      metricType,
      value,
      unit,
      context
    } = req.body;

    // Validation des données requises
    if (!metricType || value === undefined) {
      return res.status(400).json({
        error: 'Type de métrique et valeur requis',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Enregistrer la métrique
    const metric = await prisma.performanceMetric.create({
      data: {
        userSessionId: userId,
        accountId: accountId,
        metricType,
        value,
        unit,
        context,
        timestamp: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Métrique enregistrée avec succès',
      data: metric
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'enregistrement de la métrique:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Route pour récupérer les statistiques de tracking
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const accountId = req.user?.accountId;
    
    if (!userId || !accountId) {
      return res.status(401).json({
        error: 'Utilisateur non authentifié',
        code: 'UNAUTHORIZED'
      });
    }

    // Récupérer les statistiques des 30 derniers jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [interactions, prompts, navigationSessions, metrics] = await Promise.all([
      // Interactions
      prisma.userInteraction.count({
        where: {
          userSessionId: userId,
          timestamp: { gte: thirtyDaysAgo }
        }
      }),
      
      // Prompts
      prisma.userPrompt.count({
        where: {
          userSessionId: userId,
          timestamp: { gte: thirtyDaysAgo }
        }
      }),
      
      // Sessions de navigation
      prisma.navigationSession.count({
        where: {
          userSessionId: userId,
          startTime: { gte: thirtyDaysAgo }
        }
      }),
      
      // Métriques
      prisma.performanceMetric.count({
        where: {
          userSessionId: userId,
          timestamp: { gte: thirtyDaysAgo }
        }
      })
    ]);

    // Récupérer les interactions par type
    const interactionsByType = await prisma.userInteraction.groupBy({
      by: ['interactionType'],
      where: {
        userSessionId: userId,
        timestamp: { gte: thirtyDaysAgo }
      },
      _count: {
        interactionType: true
      }
    });

    // Récupérer les prompts par type
    const promptsByType = await prisma.userPrompt.groupBy({
      by: ['promptType'],
      where: {
        userSessionId: userId,
        timestamp: { gte: thirtyDaysAgo }
      },
      _count: {
        promptType: true
      }
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalInteractions: interactions,
          totalPrompts: prompts,
          totalNavigationSessions: navigationSessions,
          totalMetrics: metrics
        },
        interactionsByType,
        promptsByType,
        period: '30_days'
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques de tracking:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

export default router;
