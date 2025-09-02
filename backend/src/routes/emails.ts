import express from 'express';
import { PrismaClient } from '@prisma/client';
import { EmailLoggingService } from '../services/emailLoggingService';
import { EmailService } from '../services/emailService';
import { requireAuth } from '../middleware/requireAuth';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/emails/incoming
 * Enregistre un email entrant (webhook)
 */
router.post('/incoming', async (req, res) => {
  try {
    const { fromEmail, toEmail, subject, body, headers, messageId, emailType, priority, ticketId, tags } = req.body;

    const incomingEmail = await EmailLoggingService.logIncomingEmail({
      fromEmail,
      toEmail,
      subject,
      body,
      headers,
      messageId,
      emailType,
      priority,
      ticketId,
      tags
    });

    res.json({ success: true, emailId: incomingEmail.id });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'email entrant:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * POST /api/emails/bounce
 * Enregistre un bounce d'email (webhook)
 */
router.post('/bounce', async (req, res) => {
  try {
    const { emailLogId, emailAddress, bounceType, reason, smtpResponse } = req.body;

    const bounce = await EmailLoggingService.logEmailBounce({
      emailLogId,
      emailAddress,
      bounceType,
      reason,
      smtpResponse
    });

    res.json({ success: true, bounceId: bounce.id });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du bounce:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * GET /api/emails/statistics
 * Récupère les statistiques d'emails
 */
router.get('/statistics', requireAuth, async (req, res) => {
  try {
    const { emailType, startDate, endDate } = req.query;

    const statistics = await EmailLoggingService.getEmailStatistics({
      emailType: emailType as any,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    });

    res.json({ success: true, statistics });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * GET /api/emails/logs
 * Récupère les logs d'emails
 */
router.get('/logs', requireAuth, async (req, res) => {
  try {
    const { emailType, status, limit = 50, offset = 0 } = req.query;

    const where: any = {};
    if (emailType) where.emailType = emailType;
    if (status) where.status = status;

    const logs = await prisma.emailLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    const total = await prisma.emailLog.count({ where });

    res.json({ 
      success: true, 
      logs, 
      pagination: { 
        total, 
        limit: parseInt(limit as string), 
        offset: parseInt(offset as string) 
      } 
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des logs:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * GET /api/emails/incoming
 * Récupère les emails entrants
 */
router.get('/incoming', requireAuth, async (req, res) => {
  try {
    const { status, emailType, limit = 50, offset = 0 } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (emailType) where.emailType = emailType;

    const emails = await prisma.incomingEmail.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    const total = await prisma.incomingEmail.count({ where });

    res.json({ 
      success: true, 
      emails, 
      pagination: { 
        total, 
        limit: parseInt(limit as string), 
        offset: parseInt(offset as string) 
      } 
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des emails entrants:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * PUT /api/emails/incoming/:id/status
 * Met à jour le statut d'un email entrant
 */
router.put('/incoming/:id/status', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedTo } = req.body;

    const email = await EmailLoggingService.updateIncomingEmailStatus(
      parseInt(id), 
      status, 
      assignedTo
    );

    res.json({ success: true, email });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * POST /api/emails/retry
 * Retry les emails échoués
 */
router.post('/retry', requireAuth, async (req, res) => {
  try {
    await EmailLoggingService.retryFailedEmails();
    res.json({ success: true, message: 'Retry des emails échoués lancé' });
  } catch (error) {
    console.error('Erreur lors du retry des emails:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * POST /api/emails/cleanup
 * Nettoie les anciens logs
 */
router.post('/cleanup', requireAuth, async (req, res) => {
  try {
    const { daysToKeep = 90 } = req.body;
    const deletedCount = await EmailLoggingService.cleanupOldLogs(daysToKeep);
    res.json({ success: true, deletedCount });
  } catch (error) {
    console.error('Erreur lors du nettoyage:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * POST /api/emails/send
 * Envoie un email de test
 */
router.post('/send', requireAuth, async (req, res) => {
  try {
    const { type, toEmail, toName, subject, content } = req.body;

    let result;
    switch (type) {
      case 'welcome':
        result = await EmailService.sendWelcomeEmail({
          toEmail,
          toName,
          subscriptionType: 'PRO',
          familyMembers: [],
          createdSessions: [],
          registrationId: 'TEST-123'
        });
        break;
      case 'password_reset':
        result = await EmailService.sendPasswordResetEmail({
          toEmail,
          toName,
          resetLink: 'https://cube-ai.fr/reset?token=test'
        });
        break;
      case 'support':
        result = await EmailService.sendSupportEmail({
          toEmail,
          toName,
          subject: subject || 'Test Support',
          message: content || 'Ceci est un email de test'
        });
        break;
      default:
        return res.status(400).json({ error: 'Type d\'email non supporté' });
    }

    res.json({ success: true, result });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de test:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

export default router;
