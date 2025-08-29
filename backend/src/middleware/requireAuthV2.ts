// Middleware d'authentification v2
// Support des rôles, plans et comptes membres
// Minimal-diff: extension du système existant

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthContext, Role } from "../domain/auth/rbac";

// Extension de l'interface Request pour inclure l'auth v2
declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

/**
 * Middleware principal d'authentification v2
 * Vérifie le JWT et injecte le contexte d'authentification
 */
export function requireAuthV2(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        error: "MISSING_AUTHORIZATION_HEADER",
        message: "En-tête d'autorisation manquant" 
      });
    }
    
    const token = authHeader.replace(/^Bearer\s+/i, "");
    
    if (!token) {
      return res.status(401).json({ 
        error: "INVALID_TOKEN_FORMAT",
        message: "Format de token invalide" 
      });
    }
    
    try {
      // Vérification du JWT
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      // Validation du payload
      if (!isValidAuthPayload(payload)) {
        return res.status(401).json({ 
          error: "INVALID_TOKEN_PAYLOAD",
          message: "Payload du token invalide" 
        });
      }
      
      // Injection du contexte d'authentification
      req.auth = {
        role: payload.role,
        accountId: payload.accountId,
        memberId: payload.memberId,
        plan: payload.plan
      };
      
      // Log de debug (niveau debug uniquement)
      console.log(`🔐 Auth V2: ${payload.role} - Account: ${payload.accountId} - Member: ${payload.memberId} - Plan: ${payload.plan}`);
      
      next();
      
    } catch (jwtError) {
      console.error('❌ Erreur JWT:', jwtError);
      return res.status(401).json({ 
        error: "INVALID_TOKEN",
        message: "Token invalide ou expiré" 
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur middleware auth v2:', error);
    return res.status(500).json({ 
      error: "AUTH_MIDDLEWARE_ERROR",
      message: "Erreur interne du middleware d'authentification" 
    });
  }
}

/**
 * Middleware pour vérifier un rôle spécifique
 */
export function requireRole(role: Role) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const auth = req.auth;
    
    if (!auth) {
      return res.status(401).json({ 
        error: "NOT_AUTHENTICATED",
        message: "Utilisateur non authentifié" 
      });
    }
    
    if (auth.role !== role) {
      return res.status(403).json({ 
        error: "INSUFFICIENT_PERMISSIONS",
        message: `Rôle requis: ${role}, rôle actuel: ${auth.role}` 
      });
    }
    
    next();
  };
}

/**
 * Middleware pour vérifier un plan minimum
 */
export function requireMinimumPlan(minimumPlan: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const auth = req.auth;
    
    if (!auth) {
      return res.status(401).json({ 
        error: "NOT_AUTHENTICATED",
        message: "Utilisateur non authentifié" 
      });
    }
    
    const planHierarchy = ["FREE", "PRO", "PRO_PLUS", "PREMIUM"];
    const userPlanIndex = planHierarchy.indexOf(auth.plan);
    const minimumPlanIndex = planHierarchy.indexOf(minimumPlan);
    
    if (userPlanIndex < minimumPlanIndex) {
      return res.status(403).json({ 
        error: "INSUFFICIENT_PLAN",
        message: `Plan requis: ${minimumPlan} ou supérieur, plan actuel: ${auth.plan}` 
      });
    }
    
    next();
  };
}

/**
 * Middleware pour vérifier l'accès à un compte spécifique
 */
export function requireAccountAccess(req: Request, res: Response, next: NextFunction): void {
  const auth = req.auth;
  const targetAccountId = req.params.accountId || req.body.accountId;
  
  if (!auth) {
    return res.status(401).json({ 
      error: "NOT_AUTHENTICATED",
      message: "Utilisateur non authentifié" 
    });
  }
  
  if (!targetAccountId) {
    return res.status(400).json({ 
      error: "MISSING_ACCOUNT_ID",
      message: "ID du compte manquant" 
    });
  }
  
  // Un parent admin peut accéder à son propre compte
  // Un enfant peut accéder à son propre compte
  if (auth.accountId !== targetAccountId) {
    return res.status(403).json({ 
      error: "FORBIDDEN_ACCOUNT_ACCESS",
      message: "Accès au compte non autorisé" 
    });
  }
  
  next();
}

/**
 * Middleware pour vérifier l'accès à un membre spécifique
 */
export function requireMemberAccess(req: Request, res: Response, next: NextFunction): void {
  const auth = req.auth;
  const targetMemberId = req.params.memberId || req.body.memberId;
  
  if (!auth) {
    return res.status(401).json({ 
      error: "NOT_AUTHENTICATED",
      message: "Utilisateur non authentifié" 
    });
  }
  
  if (!targetMemberId) {
    return res.status(400).json({ 
      error: "MISSING_MEMBER_ID",
      message: "ID du membre manquant" 
    });
  }
  
  // Un parent admin peut accéder aux membres de son compte
  if (auth.role === "PARENT_ADMIN") {
    // L'accès au compte est déjà vérifié par requireAccountAccess
    next();
    return;
  }
  
  // Un enfant peut accéder à ses propres informations
  if (auth.role === "CHILD_MEMBER" && auth.memberId === targetMemberId) {
    next();
    return;
  }
  
  return res.status(403).json({ 
    error: "FORBIDDEN_MEMBER_ACCESS",
    message: "Accès au membre non autorisé" 
  });
}

/**
 * Middleware pour vérifier une permission spécifique
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const auth = req.auth;
    
    if (!auth) {
      return res.status(401).json({ 
        error: "NOT_AUTHENTICATED",
        message: "Utilisateur non authentifié" 
      });
    }
    
    // Import dynamique pour éviter les dépendances circulaires
    const { hasPermission } = require("../domain/auth/rbac");
    
    if (!hasPermission(auth, permission)) {
      return res.status(403).json({ 
        error: "INSUFFICIENT_PERMISSIONS",
        message: `Permission requise: ${permission}` 
      });
    }
    
    next();
  };
}

/**
 * Validation du payload d'authentification
 */
function isValidAuthPayload(payload: any): payload is AuthContext {
  return (
    payload &&
    typeof payload.role === "string" &&
    ["PARENT_ADMIN", "CHILD_MEMBER"].includes(payload.role) &&
    typeof payload.accountId === "string" &&
    typeof payload.memberId === "string" &&
    typeof payload.plan === "string" &&
    ["FREE", "PRO", "PRO_PLUS", "PREMIUM"].includes(payload.plan)
  );
}

/**
 * Middleware de compatibilité avec l'ancien système
 * Permet la transition progressive
 */
export function requireAuthLegacy(req: Request, res: Response, next: NextFunction): void {
  // Essayer d'abord l'auth v2
  requireAuthV2(req, res, (err) => {
    if (err) {
      // Fallback vers l'ancien système si disponible
      console.log('🔄 Fallback vers l\'ancien système d\'auth...');
      // Ici on pourrait appeler l'ancien middleware
      // Pour l'instant, on échoue
      return res.status(401).json({ 
        error: "AUTH_REQUIRED",
        message: "Authentification requise" 
      });
    }
    next();
  });
}

// Export des types pour utilisation externe
export type { AuthContext, Role };

