import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Interface pour l'utilisateur authentifié
export interface AuthenticatedUser {
  userId: string;
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

// Middleware d'authentification
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Récupération du token depuis les cookies
    const token = req.cookies?.authToken;

    if (!token) {
      return res.status(401).json({
        error: 'Token d\'authentification manquant',
        code: 'AUTH_TOKEN_MISSING'
      });
    }

    // Vérification du token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production') as any;

    // Vérification de la structure du token
    if (!decoded.userId || !decoded.accountId || !decoded.userType) {
      return res.status(401).json({
        error: 'Token d\'authentification invalide',
        code: 'AUTH_TOKEN_INVALID'
      });
    }

    // Ajout de l'utilisateur à la requête
    req.user = {
      userId: decoded.userId,
      accountId: decoded.accountId,
      userType: decoded.userType
    };

    next();

  } catch (error) {
    console.error('❌ Erreur d\'authentification:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: 'Token d\'authentification invalide',
        code: 'AUTH_TOKEN_INVALID'
      });
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Token d\'authentification expiré',
        code: 'AUTH_TOKEN_EXPIRED'
      });
    }

    res.status(500).json({
      error: 'Erreur lors de l\'authentification',
      code: 'AUTH_ERROR'
    });
  }
};

// Middleware optionnel d'authentification (ne bloque pas si pas de token)
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.authToken;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production') as any;
      
      if (decoded.userId && decoded.accountId && decoded.userType) {
        req.user = {
          userId: decoded.userId,
          accountId: decoded.accountId,
          userType: decoded.userType
        };
      }
    }

    next();

  } catch (error) {
    // En cas d'erreur, on continue sans authentification
    next();
  }
};

