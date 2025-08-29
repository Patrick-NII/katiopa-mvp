/**
 * Job de gestion de l'expiration des essais gratuits
 * Vérifie quotidiennement les essais expirés et gère les conversions
 */

import { PrismaClient } from '@prisma/client'
import { getDefaultPlanAfterFreePeriod } from '../domain/plan/planPolicy'


const prisma = new PrismaClient()

/**
 * Vérifie et traite les comptes Starter gratuits expirés
 * À exécuter quotidiennement via cron
 */
export async function checkStarterFreePeriodExpirations() {
  try {
    console.log('🔄 Vérification des comptes Starter gratuits expirés...')
    
    const now = new Date()
    
    // Trouver tous les comptes Starter gratuits expirés
    const expiredStarters = await prisma.subscription.findMany({
      where: {
        plan: 'STARTER',
        status: 'FREE',
        trialEnd: {
          lte: now
        }
      },
      include: {
        account: true,
        paymentMethod: true
      }
    })
    
    console.log(`📊 ${expiredStarters.length} comptes Starter gratuits expirés trouvés`)
    
    for (const starter of expiredStarters) {
      await processExpiredStarter(starter)
    }
    
    console.log('✅ Vérification des comptes Starter terminée')
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des comptes Starter:', error)
  }
}

/**
 * Traite un compte Starter gratuit expiré
 */
async function processExpiredStarter(starter: any) {
  try {
    const account = starter.account
    const hasPaymentMethod = !!starter.paymentMethod
    
    if (hasPaymentMethod) {
      // Conversion automatique vers Starter payant
      await convertToStarterPaid(starter)
      console.log(`✅ Compte ${account.email} converti vers Starter payant`)
    } else {
      // Suspension de l'accès
      await suspendAccount(starter)
      console.log(`⏸️ Compte ${account.email} suspendu (pas de moyen de paiement)`)
    }
    
    // Envoyer l'email approprié
    await sendStarterExpirationEmail(account.email, hasPaymentMethod)
    
  } catch (error) {
    console.error(`❌ Erreur traitement Starter ${starter.id}:`, error)
  }
}

/**
 * Convertit un compte Starter gratuit vers le plan Starter payant
 */
async function convertToStarterPaid(starter: any) {
  const defaultPlan = getDefaultPlanAfterFreePeriod()
  
  // Mettre à jour l'abonnement
  await prisma.subscription.update({
    where: { id: starter.id },
    data: {
      plan: defaultPlan,
      status: 'ACTIVE',
      trialEnd: null,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
      autoRenew: true
    }
  })
  
  // Mettre à jour le compte pour compatibilité
  await prisma.account.update({
    where: { id: starter.accountId },
    data: {
      plan: defaultPlan as any, // @deprecated - maintenu pour compatibilité
      maxSessions: 1
    }
  })
  
  // Créer la première facture
  await prisma.invoice.create({
    data: {
      accountId: starter.accountId,
      subscriptionId: starter.id,
      amountCents: 999, // 9,99€
      currency: 'EUR',
      periodStart: new Date(),
      periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'open',
      provider: 'internal',
      metadata: {
        type: 'starter_free_to_paid',
        originalStarterId: starter.id
      }
    }
  })
  
  // TODO: Déclencher le paiement via Stripe/PayPal
  // await processPayment(starter.paymentMethod, 999)
}

/**
 * Suspend un compte sans moyen de paiement
 */
async function suspendAccount(starter: any) {
  // Mettre à jour l'abonnement
  await prisma.subscription.update({
    where: { id: starter.id },
    data: {
      status: 'SUSPENDED',
      trialEnd: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      autoRenew: false,
      metadata: {
        suspendedAt: new Date(),
        reason: 'no_payment_method'
      }
    }
  })
  
  // Mettre à jour le compte pour compatibilité
  await prisma.account.update({
    where: { id: starter.accountId },
    data: {
      isActive: false,
      plan: 'FREE' as any, // @deprecated - maintenu pour compatibilité
      maxSessions: 0
    }
  })
}

/**
 * Envoie des emails de rappel avant l'expiration de la période gratuite
 */
export async function sendStarterFreePeriodReminders() {
  try {
    console.log('📧 Envoi des rappels d\'expiration de la période gratuite...')
    
    const now = new Date()
    
    // Rappel J-15
    const reminder15Days = await prisma.subscription.findMany({
      where: {
        plan: 'STARTER',
        status: 'FREE',
        trialEnd: {
          gte: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
          lte: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        account: true
      }
    })
    
    // Rappel J-3
    const reminder3Days = await prisma.subscription.findMany({
      where: {
        plan: 'STARTER',
        status: 'FREE',
        trialEnd: {
          gte: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
          lte: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        account: true
      }
    })
    
    // Rappel J-0 (jour même)
    const reminderToday = await prisma.subscription.findMany({
      where: {
        plan: 'STARTER',
        status: 'FREE',
        trialEnd: {
          gte: new Date(now.getTime()),
          lte: new Date(now.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      include: {
        account: true
      }
    })
    
    console.log(`📊 Rappels: J-15: ${reminder15Days.length}, J-3: ${reminder3Days.length}, J-0: ${reminderToday.length}`)
    
    // Envoyer les rappels
    for (const reminder of reminder15Days) {
      await sendStarterReminderEmail(reminder.account.email, 15)
    }
    
    for (const reminder of reminder3Days) {
      await sendStarterReminderEmail(reminder.account.email, 3)
    }
    
    for (const reminder of reminderToday) {
      await sendStarterReminderEmail(reminder.account.email, 0)
    }
    
    console.log('✅ Rappels envoyés')
    
  } catch (error) {
    console.error('❌ Erreur envoi rappels:', error)
  }
}

/**
 * Envoie un email de rappel d'expiration de la période gratuite
 */
async function sendStarterReminderEmail(email: string, daysLeft: number) {
  try {
    // TODO: Implémenter le service d'email
    // await sendStarterReminderEmail(email, daysLeft)
    console.log(`📧 Rappel J-${daysLeft} envoyé à ${email}`)
  } catch (error) {
    console.error(`❌ Erreur envoi rappel J-${daysLeft} à ${email}:`, error)
  }
}

/**
 * Service d'email temporaire (à remplacer par un vrai service)
 */
async function sendStarterExpirationEmail(email: string, hasPaymentMethod: boolean) {
  try {
    // TODO: Implémenter le service d'email
    console.log(`📧 Email d'expiration de la période gratuite envoyé à ${email} (PM: ${hasPaymentMethod ? 'Oui' : 'Non'})`)
  } catch (error) {
    console.error(`❌ Erreur envoi email expiration à ${email}:`, error)
  }
}


