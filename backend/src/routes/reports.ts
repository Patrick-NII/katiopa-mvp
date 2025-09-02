import express from 'express';
import { PrismaClient } from '@prisma/client';
import { DailyReportService } from '../services/dailyReportService';
import { requireAuth } from '../middleware/requireAuth';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/reports/generate
 * Génère et envoie les rapports quotidiens (appelé par cron)
 */
router.post('/generate', async (req, res) => {
  try {
    const { date } = req.body;
    const targetDate = date ? new Date(date) : new Date();
    
    await DailyReportService.generateAndSendDailyReports(targetDate);
    
    res.json({ 
      success: true, 
      message: `Rapports générés pour ${targetDate.toISOString().split('T')[0]}` 
    });
  } catch (error) {
    console.error('Erreur lors de la génération des rapports:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * GET /api/reports/session/:sessionId
 * Récupère les rapports d'une session
 */
router.get('/session/:sessionId', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 10 } = req.query;

    const reports = await DailyReportService.getSessionReports(sessionId, parseInt(limit as string));
    
    res.json({ success: true, reports });
  } catch (error) {
    console.error('Erreur lors de la récupération des rapports:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * PUT /api/reports/preferences
 * Met à jour les préférences de rapport
 */
router.put('/preferences', requireAuth, async (req, res) => {
  try {
    const { accountId } = req.user!;
    const preferences = req.body;

    const updatedPreferences = await DailyReportService.updateReportPreferences(accountId, preferences);
    
    res.json({ success: true, preferences: updatedPreferences });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des préférences:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * POST /api/reports/disable/:sessionId
 * Désactive les rapports pour une session
 */
router.post('/disable/:sessionId', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    await DailyReportService.disableReports(sessionId);
    
    res.json({ success: true, message: 'Rapports désactivés' });
  } catch (error) {
    console.error('Erreur lors de la désactivation des rapports:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * GET /api/reports/statistics
 * Récupère les statistiques des rapports
 */
router.get('/statistics', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate, sessionId } = req.query;

    const where: any = {};
    if (sessionId) where.sessionId = sessionId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const reports = await prisma.dailyReport.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        session: {
          select: {
            childNickname: true,
            childAge: true
          }
        }
      }
    });

    // Calculer les statistiques
    const stats = {
      totalReports: reports.length,
      sentReports: reports.filter(r => r.status === 'sent').length,
      failedReports: reports.filter(r => r.status === 'failed').length,
      averageComprehension: reports.length > 0 ? 
        reports.reduce((sum, r) => sum + (r.kpisSnapshot as any).kpi_comprehension, 0) / reports.length : 0,
      averageProgression: reports.length > 0 ? 
        reports.reduce((sum, r) => sum + (r.kpisSnapshot as any).kpi_progression, 0) / reports.length : 0
    };

    res.json({ success: true, reports, statistics: stats });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * POST /api/reports/test/:sessionId
 * Génère un rapport de test pour une session
 */
router.post('/test/:sessionId', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { date } = req.body;
    const targetDate = date ? new Date(date) : new Date();

    // Récupérer la session
    const session = await prisma.userSession.findUnique({
      where: { id: sessionId },
      include: {
        account: true
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    // Générer le rapport de test
    await DailyReportService.generateAndSendReportForSession(session, targetDate);
    
    res.json({ success: true, message: 'Rapport de test généré et envoyé' });
  } catch (error) {
    console.error('Erreur lors de la génération du rapport de test:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * GET /api/reports/preview/:sessionId
 * Aperçu d'un rapport sans l'envoyer
 */
router.get('/preview/:sessionId', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();

    // Récupérer la session et ses stats
    const session = await prisma.userSession.findUnique({
      where: { id: sessionId },
      include: {
        account: true
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    // Préparer les données de test
    const reportData = {
      child_nickname: session.firstName,
      child_age: session.age || 0,
      date_iso: targetDate.toISOString().split('T')[0],
      date_fr: targetDate.toLocaleDateString('fr-FR'),
      kpi_assiduite: 75,
      kpi_comprehension: 80,
      kpi_progression: 70,
      total_time_min: 30,
      sessions_count: 1,
      best_module: 'Mathématiques',
      needs_help: 'Aucun module en difficulté',
      consecutive_days: 1,
      focus_score: 85,
      goals_json: JSON.stringify([]),
      parent_email: session.account.email
    };

    // Générer le contenu
    const reportContent = await DailyReportService.generateReportContent(reportData);
    const htmlContent = DailyReportService.buildEmailHTML(reportContent, reportData);
    const textContent = DailyReportService.buildEmailText(reportContent, reportData);

    res.json({
      success: true,
      preview: {
        subject: `CubeAI — Bilan du jour pour ${session.firstName} (${reportData.date_fr})`,
        html: htmlContent,
        text: textContent,
        data: reportData
      }
    });
  } catch (error) {
    console.error('Erreur lors de la génération de l\'aperçu:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

export default router;
