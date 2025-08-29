// Routes API v2 - Gestion des comptes parent + sous-comptes enfants
// Minimal-diff: ajout-only, sans casser l'existant

import { Router } from 'express';
import { requireAuthV2, requireRole, requireMinimumPlan } from '../../middleware/requireAuthV2';

// Contrôleurs
import * as authController from './auth.controller';
import * as membersController from './members.controller';

const router = Router();

// ============================================================================
// ROUTES D'AUTHENTIFICATION V2
// ============================================================================

/**
 * Inscription d'un nouveau parent
 * POST /api/v2/auth/parent/signup
 * 
 * Crée un compte parent avec plan seat et membre admin
 */
router.post('/auth/parent/signup', authController.parentSignup);

/**
 * Connexion d'un parent
 * POST /api/v2/auth/parent/login
 * 
 * Authentifie un parent et retourne un JWT avec rôle PARENT_ADMIN
 */
router.post('/auth/parent/login', authController.parentLogin);

/**
 * Connexion d'un enfant
 * POST /api/v2/auth/child/login
 * 
 * Authentifie un enfant et retourne un JWT avec rôle CHILD_MEMBER
 */
router.post('/auth/child/login', authController.childLogin);

/**
 * Informations sur l'utilisateur connecté
 * GET /api/v2/me
 * 
 * Retourne les informations du compte, membre et permissions
 */
router.get('/me', requireAuthV2, authController.getMe);

// ============================================================================
// ROUTES DE GESTION DES MEMBRES
// ============================================================================

/**
 * Création d'un nouveau membre enfant
 * POST /api/v2/members
 * 
 * Un parent peut créer des enfants selon les limites de son plan
 */
router.post('/members', 
  requireAuthV2, 
  requireRole('PARENT_ADMIN'), 
  membersController.createMember
);

/**
 * Mise à jour d'un membre existant
 * PATCH /api/v2/members/:id
 * 
 * Un parent peut modifier les informations de ses enfants
 */
router.patch('/members/:id', 
  requireAuthV2, 
  requireRole('PARENT_ADMIN'), 
  membersController.updateMember
);

/**
 * Liste des membres du compte
 * GET /api/v2/members
 * 
 * Un parent peut voir tous ses enfants
 */
router.get('/members', 
  requireAuthV2, 
  requireRole('PARENT_ADMIN'), 
  membersController.listMembers
);

/**
 * Détails d'un membre spécifique
 * GET /api/v2/members/:id
 * 
 * Un parent peut voir les détails de ses enfants
 * Un enfant peut voir ses propres détails
 */
router.get('/members/:id', 
  requireAuthV2, 
  membersController.getMember
);

/**
 * Désactivation d'un membre
 * DELETE /api/v2/members/:id
 * 
 * Un parent peut désactiver ses enfants (pas de suppression physique)
 */
router.delete('/members/:id', 
  requireAuthV2, 
  requireRole('PARENT_ADMIN'), 
  membersController.deleteMember
);

// ============================================================================
// ROUTES DE GESTION DES SESSIONS (À IMPLÉMENTER)
// ============================================================================

/**
 * Démarrage d'une session
 * POST /api/v2/sessions/start
 * 
 * Un enfant peut démarrer une session de travail
 */
router.post('/sessions/start', 
  requireAuthV2, 
  requireRole('CHILD_MEMBER')
  // TODO: Implémenter sessionsController.startSession
);

/**
 * Arrêt d'une session
 * POST /api/v2/sessions/stop
 * 
 * Un enfant peut arrêter sa session de travail
 */
router.post('/sessions/stop', 
  requireAuthV2, 
  requireRole('CHILD_MEMBER')
  // TODO: Implémenter sessionsController.stopSession
);

/**
 * Historique des sessions
 * GET /api/v2/sessions
 * 
 * Un parent peut voir toutes les sessions de ses enfants
 * Un enfant peut voir ses propres sessions
 */
router.get('/sessions', 
  requireAuthV2
  // TODO: Implémenter sessionsController.getSessions
);

// ============================================================================
// ROUTES DES ABONNEMENTS V2
// ============================================================================

import subscriptionRoutes from './subscriptions.routes'
router.use('/subscriptions', subscriptionRoutes)

// ============================================================================
// ROUTES DE FACTURATION (PROXY VERS L'EXISTANT)
// ============================================================================

/**
 * Factures du compte
 * GET /api/v2/billing/invoices
 * 
 * Un parent peut voir les factures de son compte
 */
router.get('/billing/invoices', 
  requireAuthV2, 
  requireRole('PARENT_ADMIN')
  // TODO: Implémenter billingController.getInvoices
);

// ============================================================================
// ROUTES DE STATISTIQUES AVANCÉES (GATING PAR PLAN)
// ============================================================================

/**
 * Statistiques détaillées du compte
 * GET /api/v2/stats/detailed
 * 
 * Un parent peut voir les stats détaillées selon son plan
 */
router.get('/stats/detailed', 
  requireAuthV2, 
  requireRole('PARENT_ADMIN'),
  requireMinimumPlan('PRO')
  // TODO: Implémenter statsController.getDetailedStats
);

/**
 * Analytics avancés
 * GET /api/v2/analytics/advanced
 * 
 * Un parent peut accéder aux analytics selon son plan
 */
router.get('/analytics/advanced', 
  requireAuthV2, 
  requireRole('PARENT_ADMIN'),
  requireMinimumPlan('PRO_PLUS')
  // TODO: Implémenter analyticsController.getAdvancedAnalytics
);

// ============================================================================
// ROUTES DU LLM COACH (GATING PAR PLAN PREMIUM)
// ============================================================================

/**
 * Chat avec le LLM Coach
 * POST /api/v2/llm/chat
 * 
 * Un parent peut discuter avec l'IA selon son plan
 */
router.post('/llm/chat', 
  requireAuthV2, 
  requireRole('PARENT_ADMIN'),
  requireMinimumPlan('PREMIUM')
  // TODO: Implémenter llmController.chat
);

/**
 * Historique des conversations LLM
 * GET /api/v2/llm/history
 * 
 * Un parent peut voir l'historique de ses conversations
 */
router.get('/llm/history', 
  requireAuthV2, 
  requireRole('PARENT_ADMIN'),
  requireMinimumPlan('PREMIUM')
  // TODO: Implémenter llmController.getHistory
);

// ============================================================================
// ROUTES D'EXPORT (GATING PAR PLAN PREMIUM)
// ============================================================================

/**
 * Export des données du compte
 * POST /api/v2/export/data
 * 
 * Un parent peut exporter ses données selon son plan
 */
router.post('/export/data', 
  requireAuthV2, 
  requireRole('PARENT_ADMIN'),
  requireMinimumPlan('PREMIUM')
  // TODO: Implémenter exportController.exportData
);

// ============================================================================
// ROUTES DE GESTION DES COMMUNAUTÉS
// ============================================================================

/**
 * Accès aux communautés
 * GET /api/v2/communities
 * 
 * Un enfant peut accéder aux communautés selon le plan du compte
 */
router.get('/communities', 
  requireAuthV2, 
  requireRole('CHILD_MEMBER')
  // TODO: Implémenter communitiesController.getCommunities
);

// ============================================================================
// MIDDLEWARE DE GESTION D'ERREURS
// ============================================================================

// Gestion des routes non trouvées
router.use('*', (req, res) => {
  res.status(404).json({
    error: "ROUTE_NOT_FOUND",
    message: `Route ${req.method} ${req.originalUrl} non trouvée dans l'API v2`,
    availableRoutes: [
      "POST /auth/parent/signup",
      "POST /auth/parent/login", 
      "POST /auth/child/login",
      "GET /me",
      "POST /members",
      "GET /members",
      "GET /members/:id",
      "PATCH /members/:id",
      "DELETE /members/:id"
    ]
  });
});

export default router;
