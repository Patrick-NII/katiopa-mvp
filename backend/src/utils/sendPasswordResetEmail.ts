import nodemailer from 'nodemailer';
import { getEmailConfig, getFromAddress } from '../config/emailConfig';

interface PasswordResetEmailData {
  toEmail: string;
  toName: string;
  resetLink: string;
}

export async function sendPasswordResetEmail(data: PasswordResetEmailData) {
  const { toEmail, toName, resetLink } = data;

  // Configuration du transporteur email - Utilise noreply pour les emails automatiques
  const emailConfig = getEmailConfig("noreply");
  
  const transporter = nodemailer.createTransport({
    host: emailConfig.smtpServer,
    port: emailConfig.smtpPort,
    secure: emailConfig.smtpPort === 465, // 465 => TLS
    auth: { 
      user: emailConfig.user, 
      pass: emailConfig.password 
    },
  });

  const html = `
  <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg,#3b82f6,#8b5cf6); color:#fff; padding:24px; border-radius:12px 12px 0 0;">
      <h1 style="margin:0; font-size:22px;">Réinitialisation du mot de passe</h1>
    </div>
    <div style="background:#fff; padding:24px; border-radius:0 0 12px 12px;">
      <p>Bonjour ${toName || ''},</p>
      <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe. Ce lien expirera dans 60 minutes.</p>
      <p style="text-align:center; margin:24px 0;">
        <a href="${resetLink}" style="display:inline-block; background:linear-gradient(135deg,#3b82f6,#8b5cf6); color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none;">Réinitialiser le mot de passe</a>
      </p>
      <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
      <p style="color:#6b7280; font-size:12px;">© 2024 CubeAI</p>
    </div>
  </div>`;

  const info = await transporter.sendMail({
    from: getFromAddress("noreply"),
    to: toEmail,
    subject: 'Réinitialisation de mot de passe',
    html,
  });

  console.log('📧 Email de réinitialisation envoyé avec succès:', {
    messageId: info.messageId,
    to: toEmail,
    from: emailConfig.user
  });

  return { success: true, messageId: info.messageId };
}

