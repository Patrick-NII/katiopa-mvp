/**
 * Contrôleur des abonnements v2
 * Gère les essais gratuits, plans, upgrades/downgrades et conversions
 */

import { Request, Response } from 'express'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { requireAuthV2, AuthContext } from '../../middleware/requireAuthV2'
import { getPlanLimitsV2, getDefaultPlanAfterFreePeriod, isFreePlan } from '../../domain/plan/planPolicy'

const prisma = new PrismaClient()

// Schémas de validation Zod
const createTrialSchema = z.object({
  email: z.string().email(),
  referralCode: z.string().optional()
})

const attachPaymentMethodSchema = z.object({
  provider: z.enum(['stripe', 'paypal', 'applepay', 'googlepay']),
  token: z.string(),
  brand: z.string().optional(),
  last4: z.string().optional(),
  expMonth: z.number().optional(),
  expYear: z.number().optional(),
  billingEmail: z.string().email().optional()
})

const upgradePlanSchema = z.object({
  plan: z.enum(['STARTER', 'PRO', 'PREMIUM']),
  paymentMethodId: z.string().optional()
})

const cancelSubscriptionSchema = z.object({
  reason: z.string().optional(),
  feedback: z.string().optional()
})

/**
 * Crée un compte Starter gratuit de 3 mois
 * POST /api/v2/subscriptions/create-starter
 */
export const createStarter = async (req: Request, res: Response) => {
  try {
    const { email, referralCode } = createTrialSchema.parse(req.body)
    
    // Vérifier si l'email a déjà eu un compte gratuit (détection multi-comptes)
    const existingAccount = await prisma.subscription.findFirst({
      where: {
        account: { email },
        plan: 'STARTER',
        status: 'FREE'
      }
    })
    
    if (existingAccount) {
      return res.status(400).json({
        success: false,
        message: 'Cet email a déjà bénéficié d\'un compte gratuit. Veuillez vous connecter ou choisir un plan payant.'
      })
    }
    
    // Créer ou récupérer le compte
    let account = await prisma.account.findUnique({
      where: { email }
    })
    
    if (!account) {
      account = await prisma.account.create({
        data: {
          email,
          subscriptionType: 'FREE', // @deprecated - maintenu pour compatibilité
          plan: 'FREE', // @deprecated - maintenu pour compatibilité
          maxSessions: 1
        }
      })
    }
    
    // Créer l'abonnement Starter gratuit
    const freePeriodEnd = new Date()
    freePeriodEnd.setDate(freePeriodEnd.getDate() + 90) // 3 mois
    
    const subscription = await prisma.subscription.create({
      data: {
        accountId: account.id,
        plan: 'STARTER',
        status: 'FREE', // Gratuit pendant 3 mois
        trialEnd: freePeriodEnd, // Renommé pour compatibilité
        currentPeriodStart: new Date(),
        currentPeriodEnd: freePeriodEnd,
        autoRenew: true
      }
    })
    
    // Traiter le code de parrainage si fourni
    if (referralCode) {
      await processReferralCode(referralCode, account.id)
    }
    
    // Créer un code de parrainage pour ce compte
    const newReferralCode = generateReferralCode()
    await prisma.referral.create({
      data: {
        code: newReferralCode,
        sponsorAccountId: account.id,
        rewardStatus: 'pending'
      }
    })
    
    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        freePeriodEnd: subscription.trialEnd,
        referralCode: newReferralCode
      },
      message: 'Compte Starter gratuit de 3 mois créé avec succès !'
    })
    
  } catch (error) {
    console.error('Erreur création Starter:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du compte Starter gratuit'
    })
  }
}

/**
 * Attache un moyen de paiement à un compte
 * POST /api/v2/subscriptions/attach-payment-method
 */
export const attachPaymentMethod = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).auth as AuthContext
    const { provider, token, brand, last4, expMonth, expYear, billingEmail } = attachPaymentMethodSchema.parse(req.body)
    
    // Vérifier que l'utilisateur a un abonnement
    const subscription = await prisma.subscription.findUnique({
      where: { accountId: auth.accountId }
    })
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Aucun abonnement trouvé'
      })
    }
    
    // Désactiver les autres moyens de paiement par défaut
    await prisma.paymentMethod.updateMany({
      where: { accountId: auth.accountId },
      data: { isDefault: false }
    })
    
    // Créer le nouveau moyen de paiement
    const paymentMethod = await prisma.paymentMethod.create({
      data: {
        accountId: auth.accountId,
        provider,
        token,
        brand,
        last4,
        expMonth,
        expYear,
        billingEmail: billingEmail || auth.email,
        isDefault: true,
        isActive: true
      }
    })
    
    // Mettre à jour l'abonnement
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { paymentMethodId: paymentMethod.id }
    })
    
    res.json({
      success: true,
      paymentMethod: {
        id: paymentMethod.id,
        provider: paymentMethod.provider,
        brand: paymentMethod.brand,
        last4: paymentMethod.last4,
        isDefault: paymentMethod.isDefault
      },
      message: 'Moyen de paiement attaché avec succès'
    })
    
  } catch (error) {
    console.error('Erreur attachement PM:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'attachement du moyen de paiement'
    })
  }
}

/**
 * Met à jour le plan d'abonnement
 * POST /api/v2/subscriptions/upgrade
 */
export const upgradePlan = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).auth as AuthContext
    const { plan, paymentMethodId } = upgradePlanSchema.parse(req.body)
    
    // Vérifier que l'utilisateur a un abonnement
    const subscription = await prisma.subscription.findUnique({
      where: { accountId: auth.accountId }
    })
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Aucun abonnement trouvé'
      })
    }
    
    // Vérifier que le plan est valide
    const planLimits = getPlanLimitsV2(plan)
    if (!planLimits) {
      return res.status(400).json({
        success: false,
        message: 'Plan invalide'
      })
    }
    
    // Mettre à jour l'abonnement
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        plan,
        status: 'ACTIVE',
        trialEnd: null, // Fin de la période gratuite
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
        paymentMethodId: paymentMethodId || subscription.paymentMethodId,
        autoRenew: true
      }
    })
    
    // Mettre à jour le compte pour compatibilité
    await prisma.account.update({
      where: { id: auth.accountId },
      data: {
        plan: plan as any, // @deprecated - maintenu pour compatibilité
        maxSessions: planLimits.maxChildren
      }
    })
    
    res.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        plan: updatedSubscription.plan,
        status: updatedSubscription.status,
        currentPeriodEnd: updatedSubscription.currentPeriodEnd
      },
      planLimits,
      message: `Plan mis à jour vers ${plan}`
    })
    
  } catch (error) {
    console.error('Erreur upgrade plan:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du plan'
    })
  }
}

/**
 * Annule l'abonnement (avec offre anti-churn)
 * POST /api/v2/subscriptions/cancel
 */
export const cancelSubscription = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).auth as AuthContext
    const { reason, feedback } = cancelSubscriptionSchema.parse(req.body)
    
    // Vérifier que l'utilisateur a un abonnement
    const subscription = await prisma.subscription.findUnique({
      where: { accountId: auth.accountId }
    })
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Aucun abonnement trouvé'
      })
    }
    
    // Proposer l'offre anti-churn
    const antiChurnOffer = {
      plan: 'ANTI_CHURN',
      price: 1499, // 14,99€
      features: [
        '1 parent + 1 enfant',
        'Progression conservée',
        'Features réduites (sans IA premium)',
        'Annulable à tout moment'
      ]
    }
    
    // Marquer l'abonnement pour annulation à la fin de la période
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
        metadata: {
          cancellationReason: reason,
          feedback,
          antiChurnOffered: true
        }
      }
    })
    
    res.json({
      success: true,
      antiChurnOffer,
      message: 'Abonnement marqué pour annulation. Offre anti-churn disponible !',
      cancellationDate: subscription.currentPeriodEnd
    })
    
  } catch (error) {
    console.error('Erreur annulation:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation de l\'abonnement'
    })
  }
}

/**
 * Accepte l'offre anti-churn
 * POST /api/v2/subscriptions/accept-anti-churn
 */
export const acceptAntiChurn = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).auth as AuthContext
    
    // Vérifier que l'utilisateur a un abonnement
    const subscription = await prisma.subscription.findUnique({
      where: { accountId: auth.accountId }
    })
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Aucun abonnement trouvé'
      })
    }
    
    // Mettre à jour vers le plan anti-churn
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        plan: 'ANTI_CHURN',
        status: 'ACTIVE',
        cancelAtPeriodEnd: false, // Annuler l'annulation
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
        autoRenew: true,
        metadata: {
          ...subscription.metadata,
          antiChurnAccepted: true,
          acceptedAt: new Date()
        }
      }
    })
    
    res.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        plan: updatedSubscription.plan,
        status: updatedSubscription.status
      },
      message: 'Offre anti-churn acceptée ! Votre progression est conservée.'
    })
    
  } catch (error) {
    console.error('Erreur acceptation anti-churn:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'acceptation de l\'offre anti-churn'
    })
  }
}

/**
 * Obtient le statut de l'abonnement
 * GET /api/v2/subscriptions/status
 */
export const getSubscriptionStatus = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).auth as AuthContext
    
    const subscription = await prisma.subscription.findUnique({
      where: { accountId: auth.accountId },
      include: {
        paymentMethod: true,
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Aucun abonnement trouvé'
      })
    }
    
    const planLimits = getPlanLimitsV2(subscription.plan)
    
    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        trialEnd: subscription.trialEnd,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        autoRenew: subscription.autoRenew
      },
      planLimits,
      paymentMethod: subscription.paymentMethod ? {
        id: subscription.paymentMethod.id,
        provider: subscription.paymentMethod.provider,
        brand: subscription.paymentMethod.brand,
        last4: subscription.paymentMethod.last4,
        isDefault: subscription.paymentMethod.isDefault
      } : null,
      recentInvoices: subscription.invoices.map(invoice => ({
        id: invoice.id,
        amount: invoice.amountCents / 100,
        currency: invoice.currency,
        status: invoice.status,
        periodStart: invoice.periodStart,
        periodEnd: invoice.periodEnd
      }))
    })
    
  } catch (error) {
    console.error('Erreur statut abonnement:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du statut de l\'abonnement'
    })
  }
}

// Fonctions utilitaires privées

/**
 * Traite un code de parrainage
 */
async function processReferralCode(code: string, accountId: string) {
  try {
    const referral = await prisma.referral.findUnique({
      where: { code }
    })
    
    if (referral && referral.rewardStatus === 'pending') {
      // Marquer le code comme utilisé
      await prisma.referral.update({
        where: { id: referral.id },
        data: {
          referredAccountId: accountId,
          rewardStatus: 'applied',
          metadata: {
            appliedAt: new Date(),
            rewardType: 'discount',
            rewardValue: 10 // 10% de réduction
          }
        }
      })
    }
  } catch (error) {
    console.error('Erreur traitement parrainage:', error)
  }
}

/**
 * Génère un code de parrainage unique
 */
function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
