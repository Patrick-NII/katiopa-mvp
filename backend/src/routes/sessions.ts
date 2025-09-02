import express from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { prisma } from '../prisma';

const router = express.Router();

// Route pour récupérer les sessions actives d'un compte
router.get("/active", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        error: 'Utilisateur non authentifié',
        code: 'UNAUTHORIZED'
      });
    }

    // Récupérer le compte de l'utilisateur connecté
    const userSession = await prisma.userSession.findUnique({
      where: { id: userId },
      include: {
        account: true
      }
    });

    if (!userSession) {
      return res.status(404).json({
        error: 'Session utilisateur non trouvée',
        code: 'USER_NOT_FOUND'
      });
    }

    // Récupérer toutes les sessions du compte
    const sessions = await prisma.userSession.findMany({
      where: {
        accountId: userSession.accountId,
        isActive: true
      },
      select: {
        id: true,
        sessionId: true,
        firstName: true,
        lastName: true,
        userType: true,
        lastLoginAt: true,
        currentSessionStartTime: true,
        totalConnectionDurationMs: true,
        createdAt: true
      },
      orderBy: {
        lastLoginAt: 'desc'
      }
    });

    // Calculer le temps total de connexion pour chaque session
    const sessionsWithTime = sessions.map(session => {
      let totalTimeMs = Number(session.totalConnectionDurationMs || 0);
      
      // Si la session a un startTime, calculer le temps de session actuelle
      if (session.currentSessionStartTime) {
        const now = new Date();
        const sessionStart = new Date(session.currentSessionStartTime);
        const currentSessionTimeMs = now.getTime() - sessionStart.getTime();
        totalTimeMs += currentSessionTimeMs;
      }
      
      const totalTimeMinutes = Math.floor(totalTimeMs / (1000 * 60));
      
      return {
        id: session.id,
        sessionId: session.sessionId,
        name: `${session.firstName} ${session.lastName}`,
        userType: session.userType,
        totalTime: totalTimeMinutes,
        lastActivity: session.lastLoginAt,
        isCurrentlyActive: !!session.currentSessionStartTime,
        createdAt: session.createdAt,
        currentSessionStartTime: session.currentSessionStartTime
      };
    });

    // Filtrer les sessions actives (avec currentSessionStartTime)
    const activeSessions = sessionsWithTime.filter(session => session.isCurrentlyActive);

    res.json({
      success: true,
      data: activeSessions,
      accountInfo: {
        accountId: userSession.accountId,
        subscriptionType: userSession.account.subscriptionType,
        maxSessions: userSession.account.maxSessions
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des sessions actives:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Route pour récupérer toutes les sessions d'un utilisateur
router.get("/user", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        error: 'Utilisateur non authentifié',
        code: 'UNAUTHORIZED'
      });
    }

    const userSession = await prisma.userSession.findUnique({
      where: { id: userId },
      include: {
        account: {
          include: {
            userSessions: {
              where: { isActive: true },
              select: {
                id: true,
                sessionId: true,
                firstName: true,
                lastName: true,
                userType: true,
                lastLoginAt: true,
                currentSessionStartTime: true,
                totalConnectionDurationMs: true,
                createdAt: true
              }
            }
          }
        }
      }
    });

    if (!userSession) {
      return res.status(404).json({
        error: 'Session utilisateur non trouvée',
        code: 'USER_NOT_FOUND'
      });
    }

    const sessions = userSession.account.userSessions.map(session => {
      let totalTimeMs = Number(session.totalConnectionDurationMs || 0);
      
      // Si la session a un startTime, calculer le temps de session actuelle
      if (session.currentSessionStartTime) {
        const now = new Date();
        const sessionStart = new Date(session.currentSessionStartTime);
        const currentSessionTimeMs = now.getTime() - sessionStart.getTime();
        totalTimeMs += currentSessionTimeMs;
      }
      
      const totalTimeMinutes = Math.floor(totalTimeMs / (1000 * 60));
      
      return {
        id: session.id,
        sessionId: session.sessionId,
        name: `${session.firstName} ${session.lastName}`,
        userType: session.userType,
        totalTime: totalTimeMinutes,
        lastActivity: session.lastLoginAt,
        isCurrentlyActive: !!session.currentSessionStartTime,
        createdAt: session.createdAt,
        currentSessionStartTime: session.currentSessionStartTime
      };
    });

    res.json({
      success: true,
      data: sessions,
      accountInfo: {
        accountId: userSession.accountId,
        subscriptionType: userSession.account.subscriptionType,
        maxSessions: userSession.account.maxSessions
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des sessions utilisateur:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Route pour mettre à jour le temps de connexion
router.post("/update-time", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        error: 'Utilisateur non authentifié',
        code: 'UNAUTHORIZED'
      });
    }

    // Récupérer la session utilisateur
    const userSession = await prisma.userSession.findUnique({
      where: { id: userId }
    });

    if (!userSession) {
      return res.status(404).json({
        error: 'Session utilisateur non trouvée',
        code: 'USER_NOT_FOUND'
      });
    }

    // Si la session a un startTime, calculer et mettre à jour le temps total
    if (userSession.currentSessionStartTime) {
      const now = new Date();
      const sessionStart = new Date(userSession.currentSessionStartTime);
      const currentSessionTimeMs = now.getTime() - sessionStart.getTime();
      
      // Mettre à jour le temps total de connexion
      await prisma.userSession.update({
        where: { id: userId },
        data: {
          totalConnectionDurationMs: BigInt(Number(userSession.totalConnectionDurationMs || 0) + currentSessionTimeMs),
          currentSessionStartTime: now // Redémarrer le compteur de session actuelle
        }
      });

      // Mettre à jour aussi le temps total du compte
      await prisma.account.update({
        where: { id: userSession.accountId },
        data: {
          totalAccountConnectionDurationMs: {
            increment: BigInt(currentSessionTimeMs)
          }
        }
      });
    }

    res.json({
      success: true,
      message: 'Temps de connexion mis à jour'
    });
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du temps de connexion:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

export default router;
