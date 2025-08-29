// Politiques centralisées pour les plans et fonctionnalités v2
// Source de vérité unique pour le RBAC et le gating des fonctionnalités
// @deprecated - Ancien système, maintenu pour compatibilité
export type Plan = "FREE" | "PRO" | "PRO_PLUS" | "PREMIUM";

// Nouveau système d'abonnement v2
export type PlanV2 = "STARTER" | "PRO" | "PREMIUM" | "ANTI_CHURN";

/**
 * Détermine le nombre maximum d'enfants autorisés par plan
 */
export function seatsForPlan(plan: Plan): number | "UNLIMITED" {
  switch (plan) {
    case "FREE": return 1;
    case "PRO": return 2;
    case "PRO_PLUS": return 4;
    case "PREMIUM": return "UNLIMITED";
  }
}

/**
 * Vérifie si une fonctionnalité est activée pour un plan donné
 */
export function isFeatureEnabled(plan: Plan, feature: "COMMUNITY" | "STATS_DETAILED" | "LLM_COACH" | "EXPORTS" | "SESSION_LOGS" | "ADVANCED_ANALYTICS"): boolean {
  switch (feature) {
    case "LLM_COACH":
      return plan === "PREMIUM";
    case "STATS_DETAILED":
      return plan === "PRO" || plan === "PRO_PLUS" || plan === "PREMIUM";
    case "COMMUNITY":
      return plan !== "FREE";
    case "EXPORTS":
      return plan === "PREMIUM";
    case "SESSION_LOGS":
      return plan === "PRO" || plan === "PRO_PLUS" || plan === "PREMIUM";
    case "ADVANCED_ANALYTICS":
      return plan === "PRO_PLUS" || plan === "PREMIUM";
    default:
      return false;
  }
}

/**
 * Mappe l'ancien SubscriptionType vers le nouveau SubscriptionPlan
 */
export function mapSubscriptionTypeToPlan(subscriptionType: string): Plan {
  switch (subscriptionType) {
    case "FREE": return "FREE";
    case "PRO": return "PRO";
    case "PRO_PLUS": return "PRO_PLUS";
    case "ENTERPRISE": return "PREMIUM";
    default: return "FREE";
  }
}

/**
 * Vérifie si un plan peut créer de nouveaux enfants
 */
export function canCreateChild(plan: Plan, currentChildCount: number): boolean {
  const limit = seatsForPlan(plan);
  if (limit === "UNLIMITED") return true;
  return currentChildCount < limit;
}

/**
 * Obtient les fonctionnalités disponibles pour un plan
 */
export function getAvailableFeatures(plan: Plan): string[] {
  const features: string[] = [];
  
  if (isFeatureEnabled(plan, "COMMUNITY")) features.push("COMMUNITY");
  if (isFeatureEnabled(plan, "STATS_DETAILED")) features.push("STATS_DETAILED");
  if (isFeatureEnabled(plan, "LLM_COACH")) features.push("LLM_COACH");
  if (isFeatureEnabled(plan, "EXPORTS")) features.push("EXPORTS");
  if (isFeatureEnabled(plan, "SESSION_LOGS")) features.push("SESSION_LOGS");
  if (isFeatureEnabled(plan, "ADVANCED_ANALYTICS")) features.push("ADVANCED_ANALYTICS");
  
  return features;
}

/**
 * Obtient les limites du plan
 */
export function getPlanLimits(plan: Plan) {
  return {
    maxChildren: seatsForPlan(plan),
    maxSessions: plan === "FREE" ? 1 : plan === "PRO" ? 2 : plan === "PRO_PLUS" ? 4 : 9999,
    features: getAvailableFeatures(plan)
  };
}

// ===== NOUVELLES FONCTIONS V2 =====

/**
 * Détermine le nombre maximum d'enfants autorisés par plan v2
 */
export function seatsForPlanV2(plan: PlanV2): number {
  switch (plan) {
    case "STARTER": return 1;    // Starter : 1 parent + 1 enfant
    case "PRO": return 1;        // Pro : 1 parent + 1 enfant
    case "PREMIUM": return 4;    // Premium : 1 parent + jusqu'à 4 enfants
    case "ANTI_CHURN": return 1; // Anti-churn : 1 parent + 1 enfant
  }
}

/**
 * Vérifie si une fonctionnalité est activée pour un plan v2
 */
export function isFeatureEnabledV2(plan: PlanV2, feature: "COMMUNITY" | "STATS_DETAILED" | "LLM_COACH" | "EXPORTS" | "SESSION_LOGS" | "ADVANCED_ANALYTICS" | "CERTIFICATES" | "MULTI_DEVICE" | "SUPPORT_PRIORITY"): boolean {
  switch (feature) {
    case "LLM_COACH":
      return plan === "PREMIUM"; // IA coach premium uniquement
    case "STATS_DETAILED":
      return plan === "PRO" || plan === "PREMIUM"; // Stats détaillées Pro+
    case "COMMUNITY":
      return plan === "PRO" || plan === "PREMIUM"; // Communauté Pro+
    case "EXPORTS":
      return plan === "PREMIUM"; // Exports uniquement Premium
    case "SESSION_LOGS":
      return plan === "PRO" || plan === "PREMIUM"; // Logs de session Pro+
    case "ADVANCED_ANALYTICS":
      return plan === "PREMIUM"; // Analytics avancées Premium
    case "CERTIFICATES":
      return plan === "PRO" || plan === "PREMIUM"; // Certificats Pro+
    case "MULTI_DEVICE":
      return plan === "PREMIUM"; // Multi-appareils Premium
    case "SUPPORT_PRIORITY":
      return plan === "PREMIUM"; // Support prioritaire Premium
    default:
      return false;
  }
}

/**
 * Obtient les fonctionnalités disponibles pour un plan v2
 */
export function getAvailableFeaturesV2(plan: PlanV2): string[] {
  const features: string[] = [];
  
  if (isFeatureEnabledV2(plan, "COMMUNITY")) features.push("COMMUNITY");
  if (isFeatureEnabledV2(plan, "STATS_DETAILED")) features.push("STATS_DETAILED");
  if (isFeatureEnabledV2(plan, "LLM_COACH")) features.push("LLM_COACH");
  if (isFeatureEnabledV2(plan, "EXPORTS")) features.push("EXPORTS");
  if (isFeatureEnabledV2(plan, "SESSION_LOGS")) features.push("SESSION_LOGS");
  if (isFeatureEnabledV2(plan, "ADVANCED_ANALYTICS")) features.push("ADVANCED_ANALYTICS");
  if (isFeatureEnabledV2(plan, "CERTIFICATES")) features.push("CERTIFICATES");
  if (isFeatureEnabledV2(plan, "MULTI_DEVICE")) features.push("MULTI_DEVICE");
  if (isFeatureEnabledV2(plan, "SUPPORT_PRIORITY")) features.push("SUPPORT_PRIORITY");
  
  return features;
}

/**
 * Obtient les limites du plan v2
 */
export function getPlanLimitsV2(plan: PlanV2) {
  return {
    maxChildren: seatsForPlanV2(plan),
    features: getAvailableFeaturesV2(plan),
    price: getPlanPrice(plan),
    freeDays: plan === "STARTER" ? 90 : 0 // Starter gratuit pendant 3 mois
  };
}

/**
 * Obtient le prix du plan en centimes
 */
export function getPlanPrice(plan: PlanV2): number {
  switch (plan) {
    case "STARTER": return 0;      // Gratuit pendant 3 mois
    case "PRO": return 2999;       // 29,99€
    case "PREMIUM": return 6999;   // 69,99€
    case "ANTI_CHURN": return 1499; // 14,99€
  }
}

/**
 * Vérifie si un plan peut créer de nouveaux enfants
 */
export function canCreateChildV2(plan: PlanV2, currentChildCount: number): boolean {
  const limit = seatsForPlanV2(plan);
  return currentChildCount < limit;
}

/**
 * Détermine le plan de conversion après la période gratuite
 */
export function getDefaultPlanAfterFreePeriod(): PlanV2 {
  return "STARTER"; // Par défaut, conversion vers Starter payant
}

/**
 * Vérifie si un plan est en période gratuite
 */
export function isFreePlan(plan: PlanV2): boolean {
  return plan === "STARTER"; // Starter commence gratuit
}

/**
 * Vérifie si un plan est premium
 */
export function isPremiumPlan(plan: PlanV2): boolean {
  return plan === "PREMIUM";
}
