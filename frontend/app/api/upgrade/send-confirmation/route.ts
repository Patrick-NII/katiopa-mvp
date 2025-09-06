// app/api/upgrade/send-confirmation/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { planId, email, childName } = body

    console.log('📧 Envoi email de confirmation:', { planId, email, childName })

    // Simuler l'envoi d'email (en production, utiliser SendGrid/Nodemailer)
    const emailContent = {
      to: email,
      subject: `🎉 Confirmation d'abonnement CubeAI - ${planId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3B82F6, #8B5CF6); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">🎉 Félicitations !</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Votre abonnement CubeAI est activé</p>
          </div>
          
          <div style="padding: 30px; background: #f8fafc;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Bonjour !</h2>
            
            <p style="color: #4b5563; line-height: 1.6;">
              Nous sommes ravis de vous confirmer que votre abonnement <strong>${planId}</strong> 
              est maintenant actif pour accompagner ${childName} dans son apprentissage !
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <h3 style="color: #059669; margin-top: 0;">✨ Ce qui vous attend :</h3>
              <ul style="color: #4b5563; line-height: 1.8;">
                ${planId === 'PRO' ? `
                  <li>💬 Chat Bubix illimité avec IA GPT-4o-mini</li>
                  <li>📊 Analyses avancées illimitées</li>
                  <li>🎮 CubeMatch illimité</li>
                  <li>📞 Support prioritaire</li>
                  <li>📈 Rapports hebdomadaires détaillés</li>
                ` : `
                  <li>👑 Tout Pro inclus</li>
                  <li>🧠 IA GPT-4o premium (le plus avancé)</li>
                  <li>🔮 Analyses prédictives</li>
                  <li>📱 Support VIP + WhatsApp</li>
                  <li>☁️ Sauvegarde cloud automatique</li>
                  <li>📜 Certificats de progression</li>
                `}
              </ul>
            </div>
            
            <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1d4ed8; margin-top: 0;">🚀 Prochaines étapes :</h3>
              <ol style="color: #4b5563; line-height: 1.8;">
                <li>Connectez-vous à votre dashboard</li>
                <li>Explorez toutes les nouvelles fonctionnalités</li>
                <li>Configurez le profil d'apprentissage de ${childName}</li>
                <li>Commencez à profiter de l'accompagnement personnalisé</li>
              </ol>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard" 
                 style="background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Accéder à mon dashboard
              </a>
            </div>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0;">📅 Informations importantes :</h3>
              <ul style="color: #6b7280; line-height: 1.6;">
                <li><strong>Prochain prélèvement :</strong> ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}</li>
                <li><strong>Montant :</strong> €${planId === 'PRO' ? '9.99' : '19.99'}/mois</li>
                <li><strong>Annulation :</strong> Possible à tout moment depuis votre compte</li>
              </ul>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px;">
              Merci de faire confiance à CubeAI pour accompagner ${childName} dans son épanouissement !<br>
              <strong>L'équipe CubeAI</strong>
            </p>
          </div>
        </div>
      `
    }

    // En production, remplacer par un vrai service d'email
    console.log('📧 Email de confirmation généré:', {
      to: emailContent.to,
      subject: emailContent.subject,
      planId,
      childName
    })

    // Simuler l'envoi réussi
    await new Promise(resolve => setTimeout(resolve, 1000))

    return NextResponse.json({
      success: true,
      message: 'Email de confirmation envoyé',
      emailSent: true
    })

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi de l\'email de confirmation' },
      { status: 500 }
    )
  }
}
