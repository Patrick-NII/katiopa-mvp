/**
 * Routes des abonnements v2
 * Gère les essais gratuits, plans et gestion des abonnements
 */

import { Router } from 'express'
import { requireAuthV2 } from '../../middleware/requireAuthV2'
import {
  createStarter,
  attachPaymentMethod,
  upgradePlan,
  cancelSubscription,
  acceptAntiChurn,
  getSubscriptionStatus
} from './subscriptions.controller'

const router = Router()

// Route publique - création de compte Starter gratuit
router.post('/create-starter', createStarter)

// Routes protégées - nécessitent une authentification
router.use(requireAuthV2)

// Gestion des moyens de paiement
router.post('/attach-payment-method', attachPaymentMethod)

// Gestion des plans
router.post('/upgrade', upgradePlan)

// Gestion de l'abonnement
router.post('/cancel', cancelSubscription)
router.post('/accept-anti-churn', acceptAntiChurn)
router.get('/status', getSubscriptionStatus)

export default router
