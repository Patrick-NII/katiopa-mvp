#!/usr/bin/env node

/**
 * Script de test simple pour envoyer une newsletter à tous les contacts
 * Version simplifiée sans les nouvelles tables de logging
 */

import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

interface Contact {
  email: string;
  name: string;
  type: 'parent' | 'prospect' | 'test';
  source?: string;
}

async function sendNewsletterTest() {
  console.log('📧 Démarrage du test de newsletter...');

  try {
    // Configuration email
    const emailConfig = {
      user: process.env.HELLO_EMAIL_USER || 'hello@cube-ai.fr',
      password: process.env.HELLO_EMAIL_PASSWORD,
      smtpServer: process.env.HELLO_SMTP_SERVER || 'smtp.ionos.fr',
      smtpPort: parseInt(process.env.HELLO_SMTP_PORT || '465'),
    };

    if (!emailConfig.password) {
      console.error('❌ HELLO_EMAIL_PASSWORD non définie');
      process.exit(1);
    }

    // Créer le transporteur
    const transporter = nodemailer.createTransport({
      host: emailConfig.smtpServer,
      port: emailConfig.smtpPort,
      secure: emailConfig.smtpPort === 465,
      auth: {
        user: emailConfig.user,
        pass: emailConfig.password,
      },
    });

    // Récupérer tous les contacts depuis la base de données
    const contacts = await getAllContacts();
    
    if (contacts.length === 0) {
      console.log('❌ Aucun contact trouvé dans la base de données');
      return;
    }

    console.log(`📋 ${contacts.length} contacts trouvés`);

    // Statistiques
    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ email: string; error: string }> = [];

    // Envoyer la newsletter à chaque contact
    for (const contact of contacts) {
      try {
        console.log(`📤 Envoi à ${contact.name} <${contact.email}>...`);
        
        const mailOptions = {
          from: `"CubeAI - Équipe" <${emailConfig.user}>`,
          to: contact.email,
          subject: '🎉 CubeAI - Test Newsletter - Nouvelles fonctionnalités disponibles !',
          html: generateNewsletterContent(contact),
          text: generateNewsletterText(contact)
        };

        const info = await transporter.sendMail(mailOptions);
        
        successCount++;
        console.log(`✅ Envoyé avec succès: ${contact.email} (Message ID: ${info.messageId})`);

        // Pause entre les envois pour éviter le rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        errorCount++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push({ email: contact.email, error: errorMessage });
        console.log(`❌ Erreur pour ${contact.email}: ${errorMessage}`);
      }
    }

    // Afficher les résultats
    console.log('\n📊 Résultats du test de newsletter:');
    console.log(`✅ Succès: ${successCount}`);
    console.log(`❌ Échecs: ${errorCount}`);
    console.log(`📈 Taux de succès: ${((successCount / contacts.length) * 100).toFixed(1)}%`);

    if (errors.length > 0) {
      console.log('\n❌ Erreurs détaillées:');
      errors.forEach(({ email, error }) => {
        console.log(`  - ${email}: ${error}`);
      });
    }

    // Sauvegarder les résultats dans un fichier
    const results = {
      date: new Date().toISOString(),
      totalContacts: contacts.length,
      successCount,
      errorCount,
      successRate: (successCount / contacts.length) * 100,
      errors
    };

    const fs = await import('fs');
    fs.writeFileSync(
      'newsletter-test-results.json',
      JSON.stringify(results, null, 2)
    );

    console.log('\n💾 Résultats sauvegardés dans newsletter-test-results.json');

  } catch (error) {
    console.error('❌ Erreur lors du test de newsletter:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function getAllContacts(): Promise<Contact[]> {
  const contacts: Contact[] = [];

  try {
    // Récupérer les comptes parents
    const accounts = await prisma.account.findMany({
      where: {
        isActive: true
      },
      select: {
        email: true,
        id: true,
        createdAt: true
      }
    });

    accounts.forEach(account => {
      contacts.push({
        email: account.email,
        name: `Parent ${account.email.split('@')[0]}`,
        type: 'parent',
        source: 'account'
      });
    });

    // Ajouter des contacts de test si aucun contact trouvé
    if (contacts.length === 0) {
      console.log('⚠️ Aucun contact trouvé, ajout de contacts de test...');
      contacts.push(
        { email: 'test1@example.com', name: 'Test User 1', type: 'test' },
        { email: 'test2@example.com', name: 'Test User 2', type: 'test' }
      );
    }

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des contacts:', error);
  }

  return contacts;
}

function generateNewsletterContent(contact: Contact): string {
  const currentDate = new Date().toLocaleDateString('fr-FR');
  
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Test Newsletter - CubeAI</title>
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
            .title {
                font-size: 1.8rem;
                margin-bottom: 10px;
            }
            .feature-box {
                background: #f8fafc;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #3b82f6;
            }
            .cta-button {
                background: #3b82f6;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 500;
                display: inline-block;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 0.9rem;
            }
            .unsubscribe {
                margin-top: 15px;
                font-size: 0.8rem;
            }
            .unsubscribe a {
                color: #6b7280;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">CubeAI</div>
            <div class="title">Test Newsletter</div>
            <p>${currentDate}</p>
        </div>
        
        <div class="content">
            <h2 style="color: #3b82f6; margin-top: 0;">Bonjour ${contact.name} !</h2>
            
            <p style="line-height: 1.6; color: #374151;">
                Ceci est un <strong>test de newsletter</strong> pour vérifier notre système d'envoi d'emails automatisé.
            </p>
            
            <div class="feature-box">
                <h3 style="color: #3b82f6; margin-top: 0;">🚀 Nouvelles fonctionnalités</h3>
                <ul style="color: #374151; line-height: 1.6;">
                    <li><strong>Rapports quotidiens automatisés</strong> - Suivi personnalisé par IA</li>
                    <li><strong>Système de logging complet</strong> - Traçabilité des emails</li>
                    <li><strong>Emails spécialisés</strong> - hello@, support@, noreply@</li>
                    <li><strong>Interface responsive</strong> - Design moderne et accessible</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://cube-ai.fr/features" class="cta-button">
                    Découvrir les nouveautés
                </a>
            </div>
            
            <div class="footer">
                <p><strong>Note :</strong> Ceci est un email de test. Si vous ne souhaitez plus recevoir nos newsletters, 
                <a href="https://cube-ai.fr/unsubscribe?email=${encodeURIComponent(contact.email)}">cliquez ici</a>.</p>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 0.8rem;">
            <p>© 2024 CubeAI. Tous droits réservés.</p>
            <p>Cet email a été envoyé depuis hello@cube-ai.fr</p>
        </div>
    </body>
    </html>
  `;
}

function generateNewsletterText(contact: Contact): string {
  const currentDate = new Date().toLocaleDateString('fr-FR');
  
  return `CubeAI - Test Newsletter (${currentDate})

Bonjour ${contact.name} !

Ceci est un test de newsletter pour vérifier notre système d'envoi d'emails automatisé.

🚀 Nouvelles fonctionnalités :
• Rapports quotidiens automatisés - Suivi personnalisé par IA
• Système de logging complet - Traçabilité des emails
• Emails spécialisés - hello@, support@, noreply@
• Interface responsive - Design moderne et accessible

Découvrir les nouveautés : https://cube-ai.fr/features

---
Note : Ceci est un email de test. Si vous ne souhaitez plus recevoir nos newsletters, visitez : https://cube-ai.fr/unsubscribe?email=${encodeURIComponent(contact.email)}

© 2024 CubeAI. Tous droits réservés.
Cet email a été envoyé depuis hello@cube-ai.fr`;
}

// Fonction pour envoyer un test à un seul contact
async function sendSingleTest(email: string, name?: string) {
  console.log(`🧪 Test d'envoi à ${email}...`);
  
  try {
    const emailConfig = {
      user: process.env.HELLO_EMAIL_USER || 'hello@cube-ai.fr',
      password: process.env.HELLO_EMAIL_PASSWORD,
      smtpServer: process.env.HELLO_SMTP_SERVER || 'smtp.ionos.fr',
      smtpPort: parseInt(process.env.HELLO_SMTP_PORT || '465'),
    };

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
      from: `"CubeAI - Équipe" <${emailConfig.user}>`,
      to: email,
      subject: '🧪 CubeAI - Test Email',
      html: generateNewsletterContent({ email, name: name || email.split('@')[0], type: 'test' }),
      text: generateNewsletterText({ email, name: name || email.split('@')[0], type: 'test' })
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Test réussi pour ${email} (Message ID: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors du test pour ${email}:`, error);
    return false;
  }
}

// Gestion des arguments de ligne de commande
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Mode par défaut : envoi à tous les contacts
    await sendNewsletterTest();
  } else if (args[0] === 'test' && args[1]) {
    // Test d'un seul email
    await sendSingleTest(args[1], args[2]);
  } else {
    console.log(`
Usage:
  node newsletter-test-simple.js                    # Envoi à tous les contacts
  node newsletter-test-simple.js test email@test.com [name]  # Test d'un seul email
    `);
  }
}

// Exécuter le script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { sendNewsletterTest, sendSingleTest };
