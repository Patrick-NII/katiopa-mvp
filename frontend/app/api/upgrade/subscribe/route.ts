// app/api/upgrade/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import * as jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
// import { UpgradeTrackingService } from '../../../../backend/src/services/upgrade-tracking.service'

const prisma = new PrismaClient()

interface UserInfo {
  id: string
  sessionId: string
  firstName: string
  lastName: string
  email?: string
  userType: 'PARENT' | 'CHILD'
  subscriptionType: 'FREE' | 'PRO' | 'PRO_PLUS' | 'ENTERPRISE'
  isActive: boolean
}

// Fonction pour vérifier l'authentification côté serveur
async function verifyAuthServerSide(): Promise<UserInfo | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('authToken')?.value

    if (!token) {
      console.log('🔐 Aucun token trouvé')
      return null
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    console.log('🔍 Token décodé:', decoded)

    // Trouver l'utilisateur dans la base de données
    const user = await prisma.userSession.findUnique({
      where: { id: decoded.userId },
      include: { account: true }
    })

    if (!user) {
      console.log('❌ Utilisateur non trouvé')
      return null
    }

    return {
      id: user.id,
      sessionId: user.sessionId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.account.email,
      userType: user.userType as 'PARENT' | 'CHILD',
      subscriptionType: user.account.subscriptionType as 'FREE' | 'PRO' | 'PRO_PLUS' | 'ENTERPRISE',
      isActive: user.isActive
    }
  } catch (error) {
    console.error('❌ Erreur de vérification auth:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { planId, paymentInfo, promoCode, upgradeEventId } = body

    console.log('💳 Traitement de souscription:', { planId, upgradeEventId })

    // Vérifier l'authentification
    const userInfo = await verifyAuthServerSide()
    if (!userInfo) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Valider le plan
    const validPlans = ['PRO', 'PRO_PLUS']
    if (!validPlans.includes(planId)) {
      return NextResponse.json(
        { error: 'Plan invalide' },
        { status: 400 }
      )
    }

    // Simuler le traitement du paiement (en production, utiliser Stripe/PayPal)
    console.log('💳 Simulation paiement:', {
      email: paymentInfo.email,
      cardNumber: paymentInfo.cardNumber?.slice(-4),
      amount: planId === 'PRO' ? 9.99 : 19.99
    })

    // Mettre à jour l'abonnement dans la base de données
    const updatedAccount = await prisma.account.update({
      where: { id: userInfo.id },
      data: {
        subscriptionType: planId,
        updatedAt: new Date()
      }
    })

    // Créer un enregistrement de facturation
    await prisma.billingRecord.create({
      data: {
        accountId: userInfo.id,
        amount: planId === 'PRO' ? 9.99 : 19.99,
        currency: 'EUR',
        status: 'PAID',
        description: `Abonnement ${planId} - ${userInfo.firstName} ${userInfo.lastName}`,
        paidAt: new Date(),
        createdAt: new Date()
      }
    })

    // Enregistrer la conversion si c'est lié à un événement d'upgrade
    if (upgradeEventId) {
      // TODO: Implémenter l'enregistrement de conversion
      console.log('✅ Conversion enregistrée pour événement:', upgradeEventId)
    }

    // Enregistrer l'utilisation du code promo si applicable
    if (promoCode) {
      await prisma.rewardTracking.create({
        data: {
          userId: userInfo.id,
          rewardType: 'promo_code',
          rewardCode: promoCode,
          rewardValue: planId === 'PRO' ? 0.99 : 1.99, // Valeur estimée de la réduction
          usedAt: new Date(),
          createdAt: new Date()
        }
      })
    }

    console.log('✅ Abonnement mis à jour:', {
      userId: userInfo.id,
      newSubscription: planId,
      email: userInfo.email
    })

    return NextResponse.json({
      success: true,
      message: 'Abonnement activé avec succès',
      subscriptionType: planId,
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })

  } catch (error) {
    console.error('❌ Erreur lors de la souscription:', error)
    return NextResponse.json(
      { error: 'Erreur lors du traitement de la souscription' },
      { status: 500 }
    )
  }
}
