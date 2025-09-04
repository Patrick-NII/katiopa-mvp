import express from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { prisma } from '../prisma';

// Fonction pour formater la durée en format lisible
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  } else if (minutes < 1440) { // moins de 24h
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  } else {
    const days = Math.floor(minutes / 1440);
    const remainingHours = Math.floor((minutes % 1440) / 60);
    const remainingMinutes = minutes % 60;
    if (remainingHours > 0) {
      return remainingMinutes > 0 ? `${days}j ${remainingHours}h ${remainingMinutes}min` : `${days}j ${remainingHours}h`;
    } else {
      return remainingMinutes > 0 ? `${days}j ${remainingMinutes}min` : `${days}j`;
    }
  }
}

const router = express.Router();

// Route pour récupérer les statistiques des activités
router.get("/activities", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        error: 'Utilisateur non authentifié',
        code: 'UNAUTHORIZED'
      });
    }

    // Récupérer toutes les activités de l'utilisateur
    const activities = await prisma.activity.findMany({
      where: {
        userSessionId: userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculer les statistiques
    const totalActivities = activities.length;
    const totalScore = activities.reduce((sum, activity) => sum + (activity.score || 0), 0);
    const averageScore = totalActivities > 0 ? Math.round(totalScore / totalActivities) : 0;

    // Grouper par domaine
    const domains = activities.reduce((acc, activity) => {
      if (!acc[activity.domain]) {
        acc[activity.domain] = {
          name: activity.domain,
          count: 0,
          totalScore: 0,
          activities: []
        };
      }
      acc[activity.domain].count++;
      acc[activity.domain].totalScore += activity.score || 0;
      acc[activity.domain].activities.push(activity);
      return acc;
    }, {} as Record<string, any>);

    // Calculer la moyenne par domaine
    const domainsWithAvg = Object.values(domains).map((domain: any) => ({
      name: domain.name,
      count: domain.count,
      averageScore: Math.round(domain.totalScore / domain.count),
      activities: domain.activities
    }));

    res.json({
      success: true,
      data: {
        totalActivities,
        averageScore,
        domains: domainsWithAvg
      }
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Route pour récupérer un résumé des statistiques
router.get("/summary", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        error: 'Utilisateur non authentifié',
        code: 'UNAUTHORIZED'
      });
    }

    // Récupérer la session utilisateur avec son compte
    const userSession = await prisma.userSession.findUnique({
      where: { id: userId },
      include: {
        account: {
          include: {
            userSessions: {
              where: { isActive: true },
              include: {
                activities: true
              }
            }
          }
        },
        activities: true
      }
    });

    if (!userSession) {
      return res.status(404).json({
        error: 'Session utilisateur non trouvée',
        code: 'USER_NOT_FOUND'
      });
    }

    // Calculer les statistiques globales du compte
    const allActivities = userSession.account.userSessions.flatMap(session => session.activities);
    const totalActivities = allActivities.length;
    const totalScore = allActivities.reduce((sum, activity) => sum + (activity.score || 0), 0);
    const averageScore = totalActivities > 0 ? Math.round(totalScore / totalActivities) : 0;

    // Calculer le temps total de connexion du compte
    const totalConnectionTimeMs = userSession.account.userSessions.reduce((sum, session) => {
      let sessionTime = Number(session.totalConnectionDurationMs || 0);
      
      // Si la session a un startTime, calculer le temps de session actuelle
      if (session.currentSessionStartTime) {
        const now = new Date();
        const sessionStart = new Date(session.currentSessionStartTime);
        const currentSessionTimeMs = now.getTime() - sessionStart.getTime();
        sessionTime += currentSessionTimeMs;
      }
      
      return sum + sessionTime;
    }, 0);
    const totalTimeMinutes = Math.floor(totalConnectionTimeMs / (1000 * 60));

    // Grouper les activités par domaine
    const domains = allActivities.reduce((acc, activity) => {
      if (!acc[activity.domain]) {
        acc[activity.domain] = {
          name: activity.domain,
          count: 0,
          totalScore: 0,
          activities: []
        };
      }
      acc[activity.domain].count++;
      acc[activity.domain].totalScore += activity.score || 0;
      acc[activity.domain].activities.push(activity);
      return acc;
    }, {} as Record<string, any>);

    const domainsWithAvg = Object.values(domains).map((domain: any) => ({
      name: domain.name,
      count: domain.count,
      averageScore: Math.round(domain.totalScore / domain.count),
      activities: domain.activities
    }));

    res.json({
      success: true,
      data: {
        totalActivities,
        averageScore,
        totalTime: totalTimeMinutes,
        domains: domainsWithAvg,
        totalSessions: userSession.account.userSessions.length,
        // Ajouter le temps total depuis l'inscription
        totalTimeSinceRegistration: {
          totalMs: totalConnectionTimeMs,
          totalMinutes: totalTimeMinutes,
          totalHours: Math.floor(totalTimeMinutes / 60),
          totalDays: Math.floor(totalTimeMinutes / (60 * 24)),
          formatted: formatDuration(totalTimeMinutes)
        },
        accountCreatedAt: userSession.account.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du résumé:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

export default router;
