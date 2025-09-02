#!/usr/bin/env node

/**
 * Script de test pour envoyer une newsletter à tous les contacts
 * Utilise le système de logging des emails pour tracer tous les envois
 */

import { PrismaClient } from '@prisma/client';
import { EmailService } from '../src/services/emailService';
import { EmailLoggingService } from '../src/services/emailLoggingService';

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
        
        const result = await EmailService.sendMarketingEmail({
          toEmail: contact.email,
          toName: contact.name,
          subject: '🎉 CubeAI - Test Newsletter - Nouvelles fonctionnalités disponibles !',
          content: generateNewsletterContent(contact),
          ctaText: 'Découvrir les nouveautés',
          ctaUrl: 'https://cube-ai.fr/features'
        });

        if (result.success) {
          successCount++;
          console.log(`✅ Envoyé avec succès: ${contact.email}`);
        } else {
          errorCount++;
          errors.push({ email: contact.email, error: 'Échec de l\'envoi' });
          console.log(`❌ Échec: ${contact.email}`);
        }

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
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 2.5rem; font-weight: bold;">CubeAI</h1>
        <p style="margin: 10px 0 0 0; font-size: 1.2rem;">Test Newsletter</p>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">${currentDate}</p>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #3b82f6; margin-top: 0;">Bonjour ${contact.name} !</h2>
        
        <p style="line-height: 1.6; color: #374151;">
          Ceci est un <strong>test de newsletter</strong> pour vérifier notre système d'envoi d'emails automatisé.
        </p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <h3 style="color: #3b82f6; margin-top: 0;">🚀 Nouvelles fonctionnalités</h3>
          <ul style="color: #374151; line-height: 1.6;">
            <li><strong>Rapports quotidiens automatisés</strong> - Suivi personnalisé par IA</li>
            <li><strong>Système de logging complet</strong> - Traçabilité des emails</li>
            <li><strong>Emails spécialisés</strong> - hello@, support@, noreply@</li>
            <li><strong>Interface responsive</strong> - Design moderne et accessible</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://cube-ai.fr/features" 
             style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
            Découvrir les nouveautés
          </a>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
          <p style="color: #6b7280; font-size: 0.9rem; margin: 0;">
            <strong>Note :</strong> Ceci est un email de test. Si vous ne souhaitez plus recevoir nos newsletters, 
            <a href="https://cube-ai.fr/unsubscribe?email=${encodeURIComponent(contact.email)}" style="color: #3b82f6;">cliquez ici</a>.
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 0.8rem;">
        <p>© 2024 CubeAI. Tous droits réservés.</p>
        <p>Cet email a été envoyé depuis hello@cube-ai.fr</p>
      </div>
    </div>
  `;
}

// Fonction pour envoyer un test à un seul contact
async function sendSingleTest(email: string, name?: string) {
  console.log(`🧪 Test d'envoi à ${email}...`);
  
  try {
    const result = await EmailService.sendMarketingEmail({
      toEmail: email,
      toName: name || email.split('@')[0],
      subject: '🧪 CubeAI - Test Email',
      content: generateNewsletterContent({ email, name: name || email.split('@')[0], type: 'test' }),
      ctaText: 'Tester le lien',
      ctaUrl: 'https://cube-ai.fr'
    });

    if (result.success) {
      console.log(`✅ Test réussi pour ${email}`);
      return true;
    } else {
      console.log(`❌ Test échoué pour ${email}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Erreur lors du test pour ${email}:`, error);
    return false;
  }
}

// Fonction pour afficher les statistiques des emails
async function showEmailStats() {
  console.log('📊 Statistiques des emails...');
  
  try {
    const stats = await EmailLoggingService.getEmailStatistics({
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 derniers jours
      endDate: new Date()
    });

    console.log('📈 Statistiques des 7 derniers jours:');
    stats.forEach(stat => {
      console.log(`  ${stat.emailType}: ${stat.sentCount} envoyés, ${stat.failedCount} échecs`);
    });

    // Récupérer les derniers logs
    const recentLogs = await prisma.emailLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        emailType: true,
        toEmail: true,
        status: true,
        createdAt: true,
        errorMessage: true
      }
    });

    console.log('\n📋 10 derniers emails:');
    recentLogs.forEach(log => {
      const status = log.status === 'SENT' ? '✅' : log.status === 'FAILED' ? '❌' : '⏳';
      console.log(`  ${status} ${log.emailType} → ${log.toEmail} (${log.status})`);
      if (log.errorMessage) {
        console.log(`    Erreur: ${log.errorMessage}`);
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques:', error);
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
  } else if (args[0] === 'stats') {
    // Affichage des statistiques
    await showEmailStats();
  } else {
    console.log(`
Usage:
  node newsletter-test.js                    # Envoi à tous les contacts
  node newsletter-test.js test email@test.com [name]  # Test d'un seul email
  node newsletter-test.js stats              # Afficher les statistiques
    `);
  }
}

// Exécuter le script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { sendNewsletterTest, sendSingleTest, showEmailStats };
