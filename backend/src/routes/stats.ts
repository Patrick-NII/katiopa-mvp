import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/activities", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userSessionId = req.user!.id;
    const activities = await prisma.activity.findMany({
      where: { userSessionId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    res.json(activities);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des activités:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

router.get("/summary", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userSessionId = req.user!.id;
    
    // Récupérer les statistiques de base
    const activities = await prisma.activity.findMany({
      where: { userSessionId },
      select: {
        score: true,
        durationMs: true,
        domain: true,
        attempts: true
      }
    });
    
    if (activities.length === 0) {
      return res.json({
        totalActivities: 0,
        totalTime: 0,
        averageScore: 0,
        domains: [],
        recentActivity: null
      });
    }
    
    // Calculer les statistiques
    const totalActivities = activities.length;
    const totalTimeMs = activities.reduce((sum, act) => sum + (act.durationMs || 0), 0);
    const totalTime = Math.round(totalTimeMs / 60000); // en minutes
    const averageScore = Math.round(activities.reduce((sum, act) => sum + act.score, 0) / totalActivities);
    
    // Logs pour déboguer
    console.log('🔍 Stats calculées:', {
      totalActivities,
      totalTimeMs,
      totalTime,
      averageScore,
      sampleActivity: activities[0]
    });
    
    // Compter les domaines
    const domainCounts = activities.reduce((acc, act) => {
      acc[act.domain] = (acc[act.domain] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const domains = Object.entries(domainCounts).map(([domain, count]) => ({
      domain,
      count,
      averageScore: Math.round(
        activities
          .filter(act => act.domain === domain)
          .reduce((sum, act) => sum + act.score, 0) / count
      )
    }));
    
    // Activité récente
    const recentActivity = activities[0] ? {
      domain: activities[0].domain,
      score: activities[0].score,
      date: activities[0].createdAt
    } : null;
    
    res.json({
      totalActivities,
      totalTime,
      averageScore,
      domains,
      recentActivity
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du résumé:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

export default router;