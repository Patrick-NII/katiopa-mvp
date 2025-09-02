import { getEmailConfig, getFromAddress, EmailType } from '../config/emailConfig';
import { EmailLoggingService } from './emailLoggingService';
import nodemailer from 'nodemailer';

/**
 * Service centralisé pour l'envoi d'emails avec sélection automatique du type d'email
 */
export class EmailService {
  /**
   * Envoie un email de bienvenue (utilise hello@cube-ai.fr)
   */
  static async sendWelcomeEmail(data: {
    toEmail: string;
    toName: string;
    subscriptionType: string;
    familyMembers: any[];
    createdSessions: any[];
    registrationId: string;
  }) {
    return this.sendEmail('hello', {
      to: data.toEmail,
      subject: `Bienvenue chez CubeAI ! Votre compte a été créé (${data.registrationId})`,
      html: this.buildWelcomeEmailContent(data),
    });
  }

  /**
   * Envoie un email de réinitialisation de mot de passe (utilise noreply@cube-ai.fr)
   */
  static async sendPasswordResetEmail(data: {
    toEmail: string;
    toName: string;
    resetLink: string;
  }) {
    return this.sendEmail('noreply', {
      to: data.toEmail,
      subject: 'Réinitialisation de mot de passe',
      html: this.buildPasswordResetEmailContent(data),
    });
  }

  /**
   * Envoie un email de support (utilise support@cube-ai.fr)
   */
  static async sendSupportEmail(data: {
    toEmail: string;
    toName: string;
    subject: string;
    message: string;
    ticketId?: string;
  }) {
    return this.sendEmail('support', {
      to: data.toEmail,
      subject: `Support CubeAI${data.ticketId ? ` - Ticket #${data.ticketId}` : ''}`,
      html: this.buildSupportEmailContent(data),
    });
  }

  /**
   * Envoie un email de facturation (utilise noreply@cube-ai.fr)
   */
  static async sendBillingEmail(data: {
    toEmail: string;
    toName: string;
    invoiceNumber: string;
    amount: string;
    dueDate: string;
    downloadUrl: string;
  }) {
    return this.sendEmail('noreply', {
      to: data.toEmail,
      subject: `Facture CubeAI - ${data.invoiceNumber}`,
      html: this.buildBillingEmailContent(data),
    });
  }

  /**
   * Envoie un email de marketing (utilise hello@cube-ai.fr)
   */
  static async sendMarketingEmail(data: {
    toEmail: string;
    toName: string;
    subject: string;
    content: string;
    ctaText?: string;
    ctaUrl?: string;
  }) {
    return this.sendEmail('hello', {
      to: data.toEmail,
      subject: data.subject,
      html: this.buildMarketingEmailContent(data),
    });
  }

  /**
   * Méthode générique pour envoyer un email avec logging
   */
  private static async sendEmail(emailType: EmailType, options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }) {
    return EmailLoggingService.sendAndLogEmail(emailType, options);
  }

  /**
   * Construit le contenu HTML pour l'email de bienvenue
   */
  private static buildWelcomeEmailContent(data: any): string {
    // Réutiliser le contenu existant du fichier sendWelcomeEmail.ts
    // Cette méthode devrait être déplacée depuis sendWelcomeEmail.ts
    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenue chez CubeAI !</title>
        <style>
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8fafc;
            }
            .header {
                background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 12px 12px 0 0;
            }
            .content {
                background: white;
                padding: 30px;
                border-radius: 0 0 12px 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .logo {
                font-size: 2.5rem;
                font-weight: bold;
                margin-bottom: 10px;
            }
            .welcome-title {
                font-size: 1.8rem;
                margin-bottom: 10px;
            }
            .section {
                margin: 25px 0;
                padding: 20px;
                background: #f8fafc;
                border-radius: 8px;
                border-left: 4px solid #3b82f6;
            }
            .section-title {
                font-weight: bold;
                color: #1f2937;
                margin-bottom: 15px;
                font-size: 1.1rem;
            }
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                margin: 20px 0;
                text-align: center;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 0.9rem;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">CubeAI</div>
            <div class="welcome-title">Bienvenue ${data.toName} ! 🎉</div>
            <p>Votre compte a été créé avec succès</p>
        </div>
        
        <div class="content">
            <p>Bonjour ${data.toName},</p>
            
            <p>Nous sommes ravis de vous accueillir dans l'aventure CubeAI ! Votre compte a été créé avec succès et vous pouvez dès maintenant commencer à explorer notre plateforme éducative innovante.</p>
            
            <div class="section">
                <div class="section-title">📋 Détails de votre inscription</div>
                <p><strong>ID d'inscription :</strong> ${data.registrationId}</p>
                <p><strong>Plan choisi :</strong> ${data.subscriptionType}</p>
                <p><strong>Membres de la famille :</strong> ${data.familyMembers.length}</p>
            </div>
            
            <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="cta-button">
                    Se connecter maintenant →
                </a>
            </div>
            
            <div class="section">
                <div class="section-title">📞 Besoin d'aide ?</div>
                <p>Notre équipe est là pour vous accompagner :</p>
                <ul style="margin: 0; padding-left: 20px;">
                    <li>📧 Support par email : support@cube-ai.fr</li>
                    <li>💬 Chat en ligne : Disponible sur la plateforme</li>
                    <li>📖 Guide d'utilisation : Accessible depuis votre tableau de bord</li>
                </ul>
            </div>
            
            <div class="footer">
                <p>© 2024 CubeAI. Tous droits réservés.</p>
                <p>Cet email a été envoyé à ${data.toEmail}</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Construit le contenu HTML pour l'email de réinitialisation de mot de passe
   */
  private static buildPasswordResetEmailContent(data: any): string {
    return `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg,#3b82f6,#8b5cf6); color:#fff; padding:24px; border-radius:12px 12px 0 0;">
            <h1 style="margin:0; font-size:22px;">Réinitialisation du mot de passe</h1>
        </div>
        <div style="background:#fff; padding:24px; border-radius:0 0 12px 12px;">
            <p>Bonjour ${data.toName || ''},</p>
            <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe. Ce lien expirera dans 60 minutes.</p>
            <p style="text-align:center; margin:24px 0;">
                <a href="${data.resetLink}" style="display:inline-block; background:linear-gradient(135deg,#3b82f6,#8b5cf6); color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none;">Réinitialiser le mot de passe</a>
            </p>
            <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
            <p style="color:#6b7280; font-size:12px;">© 2024 CubeAI</p>
        </div>
    </div>`;
  }

  /**
   * Construit le contenu HTML pour l'email de support
   */
  private static buildSupportEmailContent(data: any): string {
    return `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg,#10b981,#059669); color:#fff; padding:24px; border-radius:12px 12px 0 0;">
            <h1 style="margin:0; font-size:22px;">Support CubeAI</h1>
        </div>
        <div style="background:#fff; padding:24px; border-radius:0 0 12px 12px;">
            <p>Bonjour ${data.toName},</p>
            <p>${data.message}</p>
            ${data.ticketId ? `<p><strong>Numéro de ticket :</strong> ${data.ticketId}</p>` : ''}
            <p>Notre équipe de support vous répondra dans les plus brefs délais.</p>
            <p style="color:#6b7280; font-size:12px;">© 2024 CubeAI - Support</p>
        </div>
    </div>`;
  }

  /**
   * Construit le contenu HTML pour l'email de facturation
   */
  private static buildBillingEmailContent(data: any): string {
    return `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg,#f59e0b,#d97706); color:#fff; padding:24px; border-radius:12px 12px 0 0;">
            <h1 style="margin:0; font-size:22px;">Facture CubeAI</h1>
        </div>
        <div style="background:#fff; padding:24px; border-radius:0 0 12px 12px;">
            <p>Bonjour ${data.toName},</p>
            <p>Votre facture est prête.</p>
            <div style="background:#f9fafb; padding:16px; border-radius:8px; margin:16px 0;">
                <p><strong>Numéro de facture :</strong> ${data.invoiceNumber}</p>
                <p><strong>Montant :</strong> ${data.amount}</p>
                <p><strong>Date d'échéance :</strong> ${data.dueDate}</p>
            </div>
            <p style="text-align:center; margin:24px 0;">
                <a href="${data.downloadUrl}" style="display:inline-block; background:linear-gradient(135deg,#f59e0b,#d97706); color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none;">Télécharger la facture</a>
            </p>
            <p style="color:#6b7280; font-size:12px;">© 2024 CubeAI</p>
        </div>
    </div>`;
  }

  /**
   * Construit le contenu HTML pour l'email de marketing
   */
  private static buildMarketingEmailContent(data: any): string {
    return `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg,#ec4899,#be185d); color:#fff; padding:24px; border-radius:12px 12px 0 0;">
            <h1 style="margin:0; font-size:22px;">CubeAI</h1>
        </div>
        <div style="background:#fff; padding:24px; border-radius:0 0 12px 12px;">
            <p>Bonjour ${data.toName},</p>
            <div style="margin:16px 0;">
                ${data.content}
            </div>
            ${data.ctaText && data.ctaUrl ? `
            <p style="text-align:center; margin:24px 0;">
                <a href="${data.ctaUrl}" style="display:inline-block; background:linear-gradient(135deg,#ec4899,#be185d); color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none;">${data.ctaText}</a>
            </p>
            ` : ''}
            <p style="color:#6b7280; font-size:12px;">© 2024 CubeAI - Équipe</p>
        </div>
    </div>`;
  }
}
