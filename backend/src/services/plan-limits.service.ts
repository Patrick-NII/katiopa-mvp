// Nouveau système de plans CubeAI v3
// Plans : FREE, DECOUVERTE, EXPLORATEUR, MAITRE, ENTERPRISE

export type SubscriptionPlan = "FREE" | "DECOUVERTE" | "EXPLORATEUR" | "MAITRE" | "ENTERPRISE";

export interface PlanLimits {
  maxChildren: number;
  maxMessages: number | "UNLIMITED";
  maxAnalyses: number | "UNLIMITED";
  maxCubeMatchGames: number | "UNLIMITED";
  availableTabs: string[];
  aiModel: string;
  maxTokens: number | "UNLIMITED";
  supportChannels: string[];
  storageDays: number | "UNLIMITED";
  exportFormats: string[];
  features: string[];
}

/**
 * Détermine le nombre maximum d'enfants autorisés par plan
 */
export function getMaxChildrenForPlan(plan: SubscriptionPlan): number {
  switch (plan) {
    case "FREE": return 1;
    case "DECOUVERTE": return 1;
    case "EXPLORATEUR": return 2;
    case "MAITRE": return 4;
    case "ENTERPRISE": return 999; // Illimité pour Enterprise
    default: return 1;
  }
}

/**
 * Détermine le nombre maximum de messages Bubix par mois
 */
export function getMaxMessagesForPlan(plan: SubscriptionPlan): number | "UNLIMITED" {
  switch (plan) {
    case "FREE": return 50;
    case "DECOUVERTE": return 200;
    case "EXPLORATEUR": return "UNLIMITED";
    case "MAITRE": return "UNLIMITED";
    case "ENTERPRISE": return "UNLIMITED";
    default: return 50;
  }
}

/**
 * Détermine le nombre maximum d'analyses par semaine
 */
export function getMaxAnalysesForPlan(plan: SubscriptionPlan): number | "UNLIMITED" {
  switch (plan) {
    case "FREE": return 3;
    case "DECOUVERTE": return 1;
    case "EXPLORATEUR": return "UNLIMITED";
    case "MAITRE": return "UNLIMITED";
    case "ENTERPRISE": return "UNLIMITED";
    default: return 3;
  }
}

/**
 * Détermine le nombre maximum de parties CubeMatch par mois
 */
export function getMaxCubeMatchGamesForPlan(plan: SubscriptionPlan): number | "UNLIMITED" {
  switch (plan) {
    case "FREE": return 10;
    case "DECOUVERTE": return 50;
    case "EXPLORATEUR": return "UNLIMITED";
    case "MAITRE": return "UNLIMITED";
    case "ENTERPRISE": return "UNLIMITED";
    default: return 10;
  }
}

/**
 * Détermine les onglets disponibles selon le plan
 */
export function getAvailableTabsForPlan(plan: SubscriptionPlan): string[] {
  switch (plan) {
    case "FREE":
      return ["dashboard", "chat"];
    case "DECOUVERTE":
      return ["dashboard", "chat", "mathcube", "experiences"];
    case "EXPLORATEUR":
      return ["dashboard", "chat", "mathcube", "codecube", "playcube", "sciencecube", "dreamcube", "experiences", "statistiques", "profil", "abonnements"];
    case "MAITRE":
      return ["dashboard", "chat", "mathcube", "codecube", "playcube", "sciencecube", "dreamcube", "experiences", "statistiques", "profil", "abonnements", "comcube"];
    case "ENTERPRISE":
      return ["dashboard", "chat", "mathcube", "codecube", "playcube", "sciencecube", "dreamcube", "experiences", "statistiques", "profil", "abonnements", "comcube", "analytics"];
    default:
      return ["dashboard", "chat"];
  }
}

/**
 * Détermine le modèle IA selon le plan
 */
export function getAIModelForPlan(plan: SubscriptionPlan): string {
  switch (plan) {
    case "FREE": return "local"; // Modèle local uniquement
    case "DECOUVERTE": return "gpt-3.5-turbo"; // GPT-3 limité
    case "EXPLORATEUR": return "gpt-4o-mini"; // GPT-4o-mini custom
    case "MAITRE": return "gpt-4o"; // GPT-4o premium adaptatif
    case "ENTERPRISE": return "gpt-4o"; // GPT-4o + modèles personnalisés
    default: return "local";
  }
}

/**
 * Détermine le nombre maximum de tokens par mois
 */
export function getMaxTokensForPlan(plan: SubscriptionPlan): number | "UNLIMITED" {
  switch (plan) {
    case "FREE": return 0;
    case "DECOUVERTE": return 500;
    case "EXPLORATEUR": return 1000;
    case "MAITRE": return 2000;
    case "ENTERPRISE": return "UNLIMITED";
    default: return 0;
  }
}

/**
 * Détermine les canaux de support disponibles
 */
export function getSupportChannelsForPlan(plan: SubscriptionPlan): string[] {
  switch (plan) {
    case "FREE": return ["email"];
    case "DECOUVERTE": return ["email"];
    case "EXPLORATEUR": return ["email", "chat", "telephone"];
    case "MAITRE": return ["email", "chat", "telephone", "whatsapp"];
    case "ENTERPRISE": return ["email", "chat", "telephone", "whatsapp", "dedicated"];
    default: return ["email"];
  }
}

/**
 * Détermine la durée de stockage des données
 */
export function getStorageDaysForPlan(plan: SubscriptionPlan): number | "UNLIMITED" {
  switch (plan) {
    case "FREE": return 30;
    case "DECOUVERTE": return 90;
    case "EXPLORATEUR": return "UNLIMITED";
    case "MAITRE": return "UNLIMITED";
    case "ENTERPRISE": return "UNLIMITED";
    default: return 30;
  }
}

/**
 * Détermine les formats d'export disponibles
 */
export function getExportFormatsForPlan(plan: SubscriptionPlan): string[] {
  switch (plan) {
    case "FREE": return [];
    case "DECOUVERTE": return [];
    case "EXPLORATEUR": return ["pdf", "excel"];
    case "MAITRE": return ["pdf", "excel", "csv"];
    case "ENTERPRISE": return ["pdf", "excel", "csv", "json", "custom"];
    default: return [];
  }
}

/**
 * Détermine les fonctionnalités disponibles selon le plan
 */
export function getFeaturesForPlan(plan: SubscriptionPlan): string[] {
  const baseFeatures = ["basic_chat", "basic_dashboard"];
  
  switch (plan) {
    case "FREE":
      return [...baseFeatures];
    case "DECOUVERTE":
      return [...baseFeatures, "mathcube", "experiences_lite", "basic_analysis"];
    case "EXPLORATEUR":
      return [...baseFeatures, "mathcube", "codecube", "playcube", "sciencecube", "dreamcube", "experiences_full", "detailed_analysis", "export", "certificates", "comcube"];
    case "MAITRE":
      return [...baseFeatures, "mathcube", "codecube", "playcube", "sciencecube", "dreamcube", "experiences_full", "predictive_analysis", "export", "certificates", "comcube", "exclusive_content", "vip_support"];
    case "ENTERPRISE":
      return [...baseFeatures, "mathcube", "codecube", "playcube", "sciencecube", "dreamcube", "experiences_full", "predictive_analysis", "export", "certificates", "comcube", "exclusive_content", "vip_support", "analytics", "multi_user", "api_access"];
    default:
      return baseFeatures;
  }
}

/**
 * Obtient toutes les limites d'un plan
 */
export function getPlanLimits(plan: SubscriptionPlan): PlanLimits {
  return {
    maxChildren: getMaxChildrenForPlan(plan),
    maxMessages: getMaxMessagesForPlan(plan),
    maxAnalyses: getMaxAnalysesForPlan(plan),
    maxCubeMatchGames: getMaxCubeMatchGamesForPlan(plan),
    availableTabs: getAvailableTabsForPlan(plan),
    aiModel: getAIModelForPlan(plan),
    maxTokens: getMaxTokensForPlan(plan),
    supportChannels: getSupportChannelsForPlan(plan),
    storageDays: getStorageDaysForPlan(plan),
    exportFormats: getExportFormatsForPlan(plan),
    features: getFeaturesForPlan(plan)
  };
}

/**
 * Vérifie si une fonctionnalité est disponible pour un plan
 */
export function isFeatureAvailable(plan: SubscriptionPlan, feature: string): boolean {
  const features = getFeaturesForPlan(plan);
  return features.includes(feature);
}

/**
 * Vérifie si un onglet est accessible pour un plan
 */
export function isTabAccessible(plan: SubscriptionPlan, tab: string): boolean {
  const tabs = getAvailableTabsForPlan(plan);
  return tabs.includes(tab);
}

/**
 * Vérifie si l'IA est activée pour un plan
 */
export function isAIEnabled(plan: SubscriptionPlan): boolean {
  return plan !== "FREE";
}

/**
 * Obtient le niveau de puissance de Bubix selon le plan
 */
export function getBubixPowerLevel(plan: SubscriptionPlan): "basic" | "advanced" | "premium" | "enterprise" {
  switch (plan) {
    case "FREE": return "basic";
    case "DECOUVERTE": return "basic";
    case "EXPLORATEUR": return "advanced";
    case "MAITRE": return "premium";
    case "ENTERPRISE": return "enterprise";
    default: return "basic";
  }
}

/**
 * Obtient le prix mensuel d'un plan
 */
export function getPlanPrice(plan: SubscriptionPlan): number {
  switch (plan) {
    case "FREE": return 0;
    case "DECOUVERTE": return 4.99;
    case "EXPLORATEUR": return 29.99;
    case "MAITRE": return 59.99;
    case "ENTERPRISE": return 99;
    default: return 0;
  }
}

/**
 * Obtient le nom commercial d'un plan
 */
export function getPlanDisplayName(plan: SubscriptionPlan): string {
  switch (plan) {
    case "FREE": return "Gratuit";
    case "DECOUVERTE": return "Découverte";
    case "EXPLORATEUR": return "Explorateur";
    case "MAITRE": return "Maître";
    case "ENTERPRISE": return "Enterprise";
    default: return "Gratuit";
  }
}

/**
 * Obtient la description d'un plan
 */
export function getPlanDescription(plan: SubscriptionPlan): string {
  switch (plan) {
    case "FREE": return "Le premier pas vers l'aventure";
    case "DECOUVERTE": return "Le premier pas vers l'aventure";
    case "EXPLORATEUR": return "L'univers complet CubeAI";
    case "MAITRE": return "L'excellence éducative pour les familles ambitieuses";
    case "ENTERPRISE": return "Solution complète pour les institutions";
    default: return "Le premier pas vers l'aventure";
  }
}

/**
 * Vérifie si un plan peut être upgradé vers un autre
 */
export function canUpgrade(fromPlan: SubscriptionPlan, toPlan: SubscriptionPlan): boolean {
  const planHierarchy = ["FREE", "DECOUVERTE", "EXPLORATEUR", "MAITRE", "ENTERPRISE"];
  const fromIndex = planHierarchy.indexOf(fromPlan);
  const toIndex = planHierarchy.indexOf(toPlan);
  
  return toIndex > fromIndex;
}

/**
 * Obtient les plans disponibles pour upgrade
 */
export function getAvailableUpgrades(currentPlan: SubscriptionPlan): SubscriptionPlan[] {
  const allPlans: SubscriptionPlan[] = ["FREE", "DECOUVERTE", "EXPLORATEUR", "MAITRE", "ENTERPRISE"];
  return allPlans.filter(plan => canUpgrade(currentPlan, plan));
}
