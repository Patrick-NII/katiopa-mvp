import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Interface pour l'utilisateur authentifié
export interface AuthenticatedUser {
  id: string;
  userId: string; // Alias pour compatibilité
  sessionId: string;
  accountId: string;
  userType: string;
}

// Extension de l'interface Request pour inclure l'utilisateur
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // PRIORITÉ 1: Cookie HttpOnly sécurisé
    let token = req.cookies?.katiopa_at;
    
    // FALLBACK temporaire: Authorization header (à supprimer après migration complète)
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      console.warn('⚠️ Utilisation du header Authorization (déprécié)');
      token = req.headers.authorization.substring(7);
    }
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Authentification requise',
        code: 'AUTH_REQUIRED'
      });
    }
    
    // Vérification JWT avec secret fort
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Vérification en base (révocation possible)
    const userSession = await prisma.userSession.findUnique({
      where: { id: decoded.userId },
      include: { account: true }
    });
    
    if (!userSession) {
      return res.status(401).json({ 
        error: 'Session invalide',
        code: 'SESSION_INVALID'
      });
    }
    
    // Vérification que la session n'est pas expirée (optionnel)
    // if (userSession.expiresAt && new Date() > userSession.expiresAt) {
    //   return res.status(401).json({ 
    //     error: 'Session expirée',
    //     code: 'SESSION_EXPIRED'
    //   });
    // }
    
    // Log de l'accès authentifié
    console.info('🔐 Accès authentifié:', {
      userId: userSession.id,
      sessionId: userSession.sessionId,
      userType: userSession.userType,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    req.user = {
      id: userSession.id,
      userId: userSession.id, // Alias pour compatibilité
      sessionId: userSession.sessionId,
      accountId: userSession.accountId,
      userType: userSession.userType || 'PARENT'
    };
    
    next();
  } catch (error) {
    console.error('❌ Erreur d\'authentification:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        error: 'Token invalide',
        code: 'TOKEN_INVALID'
      });
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        error: 'Token expiré',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    res.status(500).json({ 
      error: 'Erreur d\'authentification',
      code: 'AUTH_ERROR'
    });
  }
};

// Middleware pour vérifier les rôles
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentification requise' });
    }
    
    if (!allowedRoles.includes(req.user.userType)) {
      console.warn('🚫 Tentative d\'accès non autorisé:', {
        userId: req.user.id,
        userType: req.user.userType,
        allowedRoles,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      
      return res.status(403).json({ 
        error: 'Accès non autorisé',
        code: 'ACCESS_DENIED'
      });
    }
    
    next();
  };
};

// Middleware pour les comptes premium uniquement
export const requirePremium = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentification requise' });
  }
  
  // Vérification du plan d'abonnement
  // TODO: Implémenter la vérification du plan
  next();
};