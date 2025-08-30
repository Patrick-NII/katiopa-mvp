import nodemailer from 'nodemailer';

interface WelcomeEmailData {
  toEmail: string;
  toName: string;
  subscriptionType: string;
  familyMembers: any[];
  createdSessions: any[];
  registrationId: string;
}

export async function sendWelcomeEmail(data: WelcomeEmailData) {
  const { toEmail, toName, subscriptionType, familyMembers, createdSessions, registrationId } = data;

  // Configuration du transporteur email
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true pour 465, false pour les autres ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Déterminer le plan d'abonnement
  const getPlanName = (type: string) => {
    switch (type) {
      case 'FREE': return 'Starter (Gratuit)';
      case 'PRO': return 'Pro';
      case 'PRO_PLUS': return 'Premium';
      default: return type;
    }
  };

  // Générer la liste des identifiants de connexion
  const generateLoginCredentials = () => {
    return createdSessions.map(session => {
      const member = familyMembers.find(m => 
        m.firstName === session.firstName && m.lastName === session.lastName
      );
      return {
        name: `${session.firstName} ${session.lastName}`,
        type: session.userType === 'PARENT' ? 'Parent' : 'Enfant',
        sessionId: session.sessionId,
        password: member?.password || `${session.firstName.toLowerCase()}123`
      };
    });
  };

  const credentials = generateLoginCredentials();

  // Contenu de l'email
  const emailContent = `
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
        .credential-item {
            background: white;
            padding: 15px;
            margin: 10px 0;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
        }
        .credential-label {
            font-weight: 600;
            color: #374151;
            margin-bottom: 5px;
        }
        .credential-value {
            font-family: 'Courier New', monospace;
            background: #f3f4f6;
            padding: 8px 12px;
            border-radius: 4px;
            color: #1f2937;
            font-size: 0.9rem;
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
        .highlight {
            background: #fef3c7;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #f59e0b;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">CubeAI</div>
        <div class="welcome-title">Bienvenue ${toName} ! 🎉</div>
        <p>Votre compte a été créé avec succès</p>
    </div>
    
    <div class="content">
        <p>Bonjour ${toName},</p>
        
        <p>Nous sommes ravis de vous accueillir dans l'aventure CubeAI ! Votre compte a été créé avec succès et vous pouvez dès maintenant commencer à explorer notre plateforme éducative innovante.</p>
        
        <div class="section">
            <div class="section-title">📋 Détails de votre inscription</div>
            <p><strong>ID d'inscription :</strong> ${registrationId}</p>
            <p><strong>Plan choisi :</strong> ${getPlanName(subscriptionType)}</p>
            <p><strong>Membres de la famille :</strong> ${familyMembers.length}</p>
        </div>
        
        <div class="section">
            <div class="section-title">🔐 Vos identifiants de connexion</div>
            <p>Voici les identifiants pour chaque membre de votre famille :</p>
            
            ${credentials.map(cred => `
                <div class="credential-item">
                    <div class="credential-label">${cred.name} (${cred.type})</div>
                    <div><strong>ID de session :</strong> <span class="credential-value">${cred.sessionId}</span></div>
                    <div><strong>Mot de passe :</strong> <span class="credential-value">${cred.password}</span></div>
                </div>
            `).join('')}
        </div>
        
        <div class="highlight">
            <strong>💡 Conseil de sécurité :</strong> Nous vous recommandons de changer les mots de passe par défaut après votre première connexion.
        </div>
        
        <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="cta-button">
                Se connecter maintenant →
            </a>
        </div>
        
        <div class="section">
            <div class="section-title">🚀 Prochaines étapes</div>
            <ol style="margin: 0; padding-left: 20px;">
                <li>Connectez-vous avec vos identifiants</li>
                <li>Explorez la plateforme et ses fonctionnalités</li>
                <li>Configurez les préférences de votre enfant</li>
                <li>Commencez votre première session d'apprentissage</li>
            </ol>
        </div>
        
        <div class="section">
            <div class="section-title">📞 Besoin d'aide ?</div>
            <p>Notre équipe est là pour vous accompagner :</p>
            <ul style="margin: 0; padding-left: 20px;">
                <li>📧 Support par email : support@cubeai.com</li>
                <li>💬 Chat en ligne : Disponible sur la plateforme</li>
                <li>📖 Guide d'utilisation : Accessible depuis votre tableau de bord</li>
            </ul>
        </div>
        
        <div class="footer">
            <p>© 2024 CubeAI. Tous droits réservés.</p>
            <p>Cet email a été envoyé à ${toEmail}</p>
        </div>
    </div>
</body>
</html>
  `;

  // Options de l'email
  const mailOptions = {
    from: `"CubeAI" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `Bienvenue chez CubeAI ! Votre compte a été créé (${registrationId})`,
    html: emailContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email de bienvenue envoyé avec succès:', {
      messageId: info.messageId,
      to: toEmail,
      registrationId
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email de bienvenue:', error);
    throw error;
  }
}
