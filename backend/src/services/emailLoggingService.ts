import { PrismaClient, EmailType, EmailStatus, IncomingEmailType, EmailPriority, IncomingEmailStatus, BounceType } from '@prisma/client';
import { getEmailConfig, getFromAddress, EmailType as ConfigEmailType } from '../config/emailConfig';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

/**
 * Service complet de gestion des emails avec logging
 */
export class EmailLoggingService {
  /**
   * Envoie un email et le log dans la base de données
   */
  static async sendAndLogEmail(emailType: ConfigEmailType, options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    templateName?: string;
    variables?: Record<string, any>;
  }) {
    const emailConfig = getEmailConfig(emailType);
    
    // Créer l'entrée de log avant l'envoi
    const emailLog = await prisma.emailLog.create({
      data: {
        emailType: this.mapEmailType(emailType),
        fromEmail: emailConfig.user,
        toEmail: options.to,
        subject: options.subject,
        htmlContent: options.html,
        textContent: options.text,
        status: 'PENDING',
        scheduledAt: new Date(),
      }
    });

    try {
      // Envoyer l'email
      const transporter = nodemailer.createTransport({
        host: emailConfig.smtpServer,
        port: emailConfig.smtpPort,
        secure: emailConfig.smtpPort === 465,
        auth: {
          user: emailConfig.user,
          pass: emailConfig.password,
        },
      });

      const mailOptions = {
        from: getFromAddress(emailType),
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const info = await transporter.sendMail(mailOptions);

      // Mettre à jour le log avec succès
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: 'SENT',
          messageId: info.messageId,
          smtpResponse: JSON.stringify(info),
          sentAt: new Date(),
        }
      });

      // Mettre à jour les statistiques
      await this.updateEmailStatistics(emailType, 'sent');

      console.log(`📧 Email envoyé avec succès depuis ${emailConfig.user}:`, {
        messageId: info.messageId,
        to: options.to,
        type: emailType,
        logId: emailLog.id
      });

      return { success: true, messageId: info.messageId, logId: emailLog.id };
    } catch (error) {
      // Mettre à jour le log avec l'erreur
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : String(error),
          retryCount: { increment: 1 },
        }
      });

      // Mettre à jour les statistiques
      await this.updateEmailStatistics(emailType, 'failed');

      console.error(`❌ Erreur lors de l'envoi d'email depuis ${emailConfig.user}:`, error);
      throw error;
    }
  }

  /**
   * Enregistre un email entrant
   */
  static async logIncomingEmail(data: {
    fromEmail: string;
    toEmail: string;
    subject?: string;
    body?: string;
    headers?: any;
    messageId?: string;
    emailType?: IncomingEmailType;
    priority?: EmailPriority;
    ticketId?: string;
    tags?: string[];
  }) {
    const incomingEmail = await prisma.incomingEmail.create({
      data: {
        fromEmail: data.fromEmail,
        toEmail: data.toEmail,
        subject: data.subject,
        body: data.body,
        headers: data.headers,
        messageId: data.messageId,
        emailType: data.emailType || 'SUPPORT',
        priority: data.priority || 'NORMAL',
        status: 'NEW',
        ticketId: data.ticketId,
        tags: data.tags || [],
      }
    });

    console.log(`📥 Email entrant enregistré:`, {
      id: incomingEmail.id,
      from: data.fromEmail,
      to: data.toEmail,
      type: data.emailType
    });

    return incomingEmail;
  }

  /**
   * Enregistre un bounce d'email
   */
  static async logEmailBounce(data: {
    emailLogId?: number;
    emailAddress: string;
    bounceType: BounceType;
    reason?: string;
    smtpResponse?: string;
  }) {
    const bounce = await prisma.emailBounce.create({
      data: {
        emailLogId: data.emailLogId,
        emailAddress: data.emailAddress,
        bounceType: data.bounceType,
        reason: data.reason,
        smtpResponse: data.smtpResponse,
      }
    });

    // Mettre à jour le statut de l'email log si applicable
    if (data.emailLogId) {
      await prisma.emailLog.update({
        where: { id: data.emailLogId },
        data: { status: 'BOUNCED' }
      });
    }

    // Mettre à jour les statistiques
    await this.updateEmailStatistics('noreply', 'bounced');

    console.log(`📧 Bounce enregistré:`, {
      id: bounce.id,
      email: data.emailAddress,
      type: data.bounceType,
      reason: data.reason
    });

    return bounce;
  }

  /**
   * Récupère les statistiques d'emails
   */
  static async getEmailStatistics(options: {
    emailType?: EmailType;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};
    
    if (options.emailType) {
      where.emailType = options.emailType;
    }
    
    if (options.startDate || options.endDate) {
      where.date = {};
      if (options.startDate) where.date.gte = options.startDate;
      if (options.endDate) where.date.lte = options.endDate;
    }

    return await prisma.emailStatistics.findMany({
      where,
      orderBy: { date: 'desc' }
    });
  }

  /**
   * Récupère les emails en attente de retry
   */
  static async getPendingEmails(maxRetries: number = 3) {
    return await prisma.emailLog.findMany({
      where: {
        status: 'FAILED',
        retryCount: { lt: maxRetries }
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  /**
   * Retry les emails échoués
   */
  static async retryFailedEmails() {
    const pendingEmails = await this.getPendingEmails();
    
    for (const emailLog of pendingEmails) {
      try {
        const emailConfig = getEmailConfig(this.mapConfigEmailType(emailLog.emailType));
        
        const transporter = nodemailer.createTransport({
          host: emailConfig.smtpServer,
          port: emailConfig.smtpPort,
          secure: emailConfig.smtpPort === 465,
          auth: {
            user: emailConfig.user,
            pass: emailConfig.password,
          },
        });

        const mailOptions = {
          from: getFromAddress(this.mapConfigEmailType(emailLog.emailType)),
          to: emailLog.toEmail,
          subject: emailLog.subject,
          html: emailLog.htmlContent || undefined,
          text: emailLog.textContent || undefined,
        };

        const info = await transporter.sendMail(mailOptions);
        const messageInfo = await info;

        await prisma.emailLog.update({
          where: { id: emailLog.id },
          data: {
            status: 'SENT',
            messageId: messageInfo.messageId,
            smtpResponse: JSON.stringify(info),
            sentAt: new Date(),
          }
        });

        console.log(`🔄 Email retry réussi:`, { logId: emailLog.id, messageId: messageInfo.messageId });
      } catch (error) {
        await prisma.emailLog.update({
          where: { id: emailLog.id },
          data: {
            retryCount: { increment: 1 },
            errorMessage: error instanceof Error ? error.message : String(error),
          }
        });

        console.error(`❌ Email retry échoué:`, { logId: emailLog.id, error });
      }
    }
  }

  /**
   * Récupère les emails entrants non traités
   */
  static async getUnprocessedIncomingEmails() {
    return await prisma.incomingEmail.findMany({
      where: {
        status: 'NEW'
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  /**
   * Met à jour le statut d'un email entrant
   */
  static async updateIncomingEmailStatus(id: number, status: IncomingEmailStatus, assignedTo?: string) {
    return await prisma.incomingEmail.update({
      where: { id },
      data: {
        status,
        assignedTo,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Met à jour les statistiques d'emails
   */
  private static async updateEmailStatistics(emailType: ConfigEmailType, action: 'sent' | 'failed' | 'bounced') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const mappedType = this.mapEmailType(emailType);

    const existingStats = await prisma.emailStatistics.findUnique({
      where: {
        emailType_date: {
          emailType: mappedType,
          date: today
        }
      }
    });

    if (existingStats) {
      await prisma.emailStatistics.update({
        where: { id: existingStats.id },
        data: {
          sentCount: action === 'sent' ? { increment: 1 } : undefined,
          failedCount: action === 'failed' ? { increment: 1 } : undefined,
          bouncedCount: action === 'bounced' ? { increment: 1 } : undefined,
        }
      });
    } else {
      await prisma.emailStatistics.create({
        data: {
          emailType: mappedType,
          date: today,
          sentCount: action === 'sent' ? 1 : 0,
          failedCount: action === 'failed' ? 1 : 0,
          bouncedCount: action === 'bounced' ? 1 : 0,
        }
      });
    }
  }

  /**
   * Mappe les types d'email de la config vers Prisma
   */
  private static mapEmailType(configType: ConfigEmailType): EmailType {
    switch (configType) {
      case 'hello': return 'HELLO';
      case 'support': return 'SUPPORT';
      case 'noreply': return 'NOREPLY';
      default: return 'NOREPLY';
    }
  }

  /**
   * Mappe les types d'email de Prisma vers la config
   */
  private static mapConfigEmailType(prismaType: EmailType): ConfigEmailType {
    switch (prismaType) {
      case 'HELLO': return 'hello';
      case 'SUPPORT': return 'support';
      case 'NOREPLY': return 'noreply';
      default: return 'noreply';
    }
  }

  /**
   * Nettoie les anciens logs d'emails
   */
  static async cleanupOldLogs(daysToKeep: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const deletedCount = await prisma.emailLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        status: { in: ['SENT', 'FAILED', 'BOUNCED'] }
      }
    });

    console.log(`🧹 Nettoyage des logs d'emails: ${deletedCount.count} entrées supprimées`);
    return deletedCount.count;
  }
}
