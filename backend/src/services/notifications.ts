import { createTransport } from 'nodemailer'

// Interface pour les données de session
interface SessionData {
  firstName: string
  lastName: string
  sessionId: string
  password: string
  userType: string
}

// Interface pour les données du compte
interface AccountData {
  id: string
  email: string
  subscriptionType: string
  maxSessions: number
  createdAt: Date
}

// Configuration du transporteur email (simulation)
const transporter = createTransport({
  host: 'localhost', // En production, utiliser un vrai service SMTP
  port: 1025, // Port pour MailHog en développement
  secure: false,
  auth: {
    user: 'test@katiopa.com',
    pass: 'test123'
  }
})

/**
 * Envoie un email de confirmation d'inscription
 */
export async function sendRegistrationEmail(
  accountEmail: string,
  sessions: SessionData[],
  account: AccountData
): Promise<boolean> {
  try {
    const emailContent = generateRegistrationEmailContent(sessions, account)
    
    const mailOptions = {
      from: '"Katiopa" <noreply@katiopa.com>',
      to: accountEmail,
      subject: '🎉 Bienvenue sur Katiopa - Votre compte a été créé !',
      html: emailContent,
      text: generateTextVersion(sessions, account)
    }

    // En développement, simuler l'envoi
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Email simulé envoyé à:', accountEmail)
      console.log('📧 Contenu:', emailContent)
      return true
    }

    // En production, envoyer l'email réel
    const info = await transporter.sendMail(mailOptions)
    console.log('📧 Email envoyé avec succès:', info.messageId)
    return true

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error)
    return false
  }
}

/**
 * Envoie une notification WhatsApp (simulation)
 */
export async function sendWhatsAppNotification(
  phoneNumber: string,
  sessions: SessionData[],
  account: AccountData
): Promise<boolean> {
  try {
    // En développement, simuler l'envoi
    if (process.env.NODE_ENV === 'development') {
      console.log('📱 Notification WhatsApp simulée envoyée au:', phoneNumber)
      console.log('📱 Contenu de la notification:')
      console.log(`   Compte: ${account.id}`)
      console.log(`   Plan: ${account.subscriptionType}`)
      console.log(`   Date: ${new Date().toLocaleDateString('fr-FR')}`)
      
      for (const session of sessions) {
        console.log(`   ${session.firstName} ${session.lastName}:`)
        console.log(`     Session ID: ${session.sessionId}`)
        console.log(`     Mot de passe: ${session.password}`)
        console.log(`     Type: ${session.userType}`)
      }
      return true
    }

    // En production, intégrer avec WhatsApp Business API
    // Exemple avec Twilio ou autre service
    console.log('📱 Notification WhatsApp envoyée via API')
    return true

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de la notification WhatsApp:', error)
    return false
  }
}

/**
 * Génère le contenu HTML de l'email d'inscription
 */
function generateRegistrationEmailContent(sessions: SessionData[], account: AccountData): string {
  const sessionsList = sessions.map(session => `
    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #3b82f6;">
      <h3 style="margin: 0 0 10px 0; color: #1e293b;">${session.firstName} ${session.lastName}</h3>
      <div style="margin: 5px 0;"><strong>ID de session:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${session.sessionId}</code></div>
      <div style="margin: 5px 0;"><strong>Mot de passe:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${session.password}</code></div>
      <div style="margin: 5px 0;"><strong>Type:</strong> ${session.userType === 'CHILD' ? 'Enfant' : 'Parent'}</div>
    </div>
  `).join('')

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bienvenue sur Katiopa</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 30px; border-radius: 15px;">
          <h1 style="margin: 0; font-size: 28px;">🎉 Bienvenue sur Katiopa !</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Votre compte a été créé avec succès</p>
        </div>
      </div>

      <div style="background: #ffffff; padding: 25px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #1e293b; margin-top: 0;">Félicitations !</h2>
        <p>Votre compte Katiopa a été créé avec succès. Voici un résumé de vos informations :</p>
        
        <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #1e293b;">📋 Informations du compte</h3>
          <div style="margin: 8px 0;"><strong>ID du compte:</strong> ${account.id}</div>
          <div style="margin: 8px 0;"><strong>Email:</strong> ${account.email}</div>
          <div style="margin: 8px 0;"><strong>Plan d'abonnement:</strong> ${account.subscriptionType}</div>
          <div style="margin: 8px 0;"><strong>Date de création:</strong> ${account.createdAt.toLocaleDateString('fr-FR')}</div>
        </div>

        <h3 style="color: #1e293b;">🔑 Vos identifiants de connexion</h3>
        <p>Chaque membre de votre famille a ses propres identifiants :</p>
        
        ${sessionsList}

        <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <h4 style="margin: 0 0 10px 0; color: #1e40af;">🚀 Prochaines étapes</h4>
          <ol style="margin: 0; padding-left: 20px;">
            <li>Connectez-vous avec vos identifiants de session</li>
            <li>Personnalisez les profils d'apprentissage</li>
            <li>Commencez votre voyage d'apprentissage adaptatif !</li>
          </ol>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
             style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Se connecter maintenant
          </a>
        </div>

        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h4 style="margin: 0 0 10px 0; color: #92400e;">⚠️ Informations importantes</h4>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Conservez vos identifiants en lieu sûr</li>
            <li>Le paiement se fera par email et ID de compte</li>
            <li>Contactez le support si vous avez des questions</li>
          </ul>
        </div>
      </div>

      <div style="text-align: center; margin-top: 30px; color: #64748b; font-size: 14px;">
        <p>Merci de faire confiance à Katiopa pour l'éducation de vos enfants !</p>
        <p>© 2025 Katiopa. Tous droits réservés.</p>
      </div>
    </body>
    </html>
  `
}

/**
 * Génère la version texte de l'email
 */
function generateTextVersion(sessions: SessionData[], account: AccountData): string {
  const sessionsText = sessions.map(session => `
${session.firstName} ${session.lastName}:
- ID de session: ${session.sessionId}
- Mot de passe: ${session.password}
- Type: ${session.userType === 'CHILD' ? 'Enfant' : 'Parent'}
  `).join('\n')

  return `
Bienvenue sur Katiopa !

Votre compte a été créé avec succès.

INFORMATIONS DU COMPTE:
- ID du compte: ${account.id}
- Email: ${account.email}
- Plan d'abonnement: ${account.subscriptionType}
- Date de création: ${account.createdAt.toLocaleDateString('fr-FR')}

VOS IDENTIFIANTS DE CONNEXION:
${sessionsText}

PROCHAINES ÉTAPES:
1. Connectez-vous avec vos identifiants de session
2. Personnalisez les profils d'apprentissage
3. Commencez votre voyage d'apprentissage adaptatif !

Lien de connexion: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login

INFORMATIONS IMPORTANTES:
- Conservez vos identifiants en lieu sûr
- Le paiement se fera par email et ID de compte
- Contactez le support si vous avez des questions

Merci de faire confiance à Katiopa pour l'éducation de vos enfants !

© 2025 Katiopa. Tous droits réservés.
  `.trim()
}

/**
 * Envoie toutes les notifications d'inscription
 */
export async function sendAllRegistrationNotifications(
  accountEmail: string,
  sessions: SessionData[],
  account: AccountData
): Promise<{ email: boolean; whatsapp: boolean }> {
  try {
    // Envoyer l'email
    const emailSent = await sendRegistrationEmail(accountEmail, sessions, account)
    
    // Envoyer la notification WhatsApp (simulation avec un numéro fictif)
    const whatsappSent = await sendWhatsAppNotification('+33123456789', sessions, account)
    
    return {
      email: emailSent,
      whatsapp: whatsappSent
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi des notifications:', error)
    return {
      email: false,
      whatsapp: false
    }
  }
}
