// RBAC centralisé - Source de vérité unique pour les rôles et permissions
// Gestion des accès basée sur les rôles et les comptes

export type Role = "PARENT_ADMIN" | "CHILD_MEMBER";

export interface AuthContext {
  role: Role;
  accountId: string;
  memberId: string;
  plan: string;
}

/**
 * Vérifie si un utilisateur peut lire les informations d'un membre
 */
export function canReadAccountMember(
  viewer: AuthContext, 
  target: { accountId: string; memberId: string }
): boolean {
  // Un parent admin peut lire tous les membres de son compte
  if (viewer.role === "PARENT_ADMIN" && viewer.accountId === target.accountId) {
    return true;
  }
  
  // Un enfant peut lire ses propres informations
  if (viewer.role === "CHILD_MEMBER" && viewer.memberId === target.memberId) {
    return true;
  }
  
  return false;
}

/**
 * Vérifie si un utilisateur peut modifier un membre
 */
export function canModifyAccountMember(
  viewer: AuthContext, 
  target: { accountId: string; memberId: string }
): boolean {
  // Seuls les parents admin peuvent modifier les membres
  return viewer.role === "PARENT_ADMIN" && viewer.accountId === target.accountId;
}

/**
 * Vérifie si un utilisateur peut créer des membres
 */
export function canCreateAccountMember(viewer: AuthContext): boolean {
  return viewer.role === "PARENT_ADMIN";
}

/**
 * Vérifie si un utilisateur peut gérer les sessions
 */
export function canManageSessions(viewer: AuthContext): boolean {
  // Les parents peuvent voir toutes les sessions de leur compte
  // Les enfants peuvent voir leurs propres sessions
  return true;
}

/**
 * Vérifie si un utilisateur peut voir les statistiques détaillées
 */
export function canViewDetailedStats(viewer: AuthContext): boolean {
  // Seuls les parents admin peuvent voir les stats détaillées
  return viewer.role === "PARENT_ADMIN";
}

/**
 * Vérifie si un utilisateur peut accéder au LLM Coach
 */
export function canAccessLLMCoach(viewer: AuthContext): boolean {
  // Seuls les parents admin avec un plan PREMIUM peuvent accéder au LLM Coach
  return viewer.role === "PARENT_ADMIN" && viewer.plan === "PREMIUM";
}

/**
 * Vérifie si un utilisateur peut exporter des données
 */
export function canExportData(viewer: AuthContext): boolean {
  // Seuls les parents admin avec un plan PREMIUM peuvent exporter
  return viewer.role === "PARENT_ADMIN" && viewer.plan === "PREMIUM";
}

/**
 * Vérifie si un utilisateur peut accéder aux communautés
 */
export function canAccessCommunity(viewer: AuthContext): boolean {
  // Les enfants peuvent accéder aux communautés
  return viewer.role === "CHILD_MEMBER";
}

/**
 * Vérifie si un utilisateur peut gérer la facturation
 */
export function canManageBilling(viewer: AuthContext): boolean {
  // Seuls les parents admin peuvent gérer la facturation
  return viewer.role === "PARENT_ADMIN";
}

/**
 * Vérifie si un utilisateur peut voir les logs de session
 */
export function canViewSessionLogs(viewer: AuthContext): boolean {
  // Les parents peuvent voir tous les logs de leur compte
  // Les enfants peuvent voir leurs propres logs
  return true;
}

/**
 * Vérifie si un utilisateur peut accéder aux analytics avancés
 */
export function canAccessAdvancedAnalytics(viewer: AuthContext): boolean {
  // Seuls les parents admin avec un plan PRO_PLUS ou PREMIUM
  return viewer.role === "PARENT_ADMIN" && 
         (viewer.plan === "PRO_PLUS" || viewer.plan === "PREMIUM");
}

/**
 * Obtient les permissions disponibles pour un utilisateur
 */
export function getUserPermissions(viewer: AuthContext): string[] {
  const permissions: string[] = [];
  
  if (canCreateAccountMember(viewer)) permissions.push("CREATE_MEMBERS");
  if (canModifyAccountMember(viewer, { accountId: viewer.accountId, memberId: "" })) permissions.push("MODIFY_MEMBERS");
  if (canManageSessions(viewer)) permissions.push("MANAGE_SESSIONS");
  if (canViewDetailedStats(viewer)) permissions.push("VIEW_DETAILED_STATS");
  if (canAccessLLMCoach(viewer)) permissions.push("ACCESS_LLM_COACH");
  if (canExportData(viewer)) permissions.push("EXPORT_DATA");
  if (canAccessCommunity(viewer)) permissions.push("ACCESS_COMMUNITY");
  if (canManageBilling(viewer)) permissions.push("MANAGE_BILLING");
  if (canViewSessionLogs(viewer)) permissions.push("VIEW_SESSION_LOGS");
  if (canAccessAdvancedAnalytics(viewer)) permissions.push("ACCESS_ADVANCED_ANALYTICS");
  
  return permissions;
}

/**
 * Vérifie si un utilisateur a une permission spécifique
 */
export function hasPermission(viewer: AuthContext, permission: string): boolean {
  const permissions = getUserPermissions(viewer);
  return permissions.includes(permission);
}

/**
 * Assertion pour vérifier qu'un utilisateur est un parent admin
 */
export function assertParentAdmin(viewer: AuthContext): void {
  if (viewer.role !== "PARENT_ADMIN") {
    throw new Error("FORBIDDEN_PARENT_ADMIN_ONLY");
  }
}

/**
 * Assertion pour vérifier qu'un utilisateur est un enfant
 */
export function assertChildMember(viewer: AuthContext): void {
  if (viewer.role !== "CHILD_MEMBER") {
    throw new Error("FORBIDDEN_CHILD_MEMBER_ONLY");
  }
}

/**
 * Assertion pour vérifier qu'un utilisateur a un plan minimum
 */
export function assertMinimumPlan(viewer: AuthContext, minimumPlan: string): void {
  const planHierarchy = ["FREE", "PRO", "PRO_PLUS", "PREMIUM"];
  const viewerPlanIndex = planHierarchy.indexOf(viewer.plan);
  const minimumPlanIndex = planHierarchy.indexOf(minimumPlan);
  
  if (viewerPlanIndex < minimumPlanIndex) {
    throw new Error(`FORBIDDEN_PLAN_TOO_LOW: ${viewer.plan} < ${minimumPlan}`);
  }
}

